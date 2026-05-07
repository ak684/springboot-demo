import React, { memo, useEffect, useRef } from 'react';
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
import { HEADER_HEIGHT, SUBSCRIPTIONS, VENTURE_ACCESS } from "shared-components/utils/constants";
import navigation from "shared-components/utils/navigation";
import { useDispatch, useSelector } from "react-redux";
import { appActions } from "../../store/ducks/app";
import { getElementPosition } from "../../utils/onboarding";
import { ventureSelectors } from "../../store/ducks/venture";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(35),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(35),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const VentureSidebar = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const wizardRef = useRef();
  const tocRef = useRef();
  const scoringRef = useRef();
  const dispatch = useDispatch();
  const noImpactsScored = venture?.impacts.every(i => !i.scoring.at(-1)?.score);
  const navigate = useNavigate();
  const location = useLocation();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  useEffect(() => {
    if (venture?.impacts.length === 0 && !sessionStorage.getItem('firstImpact')) {
      dispatch(appActions.openOnboarding({
        name: 'firstImpact',
        title: 'Congratulations on the creation of your new Venture!',
        subtitle: 'Now, embark on outlining the logic behind your venture’s sustainability impact. Develop 3-5 Impact Logic Chains encompassing all facets of your venture\'s operations.',
        hole: getElementPosition(wizardRef),
        tooltip: {
          title: 'Start by creating your first Impact Logic Chain',
          subtitle: 'It is recommended to create at least 3 Impact Logic Chains before proceeding with the next steps.',
        }
      }));
    } else if (venture?.impacts.length === 1 && !sessionStorage.getItem('secondImpact')) {
      dispatch(appActions.openOnboarding({
        name: 'secondImpact',
        title: 'Nice job on crafting the initial Impact Logic Chain!',
        subtitle: 'Keep the momentum going and craft a couple more to highlight various facets of your venture\'s sustainability impact.',
        hole: getElementPosition(tocRef),
        tooltip: {
          title: 'Craft a couple more Impact Logic Chains',
          subtitle: 'This section allows creating new Impact Chains faster and see all the existing ones in one place.',
        }
      }));
    } else if (venture?.impacts.length >= 2 && noImpactsScored && !sessionStorage.getItem('scoring')) {
      dispatch(appActions.openOnboarding({
        name: 'scoring',
        title: 'Great progress on your Impact Logic Chains!',
        subtitle: 'Now, let\'s delve into scoring them. Assign scores to each chain, reflecting their respective impacts.',
        hole: getElementPosition(scoringRef),
        tooltip: {
          title: 'It\'s time to score your Impact Chains',
          subtitle: 'Evaluate and assign scores that mirror the distinct impacts each chain makes',
        }
      }));
    }
  }, [venture]);

  if (!venture) {
    return null;
  }

  return (
    <StyledDrawer variant='permanent' open>
      <CustomErrorBoundary>
        <Toolbar sx={{ height: HEADER_HEIGHT }} />
        <List sx={{ p: 4, pr: 2 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate(`/ventures/${ventureId}`)} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <HomeOutlinedIcon sx={{ color: 'text.primary' }} />
              </ListItemIcon>
              <ListItemText primary='Home' primaryTypographyProps={{ variant: 'bodyBold' }} sx={{ m: 0 }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AddCircleOutlineOutlinedIcon sx={{ color: 'text.primary' }} />
            </ListItemIcon>
            <ListItemText primary='Create impact logic'
              primaryTypographyProps={{ variant: 'bodyBold' }}
              sx={{ m: 0 }} />
          </ListItem>
          <ListItem disablePadding ref={wizardRef}>
            <ListItemButton
              component={Link}
              to={`/ventures/${ventureId}/ai-toc`}
              disabled={access !== VENTURE_ACCESS.EDIT}
            >
              <ListItemText primary='AI impact logic generation' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding ref={wizardRef}>
            <ListItemButton
              onClick={() => navigation.goToImpactCreation(ventureId)}
              disabled={access !== VENTURE_ACCESS.EDIT}
            >
              <ListItemText primary='Impact logic wizard' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding ref={tocRef}>
            <ListItemButton component={Link} to={`/ventures/${ventureId}/table`}>
              <ListItemText primary='Theory of Change overview' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to={`/ventures/${ventureId}/indicators`}
              disabled={venture.impacts.length === 0}
            >
              <ListItemText primary='Indicator planning' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}><SpeedOutlinedIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
            <ListItemText
              sx={{ m: 0 }}
              primary='Score impact potential'
              primaryTypographyProps={{ variant: 'bodyBold' }}
            />
          </ListItem>
          <ListItem disablePadding ref={scoringRef}>
            <ListItemButton
              component={Link}
              to={`/ventures/${ventureId}/scoring-wizard`}
              disabled={venture.impacts.length === 0}
              sx={{
                backgroundColor: location.pathname.endsWith('impacts') ? 'secondary.subtle' : 'transparent',
                borderRadius: '8px'
              }}
            >
              <ListItemText primary='Scoring wizard' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to={`/ventures/${ventureId}/scoring-overview`} disabled={noImpactsScored}>
              <ListItemText primary='Scoring overview' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          {/*<ListItem disablePadding>*/}
          {/*  <ListItemButton component={Link} to={`/ventures/${ventureId}/dimensions`} disabled={noImpactsScored}>*/}
          {/*    <ListItemText primary='5 dimensions of impact' primaryTypographyProps={{ variant: 'subtitle' }} />*/}
          {/*  </ListItemButton>*/}
          {/*</ListItem>*/}
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}><TimelineOutlinedIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
            <ListItemText
              sx={{ m: 0 }}
              primary='Forecast impact potential'
              primaryTypographyProps={{ variant: 'bodyBold' }}
            />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to={`/ventures/${ventureId}/quantification-overview`}
              disabled={noImpactsScored || venture.subscriptionType !== SUBSCRIPTIONS.PRO}
              sx={{
                backgroundColor: location.pathname.endsWith('quantification-overview') ? 'secondary.subtle' : 'transparent',
                borderRadius: '8px'
              }}
            >
              <ListItemText primary='Quantification wizard' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}><QueryStatsOutlinedIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
            <ListItemText
              sx={{ m: 0 }}
              primary='Monitor progress'
              primaryTypographyProps={{ variant: 'bodyBold' }}
            />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to={`/ventures/${ventureId}/monitoring-overview`}
              disabled={noImpactsScored || venture.subscriptionType !== SUBSCRIPTIONS.PRO}
              sx={{
                backgroundColor: location.pathname.endsWith('monitoring-overview') ? 'secondary.subtle' : 'transparent',
                borderRadius: '8px'
              }}
            >
              <ListItemText primary='Monitoring wizard' primaryTypographyProps={{ variant: 'subtitle' }} />
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
            <ListItemButton onClick={() => navigation.goToPitch(ventureId)}
              disabled={noImpactsScored || venture.subscriptionType !== SUBSCRIPTIONS.PRO}>
              <ListItemText primary='Edit impact pitch deck' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate(`/public-profile/ventures/${ventureId}`)}
              disabled={noImpactsScored || venture.subscriptionType !== SUBSCRIPTIONS.PRO}
            >
              <ListItemText primary='Edit public profile' primaryTypographyProps={{ variant: 'subtitle' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

export default memo(VentureSidebar);
