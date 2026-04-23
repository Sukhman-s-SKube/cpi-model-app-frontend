import { configureStore } from '@reduxjs/toolkit';
import forecastReducer from '../features/forecast/forecastSlice';
import modelsReducer from '../features/models/modelsSlice';
import historyReducer from '../features/history/historySlice';

export const store = configureStore({
  reducer: {
    forecast: forecastReducer,
    models: modelsReducer,
    history: historyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
