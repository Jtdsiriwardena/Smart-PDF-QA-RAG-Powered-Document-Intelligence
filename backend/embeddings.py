import numpy as np
from typing import List
import openai
from config import config

class EmbeddingGenerator:
    def __init__(self, use_mock: bool = None):
        self.use_mock = config.USE_MOCK_EMBEDDINGS if use_mock is None else use_mock
        
        if not self.use_mock:
            openai.api_key = config.OPENAI_API_KEY
    
    def generate(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        if self.use_mock:
            return self._mock_embeddings(texts)
        else:
            return self._openai_embeddings(texts)
    
    def _mock_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate random but deterministic embeddings for testing"""
        embeddings = []
        for text in texts:
            # Create a deterministic seed from text
            seed = sum(ord(c) for c in text) % 1000
            np.random.seed(seed)
            
            # Generate random embedding
            embedding = np.random.randn(config.EMBEDDING_DIMENSION).astype(np.float32)
            
            # Normalize to unit length (like real embeddings)
            embedding = embedding / np.linalg.norm(embedding)
            
            embeddings.append(embedding.tolist())
        
        return embeddings
    
    def _openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using OpenAI's API"""
        try:
            # OpenAI recommends replacing newlines with spaces
            texts = [text.replace("\n", " ") for text in texts]
            
            response = openai.embeddings.create(
                input=texts,
                model="text-embedding-ada-002"
            )
            
            # Extract embeddings from response
            embeddings = [item.embedding for item in response.data]
            return embeddings
            
        except Exception as e:
            print(f"OpenAI API error: {e}. Falling back to mock embeddings.")
            return self._mock_embeddings(texts)