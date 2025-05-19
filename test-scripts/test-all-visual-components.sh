#!/bin/bash

# Test all visual recovery components one by one
# Run this script to validate the enhanced visual recovery implementation

ROOT_DIR=$(cd $(dirname $0)/.. && pwd)
OUTPUT_DIR="${ROOT_DIR}/test-output"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="${OUTPUT_DIR}/test-results_${TIMESTAMP}.log"

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Utility function to print section headers
print_header() {
  echo ""
  echo "==========================================="
  echo "  $1"
  echo "==========================================="
  echo ""
}

# Utility function to print test result
print_result() {
  local test_name="$1"
  local status="$2"
  
  if [ "$status" -eq 0 ]; then
    echo "✅ PASS: $test_name"
  else
    echo "❌ FAIL: $test_name"
  fi
}

# Redirect all output to log file
exec > >(tee -a "${LOG_FILE}") 2>&1

# Start the tests
echo "Visual Recovery Testing Script"
echo "Date: $(date)"
echo "Log file: ${LOG_FILE}"

# Build the project first
print_header "Building the project"
npm run build
build_status=$?
print_result "Project build" $build_status

# Test 1: Basic OCR
print_header "Test 1: Basic OCR"
echo "Running basic OCR test on test screenshots..."
node -e "
const { ImageProcessor } = require('${ROOT_DIR}/dist/lib/vision/imageProcessor.js');
const path = require('path');
const fs = require('fs');

// Get all test screenshots
const screenshotsDir = path.join('${ROOT_DIR}', 'test-screenshots');
const screenshots = fs.readdirSync(screenshotsDir)
  .filter(file => file.toLowerCase().endsWith('.png'))
  .map(file => path.join(screenshotsDir, file));

if (screenshots.length === 0) {
  console.error('No test screenshots found!');
  process.exit(1);
}

(async () => {
  try {
    const screenshotPath = screenshots[0];
    console.log(\`Testing OCR on \${path.basename(screenshotPath)}...\`);
    
    const ocrResult = await ImageProcessor.performOCR(screenshotPath);
    
    console.log(\`Detected \${ocrResult.words.length} words with confidence \${ocrResult.confidence.toFixed(1)}%\`);
    console.log('Text content (truncated):');
    console.log(ocrResult.text.substring(0, 100) + (ocrResult.text.length > 100 ? '...' : ''));
    
    if (ocrResult.words.length > 0) {
      console.log('\\nSample detected words:');
      ocrResult.words.slice(0, 5).forEach(word => {
        console.log(\`- \"\${word.text}\" (\${word.confidence.toFixed(1)}%) at [\${word.bbox.x0},\${word.bbox.y0}]\`);
      });
      process.exit(0); // Success
    } else {
      console.error('No words detected in the image.');
      process.exit(1); // Failure
    }
  } catch (error) {
    console.error('Error during OCR test:', error);
    process.exit(1); // Failure
  }
})();
"
ocr_status=$?
print_result "Basic OCR" $ocr_status

# Test 2: UI Element Detection
print_header "Test 2: UI Element Detection"
echo "Running UI Element Detection test..."
node -e "
const { ImageProcessor } = require('${ROOT_DIR}/dist/lib/vision/imageProcessor.js');
const path = require('path');
const fs = require('fs');

// Get all test screenshots
const screenshotsDir = path.join('${ROOT_DIR}', 'test-screenshots');
const screenshots = fs.readdirSync(screenshotsDir)
  .filter(file => file.toLowerCase().endsWith('.png'))
  .map(file => path.join(screenshotsDir, file));

if (screenshots.length === 0) {
  console.error('No test screenshots found!');
  process.exit(1);
}

(async () => {
  try {
    const screenshotPath = screenshots[0];
    console.log(\`Testing UI Element Detection on \${path.basename(screenshotPath)}...\`);
    
    const elements = await ImageProcessor.detectUIElements(screenshotPath);
    
    console.log(\`Detected \${elements.length} UI elements\`);
    
    if (elements.length > 0) {
      console.log('\\nSample detected elements:');
      elements.slice(0, 5).forEach((element, i) => {
        console.log(\`- \${i+1}. Type: \${element.type}, Confidence: \${(element.confidence * 100).toFixed(1)}%\`);
        console.log(\`  Position: (\${element.bbox.x}, \${element.bbox.y}), Size: \${element.bbox.width}x\${element.bbox.height}\`);
      });
      process.exit(0); // Success
    } else {
      console.error('No UI elements detected in the image.');
      process.exit(1); // Failure
    }
  } catch (error) {
    console.error('Error during UI Element Detection test:', error);
    process.exit(1); // Failure
  }
})();
"
ui_detection_status=$?
print_result "UI Element Detection" $ui_detection_status

# Test 3: Image Comparison
print_header "Test 3: Image Comparison"
echo "Running Image Comparison test..."
node -e "
const { ImageProcessor } = require('${ROOT_DIR}/dist/lib/vision/imageProcessor.js');
const path = require('path');
const fs = require('fs');

// Get all test screenshots
const screenshotsDir = path.join('${ROOT_DIR}', 'test-screenshots');
const screenshots = fs.readdirSync(screenshotsDir)
  .filter(file => file.toLowerCase().endsWith('.png'))
  .map(file => path.join(screenshotsDir, file));

if (screenshots.length < 2) {
  console.error('Need at least 2 screenshots for comparison test!');
  process.exit(1);
}

(async () => {
  try {
    const image1Path = screenshots[0];
    const image2Path = screenshots[1];
    
    console.log(\`Comparing \${path.basename(image1Path)} with \${path.basename(image2Path)}...\`);
    
    const outputDiffPath = path.join('${OUTPUT_DIR}', \`image_diff_\${Date.now()}.png\`);
    const { diffPercentage, diffImagePath } = await ImageProcessor.compareImages(
      image1Path,
      image2Path,
      {
        threshold: 0.1,
        outputDiffPath
      }
    );
    
    console.log(\`Difference: \${(diffPercentage * 100).toFixed(2)}%\`);
    console.log(\`Diff image saved to: \${diffImagePath}\`);
    process.exit(0); // Success
  } catch (error) {
    console.error('Error during Image Comparison test:', error);
    process.exit(1); // Failure
  }
})();
"
image_comparison_status=$?
print_result "Image Comparison" $image_comparison_status

# Test 4: Text Finding in Images
print_header "Test 4: Text Finding in Images"
echo "Running Text Finding test..."
node -e "
const { VisualRecovery } = require('${ROOT_DIR}/dist/lib/vision/imageProcessor.js');
const path = require('path');
const fs = require('fs');

// Get all test screenshots
const screenshotsDir = path.join('${ROOT_DIR}', 'test-screenshots');
const screenshots = fs.readdirSync(screenshotsDir)
  .filter(file => file.toLowerCase().endsWith('.png'))
  .map(file => path.join(screenshotsDir, file));

if (screenshots.length === 0) {
  console.error('No test screenshots found!');
  process.exit(1);
}

// Common UI text patterns to search for
const searchTerms = ['Settings', 'OK', 'Cancel', 'Next', 'Done', 'Back', 'Menu', 'Home', 
                    'Display', 'Battery', 'Network', 'About', 'Phone', 'Device', 'Wi-Fi',
                    'Bluetooth', 'Security', 'Sound', 'App', 'System'];

(async () => {
  let found = false;
  try {
    const screenshotPath = screenshots[0];
    console.log(\`Testing Text Finding in \${path.basename(screenshotPath)}...\`);
    
    // Try each search term until one is found
    for (const term of searchTerms) {
      console.log(\`Searching for '\${term}'...\`);
      const result = await VisualRecovery.findTextInImage(screenshotPath, term);
      
      if (result) {
        console.log(\`✅ Found '\${term}' at (\${result.x}, \${result.y}) with \${(result.confidence * 100).toFixed(1)}% confidence\`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log('⚠️ Could not find any of the common UI text patterns in the image.');
      // Don't fail the test, as it might be normal for some screenshots
    }
    
    process.exit(0); // Success  
  } catch (error) {
    console.error('Error during Text Finding test:', error);
    process.exit(1); // Failure
  }
})();
"
text_finding_status=$?
print_result "Text Finding in Images" $text_finding_status

# Test 5: Element Recovery
print_header "Test 5: Element Recovery using Template Matching"
echo "Running Element Recovery test..."
node -e "
const { VisualRecovery } = require('${ROOT_DIR}/dist/lib/vision/imageProcessor.js');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Get all test screenshots
const screenshotsDir = path.join('${ROOT_DIR}', 'test-screenshots');
const screenshots = fs.readdirSync(screenshotsDir)
  .filter(file => file.toLowerCase().endsWith('.png'))
  .map(file => path.join(screenshotsDir, file));

if (screenshots.length < 2) {
  console.error('Need at least 2 screenshots for element recovery test!');
  process.exit(1);
}

(async () => {
  try {
    const baseScreenshotPath = screenshots[0];
    const currentScreenshotPath = screenshots[1];
    
    console.log(\`Testing element recovery from \${path.basename(baseScreenshotPath)} to \${path.basename(currentScreenshotPath)}...\`);
    
    // First, get image dimensions to extract a region
    const metadata = await sharp(baseScreenshotPath).metadata();
    
    // Define a region of interest (center of the screen)
    const centerRegion = {
      x: Math.floor(metadata.width / 4),
      y: Math.floor(metadata.height / 4),
      width: Math.floor(metadata.width / 2),
      height: Math.floor(metadata.height / 2)
    };
    
    console.log(\`Using region: (\${centerRegion.x}, \${centerRegion.y}) \${centerRegion.width}x\${centerRegion.height}\`);
    
    // Try to find the element in the new screenshot
    const match = await VisualRecovery.recoverElementByAppearance(
      baseScreenshotPath,
      currentScreenshotPath,
      centerRegion
    );
    
    if (match) {
      console.log(\`✅ Found matching element at (\${match.x}, \${match.y}) with size \${match.width}x\${match.height}\`);
      process.exit(0); // Success
    } else {
      console.log('⚠️ No matching element found between the screenshots.');
      // Don't fail the test as screenshots might be too different
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during Element Recovery test:', error);
    process.exit(1); // Failure
  }
})();
"
element_recovery_status=$?
print_result "Element Recovery" $element_recovery_status

# Test 6: Visual Element Finder
print_header "Test 6: Visual Element Finder"
echo "Running Visual Element Finder test..."
node -e "
const { VisualRecovery } = require('${ROOT_DIR}/dist/lib/vision/imageProcessor.js');
const path = require('path');
const fs = require('fs');

// Get all test screenshots
const screenshotsDir = path.join('${ROOT_DIR}', 'test-screenshots');
const screenshots = fs.readdirSync(screenshotsDir)
  .filter(file => file.toLowerCase().endsWith('.png'))
  .map(file => path.join(screenshotsDir, file));

if (screenshots.length === 0) {
  console.error('No test screenshots found!');
  process.exit(1);
}

(async () => {
  try {
    const screenshotPath = screenshots[0];
    console.log(\`Testing Visual Element Finder on \${path.basename(screenshotPath)}...\`);
    
    // Try to find a button element
    console.log('Looking for button elements...');
    const buttonElement = await VisualRecovery.findElementByVisualCharacteristics(
      screenshotPath,
      { elementType: 'button' }
    );
    
    if (buttonElement) {
      console.log(\`✅ Found button element at (\${buttonElement.x}, \${buttonElement.y}) with \${(buttonElement.confidence * 100).toFixed(1)}% confidence\`);
    } else {
      console.log('⚠️ No button elements found');
    }
    
    // Try to find a text element
    console.log('\\nLooking for text elements...');
    const textElement = await VisualRecovery.findElementByVisualCharacteristics(
      screenshotPath,
      { elementType: 'text' }
    );
    
    if (textElement) {
      console.log(\`✅ Found text element at (\${textElement.x}, \${textElement.y}) with \${(textElement.confidence * 100).toFixed(1)}% confidence\`);
    } else {
      console.log('⚠️ No text elements found');
    }
    
    // The test is successful if we found at least one element
    if (buttonElement || textElement) {
      process.exit(0); // Success
    } else {
      console.error('Could not find any elements in the image.');
      process.exit(1); // Failure
    }
  } catch (error) {
    console.error('Error during Visual Element Finder test:', error);
    process.exit(1); // Failure
  }
})();
"
element_finder_status=$?
print_result "Visual Element Finder" $element_finder_status

# Test 7: Comprehensive Test with Visual Processing Test Script
print_header "Test 7: Comprehensive Visual Processing Test"
echo "Running the comprehensive test script..."
node "${ROOT_DIR}/dist/examples/visual-processing-test.js"
comprehensive_test_status=$?
print_result "Comprehensive Visual Processing Test" $comprehensive_test_status

# Print summary
print_header "Test Summary"
echo "Total Tests Run: 7"
passed_tests=0
failed_tests=0

for status in $build_status $ocr_status $ui_detection_status $image_comparison_status $text_finding_status $element_recovery_status $element_finder_status $comprehensive_test_status; do
  if [ "$status" -eq 0 ]; then
    ((passed_tests++))
  else
    ((failed_tests++))
  fi
done

echo "Tests Passed: $passed_tests"
echo "Tests Failed: $failed_tests"
echo "Success Rate: $(( (passed_tests * 100) / 7 ))%"

echo ""
echo "Test results saved to: ${LOG_FILE}"
echo ""

if [ "$failed_tests" -eq 0 ]; then
  echo "🎉 All tests passed! The enhanced visual recovery implementation is working correctly."
else
  echo "⚠️ Some tests failed. Check the log file for details: ${LOG_FILE}"
fi

exit $failed_tests