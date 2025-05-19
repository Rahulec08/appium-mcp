"use strict";
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
var appiumHelper_js_1 = require("../src/lib/appium/appiumHelper.js");
function testAppiumMCP() {
    return __awaiter(this, void 0, void 0, function () {
        var appium, capabilities, currentPackage, currentActivity, orientation_1, screenshotPath, searchExists, scrollResult, batteryInfo, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    appium = new appiumHelper_js_1.AppiumHelper("./test-screenshots");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 18, 19, 21]);
                    capabilities = {
                        platformName: "Android",
                        deviceName: "Pixel_4", // Change this to your device name
                        automationName: "UiAutomator2",
                        // If testing an APK
                        // app: './path/to/your/app.apk',
                        // Or if testing an installed app
                        appPackage: "com.android.settings", // Using settings app as example
                        appActivity: ".Settings",
                        noReset: true,
                    };
                    console.log("Initializing Appium driver...");
                    return [4 /*yield*/, appium.initializeDriver(capabilities)];
                case 2:
                    _a.sent();
                    console.log("Driver initialized successfully");
                    // Get device info
                    console.log("Getting device information...");
                    return [4 /*yield*/, appium.getCurrentPackage()];
                case 3:
                    currentPackage = _a.sent();
                    console.log("Current package:", currentPackage);
                    return [4 /*yield*/, appium.getCurrentActivity()];
                case 4:
                    currentActivity = _a.sent();
                    console.log("Current activity:", currentActivity);
                    return [4 /*yield*/, appium.getOrientation()];
                case 5:
                    orientation_1 = _a.sent();
                    console.log("Device orientation:", orientation_1);
                    // Take a screenshot
                    console.log("Taking screenshot...");
                    return [4 /*yield*/, appium.takeScreenshot("settings_home")];
                case 6:
                    screenshotPath = _a.sent();
                    console.log("Screenshot saved to:", screenshotPath);
                    // Find and interact with elements
                    console.log("Finding and interacting with elements...");
                    return [4 /*yield*/, appium.elementExists('//android.widget.TextView[@text="Search settings"]')];
                case 7:
                    searchExists = _a.sent();
                    if (!searchExists) return [3 /*break*/, 12];
                    console.log("Found search settings button");
                    return [4 /*yield*/, appium.tapElement('//android.widget.TextView[@text="Search settings"]')];
                case 8:
                    _a.sent();
                    // Type in search
                    return [4 /*yield*/, appium.sendKeys("//android.widget.EditText", "wifi")];
                case 9:
                    // Type in search
                    _a.sent();
                    // Take screenshot of search results
                    return [4 /*yield*/, appium.takeScreenshot("search_results")];
                case 10:
                    // Take screenshot of search results
                    _a.sent();
                    // Hide keyboard
                    return [4 /*yield*/, appium.hideKeyboard()];
                case 11:
                    // Hide keyboard
                    _a.sent();
                    _a.label = 12;
                case 12:
                    // Scroll test
                    console.log("Testing scroll functionality...");
                    return [4 /*yield*/, appium.scrollToElement('//android.widget.TextView[@text="About phone"]')];
                case 13:
                    scrollResult = _a.sent();
                    if (!scrollResult) return [3 /*break*/, 16];
                    console.log('Successfully scrolled to "About phone"');
                    return [4 /*yield*/, appium.tapElement('//android.widget.TextView[@text="About phone"]')];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, appium.takeScreenshot("about_phone")];
                case 15:
                    _a.sent();
                    _a.label = 16;
                case 16:
                    // Get battery info
                    console.log("Getting battery information...");
                    return [4 /*yield*/, appium.getBatteryInfo()];
                case 17:
                    batteryInfo = _a.sent();
                    console.log("Battery level:", batteryInfo.level);
                    console.log("Battery state:", batteryInfo.state);
                    return [3 /*break*/, 21];
                case 18:
                    error_1 = _a.sent();
                    console.error("Test failed:", error_1);
                    return [3 /*break*/, 21];
                case 19:
                    // Cleanup
                    console.log("Cleaning up...");
                    return [4 /*yield*/, appium.closeDriver()];
                case 20:
                    _a.sent();
                    console.log("Test completed");
                    return [7 /*endfinally*/];
                case 21: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testAppiumMCP().catch(console.error);
