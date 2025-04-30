import {
  AppiumHelper,
  AppiumCapabilities,
} from "../src/lib/appium/appiumHelper.js";

interface TestStep {
  action: string;
  params: Record<string, any>;
  description: string;
}

class AppiumAIAgent {
  private appium: AppiumHelper;
  private testSteps: TestStep[] = [];
  private testResults: string[] = [];

  constructor(screenshotDir: string = "./ai-test-screenshots") {
    this.appium = new AppiumHelper(screenshotDir);
  }

  /**
   * Initialize Appium session with the given capabilities
   */
  async initializeSession(capabilities: AppiumCapabilities): Promise<void> {
    try {
      await this.appium.initializeDriver(capabilities);
      this.logStep("initialize", capabilities, "Initialized Appium session");
    } catch (error) {
      throw new Error(`Failed to initialize session: ${error}`);
    }
  }

  /**
   * Execute a natural language command
   * This is where the LLM would parse the command and convert it to Appium actions
   */
  async executeCommand(command: string): Promise<void> {
    try {
      // Here you would integrate with your LLM to parse the command
      // For demonstration, we'll handle some basic commands
      const normalizedCommand = command.toLowerCase();

      if (
        normalizedCommand.includes("tap") ||
        normalizedCommand.includes("click")
      ) {
        const element = this.extractElementFromCommand(command);
        await this.tapElement(element);
      } else if (
        normalizedCommand.includes("type") ||
        normalizedCommand.includes("enter")
      ) {
        const { element, text } = this.extractInputFromCommand(command);
        await this.enterText(element, text);
      } else if (normalizedCommand.includes("scroll")) {
        const element = this.extractElementFromCommand(command);
        await this.scrollToElement(element);
      } else if (normalizedCommand.includes("screenshot")) {
        const name = command.split(" ").pop() || "screen";
        await this.takeScreenshot(name);
      } else {
        throw new Error(`Unknown command: ${command}`);
      }

      this.logStep(
        "execute_command",
        { command },
        `Executed command: ${command}`
      );
    } catch (error) {
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  /**
   * Extract element identifier from natural language command
   */
  private extractElementFromCommand(command: string): string {
    // In a real implementation, this would use an LLM to parse the command
    // and identify the element using various strategies (text, id, etc.)
    const textMatch = command.match(/"([^"]+)"/);
    if (textMatch) {
      return `//android.widget.TextView[@text="${textMatch[1]}"]`;
    }
    return command.split('"')[1] || "";
  }

  /**
   * Extract input field and text from natural language command
   */
  private extractInputFromCommand(command: string): {
    element: string;
    text: string;
  } {
    // In a real implementation, this would use an LLM to parse the command
    const parts = command.split('"');
    return {
      element: `//android.widget.EditText[@text="${parts[1]}"]`,
      text: parts[3] || "",
    };
  }

  /**
   * Tap on an element
   */
  async tapElement(elementSelector: string): Promise<void> {
    try {
      await this.appium.tapElement(elementSelector);
      this.logStep(
        "tap",
        { element: elementSelector },
        `Tapped element: ${elementSelector}`
      );
    } catch (error) {
      throw new Error(`Failed to tap element: ${error}`);
    }
  }

  /**
   * Enter text into an element
   */
  async enterText(elementSelector: string, text: string): Promise<void> {
    try {
      await this.appium.sendKeys(elementSelector, text);
      this.logStep(
        "input",
        { element: elementSelector, text },
        `Entered text: ${text}`
      );
    } catch (error) {
      throw new Error(`Failed to enter text: ${error}`);
    }
  }

  /**
   * Scroll to an element
   */
  async scrollToElement(elementSelector: string): Promise<void> {
    try {
      await this.appium.scrollToElement(elementSelector);
      this.logStep(
        "scroll",
        { element: elementSelector },
        `Scrolled to element: ${elementSelector}`
      );
    } catch (error) {
      throw new Error(`Failed to scroll to element: ${error}`);
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    try {
      const path = await this.appium.takeScreenshot(name);
      this.logStep("screenshot", { name, path }, `Took screenshot: ${path}`);
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error}`);
    }
  }

  /**
   * Log a test step
   */
  private logStep(
    action: string,
    params: Record<string, any>,
    description: string
  ): void {
    this.testSteps.push({ action, params, description });
    this.testResults.push(description);
  }

  /**
   * Get test results
   */
  getTestResults(): string[] {
    return this.testResults;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.appium.closeDriver();
  }
}

// Example usage
async function testWithAIAgent() {
  const agent = new AppiumAIAgent();

  try {
    // Initialize session
    await agent.initializeSession({
      platformName: "Android",
      deviceName: "Pixel_4",
      automationName: "UiAutomator2",
      appPackage: "com.android.settings",
      appActivity: ".Settings",
      noReset: true,
    });

    // Execute natural language commands
    await agent.executeCommand('tap element "Search settings"');
    await agent.executeCommand('type in "Search" field "wifi"');
    await agent.executeCommand('take screenshot "wifi_search"');
    await agent.executeCommand('scroll to "About phone"');
    await agent.executeCommand('tap element "About phone"');
    await agent.executeCommand('take screenshot "about_phone"');

    // Print test results
    console.log("\nTest Results:");
    agent.getTestResults().forEach((result, index) => {
      console.log(`${index + 1}. ${result}`);
    });
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await agent.cleanup();
  }
}

// Run the test
testWithAIAgent().catch(console.error);
