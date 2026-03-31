'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

type Result = { loaded: number; duplicates: number } | null;

function CodeUploader({
  title,
  description,
  onUpload,
}: {
  title: string;
  description: string;
  onUpload: (codes: string[]) => Promise<Result>;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setError('');
    setLoading(true);

    Papa.parse<string[]>(file, {
      complete: async (parsed) => {
        // Acepta CSV con o sin header — toma primera columna de cada fila
        const codes = parsed.data
          .flat()
          .map((v) => String(v).trim())
          .filter((v) => v.length > 0 && v.toLowerCase() !== 'code' && v.toLowerCase() !== 'codigo');

        try {
          const res = await onUpload(codes);
          setResult(res);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Error al cargar');
        } finally {
          setLoading(false);
          e.target.value = '';
        }
      },
      error: () => {
        setError('No se pudo leer el archivo CSV');
        setLoading(false);
      },
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
        <Upload size={24} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-600">
          {loading ? 'Cargando...' : 'Seleccionar archivo CSV'}
        </span>
        <span className="text-xs text-gray-400">Una columna por código</span>
        <input type="file" accept=".csv" onChange={handleFile} disabled={loading} className="hidden" />
      </label>

      {result && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-semibold">{result.loaded} códigos cargados correctamente</p>
            {result.duplicates > 0 && (
              <p className="text-green-600 mt-0.5">{result.duplicates} duplicados ignorados</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}

export default function CodesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Cargar códigos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CodeUploader
          title="Códigos raspadito"
          description="Códigos impresos en las tarjetas físicas entregadas en tienda."
          onUpload={(codes) => api.loadScratchCodes(codes)}
        />
        <CodeUploader
          title="Códigos DGo"
          description="Vouchers de 1 mes de DGo proporcionados por el cliente en CSV."
          onUpload={(codes) => api.loadDgoCodes(codes)}
        />
      </div>
    </div>
  );
}
