import React, { memo } from 'react';
import { useDispatch } from 'react-redux';
import { appThunks } from 'store/ducks/app';
import { Box, Button, Drawer, Rating, Typography, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { Form, Formik } from 'formik';
import CheckIcon from '@mui/icons-material/Check';
import { getTypography } from "shared-components/utils/typography";
import html2canvas from "html2canvas";
import AppTooltip from "./AppTooltip";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const FeedbackDrawer = ({ open, close }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useTheme();

  const onSubmit = (data, helpers) => {
    dispatch(appThunks.sendFeedback({ ...data, page: `${location.pathname}?${location.search}` }));
    helpers.resetForm();
    close();
  };

  const handleKeyDown = (e, submit) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }
  };

  const takeScreenshot = (setFieldValue) => {
    const element = document.getElementById('root');
    html2canvas(element).then((canvas) => {
      const base64image = canvas.toDataURL('image/png');
      setFieldValue('screenshot', base64image);
    });
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={close}
      sx={{ zIndex: theme.zIndex.drawer + 2 }}
      PaperProps={{ sx: { width: 500 } }}
    >
      <CustomErrorBoundary>
        <Box mx={6} mt={12}>
          <Formik
            initialValues={{
              rating: null,
              comment: '',
              screenshot: null,
            }}
            onSubmit={onSubmit}
          >
            {formikProps => (
              <Form>
                <Typography variant='h2' sx={{ mb: 1 }}>
                  Need help? Comment? How do you like this screen?
                </Typography>
                <Rating
                  sx={{ fontSize: 36 }}
                  value={formikProps.values.rating}
                  onChange={(event, newValue) => {
                    formikProps.setFieldValue('rating', newValue);
                  }}
                />
                <Box my={3}>
                  <Typography variant='body'>We love to hear from you!</Typography>
                </Box>
                <FormikTextInput
                  name='comment'
                  placeholder='Comment'
                  fullWidth
                  multiline
                  inputProps={{ style: { ...getTypography('h2') } }}
                  InputLabelProps={{ style: { ...getTypography('h2') } }}
                  onKeyDown={(e) => handleKeyDown(e, formikProps.handleSubmit)}
                />
                <Box my={3}>
                  <Box display='flex' alignItems='center' gap={2} mb={1}>
                    <Typography>A screenshot will help us better understand the issue</Typography>
                    <AppTooltip>
                      The screenshot will only copy the screen where our app is displayed (no browser tabs or desktop
                      elements)
                    </AppTooltip>
                  </Box>
                  {!formikProps.values.screenshot && (
                    <Button onClick={() => takeScreenshot(formikProps.setFieldValue)} variant='outlined' fullWidth>
                      Take screenshot
                    </Button>
                  )}
                  {formikProps.values.screenshot &&
                    <Button variant='outlined' endIcon={<CheckIcon />} fullWidth>Screenshot added</Button>
                  }
                </Box>
                <Box my={3}>
                  <Button type='submit' endIcon={<CheckIcon />}>Submit</Button>
                </Box>
                <Typography variant='body'>Thank you! You will receive our response by e-mail</Typography>
              </Form>
            )}
          </Formik>
        </Box>
      </CustomErrorBoundary>
    </Drawer>
  );
};

export default memo(FeedbackDrawer);
