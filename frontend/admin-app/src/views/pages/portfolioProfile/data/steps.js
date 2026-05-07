import { profitOrientationOptions } from "shared-components/utils/company";
import CompanyProfileTextInput from "../../companyProfile/components/CompanyProfileTextInput";
import CompanyProfileFormationDateInput from "../../companyProfile/components/CompanyProfileFormationDateInput";
import CompanyProfileSelect from "../../companyProfile/components/CompanyProfileSelect";
import CompanyProfileSocialInput from "../../companyProfile/components/CompanyProfileSocialInput";
import CompanyProfileLogoInput from "../../companyProfile/components/CompanyProfileLogoInput";
import CompanyProfileAddressInput from "../../companyProfile/components/CompanyProfileAddressInput";
import CompanyProfileTeamInput from "../../companyProfile/components/CompanyProfileTeamInput";
import CompanyProfileCurrencyInput from "../../companyProfile/components/CompanyProfileCurrencyInput";
import CompanyProfileHashtags from "../../companyProfile/components/CompanyProfileHashtags";
import PortfolioProfileNameInput from "../components/PortfolioProfileNameInput";

export const getSteps = () => {
  const result = [
    { name: 'name', component: PortfolioProfileNameInput },
    { name: 'formationDate', component: CompanyProfileFormationDateInput },
    {
      name: 'profitOrientation',
      component: CompanyProfileSelect,
      props: {
        name: 'profitOrientation',
        title: 'Type of legal entity?',
        subtitle: 'Is your venture a for profit, or non-profit organization?',
        items: [...profitOrientationOptions, { name: 'no-entity', title: 'No legal entity' },],
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
        title: 'How many employees does your company have?',
        type: 'number',
      }
    },
    {
      name: 'volunteers',
      component: CompanyProfileTextInput,
      props: {
        name: 'volunteers',
        title: 'How many volunteers does your company have?',
        type: 'number',
      }
    },
  ];

  result.push(
    { name: 'team', component: CompanyProfileTeamInput, props: { isPortfolio: true } },
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
    { name: 'hashtags', component: CompanyProfileHashtags },
    {
      name: 'description',
      component: CompanyProfileTextInput,
      props: {
        name: 'description',
        title: 'Please create 1 sentence claim, how your company creates sustainability impact',
      }
    },
    {
      name: 'mission',
      component: CompanyProfileTextInput,
      props: {
        name: 'mission',
        title: 'Please provide your mission',
        last: true,
      }
    },
  );

  return result;
};
