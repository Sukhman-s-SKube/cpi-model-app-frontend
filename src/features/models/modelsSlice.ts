import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';
import { EvaluateRequest, TrainRequest } from '../../types/api';
import { HorizonMonths, ModelHistoryRow, ModelMetadata } from '../../types/model';
import { TaskState, TaskStatusResponse } from '../../types/task';
import { poll } from '../../services/polling';

const horizons: HorizonMonths[] = [1, 3, 6, 12];

interface ResourceState<T> {
  loading: boolean;
  error?: string;
  data?: T;
}

interface ModelHistoryState {
  loading: boolean;
  error?: string;
  rows: ModelHistoryRow[];
}

interface EvaluationJobState {
  submission: {
    loading: boolean;
    error?: string;
    task_id?: string;
    status?: string;
  };
  task: {
    loading: boolean;
    state?: TaskState;
    error?: string;
  };
}

interface TrainingJobState {
  submission: {
    loading: boolean;
    error?: string;
    task_id?: string;
    model_version?: string;
    status?: string;
  };
  task: {
    loading: boolean;
    state?: TaskState;
    error?: string;
  };
}

interface ModelsState {
  currentByHorizon: Record<HorizonMonths, ResourceState<ModelMetadata>>;
  historyByHorizon: Record<HorizonMonths, ModelHistoryState>;
  selectedHistoryHorizon: HorizonMonths;
  training: TrainingJobState;
  evaluation: EvaluationJobState;
}

const initialState: ModelsState = {
  currentByHorizon: {
    1: { loading: false },
    3: { loading: false },
    6: { loading: false },
    12: { loading: false },
  },
  historyByHorizon: {
    1: { loading: false, rows: [] },
    3: { loading: false, rows: [] },
    6: { loading: false, rows: [] },
    12: { loading: false, rows: [] },
  },
  selectedHistoryHorizon: 3,
  training: {
    submission: { loading: false },
    task: { loading: false },
  },
  evaluation: {
    submission: { loading: false },
    task: { loading: false },
  },
};

export const fetchCurrentModel = createAsyncThunk(
  'models/fetchCurrentModel',
  async (horizon: HorizonMonths) => {
    const data = await apiClient.getCurrentModel(horizon);
    return { horizon, data };
  },
);

export const fetchAllCurrentModels = createAsyncThunk('models/fetchAllCurrentModels', async (_, { dispatch }) => {
  await Promise.all(horizons.map((h) => dispatch(fetchCurrentModel(h)).unwrap()));
});

export const fetchModelHistory = createAsyncThunk(
  'models/fetchModelHistory',
  async ({ horizon, limit = 20 }: { horizon: HorizonMonths; limit?: number }) => {
    const rows = await apiClient.getModelHistory(horizon, limit);
    return { horizon, rows };
  },
);

export const submitEvaluation = createAsyncThunk('models/submitEvaluation', async (payload: EvaluateRequest) => {
  return apiClient.evaluate(payload);
});

export const submitTraining = createAsyncThunk('models/submitTraining', async (payload: TrainRequest) => {
  return apiClient.train(payload);
});

export const pollEvaluationTask = createAsyncThunk(
  'models/pollEvaluationTask',
  async ({ taskId, signal }: { taskId: string; signal?: AbortSignal }, { dispatch }) => {
    return poll(
      () => apiClient.getTaskStatus(taskId),
      {
        signal,
        intervalMs: 2000,
        onTick: (snapshot) => dispatch(setEvaluationTaskSnapshot(snapshot)),
        shouldStop: (snapshot) => snapshot.state === 'SUCCESS' || snapshot.state === 'FAILURE',
      },
    );
  },
);

export const pollTrainingTask = createAsyncThunk(
  'models/pollTrainingTask',
  async ({ taskId, signal }: { taskId: string; signal?: AbortSignal }, { dispatch }) => {
    return poll(
      () => apiClient.getTaskStatus(taskId),
      {
        signal,
        intervalMs: 2000,
        onTick: (snapshot) => dispatch(setTrainingTaskSnapshot(snapshot)),
        shouldStop: (snapshot) => snapshot.state === 'SUCCESS' || snapshot.state === 'FAILURE',
      },
    );
  },
);

const modelsSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    setSelectedHistoryHorizon(state, action: PayloadAction<HorizonMonths>) {
      state.selectedHistoryHorizon = action.payload;
    },
    setEvaluationTaskSnapshot(state, action: PayloadAction<TaskStatusResponse>) {
      state.evaluation.task.state = action.payload.state;
      state.evaluation.task.error = action.payload.error?.message;
    },
    setTrainingTaskSnapshot(state, action: PayloadAction<TaskStatusResponse>) {
      state.training.task.state = action.payload.state;
      state.training.task.error = action.payload.error?.message;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCurrentModel.pending, (state, action) => {
        state.currentByHorizon[action.meta.arg].loading = true;
        state.currentByHorizon[action.meta.arg].error = undefined;
      })
      .addCase(fetchCurrentModel.fulfilled, (state, action) => {
        const { horizon, data } = action.payload;
        state.currentByHorizon[horizon].loading = false;
        state.currentByHorizon[horizon].data = data;
      })
      .addCase(fetchCurrentModel.rejected, (state, action) => {
        const horizon = action.meta.arg;
        state.currentByHorizon[horizon].loading = false;
        state.currentByHorizon[horizon].error = action.error.message || 'Failed to load current model';
      })
      .addCase(fetchModelHistory.pending, (state, action) => {
        state.historyByHorizon[action.meta.arg.horizon].loading = true;
        state.historyByHorizon[action.meta.arg.horizon].error = undefined;
      })
      .addCase(fetchModelHistory.fulfilled, (state, action) => {
        const { horizon, rows } = action.payload;
        state.historyByHorizon[horizon].loading = false;
        state.historyByHorizon[horizon].rows = rows;
      })
      .addCase(fetchModelHistory.rejected, (state, action) => {
        const horizon = action.meta.arg.horizon;
        state.historyByHorizon[horizon].loading = false;
        state.historyByHorizon[horizon].error = action.error.message || 'Failed to load model history';
      })
      .addCase(submitTraining.pending, (state) => {
        state.training.submission.loading = true;
        state.training.submission.error = undefined;
        state.training.task.state = 'PENDING';
      })
      .addCase(submitTraining.fulfilled, (state, action) => {
        state.training.submission.loading = false;
        state.training.submission.task_id = action.payload.task_id;
        state.training.submission.model_version = action.payload.model_version;
        state.training.submission.status = action.payload.status;
        state.training.task.loading = true;
      })
      .addCase(submitTraining.rejected, (state, action) => {
        state.training.submission.loading = false;
        state.training.submission.error = action.error.message || 'Failed to submit training run';
      })
      .addCase(pollTrainingTask.pending, (state) => {
        state.training.task.loading = true;
      })
      .addCase(pollTrainingTask.fulfilled, (state, action) => {
        state.training.task.loading = false;
        state.training.task.state = action.payload.state;
        if (action.payload.state === 'FAILURE') {
          state.training.task.error =
            action.payload.error?.message ||
            (typeof action.payload.result === 'string' ? action.payload.result : 'Training failed');
        }
      })
      .addCase(pollTrainingTask.rejected, (state, action) => {
        state.training.task.loading = false;
        if (action.error.name !== 'AbortError') {
          state.training.task.error = action.error.message || 'Failed while polling training task';
        }
      })
      .addCase(submitEvaluation.pending, (state) => {
        state.evaluation.submission.loading = true;
        state.evaluation.submission.error = undefined;
        state.evaluation.task.state = 'PENDING';
      })
      .addCase(submitEvaluation.fulfilled, (state, action) => {
        state.evaluation.submission.loading = false;
        state.evaluation.submission.task_id = action.payload.task_id;
        state.evaluation.submission.status = action.payload.status;
        state.evaluation.task.loading = true;
      })
      .addCase(submitEvaluation.rejected, (state, action) => {
        state.evaluation.submission.loading = false;
        state.evaluation.submission.error = action.error.message || 'Failed to submit evaluation';
      })
      .addCase(pollEvaluationTask.pending, (state) => {
        state.evaluation.task.loading = true;
      })
      .addCase(pollEvaluationTask.fulfilled, (state, action) => {
        state.evaluation.task.loading = false;
        state.evaluation.task.state = action.payload.state;
        if (action.payload.state === 'FAILURE') {
          state.evaluation.task.error =
            action.payload.error?.message ||
            (typeof action.payload.result === 'string' ? action.payload.result : 'Evaluation failed');
        }
      })
      .addCase(pollEvaluationTask.rejected, (state, action) => {
        state.evaluation.task.loading = false;
        if (action.error.name !== 'AbortError') {
          state.evaluation.task.error = action.error.message || 'Failed while polling evaluation task';
        }
      });
  },
});

export const { setSelectedHistoryHorizon, setEvaluationTaskSnapshot, setTrainingTaskSnapshot } =
  modelsSlice.actions;

export default modelsSlice.reducer;
