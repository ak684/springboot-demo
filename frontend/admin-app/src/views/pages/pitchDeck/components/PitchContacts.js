import React, { memo } from 'react';
import { Box, Typography } from "@mui/material";
import Link from "@mui/material/Link";
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchContacts = ({ venture }) => {
  return (
    <CustomErrorBoundary>
      <Box
        display='flex'
        alignItems='center'
        gap={{ xs: 2, sm: 3 }}
        minWidth={0}
      >
        {venture.website && venture.pitchSettings.showWebsite && (
          <Typography
            variant='body'
            component={Link}
            color='white'
            href={venture.website}
            target='_blank'
            sx={{ textDecoration: 'none', display: 'block', maxWidth: '100%' }}
            noWrap
            order={{ xs: 1, sm: 0 }}
          >
            {venture.website}
          </Typography>
        )}
        <Box display='flex' alignItems='center' gap={1}>
          {venture.instagram && venture.pitchSettings.showInstagram &&
            <Link href={venture.instagram}
              target='_blank'
              display='flex'><InstagramIcon sx={{ color: 'white' }} /></Link>
          }
          {venture.twitter && venture.pitchSettings.showTwitter &&
            <Link href={venture.twitter} target='_blank' display='flex'><XIcon sx={{ color: 'white' }} /></Link>
          }
          {venture.linkedin && venture.pitchSettings.showLinkedin &&
            <Link href={venture.linkedin} target='_blank' display='flex'><LinkedInIcon sx={{ color: 'white' }} /></Link>
          }
          {venture.youtube && venture.pitchSettings.showYoutube &&
            <Link href={venture.youtube} target='_blank' display='flex'><YouTubeIcon sx={{ color: 'white' }} /></Link>
          }
          {venture.facebook && venture.pitchSettings.showFacebook &&
            <Link href={venture.facebook} target='_blank' display='flex'><FacebookIcon sx={{ color: 'white' }} /></Link>
          }
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PitchContacts);
