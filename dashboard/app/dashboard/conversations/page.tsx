'use client';

import { useEffect, useState, useRef } from 'react';
import { api, ConversationSummary, Message } from '@/lib/api';
import { Download, MessageSquare, ChevronLeft } from 'lucide-react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [page]);

  useEffect(() => {
    if (selected) fetchThread(selected);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const res = await api.getConversations(page, 50);
      setConversations(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  async function fetchThread(phone: string) {
    setThreadLoading(true);
    try {
      const msgs = await api.getThread(phone);
      setThread(msgs);
    } finally {
      setThreadLoading(false);
    }
  }

  function exportAllCSV() {
    const rows = [
      ['Teléfono', 'Último mensaje', 'Total mensajes'],
      ...conversations.map((c) => [c.phone, c.lastMessage, c.total]),
    ];
    downloadCSV(rows, 'conversaciones.csv');
  }

  function exportThreadCSV() {
    if (!thread.length) return;
    const rows = [
      ['ID', 'Teléfono', 'Dirección', 'Mensaje', 'Fecha'],
      ...thread.map((m) => [
        String(m.id),
        m.phone,
        m.direction === 'in' ? 'Entrada' : 'Salida',
        m.text,
        new Date(m.timestamp).toLocaleString('es-CO'),
      ]),
    ];
    downloadCSV(rows, `conversacion_${selected}.csv`);
  }

  function downloadCSV(rows: string[][], filename: string) {
    const content = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6">
      {/* Left panel — conversation list */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Conversaciones</h2>
            <p className="text-xs text-gray-400 mt-0.5">{total} usuarios</p>
          </div>
          <button
            onClick={exportAllCSV}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            title="Exportar todas"
          >
            <Download size={14} />
            Exportar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-400">Cargando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Sin conversaciones aún</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.phone}
                onClick={() => setSelected(c.phone)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selected === c.phone ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${selected === c.phone ? 'text-blue-700' : 'text-gray-900'}`}>
                    {c.phone}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {c.total}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{formatDate(c.lastMessage)}</p>
              </button>
            ))
          )}
        </div>

        {total > 50 && (
          <div className="p-3 border-t border-gray-100 flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs text-gray-500 disabled:opacity-30 hover:text-blue-600"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-400">Pág. {page}</span>
            <button
              disabled={page * 50 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs text-gray-500 disabled:opacity-30 hover:text-blue-600"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Right panel — thread */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageSquare size={48} strokeWidth={1} />
            <p className="mt-3 text-sm">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 md:hidden"
                >
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected}</p>
                  <p className="text-xs text-gray-400">{thread.length} mensajes</p>
                </div>
              </div>
              <button
                onClick={exportThreadCSV}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Download size={14} />
                Exportar chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {threadLoading ? (
                <div className="text-center text-sm text-gray-400 pt-10">Cargando mensajes...</div>
              ) : thread.length === 0 ? (
                <div className="text-center text-sm text-gray-400 pt-10">Sin mensajes</div>
              ) : (
                thread.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.direction === 'out'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          m.direction === 'out' ? 'text-blue-200' : 'text-gray-400'
                        }`}
                      >
                        {formatDate(m.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
