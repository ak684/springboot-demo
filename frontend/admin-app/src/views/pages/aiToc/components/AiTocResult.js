import React, { memo, useEffect, useState } from 'react';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import AiTocTable from "./AiTocTable";
import AiTocErrorBoundary from "./AiTocErrorBoundary";
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { getElementPosition } from "utils/onboarding";
import OnboardingTooltip from "../../../common/OnboardingTooltip";
import ReplayIcon from '@mui/icons-material/Replay';
import { getHelpSteps } from "../data/helpSteps";
import AiTocFooter from "./AiTocFooter";
import AiTocAddIndicatorModal from "./AiTocAddIndicatorModal";
import { impactFieldNames } from "shared-components/utils/impact";

const AiTocResult = ({ values, refine, reset, saveToc }) => {
  const [tooltip, setTooltip] = useState({});
  const [tooltipIndex, setTooltipIndex] = useState(0);
  const [editedCell, setEditedCell] = useState(null);
  const [editedToc, setEditedToc] = useState(values.toc || []);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const tooltips = getHelpSteps();
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));

  // Update editedToc when values.toc changes (e.g., after refinement)
  useEffect(() => {
    if (values.toc && Array.isArray(values.toc)) {
      setEditedToc(values.toc);
    }
  }, [values.toc]);

  useEffect(() => {
    if (values.toc && Array.isArray(values.toc) && !localStorage.getItem("aiTocTooltip")) {
      showHelpTooltip();
    }
  }, []);

  const showHelpTooltip = () => {
    setTooltipIndex(0);
    showTooltip(0);
  }

  const nextTooltip = () => {
    setTooltipIndex(current => current + 1);
    showTooltip(tooltipIndex + 1);
    setTimeout(() => {
      const tooltipElement = document.getElementById('onboarding-tooltip');
      if (tooltipElement) {
        tooltipElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  const showTooltip = (index) => {
    const tooltipData = tooltips[index];
    const element = document.getElementById(tooltipData.element);
    if (element) {
      const position = getElementPosition({ current: element });
      setTooltip({ ...tooltipData, position: tooltipData.position(position) });
    }
  }

  const closeTooltip = () => {
    setTooltip({});
    setTooltipIndex(0);
    localStorage.setItem("aiTocTooltip", true);
  }

  // Functions for handling editable fields - using useCallback to prevent recreation
  const editField = React.useCallback((rowIndex, fieldName) => {
    // Don't immediately trigger edit mode - make it more robust
    setTimeout(() => {
      setEditedCell(`${rowIndex}.${fieldName}`);
    }, 0);
  }, []);

  const cancelEditField = React.useCallback(() => {
    setEditedCell(null);
  }, []);

  const confirmEditField = React.useCallback((value, customEditedCell) => {
    // Use a local variable to hold the cell ID to avoid race conditions
    const cellId = customEditedCell || editedCell;
    if (!cellId) return;

    // Parse cell coordinates
    const editParams = cellId.split('.');
    if (editParams.length !== 2) return;

    const rowIndex = parseInt(editParams[0]);
    const field = editParams[1];

    // Update TOC - use functional state update to avoid stale data
    setEditedToc(prevToc => {
      // Early return if row doesn't exist
      if (!prevToc[rowIndex]) return prevToc;

      // Create a deep copy
      const updatedToc = [...prevToc];
      updatedToc[rowIndex] = {
        ...updatedToc[rowIndex],
        [field]: value
      };

      // Update local storage
      try {
        if (window.localStorage && values.toc) {
          const formikToc = [...values.toc];
          if (formikToc[rowIndex]) {
            formikToc[rowIndex] = {
              ...formikToc[rowIndex],
              [field]: value
            };

            const pageState = JSON.parse(localStorage.getItem("AI_TOC") || "{}");
            pageState.toc = formikToc;
            localStorage.setItem("AI_TOC", JSON.stringify(pageState));
          }
        }
      } catch (storageError) {
        console.error('[AiTocResult] Error updating localStorage:', storageError);
      }

      return updatedToc;
    });

    // Clear edit state in next tick to prevent race conditions
    setTimeout(() => {
      setEditedCell(null);
    }, 0);
  }, [editedCell, values.toc]);

  // Function to handle indicator deletion
  const deleteIndicator = React.useCallback((rowIndex, indicatorIndex) => {
    // Update TOC - use functional state update to avoid stale data
    setEditedToc(prevToc => {
      // Early return if row doesn't exist
      if (!prevToc[rowIndex] || !prevToc[rowIndex].indicators) return prevToc;

      // Create a deep copy
      const updatedToc = [...prevToc];
      const updatedIndicators = [...updatedToc[rowIndex].indicators];
      updatedIndicators.splice(indicatorIndex, 1);

      updatedToc[rowIndex] = {
        ...updatedToc[rowIndex],
        indicators: updatedIndicators
      };

      // Update local storage
      try {
        if (window.localStorage && values.toc) {
          const formikToc = JSON.parse(JSON.stringify(values.toc));
          if (formikToc[rowIndex]) {
            formikToc[rowIndex].indicators = [...updatedIndicators];

            const pageState = JSON.parse(localStorage.getItem("AI_TOC") || "{}");
            pageState.toc = formikToc;
            localStorage.setItem("AI_TOC", JSON.stringify(pageState));
          }
        }
      } catch (storageError) {
        console.error('[AiTocResult] Error updating localStorage:', storageError);
      }

      return updatedToc;
    });
  }, [values.toc]);

  // Function to open the add indicator modal
  const openAddIndicatorModal = React.useCallback((rowIndex) => {
    setCurrentRowIndex(rowIndex);
    setIndicatorModalOpen(true);
  }, []);

  // Function to close the add indicator modal
  const closeAddIndicatorModal = React.useCallback(() => {
    setIndicatorModalOpen(false);
    setCurrentRowIndex(null);
  }, []);

  // Function to add a new indicator
  const addIndicator = React.useCallback((indicatorData) => {
    if (currentRowIndex === null) return;

    // Update TOC - use functional state update to avoid stale data
    setEditedToc(prevToc => {
      // Early return if row doesn't exist
      if (!prevToc[currentRowIndex]) return prevToc;

      // Create a deep copy
      const updatedToc = [...prevToc];
      const currentIndicators = Array.isArray(updatedToc[currentRowIndex].indicators)
        ? [...updatedToc[currentRowIndex].indicators]
        : [];

      // Add the new indicator
      currentIndicators.push(indicatorData);

      updatedToc[currentRowIndex] = {
        ...updatedToc[currentRowIndex],
        indicators: currentIndicators
      };

      // Update local storage
      try {
        if (window.localStorage && values.toc) {
          const formikToc = JSON.parse(JSON.stringify(values.toc));
          if (formikToc[currentRowIndex]) {
            formikToc[currentRowIndex].indicators = [...currentIndicators];

            const pageState = JSON.parse(localStorage.getItem("AI_TOC") || "{}");
            pageState.toc = formikToc;
            localStorage.setItem("AI_TOC", JSON.stringify(pageState));
          }
        }
      } catch (storageError) {
        console.error('[AiTocResult] Error updating localStorage:', storageError);
      }

      return updatedToc;
    });
  }, [currentRowIndex, values.toc]);

  return (
    <Box position='relative' p={{ xs: 3, sm: 4 }}>
      <AiTocErrorBoundary
        reset={reset}
        toc={values.toc}
        show={!values.toc || !Array.isArray(values.toc) || values.toc.length === 0}
      >
        <Box display='flex' alignItems='center' justifyContent='space-between' gap={2}>
          <Typography variant='h5'>Your AI-generated theory of change</Typography>
          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              size='small'
              startIcon={!isMobileView && <ReplayIcon />}
              onClick={reset}
              sx={{ minWidth: 'unset' }}
            >
              {isMobileView ? <ReplayIcon /> : 'Start over'}
            </Button>
            <Button
              variant='outlined'
              size='small'
              startIcon={!isMobileView && <HelpOutlineOutlinedIcon />}
              onClick={showHelpTooltip}
              sx={{ minWidth: 'unset' }}
            >
              {isMobileView ? <HelpOutlineOutlinedIcon /> : 'Help'}
            </Button>
            <Button
              variant='outlined'
              size='small'
              startIcon={!isMobileView && <TuneIcon />}
              onClick={refine}
              sx={{ minWidth: 'unset' }}
            >
              {isMobileView ? <TuneIcon /> : 'Refine'}
            </Button>
          </Box>
        </Box>
        <AiTocTable
          toc={editedToc}
          edit={editField}
          editedCell={editedCell}
          cancel={cancelEditField}
          confirm={confirmEditField}
          deleteIndicator={deleteIndicator}
          addIndicator={openAddIndicatorModal}
        />
      </AiTocErrorBoundary>
      <AiTocFooter
        values={values}
        finalStep
        saveToc={saveToc}
        showFeedbackButton={values.toc && Array.isArray(values.toc)}
      />
      <OnboardingTooltip
        open={Object.keys(tooltip).length > 0}
        onClose={closeTooltip}
        last={tooltipIndex >= tooltips.length - 1}
        next={nextTooltip}
        {...tooltip}
      />
      {indicatorModalOpen && (
        <AiTocAddIndicatorModal
          open={indicatorModalOpen}
          onClose={closeAddIndicatorModal}
          onAdd={addIndicator}
        />
      )}
    </Box>
  );
};

export default memo(AiTocResult);
