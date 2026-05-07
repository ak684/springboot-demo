import React, { memo, useState } from 'react';
import { Box, Button, Typography } from "@mui/material";
import TextInput from "shared-components/views/form/TextInput";
import api from "services/api";
import Loader from "shared-components/views/components/Loader";
import { capitalize } from "shared-components/utils/helpers";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

// toDO: Delete this page when it is no longer needed
const ScrapePortfolioData = () => {
  const [website, setWebsite] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    api.post('/scrape/portfolio', website, { 'Content-Type': 'text/plain' })
      .then((res) => {
        setData(res);
      })
      .finally(() => {
        setLoading(false);
      })
  }

  return (
    <CustomErrorBoundary>
      <Box display='flex' flexDirection='column' alignItems='flex-start' gap={2}>
        Parse company's website
        <Box>
          <TextInput value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder='Website'
            sx={{ width: 500 }}
          />
        </Box>
        <Button onClick={loadData}>Load</Button>
        {loading && <Loader />}
        <Typography><b>Company name</b>: {data?.name}</Typography>
        <Typography><b>Logo</b>: {data?.logo}</Typography>
        <Typography sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <b>Social media:</b>
          {data?.social && Object.keys(data.social).map(key => (
            <Typography key={key}>
              <b>{capitalize(key)}:</b> {data.social[key]}
            </Typography>
          ))}
        </Typography>
        <Typography><b>Description</b>: {data?.description}</Typography>
        <Typography><b>Mission</b>: {data?.mission}</Typography>
        <Typography><b>Headquarters</b>: {data?.address?.fullAddress}</Typography>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ScrapePortfolioData);
