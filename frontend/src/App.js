import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Shield, Users, Target, Code2, MessageSquare, BookOpen,
  FileText, Wrench, Settings, Menu, X, Globe, ChevronRight,
  Zap, AlertTriangle
} from 'lucide-react';
import { useTranslation } from './i18n/translations';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Engagements from './pages/Engagements';
import Artifacts from './pages/Artifacts';
import Chat from './pages/Chat';
import KnowledgeBase from './pages/KnowledgeBase';
import Reports from './pages/Reports';

// Context
export const AppContext = createContext({});

export const useApp = () => useContext(AppContext);

const API_BASE = 'http://localhost:8000';

function Sidebar({ isOpen, onClose, lang }) {
  const { t } = useTranslation(lang);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Shield, label: t('nav.dashboard') },
    { path: '/clients', icon: Users, label: t('nav.clients') },
    { path: '/engagements', icon: Target, label: t('nav.engagements') },
    { path: '/artifacts', icon: Code2, label: t('nav.artifacts') },
    { path: '/chat', icon: MessageSquare, label: t('nav.chat') },
    { path: '/knowledge', icon: BookOpen, label: t('nav.knowledge') },
    { path: '/reports', icon: FileText, label: t('nav.reports') },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-red-900/30 z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-red-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">RedTeam</span>
              <span className="text-red-500 font-bold text-sm"> Forge</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Warning badge */}
        <div className="mx-3 mt-3 p-2 bg-red-950/50 border border-red-800/50 rounded-lg">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-red-400 text-xs font-medium">AUTHORIZED USE ONLY</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 mt-2 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-red-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span>{label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-red-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
            <Zap size={12} className="text-green-500" />
            <span>Powered by Claude AI</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenuToggle, lang, onLangToggle }) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-14 bg-gray-900 border-b border-gray-800 z-10 flex items-center justify-between px-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-gray-400 hover:text-white"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-2 ml-auto">
        {/* Language Toggle */}
        <button
          onClick={onLangToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
        >
          <Globe size={14} />
          <span className="font-medium">{lang === 'es' ? 'ES' : 'EN'}</span>
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">API Online</span>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState('es');
  const [selectedEngagement, setSelectedEngagement] = useState(null);

  const toggleLang = () => setLang(l => l === 'es' ? 'en' : 'es');

  const contextValue = {
    lang,
    apiBase: API_BASE,
    selectedEngagement,
    setSelectedEngagement
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            lang={lang}
          />

          <Header
            onMenuToggle={() => setSidebarOpen(true)}
            lang={lang}
            onLangToggle={toggleLang}
          />

          {/* Main content */}
          <main className="lg:ml-64 pt-14 min-h-screen">
            <div className="p-4 lg:p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/engagements" element={<Engagements />} />
                <Route path="/artifacts" element={<Artifacts />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
