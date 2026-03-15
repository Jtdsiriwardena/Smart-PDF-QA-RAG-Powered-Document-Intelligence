import requests
import sys

BASE_URL = "http://localhost:8000"

def test_upload_pdf(pdf_path):
    """Test PDF upload"""
    print(f"\n📤 Uploading {pdf_path}...")
    
    with open(pdf_path, 'rb') as f:
        files = {'file': (pdf_path, f, 'application/pdf')}
        response = requests.post(f"{BASE_URL}/upload", files=files)
    
    if response.status_code == 200:
        print("✅ Upload successful!")
        print(f"   Response: {response.json()}")
        return True
    else:
        print(f"❌ Upload failed: {response.text}")
        return False

def test_ask_question(question):
    """Test asking a question"""
    print(f"\n❓ Question: {question}")
    
    data = {'question': question}
    response = requests.post(f"{BASE_URL}/ask", data=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Answer: {result['answer'][:200]}...")
        print(f"📚 Sources: {len(result['sources'])} chunks retrieved")
        return True
    else:
        print(f"❌ Question failed: {response.text}")
        return False

def test_status():
    """Check system status"""
    response = requests.get(f"{BASE_URL}/status")
    if response.status_code == 200:
        print(f"\n📊 Status: {response.json()}")
        return True
    return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test.py <path_to_pdf>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Test status first
    test_status()
    
    # Upload PDF
    if test_upload_pdf(pdf_path):
        # Test questions
        test_ask_question("What is this document about?")
        test_ask_question("What are the main topics discussed?")
        
        # Final status
        test_status()