import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, ProjectRequest, UserProfile } from '../types';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  User,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  Building2,
  Clock,
  Warehouse,
  Database,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRequest: ProjectRequest | null;
  currentUser: UserProfile | null;
  supabaseConnected?: boolean | null;
  cartItemsCount?: number;
  onOpenCart?: () => void;
  onLogout: () => void;
  onOpenSupport: () => void;
  onOpenServices: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentRequest,
  currentUser,
  supabaseConnected,
  cartItemsCount = 0,
  onOpenCart,
  onLogout,
  onOpenSupport,
  onOpenServices,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#fff8f0] border-b border-[#ebe2cf] sticky top-0 z-40 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('new_request')}
            className="text-left group flex items-center gap-2.5 focus:outline-hidden"
            id="brand-logo-btn"
          >
            <div className="w-9 h-9 rounded-xl bg-[#ffd100] text-[#1f1b10] font-black text-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              P
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-[#725c00] leading-none">
                Pintuco
              </div>
              <div className="text-[10px] font-bold tracking-widest text-[#2f5ea1] uppercase mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f5ea1] animate-pulse"></span>
                ColorLink AI
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onOpenServices}
            className="text-[#4d4632] hover:text-[#725c00] hover:bg-[#f6eddb] px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
            id="nav-services-btn"
          >
            <Layers className="w-4 h-4 text-[#2f5ea1]" />
            <span className="hidden sm:inline">Servicios</span>
          </button>

          {/* Direct Store Button (Accessible with or without an active project) */}
          <button
            onClick={() => setActiveTab('direct_store')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'direct_store'
                ? 'text-[#0d4788] bg-[#ffd100] shadow-2xs font-black'
                : 'text-[#1f1b10] hover:text-[#0d4788] hover:bg-[#f6eddb]'
            }`}
            id="nav-direct-store-btn"
          >
            <ShoppingBag className="w-4 h-4 text-[#0d4788]" />
            <span className="hidden sm:inline">Comprar Directo</span>
            <span className="sm:hidden">Tienda</span>
            <span className="hidden lg:inline text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#0d4788] text-white">
              Sin Proyecto
            </span>
            {activeTab === 'direct_store' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0d4788] rounded-full"></span>
            )}
          </button>

          {currentUser ? (
            <>
              <button
                onClick={() => setActiveTab('new_request')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all relative ${
                  activeTab === 'new_request'
                    ? 'text-[#725c00] bg-[#f6eddb] shadow-2xs'
                    : 'text-[#4d4632] hover:text-[#725c00] hover:bg-[#f6eddb]'
                }`}
                id="nav-new-request-btn"
              >
                <span>Nueva Solicitud</span>
                {activeTab === 'new_request' && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#725c00] rounded-full"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('project_status')}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 relative ${
                  activeTab === 'project_status'
                    ? 'text-[#725c00] bg-[#f6eddb] shadow-2xs'
                    : 'text-[#4d4632] hover:text-[#725c00] hover:bg-[#f6eddb]'
                }`}
                id="nav-project-status-btn"
              >
                <Clock className="w-4 h-4 text-[#edc200]" />
                <span className="hidden sm:inline">Estado del Proyecto</span>
                <span className="sm:hidden">Seguimiento</span>
                {activeTab === 'project_status' && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#725c00] rounded-full"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('advisor_portal')}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 relative ${
                  activeTab === 'advisor_portal'
                    ? 'text-[#725c00] bg-[#f6eddb] shadow-2xs'
                    : 'text-[#4d4632] hover:text-[#725c00] hover:bg-[#f6eddb]'
                }`}
                id="nav-advisor-portal-btn"
              >
                <ShieldCheck className="w-4 h-4 text-[#725c00]" />
                <span className="hidden sm:inline">Portal Asesor</span>
                <span className="sm:hidden">Asesor</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-[#ffd100] text-[#6f5a00] rounded-sm tracking-wider">
                  PRO
                </span>
                {(activeTab === 'advisor_portal' || activeTab === 'advisor_inventory') && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#725c00] rounded-full"></span>
                )}
              </button>

              {currentRequest && (
                <button
                  onClick={() => setActiveTab('ecosystem_hub')}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 relative ${
                    activeTab === 'ecosystem_hub' ||
                    activeTab === 'technical_diagnosis' ||
                    activeTab === 'commercial_quote' ||
                    activeTab === 'inventory_plants' ||
                    activeTab === 'production_qa' ||
                    activeTab === 'ai_consultant'
                      ? 'text-[#2f5ea1] bg-[#e1edff] shadow-2xs'
                      : 'text-[#4d4632] hover:text-[#2f5ea1] hover:bg-[#f6eddb]'
                  }`}
                  id="nav-ecosystem-btn"
                >
                  <Sparkles className="w-4 h-4 text-[#2f5ea1]" />
                  <span className="hidden md:inline">Ecosistema ColorLink</span>
                  <span className="md:hidden">Ecosistema</span>
                  <span className="w-2 h-2 rounded-full bg-[#ffd100] ring-2 ring-white"></span>
                </button>
              )}
            </>
          ) : null}
        </nav>

        {/* User Profile / Auth Actions & Soporte */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase Database Connection Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              supabaseConnected
                ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                : 'bg-[#f6eddb] text-[#7f765f] border-[#ebe2cf]'
            }`}
            title={
              supabaseConnected
                ? 'Base de datos Supabase conectada y sincronizada'
                : 'Conector Supabase preparado (agrega tus llaves en .env para persistencia en nube)'
            }
          >
            <Database className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse bg-current"></span>
            <span>{supabaseConnected ? 'Supabase Conectado' : 'Supabase Listo'}</span>
          </div>

          {/* Direct Store Shopping Cart Button */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'direct_store' && onOpenCart) {
                onOpenCart();
              } else {
                setActiveTab('direct_store');
              }
            }}
            className={`relative p-2 rounded-full transition-all flex items-center justify-center border cursor-pointer ${
              activeTab === 'direct_store'
                ? 'bg-[#ffd100] border-[#0d4788] text-[#0d4788] shadow-xs'
                : 'bg-white border-[#d1c6ab] text-[#1f1b10] hover:text-[#0d4788] hover:border-[#0d4788] hover:bg-[#fffdfa]'
            }`}
            title="Carrito de Compras Tienda Directa"
            id="header-cart-btn"
          >
            <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0d4788]" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#d9381e] text-white text-[10px] font-black w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white">
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            )}
          </button>

          {currentUser ? (
            /* Logged In User Dropdown */
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white border border-[#d1c6ab] hover:border-[#725c00] transition-all shadow-2xs group"
                id="user-profile-menu-btn"
              >
                <div className="w-7 h-7 rounded-full bg-[#ffd100] text-[#1f1b10] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden md:block text-left pr-1">
                  <div className="text-xs font-bold text-[#1f1b10] truncate max-w-[130px] leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-[#7f765f] font-medium truncate max-w-[130px]">
                    {currentUser.role.split('/')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#7f765f] group-hover:text-[#1f1b10] transition-colors" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#ebe2cf] shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-[#ebe2cf] mb-2">
                    <div className="text-xs font-bold text-[#1f1b10]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[11px] text-[#7f765f] truncate">
                      {currentUser.email}
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fcf3e0] text-[#725c00] text-[10px] font-bold">
                      <Building2 className="w-3 h-3" />
                      <span>{currentUser.role}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('project_status');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#1f1b10] hover:bg-[#fff8f0] flex items-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#edc200]" />
                      <span>Estado del Proyecto (Seguimiento)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('advisor_portal');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#725c00] hover:bg-[#fff8f0] flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#725c00]" />
                      <span>Portal Técnico Asesor (Diagnóstico & IA)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('advisor_inventory');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#0d4788] hover:bg-[#fff8f0] flex items-center gap-2"
                    >
                      <Warehouse className="w-3.5 h-3.5 text-[#0d4788]" />
                      <span>Control de Inventario & SAP (PRO)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('new_request');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#1f1b10] hover:bg-[#fff8f0] flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#ffd100]" />
                      <span>Nueva Solicitud con mis Datos</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('login');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#4d4632] hover:bg-[#fff8f0] flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#2f5ea1]" />
                      <span>Cambiar de Cuenta / Ver Cuentas</span>
                    </button>

                    <div className="pt-2 border-t border-[#ebe2cf]">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out: Iniciar Sesión / Registrarse Buttons */
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-[#725c00] text-white shadow-xs'
                    : 'text-[#4d4632] hover:text-[#725c00] hover:bg-[#f6eddb]'
                }`}
                id="btn-nav-login"
              >
                <LogIn className="w-3.5 h-3.5 text-[#725c00] group-hover:text-[#1f1b10]" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Entrar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeTab === 'register'
                    ? 'bg-[#ffd100] border-[#725c00] text-[#1f1b10]'
                    : 'bg-white border-[#d1c6ab] text-[#1f1b10] hover:bg-[#fff8f0]'
                }`}
                id="btn-nav-register"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#2f5ea1] inline mr-1" />
                <span>Registrarse</span>
              </button>
            </div>
          )}

          {/* Soporte Button */}
          <button
            onClick={onOpenSupport}
            className="bg-[#ffd100] text-[#6f5a00] hover:bg-[#ffc800] font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 sm:gap-2"
            id="header-support-btn"
          >
            <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Soporte</span>
          </button>
        </div>
      </div>
    </header>
  );
};

