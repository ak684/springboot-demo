import React, { memo } from 'react';
import { Box, IconButton, Link } from "@mui/material";
import TextInput from "../../../form/TextInput";
import { getVentureAddress } from "shared-components/utils/venture";
import EditIcon from "@mui/icons-material/Edit";
import PitchImageUpload from "../../../components/pitchDeck/PitchImageUpload";
import FieldLabel from "../../../components/FieldLabel";

const PortfolioPublicProfileSettingsSummary = ({ portfolio, setUpdatedPortfolio }) => {
  const updatePortfolioProp = (name, newValue) => {
    setUpdatedPortfolio({ ...portfolio, [name]: newValue });
  }

  const updateSettingsProp = (name, newValue) => {
    setUpdatedPortfolio({ ...portfolio, publicSettings: { ...portfolio.publicSettings, [name]: newValue } });
  }

  return (
    <Box p={3}>
      <Box mt={2}>
        <FieldLabel>Our mission</FieldLabel>
        <TextInput
          placeholder='Our mission'
          value={portfolio.description || ''}
          onChange={(e) => updatePortfolioProp('description', e.target.value)}
          multiline
          fullWidth
        />
      </Box>
      <PitchImageUpload
        my={3}
        image={portfolio.publicSettings.missionImage}
        updateImage={(link) => updateSettingsProp('missionImage', link)}
        clearImage={() => updateSettingsProp('missionImage', null)}
      />
      <Box mt={3} display='flex' alignItems='flex-end' gap={2}>
        <TextInput
          label='Our headquarters'
          placeholder='Our headquarters'
          value={getVentureAddress(portfolio) || ''}
          disabled
          fullWidth
        />
        <IconButton component={Link} target='_blank' href={`/portfolios/${portfolio.id}/profile-wizard?goto=address`}>
          <EditIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default memo(PortfolioPublicProfileSettingsSummary);
