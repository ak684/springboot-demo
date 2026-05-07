import React, { memo, useState } from 'react';
import Box from '@mui/material/Box';
import { MenuItem } from '@mui/material';
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import { yearOptions } from "shared-components/utils/constants";
import TextInput from "shared-components/views/form/TextInput";

const AiTocAddIndicatorModal = ({ open, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');

  const handleSubmit = () => {
    if (name.trim() && year) {
      onAdd({ name, year: parseInt(year) });
      setName(''); // Reset the fields for next use
      setYear('');
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adding new indicator"
      actions={
        <ModalActions
          onClose={onClose}
          submitForm={handleSubmit}
          submitDisabled={!name.trim() || !year}
        />
      }
    >
      <Box>
        <TextInput
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Define indicator"
          inputProps={{ maxLength: 100 }}
          autoFocus
          sx={{ mb: 2 }}
          variant="standard"
          letterCounter
        />
        <TextInput
          fullWidth
          select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          label="Data collection start"
          variant="standard"
        >
          {yearOptions.map(y => (
            <MenuItem key={y.value} value={y.value}>{y.label}</MenuItem>
          ))}
        </TextInput>
      </Box>
    </Modal>
  );
};

export default memo(AiTocAddIndicatorModal);
