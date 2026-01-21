import axios from 'axios';

const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/`,
});

export const register = async (username: string, password: string, region: string) => {
  return API.post('register/', { username, password, region });
};


export const login = async (username: string, password: string) => {
  return API.post('login/', { username, password });
};

export const logout = async () => {
  const refresh = localStorage.getItem('refresh');
  await API.post('logout/', { refresh }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access')}`
    }
  });
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
};
