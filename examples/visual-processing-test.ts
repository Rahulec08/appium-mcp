/**
 * Visual Processing Test Script
 * This script demonstrates the enhanced visual recovery capabilities using image processing.
 *
 * Usage:
 * 1. Make sure you have test screenshots in the test-screenshots directory
 * 2. Run with: ts-node examples/visual-processing-test.ts
 */

import * as path from "path";
import * as fs from "fs";
import {
  ImageProcessor,
  VisualRecovery,
} from "../src/lib/vision/imageProcessor.js";

async function runVisualProcessingTests() {
  console.log("Starting Visual Recovery Tests...");

  // Path to test screenshots directory
  const screenshotsDir = path.join(process.cwd(), "test-screenshots");

  // Make sure the directory exists
  if (!fs.existsSync(screenshotsDir)) {
    console.error(`Test screenshots directory not found: ${screenshotsDir}`);
    console.log("Please make sure you have test screenshots available.");
    return;
  }

  // Get a list of all PNG files in the directory
  const screenshotFiles = fs
    .readdirSync(screenshotsDir)
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .map((file) => path.join(screenshotsDir, file));

  if (screenshotFiles.length < 2) {
    console.error(
      "Not enough test screenshots found. Need at least 2 screenshots."
    );
    return;
  }

  console.log(`Found ${screenshotFiles.length} screenshots for testing.`);

  try {
    // Test 1: OCR (Text Detection)
    console.log("\n--- Test 1: OCR Text Detection ---");
    const textResult = await ImageProcessor.performOCR(screenshotFiles[0]);
    console.log(
      `Detected ${textResult.words.length} text elements in ${path.basename(
        screenshotFiles[0]
      )}`
    );
    console.log(`Overall text content (truncated):`);
    console.log(
      textResult.text.substring(0, 100) +
        (textResult.text.length > 100 ? "..." : "")
    );
    console.log(`Confidence: ${textResult.confidence.toFixed(2)}%`);

    if (textResult.words.length > 0) {
      console.log("\nSample detected words:");
      textResult.words.slice(0, 5).forEach((word) => {
        console.log(
          `- "${word.text}" (${word.confidence.toFixed(1)}%) at [${
            word.bbox.x0
          },${word.bbox.y0}]`
        );
      });
    }

    // Test 2: UI Element Detection
    console.log("\n--- Test 2: UI Element Detection ---");
    const elements = await ImageProcessor.detectUIElements(screenshotFiles[0]);
    console.log(
      `Detected ${elements.length} UI elements in ${path.basename(
        screenshotFiles[0]
      )}`
    );

    if (elements.length > 0) {
      console.log("\nSample detected elements:");
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
    }

    // Test 3: Image Comparison
    console.log("\n--- Test 3: Image Comparison ---");
    const diffImagePath = path.join(
      screenshotsDir,
      `comparison_diff_${Date.now()}.png`
    );
    const { diffPercentage, diffImagePath: resultDiffPath } =
      await ImageProcessor.compareImages(
        screenshotFiles[0],
        screenshotFiles[1],
        { outputDiffPath: diffImagePath }
      );

    console.log(
      `Compared ${path.basename(screenshotFiles[0])} with ${path.basename(
        screenshotFiles[1]
      )}`
    );
    console.log(`Difference: ${(diffPercentage * 100).toFixed(2)}%`);
    console.log(`Diff image saved to: ${resultDiffPath}`);

    // Test 4: Finding Text in Images
    console.log("\n--- Test 4: Finding Text in Images ---");
    // Try to find common UI text like "Settings", "OK", "Cancel" in the screenshots
    const searchTerms = [
      "Settings",
      "OK",
      "Cancel",
      "Next",
      "Done",
      "Back",
      "Menu",
      "Home",
    ];

    for (const term of searchTerms) {
      const result = await VisualRecovery.findTextInImage(
        screenshotFiles[0],
        term
      );
      if (result) {
        console.log(`Found "${term}" in ${path.basename(screenshotFiles[0])}`);
        console.log(
          `Position: (${result.x}, ${result.y}), Size: ${result.width}x${result.height}`
        );
        console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        break;
      }
    }

    console.log("\nAll visual processing tests completed!");
  } catch (error) {
    console.error("Error during visual processing tests:", error);
  }
}

// Run the tests
runVisualProcessingTests().catch(console.error);
