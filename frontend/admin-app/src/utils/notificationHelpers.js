/**
 * Number of days to look back for news notifications.
 * Frontend specifies this to the backend API.
 */
export const NEWS_NOTIFICATION_LOOKBACK_DAYS = 30;

/**
 * Groups news events by company and published date.
 * Events from the same company published on the same day are grouped together.
 * NOTE: Date filtering is handled by the backend API, so we don't filter here.
 *
 * @param {Array} newsEvents - Array of news event objects
 * @returns {Array} Array of grouped news objects
 */
export const groupNewsByCompanyAndDate = (newsEvents) => {
  // First, deduplicate news events by ID to handle cases where
  // the same article appears multiple times due to portfolio overlaps
  const uniqueNewsMap = new Map();
  newsEvents.forEach(newsItem => {
    if (!uniqueNewsMap.has(newsItem.id)) {
      uniqueNewsMap.set(newsItem.id, newsItem);
    }
  });
  const uniqueNewsEvents = Array.from(uniqueNewsMap.values());

  const newsGrouped = uniqueNewsEvents.reduce((acc, newsItem) => {
    const companyId = newsItem.companyExtractionData?.id;
    if (!companyId) return acc;

    // Group by company + publishedDate (ignore time)
    const publishedDate = new Date(newsItem.publishedDate);
    const dateKey = publishedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const groupKey = `${companyId}_${dateKey}`;

    if (!acc[groupKey]) {
      acc[groupKey] = {
        type: 'newsGroup',
        groupId: groupKey,
        companyId,
        companyName: newsItem.companyExtractionData?.companyName || 'Unknown',
        articles: [],
        publishedDate: newsItem.publishedDate
      };
    }

    // Also deduplicate articles within each group by article ID
    const existingArticleIds = acc[groupKey].articles.map(a => a.id);
    if (!existingArticleIds.includes(newsItem.id)) {
      acc[groupKey].articles.push(newsItem);
    }

    return acc;
  }, {});

  return Object.values(newsGrouped);
};
