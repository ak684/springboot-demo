import React, { memo } from 'react';
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";

const ConfirmDeleteYearModal = ({ open, onClose, confirm, year }) => {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title='Delete selected year'
      confirm={confirm}
      primary={`Are you sure you want to delete the selected year (${year})`}
      secondary='This action cannot be undone'
    />
  );
};

export default memo(ConfirmDeleteYearModal);
