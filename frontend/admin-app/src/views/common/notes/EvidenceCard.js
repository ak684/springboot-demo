import React, { memo } from 'react';
import { Box, Card, Divider, MenuItem, Typography, useTheme } from "@mui/material";
import FieldLabel from "shared-components/views/components/FieldLabel";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import FormikSlider from "shared-components/views/form/FormikSlider";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const EvidenceCard = ({ children, item, editMode, index, type, tab, score }) => {
  const theme = useTheme();

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2, border: `1px solid ${theme.palette.border}` }}>
        <FieldLabel><b>Data evidence:</b> {item.file?.name || item.text}</FieldLabel>
        <Box display='flex' flexDirection='column' gap={3}>
          <Divider sx={{ mt: 1 }} />
          <Box>
            <FieldLabel>Evidence type</FieldLabel>
            {editMode && (
              <FormikTextInput select name={`${tab}.${type}[${index}].evidenceType`} fullWidth>
                <MenuItem value='OWN_VALIDATION'>Own validation</MenuItem>
                <MenuItem value='EXISTING_RESEARCH'>Existing research</MenuItem>
              </FormikTextInput>
            )}
            {!editMode && (
              <Typography>{item.evidenceType === 'EXISTING_RESEARCH' ? 'Existing research' : 'Own validation'}</Typography>
            )}
          </Box>
          <Box>
            <FieldLabel>Comment</FieldLabel>
            {editMode && (
              <FormikTextInput
                name={`${tab}.${type}[${index}].comment`}
                multiline
                fullWidth
                inputProps={{ maxLength: 100 }}
                letterCounter
              />
            )}
            {!editMode && item.comment && (
              <Typography>{item.comment}</Typography>
            )}
          </Box>
          {!editMode && (
            <Box>
              <FieldLabel sx={{ mb: 1 }}>Own validation</FieldLabel>
              <Typography>{score?.validation?.description}</Typography>
            </Box>
          )}
          {!editMode && (
            <Box>
              <FieldLabel sx={{ mb: 1 }}>Indicator noisiness</FieldLabel>
              <Typography>{score?.noisiness?.description}</Typography>
            </Box>
          )}
          <Box>
            <FieldLabel>Evidence risk</FieldLabel>
            {editMode && (
              <Box>
                <Typography variant='subtitle'>Based on this data source, we expect the value to be:</Typography>
                <FormikSlider
                  name={`${tab}.${type}[${index}].risk`}
                  min={0}
                  max={100}
                  valueLabelFormat={(val) => `${val}%`}
                  valueLabelDisplay='auto'
                  step={5}
                  size='small'
                  marks={[{ value: 0 }, { value: 20 }, { value: 40 }, { value: 60 }, { value: 80 }, { value: 100 }]}
                />
                <Box display='flex' justifyContent='space-between'>
                  <Typography sx={{ fontSize: 10 }}>Exactly as is</Typography>
                  <Typography sx={{ fontSize: 10 }}>Lower or higher</Typography>
                </Box>
              </Box>
            )}
            {!editMode && <Typography>{item.risk}%</Typography>}
          </Box>
          {children}
        </Box>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(EvidenceCard);
