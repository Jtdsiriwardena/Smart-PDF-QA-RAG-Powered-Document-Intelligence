from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Index, Float, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from database import Base
import uuid

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    total_chunks = Column(Integer, default=0)
    doc_metadata = Column("metadata", JSONB, default={})
    
    # Relationships
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_documents_upload_date', 'upload_date'),
        Index('idx_documents_filename', 'filename'),
    )

class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    text = Column(Text, nullable=False)
    embedding = Column(Vector(1536))  # 1536 for OpenAI embeddings
    page_number = Column(Integer, nullable=True)
    chunk_index = Column(Integer, nullable=True)
    chunk_metadata = Column("metadata", JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    document = relationship("Document", back_populates="chunks")
    
    __table_args__ = (
        Index('idx_chunks_document_id', 'document_id'),
        Index('idx_chunks_embedding_cosine', embedding, postgresql_using='ivfflat', postgresql_ops={'embedding': 'vector_cosine_ops'}),
    )

def init_db():
    """Create tables and indexes"""
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Verify vector extension
        with engine.connect() as conn:
            result = conn.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'"))
            if result.fetchone():
                print("✅ pgvector extension is enabled")
            else:
                print("⚠️ pgvector extension not found")
                
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")

# Import for access
from database import engine