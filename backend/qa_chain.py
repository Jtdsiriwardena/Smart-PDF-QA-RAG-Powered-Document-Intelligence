import openai
from typing import List, Dict, Any
from config import config

class QAGenerator:
    def __init__(self, use_mock: bool = False):
        self.use_mock = use_mock
        if not use_mock:
            openai.api_key = config.OPENAI_API_KEY
    
    def generate_answer(self, question: str, context_chunks: List[Dict]) -> str:
        """Generate answer based on retrieved chunks"""
        if self.use_mock:
            return self._mock_answer(question, context_chunks)
        else:
            return self._openai_answer(question, context_chunks)
    
    def _mock_answer(self, question: str, context_chunks: List[Dict]) -> str:
        """Mock answer for testing"""
        # Extract some context to make it seem realistic
        contexts = [chunk["document"]["text"][:200] for chunk in context_chunks]
        
        return f"""Based on the document, here's what I found:

Key relevant excerpts:
{chr(10).join([f'• {ctx[:100]}...' for ctx in contexts[:2]])}

This is a mock answer since you're not using OpenAI. The actual implementation would:
1. Send the context to GPT
2. Generate a coherent answer based on the retrieved chunks
3. Provide citations to specific parts of the document

Your question was: "{question}"
"""
    
    def _openai_answer(self, question: str, context_chunks: List[Dict]) -> str:
        """Generate answer using OpenAI"""
        # Prepare context from chunks
        context_parts = []
        for i, chunk in enumerate(context_chunks):
            context_parts.append(f"[Chunk {i+1}]: {chunk['document']['text']}")
        
        context = "\n\n".join(context_parts)
        
        # Create prompt
        prompt = f"""You are a helpful assistant that answers questions based strictly on the provided document context.

Context from the document:
{context}

Question: {question}

Instructions:
- Answer based ONLY on the information in the context
- If the answer cannot be found in the context, say "I cannot find information about this in the document"
- Be concise but thorough
- Reference specific parts of the document when relevant

Answer:"""
        
        try:
            response = openai.chat.completions.create(
                model=config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful document Q&A assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Error generating answer: {str(e)}"