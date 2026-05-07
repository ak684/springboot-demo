import * as React from 'react';
import { memo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Box, CardActionArea, Divider, IconButton, Menu, MenuItem, styled } from '@mui/material';
import filters from "shared-components/filters";
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";
import useModal from "shared-components/hooks/useModal";
import EditIcon from '@mui/icons-material/Edit';
import { portfolioActions, portfolioThunks } from 'store/ducks/portfolio';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import ImageUploadModal from "../../profile/components/ImageUploadModal";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

const NoLogoPlaceholder = styled(Box)(({ theme }) => ({
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

const PortfolioCard = ({ portfolio, onClick, invitation, ...rest }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteModalOpen, deletePortfolio, closeDeleteModal] = useModal();
  const [logoModalOpen, uploadLogo, closeLogoModal] = useModal(false);
  const dispatch = useDispatch();

  const openMenu = (e) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const confirmDeletePortfolio = () => {
    dispatch(portfolioThunks.deletePortfolio(portfolio.id));
  };

  const handleUploadLogo = (e) => {
    e.stopPropagation();
    uploadLogo();
  }

  const handleSaveLogo = (logo) => {
    const updatedPortfolio = { ...portfolio, logo };
    dispatch(portfolioThunks.editPortfolio({ data: updatedPortfolio, interim: true }))
      .then(v => {
        dispatch(portfolioActions.replacePortfolio(updatedPortfolio));
      });
  }

  return (
    <CustomErrorBoundary>
      <Card {...rest}>
        <CardActionArea component='div' onClick={onClick}>
          <CardContent>
            <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
              <Typography variant='h5' component='div'>{portfolio.name}</Typography>
              {!invitation && (
                <IconButton aria-haspopup='true' onClick={openMenu}>
                  <MoreVertOutlinedIcon sx={{ color: 'text.primary' }} />
                </IconButton>
              )}
            </Box>
            {!invitation && (
              <Typography variant='body' color='text.secondary'>
                Last updated: {filters.date(portfolio.lastModifiedAt)}
              </Typography>
            )}
            {portfolio.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant='body' color='text.secondary'>
                  {portfolio.description}
                </Typography>
              </>
            )}
            <Box mt={2}>
              {portfolio.logo && (
                <Box textAlign='center' sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <Box component='img' src={portfolio.logo} alt={portfolio.name} height={180} />
                </Box>
              )}
              {!portfolio.logo && (
                <NoLogoPlaceholder backgroundColor='secondary.subtle' onClick={handleUploadLogo}>
                  <AddIcon sx={{ color: 'secondary.main' }} />
                  <Typography variant='overline' sx={{ color: 'secondary.main' }}>Add image</Typography>
                </NoLogoPlaceholder>
              )}
            </Box>
            {invitation && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box display='flex' justifyContent='flex-end' gap={2}>
                  <Button
                    variant='ghost'
                    onClick={() => dispatch(portfolioThunks.declinePortfolioInvitation(portfolio.id))}
                  >
                    Decline
                  </Button>
                  <Button onClick={() => dispatch(portfolioThunks.acceptPortfolioInvitation(portfolio.id))}>
                    Accept
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </CardActionArea>
        <ConfirmModal
          open={deleteModalOpen}
          onClose={closeDeleteModal}
          confirm={confirmDeletePortfolio}
          title='Delete Portfolio'
          primary='Are you sure you want to delete this portfolio? All data inside will be deleted from the system'
          secondary='This action cannot be undone'
        />
        <Menu anchorEl={menuAnchorEl} open={!!menuAnchorEl} onClose={closeMenu} onClick={closeMenu}>
          <StyledMenuItem component={Link} to={`/portfolios/${portfolio.id}/profile-wizard?step=0`}>
            <Typography>Edit profile</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><EditIcon /></IconButton>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={deletePortfolio}>
            <Typography>Delete portfolio</Typography>
            <IconButton sx={{ pointerEvents: 'none' }}><DeleteIcon /></IconButton>
          </StyledMenuItem>
        </Menu>
        {logoModalOpen && (
          <ImageUploadModal
            onClose={closeLogoModal}
            handleSave={handleSaveLogo}
            title='Upload company logo'
            disableShape
          />
        )}
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(PortfolioCard);
