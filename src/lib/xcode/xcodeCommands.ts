/**
 * Xcode Commands Utility
 *
 * A comprehensive utility class for managing iOS simulators and Xcode operations
 * through command-line interface. Provides methods for simulator lifecycle management,
 * app installation/management, and various simulator operations.
 *
 * @author Rahul Sharma <rsec08@gmail.com>
 * @since 2025-06-30
 * @version 1.0.0
 */

import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";

const execAsync = promisify(exec);

/**
 * Custom error class for Xcode operations
 */
export class XcodeError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "XcodeError";
  }
}

/**
 * Helper class for Xcode command line operations
 */
export class XcodeCommands {
  /**
   * Check if Xcode command line tools are installed
   * @returns true if installed, false otherwise
   */
  static async isXcodeCliInstalled(): Promise<boolean> {
    try {
      await execAsync("xcode-select -p");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the Xcode path
   * @returns Path to the Xcode installation
   */
  static async getXcodePath(): Promise<string> {
    try {
      const { stdout } = await execAsync("xcode-select -p");
      return stdout.trim();
    } catch (error) {
      throw new XcodeError(
        `Failed to get Xcode path: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Install Xcode command line tools
   * @returns Promise that resolves when installation is complete or rejects on error
   * Note: This will show a GUI prompt that the user needs to interact with
   */
  static async installXcodeCli(): Promise<void> {
    try {
      await execAsync("xcode-select --install");
      console.log(
        "Xcode CLI tools installation has started. Please complete the installation via the GUI prompt."
      );
    } catch (error) {
      throw new XcodeError(
        `Failed to install Xcode command line tools: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get a list of iOS simulators
   * @returns Array of available simulators
   */
  static async getIosSimulators(): Promise<any[]> {
    try {
      const { stdout } = await execAsync(
        "xcrun simctl list devices available --json"
      );
      const simctlOutput = JSON.parse(stdout);
      return simctlOutput.devices;
    } catch (error) {
      throw new XcodeError(
        `Failed to get iOS simulators: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Boot an iOS simulator
   * @param udid The UDID of the simulator to boot
   * @returns Promise that resolves when simulator is booted
   */
  static async bootSimulator(udid: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl boot ${udid}`);
    } catch (error) {
      // If the error includes "already booted" then it's not really an error
      if (error instanceof Error && error.message.includes("already booted")) {
        return;
      }
      throw new XcodeError(
        `Failed to boot simulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Shutdown an iOS simulator
   * @param udid The UDID of the simulator to shutdown
   */
  static async shutdownSimulator(udid: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl shutdown ${udid}`);
    } catch (error) {
      // If the device is already shutdown, ignore the error
      if (
        error instanceof Error &&
        error.message.includes("No devices are booted")
      ) {
        return;
      }
      throw new XcodeError(
        `Failed to shutdown simulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Install an app on a simulator
   * @param udid The UDID of the simulator
   * @param appPath Path to the .app bundle
   */
  static async installApp(udid: string, appPath: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl install ${udid} "${appPath}"`);
    } catch (error) {
      throw new XcodeError(
        `Failed to install app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Uninstall an app from a simulator
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   */
  static async uninstallApp(udid: string, bundleId: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl uninstall ${udid} ${bundleId}`);
    } catch (error) {
      throw new XcodeError(
        `Failed to uninstall app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Launch an app on a simulator
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   * @returns Process object if the app is launched in foreground mode
   */
  static async launchApp(
    udid: string,
    bundleId: string,
    args: string[] = [],
    waitForDebugger: boolean = false
  ): Promise<ChildProcess | null> {
    try {
      let command = `xcrun simctl launch`;
      if (waitForDebugger) {
        command += " --wait-for-debugger";
      }

      // For background launch, use exec
      if (args.length === 0 && !waitForDebugger) {
        await execAsync(`${command} ${udid} ${bundleId}`);
        return null;
      }

      // For foreground launch or with arguments, use spawn
      const argsString = args.length > 0 ? args.join(" ") : "";
      const process = spawn(
        "xcrun",
        ["simctl", "launch", udid, bundleId, ...args],
        {
          stdio: "inherit",
        }
      );

      return process;
    } catch (error) {
      throw new XcodeError(
        `Failed to launch app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Terminate an app on a simulator
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   */
  static async terminateApp(udid: string, bundleId: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl terminate ${udid} ${bundleId}`);
    } catch (error) {
      throw new XcodeError(
        `Failed to terminate app: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Open a URL on a simulator
   * @param udid The UDID of the simulator
   * @param url The URL to open
   */
  static async openUrl(udid: string, url: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl openurl ${udid} "${url}"`);
    } catch (error) {
      throw new XcodeError(
        `Failed to open URL: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Take a screenshot of a simulator
   * @param udid The UDID of the simulator
   * @param outputPath Path where screenshot should be saved
   */
  static async takeScreenshot(udid: string, outputPath: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl io ${udid} screenshot "${outputPath}"`);
    } catch (error) {
      throw new XcodeError(
        `Failed to take screenshot: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Record a video of a simulator
   * @param udid The UDID of the simulator
   * @param outputPath Path where the video should be saved
   * @returns Process object to control recording (must be terminated to stop recording)
   */
  static recordVideo(udid: string, outputPath: string): ChildProcess {
    const process = spawn(
      "xcrun",
      ["simctl", "io", udid, "recordVideo", outputPath],
      {
        stdio: "inherit",
      }
    );

    return process;
  }

  /**
   * Get the status of all simulators
   * @returns Object with simulator status information
   */
  static async getSimulatorStatus(): Promise<any> {
    try {
      const { stdout } = await execAsync("xcrun simctl list devices --json");
      return JSON.parse(stdout);
    } catch (error) {
      throw new XcodeError(
        `Failed to get simulator status: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a new simulator
   * @param name Name for the new simulator
   * @param deviceTypeId Device type identifier (e.g., "iPhone11,8")
   * @param runtimeId Runtime identifier (e.g., "com.apple.CoreSimulator.SimRuntime.iOS-14-0")
   * @returns UDID of the created simulator
   */
  static async createSimulator(
    name: string,
    deviceTypeId: string,
    runtimeId: string
  ): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `xcrun simctl create "${name}" "${deviceTypeId}" "${runtimeId}"`
      );
      return stdout.trim(); // Returns the UDID of the created simulator
    } catch (error) {
      throw new XcodeError(
        `Failed to create simulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete a simulator
   * @param udid The UDID of the simulator to delete
   */
  static async deleteSimulator(udid: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl delete ${udid}`);
    } catch (error) {
      throw new XcodeError(
        `Failed to delete simulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get available device types for simulators
   * @returns List of available device types
   */
  static async getDeviceTypes(): Promise<any[]> {
    try {
      const { stdout } = await execAsync(
        "xcrun simctl list devicetypes --json"
      );
      const output = JSON.parse(stdout);
      return output.devicetypes || [];
    } catch (error) {
      throw new XcodeError(
        `Failed to get device types: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get available runtimes for simulators
   * @returns List of available runtimes
   */
  static async getRuntimes(): Promise<any[]> {
    try {
      const { stdout } = await execAsync("xcrun simctl list runtimes --json");
      const output = JSON.parse(stdout);
      return output.runtimes || [];
    } catch (error) {
      throw new XcodeError(
        `Failed to get runtimes: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Erase simulator data
   * @param udid The UDID of the simulator to erase
   */
  static async eraseSimulator(udid: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl erase ${udid}`);
    } catch (error) {
      throw new XcodeError(
        `Failed to erase simulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Set simulator preferences
   * @param udid The UDID of the simulator
   * @param domain Preference domain
   * @param key Preference key
   * @param value Preference value
   */
  static async setSimulatorPreference(
    udid: string,
    domain: string,
    key: string,
    value: string
  ): Promise<void> {
    try {
      await execAsync(
        `xcrun simctl spawn ${udid} defaults write ${domain} ${key} -string "${value}"`
      );
    } catch (error) {
      throw new XcodeError(
        `Failed to set simulator preference: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Push notification to simulator
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   * @param payload Notification payload file path
   */
  static async pushNotification(
    udid: string,
    bundleId: string,
    payload: string
  ): Promise<void> {
    try {
      await execAsync(`xcrun simctl push ${udid} ${bundleId} "${payload}"`);
    } catch (error) {
      throw new XcodeError(
        `Failed to push notification: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get detailed information about a specific simulator
   * @param udid The UDID of the simulator
   * @returns Detailed simulator information
   */
  static async getSimulatorInfo(udid: string): Promise<SimulatorDevice> {
    try {
      const { stdout } = await execAsync(`xcrun simctl list devices --json`);
      const devices = JSON.parse(stdout).devices;

      for (const runtime in devices) {
        const device = devices[runtime].find((d: any) => d.udid === udid);
        if (device) {
          return {
            udid: device.udid,
            name: device.name,
            state: device.state,
            deviceTypeIdentifier: device.deviceTypeIdentifier,
            runtimeIdentifier: runtime,
            isAvailable: device.isAvailable,
            logPath: device.logPath,
            dataPath: device.dataPath,
          };
        }
      }
      throw new Error(`Simulator with UDID ${udid} not found`);
    } catch (error) {
      throw new XcodeError(
        `Failed to get simulator info: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * List all installed apps on a simulator
   * @param udid The UDID of the simulator
   * @returns Array of installed apps
   */
  static async listInstalledApps(udid: string): Promise<AppInfo[]> {
    try {
      const { stdout } = await execAsync(`xcrun simctl listapps ${udid}`);
      const apps = JSON.parse(stdout);

      return Object.entries(apps).map(([bundleId, info]: [string, any]) => ({
        bundleId,
        name: info.CFBundleDisplayName || info.CFBundleName || bundleId,
        version: info.CFBundleVersion || "1.0",
        path: info.Path || "",
      }));
    } catch (error) {
      throw new XcodeError(
        `Failed to list installed apps: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Configure simulator preferences in batch
   * @param udid The UDID of the simulator
   * @param preferences Preferences to set
   */
  static async configureSimulatorPreferences(
    udid: string,
    preferences: SimulatorPreferences
  ): Promise<void> {
    try {
      const commands: string[] = [];

      if (preferences.locale) {
        commands.push(
          `xcrun simctl spawn ${udid} defaults write NSGlobalDomain AppleLocale -string "${preferences.locale}"`
        );
      }

      if (preferences.language) {
        commands.push(
          `xcrun simctl spawn ${udid} defaults write NSGlobalDomain AppleLanguages -array "${preferences.language}"`
        );
      }

      if (preferences.timezone) {
        commands.push(
          `xcrun simctl spawn ${udid} defaults write com.apple.preferences.datetime timezone -string "${preferences.timezone}"`
        );
      }

      if (preferences.appearance) {
        const value = preferences.appearance === "dark" ? "Dark" : "Light";
        commands.push(
          `xcrun simctl spawn ${udid} defaults write NSGlobalDomain AppleInterfaceStyle -string "${value}"`
        );
      }

      if (preferences.accessibility !== undefined) {
        commands.push(
          `xcrun simctl spawn ${udid} defaults write com.apple.Accessibility AccessibilityEnabled -bool ${preferences.accessibility}`
        );
      }

      for (const command of commands) {
        await execAsync(command);
      }
    } catch (error) {
      throw new XcodeError(
        `Failed to configure simulator preferences: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Copy files to simulator
   * @param udid The UDID of the simulator
   * @param sourcePath Source file/directory path
   * @param destinationPath Destination path in simulator
   */
  static async copyToSimulator(
    udid: string,
    sourcePath: string,
    destinationPath: string
  ): Promise<void> {
    try {
      // For general file copying, we need to use different approaches
      // For media files, use addmedia (current implementation)
      // For app data, we might need to use file system operations

      // Check if it's a media file
      const ext = path.extname(sourcePath).toLowerCase();
      const mediaExtensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".mp4",
        ".mov",
        ".m4v",
      ];

      if (mediaExtensions.includes(ext)) {
        await execAsync(`xcrun simctl addmedia ${udid} "${sourcePath}"`);
      } else {
        // For non-media files, we might need different handling
        // This is a limitation of simctl - general file copying is complex
        throw new XcodeError(
          `General file copying not supported. Use addMediaToSimulator for media files.`
        );
      }
    } catch (error) {
      throw new XcodeError(
        `Failed to copy files to simulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Add photos/videos to simulator
   * @param udid The UDID of the simulator
   * @param mediaPaths Array of media file paths
   */
  static async addMediaToSimulator(
    udid: string,
    mediaPaths: string[]
  ): Promise<void> {
    try {
      const pathsString = mediaPaths.map((p) => `"${p}"`).join(" ");
      await execAsync(`xcrun simctl addmedia ${udid} ${pathsString}`);
    } catch (error) {
      throw new XcodeError(
        `Failed to add media to simulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Set simulator location
   * @param udid The UDID of the simulator
   * @param latitude Latitude coordinate
   * @param longitude Longitude coordinate
   */
  static async setSimulatorLocation(
    udid: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      await execAsync(
        `xcrun simctl location ${udid} set ${latitude},${longitude}`
      );
    } catch (error) {
      throw new XcodeError(
        `Failed to set simulator location: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear simulator location
   * @param udid The UDID of the simulator
   */
  static async clearSimulatorLocation(udid: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl location ${udid} clear`);
    } catch (error) {
      throw new XcodeError(
        `Failed to clear simulator location: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Enable/disable hardware keyboard for simulator
   * @param udid The UDID of the simulator
   * @param enabled Whether to enable hardware keyboard
   */
  static async setHardwareKeyboard(
    udid: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await execAsync(
        `xcrun simctl spawn ${udid} defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool ${enabled}`
      );
    } catch (error) {
      throw new XcodeError(
        `Failed to set hardware keyboard: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get simulator logs
   * @param udid The UDID of the simulator
   * @param predicate Optional predicate for filtering logs
   * @returns Log content as string
   */
  static async getSimulatorLogs(
    udid: string,
    predicate?: string
  ): Promise<string> {
    try {
      let command = `xcrun simctl spawn ${udid} log show`;
      if (predicate) {
        command += ` --predicate "${predicate}"`;
      }
      command += " --last 1h"; // Get last hour of logs by default

      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error) {
      throw new XcodeError(
        `Failed to get simulator logs: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if simulator is booted and ready
   * @param udid The UDID of the simulator
   * @returns True if simulator is booted and ready
   */
  static async isSimulatorReady(udid: string): Promise<boolean> {
    try {
      const info = await this.getSimulatorInfo(udid);
      return info.state === "Booted";
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for simulator to be ready
   * @param udid The UDID of the simulator
   * @param timeoutMs Timeout in milliseconds (default: 60000)
   * @returns Promise that resolves when simulator is ready
   */
  static async waitForSimulator(
    udid: string,
    timeoutMs: number = 60000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (await this.isSimulatorReady(udid)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new XcodeError(
      `Simulator ${udid} did not become ready within ${timeoutMs}ms`
    );
  }

  /**
   * Get privacy settings for an app
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   * @param service Privacy service (e.g., 'camera', 'photos', 'location')
   * @returns Privacy authorization status
   */
  static async getPrivacyPermission(
    udid: string,
    bundleId: string,
    service: string
  ): Promise<string> {
    try {
      // This should check status, not grant permission
      const { stdout } = await execAsync(
        `xcrun simctl privacy ${udid} get ${service} ${bundleId}`
      );
      return stdout.trim();
    } catch (error) {
      throw new XcodeError(
        `Failed to get privacy permission: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Grant privacy permission to an app
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   * @param service Privacy service to grant
   */
  static async grantPrivacyPermission(
    udid: string,
    bundleId: string,
    service: string
  ): Promise<void> {
    try {
      await execAsync(
        `xcrun simctl privacy ${udid} grant ${service} ${bundleId}`
      );
    } catch (error) {
      throw new XcodeError(
        `Failed to grant privacy permission: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Revoke privacy permission from an app
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   * @param service Privacy service to revoke
   */
  static async revokePrivacyPermission(
    udid: string,
    bundleId: string,
    service: string
  ): Promise<void> {
    try {
      await execAsync(
        `xcrun simctl privacy ${udid} revoke ${service} ${bundleId}`
      );
    } catch (error) {
      throw new XcodeError(
        `Failed to revoke privacy permission: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Reset privacy permissions for an app
   * @param udid The UDID of the simulator
   * @param bundleId Bundle identifier of the app
   * @param service Privacy service to reset
   */
  static async resetPrivacyPermission(
    udid: string,
    bundleId: string,
    service: string
  ): Promise<void> {
    try {
      await execAsync(
        `xcrun simctl privacy ${udid} reset ${service} ${bundleId}`
      );
    } catch (error) {
      throw new XcodeError(
        `Failed to reset privacy permission: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get simulator system information
   * @param udid The UDID of the simulator
   * @returns System information
   */
  static async getSystemInfo(udid: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`xcrun simctl spawn ${udid} uname -a`);
      return stdout.trim();
    } catch (error) {
      throw new XcodeError(
        `Failed to get system info: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Simulate shake gesture
   * @param udid The UDID of the simulator
   */
  static async shakeDevice(udid: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl shake ${udid}`);
    } catch (error) {
      throw new XcodeError(
        `Failed to shake device: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Trigger memory warning
   * @param udid The UDID of the simulator
   */
  static async triggerMemoryWarning(udid: string): Promise<void> {
    try {
      await execAsync(`xcrun simctl memory_warning ${udid}`);
    } catch (error) {
      throw new XcodeError(
        `Failed to trigger memory warning: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }
}

/**
 * Common simulator configurations
 */
export const SIMULATOR_CONFIGS = {
  DEVICE_TYPES: {
    IPHONE_15_PRO: "iPhone15,2",
    IPHONE_15: "iPhone15,4",
    IPHONE_14_PRO: "iPhone14,3",
    IPHONE_14: "iPhone14,7",
    IPAD_PRO_12_9: "iPad13,8",
    IPAD_AIR: "iPad13,1",
  },

  PRIVACY_SERVICES: [
    "camera",
    "photos",
    "location",
    "contacts",
    "calendar",
    "reminders",
    "microphone",
    "speech-recognition",
    "motion",
    "health",
    "homekit",
    "media-library",
  ] as const,

  DEFAULT_TIMEOUT: 60000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 3,
};

export type PrivacyService =
  (typeof SIMULATOR_CONFIGS.PRIVACY_SERVICES)[number];

/**
 * Interface for simulator device information
 */
export interface SimulatorDevice {
  udid: string;
  name: string;
  state: "Shutdown" | "Booted" | "Booting" | "Shutting Down";
  deviceTypeIdentifier: string;
  runtimeIdentifier: string;
  isAvailable: boolean;
  logPath?: string;
  dataPath?: string;
}

/**
 * Interface for device type information
 */
export interface DeviceType {
  name: string;
  identifier: string;
  productFamily: string;
}

/**
 * Interface for runtime information
 */
export interface Runtime {
  name: string;
  identifier: string;
  version: string;
  isAvailable: boolean;
  buildversion: string;
}

/**
 * Interface for app information
 */
export interface AppInfo {
  bundleId: string;
  name: string;
  version: string;
  path: string;
}

/**
 * Simulator preferences configuration
 */
export interface SimulatorPreferences {
  locale?: string;
  language?: string;
  timezone?: string;
  appearance?: "light" | "dark";
  accessibility?: boolean;
}
