export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

let isRefreshing = false;
let failedQueue: { resolve: (val?: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token || undefined);
    }
  });
  failedQueue = [];
};

export const fetchWithInterceptor = async (url: string, options: RequestInit) => {
  let response = await fetch(url, options);

  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
        window.location.href = "/login";
      return response;
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        options.headers = options.headers || {};
        (options.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        return fetch(url, options);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken })
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error("Session expired");
      }

      localStorage.setItem("access_token", refreshData.access);
      if (refreshData.refresh) {
        localStorage.setItem("refresh_token", refreshData.refresh);
      }

      options.headers = options.headers || {};
      (options.headers as Record<string, string>)["Authorization"] = `Bearer ${refreshData.access}`;
      processQueue(null, refreshData.access);
      
      response = await fetch(url, options);
    } catch (error) {
      processQueue(error, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }

  return response;
};

const api = {
  post: async (endpoint: string, data: unknown = {}) => {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetchWithInterceptor(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw { response: { data: responseData, status: response.status } };
    }
    return { data: responseData, status: response.status };
  },
  get: async (endpoint: string) => {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetchWithInterceptor(url, {
      method: "GET",
      headers: getHeaders(),
    });
    
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw { response: { data: responseData, status: response.status } };
    }
    return { data: responseData, status: response.status };
  }
};

export default api;