const getPitchVenture = (uuid) => state => {
  if (state.pitch.venture.data?.pitchSettings.pitchId === uuid) {
    return state.pitch.venture.data;
  }
  return null;
};

const pitchVentureLoading = (uuid) => state => {
  return state.pitch.venture.isLoading || state.pitch.venture.data?.pitchSettings.pitchId !== uuid;
};

const gptTextLoading = () => state => state.pitch.gptText.isLoading;

const getIndicatorViews = () => state => state.pitch.indicatorViews.data;

export default {
  getPitchVenture,
  pitchVentureLoading,
  gptTextLoading,
  getIndicatorViews,
};
