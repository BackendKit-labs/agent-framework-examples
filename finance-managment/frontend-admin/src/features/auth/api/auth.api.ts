import client from '../../../shared/api/client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../../../shared/api/types';

export const authApi = {
  register: (data: RegisterRequest) =>
    client.post<AuthResponse>('/auth/register', data).then(r => r.data),

  login: (data: LoginRequest) =>
    client.post<AuthResponse>('/auth/login', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    client.post<AuthResponse>('/auth/refresh', { refreshToken }).then(r => r.data),

  logout: (refreshToken: string) =>
    client.post('/auth/logout', { refreshToken }),
};
