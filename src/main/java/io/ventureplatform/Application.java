package io.ventureplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
  public static void main(String[] args) {
    System.setProperty("webdriver.chrome.driver", "/usr/local/bin/chromedriver");
    SpringApplication.run(Application.class, args);
  }
}
