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
/**
 * Test script for MCP-Appium using the npx entry point with a configuration format
 * similar to the Playwright MCP server.
 */
var mcp_js_1 = require("@modelcontextprotocol/sdk/client/mcp.js");
var node_js_1 = require("@modelcontextprotocol/sdk/client/node.js");
var child_process_1 = require("child_process");
var path = require("path");
var url_1 = require("url");
// Get the directory name
var __dirname = path.dirname((0, url_1.fileURLToPath)(import.meta.url));
// MCP Server configuration
var mcpConfig = {
    mcpServers: {
        "mcp-appium": {
            command: "node",
            args: [path.join(__dirname, "../dist/npx-entry.js")],
            options: {
                appiumHost: "localhost",
                appiumPort: 4723,
                screenshotDir: "./test-screenshots",
                logLevel: "info",
            },
        },
    },
};
// Global reference to the MCP server process
var mpcProcess = null;
/**
 * Start the MCP server process
 */
function startMcpServer() {
    return __awaiter(this, void 0, void 0, function () {
        var process;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting MCP-Appium server with configuration...");
                    process = (0, child_process_1.spawn)(mcpConfig.mcpServers["mcp-appium"].command, mcpConfig.mcpServers["mcp-appium"].args, { stdio: ["pipe", "inherit", "inherit"] });
                    // Write the config to stdin
                    process.stdin.write(JSON.stringify(mcpConfig.mcpServers["mcp-appium"].options || {}));
                    process.stdin.end();
                    // Give the MCP server time to start
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 1:
                    // Give the MCP server time to start
                    _a.sent();
                    console.log("MCP server started successfully");
                    return [2 /*return*/, process];
            }
        });
    });
}
/**
 * Test the MCP client connection to the server
 */
function testMcpClient() {
    return __awaiter(this, void 0, void 0, function () {
        var transport, client, tools, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Testing MCP client connection to the server...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    transport = new node_js_1.NodeClientTransport({
                        command: mcpConfig.mcpServers["mcp-appium"].command,
                        args: mcpConfig.mcpServers["mcp-appium"].args,
                    });
                    client = new mcp_js_1.McpClient();
                    return [4 /*yield*/, client.connect(transport)];
                case 2:
                    _a.sent();
                    console.log("Successfully connected to MCP server");
                    return [4 /*yield*/, client.getTools()];
                case 3:
                    tools = _a.sent();
                    console.log("Server has ".concat(Object.keys(tools).length, " available tools"));
                    // Clean up
                    return [4 /*yield*/, client.disconnect()];
                case 4:
                    // Clean up
                    _a.sent();
                    return [2 /*return*/, true];
                case 5:
                    error_1 = _a.sent();
                    console.error("Failed to connect to MCP server:", error_1);
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Clean up resources and terminate the MCP server
 */
function cleanup() {
    if (mpcProcess) {
        console.log("Terminating MCP server process...");
        mpcProcess.kill();
        mpcProcess = null;
        console.log("MCP server process terminated");
    }
}
/**
 * Main test function
 */
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var success, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // Setup cleanup handlers
                    process.on("SIGINT", cleanup);
                    process.on("SIGTERM", cleanup);
                    return [4 /*yield*/, startMcpServer()];
                case 1:
                    // Start the server
                    mpcProcess = _a.sent();
                    return [4 /*yield*/, testMcpClient()];
                case 2:
                    success = _a.sent();
                    if (success) {
                        console.log("\n✅ MCP-Appium server configuration test PASSED");
                    }
                    else {
                        console.log("\n❌ MCP-Appium server configuration test FAILED");
                        process.exit(1);
                    }
                    console.log("\nPress Ctrl+C to exit.");
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Error during test execution:", error_2);
                    cleanup();
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Run the test
runTests().catch(function (error) {
    console.error("Unexpected error:", error);
    cleanup();
    process.exit(1);
});
