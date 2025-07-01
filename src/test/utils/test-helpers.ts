/**
 * Test Helper Utilities
 * Common utilities for test setup and execution
 */

export class TestHelpers {
  /**
   * Generate a random string for test naming
   */
  static generateRandomString(length: number = 8): string {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }

  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait for condition to be true with timeout
   */
  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 10000,
    interval: number = 1000
  ): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await this.sleep(interval);
    }

    return false;
  }

  /**
   * Create a temporary file for testing
   */
  static createTempFile(content: string, extension: string = ".txt"): string {
    const fs = require("fs");
    const path = require("path");
    const os = require("os");

    const tempDir = os.tmpdir();
    const fileName = `test-${this.generateRandomString()}${extension}`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * Clean up temporary files
   */
  static cleanupTempFile(filePath: string): void {
    const fs = require("fs");
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }

  /**
   * Mock: Start a mock Appium server (stub for tests)
   */
  static async startMockAppiumServer(): Promise<any> {
    // Return a dummy server object
    return { close: () => {} };
  }

  /**
   * Mock: Stop a mock Appium server (stub for tests)
   */
  static async stopMockServer(server: any): Promise<void> {
    if (server && typeof server.close === 'function') {
      server.close();
    }
  }
}
