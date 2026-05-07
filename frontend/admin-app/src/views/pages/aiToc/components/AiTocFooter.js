import React, { memo } from 'react';
import { Box, Button, Link, Typography, useMediaQuery, useTheme } from "@mui/material";
import SmsFailedOutlinedIcon from "@mui/icons-material/SmsFailedOutlined";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import { useSelector } from "react-redux";
import { userSelectors } from "store/ducks/user";
import AiTocFeedbackModal from "./AiTocFeedbackModal";
import useModal from "shared-components/hooks/useModal";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import { getBranding } from 'shared-components/utils/branding';

const AiTocFooter = ({ values, finalStep, saveToc, showFeedbackButton }) => {
  const [feedbackModalOpen, giveFeedback, closeFeedbackModal] = useModal();
  const user = useSelector(userSelectors.getCurrentUser());
  const { ventureId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const branding = getBranding();
  const aiTocShareUrl = branding.aiTocShareUrl;
  const socialShareText = `How can AI help us to measure impact potential of an innovation? I just used this tool and found it helpful: ${aiTocShareUrl}`;
  const pricingUrl = branding.pricingUrl;

  const shareToLinkedin = () => {
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(socialShareText)}`);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer.php?u=${encodeURIComponent(aiTocShareUrl)}`);
  };

  const shareToTwitter = () => {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(socialShareText)}`);
  };

  const saveAuth = () => {
    if (ventureId) {
      saveToc();
    } else {
      toast.info("In order to save your TOC, select your venture first and go to AI Impact logic generation");
      navigate('/ventures');
    }
  }

  return (
    <CustomErrorBoundary>
      <Box
        position='fixed'
        bottom={0}
        left={0}
        right={0}
        zIndex={10000}
        px={{ xs: 2, sm: 4 }}
        py={{ xs: 2, sm: 3 }}
        display='flex'
        flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
        alignItems='center'
        justifyContent={showFeedbackButton ? 'space-between' : 'flex-end'}
        backgroundColor='white'
        gap={2}
        sx={{ borderTop: '1px solid', borderColor: 'border' }}
      >
        {showFeedbackButton && (
          <Button
            startIcon={<SmsFailedOutlinedIcon />}
            variant='outlined'
            onClick={giveFeedback}
            fullWidth={isMobileView}
            id='feedback-button'
          >
            Give feedback
          </Button>
        )}
        {finalStep && !!user && values.toc && Array.isArray(values.toc) &&
          <Button onClick={saveAuth} fullWidth={isMobileView}>Save generated TOC</Button>
        }
        {finalStep && !user && values.toc && Array.isArray(values.toc) &&
          <Button
            component={Link}
            href={pricingUrl}
            rel='noopener noreferrer'
            fullWidth={isMobileView}
            target='_blank'
          >
            Save & start 2 weeks free trial
          </Button>
        }
        <Box display='flex' alignItems='center' justifyContent='center' gap={0.5} width={{ xs: '100%', sm: 'unset' }}>
          <Typography sx={{ mr: 0.5 }} variant='overline' color='secondary.dark'>Share tool</Typography>
          <LinkedInIcon
            sx={{ width: 24, height: 24, color: 'secondary.main', cursor: 'pointer' }}
            onClick={shareToLinkedin}
          />
          <FacebookIcon
            sx={{ width: 24, height: 24, color: 'secondary.main', cursor: 'pointer' }}
            onClick={shareToFacebook}
          />
          <XIcon sx={{ width: 24, height: 24, color: 'secondary.main', cursor: 'pointer' }} onClick={shareToTwitter} />
        </Box>
        {feedbackModalOpen && <AiTocFeedbackModal onClose={closeFeedbackModal} />}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(AiTocFooter);
