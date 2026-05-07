const getGoals = () => state => state.dictionary.goals.data;
const getScoringQuestions = () => state => state.dictionary.scoring.data;
const getGeography = () => state => state.dictionary.geography.data;
const getIndustries = () => state => state.dictionary.industries.data;
const getUnits = () => state => state.dictionary.units.data;
const getFundingRoundTypes = () => state => state.dictionary.fundingRoundTypes.data;

export default {
  getGoals,
  getScoringQuestions,
  getGeography,
  getIndustries,
  getUnits,
  getFundingRoundTypes,
};
