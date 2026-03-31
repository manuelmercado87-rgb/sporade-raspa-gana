'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Stats {
  redemptions: number;
  scratchCodes: { total: number; used: number; available: number };
  dgoCodes: { total: number; delivered: number; available: number };
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Cargando...</p>;
  if (!stats) return <p className="text-red-500">Error cargando estadísticas.</p>;

  const chartData = [
    { name: 'Scratch usados', value: stats.scratchCodes.used, color: '#3b82f6' },
    { name: 'Scratch disponibles', value: stats.scratchCodes.available, color: '#e5e7eb' },
    { name: 'DGo entregados', value: stats.dgoCodes.delivered, color: '#10b981' },
    { name: 'DGo disponibles', value: stats.dgoCodes.available, color: '#d1fae5' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-900">Resumen de campaña</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Canjes realizados" value={stats.redemptions} />
        <StatCard
          label="Códigos raspadito"
          value={stats.scratchCodes.available}
          sub={`${stats.scratchCodes.used} usados / ${stats.scratchCodes.total} total`}
        />
        <StatCard
          label="Códigos DGo disponibles"
          value={stats.dgoCodes.available}
          sub={`${stats.dgoCodes.delivered} entregados / ${stats.dgoCodes.total} total`}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribución de stock</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
