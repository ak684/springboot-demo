const getVentures = () => state => state.venture.list.data;
const venturesLoading = () => state => state.venture.list.isLoading;
const getDetailedVentures = () => state => state.venture.detailedList.data;
const detailedVenturesLoading = () => state => state.venture.detailedList.isLoading;
const getCurrentVenture = (id) => state => {
  if (state.venture.current.data?.id === +id) {
    return state.venture.current.data;
  }
  return null;
};

const getImpact = (impactId) => state => {
  return state.venture.current.data?.impacts.find(i => i.id === +impactId);
};

const currentVentureLoading = (id) => state => {
  return state.venture.current.isLoading || state.venture.current.data?.id !== +id;
};

const getVentureAccess = (id) => state => state.venture.access.data[id];

const ventureAccessLoading = () => state => state.venture.access.isLoading;

const getPublicVentures = () => state => state.venture.publicList.data;
const publicVenturesLoading = () => state => state.venture.publicList.isLoading;

export default {
  getVentures,
  venturesLoading,
  getDetailedVentures,
  detailedVenturesLoading,
  getCurrentVenture,
  getImpact,
  currentVentureLoading,
  getVentureAccess,
  ventureAccessLoading,
  getPublicVentures,
  publicVenturesLoading,
};
