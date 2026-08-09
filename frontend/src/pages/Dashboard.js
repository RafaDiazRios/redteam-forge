import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Target, Code2, FileText, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { useApp } from '../App';
import { useTranslation } from '../i18n/translations';

export default function Dashboard() {
  const { lang, apiBase } = useApp();
  const { t } = useTranslation(lang);
  const [stats, setStats] = useState({ clients: 0, engagements: 0, artifacts: 0, reports: 0 });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, engagementsRes, artifactsRes, reportsRes, healthRes] = await Promise.all([
          fetch(`${apiBase}/api/clients`).then(r => r.json()),
          fetch(`${apiBase}/api/clients/engagements`).then(r => r.json()),
          fetch(`${apiBase}/api/artifacts`).then(r => r.json()),
          fetch(`${apiBase}/api/reports`).then(r => r.json()),
          fetch(`${apiBase}/api/health`).then(r => r.json()),
        ]);
        setStats({
          clients: Array.isArray(clientsRes) ? clientsRes.length : 0,
          engagements: Array.isArray(engagementsRes) ? engagementsRes.filter(e => e.status === 'active').length : 0,
          artifacts: Array.isArray(artifactsRes) ? artifactsRes.length : 0,
          reports: Array.isArray(reportsRes) ? reportsRes.length : 0,
        });
        setHealth(healthRes);
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiBase]);

  const statCards = [
    { label: t('dashboard.totalClients'), value: stats.clients, icon: Users, color: 'blue', path: '/clients' },
    { label: t('dashboard.activeEngagements'), value: stats.engagements, icon: Target, color: 'green', path: '/engagements' },
    { label: t('dashboard.totalArtifacts'), value: stats.artifacts, icon: Code2, color: 'red', path: '/artifacts' },
    { label: t('dashboard.totalReports'), value: stats.reports, icon: FileText, color: 'purple', path: '/reports' },
  ];

  const colorMap = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  const quickActions = [
    { label: t('dashboard.newArtifact'), icon: Code2, path: '/artifacts', color: 'bg-red-600 hover:bg-red-700' },
    { label: t('dashboard.newEngagement'), icon: Target, path: '/engagements', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: t('dashboard.askKnowledge'), icon: Zap, path: '/knowledge', color: 'bg-yellow-600 hover:bg-yellow-700' },
    { label: t('dashboard.generateReport'), icon: FileText, path: '/reports', color: 'bg-green-600 hover:bg-green-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
          <p className="text-gray-400 text-sm">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* System Status */}
      {health && (
        <div className={`p-4 rounded-xl border ${health.status === 'healthy' ? 'bg-green-950/30 border-green-800/30' : 'bg-red-950/30 border-red-800/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${health.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-gray-300">
              Sistema: {health.status === 'healthy' ? 'Operacional' : 'Error'} |
              RAG: {health.rag_initialized ? '✓ Listo' : '⏳ Inicializando...'} |
              API Key: {health.anthropic_key_set ? '✓ Configurada' : '✗ No configurada'}
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, path }) => (
          <Link key={path} to={path}>
            <div className={`p-4 rounded-xl border ${colorMap[color]} hover:scale-105 transition-transform cursor-pointer`}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} />
                <TrendingUp size={14} className="opacity-50" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '...' : value}</div>
              <div className="text-xs mt-1 opacity-80">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, path, color }) => (
            <Link key={path} to={path}>
              <button className={`w-full ${color} text-white px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors`}>
                <Icon size={18} />
                {label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Technique Categories */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Categorías de Técnicas Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Evasión AV/EDR', items: ['Process Injection', 'AMSI Bypass', 'Reflective Loading', 'Code Obfuscation', 'Fileless Execution'], color: 'red' },
            { title: 'Persistencia', items: ['Registry Run Keys', 'Scheduled Tasks', 'WMI Subscriptions', 'Service Installation', 'DLL Hijacking'], color: 'orange' },
            { title: 'C2 Channels', items: ['HTTPS Beaconing', 'DNS Tunneling', 'ICMP Tunneling', 'GitHub C2', 'Domain Fronting'], color: 'yellow' },
            { title: 'Web Attacks', items: ['SQLi', 'XSS', 'SSRF', 'SSTI', 'Deserialization'], color: 'blue' },
            { title: 'Network Attacks', items: ['Kerberoasting', 'Pass-the-Hash', 'SMB Relay', 'LLMNR Poisoning', 'Golden Ticket'], color: 'purple' },
            { title: 'Malware Types', items: ['RAT', 'Keylogger', 'Ransomware', 'Rootkit', 'Backdoor'], color: 'green' },
          ].map(({ title, items, color }) => (
            <div key={title} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className={`text-sm font-semibold text-${color}-400 mb-2`}>{title}</h3>
              <div className="flex flex-wrap gap-1">
                {items.map(item => (
                  <span key={item} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
