import axios from "axios";
import useEcom from "../store/bazi";

const apiRestaurant = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // ให้ cookie refreshToken ส่งไปด้วย
});

// ===== queue กัน refresh ซ้อน =====
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ===== request interceptor =====
apiRestaurant.interceptors.request.use(
  (config) => {
    const token = useEcom.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== response interceptor =====
apiRestaurant.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiRestaurant(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/restaurant/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        // update zustand
        useEcom.getState().setToken(newToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiRestaurant(originalRequest);

      } catch (err) {
        processQueue(err, null);
        useEcom.getState().actionLogout?.();
        window.location.href = "/loginrestaurent";
        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiRestaurant;
