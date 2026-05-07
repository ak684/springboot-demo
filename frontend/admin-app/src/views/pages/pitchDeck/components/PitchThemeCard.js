import React, { memo } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchThemeCard = ({ value, index, selected, isDefault, setTheme, color }) => {
  const theme = useTheme();
  const optionSelected = selected === value || (!selected && isDefault);

  return (
    <CustomErrorBoundary>
      <Box>
        <Box
          borderRadius='8px'
          width={150}
          height={80}
          sx={{
            cursor: 'pointer',
            background: `linear-gradient(0deg, ${color} 0%, ${color} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(/images/pitch/theme${index}.jpeg)`,
            backgroundBlendMode: 'color, normal, normal',
            backgroundSize: 'cover'
          }}
          onClick={() => setTheme(value)}
        >
          {optionSelected && (
            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              borderRadius='8px'
              width={150}
              height={80}
              border={`3px solid ${theme.palette.primary.main}`}
            >
              <Box width={144} height={74} border='1px solid white' borderRadius='8px' background='transparent' />
            </Box>
          )}
        </Box>
        <Typography
          variant='captionBold'
          sx={{ mt: 0.5 }}
          color={optionSelected ? 'primary.main' : 'text.primary'}
        >
          Theme {index}
        </Typography>
      </Box>
    </CustomErrorBoundary>
  )
};

export default memo(PitchThemeCard);
