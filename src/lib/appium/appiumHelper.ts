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
      await this.driver.deleteSession();
      this.driver = null;
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

    const startTime = Date.now();
    let lastError: Error | undefined;

    while (Date.now() - startTime < timeoutMs) {
      try {
        let element: Element;

        switch (strategy.toLowerCase()) {
          case "id":
            element = await this.driver.$(`id=${selector}`);
            break;
          case "xpath":
            element = await this.driver.$(`${selector}`);
            break;
          case "accessibility id":
            element = await this.driver.$(`~${selector}`);
            break;
          case "class name":
            element = await this.driver.$(`${selector}`);
            break;
          default:
            element = await this.driver.$(`${selector}`);
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
   *
   * @param selector Element selector
   * @param strategy Selection strategy
   * @returns true if successful
   * @throws AppiumError if the operation fails after retries
   */
  async tapElement(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const element = await this.findElement(selector, strategy);
        await element.waitForClickable({ timeout: 5000 });
        await element.click();
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw new AppiumError(
      `Failed to tap element with selector ${selector} after ${this.maxRetries} attempts: ${lastError?.message}`,
      lastError
    );
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
   * @returns XML string of the current UI
   */
  async getPageSource(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      return await this.driver.getPageSource();
    } catch (error) {
      throw new AppiumError(
        `Failed to get page source: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
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

        await this.swipe(startX, startY, endX, endY, 800);
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
}
