import * as React from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, MenuItem, Typography } from '@mui/material';
import PortfolioCard from './components/PortfolioCard';
import NewPortfolioModal from './components/NewPortfolioModal';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userSelectors } from "store/ducks/user";
import { portfolioSelectors, portfolioThunks } from "store/ducks/portfolio";
import AddIcon from "@mui/icons-material/Add";
import { getElementPosition } from "utils/onboarding";
import { getPortfolioAccessTime } from "utils/portfolioAccess";
import OnboardingTooltip from "../../common/OnboardingTooltip";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";
import SearchInput from "../../common/SearchInput";
import TextInput from "shared-components/views/form/TextInput";
import { PORTFOLIO_SORT } from "shared-components/utils/constants";
import CompanyPublicProfileCard from "../managePublicProfile/components/CompanyPublicProfileCard";

const Portfolios = () => {
  const [tooltip, setTooltip] = useState({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(PORTFOLIO_SORT.BY_LAST_ACCESSED);
  const [newPortfolioModalOpen, setNewPortfolioModalOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const portfolios = useSelector(portfolioSelectors.getDetailedPortfolios());
  const isLoading = useSelector(portfolioSelectors.detailedPortfoliosLoading());
  const user = useSelector(userSelectors.getCurrentUser());
  const createPortfolioRef = useRef();

  const sortedFilteredPortfolios = portfolios
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((p1, p2) => {
      if (sort === PORTFOLIO_SORT.BY_LAST_ACCESSED) {
        return getPortfolioAccessTime(p2.id) - getPortfolioAccessTime(p1.id);
      } else {
        return p1.name.localeCompare(p2.name);
      }
    });

  useEffect(() => {
    dispatch(portfolioThunks.fetchPortfoliosWithDetails());
  }, []);

  useEffect(() => {
    if (createPortfolioRef.current && !localStorage.getItem('newPortfolioTooltip')) {
      setTooltip({
        position: getElementPosition(createPortfolioRef),
        title: 'Add portfolio',
        subtitle: 'Use this button to create your first portfolio',
        placement: 'left',
      });
    }
  }, [createPortfolioRef.current, isLoading]);

  const closeTooltip = () => {
    localStorage.setItem('newPortfolioTooltip', true);
    setTooltip({});
  }

  const companyDashboardRouteTemplate =
    window.__BRANDING__?.whiteLabel?.companyDashboardRouteTemplate;
  const useSimpleCreateFlow = Boolean(companyDashboardRouteTemplate);

  const goToPortfolio = (portfolio) => {
    localStorage.setItem('currentPortfolio', portfolio.id);
    if (companyDashboardRouteTemplate) {
      navigate(companyDashboardRouteTemplate.replace(':portfolioId', String(portfolio.id)));
    } else {
      navigate(`/portfolios/${portfolio.id}`);
    }
  };

  const handlePortfolioCreated = (portfolio) => {
    goToPortfolio(portfolio);
  };

  const portfolioCards = sortedFilteredPortfolios.map(p => (
    <Grid item xs={12} sm={4} key={p.id}>
      <PortfolioCard
        portfolio={p}
        onClick={() => goToPortfolio(p)}
        invitation={p.members.some(a => a.member.id === user.id && a.status === 'INVITED')}
      />
    </Grid>
  ));

  if (isLoading) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
          <Typography variant='h4'>Portfolios</Typography>
          <Box display='flex' alignItems='center' gap={3}>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                minWidth: 350,
                '.MuiInputBase-root': { backgroundColor: 'white' }
              }}
            />
            <Typography variant='body'>Sort by:</Typography>
            <TextInput
              select
              size='small'
              variant='outlined'
              onChange={(e) => setSort(e.target.value)}
              value={sort}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value={PORTFOLIO_SORT.BY_LAST_ACCESSED}>Last accessed</MenuItem>
              <MenuItem value={PORTFOLIO_SORT.BY_NAME}>Name</MenuItem>
            </TextInput>
            {useSimpleCreateFlow ? (
              <Button
                onClick={() => setNewPortfolioModalOpen(true)}
                startIcon={<AddIcon />}
                ref={createPortfolioRef}
              >
                New portfolio
              </Button>
            ) : (
              <Button
                component={Link}
                to='/portfolios/profile-wizard?step=0'
                startIcon={<AddIcon />}
                ref={createPortfolioRef}
              >
                New portfolio
              </Button>
            )}
          </Box>
        </Box>
        <Grid mt={3} container spacing={3}>
          {portfolioCards}
        </Grid>
        {(user?.publicProfileOnlyCompanies || []).length > 0 && (
          <Box mt={5}>
            <Typography variant='h4'>Public Profile Access</Typography>
            <Typography variant='body' color='text.secondary' sx={{ mt: 1, mb: 2, display: 'block' }}>
              Companies you can edit the public profile of.
            </Typography>
            <Grid container spacing={3}>
              {user.publicProfileOnlyCompanies.map((company) => (
                <Grid item xs={12} sm={4} key={company.id}>
                  <CompanyPublicProfileCard company={company} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {Object.keys(tooltip).length > 0 && (
          <OnboardingTooltip open {...tooltip} onClose={closeTooltip} />
        )}
        {useSimpleCreateFlow && (
          <NewPortfolioModal
            open={newPortfolioModalOpen}
            onClose={() => setNewPortfolioModalOpen(false)}
            onCreated={handlePortfolioCreated}
          />
        )}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(Portfolios);
