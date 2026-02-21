import type { Contact, Relationship, Notification, ProcessResult } from '../types';

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Contacts
  getContacts: () => req<Contact[]>('/contacts'),
  getContact: (id: string) => req<Contact>(`/contacts/${id}`),
  createContact: (data: Partial<Contact>) =>
    req<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: string, data: Partial<Contact>) =>
    req<Contact>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteContact: (id: string) =>
    req<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),

  // Relationships
  getRelationships: () => req<Relationship[]>('/relationships'),
  createRelationship: (data: Partial<Relationship>) =>
    req<Relationship>('/relationships', { method: 'POST', body: JSON.stringify(data) }),
  updateRelationship: (id: string, data: Partial<Relationship>) =>
    req<Relationship>(`/relationships/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRelationship: (id: string) =>
    req<{ success: boolean }>(`/relationships/${id}`, { method: 'DELETE' }),

  // AI Input Processing
  processInput: (text: string, source_type = 'manual') =>
    req<ProcessResult>('/inputs/process', {
      method: 'POST',
      body: JSON.stringify({ text, source_type }),
    }),
  scanOpportunities: (business_context?: string) =>
    req<{ opportunities: ProcessResult['opportunities']; notifications_created: number }>(
      '/inputs/scan-opportunities',
      { method: 'POST', body: JSON.stringify({ business_context }) }
    ),

  // Notifications
  getNotifications: () => req<Notification[]>('/notifications'),
  markRead: (id: string) => req<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => req<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id: string) => req<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),
};
