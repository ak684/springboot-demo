import React, { memo, useState } from 'react';
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import { useNavigate, useParams } from "react-router-dom";
import api from "services/api";

const AiTocSaveModal = ({ onClose, toc, geography }) => {
  const [impacts, setImpacts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { ventureId } = useParams();
  const navigate = useNavigate();

  const toggleImpact = (index) => {
    if (impacts.includes(index)) {
      setImpacts(impacts.filter(i => i !== index));
    } else {
      setImpacts([...impacts, index]);
    }
  }

  const confirm = () => {
    const savedImpacts = toc.filter((i, index) => impacts.includes(index));
    setSubmitting(true);
    api.post(`/ventures/${ventureId}/impacts/bulk`, savedImpacts)
      .then(() => {
        navigate(`/ventures/${ventureId}/table`);
      });
    if (ventureId && geography) {
      api.put(`/ventures/${ventureId}/geography`, geography, { 'Content-Type': 'text/plain' });
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title='Save generated TOC'
      actions={
        <ModalActions
          onClose={onClose}
          submitForm={confirm}
          saveDisabled={impacts.length === 0 || submitting}
        />
      }
    >
      <Typography variant='bodyBold' sx={{ mb: 2 }}>Select impact areas you want to save:</Typography>
      {toc.map((impact, index) =>
        <Box key={index}>
          <FormControlLabel
            control={<Checkbox onChange={() => toggleImpact(index)} checked={impacts.includes(index)} />}
            label={`${impact.type}: ${impact.title}`}
          />
        </Box>
      )}
    </Modal>
  );
};

export default memo(AiTocSaveModal);
