import React, { Fragment, memo } from 'react';
import { Box, Divider, Drawer, styled, Toolbar, useTheme } from '@mui/material';
import StepperDivider from 'views/common/stepper/StepperDivider';
import StepperDrawerItem from 'views/common/stepper/StepperDrawerItem';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { ReactComponent as StatusQuoIcon } from 'theme/icons/statusQuo.svg';
import { ReactComponent as InnovationIcon } from 'theme/icons/innovation.svg';
import { ReactComponent as BeneficiaryIcon } from 'theme/icons/beneficiary.svg';
import { ReactComponent as ChangeIcon } from 'theme/icons/change.svg';
import { ReactComponent as OutputUnitsIcon } from 'theme/icons/outputUnits.svg';
import { ReactComponent as IndicatorIcon } from 'theme/icons/indicator.svg';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { getTypography } from "shared-components/utils/typography";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(60),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(60),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const StyledImpactTypeIcon = styled(FiberManualRecordIcon, { shouldForwardProp: prop => prop !== 'positive' })
(({ theme, positive }) => ({
  position: 'absolute',
  top: 9,
  left: 8,
  width: theme.spacing(2),
  height: theme.spacing(2),
  color: positive ? theme.palette.success.main : theme.palette.error.main,
}));

const getItems = (values) => [
  { name: 'statusQuo', label: 'Status quo', secondary: values.statusQuo, icon: StatusQuoIcon },
  { name: 'innovation', label: 'Innovation', secondary: values.innovation, icon: InnovationIcon },
  { name: 'stakeholders', label: 'Stakeholder', secondary: values.stakeholders, icon: BeneficiaryIcon },
  {
    name: 'change',
    label: values.positive ? 'Change (impact)' : 'Change (negative impact)',
    secondary: values.change,
    icon: ChangeIcon
  },
  { name: 'outputUnits', label: 'Products/services/activities', secondary: values.outputUnits, icon: OutputUnitsIcon },
];

const ImpactDrawer = ({ values, stepName, goToStep, setFieldValue }) => {
  const theme = useTheme();
  const items = getItems(values);

  const removeIndicator = (indicator) => {
    const updatedIndicators = values.indicators.filter(i => i.name !== indicator.name);

    if (updatedIndicators.length === 0) {
      updatedIndicators.push({ name: '', year: '' });
    }

    setFieldValue('indicators', updatedIndicators);
    goToStep('indicators[0].name');
  };

  return (
    <StyledDrawer variant='permanent' open>
      <Toolbar sx={{ height: HEADER_HEIGHT }} />
      <CustomErrorBoundary>
        <Box p={4}>
          <Box position='relative'>
            <FormikTextInput
              name='name'
              placeholder='Title'
              inputProps={{ maxLength: 60, style: { paddingLeft: theme.spacing(4), ...getTypography('h5') } }}
              InputProps={{ disableUnderline: true }}
              InputLabelProps={{ style: { ...getTypography('h5') } }}
              disableError
              fullWidth
              multiline
            />
            <StyledImpactTypeIcon positive={values.positive} />
          </Box>
          <Divider sx={{ my: 2 }} />
          {items.map((i, index) => (
            <Fragment key={i.name}>
              <StepperDrawerItem
                primary={i.label}
                secondary={i.secondary}
                onClick={() => goToStep(i.name)}
                active={stepName === i.name}
                filled={stepName !== i.name && i.secondary}
                icon={i.icon}
              />
              {(index < items.length - 1 || values.indicators.length > 0) && <StepperDivider />}
            </Fragment>
          ))}
          {values.indicators.map((i, index) => (
            <Fragment key={`indicators-${index}`}>
              <StepperDrawerItem
                primary={`Indicator ${index + 1}${values.indicators[index].year ? ' - ' + values.indicators[index].year : ''}`}
                secondary={i.name}
                onClick={() => goToStep(`indicators[${index}].name`)}
                active={[`indicators[${index}].name`, `indicators[${index}].year`].includes(stepName)}
                filled={i.name}
                icon={IndicatorIcon}
                onDelete={i.name || index > 0 ? () => removeIndicator(i) : null}
              />
              {index < values.indicators.length - 1 && <StepperDivider />}
            </Fragment>
          ))}
        </Box>
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

export default memo(ImpactDrawer);
