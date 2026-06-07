import client from '../../../shared/api/client';
import type { Wallet } from '../../../shared/api/types';

export const walletApi = {
  findAll: () =>
    client.get<Wallet[]>('/wallets').then(r => r.data),

  findOne: (id: string) =>
    client.get<Wallet>(`/wallets/${id}`).then(r => r.data),

  create: (data: { name: string; description?: string }) =>
    client.post<Wallet>('/wallets', data).then(r => r.data),

  update: (id: string, data: { name?: string; description?: string }) =>
    client.patch<Wallet>(`/wallets/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/wallets/${id}`),
};
