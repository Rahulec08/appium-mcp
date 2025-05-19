import {
  remote,
  RemoteOptions,
  Browser,
  Element,
  ElementArray,
  TouchAction,
} from "webdriverio";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Custom error class for Appium operations
 */
export class AppiumError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "AppiumError";
  }
}

/**
 * Appium capabilities for different platforms
 */
export interface AppiumCapabilities {
  platformName: "Android" | "iOS";
  deviceName: string;
  udid?: string;
  automationName?: "UiAutomator2" | "XCUITest";
  app?: string;
  appPackage?: string;
  appActivity?: string;
  bundleId?: string;
  noReset?: boolean;
  fullReset?: boolean;
  [key: string]: any;
}

/**
 * Helper class for Appium operations
 */
export class AppiumHelper {
  private driver: Browser | null = null;
  private screenshotDir: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000;
  private lastCapabilities: AppiumCapabilities | null = null;
  private lastAppiumUrl: string | null = null;

  /**
   * Create a new AppiumHelper instance
   *
   * @param screenshotDir Directory to save screenshots to
   */
  constructor(screenshotDir: string = "./screenshots") {
    this.screenshotDir = screenshotDir;
  }

  /**
   * Initialize the Appium driver with provided capabilities
   *
   * @param capabilities Appium capabilities
   * @param appiumUrl Appium server URL
   * @returns Reference to the initialized driver
   */
  async initializeDriver(
    capabilities: AppiumCapabilities,
    appiumUrl: string = "http://localhost:4723"
  ): Promise<Browser> {
    try {
      // Source .bash_profile to ensure all environment variables are loaded
      try {
        // Only run this on Unix-like systems (macOS, Linux)
        if (process.platform !== "win32") {
          const { execSync } = require("child_process");
          execSync("source ~/.bash_profile 2>/dev/null || true", {
            shell: "/bin/bash",
          });
          console.log("Sourced .bash_profile for environment setup");
        }
      } catch (envError) {
        console.warn(
          "Could not source .bash_profile, continuing anyway:",
          envError instanceof Error ? envError.message : String(envError)
        );
      }

      // Store the capabilities and URL for potential session recovery
      this.lastCapabilities = { ...capabilities };
      this.lastAppiumUrl = appiumUrl;

      // Add 'appium:' prefix to all non-standard capabilities
      const formattedCapabilities: Record<string, any> = {};
      for (const [key, value] of Object.entries(capabilities)) {
        // platformName doesn't need a prefix, everything else does
        if (key === "platformName") {
          formattedCapabilities[key] = value;
        } else {
          formattedCapabilities[`appium:${key}`] = value;
        }
      }

      const options: RemoteOptions = {
        hostname: new URL(appiumUrl).hostname,
        port: parseInt(new URL(appiumUrl).port),
        path: "/wd/hub",
        connectionRetryCount: 3,
        logLevel: "error",
        capabilities: formattedCapabilities,
      };

      this.driver = await remote(options);
      return this.driver;
    } catch (error) {
      throw new AppiumError(
        `Failed to initialize Appium driver: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if the session is still valid and attempt to recover if not
   *
   * @returns true if session is valid or was successfully recovered
   */
  async validateSession(): Promise<boolean> {
    if (!this.driver) {
      return false;
    }

    try {
      // Simple check to see if session is still valid
      await this.driver.getPageSource();
      return true;
    } catch (error) {
      // Check if the error is a NoSuchDriverError or session terminated error
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("NoSuchDriverError") ||
        errorMessage.includes("terminated") ||
        errorMessage.includes("not started")
      ) {
        console.log("Appium session terminated, attempting to recover...");

        // Try to recover the session if we have the last capabilities
        if (this.lastCapabilities && this.lastAppiumUrl) {
          try {
            // Close the existing driver first to clean up
            try {
              await this.driver.deleteSession();
            } catch {
              // Ignore errors when trying to delete an already terminated session
            }

            this.driver = null;

            // Re-initialize with the stored capabilities
            await this.initializeDriver(
              this.lastCapabilities,
              this.lastAppiumUrl
            );
            console.log("Session recovery successful");
            return true;
          } catch (recoveryError) {
            console.error(
              "Session recovery failed:",
              recoveryError instanceof Error
                ? recoveryError.message
                : String(recoveryError)
            );
            return false;
          }
        }
      }
      return false;
    }
  }

  /**
   * Safely execute an Appium command with session validation
   *
   * @param operation Function that performs the Appium operation
   * @param errorMessage Error message to throw if operation fails
   * @returns Result of the operation
   */
  async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Try to recover the session if it's terminated
      if (await this.validateSession()) {
        // If session recovery was successful, try the operation again
        try {
          return await operation();
        } catch (retryError) {
          throw new AppiumError(
            `${errorMessage}: ${
              retryError instanceof Error
                ? retryError.message
                : String(retryError)
            }`,
            retryError instanceof Error ? retryError : undefined
          );
        }
      }

      throw new AppiumError(
        `${errorMessage}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the current driver instance
   *
   * @returns The driver instance or throws if not initialized
   */
  getDriver(): Browser {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }
    return this.driver;
  }

  /**
   * Close the Appium session
   */
  async closeDriver(): Promise<void> {
    if (this.driver) {
      try {
        await this.driver.deleteSession();
      } catch (error) {
        console.warn(
          "Error while closing Appium session:",
          error instanceof Error ? error.message : String(error)
        );
        // We don't rethrow here as we want to clean up regardless of errors
      } finally {
        this.driver = null;
      }
    }
  }

  /**
   * Take a screenshot and save it to the specified directory
   *
   * @param name Screenshot name
   * @returns Path to the saved screenshot
   */
  async takeScreenshot(name: string): Promise<string> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${name}_${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      const screenshot = await this.driver.takeScreenshot();
      await fs.writeFile(filepath, Buffer.from(screenshot, "base64"));

      return filepath;
    } catch (error) {
      throw new AppiumError(
        `Failed to take screenshot: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if an element exists
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns true if the element exists
   */
  async elementExists(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    try {
      await this.findElement(selector, strategy);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find an element by its selector with retry mechanism
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @param timeoutMs Timeout in milliseconds
   * @returns WebdriverIO element if found
   */
  async findElement(
    selector: string,
    strategy: string = "xpath",
    timeoutMs: number = 10000
  ): Promise<Element> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    return this.safeExecute(async () => {
      const startTime = Date.now();
      let lastError: Error | undefined;

      while (Date.now() - startTime < timeoutMs) {
        try {
          let element: Element;

          switch (strategy.toLowerCase()) {
            case "id":
              element = await this.driver!.$(`id=${selector}`);
              break;
            case "xpath":
              element = await this.driver!.$(`${selector}`);
              break;
            case "accessibility id":
              element = await this.driver!.$(`~${selector}`);
              break;
            case "class name":
              element = await this.driver!.$(`${selector}`);
              break;
            default:
              element = await this.driver!.$(`${selector}`);
          }

          await element.waitForExist({ timeout: timeoutMs });
          return element;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }

      throw new AppiumError(
        `Failed to find element with selector ${selector} after ${timeoutMs}ms: ${lastError?.message}`,
        lastError
      );
    }, `Failed to find element with selector ${selector}`);
  }

  /**
   * Find multiple elements by selector
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns Array of WebdriverIO elements
   */
  async findElements(
    selector: string,
    strategy: string = "xpath"
  ): Promise<ElementArray> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      let elements: ElementArray;

      switch (strategy.toLowerCase()) {
        case "id":
          elements = await this.driver.$$(`id=${selector}`);
          break;
        case "xpath":
          elements = await this.driver.$$(`${selector}`);
          break;
        case "accessibility id":
          elements = await this.driver.$$(`~${selector}`);
          break;
        case "class name":
          elements = await this.driver.$$(`${selector}`);
          break;
        default:
          elements = await this.driver.$$(`${selector}`);
      }

      return elements;
    } catch (error) {
      throw new AppiumError(
        `Failed to find elements with selector ${selector}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Tap on an element with retry mechanism
   * Uses W3C Actions API with fallback to TouchAction API for compatibility
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns true if successful
   * @throws AppiumError if the operation fails after retries
   */
  async tapElement(
    selector: string,
    strategy: string = "accessibility"
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    return this.safeExecute(async () => {
      let lastError: Error | undefined;
      console.log(`Attempting to tap element with ${strategy}: ${selector}`);

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          let element: Element;
          console.log(`Attempt ${attempt}/${this.maxRetries}`);

          // Handle different selector strategies
          switch (strategy.toLowerCase()) {
            case "accessibility id":
              console.log(`Using accessibility ID strategy: ~${selector}`);
              element = await this.driver!.$(`~${selector}`);
              break;
            case "id":
            case "resource id":
              console.log(`Using ID strategy: id=${selector}`);
              element = await this.driver!.$(`id=${selector}`);
              break;
            case "android uiautomator":
            case "uiautomator":
              console.log(
                `Using Android UiAutomator strategy: android=${selector}`
              );
              element = await this.driver!.$(`android=${selector}`);
              break;
            case "xpath":
              console.log(`Using XPath strategy: ${selector}`);
              element = await this.driver!.$(`${selector}`);
              break;
            default:
              console.log(`Using default strategy: ${selector}`);
              element = await this.driver!.$(`${selector}`);
          }

          // Make sure element is visible - we avoid waitForClickable since it's not supported in mobile native environments
          console.log("Waiting for element to be visible...");
          await element.waitForDisplayed({ timeout: 5000 });

          try {
            // Some elements don't support enabled state, so we'll try but not fail if not supported
            await element.waitForEnabled({ timeout: 2000 });
          } catch (enabledError) {
            console.log(
              "Note: Element doesn't support enabled state check, continuing anyway"
            );
          }

          // Add a small pause to ensure element is fully loaded
          await new Promise((resolve) => setTimeout(resolve, 300));

          // First try using standard element click() method
          try {
            console.log("Attempting standard click");
            await element.click();
          } catch (clickError) {
            console.log(
              `Standard click failed: ${
                clickError instanceof Error
                  ? clickError.message
                  : String(clickError)
              }`
            );

            // Get element location and size for tap coordinates
            const location = await element.getLocation();
            const size = await element.getSize();
            const centerX = location.x + size.width / 2;
            const centerY = location.y + size.height / 2;

            try {
              // Try W3C Actions API first (modern approach)
              console.log("Attempting W3C Actions API tap");
              const actions = [
                {
                  type: "pointer",
                  id: "finger1",
                  parameters: { pointerType: "touch" },
                  actions: [
                    // Move to element center
                    {
                      type: "pointerMove",
                      duration: 0,
                      x: centerX,
                      y: centerY,
                    },
                    // Press down
                    { type: "pointerDown", button: 0 },
                    // Short wait
                    { type: "pause", duration: 100 },
                    // Release
                    { type: "pointerUp", button: 0 },
                  ],
                },
              ];

              await this.driver!.performActions(actions);
            } catch (w3cError) {
              // If W3C Actions fail, fall back to TouchAction API
              console.log(
                "W3C Actions failed, falling back to TouchAction API"
              );
              await this.driver!.touchAction([
                {
                  action: "tap",
                  x: centerX,
                  y: centerY,
                },
              ]);
            }
          }

          // Small pause after click to let UI update
          await new Promise((resolve) => setTimeout(resolve, 500));
          console.log("Tap action completed successfully");
          return true;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.log(`Tap attempt ${attempt} failed: ${lastError.message}`);
          if (attempt < this.maxRetries) {
            const pauseTime = this.retryDelay * attempt; // Gradually increase wait time
            console.log(`Will retry in ${pauseTime}ms`);
            await new Promise((resolve) => setTimeout(resolve, pauseTime));
          }
        }
      }

      throw new AppiumError(
        `Failed to tap element with selector ${selector} using strategy ${strategy} after ${this.maxRetries} attempts: ${lastError?.message}`,
        lastError
      );
    }, `Failed to tap element with selector ${selector} using strategy ${strategy}`);
  }

  /**
   * Click on an element - alias for tapElement for better Selenium compatibility
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns true if successful
   * @throws AppiumError if the operation fails after retries
   */
  async click(selector: string, strategy: string = "xpath"): Promise<boolean> {
    return this.tapElement(selector, strategy);
  }

  /**
   * Send keys to an element with retry mechanism
   *
   * @param selector Element selector
   * @param text Text to send
   * @param strategy Selection strategy
   * @returns true if successful
   * @throws AppiumError if the operation fails after retries
   */
  async sendKeys(
    selector: string,
    text: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const element = await this.findElement(selector, strategy);
        await element.waitForEnabled({ timeout: 5000 });
        await element.setValue(text);
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw new AppiumError(
      `Failed to send keys to element with selector ${selector} after ${this.maxRetries} attempts: ${lastError?.message}`,
      lastError
    );
  }

  /**
   * Get the page source (XML representation of the current UI)
   *
   * @param refreshFirst Whether to try refreshing the UI before getting page source
   * @param suppressErrors Whether to suppress specific iOS errors and return empty source
   * @returns XML string of the current UI
   */
  async getPageSource(
    refreshFirst: boolean = false,
    suppressErrors: boolean = true
  ): Promise<string> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    return this.safeExecute(async () => {
      try {
        // Refresh the page if requested
        if (refreshFirst) {
          // For native apps, we can do a small swipe down and back up to refresh the UI
          const size = await this.driver!.getWindowSize();
          const centerX = size.width / 2;
          const startY = size.height * 0.3;
          const endY = size.height * 0.4;

          // Swipe down slightly
          await this.swipe(centerX, startY, centerX, endY, 300);
          // Small pause
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Swipe back up
          await this.swipe(centerX, endY, centerX, startY, 300);
          // Wait for refresh to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Try getting the page source
        return await this.driver!.getPageSource();
      } catch (error) {
        // Handle iOS-specific XCUITest errors
        if (suppressErrors && error instanceof Error) {
          const errorMessage = error.message || "";

          // Check for known iOS automation issues
          if (
            errorMessage.includes("waitForQuiescenceIncludingAnimationsIdle") ||
            errorMessage.includes("unrecognized selector sent to instance") ||
            errorMessage.includes("failed to get page source")
          ) {
            console.warn(
              "iOS source retrieval warning: Using fallback due to animation or UI state issue."
            );

            // Wait a bit for potential animations to complete
            await new Promise((resolve) => setTimeout(resolve, 1500));

            try {
              // Try again with direct call (might work)
              return await this.driver!.getPageSource();
            } catch (retryError) {
              // Return empty source with warning
              return `<AppRoot><Warning>Source unavailable due to iOS animation state issues</Warning></AppRoot>`;
            }
          }
        }

        // Rethrow other errors
        throw new AppiumError(
          `Failed to get page source: ${
            error instanceof Error ? error.message : String(error)
          }`,
          error instanceof Error ? error : undefined
        );
      }
    }, "Failed to get page source");
  }

  /**
   * Perform a swipe gesture
   *
   * @param startX Starting X coordinate
   * @param startY Starting Y coordinate
   * @param endX Ending X coordinate
   * @param endY Ending Y coordinate
   * @param duration Swipe duration in milliseconds
   * @returns true if successful
   */
  async swipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number = 800
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      await this.driver.touchAction([
        { action: "press", x: startX, y: startY },
        { action: "wait", ms: duration },
        { action: "moveTo", x: endX, y: endY },
        "release",
      ]);
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to perform swipe: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Wait for an element to be present
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @param timeoutMs Timeout in milliseconds
   * @returns true if the element is found within the timeout
   */
  async waitForElement(
    selector: string,
    strategy: string = "xpath",
    timeoutMs: number = 10000
  ): Promise<boolean> {
    try {
      await this.findElement(selector, strategy, timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Long press on an element
   */
  async longPress(
    selector: string,
    duration: number = 1000,
    strategy: string = "xpath"
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const element = await this.findElement(selector, strategy);
      const location = await element.getLocation();

      await this.driver.touchAction([
        { action: "press", x: location.x, y: location.y },
        { action: "wait", ms: duration },
        "release",
      ] as TouchAction[]);
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to long press element: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Scroll to an element
   *
   * @param selector Element selector to scroll to
   * @param direction Direction to scroll ('up', 'down', 'left', 'right')
   * @param strategy Selection strategy
   * @param maxScrolls Maximum number of scroll attempts
   * @returns true if element was found and scrolled to
   */
  async scrollToElement(
    selector: string,
    direction: "up" | "down" | "left" | "right" = "down",
    strategy: string = "xpath",
    maxScrolls: number = 10
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      for (let i = 0; i < maxScrolls; i++) {
        if (await this.elementExists(selector, strategy)) {
          return true;
        }

        const size = await this.driver.getWindowSize();
        const startX = size.width / 2;
        const startY = size.height * (direction === "up" ? 0.3 : 0.7);
        const endY = size.height * (direction === "up" ? 0.7 : 0.3);
        const endX =
          direction === "left"
            ? size.width * 0.9
            : direction === "right"
            ? size.width * 0.1
            : startX;

        // Use W3C Actions API instead of TouchAction API
        const actions = [
          {
            type: "pointer",
            id: "finger1",
            parameters: { pointerType: "touch" },
            actions: [
              // Move to start position
              { type: "pointerMove", duration: 0, x: startX, y: startY },
              // Press down
              { type: "pointerDown", button: 0 },
              // Move to end position over duration milliseconds
              {
                type: "pointerMove",
                duration: 800,
                origin: "viewport",
                x: endX,
                y: endY,
              },
              // Release
              { type: "pointerUp", button: 0 },
            ],
          },
        ];

        // Execute the W3C Actions
        await this.driver.performActions(actions);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return false;
    } catch (error) {
      throw new AppiumError(
        `Failed to scroll to element: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get device orientation
   */
  async getOrientation(): Promise<"PORTRAIT" | "LANDSCAPE"> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const orientation = await this.driver.getOrientation();
      return orientation.toUpperCase() as "PORTRAIT" | "LANDSCAPE";
    } catch (error) {
      throw new AppiumError(
        `Failed to get orientation: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Set device orientation
   *
   * @param orientation Desired orientation ('PORTRAIT' or 'LANDSCAPE')
   */
  async setOrientation(orientation: "PORTRAIT" | "LANDSCAPE"): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.setOrientation(orientation);
    } catch (error) {
      throw new AppiumError(
        `Failed to set orientation: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Hide the keyboard if visible
   */
  async hideKeyboard(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const isKeyboardShown = await this.driver.isKeyboardShown();
      if (isKeyboardShown) {
        await this.driver.hideKeyboard();
      }
    } catch (error) {
      throw new AppiumError(
        `Failed to hide keyboard: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the current activity (Android) or bundle ID (iOS)
   */
  async getCurrentPackage(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getCurrentPackage();
    } catch (error) {
      throw new AppiumError(
        `Failed to get current package: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the current activity (Android only)
   */
  async getCurrentActivity(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getCurrentActivity();
    } catch (error) {
      throw new AppiumError(
        `Failed to get current activity: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Launch the app
   */
  async launchApp(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.launchApp();
    } catch (error) {
      throw new AppiumError(
        `Failed to launch app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Close the app
   */
  async closeApp(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.closeApp();
    } catch (error) {
      throw new AppiumError(
        `Failed to close app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Reset the app (clear app data)
   */
  async resetApp(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.terminateApp(await this.getCurrentPackage(), {
        timeout: 20000,
      });
      await this.driver.launchApp();
    } catch (error) {
      throw new AppiumError(
        `Failed to reset app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get device time
   *
   * @returns Device time string
   */
  async getDeviceTime(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getDeviceTime();
    } catch (error) {
      throw new AppiumError(
        `Failed to get device time: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get battery info (if supported by the device)
   * Note: This is a custom implementation as WebdriverIO doesn't directly support this
   */
  async getBatteryInfo(): Promise<{ level: number; state: number }> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      // Execute mobile command to get battery info
      const result = await this.driver.executeScript("mobile: batteryInfo", []);
      return {
        level: result.level || 0,
        state: result.state || 0,
      };
    } catch (error) {
      throw new AppiumError(
        `Failed to get battery info: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Lock the device
   *
   * @param duration Duration in seconds to lock the device
   */
  async lockDevice(duration?: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.lock(duration);
    } catch (error) {
      throw new AppiumError(
        `Failed to lock device: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if device is locked
   */
  async isDeviceLocked(): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.isLocked();
    } catch (error) {
      throw new AppiumError(
        `Failed to check if device is locked: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Unlock the device
   */
  async unlockDevice(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.unlock();
    } catch (error) {
      throw new AppiumError(
        `Failed to unlock device: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Press a key on the device (Android only)
   *
   * @param keycode Android keycode
   */
  async pressKeyCode(keycode: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.pressKeyCode(keycode);
    } catch (error) {
      throw new AppiumError(
        `Failed to press key code: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Open notifications (Android only)
   */
  async openNotifications(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.openNotifications();
    } catch (error) {
      throw new AppiumError(
        `Failed to open notifications: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all contexts (NATIVE_APP, WEBVIEW, etc.)
   */
  async getContexts(): Promise<string[]> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const contexts = await this.driver.getContexts();
      return contexts.map((context) => context.toString());
    } catch (error) {
      throw new AppiumError(
        `Failed to get contexts: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Switch context (between NATIVE_APP and WEBVIEW)
   *
   * @param context Context name to switch to
   */
  async switchContext(context: string): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.switchContext(context);
    } catch (error) {
      throw new AppiumError(
        `Failed to switch context: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get current context
   */
  async getCurrentContext(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const context = await this.driver.getContext();
      return context.toString();
    } catch (error) {
      throw new AppiumError(
        `Failed to get current context: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Pull file from device
   *
   * @param path Path to file on device
   * @returns Base64 encoded file content
   */
  async pullFile(path: string): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.pullFile(path);
    } catch (error) {
      throw new AppiumError(
        `Failed to pull file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Push file to device
   *
   * @param path Path on device to write to
   * @param data Base64 encoded file content
   */
  async pushFile(path: string, data: string): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.pushFile(path, data);
    } catch (error) {
      throw new AppiumError(
        `Failed to push file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find an iOS predicate string element (iOS only)
   *
   * @param predicateString iOS predicate string
   * @param timeoutMs Timeout in milliseconds
   * @returns WebdriverIO element if found
   */
  async findByIosPredicate(
    predicateString: string,
    timeoutMs: number = 10000
  ): Promise<Element> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const element = await this.driver.$(
        `-ios predicate string:${predicateString}`
      );
      await element.waitForExist({ timeout: timeoutMs });
      return element;
    } catch (error) {
      throw new AppiumError(
        `Failed to find element with iOS predicate: ${predicateString}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find an iOS class chain element (iOS only)
   *
   * @param classChain iOS class chain
   * @param timeoutMs Timeout in milliseconds
   * @returns WebdriverIO element if found
   */
  async findByIosClassChain(
    classChain: string,
    timeoutMs: number = 10000
  ): Promise<Element> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const element = await this.driver.$(`-ios class chain:${classChain}`);
      await element.waitForExist({ timeout: timeoutMs });
      return element;
    } catch (error) {
      throw new AppiumError(
        `Failed to find element with iOS class chain: ${classChain}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get list of available iOS simulators
   * Note: This method isn't tied to an Appium session, so it doesn't require an initialized driver
   * This uses the executeScript capability of WebdriverIO to run a mobile command
   *
   * @returns Array of simulator objects
   */
  async getIosSimulators(): Promise<any[]> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const result = await this.driver.executeScript(
        "mobile: listSimulators",
        []
      );
      return result.devices || [];
    } catch (error) {
      throw new AppiumError(
        `Failed to get iOS simulators list: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Perform iOS-specific touch ID (fingerprint) simulation
   *
   * @param match Whether the fingerprint should match (true) or not match (false)
   * @returns true if successful
   */
  async performTouchId(match: boolean): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      await this.driver.executeScript("mobile: performTouchId", [{ match }]);
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to perform Touch ID: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Simulate iOS shake gesture
   *
   * @returns true if successful
   */
  async shakeDevice(): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      await this.driver.executeScript("mobile: shake", []);
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to shake device: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Start recording the screen on iOS or Android device
   *
   * @param options Recording options
   * @returns true if recording started successfully
   */
  async startRecording(options?: {
    videoType?: string;
    timeLimit?: number;
    videoQuality?: string;
    videoFps?: number;
  }): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const opts = options || {};
      await this.driver.startRecordingScreen(opts);
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to start screen recording: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Stop recording the screen and get the recording content as base64
   *
   * @returns Base64-encoded recording data
   */
  async stopRecording(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const recording = await this.driver.stopRecordingScreen();
      return recording;
    } catch (error) {
      throw new AppiumError(
        `Failed to stop screen recording: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Execute a custom mobile command
   *
   * @param command Mobile command to execute
   * @param args Arguments for the command
   * @returns Command result
   */
  async executeMobileCommand(command: string, args: any[] = []): Promise<any> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      return await this.driver.executeScript(`mobile: ${command}`, args);
    } catch (error) {
      throw new AppiumError(
        `Failed to execute mobile command '${command}': ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get text from an element
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns Text content of the element
   * @throws AppiumError if element is not found or has no text
   */
  async getText(selector: string, strategy: string = "xpath"): Promise<string> {
    try {
      const element = await this.findElement(selector, strategy);
      const text = await element.getText();
      return text;
    } catch (error) {
      throw new AppiumError(
        `Failed to get text from element with selector ${selector}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send keys directly to the device (without focusing on an element)
   *
   * @param text Text to send
   * @returns true if successful
   */
  async sendKeysToDevice(text: string): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.keys(text.split(""));
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to send keys to device: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send key events to the device (e.g. HOME button, BACK button)
   *
   * @param keyEvent Key event name or code
   * @returns true if successful
   */
  async sendKeyEvent(keyEvent: string | number): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      if (typeof keyEvent === "string") {
        // For named key events like "home", "back"
        await this.driver.keys(keyEvent);
      } else {
        // For numeric key codes
        await this.driver.pressKeyCode(keyEvent);
      }
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to send key event ${keyEvent}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear text from an input element
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns true if successful
   */
  async clearElement(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    try {
      const element = await this.findElement(selector, strategy);
      await element.clearValue();
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to clear element with selector ${selector}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Scroll using predefined directions - scrollDown, scrollUp, scrollLeft, scrollRight
   *
   * @param direction Direction to scroll: "down", "up", "left", "right"
   * @param distance Optional percentage of screen to scroll (0.0-1.0), defaults to 0.5
   * @returns true if successful
   */
  async scrollScreen(
    direction: "down" | "up" | "left" | "right",
    distance: number = 0.5
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const size = await this.driver.getWindowSize();
      const midX = size.width / 2;
      const midY = size.height / 2;

      let startX, startY, endX, endY;

      switch (direction) {
        case "down":
          startX = midX;
          startY = size.height * 0.3;
          endX = midX;
          endY = size.height * (0.3 + distance);
          break;
        case "up":
          startX = midX;
          startY = size.height * 0.7;
          endX = midX;
          endY = size.height * (0.7 - distance);
          break;
        case "right":
          startX = size.width * 0.3;
          startY = midY;
          endX = size.width * (0.3 + distance);
          endY = midY;
          break;
        case "left":
          startX = size.width * 0.7;
          startY = midY;
          endX = size.width * (0.7 - distance);
          endY = midY;
          break;
      }

      await this.swipe(startX, startY, endX, endY, 800);
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to scroll ${direction}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get element attributes - useful for debugging and inspecting
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns Object with element attributes
   */
  async getElementAttributes(
    selector: string,
    strategy: string = "xpath"
  ): Promise<Record<string, any>> {
    try {
      const element = await this.findElement(selector, strategy);

      // Get common element attributes - these may vary by platform
      const result: Record<string, any> = {};

      // Try to get common properties
      const propertiesToGet = [
        "text",
        "content-desc",
        "resource-id",
        "class",
        "enabled",
        "displayed",
        "selected",
        "checked",
        "focusable",
        "focused",
        "scrollable",
        "clickable",
        "bounds",
        "package",
        "password",
      ];

      for (const prop of propertiesToGet) {
        try {
          result[prop] = await element.getAttribute(prop);
        } catch (e) {
          // Ignore errors for attributes that may not exist
        }
      }

      // Also get location and size
      try {
        result.location = await element.getLocation();
        result.size = await element.getSize();
      } catch (e) {
        // Ignore if not available
      }

      return result;
    } catch (error) {
      throw new AppiumError(
        `Failed to get attributes for element with selector ${selector}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get detailed element analysis with all available information
   * (useful for inspector functionality)
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns Comprehensive element info
   */
  async inspectElement(
    selector: string,
    strategy: string = "xpath"
  ): Promise<Record<string, any>> {
    try {
      const attributes = await this.getElementAttributes(selector, strategy);
      const element = await this.findElement(selector, strategy);

      // Define result object with explicit type that includes text and rect properties
      const result: Record<string, any> = {
        ...attributes,
        isDisplayed: await element.isDisplayed(),
        isEnabled: await element.isEnabled(),
        isSelected: await element.isSelected(),
        text: null, // Initialize text property
        rect: null, // Initialize rect property
      };

      // Try to get text separately as it's important
      try {
        result.text = await element.getText();
      } catch (e) {
        // Text might not be available
        result.text = null;
      }

      // Get rectangle info
      try {
        // Use getSize and getLocation instead of getRect
        const size = await element.getSize();
        const location = await element.getLocation();

        result.rect = {
          x: location.x,
          y: location.y,
          width: size.width,
          height: size.height,
        };
      } catch (e) {
        // Rect might not be available
      }

      return result;
    } catch (error) {
      throw new AppiumError(
        `Failed to inspect element with selector ${selector}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get a visual tree of elements under a parent element or from the root
   * Helps create a hierarchical view of the UI elements (inspector functionality)
   *
   * @param parentSelector Optional parent element selector, if not provided will use root
   * @param parentStrategy Selection strategy for parent
   * @param maxDepth Maximum depth to traverse
   * @returns Hierarchical object representing the element tree
   */
  async getElementTree(
    parentSelector?: string,
    parentStrategy: string = "xpath",
    maxDepth: number = 5
  ): Promise<Record<string, any>> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      // Get the XML source
      const source = await this.getPageSource();

      // Since we're in Node.js and don't have access to DOM APIs,
      // we'll return a simplified structure with the raw XML source
      // and some basic info. For a full XML parser, a library like
      // 'xmldom' or 'cheerio' would be needed.
      return {
        rawSource: source,
        timestamp: new Date().toISOString(),
        note: "XML parsing would require additional libraries",
      };
    } catch (error) {
      throw new AppiumError(
        `Failed to get element tree: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Verify if text is present in the page source
   *
   * @param text Text to search for
   * @returns true if text is found
   */
  async hasTextInSource(text: string): Promise<boolean> {
    try {
      const source = await this.getPageSource();
      return source.includes(text);
    } catch (error) {
      throw new AppiumError(
        `Failed to check for text in page source: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find all elements containing specific text
   *
   * @param text Text to search for
   * @returns Array of WebdriverIO elements that contain the text
   */
  async findElementsByText(text: string): Promise<ElementArray> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      // This XPath finds elements with text containing the specified string
      // It works for both Android and iOS
      const xpath = `//*[contains(@text,"${text}") or contains(@content-desc,"${text}") or contains(@label,"${text}") or contains(@value,"${text}") or contains(@resource-id,"${text}")]`;
      return await this.findElements(xpath, "xpath");
    } catch (error) {
      throw new AppiumError(
        `Failed to find elements containing text "${text}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Open a deep link URL directly in an app
   *
   * @param url The URL/URI to open (e.g. "myapp://details/1234" or a http/https URL)
   * @returns true if successful
   * @throws AppiumError if the operation fails
   */
  async openDeepLink(url: string): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      console.log(`Attempting to open deep link: ${url}`);

      // Use executeScript to run mobile:deepLink command
      // This works for both Android and iOS
      await this.driver.executeScript("mobile:deepLink", [
        {
          url: url,
          package: await this.getCurrentPackage(), // Optional but helps on Android
        },
      ]);

      // Small pause to let the app respond to the deep link
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Deep link opened successfully");
      return true;
    } catch (error) {
      // Try alternative methods if the first approach fails
      try {
        console.log("First approach failed, trying alternative method...");

        // Platform-specific approaches
        const capabilities = await this.driver.capabilities;
        // Access platformName safely from capabilities
        const platform =
          (capabilities as any).platformName?.toString().toLowerCase() ||
          (capabilities as any)["appium:platformName"]
            ?.toString()
            .toLowerCase();

        if (platform === "android") {
          // Android alternative using am start command
          const encodedUrl = encodeURIComponent(url);
          const pkg = await this.getCurrentPackage();
          await this.driver.executeScript("mobile:shell", [
            {
              command: `am start -a android.intent.action.VIEW -d "${encodedUrl}" ${pkg}`,
            },
          ]);
        } else if (platform === "ios") {
          // iOS alternative using Safari URL handling
          await this.driver.url(url);
        }

        // Small pause to let the app respond to the deep link
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Deep link opened successfully using alternative method");
        return true;
      } catch (alternativeError) {
        throw new AppiumError(
          `Failed to open deep link ${url}: ${
            error instanceof Error ? error.message : String(error)
          }. Alternative method also failed: ${
            alternativeError instanceof Error
              ? alternativeError.message
              : String(alternativeError)
          }`,
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  /**
   * Open a deep link using Android Intent
   * This is a more specific Android-only method that allows setting additional intent parameters
   *
   * @param url The URL/URI to open
   * @param extras Optional extras to add to the intent
   * @returns true if successful
   */
  async openAndroidDeepLink(
    url: string,
    extras?: Record<string, string>
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    // Check if we're on Android
    const capabilities = await this.driver.capabilities;
    // Access platformName safely from capabilities
    const platform =
      (capabilities as any).platformName?.toString().toLowerCase() ||
      (capabilities as any)["appium:platformName"]?.toString().toLowerCase();

    if (platform !== "android") {
      throw new AppiumError("This method is only supported on Android");
    }

    try {
      console.log(`Attempting to open Android deep link: ${url}`);

      let command = `am start -a android.intent.action.VIEW -d "${encodeURIComponent(
        url
      )}"`;

      // Add extras if provided
      if (extras && Object.keys(extras).length > 0) {
        for (const [key, value] of Object.entries(extras)) {
          command += ` --es "${key}" "${value}"`;
        }
      }

      // Execute the adb shell command
      await this.driver.executeScript("mobile:shell", [
        {
          command,
        },
      ]);

      // Small pause to let the app respond to the deep link
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Android deep link opened successfully");
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to open Android deep link ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the window size (screen dimensions)
   *
   * @returns Object containing width and height of the screen
   */
  async getWindowSize(): Promise<{ width: number; height: number }> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const size = await this.driver.getWindowSize();
      return {
        width: size.width,
        height: size.height,
      };
    } catch (error) {
      throw new AppiumError(
        `Failed to get window size: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Tap at specific coordinates on the screen
   *
   * @param x X-coordinate
   * @param y Y-coordinate
   * @returns true if successful
   */
  async tapByCoordinates(x: number, y: number): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      console.log(`Tapping at coordinates: (${x}, ${y})`);

      try {
        // First try using W3C Actions API (modern approach)
        const actions = [
          {
            type: "pointer",
            id: "finger1",
            parameters: { pointerType: "touch" },
            actions: [
              // Move to specified position
              { type: "pointerMove", duration: 0, x, y },
              // Press down
              { type: "pointerDown", button: 0 },
              // Short wait
              { type: "pause", duration: 100 },
              // Release
              { type: "pointerUp", button: 0 },
            ],
          },
        ];

        await this.driver.performActions(actions);
      } catch (w3cError) {
        // If W3C Actions fail, fall back to TouchAction API
        console.log("W3C Actions failed, falling back to TouchAction API");
        await this.driver.touchAction([{ action: "tap", x, y }]);
      }

      // Small pause after tap to let UI update
      await new Promise((resolve) => setTimeout(resolve, 300));
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to tap at coordinates (${x}, ${y}): ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Perform advanced touch actions using W3C Actions API
   * Allows for complex gestures like multi-touch, long press, etc.
   *
   * @param actions Array of W3C Action objects
   * @returns true if successful
   */
  async performActions(actions: any[]): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.performActions(actions);
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to perform actions: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send text to the currently active/focused element
   * Useful when you've already focused on an input field
   *
   * @param text Text to send
   * @returns true if successful
   */
  async sendTextToActiveElement(text: string): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      // For most devices, we can use the keys command to send text to active element
      await this.driver.keys(text.split(""));

      // For some platforms/situations, we might need to use different approaches
      // Here's a fallback method using Actions API if the above fails:
      try {
        await this.hideKeyboard();
      } catch (e) {
        // Ignore errors when hiding keyboard
      }

      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to send text to active element: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }
}
