import { createSlice } from "@reduxjs/toolkit";

const tokenFromStorage = localStorage.getItem("uca_token") || null;
const userFromStorage = (() => {
  try {
    const raw = localStorage.getItem("uca_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const initialState = {
  // Force a clean light theme (white + sky blue) per UI requirements.
  mode: "light",
  token: tokenFromStorage,
  user: userFromStorage,
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("uca_token", action.payload.token);
      localStorage.setItem("uca_user", JSON.stringify(action.payload.user));
    },
    clearAuth: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("uca_token");
      localStorage.removeItem("uca_user");
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("uca_user", JSON.stringify(action.payload));
    },
  },
});

export const { setMode, setAuth, clearAuth, setUser } = globalSlice.actions;

export default globalSlice.reducer;
