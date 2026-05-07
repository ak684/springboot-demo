import React, { memo } from 'react';
import { Box, Divider, Typography } from "@mui/material";
import filters from "shared-components/filters";
import CertificationBadge from "../components/CertificationBadge";
import CertificationCard from "../components/CertificationCard";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CertificationVentureInfo = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  return (
    <CustomErrorBoundary>
      <CertificationCard sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Box flexGrow={1}>
          <Typography variant='h5' sx={{ mb: 0.5 }}>{venture.name}</Typography>
          <Typography variant='body'>Last updated: {filters.date(venture.lastModifiedAt)}</Typography>
          <Divider sx={{ my: 2 }} />
          {venture.description && <Typography variant='subtitle'>{venture.description}</Typography>}
          {/*{venture.certification >= 1 && (*/}
          {/*  <Box mt={2} display='flex' gap={1}>*/}
          {/*    <Button variant='outlined' endIcon={<KeyboardArrowDownOutlinedIcon />}>Download certificate</Button>*/}
          {/*    <Button variant='outlined' endIcon={<KeyboardArrowDownOutlinedIcon />}>Download badge</Button>*/}
          {/*  </Box>*/}
          {/*)}*/}
        </Box>
        <CertificationBadge venture={venture} />
      </CertificationCard>
    </CustomErrorBoundary>
  );
};

export default memo(CertificationVentureInfo);
