import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';
import { HorizonMonths } from '../../types/model';
import { EvalHistoryRow, PredictionHistoryRow } from '../../types/prediction';

interface HistoryState {
  filters: {
    horizon_months: HorizonMonths;
    limit: number;
  };
  predictions: {
    loading: boolean;
    error?: string;
    rows: PredictionHistoryRow[];
  };
  evalHistory: {
    loading: boolean;
    error?: string;
    modelVersion?: string;
    rows: EvalHistoryRow[];
    isOpen: boolean;
  };
}

const initialState: HistoryState = {
  filters: {
    horizon_months: 3,
    limit: 20,
  },
  predictions: {
    loading: false,
    rows: [],
  },
  evalHistory: {
    loading: false,
    rows: [],
    isOpen: false,
  },
};

export const fetchPredictionHistory = createAsyncThunk(
  'history/fetchPredictionHistory',
  async ({ horizon, limit = 20 }: { horizon: HorizonMonths; limit?: number }) => {
    const rows = await apiClient.getPredictionHistory(horizon, limit);
    return { rows, horizon, limit };
  },
);

export const fetchEvalHistory = createAsyncThunk(
  'history/fetchEvalHistory',
  async ({ modelVersion, limit = 20 }: { modelVersion: string; limit?: number }) => {
    const rows = await apiClient.getEvalHistory(modelVersion, limit);
    return { rows, modelVersion };
  },
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setHistoryHorizon(state, action: PayloadAction<HorizonMonths>) {
      state.filters.horizon_months = action.payload;
    },
    closeEvalHistory(state) {
      state.evalHistory.isOpen = false;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchPredictionHistory.pending, (state) => {
        state.predictions.loading = true;
        state.predictions.error = undefined;
      })
      .addCase(fetchPredictionHistory.fulfilled, (state, action) => {
        state.predictions.loading = false;
        state.predictions.rows = action.payload.rows;
        state.filters.horizon_months = action.payload.horizon;
        state.filters.limit = action.payload.limit;
      })
      .addCase(fetchPredictionHistory.rejected, (state, action) => {
        state.predictions.loading = false;
        state.predictions.error = action.error.message || 'Failed to fetch prediction history';
      })
      .addCase(fetchEvalHistory.pending, (state, action) => {
        state.evalHistory.loading = true;
        state.evalHistory.error = undefined;
        state.evalHistory.modelVersion = action.meta.arg.modelVersion;
        state.evalHistory.isOpen = true;
      })
      .addCase(fetchEvalHistory.fulfilled, (state, action) => {
        state.evalHistory.loading = false;
        state.evalHistory.rows = action.payload.rows;
        state.evalHistory.modelVersion = action.payload.modelVersion;
      })
      .addCase(fetchEvalHistory.rejected, (state, action) => {
        state.evalHistory.loading = false;
        state.evalHistory.error = action.error.message || 'Failed to fetch evaluation history';
      });
  },
});

export const { setHistoryHorizon, closeEvalHistory } = historySlice.actions;

export default historySlice.reducer;
