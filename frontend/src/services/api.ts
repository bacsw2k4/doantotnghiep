import axios from "axios";
import type { AxiosInstance } from "axios";


const api: AxiosInstance = axios.create({
  withCredentials: true, 
  baseURL: 'http://localhost:8000/api', 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const register = async (data: {
  role_id: number;
  firstname: string;
  lastname: string;
  address?: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  return api.post('/register', data);
};

export const login = async (data: { email: string; password: string }) => {
  return api.post('/login', data);
};

export const getUser = async () => {
  return api.get('/users');
};

export const logout = async () => {
  return api.post('/logout');
};

export default api;