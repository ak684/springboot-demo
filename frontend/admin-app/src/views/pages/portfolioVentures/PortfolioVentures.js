import * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { Box, Button, Grid, ListItemIcon, Menu, MenuItem, styled, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PortfolioVentureCard from "./components/PortfolioVentureCard";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import InsertLinkOutlinedIcon from '@mui/icons-material/InsertLinkOutlined';
import useModal from "shared-components/hooks/useModal";
import LinkVenturesModal from "./components/LinkVenturesModal";
import { portfolioSelectors, portfolioThunks } from "store/ducks/portfolio";
import InviteVenturesModal from "./components/InviteVenturesModal";
import { VENTURE_SORT } from "shared-components/utils/constants";
import { getVentureTotalScore } from "shared-components/utils/scoring";
import { getVentureYtdProgress } from "shared-components/utils/quantification";
import SearchInput from "../../common/SearchInput";
import TextInput from "shared-components/views/form/TextInput";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

const PortfolioVentures = () => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [linkModalOpen, linkVentures, closeLinkModal] = useModal(false);
  const [inviteModalOpen, inviteVentures, closeInviteModal] = useModal(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { portfolioId } = useParams();
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
  const ventures = useSelector(portfolioSelectors.getPortfolioVentures());
  const isLoading = useSelector(portfolioSelectors.portfolioVenturesLoading());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(VENTURE_SORT.BY_SCORE);

  const sortedFilteredVentures = ventures
    .filter(v => !search || v.venture.name.toLowerCase().includes(search.toLowerCase()))
    .sort((v1, v2) => {
      if (v1.venture.active !== v2.venture.active) {
        return v2.venture.active - v1.venture.active;
      } else if (sort === VENTURE_SORT.BY_SCORE) {
        return getVentureTotalScore(v2.venture) - getVentureTotalScore(v1.venture);
      } else if (sort === VENTURE_SORT.BY_LAST_EDIT) {
        return new Date(v2.venture.lastModifiedAt) - new Date(v1.venture.lastModifiedAt);
      } else {
        return (getVentureYtdProgress(v2.venture.impacts) || -100) - (getVentureYtdProgress(v1.venture.impacts) || -100);
      }
    });

  useEffect(() => {
    dispatch(portfolioThunks.fetchPortfolioVentures(portfolio.id));
  }, []);

  const goToVenture = (access) => {
    localStorage.setItem('currentVenture', access.venture.id);
    navigate(`/ventures/${access.venture.id}`);
  };

  const ventureCards = sortedFilteredVentures.map(v => (
    <Grid item xs={12} sm={4} key={v.id}>
      <PortfolioVentureCard portfolio={portfolio} invitation={v} onClick={() => goToVenture(v)} />
    </Grid>
  ));

  const closeMenu = () => {
    setMenuAnchorEl(null);
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
          <Typography variant='h4'>My ventures</Typography>
          <Box display='flex' alignItems='center' gap={2}>
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
            <Typography variant='body'>Sort by:</Typography>
            <TextInput
              select
              onChange={(e) => setSort(e.target.value)}
              value={sort}
              InputProps={{ disableUnderline: true }}
              sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
            >
              <MenuItem value={VENTURE_SORT.BY_SCORE}>IP Score</MenuItem>
              <MenuItem value={VENTURE_SORT.BY_LAST_EDIT}>Last edited</MenuItem>
              <MenuItem value={VENTURE_SORT.BY_PROGRESS}>Progress YTD</MenuItem>
            </TextInput>
            <Button endIcon={<ArrowDropDownIcon />} onClick={(e) => setMenuAnchorEl(e.currentTarget)} size='small'>
              Add venture
            </Button>
          </Box>
          <Menu anchorEl={menuAnchorEl} keepMounted open={!!menuAnchorEl} onClose={closeMenu} onClick={closeMenu}>
            <StyledMenuItem onClick={inviteVentures}>
              <ListItemText primary='Invite ventures' />
              <ListItemIcon><EmailOutlinedIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
            </StyledMenuItem>
            <Divider />
            <StyledMenuItem onClick={linkVentures}>
              <ListItemText primary='Link ventures' />
              <ListItemIcon><InsertLinkOutlinedIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
            </StyledMenuItem>
          </Menu>
        </Box>
        <Grid mt={3} container spacing={3}>
          {ventureCards}
        </Grid>
        <LinkVenturesModal open={linkModalOpen} onClose={closeLinkModal} portfolio={portfolio} />
        {inviteModalOpen && <InviteVenturesModal open onClose={closeInviteModal} portfolio={portfolio} />}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PortfolioVentures);
