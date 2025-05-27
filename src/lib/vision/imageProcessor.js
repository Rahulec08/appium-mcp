"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualRecovery = exports.ImageProcessor = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var sharp_1 = __importDefault(require("sharp"));
// Import the Jimp wrapper using the Node.js imports field in package.json
var _jimp_1 = require("#jimp");
var Tesseract = __importStar(require("tesseract.js"));
var pixelmatch_1 = __importDefault(require("pixelmatch"));
var pngjs_1 = require("pngjs");
/**
 * Image processing utilities for enhanced visual recovery
 */
var ImageProcessor = /** @class */ (function () {
    function ImageProcessor() {
    }
    /**
     * Performs template matching to find a smaller image within a larger one
     * @param screenshotPath Path to the full screenshot
     * @param templatePath Path to the template image to find
     * @param threshold Matching threshold (0.0 to 1.0)
     * @returns Coordinates of the match or null if not found
     */
    ImageProcessor.findTemplateInImage = function (screenshotPath_1, templatePath_1) {
        return __awaiter(this, arguments, void 0, function (screenshotPath, templatePath, threshold) {
            var screenshot, template, templateWidth, templateHeight, screenshotWidth, screenshotHeight, maxDiff, bestMatch, y, x, diff, ty, tx, screenshotPixel, templatePixel, similarity, error_1;
            if (threshold === void 0) { threshold = 0.8; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, _jimp_1.Jimp.read(screenshotPath)];
                    case 1:
                        screenshot = _a.sent();
                        return [4 /*yield*/, _jimp_1.Jimp.read(templatePath)];
                    case 2:
                        template = _a.sent();
                        templateWidth = template.getWidth();
                        templateHeight = template.getHeight();
                        screenshotWidth = screenshot.getWidth();
                        screenshotHeight = screenshot.getHeight();
                        maxDiff = templateWidth * templateHeight * 4 * 255;
                        bestMatch = { x: 0, y: 0, diff: maxDiff };
                        // Sliding window approach to find the template
                        for (y = 0; y <= screenshotHeight - templateHeight; y += 2) {
                            // Step by 2 pixels for faster performance
                            for (x = 0; x <= screenshotWidth - templateWidth; x += 2) {
                                diff = 0;
                                // Calculate pixel differences in the current window
                                for (ty = 0; ty < templateHeight; ty += 2) {
                                    for (tx = 0; tx < templateWidth; tx += 2) {
                                        screenshotPixel = (0, _jimp_1.intToRGBA)(screenshot.getPixelColor(x + tx, y + ty));
                                        templatePixel = (0, _jimp_1.intToRGBA)(template.getPixelColor(tx, ty));
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
                                    bestMatch = { x: x, y: y, diff: diff };
                                }
                            }
                        }
                        similarity = 1 - bestMatch.diff / maxDiff;
                        // Return match if above threshold
                        if (similarity >= threshold) {
                            return [2 /*return*/, {
                                    x: bestMatch.x + Math.floor(templateWidth / 2),
                                    y: bestMatch.y + Math.floor(templateHeight / 2),
                                    width: templateWidth,
                                    height: templateHeight,
                                }];
                        }
                        return [2 /*return*/, null];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Error in template matching:", error_1);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Performs OCR on an image to extract text
     * @param imagePath Path to the image
     * @param options Configuration options
     * @returns Extracted text and bounding boxes
     */
    ImageProcessor.performOCR = function (imagePath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var worker, result, _a, left, top_1, width, height, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, Tesseract.createWorker((options === null || options === void 0 ? void 0 : options.lang) || "eng")];
                    case 1:
                        worker = _b.sent();
                        result = void 0;
                        if (!(options === null || options === void 0 ? void 0 : options.rect)) return [3 /*break*/, 3];
                        _a = options.rect, left = _a.left, top_1 = _a.top, width = _a.width, height = _a.height;
                        return [4 /*yield*/, worker.recognize(imagePath, {
                                rectangle: { left: left, top: top_1, width: width, height: height },
                            })];
                    case 2:
                        result = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, worker.recognize(imagePath)];
                    case 4:
                        // Process the entire image
                        result = _b.sent();
                        _b.label = 5;
                    case 5: return [4 /*yield*/, worker.terminate()];
                    case 6:
                        _b.sent();
                        // Transform the result into our expected format
                        return [2 /*return*/, {
                                text: result.data.text,
                                confidence: result.data.confidence,
                                words: result.data.words.map(function (word) { return ({
                                    text: word.text,
                                    confidence: word.confidence,
                                    bbox: word.bbox,
                                }); }),
                            }];
                    case 7:
                        error_2 = _b.sent();
                        console.error("Error performing OCR:", error_2);
                        return [2 /*return*/, { text: "", confidence: 0, words: [] }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Compares two images and returns the difference as a percentage
     * @param image1Path Path to first image
     * @param image2Path Path to second image
     * @param options Comparison options
     * @returns Difference as percentage and diff image path
     */
    ImageProcessor.compareImages = function (image1Path, image2Path, options) {
        return __awaiter(this, void 0, void 0, function () {
            var threshold, outputDiffPath, img1, _a, _b, img2, _c, _d, resizedImg2, img2Resized, diff, _i, _e, region, y, x, idx, numDiffPixels, diffPercentage, diffImagePath, diff, _f, _g, region, y, x, idx, numDiffPixels, diffPercentage, diffImagePath, error_3;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        _h.trys.push([0, 10, , 11]);
                        threshold = (options === null || options === void 0 ? void 0 : options.threshold) || 0.1;
                        outputDiffPath = (options === null || options === void 0 ? void 0 : options.outputDiffPath) || null;
                        _b = (_a = pngjs_1.PNG.sync).read;
                        return [4 /*yield*/, fs.readFile(image1Path)];
                    case 1:
                        img1 = _b.apply(_a, [_h.sent()]);
                        _d = (_c = pngjs_1.PNG.sync).read;
                        return [4 /*yield*/, fs.readFile(image2Path)];
                    case 2:
                        img2 = _d.apply(_c, [_h.sent()]);
                        if (!(img1.width !== img2.width || img1.height !== img2.height)) return [3 /*break*/, 6];
                        return [4 /*yield*/, (0, sharp_1.default)(image2Path)
                                .resize(img1.width, img1.height)
                                .png()
                                .toBuffer()];
                    case 3:
                        resizedImg2 = _h.sent();
                        img2Resized = pngjs_1.PNG.sync.read(resizedImg2);
                        diff = new pngjs_1.PNG({ width: img1.width, height: img1.height });
                        // Apply ignore regions by making them black in both images
                        if (options === null || options === void 0 ? void 0 : options.ignoreRegions) {
                            for (_i = 0, _e = options.ignoreRegions; _i < _e.length; _i++) {
                                region = _e[_i];
                                for (y = region.y; y < region.y + region.height; y++) {
                                    for (x = region.x; x < region.x + region.width; x++) {
                                        if (x < img1.width && y < img1.height) {
                                            idx = (img1.width * y + x) << 2;
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
                        numDiffPixels = (0, pixelmatch_1.default)(img1.data, img2Resized.data, diff.data, img1.width, img1.height, { threshold: threshold });
                        diffPercentage = numDiffPixels / (img1.width * img1.height);
                        diffImagePath = null;
                        if (!outputDiffPath) return [3 /*break*/, 5];
                        return [4 /*yield*/, fs.writeFile(outputDiffPath, pngjs_1.PNG.sync.write(diff))];
                    case 4:
                        _h.sent();
                        diffImagePath = outputDiffPath;
                        _h.label = 5;
                    case 5: return [2 /*return*/, { diffPercentage: diffPercentage, diffImagePath: diffImagePath }];
                    case 6:
                        diff = new pngjs_1.PNG({ width: img1.width, height: img1.height });
                        // Apply ignore regions by making them black in both images
                        if (options === null || options === void 0 ? void 0 : options.ignoreRegions) {
                            for (_f = 0, _g = options.ignoreRegions; _f < _g.length; _f++) {
                                region = _g[_f];
                                for (y = region.y; y < region.y + region.height; y++) {
                                    for (x = region.x; x < region.x + region.width; x++) {
                                        if (x < img1.width && y < img1.height) {
                                            idx = (img1.width * y + x) << 2;
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
                        numDiffPixels = (0, pixelmatch_1.default)(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: threshold });
                        diffPercentage = numDiffPixels / (img1.width * img1.height);
                        diffImagePath = null;
                        if (!outputDiffPath) return [3 /*break*/, 8];
                        return [4 /*yield*/, fs.writeFile(outputDiffPath, pngjs_1.PNG.sync.write(diff))];
                    case 7:
                        _h.sent();
                        diffImagePath = outputDiffPath;
                        _h.label = 8;
                    case 8: return [2 /*return*/, { diffPercentage: diffPercentage, diffImagePath: diffImagePath }];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_3 = _h.sent();
                        console.error("Error comparing images:", error_3);
                        return [2 /*return*/, { diffPercentage: 1, diffImagePath: null }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Finds elements in an image based on visual characteristics
     * @param imagePath Path to the image
     * @returns Information about detected UI elements
     */
    ImageProcessor.detectUIElements = function (imagePath) {
        return __awaiter(this, void 0, void 0, function () {
            var image, metadata, _a, width, _b, height, grayscale, edges, ocrResult_1, elements_1, imageBuffer, tempFilePath, jimpImg, potentialButtons, scanStep, y, x, centerColor, isRectangle, right, bottom, rightColor, bottomColor, rectWidth, rectHeight, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 8, , 9]);
                        image = (0, sharp_1.default)(imagePath);
                        return [4 /*yield*/, image.metadata()];
                    case 1:
                        metadata = _c.sent();
                        _a = metadata.width, width = _a === void 0 ? 0 : _a, _b = metadata.height, height = _b === void 0 ? 0 : _b;
                        return [4 /*yield*/, image.grayscale().toBuffer()];
                    case 2:
                        grayscale = _c.sent();
                        return [4 /*yield*/, (0, sharp_1.default)(grayscale)
                                .convolve({
                                width: 3,
                                height: 3,
                                kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
                            })
                                .toBuffer()];
                    case 3:
                        edges = _c.sent();
                        return [4 /*yield*/, this.performOCR(imagePath)];
                    case 4:
                        ocrResult_1 = _c.sent();
                        elements_1 = [];
                        // Add text elements from OCR
                        ocrResult_1.words.forEach(function (word) {
                            if (word.confidence > 70) {
                                elements_1.push({
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
                        return [4 /*yield*/, (0, sharp_1.default)(imagePath).toBuffer()];
                    case 5:
                        imageBuffer = _c.sent();
                        tempFilePath = path.join(path.dirname(imagePath), "temp_".concat(Date.now(), ".png"));
                        return [4 /*yield*/, fs.writeFile(tempFilePath, imageBuffer)];
                    case 6:
                        _c.sent();
                        return [4 /*yield*/, _jimp_1.Jimp.read(tempFilePath)];
                    case 7:
                        jimpImg = _c.sent();
                        // Clean up temp file after use
                        fs.unlink(tempFilePath).catch(function () { });
                        potentialButtons = [];
                        scanStep = 10;
                        for (y = 0; y < height - scanStep; y += scanStep) {
                            for (x = 0; x < width - scanStep; x += scanStep) {
                                centerColor = (0, _jimp_1.intToRGBA)(jimpImg.getPixelColor(x, y));
                                isRectangle = true;
                                right = x;
                                bottom = y;
                                // Look for horizontal edge
                                while (right < width - 1) {
                                    rightColor = (0, _jimp_1.intToRGBA)(jimpImg.getPixelColor(right + 1, y));
                                    if (this.colorDifference(centerColor, rightColor) > 30) {
                                        break;
                                    }
                                    right += scanStep;
                                    if (right >= width - 1)
                                        break;
                                }
                                // Look for vertical edge
                                while (bottom < height - 1) {
                                    bottomColor = (0, _jimp_1.intToRGBA)(jimpImg.getPixelColor(x, bottom + 1));
                                    if (this.colorDifference(centerColor, bottomColor) > 30) {
                                        break;
                                    }
                                    bottom += scanStep;
                                    if (bottom >= height - 1)
                                        break;
                                }
                                rectWidth = right - x;
                                rectHeight = bottom - y;
                                if (rectWidth > 60 &&
                                    rectHeight > 30 &&
                                    rectWidth < width / 2 &&
                                    rectHeight < height / 2) {
                                    potentialButtons.push({
                                        x: x,
                                        y: y,
                                        width: rectWidth,
                                        height: rectHeight,
                                    });
                                }
                            }
                        }
                        // Add potential buttons to elements
                        potentialButtons.forEach(function (button) {
                            // Check if this button contains text (from OCR)
                            var hasText = ocrResult_1.words.some(function (word) {
                                return (word.bbox.x0 >= button.x &&
                                    word.bbox.x1 <= button.x + button.width &&
                                    word.bbox.y0 >= button.y &&
                                    word.bbox.y1 <= button.y + button.height);
                            });
                            elements_1.push({
                                type: hasText ? "button" : "rectangle",
                                confidence: hasText ? 0.8 : 0.5,
                                bbox: button,
                            });
                        });
                        return [2 /*return*/, elements_1];
                    case 8:
                        error_4 = _c.sent();
                        console.error("Error detecting UI elements:", error_4);
                        return [2 /*return*/, []];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate the difference between two colors
     * @param color1 First color
     * @param color2 Second color
     * @returns Difference value
     */
    ImageProcessor.colorDifference = function (color1, color2) {
        return (Math.abs(color1.r - color2.r) +
            Math.abs(color1.g - color2.g) +
            Math.abs(color1.b - color2.b));
    };
    return ImageProcessor;
}());
exports.ImageProcessor = ImageProcessor;
/**
 * Visual recovery utilities for UI elements
 */
var VisualRecovery = /** @class */ (function () {
    function VisualRecovery() {
    }
    /**
     * Find an element by appearance when traditional locators fail
     * @param baseScreenshotPath Path to previous screenshot containing element
     * @param currentScreenshotPath Path to current screenshot
     * @param elementRegion Region of element in base screenshot
     * @returns Coordinates of element in new screenshot or null if not found
     */
    VisualRecovery.recoverElementByAppearance = function (baseScreenshotPath, currentScreenshotPath, elementRegion) {
        return __awaiter(this, void 0, void 0, function () {
            var elementImage, tempDir, elementTemplatePath, match, error_5, _a, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 12, , 13]);
                        return [4 /*yield*/, (0, sharp_1.default)(baseScreenshotPath)
                                .extract({
                                left: elementRegion.x,
                                top: elementRegion.y,
                                width: elementRegion.width,
                                height: elementRegion.height,
                            })
                                .toBuffer()];
                    case 1:
                        elementImage = _b.sent();
                        tempDir = path.dirname(baseScreenshotPath);
                        elementTemplatePath = path.join(tempDir, "temp_element_".concat(Date.now(), ".png"));
                        return [4 /*yield*/, fs.writeFile(elementTemplatePath, elementImage)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 11]);
                        return [4 /*yield*/, ImageProcessor.findTemplateInImage(currentScreenshotPath, elementTemplatePath, 0.7)];
                    case 4:
                        match = _b.sent();
                        // Clean up the temporary file
                        return [4 /*yield*/, fs.unlink(elementTemplatePath)];
                    case 5:
                        // Clean up the temporary file
                        _b.sent();
                        return [2 /*return*/, match];
                    case 6:
                        error_5 = _b.sent();
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, fs.unlink(elementTemplatePath)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        _a = _b.sent();
                        return [3 /*break*/, 10];
                    case 10: throw error_5;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_6 = _b.sent();
                        console.error("Error recovering element by appearance:", error_6);
                        return [2 /*return*/, null];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find text in an image and return its location
     * @param screenshotPath Path to the screenshot
     * @param text Text to find
     * @param options Optional parameters
     * @returns Coordinates of the text or null if not found
     */
    VisualRecovery.findTextInImage = function (screenshotPath, text, options) {
        return __awaiter(this, void 0, void 0, function () {
            var minConfidence, ocrResult, _a, x, y, width, height, normalizedSearchText, bestMatch, _i, _b, word, normalizedWord, x0, y0, error_7;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        minConfidence = (options === null || options === void 0 ? void 0 : options.minConfidence) || 0.7;
                        ocrResult = void 0;
                        if (!(options === null || options === void 0 ? void 0 : options.searchRegion)) return [3 /*break*/, 2];
                        _a = options.searchRegion, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
                        return [4 /*yield*/, ImageProcessor.performOCR(screenshotPath, {
                                rect: {
                                    left: x,
                                    top: y,
                                    width: width,
                                    height: height,
                                },
                            })];
                    case 1:
                        ocrResult = _c.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, ImageProcessor.performOCR(screenshotPath)];
                    case 3:
                        ocrResult = _c.sent();
                        _c.label = 4;
                    case 4:
                        normalizedSearchText = text.toLowerCase().trim();
                        bestMatch = null;
                        for (_i = 0, _b = ocrResult.words; _i < _b.length; _i++) {
                            word = _b[_i];
                            normalizedWord = word.text.toLowerCase().trim();
                            // Check if this word matches our search text
                            if ((normalizedWord === normalizedSearchText ||
                                normalizedWord.includes(normalizedSearchText) ||
                                normalizedSearchText.includes(normalizedWord)) &&
                                word.confidence / 100 >= minConfidence &&
                                (!bestMatch || word.confidence > bestMatch.confidence)) {
                                bestMatch = word;
                            }
                        }
                        // If we found a match, return its location
                        if (bestMatch) {
                            x0 = bestMatch.bbox.x0;
                            y0 = bestMatch.bbox.y0;
                            // If we were searching in a region, adjust coordinates
                            if (options === null || options === void 0 ? void 0 : options.searchRegion) {
                                x0 += options.searchRegion.x;
                                y0 += options.searchRegion.y;
                            }
                            return [2 /*return*/, {
                                    x: Math.round((bestMatch.bbox.x0 + bestMatch.bbox.x1) / 2),
                                    y: Math.round((bestMatch.bbox.y0 + bestMatch.bbox.y1) / 2),
                                    width: bestMatch.bbox.x1 - bestMatch.bbox.x0,
                                    height: bestMatch.bbox.y1 - bestMatch.bbox.y0,
                                    confidence: bestMatch.confidence / 100,
                                }];
                        }
                        return [2 /*return*/, null];
                    case 5:
                        error_7 = _c.sent();
                        console.error("Error finding text in image:", error_7);
                        return [2 /*return*/, null];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find a UI element by visual characteristics
     * @param screenshotPath Path to the screenshot
     * @param options Search options
     * @returns Element coordinates or null if not found
     */
    VisualRecovery.findElementByVisualCharacteristics = function (screenshotPath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var elements, filteredElements, _a, x_1, y_1, width_1, height_1, textLocation_1, textLocation_2, best, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, ImageProcessor.detectUIElements(screenshotPath)];
                    case 1:
                        elements = _b.sent();
                        filteredElements = elements;
                        // Filter by element type if specified
                        if (options.elementType && options.elementType !== "any") {
                            filteredElements = filteredElements.filter(function (el) {
                                return el.type.toLowerCase().includes(options.elementType.toLowerCase());
                            });
                        }
                        // Filter by region if specified
                        if (options.region) {
                            _a = options.region, x_1 = _a.x, y_1 = _a.y, width_1 = _a.width, height_1 = _a.height;
                            filteredElements = filteredElements.filter(function (el) {
                                var elX = el.bbox.x;
                                var elY = el.bbox.y;
                                return elX >= x_1 && elX <= x_1 + width_1 && elY >= y_1 && elY <= y_1 + height_1;
                            });
                        }
                        if (!options.expectedText) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.findTextInImage(screenshotPath, options.expectedText)];
                    case 2:
                        textLocation_1 = _b.sent();
                        if (textLocation_1) {
                            // Find elements that contain this text location
                            filteredElements = filteredElements.filter(function (el) {
                                return (textLocation_1.x >= el.bbox.x &&
                                    textLocation_1.x <= el.bbox.x + el.bbox.width &&
                                    textLocation_1.y >= el.bbox.y &&
                                    textLocation_1.y <= el.bbox.y + el.bbox.height);
                            });
                        }
                        else {
                            // If we were specifically looking for text and didn't find it, return null
                            return [2 /*return*/, null];
                        }
                        _b.label = 3;
                    case 3:
                        if (!options.nearText) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.findTextInImage(screenshotPath, options.nearText)];
                    case 4:
                        textLocation_2 = _b.sent();
                        if (textLocation_2) {
                            // Sort elements by proximity to this text
                            filteredElements.sort(function (a, b) {
                                var distA = Math.sqrt(Math.pow(a.bbox.x - textLocation_2.x, 2) +
                                    Math.pow(a.bbox.y - textLocation_2.y, 2));
                                var distB = Math.sqrt(Math.pow(b.bbox.x - textLocation_2.x, 2) +
                                    Math.pow(b.bbox.y - textLocation_2.y, 2));
                                return distA - distB;
                            });
                        }
                        _b.label = 5;
                    case 5:
                        // If we have any elements left after filtering, return the best match
                        if (filteredElements.length > 0) {
                            // Sort by confidence
                            filteredElements.sort(function (a, b) { return b.confidence - a.confidence; });
                            best = filteredElements[0];
                            return [2 /*return*/, {
                                    x: best.bbox.x + Math.floor(best.bbox.width / 2),
                                    y: best.bbox.y + Math.floor(best.bbox.height / 2),
                                    width: best.bbox.width,
                                    height: best.bbox.height,
                                    confidence: best.confidence,
                                    type: best.type,
                                }];
                        }
                        return [2 /*return*/, null];
                    case 6:
                        error_8 = _b.sent();
                        console.error("Error finding element by visual characteristics:", error_8);
                        return [2 /*return*/, null];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return VisualRecovery;
}());
exports.VisualRecovery = VisualRecovery;
