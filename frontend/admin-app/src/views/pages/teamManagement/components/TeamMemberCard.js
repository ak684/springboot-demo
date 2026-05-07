import React from 'react';
import { Avatar, Box, Card, CardContent, Chip, IconButton, Typography } from '@mui/material';
import filters from "shared-components/filters";
import AppLabel from 'views/common/AppLabel';
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";
import useModal from "shared-components/hooks/useModal";
import { useDispatch } from 'react-redux';
import EditIcon from '@mui/icons-material/Edit';
import { smallerImage } from "shared-components/utils/helpers";
import { ventureThunks } from 'store/ducks/venture';
import { getTeamAccessMap, NO_ACCESS } from "utils/team";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const TeamMemberCard = ({ user, ventures, portfolios, editUser }) => {
  const [deleteModalOpen, unassignUser, closeDeleteModal, unassignData] = useModal();
  const ownedVentures = ventures.filter(v => v.organization.users.find(u => u.id === user?.id));
  const accessedVentures = ventures.filter(v => v.members.find(a => a.member.id === user?.id));
  const ownedPortfolios = portfolios.filter(p => p.organization.users.find(u => u.id === user?.id));
  const accessedPortfolios = portfolios.filter(p => p.members.find(a => a.member.id === user?.id));
  const dispatch = useDispatch();

  const confirmUnassignUser = () => {
    const ventureAccessMap = getTeamAccessMap(ventures, user);
    const portfolioAccessMap = getTeamAccessMap(portfolios, user);

    if (unassignData.type === 'venture') {
      ventureAccessMap[unassignData.company.id] = {
        ...ventureAccessMap[unassignData.company.id],
        access: NO_ACCESS
      };
    } else if (unassignData.type === 'portfolio') {
      portfolioAccessMap[unassignData.company.id] = {
        ...portfolioAccessMap[unassignData.company.id],
        access: NO_ACCESS
      };
    }

    dispatch(ventureThunks.updateUserAccess({
        user,
        allVentures: ventures,
        ventureAccessMap: ventureAccessMap,
        allPortfolios: portfolios,
        portfolioAccessMap: portfolioAccessMap,
      })
    );
  };

  return (
    <CustomErrorBoundary>
      <Card display='flex'>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box display='flex' alignItems='center' gap={2}>
            <Avatar sx={{ width: 40, height: 40, flexGrow: 0 }} src={smallerImage(user.avatar)} />
            <Box flexGrow={4}>
              <Typography variant='h5'>{user.name} {user.lastName}</Typography>
              {!user.invited && user.lastSeen &&
                <Typography variant='body'>Last seen: {filters.date(user.lastSeen)}</Typography>
              }
              {(!user.lastSeen || user.invited) && <AppLabel>Pending...</AppLabel>}
            </Box>
            {user.company && (
              <Typography sx={{ ml: 8, flexGrow: 1 }} noWrap title={user.company}>
                Organization: {user.company}
              </Typography>
            )}
          </Box>
          <Box display='flex' alignItems='center' gap={2}>
            <Typography sx={{ whiteSpace: 'nowrap' }}>Access to:</Typography>
            <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
              {ownedVentures.map((venture) => (
                <Chip key={venture.id} label={venture.name} />
              ))}
              {accessedVentures.map((venture) => (
                <Chip
                  key={venture.id}
                  label={venture.name}
                  onDelete={() => unassignUser({ type: 'venture', company: venture })}
                />
              ))}
              {ownedPortfolios.map((portfolio) => (
                <Chip key={portfolio.id} label={portfolio.name} sx={{ backgroundColor: 'success.subtle' }} />
              ))}
              {accessedPortfolios.map((portfolio) => (
                <Chip
                  key={portfolio.id}
                  label={portfolio.name}
                  onDelete={() => unassignUser({ type: 'portfolio', company: portfolio })}
                  sx={{ backgroundColor: 'success.subtle' }}
                />
              ))}
            </Box>
            <IconButton onClick={() => editUser(user)}><EditIcon sx={{ color: 'text.primary' }} /></IconButton>
          </Box>
        </CardContent>
        <ConfirmModal
          open={deleteModalOpen}
          onClose={closeDeleteModal}
          confirm={confirmUnassignUser}
          title='Revoke user access'
          primary={`Are you sure you want to remove ${user.name} ${user.lastName} from accessing ${unassignData?.company.name}?`}
          confirmTitle='Yes, remove'
        />
      </Card>
    </CustomErrorBoundary>
  );
};

export default TeamMemberCard;
