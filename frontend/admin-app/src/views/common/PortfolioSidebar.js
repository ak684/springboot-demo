import React, { memo } from 'react';
import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Toolbar
} from '@mui/material';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import navigation from "shared-components/utils/navigation";
import { useSelector } from "react-redux";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import { portfolioSelectors } from "../../store/ducks/portfolio";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(35),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(35),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const PortfolioSidebar = () => {
  const { portfolioId } = useParams();
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
  const navigate = useNavigate();
  const location = useLocation();

  if (!portfolio) {
    return null;
  }

  return (
    <StyledDrawer variant='permanent' open>
      <CustomErrorBoundary>
        <Toolbar sx={{ height: HEADER_HEIGHT }} />
        <List sx={{ p: 4, pr: 2 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/')} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <HomeOutlinedIcon sx={{ color: 'text.primary' }} />
              </ListItemIcon>
              <ListItemText primary='Dashboard' primaryTypographyProps={{ variant: 'bodyBold' }} sx={{ m: 0 }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate(`/portfolios/${portfolioId}/ventures`)} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <GridViewOutlinedIcon sx={{ color: 'text.primary' }} />
              </ListItemIcon>
              <ListItemText primary='Ventures' primaryTypographyProps={{ variant: 'bodyBold' }} sx={{ m: 0 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component="a"
              href={`${window.location.origin}/portfolios/${portfolioId}/company-url-extractor`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ListItemText primary='Company URL Database' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <FileDownloadOutlinedIcon sx={{ color: 'text.primary' }} />
            </ListItemIcon>
            <ListItemText primary='Create impact logic'
              primaryTypographyProps={{ variant: 'bodyBold' }}
              sx={{ m: 0 }} />
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => {
            }} disabled>
              <ListItemText
                primary='Select ventures for data collection'
                primaryTypographyProps={{ variant: 'subtitle' }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to={`/ventures/${portfolioId}/table`} disabled>
              <ListItemText primary='Send out innovations' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to={`/ventures/${portfolioId}/indicators`} disabled>
              <ListItemText primary='Control completion status' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to={`/ventures/${portfolioId}/indicators`} disabled>
              <ListItemText primary='Send reminders' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}><AnalyticsOutlinedIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
            <ListItemText sx={{ m: 0 }} primary='Analyze' primaryTypographyProps={{ variant: 'bodyBold' }}
            />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to={`/portfolios/${portfolioId}/ventures-overview`}>
              <ListItemText primary='Portfolio overview' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}><SmsOutlinedIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
            <ListItemText
              sx={{ m: 0 }}
              primary='Communicate'
              primaryTypographyProps={{ variant: 'bodyBold' }}
            />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate(`/public-profile/portfolios/${portfolioId}`)}>
              <ListItemText primary='Public profile' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigation.goToPitch(portfolioId)} disabled>
              <ListItemText primary='Annual report' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to={`/portfolios/${portfolioId}/aggregated-indicators`}>
              <ListItemText primary='Aggregated Indicators' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component="a"
              href={`${window.location.origin}/portfolios/${portfolioId}/counters`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ListItemText primary='Continuous Counters' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

export default memo(PortfolioSidebar);
