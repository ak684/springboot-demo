import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { toast } from 'react-toastify';
import { replaceImpact } from '../venture/slice';
import { clone } from 'shared-components/utils/lo';
import router from 'routes/router';
import { getInitialScoringValues } from "shared-components/utils/scoring";

const showChangeMessage = (val = 0, newVal = 0, field, units = '') => {
  if (val === newVal || val === 0) {
    return;
  }

  const sign = val > newVal ? '-' : '+';
  toast.info(`${field} ${sign}${(Math.abs(newVal - val)).toFixed(1)}${units}`);
};

const fetchScoring = createAsyncThunk('scoring/fetchCurrent', ({ impactId, data, showDiff = false }, { getState }) => {
  const { magnitude, likelihood, score } = getState().scoring.current.data;
  return api.post(`/scoring/${impactId}`, data).then(res => {
    if (showDiff) {
      const { magnitude: newMagnitude, likelihood: newLikelihood, score: newScore } = res;
      showChangeMessage(magnitude, newMagnitude, 'Impact magnitude');
      showChangeMessage(likelihood, newLikelihood, 'Impact likelihood', '%');
    }

    return res;
  });
});

const scoreImpact = createAsyncThunk('scoring/create', async ({ impactId, data, interim, redirect = true }, {
  getState,
  dispatch
}) => {
  const ventureId = getState().venture.current.data.id;

  return api.post(`/ventures/${ventureId}/impacts/${impactId}/scoring`, data)
    .then((res) => {
      dispatch(replaceImpact({ impactId, data: res }));
      if (!interim && redirect) {
        router.navigate(`/ventures/${ventureId}/impacts/${impactId}/scoring/finish`);
      }
    });
});

const updateScoringField = createAsyncThunk('scoring/updateField',
  async ({ impactId, indicator, field, value, score = { indicatorScores: [] } }, { dispatch }) => {
    const data = clone(score);
    data.id = null;

    if (indicator) {
      const indicatorScore = data.indicatorScores?.find(is => is.indicator.id === indicator.id);
      if (indicatorScore) {
        indicatorScore[field] = value;
      } else {
        data.indicatorScores.push({
          indicator,
          [field]: value,
        });
      }
    } else {
      data[field] = value;
    }

    dispatch(scoreImpact({ impactId, data, redirect: false }));
  });

const updateIndicatorScoring = createAsyncThunk('scoring/updateValues', async ({ impact, indicator, noisiness, validation, questions }, {
  dispatch
}) => {
  const data = getInitialScoringValues(impact);
  const indicatorScore = data.indicatorScores.find(i => i.indicator?.id === indicator.id);

  if ((noisiness && indicatorScore.noisiness?.name !== noisiness) || (validation && indicatorScore.validation?.name !== validation)) {
    indicatorScore.noisiness = questions.noisiness.find(q => q.name === noisiness) || null;
    indicatorScore.validation = questions.validation.find(q => q.name === validation) || null;
    dispatch(scoreImpact({ impactId: impact.id, data, redirect: false }));
  }
});

export default {
  fetchScoring,
  scoreImpact,
  updateScoringField,
  updateIndicatorScoring,
};
