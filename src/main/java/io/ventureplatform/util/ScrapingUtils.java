package io.ventureplatform.util;

import org.openqa.selenium.chrome.ChromeOptions;

public final class ScrapingUtils {
  private ScrapingUtils() {
  }

  public static final ChromeOptions DEFAULT_CHROME_OPTIONS = new ChromeOptions();

  static {
    DEFAULT_CHROME_OPTIONS.addArguments("--no-sandbox");
    DEFAULT_CHROME_OPTIONS.addArguments("start-maximized");
    DEFAULT_CHROME_OPTIONS.addArguments("disable-infobars");
    DEFAULT_CHROME_OPTIONS.addArguments("--disable-extensions");
    DEFAULT_CHROME_OPTIONS.addArguments("--disable-dev-shm-usage");
    DEFAULT_CHROME_OPTIONS.addArguments("--headless");
    DEFAULT_CHROME_OPTIONS.addArguments("--remote-allow-origins=*");
  }
}
