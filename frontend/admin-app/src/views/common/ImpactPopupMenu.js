import React, { memo, useState } from 'react';
import { Checkbox, Divider, IconButton, ListItemIcon, Menu, MenuItem, styled } from '@mui/material';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import useModal from 'shared-components/hooks/useModal';
import { useDispatch, useSelector } from 'react-redux';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditIcon from '@mui/icons-material/Edit';
import { Link, useParams } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import navigation from "shared-components/utils/navigation";
import PlaylistAddCircleIcon from '@mui/icons-material/PlaylistAddCircle';
import CalculateIcon from '@mui/icons-material/Calculate';
import TimelineIcon from '@mui/icons-material/Timeline';
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

const ImpactPopupMenu = ({ impact, extended, addIndicator, ...rest }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteModalOpen, deleteImpact, closeDeleteModal] = useModal();
  const dispatch = useDispatch();
  const { ventureId } = useParams();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  const openMenu = (e) => {
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const toggleImpactDraft = () => {
    closeMenu();
    dispatch(ventureThunks.toggleImpactDraft(impact));
  };

  const confirmDeleteImpact = () => {
    dispatch(ventureThunks.deleteImpact(impact));
  };

  const cloneImpact = () => {
    dispatch(ventureThunks.cloneImpact(impact));
  }

  return (
    <CustomErrorBoundary>
      <IconButton
        aria-haspopup='true'
        onClick={openMenu} {...rest}
        color='text.primary'
        disabled={access !== VENTURE_ACCESS.EDIT}
      >
        <MoreVertOutlinedIcon />
      </IconButton>
      <Menu anchorEl={menuAnchorEl} open={!!menuAnchorEl} onClose={closeMenu} onClick={closeMenu}>
        {extended && (
          <StyledMenuItem component={Link} to={`/ventures/${ventureId}/impacts/${impact.id}?step=0`}>
            <Typography>Edit in wizard</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><EditIcon sx={{ color: 'text.primary' }} /></IconButton>
          </StyledMenuItem>
        )}
        {extended && <Divider />}
        {extended && (
          <StyledMenuItem onClick={() => navigation.goToScoring(ventureId, impact.id)}>
            <Typography>Score impact</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><BarChartIcon sx={{ color: 'text.primary' }} /></IconButton>
          </StyledMenuItem>
        )}
        {extended && <Divider />}
        {extended && (
          <StyledMenuItem onClick={() => navigation.goToQuantification(ventureId, impact.id)}>
            <Typography>Quantify impact</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}>
              <CalculateIcon sx={{ color: 'text.primary' }} />
            </IconButton>
          </StyledMenuItem>
        )}
        {extended && <Divider />}
        {extended && (
          <StyledMenuItem onClick={() => navigation.goToMonitoring(ventureId, impact.id)}>
            <Typography>Monitor progress</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}>
              <TimelineIcon sx={{ color: 'text.primary' }} />
            </IconButton>
          </StyledMenuItem>
        )}
        {extended && <Divider />}
        {extended && (
          <StyledMenuItem onClick={addIndicator}>
            <Typography>Add indicator</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}>
              <PlaylistAddCircleIcon sx={{ color: 'text.primary' }} />
            </IconButton>
          </StyledMenuItem>
        )}
        {extended && <Divider />}
        {extended && (
          <StyledMenuItem onClick={cloneImpact}>
            <Typography>Duplicate impact</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><ContentCopyIcon sx={{ color: 'text.primary' }} /></IconButton>
          </StyledMenuItem>
        )}
        {extended && <Divider />}
        <StyledMenuItem onClick={toggleImpactDraft}>
          <Typography>{impact.draft ? 'Unmark' : 'Mark'} as draft</Typography>
          <ListItemIcon sx={{ pointerEvents: 'none' }}><Checkbox checked={impact.draft} /></ListItemIcon>
        </StyledMenuItem>
        <Divider />
        <StyledMenuItem onClick={deleteImpact}>
          <Typography>Delete impact</Typography>
          <IconButton sx={{ pointerEvents: 'none' }}><DeleteIcon sx={{ color: 'text.primary' }} /></IconButton>
        </StyledMenuItem>
      </Menu>
      <ConfirmModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        confirm={confirmDeleteImpact}
        title='Delete Impact Chain'
        primary='Are you sure you want to delete this Impact Chain?'
        secondary='This action cannot be undone'
      />
    </CustomErrorBoundary>
  );
};

export default memo(ImpactPopupMenu);
