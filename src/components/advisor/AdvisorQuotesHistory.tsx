import React, { useState } from 'react';
import { ProjectRequest } from '../../types';
import {
  Search,
  Filter,
  Receipt,
  FileSpreadsheet,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  ArrowUpRight,
  X,
  FileText,
} from 'lucide-react';

interface QuoteRecord {
  folioSap: string;
  projectId: string;
  clientName: string;
  city: string;
  date: string;
  totalCOP: number;
  status: 'Aprobada SAP' | 'En Producción' | 'Entregada en Obra' | 'Pendiente Cliente';
  itemsSummary: string;
  advisor: string;
}

interface AdvisorQuotesHistoryProps {
  currentRequest?: ProjectRequest | null;
  onOpenDiagnosis?: (projectId: string) => void;
}

export const AdvisorQuotesHistory: React.FC<AdvisorQuotesHistoryProps> = ({
  currentRequest,
  onOpenDiagnosis,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<QuoteRecord | null>(null);

  const initialRecords: QuoteRecord[] = [
    {
      folioSap: 'VA01-450098231',
      projectId: currentRequest?.id || 'PTC-2024-8924',
      clientName: currentRequest?.client?.fullName || 'Andrés Cepeda',
      city: currentRequest?.city || 'Bogotá DC',
      date: '2026-05-12 11:20',
      totalCOP: 416024,
      status: 'Aprobada SAP',
      itemsSummary: '1 Galón Viniltex Terracota + 2 Cuartos + 1 Galón Blanco Lienzo + 1 Gal Sellador 501',
      advisor: 'Ing. Carlos Ruiz',
    },
    {
      folioSap: 'VA01-450098114',
      projectId: 'REQ-2026-7841',
      clientName: 'Constructora & Diseños Andinos SAS',
      city: 'Bogotá DC',
      date: '2026-05-10 15:45',
      totalCOP: 1349500,
      status: 'En Producción',
      itemsSummary: '11 Galones Viniltex Avanzado Arena Cálido + 5 Galones Sellomax Imprimante',
      advisor: 'Ing. Carlos Ruiz',
    },
    {
      folioSap: 'VA01-450097940',
      projectId: 'PTC-2024-8890',
      clientName: 'Hospital Infantil Los Ángeles',
      city: 'Pasto',
      date: '2026-05-08 09:30',
      totalCOP: 2890000,
      status: 'Entregada en Obra',
      itemsSummary: '24 Galones Viniltex Antibacterial Grado Quirúrgico + Sellador Epóxico',
      advisor: 'Ing. Carlos Ruiz',
    },
    {
      folioSap: 'VA01-450097611',
      projectId: 'PTC-2024-8845',
      clientName: 'Torres del Parque Residencial',
      city: 'Medellín',
      date: '2026-05-05 16:15',
      totalCOP: 4210000,
      status: 'Entregada en Obra',
      itemsSummary: '30 Canecas Koraza 10 Años Blanco Colonial + Hidrófugo Silicón',
      advisor: 'Ing. Carlos Ruiz',
    },
    {
      folioSap: 'COT-2024-8919',
      projectId: 'PTC-2024-8919',
      clientName: 'Dra. Valentina Morales',
      city: 'Bogotá DC',
      date: '2026-05-04 10:00',
      totalCOP: 540000,
      status: 'Pendiente Cliente',
      itemsSummary: '4 Galones Viniltex Satinado Blanco Puro + Kit Masilla Acrílica',
      advisor: 'Ing. Carlos Ruiz',
    },
  ];

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filtered = initialRecords.filter((rec) => {
    const matchesSearch =
      rec.folioSap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.projectId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'sap' && rec.status === 'Aprobada SAP') ||
      (selectedStatus === 'prod' && rec.status === 'En Producción') ||
      (selectedStatus === 'entregada' && rec.status === 'Entregada en Obra') ||
      (selectedStatus === 'pendiente' && rec.status === 'Pendiente Cliente');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight">
            Historial de Cotizaciones & Órdenes SAP
          </h1>
          <p className="text-xs sm:text-sm text-[#7f765f] mt-1">
            Registro auditable de propuestas comerciales aprobadas, radicados y órdenes de venta VA01
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 bg-[#e2f3e8] text-[#137333] rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Sincronizado SAP S/4HANA
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-[#ebe2cf] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 flex items-center bg-[#fcf8f2] rounded-xl px-3 py-2 border border-[#ebe2cf]">
          <Search className="w-4 h-4 text-[#7f765f] mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Folio SAP, proyecto o cliente..."
            className="w-full bg-transparent text-xs text-[#1f1b10] placeholder:text-[#7f765f] outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'sap', label: 'Órdenes SAP' },
            { id: 'prod', label: 'En Producción' },
            { id: 'entregada', label: 'Entregadas' },
            { id: 'pendiente', label: 'Pendientes' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-[#ffd100] text-[#6f5a00] shadow-2xs'
                  : 'bg-[#fcf8f2] text-[#4d4632] hover:bg-[#f6eddb]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Records */}
      <div className="bg-white rounded-2xl border border-[#ebe2cf] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f1b10]">
            <thead>
              <tr className="bg-[#fcf8f2] text-[#7f765f] font-bold uppercase text-[11px] border-b border-[#ebe2cf]">
                <th className="py-3 px-4">Folio SAP / Radicado</th>
                <th className="py-3 px-4">Cliente & Ubicación</th>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Resumen de Materiales</th>
                <th className="py-3 px-4 text-right">Valor Total (COP)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe2cf]/60">
              {filtered.map((row) => (
                <tr key={row.folioSap} className="hover:bg-[#fcf8f2]/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#2f5ea1]">
                    {row.folioSap}
                    <span className="block text-[10px] text-[#7f765f] font-sans">
                      {row.projectId}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold block text-[#1f1b10]">{row.clientName}</span>
                    <span className="text-[11px] text-[#7f765f]">{row.city}</span>
                  </td>
                  <td className="py-3 px-4 text-[#4d4632]">{row.date}</td>
                  <td className="py-3 px-4 text-[#4d4632] max-w-xs truncate" title={row.itemsSummary}>
                    {row.itemsSummary}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-[#1f1b10]">
                    {formatCOP(row.totalCOP)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Entregada en Obra'
                          ? 'bg-[#e2f3e8] text-[#137333]'
                          : row.status === 'Aprobada SAP'
                          ? 'bg-[#e1edff] text-[#2f5ea1]'
                          : row.status === 'En Producción'
                          ? 'bg-[#fff0c2] text-[#725c00]'
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedQuoteDetail(row)}
                      className="p-1.5 rounded-lg bg-[#fcf8f2] hover:bg-[#f0e7d5] text-[#1f1b10] transition-colors cursor-pointer"
                      title="Ver Detalle"
                    >
                      <Eye className="w-4 h-4 text-[#2f5ea1]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Detail Modal */}
      {selectedQuoteDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2f5ea1] text-white flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Detalle de Cotización Oficial
                  </h3>
                  <span className="text-xs text-[#7f765f] font-mono">
                    {selectedQuoteDetail.folioSap}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuoteDetail(null)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-[#fcf8f2]">
                <span className="text-[#7f765f]">Cliente:</span>
                <strong className="text-[#1f1b10]">{selectedQuoteDetail.clientName}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#fcf8f2]">
                <span className="text-[#7f765f]">Ciudad:</span>
                <strong className="text-[#1f1b10]">{selectedQuoteDetail.city}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#fcf8f2]">
                <span className="text-[#7f765f]">Fecha de Emisión:</span>
                <strong className="text-[#1f1b10]">{selectedQuoteDetail.date}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#fcf8f2]">
                <span className="text-[#7f765f] block mb-1">Materiales Prescritos:</span>
                <strong className="text-[#1f1b10] leading-relaxed block">
                  {selectedQuoteDetail.itemsSummary}
                </strong>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-[#ffd100]/20 border border-[#ffd100]/40 text-sm">
                <span className="font-bold text-[#725c00]">Total Oficial COP:</span>
                <strong className="text-[#1f1b10] font-black font-mono">
                  {formatCOP(selectedQuoteDetail.totalCOP)}
                </strong>
              </div>
            </div>

            <div className="flex gap-2 pt-5 mt-4 border-t border-[#ebe2cf]">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#1f1b10] hover:bg-[#f6eddb] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#7f765f]" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedQuoteDetail(null);
                  if (onOpenDiagnosis) onOpenDiagnosis(selectedQuoteDetail.projectId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ffd100] text-[#6f5a00] text-xs font-black hover:bg-[#ffc800] transition-colors cursor-pointer"
              >
                Abrir en Diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
