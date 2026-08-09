import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Loader, CheckCircle, RefreshCw, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../App';
import { useTranslation } from '../i18n/translations';

const BOOK_COLORS = ['blue', 'green', 'yellow', 'purple'];

export default function KnowledgeBase() {
  const { lang, apiBase } = useApp();
  const { t } = useTranslation(lang);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [ragStatus, setRagStatus] = useState(null);

  const books = t('knowledge.books');

  useEffect(() => { checkStatus(); }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/api/health`);
      const data = await res.json();
      setRagStatus(data);
    } catch (e) {}
  };

  const handleSearch = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    setSources([]);
    try {
      const res = await fetch(`${apiBase}/api/chat/rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (e) {
      setAnswer(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitRAG = async () => {
    setInitializing(true);
    try {
      await fetch(`${apiBase}/api/chat/rag/initialize`, { method: 'POST' });
      await checkStatus();
    } catch (e) {}
    setInitializing(false);
  };

  const sampleQuestions = [
    "¿Qué técnicas de process injection describe el libro de malware development?",
    "¿Cómo implementar un keylogger en Python según el libro de Advanced Python?",
    "¿Cuáles son las técnicas de bypass de WAF descritas en Web Hacking Arsenal?",
    "¿Cómo funciona el ataque Kerberoasting según The Hack Is Back?",
    "¿Qué técnicas de evasión de AV se mencionan en los libros?",
    "¿Cómo crear un C2 con DNS tunneling?",
    "Explica las técnicas de SQL injection avanzadas del libro de web hacking",
    "¿Qué es un rootkit y cómo se implementa según Zhussupov?",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen size={22} className="text-yellow-400" />
            <h1 className="text-xl font-bold text-white">{t('knowledge.title')}</h1>
          </div>
          <p className="text-sm text-gray-400 ml-9">{t('knowledge.subtitle')}</p>
        </div>
        <button onClick={handleInitRAG} disabled={initializing}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {initializing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {t('knowledge.initRAG')}
        </button>
      </div>

      {/* RAG Status */}
      {ragStatus && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
          ragStatus.rag_initialized ? 'bg-green-950/30 border-green-800/30' : 'bg-yellow-950/30 border-yellow-800/30'
        }`}>
          <Database size={16} className={ragStatus.rag_initialized ? 'text-green-400' : 'text-yellow-400'} />
          <span className="text-gray-300">
            {t('knowledge.ragStatus')}: {ragStatus.rag_initialized
              ? `✓ Listo (${ragStatus.rag_use_faiss ? 'FAISS Vector Index' : 'Text Search'})`
              : '⏳ Inicializando índice...'}
          </span>
        </div>
      )}

      {/* Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.isArray(books) && books.map((book, i) => (
          <div key={i} className={`bg-gray-900 border border-${BOOK_COLORS[i]}-900/30 rounded-xl p-3`}>
            <div className={`w-8 h-8 bg-${BOOK_COLORS[i]}-600/20 rounded-lg flex items-center justify-center mb-2`}>
              <BookOpen size={16} className={`text-${BOOK_COLORS[i]}-400`} />
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{book}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={t('knowledge.searchPlaceholder')}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
          <button onClick={handleSearch} disabled={loading || !question.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            {t('knowledge.search')}
          </button>
        </div>

        {/* Sample questions */}
        <div className="flex flex-wrap gap-1.5">
          {sampleQuestions.map(q => (
            <button key={q} onClick={() => setQuestion(q)}
              className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-gray-300 px-2.5 py-1 rounded-full transition-colors">
              {q.slice(0, 50)}...
            </button>
          ))}
        </div>
      </div>

      {/* Answer */}
      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <Loader size={24} className="animate-spin text-yellow-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Buscando en la base de conocimiento...</p>
        </div>
      )}

      {answer && !loading && (
        <div className="bg-gray-900 border border-yellow-900/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">{t('knowledge.results')}</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>

          {sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Fragmentos consultados:</p>
              <div className="space-y-2">
                {sources.map((src, i) => (
                  <div key={i} className="bg-gray-950 rounded-lg p-3">
                    <div className="text-xs text-yellow-400 mb-1">{src.source}</div>
                    <p className="text-xs text-gray-500">{src.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
