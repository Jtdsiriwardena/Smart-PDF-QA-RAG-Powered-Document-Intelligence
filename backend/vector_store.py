import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, desc, and_
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime

from models import Document, Chunk, init_db
from database import SessionLocal
from config import config

class PostgreSQLVectorStore:
    def __init__(self):
        self.session = SessionLocal()
        # Initialize tables if they don't exist
        init_db()
    
    def __del__(self):
        if self.session:
            self.session.close()
    
    def add_document(self, filename: str, chunks: List[Dict], embeddings: List[List[float]], metadata: Dict = None) -> str:
        """Add a document and its chunks to the database"""
        try:
            # Create document record
            document = Document(
                filename=filename,
                total_chunks=len(chunks),
                doc_metadata=metadata or {}
            )
            self.session.add(document)
            self.session.flush()  # Get document ID
            
            # Add chunks with embeddings
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                # Extract page number from metadata if available
                page_number = chunk.get("metadata", {}).get("page")
                if page_number == "Unknown":
                    page_number = None
                elif page_number is not None:
                    try:
                        page_number = int(page_number)
                    except (ValueError, TypeError):
                        page_number = None
                
                db_chunk = Chunk(
                    document_id=document.id,
                    text=chunk["text"],
                    embedding=embedding,
                    page_number=page_number,
                    chunk_index=i,
                    chunk_metadata=chunk.get("metadata", {})
                )
                self.session.add(db_chunk)
            
            self.session.commit()
            print(f"✅ Added document '{filename}' with {len(chunks)} chunks to database (ID: {document.id})")
            return str(document.id)
            
        except Exception as e:
            self.session.rollback()
            print(f"❌ Failed to add document: {e}")
            raise
    
    def similarity_search(self, query_embedding: List[float], document_id: Optional[str] = None, k: int = 3, metadata_filter: Optional[Dict] = None) -> List[Dict]:
        """Find most similar chunks using cosine similarity"""
        try:
            # Convert document_id to UUID if provided
            doc_uuid = None
            if document_id:
                try:
                    doc_uuid = uuid.UUID(document_id)
                except ValueError:
                    print(f"Invalid document_id format: {document_id}")
                    return []
            
            # Build base query
            query = self.session.query(
                Chunk,
                Document.filename,
                (1 - (Chunk.embedding.cosine_distance(query_embedding))).label('similarity')
            ).join(Document, Chunk.document_id == Document.id)
            
            # Apply filters
            if doc_uuid:
                query = query.filter(Chunk.document_id == doc_uuid)
            
            if metadata_filter:
                if 'page_number' in metadata_filter:
                    query = query.filter(Chunk.page_number == metadata_filter['page_number'])
                if 'min_similarity' in metadata_filter:
                    query = query.filter(1 - Chunk.embedding.cosine_distance(query_embedding) >= metadata_filter['min_similarity'])
            
            # Execute query with limit
            results = query.order_by(Chunk.embedding.cosine_distance(query_embedding)).limit(k).all()
            
            # Format results
            formatted_results = []
            for chunk, filename, similarity in results:
                formatted_results.append({
                    "id": str(chunk.id),
                    "document": {
                        "text": chunk.text,
                        "metadata": chunk.chunk_metadata
                    },
                    "metadata": {
                        **chunk.chunk_metadata,
                        "filename": filename,
                        "document_id": str(chunk.document_id),
                        "page": chunk.page_number,
                        "chunk_index": chunk.chunk_index
                    },
                    "similarity": float(similarity)
                })
            
            return formatted_results
            
        except Exception as e:
            print(f"❌ Error in similarity_search: {e}")
            return []
    
    def get_documents(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get list of all documents with pagination"""
        try:
            documents = self.session.query(Document).order_by(Document.upload_date.desc()).limit(limit).offset(offset).all()
            total = self.session.query(Document).count()
            
            return {
                "total": total,
                "documents": [
                    {
                        "id": str(doc.id),
                        "filename": doc.filename,
                        "upload_date": doc.upload_date.isoformat() if doc.upload_date else None,
                        "total_chunks": doc.total_chunks,
                        "metadata": doc.doc_metadata
                    }
                    for doc in documents
                ]
            }
        except Exception as e:
            print(f"❌ Error getting documents: {e}")
            return {"total": 0, "documents": []}
    
    def get_document(self, document_id: str) -> Optional[Dict]:
        """Get a specific document by ID"""
        try:
            doc_uuid = uuid.UUID(document_id)
            doc = self.session.query(Document).filter(Document.id == doc_uuid).first()
            if doc:
                return {
                    "id": str(doc.id),
                    "filename": doc.filename,
                    "upload_date": doc.upload_date.isoformat() if doc.upload_date else None,
                    "total_chunks": doc.total_chunks,
                    "metadata": doc.doc_metadata
                }
            return None
        except Exception as e:
            print(f"❌ Error getting document: {e}")
            return None
    
    def get_document_chunks(self, document_id: str, limit: int = 10, offset: int = 0) -> List[Dict]:
        """Get chunks for a specific document"""
        try:
            doc_uuid = uuid.UUID(document_id)
            chunks = self.session.query(Chunk).filter(Chunk.document_id == doc_uuid).order_by(Chunk.chunk_index).limit(limit).offset(offset).all()
            
            return [
                {
                    "id": str(chunk.id),
                    "text": chunk.text[:200] + "..." if len(chunk.text) > 200 else chunk.text,
                    "page": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "metadata": chunk.chunk_metadata
                }
                for chunk in chunks
            ]
        except Exception as e:
            print(f"❌ Error getting document chunks: {e}")
            return []
    
    def delete_document(self, document_id: str) -> bool:
        """Delete a document and all its chunks"""
        try:
            doc_uuid = uuid.UUID(document_id)
            result = self.session.query(Document).filter(Document.id == doc_uuid).delete()
            self.session.commit()
            return result > 0
        except Exception as e:
            self.session.rollback()
            print(f"❌ Error deleting document: {e}")
            return False
    
    def delete_all_documents(self) -> bool:
        """Delete all documents and chunks"""
        try:
            self.session.query(Chunk).delete()
            self.session.query(Document).delete()
            self.session.commit()
            print("✅ Deleted all documents from database")
            return True
        except Exception as e:
            self.session.rollback()
            print(f"❌ Error deleting all documents: {e}")
            return False
    
    def get_stats(self) -> Dict:
        """Get database statistics"""
        try:
            doc_count = self.session.query(Document).count()
            chunk_count = self.session.query(Chunk).count()
            
            # Get database size
            result = self.session.execute(text("SELECT pg_database_size(current_database())"))
            db_size = result.scalar()
            
            return {
                "documents": doc_count,
                "chunks": chunk_count,
                "database_size_bytes": db_size,
                "database_size_mb": round(db_size / (1024 * 1024), 2)
            }
        except Exception as e:
            print(f"❌ Error getting stats: {e}")
            return {"documents": 0, "chunks": 0}