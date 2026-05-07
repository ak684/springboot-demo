import React, { memo, useEffect, useState } from 'react';
import { Box, Button, Divider, MenuItem, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InviteMemberModal from './components/InviteMemberModal';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import { useDispatch, useSelector } from 'react-redux';
import TeamMemberCard from './components/TeamMemberCard';
import { distinctBy, sortBy } from 'shared-components/utils/lo';
import { userSelectors } from 'store/ducks/user';
import SearchInput from "../../common/SearchInput";
import { portfolioSelectors, portfolioThunks } from "store/ducks/portfolio";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import Loader from "shared-components/views/components/Loader";
import useModal from "shared-components/hooks/useModal";
import TextInput from "shared-components/views/form/TextInput";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const TeamManagement = () => {
  const [addModalOpen, inviteMember, closeAddModal, editedUser] = useModal();
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('name');
  const [search, setSearch] = useState('');
  const dispatch = useDispatch();
  const currentUser = useSelector(userSelectors.getCurrentUser());
  const ventures = useSelector(ventureSelectors.getDetailedVentures());
  const venturesLoading = useSelector(ventureSelectors.detailedVenturesLoading());
  const portfolios = useSelector(portfolioSelectors.getDetailedPortfolios());
  const portfoliosLoading = useSelector(portfolioSelectors.detailedPortfoliosLoading());

  useEffect(() => {
    dispatch(ventureThunks.fetchVenturesWithDetails());
    dispatch(portfolioThunks.fetchPortfoliosWithDetails());
  }, []);

  const owners = portfolios.concat(ventures).flatMap(c => c.organization.users);
  const people = owners
    .concat(ventures.flatMap(v => v.members).map(a => a.member))
    .concat(portfolios.flatMap(p => p.members).map(a => a.member))
    .filter(distinctBy('id'))
    .filter(u => u.id !== currentUser.id);
  const memberCards = people
    .filter(user =>
      !filter ||
      ventures.find(v => 'v_' + v.id === filter)?.members.find(a => a.member.id === user.id) ||
      ventures.find(v => 'v_' + v.id === filter)?.organization.id === user.organizationId ||
      portfolios.find(p => 'p_' + p.id === filter)?.members.find(a => a.member.id === user.id) ||
      portfolios.find(p => 'p_' + p.id === filter)?.organization.id === user.organizationId
    )
    .filter(user =>
      !search ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      ventures
        .filter(venture => venture.name.toLowerCase().includes(search.toLowerCase()))
        .find(v => v.members.find(a => a.member.id === user.id) || v.organization.users.find(u => u.id === user.id)) ||
      portfolios
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .find(p => p.members.find(a => a.member.id === user.id) || p.organization.users.find(u => u.id === user.id))
    )
    .sort((u1, u2) => {
      if (sort === 'name') {
        return (`${u1.name} ${u1.lastName}`).localeCompare(`${u2.name} ${u2.lastName}`);
      } else {
        return new Date(u2.lastSeen || 0).getTime() - new Date(u1.lastSeen || 0).getTime();
      }
    })
    .map(u =>
      <TeamMemberCard
        key={u.id}
        user={u}
        ventures={ventures}
        portfolios={portfolios}
        editUser={inviteMember}
      />
    );

  if (venturesLoading || portfoliosLoading) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <Box maxHeight={`calc(100vh - ${HEADER_HEIGHT}px - 64px)`} overflow='auto'>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          position='sticky'
          top={0}
          zIndex={1}
          backgroundColor='background.default'
        >
          <Typography variant='h3'>Manage your team</Typography>
          <Box display='flex' alignItems='center' gap={4}>
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
            <Box display='flex' alignItems='center'>
              <Typography sx={{ mr: 2 }}>Filter by:</Typography>
              <TextInput
                select
                onChange={(e) => setFilter(e.target.value)}
                value={filter}
                InputProps={{ disableUnderline: true }}
                sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
              >
                <MenuItem key='empty' value=''><i>None</i></MenuItem>
                {portfolios.length > 0 && <Divider />}
                {portfolios.length > 0 &&
                  sortBy(portfolios, 'name')
                    .map(p => <MenuItem key={p.id} value={'p_' + p.id}>{p.name}</MenuItem>)
                }
                <Divider />
                {sortBy(ventures, 'name')
                  .map(v => <MenuItem key={v.id} value={'v_' + v.id}>{v.name}</MenuItem>)
                }
              </TextInput>
            </Box>
            <Box display='flex' alignItems='center'>
              <Typography sx={{ mr: 2 }}>Sort by:</Typography>
              <TextInput
                select
                onChange={(e) => setSort(e.target.value)}
                value={sort}
                InputProps={{ disableUnderline: true }}
                sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
              >
                <MenuItem value='name'>Name</MenuItem>
                <MenuItem value='lastSeen'>Last seen</MenuItem>
              </TextInput>
            </Box>
            <Button startIcon={<AddIcon />} onClick={inviteMember} size='small'>Invite member</Button>
          </Box>
        </Box>
        <Box mt={3} display='flex' flexDirection='column' gap={3}>
          {memberCards}
          {memberCards.length === 0 && <Typography variant='body'>You don't have any team members yet</Typography>}
        </Box>
        {addModalOpen && (
          <InviteMemberModal
            open
            onClose={closeAddModal}
            ventures={ventures}
            portfolios={portfolios}
            user={editedUser}
          />
        )}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(TeamManagement);
