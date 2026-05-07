import React, { memo, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { Grid, Tab, Tabs } from "@mui/material";
import { useDispatch } from "react-redux";
import { userThunks } from "store/ducks/user";
import SubscriptionCard from "./SubscriptionCard";
import { getTypography } from "shared-components/utils/typography";

const basicItems = [
  'AI Theory of Change Generator',
  'Theory of Change Wizard',
  'Identify key indicators',
  '1 page metrics time plan',
  'Sustainable development goals attribution',
  'Impact Potential Score',
  'Up to 7 free team member accounts',
  'Option to create a venture portfolio for analysis (free)',
];
const proItems = [
  'Forecasting products, stakeholders an monitoring',
  'Set targets (monthly, yearly)',
  'Monitor progress',
  'Share pitchdeck with investors',
  'Data and contents update across all products',
  'Use data for your own pitchdeck',
];

const NeedSubscriptionModal = ({ onClose, creatingNewVenture }) => {
  const [tab, setTab] = useState('Year');
  const dispatch = useDispatch();

  const purchase = (period, type) => {
    dispatch(userThunks.purchaseNewSubscription({ period, type, newVenture: creatingNewVenture }));
  };

  return (
    <Modal
      open
      onClose={onClose}
      title='Choose subscription plan for your venture'
      sx={{ '.MuiPaper-root': { minWidth: 978 }, '.MuiDialogContent-root': { pt: 0 } }}
    >
      <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)} centered sx={{ mb: 2 }}>
        <Tab value='Month' label='Monthly' sx={{ ...getTypography('captionBold'), textTransform: 'none' }} />
        <Tab value='Year' label='Yearly' sx={{ ...getTypography('captionBold'), textTransform: 'none' }} />
      </Tabs>
      {tab === 'Month' && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <SubscriptionCard
              type='Get started'
              price={25}
              period={tab}
              items={basicItems}
              purchase={() => purchase('month', 'basic')}
            />
          </Grid>
          <Grid item xs={6}>
            <SubscriptionCard
              type='Full access'
              recommended
              price={49}
              period={tab}
              items={proItems}
              sx={{ borderWidth: 2, borderColor: 'primary.main' }}
              purchase={() => purchase('month', 'pro')}
            />
          </Grid>
        </Grid>
      )}
      {tab === 'Year' && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <SubscriptionCard
              type='Get started'
              price={19}
              yearPrice={228}
              period={tab}
              items={basicItems}
              purchase={() => purchase('year', 'basic')}
            />
          </Grid>
          <Grid item xs={6}>
            <SubscriptionCard
              type='Full access'
              recommended
              price={39}
              yearPrice={468}
              period={tab}
              items={proItems}
              sx={{ borderWidth: 2, borderColor: 'primary.main' }}
              purchase={() => purchase('year', 'pro')}
            />
          </Grid>
        </Grid>
      )}
    </Modal>
  );
};

export default memo(NeedSubscriptionModal);
