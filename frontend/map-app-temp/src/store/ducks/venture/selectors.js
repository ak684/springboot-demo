import { VENTURE_ACCESS } from "shared-components/utils/constants";

const getCurrentVenture = (id) => state => {
  if (state.venture.current.data?.id === +id) {
    return state.venture.current.data;
  }
  return null;
};

const currentVentureLoading = (id) => state => {
  return state.venture.current.isLoading || state.venture.current.data?.id !== +id;
};

const getVentureAccess = () => () => VENTURE_ACCESS.VIEW;

const ventureAccessLoading = () => state => state.venture.access.isLoading;

const getPublicVentures = () => state => state.venture.publicList.data;
const publicVenturesLoading = () => state => state.venture.publicList.isLoading;

export default {
  getCurrentVenture,
  currentVentureLoading,
  getVentureAccess,
  ventureAccessLoading,
  getPublicVentures,
  publicVenturesLoading,
};
