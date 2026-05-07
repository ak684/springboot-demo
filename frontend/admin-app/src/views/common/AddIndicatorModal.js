import React, { memo } from 'react';
import { Form, withFormik } from 'formik';
import store from 'store';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import { ventureThunks } from 'store/ducks/venture';
import Box from '@mui/material/Box';
import { yearOptions } from "shared-components/utils/constants";
import { MenuItem } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import Modal from "shared-components/views/components/modal/Modal";

const AddIndicatorModal = ({ open, onClose, handleSubmit, indicator }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={indicator ? 'Editing indicator' : 'Adding new indicator'}
      actions={<ModalActions onClose={onClose} submitForm={handleSubmit} />}
    >
      <Box component={Form}>
        <FormikTextInput
          sx={{ mb: 2 }}
          name='name'
          placeholder='Define indicator'
          inputProps={{ maxLength: 100 }}
          fullWidth
          letterCounter
        />
        <FormikTextInput name='year' label='Data collection start' select fullWidth>
          {yearOptions.map(y => (<MenuItem key={y.value} value={y.value}>{y.label}</MenuItem>))}
        </FormikTextInput>
      </Box>
    </Modal>
  );
};

const schema = Yup.object().shape({
  name: Yup.string().required(() => messages.errors.validation.required),
  year: Yup.number().required(() => messages.errors.validation.required),
});

export default memo(withFormik({
  mapPropsToValues: ({ indicator }) => ({
    name: indicator?.name || '',
    year: indicator?.year || '',
  }),
  validationSchema: schema,
  handleSubmit: (data, helpers) => {
    if (helpers.props.indicator) {
      store.dispatch(ventureThunks.editIndicator({ indicator: helpers.props.indicator, data }));
    } else {
      store.dispatch(ventureThunks.addIndicator({ impactId: helpers.props.impactId, data }));
    }
    helpers.props.onClose();
  },
})(AddIndicatorModal));
