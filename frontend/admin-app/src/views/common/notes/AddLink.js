import React, { memo } from 'react';
import { Box, Button, Card, useTheme } from "@mui/material";
import { Form, withFormik } from "formik";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import { getTypography } from "shared-components/utils/typography";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const AddLink = ({ onClose, sx = {} }) => {
  const theme = useTheme();

  return (
    <CustomErrorBoundary>
      <Card sx={{ ...sx, p: 2, border: `1px solid ${theme.palette.border}` }}>
        <Box component={Form} display='flex' flexDirection='column' gap={3}>
          <FormikTextInput
            name='text'
            placeholder='Link name'
            label='Link name'
            fullWidth
            inputProps={{ style: { ...getTypography('subtitle') }, maxLength: 250 }}
            letterCounter
          />
          <FormikTextInput
            name='link'
            placeholder='Link'
            label='Link'
            fullWidth
            inputProps={{ style: { ...getTypography('subtitle') }, maxLength: 500 }}
            letterCounter
          />
          <Box display='flex' gap={1}>
            <Button color='secondary' onClick={onClose} fullWidth>Cancel</Button>
            <Button type='submit' fullWidth>Save</Button>
          </Box>
        </Box>
      </Card>
    </CustomErrorBoundary>
  );
};

const schema = Yup.object().shape({
  text: Yup.string().required(messages.errors.validation.required),
  link: Yup.string().required(messages.errors.validation.required).url(messages.errors.validation.url),
});

export default memo(
  withFormik({
    mapPropsToValues: () => ({
      text: '',
      link: '',
    }),
    validationSchema: schema,
    handleSubmit: (data, helpers) => {
      helpers.props.save(data);
    }
  })(AddLink)
);
