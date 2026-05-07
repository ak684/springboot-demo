import React, { memo, useRef, useState } from 'react';
import { Box, Button, Card, Divider, ListItemIcon, Menu, MenuItem, styled, Typography } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DashboardChartEmpty from './DashboardChartEmpty';
import AppTooltip from 'views/common/AppTooltip';
import html2canvas from 'html2canvas';
import ListItemText from '@mui/material/ListItemText';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadImage } from "shared-components/utils/helpers";
import { useDispatch } from 'react-redux';
import { appThunks } from 'store/ducks/app';
import ShareChartModal from './ShareChartModal';
import useModal from "shared-components/hooks/useModal";
import { getChartTexts } from '../data';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import { buildAppUrl } from 'shared-components/utils/branding';

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(6),
}));

const DashboardChartCard = ({ title, subtitle, children, empty, tooltip, type, controls, ...rest }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [shareModalOpen, openShareModal, closeShareModal, proceed] = useModal();
  const cardRef = useRef();
  const dispatch = useDispatch();

  const openMenu = (e) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = (e) => {
    e.stopPropagation();
    setMenuAnchorEl(null);
  };

  const screenshotChart = (callback) => {
    html2canvas(cardRef.current).then((canvas) => {
      const base64image = canvas.toDataURL('image/png');
      callback && callback(base64image);
    });
  };

  const shareToLinkedin = () => {
    screenshotChart((base64) => {
      openShareModal(() => () => {
        closeShareModal();
        dispatch(appThunks.uploadImage(base64))
          .then(res => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${res.payload}`);
          });
      });
      openShareModal();
    });
  };

  const shareToFacebook = () => {
    screenshotChart((base64) => {
      openShareModal(() => () => {
        closeShareModal();
        dispatch(appThunks.uploadImage(base64))
          .then(res => {
            window.open(`https://www.facebook.com/sharer.php?u=${res.payload}`);
          });
      });
    });
  };

  const shareToTwitter = () => {
    screenshotChart((base64) => {
      dispatch(appThunks.uploadImage(base64))
        .then(res => {
          const chartTexts = getChartTexts();
          const imageId = res.payload.substring(res.payload.lastIndexOf('/') + 1);
          const text = `${chartTexts[type]?.text}\n\n${chartTexts[type]?.hashTag}\n`;
          const shareUrl = buildAppUrl(`share/${type}/${imageId}`);
          window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`);
        });
    });
  };

  const download = () => {
    screenshotChart((base64) => downloadImage(base64, title));
  };

  return (
    <CustomErrorBoundary>
      <Card {...rest}>
        <Box ref={cardRef} p={2}>
          <Box display='flex' alignItems='center' gap={1}>
            <Typography variant='h5'>{title}</Typography>
            {tooltip && <AppTooltip data-html2canvas-ignore>{tooltip}</AppTooltip>}
          </Box>
          {subtitle && <Typography variant='caption'>{subtitle}</Typography>}
          <Divider sx={{ my: 2 }} />
          {empty && <DashboardChartEmpty />}
          {!empty && children}
        </Box>
        {(!empty || controls) && (
          <Box p={2}>
            <Divider sx={{ mb: 2 }} />
            <Box display='flex' justifyContent='space-between'>
              <Box>
                {controls}
              </Box>
              {
                !empty &&
                <Button variant='outlined' startIcon={<ShareIcon />} onClick={openMenu} size='small'>Share</Button>
              }
            </Box>
          </Box>
        )}
        <Menu
          anchorEl={menuAnchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(menuAnchorEl)}
          onClose={closeMenu}
          onClick={closeMenu}
        >
          <MenuItem sx={{ pointerEvents: 'none' }}>
            <ListItemText primary='Share to:' primaryTypographyProps={{ variant: 'bodyBold' }} />
          </MenuItem>
          <Divider />
          <StyledMenuItem onClick={shareToLinkedin}>
            <ListItemText primary='Linkedin' />
            <ListItemIcon><LinkedInIcon sx={{ color: '#0077B7' }} /></ListItemIcon>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={shareToFacebook}>
            <ListItemText primary='Facebook' />
            <ListItemIcon><FacebookIcon sx={{ color: '#3B579D' }} /></ListItemIcon>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={shareToTwitter}>
            <ListItemText primary='X' />
            <ListItemIcon><XIcon sx={{ color: 'black' }} /></ListItemIcon>
          </StyledMenuItem>
          <Divider />
          <StyledMenuItem onClick={download}>
            <ListItemText primary='Download' />
            <ListItemIcon><DownloadIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
          </StyledMenuItem>
        </Menu>
        {shareModalOpen && <ShareChartModal open onClose={closeShareModal} proceed={proceed} type={type} />}
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(DashboardChartCard);
