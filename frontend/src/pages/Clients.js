import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useApp } from '../App';
import { useTranslation } from '../i18n/translations';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { lang, apiBase } = useApp();
  const { t } = useTranslation(lang);
  const [clients, setClients] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [engagements, setEngagements] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    const res = await fetch(`${apiBase}/api/clients`);
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchClients(); }, []);

  const toggleExpand = async (clientId) => {
    const newExpanded = { ...expanded, [clientId]: !expanded[clientId] };
    setExpanded(newExpanded);
    if (newExpanded[clientId] && !engagements[clientId]) {
      const res = await fetch(`${apiBase}/api/clients/${clientId}/engagements`);
      const data = await res.json();
      setEngagements(prev => ({ ...prev, [clientId]: Array.isArray(data) ? data : [] }));
    }
  };

  const openAdd = () => {
    setEditClient(null);
    setForm({ name: '', company: '', email: '', phone: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditClient(client);
    setForm({ name: client.name, company: client.company || '', email: client.email || '', phone: client.phone || '', notes: client.notes || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const url = editClient ? `${apiBase}/api/clients/${editClient.id}` : `${apiBase}/api/clients`;
    const method = editClient ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    await fetchClients();
    setShowModal(false);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('clients.confirmDelete'))) return;
    await fetch(`${apiBase}/api/clients/${id}`, { method: 'DELETE' });
    await fetchClients();
  };

  const statusColor = (status) => ({
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
  }[status] || 'bg-gray-500/20 text-gray-400');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-blue-400" />
          <h1 className="text-xl font-bold text-white">{t('clients.title')}</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          {t('clients.addClient')}
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('clients.noClients')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">{client.name[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{client.name}</div>
                    <div className="text-sm text-gray-400">{client.company || '—'} {client.email ? `· ${client.email}` : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleExpand(client.id)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800">
                    {expanded[client.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => openEdit(client)} className="text-gray-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-800">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expanded[client.id] && (
                <div className="border-t border-gray-800 p-4 bg-gray-950/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">{t('clients.engagements')}</span>
                  </div>
                  {(engagements[client.id] || []).length === 0 ? (
                    <p className="text-sm text-gray-500">{t('engagements.noEngagements')}</p>
                  ) : (
                    <div className="space-y-2">
                      {(engagements[client.id] || []).map(eng => (
                        <div key={eng.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                          <div>
                            <div className="text-sm font-medium text-white">{eng.name}</div>
                            <div className="text-xs text-gray-500">{eng.targets || 'Sin objetivos definidos'}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColor(eng.status)}`}>
                            {t(`engagements.${eng.status}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editClient ? t('clients.editClient') : t('clients.addClient')} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {[
              { key: 'name', label: t('clients.name'), required: true },
              { key: 'company', label: t('clients.company') },
              { key: 'email', label: t('clients.email'), type: 'email' },
              { key: 'phone', label: t('clients.phone') },
            ].map(({ key, label, required, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}{required && ' *'}</label>
                <input
                  type={type || 'text'}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('clients.notes')}</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={loading || !form.name.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors">
                {loading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
