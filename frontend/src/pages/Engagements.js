import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, CheckCircle, PauseCircle, PlayCircle } from 'lucide-react';
import { useApp } from '../App';
import { useTranslation } from '../i18n/translations';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function Engagements() {
  const { lang, apiBase, setSelectedEngagement } = useApp();
  const { t } = useTranslation(lang);
  const [engagements, setEngagements] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEng, setEditEng] = useState(null);
  const [form, setForm] = useState({ client_id: '', name: '', scope: '', targets: '', status: 'active', notes: '', authorization_doc: '' });
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    const [engRes, clientRes] = await Promise.all([
      fetch(`${apiBase}/api/clients/engagements`).then(r => r.json()),
      fetch(`${apiBase}/api/clients`).then(r => r.json()),
    ]);
    setEngagements(Array.isArray(engRes) ? engRes : []);
    setClients(Array.isArray(clientRes) ? clientRes : []);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditEng(null);
    setForm({ client_id: clients[0]?.id || '', name: '', scope: '', targets: '', status: 'active', notes: '', authorization_doc: '' });
    setShowModal(true);
  };

  const openEdit = (eng) => {
    setEditEng(eng);
    setForm({ client_id: eng.client_id, name: eng.name, scope: eng.scope || '', targets: eng.targets || '', status: eng.status, notes: eng.notes || '', authorization_doc: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.client_id) return;
    setLoading(true);
    const url = editEng ? `${apiBase}/api/clients/engagements/${editEng.id}` : `${apiBase}/api/clients/engagements`;
    const method = editEng ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, client_id: parseInt(form.client_id) }) });
    await fetchAll();
    setShowModal(false);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este engagement?')) return;
    await fetch(`${apiBase}/api/clients/engagements/${id}`, { method: 'DELETE' });
    await fetchAll();
  };

  const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Unknown';

  const statusConfig = {
    active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: PlayCircle, label: t('engagements.active') },
    completed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle, label: t('engagements.completed') },
    paused: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: PauseCircle, label: t('engagements.paused') },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target size={22} className="text-green-400" />
          <h1 className="text-xl font-bold text-white">{t('engagements.title')}</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          {t('engagements.addEngagement')}
        </button>
      </div>

      {engagements.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Target size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('engagements.noEngagements')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {engagements.map(eng => {
            const sc = statusConfig[eng.status] || statusConfig.active;
            const StatusIcon = sc.icon;
            return (
              <div
                key={eng.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors cursor-pointer"
                onClick={() => setSelectedEngagement(eng)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{eng.name}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                        <StatusIcon size={10} />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      <span className="text-blue-400">{getClientName(eng.client_id)}</span>
                    </p>
                    {eng.scope && (
                      <p className="text-xs text-gray-500 mb-1"><span className="text-gray-400">Scope:</span> {eng.scope}</p>
                    )}
                    {eng.targets && (
                      <p className="text-xs text-gray-500"><span className="text-gray-400">Targets:</span> {eng.targets}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={e => { e.stopPropagation(); openEdit(eng); }} className="text-gray-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-800">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(eng.id); }} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editEng ? 'Editar Engagement' : t('engagements.addEngagement')} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('engagements.client')} *</label>
              <select
                value={form.client_id}
                onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('engagements.name')} *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('engagements.scope')}</label>
              <textarea value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} rows={2}
                placeholder="Ej: Red team completo sobre infraestructura web y red interna"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('engagements.targets')}</label>
              <textarea value={form.targets} onChange={e => setForm(f => ({ ...f, targets: e.target.value }))} rows={2}
                placeholder="192.168.1.0/24, example.com, 10.0.0.1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('engagements.status')}</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                <option value="active">{t('engagements.active')}</option>
                <option value="paused">{t('engagements.paused')}</option>
                <option value="completed">{t('engagements.completed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('engagements.notes')}</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={loading || !form.name.trim() || !form.client_id}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors">
                {loading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
