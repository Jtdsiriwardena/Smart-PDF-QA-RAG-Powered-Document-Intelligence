import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # App settings
    APP_NAME = "Smart PDF Q&A"
    VERSION = "1.0.0"  # Major version bump for DB!
    
    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    
    # Database - PostgreSQL with pgvector
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = os.getenv("DB_PORT", "5433")
    DB_NAME = os.getenv("DB_NAME", "vectordb")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
    
    # Database URL
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Chunking settings
    CHUNK_SIZE = 500
    CHUNK_OVERLAP = 0
    
    # Embedding settings
    EMBEDDING_DIMENSION = 1536  # OpenAI Ada-002
    USE_MOCK_EMBEDDINGS = not bool(OPENAI_API_KEY)
    
    # Retrieval settings
    TOP_K_RESULTS = 3
    
    # Model settings
    OPENAI_MODEL = "gpt-3.5-turbo"
    
    # Pool settings
    POOL_SIZE = 5
    MAX_OVERFLOW = 10

config = Config()