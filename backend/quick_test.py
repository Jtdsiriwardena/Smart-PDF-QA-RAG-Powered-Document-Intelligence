import PyPDF2
from io import BytesIO

def test_pdf_extraction(pdf_path):
    print(f"Testing PDF: {pdf_path}")
    
    # Read file as bytes
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
    
    print(f"Read {len(pdf_bytes)} bytes")
    
    try:
        # Test direct bytes with PdfReader
        pdf_file = BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        print(f"PDF has {len(pdf_reader.pages)} pages")
        
        # Extract text from first page
        if len(pdf_reader.pages) > 0:
            first_page = pdf_reader.pages[0]
            text = first_page.extract_text()
            print(f"First page text: {text[:200]}...")
            
        print("✅ PDF extraction successful!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        test_pdf_extraction(sys.argv[1])
    else:
        print("Usage: python quick_test.py <pdf_file>")