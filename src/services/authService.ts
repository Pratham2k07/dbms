import api from './api';

export const login = async (email: string, password: string = 'password') => {
  try {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  } catch (error) {
    console.error('Login error', error);
    throw error;
  }
};

export const register = async (email: string, password: string, name: string, role: string) => {
  try {
    const response = await api.post('/auth/register', { email, password, name, role });
    return response.data;
  } catch (error) {
    console.error('Registration error', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
