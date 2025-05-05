import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";

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
}
