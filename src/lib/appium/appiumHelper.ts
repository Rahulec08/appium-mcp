import {
  remote,
  RemoteOptions,
  Browser,
  Element,
  ElementArray,
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
 * W3C compliant Appium capabilities for different platforms
 */
export interface AppiumCapabilities {
  // Standard W3C capabilities (no prefix required)
  platformName: "Android" | "iOS";
  browserName?: string;
  browserVersion?: string;
  platformVersion?: string;

  // Appium-specific capabilities (require appium: prefix)
  "appium:deviceName"?: string;
  "appium:udid"?: string;
  "appium:automationName"?:
    | "UiAutomator2"
    | "XCUITest"
    | "Espresso"
    | "Flutter";
  "appium:app"?: string;
  "appium:appPackage"?: string;
  "appium:appActivity"?: string;
  "appium:bundleId"?: string;
  "appium:noReset"?: boolean;
  "appium:fullReset"?: boolean;
  "appium:newCommandTimeout"?: number;
  "appium:commandTimeouts"?: Record<string, number>;
  "appium:orientation"?: "PORTRAIT" | "LANDSCAPE";
  "appium:autoAcceptAlerts"?: boolean;
  "appium:autoDismissAlerts"?: boolean;
  "appium:language"?: string;
  "appium:locale"?: string;
  "appium:printPageSourceOnFindFailure"?: boolean;

  // Allow additional appium: prefixed capabilities
  [key: `appium:${string}`]: any;

  // Legacy format support (will be automatically converted)
  deviceName?: string;
  udid?: string;
  automationName?: "UiAutomator2" | "XCUITest" | "Espresso" | "Flutter";
  app?: string;
  appPackage?: string;
  appActivity?: string;
  bundleId?: string;
  noReset?: boolean;
  fullReset?: boolean;
  newCommandTimeout?: number;

  // Allow any additional properties for flexibility
  [key: string]: any;
}

/**
 * W3C Actions API types for advanced gestures
 */
interface W3CPointerAction {
  type: "pointer";
  id: string;
  parameters: {
    pointerType: "touch" | "pen" | "mouse";
  };
  actions: Array<{
    type: "pointerMove" | "pointerDown" | "pointerUp" | "pause";
    duration?: number;
    x?: number;
    y?: number;
    button?: number;
    origin?: "viewport" | "pointer";
  }>;
}

interface W3CKeyAction {
  type: "key";
  id: string;
  actions: Array<{
    type: "keyDown" | "keyUp" | "pause";
    value?: string;
    duration?: number;
  }>;
}

interface W3CWheelAction {
  type: "wheel";
  id: string;
  actions: Array<{
    type: "scroll" | "pause";
    x?: number;
    y?: number;
    deltaX?: number;
    deltaY?: number;
    duration?: number;
    origin?: "viewport" | "pointer";
  }>;
}

type W3CAction = W3CPointerAction | W3CKeyAction | W3CWheelAction;

/**
 * Helper class for W3C compliant Appium operations
 */
export class AppiumHelper {
  private driver: Browser | null = null;
  private screenshotDir: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000;
  private lastCapabilities: AppiumCapabilities | null = null;
  private lastAppiumUrl: string | null = null;

  constructor(screenshotDir: string = "./test-screenshots") {
    this.screenshotDir = screenshotDir;
  }

  /**
   * Convert legacy capabilities to W3C compliant format
   */
  private formatCapabilitiesForW3C(
    capabilities: AppiumCapabilities
  ): Record<string, any> {
    const w3cCapabilities: Record<string, any> = {};

    // List of standard W3C capabilities that don't need appium: prefix
    const standardW3CCaps = [
      "platformName",
      "browserName",
      "browserVersion",
      "platformVersion",
      "acceptInsecureCerts",
      "pageLoadStrategy",
      "proxy",
      "setWindowRect",
      "timeouts",
      "unhandledPromptBehavior",
    ];

    for (const [key, value] of Object.entries(capabilities)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (standardW3CCaps.includes(key)) {
        w3cCapabilities[key] = value;
      } else if (key.startsWith("appium:")) {
        w3cCapabilities[key] = value;
      } else {
        w3cCapabilities[`appium:${key}`] = value;
      }
    }

    return w3cCapabilities;
  }

  /**
   * Initialize the Appium driver with W3C compliant capabilities
   */
  async initializeDriver(
    capabilities: AppiumCapabilities,
    appiumUrl: string = "http://localhost:4723"
  ): Promise<Browser> {
    try {
      this.lastCapabilities = { ...capabilities };
      this.lastAppiumUrl = appiumUrl;

      const w3cCapabilities = this.formatCapabilitiesForW3C(capabilities);
      console.log(
        "W3C Formatted Capabilities:",
        JSON.stringify(w3cCapabilities, null, 2)
      );

      const parsedUrl = new URL(appiumUrl);
      const options: RemoteOptions = {
        hostname: parsedUrl.hostname,
        port: parseInt(parsedUrl.port) || 4723,
        path: parsedUrl.pathname || "/",
        protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
        connectionRetryCount: 3,
        connectionRetryTimeout: 30000,
        logLevel: "error",
        capabilities: w3cCapabilities,
        strictSSL: false,
      };

      console.log(`Connecting to Appium server: ${appiumUrl}`);
      this.driver = await remote(options);

      const sessionId = this.driver.sessionId;
      console.log(
        `✅ Appium driver initialized successfully with session ID: ${sessionId}`
      );

      return this.driver;
    } catch (error) {
      console.error("Failed to initialize Appium driver:", error);
      throw new AppiumError(
        `Failed to initialize Appium driver: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * W3C Session Management
   */
  async validateSession(): Promise<boolean> {
    if (!this.driver) return false;

    try {
      await this.driver.getPageSource();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("NoSuchDriverError") ||
        errorMessage.includes("terminated") ||
        errorMessage.includes("invalid session id")
      ) {
        console.log("Session terminated, attempting recovery...");

        if (this.lastCapabilities && this.lastAppiumUrl) {
          try {
            try {
              await this.driver.deleteSession();
            } catch {}
            this.driver = null;

            await this.initializeDriver(
              this.lastCapabilities,
              this.lastAppiumUrl
            );
            console.log("✅ Session recovery successful");
            return true;
          } catch {
            console.error("❌ Session recovery failed");
            return false;
          }
        }
      }
      return false;
    }
  }

  async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (await this.validateSession()) {
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

  getDriver(): Browser {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }
    return this.driver;
  }

  async closeDriver(): Promise<void> {
    if (this.driver) {
      try {
        await this.driver.deleteSession();
        console.log("✅ Appium session closed successfully");
      } catch (error) {
        console.warn(
          "⚠️ Error while closing Appium session:",
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        this.driver = null;
      }
    }
  }

  /**
   * W3C Element Location Strategies
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
              element = await this.driver!.$(`[id="${selector}"]`);
              break;
            case "xpath":
              element = await this.driver!.$(selector);
              break;
            case "accessibility id":
              element = await this.driver!.$(`~${selector}`);
              break;
            case "class name":
              element = await this.driver!.$(`.${selector}`);
              break;
            case "tag name":
              element = await this.driver!.$(`<${selector}>`);
              break;
            case "name":
              element = await this.driver!.$(`[name="${selector}"]`);
              break;
            case "link text":
              element = await this.driver!.$(`=${selector}`);
              break;
            case "partial link text":
              element = await this.driver!.$(`*=${selector}`);
              break;
            case "css selector":
              element = await this.driver!.$(selector);
              break;
            // Mobile-specific strategies
            case "android uiautomator":
              element = await this.driver!.$(`android=${selector}`);
              break;
            case "ios predicate string":
              element = await this.driver!.$(
                `-ios predicate string:${selector}`
              );
              break;
            case "ios class chain":
              element = await this.driver!.$(`-ios class chain:${selector}`);
              break;
            case "android viewtag":
              element = await this.driver!.$(`android.viewtag=${selector}`);
              break;
            case "android datamatcher":
              element = await this.driver!.$(`android.datamatcher=${selector}`);
              break;
            case "windows uiautomation":
              element = await this.driver!.$(`windows=${selector}`);
              break;
            default:
              element = await this.driver!.$(selector);
          }

          await element.waitForExist({ timeout: Math.min(timeoutMs, 5000) });
          return element;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }

      throw new AppiumError(
        `Failed to find element with selector ${selector} using strategy ${strategy} after ${timeoutMs}ms: ${lastError?.message}`,
        lastError
      );
    }, `Failed to find element with selector ${selector}`);
  }

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
          elements = await this.driver.$$(`[id="${selector}"]`);
          break;
        case "xpath":
          elements = await this.driver.$$(selector);
          break;
        case "accessibility id":
          elements = await this.driver.$$(`~${selector}`);
          break;
        case "class name":
          elements = await this.driver.$$(`.${selector}`);
          break;
        case "tag name":
          elements = await this.driver.$$(`<${selector}>`);
          break;
        case "name":
          elements = await this.driver.$$(`[name="${selector}"]`);
          break;
        case "link text":
          elements = await this.driver.$$(`=${selector}`);
          break;
        case "partial link text":
          elements = await this.driver.$$(`*=${selector}`);
          break;
        case "css selector":
          elements = await this.driver.$$(selector);
          break;
        case "android uiautomator":
          elements = await this.driver.$$(`android=${selector}`);
          break;
        case "ios predicate string":
          elements = await this.driver.$$(`-ios predicate string:${selector}`);
          break;
        case "ios class chain":
          elements = await this.driver.$$(`-ios class chain:${selector}`);
          break;
        default:
          elements = await this.driver.$$(selector);
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
   * W3C Element Interaction Actions
   */
  async click(selector: string, strategy: string = "xpath"): Promise<boolean> {
    return this.tapElement(selector, strategy);
  }

  async tapElement(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    return this.safeExecute(async () => {
      let lastError: Error | undefined;
      console.log(`🎯 Attempting to tap element with ${strategy}: ${selector}`);

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const element = await this.findElement(selector, strategy, 10000);
          await element.waitForDisplayed({ timeout: 5000 });

          // Method 1: Standard W3C element click
          try {
            await element.click();
            await new Promise((resolve) => setTimeout(resolve, 300));
            console.log("✅ Standard click successful");
            return true;
          } catch (clickError) {
            console.log(`❌ Standard click failed: ${clickError}`);
          }

          // Method 2: W3C Actions API
          try {
            const location = await element.getLocation();
            const size = await element.getSize();
            const centerX = Math.round(location.x + size.width / 2);
            const centerY = Math.round(location.y + size.height / 2);

            const w3cActions: W3CPointerAction[] = [
              {
                type: "pointer",
                id: "finger1",
                parameters: { pointerType: "touch" },
                actions: [
                  {
                    type: "pointerMove",
                    duration: 0,
                    x: centerX,
                    y: centerY,
                    origin: "viewport",
                  },
                  { type: "pointerDown", button: 0 },
                  { type: "pause", duration: 100 },
                  { type: "pointerUp", button: 0 },
                ],
              },
            ];

            await this.driver!.performActions(w3cActions);
            await new Promise((resolve) => setTimeout(resolve, 300));
            console.log("✅ W3C Actions tap successful");
            return true;
          } catch (w3cError) {
            console.log(`❌ W3C Actions failed: ${w3cError}`);
          }

          // Method 3: Mobile tap command
          try {
            const location = await element.getLocation();
            const size = await element.getSize();
            const centerX = Math.round(location.x + size.width / 2);
            const centerY = Math.round(location.y + size.height / 2);

            await this.driver!.executeScript("mobile: tap", [
              { x: centerX, y: centerY },
            ]);
            await new Promise((resolve) => setTimeout(resolve, 300));
            console.log("✅ Mobile tap successful");
            return true;
          } catch (mobileError) {
            lastError =
              mobileError instanceof Error
                ? mobileError
                : new Error(String(mobileError));
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.log(`❌ Tap attempt ${attempt} failed: ${lastError.message}`);

          if (attempt < this.maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryDelay * attempt)
            );
          }
        }
      }

      throw new AppiumError(
        `Failed to tap element after ${this.maxRetries} attempts: ${lastError?.message}`,
        lastError
      );
    }, `Failed to tap element with selector ${selector}`);
  }

  async sendKeys(
    selector: string,
    text: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    return this.safeExecute(async () => {
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const element = await this.findElement(selector, strategy);
          await element.waitForDisplayed({ timeout: 5000 });

          try {
            await element.clearValue();
          } catch {}

          await element.setValue(text);
          console.log("✅ Send keys successful");
          return true;
        } catch (error) {
          console.log(`❌ Send keys attempt ${attempt} failed: ${error}`);
          if (attempt < this.maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryDelay)
            );
          }
        }
      }
      return false;
    }, `Failed to send keys to element with selector ${selector}`);
  }

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
        `Failed to clear element: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getText(selector: string, strategy: string = "xpath"): Promise<string> {
    try {
      const element = await this.findElement(selector, strategy);
      return await element.getText();
    } catch (error) {
      throw new AppiumError(
        `Failed to get text: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getAttribute(
    selector: string,
    attributeName: string,
    strategy: string = "xpath"
  ): Promise<string | null> {
    try {
      const element = await this.findElement(selector, strategy);
      return await element.getAttribute(attributeName);
    } catch (error) {
      throw new AppiumError(
        `Failed to get attribute: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async isDisplayed(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    try {
      const element = await this.findElement(selector, strategy);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async isEnabled(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    try {
      const element = await this.findElement(selector, strategy);
      return await element.isEnabled();
    } catch {
      return false;
    }
  }

  async isSelected(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    try {
      const element = await this.findElement(selector, strategy);
      return await element.isSelected();
    } catch {
      return false;
    }
  }

  /**
   * W3C Touch Actions / Gestures
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
      const w3cActions: W3CPointerAction[] = [
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: Math.round(startX),
              y: Math.round(startY),
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            {
              type: "pointerMove",
              duration: duration,
              x: Math.round(endX),
              y: Math.round(endY),
              origin: "viewport",
            },
            { type: "pointerUp", button: 0 },
          ],
        },
      ];

      await this.driver.performActions(w3cActions);
      console.log("✅ W3C swipe successful");
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

  async scroll(
    direction: "up" | "down" | "left" | "right",
    distance: number = 0.5
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
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

      return await this.swipe(startX, startY, endX, endY, 800);
    } catch (error) {
      throw new AppiumError(
        `Failed to scroll ${direction}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async scrollScreen(
    direction: "down" | "up" | "left" | "right",
    distance: number = 0.5
  ): Promise<boolean> {
    return this.scroll(direction, distance);
  }

  async scrollToElement(
    selector: string,
    strategy: string = "xpath",
    maxScrolls: number = 10
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      for (let i = 0; i < maxScrolls; i++) {
        const exists = await this.elementExists(selector, strategy);
        if (exists) {
          return true;
        }
        await this.scroll("down", 0.3);
        await new Promise((resolve) => setTimeout(resolve, 500));
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

  async pinch(
    centerX: number,
    centerY: number,
    scale: number = 0.5,
    duration: number = 1000
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const startDistance = 100;
      const endDistance = startDistance * scale;

      const finger1StartX = centerX - startDistance / 2;
      const finger1StartY = centerY;
      const finger1EndX = centerX - endDistance / 2;
      const finger1EndY = centerY;

      const finger2StartX = centerX + startDistance / 2;
      const finger2StartY = centerY;
      const finger2EndX = centerX + endDistance / 2;
      const finger2EndY = centerY;

      const w3cActions: W3CPointerAction[] = [
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: finger1StartX,
              y: finger1StartY,
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            {
              type: "pointerMove",
              duration: duration,
              x: finger1EndX,
              y: finger1EndY,
              origin: "viewport",
            },
            { type: "pointerUp", button: 0 },
          ],
        },
        {
          type: "pointer",
          id: "finger2",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: finger2StartX,
              y: finger2StartY,
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            {
              type: "pointerMove",
              duration: duration,
              x: finger2EndX,
              y: finger2EndY,
              origin: "viewport",
            },
            { type: "pointerUp", button: 0 },
          ],
        },
      ];

      await this.driver.performActions(w3cActions);
      console.log("✅ Pinch gesture successful");
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to perform pinch: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async zoom(
    centerX: number,
    centerY: number,
    scale: number = 2.0,
    duration: number = 1000
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const startDistance = 50;
      const endDistance = startDistance * scale;

      const finger1StartX = centerX - startDistance / 2;
      const finger1StartY = centerY;
      const finger1EndX = centerX - endDistance / 2;
      const finger1EndY = centerY;

      const finger2StartX = centerX + startDistance / 2;
      const finger2StartY = centerY;
      const finger2EndX = centerX + endDistance / 2;
      const finger2EndY = centerY;

      const w3cActions: W3CPointerAction[] = [
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: finger1StartX,
              y: finger1StartY,
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            {
              type: "pointerMove",
              duration: duration,
              x: finger1EndX,
              y: finger1EndY,
              origin: "viewport",
            },
            { type: "pointerUp", button: 0 },
          ],
        },
        {
          type: "pointer",
          id: "finger2",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: finger2StartX,
              y: finger2StartY,
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            {
              type: "pointerMove",
              duration: duration,
              x: finger2EndX,
              y: finger2EndY,
              origin: "viewport",
            },
            { type: "pointerUp", button: 0 },
          ],
        },
      ];

      await this.driver.performActions(w3cActions);
      console.log("✅ Zoom gesture successful");
      return true;
    } catch (error) {
      throw new AppiumError(
        `Failed to perform zoom: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async longPress(
    selector: string,
    duration: number = 1000,
    strategy: string = "xpath"
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    return this.safeExecute(async () => {
      const element = await this.findElement(selector, strategy);
      const location = await element.getLocation();
      const size = await element.getSize();
      const centerX = Math.round(location.x + size.width / 2);
      const centerY = Math.round(location.y + size.height / 2);

      const w3cActions: W3CPointerAction[] = [
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: centerX,
              y: centerY,
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            { type: "pause", duration: duration },
            { type: "pointerUp", button: 0 },
          ],
        },
      ];

      await this.driver!.performActions(w3cActions);
      console.log("✅ Long press successful");
      return true;
    }, `Failed to long press element with selector ${selector}`);
  }

  async doubleTap(
    selector: string,
    strategy: string = "xpath"
  ): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    return this.safeExecute(async () => {
      const element = await this.findElement(selector, strategy);
      const location = await element.getLocation();
      const size = await element.getSize();
      const centerX = Math.round(location.x + size.width / 2);
      const centerY = Math.round(location.y + size.height / 2);

      const w3cActions: W3CPointerAction[] = [
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: centerX,
              y: centerY,
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            { type: "pointerUp", button: 0 },
            { type: "pause", duration: 100 },
            { type: "pointerDown", button: 0 },
            { type: "pointerUp", button: 0 },
          ],
        },
      ];

      await this.driver!.performActions(w3cActions);
      console.log("✅ Double tap successful");
      return true;
    }, `Failed to double tap element with selector ${selector}`);
  }

  /**
   * W3C Navigation and Window Management
   */
  async navigateBack(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.back();
    } catch (error) {
      throw new AppiumError(
        `Failed to navigate back: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async navigateForward(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.forward();
    } catch (error) {
      throw new AppiumError(
        `Failed to navigate forward: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async refresh(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.refresh();
    } catch (error) {
      throw new AppiumError(
        `Failed to refresh: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getCurrentUrl(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getUrl();
    } catch (error) {
      throw new AppiumError(
        `Failed to get current URL: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getTitle(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getTitle();
    } catch (error) {
      throw new AppiumError(
        `Failed to get title: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getWindowSize(): Promise<{ width: number; height: number }> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getWindowSize();
    } catch (error) {
      throw new AppiumError(
        `Failed to get window size: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async setWindowSize(width: number, height: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.setWindowSize(width, height);
    } catch (error) {
      throw new AppiumError(
        `Failed to set window size: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * W3C Screenshots and Visual Testing
   */
  async takeScreenshot(name: string = "screenshot"): Promise<string> {
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

      console.log(`📸 Screenshot saved: ${filepath}`);
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

  async takeElementScreenshot(
    selector: string,
    name: string = "element",
    strategy: string = "xpath"
  ): Promise<string> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    try {
      const element = await this.findElement(selector, strategy);
      await fs.mkdir(this.screenshotDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${name}_${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      const screenshot = await element.takeScreenshot();
      await fs.writeFile(filepath, Buffer.from(screenshot, "base64"));

      console.log(`📸 Element screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      throw new AppiumError(
        `Failed to take element screenshot: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * W3C Page Source and DOM
   */
  async getPageSource(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError(
        "Appium driver not initialized. Call initializeDriver first."
      );
    }

    return this.safeExecute(async () => {
      return await this.driver!.getPageSource();
    }, "Failed to get page source");
  }

  /**
   * W3C Timeouts
   */
  async setImplicitTimeout(timeoutMs: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.setTimeout({ implicit: timeoutMs });
    } catch (error) {
      throw new AppiumError(
        `Failed to set implicit timeout: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async setPageLoadTimeout(timeoutMs: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.setTimeout({ pageLoad: timeoutMs });
    } catch (error) {
      throw new AppiumError(
        `Failed to set page load timeout: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async setScriptTimeout(timeoutMs: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.setTimeout({ script: timeoutMs });
    } catch (error) {
      throw new AppiumError(
        `Failed to set script timeout: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * W3C Execute Script
   */
  async executeScript(script: string, args: any[] = []): Promise<any> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.executeScript(script, args);
    } catch (error) {
      throw new AppiumError(
        `Failed to execute script: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async executeAsyncScript(script: string, args: any[] = []): Promise<any> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.executeAsyncScript(script, args);
    } catch (error) {
      throw new AppiumError(
        `Failed to execute async script: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * W3C Cookies (for hybrid/web contexts)
   */
  async addCookie(cookie: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    expiry?: number;
  }): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.addCookie(cookie);
    } catch (error) {
      throw new AppiumError(
        `Failed to add cookie: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getCookies(): Promise<any[]> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getCookies();
    } catch (error) {
      throw new AppiumError(
        `Failed to get cookies: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async deleteCookie(name: string): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.deleteCookie(name);
    } catch (error) {
      throw new AppiumError(
        `Failed to delete cookie: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async deleteAllCookies(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.deleteAllCookies();
    } catch (error) {
      throw new AppiumError(
        `Failed to delete all cookies: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Mobile-Specific W3C Extensions
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

  async resetApp(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      // Use terminateApp + launchApp instead of reset() which doesn't exist
      const currentPackage = await this.getCurrentPackage();
      await this.driver.terminateApp(currentPackage, {});
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

  async terminateApp(bundleId: string): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.terminateApp(bundleId, {});
    } catch (error) {
      throw new AppiumError(
        `Failed to terminate app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async activateApp(bundleId: string): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.activateApp(bundleId);
    } catch (error) {
      throw new AppiumError(
        `Failed to activate app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

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

  async isAppInstalled(bundleId: string): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.isAppInstalled(bundleId);
    } catch (error) {
      throw new AppiumError(
        `Failed to check if app is installed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async installApp(appPath: string): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.installApp(appPath);
    } catch (error) {
      throw new AppiumError(
        `Failed to install app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async removeApp(bundleId: string): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.removeApp(bundleId);
    } catch (error) {
      throw new AppiumError(
        `Failed to remove app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Context Management (Native/WebView)
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
   * Device Orientation
   */
  async getOrientation(): Promise<string> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getOrientation();
    } catch (error) {
      throw new AppiumError(
        `Failed to get orientation: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

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
   * Device Hardware Keys (Android)
   */
  async pressKeyCode(keyCode: number, metaState?: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.pressKeyCode(keyCode, metaState);
    } catch (error) {
      throw new AppiumError(
        `Failed to press key code: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async longPressKeyCode(keyCode: number, metaState?: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.longPressKeyCode(keyCode, metaState);
    } catch (error) {
      throw new AppiumError(
        `Failed to long press key code: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Additional Mobile Methods
   */
  async hideKeyboard(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.hideKeyboard();
    } catch (error) {
      throw new AppiumError(
        `Failed to hide keyboard: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

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

  async getBatteryInfo(): Promise<{ level: number; state: number }> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
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
      return (result as any).devices || [];
    } catch (error) {
      throw new AppiumError(
        `Failed to get iOS simulators list: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

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

  async sendKeyEvent(keyEvent: string | number): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      if (typeof keyEvent === "string") {
        await this.driver.keys(keyEvent);
      } else {
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

  async getElementAttributes(
    selector: string,
    strategy: string = "xpath"
  ): Promise<Record<string, any>> {
    try {
      const element = await this.findElement(selector, strategy);

      const result: Record<string, any> = {};

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
        } catch {
          // Ignore errors for attributes that may not exist
        }
      }

      try {
        result.location = await element.getLocation();
        result.size = await element.getSize();
      } catch {
        // Ignore if not available
      }

      return result;
    } catch (error) {
      throw new AppiumError(
        `Failed to get element attributes: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Static helper for creating W3C capabilities
   */
  static createW3CCapabilities(
    platform: "Android" | "iOS",
    options: {
      deviceName?: string;
      udid?: string;
      app?: string;
      appPackage?: string;
      appActivity?: string;
      bundleId?: string;
      automationName?: "UiAutomator2" | "XCUITest" | "Espresso" | "Flutter";
      noReset?: boolean;
      fullReset?: boolean;
      newCommandTimeout?: number;
      [key: string]: any;
    } = {}
  ): AppiumCapabilities {
    const baseCapabilities: AppiumCapabilities = {
      platformName: platform,
    };

    if (platform === "Android") {
      baseCapabilities["appium:automationName"] =
        options.automationName || "UiAutomator2";
      if (options.appPackage)
        baseCapabilities["appium:appPackage"] = options.appPackage;
      if (options.appActivity)
        baseCapabilities["appium:appActivity"] = options.appActivity;
    } else if (platform === "iOS") {
      baseCapabilities["appium:automationName"] =
        options.automationName || "XCUITest";
      if (options.bundleId)
        baseCapabilities["appium:bundleId"] = options.bundleId;
    }

    // Add common capabilities with appium: prefix
    if (options.deviceName)
      baseCapabilities["appium:deviceName"] = options.deviceName;
    if (options.udid) baseCapabilities["appium:udid"] = options.udid;
    if (options.app) baseCapabilities["appium:app"] = options.app;
    if (options.noReset !== undefined)
      baseCapabilities["appium:noReset"] = options.noReset;
    if (options.fullReset !== undefined)
      baseCapabilities["appium:fullReset"] = options.fullReset;
    if (options.newCommandTimeout)
      baseCapabilities["appium:newCommandTimeout"] = options.newCommandTimeout;

    // Add any additional options with appium: prefix
    for (const [key, value] of Object.entries(options)) {
      if (
        ![
          "deviceName",
          "udid",
          "app",
          "appPackage",
          "appActivity",
          "bundleId",
          "automationName",
          "noReset",
          "fullReset",
          "newCommandTimeout",
        ].includes(key)
      ) {
        if (!key.startsWith("appium:")) {
          baseCapabilities[`appium:${key}` as keyof AppiumCapabilities] = value;
        } else {
          baseCapabilities[key as keyof AppiumCapabilities] = value;
        }
      }
    }

    return baseCapabilities;
  }

  async inspectElement(
    selector: string,
    strategy: string = "xpath"
  ): Promise<any> {
    try {
      const element = await this.findElement(selector, strategy);
      const attributes = await this.getElementAttributes(selector, strategy);

      // Get additional inspection data
      const elementData: Record<string, any> = {
        ...attributes,
        tagName: await element.getTagName(),
        isDisplayed: await element.isDisplayed(),
        isEnabled: await element.isEnabled(),
        isSelected: await element.isSelected(),
      };

      // Try to get additional properties
      try {
        elementData.rect = await element.getElementRect(element.elementId);
      } catch {
        // Fallback to location and size
        try {
          elementData.location = await element.getLocation();
          elementData.size = await element.getSize();
        } catch {}
      }

      return elementData;
    } catch (error) {
      throw new AppiumError(
        `Failed to inspect element: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getElementTree(): Promise<any> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const pageSource = await this.driver.getPageSource();

      // For XML-based page sources, return structured data
      try {
        // Simple XML parsing for mobile contexts
        const xmlData = {
          source: pageSource,
          timestamp: new Date().toISOString(),
          type: "mobile_hierarchy",
        };

        return xmlData;
      } catch {
        // Return raw source if parsing fails
        return {
          source: pageSource,
          timestamp: new Date().toISOString(),
          type: "raw",
        };
      }
    } catch (error) {
      throw new AppiumError(
        `Failed to get element tree: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async hasTextInSource(text: string): Promise<boolean> {
    try {
      const pageSource = await this.getPageSource();
      return pageSource.includes(text);
    } catch (error) {
      throw new AppiumError(
        `Failed to check for text in source: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async findElementsByText(text: string): Promise<ElementArray> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      // Try multiple strategies for finding text
      const strategies = [
        `//*[@text='${text}']`,
        `//*[contains(@text,'${text}')]`,
        `//*[@content-desc='${text}']`,
        `//*[contains(@content-desc,'${text}')]`,
        `*=${text}`, // WebDriverIO partial text match
        `=${text}`, // WebDriverIO exact text match
      ];

      for (const strategy of strategies) {
        try {
          const elements = await this.driver.$$(strategy);
          if (elements.length > 0) {
            return elements;
          }
        } catch {
          // Continue to next strategy
        }
      }

      // Return empty array if no elements found
      return [] as any as ElementArray;
    } catch (error) {
      throw new AppiumError(
        `Failed to find elements by text '${text}': ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Helper Utilities
   */
  async waitForElement(
    selector: string,
    strategy: string = "xpath",
    timeoutMs: number = 10000
  ): Promise<Element> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const element = await this.findElement(selector, strategy, 1000);
        if (await element.isDisplayed()) {
          return element;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new AppiumError(
      `Element not found within ${timeoutMs}ms: ${selector}`,
      lastError
    );
  }

  async waitForElementToDisappear(
    selector: string,
    strategy: string = "xpath",
    timeoutMs: number = 10000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const exists = await this.elementExists(selector, strategy);
        if (!exists) {
          return true;
        }
      } catch {
        return true; // Element doesn't exist, so it's "disappeared"
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return false;
  }

  async elementExists(
    selector: string,
    strategy: string = "xpath",
    timeoutMs: number = 2000
  ): Promise<boolean> {
    try {
      const element = await this.findElement(selector, strategy, timeoutMs);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async waitUntilElementClickable(
    selector: string,
    strategy: string = "xpath",
    timeoutMs: number = 10000
  ): Promise<Element> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const element = await this.findElement(selector, strategy, 1000);
        if ((await element.isDisplayed()) && (await element.isEnabled())) {
          return element;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new AppiumError(
      `Element not clickable within ${timeoutMs}ms: ${selector}`,
      lastError
    );
  }

  async retryAction<T>(
    action: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          console.log(
            `Retry attempt ${attempt} failed, retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw new AppiumError(
      `Action failed after ${maxRetries} attempts`,
      lastError
    );
  }

  /**
   * Advanced Mobile Capabilities
   */
  async getNetworkConnection(): Promise<number> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getNetworkConnection();
    } catch (error) {
      throw new AppiumError(
        `Failed to get network connection: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async setNetworkConnection(type: number): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.setNetworkConnection({ type });
    } catch (error) {
      throw new AppiumError(
        `Failed to set network connection: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async toggleWifi(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.toggleWiFi();
    } catch (error) {
      throw new AppiumError(
        `Failed to toggle wifi: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async toggleData(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.toggleData();
    } catch (error) {
      throw new AppiumError(
        `Failed to toggle data: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async toggleAirplaneMode(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.toggleAirplaneMode();
    } catch (error) {
      throw new AppiumError(
        `Failed to toggle airplane mode: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async toggleLocationServices(): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.toggleLocationServices();
    } catch (error) {
      throw new AppiumError(
        `Failed to toggle location services: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async setGeoLocation(
    latitude: number,
    longitude: number,
    altitude?: number
  ): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.setGeoLocation({
        latitude,
        longitude,
        altitude: altitude || 0,
      });
    } catch (error) {
      throw new AppiumError(
        `Failed to set geo location: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getGeoLocation(): Promise<{
    latitude: number;
    longitude: number;
    altitude: number;
  }> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const response = await this.driver.getGeoLocation();
      return response as {
        latitude: number;
        longitude: number;
        altitude: number;
      };
    } catch (error) {
      throw new AppiumError(
        `Failed to get geo location: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Cross-platform compatibility helpers
   */
  async tapByCoordinates(x: number, y: number): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      const w3cActions: W3CPointerAction[] = [
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: Math.round(x),
              y: Math.round(y),
              origin: "viewport",
            },
            { type: "pointerDown", button: 0 },
            { type: "pause", duration: 100 },
            { type: "pointerUp", button: 0 },
          ],
        },
      ];

      await this.driver.performActions(w3cActions);
      console.log(`✅ Tap at coordinates (${x}, ${y}) successful`);
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

  async getElementCenter(
    selector: string,
    strategy: string = "xpath"
  ): Promise<{ x: number; y: number }> {
    try {
      const element = await this.findElement(selector, strategy);
      const location = await element.getLocation();
      const size = await element.getSize();

      return {
        x: Math.round(location.x + size.width / 2),
        y: Math.round(location.y + size.height / 2),
      };
    } catch (error) {
      throw new AppiumError(
        `Failed to get element center: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async isKeyboardShown(): Promise<boolean> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.isKeyboardShown();
    } catch (error) {
      // Some drivers don't support this method, so we'll try alternative approaches
      try {
        // Try to detect keyboard by looking for common keyboard elements
        const pageSource = await this.getPageSource();
        return (
          pageSource.toLowerCase().includes("keyboard") ||
          pageSource.toLowerCase().includes("inputmethod")
        );
      } catch {
        return false;
      }
    }
  }

  /**
   * Performance and debugging utilities
   */
  async getPerformanceData(
    packageName: string,
    dataType: string,
    dataReadTimeout?: number
  ): Promise<any[]> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getPerformanceData(
        packageName,
        dataType,
        dataReadTimeout
      );
    } catch (error) {
      throw new AppiumError(
        `Failed to get performance data: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getPerformanceDataTypes(): Promise<string[]> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.getPerformanceDataTypes();
    } catch (error) {
      throw new AppiumError(
        `Failed to get performance data types: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async startActivity(
    appPackage: string,
    appActivity: string,
    appWaitPackage?: string,
    appWaitActivity?: string,
    intentAction?: string,
    intentCategory?: string,
    intentFlags?: string,
    optionalIntentArguments?: any,
    dontStopAppOnReset?: boolean
  ): Promise<void> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      await this.driver.startActivity(
        appPackage,
        appActivity,
        appWaitPackage,
        appWaitActivity,
        intentAction,
        intentCategory,
        intentFlags,
        optionalIntentArguments,
        dontStopAppOnReset?.toString()
      );
    } catch (error) {
      throw new AppiumError(
        `Failed to start activity: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Cleanup and resource management
   */
  async cleanup(): Promise<void> {
    try {
      if (this.driver) {
        // Try to clean up any ongoing actions
        try {
          await this.driver.releaseActions();
        } catch {
          // Ignore errors during cleanup
        }

        // Close the session
        await this.closeDriver();
      }
    } catch (error) {
      console.warn("Error during cleanup:", error);
    }
  }

  /**
   * Get driver capabilities for debugging
   */
  async getCapabilities(): Promise<any> {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }

    try {
      return await this.driver.capabilities;
    } catch (error) {
      throw new AppiumError(
        `Failed to get capabilities: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Session information
   */
  getSessionId(): string {
    if (!this.driver) {
      throw new AppiumError("Appium driver not initialized");
    }
    return this.driver.sessionId;
  }

  isDriverInitialized(): boolean {
    return this.driver !== null;
  }
}

// Export additional types and utilities
export { W3CAction, W3CPointerAction, W3CKeyAction, W3CWheelAction };

// Default export
export default AppiumHelper;
