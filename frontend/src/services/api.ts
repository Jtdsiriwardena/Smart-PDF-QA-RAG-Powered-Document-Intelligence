// src/services/api.ts
import axios from 'axios';
import type { QueryResponse, UploadResponse, StatusResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadPDF = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const askQuestion = async (question: string, documentId?: string): Promise<QueryResponse> => {
  const formData = new FormData();
  formData.append('question', question);
  
  // Add document_id if provided
  if (documentId) {
    formData.append('document_id', documentId);
  }
  
  const response = await api.post<QueryResponse>('/ask', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getStatus = async (): Promise<StatusResponse> => {
  const response = await api.get<StatusResponse>('/status');
  return response.data;
};

export const clearDocument = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/clear');
  return response.data;
};

// For streaming responses (bonus)
export const streamQuestion = async (
  question: string,
  onToken: (token: string) => void,
  onSources: (sources: any[]) => void,
  onDone: () => void
) => {
  const formData = new FormData();
  formData.append('question', question);
  
  const response = await fetch(`${API_BASE_URL}/ask/stream`, {
    method: 'POST',
    body: formData,
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) return;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.type === 'sources') {
          onSources(data.data);
        } else if (data.type === 'token') {
          onToken(data.data);
        } else if (data.type === 'done') {
          onDone();
        }
      }
    }
  }
};