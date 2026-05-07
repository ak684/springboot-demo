import React, { memo, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import api from 'services/api';
import CompanyProfileSocialInputField from "./CompanyProfileSocialInputField";
import CompanyProfileSocialInputChart from "./CompanyProfileSocialInputChart";
import { useDispatch, useSelector } from "react-redux";
import { ventureSelectors, ventureThunks } from "store/ducks/venture";
import InfoAlert from "../../../common/InfoAlert";
import Button from "@mui/material/Button";
import { useParams } from "react-router-dom";
import { socialMedia } from "shared-components/utils/constants";
import useModal from "shared-components/hooks/useModal";
import CompanyProfileFacebookModal from "./CompanyProfileFacebookModal";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileSocialInput = ({ values, nextStep, setFieldValue }) => {
  const [loading, setLoading] = useState(!values.socialLinksParsed && values.website);
  const [followers, setFollowers] = useState({});
  const [facebookModalOpen, connectFacebook, closeFacebookModal] = useModal();
  const dispatch = useDispatch();
  const { ventureId, portfolioId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const websiteChanged = venture?.website && values.website && venture?.website !== values.website;

  useEffect(() => {
    if (!values.socialLinksParsed && values.website) {
      fetchSocialMedia();
    }
  }, []);

  useEffect(() => {
    if (values.socialLinksParsed) {
      Object.keys(socialMedia).forEach(key => {
        if (values[key]) {
          fetchSocialFollowers(key);
        }
      })
    }
  }, [values.socialLinksParsed]);

  const fetchSocialMedia = () => {
    api.post('/followers/social-media', values.website, { 'Content-Type': 'text/plain' })
      .then(res => {
        Object.keys(res).forEach(key => {
          setFieldValue(key, res[key]);
          fetchSocialFollowers(key);
        });
        setFieldValue('socialLinksParsed', true);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const fetchSocialFollowers = (media) => {
    api.post(`/followers/${ventureId ? 'venture' : 'portfolio'}/${ventureId || portfolioId}/by-link`, {
      media,
      website: values[media]
    })
      .then(res => {
        setFollowers((val) => ({ ...val, [media]: res }))
      });
  }

  const confirmConnectFacebook = () => {
    closeFacebookModal();
    api.get(`/oauth/facebook/${ventureId}`)
      .then(url => {
        const width = 600, height = 800;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        const features = `width=${width},height=${height},top=${top},left=${left}`;
        const authWindow = window.open(url, 'FacebookLogin', features);

        const authWindowMonitor = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(authWindowMonitor);
          }
        }, 1000);
      });
  }

  useEffect(() => {
    const listener = (event) => {
      if (event.data === 'FacebookLoginSuccess') {
        dispatch(ventureThunks.fetchCurrentVenture(ventureId));
        fetchSocialFollowers("facebook");
        fetchSocialFollowers("instagram");
      }
    };

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    }
  }, []);

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Indicate existing internet presence of your company</StepperTitle>
          <StepperDescription>
            We try to fetch the links automatically if you have indicated your website address in the previous step
          </StepperDescription>
          {loading && <Loader />}
          {!loading && (
            <Box>
              {websiteChanged && (
                <InfoAlert
                  title={(
                    <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
                      <Typography variant='subtitleBold'>Update social media links?</Typography>
                      <Button
                        onClick={fetchSocialMedia}
                        size='small'
                        sx={{ flexBasis: 150, flexGrow: 0, flexShrink: 0 }}
                        variant='outlined'
                      >
                        Update links
                      </Button>
                    </Box>
                  )}
                  sx={{ mb: 4 }}
                >
                  <Box pr={20}>
                    Venture website has been changed. Would you like to replace existing social media links with the
                    ones
                    retrieved from the new website?
                  </Box>
                </InfoAlert>
              )}
              <Box display='flex' alignItems='center' gap={6}>
                <Box flexGrow={1} flexShrink={1}>
                  <CompanyProfileSocialInputField
                    name='facebook'
                    followers={followers.facebook}
                    fetchFollowers={fetchSocialFollowers}
                    isFacebook
                    connectFacebook={connectFacebook}
                  />
                  <CompanyProfileSocialInputField
                    name='instagram'
                    followers={followers.instagram}
                    fetchFollowers={fetchSocialFollowers}
                    isFacebook
                    connectFacebook={connectFacebook}
                  />
                  <CompanyProfileSocialInputField
                    name='twitter'
                    followers={followers.twitter}
                    fetchFollowers={fetchSocialFollowers}
                  />
                  <CompanyProfileSocialInputField
                    name='linkedin'
                    followers={followers.linkedin}
                    fetchFollowers={fetchSocialFollowers}
                  />
                  <CompanyProfileSocialInputField
                    name='youtube'
                    followers={followers.youtube}
                    fetchFollowers={fetchSocialFollowers}
                  />
                </Box>
                <CompanyProfileSocialInputChart followers={followers} />
              </Box>
              <StepperNextButton nextStep={nextStep} />
            </Box>
          )}
          <CompanyProfileFacebookModal
            open={facebookModalOpen}
            onClose={closeFacebookModal}
            confirm={confirmConnectFacebook}
          />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileSocialInput);
