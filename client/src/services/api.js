import axios from "axios";

const TOKEN_KEY = "queenb_token";
export const SESSION_EXPIRED_EVENT = "queenb:session-expired";

const api = axios.create({
  baseURL: "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    // Axios 1.x may use AxiosHeaders — set() is the reliable API
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const isAuthForm =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/google");

    // Session gone / invalid — clear token so UI cannot keep acting as logged-in
    if (status === 401 && !isAuthForm) {
      localStorage.removeItem(TOKEN_KEY);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
    }

    return Promise.reject(error);
  }
);

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function normalizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return {
    ...rest,
    id: String(user.id || user._id),
  };
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function loginRequest(email, password) {
  const { data } = await api.post("/auth/login", {
    email,
    password,
  });
  return {
    user: normalizeUser(data.user),
    token: data.token,
  };
}

export async function googleLoginRequest(credential) {
  const { data } = await api.post("/auth/google", { credential });
  return {
    user: normalizeUser(data.user),
    token: data.token,
  };
}

export async function registerRequest(formData) {
  const { data } = await api.post("/auth/register", formData);
  return {
    user: normalizeUser(data.user),
    token: data.token,
  };
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return normalizeUser(data.user);
}

export async function fetchUsers() {
  const { data } = await api.get("/users");
  const list = data.data || data.users || [];
  return list.map(normalizeUser);
}

export async function updateUserRequest(userId, payload) {
  const { data } = await api.put(`/users/${userId}`, payload);
  return normalizeUser(data.user);
}

export async function updateProfilePictureRequest(userId, file) {
  const formData = new FormData();
  formData.append("profilePicture", file);
  const { data } = await api.put(`/users/${userId}/profile-picture`, formData);
  return normalizeUser(data.user);
}

export default api;
