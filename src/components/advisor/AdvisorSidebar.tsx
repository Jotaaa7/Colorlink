import React from 'react';
import { UserProfile } from '../../types';
import {
  ScanLine,
  ClipboardList,
  Warehouse,
  BookOpen,
  Receipt,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type AdvisorNavTab =
  | 'diagnostico'
  | 'solicitudes'
  | 'inventario'
  | 'catalogo'
  | 'historial';

interface AdvisorSidebarProps {
  activeNav: AdvisorNavTab;
  onSelectNav: (tab: AdvisorNavTab) => void;
  currentUser: UserProfile | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateHome: () => void;
  onOpenLogin: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingCount?: number;
}

export const AdvisorSidebar: React.FC<AdvisorSidebarProps> = ({
  activeNav,
  onSelectNav,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  onNavigateHome,
  onOpenLogin,
  isOpenMobile,
  onCloseMobile,
  pendingCount = 4,
}) => {
  const navItems = [
    {
      id: 'diagnostico' as AdvisorNavTab,
      label: 'Diagnóstico & IA',
      fullTitle: 'Diagnóstico & Evaluación IA',
      icon: ScanLine,
      badge: 'IA v4.2',
      badgeColor: 'bg-[#d6e3ff] text-[#001b3d]',
      description: 'Visión de sustrato y cotización',
    },
    {
      id: 'solicitudes' as AdvisorNavTab,
      label: 'Solicitudes',
      fullTitle: 'Solicitudes Pendientes',
      icon: ClipboardList,
      badge: `${pendingCount} activas`,
      badgeColor: 'bg-[#ffe07f] text-[#231b00]',
      description: 'Bandeja de clientes y radicados',
    },
    {
      id: 'inventario' as AdvisorNavTab,
      label: 'Inventario & Stock',
      fullTitle: 'Inventario Multisede',
      icon: Warehouse,
      badge: '4 Plantas',
      badgeColor: 'bg-[#e6f4ea] text-[#137333]',
      description: 'Stock CEDI y bloqueo SAP',
    },
    {
      id: 'catalogo' as AdvisorNavTab,
      label: 'Catálogo Técnico',
      fullTitle: 'Catálogo Técnico Pintuco',
      icon: BookOpen,
      badge: 'Oficial',
      badgeColor: 'bg-[#f0e7d5] text-[#725c00]',
      description: 'Fichas, rendimientos y dilución',
    },
    {
      id: 'historial' as AdvisorNavTab,
      label: 'Historial',
      fullTitle: 'Historial de Cotizaciones',
      icon: Receipt,
      badge: 'SAP VA01',
      badgeColor: 'bg-[#e1edff] text-[#0d4788]',
      description: 'Cotizaciones y órdenes emitidas',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#fff8f0] border-r border-[#ebe2cf] transition-all duration-300 shadow-sm
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
          w-72 h-screen
        `}
      >
        {/* Top Header / Brand */}
        <div className="h-20 px-4 flex items-center justify-between border-b border-[#ebe2cf] bg-[#fcf3e0]/60 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#ffd100] text-[#1f1b10] font-black text-xl flex items-center justify-center shadow-xs shrink-0">
              P
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-[#1f1b10] leading-none">
                    PINTUCO
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-[#ffd100] text-[#6f5a00] rounded tracking-wider">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#725c00] uppercase tracking-wider mt-0.5 truncate">
                  Portal Asesor Técnico
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-8 h-8 rounded-lg bg-white border border-[#ebe2cf] hover:bg-[#f6eddb] text-[#4d4632] items-center justify-center transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            id="btn-toggle-advisor-sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden w-8 h-8 rounded-lg bg-white border border-[#ebe2cf] text-[#4d4632] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Advisor Profile Summary Card */}
        <div className="p-3 border-b border-[#ebe2cf] bg-[#fffbf5] shrink-0">
          <div
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-[#f6eddb]/70 border border-[#ebe2cf]/80`}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#725c00] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentUser?.fullName
                  ? currentUser.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                  : 'CR'}
              </div>
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#2f5ea1] border-2 border-white ring-1 ring-black/5"
                title="En línea"
              />
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#1f1b10] truncate leading-tight">
                  {currentUser?.fullName || 'Ing. Carlos Ruiz'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2f5ea1] animate-pulse"></span>
                  <span className="text-[11px] text-[#725c00] font-semibold truncate">
                    Asesor Especialista
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-[#7f765f]">
              Menú Principal
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectNav(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer text-left group relative ${
                  isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 gap-3'
                } ${
                  isActive
                    ? 'bg-[#ffd100] text-[#1f1b10] font-black shadow-sm'
                    : 'text-[#4d4632] hover:bg-[#f6eddb] hover:text-[#1f1b10] font-semibold'
                }`}
                title={isCollapsed ? item.fullTitle : undefined}
                id={`sidebar-nav-${item.id}`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#725c00] rounded-r-full" />
                )}

                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#725c00]' : 'text-[#7f765f] group-hover:text-[#1f1b10]'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold leading-tight truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-[#725c00] text-white' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 leading-tight ${
                        isActive ? 'text-[#4d4632]' : 'text-[#7f765f]'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Status Widget & Return Actions */}
        <div className="p-3 border-t border-[#ebe2cf] bg-[#fcf3e0]/70 shrink-0 space-y-2">
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-white border border-[#ebe2cf] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7f765f]">
                  Conectividad ERP
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#137333]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse"></span>
                  SAP S/4 Activo
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#4d4632]">
                <span>Planta Rionegro:</span>
                <strong className="font-mono text-[#1f1b10]">5,200 Gal</strong>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#4d4632]">
                <span>CEDI Funza:</span>
                <strong className="font-mono text-[#1f1b10]">2,840 Gal</strong>
              </div>
            </div>
          ) : null}

          {/* Return to Client Portal Button */}
          <button
            type="button"
            onClick={onNavigateHome}
            className={`w-full flex items-center rounded-xl bg-white hover:bg-[#f6eddb] border border-[#ebe2cf] text-[#4d4632] hover:text-[#1f1b10] transition-colors cursor-pointer text-xs font-bold ${
              isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-2'
            }`}
            title="Volver al Portal de Clientes / Nueva Solicitud"
            id="btn-sidebar-return-client"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-[#2f5ea1]" />
            {!isCollapsed && <span>Volver a Portal Cliente</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
