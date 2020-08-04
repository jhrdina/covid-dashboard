import {
  configureStore,
  ThunkAction,
  Action,
  getDefaultMiddleware,
  Middleware,
} from '@reduxjs/toolkit';
import rootReducer, { getItemsToPersist } from './state';

const persistency = <S>(selector: (state: S) => any): Middleware => (store) => (
  next
) => (action) => {
  const oldData = selector(store.getState());
  const returnValue = next(action);
  const newData = selector(store.getState());

  Object.keys(newData).forEach((key) => {
    const oldItem = oldData[key];
    const newItem = newData[key];
    const areEqual =
      oldItem === newItem ||
      (oldItem instanceof Date &&
        newItem instanceof Date &&
        oldItem.getTime() === newItem.getTime());

    if (!areEqual) {
      window.localStorage.setItem(key, newItem);
    }
  });
  return returnValue;
};

export const store = configureStore({
  reducer: {
    root: rootReducer,
  },
  middleware: [
    ...getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
    persistency(({ root }: any) => getItemsToPersist(root)) as any,
  ],
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
