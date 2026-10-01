import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API, withCredentials: true });

const saved = localStorage.getItem("lc_token");
if (saved) api.defaults.headers.common["Authorization"] = `Bearer ${saved}`;

export function setToken(token) {
  if (token) {
    localStorage.setItem("lc_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("lc_token");
    delete api.defaults.headers.common["Authorization"];
  }
}

export default api;
