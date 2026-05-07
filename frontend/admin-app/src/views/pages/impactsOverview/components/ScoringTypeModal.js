import React, { memo, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { Box, Button, Radio, Typography, useTheme } from "@mui/material";

const ScoringTypeModal = ({ onClose, openAiScoring }) => {
  const [aiScoring, setAiScoring] = useState(true);
  const theme = useTheme();

  const nextStep = () => {
    if (aiScoring) {
      openAiScoring();
    } else {
      onClose();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title='Scoring wizard'
      actions={<Button onClick={nextStep}>Continue</Button>}
    >
      <Typography variant='bodyBold'>Please select how you would like to score your Impact chains:</Typography>
      <Box mt={2}>
        <Box
          p={2}
          display='flex'
          gap={2}
          alignItems='center'
          onClick={() => setAiScoring(true)}
          sx={{
            cursor: 'pointer',
            borderRadius: '8px',
            outline: aiScoring ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.border}`,
          }}
        >
          <Radio checked={aiScoring} sx={{ p: 0 }} />
          <Box>
            <Typography>Score using AI</Typography>
            <Typography variant='subtitle' color='secondary.dark'>
              You can manually fine-tune scoring made by AI afterwards.
            </Typography>
          </Box>
        </Box>
        <Box
          mt={1}
          p={2}
          display='flex'
          gap={2}
          alignItems='center'
          onClick={() => setAiScoring(false)}
          sx={{
            cursor: 'pointer',
            borderRadius: '8px',
            outline: aiScoring ? `1px solid ${theme.palette.border}` : `2px solid ${theme.palette.primary.main}`,
          }}
        >
          <Radio checked={!aiScoring} sx={{ p: 0 }} />
          <Typography>Score manually</Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default memo(ScoringTypeModal);
