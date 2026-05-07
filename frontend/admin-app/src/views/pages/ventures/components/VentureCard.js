import * as React from 'react';
import { memo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Avatar, Box, CardActionArea, Checkbox, Divider, IconButton, Menu, MenuItem, styled } from '@mui/material';
import filters from "shared-components/filters";
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";
import useModal from "shared-components/hooks/useModal";
import EditIcon from '@mui/icons-material/Edit';
import { ventureActions, ventureSelectors, ventureThunks } from 'store/ducks/venture';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from "@mui/material/Button";
import { getProfileCompletion } from "shared-components/utils/venture";
import AddIcon from "@mui/icons-material/Add";
import ImageUploadModal from "../../profile/components/ImageUploadModal";
import { lineClamp } from "shared-components/utils/styles";
import { pitchThunks } from "store/ducks/pitch";
import DvrIcon from "@mui/icons-material/Dvr";
import PortfolioAccessModal from "./PortfolioAccessModal";
import AppLabel from "../../../common/AppLabel";
import { userSelectors } from "store/ducks/user";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

const NoImagePlaceholder = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 2,
  height: 180,
  borderRadius: '8px',
  backgroundColor: 'secondary.subtle',
  cursor: 'pointer',
}));

const StyledProgressDonut = styled(Box)(({ theme, percent }) => ({
  flexShrink: 0,
  width: theme.spacing(4),
  height: theme.spacing(4),
  position: 'relative',
  backgroundColor: theme.palette.secondary.light,
  borderRadius: '50%',
  '&:before': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    inset: 0,
    background: `conic-gradient(${percent >= 100 ? theme.palette.success.main : theme.palette.primary.main} calc(${percent} * 1%), #0000 0)`,
    mask: 'radial-gradient(farthest-side, #000 0, #000 0)'
  },
  '&:after': {
    content: '""',
    position: 'absolute',
    top: 6,
    left: 6,
    width: theme.spacing(2.5),
    height: theme.spacing(2.5),
    backgroundColor: 'white',
    borderRadius: '50%',
  }
}));

const VentureCard = ({ venture, onClick, invitation, totalVentures, activate, ...rest }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteModalOpen, deleteVenture, closeDeleteModal] = useModal();
  const [imageModalOpen, uploadImage, closeImageModal] = useModal(false);
  const [portfolioModalOpen, managePortfolioAccess, closePortfolioModal] = useModal(false);
  const dispatch = useDispatch();
  const percentCompletion = getProfileCompletion(venture);
  const user = useSelector(userSelectors.getCurrentUser());
  const draftVentures = user.draftVentures;
  const showToggleDraft = draftVentures.length > 0 || totalVentures > 5;
  const access = useSelector(ventureSelectors.getVentureAccess(venture.id));

  const openMenu = (e) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const confirmDeleteVenture = () => {
    dispatch(ventureThunks.deleteVenture(venture.id));
  };

  const handleUploadImage = (e) => {
    e.stopPropagation();
    uploadImage();
  }

  const handleSaveImage = (image) => {
    const updatedVenture = {
      ...venture,
      industries: venture.industries.map(i => i.name),
      pitchSettings: { ...venture.pitchSettings, descriptionImage: image }
    };
    dispatch(pitchThunks.updatePitchSettings({
      venture: updatedVenture,
      step: { name: 'description' },
      skipFetch: true,
    }))
      .then(v => {
        dispatch(ventureActions.replaceVenture(updatedVenture));
      });
  }

  const toggleVentureDraft = () => {
    dispatch(ventureThunks.toggleMarkVentureDraft(venture.id));
  }

  return (
    <CustomErrorBoundary>
      <Card {...rest}>
        <CardActionArea
          component='div'
          onClick={onClick}
          sx={{ opacity: venture.active ? 1 : 0.5, pointerEvents: venture.active ? 'auto' : 'none' }}
        >
          <CardContent>
            <Box display='flex' alignItems='flex-start' gap={1}>
              <Avatar sx={{ width: 40, height: 40 }} src={venture.logo}>{venture.name.slice(0, 1)}</Avatar>
              <Box flexGrow={1} minWidth={0}>
                <Box display='flex' justifyContent='space-between' alignItems='center' gap={1}>
                  <Typography variant='h5' component='div' noWrap title={venture.name}>{venture.name}</Typography>
                  {!venture.active && <AppLabel color='error'>Inactive</AppLabel>}
                  {venture.active && draftVentures.includes(venture.id) && <AppLabel>Draft</AppLabel>}
                </Box>
                <Typography
                  variant='body'
                  color='text.secondary'
                  sx={{ mt: 1 }}
                  noWrap
                  title={filters.date(venture.lastModifiedAt)}
                >
                  Last updated: {filters.date(venture.lastModifiedAt)}
                </Typography>
              </Box>
              {!invitation && (
                <IconButton aria-haspopup='true' onClick={openMenu} sx={{ pointerEvents: 'auto' }}>
                  <MoreVertOutlinedIcon sx={{ color: 'text.primary' }} />
                </IconButton>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant='body' color='text.secondary' style={lineClamp(2)} sx={{ height: 44 }}>
              {venture.description}
            </Typography>
            <Box mt={2}>
              {venture.pitchSettings.descriptionImage && (
                <Box
                  component='img'
                  src={venture.pitchSettings.descriptionImage}
                  alt={venture.name}
                  width='100%'
                  height={180}
                  sx={{ objectFit: 'cover', borderRadius: '8px' }}
                />
              )}
              {!venture.pitchSettings.descriptionImage && (
                <NoImagePlaceholder backgroundColor='secondary.subtle' onClick={handleUploadImage}>
                  <AddIcon sx={{ color: 'secondary.main' }} />
                  <Typography variant='overline' sx={{ color: 'secondary.main' }}>Add image</Typography>
                </NoImagePlaceholder>
              )}
            </Box>
            {invitation && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box display='flex' justifyContent='flex-end' gap={2}>
                  <Button
                    variant='ghost'
                    onClick={() => dispatch(ventureThunks.declineVentureInvitation(venture.id))}
                  >
                    Decline
                  </Button>
                  <Button onClick={() => dispatch(ventureThunks.acceptVentureInvitation(venture.id))}>
                    Accept
                  </Button>
                </Box>
              </>
            )}
            {!invitation && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box display='flex' alignItems='center' justifyContent='space-between' gap={2}>
                  <Box display='flex' alignItems='center' gap={1}>
                    <StyledProgressDonut percent={percentCompletion} />
                    <Typography variant='captionBold'>Profile completeness: {percentCompletion}%</Typography>
                  </Box>
                  {percentCompletion < 100 && (
                    <Button
                      variant='outlined'
                      component={Link}
                      to={`/ventures/${venture.id}/profile-wizard?step=0`}
                      size='small'
                      onClick={e => e.stopPropagation()}
                    >
                      Complete profile
                    </Button>
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </CardActionArea>
        <ConfirmModal
          open={deleteModalOpen}
          onClose={closeDeleteModal}
          confirm={confirmDeleteVenture}
          title='Delete Venture'
          primary='Are you sure you want to delete this venture? All impacts and their scoring will be deleted from the system'
          secondary='This action cannot be undone'
        />
        <Menu anchorEl={menuAnchorEl} open={!!menuAnchorEl} onClose={closeMenu} onClick={closeMenu}>
          <StyledMenuItem
            component={Link}
            to={`/ventures/${venture.id}/profile-wizard?step=0`}
            disabled={access !== VENTURE_ACCESS.EDIT || !venture.active}
          >
            <Typography>Edit company profile</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><EditIcon /></IconButton>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={managePortfolioAccess} disabled={!venture.active}>
            <Typography>Manage portfolio access</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><DvrIcon /></IconButton>
          </StyledMenuItem>
          {showToggleDraft && <Divider />}
          {showToggleDraft && (
            <StyledMenuItem onClick={toggleVentureDraft} disabled={!venture.active}>
              <Typography>{draftVentures.includes(venture.id) ? 'Unmark' : 'Mark'} as draft</Typography>
              <Checkbox checked={draftVentures.includes(venture.id)} sx={{ pointerEvents: 'none' }} />
            </StyledMenuItem>
          )}
          {!venture.hasSubscription && <Divider />}
          {!venture.hasSubscription && (
            <StyledMenuItem onClick={() => activate(venture)}>
              <Typography>Activate with subscription</Typography>
              <IconButton sx={{ pointerEvents: 'none' }}><SubscriptionsIcon /></IconButton>
            </StyledMenuItem>
          )}
          <Divider />
          <StyledMenuItem onClick={deleteVenture} disabled={access !== VENTURE_ACCESS.EDIT}>
            <Typography>Delete venture</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><DeleteIcon /></IconButton>
          </StyledMenuItem>
        </Menu>
        {imageModalOpen && (
          <ImageUploadModal
            onClose={closeImageModal}
            handleSave={handleSaveImage}
            title='Upload venture image'
            disableShape
          />
        )}
        {portfolioModalOpen && (
          <PortfolioAccessModal onClose={closePortfolioModal} venture={venture} />
        )}
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(VentureCard);
