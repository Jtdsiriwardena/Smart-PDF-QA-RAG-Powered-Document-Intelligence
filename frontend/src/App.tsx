import { useState, useEffect } from 'react';
import type { Message, StatusResponse, Document } from './types';
import { FileUpload } from './components/FileUpload';
import { ChatInterface } from './components/ChatInterface';
import { askQuestion, getStatus, clearDocument } from './services/api';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentFile, setCurrentFile] = useState<{ name: string; chunks: number } | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkStatus();
    fetchDocuments();
  }, []);

  const checkStatus = async () => {
    try {
      const statusData = await getStatus();
      setStatus(statusData);
      if (statusData.document_loaded && statusData.filename) {
        setCurrentFile({
          name: statusData.filename,
          chunks: statusData.chunks
        });
      }
    } catch (error) {
      console.error('Failed to get status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleUploadSuccess = (documentId: string, filename: string, chunks: number) => {
    setCurrentFile({ name: filename, chunks });
    setCurrentDocumentId(documentId);
    setMessages([]);
    fetchDocuments();
    
    setMessages([
      {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✨ PDF "${filename}" uploaded successfully! I've processed **${chunks} sections**. What would you like to know about it?`,
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await askQuestion(content, currentDocumentId || undefined);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get answer:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '😓 Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleClearDocument = async () => {
    try {
      await clearDocument();
      setCurrentFile(null);
      setCurrentDocumentId(null);
      setMessages([]);
      await checkStatus();
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to clear document:', error);
    }
  };

  const handleSelectDocument = (documentId: string) => {
    setCurrentDocumentId(documentId);
    const selectedDoc = documents.find(d => d.id === documentId);
    if (selectedDoc) {
      setCurrentFile({
        name: selectedDoc.filename,
        chunks: selectedDoc.total_chunks
      });
      setMessages([]);
      setMessages([
        {
          id: Date.now().toString(),
          type: 'assistant',
          content: `📖 Now viewing **"${selectedDoc.filename}"**. Ask me anything about it!`,
          timestamp: new Date()
        }
      ]);
    }
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Connecting to server...</p>
          <p className="text-sm text-gray-500 mt-2">Starting up your AI assistant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Smart PDF Q&A
                  </h1>
                  <p className="text-xs text-gray-500">Powered by AI • RAG Architecture</p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="hidden sm:block">
              {status?.using_mock_embeddings ? (
                <span className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm border border-yellow-200">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></span>
                  Mock Mode
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                  OpenAI Connected
                </span>
              )}
            </div>
            
            {/* Current file indicator */}
            {currentFile && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-37.5">
                    {currentFile.name}
                  </span>
                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                    {currentFile.chunks}
                  </span>
                </div>
                <button
                  onClick={handleClearDocument}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1 hover:bg-red-50 px-2 py-1 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl p-6 animate-slide-right">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Documents</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentDocumentId === doc.id
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{doc.filename}</div>
                    <div className="text-xs text-gray-500 mt-1">{doc.total_chunks} sections</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No documents uploaded yet</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Document List (Desktop) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Your Documents
              </h2>
              
              {documents.length > 0 ? (
                <div className="space-y-2 max-h-125 overflow-y-auto pr-2">
                  <button
                    onClick={() => handleSelectDocument('')}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      !currentDocumentId
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">📚 All Documents</div>
                    <div className="text-xs text-gray-500 mt-1">Search across all PDFs</div>
                  </button>
                  
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        currentDocumentId === doc.id
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-medium text-sm truncate flex-1">{doc.filename}</div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full ml-2">
                          {doc.total_chunks}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(doc.upload_date).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">No documents yet</p>
                  <p className="text-xs mt-1">Upload a PDF to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-8">
            {/* Quick Stats */}
            {documents.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 uppercase">Total Docs</div>
                  <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 uppercase">Total Chunks</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {documents.reduce((acc, doc) => acc + doc.total_chunks, 0)}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 uppercase">Current Doc</div>
                  <div className="text-lg font-bold text-gray-900 truncate">
                    {currentFile?.name || 'None'}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 uppercase">Status</div>
                  <div className="text-sm font-medium text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Active
                  </div>
                </div>
              </div>
            )}

            {/* Upload Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Upload your PDF</h2>
              </div>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </section>

            {/* Chat Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Ask questions</h2>
                </div>
                {!currentFile && !currentDocumentId && (
                  <p className="text-sm text-amber-600 mt-2 ml-11">
                    ⚠️ Upload a PDF or select a document to start asking questions
                  </p>
                )}
              </div>
              <ChatInterface
                onSendMessage={handleSendMessage}
                messages={messages}
                disabled={!currentFile && !currentDocumentId}
              />
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <div>Smart PDF Q&A • RAG-powered document intelligence</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;