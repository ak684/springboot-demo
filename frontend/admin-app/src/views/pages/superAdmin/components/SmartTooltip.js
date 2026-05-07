import React, { useState, useCallback } from 'react';
import { Tooltip } from '@mui/material';
import { v1LongTimeout } from 'services/api';

/**
 * Smart Tooltip Component
 *
 * Looks identical to regular MUI Tooltip but fetches full text on hover.
 * Features:
 * - Shows full text on hover
 * - Intelligent caching to avoid redundant calls
 * - Fast API calls for seamless experience
 */

// Global cache for full text data
const fullTextCache = new Map();

const SmartTooltip = ({
  children,
  title: initialTitle,
  companyId,
  fieldName,
  ...tooltipProps
}) => {
  const [displayTitle, setDisplayTitle] = useState(initialTitle || '');

  // Create cache key
  const cacheKey = `${companyId}_${fieldName}`;

  const handleMouseEnter = useCallback(async () => {
    // If no companyId or fieldName, just show initial title
    if (!companyId || !fieldName) {
      return;
    }

    // Check cache first
    if (fullTextCache.has(cacheKey)) {
      setDisplayTitle(fullTextCache.get(cacheKey));
      return;
    }

    // Fetch full text
    try {
      const response = await v1LongTimeout.get(
        `/companies/full-text/${companyId}/${fieldName}`
      );

      const fullText = response.data.fullText || initialTitle;

      // Cache the result
      fullTextCache.set(cacheKey, fullText);

      // Update display
      setDisplayTitle(fullText);

    } catch (error) {
      console.error(`[SmartTooltip] Failed to fetch full text:`, error);
      // Keep showing initial title on error
    }
  }, [companyId, fieldName, cacheKey, initialTitle]);

  // If no companyId or fieldName provided, fall back to regular tooltip
  if (!companyId || !fieldName) {
    return (
      <Tooltip title={initialTitle} {...tooltipProps}>
        {children}
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={displayTitle}
      onMouseEnter={handleMouseEnter}
      {...tooltipProps}
    >
      {children}
    </Tooltip>
  );
};

export default SmartTooltip;
