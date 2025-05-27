import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AppiumHelper } from "../lib/appium/appiumHelper.js";
import { AppiumError } from "../lib/appium/appiumError.js";
import * as path from "path";
import * as fs from "fs";
// Import our new image processing utilities
import {
  ImageProcessor,
  VisualRecovery,
} from "../lib/vision/imageProcessor.js";

// Import validAppiumHelper from mobileTools
declare const validAppiumHelper: AppiumHelper | null;

// Define interfaces for type safety
interface ElementMatch {
  path: string;
  relevanceScore: number;
  match: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  attributes: Record<string, string>;
}

export function registerRecoveryTools(server: McpServer) {
  server.tool(
    "smart-action",
    "Perform an action with automatic recovery through screenshot analysis if traditional methods fail",
    {
      action: z
        .enum(["tap", "longPress", "swipe", "sendKeys"])
        .describe("Action to perform"),
      selector: z.string().describe("Primary element selector"),
      strategy: z
        .enum(["accessibility id", "id", "xpath", "class name", "uiautomator"])
        .default("xpath")
        .describe("Selector strategy"),
      text: z
        .string()
        .optional()
        .describe("Text to input if action is sendKeys"),
      fallbackToScreenshot: z
        .boolean()
        .default(true)
        .describe(
          "Whether to fallback to screenshot analysis if selector fails"
        ),
      maxAttempts: z
        .number()
        .default(3)
        .describe("Maximum attempts for recovery"),
      visualStrategy: z
        .enum(["template", "ocr", "feature-detection"])
        .default("template")
        .describe(
          "Visual recovery strategy to use when traditional selector fails"
        ),
    },
    async ({
      action,
      selector,
      strategy,
      text,
      fallbackToScreenshot = true,
      maxAttempts = 3,
      visualStrategy = "template",
    }) => {
      try {
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first.",
              },
            ],
          };
        }

        let success = false;
        let attempts = 0;
        let lastError: unknown;
        let actionResult;
        let recoveryPath = "";
        let lastScreenshotPath = "";

        while (!success && attempts < maxAttempts) {
          attempts++;
          try {
            // First try with traditional element locator
            console.log(
              `Attempt ${attempts}: Using traditional locator ${strategy}:${selector}`
            );

            switch (action) {
              case "tap":
                await validAppiumHelper.tapElement(selector, strategy);
                break;
              case "longPress":
                await validAppiumHelper.longPress(selector);
                break;
              case "swipe":
                // For swipe, we assume selector points to the starting element
                await validAppiumHelper.scrollToElement(selector);
                break;
              case "sendKeys":
                if (!text)
                  throw new Error(
                    "Text parameter is required for sendKeys action"
                  );
                await validAppiumHelper.sendKeys(selector, text, strategy);
                break;
            }

            success = true;
            actionResult = `Successfully performed ${action} using traditional element locator`;
          } catch (error) {
            lastError = error;
            // Fix the error message access
            console.log(
              `Traditional approach failed: ${
                error instanceof Error ? error.message : String(error)
              }`
            );

            if (!fallbackToScreenshot) {
              throw error;
            }

            // Traditional approach failed, try screenshot analysis recovery
            console.log(
              "Attempting recovery with enhanced image processing..."
            );

            try {
              // Take a screenshot for analysis
              const screenshotPath = await validAppiumHelper.takeScreenshot(
                `recovery-${attempts}`
              );
              lastScreenshotPath = screenshotPath;
              console.log(`Took recovery screenshot: ${screenshotPath}`);

              // Get device screen size
              const { width, height } = await validAppiumHelper.getWindowSize();

              // Use visual recovery depending on the strategy
              let elementInfo = null;

              // If we have a previous screenshot with the element, try template matching
              if (attempts > 1 && visualStrategy === "template") {
                // Get the previous screenshot
                const previousScreenshot = `recovery-${attempts - 1}`;
                const previousScreenshotPath = path.join(
                  path.dirname(screenshotPath),
                  previousScreenshot + ".png"
                );

                if (fs.existsSync(previousScreenshotPath)) {
                  // Get element region from previous attempt
                  const elementRegion = await analyzePotentialElementLocation(
                    await validAppiumHelper.getPageSource(),
                    selector,
                    strategy,
                    width,
                    height
                  );

                  if (elementRegion) {
                    // Try to recover by appearance
                    elementInfo =
                      await VisualRecovery.recoverElementByAppearance(
                        previousScreenshotPath,
                        screenshotPath,
                        elementRegion
                      );
                  }
                }
              }

              // If template matching failed or isn't the selected strategy, try OCR
              if (
                !elementInfo &&
                (visualStrategy === "ocr" ||
                  visualStrategy === "feature-detection")
              ) {
                // Extract text from selector if possible
                const textToFind = extractTextFromSelector(selector);

                if (textToFind) {
                  // Try to find text in the image
                  elementInfo = await VisualRecovery.findTextInImage(
                    screenshotPath,
                    textToFind
                  );
                }
              }

              // If OCR failed or isn't the strategy, try traditional XML parsing as a last resort
              if (!elementInfo) {
                // Get the page source for element analysis
                const pageSource = await validAppiumHelper.getPageSource();

                elementInfo = await analyzePotentialElementLocation(
                  pageSource,
                  selector,
                  strategy,
                  width,
                  height
                );
              }

              if (elementInfo) {
                console.log(
                  `Found potential match with coordinates: (${elementInfo.x}, ${elementInfo.y})`
                );

                // Perform action using coordinates
                switch (action) {
                  case "tap":
                    await validAppiumHelper.tapByCoordinates(
                      elementInfo.x,
                      elementInfo.y
                    );
                    break;
                  case "longPress":
                    // Use the performActions method
                    await validAppiumHelper.performActions([
                      {
                        type: "pointer",
                        id: "finger1",
                        parameters: { pointerType: "touch" },
                        actions: [
                          {
                            type: "pointerMove",
                            duration: 0,
                            x: elementInfo.x,
                            y: elementInfo.y,
                          },
                          { type: "pointerDown", button: 0 },
                          { type: "pause", duration: 1000 },
                          { type: "pointerUp", button: 0 },
                        ],
                      },
                    ]);
                    break;
                  case "swipe":
                    const targetY =
                      elementInfo.y > height / 2
                        ? elementInfo.y - 300
                        : elementInfo.y + 300;
                    await validAppiumHelper.performActions([
                      {
                        type: "pointer",
                        id: "finger1",
                        parameters: { pointerType: "touch" },
                        actions: [
                          {
                            type: "pointerMove",
                            duration: 0,
                            x: elementInfo.x,
                            y: elementInfo.y,
                          },
                          { type: "pointerDown", button: 0 },
                          { type: "pause", duration: 100 },
                          {
                            type: "pointerMove",
                            duration: 600,
                            x: elementInfo.x,
                            y: targetY,
                          },
                          { type: "pointerUp", button: 0 },
                        ],
                      },
                    ]);
                    break;
                  case "sendKeys":
                    // For sendKeys, we need to first tap the input field, then send keys
                    await validAppiumHelper.tapByCoordinates(
                      elementInfo.x,
                      elementInfo.y
                    );
                    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for keyboard to appear
                    if (text) {
                      await validAppiumHelper.sendTextToActiveElement(text);
                    }
                    break;
                }

                success = true;
                recoveryPath = screenshotPath;
                actionResult = `Successfully performed ${action} using enhanced visual recovery (${visualStrategy})`;
              } else {
                console.log(
                  "Image processing couldn't find a matching element"
                );
              }
            } catch (recoveryError) {
              // Fix the error message access
              console.log(
                `Recovery attempt ${attempts} failed: ${
                  recoveryError instanceof Error
                    ? recoveryError.message
                    : String(recoveryError)
                }`
              );
            }
          }
        }

        if (success) {
          return {
            content: [
              {
                type: "text",
                text:
                  `${actionResult}\n` +
                  `Action: ${action}\n` +
                  `Original selector: ${strategy}:${selector}\n` +
                  `Attempts: ${attempts}\n` +
                  (recoveryPath ? `Recovery screenshot: ${recoveryPath}` : ""),
              },
            ],
          };
        } else {
          throw (
            lastError ||
            new Error("Failed to perform action with all recovery attempts")
          );
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing action with recovery: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "analyze-screen",
    "Take a screenshot and analyze it to identify potential UI elements",
    {
      targetText: z
        .string()
        .optional()
        .describe("Text to look for in elements"),
      elementType: z
        .string()
        .optional()
        .describe("Type of element to look for (e.g., button, input)"),
      useEnhancedVision: z
        .boolean()
        .default(true)
        .describe("Whether to use enhanced image processing"),
    },
    async ({ targetText, elementType, useEnhancedVision = true }) => {
      try {
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first.",
              },
            ],
          };
        }

        // Take a screenshot for analysis
        const screenshotPath = await validAppiumHelper.takeScreenshot(
          `analysis-${Date.now()}`
        );

        // Get device dimensions
        const { width, height } = await validAppiumHelper.getWindowSize();

        let elements = [];

        if (useEnhancedVision) {
          // Use our enhanced image processing to detect UI elements
          const detectedElements = await ImageProcessor.detectUIElements(
            screenshotPath
          );

          // Filter by text if specified
          if (targetText) {
            const textLocation = await VisualRecovery.findTextInImage(
              screenshotPath,
              targetText
            );

            if (textLocation) {
              // Add this text element
              elements.push({
                type: "text",
                text: targetText,
                x: textLocation.x,
                y: textLocation.y,
                width: textLocation.width,
                height: textLocation.height,
                attributes: {
                  confidence: textLocation.confidence.toFixed(2),
                },
              });

              // Filter other elements by proximity to this text
              detectedElements.sort((a, b) => {
                const distA = Math.sqrt(
                  Math.pow(a.bbox.x - textLocation.x, 2) +
                    Math.pow(a.bbox.y - textLocation.y, 2)
                );

                const distB = Math.sqrt(
                  Math.pow(b.bbox.x - textLocation.x, 2) +
                    Math.pow(b.bbox.y - textLocation.y, 2)
                );

                return distA - distB;
              });

              // Add the nearest elements
              const nearElements = detectedElements.slice(0, 5);
              nearElements.forEach((el) => {
                if (el.type.toLowerCase() !== "text") {
                  // Skip duplicate text elements
                  elements.push({
                    type: el.type,
                    x: el.bbox.x,
                    y: el.bbox.y,
                    width: el.bbox.width,
                    height: el.bbox.height,
                    attributes: {
                      confidence: el.confidence.toFixed(2),
                      proximity: "near " + targetText,
                    },
                  });
                }
              });
            }
          } else {
            // Just use all detected elements
            elements = detectedElements.map((el) => ({
              type: el.type,
              x: el.bbox.x,
              y: el.bbox.y,
              width: el.bbox.width,
              height: el.bbox.height,
              attributes: {
                confidence: el.confidence.toFixed(2),
              },
            }));
          }

          // Filter by element type if needed
          if (elementType) {
            elements = elements.filter((el) =>
              el.type.toLowerCase().includes(elementType.toLowerCase())
            );
          }
        } else {
          // Use traditional XML parsing as a fallback
          // Get page source
          const pageSource = await validAppiumHelper.getPageSource();

          // Perform analysis using traditional method
          elements = await extractInteractiveElements(
            pageSource,
            targetText,
            elementType
          );
        }

        return {
          content: [
            {
              type: "text",
              text:
                `Screen Analysis Results ${
                  useEnhancedVision ? "(Enhanced Vision)" : ""
                }\n` +
                `Screenshot: ${screenshotPath}\n` +
                `Device dimensions: ${width}x${height}\n` +
                `Found ${elements.length} potential interactive elements:\n\n` +
                elements
                  .map(
                    (elem, i) =>
                      `${i + 1}. ${elem.type || "Element"} ${
                        "text" in elem ? `"${elem.text}"` : ""
                      }\n` +
                      `   Position: (${elem.x}, ${elem.y})\n` +
                      `   Size: ${elem.width}x${elem.height}\n` +
                      `   Attributes: ${Object.entries(elem.attributes || {})
                        .map(([k, v]) => `${k}="${v}"`)
                        .join(", ")}\n`
                  )
                  .join("\n"),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing screen: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add a new tool for visual element recovery
  server.tool(
    "visual-element-recovery",
    "Recover UI elements using enhanced image processing when traditional locators fail",
    {
      screenshotPath: z
        .string()
        .describe("Path to the screenshot for analysis"),
      elementType: z
        .enum(["button", "text", "input", "checkbox", "toggle", "any"])
        .default("any")
        .describe("Type of element to look for"),
      nearText: z
        .string()
        .optional()
        .describe("Text near which to find the element"),
      expectedText: z
        .string()
        .optional()
        .describe("Text expected to be in the element"),
    },
    async ({ screenshotPath, elementType, nearText, expectedText }) => {
      try {
        if (!validAppiumHelper) {
          return {
            content: [
              {
                type: "text",
                text: "No active Appium session. Initialize one first.",
              },
            ],
          };
        }

        // Verify screenshot path exists
        if (!fs.existsSync(screenshotPath)) {
          // Take a new screenshot if the path doesn't exist
          screenshotPath = await validAppiumHelper.takeScreenshot("recovery");
        }

        // Use visual processing to find the element
        const elementInfo =
          await VisualRecovery.findElementByVisualCharacteristics(
            screenshotPath,
            {
              elementType,
              nearText,
              expectedText,
            }
          );

        if (elementInfo) {
          return {
            content: [
              {
                type: "text",
                text:
                  `Element Found!\n` +
                  `Type: ${elementInfo.type}\n` +
                  `Position: (${elementInfo.x}, ${elementInfo.y})\n` +
                  `Size: ${elementInfo.width}x${elementInfo.height}\n` +
                  `Confidence: ${(elementInfo.confidence * 100).toFixed(
                    1
                  )}%\n` +
                  `Screenshot used: ${screenshotPath}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `No matching element found in the screenshot. Try adjusting search parameters.`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error finding element using visual recovery: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Add a new tool for comparing screenshots
  server.tool(
    "compare-screens",
    "Compare two screenshots to find differences",
    {
      image1Path: z.string().describe("Path to the first screenshot"),
      image2Path: z.string().describe("Path to the second screenshot"),
      threshold: z
        .number()
        .default(0.1)
        .describe("Difference threshold (0.0-1.0)"),
      outputDiffPath: z
        .string()
        .optional()
        .describe("Path to save the diff image (optional)"),
    },
    async ({ image1Path, image2Path, threshold, outputDiffPath }) => {
      try {
        if (!fs.existsSync(image1Path) || !fs.existsSync(image2Path)) {
          return {
            content: [
              {
                type: "text",
                text: "One or both of the specified images does not exist.",
              },
            ],
          };
        }

        // Generate a default diff path if not provided
        if (!outputDiffPath) {
          const dir = path.dirname(image1Path);
          const basename = path.basename(image1Path, path.extname(image1Path));
          outputDiffPath = path.join(dir, `${basename}_diff_${Date.now()}.png`);
        }

        // Compare the images
        const { diffPercentage, diffImagePath } =
          await ImageProcessor.compareImages(image1Path, image2Path, {
            threshold,
            outputDiffPath,
          });

        return {
          content: [
            {
              type: "text",
              text:
                `Image Comparison Results\n` +
                `Image 1: ${image1Path}\n` +
                `Image 2: ${image2Path}\n` +
                `Difference: ${(diffPercentage * 100).toFixed(2)}%\n` +
                (diffImagePath ? `Diff image saved to: ${diffImagePath}` : ""),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error comparing images: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );
}

// Helper function to extract text from an XPath or other selector
function extractTextFromSelector(selector: string): string | null {
  // Extract text from XPath @text attribute
  const textMatch = selector.match(/@text=['"]([^'"]+)['"]/);
  if (textMatch) {
    return textMatch[1];
  }

  // Extract text from contains() function
  const containsMatch = selector.match(/contains\([^,]+,\s*['"]([^'"]+)['"]\)/);
  if (containsMatch) {
    return containsMatch[1];
  }

  // No text found in selector
  return null;
}

// Helper function to analyze page source and find potential matches for a selector
async function analyzePotentialElementLocation(
  pageSource: string,
  selector: string,
  strategy: string,
  screenWidth: number,
  screenHeight: number
): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
} | null> {
  console.log("Analyzing page source for potential element matches");

  // Parse the XML source
  const { parseStringPromise } = require("xml2js");
  try {
    const parsed = await parseStringPromise(pageSource);
    const elements: ElementMatch[] = [];

    // Helper function to recursively find elements
    const findElements = (node: any, path = "") => {
      if (!node) return;

      // Process this node
      const attributes = node.$;
      if (attributes) {
        let relevanceScore = 0;
        let match = false;

        // Extract bounds if available
        let bounds = { x: 0, y: 0, width: 0, height: 0 };
        if (attributes.bounds) {
          const boundsMatch = attributes.bounds.match(
            /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/
          );
          if (boundsMatch) {
            const x1 = parseInt(boundsMatch[1]);
            const y1 = parseInt(boundsMatch[2]);
            const x2 = parseInt(boundsMatch[3]);
            const y2 = parseInt(boundsMatch[4]);
            bounds = {
              x: Math.floor((x1 + x2) / 2),
              y: Math.floor((y1 + y2) / 2),
              width: x2 - x1,
              height: y2 - y1,
            };
          }
        }

        // Check if this node might match our selector
        switch (strategy.toLowerCase()) {
          case "id":
            if (
              attributes.resource_id &&
              attributes.resource_id.includes(selector)
            ) {
              relevanceScore += 10;
              match = true;
            }
            break;
          case "accessibility id":
            if (
              attributes.content_desc &&
              attributes.content_desc.includes(selector)
            ) {
              relevanceScore += 10;
              match = true;
            }
            break;
          case "xpath":
            // Basic text matching for XPath
            if (selector.includes("@text") && attributes.text) {
              const textMatch = selector.match(/@text=['"]([^'"]+)['"]/);
              if (textMatch && attributes.text.includes(textMatch[1])) {
                relevanceScore += 10;
                match = true;
              }
            }
            // Class name matching
            if (selector.includes(attributes.class)) {
              relevanceScore += 5;
            }
            break;
          default:
            // General matching - check if text contains our selector
            if (attributes.text && attributes.text.includes(selector)) {
              relevanceScore += 8;
              match = true;
            }
            // Check if content-desc contains our selector
            if (
              attributes.content_desc &&
              attributes.content_desc.includes(selector)
            ) {
              relevanceScore += 8;
              match = true;
            }
        }

        // Additional signals for interactive elements
        if (attributes.clickable === "true") relevanceScore += 3;
        if (attributes.enabled === "true") relevanceScore += 2;
        if (attributes.focusable === "true") relevanceScore += 1;

        // Add this element if it's at least somewhat relevant
        if (relevanceScore > 0 || match) {
          elements.push({
            path,
            relevanceScore,
            match,
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            text: attributes.text,
            attributes,
          });
        }
      }

      // Process child nodes
      if (node.node) {
        node.node.forEach((child: any, index: number) => {
          findElements(
            child,
            path ? `${path}/node[${index + 1}]` : `//node[${index + 1}]`
          );
        });
      }
    };

    // Start the search from the root node
    if (parsed.hierarchy && parsed.hierarchy.node) {
      findElements(parsed.hierarchy.node[0], "/hierarchy/node[1]");
    } else if (parsed.hierarchy) {
      findElements(parsed.hierarchy, "/hierarchy");
    }

    // Sort elements by relevance score
    elements.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return the most relevant element if one was found
    if (elements.length > 0) {
      const bestMatch = elements[0];
      console.log(
        `Best match found: ${JSON.stringify({
          path: bestMatch.path,
          score: bestMatch.relevanceScore,
          text: bestMatch.text,
          x: bestMatch.x,
          y: bestMatch.y,
        })}`
      );

      return {
        x: bestMatch.x,
        y: bestMatch.y,
        width: bestMatch.width,
        height: bestMatch.height,
        text: bestMatch.text,
      };
    }

    console.log("No matching elements found");
    return null;
  } catch (error) {
    console.error("Error parsing page source:", error);
    return null;
  }
}

// Helper function to extract interactive elements from page source
async function extractInteractiveElements(
  pageSource: string,
  targetText?: string,
  elementType?: string
): Promise<
  Array<{
    type: string;
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    attributes?: Record<string, string>;
  }>
> {
  // Parse the XML source
  const { parseStringPromise } = require("xml2js");
  try {
    const parsed = await parseStringPromise(pageSource);
    const elements: Array<{
      type: string;
      text?: string;
      x: number;
      y: number;
      width: number;
      height: number;
      attributes?: Record<string, string>;
    }> = [];

    // Helper function to recursively find elements
    const findInteractiveElements = (node: any) => {
      if (!node) return;

      // Process this node
      const attributes = node.$;
      if (attributes) {
        let isInteractive = false;
        let matchesFilter = true;

        // Check if interactive
        if (
          attributes.clickable === "true" ||
          attributes.enabled === "true" ||
          attributes.focusable === "true" ||
          attributes.class?.includes("Button") ||
          attributes.class?.includes("EditText")
        ) {
          isInteractive = true;
        }

        // Apply text filter if provided
        if (
          targetText &&
          !(
            (attributes.text && attributes.text.includes(targetText)) ||
            (attributes.content_desc &&
              attributes.content_desc.includes(targetText))
          )
        ) {
          matchesFilter = false;
        }

        // Apply element type filter if provided
        if (
          elementType &&
          !(
            attributes.class &&
            attributes.class.toLowerCase().includes(elementType.toLowerCase())
          )
        ) {
          matchesFilter = false;
        }

        if (isInteractive && matchesFilter) {
          // Extract bounds if available
          let bounds = { x: 0, y: 0, width: 0, height: 0 };
          if (attributes.bounds) {
            const boundsMatch = attributes.bounds.match(
              /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/
            );
            if (boundsMatch) {
              const x1 = parseInt(boundsMatch[1]);
              const y1 = parseInt(boundsMatch[2]);
              const x2 = parseInt(boundsMatch[3]);
              const y2 = parseInt(boundsMatch[4]);
              bounds = {
                x: Math.floor((x1 + x2) / 2),
                y: Math.floor((y1 + y2) / 2),
                width: x2 - x1,
                height: y2 - y1,
              };
            }
          }

          elements.push({
            type: attributes.class,
            text: attributes.text || attributes.content_desc,
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            attributes,
          });
        }
      }

      // Process child nodes
      if (node.node) {
        node.node.forEach((child: any) => {
          findInteractiveElements(child);
        });
      }
    };

    // Start the search from the root node
    if (parsed.hierarchy && parsed.hierarchy.node) {
      findInteractiveElements(parsed.hierarchy.node[0]);
    } else if (parsed.hierarchy) {
      findInteractiveElements(parsed.hierarchy);
    }

    return elements;
  } catch (error) {
    console.error("Error extracting interactive elements:", error);
    return [];
  }
}
