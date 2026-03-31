'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, Redemption } from '@/lib/api';
import { Download } from 'lucide-react';

export default function RedemptionsPage() {
  const [data, setData] = useState<{ items: Redemption[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const load = useCallback(() => {
    setLoading(true);
    api.getRedemptions(page, limit)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    if (!data) return;
    const headers = ['ID', 'Teléfono', 'Nombre', 'Cédula', 'Código Raspadito', 'Código DGo', 'Estado', 'Fecha'];
    const rows = data.items.map((r) => [
      r.id, r.phone, r.name, r.cedula, r.scratchCode, r.dgoCode, r.status,
      new Date(r.redeemedAt).toLocaleString('es-CO'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redenciones-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Redenciones {data && <span className="text-gray-400 text-base font-normal">({data.total} total)</span>}
        </h2>
        <button
          onClick={exportCSV}
          disabled={!data}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['#', 'Teléfono', 'Nombre', 'Cédula', 'Raspadito', 'DGo', 'Fecha'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Cargando...</td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No hay redenciones aún.</td>
                </tr>
              ) : (
                data?.items.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{r.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.phone}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.cedula}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.scratchCode}</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-600">{r.dgoCode}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.redeemedAt).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
