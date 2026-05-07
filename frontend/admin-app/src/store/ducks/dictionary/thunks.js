import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const fetchGoals = createAsyncThunk('dictionary/fetchGoals', async () => {
  return api.get('/dictionaries/goals');
});

const fetchScoringQuestions = createAsyncThunk('dictionary/scoringQuestions', async () => {
  return api.get('/dictionaries/scoring');
});

const fetchGeography = createAsyncThunk('dictionary/geography', async () => {
  return api.get('/dictionaries/geography');
});

const fetchIndustries = createAsyncThunk('dictionary/industries', async () => {
  return api.get('/dictionaries/industries');
});

const fetchUnits = createAsyncThunk('dictionary/units', async () => {
  return api.get('/dictionaries/units');
});

const fetchFundingRoundTypes = createAsyncThunk('dictionary/fundingRounds', async () => {
  return api.get('/dictionaries/funding-rounds');
});

export default {
  fetchGoals,
  fetchScoringQuestions,
  fetchGeography,
  fetchIndustries,
  fetchUnits,
  fetchFundingRoundTypes,
};

