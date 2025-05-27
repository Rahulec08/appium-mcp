/**
 * Type definitions for Appium capabilities and options
 */

/**
 * Appium capabilities interface
 */
export interface AppiumCapabilities {
  platformName: string;
  browserName?: string;
  "appium:app"?: string;
  "appium:deviceName"?: string;
  "appium:platformVersion"?: string;
  "appium:automationName"?: string;
  "appium:noReset"?: boolean;
  "appium:autoGrantPermissions"?: boolean;
  "appium:newCommandTimeout"?: number;
  "appium:fullReset"?: boolean;
  "appium:udid"?: string;
  [key: string]: any;
}
