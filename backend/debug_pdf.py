import PyPDF2
import sys
from io import BytesIO

def debug_pdf(pdf_path):
    print(f"🔍 Debugging PDF: {pdf_path}")
    
    try:
        # Read file
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        print(f"📄 File size: {len(pdf_bytes)} bytes")
        
        # Try to open with PyPDF2
        pdf_file = BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        print(f"📑 Number of pages: {len(pdf_reader.pages)}")
        
        # Check if encrypted
        if pdf_reader.is_encrypted:
            print("🔐 PDF is encrypted!")
            try:
                pdf_reader.decrypt('')
                print("   Attempted decryption with empty password")
            except:
                print("   Could not decrypt")
        
        # Try to extract text from each page
        total_text = ""
        for i, page in enumerate(pdf_reader.pages):
            try:
                text = page.extract_text()
                if text:
                    print(f"✅ Page {i+1}: {len(text)} chars extracted")
                    print(f"   Preview: {text[:100]}...")
                    total_text += text
                else:
                    print(f"❌ Page {i+1}: No text extracted")
                    
                    # Try alternative extraction
                    try:
                        if '/Contents' in page:
                            print(f"   Has /Contents but extraction failed")
                    except:
                        pass
                        
            except Exception as e:
                print(f"❌ Page {i+1} error: {e}")
        
        if total_text:
            print(f"\n✅ Total extracted text: {len(total_text)} characters")
            print(f"Sample: {total_text[:500]}")
        else:
            print("\n❌ NO TEXT EXTRACTED from any page!")
            print("This PDF might be:")
            print("  - Scanned/image-based (needs OCR)")
            print("  - Using unsupported fonts")
            print("  - Corrupted or protected")
            
    except Exception as e:
        print(f"❌ Error opening PDF: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_pdf.py <pdf_file>")
        sys.exit(1)
    
    debug_pdf(sys.argv[1])