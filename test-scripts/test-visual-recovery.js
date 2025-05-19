/**
 * Comprehensive Visual Recovery Test Script
 *
 * This script tests each component of the enhanced visual recovery system individually.
 * Run this script to validate all implementations one by one.
 *
 * Usage: node test-scripts/test-visual-recovery.js
 */

import {
  ImageProcessor,
  VisualRecovery,
} from "../dist/lib/vision/imageProcessor.js";
import * as path from "path";
import * as fs from "fs";

// Global configuration
const SCREENSHOTS_DIR = path.join(process.cwd(), "test-screenshots");
const OUTPUT_DIR = path.join(process.cwd(), "test-output");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get test screenshots
function getTestScreenshots() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.error(`Screenshots directory not found: ${SCREENSHOTS_DIR}`);
    process.exit(1);
  }

  const screenshots = fs
    .readdirSync(SCREENSHOTS_DIR)
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .map((file) => path.join(SCREENSHOTS_DIR, file));

  if (screenshots.length === 0) {
    console.error("No test screenshots found");
    process.exit(1);
  }

  return screenshots;
}

// Format test result
function formatTestResult(passed, message) {
  return passed ? `✅ PASS: ${message}` : `❌ FAIL: ${message}`;
}

// Utility function to save test results
async function saveTestResults(results) {
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const resultsPath = path.join(OUTPUT_DIR, `test-results-${timestamp}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nTest results saved to: ${resultsPath}`);
}

// Test 1: OCR (Text Detection)
async function testOCR() {
  console.log("\n------ Test 1: OCR Text Detection ------");

  const screenshots = getTestScreenshots();
  const results = [];
  let testPassed = false;

  try {
    // Test on first screenshot
    const firstScreenshot = screenshots[0];
    console.log(`Testing OCR on ${path.basename(firstScreenshot)}...`);

    const ocrResult = await ImageProcessor.performOCR(firstScreenshot);

    // Check if we got any words
    testPassed = ocrResult.words.length > 0;

    console.log(
      `Detected ${
        ocrResult.words.length
      } words with confidence ${ocrResult.confidence.toFixed(1)}%`
    );

    if (ocrResult.words.length > 0) {
      console.log("Sample words:");
      ocrResult.words.slice(0, 5).forEach((word) => {
        console.log(
          `- "${word.text}" (${word.confidence.toFixed(1)}%) at [${
            word.bbox.x0
          },${word.bbox.y0}]`
        );
      });
    }

    results.push({
      name: "Basic OCR",
      passed: testPassed,
      details: {
        screenshot: path.basename(firstScreenshot),
        wordsDetected: ocrResult.words.length,
        confidence: ocrResult.confidence,
      },
    });

    // Test partial OCR with region
    if (ocrResult.words.length > 0) {
      const firstWord = ocrResult.words[0];
      const region = {
        left: Math.max(0, firstWord.bbox.x0 - 10),
        top: Math.max(0, firstWord.bbox.y0 - 10),
        width: firstWord.bbox.x1 - firstWord.bbox.x0 + 20,
        height: firstWord.bbox.y1 - firstWord.bbox.y0 + 20,
      };

      const partialOcrResult = await ImageProcessor.performOCR(
        firstScreenshot,
        { rect: region }
      );
      const partialTestPassed = partialOcrResult.words.length > 0;

      console.log(
        `\nTested partial OCR on region: [${region.left},${region.top},${region.width},${region.height}]`
      );
      console.log(
        `Detected ${partialOcrResult.words.length} words in the region`
      );

      results.push({
        name: "Partial OCR",
        passed: partialTestPassed,
        details: {
          screenshot: path.basename(firstScreenshot),
          region,
          wordsDetected: partialOcrResult.words.length,
        },
      });
    }

    return results;
  } catch (error) {
    console.error("Error during OCR test:", error);
    results.push({
      name: "OCR Test",
      passed: false,
      error: error.message,
    });
    return results;
  }
}

// Test 2: UI Element Detection
async function testUIElementDetection() {
  console.log("\n------ Test 2: UI Element Detection ------");

  const screenshots = getTestScreenshots();
  const results = [];

  try {
    // Test on first screenshot
    const firstScreenshot = screenshots[0];
    console.log(
      `Testing UI Element Detection on ${path.basename(firstScreenshot)}...`
    );

    const elements = await ImageProcessor.detectUIElements(firstScreenshot);
    const testPassed = elements.length > 0;

    console.log(`Detected ${elements.length} UI elements`);

    if (elements.length > 0) {
      console.log("Sample elements:");
      elements.slice(0, 5).forEach((element, i) => {
        console.log(
          `- ${i + 1}. Type: ${element.type}, Confidence: ${(
            element.confidence * 100
          ).toFixed(1)}%`
        );
        console.log(
          `  Position: (${element.bbox.x}, ${element.bbox.y}), Size: ${element.bbox.width}x${element.bbox.height}`
        );
      });

      // Save visualization of detected elements
      const outputImage = path.join(
        OUTPUT_DIR,
        `detected_elements_${Date.now()}.png`
      );
      // Note: In a real implementation, you might want to add visualization code here

      results.push({
        name: "UI Element Detection",
        passed: testPassed,
        details: {
          screenshot: path.basename(firstScreenshot),
          elementsDetected: elements.length,
          elementTypes: [...new Set(elements.map((el) => el.type))],
        },
      });
    }

    return results;
  } catch (error) {
    console.error("Error during UI Element Detection test:", error);
    results.push({
      name: "UI Element Detection",
      passed: false,
      error: error.message,
    });
    return results;
  }
}

// Test 3: Template Matching
async function testTemplateMatching() {
  console.log("\n------ Test 3: Template Matching ------");

  const screenshots = getTestScreenshots();
  if (screenshots.length < 2) {
    console.log("Need at least 2 screenshots for template matching test");
    return [
      {
        name: "Template Matching",
        passed: false,
        error: "Insufficient screenshots",
      },
    ];
  }

  const results = [];

  try {
    // Create a template from a portion of the first screenshot
    const baseScreenshot = screenshots[0];
    const targetScreenshot = screenshots[1];

    console.log(`Creating template from ${path.basename(baseScreenshot)}...`);

    // First, detect UI elements to find something to use as a template
    const elements = await ImageProcessor.detectUIElements(baseScreenshot);

    if (elements.length === 0) {
      console.log("No elements detected for template creation");
      return [
        {
          name: "Template Matching",
          passed: false,
          error: "No elements detected for template creation",
        },
      ];
    }

    // Use the first detected element as our template region
    const templateRegion = elements[0].bbox;
    console.log(
      `Using element as template: (${templateRegion.x},${templateRegion.y}) ${templateRegion.width}x${templateRegion.height}`
    );

    // Extract template
    const templatePath = path.join(OUTPUT_DIR, `template_${Date.now()}.png`);

    // Use Visual Recovery's recoverElementByAppearance which handles template extraction and matching
    console.log(
      `Testing template matching from ${path.basename(
        baseScreenshot
      )} to ${path.basename(targetScreenshot)}...`
    );

    const match = await VisualRecovery.recoverElementByAppearance(
      baseScreenshot,
      targetScreenshot,
      templateRegion
    );

    const testPassed = match !== null;
    console.log(formatTestResult(testPassed, "Template Matching"));

    if (match) {
      console.log(
        `Match found at (${match.x}, ${match.y}) with size ${match.width}x${match.height}`
      );
    }

    results.push({
      name: "Template Matching",
      passed: testPassed,
      details: {
        baseScreenshot: path.basename(baseScreenshot),
        targetScreenshot: path.basename(targetScreenshot),
        templateRegion,
        match: match || null,
      },
    });

    return results;
  } catch (error) {
    console.error("Error during Template Matching test:", error);
    return [
      {
        name: "Template Matching",
        passed: false,
        error: error.message,
      },
    ];
  }
}

// Test 4: Image Comparison
async function testImageComparison() {
  console.log("\n------ Test 4: Image Comparison ------");

  const screenshots = getTestScreenshots();
  if (screenshots.length < 2) {
    console.log("Need at least 2 screenshots for image comparison test");
    return [
      {
        name: "Image Comparison",
        passed: false,
        error: "Insufficient screenshots",
      },
    ];
  }

  const results = [];

  try {
    const image1 = screenshots[0];
    const image2 = screenshots[1];

    console.log(
      `Comparing ${path.basename(image1)} with ${path.basename(image2)}...`
    );

    const diffPath = path.join(OUTPUT_DIR, `diff_${Date.now()}.png`);
    const { diffPercentage, diffImagePath } =
      await ImageProcessor.compareImages(image1, image2, {
        threshold: 0.1,
        outputDiffPath: diffPath,
      });

    // Any valid result is a passing test for this functionality
    const testPassed = true;

    console.log(`Difference: ${(diffPercentage * 100).toFixed(2)}%`);
    console.log(`Diff image saved to: ${diffImagePath}`);

    results.push({
      name: "Basic Image Comparison",
      passed: testPassed,
      details: {
        image1: path.basename(image1),
        image2: path.basename(image2),
        diffPercentage,
        diffImagePath,
      },
    });

    // Test with ignore regions if there are UI elements to ignore
    const elements = await ImageProcessor.detectUIElements(image1);
    if (elements.length > 0) {
      // Ignore the region of the first element
      const ignoreRegion = elements[0].bbox;

      console.log(
        `Testing comparison with ignored region (${ignoreRegion.x},${ignoreRegion.y}) ${ignoreRegion.width}x${ignoreRegion.height}...`
      );

      const ignoreDiffPath = path.join(
        OUTPUT_DIR,
        `diff_ignored_${Date.now()}.png`
      );
      const ignoreResult = await ImageProcessor.compareImages(image1, image2, {
        threshold: 0.1,
        outputDiffPath: ignoreDiffPath,
        ignoreRegions: [ignoreRegion],
      });

      console.log(
        `Difference with ignored region: ${(
          ignoreResult.diffPercentage * 100
        ).toFixed(2)}%`
      );
      console.log(
        `Diff with ignored region saved to: ${ignoreResult.diffImagePath}`
      );

      results.push({
        name: "Image Comparison with Ignored Region",
        passed: true,
        details: {
          image1: path.basename(image1),
          image2: path.basename(image2),
          ignoreRegion,
          diffPercentage: ignoreResult.diffPercentage,
          diffImagePath: ignoreResult.diffImagePath,
        },
      });
    }

    return results;
  } catch (error) {
    console.error("Error during Image Comparison test:", error);
    return [
      {
        name: "Image Comparison",
        passed: false,
        error: error.message,
      },
    ];
  }
}

// Test 5: Text Finding in Images
async function testTextFinding() {
  console.log("\n------ Test 5: Text Finding in Images ------");

  const screenshots = getTestScreenshots();
  const results = [];

  try {
    // Use first screenshot
    const screenshot = screenshots[0];
    console.log(`Testing text finding in ${path.basename(screenshot)}...`);

    // First get all text with OCR to know what to search for
    const ocrResult = await ImageProcessor.performOCR(screenshot);

    if (ocrResult.words.length === 0) {
      console.log("No text found in the screenshot");
      return [
        {
          name: "Text Finding",
          passed: false,
          error: "No text found in the screenshot",
        },
      ];
    }

    // Get words with good confidence
    const goodWords = ocrResult.words
      .filter((word) => word.confidence > 80 && word.text.length > 3)
      .map((word) => word.text);

    if (goodWords.length === 0) {
      console.log("No suitable words found for text finding test");
      // Try with any word
      goodWords.push(ocrResult.words[0].text);
    }

    // Test finding a known word
    const wordToFind = goodWords[0];
    console.log(`Searching for text "${wordToFind}" in the screenshot...`);

    const foundText = await VisualRecovery.findTextInImage(
      screenshot,
      wordToFind
    );

    const testPassed = foundText !== null;
    console.log(formatTestResult(testPassed, "Text Finding"));

    if (foundText) {
      console.log(
        `Found "${wordToFind}" at (${foundText.x}, ${
          foundText.y
        }) with confidence ${(foundText.confidence * 100).toFixed(1)}%`
      );
    }

    results.push({
      name: "Basic Text Finding",
      passed: testPassed,
      details: {
        screenshot: path.basename(screenshot),
        searchText: wordToFind,
        result: foundText || null,
      },
    });

    // Test finding text in a region
    if (foundText) {
      // Define a search region around the found text
      const searchRegion = {
        x: Math.max(0, foundText.x - foundText.width * 2),
        y: Math.max(0, foundText.y - foundText.height * 2),
        width: foundText.width * 4,
        height: foundText.height * 4,
      };

      console.log(
        `Searching for text "${wordToFind}" in region (${searchRegion.x},${searchRegion.y}) ${searchRegion.width}x${searchRegion.height}...`
      );

      const foundInRegion = await VisualRecovery.findTextInImage(
        screenshot,
        wordToFind,
        {
          searchRegion,
        }
      );

      const regionTestPassed = foundInRegion !== null;
      console.log(formatTestResult(regionTestPassed, "Text Finding in Region"));

      if (foundInRegion) {
        console.log(
          `Found "${wordToFind}" at (${foundInRegion.x}, ${
            foundInRegion.y
          }) with confidence ${(foundInRegion.confidence * 100).toFixed(1)}%`
        );
      }

      results.push({
        name: "Text Finding in Region",
        passed: regionTestPassed,
        details: {
          screenshot: path.basename(screenshot),
          searchText: wordToFind,
          searchRegion,
          result: foundInRegion || null,
        },
      });
    }

    return results;
  } catch (error) {
    console.error("Error during Text Finding test:", error);
    return [
      {
        name: "Text Finding",
        passed: false,
        error: error.message,
      },
    ];
  }
}

// Test 6: Visual Element Finder
async function testVisualElementFinder() {
  console.log("\n------ Test 6: Visual Element Finder ------");

  const screenshots = getTestScreenshots();
  const results = [];

  try {
    // Use first screenshot
    const screenshot = screenshots[0];
    console.log(
      `Testing visual element finder in ${path.basename(screenshot)}...`
    );

    // Try to find any element first
    console.log("Looking for any UI element...");
    const anyElement = await VisualRecovery.findElementByVisualCharacteristics(
      screenshot,
      { elementType: "any" }
    );

    const anyElementTestPassed = anyElement !== null;
    console.log(formatTestResult(anyElementTestPassed, "Find Any Element"));

    if (anyElement) {
      console.log(
        `Found element of type ${anyElement.type} at (${anyElement.x}, ${
          anyElement.y
        }) with confidence ${(anyElement.confidence * 100).toFixed(1)}%`
      );
    }

    results.push({
      name: "Find Any Element",
      passed: anyElementTestPassed,
      details: {
        screenshot: path.basename(screenshot),
        result: anyElement || null,
      },
    });

    // Try to find a button
    console.log("Looking for a button...");
    const buttonElement =
      await VisualRecovery.findElementByVisualCharacteristics(screenshot, {
        elementType: "button",
      });

    const buttonTestPassed = buttonElement !== null;
    console.log(formatTestResult(buttonTestPassed, "Find Button Element"));

    if (buttonElement) {
      console.log(
        `Found button at (${buttonElement.x}, ${
          buttonElement.y
        }) with confidence ${(buttonElement.confidence * 100).toFixed(1)}%`
      );
    }

    results.push({
      name: "Find Button Element",
      passed: buttonTestPassed,
      details: {
        screenshot: path.basename(screenshot),
        result: buttonElement || null,
      },
    });

    // Try to find text and then an element near it
    // First get all text with OCR to know what to search for
    const ocrResult = await ImageProcessor.performOCR(screenshot);

    if (ocrResult.words.length > 0) {
      // Get a word with good confidence
      const goodWord = ocrResult.words.filter(
        (word) => word.confidence > 80 && word.text.length > 3
      )[0];

      if (goodWord) {
        const nearText = goodWord.text;
        console.log(`Looking for an element near the text "${nearText}"...`);

        const nearTextElement =
          await VisualRecovery.findElementByVisualCharacteristics(screenshot, {
            nearText,
          });

        const nearTextTestPassed = nearTextElement !== null;
        console.log(
          formatTestResult(nearTextTestPassed, "Find Element Near Text")
        );

        if (nearTextElement) {
          console.log(
            `Found element of type ${
              nearTextElement.type
            } near "${nearText}" at (${nearTextElement.x}, ${
              nearTextElement.y
            }) with confidence ${(nearTextElement.confidence * 100).toFixed(
              1
            )}%`
          );
        }

        results.push({
          name: "Find Element Near Text",
          passed: nearTextTestPassed,
          details: {
            screenshot: path.basename(screenshot),
            nearText,
            result: nearTextElement || null,
          },
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error during Visual Element Finder test:", error);
    return [
      {
        name: "Visual Element Finder",
        passed: false,
        error: error.message,
      },
    ];
  }
}

// Run all tests
async function runAllTests() {
  console.log("Starting Visual Recovery Feature Tests...");
  console.log(`Test screenshots directory: ${SCREENSHOTS_DIR}`);
  console.log(`Test output directory: ${OUTPUT_DIR}`);

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Run OCR tests
  testResults.tests.ocr = await testOCR();

  // Run UI Element Detection tests
  testResults.tests.uiElementDetection = await testUIElementDetection();

  // Run Template Matching tests
  testResults.tests.templateMatching = await testTemplateMatching();

  // Run Image Comparison tests
  testResults.tests.imageComparison = await testImageComparison();

  // Run Text Finding tests
  testResults.tests.textFinding = await testTextFinding();

  // Run Visual Element Finder tests
  testResults.tests.visualElementFinder = await testVisualElementFinder();

  // Calculate overall results
  const allTests = Object.values(testResults.tests).flat();
  const totalTests = allTests.length;
  const passedTests = allTests.filter((test) => test.passed).length;

  console.log("\n------ Test Summary ------");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Failed Tests: ${totalTests - passedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
  );

  // Save results to file
  await saveTestResults(testResults);
}

// Start the tests
runAllTests().catch(console.error);
