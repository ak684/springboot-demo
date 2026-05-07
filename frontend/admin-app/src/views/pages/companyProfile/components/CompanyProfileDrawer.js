import React, { Fragment, memo } from 'react';
import { Box, Drawer, styled, Toolbar } from '@mui/material';
import StepperDivider from 'views/common/stepper/StepperDivider';
import StepperDrawerItem from 'views/common/stepper/StepperDrawerItem';
import { HEADER_HEIGHT, socialMedia } from "shared-components/utils/constants";
import { ReactComponent as ActivitiesIcon } from 'theme/icons/venture/activities.svg';
import { ReactComponent as ImpactAccountingIcon } from 'theme/icons/venture/impact-accounting.svg';
import { ReactComponent as IndustryIcon } from 'theme/icons/venture/industry.svg';
import { ReactComponent as InternetIcon } from 'theme/icons/venture/internet.svg';
import { ReactComponent as LocationIcon } from 'theme/icons/venture/location.svg';
import { ReactComponent as StageIcon } from 'theme/icons/venture/stage.svg';
import { ReactComponent as FinanceIcon } from 'theme/icons/venture/finance.svg';
import { ReactComponent as VentureIcon } from 'theme/icons/venture/venture.svg';
import { isDefined } from "shared-components/utils/lo";
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
    label: 'Venture formation',
    icon: VentureIcon,
    items: [
      { name: 'name', label: 'Company name', onClick: () => goToStep('name'), completed: !!values.name },
      {
        name: 'legalEntityFormed',
        label: 'Legal entity formed',
        onClick: () => goToStep('legalEntityFormed'),
        completed: isDefined(values.legalEntityFormed)
      },
      {
        name: 'formationDate',
        label: 'Venture formation date',
        skip: !values.legalEntityFormed,
        onClick: () => goToStep('formationDate'),
        completed: !!values.formationDate,
      },
      {
        name: 'profitOrientation',
        label: 'Type of legal entity',
        skip: !values.legalEntityFormed,
        onClick: () => goToStep('profitOrientation'),
        completed: !!values.profitOrientation,
      },
      {
        name: 'legalForm',
        label: 'Legal form',
        skip: !values.legalEntityFormed,
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
        name: 'country',
        label: 'Country',
        onClick: () => goToStep('country'),
        completed: !!values.country,
        skip: values.legalEntityFormed,
      },
      {
        name: 'address',
        label: 'Address',
        skip: !values.legalEntityFormed,
        onClick: () => goToStep('address'),
        completed: values.address || values.city || values.region || values.zipCode,
      },
      {
        name: 'phone',
        label: 'Contact phone',
        skip: !values.legalEntityFormed,
        onClick: () => goToStep('phone'),
        completed: !!values.phone,
      },
    ],
  },
  {
    label: 'Personnel',
    icon: StageIcon,
    skip: !values.legalEntityFormed,
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
    label: 'Impact enablers',
    icon: FinanceIcon,
    items: [
      {
        name: 'acceleration',
        label: 'Acceleration',
        onClick: () => goToStep('acceleration'),
        completed: values.acceleration.length > 0,
      },
      {
        name: 'awards',
        label: 'Awards',
        onClick: () => goToStep('awards'),
        completed: values.awards.length > 0,
      },
      {
        name: 'funding',
        label: 'Funding sources',
        onClick: () => goToStep('funding'),
        completed: values.funding.length > 0,
      }
    ]
  },
  {
    label: 'Industry sector',
    icon: IndustryIcon,
    items: [
      { name: 'industries', label: 'Industry', completed: values.industries.length > 0 },
    ],
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
    ]
  },
];

const CompanyProfileDrawer = ({ values, stepName, goToStep }) => {
  const items = getItems(values, goToStep).filter(i => !i.skip);

  return (
    <StyledDrawer variant='permanent' open>
      <CustomErrorBoundary>
        <Toolbar sx={{ height: HEADER_HEIGHT }} />
        <Box p={4}>
          {items.map((i, index) => (
            <Fragment key={i.label}>
              <StepperDrawerItem
                primary={i.label}
                secondary={i.secondary}
                onClick={() => goToStep(i.items.filter(item => !item.skip)[0].name)}
                active={i.items.some(item => item.name === stepName)}
                filled={items.findIndex(item => item.items.some(subitem => subitem.name === stepName)) > index}
                icon={i.icon}
                items={i.items.filter(item => !item.skip)}
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

export default memo(CompanyProfileDrawer);
