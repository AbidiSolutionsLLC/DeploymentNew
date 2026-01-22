import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../slices/authSlice";
import userReducer from "../slices/userSlice"; // Import user slice
import attendanceTimerSlice from '../slices/attendanceTimer';
import projectReducer from "./projectSlice";
import taskReducer from "./taskSlice";
import attendanceReducer from "../slices/attendanceSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer, // Add user slice here
  attendance: attendanceReducer,
  projects: projectReducer,
  tasks: taskReducer,
  attendanceTimer: attendanceTimerSlice,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "attendanceTimer", "user"], // Add user to whitelist
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

export { store, persistor };