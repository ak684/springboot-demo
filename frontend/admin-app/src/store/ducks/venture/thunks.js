import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import {
  addVenture,
  deleteAcceleration,
  deleteAward,
  deleteFundingRound,
  deleteTeamMember,
  insertAcceleration,
  insertAward,
  insertFundingRound,
  insertTeamMember,
  replaceAcceleration,
  replaceAward,
  replaceFundingRound,
  replaceImpact,
  replaceTeamMember,
  replaceVenture,
  replaceDetailedVenture,
  updateImpactOrder,
  updateIndicator
} from './slice';
import { downloadPdf } from "shared-components/utils/helpers";
import { clone } from 'shared-components/utils/lo';
import router from 'routes/router';
import { toast } from "react-toastify";
import { portfolioThunks } from "../portfolio";
import { IMPACT_SORT, VENTURE_ACCESS } from "shared-components/utils/constants";
import { userActions } from "../user";
import { getTeamAccessMap, NO_ACCESS } from "utils/team";

const fetchVentures = createAsyncThunk('venture/fetchList', async () => {
  return api.get('/ventures');
});

const fetchVenturesWithDetails = createAsyncThunk('venture/fetchListDetailed', async () => {
  return api.get('/ventures/details');
});

const acceptVentureInvitation = createAsyncThunk('venture/acceptInvitation', async (ventureId, { dispatch }) => {
  return api.put(`/ventures/invitations/${ventureId}/accept`)
    .then(() => {
      dispatch(fetchVenturesWithDetails());
    })
});

const declineVentureInvitation = createAsyncThunk('venture/declineInvitation', async (ventureId, { dispatch }) => {
  return api.put(`/ventures/invitations/${ventureId}/decline`)
    .then(() => {
      dispatch(fetchVenturesWithDetails());
    });
});

const createVenture = createAsyncThunk('venture/create', async ({ data, step }, { dispatch }) => {
  return api.post('/ventures', data)
    .then(res => {
      dispatch(addVenture(res));
      router.navigate(`/ventures/${res.id}/profile-wizard?step=${step}`);
      return res;
    });
});

const editVenture = createAsyncThunk('venture/edit', async ({ data, interim }, { dispatch }) => {
  return api.put(`/ventures/${data.id}`, data)
    .then(res => {
      if (!interim) {
        dispatch(replaceVenture(res));
        router.navigate(`/ventures/${res.id}/profile-wizard/finish`);
      }
      return res;
    });
});

const deleteVenture = createAsyncThunk('venture/delete', async (id, { dispatch }) => {
  return api.delete(`/ventures/${id}`)
    .then(res => {
      dispatch(fetchVentures());
      return res;
    });
});

const fetchCurrentVenture = createAsyncThunk('venture/fetchCurrent', async (id) => {
  return api.get(`/ventures/${id}`)
    .catch((err) => {
      if (err?.response?.status === 401) {
        router.navigate('/ventures');
        localStorage.removeItem('currentVenture');
      }
    });
});

const fetchVenturesAccess = createAsyncThunk('venture/fetchAccess', async () => {
  return api.get(`/ventures/access`);
});

const createEditImpact = createAsyncThunk('venture/impact/create', async ({ impact, interim }, { getState }) => {
  const ventureId = getState().venture.current.data.id;

  const request = impact.id ?
    api.put(`/ventures/${ventureId}/impacts/${impact.id}`, impact) :
    api.post(`/ventures/${ventureId}/impacts`, impact);
  return request
    .then((res) => {
      if (!interim) {
        router.navigate(`/ventures/${ventureId}/impacts/${res.id}/finish`);
      }
      return res;
    });
});

const quantifyImpact = createAsyncThunk('venture/impact/quantify', async ({ impact, callback, interim }, {
  dispatch,
  getState
}) => {
  const ventureId = getState().venture.current.data.id;

  return api.put(`/ventures/${ventureId}/impacts/${impact.id}/quantify`, impact)
    .then((res) => {
      // Trigger aggregated indicator recalculation for all portfolios containing this venture
      if (!interim) {
        // Fire and forget - we don't wait for this to complete
        api.post(`/ventures/${ventureId}/aggregated/recalculate`)
          .catch(err => {
            console.log('Aggregated indicator recalculation failed:', err);
            // Don't break the flow - this is non-critical
          });
      }
      
      if (callback && !interim) {
        callback();
      } else if (interim) {
        dispatch(replaceImpact({ impactId: res.id, data: res }))
      }
      return res;
    });
});

const createImpactInline = createAsyncThunk('venture/impact/createInline', async (positive, { getState, dispatch }) => {
  const ventureId = getState().venture.current.data.id;

  api.post(`/ventures/${ventureId}/impacts`, { name: 'New impact', positive, indicators: [] })
    .then(() => {
      dispatch(fetchCurrentVenture(ventureId));
    });
});

const cloneImpact = createAsyncThunk('venture/impact/clone', async (impact, { getState, dispatch }) => {
  const ventureId = getState().venture.current.data.id;
  const body = clone(impact);
  body.id = null;
  body.productsData.forEach(d => d.id = null);
  body.productsDataActual.forEach(d => d.id = null);
  body.stakeholdersData.forEach(d => d.id = null);
  body.stakeholdersDataActual.forEach(d => d.id = null);
  body.indicators.forEach(i => i.id = null);

  api.post(`/ventures/${ventureId}/impacts`, body)
    .then(() => {
      dispatch(fetchCurrentVenture(ventureId));
    });
});

const updateImpactField = createAsyncThunk('venture/impact/updateField', async ({
                                                                                  impactId,
                                                                                  field,
                                                                                  value,
                                                                                  indicatorId
                                                                                }, { dispatch, getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.put(`/ventures/${ventureId}/impacts/${impactId}/field`, { field, value, indicatorId })
    .then((res) => {
      dispatch(replaceImpact({ impactId, data: res }));
      return res;
    });
});

const changeImpactOrder = createAsyncThunk('venture/impact/changeOrder', async ({ from, to }, {
  dispatch,
  getState
}) => {
  const ventureId = getState().venture.current.data.id;
  dispatch(updateImpactOrder({ from, to }));
  return api.put(`/ventures/${ventureId}/impacts/order`, { from, to });
});

const deleteImpact = createAsyncThunk('venture/impact/delete', async (impact, { getState, dispatch }) => {
  const ventureId = getState().venture.current.data.id;

  return api.delete(`/ventures/${ventureId}/impacts/${impact.id}`)
    .then(() => {
      dispatch(fetchCurrentVenture(ventureId));
    });
});

const toggleImpactDraft = createAsyncThunk('venture/impact/toggleDraft', async (impact, { getState, dispatch }) => {
  const ventureId = getState().venture.current.data.id;

  return api.put(`/ventures/${ventureId}/impacts/${impact.id}/draft`, !impact.draft)
    .then(() => {
      dispatch(fetchCurrentVenture(ventureId));
    });
});

const exportImpacts = createAsyncThunk('venture/impacts/pdf', async (collapsed, { getState }) => {
  const ventureId = getState().venture.current.data.id;

  const body = {
    sort: getState().app.impactSort || IMPACT_SORT.BY_SCORE,
    filter: getState().app.impactFilter,
    hide: collapsed,
  };

  return api.post(`/reports/ventures/${ventureId}/impacts`, body, {}, { responseType: 'arraybuffer' })
    .then(response => {
      downloadPdf(response);
    });
});

const exportFiveDimensions = createAsyncThunk('venture/impacts/pdf',
  async ({ collapsed, collapsedImpacts }, { getState }) => {
    const ventureId = getState().venture.current.data.id;

    const body = {
      sort: getState().app.impactSort,
      hide: collapsed,
      hideImpacts: collapsedImpacts
    };

    return api.post(`/reports/ventures/${ventureId}/five-dimensions`, body, {}, { responseType: 'arraybuffer' })
      .then(response => {
        downloadPdf(response);
      });
  });

const addIndicator = createAsyncThunk('venture/impact/addIndicator',
  async ({ impactId, data }, { dispatch, getState }) => {
    const ventureId = getState().venture.current.data.id;
    return api.post(`/ventures/${ventureId}/impacts/${impactId}/indicators`, data)
      .then((res) => {
        dispatch(replaceImpact({ impactId, data: res }));
        return res;
      });
  });

const editIndicator = createAsyncThunk('venture/editIndicator',
  async ({ indicator, data }, { dispatch, getState }) => {
    const ventureId = getState().venture.current.data.id;
    return api.put(`/ventures/${ventureId}/indicators/${indicator.id}`, data)
      .then((res) => {
        dispatch(updateIndicator({ impactId: res.id, indicator: { ...data, id: indicator.id } }));
        
        // Trigger aggregated indicator recalculation for all portfolios containing this venture
        api.post(`/ventures/${ventureId}/aggregated/recalculate`)
          .catch(err => {
            console.log('Aggregated indicator recalculation failed:', err);
            // Don't break the flow - this is non-critical
          });
        
        return res;
      });
  });

const deleteIndicator = createAsyncThunk('venture/deleteIndicator', async (indicator, { dispatch, getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.delete(`/ventures/${ventureId}/indicators/${indicator.id}`)
    .then((res) => {
      dispatch(replaceImpact({ impactId: res.id, data: res }));
      return res;
    });
});

const inviteUser = createAsyncThunk('venture/inviteUser', (data, { dispatch }) => {
  const body = clone(data);
  delete body.ventureAccessMap;
  delete body.portfolioAccessMap;
  delete body.companyAccessMap;
  body.ventures = Object.keys(data.ventureAccessMap || {})
    .filter(key => [VENTURE_ACCESS.EDIT, VENTURE_ACCESS.VIEW].includes(data.ventureAccessMap[key].access))
    .map(key => ({ venture: { id: key }, access: data.ventureAccessMap[key].access }));
  body.portfolios = Object.keys(data.portfolioAccessMap || {})
    .filter(key => [VENTURE_ACCESS.EDIT, VENTURE_ACCESS.VIEW].includes(data.portfolioAccessMap[key].access))
    .map(key => ({ portfolio: { id: key }, access: data.portfolioAccessMap[key].access }));
  body.companies = Object.keys(data.companyAccessMap || {})
    .filter(key => data.companyAccessMap[key].access === VENTURE_ACCESS.PUBLIC_PROFILE_ONLY)
    .map(key => ({ companyId: Number(key), access: data.companyAccessMap[key].access }));

  return api.post('/ventures/invite', body)
    .then(res => {
      dispatch(fetchVenturesWithDetails());
      dispatch(portfolioThunks.fetchPortfoliosWithDetails());
      return res;
    });
});

const updateUserAccess = createAsyncThunk(
  'venture/updateUserAccess',
  ({ user, allVentures, ventureAccessMap, allPortfolios, portfolioAccessMap }, { dispatch }) => {
    const existingVentureMap = getTeamAccessMap(allVentures, user);
    const existingPortfolioMap = getTeamAccessMap(allPortfolios, user);

    const addedVentures = [];
    const removedVentures = [];

    Object.keys(existingVentureMap).forEach(key => {
      if (existingVentureMap[key].access !== ventureAccessMap[key].access) {
        if (existingVentureMap[key].access === NO_ACCESS) {
          addedVentures.push({ ...ventureAccessMap[key], venture: { id: key } });
        } else {
          removedVentures.push({ ...ventureAccessMap[key], venture: { id: key }, access: null });
        }
      }
    });

    const addedPortfolios = [];
    const removedPortfolios = [];

    Object.keys(existingPortfolioMap).forEach(key => {
      if (existingPortfolioMap[key].access !== portfolioAccessMap[key].access) {
        if (existingPortfolioMap[key].access === NO_ACCESS) {
          addedPortfolios.push({ ...portfolioAccessMap[key], portfolio: { id: key } });
        } else {
          removedPortfolios.push({ ...portfolioAccessMap[key], portfolio: { id: key }, access: null });
        }
      }
    });

    const body = {
      email: user.email,
      addedVentures,
      removedVentures,
      addedPortfolios,
      removedPortfolios
    };

    return api.put('/ventures/access', body)
      .then(res => {
        dispatch(fetchVenturesWithDetails());
        dispatch(portfolioThunks.fetchPortfoliosWithDetails());
        return res;
      });
  });

const addTeamMember = createAsyncThunk('venture/addTeamMember', ({ ventureId, data }, { dispatch }) => {
  return api.post(`/ventures/${ventureId}/team`, data)
    .then(res => {
      dispatch(insertTeamMember(res));
      return res;
    });
});

const editTeamMember = createAsyncThunk('venture/editTeamMember', ({ ventureId, data }, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/team/${data.id}`, data)
    .then(res => {
      dispatch(replaceTeamMember(res));
      return res;
    });
});

const removeTeamMember = createAsyncThunk('venture/removeTeamMember', ({ ventureId, data }, { dispatch }) => {
  return api.delete(`/ventures/${ventureId}/team/${data.id}`)
    .then(() => {
      dispatch(deleteTeamMember(data));
    });
});

const updateTeamMembersOrder = createAsyncThunk('venture/updateTeamMembersOrder', ({
                                                                                     ventureId,
                                                                                     data
                                                                                   }, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/team/order`, data);
});

const addAcceleration = createAsyncThunk('venture/addAcceleration', ({ ventureId, data }, { dispatch }) => {
  return api.post(`/ventures/${ventureId}/acceleration`, data)
    .then(res => {
      dispatch(insertAcceleration(res));
      return res;
    });
});

const searchAccelerations = createAsyncThunk('venture/searchAccelerations', (search, { dispatch }) => {
  return api.get(`/ventures/acceleration/search?search=${search}`);
});

const editAcceleration = createAsyncThunk('venture/editAcceleration', ({ ventureId, data }, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/acceleration/${data.id}`, data)
    .then(res => {
      dispatch(replaceAcceleration(res));
      return res;
    });
});

const removeAcceleration = createAsyncThunk('venture/removeAcceleration', ({ ventureId, data }, { dispatch }) => {
  return api.delete(`/ventures/${ventureId}/acceleration/${data.id}`)
    .then(() => {
      dispatch(deleteAcceleration(data));
    });
});

const addFundingRound = createAsyncThunk('venture/addFunding', ({ ventureId, data }, { dispatch }) => {
  return api.post(`/ventures/${ventureId}/funding`, data)
    .then(res => {
      dispatch(insertFundingRound(res));
      return res;
    });
});

const editFundingRound = createAsyncThunk('venture/editFunding', ({ ventureId, data }, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/funding/${data.id}`, data)
    .then(res => {
      dispatch(replaceFundingRound(res));
      return res;
    });
});

const removeFundingRound = createAsyncThunk('venture/removeFunding', ({ ventureId, data }, { dispatch }) => {
  return api.delete(`/ventures/${ventureId}/funding/${data.id}`)
    .then(() => {
      dispatch(deleteFundingRound(data));
    });
});

const addAward = createAsyncThunk('venture/addAward', ({ ventureId, data }, { dispatch }) => {
  return api.post(`/ventures/${ventureId}/awards`, data)
    .then(res => {
      dispatch(insertAward(res));
      return res;
    });
});

const editAward = createAsyncThunk('venture/editAward', ({ ventureId, data }, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/awards/${data.id}`, data)
    .then(res => {
      dispatch(replaceAward(res));
      return res;
    });
});

const removeAward = createAsyncThunk('venture/removeAward', ({ ventureId, data }, { dispatch }) => {
  return api.delete(`/ventures/${ventureId}/awards/${data.id}`)
    .then(() => {
      dispatch(deleteAward(data));
    });
});

const unlinkVentureFromPortfolio = createAsyncThunk('venture/unlinkVenture', async ({
                                                                                      portfolioId,
                                                                                      ventureId
                                                                                    }, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/portfolios/${portfolioId}/unlink`)
    .then(() => {
      toast.success('Venture has been successfully unlinked from portfolio');
    });
});

const toggleMarkVentureDraft = createAsyncThunk('venture/toggleDraft', (ventureId, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/draft`)
    .then(() => {
      dispatch(userActions.toggleVentureDraft(ventureId));
    });
});

const activateVenture = createAsyncThunk('venture/activate', (ventureId, { dispatch }) => {
  return api.put(`/ventures/${ventureId}/activate`)
    .then((res) => {
      dispatch(replaceDetailedVenture(res));
    });
});

const fetchPublicVentures = createAsyncThunk('venture/fetchPublicList', (days = 7) => {
  return api.get(`/public/ventures?days=${days}`);
});

const aiScoreImpacts = createAsyncThunk('venture/aiScoreImpacts', ({ ventureId, impacts }) => {
  return api.post(`/ai-toc/${ventureId}/score`, impacts);
});

export default {
  fetchVentures,
  fetchVenturesWithDetails,
  acceptVentureInvitation,
  declineVentureInvitation,
  createVenture,
  editVenture,
  deleteVenture,
  fetchCurrentVenture,
  fetchVenturesAccess,
  createEditImpact,
  quantifyImpact,
  createImpactInline,
  cloneImpact,
  updateImpactField,
  changeImpactOrder,
  deleteImpact,
  toggleImpactDraft,
  exportImpacts,
  exportFiveDimensions,
  addIndicator,
  editIndicator,
  deleteIndicator,
  inviteUser,
  updateUserAccess,
  addTeamMember,
  editTeamMember,
  removeTeamMember,
  updateTeamMembersOrder,
  addAcceleration,
  editAcceleration,
  removeAcceleration,
  searchAccelerations,
  addFundingRound,
  editFundingRound,
  removeFundingRound,
  addAward,
  editAward,
  removeAward,
  unlinkVentureFromPortfolio,
  toggleMarkVentureDraft,
  activateVenture,
  fetchPublicVentures,
  aiScoreImpacts,
};
