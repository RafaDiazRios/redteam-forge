import React, { useState, useEffect, useRef } from 'react';
import { Code2, Plus, Play, Cpu, Eye, Edit3, Trash2, Copy, Check, ChevronDown, Terminal, Loader, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../App';
import { useTranslation } from '../i18n/translations';

const ARTIFACT_TYPES = [
  { id: 'rat', name: 'Remote Access Trojan (RAT)' },
  { id: 'keylogger', name: 'Keylogger' },
  { id: 'ransomware', name: 'Ransomware (Simulation)' },
  { id: 'rootkit', name: 'Rootkit' },
  { id: 'backdoor', name: 'Backdoor' },
  { id: 'c2', name: 'C2 Framework' },
  { id: 'reverse_shell', name: 'Reverse Shell' },
  { id: 'bind_shell', name: 'Bind Shell' },
  { id: 'web_shell', name: 'Web Shell' },
  { id: 'exploit', name: 'Exploit' },
  { id: 'payload', name: 'Payload' },
  { id: 'dropper', name: 'Dropper/Stager' },
  { id: 'av_bypass', name: 'AV/EDR Bypass' },
  { id: 'privilege_escalation', name: 'Privilege Escalation' },
  { id: 'lateral_movement', name: 'Lateral Movement' },
  { id: 'exfiltration', name: 'Data Exfiltration' },
  { id: 'persistence', name: 'Persistence Mechanism' },
  { id: 'recon', name: 'Reconnaissance Tool' },
  { id: 'scanner', name: 'Vulnerability Scanner' },
  { id: 'fuzzer', name: 'Fuzzer' },
  { id: 'phishing', name: 'Phishing Framework' },
  { id: 'custom', name: 'Custom Tool' },
];

const LANGUAGES = ['Python', 'C', 'C++', 'Go', 'Rust', 'PowerShell', 'Bash', 'JavaScript', 'PHP', 'Ruby', 'Java', 'C#', 'Assembly'];

const TECHNIQUES = {
  evasion: ['Process Injection', 'Process Hollowing', 'DLL Injection', 'Reflective Loading', 'AMSI Bypass', 'ETW Bypass', 'Sandbox Detection', 'VM Detection', 'Timestomping', 'Code Obfuscation', 'Packing', 'Encryption', 'LOLBins', 'Fileless Execution'],
  persistence: ['Registry Run Keys', 'Scheduled Tasks', 'WMI Subscriptions', 'Startup Folder', 'Service Installation', 'Bootkit', 'DLL Hijacking', 'COM Hijacking'],
  c2: ['HTTPS Beaconing', 'DNS Tunneling', 'ICMP Tunneling', 'SMB Named Pipes', 'Slack C2', 'GitHub C2', 'Cloud Storage C2', 'Domain Fronting'],
  network: ['ARP Spoofing', 'DNS Poisoning', 'SMB Relay', 'LLMNR Poisoning', 'Kerberoasting', 'Pass-the-Hash', 'Pass-the-Ticket', 'Golden Ticket'],
};

function StatusBadge({ status }) {
  const config = {
    generated: { color: 'bg-blue-500/20 text-blue-400', icon: Code2, label: 'Generated' },
    compiled: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Compiled' },
    executed: { color: 'bg-purple-500/20 text-purple-400', icon: Play, label: 'Executed' },
    compile_failed: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Compile Failed' },
    execution_failed: { color: 'bg-orange-500/20 text-orange-400', icon: AlertCircle, label: 'Exec Failed' },
  };
  const c = config[status] || config.generated;
  const Icon = c.icon;
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${c.color}`}>
      <Icon size={10} />
      {c.label}
    </span>
  );
}

function CodeModal({ artifact, onClose, onSave }) {
  const [code, setCode] = useState(artifact?.source_code || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold">{artifact?.name}</h3>
            <span className="text-xs text-gray-400">{artifact?.language} · {artifact?.artifact_type}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => onSave(code)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg">Save</button>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          className="flex-1 bg-gray-950 text-green-400 font-mono text-sm p-4 resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function ExecuteModal({ artifact, onClose, onExecute }) {
  const [args, setArgs] = useState('');
  const [timeout, setTimeout_] = useState(30);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleExecute = async () => {
    setRunning(true);
    const r = await onExecute(artifact.id, args.split(' ').filter(Boolean), timeout);
    setResult(r);
    setRunning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-white font-semibold flex items-center gap-2"><Terminal size={18} className="text-green-400" /> Execute: {artifact?.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Arguments (space separated)</label>
            <input type="text" value={args} onChange={e => setArgs(e.target.value)} placeholder="--target 192.168.1.1 --port 4444"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Timeout (seconds)</label>
            <input type="number" value={timeout} onChange={e => setTimeout_(parseInt(e.target.value))} min={5} max={300}
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
          </div>

          {result && (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {result.success ? 'Execution successful' : `Exit code: ${result.returncode}`}
              </div>
              {result.stdout && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">STDOUT:</div>
                  <pre className="bg-gray-950 text-green-400 text-xs p-3 rounded-lg overflow-auto max-h-48 font-mono">{result.stdout}</pre>
                </div>
              )}
              {result.stderr && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">STDERR:</div>
                  <pre className="bg-gray-950 text-red-400 text-xs p-3 rounded-lg overflow-auto max-h-32 font-mono">{result.stderr}</pre>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm">Cancel</button>
            <button onClick={handleExecute} disabled={running}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2">
              {running ? <><Loader size={14} className="animate-spin" /> Running...</> : <><Play size={14} /> Execute</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Artifacts() {
  const { lang, apiBase } = useApp();
  const { t } = useTranslation(lang);
  const [artifacts, setArtifacts] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [codeModal, setCodeModal] = useState(null);
  const [execModal, setExecModal] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [compiling, setCompiling] = useState({});
  const [genResponse, setGenResponse] = useState(null);
  const [selectedTechniques, setSelectedTechniques] = useState([]);
  const [form, setForm] = useState({
    engagement_id: '', name: '', artifact_type: 'reverse_shell', language: 'Python',
    description: '', target_info: '', auto_compile: true
  });

  const fetchAll = async () => {
    const [artRes, engRes] = await Promise.all([
      fetch(`${apiBase}/api/artifacts`).then(r => r.json()),
      fetch(`${apiBase}/api/clients/engagements`).then(r => r.json()),
    ]);
    setArtifacts(Array.isArray(artRes) ? artRes : []);
    setEngagements(Array.isArray(engRes) ? engRes : []);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleTechnique = (tech) => {
    setSelectedTechniques(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
  };

  const handleGenerate = async () => {
    if (!form.name.trim() || !form.description.trim()) return;
    setGenerating(true);
    setGenResponse(null);
    try {
      const res = await fetch(`${apiBase}/api/artifacts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          engagement_id: form.engagement_id ? parseInt(form.engagement_id) : 1,
          techniques: selectedTechniques,
          auto_compile: form.auto_compile
        })
      });
      const data = await res.json();
      setGenResponse(data);
      await fetchAll();
    } catch (e) {
      setGenResponse({ error: e.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleCompile = async (artifactId) => {
    setCompiling(prev => ({ ...prev, [artifactId]: true }));
    await fetch(`${apiBase}/api/artifacts/${artifactId}/compile`, { method: 'POST' });
    await fetchAll();
    setCompiling(prev => ({ ...prev, [artifactId]: false }));
  };

  const handleExecute = async (artifactId, args, timeout) => {
    const res = await fetch(`${apiBase}/api/artifacts/${artifactId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args, timeout })
    });
    return res.json();
  };

  const handleSaveCode = async (artifactId, code) => {
    await fetch(`${apiBase}/api/artifacts/${artifactId}/code`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: code })
    });
    await fetchAll();
    setCodeModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este artefacto?')) return;
    await fetch(`${apiBase}/api/artifacts/${id}`, { method: 'DELETE' });
    await fetchAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code2 size={22} className="text-red-400" />
          <h1 className="text-xl font-bold text-white">{t('artifacts.title')}</h1>
        </div>
        <button onClick={() => { setShowForm(!showForm); setGenResponse(null); }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          {t('artifacts.generate')}
        </button>
      </div>

      {/* Generation Form */}
      {showForm && (
        <div className="bg-gray-900 border border-red-900/30 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Code2 size={18} className="text-red-400" />
            {t('artifacts.generate')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Engagement */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('artifacts.selectEngagement')}</label>
              <select value={form.engagement_id} onChange={e => setForm(f => ({ ...f, engagement_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="">Sin engagement</option>
                {engagements.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('artifacts.name')} *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: reverse_shell_evasion_v1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('artifacts.type')}</label>
              <select value={form.artifact_type} onChange={e => setForm(f => ({ ...f, artifact_type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                {ARTIFACT_TYPES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('artifacts.language')}</label>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('artifacts.description')} *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              placeholder="Describe el comportamiento exacto que necesitas. Ej: RAT con persistencia en registro, keylogger, captura de pantalla cada 30s, exfiltración por HTTPS a C2 en puerto 443..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none" />
          </div>

          {/* Target Info */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('artifacts.targetInfo')}</label>
            <input type="text" value={form.target_info} onChange={e => setForm(f => ({ ...f, target_info: e.target.value }))}
              placeholder="Windows 11, x64, AV: Defender, EDR: CrowdStrike, red interna 192.168.1.0/24"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
          </div>

          {/* Techniques */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">{t('artifacts.techniques')}</label>
            <div className="space-y-2">
              {Object.entries(TECHNIQUES).map(([category, techs]) => (
                <div key={category}>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {techs.map(tech => (
                      <button key={tech} onClick={() => toggleTechnique(tech)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selectedTechniques.includes(tech)
                            ? 'bg-red-600/30 border-red-500/50 text-red-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}>
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-compile toggle */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="autocompile" checked={form.auto_compile} onChange={e => setForm(f => ({ ...f, auto_compile: e.target.checked }))}
              className="w-4 h-4 accent-red-500" />
            <label htmlFor="autocompile" className="text-sm text-gray-300">{t('artifacts.autoCompile')}</label>
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={generating || !form.name.trim() || !form.description.trim()}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
            {generating ? (
              <><Loader size={18} className="animate-spin" /> {t('artifacts.generating')}</>
            ) : (
              <><Code2 size={18} /> {t('artifacts.generate')}</>
            )}
          </button>

          {/* Generation result */}
          {genResponse && !genResponse.error && (
            <div className="bg-gray-950 border border-green-800/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-medium">Artefacto generado: {genResponse.name}</span>
                <StatusBadge status={genResponse.status} />
              </div>
              {genResponse.compile_result && (
                <div className={`text-xs ${genResponse.compile_result.success ? 'text-green-400' : 'text-red-400'} mb-2`}>
                  Compilación: {genResponse.compile_result.success ? '✓ Exitosa' : '✗ ' + genResponse.compile_result.error?.slice(0, 200)}
                </div>
              )}
              <div className="text-xs text-gray-500">ID: {genResponse.id} · Listo para ejecutar</div>
            </div>
          )}
          {genResponse?.error && (
            <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm">{genResponse.error}</div>
          )}
        </div>
      )}

      {/* Artifacts List */}
      {artifacts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Code2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('artifacts.noArtifacts')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artifacts.map(artifact => (
            <div key={artifact.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white">{artifact.name}</span>
                    <StatusBadge status={artifact.status} />
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{artifact.language}</span>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{artifact.artifact_type}</span>
                  </div>
                  {artifact.description && (
                    <p className="text-sm text-gray-400 mt-1">{artifact.description?.slice(0, 120)}{artifact.description?.length > 120 ? '...' : ''}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">{new Date(artifact.created_at).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => setCodeModal(artifact)} title="View/Edit Code"
                    className="text-gray-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-800">
                    <Eye size={15} />
                  </button>
                  {artifact.status === 'generated' || artifact.status === 'compile_failed' ? (
                    <button onClick={() => handleCompile(artifact.id)} disabled={compiling[artifact.id]} title="Compile"
                      className="text-gray-400 hover:text-yellow-400 p-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                      {compiling[artifact.id] ? <Loader size={15} className="animate-spin" /> : <Cpu size={15} />}
                    </button>
                  ) : null}
                  {artifact.status === 'compiled' || artifact.status === 'executed' ? (
                    <button onClick={() => setExecModal(artifact)} title="Execute"
                      className="text-gray-400 hover:text-green-400 p-1.5 rounded-lg hover:bg-gray-800">
                      <Play size={15} />
                    </button>
                  ) : null}
                  <button onClick={() => handleDelete(artifact.id)} title="Delete"
                    className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {codeModal && (
        <CodeModal
          artifact={codeModal}
          onClose={() => setCodeModal(null)}
          onSave={(code) => handleSaveCode(codeModal.id, code)}
        />
      )}

      {execModal && (
        <ExecuteModal
          artifact={execModal}
          onClose={() => setExecModal(null)}
          onExecute={handleExecute}
        />
      )}
    </div>
  );
}
