import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  AppiumHelper,
  AppiumCapabilities,
} from "../lib/appium/appiumHelper.js";

// Shared Appium instance for reuse across tool calls
let appiumHelper: AppiumHelper | null = null;

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
        if (!appiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const screenshotPath = await appiumHelper.takeScreenshot(name);

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
        if (!appiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await appiumHelper.tapElement(
          selector,
          strategy || "xpath"
        );

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `Successfully tapped on element: ${selector}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Failed to tap on element: ${selector}. Element might not be visible or present.`,
              },
            ],
          };
        }
      } catch (error: any) {
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
        if (!appiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await appiumHelper.sendKeys(
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
        if (!appiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const source = await appiumHelper.getPageSource();

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
        if (!appiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await appiumHelper.swipe(
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
        if (!appiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first with initialize-appium.",
              },
            ],
          };
        }

        const success = await appiumHelper.waitForElement(
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
}
