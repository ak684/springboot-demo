import React, { memo } from 'react';
import { Avatar, Box, Card, Link, Typography } from "@mui/material";
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const PublicProfileTeamCard = ({ member }) => {
  return (
    <Card
      sx={{
        flexBasis: { xs: '100%', sm: 240 },
        height: { xs: 'unset', sm: 180 },
        px: 2,
        py: { xs: 2, sm: 3 },
        border: 1,
        borderColor: 'border',
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'column' },
        alignItems: 'center',
        gap: 2,
        textAlign: { xs: 'left', sm: 'center' },
      }}
    >
      <Avatar src={member.avatar} alt={member.name} sx={{ width: 48, height: 48 }} />
      <Box flexGrow={{ xs: 1, sm: 0 }}>
        <Typography variant='bodyBold'>{member.name}</Typography>
        <Typography sx={{ mt: 0.5 }} variant='caption'>{member.position}</Typography>
      </Box>
      {member.linkedin && (
        <Link href={member.linkedin} target='_blank'>
          <LinkedInIcon sx={{ color: '#0077B5' }} />
        </Link>
      )}
    </Card>
  );
};

export default memo(PublicProfileTeamCard);
