// /lib/foncierService.ts
import axios from 'axios';
import { Foncier, StepType, Task, Document, User } from '@/types'; // adjust import if you keep types separately

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const foncierService = {
  // Fonciers
  fetchFonciers: async (type: string): Promise<Foncier[]> => {
    const res = await axios.get(`${API_URL}/auth/fonciers/?type=${type}`);
    return res.data;
  },

  addFoncier: async (formData: FormData): Promise<any> => {
    const res = await axios.post(`${API_URL}/auth/fonciers/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateFoncier: async (id: number, formData: FormData): Promise<any> => {
    const res = await axios.patch(`${API_URL}/auth/fonciers/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteFoncier: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/auth/fonciers/${id}/`);
  },

  // Steps
  fetchSteps: async (foncierId: number): Promise<StepType[]> => {
    const res = await axios.get(`${API_URL}/auth/fonciers/${foncierId}/steps/`);
    return res.data;
  },

  addStep: async (foncierId: number, title: string): Promise<StepType> => {
    const res = await axios.post(`${API_URL}/auth/fonciers/${foncierId}/steps/create/`, { title });
    return res.data;
  },

  toggleStepCompletion: async (stepId: number, is_completed: boolean) => {
    await axios.patch(`${API_URL}/auth/steps/${stepId}/`, { is_completed });
  },

  // Tasks
  addTask: async (stepId: number, title: string, priority: 'low' | 'medium' | 'high') => {
    const res = await axios.post(`${API_URL}/auth/steps/${stepId}/tasks/create/`, { title, priority });
    return res.data;
  },

  deleteTask: async (taskId: number) => {
    await axios.delete(`${API_URL}/auth/tasks/${taskId}/delete/`);
  },

  fetchTaskDocuments: async (taskId: number): Promise<Document[]> => {
    const res = await axios.get(`${API_URL}/auth/tasks/${taskId}/documents/`);
    return res.data;
  },

  fetchTaskComments: async (taskId: number) => {
    const res = await axios.get(`${API_URL}/auth/tasks/${taskId}/comments/`);
    return res.data;
  },

  removeTaskUser: async (taskId: number, userId: number) => {
    const res = await axios.post(`${API_URL}/auth/tasks/${taskId}/remove-user/${userId}/`);
    return res.data;
  },

  // Users
  fetchUsers: async (): Promise<User[]> => {
    const res = await axios.get(`${API_URL}/auth/users/`);
    return res.data;
  },

  downloadDocument: async (documentId: number): Promise<Blob> => {
    const res = await axios.get(`${API_URL}/auth/documents/${documentId}/download/`, { responseType: 'blob' });
    return res.data;
  },
};
