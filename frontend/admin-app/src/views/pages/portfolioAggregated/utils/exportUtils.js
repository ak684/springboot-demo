/**
 * Utility functions for exporting aggregated portfolio data
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column IDs to include
 * @param {Array} allColumns - Array of all column configurations
 * @returns {string} CSV formatted string
 */
export const dataToCSV = (data, columns, allColumns) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row with column labels
  const headerRow = columns.map(columnId => {
    const column = allColumns.find(col => col.id === columnId);
    return column ? `"${column.label}"` : `"${columnId}"`;
  }).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return columns.map(columnId => {
      let value = row[columnId];

      // Handle special cases
      if (value === null || value === undefined) {
        return '""';
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`;
      }

      // Handle objects
      if (typeof value === 'object') {
        if (value.name) return `"${value.name}"`;
        if (value.title) return `"${value.title}"`;
        if (value.code) return `"${value.code}"`;
        return `"${JSON.stringify(value)}"`;
      }

      // Handle strings with quotes or commas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    }).join(',');
  }).join('\n');

  return `${headerRow}\n${dataRows}`;
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV formatted content
 * @param {string} filename - Name for the downloaded file
 */
export const downloadCSV = (csvContent, filename = 'aggregated-portfolio-data.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Export aggregated data to CSV
 * @param {Array} data - Data to export
 * @param {Array} visibleColumns - Currently visible column IDs
 * @param {Array} allColumns - All column configurations
 * @param {string} portfolioName - Name of the portfolio for filename
 */
export const exportAggregatedData = (data, visibleColumns, allColumns, portfolioName = 'Portfolio') => {
  const csvContent = dataToCSV(data, visibleColumns, allColumns);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${portfolioName}-aggregated-data-${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};