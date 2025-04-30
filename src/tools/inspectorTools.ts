import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { parseStringPromise } from "xml2js";

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
