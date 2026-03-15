// src/types/index.ts

export interface Source {
  text: string;
  similarity: number;
  document?: string;
  page?: string;
  chunk_index?: number;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

export interface UploadResponse {
  message: string;
  filename: string;
  chunks: number;
  text_length: number;
  document_id?: string;
  document_info?: {
    page_count: number;
    word_count: number;
    character_count: number;
    estimated_tokens: number;
  };
}

export interface QueryResponse {
  question: string;
  answer: string;
  sources: Source[];
}

export interface StatusResponse {
  document_loaded: boolean;
  filename: string | null;
  chunks: number;
  using_mock_embeddings: boolean;
  vector_store_size: number;
  documents_count?: number;
  chunks_count?: number;
  database_size_mb?: number;
}

export interface Document {
  id: string;
  filename: string;
  upload_date: string;
  total_chunks: number;
  metadata: Record<string, any>;
}
