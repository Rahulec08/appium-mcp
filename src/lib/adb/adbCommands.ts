import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Utility class for executing ADB commands
 */
export class AdbCommands {
  /**
   * Execute an ADB command
   * 
   * @param command The ADB command to execute
   * @returns The output from the command execution
   */
  static async executeCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`adb ${command}`);
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`ADB command failed: ${error.message}`);
    }
  }

  /**
   * Get a list of connected devices
   * 
   * @returns List of device IDs
   */
  static async getDevices(): Promise<string[]> {
    const output = await this.executeCommand('devices');
    const lines = output.split('\n').slice(1); // Skip the header line
    
    return lines
      .filter(line => line.trim().length > 0)
      .map(line => line.split('\t')[0]);
  }

  /**
   * Install an APK on a device
   * 
   * @param deviceId Target device ID
   * @param apkPath Path to the APK file
   * @returns Installation result message
   */
  static async installApp(deviceId: string, apkPath: string): Promise<string> {
    return this.executeCommand(`-s ${deviceId} install -r "${apkPath}"`);
  }

  /**
   * Uninstall an app from a device
   * 
   * @param deviceId Target device ID
   * @param packageName Package name of the app to uninstall
   * @returns Uninstallation result message
   */
  static async uninstallApp(deviceId: string, packageName: string): Promise<string> {
    return this.executeCommand(`-s ${deviceId} uninstall "${packageName}"`);
  }

  /**
   * Take a screenshot on the device
   * 
   * @param deviceId Target device ID
   * @param outputPath Local path to save the screenshot
   * @returns Screenshot capture result
   */
  static async takeScreenshot(deviceId: string, outputPath: string): Promise<string> {
    await this.executeCommand(`-s ${deviceId} shell screencap -p /sdcard/screenshot.png`);
    return this.executeCommand(`-s ${deviceId} pull /sdcard/screenshot.png "${outputPath}"`);
  }

  /**
   * Get the current screen resolution
   * 
   * @param deviceId Target device ID
   * @returns The screen resolution in the format "widthxheight"
   */
  static async getScreenResolution(deviceId: string): Promise<string> {
    const output = await this.executeCommand(`-s ${deviceId} shell wm size`);
    // Extract the resolution from a string like "Physical size: 1080x2340"
    const match = output.match(/(\d+x\d+)/);
    if (match && match[1]) {
      return match[1];
    }
    throw new Error(`Failed to parse screen resolution from: ${output}`);
  }

  /**
   * Get a list of installed packages
   * 
   * @param deviceId Target device ID
   * @returns List of installed package names
   */
  static async getInstalledPackages(deviceId: string): Promise<string[]> {
    const output = await this.executeCommand(`-s ${deviceId} shell pm list packages`);
    return output
      .split('\n')
      .map(line => line.replace('package:', '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Launch an application by package name
   * 
   * @param deviceId Target device ID
   * @param packageName Package name of the app to launch
   * @param activityName Optional activity name to launch
   * @returns Command execution result
   */
  static async launchApp(deviceId: string, packageName: string, activityName?: string): Promise<string> {
    const activity = activityName ? `${packageName}/${activityName}` : packageName;
    return this.executeCommand(`-s ${deviceId} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
  }

  /**
   * Check if device is connected
   * 
   * @param deviceId Device ID to check
   * @returns true if the device is connected, false otherwise
   */
  static async isDeviceConnected(deviceId: string): Promise<boolean> {
    const devices = await this.getDevices();
    return devices.includes(deviceId);
  }
}