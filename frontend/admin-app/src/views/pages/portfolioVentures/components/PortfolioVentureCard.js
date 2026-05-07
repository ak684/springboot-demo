import * as React from 'react';
import { memo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Avatar, Box, CardActionArea, Divider, IconButton, Menu, MenuItem, styled } from '@mui/material';
import filters from "shared-components/filters";
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";
import useModal from "shared-components/hooks/useModal";
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import AddIcon from "@mui/icons-material/Add";
import ImageUploadModal from "../../profile/components/ImageUploadModal";
import { portfolioActions, portfolioThunks } from "store/ducks/portfolio";
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { pitchThunks } from "store/ducks/pitch";
import { lineClamp } from "shared-components/utils/styles";
import AppLabel from "../../../common/AppLabel";
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

const PortfolioVentureCard = ({ onClick, portfolio, invitation, ...rest }) => {
  const venture = invitation.venture;
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [unlinkModalOpen, unlinkVenture, closeUnlinkModal] = useModal();
  const [imageModalOpen, uploadImage, closeImageModal] = useModal(false);
  const dispatch = useDispatch();

  const openMenu = (e) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const confirmUnlinkVenture = () => {
    dispatch(portfolioThunks.unlinkVenture({ portfolioId: portfolio.id, ventureId: venture.id }));
  };

  const hideVenture = () => {
    dispatch(portfolioThunks.toggleHideVenture({ portfolioId: portfolio.id, ventureId: venture.id }));
  }

  const hidePublicVenture = () => {
    dispatch(portfolioThunks.toggleHidePublicVenture({ portfolioId: portfolio.id, ventureId: venture.id }));
  }

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
        dispatch(portfolioActions.replaceVenture(updatedVenture));
      });
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
                </Box>
                <Typography
                  variant='body'
                  color='text.secondary'
                  sx={{ mt: 1 }}
                  noWrap
                  title={filters.date(invitation.createdAt)}
                >
                  Invited: {filters.date(invitation.createdAt)}
                </Typography>
              </Box>
              <IconButton aria-haspopup='true' onClick={openMenu} sx={{ pointerEvents: 'auto' }}>
                <MoreVertOutlinedIcon sx={{ color: 'text.primary' }} />
              </IconButton>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant='body' color='text.secondary' noWrap title={filters.date(venture.lastModifiedAt)}>
              Last updated: {filters.date(venture.lastModifiedAt)}
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
              <Box mt={2} display='flex' gap={2} justifyContent='space-between' alignItems='flex-start'>
                <Typography variant='body' color='text.secondary' style={lineClamp(2)} sx={{ height: 44 }}>
                  {venture.description}
                </Typography>
                {invitation.hidden && <VisibilityOffOutlinedIcon />}
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
        <ConfirmModal
          open={unlinkModalOpen}
          onClose={closeUnlinkModal}
          confirm={confirmUnlinkVenture}
          title='Unlink Venture'
          primary='Are you sure you want to unlink this venture? It will no longer be displayed in your portfolio'
          confirmTitle='Unlink'
        />
        <Menu anchorEl={menuAnchorEl} open={!!menuAnchorEl} onClose={closeMenu} onClick={closeMenu}>
          <StyledMenuItem
            component={Link}
            to={`/ventures/${venture.id}/profile-wizard?step=0`}
            disabled={!venture.active}
          >
            <Typography>Edit company profile</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><EditIcon sx={{ color: 'text.primary' }} /></IconButton>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={hideVenture}>
            <Typography>{invitation.hidden ? 'Show on dashboard' : 'Hide from dashboard'}</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}>
              {invitation.hidden
                ? <VisibilityOutlinedIcon sx={{ color: 'text.primary' }} />
                : <VisibilityOffOutlinedIcon sx={{ color: 'text.primary' }} />}
            </IconButton>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={hidePublicVenture}>
            <Typography>{invitation.publicHidden ? 'Show in public profile' : 'Hide from public profile'}</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}>
              {invitation.publicHidden
                ? <VisibilityOutlinedIcon sx={{ color: 'text.primary' }} />
                : <VisibilityOffOutlinedIcon sx={{ color: 'text.primary' }} />}
            </IconButton>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={unlinkVenture}>
            <Typography>Unlink venture</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><LinkOffOutlinedIcon sx={{ color: 'text.primary' }} /></IconButton>
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
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(PortfolioVentureCard);
