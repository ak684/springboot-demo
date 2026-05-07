import React, { memo, useState } from 'react';
import {
  Box,
  Divider,
  IconButton,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import ImpactSort from '../../common/ImpactSort';
import SettingsIcon from '@mui/icons-material/Settings';
import DimensionsDrawer from './components/DimensionsDrawer';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import ExportInfoModal from 'views/common/ExportInfoModal';
import { useDispatch, useSelector } from 'react-redux';
import { sortedImpacts } from "shared-components/utils/impact";
import { appSelectors } from 'store/ducks/app';
import { useParams } from 'react-router-dom';
import DimensionsHeaderCells from './components/DimensionsHeaderCells';
import DimensionsRow from './components/DimensionsRow';
import DimensionsIndicatorRow from './components/DimensionsIndicatorRow';
import useModal from "shared-components/hooks/useModal";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledTable = styled(Table)(({ theme }) => ({
  width: 'unset',
  borderCollapse: 'collapse',
  '& .MuiTableCell-root': {
    padding: theme.spacing(1),
  }
}));

const StyledTableWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: theme.spacing(4),
  height: 'calc(100vh - 220px)',
  overflow: 'auto',
}));

const StickyLeftCell = styled(TableCell)(() => ({
  position: 'sticky',
  backgroundColor: 'inherit',
  left: -1,
  zIndex: 1,
}));

const sectionsShowed = (sections, collapsed) => sections.length - sections.filter(i => collapsed.includes(i)).length;

const FiveDimensionsOfImpact = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState([]);
  const [collapsedImpacts, setCollapsedImpacts] = useState([]);
  const [exportModalOpen, openExportModal, closeExportModal] = useModal();
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const dispatch = useDispatch();
  const impactSort = useSelector(appSelectors.getImpactSort());

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const exportPage = () => {
    dispatch(ventureThunks.exportFiveDimensions({ collapsed, collapsedImpacts }));
  };

  const data = sortedImpacts(venture.impacts.filter(i => !collapsedImpacts.includes(i.id)), impactSort);

  const whatCell = (
    <TableCell
      rowSpan={sectionsShowed(['sdgs', 'change', 'problemImportance'], collapsed)}
      sx={{ textAlign: 'center', minWidth: 'calc((100vw - 64px) * 0.08 - 2px)' }}
    >
      <Box component='img' src='/images/icons/scoring/what.svg' alt='What?' />
      <Typography variant='captionBold' sx={{ mt: 0.5 }}>What</Typography>
    </TableCell>
  );
  const whoCell = (
    <TableCell
      rowSpan={sectionsShowed(['stakeholders', 'geography', 'stakeholderSituation'], collapsed)}
      sx={{ textAlign: 'center', minWidth: 'calc((100vw - 64px) * 0.08 - 2px)' }}
    >
      <Box component='img' src='/images/icons/scoring/who.svg' alt='Who?' />
      <Typography variant='captionBold' sx={{ mt: 0.5 }}>Who</Typography>
    </TableCell>
  );
  const howMuchCell = (
    <TableCell
      rowSpan={sectionsShowed(['degreeOfChange', 'sizeOfStakeholders', 'duration'], collapsed)}
      sx={{ textAlign: 'center', minWidth: 'calc((100vw - 64px) * 0.08 - 2px)' }}
    >
      <Box component='img' src='/images/icons/scoring/how_much.svg' alt='How much?' />
      <Typography variant='captionBold' sx={{ mt: 0.5 }}>How much</Typography>
    </TableCell>
  );
  const contributionCell = (
    <TableCell sx={{ textAlign: 'center', minWidth: 'calc((100vw - 64px) * 0.08 - 2px)' }}>
      <Box component='img' src='/images/icons/scoring/contr.svg' alt='Contribution?' />
      <Typography variant='captionBold' sx={{ mt: 0.5 }}>Contribution</Typography>
    </TableCell>
  );
  const riskCell = (
    <TableCell
      rowSpan={sectionsShowed(['previousEvidence', 'proximity', 'indicators'], collapsed)}
      sx={{ textAlign: 'center', minWidth: 'calc((100vw - 64px) * 0.08 - 2px)' }}
    >
      <Box component='img' src='/images/icons/scoring/risk.svg' alt='Risk?' />
      <Typography variant='captionBold' sx={{ mt: 0.5 }}>Risk</Typography>
    </TableCell>
  );

  return (
    <CustomErrorBoundary>
      <Box>
        <Box display='flex' justifyContent='flex-end' alignItems='center'>
          <Box display='flex' alignItems='center' gap={1}>
            <ImpactSort />
            {/*<Button*/}
            {/*  variant='outlined'*/}
            {/*  onClick={exportPage}*/}
            {/*  startIcon={<OpenInNewIcon />}*/}
            {/*  size='small'*/}
            {/*>*/}
            {/*  Export*/}
            {/*</Button>*/}
            {/*<IconButton onClick={openExportModal}><InfoOutlinedIcon sx={{ color: 'secondary.main' }} /></IconButton>*/}
            <Divider orientation='vertical' flexItem />
            <IconButton onClick={openDrawer}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
        <StyledTableWrapper>
          <StyledTable>
            <TableHead>
              <TableRow>
                <TableCell
                  component='th'
                  colSpan={2}
                  sx={{ position: 'sticky', top: -1, zIndex: 2, background: 'white' }}
                />
                <DimensionsHeaderCells data={data} />
              </TableRow>
            </TableHead>
            <TableBody sx={{ backgroundColor: 'white' }}>
              {!collapsed.includes('sdgs') && (
                <TableRow sx={{ backgroundColor: 'white' }}>
                  {whatCell}
                  <StickyLeftCell sx={{ minWidth: 'calc((100vw - 64px) * 0.14 - 2px)' }}>
                    <Typography variant='captionBold'>Primary SDGs addressed</Typography>
                  </StickyLeftCell>
                  {data.map(impact => (
                    <TableCell
                      sx={{ minWidth: 'calc((100vw - 64px) * 0.26 - 1px)', verticalAlign: 'top' }}
                      key={impact.id}
                    >
                      <Box display='flex' gap={2}>
                        {impact.goals.map(goal => (
                          <Tooltip title={goal.goal.description} key={goal.shortName}>
                            <Box display='flex' gap={0.5} alignItems='center'>
                              <Box
                                component='img'
                                src={goal.goal.image}
                                alt={goal.goal.description}
                                width={60}
                                height={60}
                              />
                              <Typography variant='captionBold' sx={{ whiteSpace: 'nowrap' }}>
                                {goal.rate}%
                              </Typography>
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              )}
              {!collapsed.includes('change') && (
                <DimensionsRow
                  firstCell={whatCell}
                  showFirstCell={collapsed.includes('sdgs')}
                  label='Stakeholder change'
                  data={data}
                  field='change'
                />
              )}
              {!collapsed.includes('problemImportance') && (
                <DimensionsRow
                  firstCell={whatCell}
                  showFirstCell={collapsed.includes('sdgs') && collapsed.includes('change')}
                  label='Problem importance for stakeholder'
                  data={data}
                  field='problemImportance'
                  showSlider
                />
              )}
            </TableBody>
            <TableBody sx={{ backgroundColor: (theme) => theme.palette.background.fade }}>
              {!collapsed.includes('stakeholders') && (
                <DimensionsRow
                  firstCell={whoCell}
                  showFirstCell
                  label='Who is the stakeholder?'
                  data={data}
                  field='stakeholders'
                />
              )}
              {!collapsed.includes('geography') && (
                <TableRow sx={{ backgroundColor: 'inherit' }}>
                  {collapsed.includes('stakeholders') && whoCell}
                  <StickyLeftCell sx={{ minWidth: 'calc((100vw - 64px) * 0.14 - 2px)' }}>
                    <Typography variant='captionBold'>Stakeholders geography</Typography>
                  </StickyLeftCell>
                  {data.map(impact => (
                    <TableCell key={impact.id}>
                      <Typography variant='captionBold'>
                        {[...impact.geography.map(v => v.title), ...impact.geographyCustom].join(', ')}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              )}
              {!collapsed.includes('stakeholderSituation') && (
                <DimensionsRow
                  firstCell={whatCell}
                  showFirstCell={collapsed.includes('stakeholders') && collapsed.includes('geography')}
                  label='Stakeholder situation'
                  data={data}
                  field='stakeholderSituation'
                  showSlider
                />
              )}
            </TableBody>
            <TableBody sx={{ backgroundColor: 'white' }}>
              {!collapsed.includes('degreeOfChange') && (
                <DimensionsRow
                  firstCell={howMuchCell}
                  showFirstCell
                  label='Depth (Degree of change)'
                  data={data}
                  field='degreeOfChange'
                  showSlider
                  numeric
                />
              )}
              {!collapsed.includes('sizeOfStakeholders') && (
                <DimensionsRow
                  firstCell={howMuchCell}
                  showFirstCell={collapsed.includes('degreeOfChange')}
                  label='Scalability'
                  data={data}
                  field='sizeOfStakeholders'
                  showSlider
                />
              )}
              {!collapsed.includes('duration') && (
                <DimensionsRow
                  firstCell={howMuchCell}
                  showFirstCell={collapsed.includes('degreeOfChange') && collapsed.includes('sizeOfStakeholders')}
                  label='Duration'
                  data={data}
                  field='duration'
                  showSlider
                />
              )}
            </TableBody>
            <TableBody sx={{ backgroundColor: (theme) => theme.palette.background.fade }}>
              {!collapsed.includes('contribution') && (
                <DimensionsRow
                  firstCell={contributionCell}
                  showFirstCell
                  label='Contribution'
                  data={data}
                  field='contribution'
                  showSlider
                  numeric
                />
              )}
            </TableBody>
            <TableBody sx={{ backgroundColor: 'white' }}>
              {!collapsed.includes('previousEvidence') && (
                <DimensionsRow
                  firstCell={riskCell}
                  showFirstCell
                  label='Previous evidence'
                  data={data}
                  field='previousEvidence'
                  showSlider
                />
              )}
              {!collapsed.includes('proximity') && (
                <DimensionsRow
                  firstCell={riskCell}
                  showFirstCell={collapsed.includes('previousEvidence')}
                  label='Proximity'
                  data={data}
                  field='proximity'
                  showSlider
                  onlyPositive
                />
              )}
              {!collapsed.includes('indicators') && (
                <DimensionsIndicatorRow
                  firstCell={riskCell}
                  showFirstCell={collapsed.includes('previousEvidence') && collapsed.includes('proximity')}
                  data={data}
                />
              )}
            </TableBody>
          </StyledTable>
        </StyledTableWrapper>
        <DimensionsDrawer
          open={drawerOpen}
          close={closeDrawer}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          collapsedImpacts={collapsedImpacts}
          setCollapsedImpacts={setCollapsedImpacts}
          impacts={venture.impacts}
        />
        <ExportInfoModal open={exportModalOpen} onClose={closeExportModal} />
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(FiveDimensionsOfImpact);
