import PyPDF2
from typing import List, Dict
import hashlib
from io import BytesIO
from config import config

class PDFProcessor:
    @staticmethod
    def extract_text(pdf_file) -> str:
        """Extract text from uploaded PDF file"""
        try:
            # If pdf_file is bytes (from file.read()), convert to BytesIO
            if isinstance(pdf_file, bytes):
                pdf_file = BytesIO(pdf_file)
            
            # Create PDF reader object
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            
            # Extract text from each page
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- Page {page_num + 1} ---\n"
                    text += page_text
                else:
                    text += f"\n--- Page {page_num + 1} (No text extracted) ---\n"
            
            if not text.strip():
                raise Exception("No text could be extracted from the PDF. The file might be scanned or image-based.")
            
            return text
            
        except Exception as e:
            raise Exception(f"Failed to extract PDF text: {str(e)}")
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> List[Dict]:
        """Split text into chunks of roughly equal size"""
        if chunk_size is None:
            chunk_size = config.CHUNK_SIZE
        if overlap is None:
            overlap = config.CHUNK_OVERLAP
            
        chunks = []
        
        # Split by pages first (we added page markers)
        pages = text.split("\n--- Page ")
        
        for page_content in pages:
            if not page_content.strip():
                continue
            
            # Extract page number if present at the beginning
            page_number = "Unknown"
            if page_content.startswith("--- Page "):
                # This handles the case where the split created the marker
                continue
            
            # Check if this page content has a page number marker at the start
            lines = page_content.split('\n', 1)
            if len(lines) > 1 and lines[0].startswith("--- Page "):
                page_number = lines[0].replace("--- Page ", "").replace(" ---", "")
                content = lines[1]
            else:
                content = page_content
            
            # Simple chunking by character count
            words = content.split()
            current_chunk = []
            current_length = 0
            chunk_number = 1
            
            for word in words:
                word_length = len(word) + 1  # +1 for space
                if current_length + word_length <= chunk_size:
                    current_chunk.append(word)
                    current_length += word_length
                else:
                    if current_chunk:
                        chunk_text = " ".join(current_chunk)
                        chunk_id = hashlib.md5(f"{page_number}_{chunk_number}_{chunk_text[:50]}".encode()).hexdigest()[:8]
                        chunks.append({
                            "id": chunk_id,
                            "text": chunk_text,
                            "metadata": {
                                "page": page_number,
                                "chunk_number": chunk_number,
                                "length": len(chunk_text),
                                "word_count": len(current_chunk)
                            }
                        })
                        chunk_number += 1
                    
                    # Start new chunk with this word
                    current_chunk = [word]
                    current_length = word_length
            
            # Add the last chunk for this page
            if current_chunk:
                chunk_text = " ".join(current_chunk)
                chunk_id = hashlib.md5(f"{page_number}_{chunk_number}_{chunk_text[:50]}".encode()).hexdigest()[:8]
                chunks.append({
                    "id": chunk_id,
                    "text": chunk_text,
                    "metadata": {
                        "page": page_number,
                        "chunk_number": chunk_number,
                        "length": len(chunk_text),
                        "word_count": len(current_chunk)
                    }
                })
        
        print(f"📄 Created {len(chunks)} chunks from {len(pages)} pages")
        return chunks
    
    @staticmethod
    def get_document_info(text: str) -> Dict:
        """Get basic information about the extracted text"""
        pages = text.split("\n--- Page ")
        word_count = len(text.split())
        char_count = len(text)
        
        return {
            "page_count": len(pages),
            "word_count": word_count,
            "character_count": char_count,
            "estimated_tokens": char_count // 4  # Rough estimate
        }

# Simple test
if __name__ == "__main__":
    processor = PDFProcessor()
    
    # Test with sample text
    sample_text = "This is a test. " * 1000
    print("Testing with sample text...")
    chunks = processor.chunk_text(sample_text, chunk_size=200)
    
    print(f"Generated {len(chunks)} chunks")
    for i, chunk in enumerate(chunks[:3]):
        print(f"Chunk {i+1}: {chunk['text'][:50]}... (Page: {chunk['metadata']['page']})")
    
    # Test with file if provided as argument
    import sys
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        try:
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()
            
            print(f"\nTesting with actual PDF: {pdf_path}")
            text = processor.extract_text(pdf_bytes)
            info = processor.get_document_info(text)
            print(f"Document info: {info}")
            
            chunks = processor.chunk_text(text)
            print(f"Generated {len(chunks)} chunks from PDF")
            
        except Exception as e:
            print(f"Error testing PDF: {e}")