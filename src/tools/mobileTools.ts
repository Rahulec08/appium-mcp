import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  AppiumHelper,
  AppiumCapabilities,
} from "../lib/appium/appiumHelper.js";
import * as fs from "fs/promises";

// Shared Appium instance for reuse across tool calls
let appiumHelper: AppiumHelper | null = null;

/**
 * Get the Appium helper, validating the session if it exists
 * This is a utility function to centralize session validation and recovery
 *
 * @returns The existing and validated appiumHelper or null if not initialized
 */
async function getValidAppiumHelper(): Promise<AppiumHelper | null> {
  if (!appiumHelper) {
    return null;
  }

  try {
    // Validate the session and attempt recovery if needed
    const isSessionValid = await appiumHelper.validateSession();
    if (!isSessionValid) {
      console.error(
        "Appium session validation failed and could not be recovered automatically"
      );
      return null;
    }
    return appiumHelper;
  } catch (error) {
    console.error(
      "Error validating Appium session:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Register mobile automation tools with the MCP server
 */
export function registerMobileTools(server: McpServer) {
  // Tool: Initialize Appium driver
  server.tool(
    "initialize-appium",
    "Initialize an Appium driver session for mobile automation",
    {
      platformName: z
        .enum(["Android", "iOS"])
        .describe("The mobile platform to automate"),
      deviceName: z.string().describe("The name of the device to target"),
      udid: z
        .string()
        .optional()
        .describe("Device unique identifier (required for real devices)"),
      app: z
        .string()
        .optional()
        .describe("Path to the app to install (optional)"),
      appPackage: z.string().optional().describe("App package name (Android)"),
      appActivity: z
        .string()
        .optional()
        .describe("App activity name to launch (Android)"),
      bundleId: z.string().optional().describe("Bundle identifier (iOS)"),
      automationName: z
        .enum(["UiAutomator2", "XCUITest"])
        .optional()
        .describe("Automation engine to use"),
      noReset: z
        .boolean()
        .optional()
        .describe("Preserve app state between sessions"),
      fullReset: z
        .boolean()
        .optional()
        .describe("Perform a full reset (uninstall app before starting)"),
      appiumUrl: z.string().optional().describe("URL of the Appium server"),
      screenshotDir: z
        .string()
        .optional()
        .describe("Directory to save screenshots"),
    },
    async (params) => {
      try {
        // If there's an existing session, try to close it first
        if (appiumHelper) {
          try {
            await appiumHelper.closeDriver();
          } catch (error) {
            console.warn(
              "Error closing existing Appium session:",
              error instanceof Error ? error.message : String(error)
            );
          }
        }

        // Create capabilities object from parameters
        const capabilities: AppiumCapabilities = {
          platformName: params.platformName,
          deviceName: params.deviceName,
        };

        // Add optional capabilities
        if (params.udid) capabilities.udid = params.udid;
        if (params.app) capabilities.app = params.app;
        if (params.appPackage) capabilities.appPackage = params.appPackage;
        if (params.appActivity) capabilities.appActivity = params.appActivity;
        if (params.bundleId) capabilities.bundleId = params.bundleId;
        if (params.automationName)
          capabilities.automationName = params.automationName;
        if (params.noReset !== undefined) capabilities.noReset = params.noReset;
        if (params.fullReset !== undefined)
          capabilities.fullReset = params.fullReset;

        // Set default automation based on platform if not specified
        if (!capabilities.automationName) {
          capabilities.automationName =
            params.platformName === "Android" ? "UiAutomator2" : "XCUITest";
        }

        // Create and initialize Appium helper
        appiumHelper = new AppiumHelper(
          params.screenshotDir || "./screenshots"
        );
        await appiumHelper.initializeDriver(capabilities, params.appiumUrl);

        return {
          content: [
            {
              type: "text",
              text: `Successfully initialized Appium session for ${params.platformName} device: ${params.deviceName}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error initializing Appium session: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Close Appium driver session
  server.tool(
    "close-appium",
    "Close the current Appium driver session",
    {},
    async () => {
      try {
        if (!appiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session to close.",
              },
            ],
          };
        }

        await appiumHelper.closeDriver();
        appiumHelper = null;

        return {
          content: [
            {
              type: "text",
              text: "Successfully closed Appium session.",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error closing Appium session: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Take screenshot using Appium
  server.tool(
    "appium-screenshot",
    "Take a screenshot using Appium",
    {
      name: z.string().describe("Base name for the screenshot file"),
    },
    async ({ name }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const screenshotPath = await validAppiumHelper.takeScreenshot(name);

        return {
          content: [
            {
              type: "text",
              text: `Screenshot saved to: ${screenshotPath}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error taking screenshot: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Tap on element
  server.tool(
    "tap-element",
    "Tap on a UI element identified by a selector",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        console.log(
          `MCP server: Attempting to tap element with selector "${selector}" using strategy "${
            strategy || "xpath"
          }"`
        );

        // Direct Approach: Find the element and click it directly
        try {
          const element = await validAppiumHelper.findElement(
            selector,
            strategy || "xpath"
          );

          console.log("MCP server: Element found, attempting direct click");
          await element.waitForClickable({ timeout: 5000 });
          await element.click();

          console.log("MCP server: Direct element click successful");
          return {
            content: [
              {
                type: "text",
                text: `Successfully tapped on element: ${selector}`,
              },
            ],
          };
        } catch (clickError) {
          console.log(
            `MCP server: Direct click failed: ${
              clickError instanceof Error
                ? clickError.message
                : String(clickError)
            }`
          );

          // Fallback 1: Try using AppiumHelper.tapElement which has its own implementation
          try {
            console.log(
              "MCP server: Attempting tap using AppiumHelper.tapElement"
            );
            const success = await validAppiumHelper.tapElement(
              selector,
              strategy || "xpath"
            );

            if (success) {
              console.log("MCP server: AppiumHelper.tapElement successful");
              return {
                content: [
                  {
                    type: "text",
                    text: `Successfully tapped on element: ${selector} using tapElement method`,
                  },
                ],
              };
            }
          } catch (tapError) {
            console.log(
              `MCP server: tapElement method failed: ${
                tapError instanceof Error ? tapError.message : String(tapError)
              }`
            );
          }

          // Fallback 2: Try using touchAction directly with coordinates
          try {
            console.log("MCP server: Attempting touchAction as final fallback");
            const element = await validAppiumHelper.findElement(
              selector,
              strategy || "xpath"
            );

            const location = await element.getLocation();
            const size = await element.getSize();

            // Click in the center of the element
            const x = location.x + size.width / 2;
            const y = location.y + size.height / 2;

            console.log(
              `MCP server: Using touchAction at coordinates (${x}, ${y})`
            );
            await validAppiumHelper
              .getDriver()
              .touchAction([{ action: "press", x, y }, { action: "release" }]);

            console.log("MCP server: TouchAction successful");
            return {
              content: [
                {
                  type: "text",
                  text: `Successfully tapped on element: ${selector} (using touch coordinates)`,
                },
              ],
            };
          } catch (touchError) {
            console.log(
              `MCP server: TouchAction failed: ${
                touchError instanceof Error
                  ? touchError.message
                  : String(touchError)
              }`
            );
            throw touchError;
          }
        }
      } catch (error: any) {
        console.log(`MCP server: All tap attempts failed: ${error?.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error tapping element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Send keys to element
  server.tool(
    "send-keys",
    "Send text input to a UI element",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      text: z.string().describe("Text to input"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, text, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await validAppiumHelper.sendKeys(
          selector,
          text,
          strategy || "xpath"
        );

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `Successfully sent text to element: ${selector}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Failed to send text to element: ${selector}. Element might not be visible or present.`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error sending text to element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get page source (UI XML)
  server.tool(
    "get-page-source",
    "Get the XML representation of the current UI",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const source = await validAppiumHelper.getPageSource();

        return {
          content: [
            {
              type: "text",
              text: `UI Source XML:\n${source}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving page source: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Swipe on screen
  server.tool(
    "swipe",
    "Perform a swipe gesture on the screen",
    {
      startX: z.number().describe("Starting X coordinate"),
      startY: z.number().describe("Starting Y coordinate"),
      endX: z.number().describe("Ending X coordinate"),
      endY: z.number().describe("Ending Y coordinate"),
      duration: z
        .number()
        .optional()
        .describe("Duration of the swipe in milliseconds (default: 800)"),
    },
    async ({ startX, startY, endX, endY, duration }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await validAppiumHelper.swipe(
          startX,
          startY,
          endX,
          endY,
          duration || 800
        );

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `Successfully performed swipe from (${startX},${startY}) to (${endX},${endY})`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Failed to perform swipe gesture`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing swipe: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Wait for element
  server.tool(
    "wait-for-element",
    "Wait for an element to be visible on screen",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ selector, strategy, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await validAppiumHelper.waitForElement(
          selector,
          strategy || "xpath",
          timeoutMs || 10000
        );

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `Element ${selector} is now visible`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Timed out waiting for element: ${selector}`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error waiting for element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Long press on element
  server.tool(
    "long-press",
    "Perform a long press gesture on an element",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      duration: z
        .number()
        .optional()
        .describe("Duration of the long press in milliseconds (default: 1000)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, duration, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await validAppiumHelper.longPress(
          selector,
          duration || 1000,
          strategy || "xpath"
        );

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `Successfully performed long press on element: ${selector}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Failed to perform long press on element: ${selector}`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing long press: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Scroll to element
  server.tool(
    "scroll-to-element",
    "Scroll until an element becomes visible",
    {
      selector: z
        .string()
        .describe("Element selector to scroll to (e.g., xpath)"),
      direction: z
        .enum(["up", "down", "left", "right"])
        .optional()
        .describe("Direction to scroll (default: down)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
      maxScrolls: z
        .number()
        .optional()
        .describe("Maximum number of scroll attempts (default: 10)"),
    },
    async ({ selector, direction, strategy, maxScrolls }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await validAppiumHelper.scrollToElement(
          selector,
          strategy || "xpath",
          maxScrolls || 10
        );

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `Successfully scrolled to element: ${selector}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Failed to find element: ${selector} after scrolling`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error scrolling to element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get device orientation
  server.tool(
    "get-orientation",
    "Get the current device orientation",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const orientation = await validAppiumHelper.getOrientation();

        return {
          content: [
            {
              type: "text",
              text: `Current device orientation: ${orientation}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting device orientation: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Set device orientation
  server.tool(
    "set-orientation",
    "Set the device orientation",
    {
      orientation: z
        .enum(["PORTRAIT", "LANDSCAPE"])
        .describe("Desired orientation: PORTRAIT or LANDSCAPE"),
    },
    async ({ orientation }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.setOrientation(
          orientation as "PORTRAIT" | "LANDSCAPE"
        );

        return {
          content: [
            {
              type: "text",
              text: `Successfully set device orientation to: ${orientation}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting device orientation: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Hide keyboard
  server.tool(
    "hide-keyboard",
    "Hide the keyboard if it's currently visible",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.hideKeyboard();

        return {
          content: [
            {
              type: "text",
              text: "Keyboard hidden successfully",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error hiding keyboard: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get current app package
  server.tool(
    "get-current-package",
    "Get the current active app package name",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const packageName = await validAppiumHelper.getCurrentPackage();

        return {
          content: [
            {
              type: "text",
              text: `Current app package: ${packageName}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting current package: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get current activity (Android only)
  server.tool(
    "get-current-activity",
    "Get the current Android activity name",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const activity = await validAppiumHelper.getCurrentActivity();

        return {
          content: [
            {
              type: "text",
              text: `Current activity: ${activity}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting current activity: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Launch app
  server.tool(
    "launch-appium-app",
    "Launch the app associated with the current Appium session",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.launchApp();

        return {
          content: [
            {
              type: "text",
              text: "App launched successfully",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error launching app: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Close app
  server.tool(
    "close-app",
    "Close the app associated with the current Appium session",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.closeApp();

        return {
          content: [
            {
              type: "text",
              text: "App closed successfully",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error closing app: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Reset app
  server.tool(
    "reset-app",
    "Reset the app (terminate and relaunch) associated with the current Appium session",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.resetApp();

        return {
          content: [
            {
              type: "text",
              text: "App reset successfully",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error resetting app: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get device time
  server.tool(
    "get-device-time",
    "Get the current device time",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const time = await validAppiumHelper.getDeviceTime();

        return {
          content: [
            {
              type: "text",
              text: `Current device time: ${time}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting device time: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Lock device
  server.tool(
    "lock-device",
    "Lock the device screen",
    {
      durationSec: z
        .number()
        .optional()
        .describe("Duration in seconds to lock the device for"),
    },
    async ({ durationSec }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.lockDevice(durationSec);

        return {
          content: [
            {
              type: "text",
              text: durationSec
                ? `Device locked for ${durationSec} seconds`
                : "Device locked",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error locking device: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Check if device is locked
  server.tool(
    "is-device-locked",
    "Check if the device is currently locked",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const isLocked = await validAppiumHelper.isDeviceLocked();

        return {
          content: [
            {
              type: "text",
              text: isLocked ? "Device is locked" : "Device is unlocked",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error checking device lock state: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Unlock device
  server.tool("unlock-device", "Unlock the device screen", {}, async () => {
    try {
      const validAppiumHelper = await getValidAppiumHelper();
      if (!validAppiumHelper) {
        return {
          content: [
            {
              type: "text",
              text: "No active Appium session. Initialize one first with initialize-appium.",
            },
          ],
        };
      }

      await validAppiumHelper.unlockDevice();

      return {
        content: [
          {
            type: "text",
            text: "Device unlocked successfully",
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error unlocking device: ${error.message}`,
          },
        ],
      };
    }
  });

  // Tool: Press key code (Android only)
  server.tool(
    "press-key-code",
    "Press an Android key code",
    {
      keycode: z.number().describe("Android keycode to press"),
    },
    async ({ keycode }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.pressKeyCode(keycode);

        return {
          content: [
            {
              type: "text",
              text: `Successfully pressed key code: ${keycode}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error pressing key code: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Open notifications (Android only)
  server.tool(
    "open-notifications",
    "Open the notifications panel (Android only)",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.openNotifications();

        return {
          content: [
            {
              type: "text",
              text: "Notifications panel opened successfully",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error opening notifications: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get available contexts
  server.tool(
    "get-contexts",
    "Get all available contexts (NATIVE_APP, WEBVIEW, etc.)",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const contexts = await validAppiumHelper.getContexts();

        return {
          content: [
            {
              type: "text",
              text: `Available contexts: ${contexts.join(", ")}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting contexts: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Switch context
  server.tool(
    "switch-context",
    "Switch between contexts (e.g., NATIVE_APP, WEBVIEW)",
    {
      context: z.string().describe("Context to switch to"),
    },
    async ({ context }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.switchContext(context);

        return {
          content: [
            {
              type: "text",
              text: `Successfully switched to context: ${context}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error switching context: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get current context
  server.tool(
    "get-current-context",
    "Get the current context",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const context = await validAppiumHelper.getCurrentContext();

        return {
          content: [
            {
              type: "text",
              text: `Current context: ${context}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting current context: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Pull file from device
  server.tool(
    "pull-file",
    "Pull a file from the device",
    {
      path: z.string().describe("Path to the file on the device"),
    },
    async ({ path }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const fileContent = await validAppiumHelper.pullFile(path);

        return {
          content: [
            {
              type: "text",
              text: `Successfully pulled file from ${path}. Content length: ${fileContent.length} bytes.`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error pulling file: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Push file to device
  server.tool(
    "push-file",
    "Push a file to the device",
    {
      path: z.string().describe("Path on the device to write the file"),
      data: z.string().describe("Base64-encoded file content"),
    },
    async ({ path, data }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.pushFile(path, data);

        return {
          content: [
            {
              type: "text",
              text: `Successfully pushed file to ${path}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error pushing file: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get battery info
  server.tool(
    "get-battery-info",
    "Get the device battery information",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const batteryInfo = await validAppiumHelper.getBatteryInfo();

        return {
          content: [
            {
              type: "text",
              text: `Battery level: ${batteryInfo.level * 100}%, State: ${
                batteryInfo.state
              } (0: unknown, 1: charging, 2: discharging, 3: not charging, 4: full)`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting battery info: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Check if element exists
  server.tool(
    "element-exists",
    "Check if an element exists on the current page",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const exists = await validAppiumHelper.elementExists(
          selector,
          strategy || "xpath"
        );

        return {
          content: [
            {
              type: "text",
              text: exists
                ? `Element exists: ${selector}`
                : `Element does not exist: ${selector}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error checking if element exists: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: List iOS Simulators
  server.tool(
    "list-ios-simulators",
    "Get list of available iOS simulators",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const simulators = await validAppiumHelper.getIosSimulators();

        // Format the simulators list in a readable way
        const formattedList = Object.entries(simulators)
          .map(([iosVersion, devices]) => {
            const deviceList = devices
              .map(
                (device: any) =>
                  `  - ${device.name} (${device.udid})${
                    device.isAvailable ? "" : " [unavailable]"
                  }`
              )
              .join("\n");
            return `iOS ${iosVersion}:\n${deviceList}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Available iOS Simulators:\n\n${formattedList}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing iOS simulators: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Find element by iOS predicate string
  server.tool(
    "find-by-ios-predicate",
    "Find an element using iOS predicate string (iOS only)",
    {
      predicateString: z
        .string()
        .describe("iOS predicate string (e.g., 'name == \"Login\"')"),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ predicateString, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Try to find the element to verify it exists
        await validAppiumHelper.findByIosPredicate(
          predicateString,
          timeoutMs || 10000
        );

        return {
          content: [
            {
              type: "text",
              text: `Element found with predicate: ${predicateString}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error finding element by iOS predicate: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Find element by iOS class chain
  server.tool(
    "find-by-ios-class-chain",
    "Find an element using iOS class chain (iOS only)",
    {
      classChain: z
        .string()
        .describe(
          "iOS class chain (e.g., '**/XCUIElementTypeButton[`name == \"Login\"`]')"
        ),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ classChain, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Try to find the element to verify it exists
        await validAppiumHelper.findByIosClassChain(
          classChain,
          timeoutMs || 10000
        );

        return {
          content: [
            {
              type: "text",
              text: `Element found with class chain: ${classChain}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error finding element by iOS class chain: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Tap on element by iOS predicate string
  server.tool(
    "tap-by-ios-predicate",
    "Tap on an element using iOS predicate string (iOS only)",
    {
      predicateString: z
        .string()
        .describe("iOS predicate string (e.g., 'name == \"Login\"')"),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ predicateString, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Find the element and tap on it
        const element = await validAppiumHelper.findByIosPredicate(
          predicateString,
          timeoutMs || 10000
        );

        await element.click();

        return {
          content: [
            {
              type: "text",
              text: `Successfully tapped on element with predicate: ${predicateString}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error tapping element by iOS predicate: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Tap on element by iOS class chain
  server.tool(
    "tap-by-ios-class-chain",
    "Tap on an element using iOS class chain (iOS only)",
    {
      classChain: z
        .string()
        .describe(
          "iOS class chain (e.g., '**/XCUIElementTypeButton[`name == \"Login\"`]')"
        ),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ classChain, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Find the element and tap on it
        const element = await validAppiumHelper.findByIosClassChain(
          classChain,
          timeoutMs || 10000
        );

        await element.click();

        return {
          content: [
            {
              type: "text",
              text: `Successfully tapped on element with class chain: ${classChain}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error tapping element by iOS class chain: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Send keys to element by iOS predicate string
  server.tool(
    "send-keys-by-ios-predicate",
    "Send text to an element using iOS predicate string (iOS only)",
    {
      predicateString: z
        .string()
        .describe(
          "iOS predicate string (e.g., 'type == \"XCUIElementTypeTextField\"')"
        ),
      text: z.string().describe("Text to input"),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ predicateString, text, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Find the element and send keys
        const element = await validAppiumHelper.findByIosPredicate(
          predicateString,
          timeoutMs || 10000
        );

        await element.setValue(text);

        return {
          content: [
            {
              type: "text",
              text: `Successfully sent text to element with predicate: ${predicateString}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error sending text to element by iOS predicate: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Send keys to element by iOS class chain
  server.tool(
    "send-keys-by-ios-class-chain",
    "Send text to an element using iOS class chain (iOS only)",
    {
      classChain: z
        .string()
        .describe("iOS class chain (e.g., '**/XCUIElementTypeTextField')"),
      text: z.string().describe("Text to input"),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ classChain, text, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Find the element and send keys
        const element = await validAppiumHelper.findByIosClassChain(
          classChain,
          timeoutMs || 10000
        );

        await element.setValue(text);

        return {
          content: [
            {
              type: "text",
              text: `Successfully sent text to element with class chain: ${classChain}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error sending text to element by iOS class chain: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Perform Touch ID (iOS only)
  server.tool(
    "perform-touch-id",
    "Simulate Touch ID fingerprint (iOS only)",
    {
      match: z
        .boolean()
        .describe(
          "Whether the fingerprint should match (true) or not match (false)"
        ),
    },
    async ({ match }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.performTouchId(match);

        return {
          content: [
            {
              type: "text",
              text: match
                ? "Successfully simulated matching Touch ID fingerprint"
                : "Successfully simulated non-matching Touch ID fingerprint",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing Touch ID: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Shake device (iOS only)
  server.tool(
    "shake-device",
    "Simulate shake gesture (iOS only)",
    {},
    async () => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.shakeDevice();

        return {
          content: [
            {
              type: "text",
              text: "Successfully simulated shake gesture",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing shake gesture: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Start screen recording
  server.tool(
    "start-recording",
    "Start recording the screen",
    {
      videoType: z.string().optional().describe("Video format type (optional)"),
      timeLimit: z
        .number()
        .optional()
        .describe("Maximum recording duration in seconds (optional)"),
      videoQuality: z
        .string()
        .optional()
        .describe("Video quality: 'low', 'medium', or 'high' (optional)"),
      videoFps: z.number().optional().describe("Frames per second (optional)"),
    },
    async ({ videoType, timeLimit, videoQuality, videoFps }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const options = {
          videoType,
          timeLimit,
          videoQuality,
          videoFps,
        };

        await validAppiumHelper.startRecording(options);

        return {
          content: [
            {
              type: "text",
              text: "Screen recording started successfully",
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error starting screen recording: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Stop screen recording
  server.tool(
    "stop-recording",
    "Stop recording the screen and get the recording data",
    {
      outputPath: z.string().describe("File path to save the recording"),
    },
    async ({ outputPath }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const base64Data = await validAppiumHelper.stopRecording();

        // Save the recording to the specified file
        const buffer = Buffer.from(base64Data, "base64");
        await fs.writeFile(outputPath, buffer);

        return {
          content: [
            {
              type: "text",
              text: `Screen recording saved to: ${outputPath}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error stopping screen recording: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Execute custom mobile command
  server.tool(
    "execute-mobile-command",
    "Execute a custom mobile command for iOS or Android",
    {
      command: z
        .string()
        .describe("Mobile command name (without 'mobile:' prefix)"),
      args: z.any().optional().describe("Arguments for the command (optional)"),
    },
    async ({ command, args }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const result = await validAppiumHelper.executeMobileCommand(
          command,
          args || []
        );

        // Convert the result to a string for display
        const resultStr =
          typeof result === "object"
            ? JSON.stringify(result, null, 2)
            : String(result);

        return {
          content: [
            {
              type: "text",
              text: `Mobile command executed successfully.\nResult: ${resultStr}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing mobile command: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get text from element
  server.tool(
    "get-element-text",
    "Get text content from a UI element",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const text = await validAppiumHelper.getText(
          selector,
          strategy || "xpath"
        );

        return {
          content: [
            {
              type: "text",
              text: `Text from element: ${text}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting text from element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Send keys to device (without focusing on an element)
  server.tool(
    "send-keys-to-device",
    "Send keys directly to the device without focusing on any element",
    {
      text: z.string().describe("Text to send"),
    },
    async ({ text }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.sendKeysToDevice(text);

        return {
          content: [
            {
              type: "text",
              text: `Successfully sent keys to device: ${text}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error sending keys to device: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Send key event
  server.tool(
    "send-key-event",
    "Send a key event to the device (e.g., HOME, BACK)",
    {
      keyEvent: z
        .union([z.string(), z.number()])
        .describe("Key event name or code"),
    },
    async ({ keyEvent }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.sendKeyEvent(keyEvent);

        return {
          content: [
            {
              type: "text",
              text: `Successfully sent key event: ${keyEvent}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error sending key event: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Clear element
  server.tool(
    "clear-element",
    "Clear text from an input element",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.clearElement(selector, strategy || "xpath");

        return {
          content: [
            {
              type: "text",
              text: `Successfully cleared element: ${selector}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error clearing element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Scroll screen in a specific direction
  server.tool(
    "scroll-screen",
    "Scroll the screen in a specified direction",
    {
      direction: z
        .enum(["up", "down", "left", "right"])
        .describe("Direction to scroll"),
      distance: z
        .number()
        .optional()
        .describe("Distance to scroll as a percentage (0.0-1.0, default: 0.5)"),
    },
    async ({ direction, distance }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        await validAppiumHelper.scrollScreen(
          direction as "up" | "down" | "left" | "right",
          distance || 0.5
        );

        return {
          content: [
            {
              type: "text",
              text: `Successfully scrolled screen ${direction}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error scrolling screen: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get element attributes (inspector functionality)
  server.tool(
    "get-element-attributes",
    "Get all available attributes of an element",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const attributes = await validAppiumHelper.getElementAttributes(
          selector,
          strategy || "xpath"
        );

        return {
          content: [
            {
              type: "text",
              text: `Element attributes:\n${JSON.stringify(
                attributes,
                null,
                2
              )}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting element attributes: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Inspect element (comprehensive element analysis for debugging)
  server.tool(
    "inspect-element",
    "Get detailed information about an element (for debugging)",
    {
      selector: z.string().describe("Element selector (e.g., xpath, id)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const info = await validAppiumHelper.inspectElement(
          selector,
          strategy || "xpath"
        );

        return {
          content: [
            {
              type: "text",
              text: `Element inspection:\n${JSON.stringify(info, null, 2)}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error inspecting element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get element tree (Appium inspector functionality)
  server.tool(
    "get-element-tree",
    "Get a hierarchical view of the UI elements (similar to Appium Inspector)",
    {
      maxDepth: z
        .number()
        .optional()
        .describe("Maximum depth to traverse in the element tree (default: 5)"),
    },
    async ({ maxDepth }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const tree = await validAppiumHelper.getElementTree();

        return {
          content: [
            {
              type: "text",
              text: `UI Element Tree:\n${JSON.stringify(tree, null, 2)}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting element tree: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Check if text exists in screen
  server.tool(
    "has-text-in-screen",
    "Check if specific text exists anywhere on the current screen",
    {
      text: z.string().describe("Text to search for"),
    },
    async ({ text }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const exists = await validAppiumHelper.hasTextInSource(text);

        return {
          content: [
            {
              type: "text",
              text: exists
                ? `Text "${text}" was found on the screen`
                : `Text "${text}" was not found on the screen`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error checking for text on screen: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Find elements by text
  server.tool(
    "find-elements-by-text",
    "Find all elements containing specific text",
    {
      text: z.string().describe("Text to search for"),
    },
    async ({ text }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const elements = await validAppiumHelper.findElementsByText(text);

        if (elements.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No elements found containing text "${text}"`,
              },
            ],
          };
        }

        // Get basic info about each element - fix Promise handling
        const elementsInfoPromises = [];

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          elementsInfoPromises.push(
            (async () => {
              try {
                const elementText = await element.getText();
                // Use getSize and getLocation methods instead of getRect
                let location = null;
                let size = null;
                try {
                  location = await element.getLocation();
                  size = await element.getSize();
                } catch (e) {
                  // Some WebdriverIO versions or element types might not support these methods
                }

                return {
                  index: i,
                  text: elementText,
                  location,
                  size,
                };
              } catch {
                return { index: i, text: "[Failed to get element info]" };
              }
            })()
          );
        }

        // Now elementsInfoPromises is properly an array of promises
        const elementsInfo = await Promise.all(elementsInfoPromises);

        return {
          content: [
            {
              type: "text",
              text: `Found ${
                elements.length
              } elements containing text "${text}":\n${JSON.stringify(
                elementsInfo,
                null,
                2
              )}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error finding elements by text: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Tap on element containing text
  server.tool(
    "tap-element-by-text",
    "Tap on an element containing specific text",
    {
      text: z.string().describe("Text contained in the element to tap"),
    },
    async ({ text }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const elements = await validAppiumHelper.findElementsByText(text);

        if (elements.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No elements found containing text "${text}"`,
              },
            ],
          };
        }

        // Tap the first matching element
        await elements[0].click();

        return {
          content: [
            {
              type: "text",
              text: `Successfully tapped on element containing text "${text}"`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error tapping element by text: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Generate all possible locators for an element
  server.tool(
    "generate-element-locators",
    "Generate multiple types of locators for an element",
    {
      selector: z
        .string()
        .describe("Base selector to find the element (e.g., xpath)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Base selector strategy: xpath, id, accessibility id, class name (default: xpath)"
        ),
    },
    async ({ selector, strategy }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Find the element using the provided selector
        const element = await validAppiumHelper.findElement(
          selector,
          strategy || "xpath"
        );

        if (!element) {
          return {
            content: [
              {
                type: "text",
                text: `Element not found using ${
                  strategy || "xpath"
                }: ${selector}`,
              },
            ],
          };
        }

        // Get all attributes of the element
        const attributes = await validAppiumHelper.getElementAttributes(
          selector,
          strategy || "xpath"
        );

        // Define interfaces to fix the type errors
        interface XPathLocators {
          absolute: string;
          relative: string[];
        }

        interface ElementLocators {
          xpath: XPathLocators;
          id: string | null;
          accessibilityId: string | null;
          className: string | null;
          name: string | null;
          text: string | null;
          androidUIAutomator: string | null;
          iOSPredicate: string | null;
          iOSClassChain: string | null;
        }

        // Generate different types of locators with proper typing
        const locators: ElementLocators = {
          xpath: {
            absolute: "",
            relative: [],
          },
          id: null,
          accessibilityId: null,
          className: null,
          name: null,
          text: null,
          androidUIAutomator: null,
          iOSPredicate: null,
          iOSClassChain: null,
        };

        // Get the element's XPath
        try {
          // The absolute XPath is the most reliable but also the most brittle
          locators.xpath.absolute = await element.getAttribute("xpath");
        } catch (error) {
          // Some versions of Appium might not support direct XPath attribute
        }

        // Generate a relative XPath using attributes
        if (attributes.text) {
          locators.xpath.relative.push(
            `//*[contains(@text, '${attributes.text}')]`
          );
          locators.text = attributes.text;
        }

        if (attributes.content_desc) {
          locators.xpath.relative.push(
            `//*[@content-desc='${attributes.content_desc}']`
          );
          locators.accessibilityId = attributes.content_desc;
        }

        if (attributes.resource_id) {
          locators.xpath.relative.push(
            `//*[@resource-id='${attributes.resource_id}']`
          );
          locators.id = attributes.resource_id;
        }

        if (attributes.class) {
          locators.xpath.relative.push(`//*[@class='${attributes.class}']`);
          locators.className = attributes.class;
        }

        if (attributes.name) {
          locators.xpath.relative.push(`//*[@name='${attributes.name}']`);
          locators.name = attributes.name;
        }

        // Android UI Automator (for Android)
        if (
          attributes.resource_id ||
          attributes.text ||
          attributes.content_desc
        ) {
          let uiAutomator = "new UiSelector()";

          if (attributes.resource_id) {
            uiAutomator += `.resourceId("${attributes.resource_id}")`;
          }

          if (attributes.text) {
            uiAutomator += `.text("${attributes.text}")`;
          }

          if (attributes.content_desc) {
            uiAutomator += `.description("${attributes.content_desc}")`;
          }

          locators.androidUIAutomator = uiAutomator;
        }

        // iOS Predicate String (for iOS)
        if (attributes.name || attributes.label || attributes.value) {
          const predicates = [];

          if (attributes.name) {
            predicates.push(`name == '${attributes.name}'`);
          }

          if (attributes.label) {
            predicates.push(`label == '${attributes.label}'`);
          }

          if (attributes.value) {
            predicates.push(`value == '${attributes.value}'`);
          }

          if (attributes.type) {
            predicates.push(`type == '${attributes.type}'`);
          }

          locators.iOSPredicate = predicates.join(" AND ");
        }

        // iOS Class Chain (for iOS)
        if (attributes.type) {
          let classChain = `**/`;

          if (attributes.type) {
            classChain += `${attributes.type}`;
          } else {
            classChain += "XCUIElementTypeAny";
          }

          const predicates = [];

          if (attributes.name) {
            predicates.push(`name == '${attributes.name}'`);
          }

          if (attributes.label) {
            predicates.push(`label == '${attributes.label}'`);
          }

          if (attributes.value) {
            predicates.push(`value == '${attributes.value}'`);
          }

          if (predicates.length > 0) {
            classChain += `[\`${predicates.join(" AND ")}\`]`;
          }

          locators.iOSClassChain = classChain;
        }

        // Filter out empty/null locators
        const finalLocators = Object.fromEntries(
          Object.entries(locators).filter(([, value]) => {
            if (value === null) return false;
            if (typeof value === "object" && Object.keys(value).length === 0)
              return false;
            if (Array.isArray(value) && value.length === 0) return false;
            if (
              typeof value === "object" &&
              "absolute" in value &&
              "relative" in value &&
              value.absolute === "" &&
              value.relative.length === 0
            )
              return false;
            return true;
          })
        );

        return {
          content: [
            {
              type: "text",
              text: `Generated locators for the element:\n\n${JSON.stringify(
                finalLocators,
                null,
                2
              )}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating locators: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Perform action on element
  server.tool(
    "perform-element-action",
    "Perform a specific action on an element using various locator strategies",
    {
      action: z
        .enum([
          "tap",
          "longPress",
          "sendKeys",
          "clear",
          "getAttribute",
          "isDisplayed",
          "isEnabled",
          "waitForVisible",
          "waitForInvisible",
          "swipe",
        ])
        .describe("The action to perform on the element"),
      locatorType: z
        .enum([
          "xpath",
          "id",
          "accessibilityId",
          "classname",
          "name",
          "text",
          "androidUIAutomator",
          "iOSPredicate",
          "iOSClassChain",
        ])
        .describe("The type of locator to use"),
      locatorValue: z.string().describe("The value of the locator"),
      actionParams: z
        .record(z.any())
        .optional()
        .describe(
          "Additional parameters for the action (e.g., text for sendKeys)"
        ),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ action, locatorType, locatorValue, actionParams, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Convert the locator type to a strategy and selector format that Appium can use
        let strategy: string = "xpath";
        let selector: string = locatorValue;

        switch (locatorType) {
          case "id":
            strategy = "id";
            break;
          case "accessibilityId":
            strategy = "accessibility id";
            break;
          case "classname":
            strategy = "class name";
            break;
          case "name":
            strategy = "name";
            break;
          case "text":
            strategy = "xpath";
            selector = `//*[contains(@text, '${locatorValue}')]`;
            break;
          case "androidUIAutomator":
            strategy = "-android uiautomator";
            break;
          case "iOSPredicate":
            strategy = "-ios predicate string";
            break;
          case "iOSClassChain":
            strategy = "-ios class chain";
            break;
        }

        // Locate the element
        let element;
        try {
          element = await validAppiumHelper.findElement(
            selector,
            strategy,
            timeoutMs || 10000
          );
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find element with ${locatorType}: ${locatorValue}. Error: ${
                  error?.message || String(error)
                }`,
              },
            ],
          };
        }

        if (!element) {
          return {
            content: [
              {
                type: "text",
                text: `Element not found with ${locatorType}: ${locatorValue}`,
              },
            ],
          };
        }

        // Perform the requested action
        let result: string;

        switch (action) {
          case "tap":
            await element.click();
            result = "Element tapped successfully";
            break;

          case "longPress":
            const duration = actionParams?.duration || 1000;
            await validAppiumHelper.longPress(selector, duration, strategy);
            result = `Long press performed on element for ${duration}ms`;
            break;

          case "sendKeys":
            if (!actionParams?.text) {
              return {
                content: [
                  {
                    type: "text",
                    text: "sendKeys action requires 'text' parameter",
                  },
                ],
              };
            }
            await element.setValue(actionParams.text);
            result = `Text sent to element: "${actionParams.text}"`;
            break;

          case "clear":
            await element.setValue("");
            result = "Element cleared successfully";
            break;

          case "getAttribute":
            if (!actionParams?.attribute) {
              return {
                content: [
                  {
                    type: "text",
                    text: "getAttribute action requires 'attribute' parameter",
                  },
                ],
              };
            }
            const attributeValue = await element.getAttribute(
              actionParams.attribute
            );
            result = `Attribute "${actionParams.attribute}" value: ${attributeValue}`;
            break;

          case "isDisplayed":
            const isDisplayed = await element.isDisplayed();
            result = `Element is ${
              isDisplayed ? "displayed" : "not displayed"
            }`;
            break;

          case "isEnabled":
            const isEnabled = await element.isEnabled();
            result = `Element is ${isEnabled ? "enabled" : "not enabled"}`;
            break;

          case "waitForVisible":
            await element.waitForDisplayed({
              timeout: actionParams?.timeout || 10000,
              reverse: false,
            });
            result = "Element is now visible";
            break;

          case "waitForInvisible":
            await element.waitForDisplayed({
              timeout: actionParams?.timeout || 10000,
              reverse: true,
            });
            result = "Element is now invisible";
            break;

          case "swipe":
            if (!actionParams?.direction) {
              return {
                content: [
                  {
                    type: "text",
                    text: "swipe action requires 'direction' parameter ('up', 'down', 'left', 'right')",
                  },
                ],
              };
            }

            const size = await element.getSize();
            const location = await element.getLocation();
            const x = location.x + size.width / 2;
            const y = location.y + size.height / 2;

            const distance = actionParams?.distance || 0.5;
            const windowSize = await validAppiumHelper
              .getDriver()
              .getWindowSize();
            const swipeDistance = Math.min(
              windowSize.width * distance,
              windowSize.height * distance
            );

            let endX = x;
            let endY = y;

            switch (actionParams.direction) {
              case "up":
                endY = y - swipeDistance;
                break;
              case "down":
                endY = y + swipeDistance;
                break;
              case "left":
                endX = x - swipeDistance;
                break;
              case "right":
                endX = x + swipeDistance;
                break;
            }

            await validAppiumHelper.swipe(
              x,
              y,
              endX,
              endY,
              actionParams?.duration || 800
            );
            result = `Swiped ${actionParams.direction} from element`;
            break;

          default:
            return {
              content: [
                {
                  type: "text",
                  text: `Unsupported action: ${action}`,
                },
              ],
            };
        }

        return {
          content: [
            {
              type: "text",
              text: `Action "${action}" performed successfully on element with ${locatorType}: "${locatorValue}"\nResult: ${result}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing ${action} on element: ${
                error?.message || String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Tool: Smart Tap - tries different locator strategies in order
  server.tool(
    "smart-tap",
    "Intelligently tap an element trying different locator strategies in a specific order",
    {
      elementIdentifier: z
        .string()
        .describe("Text, ID, or other identifier for the element"),
      text: z
        .string()
        .optional()
        .describe("Optional text content to use for XPath fallback"),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
    },
    async ({ elementIdentifier, text, timeoutMs }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const timeout = timeoutMs || 10000;
        let success = false;
        let error = null;
        let usedStrategy = "";

        // 1. Try Resource ID first (as ID)
        try {
          console.log(`Trying to find element by ID: ${elementIdentifier}`);
          const exists = await validAppiumHelper.elementExists(
            elementIdentifier,
            "id"
          );
          if (exists) {
            await validAppiumHelper.tapElement(elementIdentifier, "id");
            success = true;
            usedStrategy = "id";
          }
        } catch (err) {
          error = err;
        }

        // 2. Try Accessibility ID if ID failed
        if (!success) {
          try {
            console.log(
              `Trying to find element by accessibility ID: ${elementIdentifier}`
            );
            const exists = await validAppiumHelper.elementExists(
              elementIdentifier,
              "accessibility id"
            );
            if (exists) {
              await validAppiumHelper.tapElement(
                elementIdentifier,
                "accessibility id"
              );
              success = true;
              usedStrategy = "accessibility id";
            }
          } catch (err) {
            error = err;
          }
        }

        // 3. Try Resource ID with xpath if both ID and accessibility ID failed
        if (!success) {
          try {
            const resourceIdXpath = `//*[@resource-id="${elementIdentifier}"]`;
            console.log(
              `Trying to find element by resource-id xpath: ${resourceIdXpath}`
            );
            const exists = await validAppiumHelper.elementExists(
              resourceIdXpath,
              "xpath"
            );
            if (exists) {
              await validAppiumHelper.tapElement(resourceIdXpath, "xpath");
              success = true;
              usedStrategy = "xpath (resource-id)";
            }
          } catch (err) {
            error = err;
          }
        }

        // 4. Try UIAutomator (Android only)
        if (!success) {
          try {
            const uiAutomator = `new UiSelector().resourceId("${elementIdentifier}")`;
            console.log(
              `Trying to find element by UIAutomator: ${uiAutomator}`
            );
            // UIAutomator uses 'android uiautomator' strategy in Appium
            const exists = await validAppiumHelper.elementExists(
              uiAutomator,
              "android uiautomator"
            );
            if (exists) {
              await validAppiumHelper.tapElement(
                uiAutomator,
                "android uiautomator"
              );
              success = true;
              usedStrategy = "android uiautomator";
            }
          } catch (err) {
            error = err;
          }
        }

        // 5. Try with text in XPath as last resort
        if (!success && text) {
          try {
            const textXpath = `//*[contains(@text, "${text}")]`;
            console.log(`Trying to find element by text xpath: ${textXpath}`);
            const exists = await validAppiumHelper.elementExists(
              textXpath,
              "xpath"
            );
            if (exists) {
              await validAppiumHelper.tapElement(textXpath, "xpath");
              success = true;
              usedStrategy = "xpath (text)";
            }
          } catch (err) {
            error = err;
          }
        }

        // If element is still not found, try a more general approach with the element identifier as text
        if (!success) {
          try {
            const generalXpath = `//*[contains(@text, "${elementIdentifier}") or contains(@content-desc, "${elementIdentifier}") or contains(@resource-id, "${elementIdentifier}")]`;
            console.log(`Trying general xpath as last resort: ${generalXpath}`);
            const exists = await validAppiumHelper.elementExists(
              generalXpath,
              "xpath"
            );
            if (exists) {
              await validAppiumHelper.tapElement(generalXpath, "xpath");
              success = true;
              usedStrategy = "xpath (general)";
            }
          } catch (err) {
            error = err;
          }
        }

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `Successfully tapped element using strategy: ${usedStrategy}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Failed to find and tap element with identifier: ${elementIdentifier}. Error: ${
                  error instanceof Error
                    ? error.message
                    : String(error) || "Element not found with any strategy"
                }`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error in smart-tap: ${error?.message || String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Generate element locators and tap
  server.tool(
    "inspect-and-tap",
    "Inspect an element using one locator, then tap using the best available locator",
    {
      selector: z
        .string()
        .describe("Base selector to find the element (e.g., text content)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Initial strategy to locate element: xpath, id, accessibility id, text (default: xpath)"
        ),
      preferredOrder: z
        .array(z.string())
        .optional()
        .describe(
          "Preferred order of locator strategies to try (e.g., ['id', 'accessibilityId', 'xpath'])"
        ),
    },
    async ({ selector, strategy, preferredOrder }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Default locator preference if none provided
        const locatorPriority = preferredOrder || [
          "id",
          "accessibilityId",
          "resourceId",
          "androidUIAutomator",
          "text",
        ];

        // First, find the element using the initial strategy to get its attributes
        let initialStrategy = strategy || "xpath";
        let initialSelector = selector;

        // If strategy is 'text', convert to proper xpath
        if (initialStrategy.toLowerCase() === "text") {
          initialSelector = `//*[contains(@text, "${selector}")]`;
          initialStrategy = "xpath";
        }

        console.log(
          `Finding element with ${initialStrategy}: ${initialSelector}`
        );

        // Find the element and get its attributes
        const attributes = await validAppiumHelper.getElementAttributes(
          initialSelector,
          initialStrategy
        );

        console.log("Element attributes:", JSON.stringify(attributes, null, 2));

        // Now try to tap using the preferred locator strategies in order
        let tapped = false;
        let usedStrategy = "";
        let usedSelector = "";

        for (const locatorType of locatorPriority) {
          if (tapped) break;

          let selector: string | null = null;
          let strategy: string | null = null;

          switch (locatorType) {
            case "id":
              if (attributes.resource_id) {
                selector = attributes.resource_id;
                strategy = "id";
              }
              break;

            case "accessibilityId":
              if (attributes.content_desc) {
                selector = attributes.content_desc;
                strategy = "accessibility id";
              }
              break;

            case "resourceId":
              if (attributes.resource_id) {
                selector = `//*[@resource-id="${attributes.resource_id}"]`;
                strategy = "xpath";
              }
              break;

            case "androidUIAutomator":
              if (
                attributes.resource_id ||
                attributes.text ||
                attributes.content_desc
              ) {
                let uiAutomator = "new UiSelector()";

                if (attributes.resource_id) {
                  uiAutomator += `.resourceId("${attributes.resource_id}")`;
                }

                if (attributes.text) {
                  uiAutomator += `.text("${attributes.text}")`;
                }

                if (attributes.content_desc) {
                  uiAutomator += `.description("${attributes.content_desc}")`;
                }

                selector = uiAutomator;
                strategy = "android uiautomator";
              }
              break;

            case "text":
              if (attributes.text) {
                selector = `//*[contains(@text, "${attributes.text}")]`;
                strategy = "xpath";
              }
              break;
          }

          if (selector && strategy) {
            try {
              console.log(`Attempting to tap with ${strategy}: ${selector}`);
              await validAppiumHelper.tapElement(selector, strategy);
              tapped = true;
              usedStrategy = strategy;
              usedSelector = selector;
            } catch (error) {
              console.log(
                `Failed with ${strategy}: ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
              // Continue to next strategy
            }
          }
        }

        if (tapped) {
          return {
            content: [
              {
                type: "text",
                text: `Successfully tapped element using ${usedStrategy}: ${usedSelector}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Found element but failed to tap with any locator strategy. Try using a more specific selector.`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error inspecting and tapping element: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Perform W3C-standard gesture with Actions API
  server.tool(
    "perform-w3c-gesture",
    "Perform touch gestures using the W3C Actions API (more reliable than TouchAction API)",
    {
      actionType: z
        .enum(["swipe", "tap", "longPress", "dragAndDrop", "pinchZoom"])
        .describe("The type of gesture to perform"),
      startX: z.number().describe("Starting X coordinate"),
      startY: z.number().describe("Starting Y coordinate"),
      endX: z
        .number()
        .optional()
        .describe("Ending X coordinate (for swipe/dragAndDrop)"),
      endY: z
        .number()
        .optional()
        .describe("Ending Y coordinate (for swipe/dragAndDrop)"),
      duration: z
        .number()
        .optional()
        .describe("Duration of the gesture in milliseconds (default: 750)"),
      secondPointStartX: z
        .number()
        .optional()
        .describe(
          "Starting X coordinate for second finger (pinch gestures only)"
        ),
      secondPointStartY: z
        .number()
        .optional()
        .describe(
          "Starting Y coordinate for second finger (pinch gestures only)"
        ),
      secondPointEndX: z
        .number()
        .optional()
        .describe(
          "Ending X coordinate for second finger (pinch gestures only)"
        ),
      secondPointEndY: z
        .number()
        .optional()
        .describe(
          "Ending Y coordinate for second finger (pinch gestures only)"
        ),
    },
    async ({
      actionType,
      startX,
      startY,
      endX,
      endY,
      duration,
      secondPointStartX,
      secondPointStartY,
      secondPointEndX,
      secondPointEndY,
    }) => {
      try {
        const validAppiumHelper = await getValidAppiumHelper();
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        // Set defaults if not provided
        const gestureDuration = duration || 750;

        // Get the driver to execute the actions
        const driver = validAppiumHelper.getDriver();
        let actions;

        switch (actionType) {
          case "swipe": {
            if (endX === undefined || endY === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "For swipe gestures, endX and endY coordinates are required.",
                  },
                ],
              };
            }

            // Create W3C Actions API payload for swipe
            actions = [
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
                    duration: gestureDuration,
                    origin: "viewport",
                    x: endX,
                    y: endY,
                  },
                  // Release
                  { type: "pointerUp", button: 0 },
                ],
              },
            ];

            console.log(
              "Executing W3C swipe with actions:",
              JSON.stringify(actions, null, 2)
            );
            await driver.performActions(actions);

            return {
              content: [
                {
                  type: "text",
                  text: `Successfully performed W3C swipe from (${startX},${startY}) to (${endX},${endY}) over ${gestureDuration}ms`,
                },
              ],
            };
          }

          case "tap": {
            // Create W3C Actions API payload for tap
            actions = [
              {
                type: "pointer",
                id: "finger1",
                parameters: { pointerType: "touch" },
                actions: [
                  // Move to position
                  { type: "pointerMove", duration: 0, x: startX, y: startY },
                  // Press down
                  { type: "pointerDown", button: 0 },
                  // Short wait (100ms for tap)
                  { type: "pause", duration: 100 },
                  // Release
                  { type: "pointerUp", button: 0 },
                ],
              },
            ];

            await driver.performActions(actions);

            return {
              content: [
                {
                  type: "text",
                  text: `Successfully performed W3C tap at (${startX},${startY})`,
                },
              ],
            };
          }

          case "longPress": {
            // For long press, we use a longer duration between pointerDown and pointerUp
            const longPressDuration = gestureDuration || 1000; // Default to 1000ms for long press

            // Create W3C Actions API payload for long press
            actions = [
              {
                type: "pointer",
                id: "finger1",
                parameters: { pointerType: "touch" },
                actions: [
                  // Move to position
                  { type: "pointerMove", duration: 0, x: startX, y: startY },
                  // Press down
                  { type: "pointerDown", button: 0 },
                  // Long wait
                  { type: "pause", duration: longPressDuration },
                  // Release
                  { type: "pointerUp", button: 0 },
                ],
              },
            ];

            await driver.performActions(actions);

            return {
              content: [
                {
                  type: "text",
                  text: `Successfully performed W3C long press at (${startX},${startY}) for ${longPressDuration}ms`,
                },
              ],
            };
          }

          case "dragAndDrop": {
            if (endX === undefined || endY === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "For drag and drop gestures, endX and endY coordinates are required.",
                  },
                ],
              };
            }

            // Create W3C Actions API payload for drag and drop (similar to swipe but with different semantics)
            actions = [
              {
                type: "pointer",
                id: "finger1",
                parameters: { pointerType: "touch" },
                actions: [
                  // Move to start position
                  { type: "pointerMove", duration: 0, x: startX, y: startY },
                  // Press down
                  { type: "pointerDown", button: 0 },
                  // Small pause to register the press
                  { type: "pause", duration: 200 },
                  // Move to end position
                  {
                    type: "pointerMove",
                    duration: gestureDuration,
                    origin: "viewport",
                    x: endX,
                    y: endY,
                  },
                  // Small pause at destination
                  { type: "pause", duration: 100 },
                  // Release
                  { type: "pointerUp", button: 0 },
                ],
              },
            ];

            await driver.performActions(actions);

            return {
              content: [
                {
                  type: "text",
                  text: `Successfully performed W3C drag and drop from (${startX},${startY}) to (${endX},${endY})`,
                },
              ],
            };
          }

          case "pinchZoom": {
            if (
              !secondPointStartX ||
              !secondPointStartY ||
              !secondPointEndX ||
              !secondPointEndY
            ) {
              return {
                content: [
                  {
                    type: "text",
                    text: "For pinch zoom gestures, coordinates for both fingers are required (secondPointStartX, secondPointStartY, secondPointEndX, secondPointEndY).",
                  },
                ],
              };
            }

            if (endX === undefined || endY === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "For pinch zoom gestures, endX and endY coordinates are required for the first finger.",
                  },
                ],
              };
            }

            // Create W3C Actions API payload for pinch/zoom (two finger gesture)
            actions = [
              // First finger
              {
                type: "pointer",
                id: "finger1",
                parameters: { pointerType: "touch" },
                actions: [
                  // Move to start position
                  { type: "pointerMove", duration: 0, x: startX, y: startY },
                  // Press down
                  { type: "pointerDown", button: 0 },
                  // Move to end position
                  {
                    type: "pointerMove",
                    duration: gestureDuration,
                    origin: "viewport",
                    x: endX,
                    y: endY,
                  },
                  // Release
                  { type: "pointerUp", button: 0 },
                ],
              },
              // Second finger
              {
                type: "pointer",
                id: "finger2",
                parameters: { pointerType: "touch" },
                actions: [
                  // Move to start position
                  {
                    type: "pointerMove",
                    duration: 0,
                    x: secondPointStartX,
                    y: secondPointStartY,
                  },
                  // Press down
                  { type: "pointerDown", button: 0 },
                  // Move to end position
                  {
                    type: "pointerMove",
                    duration: gestureDuration,
                    origin: "viewport",
                    x: secondPointEndX,
                    y: secondPointEndY,
                  },
                  // Release
                  { type: "pointerUp", button: 0 },
                ],
              },
            ];

            await driver.performActions(actions);

            return {
              content: [
                {
                  type: "text",
                  text: `Successfully performed W3C pinch/zoom gesture with two fingers`,
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: "text",
                  text: `Unsupported action type: ${actionType}`,
                },
              ],
            };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing W3C gesture: ${error.message}\n${
                error.stack || ""
              }`,
            },
          ],
        };
      }
    }
  );
}

export const TEST_CONFIG = {
  // ...other config...
  timeouts: {
    xlarge: 60000,
    large: 30000,
    medium: 10000,
    small: 5000,
  },
};
