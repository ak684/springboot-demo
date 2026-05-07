import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTableRow from './components/SortableTableRow';
import ImpactFilter from '../../common/ImpactFilter';
import { appSelectors } from 'store/ducks/app';
import { filteredImpacts, sortedImpacts } from "shared-components/utils/impact";
import ImpactSort from '../../common/ImpactSort';
import { HEADER_HEIGHT, IMPACT_SORT, VENTURE_ACCESS } from "shared-components/utils/constants";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Tooltip from '@mui/material/Tooltip';
import ImpactTableDrawer from './components/ImpactTableDrawer';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExportInfoModal from 'views/common/ExportInfoModal';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import navigation from "shared-components/utils/navigation";
import { impactThunks } from "store/ducks/impact";
import { getTypography } from "shared-components/utils/typography";
import OnboardingTooltip from "../../common/OnboardingTooltip";
import { getElementPosition } from "utils/onboarding";
import useModal from "shared-components/hooks/useModal";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledTable = styled(Table)(({ theme }) => ({
  marginTop: theme.spacing(4),
  width: '100%',
  height: '1px', // Required for first column to be able to take 100% of cell height
  borderCollapse: 'separate',
  borderSpacing: 0,
  '.MuiTableCell-root': {
    border: 'none',
    verticalAlign: 'top',
  },
  'th.MuiTableCell-root': {
    verticalAlign: 'middle',
  },
}));

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  ...getTypography('overline'),
  backgroundColor: theme.palette.secondary.subtle,
}));

const showCell = (dependencies, collapsed) => !dependencies.every(d => collapsed.includes(d));
const cellColSpan = (dependencies, collapsed) => dependencies.filter(d => !collapsed.includes(d)).length;

const editableFields = ['name', 'statusQuo', 'innovation', 'stakeholders', 'change', 'outputUnits'];

const ImpactTable = () => {
  const [editedCell, setEditedCell] = useState(null);
  const [collapsed, setCollapsed] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newImpactAnchor, setNewImpactAnchor] = useState(null);
  const [exportModalOpen, openExportModal, closeExportModal] = useModal();
  const [headersFixed, setHeadersFixed] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const toolbarRef = useRef();
  const dispatch = useDispatch();
  const { ventureId } = useParams();
  const impactFilter = useSelector(appSelectors.getImpactFilter());
  const impactSort = useSelector(appSelectors.getImpactSort());
  const addImpactRef = useRef();
  const impactNameRef = useRef();
  const [tooltip, setTooltip] = useState({});
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  useEffect(() => {
    if (toolbarRef.current) {
      setToolbarHeight(toolbarRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    dispatch(impactThunks.fetchImpactAutofillValues());
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('tocNewImpact')) {
      setTooltip({
        name: 'tocNewImpact',
        position: getElementPosition(addImpactRef),
        title: 'Add new Impact Chain',
        subtitle: 'Use this button to add new Impact Chain to your Venture.',
        placement: 'left',
      })
    }
  }, [addImpactRef]);

  useEffect(() => {
    if (!localStorage.getItem('tocRenameImpact') && venture.impacts.some(i => i.name === 'New impact')) {
      setTooltip({
        name: 'tocRenameImpact',
        position: getElementPosition(impactNameRef),
        title: 'Add impact title',
        subtitle: 'Click "New Impact" to add or edit the impact title.',
      })
    }
  }, [venture.impacts]);

  const openNewImpactPopup = (e) => {
    setNewImpactAnchor(e.currentTarget);
    setTimeout(() => {
      if (!localStorage.getItem('tocNewImpactMenu')) {
        const position = getElementPosition(addImpactRef);
        setTooltip({
          name: 'tocNewImpactMenu',
          position: { ...position, top: position.top + 95 },
          title: 'Choose Impact Type',
          subtitle: 'Choose "Positive" or "Negative" to add and edit the new impact directly in the Overview Table below.',
          placement: 'left',
        });
      }
    }, 0);
  };

  const closeTooltip = () => {
    if (tooltip?.name) {
      localStorage.setItem(tooltip.name, true);
      setTooltip({});
    }
  }

  const closeNewImpactPopup = () => {
    setNewImpactAnchor(null);
    closeTooltip();
  };

  const createImpact = (positive) => {
    dispatch(ventureThunks.createImpactInline(positive));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const editField = (row, name, index) => setEditedCell(`${row}.${name}${index !== undefined ? `.${index}` : ''}`);

  const confirmEditField = (value, customEditedCell) => {
    closeTooltip();
    const editParams = (customEditedCell || editedCell).split('.');
    const impactId = editParams[0];
    const field = editParams[1];
    const requestParams = { impactId, field: editParams[1], value };
    if (field === 'indicators') {
      requestParams.indicatorId = editParams[2];
    }
    dispatch(ventureThunks.updateImpactField(requestParams))
      .then(() => {
        // Move editable cursor to the next field
        const impact = venture.impacts.find(i => i.id === +impactId);
        if (editableFields.includes(field) && !customEditedCell) {
          const nextFieldIndex = editableFields
            .findIndex((f, index) => index > editableFields.indexOf(field) && !collapsed.includes(f));
          if (nextFieldIndex > -1) {
            setEditedCell(`${impactId}.${editableFields[nextFieldIndex]}`);
            return;
          } else if (impact.indicators.length > 0) {
            setEditedCell(`${impactId}.indicators.${impact.indicators[0].id}`);
            return;
          }
        } else if (field === 'indicators') {
          const indicatorIndex = impact.indicators.findIndex(i => i.id === +editParams[2]);
          if (indicatorIndex < impact.indicators.length - 1) {
            setEditedCell(`${impactId}.indicators.${impact.indicators[indicatorIndex + 1].id}`);
            return;
          }
        }

        setEditedCell(null);
      });
  };

  const cancelEditField = () => {
    setEditedCell(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active?.id !== over?.id) {
      const from = venture.impacts.findIndex(i => i.id === active.id);
      const to = venture.impacts.findIndex(i => i.id === over.id);
      dispatch(ventureThunks.changeImpactOrder({ from, to }));
    }
  };

  const dataRows = sortedImpacts(filteredImpacts(venture.impacts, impactFilter), impactSort)
    .map((impact) => (
      <SortableTableRow
        key={impact.id}
        id={impact.id}
        impact={impact}
        edit={editField}
        editedCell={editedCell}
        cancel={cancelEditField}
        confirm={confirmEditField}
        collapsed={collapsed}
        impactNameRef={impactNameRef}
      />
    ));
  const hasNegativeImpact = venture.impacts.some(i => !i.positive);

  const exportImpacts = () => {
    dispatch(ventureThunks.exportImpacts(collapsed));
  };

  const openColumnSettings = () => {
    setDrawerOpen(true);
  };

  const closeColumnSettings = () => {
    setDrawerOpen(false);
  };

  return (
    <CustomErrorBoundary>
      <Box 
        maxHeight={`calc(100vh - ${HEADER_HEIGHT}px - 64px)`} 
        overflow='auto'
        sx={{
          position: 'relative',
          '& .sticky-header-row-1': headersFixed ? {
            position: 'sticky',
            top: `${toolbarHeight}px`,
            zIndex: 101,
            backgroundColor: '#ffffff',
            '& .MuiTableCell-root': {
              backgroundColor: '#ffffff !important',
              borderTop: (theme) => `0.1px solid ${theme.palette.divider}`,
            }
          } : {},
          '& .sticky-header-row-2': headersFixed ? {
            position: 'sticky',
            top: `${toolbarHeight + 48}px`, // toolbar height + first row height
            zIndex: 100,
            '& .MuiTableCell-root': {
              backgroundImage: (theme) => `linear-gradient(${theme.palette.secondary.subtle}, ${theme.palette.secondary.subtle})`,
              backgroundColor: '#F0F2F6 !important',
              backgroundBlendMode: 'normal',
            }
          } : {},
        }}
      >
        <Box
          ref={toolbarRef}
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          backgroundColor='background.default'
          position='sticky'
          top={0}
          zIndex={15}
          borderBottom={1}
          borderColor='divider'
          pb={1}
        >
          <ImpactFilter />
          <Box display='flex' alignItems='center' gap={1}>
            <ImpactSort />
            <Button
              endIcon={<ArrowDropDownIcon />}
              onClick={openNewImpactPopup}
              size='small'
              ref={addImpactRef}
              disabled={access !== VENTURE_ACCESS.EDIT}
            >
              New impact chain
            </Button>
            <Button
              variant='outlined'
              onClick={exportImpacts}
              startIcon={<OpenInNewIcon />}
              size='small'
            >
              Export
            </Button>
            <IconButton onClick={openExportModal}><InfoOutlinedIcon sx={{ color: 'secondary.main' }} /></IconButton>
            <Divider orientation='vertical' flexItem />
            <Tooltip title={headersFixed ? 'Unfreeze headers' : 'Freeze headers'}>
              <IconButton 
                onClick={() => setHeadersFixed(!headersFixed)}
                color={headersFixed ? 'primary' : 'default'}
                size='small'
              >
                {headersFixed ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            </Tooltip>
            <IconButton onClick={openColumnSettings}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <StyledTable stickyHeader={headersFixed}>
            <TableHead>
              <TableRow className="sticky-header-row-1" sx={{ width: '100%' }}>
                <TableCell component='th' colSpan={impactSort === IMPACT_SORT.CUSTOM ? 3 : 2}></TableCell>
                {
                  showCell(['statusQuo', 'innovation'], collapsed) &&
                  <TableCell
                    sx={{ ...getTypography('bodyBold') }}
                    component='th'
                    colSpan={cellColSpan(['statusQuo', 'innovation'], collapsed)}
                  >
                    Our actions...
                  </TableCell>
                }
                {
                  showCell(['change', 'outputUnits', 'stakeholders'], collapsed) &&
                  <TableCell
                    sx={{ ...getTypography('bodyBold') }}
                    component='th'
                    colSpan={cellColSpan(['change', 'outputUnits', 'stakeholders'], collapsed)}
                  >
                    Lead to change...
                  </TableCell>
                }
                {
                  showCell(['indicators'], collapsed) &&
                  <TableCell sx={{ ...getTypography('bodyBold') }} component='th' colSpan={0}>
                    ...and we provide evidence!
                  </TableCell>
                }
                <TableCell component='th' sx={{ minWidth: 0, padding: 0 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow 
                className="sticky-header-row-2" 
                sx={{ 
                  backgroundColor: (theme) => theme.palette.secondary.subtle,
                }}
              >
                <StyledHeaderCell component='th' colSpan={impactSort === IMPACT_SORT.CUSTOM ? 3 : 2}>
                  Impact name
                </StyledHeaderCell>
                {
                  !collapsed.includes('statusQuo') &&
                  <StyledHeaderCell component='th'>Status quo solution</StyledHeaderCell>
                }
                {
                  !collapsed.includes('innovation') &&
                  <StyledHeaderCell component='th'>What we do differently</StyledHeaderCell>
                }
                {
                  !collapsed.includes('stakeholders') &&
                  <StyledHeaderCell component='th'>We affect</StyledHeaderCell>
                }
                {
                  !collapsed.includes('change') &&
                  <StyledHeaderCell component='th'>We improve {hasNegativeImpact && '/ worsen'}</StyledHeaderCell>
                }
                {
                  !collapsed.includes('outputUnits') &&
                  <StyledHeaderCell component='th'>
                    Products / services / activities
                  </StyledHeaderCell>
                }
                {
                  !collapsed.includes('indicators') &&
                  <StyledHeaderCell component='th' width='25%'>Measured by indicators</StyledHeaderCell>
                }
                <StyledHeaderCell component='th' width='12%'>SDGs</StyledHeaderCell>
                <StyledHeaderCell component='th' sx={{ minWidth: 0, padding: 0 }} />
              </TableRow>
              <SortableContext items={venture.impacts} strategy={verticalListSortingStrategy}>
                {dataRows}
              </SortableContext>
            </TableBody>
          </StyledTable>
        </DndContext>
        <ImpactTableDrawer
          open={drawerOpen}
          close={closeColumnSettings}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <ExportInfoModal open={exportModalOpen} onClose={closeExportModal} />
        <Menu
          anchorEl={newImpactAnchor}
          open={!!newImpactAnchor}
          onClose={closeNewImpactPopup}
          onClick={closeNewImpactPopup}
        >
          <MenuItem onClick={() => navigation.goToImpactCreation(ventureId)}>
            <Typography>Create in Wizard</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => createImpact(true)}>
            <Typography>Positive</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => createImpact(false)}>
            <Typography>Negative</Typography>
          </MenuItem>
        </Menu>
        <OnboardingTooltip open={Object.keys(tooltip).length > 0} {...tooltip} onClose={closeTooltip} />
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactTable);
