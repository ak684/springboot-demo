import React, { memo, useEffect, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { nullMonthsToEmptyStrings, yearTotal } from "shared-components/utils/quantification";
import { GLOBAL_COMMUNITY_INPUT } from "shared-components/utils/constants";
import { clone } from "shared-components/utils/lo";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import roundedNumber from "shared-components/filters/roundedNumber";

const clearIds = (data) => data.map(el => ({
  ...el,
  id: null,
}))

const QuantificationCopyDataModal = (
  { impact, values, setFieldValue, setYearlyValues, copyProp, compareProp, data, isForecast = true }
) => {
  const [otherImpact, setOtherImpact] = useState(null);
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  const onClose = () => {
    setFieldValue(copyProp + 'Copied', true);
    setOtherImpact(null);
  }

  useEffect(() => {
    if (!values[copyProp + 'Copied'] && !impact[copyProp].some(val => yearTotal(val) > 0)) {
      const otherImpact = venture.impacts
        .filter(i => i.id !== impact.id)
        .filter(i => i[compareProp] === impact[compareProp])
        .filter(i => i[compareProp]?.length > 0)
        .filter(i => i[compareProp] !== GLOBAL_COMMUNITY_INPUT)
        .find(i => i[copyProp].some(val => yearTotal(val) > 0));
      setOtherImpact(otherImpact);
    }
  }, []);

  const copyDataFromOtherImpact = () => {
    const updatedValues = clone(values[copyProp]);
    const newValues = otherImpact[copyProp];

    newValues.forEach(val => {
      const index = updatedValues.findIndex(uv => uv.year === val.year);
      if (index > -1) {
        updatedValues[index] = clearIds(nullMonthsToEmptyStrings([val]))[0];
      }
    });

    setFieldValue(copyProp, updatedValues);
    setFieldValue(copyProp + 'Copied', true);
    setYearlyValues(updatedValues.map(val => values.impactCalculationTotal
      ? roundedNumber(yearTotal(val) / 12)
      : yearTotal(val)
      ));
    onClose();
  }

  return (
    <Modal
      open={!!otherImpact}
      onClose={onClose}
      title='Populate data'
      actions={
        <ModalActions
          onClose={onClose}
          submitForm={copyDataFromOtherImpact}
          submitTitle={isForecast ? 'Copy forecast' : 'Copy actual'}
        />
      }
    >
      <Box display='flex' gap={1}>
        <ContentCopyIcon />
        <Box>
          <Typography variant='body' sx={{ mb: 2 }}>
            This impact chain has the same {data} as {otherImpact?.name}.
          </Typography>
          <Typography variant='bodyBold'>
            Do you want to copy your {isForecast ? 'forecast' : 'actual data'} from it?
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default memo(QuantificationCopyDataModal);
