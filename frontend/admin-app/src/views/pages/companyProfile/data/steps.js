import CompanyProfileTextInput from '../components/CompanyProfileTextInput';
import CompanyProfileLegalEntityInput from '../components/CompanyProfileLegalEntityInput';
import CompanyProfileGeographyInput from '../components/CompanyProfileGeographyInput';
import CompanyProfileAddressInput from '../components/CompanyProfileAddressInput';
import CompanyProfileFormationDateInput from '../components/CompanyProfileFormationDateInput';
import CompanyProfileSocialInput from '../components/CompanyProfileSocialInput';
import CompanyProfileSelect from '../components/CompanyProfileSelect';
import CompanyProfileHashtags from '../components/CompanyProfileHashtags';
import CompanyProfileIndustrySelect from '../components/CompanyProfileIndustrySelect';
import CompanyProfileCurrencyInput from "../components/CompanyProfileCurrencyInput";
import CompanyProfileLogoInput from "../components/CompanyProfileLogoInput";
import CompanyProfileTeamInput from "../components/CompanyProfileTeamInput";
import CompanyProfileAccelerationInput from "../components/CompanyProfileAccelerationInput";
import CompanyProfileFundingInput from "../components/CompanyProfileFundingInput";
import CompanyProfileAwardsInput from "../components/CompanyProfileAwardsInput";
import { profitOrientationOptions } from "shared-components/utils/company";

export const getSteps = (legalEntityFormed) => () => {
  const result = [
    {
      name: 'name',
      component: CompanyProfileTextInput,
      props: {
        name: 'name',
        title: 'Please provide your venture\'s name below',
        subtitle: 'You can change it later if needed'
      }
    },
    {
      name: 'legalEntityFormed',
      component: CompanyProfileLegalEntityInput,
    },
  ];

  if (legalEntityFormed) {
    result.push(
      { name: 'formationDate', component: CompanyProfileFormationDateInput },
      {
        name: 'profitOrientation',
        component: CompanyProfileSelect,
        props: {
          name: 'profitOrientation',
          title: 'Type of legal entity?',
          subtitle: 'Is your venture a for profit, or non-profit organization?',
          items: profitOrientationOptions,
        }
      },
      {
        name: 'legalForm',
        component: CompanyProfileTextInput,
        props: {
          name: 'legalForm',
          title: 'Please specify below the exact legal form',
          subtitle: 'E.g. Corporation, Limited company etc.',
        }
      },
    );
  }

  result.push(
    {
      name: 'website',
      component: CompanyProfileTextInput,
      props: {
        name: 'website',
        title: 'Web address',
        subtitle: 'Please enter your organizaton\'s web address below',
      }
    },
    { name: 'social', component: CompanyProfileSocialInput },
    { name: 'logo', component: CompanyProfileLogoInput },
  );

  if (!legalEntityFormed) {
    result.push({ name: 'country', component: CompanyProfileGeographyInput });
  }

  if (legalEntityFormed) {
    result.push(
      { name: 'address', component: CompanyProfileAddressInput },
      {
        name: 'phone',
        component: CompanyProfileTextInput,
        props: {
          name: 'phone',
          title: 'Main contact phone number',
          subtitle: 'Under which phone number can your organization be reached?',
          placeholder: '+1 (585) 111-22-33'
        }
      },
      {
        name: 'employees',
        component: CompanyProfileTextInput,
        props: {
          name: 'employees',
          title: 'How many employees does your venture have?',
          type: 'number',
        }
      },
      {
        name: 'volunteers',
        component: CompanyProfileTextInput,
        props: {
          name: 'volunteers',
          title: 'How many volunteers does your venture have?',
          type: 'number',
        }
      },
    );
  }

  result.push(
    { name: 'team', component: CompanyProfileTeamInput },
    {
      name: 'reportingPeriod',
      component: CompanyProfileSelect,
      props: {
        name: 'reportingPeriod',
        title: 'When does your reporting year end?',
        subtitle: 'At the end of the following month:',
        items: [
          { name: 'january', title: 'January' },
          { name: 'february', title: 'February' },
          { name: 'march', title: 'March' },
          { name: 'april', title: 'April' },
          { name: 'may', title: 'May' },
          { name: 'june', title: 'June' },
          { name: 'july', title: 'July' },
          { name: 'august', title: 'August' },
          { name: 'september', title: 'September' },
          { name: 'october', title: 'October' },
          { name: 'november', title: 'November' },
          { name: 'december', title: 'December' },
        ],
      }
    },
    { name: 'currency', component: CompanyProfileCurrencyInput },
    { name: 'acceleration', component: CompanyProfileAccelerationInput },
    { name: 'awards', component: CompanyProfileAwardsInput },
    { name: 'funding', component: CompanyProfileFundingInput },
    { name: 'industries', component: CompanyProfileIndustrySelect },
    { name: 'hashtags', component: CompanyProfileHashtags },
    {
      name: 'description',
      component: CompanyProfileTextInput,
      props: {
        name: 'description',
        title: 'Please create 1 sentence claim, how your venture creates sustainability impact',
        last: true,
      }
    },
  );

  return result;
};
