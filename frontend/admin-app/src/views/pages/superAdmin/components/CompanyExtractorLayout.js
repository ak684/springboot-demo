import React, { useState } from 'react';
import { Box } from '@mui/material';
import CompanyExtractorSidebar from './CompanyExtractorSidebar';
import { HEADER_HEIGHT } from "shared-components/utils/constants";

const CompanyExtractorLayout = ({ children, activeSection, onSectionChange, extractionProgress, portfolioId }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Try to get saved preference from localStorage, default to collapsed (true)
    const saved = localStorage.getItem('companyExtractor.sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
    // Save preference to localStorage
    localStorage.setItem('companyExtractor.sidebarCollapsed', JSON.stringify(collapsed));
  };

  return (
    <Box display="flex" minHeight={`calc(100vh - ${HEADER_HEIGHT}px)`}>
      <CompanyExtractorSidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        extractionProgress={extractionProgress}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        portfolioId={portfolioId}
      />
      <Box flex={1} sx={{ overflow: 'auto', backgroundColor: 'background.default' }}>
        <Box p={4}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default CompanyExtractorLayout;
