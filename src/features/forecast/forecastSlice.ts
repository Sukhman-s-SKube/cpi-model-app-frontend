import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { apiClient } from '../../services/apiClient';
import { poll } from '../../services/polling';
import { PredictRequest } from '../../types/api';
import { HorizonMonths } from '../../types/model';
import { PredictionResult } from '../../types/prediction';
import { TaskState, TaskStatusResponse } from '../../types/task';

interface ForecastState {
  form: {
    horizon_months: HorizonMonths;
    modelMode: 'current' | 'best' | 'explicit';
    model_version: string;
  };
  submission: {
    loading: boolean;
    error?: string;
    task_id?: string;
    prediction_id?: string;
    status?: string;
  };
  task: {
    state?: TaskState;
    loading: boolean;
    error?: string;
    meta?: Record<string, unknown>;
  };
  latestResult?: PredictionResult;
  lastCompletedAt?: string;
}

const initialState: ForecastState = {
  form: {
    horizon_months: 3,
    modelMode: 'current',
    model_version: '',
  },
  submission: {
    loading: false,
  },
  task: {
    loading: false,
  },
};

export const submitPrediction = createAsyncThunk(
  'forecast/submitPrediction',
  async (payload: PredictRequest) => {
    return apiClient.predict(payload);
  },
);

export const pollTaskUntilFinished = createAsyncThunk<
  TaskStatusResponse<PredictionResult>,
  { taskId: string; signal?: AbortSignal },
  { state: RootState }
>('forecast/pollTaskUntilFinished', async ({ taskId, signal }, { dispatch }) => {
  return poll(
    () => apiClient.getTaskStatus<PredictionResult>(taskId),
    {
      signal,
      intervalMs: 2000,
      onTick: (snapshot) => {
        dispatch(setTaskSnapshot(snapshot));
      },
      shouldStop: (snapshot) => snapshot.state === 'SUCCESS' || snapshot.state === 'FAILURE',
    },
  );
});

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    setForecastHorizon(state, action: PayloadAction<HorizonMonths>) {
      state.form.horizon_months = action.payload;
    },
    setForecastModelMode(state, action: PayloadAction<'current' | 'best' | 'explicit'>) {
      state.form.modelMode = action.payload;
      if (action.payload !== 'explicit') {
        state.form.model_version = '';
      }
    },
    setForecastModelVersion(state, action: PayloadAction<string>) {
      state.form.model_version = action.payload;
    },
    setTaskSnapshot(state, action: PayloadAction<TaskStatusResponse<PredictionResult>>) {
      state.task.state = action.payload.state;
      state.task.meta = action.payload.meta;
      state.task.error = action.payload.error?.message;
      if (action.payload.state === 'SUCCESS' && action.payload.result) {
        state.latestResult = action.payload.result;
        state.lastCompletedAt = new Date().toISOString();
      }
    },
    clearForecastError(state) {
      state.submission.error = undefined;
      state.task.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPrediction.pending, (state) => {
        state.submission.loading = true;
        state.submission.error = undefined;
        state.task.loading = false;
        state.task.error = undefined;
        state.task.state = 'PENDING';
      })
      .addCase(submitPrediction.fulfilled, (state, action) => {
        state.submission.loading = false;
        state.submission.task_id = action.payload.task_id;
        state.submission.prediction_id = action.payload.prediction_id;
        state.submission.status = action.payload.status;
        state.task.loading = true;
      })
      .addCase(submitPrediction.rejected, (state, action) => {
        state.submission.loading = false;
        state.submission.error = action.error.message || 'Failed to submit prediction request';
      })
      .addCase(pollTaskUntilFinished.pending, (state) => {
        state.task.loading = true;
        state.task.error = undefined;
      })
      .addCase(pollTaskUntilFinished.fulfilled, (state, action) => {
        state.task.loading = false;
        state.task.state = action.payload.state;

        if (action.payload.state === 'SUCCESS' && action.payload.result) {
          state.latestResult = action.payload.result;
          state.lastCompletedAt = new Date().toISOString();
        }

        if (action.payload.state === 'FAILURE') {
          state.task.error =
            action.payload.error?.message ||
            (typeof action.payload.result === 'string' ? action.payload.result : 'Task failed');
        }
      })
      .addCase(pollTaskUntilFinished.rejected, (state, action) => {
        state.task.loading = false;
        if (action.error.name !== 'AbortError') {
          state.task.error = action.error.message || 'Failed while polling task status';
        }
      });
  },
});

export const {
  setForecastHorizon,
  setForecastModelMode,
  setForecastModelVersion,
  setTaskSnapshot,
  clearForecastError,
} = forecastSlice.actions;

export default forecastSlice.reducer;
