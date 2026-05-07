import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import {
  addPortfolio,
  deleteTeamMember,
  insertTeamMember,
  replacePortfolio,
  replaceTeamMember,
  toggleVentureHidden,
  toggleVenturePublicHidden,
} from './slice';
import router from 'routes/router';
import { toast } from "react-toastify";
import { publicProfileThunks } from "../publicProfile";

const fetchPortfolios = createAsyncThunk('portfolio/fetchList', async () => {
  return api.get('/portfolios');
});

const fetchPortfoliosWithDetails = createAsyncThunk('portfolio/fetchListDetailed', async () => {
  return api.get('/portfolios/details');
});

const acceptPortfolioInvitation = createAsyncThunk('portfolio/acceptInvitation', async (portfolioId, { dispatch }) => {
  return api.put(`/portfolios/invitations/${portfolioId}/accept`)
    .then(() => {
      dispatch(fetchPortfoliosWithDetails());
    })
});

const declinePortfolioInvitation = createAsyncThunk('portfolio/declineInvitation', async (portfolioId, { dispatch }) => {
  return api.put(`/portfolios/invitations/${portfolioId}/decline`)
    .then(() => {
      dispatch(fetchPortfoliosWithDetails());
    });
});

const createPortfolio = createAsyncThunk('portfolio/create', async ({ data, step }, { dispatch }) => {
  return api.post('/portfolios', data)
    .then(res => {
      dispatch(addPortfolio(res));
      router.navigate(`/portfolios/${res.id}/profile-wizard?step=${step}`);
      return res;
    });
});

const createMinimalPortfolio = createAsyncThunk('portfolio/createMinimal', async (data, { dispatch }) => {
  return api.post('/portfolios', data)
    .then(res => {
      dispatch(addPortfolio(res));
      dispatch(fetchPortfoliosWithDetails());
      return res;
    });
});

const editPortfolio = createAsyncThunk('portfolio/edit', async ({ data, interim }, { dispatch }) => {
  return api.put(`/portfolios/${data.id}`, data)
    .then(res => {
      if (!interim) {
        dispatch(replacePortfolio(res));
        router.navigate(`/portfolios/${res.id}/profile-wizard/finish`);
      }
      return res;
    });
});

const deletePortfolio = createAsyncThunk('portfolio/delete', async (id, { dispatch }) => {
  return api.delete(`/portfolios/${id}`)
    .then(res => {
      dispatch(fetchPortfolios());
      return res;
    });
});

const fetchCurrentPortfolio = createAsyncThunk('portfolio/fetchCurrent', async (id) => {
  return api.get(`/portfolios/${id}`);
});

const addTeamMember = createAsyncThunk('portfolio/addTeamMember', ({ portfolioId, data }, { dispatch }) => {
  return api.post(`/portfolios/${portfolioId}/team`, data)
    .then(res => {
      dispatch(insertTeamMember(res));
      return res;
    });
});

const editTeamMember = createAsyncThunk('portfolio/editTeamMember', ({ portfolioId, data }, { dispatch }) => {
  return api.put(`/portfolios/${portfolioId}/team/${data.id}`, data)
    .then(res => {
      dispatch(replaceTeamMember(res));
      return res;
    });
});

const removeTeamMember = createAsyncThunk('portfolio/removeTeamMember', ({ portfolioId, data }, { dispatch }) => {
  return api.delete(`/portfolios/${portfolioId}/team/${data.id}`)
    .then(() => {
      dispatch(deleteTeamMember(data));
    });
});

const updateTeamMembersOrder =
  createAsyncThunk('portfolio/updateTeamMembersOrder', ({ portfolioId, data }, { dispatch }) => {
    return api.put(`/portfolios/${portfolioId}/team/order`, data);
  });

const fetchPortfolioVentures = createAsyncThunk('portfolio/fetchVentures', async (id) => {
  return api.get(`/portfolios/${id}/ventures`);
});

const unlinkVenture = createAsyncThunk('portfolio/unlinkVenture', async ({ portfolioId, ventureId }, { dispatch }) => {
  return api.put(`/portfolios/${portfolioId}/ventures/${ventureId}/unlink`)
    .then(() => {
      toast.success('Venture has been successfully unlinked from your portfolio');
      return dispatch(fetchPortfolioVentures(portfolioId));
    });
});

const toggleHideVenture = createAsyncThunk('portfolio/toggleHideVenture', async ({ portfolioId, ventureId }, { dispatch }) => {
  return api.put(`/portfolios/${portfolioId}/ventures/${ventureId}/hide`)
    .then(() => {
      return dispatch(toggleVentureHidden(ventureId));
    });
});

const toggleHidePublicVenture = createAsyncThunk('portfolio/toggleHidePublicVenture', async ({ portfolioId, ventureId }, { dispatch }) => {
  return api.put(`/portfolios/${portfolioId}/ventures/${ventureId}/public-hide`)
    .then(() => {
      return dispatch(toggleVenturePublicHidden(ventureId));
    });
});

const batchUpdatePublicVisibility = createAsyncThunk('portfolio/batchUpdatePublicVisibility', async ({ portfolioId, ventures }, { dispatch }) => {
  return api.put(`/portfolios/${portfolioId}/ventures/public-hide/batch`, ventures)
    .then(() => {
      // toDO: Provide not hardcoded correct period here if ever needed
      dispatch(publicProfileThunks.fetchPortfolioVentures({ id: portfolioId, period: 7 }));
      dispatch(publicProfileThunks.fetchPortfolioVenturesAll(portfolioId));
    });
});

const inviteNewVentures = createAsyncThunk('portfolio/inviteNewVentures', async ({ portfolioId, data }, { dispatch }) => {
  return api.post(`/portfolios/${portfolioId}/ventures/invite`, data);
});

export default {
  fetchPortfolios,
  fetchPortfoliosWithDetails,
  acceptPortfolioInvitation,
  declinePortfolioInvitation,
  createPortfolio,
  createMinimalPortfolio,
  editPortfolio,
  deletePortfolio,
  fetchCurrentPortfolio,
  addTeamMember,
  editTeamMember,
  removeTeamMember,
  updateTeamMembersOrder,
  fetchPortfolioVentures,
  unlinkVenture,
  toggleHideVenture,
  toggleHidePublicVenture,
  batchUpdatePublicVisibility,
  inviteNewVentures,
};
