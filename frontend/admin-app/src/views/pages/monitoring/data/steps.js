import React from "react";
import MonitoringProductsInput from "../components/MonitoringProductsInput";
import MonitoringStakeholdersInput from "../components/MonitoringStakeholdersInput";
import MonitoringPrePostInput from "../components/MonitoringPrePostInput";

export const getSteps = (impact) => () => {
  const result = [
    { name: 'products', component: MonitoringProductsInput },
    { name: 'stakeholders', component: MonitoringStakeholdersInput },
  ];

  impact.indicators.forEach((indicator, index) => {
    result.push(
      { name: `indicators[${index}].prepost`, component: MonitoringPrePostInput, props: { indicator, index } },
    )
  });

  return result;
};
