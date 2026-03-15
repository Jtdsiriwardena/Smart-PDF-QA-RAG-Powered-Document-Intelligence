from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uuid

from pdf_processor import PDFProcessor
from embeddings import EmbeddingGenerator
from qa_chain import QAGenerator
from vector_store import PostgreSQLVectorStore
from config import config

# Initialize FastAPI
app = FastAPI(title=config.APP_NAME, version=config.VERSION)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
pdf_processor = PDFProcessor()
embedding_generator = EmbeddingGenerator()
qa_generator = QAGenerator(use_mock=config.USE_MOCK_EMBEDDINGS)
vector_store = PostgreSQLVectorStore()

@app.get("/")
async def root():
    return {
        "message": "Smart PDF Q&A API",
        "version": config.VERSION,
        "status": "ready",
        "database": "PostgreSQL + pgvector"
    }

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process a PDF file"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Check if document with same filename exists and delete it
        documents = vector_store.get_documents()
        for doc in documents.get("documents", []):
            if doc["filename"] == file.filename:
                print(f"📝 Replacing existing document: {file.filename}")
                vector_store.delete_document(doc["id"])
        
        # Read file content
        content = await file.read()
        
        # Extract text
        text = pdf_processor.extract_text(content)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from PDF")
        
        # Get document info
        doc_info = pdf_processor.get_document_info(text)
        
        # Chunk text
        chunks = pdf_processor.chunk_text(text)
        
        # Generate embeddings
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = embedding_generator.generate(chunk_texts)
        
        # Store in PostgreSQL
        document_id = vector_store.add_document(
            filename=file.filename,
            chunks=chunks,
            embeddings=embeddings,
            metadata=doc_info
        )
        
        return {
            "message": "PDF processed successfully",
            "document_id": document_id,
            "filename": file.filename,
            "chunks": len(chunks),
            "text_length": len(text),
            "document_info": doc_info
        }
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/ask")
async def ask_question(
    question: str = Form(...),
    document_id: Optional[str] = Form(None),
    page_number: Optional[int] = Form(None)
):
    """Ask a question about uploaded PDFs"""
    try:
        # Generate embedding for question
        question_embedding = embedding_generator.generate([question])[0]
        
        # Build metadata filter
        metadata_filter = {}
        if page_number is not None:
            metadata_filter['page_number'] = page_number
        
        # Retrieve relevant chunks
        relevant_chunks = vector_store.similarity_search(
            query_embedding=question_embedding,
            document_id=document_id,
            k=config.TOP_K_RESULTS,
            metadata_filter=metadata_filter if metadata_filter else None
        )
        
        if not relevant_chunks:
            return {
                "question": question,
                "answer": "No relevant information found in the documents.",
                "sources": []
            }
        
        # Generate answer
        answer = qa_generator.generate_answer(question, relevant_chunks)
        
        # Prepare response with citations
        response = {
            "question": question,
            "answer": answer,
            "sources": [
                {
                    "text": chunk["document"]["text"][:200] + "...",
                    "similarity": chunk["similarity"],
                    "document": chunk["metadata"].get("filename", "Unknown"),
                    "page": chunk["metadata"].get("page", "Unknown"),
                    "chunk_index": chunk["metadata"].get("chunk_index", 0)
                }
                for chunk in relevant_chunks
            ]
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def list_documents(limit: int = 100, offset: int = 0):
    """List all uploaded documents"""
    try:
        return vector_store.get_documents(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document"""
    try:
        # Validate UUID
        try:
            uuid.UUID(document_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        
        document = vector_store.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    limit: int = 10,
    offset: int = 0
):
    """Get chunks for a specific document"""
    try:
        # Validate UUID
        try:
            uuid.UUID(document_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        
        chunks = vector_store.get_document_chunks(document_id, limit=limit, offset=offset)
        return {
            "document_id": document_id,
            "total": len(chunks),
            "chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    try:
        # Validate UUID
        try:
            uuid.UUID(document_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        
        success = vector_store.delete_document(document_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents")
async def delete_all_documents():
    """Delete all documents"""
    try:
        success = vector_store.delete_all_documents()
        if success:
            return {"message": "All documents deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete documents")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get database statistics"""
    try:
        return vector_store.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_status():
    """Get current system status"""
    try:
        stats = vector_store.get_stats()
        return {
            "database": "PostgreSQL + pgvector",
            "status": "connected",
            "documents_count": stats.get("documents", 0),
            "chunks_count": stats.get("chunks", 0),
            "database_size_mb": stats.get("database_size_mb", 0),
            "using_mock_embeddings": config.USE_MOCK_EMBEDDINGS
        }
    except Exception as e:
        return {
            "database": "PostgreSQL + pgvector",
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)