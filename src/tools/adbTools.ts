import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AdbCommands } from "../lib/adb/adbCommands.js";

/**
 * Register ADB-related tools with the MCP server
 */
export function registerAdbTools(server: McpServer) {
  // Tool: List connected devices
  server.tool(
    "list-devices",
    "List all connected Android devices",
    {},
    async () => {
      try {
        const devices = await AdbCommands.getDevices();
        
        if (devices.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No devices connected. Please connect an Android device and try again."
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Connected devices:\n${devices.join('\n')}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing devices: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Tool: Install APK
  server.tool(
    "install-app",
    "Install an Android application APK",
    {
      deviceId: z.string().describe("The device ID to install the app on"),
      apkPath: z.string().describe("The local path to the APK file")
    },
    async ({ deviceId, apkPath }) => {
      try {
        // Check if the device is connected
        const isConnected = await AdbCommands.isDeviceConnected(deviceId);
        if (!isConnected) {
          return {
            content: [
              {
                type: "text",
                text: `Device ${deviceId} is not connected. Please check the device ID and try again.`
              }
            ]
          };
        }
        
        const result = await AdbCommands.installApp(deviceId, apkPath);
        
        return {
          content: [
            {
              type: "text",
              text: `App installation result: ${result}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error installing app: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Tool: Uninstall app
  server.tool(
    "uninstall-app",
    "Uninstall an Android application",
    {
      deviceId: z.string().describe("The device ID to uninstall the app from"),
      packageName: z.string().describe("The package name of the app to uninstall")
    },
    async ({ deviceId, packageName }) => {
      try {
        // Check if the device is connected
        const isConnected = await AdbCommands.isDeviceConnected(deviceId);
        if (!isConnected) {
          return {
            content: [
              {
                type: "text",
                text: `Device ${deviceId} is not connected. Please check the device ID and try again.`
              }
            ]
          };
        }
        
        const result = await AdbCommands.uninstallApp(deviceId, packageName);
        
        return {
          content: [
            {
              type: "text",
              text: `App uninstallation result: ${result}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error uninstalling app: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Tool: Take screenshot
  server.tool(
    "take-screenshot",
    "Take a screenshot on an Android device",
    {
      deviceId: z.string().describe("The device ID to take the screenshot from"),
      outputPath: z.string().describe("The local path to save the screenshot to")
    },
    async ({ deviceId, outputPath }) => {
      try {
        // Check if the device is connected
        const isConnected = await AdbCommands.isDeviceConnected(deviceId);
        if (!isConnected) {
          return {
            content: [
              {
                type: "text",
                text: `Device ${deviceId} is not connected. Please check the device ID and try again.`
              }
            ]
          };
        }
        
        const result = await AdbCommands.takeScreenshot(deviceId, outputPath);
        
        return {
          content: [
            {
              type: "text",
              text: `Screenshot saved to ${outputPath}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error taking screenshot: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Tool: Get installed packages
  server.tool(
    "list-installed-packages",
    "List all installed packages on an Android device",
    {
      deviceId: z.string().describe("The device ID to list packages from")
    },
    async ({ deviceId }) => {
      try {
        // Check if the device is connected
        const isConnected = await AdbCommands.isDeviceConnected(deviceId);
        if (!isConnected) {
          return {
            content: [
              {
                type: "text",
                text: `Device ${deviceId} is not connected. Please check the device ID and try again.`
              }
            ]
          };
        }
        
        const packages = await AdbCommands.getInstalledPackages(deviceId);
        
        if (packages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No packages found on the device."
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Installed packages on device ${deviceId}:\n${packages.join('\n')}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing packages: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Tool: Launch app
  server.tool(
    "launch-app",
    "Launch an app on an Android device",
    {
      deviceId: z.string().describe("The device ID to launch the app on"),
      packageName: z.string().describe("The package name of the app to launch"),
      activityName: z.string().optional().describe("Optional activity name to launch")
    },
    async ({ deviceId, packageName, activityName }) => {
      try {
        // Check if the device is connected
        const isConnected = await AdbCommands.isDeviceConnected(deviceId);
        if (!isConnected) {
          return {
            content: [
              {
                type: "text",
                text: `Device ${deviceId} is not connected. Please check the device ID and try again.`
              }
            ]
          };
        }
        
        const result = await AdbCommands.launchApp(deviceId, packageName, activityName);
        
        return {
          content: [
            {
              type: "text",
              text: `App launch result: ${result}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error launching app: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Tool: Execute custom ADB command
  server.tool(
    "execute-adb-command",
    "Execute a custom ADB command",
    {
      command: z.string().describe("The ADB command to execute (without 'adb' prefix)")
    },
    async ({ command }) => {
      try {
        const result = await AdbCommands.executeCommand(command);
        
        return {
          content: [
            {
              type: "text",
              text: `Command result:\n${result}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing command: ${error.message}`
            }
          ]
        };
      }
    }
  );
}