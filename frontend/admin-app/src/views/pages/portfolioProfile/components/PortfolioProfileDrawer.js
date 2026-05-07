import React, { Fragment, memo } from 'react';
import { Box, Drawer, styled, Toolbar } from '@mui/material';
import StepperDivider from 'views/common/stepper/StepperDivider';
import StepperDrawerItem from 'views/common/stepper/StepperDrawerItem';
import { HEADER_HEIGHT, socialMedia } from "shared-components/utils/constants";
import { ReactComponent as InternetIcon } from 'theme/icons/venture/internet.svg';
import { ReactComponent as LocationIcon } from 'theme/icons/venture/location.svg';
import { ReactComponent as StageIcon } from 'theme/icons/venture/stage.svg';
import { ReactComponent as VentureIcon } from 'theme/icons/venture/venture.svg';
import { ReactComponent as ImpactAccountingIcon } from 'theme/icons/venture/impact-accounting.svg';
import { ReactComponent as ActivitiesIcon } from 'theme/icons/venture/activities.svg';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(46),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(46),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const getItems = (values, goToStep) => [
  {
    label: 'Portfolio formation',
    icon: VentureIcon,
    items: [
      { name: 'name', label: 'Company name', onClick: () => goToStep('name'), completed: !!values.name },
      {
        name: 'formationDate',
        label: 'Portfolio formation date',
        onClick: () => goToStep('formationDate'),
        completed: !!values.formationDate,
      },
      {
        name: 'profitOrientation',
        label: 'Type of legal entity',
        onClick: () => goToStep('profitOrientation'),
        completed: !!values.profitOrientation,
      },
      {
        name: 'legalForm',
        label: 'Legal form',
        onClick: () => goToStep('legalForm'),
        completed: !!values.legalForm,
      },
    ]
  },
  {
    label: 'Internet presence',
    icon: InternetIcon,
    items: [
      {
        name: 'website',
        label: 'Website',
        onClick: () => goToStep('website'),
        completed: !!values.website,
      },
      {
        name: 'social',
        label: 'Social media',
        onClick: () => goToStep('social'),
        completed: Object.keys(socialMedia).some(m => !!values[m]),
      },
      {
        name: 'logo',
        label: 'Company logo',
        onClick: () => goToStep('logo'),
        completed: !!values.logo,
      },
    ]
  },
  {
    label: 'Location',
    icon: LocationIcon,
    items: [
      {
        name: 'address',
        label: 'Address',
        onClick: () => goToStep('address'),
        completed: values.address || values.city || values.region || values.zipCode,
      },
      {
        name: 'phone',
        label: 'Contact phone',
        onClick: () => goToStep('phone'),
        completed: !!values.phone,
      },
    ],
  },
  {
    label: 'Personnel',
    icon: StageIcon,
    items: [
      {
        name: 'employees',
        label: 'Number of employees',
        onClick: () => goToStep('employees'),
        completed: values.employees >= 0,
      },
      {
        name: 'volunteers',
        label: 'Number of volunteers',
        onClick: () => goToStep('volunteers'),
        completed: values.volunteers >= 0,
      },
      {
        name: 'team',
        label: 'Key employees',
        onClick: () => goToStep('team'),
        completed: values.team.length >= 0,
      }
    ]
  },
  {
    label: 'Impact accounting',
    icon: ImpactAccountingIcon,
    items: [
      { name: 'reportingPeriod', label: 'Reporting period', completed: !!values.reportingPeriod },
      { name: 'currency', label: 'Currency', onClick: () => goToStep('currency'), completed: !!values.currency },
    ]
  },
  {
    label: 'Activities and description',
    icon: ActivitiesIcon,
    items: [
      {
        name: 'hashtags',
        label: 'Hashtags',
        onClick: () => goToStep('hashtags'),
        completed: values.hashtags.length > 0 && values.hashtags[0].length > 0,
      },
      {
        name: 'description',
        label: 'Impact claim',
        onClick: () => goToStep('description'),
        completed: !!values.description,
      },
      {
        name: 'mission',
        label: 'Mission',
        onClick: () => goToStep('mission'),
        completed: !!values.mission,
      },
    ]
  },
];

const PortfolioProfileDrawer = ({ values, stepName, goToStep }) => {
  const items = getItems(values, goToStep);

  return (
    <StyledDrawer variant='permanent' open>
      <Toolbar sx={{ height: HEADER_HEIGHT }} />
      <CustomErrorBoundary>
        <Box p={4}>
          {items.map((i, index) => (
            <Fragment key={i.label}>
              <StepperDrawerItem
                primary={i.label}
                secondary={i.secondary}
                onClick={() => goToStep(i.items[0].name)}
                active={i.items.some(item => item.name === stepName)}
                filled={items.findIndex(item => item.items.some(subitem => subitem.name === stepName)) > index}
                icon={i.icon}
                items={i.items}
                activeItem={stepName}
              />
              {index < items.length - 1 && <StepperDivider />}
            </Fragment>
          ))}
        </Box>
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

export default memo(PortfolioProfileDrawer);
