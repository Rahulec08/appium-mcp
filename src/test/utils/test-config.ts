/**
 * Test Configuration
 * Centralized configuration for all tests
 */

export const TEST_CONFIG = {
  timeouts: {
    small: 5000,    // 5 seconds
    medium: 15000,  // 15 seconds
    large: 30000,   // 30 seconds
    xlarge: 60000   // 1 minute
  },

  appium: {
    APPIUM_URL: process.env.APPIUM_URL || "http://10.112.1.126:4723/wd/hub",
    capabilities: {
      platformName: "Android" as const,
      platformVersion: "13.0",
      deviceName: "emulator-5554",
      automationName: "UiAutomator2" as const,
      appPackage: "com.android.settings",
      appActivity: ".Settings",
      noReset: true
    }
  },

  xcode: {
    testAppPath: "/path/to/test/app",
    platformVersion: "17.0",
    deviceName: "iPhone 15 Pro",
    testBundleId: "com.example.testapp"
  },

  adb: {
    testAppPath: "/path/to/test/app.apk",
    testPackage: "com.example.testapp",
    testActivity: "com.example.testapp.MainActivity",
  },
};
