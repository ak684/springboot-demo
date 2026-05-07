package io.ventureplatform.entity.enums;

/**
 * Types of news sources for tracking article origins.
 */
public enum NewsSourceType {
  /**
   * Articles scraped from Google News search results.
   */
  GOOGLE_NEWS,

  /**
   * Articles from RSS feeds.
   */
  RSS,

  /**
   * Articles from news APIs.
   */
  API,

  /**
   * Articles manually added or from other sources.
   */
  OTHER
}
