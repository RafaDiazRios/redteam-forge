import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Loader, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useApp } from '../App';
import { useTranslation } from '../i18n/translations';

function SeverityBadge({ severity }) {
  const config = {
    Critical: 'bg-red-600/30 text-red-300 border-red-600/50',
    High: 'bg-orange-600/30 text-orange-300 border-orange-600/50',
    Medium: 'bg-yellow-600/30 text-yellow-300 border-yellow-600/50',
    Low: 'bg-green-600/30 text-green-300 border-green-600/50',
    Info: 'bg-blue-600/30 text-blue-300 border-blue-600/50',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${config[severity] || config.Info}`}>{severity}</span>
  );
}

export default function Reports() {
  const { lang, apiBase } = useApp();
  const { t } = useTranslation(lang);
  const [reports, setReports] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [form, setForm] = useState({
    engagement_id: '', title: '', target: '', scan_output: '',
    artifact_ids: [], include_artifacts_output: true
  });

  const fetchAll = async () => {
    const [repRes, engRes, artRes] = await Promise.all([
      fetch(`${apiBase}/api/reports`).then(r => r.json()),
      fetch(`${apiBase}/api/clients/engagements`).then(r => r.json()),
      fetch(`${apiBase}/api/artifacts`).then(r => r.json()),
    ]);
    setReports(Array.isArray(repRes) ? repRes : []);
    setEngagements(Array.isArray(engRes) ? engRes : []);
    setArtifacts(Array.isArray(artRes) ? artRes : []);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleGenerate = async () => {
    if (!form.title.trim() || !form.engagement_id) return;
    setGenerating(true);
    try {
      const res = await fetch(`${apiBase}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, engagement_id: parseInt(form.engagement_id) })
      });
      const data = await res.json();
      await fetchAll();
      setShowForm(false);
      if (data.id) {
        const fullRes = await fetch(`${apiBase}/api/reports/${data.id}`);
        setSelectedReport(await fullRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId) => {
    window.open(`${apiBase}/api/reports/${reportId}/download`, '_blank');
  };

  const toggleArtifact = (id) => {
    setForm(f => ({
      ...f,
      artifact_ids: f.artifact_ids.includes(id)
        ? f.artifact_ids.filter(a => a !== id)
        : [...f.artifact_ids, id]
    }));
  };

  const severityIcon = (sev) => {
    if (sev === 'Critical' || sev === 'High') return <AlertTriangle size={14} className="text-red-400" />;
    if (sev === 'Medium') return <AlertTriangle size={14} className="text-yellow-400" />;
    return <Info size={14} className="text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={22} className="text-purple-400" />
          <h1 className="text-xl font-bold text-white">{t('reports.title')}</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          {t('reports.generate')}
        </button>
      </div>

      {/* Generation Form */}
      {showForm && (
        <div className="bg-gray-900 border border-purple-900/30 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">{t('reports.generate')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Engagement *</label>
              <select value={form.engagement_id} onChange={e => setForm(f => ({ ...f, engagement_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
                <option value="">Seleccionar engagement...</option>
                {engagements.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('reports.title_field')} *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Penetration Test Report - Q3 2025"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('reports.target')}</label>
            <input type="text" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="192.168.1.0/24, example.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('reports.scanOutput')}</label>
            <textarea value={form.scan_output} onChange={e => setForm(f => ({ ...f, scan_output: e.target.value }))} rows={5}
              placeholder="Pega aquí el output de nmap, nikto, metasploit, burp suite, o cualquier herramienta de escaneo..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-purple-500 resize-none" />
          </div>

          {/* Artifact selection */}
          {artifacts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="incArt" checked={form.include_artifacts_output}
                  onChange={e => setForm(f => ({ ...f, include_artifacts_output: e.target.checked }))} className="accent-purple-500" />
                <label htmlFor="incArt" className="text-xs text-gray-400">{t('reports.includeArtifacts')}</label>
              </div>
              {form.include_artifacts_output && (
                <div className="flex flex-wrap gap-2">
                  {artifacts.filter(a => a.status === 'executed').map(art => (
                    <button key={art.id} onClick={() => toggleArtifact(art.id)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        form.artifact_ids.includes(art.id)
                          ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}>
                      {art.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating || !form.title.trim() || !form.engagement_id}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
            {generating ? <><Loader size={18} className="animate-spin" /> Generando reporte con IA...</> : <><FileText size={18} /> {t('reports.generate')}</>}
          </button>
        </div>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('reports.noReports')}</p>
            </div>
          ) : (
            reports.map(report => (
              <div key={report.id}
                onClick={() => {
                  fetch(`${apiBase}/api/reports/${report.id}`).then(r => r.json()).then(setSelectedReport);
                }}
                className={`bg-gray-900 border rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors ${
                  selectedReport?.id === report.id ? 'border-purple-600/50' : 'border-gray-800'
                }`}>
                <div className="font-medium text-white text-sm mb-1">{report.title}</div>
                <div className="text-xs text-gray-500 mb-2">{new Date(report.created_at).toLocaleDateString()}</div>
                {report.severity_counts && (
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(report.severity_counts).filter(([, v]) => v > 0).map(([sev, count]) => (
                      <span key={sev} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                        {sev[0].toUpperCase()}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        {selectedReport && (
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">{selectedReport.title}</h2>
              <button onClick={() => handleDownload(selectedReport.id)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                <Download size={14} />
                {t('reports.download')}
              </button>
            </div>

            {selectedReport.executive_summary && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Executive Summary</h3>
                <p className="text-sm text-gray-400">{selectedReport.executive_summary}</p>
              </div>
            )}

            {selectedReport.severity_counts && (
              <div className="grid grid-cols-5 gap-2">
                {[
                  { key: 'critical', label: 'Critical', color: 'red' },
                  { key: 'high', label: 'High', color: 'orange' },
                  { key: 'medium', label: 'Medium', color: 'yellow' },
                  { key: 'low', label: 'Low', color: 'green' },
                  { key: 'info', label: 'Info', color: 'blue' },
                ].map(({ key, label, color }) => (
                  <div key={key} className={`bg-${color}-950/30 border border-${color}-800/30 rounded-xl p-2 text-center`}>
                    <div className={`text-xl font-bold text-${color}-400`}>{selectedReport.severity_counts[key] || 0}</div>
                    <div className={`text-xs text-${color}-600`}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {selectedReport.findings && selectedReport.findings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">{t('reports.findings')} ({selectedReport.findings.length})</h3>
                <div className="space-y-3">
                  {selectedReport.findings.map((finding, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {severityIcon(finding.severity)}
                        <span className="text-sm font-medium text-white">{finding.title}</span>
                        <SeverityBadge severity={finding.severity} />
                        {finding.cve && <span className="text-xs text-gray-500">{finding.cve}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{finding.description}</p>
                      {finding.remediation && (
                        <div className="mt-2 pt-2 border-t border-gray-800">
                          <span className="text-xs text-green-400 font-medium">Remediation: </span>
                          <span className="text-xs text-gray-400">{finding.remediation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Remediation Roadmap</h3>
                <ol className="space-y-1">
                  {selectedReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-purple-400 font-medium flex-shrink-0">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
