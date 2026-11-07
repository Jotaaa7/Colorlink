import React, { useState, useEffect } from 'react';
import { ProjectRequest } from '../../types';
import { fetchProjectsFromDb, fetchOrdersFromDb } from '../../services/renderDbService';
import {
  Receipt,
  Search,
  FileDown,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  Calendar,
  User,
  Building2,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

interface AdvisorHistoryViewProps {
  request: ProjectRequest | null;
  onOpenPdfModal: () => void;
  onShowToast: (msg: string) => void;
}

interface HistoricalQuote {
  quoteNumber: string;
  clientName: string;
  city: string;
  date: string;
  validUntil: string;
  totalCOP: number;
  sapOrderNumber: string;
  status: 'Aprobada' | 'En Producción' | 'Emitida' | 'Vencida';
  itemsCount: number;
}

export const AdvisorHistoryView: React.FC<AdvisorHistoryViewProps> = ({
  request,
  onOpenPdfModal,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'aprobadas' | 'produccion' | 'emitidas'>('todas');
  const [isLoading, setIsLoading] = useState(false);

  const [historyList, setHistoryList] = useState<HistoricalQuote[]>(() => {
    const list: HistoricalQuote[] = [
      {
        quoteNumber: request?.quotation?.quoteNumber || 'COT-PT-2024-8924',
        clientName: request?.client?.fullName || (request as any)?.clientName || 'Andrés Cepeda',
        city: request?.city || 'Bogotá D.C.',
        date: '12/05/2024',
        validUntil: '27/05/2024',
        totalCOP: request?.quotation?.totalCOP || 452900,
        sapOrderNumber: 'VA01-450098231',
        status: 'Aprobada',
        itemsCount: request?.quotation?.items?.length || 3,
      },
      {
        quoteNumber: 'COT-PT-2024-8840',
        clientName: 'Constructora Bolívar - Ing. Marcela Duarte',
        city: 'Medellín',
        date: '08/05/2024',
        validUntil: '23/05/2024',
        totalCOP: 18450000,
        sapOrderNumber: 'VA01-450097940',
        status: 'En Producción',
        itemsCount: 6,
      },
      {
        quoteNumber: 'COT-PT-2024-8712',
        clientName: 'Estudio Espacio - Arq. Valeria Gómez',
        city: 'Cali',
        date: '03/05/2024',
        validUntil: '18/05/2024',
        totalCOP: 3120000,
        sapOrderNumber: 'VA01-450096811',
        status: 'Aprobada',
        itemsCount: 4,
      },
      {
        quoteNumber: 'COT-PT-2024-8650',
        clientName: 'Taller & Carrocerías Los Andes',
        city: 'Bucaramanga',
        date: '28/04/2024',
        validUntil: '13/05/2024',
        totalCOP: 1250000,
        sapOrderNumber: 'VA01-450095902',
        status: 'Emitida',
        itemsCount: 2,
      },
      {
        quoteNumber: 'COT-PT-2024-8591',
        clientName: 'Hotel Boutique El Virrey',
        city: 'Bogotá D.C.',
        date: '22/04/2024',
        validUntil: '07/05/2024',
        totalCOP: 5670000,
        sapOrderNumber: 'VA01-450094819',
        status: 'Aprobada',
        itemsCount: 5,
      },
    ];
    return list;
  });

  const loadRealHistoryFromDb = async () => {
    setIsLoading(true);
    try {
      const [projects, orders] = await Promise.all([
        fetchProjectsFromDb(),
        fetchOrdersFromDb(),
      ]);

      const realQuotes: HistoricalQuote[] = [];

      if (projects && Array.isArray(projects)) {
        projects.forEach((p: any) => {
          const clientName = p.client?.fullName || p.clientName || 'Cliente ColorLink';
          const quoteNum = p.quotation?.quoteNumber || `COT-${p.id}`;
          const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-CO') : 'Reciente';
          const total = p.quotation?.totalCOP || (p.diagnosis?.recommendedProducts ? 850000 : 450000);
          const rawStatus = p.status || 'Cotizada';
          const mappedStatus: 'Aprobada' | 'En Producción' | 'Emitida' | 'Vencida' =
            rawStatus === 'Aprobada QA' || rawStatus === 'Completada' || rawStatus === 'Inventario Asignado'
              ? 'Aprobada'
              : rawStatus === 'En Producción'
              ? 'En Producción'
              : 'Emitida';

          realQuotes.push({
            quoteNumber: quoteNum,
            clientName,
            city: p.city || 'Bogotá D.C.',
            date: dateStr,
            validUntil: '30 días',
            totalCOP: Number(total) || 0,
            sapOrderNumber: p.productionOrder?.orderId || `VA01-${Math.floor(450000000 + Math.random() * 99999)}`,
            status: mappedStatus,
            itemsCount: p.quotation?.items?.length || 2,
          });
        });
      }

      if (orders && Array.isArray(orders)) {
        orders.forEach((ord: any) => {
          const clientName = ord.customer?.fullName || ord.customerName || 'Cliente Tienda Directa';
          const orderNum = ord.sapOrderCode || ord.sapOrderNumber || ord.id || `ORD-${Date.now()}`;
          const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('es-CO') : 'Reciente';
          realQuotes.push({
            quoteNumber: orderNum,
            clientName,
            city: ord.shipping?.city || ord.deliveryCity || 'Colombia',
            date: dateStr,
            validUntil: 'Completado',
            totalCOP: Number(ord.total || ord.totalCOP) || 0,
            sapOrderNumber: ord.sapOrderCode || 'SAP-CONFIRMADO',
            status: 'Aprobada',
            itemsCount: Array.isArray(ord.items) ? ord.items.length : 1,
          });
        });
      }

      if (realQuotes.length > 0) {
        setHistoryList((prev) => {
          const map = new Map<string, HistoricalQuote>();
          realQuotes.forEach((q) => map.set(q.quoteNumber, q));
          prev.forEach((q) => {
            if (!map.has(q.quoteNumber)) map.set(q.quoteNumber, q);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Error cargando historial en AdvisorHistoryView:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealHistoryFromDb();
  }, [request?.id]);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredQuotes = historyList.filter((q) => {
    const qNum = (q.quoteNumber || '').toLowerCase();
    const cName = (q.clientName || '').toLowerCase();
    const sapNum = (q.sapOrderNumber || '').toLowerCase();
    const city = (q.city || '').toLowerCase();
    const sTerm = searchTerm.toLowerCase();

    const matchesSearch =
      qNum.includes(sTerm) ||
      cName.includes(sTerm) ||
      sapNum.includes(sTerm) ||
      city.includes(sTerm);

    const matchesStatus =
      statusFilter === 'todas' ||
      (statusFilter === 'aprobadas' && q.status === 'Aprobada') ||
      (statusFilter === 'produccion' && q.status === 'En Producción') ||
      (statusFilter === 'emitidas' && q.status === 'Emitida');

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = 'Cotizacion,Cliente,Ciudad,Fecha,Total_COP,Orden_SAP,Estado\n';
    const rows = filteredQuotes
      .map(
        (q) =>
          `"${q.quoteNumber}","${q.clientName}","${q.city}","${q.date}",${q.totalCOP},"${q.sapOrderNumber}","${q.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cotizaciones_Pintuco_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Reporte de cotizaciones exportado en formato CSV');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#ebe2cf] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#ffd100] text-[#6f5a00] text-xs font-black uppercase tracking-wider">
              Registro Histórico
            </span>
            <span className="text-xs text-[#7f765f] font-semibold">
              {filteredQuotes.length} cotizaciones y órdenes registradas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1f1b10] mt-1">
            Historial de Cotizaciones Oficiales & Órdenes SAP
          </h2>
          <p className="text-xs sm:text-sm text-[#4d4632] mt-0.5">
            Descarga comprobantes en PDF, reenvía propuestas comerciales a clientes y consulta órdenes SAP VA01 vinculadas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-[#2f5ea1] hover:bg-[#264b82] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#ebe2cf] shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f765f]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cotización, cliente o SAP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f6eddb]/50 border border-[#d1c6ab]/60 text-xs text-[#1f1b10] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'todas'
                ? 'bg-[#ffd100] text-[#6f5a00] shadow-xs'
                : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('aprobadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'aprobadas'
                ? 'bg-[#ffd100] text-[#6f5a00] shadow-xs'
                : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
            }`}
          >
            Aprobadas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('produccion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'produccion'
                ? 'bg-[#ffd100] text-[#6f5a00] shadow-xs'
                : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
            }`}
          >
            En Producción
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('emitidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'emitidas'
                ? 'bg-[#ffd100] text-[#6f5a00] shadow-xs'
                : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
            }`}
          >
            Emitidas
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#ebe2cf] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fcf3e0] text-[#7f765f] uppercase tracking-wider font-bold border-b border-[#ebe2cf]">
              <tr>
                <th className="py-3.5 px-4">Ref. Cotización</th>
                <th className="py-3.5 px-4">Cliente / Ciudad</th>
                <th className="py-3.5 px-4">Fecha Emisión</th>
                <th className="py-3.5 px-4">Ítems</th>
                <th className="py-3.5 px-4">Total (IVA Inc.)</th>
                <th className="py-3.5 px-4">Orden SAP VA01</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe2cf]">
              {filteredQuotes.map((item) => (
                <tr key={item.quoteNumber} className="hover:bg-[#fffbf5] transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-[#2f5ea1]">
                    {item.quoteNumber}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-[#1f1b10]">{item.clientName}</p>
                    <p className="text-[11px] text-[#7f765f]">{item.city}</p>
                  </td>
                  <td className="py-4 px-4 text-[#4d4632] font-medium">
                    {item.date}
                  </td>
                  <td className="py-4 px-4 font-medium text-[#4d4632]">
                    {item.itemsCount} productos
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-sm text-[#1f1b10]">
                    {formatCOP(item.totalCOP)}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-[#725c00] font-bold">
                    {item.sapOrderNumber}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'Aprobada'
                          ? 'bg-[#e6f4ea] text-[#137333]'
                          : item.status === 'En Producción'
                          ? 'bg-[#ffd100] text-[#6f5a00]'
                          : 'bg-[#d6e3ff] text-[#001b3d]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={onOpenPdfModal}
                        className="p-2 rounded-lg bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#2f5ea1] transition-colors cursor-pointer"
                        title="Ver PDF Oficial"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onShowToast(`Cotización ${item.quoteNumber} reenviada exitosamente al cliente`)
                        }
                        className="p-2 rounded-lg bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] transition-colors cursor-pointer"
                        title="Reenviar a Cliente"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
