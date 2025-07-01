import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { parseStringPromise } from "xml2js";
import { AppiumHelper } from "../lib/appium/appiumHelper.js";

// External reference to the appium helper instance
let appiumHelper: AppiumHelper | null = null;

// Set the appium helper instance
export function setAppiumHelperForInspector(helper: AppiumHelper) {
  appiumHelper = helper;
}

/**
 * Register UI inspector tools with the MCP server
 */
export function registerInspectorTools(server: McpServer) {
  // Tool: Extract locators from UI XML
  server.tool(
    "extract-locators",
    "Extract element locators from UI XML source",
    {
      xmlSource: z.string().describe("XML source to analyze"),
      elementType: z
        .string()
        .optional()
        .describe("Filter elements by type (e.g., android.widget.Button)"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of elements to return"),
    },
    async ({ xmlSource, elementType, maxResults = 10 }) => {
      try {
        const result = await extractLocators(
          xmlSource,
          elementType,
          maxResults
        );

        if (result.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: elementType
                  ? `No elements of type ${elementType} found.`
                  : "No elements found in the XML source.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.length} element(s):\n\n${result.join(
                "\n\n"
              )}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error extracting locators: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Save UI hierarchy to file
  server.tool(
    "save-ui-hierarchy",
    "Save UI hierarchy XML to a file",
    {
      xmlSource: z.string().describe("XML source to save"),
      filePath: z.string().describe("Path to save the XML file"),
    },
    async ({ xmlSource, filePath }) => {
      try {
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        // Save the XML file
        await fs.writeFile(filePath, xmlSource, "utf-8");

        return {
          content: [
            {
              type: "text",
              text: `UI hierarchy saved to ${filePath}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error saving UI hierarchy: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Find element by text
  server.tool(
    "find-by-text",
    "Generate XPath to find element by text",
    {
      text: z.string().describe("Text to search for"),
      platformName: z
        .enum(["Android", "iOS"])
        .describe("Platform to generate XPath for"),
      exactMatch: z
        .boolean()
        .optional()
        .describe("Whether to match the text exactly (default: true)"),
      elementType: z
        .string()
        .optional()
        .describe("Filter by element type (e.g., android.widget.Button)"),
    },
    async ({ text, platformName, exactMatch = true, elementType }) => {
      try {
        let xpath = "";

        if (platformName === "Android") {
          xpath = generateAndroidXPath(text, exactMatch, elementType);
        } else {
          xpath = generateIosXPath(text, exactMatch, elementType);
        }

        return {
          content: [
            {
              type: "text",
              text: `XPath for finding "${text}" on ${platformName}:\n${xpath}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating XPath: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Generate test script
  server.tool(
    "generate-test-script",
    "Generate Appium test script from actions",
    {
      platformName: z
        .enum(["Android", "iOS"])
        .describe("Platform to generate script for"),
      appPackage: z.string().optional().describe("App package name (Android)"),
      bundleId: z.string().optional().describe("Bundle ID (iOS)"),
      actions: z
        .array(
          z.object({
            type: z.string().describe("Action type: tap, input, swipe, wait"),
            selector: z.string().optional().describe("Element selector"),
            strategy: z
              .string()
              .optional()
              .describe("Selector strategy: xpath, id, accessibility id"),
            text: z
              .string()
              .optional()
              .describe("Text to input (for input actions)"),
            timeoutMs: z
              .number()
              .optional()
              .describe("Timeout in ms (for wait actions)"),
            startX: z
              .number()
              .optional()
              .describe("Start X coordinate (for swipe actions)"),
            startY: z
              .number()
              .optional()
              .describe("Start Y coordinate (for swipe actions)"),
            endX: z
              .number()
              .optional()
              .describe("End X coordinate (for swipe actions)"),
            endY: z
              .number()
              .optional()
              .describe("End Y coordinate (for swipe actions)"),
          })
        )
        .describe("List of actions to perform"),
    },
    async ({ platformName, appPackage, bundleId, actions }) => {
      try {
        const script = generateTestScript(
          platformName,
          appPackage,
          bundleId,
          actions
        );

        return {
          content: [
            {
              type: "text",
              text: script,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating test script: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Inspect element and perform action
  server.tool(
    "inspect-and-act",
    "Inspect UI to identify element locators and then perform an action",
    {
      action: z
        .enum(["tap", "sendKeys", "longPress", "clear"])
        .describe("Action to perform on the element"),
      elementIdentifier: z
        .string()
        .optional()
        .describe(
          "Text, partial resource-id, or other identifier to search for"
        ),
      text: z
        .string()
        .optional()
        .describe("Text to input if action is sendKeys"),
      longPressMs: z
        .number()
        .optional()
        .describe("Duration in ms if action is longPress"),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default: 10000)"),
      strategy: z
        .string()
        .optional()
        .describe(
          "Initial strategy to try if provided: id, accessibility id, xpath"
        ),
      refreshSource: z
        .boolean()
        .optional()
        .describe("Whether to refresh page source before inspection"),
      saveLocators: z
        .boolean()
        .optional()
        .describe("Whether to save found locators for future reference"),
    },
    async ({
      action,
      elementIdentifier,
      text,
      longPressMs,
      timeoutMs,
      strategy,
      refreshSource,
      saveLocators,
    }) => {
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

        const timeout = timeoutMs || 10000;

        // Step 1: Get fresh page source if requested
        console.log(`Getting page source (refresh: ${refreshSource})`);
        const pageSource = await appiumHelper.getPageSource();

        // Step 2: Try to find element locators
        const locators = await findElementLocators(
          pageSource,
          elementIdentifier
        );

        if (locators.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find any elements matching "${elementIdentifier}" in the current UI.`,
              },
            ],
          };
        }

        // Step 3: Save locators if requested
        if (saveLocators) {
          // Create a locators directory if it doesn't exist
          const locatorsDir = path.join(process.cwd(), "locators");
          await fs.mkdir(locatorsDir, { recursive: true });

          // Save locators to a file
          const filename = `locators_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.json`;
          const filePath = path.join(locatorsDir, filename);
          await fs.writeFile(
            filePath,
            JSON.stringify(locators, null, 2),
            "utf-8"
          );
          console.log(`Saved locators to ${filePath}`);
        }

        // Step 4: Use the best locator to perform the action
        // Try locators in this order: resource-id, accessibility-id, xpath with text
        let actionPerformed = false;
        let usedLocator = null;
        let error = null;

        // If a specific strategy was provided, try that first
        if (strategy) {
          try {
            if (strategy === "id" && locators.resourceId) {
              console.log(
                `Trying with provided strategy: id=${locators.resourceId}`
              );
              await performAction(
                action,
                locators.resourceId,
                "id",
                text,
                longPressMs
              );
              actionPerformed = true;
              usedLocator = { strategy: "id", value: locators.resourceId };
            } else if (
              strategy === "accessibility id" &&
              locators.accessibilityId
            ) {
              console.log(
                `Trying with provided strategy: ~${locators.accessibilityId}`
              );
              await performAction(
                action,
                locators.accessibilityId,
                "accessibility id",
                text,
                longPressMs
              );
              actionPerformed = true;
              usedLocator = {
                strategy: "accessibility id",
                value: locators.accessibilityId,
              };
            } else if (strategy === "xpath" && locators.xpath) {
              console.log(
                `Trying with provided strategy: xpath=${locators.xpath}`
              );
              await performAction(
                action,
                locators.xpath,
                "xpath",
                text,
                longPressMs
              );
              actionPerformed = true;
              usedLocator = { strategy: "xpath", value: locators.xpath };
            }
          } catch (err: unknown) {
            console.log(
              `Strategy ${strategy} failed: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            error = err instanceof Error ? err : new Error(String(err));
          }
        }

        // If action not performed yet, try other strategies in order
        if (!actionPerformed && locators.resourceId) {
          try {
            console.log(`Trying with resourceId: ${locators.resourceId}`);
            await performAction(
              action,
              locators.resourceId,
              "id",
              text,
              longPressMs
            );
            actionPerformed = true;
            usedLocator = { strategy: "id", value: locators.resourceId };
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.log(
              `Resource ID strategy failed: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            error = err instanceof Error ? err : new Error(String(err));
          }
        }

        if (!actionPerformed && locators.accessibilityId) {
          try {
            console.log(
              `Trying with accessibilityId: ${locators.accessibilityId}`
            );
            await performAction(
              action,
              locators.accessibilityId,
              "accessibility id",
              text,
              longPressMs
            );
            actionPerformed = true;
            usedLocator = {
              strategy: "accessibility id",
              value: locators.accessibilityId,
            };
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.log(
              `Accessibility ID strategy failed: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            error = err instanceof Error ? err : new Error(String(err));
          }
        }

        if (!actionPerformed && locators.xpath) {
          try {
            console.log(`Trying with XPath: ${locators.xpath}`);
            await performAction(
              action,
              locators.xpath,
              "xpath",
              text,
              longPressMs
            );
            actionPerformed = true;
            usedLocator = { strategy: "xpath", value: locators.xpath };
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.log(
              `XPath strategy failed: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            error = err instanceof Error ? err : new Error(String(err));
          }
        }

        if (!actionPerformed && locators.uiAutomator) {
          try {
            console.log(`Trying with UIAutomator: ${locators.uiAutomator}`);
            await performAction(
              action,
              locators.uiAutomator,
              "android uiautomator",
              text,
              longPressMs
            );
            actionPerformed = true;
            usedLocator = {
              strategy: "android uiautomator",
              value: locators.uiAutomator,
            };
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.log(
              `UIAutomator strategy failed: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            error = err instanceof Error ? err : new Error(String(err));
          }
        }

        // Return the result
        if (actionPerformed && usedLocator) {
          const actionText =
            action === "sendKeys" ? `${action} with text "${text}"` : action;

          return {
            content: [
              {
                type: "text",
                text:
                  `Successfully performed action: ${actionText}\n` +
                  `Using locator strategy: ${
                    usedLocator?.strategy || "unknown"
                  }\n` +
                  `Locator value: ${usedLocator?.value || "unknown"}\n\n` +
                  `All available locators:\n${JSON.stringify(
                    locators,
                    null,
                    2
                  )}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text:
                  `Failed to perform action ${action}. All locator strategies failed.\n` +
                  `Error: ${
                    error instanceof Error
                      ? error.message
                      : String(error) || "Unknown error"
                  }\n\n` +
                  `Found locators (but all failed):\n${JSON.stringify(
                    locators,
                    null,
                    2
                  )}`,
              },
            ],
          };
        }
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text",
              text: `Error in inspect-and-act: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Tool: Capture UI elements and locators
  server.tool(
    "capture-ui-locators",
    "Capture all UI elements and their locators for future use",
    {
      elementType: z
        .string()
        .optional()
        .describe("Filter elements by type (e.g., android.widget.Button)"),
      saveToFile: z
        .boolean()
        .optional()
        .describe("Whether to save the locators to a file"),
      refreshSource: z
        .boolean()
        .optional()
        .describe("Whether to refresh page source before capture"),
    },
    async ({ elementType, saveToFile = true, refreshSource = false }) => {
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

        // Get page source
        console.log(`Getting page source (refresh: ${refreshSource})`);
        const pageSource = await appiumHelper.getPageSource();

        // Extract all elements
        console.log("Extracting elements from page source");
        const elements = await extractElementsWithLocators(
          pageSource,
          elementType
        );

        if (elements.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: elementType
                  ? `No elements of type ${elementType} found in the current UI.`
                  : "No elements found in the current UI.",
              },
            ],
          };
        }

        // Save to file if requested
        if (saveToFile) {
          const locatorsDir = path.join(process.cwd(), "locators");
          await fs.mkdir(locatorsDir, { recursive: true });

          const filename = `ui_locators_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.json`;
          const filePath = path.join(locatorsDir, filename);

          await fs.writeFile(
            filePath,
            JSON.stringify(elements, null, 2),
            "utf-8"
          );
          console.log(
            `Saved ${elements.length} element locators to ${filePath}`
          );

          return {
            content: [
              {
                type: "text",
                text:
                  `Captured ${elements.length} UI elements${
                    elementType ? ` of type ${elementType}` : ""
                  }.\n` + `Locators saved to ${filePath}`,
              },
            ],
          };
        }

        // Otherwise just return the elements
        return {
          content: [
            {
              type: "text",
              text:
                `Captured ${elements.length} UI elements${
                  elementType ? ` of type ${elementType}` : ""
                }:\n\n` +
                `${JSON.stringify(elements.slice(0, 5), null, 2)}\n` +
                `${
                  elements.length > 5
                    ? `\n... and ${elements.length - 5} more elements`
                    : ""
                }`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error capturing UI locators: ${
                error?.message || String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}

/**
 * Extract locators from XML source
 */
async function extractLocators(
  xmlSource: string,
  elementType?: string,
  maxResults: number = 10
): Promise<string[]> {
  try {
    // Parse XML
    const parsed = await parseStringPromise(xmlSource, {
      explicitArray: false,
    });

    // Extract elements recursively
    const elements: any[] = [];
    extractElements(parsed, elements, elementType);

    // Format and limit results
    return elements.slice(0, maxResults).map((element, index) => {
      let result = `Element ${index + 1}:`;

      // Add type info
      if (element["@"] && element["@"].class) {
        result += `\nType: ${element["@"].class}`;
      }

      // Add resource-id if available
      if (element["@"] && element["@"]["resource-id"]) {
        result += `\nResource ID: ${element["@"]["resource-id"]}`;
      }

      // Add text if available
      if (element["@"] && element["@"].text) {
        result += `\nText: ${element["@"].text}`;
      }

      // Add content-desc if available
      if (element["@"] && element["@"]["content-desc"]) {
        result += `\nAccessibility Description: ${element["@"]["content-desc"]}`;
      }

      // Generate XPaths
      if (element["@"] && element["@"].class) {
        result += `\nXPath: //${element["@"].class}`;

        if (element["@"]["resource-id"]) {
          result += `\nXPath with ID: //${element["@"].class}[@resource-id="${element["@"]["resource-id"]}"]`;
        }

        if (element["@"].text) {
          result += `\nXPath with text: //${element["@"].class}[@text="${element["@"].text}"]`;
        }
      }

      return result;
    });
  } catch (error) {
    // Return empty array if parsing fails
    return [];
  }
}

/**
 * Extract elements recursively from parsed XML
 */
function extractElements(obj: any, results: any[], elementType?: string): void {
  if (!obj) return;

  // If this is an element with attributes
  if (obj["@"] && obj["@"].class) {
    // If no element type filter or it matches the filter
    if (!elementType || obj["@"].class === elementType) {
      results.push(obj);
    }
  }

  // Process children recursively
  Object.keys(obj).forEach((key) => {
    if (key !== "@" && typeof obj[key] === "object") {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((child: any) =>
          extractElements(child, results, elementType)
        );
      } else {
        extractElements(obj[key], results, elementType);
      }
    }
  });
}

/**
 * Generate Android XPath
 */
function generateAndroidXPath(
  text: string,
  exactMatch: boolean = true,
  elementType?: string
): string {
  // Base element type or wildcard
  const baseType = elementType || "*";

  // Text matching based on exactMatch parameter
  if (exactMatch) {
    return `//${baseType}[@text="${text}"]`;
  } else {
    return `//${baseType}[contains(@text,"${text}")]`;
  }
}

/**
 * Generate iOS XPath
 */
function generateIosXPath(
  text: string,
  exactMatch: boolean = true,
  elementType?: string
): string {
  // Base element type or wildcard
  const baseType = elementType || "*";

  // Text matching based on exactMatch parameter
  if (exactMatch) {
    return `//${baseType}[@name="${text}" or @label="${text}" or @value="${text}"]`;
  } else {
    return `//${baseType}[contains(@name,"${text}") or contains(@label,"${text}") or contains(@value,"${text}")]`;
  }
}

/**
 * Generate test script from actions
 */
function generateTestScript(
  platformName: string,
  appPackage?: string,
  bundleId?: string,
  actions?: any[]
): string {
  let script = `// Appium test script for ${platformName} app\n`;
  script += `// Generated by MCP-Appium\n\n`;

  // Imports
  script += `import { remote, RemoteOptions } from 'webdriverio';\n\n`;

  // Main function
  script += `async function runTest() {\n`;
  script += `  // Set up capabilities\n`;
  script += `  const capabilities = {\n`;
  script += `    platformName: '${platformName}',\n`;

  // Add platform-specific capabilities
  if (platformName === "Android") {
    script += `    automationName: 'UiAutomator2',\n`;
    if (appPackage) {
      script += `    appPackage: '${appPackage}',\n`;
    }
  } else {
    script += `    automationName: 'XCUITest',\n`;
    if (bundleId) {
      script += `    bundleId: '${bundleId}',\n`;
    }
  }

  script += `    deviceName: 'YOUR_DEVICE_NAME',\n`;
  script += `  };\n\n`;

  // Set up driver
  script += `  // Set up WebdriverIO\n`;
  script += `  const driver = await remote({\n`;
  script += `    hostname: 'localhost',\n`;
  script += `    port: 4723,\n`;
  script += `    path: '/wd/hub',\n`;
  script += `    capabilities\n`;
  script += `  });\n\n`;

  // Add action steps
  if (actions && actions.length > 0) {
    script += `  try {\n`;

    // For each action, add the corresponding code
    actions.forEach((action, index) => {
      script += `    // Step ${index + 1}: ${action.type}\n`;

      switch (action.type) {
        case "tap":
          script += generateTapCode(action);
          break;
        case "input":
          script += generateInputCode(action);
          break;
        case "wait":
          script += generateWaitCode(action);
          break;
        case "swipe":
          script += generateSwipeCode(action);
          break;
        default:
          script += `    // Unknown action type: ${action.type}\n`;
      }

      script += `\n`;
    });

    script += `    // Test completed successfully\n`;
    script += `    console.log('Test completed successfully');\n`;
    script += `  } catch (error) {\n`;
    script += `    console.error('Test failed:', error);\n`;
    script += `  } finally {\n`;
    script += `    // Close the session\n`;
    script += `    await driver.deleteSession();\n`;
    script += `  }\n`;
  }

  script += `}\n\n`;
  script += `// Run the test\n`;
  script += `runTest().catch(console.error);\n`;

  return script;
}

/**
 * Generate code for tap action
 */
function generateTapCode(action: any): string {
  const strategy = action.strategy || "xpath";
  let code = "";

  switch (strategy) {
    case "id":
      code = `    const element${generateElementId()} = await driver.$('id=${
        action.selector
      }');\n`;
      break;
    case "accessibility id":
      code = `    const element${generateElementId()} = await driver.$('~${
        action.selector
      }');\n`;
      break;
    case "xpath":
    default:
      code = `    const element${generateElementId()} = await driver.$('${
        action.selector
      }');\n`;
  }

  code += `    await element${getCurrentElementId()}.click();\n`;
  return code;
}

/**
 * Generate code for input action
 */
function generateInputCode(action: any): string {
  const strategy = action.strategy || "xpath";
  let code = "";

  switch (strategy) {
    case "id":
      code = `    const element${generateElementId()} = await driver.$('id=${
        action.selector
      }');\n`;
      break;
    case "accessibility id":
      code = `    const element${generateElementId()} = await driver.$('~${
        action.selector
      }');\n`;
      break;
    case "xpath":
    default:
      code = `    const element${generateElementId()} = await driver.$('${
        action.selector
      }');\n`;
  }

  code += `    await element${getCurrentElementId()}.setValue('${
    action.text
  }');\n`;
  return code;
}

/**
 * Generate code for wait action
 */
function generateWaitCode(action: any): string {
  const strategy = action.strategy || "xpath";
  let code = "";

  switch (strategy) {
    case "id":
      code = `    const element${generateElementId()} = await driver.$('id=${
        action.selector
      }');\n`;
      break;
    case "accessibility id":
      code = `    const element${generateElementId()} = await driver.$('~${
        action.selector
      }');\n`;
      break;
    case "xpath":
    default:
      code = `    const element${generateElementId()} = await driver.$('${
        action.selector
      }');\n`;
  }

  code += `    await element${getCurrentElementId()}.waitForDisplayed({ timeout: ${
    action.timeoutMs || 10000
  } });\n`;
  return code;
}

/**
 * Generate code for swipe action
 */
function generateSwipeCode(action: any): string {
  let code = `    await driver.touchAction([\n`;
  code += `      { action: 'press', x: ${action.startX}, y: ${action.startY} },\n`;
  code += `      { action: 'wait', ms: 800 },\n`;
  code += `      { action: 'moveTo', x: ${action.endX}, y: ${action.endY} },\n`;
  code += `      { action: 'release' }\n`;
  code += `    ]);\n`;

  return code;
}

// Counter for generating unique element IDs
let elementIdCounter = 1;

/**
 * Generate a unique element ID
 */
function generateElementId(): number {
  return elementIdCounter++;
}

/**
 * Get the current element ID
 */
function getCurrentElementId(): number {
  return elementIdCounter - 1;
}

/**
 * Find element locators from page source using the element identifier
 */
async function findElementLocators(
  pageSource: string,
  elementIdentifier: string | undefined
): Promise<any> {
  if (!elementIdentifier) {
    return {};
  }

  try {
    const parsed = await parseStringPromise(pageSource, {
      explicitArray: false,
      mergeAttrs: true,
    });

    // Find elements with attributes matching the identifier
    const matchingElements: any[] = [];
    findMatchingElements(parsed, elementIdentifier, matchingElements);

    if (matchingElements.length === 0) {
      return {};
    }

    // Use the first matching element
    const element = matchingElements[0];

    // Extract locators
    const locators: any = {};

    // Resource ID
    if (element.resource_id) {
      locators.resourceId = element.resource_id;
    }

    // Accessibility ID / Content description
    if (element.content_desc) {
      locators.accessibilityId = element.content_desc;
    }

    // Text
    if (element.text) {
      locators.text = element.text;
    }

    // Class
    if (element.class) {
      locators.class = element.class;
    }

    // Generate XPath
    if (element.class) {
      if (element.text) {
        locators.xpath = `//${element.class}[contains(@text,"${element.text}")]`;
      } else if (element.content_desc) {
        locators.xpath = `//${element.class}[contains(@content-desc,"${element.content_desc}")]`;
      } else if (element.resource_id) {
        locators.xpath = `//${element.class}[@resource-id="${element.resource_id}"]`;
      } else {
        // Create an XPath using index or other attributes if available
        locators.xpath = `//${element.class}`;
      }
    }

    // Generate UIAutomator selector (Android)
    if (element.resource_id || element.text || element.content_desc) {
      let uiAutomator = "new UiSelector()";

      if (element.resource_id) {
        uiAutomator += `.resourceId("${element.resource_id}")`;
      }

      if (element.text) {
        uiAutomator += `.text("${element.text}")`;
      }

      if (element.content_desc) {
        uiAutomator += `.description("${element.content_desc}")`;
      }

      if (element.class) {
        uiAutomator += `.className("${element.class}")`;
      }

      locators.uiAutomator = uiAutomator;
    }

    return locators;
  } catch (error) {
    console.error("Error finding element locators:", error);
    return {};
  }
}

/**
 * Find elements recursively that match the identifier
 */
function findMatchingElements(
  obj: any,
  identifier: string,
  results: any[]
): void {
  if (!obj) return;

  // Check if this object has attributes that match the identifier
  let isMatch = false;

  // Check resource ID
  if (obj.resource_id && obj.resource_id.includes(identifier)) {
    isMatch = true;
  }

  // Check text
  if (obj.text && obj.text.includes(identifier)) {
    isMatch = true;
  }

  // Check content description / accessibility ID
  if (obj.content_desc && obj.content_desc.includes(identifier)) {
    isMatch = true;
  }

  // If this is a match, add it to results
  if (isMatch) {
    results.push(obj);
  }

  // Process children recursively
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object") {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((child: any) =>
          findMatchingElements(child, identifier, results)
        );
      } else {
        findMatchingElements(obj[key], identifier, results);
      }
    }
  });
}

/**
 * Extract all elements with their locators
 */
async function extractElementsWithLocators(
  pageSource: string,
  elementType?: string
): Promise<any[]> {
  try {
    const parsed = await parseStringPromise(pageSource, {
      explicitArray: false,
      mergeAttrs: true,
    });

    const elements: any[] = [];
    extractElementsRecursive(parsed, elements, elementType);

    return elements.map((element) => {
      const locators: any = {};

      // Basic properties
      locators.type = element.class || "unknown";

      if (element.text) {
        locators.text = element.text;
      }

      // Resource ID
      if (element.resource_id) {
        locators.id = element.resource_id;
      }

      // Accessibility ID / Content description
      if (element.content_desc) {
        locators.accessibilityId = element.content_desc;
      }

      // Generate locator strategies
      const strategies: any = {};

      // ID strategy
      if (element.resource_id) {
        strategies.id = element.resource_id;
      }

      // Accessibility ID strategy
      if (element.content_desc) {
        strategies.accessibilityId = element.content_desc;
      }

      // XPath strategies
      if (element.class) {
        const xpathStrategies: any = {};

        if (element.resource_id) {
          xpathStrategies.byResourceId = `//${element.class}[@resource-id="${element.resource_id}"]`;
        }

        if (element.text) {
          xpathStrategies.byText = `//${element.class}[contains(@text,"${element.text}")]`;
        }

        if (element.content_desc) {
          xpathStrategies.byContentDesc = `//${element.class}[contains(@content-desc,"${element.content_desc}")]`;
        }

        strategies.xpath = xpathStrategies;
      }

      // UIAutomator strategy (Android)
      if (element.resource_id || element.text || element.content_desc) {
        let uiAutomator = "new UiSelector()";

        if (element.class) {
          uiAutomator += `.className("${element.class}")`;
        }

        if (element.resource_id) {
          uiAutomator += `.resourceId("${element.resource_id}")`;
        }

        if (element.text) {
          uiAutomator += `.text("${element.text}")`;
        }

        if (element.content_desc) {
          uiAutomator += `.description("${element.content_desc}")`;
        }

        strategies.uiAutomator = uiAutomator;
      }

      // Add strategies to result
      locators.strategies = strategies;

      // Add original properties for reference
      locators.properties = {
        class: element.class,
        resource_id: element.resource_id,
        text: element.text,
        content_desc: element.content_desc,
        clickable: element.clickable,
        enabled: element.enabled,
        focused: element.focused,
        selected: element.selected,
      };

      return locators;
    });
  } catch (error) {
    console.error("Error extracting elements with locators:", error);
    return [];
  }
}

/**
 * Extract elements recursively
 */
function extractElementsRecursive(
  obj: any,
  results: any[],
  elementType?: string
): void {
  if (!obj) return;

  // Check if this is an element with type/class
  if (obj.class) {
    // If no type filter or it matches
    if (!elementType || obj.class === elementType) {
      results.push(obj);
    }
  }

  // Process children recursively
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object") {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((child: any) =>
          extractElementsRecursive(child, results, elementType)
        );
      } else {
        extractElementsRecursive(obj[key], results, elementType);
      }
    }
  });
}

/**
 * Perform an action on an element
 */
async function performAction(
  action: string,
  selector: string,
  strategy: string,
  text?: string,
  longPressMs?: number
): Promise<void> {
  if (!appiumHelper) {
    throw new Error("Appium helper not initialized");
  }

  switch (action) {
    case "tap":
      await appiumHelper.tapElement(selector, strategy);
      break;
    case "sendKeys":
      if (!text) {
        throw new Error("Text is required for sendKeys action");
      }
      await appiumHelper.sendKeys(selector, text, strategy);
      break;
    case "longPress":
      await appiumHelper.longPress(selector, longPressMs || 1000, strategy);
      break;
    case "clear":
      await appiumHelper.clearElement(selector, strategy);
      break;
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}
