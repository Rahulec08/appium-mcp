/**
 * Xcode Tools Registration for MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  XcodeCommands,
  SIMULATOR_CONFIGS,
} from "../lib/xcode/xcodeCommands.js";

export function registerXcodeTools(server: McpServer) {
  // Installation and Setup Tools
  server.tool(
    "xcode_check_cli_installed",
    "Check if Xcode command line tools are installed",
    {},
    async () => {
      try {
        const result = await XcodeCommands.isXcodeCliInstalled();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_get_path",
    "Get the path to the Xcode installation",
    {},
    async () => {
      try {
        const result = await XcodeCommands.getXcodePath();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_install_cli",
    "Install Xcode command line tools (requires user interaction)",
    {},
    async () => {
      try {
        await XcodeCommands.installXcodeCli();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: "Xcode CLI installation started" },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Simulator Management Tools
  server.tool(
    "xcode_get_ios_simulators",
    "Get a list of available iOS simulators",
    {},
    async () => {
      try {
        const result = await XcodeCommands.getIosSimulators();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_boot_simulator",
    "Boot an iOS simulator",
    { udid: z.string().describe("The UDID of the simulator to boot") },
    async (args) => {
      try {
        await XcodeCommands.bootSimulator(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: `Simulator ${args.udid} booted` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_shutdown_simulator",
    "Shutdown an iOS simulator",
    { udid: z.string().describe("The UDID of the simulator to shutdown") },
    async (args) => {
      try {
        await XcodeCommands.shutdownSimulator(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: `Simulator ${args.udid} shutdown` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_create_simulator",
    "Create a new iOS simulator",
    {
      name: z.string().describe("Name for the new simulator"),
      deviceTypeId: z
        .string()
        .describe("Device type identifier (e.g., 'iPhone15,2')"),
      runtimeId: z
        .string()
        .describe(
          "Runtime identifier (e.g., 'com.apple.CoreSimulator.SimRuntime.iOS-17-0')"
        ),
    },
    async (args) => {
      try {
        const newUdid = await XcodeCommands.createSimulator(
          args.name,
          args.deviceTypeId,
          args.runtimeId
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  udid: newUdid,
                  message: `Simulator created with UDID: ${newUdid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_delete_simulator",
    "Delete an iOS simulator",
    { udid: z.string().describe("The UDID of the simulator to delete") },
    async (args) => {
      try {
        await XcodeCommands.deleteSimulator(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: `Simulator ${args.udid} deleted` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_erase_simulator",
    "Erase all data from a simulator",
    { udid: z.string().describe("The UDID of the simulator to erase") },
    async (args) => {
      try {
        await XcodeCommands.eraseSimulator(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: `Simulator ${args.udid} erased` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_get_simulator_status",
    "Get the status of all simulators",
    {},
    async () => {
      try {
        const result = await XcodeCommands.getSimulatorStatus();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_get_simulator_info",
    "Get detailed information about a specific simulator",
    { udid: z.string().describe("The UDID of the simulator") },
    async (args) => {
      try {
        const result = await XcodeCommands.getSimulatorInfo(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_wait_for_simulator",
    "Wait for a simulator to be ready",
    {
      udid: z.string().describe("The UDID of the simulator"),
      timeoutMs: z
        .number()
        .optional()
        .default(60000)
        .describe("Timeout in milliseconds (default: 60000)"),
    },
    async (args) => {
      try {
        await XcodeCommands.waitForSimulator(
          args.udid,
          args.timeoutMs || 60000
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: `Simulator ${args.udid} is ready` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // App Management Tools
  server.tool(
    "xcode_install_app",
    "Install an app on a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      appPath: z.string().describe("Path to the .app bundle"),
    },
    async (args) => {
      try {
        await XcodeCommands.installApp(args.udid, args.appPath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `App installed on simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_uninstall_app",
    "Uninstall an app from a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
    },
    async (args) => {
      try {
        await XcodeCommands.uninstallApp(args.udid, args.bundleId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: `App ${args.bundleId} uninstalled` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_launch_app",
    "Launch an app on a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
      args: z
        .array(z.string())
        .optional()
        .describe("Arguments to pass to the app"),
      waitForDebugger: z
        .boolean()
        .optional()
        .describe("Whether to wait for debugger"),
    },
    async (args) => {
      try {
        const process = await XcodeCommands.launchApp(
          args.udid,
          args.bundleId,
          args.args || [],
          args.waitForDebugger || false
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `App ${args.bundleId} launched`,
                  process: process ? { pid: process.pid } : null,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_terminate_app",
    "Terminate an app on a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
    },
    async (args) => {
      try {
        await XcodeCommands.terminateApp(args.udid, args.bundleId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: `App ${args.bundleId} terminated` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_list_installed_apps",
    "List all installed apps on a simulator",
    { udid: z.string().describe("The UDID of the simulator") },
    async (args) => {
      try {
        const result = await XcodeCommands.listInstalledApps(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Media and Content Tools
  server.tool(
    "xcode_take_screenshot",
    "Take a screenshot of a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      outputPath: z.string().describe("Path where screenshot should be saved"),
    },
    async (args) => {
      try {
        await XcodeCommands.takeScreenshot(args.udid, args.outputPath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Screenshot saved to ${args.outputPath}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_record_video",
    "Start recording video of a simulator (returns process info)",
    {
      udid: z.string().describe("The UDID of the simulator"),
      outputPath: z.string().describe("Path where video should be saved"),
    },
    async (args) => {
      try {
        const videoProcess = XcodeCommands.recordVideo(
          args.udid,
          args.outputPath
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Video recording started, saving to ${args.outputPath}`,
                  process: { pid: videoProcess.pid },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_add_media_to_simulator",
    "Add photos/videos to a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      mediaPaths: z
        .array(z.string())
        .describe("Array of media file paths to add"),
    },
    async (args) => {
      try {
        await XcodeCommands.addMediaToSimulator(args.udid, args.mediaPaths);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Media files added to simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_copy_to_simulator",
    "Copy files to a simulator (limited to media files)",
    {
      udid: z.string().describe("The UDID of the simulator"),
      sourcePath: z.string().describe("Source file path"),
      destinationPath: z.string().describe("Destination path in simulator"),
    },
    async (args) => {
      try {
        await XcodeCommands.copyToSimulator(
          args.udid,
          args.sourcePath,
          args.destinationPath
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `File copied to simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Privacy and Permissions Tools
  server.tool(
    "xcode_get_privacy_permission",
    "Get privacy permission status for an app",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
      service: z
        .enum([...SIMULATOR_CONFIGS.PRIVACY_SERVICES])
        .describe("Privacy service (camera, photos, location, etc.)"),
    },
    async (args) => {
      try {
        const permission = await XcodeCommands.getPrivacyPermission(
          args.udid,
          args.bundleId,
          args.service
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { service: args.service, status: permission },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_grant_privacy_permission",
    "Grant privacy permission to an app",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
      service: z
        .enum([...SIMULATOR_CONFIGS.PRIVACY_SERVICES])
        .describe("Privacy service to grant"),
    },
    async (args) => {
      try {
        await XcodeCommands.grantPrivacyPermission(
          args.udid,
          args.bundleId,
          args.service
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `${args.service} permission granted to ${args.bundleId}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_revoke_privacy_permission",
    "Revoke privacy permission from an app",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
      service: z
        .enum([...SIMULATOR_CONFIGS.PRIVACY_SERVICES])
        .describe("Privacy service to revoke"),
    },
    async (args) => {
      try {
        await XcodeCommands.revokePrivacyPermission(
          args.udid,
          args.bundleId,
          args.service
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `${args.service} permission revoked from ${args.bundleId}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_reset_privacy_permission",
    "Reset privacy permission for an app",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
      service: z
        .enum([...SIMULATOR_CONFIGS.PRIVACY_SERVICES])
        .describe("Privacy service to reset"),
    },
    async (args) => {
      try {
        await XcodeCommands.resetPrivacyPermission(
          args.udid,
          args.bundleId,
          args.service
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `${args.service} permission reset for ${args.bundleId}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Utility Tools
  server.tool(
    "xcode_open_url",
    "Open a URL on a simulator",
    { udid: z.string().describe("The UDID of the simulator"), url: z.string().describe("The URL to open") },
    async (args) => {
      try {
        await XcodeCommands.openUrl(args.udid, args.url);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `URL ${args.url} opened on simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_set_simulator_location",
    "Set the location of a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
    },
    async (args) => {
      try {
        await XcodeCommands.setSimulatorLocation(
          args.udid,
          args.latitude,
          args.longitude
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Location set to ${args.latitude}, ${args.longitude}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_clear_simulator_location",
    "Clear the location of a simulator",
    { udid: z.string().describe("The UDID of the simulator") },
    async (args) => {
      try {
        await XcodeCommands.clearSimulatorLocation(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Location cleared for simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_set_hardware_keyboard",
    "Enable/disable hardware keyboard for a simulator",
    { udid: z.string().describe("The UDID of the simulator"), enabled: z.boolean().describe("Whether to enable hardware keyboard") },
    async (args) => {
      try {
        await XcodeCommands.setHardwareKeyboard(args.udid, args.enabled);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Hardware keyboard ${
                    args.enabled ? "enabled" : "disabled"
                  } for simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_shake_device",
    "Simulate shake gesture on a simulator",
    { udid: z.string().describe("The UDID of the simulator") },
    async (args) => {
      try {
        await XcodeCommands.shakeDevice(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Shake gesture triggered on simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_trigger_memory_warning",
    "Trigger memory warning on a simulator",
    { udid: z.string().describe("The UDID of the simulator") },
    async (args) => {
      try {
        await XcodeCommands.triggerMemoryWarning(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Memory warning triggered on simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_get_simulator_logs",
    "Get logs from a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      predicate: z
        .string()
        .optional()
        .describe("Optional predicate for filtering logs"),
    },
    async (args) => {
      try {
        const result = await XcodeCommands.getSimulatorLogs(
          args.udid,
          args.predicate
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_get_system_info",
    "Get system information from a simulator",
    { udid: z.string().describe("The UDID of the simulator") },
    async (args) => {
      try {
        const result = await XcodeCommands.getSystemInfo(args.udid);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Configuration Tools
  server.tool(
    "xcode_get_device_types",
    "Get available device types for simulators",
    {},
    async () => {
      try {
        const result = await XcodeCommands.getDeviceTypes();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_get_runtimes",
    "Get available runtimes for simulators",
    {},
    async () => {
      try {
        const result = await XcodeCommands.getRuntimes();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_configure_simulator_preferences",
    "Configure simulator preferences in batch",
    {
      udid: z.string().describe("The UDID of the simulator"),
      preferences: z
        .object({
          locale: z
            .string()
            .optional()
            .describe("Locale setting (e.g., 'en_US')"),
          language: z
            .string()
            .optional()
            .describe("Language setting (e.g., 'en')"),
          timezone: z
            .string()
            .optional()
            .describe("Timezone setting (e.g., 'America/New_York')"),
          appearance: z
            .enum(["light", "dark"])
            .optional()
            .describe("UI appearance mode"),
          accessibility: z
            .boolean()
            .optional()
            .describe("Enable accessibility features"),
        })
        .describe("Preferences to configure"),
    },
    async (args) => {
      try {
        await XcodeCommands.configureSimulatorPreferences(
          args.udid,
          args.preferences
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Preferences configured for simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_set_simulator_preference",
    "Set a specific simulator preference",
    {
      udid: z.string().describe("The UDID of the simulator"),
      domain: z.string().describe("Preference domain"),
      key: z.string().describe("Preference key"),
      value: z.string().describe("Preference value"),
    },
    async (args) => {
      try {
        await XcodeCommands.setSimulatorPreference(
          args.udid,
          args.domain,
          args.key,
          args.value
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Preference ${args.key} set for simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "xcode_push_notification",
    "Push a notification to a simulator",
    {
      udid: z.string().describe("The UDID of the simulator"),
      bundleId: z.string().describe("Bundle identifier of the app"),
      payload: z.string().describe("Path to notification payload file"),
    },
    async (args) => {
      try {
        await XcodeCommands.pushNotification(
          args.udid,
          args.bundleId,
          args.payload
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Notification sent to simulator ${args.udid}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}