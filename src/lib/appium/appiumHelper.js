"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppiumHelper = exports.AppiumError = void 0;
var webdriverio_1 = require("webdriverio");
/**
 * Custom error class for Appium operations
 */
var AppiumError = /** @class */ (function (_super) {
    __extends(AppiumError, _super);
    function AppiumError(message, cause) {
        var _this = _super.call(this, message) || this;
        _this.cause = cause;
        _this.name = "AppiumError";
        return _this;
    }
    return AppiumError;
}(Error));
exports.AppiumError = AppiumError;
/**
 * Helper class for Appium operations
 */
var AppiumHelper = /** @class */ (function () {
    /**
     * Create a new AppiumHelper instance
     *
     * @param screenshotDir Directory to save screenshots to
     */
    function AppiumHelper(screenshotDir) {
        if (screenshotDir === void 0) { screenshotDir = "./screenshots"; }
        this._driver = null;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.lastCapabilities = null;
        this.lastAppiumUrl = null;
        this.screenshotDir = screenshotDir;
    }
    Object.defineProperty(AppiumHelper.prototype, "driver", {
        /**
         * Public getter for driver (for test compatibility)
         */
        get: function () {
            return this._driver;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Initialize the Appium driver with provided capabilities
     *
     * @param capabilities Appium capabilities
     * @param appiumUrl Appium server URL
     * @returns Reference to the initialized driver
     */
    AppiumHelper.prototype.initializeDriver = function (capabilities_1) {
        return __awaiter(this, arguments, void 0, function (capabilities, appiumUrl) {
            var execSync, formattedCapabilities, _i, _a, _b, key, value, options, _c, error_1;
            if (appiumUrl === void 0) { appiumUrl = "http://localhost:4723"; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        // Source .bash_profile to ensure all environment variables are loaded
                        try {
                            // Only run this on Unix-like systems (macOS, Linux)
                            if (process.platform !== "win32") {
                                execSync = require("child_process").execSync;
                                execSync("source ~/.bash_profile 2>/dev/null || true", {
                                    shell: "/bin/bash",
                                });
                                console.log("Sourced .bash_profile for environment setup");
                            }
                        }
                        catch (envError) {
                            console.warn("Could not source .bash_profile, continuing anyway:", envError instanceof Error ? envError.message : String(envError));
                        }
                        // Store the capabilities and URL for potential session recovery
                        this.lastCapabilities = __assign({}, capabilities);
                        this.lastAppiumUrl = appiumUrl;
                        formattedCapabilities = {};
                        for (_i = 0, _a = Object.entries(capabilities); _i < _a.length; _i++) {
                            _b = _a[_i], key = _b[0], value = _b[1];
                            // platformName doesn't need a prefix, everything else does
                            if (key === "platformName") {
                                formattedCapabilities[key] = value;
                            }
                            else {
                                formattedCapabilities["appium:".concat(key)] = value;
                            }
                        }
                        options = {
                            hostname: new URL(appiumUrl).hostname,
                            port: parseInt(new URL(appiumUrl).port),
                            path: "/wd/hub",
                            connectionRetryCount: 3,
                            logLevel: "error",
                            capabilities: formattedCapabilities,
                        };
                        _c = this;
                        return [4 /*yield*/, (0, webdriverio_1.remote)(options)];
                    case 1:
                        _c._driver = _d.sent();
                        return [2 /*return*/, this._driver];
                    case 2:
                        error_1 = _d.sent();
                        throw new AppiumError("Failed to initialize Appium driver: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)), error_1 instanceof Error ? error_1 : undefined);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if the session is still valid and attempt to recover if not
     *
     * @returns true if session is valid or was successfully recovered
     */
    AppiumHelper.prototype.validateSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2, errorMessage, _a, recoveryError_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this._driver) {
                            return [2 /*return*/, false];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 12]);
                        // Simple check to see if session is still valid
                        return [4 /*yield*/, this._driver.getPageSource()];
                    case 2:
                        // Simple check to see if session is still valid
                        _b.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _b.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                        if (!(errorMessage.includes("NoSuchDriverError") ||
                            errorMessage.includes("terminated") ||
                            errorMessage.includes("not started"))) return [3 /*break*/, 11];
                        console.log("Appium session terminated, attempting to recover...");
                        if (!(this.lastCapabilities && this.lastAppiumUrl)) return [3 /*break*/, 11];
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 10, , 11]);
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this._driver.deleteSession()];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _a = _b.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        this._driver = null;
                        // Re-initialize with the stored capabilities
                        return [4 /*yield*/, this.initializeDriver(this.lastCapabilities, this.lastAppiumUrl)];
                    case 9:
                        // Re-initialize with the stored capabilities
                        _b.sent();
                        console.log("Session recovery successful");
                        return [2 /*return*/, true];
                    case 10:
                        recoveryError_1 = _b.sent();
                        console.error("Session recovery failed:", recoveryError_1 instanceof Error
                            ? recoveryError_1.message
                            : String(recoveryError_1));
                        return [2 /*return*/, false];
                    case 11: return [2 /*return*/, false];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Safely execute an Appium command with session validation
     *
     * @param operation Function that performs the Appium operation
     * @param errorMessage Error message to throw if operation fails
     * @returns Result of the operation
     */
    AppiumHelper.prototype.safeExecute = function (operation, errorMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3, retryError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 8]);
                        return [4 /*yield*/, operation()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        return [4 /*yield*/, this.validateSession()];
                    case 3:
                        if (!_a.sent()) return [3 /*break*/, 7];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, operation()];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        retryError_1 = _a.sent();
                        throw new AppiumError("".concat(errorMessage, ": ").concat(retryError_1 instanceof Error
                            ? retryError_1.message
                            : String(retryError_1)), retryError_1 instanceof Error ? retryError_1 : undefined);
                    case 7: throw new AppiumError("".concat(errorMessage, ": ").concat(error_3 instanceof Error ? error_3.message : String(error_3)), error_3 instanceof Error ? error_3 : undefined);
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the current driver instance
     *
     * @returns The driver instance or throws if not initialized
     */
    AppiumHelper.prototype.getDriver = function () {
        if (!this._driver) {
            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
        }
        return this._driver;
    };
    /**
     * Close the Appium session
     */
    AppiumHelper.prototype.closeDriver = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._driver) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, this._driver.deleteSession()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        error_4 = _a.sent();
                        console.warn("Error while closing Appium session:", error_4 instanceof Error ? error_4.message : String(error_4));
                        return [3 /*break*/, 5];
                    case 4:
                        this._driver = null;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Take a screenshot and return the base64 string
     * @param name Optional name for the screenshot (not used, for compatibility)
     * @returns base64 string of the screenshot
     */
    AppiumHelper.prototype.takeScreenshot = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this._driver) {
                    throw new AppiumError('Appium driver not initialized');
                }
                return [2 /*return*/, this._driver.takeScreenshot()];
            });
        });
    };
    /**
     * Check if an element exists
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns true if the element exists
     */
    AppiumHelper.prototype.elementExists = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            var _a;
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.findElement(selector, strategy)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find an element by its selector with retry mechanism
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @param timeoutMs Timeout in milliseconds
     * @returns WebdriverIO element if found
     */
    AppiumHelper.prototype.findElement = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy, timeoutMs) {
            var _this = this;
            if (strategy === void 0) { strategy = "xpath"; }
            if (timeoutMs === void 0) { timeoutMs = 10000; }
            return __generator(this, function (_a) {
                if (!this._driver) {
                    throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                }
                return [2 /*return*/, this.safeExecute(function () { return __awaiter(_this, void 0, void 0, function () {
                        var startTime, lastError, element, _a, error_5;
                        var _this = this;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    startTime = Date.now();
                                    _b.label = 1;
                                case 1:
                                    if (!(Date.now() - startTime < timeoutMs)) return [3 /*break*/, 18];
                                    _b.label = 2;
                                case 2:
                                    _b.trys.push([2, 15, , 17]);
                                    element = void 0;
                                    _a = strategy.toLowerCase();
                                    switch (_a) {
                                        case "id": return [3 /*break*/, 3];
                                        case "xpath": return [3 /*break*/, 5];
                                        case "accessibility id": return [3 /*break*/, 7];
                                        case "class name": return [3 /*break*/, 9];
                                    }
                                    return [3 /*break*/, 11];
                                case 3: return [4 /*yield*/, this._driver.$("id=".concat(selector))];
                                case 4:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 5: return [4 /*yield*/, this._driver.$("".concat(selector))];
                                case 6:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 7: return [4 /*yield*/, this._driver.$("~".concat(selector))];
                                case 8:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 9: return [4 /*yield*/, this._driver.$("".concat(selector))];
                                case 10:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 11: return [4 /*yield*/, this._driver.$("".concat(selector))];
                                case 12:
                                    element = _b.sent();
                                    _b.label = 13;
                                case 13: return [4 /*yield*/, element.waitForExist({ timeout: timeoutMs })];
                                case 14:
                                    _b.sent();
                                    return [2 /*return*/, element];
                                case 15:
                                    error_5 = _b.sent();
                                    lastError = error_5 instanceof Error ? error_5 : new Error(String(error_5));
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.retryDelay); })];
                                case 16:
                                    _b.sent();
                                    return [3 /*break*/, 17];
                                case 17: return [3 /*break*/, 1];
                                case 18: throw new AppiumError("Failed to find element with selector ".concat(selector, " after ").concat(timeoutMs, "ms: ").concat(lastError === null || lastError === void 0 ? void 0 : lastError.message), lastError);
                            }
                        });
                    }); }, "Failed to find element with selector ".concat(selector))];
            });
        });
    };
    /**
     * Find multiple elements by selector
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns Array of WebdriverIO elements
     */
    AppiumHelper.prototype.findElements = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            var elements, _a, error_6;
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this._driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, , 14]);
                        elements = void 0;
                        _a = strategy.toLowerCase();
                        switch (_a) {
                            case "id": return [3 /*break*/, 2];
                            case "xpath": return [3 /*break*/, 4];
                            case "accessibility id": return [3 /*break*/, 6];
                            case "class name": return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this._driver.$$("id=".concat(selector))];
                    case 3:
                        elements = _b.sent();
                        return [3 /*break*/, 12];
                    case 4: return [4 /*yield*/, this._driver.$$("".concat(selector))];
                    case 5:
                        elements = _b.sent();
                        return [3 /*break*/, 12];
                    case 6: return [4 /*yield*/, this._driver.$$("~".concat(selector))];
                    case 7:
                        elements = _b.sent();
                        return [3 /*break*/, 12];
                    case 8: return [4 /*yield*/, this._driver.$$("".concat(selector))];
                    case 9:
                        elements = _b.sent();
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, this._driver.$$("".concat(selector))];
                    case 11:
                        elements = _b.sent();
                        _b.label = 12;
                    case 12: return [2 /*return*/, elements];
                    case 13:
                        error_6 = _b.sent();
                        throw new AppiumError("Failed to find elements with selector ".concat(selector, ": ").concat(error_6 instanceof Error ? error_6.message : String(error_6)), error_6 instanceof Error ? error_6 : undefined);
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Tap on an element with retry mechanism
     * Uses W3C Actions API with fallback to TouchAction API for compatibility
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns true if successful
     * @throws AppiumError if the operation fails after retries
     */
    AppiumHelper.prototype.tapElement = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            var _this = this;
            if (strategy === void 0) { strategy = "accessibility"; }
            return __generator(this, function (_a) {
                if (!this._driver) {
                    throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                }
                return [2 /*return*/, this.safeExecute(function () { return __awaiter(_this, void 0, void 0, function () {
                        var lastError, attempt, element, _a, location_1, size, centerX, centerY, actions, w3cError_1, error_7;
                        var _this = this;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    attempt = 1;
                                    _b.label = 1;
                                case 1:
                                    if (!(attempt <= this.maxRetries)) return [3 /*break*/, 26];
                                    _b.label = 2;
                                case 2:
                                    _b.trys.push([2, 23, , 25]);
                                    element = void 0;
                                    _a = strategy.toLowerCase();
                                    switch (_a) {
                                        case "accessibility id": return [3 /*break*/, 3];
                                        case "id": return [3 /*break*/, 5];
                                        case "resource id": return [3 /*break*/, 5];
                                        case "android uiautomator": return [3 /*break*/, 7];
                                        case "uiautomator": return [3 /*break*/, 7];
                                        case "xpath": return [3 /*break*/, 9];
                                    }
                                    return [3 /*break*/, 11];
                                case 3: return [4 /*yield*/, this._driver.$("~".concat(selector))];
                                case 4:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 5: return [4 /*yield*/, this._driver.$("id=".concat(selector))];
                                case 6:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 7: return [4 /*yield*/, this._driver.$("android=".concat(selector))];
                                case 8:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 9: return [4 /*yield*/, this._driver.$("".concat(selector))];
                                case 10:
                                    element = _b.sent();
                                    return [3 /*break*/, 13];
                                case 11: return [4 /*yield*/, this.driver.$("".concat(selector))];
                                case 12:
                                    element = _b.sent();
                                    _b.label = 13;
                                case 13: return [4 /*yield*/, element.waitForClickable({ timeout: 5000 })];
                                case 14:
                                    _b.sent();
                                    return [4 /*yield*/, element.getLocation()];
                                case 15:
                                    location_1 = _b.sent();
                                    return [4 /*yield*/, element.getSize()];
                                case 16:
                                    size = _b.sent();
                                    centerX = location_1.x + size.width / 2;
                                    centerY = location_1.y + size.height / 2;
                                    _b.label = 17;
                                case 17:
                                    _b.trys.push([17, 19, , 21]);
                                    actions = [
                                        {
                                            type: "pointer",
                                            id: "finger1",
                                            parameters: { pointerType: "touch" },
                                            actions: [
                                                { type: "pointerMove", duration: 0, x: centerX, y: centerY },
                                                { type: "pointerDown", button: 0 },
                                                { type: "pause", duration: 100 },
                                                { type: "pointerUp", button: 0 },
                                            ],
                                        },
                                    ];
                                    return [4 /*yield*/, this.driver.performActions(actions)];
                                case 18:
                                    _b.sent();
                                    return [3 /*break*/, 21];
                                case 19:
                                    w3cError_1 = _b.sent();
                                    // Fallback to TouchAction API if W3C fails
                                    return [4 /*yield*/, this.driver.touchAction([
                                            {
                                                action: "tap",
                                                x: centerX,
                                                y: centerY,
                                            },
                                        ])];
                                case 20:
                                    // Fallback to TouchAction API if W3C fails
                                    _b.sent();
                                    return [3 /*break*/, 21];
                                case 21: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                                case 22:
                                    _b.sent();
                                    return [2 /*return*/, true];
                                case 23:
                                    error_7 = _b.sent();
                                    lastError = error_7 instanceof Error ? error_7 : new Error(String(error_7));
                                    // Wait before retrying
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.retryDelay); })];
                                case 24:
                                    // Wait before retrying
                                    _b.sent();
                                    return [3 /*break*/, 25];
                                case 25:
                                    attempt++;
                                    return [3 /*break*/, 1];
                                case 26: throw new AppiumError("Failed to tap element with selector ".concat(selector, " after ").concat(this.maxRetries, " attempts: ").concat(lastError === null || lastError === void 0 ? void 0 : lastError.message), lastError);
                            }
                        });
                    }); }, "Failed to tap element with selector ".concat(selector))];
            });
        });
    };
    /**
     * Click on an element - alias for tapElement for better Selenium compatibility
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns true if successful
     * @throws AppiumError if the operation fails after retries
     */
    AppiumHelper.prototype.click = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.tapElement(selector, strategy)];
            });
        });
    };
    /**
     * Send keys to an element with retry mechanism
     *
     * @param selector Element selector
     * @param text Text to send
     * @param strategy Selection strategy
     * @returns true if successful
     * @throws AppiumError if the operation fails after retries
     */
    AppiumHelper.prototype.sendKeys = function (selector_1, text_1) {
        return __awaiter(this, arguments, void 0, function (selector, text, strategy) {
            var lastError, attempt, element, error_8;
            var _this = this;
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= this.maxRetries)) return [3 /*break*/, 10];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 9]);
                        return [4 /*yield*/, this.findElement(selector, strategy)];
                    case 3:
                        element = _a.sent();
                        return [4 /*yield*/, element.waitForEnabled({ timeout: 5000 })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, element.setValue(text)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 6:
                        error_8 = _a.sent();
                        lastError = error_8 instanceof Error ? error_8 : new Error(String(error_8));
                        if (!(attempt < this.maxRetries)) return [3 /*break*/, 8];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.retryDelay); })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 9];
                    case 9:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 10: throw new AppiumError("Failed to send keys to element with selector ".concat(selector, " after ").concat(this.maxRetries, " attempts: ").concat(lastError === null || lastError === void 0 ? void 0 : lastError.message), lastError);
                }
            });
        });
    };
    /**
     * Get the page source (XML representation of the current UI)
     *
     * @param refreshFirst Whether to try refreshing the UI before getting page source
     * @param suppressErrors Whether to suppress specific iOS errors and return empty source
     * @returns XML string of the current UI
     */
    AppiumHelper.prototype.getPageSource = function () {
        return __awaiter(this, arguments, void 0, function (refreshFirst, suppressErrors) {
            var _this = this;
            if (refreshFirst === void 0) { refreshFirst = false; }
            if (suppressErrors === void 0) { suppressErrors = true; }
            return __generator(this, function (_a) {
                if (!this.driver) {
                    throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                }
                return [2 /*return*/, this.safeExecute(function () { return __awaiter(_this, void 0, void 0, function () {
                        var size, centerX, startY, endY, error_9, errorMessage, retryError_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 8, , 14]);
                                    if (!refreshFirst) return [3 /*break*/, 6];
                                    return [4 /*yield*/, this.driver.getWindowSize()];
                                case 1:
                                    size = _a.sent();
                                    centerX = size.width / 2;
                                    startY = size.height * 0.3;
                                    endY = size.height * 0.4;
                                    // Swipe down slightly
                                    return [4 /*yield*/, this.swipe(centerX, startY, centerX, endY, 300)];
                                case 2:
                                    // Swipe down slightly
                                    _a.sent();
                                    // Small pause
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                                case 3:
                                    // Small pause
                                    _a.sent();
                                    // Swipe back up
                                    return [4 /*yield*/, this.swipe(centerX, endY, centerX, startY, 300)];
                                case 4:
                                    // Swipe back up
                                    _a.sent();
                                    // Wait for refresh to complete
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                case 5:
                                    // Wait for refresh to complete
                                    _a.sent();
                                    _a.label = 6;
                                case 6: return [4 /*yield*/, this.driver.getPageSource()];
                                case 7: 
                                // Try getting the page source
                                return [2 /*return*/, _a.sent()];
                                case 8:
                                    error_9 = _a.sent();
                                    if (!(suppressErrors && error_9 instanceof Error)) return [3 /*break*/, 13];
                                    errorMessage = error_9.message || "";
                                    if (!(errorMessage.includes("waitForQuiescenceIncludingAnimationsIdle") ||
                                        errorMessage.includes("unrecognized selector sent to instance") ||
                                        errorMessage.includes("failed to get page source"))) return [3 /*break*/, 13];
                                    console.warn("iOS source retrieval warning: Using fallback due to animation or UI state issue.");
                                    // Wait a bit for potential animations to complete
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                                case 9:
                                    // Wait a bit for potential animations to complete
                                    _a.sent();
                                    _a.label = 10;
                                case 10:
                                    _a.trys.push([10, 12, , 13]);
                                    return [4 /*yield*/, this.driver.getPageSource()];
                                case 11: 
                                // Try again with direct call (might work)
                                return [2 /*return*/, _a.sent()];
                                case 12:
                                    retryError_2 = _a.sent();
                                    // Return empty source with warning
                                    return [2 /*return*/, "<AppRoot><Warning>Source unavailable due to iOS animation state issues</Warning></AppRoot>"];
                                case 13: 
                                // Rethrow other errors
                                throw new AppiumError("Failed to get page source: ".concat(error_9 instanceof Error ? error_9.message : String(error_9)), error_9 instanceof Error ? error_9 : undefined);
                                case 14: return [2 /*return*/];
                            }
                        });
                    }); }, "Failed to get page source")];
            });
        });
    };
    /**
     * Perform a swipe gesture
     *
     * @param startX Starting X coordinate
     * @param startY Starting Y coordinate
     * @param endX Ending X coordinate
     * @param endY Ending Y coordinate
     * @param duration Swipe duration in milliseconds
     * @returns true if successful
     */
    AppiumHelper.prototype.swipe = function (startX_1, startY_1, endX_1, endY_1) {
        return __awaiter(this, arguments, void 0, function (startX, startY, endX, endY, duration) {
            var error_10;
            if (duration === void 0) { duration = 800; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.touchAction([
                                { action: "press", x: startX, y: startY },
                                { action: "wait", ms: duration },
                                { action: "moveTo", x: endX, y: endY },
                                "release",
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_10 = _a.sent();
                        throw new AppiumError("Failed to perform swipe: ".concat(error_10 instanceof Error ? error_10.message : String(error_10)), error_10 instanceof Error ? error_10 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Wait for an element to be present
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @param timeoutMs Timeout in milliseconds
     * @returns true if the element is found within the timeout
     */
    AppiumHelper.prototype.waitForElement = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy, timeoutMs) {
            var _a;
            if (strategy === void 0) { strategy = "xpath"; }
            if (timeoutMs === void 0) { timeoutMs = 10000; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.findElement(selector, strategy, timeoutMs)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Long press on an element
     */
    AppiumHelper.prototype.longPress = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, duration, strategy) {
            var element, location_2, error_11;
            if (duration === void 0) { duration = 1000; }
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.findElement(selector, strategy)];
                    case 2:
                        element = _a.sent();
                        return [4 /*yield*/, element.getLocation()];
                    case 3:
                        location_2 = _a.sent();
                        return [4 /*yield*/, this.driver.touchAction([
                                { action: "press", x: location_2.x, y: location_2.y },
                                { action: "wait", ms: duration },
                                "release",
                            ])];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 5:
                        error_11 = _a.sent();
                        throw new AppiumError("Failed to long press element: ".concat(error_11 instanceof Error ? error_11.message : String(error_11)), error_11 instanceof Error ? error_11 : undefined);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Scroll to an element
     *
     * @param selector Element selector to scroll to
     * @param direction Direction to scroll ('up', 'down', 'left', 'right')
     * @param strategy Selection strategy
     * @param maxScrolls Maximum number of scroll attempts
     * @returns true if element was found and scrolled to
     */
    AppiumHelper.prototype.scrollToElement = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, direction, strategy, maxScrolls) {
            var i, size, startX, startY, endY, endX, actions, error_12;
            if (direction === void 0) { direction = "down"; }
            if (strategy === void 0) { strategy = "xpath"; }
            if (maxScrolls === void 0) { maxScrolls = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < maxScrolls)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.elementExists(selector, strategy)];
                    case 3:
                        if (_a.sent()) {
                            return [2 /*return*/, true];
                        }
                        return [4 /*yield*/, this.driver.getWindowSize()];
                    case 4:
                        size = _a.sent();
                        startX = size.width / 2;
                        startY = size.height * (direction === "up" ? 0.3 : 0.7);
                        endY = size.height * (direction === "up" ? 0.7 : 0.3);
                        endX = direction === "left"
                            ? size.width * 0.9
                            : direction === "right"
                                ? size.width * 0.1
                                : startX;
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
                                        duration: 800,
                                        origin: "viewport",
                                        x: endX,
                                        y: endY,
                                    },
                                    // Release
                                    { type: "pointerUp", button: 0 },
                                ],
                            },
                        ];
                        // Execute the W3C Actions
                        return [4 /*yield*/, this.driver.performActions(actions)];
                    case 5:
                        // Execute the W3C Actions
                        _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, false];
                    case 9:
                        error_12 = _a.sent();
                        throw new AppiumError("Failed to scroll to element: ".concat(error_12 instanceof Error ? error_12.message : String(error_12)), error_12 instanceof Error ? error_12 : undefined);
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get device orientation
     */
    AppiumHelper.prototype.getOrientation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var orientation_1, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.getOrientation()];
                    case 2:
                        orientation_1 = _a.sent();
                        return [2 /*return*/, orientation_1.toUpperCase()];
                    case 3:
                        error_13 = _a.sent();
                        throw new AppiumError("Failed to get orientation: ".concat(error_13 instanceof Error ? error_13.message : String(error_13)), error_13 instanceof Error ? error_13 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set device orientation
     *
     * @param orientation Desired orientation ('PORTRAIT' or 'LANDSCAPE')
     */
    AppiumHelper.prototype.setOrientation = function (orientation) {
        return __awaiter(this, void 0, void 0, function () {
            var error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.setOrientation(orientation)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_14 = _a.sent();
                        throw new AppiumError("Failed to set orientation: ".concat(error_14 instanceof Error ? error_14.message : String(error_14)), error_14 instanceof Error ? error_14 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Hide the keyboard if visible
     */
    AppiumHelper.prototype.hideKeyboard = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isKeyboardShown, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.driver.isKeyboardShown()];
                    case 2:
                        isKeyboardShown = _a.sent();
                        if (!isKeyboardShown) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.driver.hideKeyboard()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_15 = _a.sent();
                        throw new AppiumError("Failed to hide keyboard: ".concat(error_15 instanceof Error ? error_15.message : String(error_15)), error_15 instanceof Error ? error_15 : undefined);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the current activity (Android) or bundle ID (iOS)
     */
    AppiumHelper.prototype.getCurrentPackage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.getCurrentPackage()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_16 = _a.sent();
                        throw new AppiumError("Failed to get current package: ".concat(error_16 instanceof Error ? error_16.message : String(error_16)), error_16 instanceof Error ? error_16 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the current activity (Android only)
     */
    AppiumHelper.prototype.getCurrentActivity = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.getCurrentActivity()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_17 = _a.sent();
                        throw new AppiumError("Failed to get current activity: ".concat(error_17 instanceof Error ? error_17.message : String(error_17)), error_17 instanceof Error ? error_17 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Launch the app
     */
    AppiumHelper.prototype.launchApp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.launchApp()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_18 = _a.sent();
                        throw new AppiumError("Failed to launch app: ".concat(error_18 instanceof Error ? error_18.message : String(error_18)), error_18 instanceof Error ? error_18 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Close the app
     */
    AppiumHelper.prototype.closeApp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.closeApp()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_19 = _a.sent();
                        throw new AppiumError("Failed to close app: ".concat(error_19 instanceof Error ? error_19.message : String(error_19)), error_19 instanceof Error ? error_19 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reset the app (clear app data)
     */
    AppiumHelper.prototype.resetApp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, error_20;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, , 6]);
                        _b = (_a = this.driver).terminateApp;
                        return [4 /*yield*/, this.getCurrentPackage()];
                    case 2: return [4 /*yield*/, _b.apply(_a, [_c.sent(), {
                                timeout: 20000,
                            }])];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, this.driver.launchApp()];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_20 = _c.sent();
                        throw new AppiumError("Failed to reset app: ".concat(error_20 instanceof Error ? error_20.message : String(error_20)), error_20 instanceof Error ? error_20 : undefined);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get device time
     *
     * @returns Device time string
     */
    AppiumHelper.prototype.getDeviceTime = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_21;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.getDeviceTime()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_21 = _a.sent();
                        throw new AppiumError("Failed to get device time: ".concat(error_21 instanceof Error ? error_21.message : String(error_21)), error_21 instanceof Error ? error_21 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get battery info (if supported by the device)
     * Note: This is a custom implementation as WebdriverIO doesn't directly support this
     */
    AppiumHelper.prototype.getBatteryInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_22;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.executeScript("mobile: batteryInfo", [])];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                level: result.level || 0,
                                state: result.state || 0,
                            }];
                    case 3:
                        error_22 = _a.sent();
                        throw new AppiumError("Failed to get battery info: ".concat(error_22 instanceof Error ? error_22.message : String(error_22)), error_22 instanceof Error ? error_22 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lock the device
     *
     * @param duration Duration in seconds to lock the device
     */
    AppiumHelper.prototype.lockDevice = function (duration) {
        return __awaiter(this, void 0, void 0, function () {
            var error_23;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.lock(duration)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_23 = _a.sent();
                        throw new AppiumError("Failed to lock device: ".concat(error_23 instanceof Error ? error_23.message : String(error_23)), error_23 instanceof Error ? error_23 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if device is locked
     */
    AppiumHelper.prototype.isDeviceLocked = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_24;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.isLocked()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_24 = _a.sent();
                        throw new AppiumError("Failed to check if device is locked: ".concat(error_24 instanceof Error ? error_24.message : String(error_24)), error_24 instanceof Error ? error_24 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Unlock the device
     */
    AppiumHelper.prototype.unlockDevice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_25;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.unlock()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_25 = _a.sent();
                        throw new AppiumError("Failed to unlock device: ".concat(error_25 instanceof Error ? error_25.message : String(error_25)), error_25 instanceof Error ? error_25 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Press a key on the device (Android only)
     *
     * @param keycode Android keycode
     */
    AppiumHelper.prototype.pressKeyCode = function (keycode) {
        return __awaiter(this, void 0, void 0, function () {
            var error_26;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.pressKeyCode(keycode)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_26 = _a.sent();
                        throw new AppiumError("Failed to press key code: ".concat(error_26 instanceof Error ? error_26.message : String(error_26)), error_26 instanceof Error ? error_26 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Open notifications (Android only)
     */
    AppiumHelper.prototype.openNotifications = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_27;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.openNotifications()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_27 = _a.sent();
                        throw new AppiumError("Failed to open notifications: ".concat(error_27 instanceof Error ? error_27.message : String(error_27)), error_27 instanceof Error ? error_27 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all contexts (NATIVE_APP, WEBVIEW, etc.)
     */
    AppiumHelper.prototype.getContexts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var contexts, error_28;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.getContexts()];
                    case 2:
                        contexts = _a.sent();
                        return [2 /*return*/, contexts.map(function (context) { return context.toString(); })];
                    case 3:
                        error_28 = _a.sent();
                        throw new AppiumError("Failed to get contexts: ".concat(error_28 instanceof Error ? error_28.message : String(error_28)), error_28 instanceof Error ? error_28 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Switch context (between NATIVE_APP and WEBVIEW)
     *
     * @param context Context name to switch to
     */
    AppiumHelper.prototype.switchContext = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var error_29;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.switchContext(context)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_29 = _a.sent();
                        throw new AppiumError("Failed to switch context: ".concat(error_29 instanceof Error ? error_29.message : String(error_29)), error_29 instanceof Error ? error_29 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current context
     */
    AppiumHelper.prototype.getCurrentContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var context, error_30;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.getContext()];
                    case 2:
                        context = _a.sent();
                        return [2 /*return*/, context.toString()];
                    case 3:
                        error_30 = _a.sent();
                        throw new AppiumError("Failed to get current context: ".concat(error_30 instanceof Error ? error_30.message : String(error_30)), error_30 instanceof Error ? error_30 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pull file from device
     *
     * @param path Path to file on device
     * @returns Base64 encoded file content
     */
    AppiumHelper.prototype.pullFile = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var error_31;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.pullFile(path)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_31 = _a.sent();
                        throw new AppiumError("Failed to pull file: ".concat(error_31 instanceof Error ? error_31.message : String(error_31)), error_31 instanceof Error ? error_31 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Push file to device
     *
     * @param path Path on device to write to
     * @param data Base64 encoded file content
     */
    AppiumHelper.prototype.pushFile = function (path, data) {
        return __awaiter(this, void 0, void 0, function () {
            var error_32;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.pushFile(path, data)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_32 = _a.sent();
                        throw new AppiumError("Failed to push file: ".concat(error_32 instanceof Error ? error_32.message : String(error_32)), error_32 instanceof Error ? error_32 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find an iOS predicate string element (iOS only)
     *
     * @param predicateString iOS predicate string
     * @param timeoutMs Timeout in milliseconds
     * @returns WebdriverIO element if found
     */
    AppiumHelper.prototype.findByIosPredicate = function (predicateString_1) {
        return __awaiter(this, arguments, void 0, function (predicateString, timeoutMs) {
            var element, error_33;
            if (timeoutMs === void 0) { timeoutMs = 10000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.driver.$("-ios predicate string:".concat(predicateString))];
                    case 2:
                        element = _a.sent();
                        return [4 /*yield*/, element.waitForExist({ timeout: timeoutMs })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, element];
                    case 4:
                        error_33 = _a.sent();
                        throw new AppiumError("Failed to find element with iOS predicate: ".concat(predicateString), error_33 instanceof Error ? error_33 : undefined);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find an iOS class chain element (iOS only)
     *
     * @param classChain iOS class chain
     * @param timeoutMs Timeout in milliseconds
     * @returns WebdriverIO element if found
     */
    AppiumHelper.prototype.findByIosClassChain = function (classChain_1) {
        return __awaiter(this, arguments, void 0, function (classChain, timeoutMs) {
            var element, error_34;
            if (timeoutMs === void 0) { timeoutMs = 10000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.driver.$("-ios class chain:".concat(classChain))];
                    case 2:
                        element = _a.sent();
                        return [4 /*yield*/, element.waitForExist({ timeout: timeoutMs })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, element];
                    case 4:
                        error_34 = _a.sent();
                        throw new AppiumError("Failed to find element with iOS class chain: ".concat(classChain), error_34 instanceof Error ? error_34 : undefined);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get list of available iOS simulators
     * Note: This method isn't tied to an Appium session, so it doesn't require an initialized driver
     * This uses the executeScript capability of WebdriverIO to run a mobile command
     *
     * @returns Array of simulator objects
     */
    AppiumHelper.prototype.getIosSimulators = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_35;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.executeScript("mobile: listSimulators", [])];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.devices || []];
                    case 3:
                        error_35 = _a.sent();
                        throw new AppiumError("Failed to get iOS simulators list: ".concat(error_35 instanceof Error ? error_35.message : String(error_35)), error_35 instanceof Error ? error_35 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Perform iOS-specific touch ID (fingerprint) simulation
     *
     * @param match Whether the fingerprint should match (true) or not match (false)
     * @returns true if successful
     */
    AppiumHelper.prototype.performTouchId = function (match) {
        return __awaiter(this, void 0, void 0, function () {
            var error_36;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.executeScript("mobile: performTouchId", [{ match: match }])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_36 = _a.sent();
                        throw new AppiumError("Failed to perform Touch ID: ".concat(error_36 instanceof Error ? error_36.message : String(error_36)), error_36 instanceof Error ? error_36 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Simulate iOS shake gesture
     *
     * @returns true if successful
     */
    AppiumHelper.prototype.shakeDevice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_37;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.executeScript("mobile: shake", [])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_37 = _a.sent();
                        throw new AppiumError("Failed to shake device: ".concat(error_37 instanceof Error ? error_37.message : String(error_37)), error_37 instanceof Error ? error_37 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start recording the screen on iOS or Android device
     *
     * @param options Recording options
     * @returns true if recording started successfully
     */
    AppiumHelper.prototype.startRecording = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var opts, error_38;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        opts = options || {};
                        return [4 /*yield*/, this.driver.startRecordingScreen(opts)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_38 = _a.sent();
                        throw new AppiumError("Failed to start screen recording: ".concat(error_38 instanceof Error ? error_38.message : String(error_38)), error_38 instanceof Error ? error_38 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop recording the screen and get the recording content as base64
     *
     * @returns Base64-encoded recording data
     */
    AppiumHelper.prototype.stopRecording = function () {
        return __awaiter(this, void 0, void 0, function () {
            var recording, error_39;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.stopRecordingScreen()];
                    case 2:
                        recording = _a.sent();
                        return [2 /*return*/, recording];
                    case 3:
                        error_39 = _a.sent();
                        throw new AppiumError("Failed to stop screen recording: ".concat(error_39 instanceof Error ? error_39.message : String(error_39)), error_39 instanceof Error ? error_39 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a custom mobile command
     *
     * @param command Mobile command to execute
     * @param args Arguments for the command
     * @returns Command result
     */
    AppiumHelper.prototype.executeMobileCommand = function (command_1) {
        return __awaiter(this, arguments, void 0, function (command, args) {
            var error_40;
            if (args === void 0) { args = []; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized. Call initializeDriver first.");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.executeScript("mobile: ".concat(command), args)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_40 = _a.sent();
                        throw new AppiumError("Failed to execute mobile command '".concat(command, "': ").concat(error_40 instanceof Error ? error_40.message : String(error_40)), error_40 instanceof Error ? error_40 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get text from an element
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns Text content of the element
     * @throws AppiumError if element is not found or has no text
     */
    AppiumHelper.prototype.getText = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            var element, text, error_41;
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.findElement(selector, strategy)];
                    case 1:
                        element = _a.sent();
                        return [4 /*yield*/, element.getText()];
                    case 2:
                        text = _a.sent();
                        return [2 /*return*/, text];
                    case 3:
                        error_41 = _a.sent();
                        throw new AppiumError("Failed to get text from element with selector ".concat(selector, ": ").concat(error_41 instanceof Error ? error_41.message : String(error_41)), error_41 instanceof Error ? error_41 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send keys directly to the device (without focusing on an element)
     *
     * @param text Text to send
     * @returns true if successful
     */
    AppiumHelper.prototype.sendKeysToDevice = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var error_42;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.driver.keys(text.split(""))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_42 = _a.sent();
                        throw new AppiumError("Failed to send keys to device: ".concat(error_42 instanceof Error ? error_42.message : String(error_42)), error_42 instanceof Error ? error_42 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send key events to the device (e.g. HOME button, BACK button)
     *
     * @param keyEvent Key event name or code
     * @returns true if successful
     */
    AppiumHelper.prototype.sendKeyEvent = function (keyEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var error_43;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!(typeof keyEvent === "string")) return [3 /*break*/, 3];
                        // For named key events like "home", "back"
                        return [4 /*yield*/, this.driver.keys(keyEvent)];
                    case 2:
                        // For named key events like "home", "back"
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: 
                    // For numeric key codes
                    return [4 /*yield*/, this.driver.pressKeyCode(keyEvent)];
                    case 4:
                        // For numeric key codes
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, true];
                    case 6:
                        error_43 = _a.sent();
                        throw new AppiumError("Failed to send key event ".concat(keyEvent, ": ").concat(error_43 instanceof Error ? error_43.message : String(error_43)), error_43 instanceof Error ? error_43 : undefined);
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear text from an input element
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns true if successful
     */
    AppiumHelper.prototype.clearElement = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            var element, error_44;
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.findElement(selector, strategy)];
                    case 1:
                        element = _a.sent();
                        return [4 /*yield*/, element.clearValue()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_44 = _a.sent();
                        throw new AppiumError("Failed to clear element with selector ".concat(selector, ": ").concat(error_44 instanceof Error ? error_44.message : String(error_44)), error_44 instanceof Error ? error_44 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Scroll using predefined directions - scrollDown, scrollUp, scrollLeft, scrollRight
     *
     * @param direction Direction to scroll: "down", "up", "left", "right"
     * @param distance Optional percentage of screen to scroll (0.0-1.0), defaults to 0.5
     * @returns true if successful
     */
    AppiumHelper.prototype.scrollScreen = function (direction_1) {
        return __awaiter(this, arguments, void 0, function (direction, distance) {
            var size, midX, midY, startX, startY, endX, endY, error_45;
            if (distance === void 0) { distance = 0.5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.driver.getWindowSize()];
                    case 2:
                        size = _a.sent();
                        midX = size.width / 2;
                        midY = size.height / 2;
                        startX = void 0, startY = void 0, endX = void 0, endY = void 0;
                        switch (direction) {
                            case "down":
                                startX = midX;
                                startY = size.height * 0.3;
                                endX = midX;
                                endY = size.height * (0.3 + distance);
                                break;
                            case "up":
                                startX = midX;
                                startY = size.height * 0.7;
                                endX = midX;
                                endY = size.height * (0.7 - distance);
                                break;
                            case "right":
                                startX = size.width * 0.3;
                                startY = midY;
                                endX = size.width * (0.3 + distance);
                                endY = midY;
                                break;
                            case "left":
                                startX = size.width * 0.7;
                                startY = midY;
                                endX = size.width * (0.7 - distance);
                                endY = midY;
                                break;
                        }
                        return [4 /*yield*/, this.swipe(startX, startY, endX, endY, 800)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 4:
                        error_45 = _a.sent();
                        throw new AppiumError("Failed to scroll ".concat(direction, ": ").concat(error_45 instanceof Error ? error_45.message : String(error_45)), error_45 instanceof Error ? error_45 : undefined);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get element attributes - useful for debugging and inspecting
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns Object with element attributes
     */
    AppiumHelper.prototype.getElementAttributes = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            var element, result, propertiesToGet, _i, propertiesToGet_1, prop, _a, _b, e_1, _c, _d, e_2, error_46;
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 12, , 13]);
                        return [4 /*yield*/, this.findElement(selector, strategy)];
                    case 1:
                        element = _e.sent();
                        result = {};
                        propertiesToGet = [
                            "text",
                            "content-desc",
                            "resource-id",
                            "class",
                            "enabled",
                            "displayed",
                            "selected",
                            "checked",
                            "focusable",
                            "focused",
                            "scrollable",
                            "clickable",
                            "bounds",
                            "package",
                            "password",
                        ];
                        _i = 0, propertiesToGet_1 = propertiesToGet;
                        _e.label = 2;
                    case 2:
                        if (!(_i < propertiesToGet_1.length)) return [3 /*break*/, 7];
                        prop = propertiesToGet_1[_i];
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 5, , 6]);
                        _a = result;
                        _b = prop;
                        return [4 /*yield*/, element.getAttribute(prop)];
                    case 4:
                        _a[_b] = _e.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _e.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        _e.trys.push([7, 10, , 11]);
                        _c = result;
                        return [4 /*yield*/, element.getLocation()];
                    case 8:
                        _c.location = _e.sent();
                        _d = result;
                        return [4 /*yield*/, element.getSize()];
                    case 9:
                        _d.size = _e.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        e_2 = _e.sent();
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, result];
                    case 12:
                        error_46 = _e.sent();
                        throw new AppiumError("Failed to get attributes for element with selector ".concat(selector, ": ").concat(error_46 instanceof Error ? error_46.message : String(error_46)), error_46 instanceof Error ? error_46 : undefined);
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get detailed element analysis with all available information
     * (useful for inspector functionality)
     *
     * @param selector Element selector
     * @param strategy Selection strategy
     * @returns Comprehensive element info
     */
    AppiumHelper.prototype.inspectElement = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, strategy) {
            var attributes, element, result, _a, _b, e_3, size, location_3, e_4, error_47;
            var _c;
            if (strategy === void 0) { strategy = "xpath"; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 14, , 15]);
                        return [4 /*yield*/, this.getElementAttributes(selector, strategy)];
                    case 1:
                        attributes = _d.sent();
                        return [4 /*yield*/, this.findElement(selector, strategy)];
                    case 2:
                        element = _d.sent();
                        _a = [__assign({}, attributes)];
                        _c = {};
                        return [4 /*yield*/, element.isDisplayed()];
                    case 3:
                        _c.isDisplayed = _d.sent();
                        return [4 /*yield*/, element.isEnabled()];
                    case 4:
                        _c.isEnabled = _d.sent();
                        return [4 /*yield*/, element.isSelected()];
                    case 5:
                        result = __assign.apply(void 0, _a.concat([(_c.isSelected = _d.sent(), _c.text = null, _c.rect = null, _c)]));
                        _d.label = 6;
                    case 6:
                        _d.trys.push([6, 8, , 9]);
                        _b = result;
                        return [4 /*yield*/, element.getText()];
                    case 7:
                        _b.text = _d.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        e_3 = _d.sent();
                        // Text might not be available
                        result.text = null;
                        return [3 /*break*/, 9];
                    case 9:
                        _d.trys.push([9, 12, , 13]);
                        return [4 /*yield*/, element.getSize()];
                    case 10:
                        size = _d.sent();
                        return [4 /*yield*/, element.getLocation()];
                    case 11:
                        location_3 = _d.sent();
                        result.rect = {
                            x: location_3.x,
                            y: location_3.y,
                            width: size.width,
                            height: size.height,
                        };
                        return [3 /*break*/, 13];
                    case 12:
                        e_4 = _d.sent();
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/, result];
                    case 14:
                        error_47 = _d.sent();
                        throw new AppiumError("Failed to inspect element with selector ".concat(selector, ": ").concat(error_47 instanceof Error ? error_47.message : String(error_47)), error_47 instanceof Error ? error_47 : undefined);
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a visual tree of elements under a parent element or from the root
     * Helps create a hierarchical view of the UI elements (inspector functionality)
     *
     * @param parentSelector Optional parent element selector, if not provided will use root
     * @param parentStrategy Selection strategy for parent
     * @param maxDepth Maximum depth to traverse
     * @returns Hierarchical object representing the element tree
     */
    AppiumHelper.prototype.getElementTree = function (parentSelector_1) {
        return __awaiter(this, arguments, void 0, function (parentSelector, parentStrategy, maxDepth) {
            var source, error_48;
            if (parentStrategy === void 0) { parentStrategy = "xpath"; }
            if (maxDepth === void 0) { maxDepth = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getPageSource()];
                    case 2:
                        source = _a.sent();
                        // Since we're in Node.js and don't have access to DOM APIs,
                        // we'll return a simplified structure with the raw XML source
                        // and some basic info. For a full XML parser, a library like
                        // 'xmldom' or 'cheerio' would be needed.
                        return [2 /*return*/, {
                                rawSource: source,
                                timestamp: new Date().toISOString(),
                                note: "XML parsing would require additional libraries",
                            }];
                    case 3:
                        error_48 = _a.sent();
                        throw new AppiumError("Failed to get element tree: ".concat(error_48 instanceof Error ? error_48.message : String(error_48)), error_48 instanceof Error ? error_48 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify if text is present in the page source
     *
     * @param text Text to search for
     * @returns true if text is found
     */
    AppiumHelper.prototype.hasTextInSource = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var source, error_49;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getPageSource()];
                    case 1:
                        source = _a.sent();
                        return [2 /*return*/, source.includes(text)];
                    case 2:
                        error_49 = _a.sent();
                        throw new AppiumError("Failed to check for text in page source: ".concat(error_49 instanceof Error ? error_49.message : String(error_49)), error_49 instanceof Error ? error_49 : undefined);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find all elements containing specific text
     *
     * @param text Text to search for
     * @returns Array of WebdriverIO elements that contain the text
     */
    AppiumHelper.prototype.findElementsByText = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var xpath, error_50;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver) {
                            throw new AppiumError("Appium driver not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        xpath = "//*[contains(@text,\"".concat(text, "\") or contains(@content-desc,\"").concat(text, "\") or contains(@label,\"").concat(text, "\") or contains(@value,\"").concat(text, "\") or contains(@resource-id,\"").concat(text, "\")]");
                        return [4 /*yield*/, this.findElements(xpath, "xpath")];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_50 = _a.sent();
                        throw new AppiumError("Failed to find elements containing text \"".concat(text, "\": ").concat(error_50 instanceof Error ? error_50.message : String(error_50)), error_50 instanceof Error ? error_50 : undefined);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a new Appium session (for test compatibility)
     */
    AppiumHelper.prototype.createSession = function (capabilities_1) {
        return __awaiter(this, arguments, void 0, function (capabilities, appiumUrl) {
            var error_51;
            if (appiumUrl === void 0) { appiumUrl = "http://localhost:4723"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.initializeDriver(capabilities, appiumUrl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                    case 2:
                        error_51 = _a.sent();
                        return [2 /*return*/, { success: false, error: error_51 instanceof Error ? error_51.message : String(error_51) }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Quit the Appium session (for test compatibility)
     */
    AppiumHelper.prototype.quitSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_52;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.closeDriver()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                    case 2:
                        error_52 = _a.sent();
                        return [2 /*return*/, { success: false, error: error_52 instanceof Error ? error_52.message : String(error_52) }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get device info (for test compatibility)
     */
    AppiumHelper.prototype.getDeviceInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var caps;
            return __generator(this, function (_a) {
                if (!this._driver) {
                    return [2 /*return*/, { success: false, error: "Driver not initialized" }];
                }
                try {
                    caps = this._driver.capabilities || {};
                    return [2 /*return*/, { success: true, info: { platformName: caps.platformName, deviceName: caps.deviceName } }];
                }
                catch (error) {
                    return [2 /*return*/, { success: false, error: error instanceof Error ? error.message : String(error) }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**adb
     * Set geolocation (for test compatibility)
     */
    AppiumHelper.prototype.setGeolocation = function (latitude_1, longitude_1) {
        return __awaiter(this, arguments, void 0, function (latitude, longitude, altitude) {
            var error_53;
            if (altitude === void 0) { altitude = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._driver) {
                            return [2 /*return*/, { success: false, error: "Driver not initialized" }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!(typeof this._driver.setGeoLocation === 'function')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._driver.setGeoLocation({ latitude: latitude, longitude: longitude, altitude: altitude })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                    case 3: return [2 /*return*/, { success: false, error: 'setGeoLocation not implemented in driver' }];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_53 = _a.sent();
                        return [2 /*return*/, { success: false, error: error_53 instanceof Error ? error_53.message : String(error_53) }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return AppiumHelper;
}());
exports.AppiumHelper = AppiumHelper;
