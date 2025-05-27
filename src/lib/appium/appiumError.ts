/**
 * Custom error class for Appium operations
 */
export class AppiumError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "AppiumError";
  }
}
