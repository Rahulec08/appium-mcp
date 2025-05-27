import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";
// Import both the Jimp class and functions from our ESM wrapper
import { Jimp, intToRGBA } from "./jimp-esm.js";
import * as Tesseract from "tesseract.js";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// Tesseract types
interface TesseractWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

// Fix the module augmentation - correct syntax
declare module "tesseract.js" {
  interface Page {
    words: Array<{
      text: string;
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
  }
}

/**
 * Image processing utilities for enhanced visual recovery
 */
export class ImageProcessor {
  /**
   * Performs template matching to find a smaller image within a larger one
   * @param screenshotPath Path to the full screenshot
   * @param templatePath Path to the template image to find
   * @param threshold Matching threshold (0.0 to 1.0)
   * @returns Coordinates of the match or null if not found
   */
  static async findTemplateInImage(
    screenshotPath: string,
    templatePath: string,
    threshold = 0.8
  ): Promise<{ x: number; y: number; width: number; height: number } | null> {
    try {
      // Load both images using Jimp
      const screenshot = await Jimp.read(screenshotPath);
      const template = await Jimp.read(templatePath);

      const templateWidth = template.getWidth();
      const templateHeight = template.getHeight();
      const screenshotWidth = screenshot.getWidth();
      const screenshotHeight = screenshot.getHeight();

      // Calculate the maximum possible similarity (1.0)
      const maxDiff = templateWidth * templateHeight * 4 * 255; // 4 channels (RGBA) * max diff per channel

      let bestMatch = { x: 0, y: 0, diff: maxDiff };

      // Sliding window approach to find the template
      for (let y = 0; y <= screenshotHeight - templateHeight; y += 2) {
        // Step by 2 pixels for faster performance
        for (let x = 0; x <= screenshotWidth - templateWidth; x += 2) {
          // Step by 2 pixels for faster performance
          let diff = 0;

          // Calculate pixel differences in the current window
          for (let ty = 0; ty < templateHeight; ty += 2) {
            for (let tx = 0; tx < templateWidth; tx += 2) {
              const screenshotPixel = intToRGBA(
                screenshot.getPixelColor(x + tx, y + ty)
              );
              const templatePixel = intToRGBA(template.getPixelColor(tx, ty));

              // Calculate RGB difference
              diff += Math.abs(screenshotPixel.r - templatePixel.r);
              diff += Math.abs(screenshotPixel.g - templatePixel.g);
              diff += Math.abs(screenshotPixel.b - templatePixel.b);

              // Early termination if we've already exceeded the best match
              if (diff >= bestMatch.diff) {
                break;
              }
            }

            if (diff >= bestMatch.diff) {
              break;
            }
          }

          // Update best match if this position has a lower difference
          if (diff < bestMatch.diff) {
            bestMatch = { x, y, diff };
          }
        }
      }

      // Convert diff to similarity score (0.0 to 1.0)
      const similarity = 1 - bestMatch.diff / maxDiff;

      // Return match if above threshold
      if (similarity >= threshold) {
        return {
          x: bestMatch.x + Math.floor(templateWidth / 2),
          y: bestMatch.y + Math.floor(templateHeight / 2),
          width: templateWidth,
          height: templateHeight,
        };
      }

      return null;
    } catch (error) {
      console.error("Error in template matching:", error);
      return null;
    }
  }

  /**
   * Performs OCR on an image to extract text
   * @param imagePath Path to the image
   * @param options Configuration options
   * @returns Extracted text and bounding boxes
   */
  static async performOCR(
    imagePath: string,
    options?: {
      lang?: string;
      rect?: { left: number; top: number; width: number; height: number };
    }
  ): Promise<{
    text: string;
    confidence: number;
    words: Array<{
      text: string;
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
  }> {
    try {
      // Create a worker with language
      const worker = await Tesseract.createWorker(options?.lang || "eng");
      let result;

      if (options?.rect) {
        // Process only a portion of the image
        const { left, top, width, height } = options.rect;
        result = await worker.recognize(imagePath, {
          rectangle: { left, top, width, height },
        });
      } else {
        // Process the entire image
        result = await worker.recognize(imagePath);
      }

      await worker.terminate();

      // Transform the result into our expected format
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words.map((word) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
      };
    } catch (error) {
      console.error("Error performing OCR:", error);
      return { text: "", confidence: 0, words: [] };
    }
  }

  /**
   * Compares two images and returns the difference as a percentage
   * @param image1Path Path to first image
   * @param image2Path Path to second image
   * @param options Comparison options
   * @returns Difference as percentage and diff image path
   */
  static async compareImages(
    image1Path: string,
    image2Path: string,
    options?: {
      threshold?: number;
      outputDiffPath?: string;
      ignoreRegions?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    }
  ): Promise<{ diffPercentage: number; diffImagePath: string | null }> {
    try {
      const threshold = options?.threshold || 0.1;
      const outputDiffPath = options?.outputDiffPath || null;

      // Read images
      const img1 = PNG.sync.read(await fs.readFile(image1Path));
      const img2 = PNG.sync.read(await fs.readFile(image2Path));

      // Ensure both images are the same size
      if (img1.width !== img2.width || img1.height !== img2.height) {
        // Resize the second image to match the first
        const resizedImg2 = await sharp(image2Path)
          .resize(img1.width, img1.height)
          .png()
          .toBuffer();

        // Convert the buffer back to PNG
        const img2Resized = PNG.sync.read(resizedImg2);

        // Create output buffer for diff
        const diff = new PNG({ width: img1.width, height: img1.height });

        // Apply ignore regions by making them black in both images
        if (options?.ignoreRegions) {
          for (const region of options.ignoreRegions) {
            for (let y = region.y; y < region.y + region.height; y++) {
              for (let x = region.x; x < region.x + region.width; x++) {
                if (x < img1.width && y < img1.height) {
                  const idx = (img1.width * y + x) << 2;
                  img1.data[idx] = 0;
                  img1.data[idx + 1] = 0;
                  img1.data[idx + 2] = 0;
                  img2Resized.data[idx] = 0;
                  img2Resized.data[idx + 1] = 0;
                  img2Resized.data[idx + 2] = 0;
                }
              }
            }
          }
        }

        // Compare images and get number of different pixels
        const numDiffPixels = pixelmatch(
          img1.data,
          img2Resized.data,
          diff.data,
          img1.width,
          img1.height,
          { threshold }
        );

        // Calculate difference percentage
        const diffPercentage = numDiffPixels / (img1.width * img1.height);

        // Save diff image if path provided
        let diffImagePath = null;
        if (outputDiffPath) {
          await fs.writeFile(outputDiffPath, PNG.sync.write(diff));
          diffImagePath = outputDiffPath;
        }

        return { diffPercentage, diffImagePath };
      } else {
        // Create output buffer for diff
        const diff = new PNG({ width: img1.width, height: img1.height });

        // Apply ignore regions by making them black in both images
        if (options?.ignoreRegions) {
          for (const region of options.ignoreRegions) {
            for (let y = region.y; y < region.y + region.height; y++) {
              for (let x = region.x; x < region.x + region.width; x++) {
                if (x < img1.width && y < img1.height) {
                  const idx = (img1.width * y + x) << 2;
                  img1.data[idx] = 0;
                  img1.data[idx + 1] = 0;
                  img1.data[idx + 2] = 0;
                  img2.data[idx] = 0;
                  img2.data[idx + 1] = 0;
                  img2.data[idx + 2] = 0;
                }
              }
            }
          }
        }

        // Compare images and get number of different pixels
        const numDiffPixels = pixelmatch(
          img1.data,
          img2.data,
          diff.data,
          img1.width,
          img1.height,
          { threshold }
        );

        // Calculate difference percentage
        const diffPercentage = numDiffPixels / (img1.width * img1.height);

        // Save diff image if path provided
        let diffImagePath = null;
        if (outputDiffPath) {
          await fs.writeFile(outputDiffPath, PNG.sync.write(diff));
          diffImagePath = outputDiffPath;
        }

        return { diffPercentage, diffImagePath };
      }
    } catch (error) {
      console.error("Error comparing images:", error);
      return { diffPercentage: 1, diffImagePath: null };
    }
  }

  /**
   * Finds elements in an image based on visual characteristics
   * @param imagePath Path to the image
   * @returns Information about detected UI elements
   */
  static async detectUIElements(imagePath: string): Promise<
    Array<{
      type: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>
  > {
    try {
      // Load the image using Sharp
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const { width = 0, height = 0 } = metadata;

      // Convert to grayscale for easier analysis
      const grayscale = await image.grayscale().toBuffer();

      // Use edge detection to find potential UI elements
      const edges = await sharp(grayscale)
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
        })
        .toBuffer();

      // Perform OCR to identify text areas
      const ocrResult = await this.performOCR(imagePath);

      const elements: Array<{
        type: string;
        confidence: number;
        bbox: { x: number; y: number; width: number; height: number };
      }> = [];

      // Add text elements from OCR
      ocrResult.words.forEach((word) => {
        if (word.confidence > 70) {
          elements.push({
            type: "text",
            confidence: word.confidence / 100,
            bbox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
            },
          });
        }
      });

      // Simple heuristic for buttons: look for rectangles with text inside
      // This is a very simplified approach - real button detection would be more complex
      const imageBuffer = await sharp(imagePath).toBuffer();

      // Fix: Save to temporary file and read it with Jimp instead of using buffer directly
      const tempFilePath = path.join(
        path.dirname(imagePath),
        `temp_${Date.now()}.png`
      );
      await fs.writeFile(tempFilePath, imageBuffer);
      const jimpImg = await Jimp.read(tempFilePath);

      // Clean up temp file after use
      fs.unlink(tempFilePath).catch(() => {});

      const potentialButtons: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
      }> = [];

      // Scan for rectangle-like structures with contrasting borders
      // Skip pixels for better performance
      const scanStep = 10;

      for (let y = 0; y < height - scanStep; y += scanStep) {
        for (let x = 0; x < width - scanStep; x += scanStep) {
          const centerColor = intToRGBA(jimpImg.getPixelColor(x, y));
          let isRectangle = true;
          let right = x;
          let bottom = y;

          // Look for horizontal edge
          while (right < width - 1) {
            const rightColor = intToRGBA(jimpImg.getPixelColor(right + 1, y));
            if (this.colorDifference(centerColor, rightColor) > 30) {
              break;
            }
            right += scanStep;
            if (right >= width - 1) break;
          }

          // Look for vertical edge
          while (bottom < height - 1) {
            const bottomColor = intToRGBA(jimpImg.getPixelColor(x, bottom + 1));
            if (this.colorDifference(centerColor, bottomColor) > 30) {
              break;
            }
            bottom += scanStep;
            if (bottom >= height - 1) break;
          }

          // Check if we found a rectangle of reasonable size
          const rectWidth = right - x;
          const rectHeight = bottom - y;

          if (
            rectWidth > 60 &&
            rectHeight > 30 &&
            rectWidth < width / 2 &&
            rectHeight < height / 2
          ) {
            potentialButtons.push({
              x,
              y,
              width: rectWidth,
              height: rectHeight,
            });
          }
        }
      }

      // Add potential buttons to elements
      potentialButtons.forEach((button) => {
        // Check if this button contains text (from OCR)
        const hasText = ocrResult.words.some((word) => {
          return (
            word.bbox.x0 >= button.x &&
            word.bbox.x1 <= button.x + button.width &&
            word.bbox.y0 >= button.y &&
            word.bbox.y1 <= button.y + button.height
          );
        });

        elements.push({
          type: hasText ? "button" : "rectangle",
          confidence: hasText ? 0.8 : 0.5,
          bbox: button,
        });
      });

      return elements;
    } catch (error) {
      console.error("Error detecting UI elements:", error);
      return [];
    }
  }

  /**
   * Calculate the difference between two colors
   * @param color1 First color
   * @param color2 Second color
   * @returns Difference value
   */
  private static colorDifference(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number {
    return (
      Math.abs(color1.r - color2.r) +
      Math.abs(color1.g - color2.g) +
      Math.abs(color1.b - color2.b)
    );
  }
}

/**
 * Visual recovery utilities for UI elements
 */
export class VisualRecovery {
  /**
   * Find an element by appearance when traditional locators fail
   * @param baseScreenshotPath Path to previous screenshot containing element
   * @param currentScreenshotPath Path to current screenshot
   * @param elementRegion Region of element in base screenshot
   * @returns Coordinates of element in new screenshot or null if not found
   */
  static async recoverElementByAppearance(
    baseScreenshotPath: string,
    currentScreenshotPath: string,
    elementRegion: { x: number; y: number; width: number; height: number }
  ): Promise<{ x: number; y: number; width: number; height: number } | null> {
    try {
      // Extract the element image from the base screenshot
      const elementImage = await sharp(baseScreenshotPath)
        .extract({
          left: elementRegion.x,
          top: elementRegion.y,
          width: elementRegion.width,
          height: elementRegion.height,
        })
        .toBuffer();

      // Create a temporary file for the element template
      const tempDir = path.dirname(baseScreenshotPath);
      const elementTemplatePath = path.join(
        tempDir,
        `temp_element_${Date.now()}.png`
      );

      await fs.writeFile(elementTemplatePath, elementImage);

      try {
        // Use template matching to find this element in the current screenshot
        const match = await ImageProcessor.findTemplateInImage(
          currentScreenshotPath,
          elementTemplatePath,
          0.7
        );

        // Clean up the temporary file
        await fs.unlink(elementTemplatePath);

        return match;
      } catch (error) {
        // Clean up the temporary file even if there was an error
        try {
          await fs.unlink(elementTemplatePath);
        } catch {
          /* ignore cleanup errors */
        }

        throw error;
      }
    } catch (error) {
      console.error("Error recovering element by appearance:", error);
      return null;
    }
  }

  /**
   * Find text in an image and return its location
   * @param screenshotPath Path to the screenshot
   * @param text Text to find
   * @param options Optional parameters
   * @returns Coordinates of the text or null if not found
   */
  static async findTextInImage(
    screenshotPath: string,
    text: string,
    options?: {
      minConfidence?: number;
      searchRegion?: { x: number; y: number; width: number; height: number };
    }
  ): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  } | null> {
    try {
      const minConfidence = options?.minConfidence || 0.7;

      // Perform OCR on the whole image or just the search region
      let ocrResult;
      if (options?.searchRegion) {
        // Convert from x,y to left,top format
        const { x, y, width, height } = options.searchRegion;
        ocrResult = await ImageProcessor.performOCR(screenshotPath, {
          rect: {
            left: x,
            top: y,
            width: width,
            height: height,
          },
        });
      } else {
        ocrResult = await ImageProcessor.performOCR(screenshotPath);
      }

      // Normalize input text for comparison
      const normalizedSearchText = text.toLowerCase().trim();

      // Find the word that best matches our search text
      let bestMatch: {
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      } | null = null;

      for (const word of ocrResult.words) {
        const normalizedWord = word.text.toLowerCase().trim();

        // Check if this word matches our search text
        if (
          (normalizedWord === normalizedSearchText ||
            normalizedWord.includes(normalizedSearchText) ||
            normalizedSearchText.includes(normalizedWord)) &&
          word.confidence / 100 >= minConfidence &&
          (!bestMatch || word.confidence > bestMatch.confidence)
        ) {
          bestMatch = word;
        }
      }

      // If we found a match, return its location
      if (bestMatch) {
        let x0 = bestMatch.bbox.x0;
        let y0 = bestMatch.bbox.y0;

        // If we were searching in a region, adjust coordinates
        if (options?.searchRegion) {
          x0 += options.searchRegion.x;
          y0 += options.searchRegion.y;
        }

        return {
          x: Math.round((bestMatch.bbox.x0 + bestMatch.bbox.x1) / 2),
          y: Math.round((bestMatch.bbox.y0 + bestMatch.bbox.y1) / 2),
          width: bestMatch.bbox.x1 - bestMatch.bbox.x0,
          height: bestMatch.bbox.y1 - bestMatch.bbox.y0,
          confidence: bestMatch.confidence / 100,
        };
      }

      return null;
    } catch (error) {
      console.error("Error finding text in image:", error);
      return null;
    }
  }

  /**
   * Find a UI element by visual characteristics
   * @param screenshotPath Path to the screenshot
   * @param options Search options
   * @returns Element coordinates or null if not found
   */
  static async findElementByVisualCharacteristics(
    screenshotPath: string,
    options: {
      elementType?: "button" | "text" | "input" | "checkbox" | "toggle" | "any";
      nearText?: string;
      expectedText?: string;
      color?: { r: number; g: number; b: number; tolerance: number };
      region?: { x: number; y: number; width: number; height: number };
    }
  ): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    type: string;
  } | null> {
    try {
      // First, look for UI elements in the image
      const elements = await ImageProcessor.detectUIElements(screenshotPath);

      // Filter by specified constraints
      let filteredElements = elements;

      // Filter by element type if specified
      if (options.elementType && options.elementType !== "any") {
        filteredElements = filteredElements.filter((el) =>
          el.type.toLowerCase().includes(options.elementType!.toLowerCase())
        );
      }

      // Filter by region if specified
      if (options.region) {
        const { x, y, width, height } = options.region;
        filteredElements = filteredElements.filter((el) => {
          const elX = el.bbox.x;
          const elY = el.bbox.y;
          return elX >= x && elX <= x + width && elY >= y && elY <= y + height;
        });
      }

      // Check for expected text if specified
      if (options.expectedText) {
        // Find this text in the image
        const textLocation = await this.findTextInImage(
          screenshotPath,
          options.expectedText
        );

        if (textLocation) {
          // Find elements that contain this text location
          filteredElements = filteredElements.filter((el) => {
            return (
              textLocation.x >= el.bbox.x &&
              textLocation.x <= el.bbox.x + el.bbox.width &&
              textLocation.y >= el.bbox.y &&
              textLocation.y <= el.bbox.y + el.bbox.height
            );
          });
        } else {
          // If we were specifically looking for text and didn't find it, return null
          return null;
        }
      }

      // Look for elements near specified text
      if (options.nearText) {
        const textLocation = await this.findTextInImage(
          screenshotPath,
          options.nearText
        );

        if (textLocation) {
          // Sort elements by proximity to this text
          filteredElements.sort((a, b) => {
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
        }
      }

      // If we have any elements left after filtering, return the best match
      if (filteredElements.length > 0) {
        // Sort by confidence
        filteredElements.sort((a, b) => b.confidence - a.confidence);

        const best = filteredElements[0];
        return {
          x: best.bbox.x + Math.floor(best.bbox.width / 2),
          y: best.bbox.y + Math.floor(best.bbox.height / 2),
          width: best.bbox.width,
          height: best.bbox.height,
          confidence: best.confidence,
          type: best.type,
        };
      }

      return null;
    } catch (error) {
      console.error("Error finding element by visual characteristics:", error);
      return null;
    }
  }
}
