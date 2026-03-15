from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from config import config
import time

# Maximum retries for database connection
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

def create_db_engine():
    """Create database engine with connection pooling and retry logic"""
    for attempt in range(MAX_RETRIES):
        try:
            engine = create_engine(
                config.DATABASE_URL,
                echo=False,  # Set to True for SQL logging
                poolclass=QueuePool,
                pool_size=config.POOL_SIZE,
                max_overflow=config.MAX_OVERFLOW,
                pool_timeout=30,  # seconds
                pool_pre_ping=True,  # Test connections before using
                connect_args={
                    "connect_timeout": 10,
                    "keepalives": 1,
                    "keepalives_idle": 30,
                    "keepalives_interval": 10,
                    "keepalives_count": 5
                }
            )
            
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                conn.commit()
            
            print("✅ Database connection successful with pgvector")
            return engine
            
        except Exception as e:
            print(f"❌ Database connection attempt {attempt + 1} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print("❌ Failed to connect to database after all retries")
                print("Make sure Docker container is running:")
                print("docker run --name pgvector -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=vectordb -p 5433:5432 -d ankane/pgvector")
                raise

# Create engine
print("Connecting to:", config.DATABASE_URL)
engine = create_db_engine()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()