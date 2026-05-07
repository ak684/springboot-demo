import React, { memo, useEffect, useState } from 'react';
import { Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import useChart from "shared-components/hooks/useChart";
import api from 'services/api';
import { clone, isDefined } from "shared-components/utils/lo";
import chartConfig from "./chart/barChart";

const getChartData = (potential) => {
  const config = clone(chartConfig);

  config.series[0].data = [
    potential.contribution,
    potential.degreeOfChange,
    potential.duration,
    potential.previousEvidence,
    potential.problemImportance,
    potential.proximity,
    potential.sizeOfStakeholders,
    potential.stakeholderSituation,
  ];

  return config;
}

// toDO: Delete this page when no longer needed
const ImpactPotential = () => {
  const [potential, setPotential] = useState();
  const { ventureId, impactId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const impact = venture.impacts.find(i => i.id === +impactId);

  useEffect(() => {
    api.get(`/scoring/improvement/${impactId}`).then(setPotential);
  }, []);

  useChart('improvement-potential-chart', getChartData, isDefined(potential), potential);

  return (
    <Box>
      <Typography variant='h5'>Impact: {impact.name}</Typography>
      <Box mt={2} py={2} id='improvement-potential-chart' height={500} />
    </Box>
  );
};

export default memo(ImpactPotential);
