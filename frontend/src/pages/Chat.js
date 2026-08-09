import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader, BookOpen, Code2, Trash2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../App';
import { useTranslation } from '../i18n/translations';

const SESSION_KEY = 'rtf_chat_session';

export default function Chat() {
  const { lang, apiBase } = useApp();
  const { t } = useTranslation(lang);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem(SESSION_KEY) || `session_${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, sessionId);
    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${apiBase}/api/chat/history/${sessionId}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message immediately
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMessage, message_type: mode }]);

    try {
      const res = await fetch(`${apiBase}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, session_id: sessionId, mode })
      });
      const data = await res.json();

      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: tempId, role: 'user', content: userMessage, message_type: mode },
        { id: tempId + 1, role: 'assistant', content: data.response, message_type: mode, sources: data.sources }
      ]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: tempId + 1, role: 'assistant',
        content: `Error: ${e.message}`, message_type: mode
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(SESSION_KEY);
  };

  const modeConfig = {
    chat: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-600', label: t('chat.modes.chat') },
    rag: { icon: BookOpen, color: 'text-yellow-400', bg: 'bg-yellow-600', label: t('chat.modes.rag') },
    codegen: { icon: Code2, color: 'text-green-400', bg: 'bg-green-600', label: t('chat.modes.codegen') },
  };

  const suggestedQuestions = [
    "¿Cómo implementar process injection en Windows con Python?",
    "Explica técnicas de AMSI bypass para PowerShell",
    "¿Cómo crear un keylogger con persistencia en Linux?",
    "Técnicas de DNS tunneling para C2",
    "¿Cómo explotar SQLi blind con Python?",
    "Implementa un reverse shell en Go con cifrado",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare size={22} className="text-blue-400" />
          <h1 className="text-xl font-bold text-white">{t('chat.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode selector */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {Object.entries(modeConfig).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button key={key} onClick={() => setMode(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    mode === key ? `${cfg.bg} text-white` : 'text-gray-400 hover:text-white'
                  }`}>
                  <Icon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <button onClick={clearHistory} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Bot size={48} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">Asistente Red Team listo. Modo: <span className={modeConfig[mode].color}>{modeConfig[mode].label}</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 text-center">Preguntas sugeridas:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-left text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-300 px-3 py-2 rounded-lg transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} className="text-red-400" />
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-600/30 text-blue-100'
                  : 'bg-gray-900 border border-gray-800 text-gray-200'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.message_type === 'rag' && msg.role === 'assistant' && (
                <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <BookOpen size={10} />
                  {t('chat.sources')}: Knowledge Base
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-blue-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-red-400" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader size={14} className="animate-spin" />
                {t('chat.thinking')}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={2}
            className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none pr-12"
          />
        </div>
        <button onClick={handleSend} disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 rounded-xl flex items-center justify-center transition-colors">
          {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
