import React from "react";
import QuantificationProductsInput from "../components/QuantificationProductsInput";
import QuantificationDropoffInput from "../components/QuantificationDropoffInput";
import QuantificationAttributionInput from "../components/QuantificationAttributionInput";
import QuantificationDisplacementInput from "../components/QuantificationDisplacementInput";
import QuantificationDeadweightInput from "../components/QuantificationDeadweightInput";
import QuantificationDurationInput from "../components/QuantificationDurationInput";
import QuantificationPrePostInput from "../components/QuantificationPrePostInput";
import QuantificationStakeholdersInput from "../components/QuantificationStakeholdersInput";

export const getSteps = (impact) => () => {
  const result = [
    { name: 'products', component: QuantificationProductsInput },
    { name: 'stakeholders', component: QuantificationStakeholdersInput },
  ];

  impact.indicators.forEach((indicator, index) => {
    result.push(
      { name: `indicators[${index}].prepost`, component: QuantificationPrePostInput, props: { indicator, index } },
      { name: `indicators[${index}].duration`, component: QuantificationDurationInput, props: { indicator, index } },
      {
        name: `indicators[${index}].deadweight`,
        component: QuantificationDeadweightInput,
        props: { indicator, index }
      },
      {
        name: `indicators[${index}].displacement`,
        component: QuantificationDisplacementInput,
        props: { indicator, index }
      },
      {
        name: `indicators[${index}].attribution`,
        component: QuantificationAttributionInput,
        props: { indicator, index }
      },
      { name: `indicators[${index}].dropoff`, component: QuantificationDropoffInput, props: { indicator, index } },
    )
  });

  return result;
};
