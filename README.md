# 📄 Smart PDF Q&A — RAG-Powered Document Intelligence

A production-ready **Retrieval-Augmented Generation (RAG)** system that enables users to upload PDF documents and ask natural language questions about their content — returning accurate, context-aware answers with source citations.

> Built with FastAPI, PostgreSQL + pgvector, OpenAI GPT-3.5, and React — implementing the same core architecture behind ChatGPT browsing, Perplexity AI, and enterprise knowledge base tools.

---

![Image Alt](https://github.com/Jtdsiriwardena/Smart-PDF-QA-RAG-Powered-Document-Intelligence/blob/e525fda995451f22f6bca245b8b6a58df7e6ef94/Home_page_1.png) 

## 📋 Overview

Smart PDF Q&A:

- **Extracts** text from uploaded PDFs using PyPDF2
- **Chunks** content intelligently for optimal retrieval
- **Generates embeddings** using OpenAI Ada-002 (1536 dimensions)
- **Stores vectors** persistently in PostgreSQL with pgvector
- **Answers questions** using semantic search + GPT-3.5-turbo
- **Cites sources** with relevance scores and page references

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                        │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│   │   Upload    │  │    Chat     │  │  Document   │      │
│   │  Component  │  │  Interface  │  │  Selector   │      │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│          └────────────────┼─────────────────┘             │
│                           ▼                               │
│                   ┌───────────────┐                       │
│                   │  API Client   │                       │
│                   │   (Axios)     │                       │
│                   └───────┬───────┘                       │
└───────────────────────────┼───────────────────────────────┘
                            │ REST API
┌───────────────────────────┼───────────────────────────────┐
│                  BACKEND LAYER (FastAPI)                   │
│                           ▼                               │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│         │ /upload  │  │  /ask    │  │/documents│         │
│         └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│              └─────────────┼──────────────┘               │
│                            ▼                              │
│      ┌─────────────┐  ┌────────────┐  ┌──────────────┐   │
│      │    PDF      │  │ Embedding  │  │   QA Chain   │   │
│      │  Processor  │  │ Generator  │  │  (GPT-3.5)   │   │
│      └─────────────┘  └────────────┘  └──────────────┘   │
│                            ▼                              │
│                  ┌──────────────────┐                     │
│                  │   Vector Store   │                     │
│                  │  (PostgreSQL +   │                     │
│                  │    pgvector)     │                     │
│                  └────────┬─────────┘                     │
└───────────────────────────┼───────────────────────────────┘
                            │
               ┌────────────┴───────────┐
               ▼                        ▼
     ┌──────────────────┐    ┌──────────────────┐
     │   OpenAI API     │    │   PostgreSQL     │
     │  Ada-002 + GPT   │    │    pgvector      │
     └──────────────────┘    └──────────────────┘
```

---

## 🔄 Core Workflows

### 1. Document Processing Pipeline

```
PDF Upload → Text Extraction → Chunking → Embedding → Vector Storage
     │              │              │           │              │
     ▼              ▼              ▼           ▼              ▼
  PDF File      PyPDF2       500-char      Ada-002       PostgreSQL
                extract      page-aware   1536-dim       pgvector
                             chunks       vectors
```

### 2. Question Answering Pipeline

```
User Question → Embed Question → Similarity Search → Retrieve Context
      │               │                 │                   │
      ▼               ▼                 ▼                   ▼
  Natural         Ada-002          Cosine Sim          Top 3 chunks
  Language       1536-dim         via pgvector         + scores

      → Prompt Construction → LLM Generation → Answer + Citations
               │                    │                  │
               ▼                    ▼                  ▼
         Context + Query       GPT-3.5-turbo      Markdown +
         with instructions     500 token max      Source refs
```

---

## 🚀 Features

### ✅ Core RAG Functionality
- PDF upload with file validation
- Text extraction using PyPDF2
- Intelligent chunking (500 chars, page-aware)
- Embedding generation via OpenAI Ada-002
- Cosine similarity search
- LLM-powered answer generation with streaming responses

### ✅ PostgreSQL + pgvector Integration
- Persistent vector storage with Docker
- Multiple document support
- Vector similarity search with IVFFlat indexing
- Metadata filtering by document and page
- Connection pooling via SQLAlchemy QueuePool
- Database statistics and monitoring endpoints

### ✅ Frontend
- React + TypeScript for type safety
- Drag-and-drop file upload (React Dropzone)
- Real-time chat interface
- Document selector for multiple PDFs
- Source citations with relevance scores
- Loading states and error handling
- Markdown rendering for answers
- Connection status indicators

---

## 🛠 Tech Stack

### ⚙️ Backend
| Technology | Purpose |
|---|---|
| FastAPI | High-performance async web framework with auto OpenAPI docs |
| Python | Core language with type hints |
| PostgreSQL | Primary database with JSONB support |
| pgvector | Vector similarity search extension |
| SQLAlchemy | ORM with connection pooling and async support |
| OpenAI API | Ada-002 embeddings and GPT-3.5-turbo |
| PyPDF2 | PDF text extraction |
| NumPy | Vector operations and similarity calculations |
| Pydantic | Data validation and settings management |

### 🖥️ Frontend
| Technology | Purpose |
|---|---|
| React | Component-based UI library |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client |
| React Dropzone | Drag-and-drop file upload |
| React Markdown | Markdown rendering for answers |

### 🐳 DevOps & Infrastructure
| Tool | Purpose |
|---|---|
| Docker | Containerized PostgreSQL with pgvector |
| Git | Version control |
| npm / pip | Package management |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/upload` | Upload a PDF document |
| `POST` | `/ask` | Ask a question (with optional `document_id`) |
| `GET` | `/documents` | List all documents (`?limit&offset`) |
| `GET` | `/documents/{id}` | Get document details |
| `GET` | `/documents/{id}/chunks` | Get document chunks |
| `DELETE` | `/documents/{id}` | Delete a document |
| `DELETE` | `/documents` | Delete all documents |
| `GET` | `/stats` | Database statistics |
| `GET` | `/status` | System health metrics |

---

## 🗄️ Database Schema

### Documents Table
```sql
CREATE TABLE documents (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename     VARCHAR(255) NOT NULL,
    upload_date  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_chunks INTEGER DEFAULT 0,
    metadata     JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_documents_upload_date ON documents(upload_date);
CREATE INDEX idx_documents_filename ON documents(filename);
```

### Chunks Table
```sql
CREATE TABLE chunks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    embedding   vector(1536),
    page_number INTEGER,
    chunk_index INTEGER,
    metadata    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_embedding ON chunks
    USING ivfflat (embedding vector_cosine_ops);
```

---

## 📊 Performance Metrics

| Metric | Value |
|---|---|
| PDF Processing | ~2–3 seconds per 10-page document |
| Chunk Size | 500 characters (optimal for retrieval) |
| Embedding Dimension | 1536 (OpenAI Ada-002) |
| Retrieval | Top-3 chunks, 70–80% similarity |
| Response Time | 1–2 seconds for generation |
| Storage | ~10MB for 3 documents / 34 chunks |

---

## ⚙️ Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/smart-pdf-qa.git
```

**2. Start PostgreSQL with pgvector via Docker**

```bash
docker run --name pgvector-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=smart_pdf_qa \
  -p 5432:5432 \
  -d ankane/pgvector
```

**3. Set up the backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**4. Set up the frontend**

```bash
cd ../frontend
npm install

```

## 🔑 Environment Variables

### Backend — create a `.env` file in `/backend`:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# PostgreSQL
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smart_pdf_qa

# App
DEBUG=True
MAX_UPLOAD_SIZE_MB=50
CHUNK_SIZE=500
TOP_K_RESULTS=3
```

### Frontend — create a `.env` file in `/frontend`:

```env
VITE_API_URL=http://localhost:8000
```

---

## ▶️ Running the Application

**Start the backend**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Start the frontend**

```bash
cd frontend
npm run dev

```
---

## 📸 Screenshots

**PDF Upload (Drag & Drop)**

![Image Alt](https://github.com/Jtdsiriwardena/Smart-PDF-QA-RAG-Powered-Document-Intelligence/blob/e525fda995451f22f6bca245b8b6a58df7e6ef94/Home_page_1.png) 

**Chat Section**

![Image Alt](https://github.com/Jtdsiriwardena/Smart-PDF-QA-RAG-Powered-Document-Intelligence/blob/e525fda995451f22f6bca245b8b6a58df7e6ef94/chat.png) 

 
---
