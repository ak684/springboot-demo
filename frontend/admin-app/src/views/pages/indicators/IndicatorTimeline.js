import React, { memo } from 'react';
import { Box, styled, Table, TableBody, TableCell, TableHead, TableRow, useTheme } from '@mui/material';
import ImpactFilter from '../../common/ImpactFilter';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import { filteredImpacts } from "shared-components/utils/impact";
import { appSelectors } from 'store/ducks/app';
import IndicatorHeaderCell from './components/IndicatorHeaderCell';
import IndicatorContentCell from './components/IndicatorContentCell';
import useModal from "shared-components/hooks/useModal";
import AddIndicatorModal from '../../common/AddIndicatorModal';
import { getTypography } from "shared-components/utils/typography";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledVerticalCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1, 0),
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)',
  whiteSpace: 'nowrap',
  ...getTypography('captionBold'),
  textAlign: 'center'
}));

const getShortTermIndicators = (impact) => impact.indicators.filter(i => i.year <= 2024);
const getMediumTermIndicators = (impact) => impact.indicators.filter(i => [2025, 2026].includes(i.year));
const getLongTermIndicators = (impact) => impact.indicators.filter(i => i.year >= 2027);

const IndicatorTimeline = () => {
  const [indicatorModalOpen, editIndicator, closeIndicatorModal, editedIndicator] = useModal();
  const theme = useTheme();
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const impactFilter = useSelector(appSelectors.getImpactFilter());

  const data = filteredImpacts(venture.impacts.filter(i => i.indicators.length > 0), impactFilter);
  const headerCells = data.map((impact) => <IndicatorHeaderCell key={impact.id} impact={impact} />);
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  return (
    <CustomErrorBoundary>
      <Box>
        <ImpactFilter />
        <Table sx={{ mt: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell padding='none' width={60} />
              {headerCells}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <StyledVerticalCell padding='none'>
                <Box>Short-term</Box>
                <Box>2023-2024</Box>
              </StyledVerticalCell>
              {data.map(i => <IndicatorContentCell key={i.id}
                indicators={getShortTermIndicators(i)}
                edit={editIndicator} />)}
            </TableRow>
            <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
              <StyledVerticalCell padding='none'>
                <Box>Medium-term</Box>
                <Box>2025-2026</Box>
              </StyledVerticalCell>
              {data.map(i => <IndicatorContentCell key={i.id}
                indicators={getMediumTermIndicators(i)}
                edit={editIndicator} />)}
            </TableRow>
            <TableRow sx={{ backgroundColor: theme.palette.background.fade }}>
              <StyledVerticalCell padding='none'>
                <Box>Long-term</Box>
                <Box>2027+</Box>
              </StyledVerticalCell>
              {data.map(i => <IndicatorContentCell key={i.id}
                indicators={getLongTermIndicators(i)}
                edit={editIndicator} />)}
            </TableRow>
          </TableBody>
        </Table>
        {indicatorModalOpen && access === VENTURE_ACCESS.EDIT &&
          <AddIndicatorModal open onClose={closeIndicatorModal} indicator={editedIndicator} />
        }
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(IndicatorTimeline);
