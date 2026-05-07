import { Box, useTheme } from "@mui/material";
import React, { memo } from "react";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchColorTone = ({ color, selected, isDefault, setColor }) => {
  const theme = useTheme();
  const optionSelected = selected === color || (!selected && isDefault);

  return (
    <CustomErrorBoundary>
      <Box
        backgroundColor={color}
        borderRadius='50%'
        width={37}
        height={37}
        sx={{ cursor: 'pointer' }}
        onClick={() => setColor(color)}
      >
        {optionSelected && (
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            borderRadius='50%'
            width={37}
            height={37}
            border={`2px solid ${theme.palette.primary.main}`}
          >
            <Box width={33} height={33} border='2px solid white' borderRadius='50%' background='transparent' />
          </Box>
        )}
      </Box>
    </CustomErrorBoundary>
  );
}

export default memo(PitchColorTone);
