import React, { memo, useState } from 'react';
import { Box, useTheme } from "@mui/material";
import FieldLabel from "shared-components/views/components/FieldLabel";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ImageCard = ({ theme, index, selected, setSelected }) => (
  <Box flexBasis='25%'
    flexGrow={1}
    flexShrink={1}
    height={82}
    borderRadius='4px'
    border={`3px solid ${selected === index ? theme.palette.primary.main : 'transparent'}`}
    onClick={() => setSelected(index)}
  >
    <Box
      component='img'
      width='100%'
      height={76}
      src={`/images/pitch/background/background${index}.jpeg`}
      alt={`Background ${index}`}
      sx={{ objectFit: 'cover', cursor: 'pointer' }}
    />
  </Box>
)

const PitchSettingsDefaultImage = ({ name, updateSettings, ...rest }) => {
  const [selected, setSelected] = useState(null);
  const theme = useTheme();

  const imageSelected = (index) => {
    setSelected(index);
    updateSettings(name, `/images/pitch/background/background${index}.jpeg`);
  }

  return (
    <CustomErrorBoundary>
      <Box {...rest}>
        <FieldLabel>Background image</FieldLabel>
        <Box display='flex' gap={1} mt={2}>
          <ImageCard index={1} selected={selected} setSelected={imageSelected} theme={theme} />
          <ImageCard index={2} selected={selected} setSelected={imageSelected} theme={theme} />
          <ImageCard index={3} selected={selected} setSelected={imageSelected} theme={theme} />
          <ImageCard index={4} selected={selected} setSelected={imageSelected} theme={theme} />
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PitchSettingsDefaultImage);
