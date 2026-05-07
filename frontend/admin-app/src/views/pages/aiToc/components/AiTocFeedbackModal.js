import React, { memo, useState } from 'react';
import { Box, Button, Link, Rating, Switch, Typography } from "@mui/material";
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import { Form, FormikProvider, useFormik } from "formik";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import { getTypography } from "shared-components/utils/typography";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import api from "services/api";
import { toast } from "react-toastify";
import { copyToClipboard } from "shared-components/utils/helpers";
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import FieldLabel from "shared-components/views/components/FieldLabel";
import { getBranding } from 'shared-components/utils/branding';

const schema = Yup.object().shape({
  rating: Yup.number().nullable(true),
  comment: Yup.string(),
  contact: Yup.boolean(),
  name: Yup.string(),
  email: Yup.string().email(() => messages.errors.validation.email),
});

const AiTocFeedbackModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const branding = getBranding();
  const aiTocShareUrl = branding.aiTocShareUrl;
  const shareText = `How can AI help us to measure impact potential of an innovation? I just used this tool and found it helpful: ${aiTocShareUrl}`;
  const pricingUrl = branding.pricingUrl;
  const twitterProfileUrl = branding.social.twitter;
  const linkedinProfileUrl = branding.social.linkedin;
  const facebookProfileUrl = branding.social.facebook;

  const shareToLinkedin = () => {
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer.php?u=${encodeURIComponent(aiTocShareUrl)}`);
  };

  const shareToTwitter = () => {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
  };

  const sendFeedback = (values) => {
    api.post('/ai-toc/feedback', values)
      .then(() => {
        toast.success('Thank you for your feedback!');
        if (values.rating === 5) {
          setStep(3);
        } else {
          onClose();
        }
      });
  }

  const formikContext = useFormik({
    initialValues: {
      rating: null,
      comment: '',
      contact: false,
      name: '',
      email: '',
    },
    onSubmit: sendFeedback,
    validationSchema: schema,
  });

  const goForward = () => {
    setStep(2);
  }

  const goBack = () => {
    setStep(1);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      goForward();
    }
  };

  const copyUrl = () => {
    copyToClipboard(aiTocShareUrl);
    toast.success('Link was copied to your clipboard');
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={step <= 2 ? 'How do you like the result?' : 'Want to share our free AI tool?'}
      actions={
        step === 3 ?
          (
            <Box textAlign='center' width='100%'>
              <Link href={pricingUrl} rel='noopener noreferrer' target='_blank'>
                Create my account
              </Link>
            </Box>
          )
          :
          (
            <ModalActions
              onClose={step === 1 ? onClose : goBack}
              closeTitle={step === 1 ? 'Close' : 'Back'}
              submitForm={step === 1 ? goForward : formikContext.handleSubmit}
              submitTitle={step === 1 ? 'Next' : 'Send'}
            />
          )
      }
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '560px',
          },
        },
      }}
    >
      <FormikProvider value={formikContext}>
        <Form>
          {step === 1 && (
            <Box>
              <Rating
                sx={{ fontSize: 36 }}
                value={formikContext.values.rating}
                onChange={(event, newValue) => {
                  formikContext.setFieldValue('rating', newValue);
                }}
              />
              <FieldLabel sx={{ mt: 3 }}>Leave your comments (optional)</FieldLabel>
              <FormikTextInput
                name='comment'
                placeholder='Comment'
                fullWidth
                multiline
                inputProps={{ style: { ...getTypography('subtitle') } }}
                InputLabelProps={{ style: { ...getTypography('subtitle') } }}
                onKeyDown={handleKeyDown}
              />
            </Box>
          )}
          {step === 2 && (
            <Box>
              <Box
                py={2}
                px={3}
                sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'border' }}
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Typography variant='subtitle'>Want us to follow up?</Typography>
                <Switch
                  checked={formikContext.values.contact}
                  onChange={() => formikContext.setFieldValue('contact', !formikContext.values.contact)}
                />
              </Box>
              {formikContext.values.contact && (
                <>
                  <FieldLabel sx={{ mt: 3 }}>Name</FieldLabel>
                  <FormikTextInput
                    name='name'
                    placeholder='Name'
                    fullWidth
                    inputProps={{ style: { ...getTypography('subtitle') } }}
                    InputLabelProps={{ style: { ...getTypography('subtitle') } }}
                  />
                </>
              )}
              {formikContext.values.contact && (
                <>
                  <FieldLabel sx={{ mt: 3 }}>Email</FieldLabel>
                  <FormikTextInput
                    name='email'
                    placeholder='Email'
                    fullWidth
                    inputProps={{ style: { ...getTypography('subtitle') } }}
                    InputLabelProps={{ style: { ...getTypography('subtitle') } }}
                  />
                </>
              )}
              <Box mt={5} display='flex' alignItems='center' gap={0.5}>
                <Typography variant='caption' sx={{ mr: 0.5 }}>
                  Follow our updates on:
                </Typography>
                <Link
                  target='_blank'
                  rel='noopener noreferrer'
                  href={linkedinProfileUrl}
                  sx={{ height: 24 }}
                >
                  <LinkedInIcon sx={{ width: 24, height: 24, color: 'secondary.main', cursor: 'pointer' }} />
                </Link>
                <Link
                  target='_blank'
                  rel='noopener noreferrer'
                  href={facebookProfileUrl}
                  sx={{ height: 24 }}
                >
                  <FacebookIcon sx={{ width: 24, height: 24, color: 'secondary.main', cursor: 'pointer' }} />
                </Link>
                <Link
                  target='_blank'
                  rel='noopener noreferrer'
                  href={twitterProfileUrl}
                  sx={{ height: 24 }}
                >
                  <XIcon sx={{ width: 24, height: 24, color: 'secondary.main', cursor: 'pointer' }} />
                </Link>
              </Box>
            </Box>
          )}
          {step === 3 && (
            <Box display='flex' flexDirection='column' gap={2}>
              <Button
                fullWidth
                startIcon={<FacebookIcon />}
                sx={{ backgroundColor: '#1877f2 !important' }}
                onClick={shareToFacebook}
              >
                Facebook
              </Button>
              <Button
                fullWidth
                startIcon={<LinkedInIcon />}
                sx={{ backgroundColor: '#0a66c2 !important' }}
                onClick={shareToLinkedin}
              >
                Linkedin
              </Button>
              <Button
                fullWidth
                startIcon={<XIcon />}
                sx={{ backgroundColor: '#000 !important' }}
                onClick={shareToTwitter}
              >
                &nbsp;
              </Button>
              <Box display='flex' gap={2}>
                <Button onClick={copyUrl} sx={{ flexBasis: '50%' }} variant='outlined' startIcon={<InsertLinkIcon />}>
                  Copy url
                </Button>
                <Button
                  component={Link}
                  href={`mailto:?subject=${encodeURIComponent('Using artificial intelligence in sustainability impact assessment for startups')}&body=${encodeURIComponent(`I just used this free tool and would like to recommend it. ${aiTocShareUrl} . It uses artificial intelligence to help identify key impact areas and metrics to measure the positive and negative sustainability outcomes of an innovation.`)}`}
                  sx={{ flexBasis: '50%' }}
                  variant='outlined'
                  startIcon={<MailOutlineIcon />}
                >
                  Share by mail
                </Button>
              </Box>
            </Box>
          )}
        </Form>
      </FormikProvider>
    </Modal>
  );
};

export default memo(AiTocFeedbackModal);
