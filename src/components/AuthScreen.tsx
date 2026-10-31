import React, { useState } from 'react';
import { UserProfile, UserRole, DocumentType } from '../types';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  HardHat,
  Home,
  Store,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { registerUserInDb, loginUserInDb } from '../services/renderDbService';

interface AuthScreenProps {
  initialMode?: 'login' | 'register';
  reasonBanner?: string;
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateToRequest: () => void;
}

// Preset Demo Accounts for quick evaluation
export const DEMO_USERS: UserProfile[] = [
  {
    id: 'USR-ANDINA-01',
    fullName: 'Constructora Andina SAS',
    email: 'proyectos@andinasas.com',
    role: 'Constructora / Arquitecto',
    documentType: 'NIT',
    documentNumber: '900.584.210-7',
    phone: '+57 (310) 845-9920',
    city: 'Bogotá',
    companyName: 'Constructora Andina SAS',
    avatarUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-15',
  },
  {
    id: 'USR-TECNICO-02',
    fullName: 'Ing. Carlos Mendoza (Pintuco QA)',
    email: 'cmendoza@pintuco.com',
    role: 'Especialista Técnico Pintuco',
    documentType: 'Cédula de Ciudadanía',
    documentNumber: '1.020.455.890',
    phone: '+57 (300) 412-5588',
    city: 'Medellín / Rionegro',
    companyName: 'Pintuco Colombia S.A.S.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-11-20',
  },
  {
    id: 'USR-MAESTRO-03',
    fullName: 'David Valencia (Pintor Maestro Certificado)',
    email: 'david.recubrimientos@gmail.com',
    role: 'Contratista / Maestro',
    documentType: 'Cédula de Ciudadanía',
    documentNumber: '71.298.432',
    phone: '+57 (312) 670-3411',
    city: 'Cali',
    companyName: 'Soluciones & Acabados Valencia',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-01',
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  reasonBanner,
  onLoginSuccess,
  onNavigateToRequest,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('proyectos@andinasas.com');
  const [loginPassword, setLoginPassword] = useState('ColorLink2026*');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Constructora / Arquitecto');
  const [regDocType, setRegDocType] = useState<DocumentType | string>('NIT');
  const [regDocNum, setRegDocNum] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Bogotá');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [regError, setRegError] = useState('');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Quick preset login handler
  const handleQuickDemoLogin = (demoUser: UserProfile) => {
    onLoginSuccess(demoUser);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Try remote PostgreSQL login first
      const res = await loginUserInDb(loginEmail.trim(), loginPassword);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        setIsSubmitting(false);
        return;
      }

      // If database explicitly said credentials are invalid
      if (res.error && !res.fallback && res.error !== 'Usuario no encontrado') {
        setLoginError(res.error);
        setIsSubmitting(false);
        return;
      }

      // 2. Check if matches preset demo accounts
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );
      if (matched) {
        onLoginSuccess(matched);
        setIsSubmitting(false);
        return;
      }

      // 3. Check local registered users list (localStorage fallback)
      try {
        const localList = JSON.parse(localStorage.getItem('colorlink_registered_users') || '[]');
        const localUser = localList.find(
          (u: any) => u.email?.toLowerCase() === loginEmail.trim().toLowerCase()
        );
        if (localUser) {
          if (localUser.password && localUser.password !== loginPassword) {
            setLoginError('Contraseña incorrecta');
            setIsSubmitting(false);
            return;
          }
          onLoginSuccess(localUser);
          setIsSubmitting(false);
          return;
        }
      } catch {
        // ignore
      }

      // If user was not found anywhere and DB responded user not found
      if (res.error === 'Usuario no encontrado') {
        setLoginError('No encontramos una cuenta con este correo. ¿Deseas registrarte?');
        setIsSubmitting(false);
        return;
      }

      // Fallback session user if backend database is not yet provisioned
      const loggedUser: UserProfile = {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: loginEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: loginEmail.trim(),
        role: 'Constructora / Arquitecto',
        documentType: 'NIT',
        documentNumber: '900.000.000-1',
        phone: '+57 (300) 000-0000',
        city: 'Bogotá',
        createdAt: new Date().toISOString().split('T')[0],
      };

      onLoginSuccess(loggedUser);
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    if (!regFullName.trim() || !regEmail.trim() || !regDocNum.trim()) {
      setRegError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden');
      return;
    }

    if (!termsAccepted) {
      setRegError('Debes aceptar los términos y condiciones de Pintuco');
      return;
    }

    setIsSubmitting(true);

    const generatedId = `USR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const userData = {
      id: generatedId,
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      documentType: regDocType,
      documentNumber: regDocNum.trim(),
      phone: regPhone.trim() || '+57 (300) 000-0000',
      city: regCity.trim() || 'Bogotá',
      companyName: regRole.includes('Constructora') ? regFullName : undefined,
    };

    try {
      // 1. Persist directly to Render PostgreSQL
      const dbResponse = await registerUserInDb(userData);

      if (!dbResponse.success) {
        setRegError(dbResponse.error || 'Error al guardar usuario en la base de datos');
        setIsSubmitting(false);
        return;
      }

      const createdUser: UserProfile = dbResponse.user || {
        ...userData,
        createdAt: new Date().toISOString().split('T')[0],
      };

      // 2. Also keep a local cache in localStorage for instant offline access
      try {
        const localList = JSON.parse(localStorage.getItem('colorlink_registered_users') || '[]');
        localList.push({ ...createdUser, password: regPassword });
        localStorage.setItem('colorlink_registered_users', JSON.stringify(localList));
      } catch {
        // ignore
      }

      setRegSuccessMsg('¡Usuario registrado con éxito en la base de datos! Iniciando sesión...');
      setTimeout(() => {
        onLoginSuccess(createdUser);
      }, 700);
    } catch (err: any) {
      console.error('Registration error:', err);
      setRegError(err.message || 'Error de conexión al registrar usuario');
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setShowForgotModal(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left Column: Context Card (Pintuco Theme Matching Screenshot) */}
        <div className="w-full lg:w-1/3 shrink-0">
          <div className="sticky top-24 rounded-2xl overflow-hidden shadow-md border border-[#ebe2cf] bg-white group">
            <div className="relative h-[480px] sm:h-[580px] w-full overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1WYVBglUAjzMQtZxYOsMdBjzwkZIyh5ECgrs4r2o5nrdJtqVrRcpYmbIorQtalWVZwjSl0yHAb4hTEAlgcBihBPPjuCyYNKPx9Z-bVDWzKHX6fZQSY5OvkaOagOPrntsnoM7b19rmxuER032hy2pOycXmWFJMkbN6NKOTnmVToJYFPKtHonVCPEgnciraOXNImokOm0dAQ6Q_u9lRVUdPaM_8Hi91DlzmL7jhQ6LWtdlSAqmipExtH0N04k"
                alt="Ecosistema ColorLink Pintuco"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd100] text-[#1f1b10] text-xs font-bold w-fit mb-3 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ecosistema ColorLink
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                  Bienvenido a ColorLink
                </h3>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal mb-4">
                  Gestiona tus proyectos de pintura con formulación técnica automatizada, inventario en planta y cotizaciones al instante.
                </p>

                <div className="space-y-2 border-t border-white/20 pt-4 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ffd100]" />
                    <span>Diagnóstico de sustrato y cálculo de m² con IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ffd100]" />
                    <span>Precios directos de fábrica y cotización automática</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ffd100]" />
                    <span>Control de calidad de lote y trazabilidad ISO 9001</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Login selector */}
            <div className="p-4 bg-[#fcf3e0] border-t border-[#ebe2cf]">
              <div className="text-xs font-bold text-[#725c00] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Acceso Rápido de Prueba (1-Click):</span>
                <span className="text-[10px] bg-[#ffd100] px-1.5 py-0.5 rounded text-[#1f1b10] font-black">
                  DEMO
                </span>
              </div>
              <div className="space-y-1.5">
                {DEMO_USERS.map((usr) => (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(usr)}
                    className="w-full text-left p-2 rounded-xl bg-white border border-[#d1c6ab] hover:border-[#725c00] hover:bg-[#fff8f0] transition-all flex items-center justify-between group/user"
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold text-[#1f1b10] truncate group-hover/user:text-[#725c00]">
                        {usr.fullName}
                      </div>
                      <div className="text-[10px] text-[#7f765f] truncate">
                        {usr.role} • {usr.city}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#725c00] opacity-0 group-hover/user:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Container */}
        <div className="w-full lg:w-2/3">
          {/* Top Title & Subtitle */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1f1b10] tracking-tight mb-2">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-base sm:text-lg text-[#4d4632] leading-relaxed">
              {mode === 'login'
                ? 'Ingresa a tu cuenta para consultar tus cotizaciones, órdenes de producción y fichas técnicas.'
                : 'Regístrate para formular proyectos, acceder a precios especiales y recibir soporte de ingenieros Pintuco.'}
            </p>
          </div>

          {/* Reason / Required Login Notification Banner */}
          {reasonBanner && (
            <div className="mb-6 p-4 rounded-2xl bg-[#fff8e1] border border-[#ffd100] text-[#725c00] flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#ffd100] text-[#725c00] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Lock className="w-4 h-4 text-[#1f1b10]" />
              </div>
              <div className="text-sm font-semibold leading-snug">
                {reasonBanner}
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#ebe2cf]/50 p-1.5 rounded-2xl mb-8 border border-[#d1c6ab] max-w-md">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all text-center ${
                mode === 'login'
                  ? 'bg-white text-[#725c00] shadow-sm'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
              id="tab-login"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError('');
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all text-center ${
                mode === 'register'
                  ? 'bg-white text-[#725c00] shadow-sm'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
              id="tab-register"
            >
              Registrarse
            </button>
          </div>

          {/* ===================== MODE: INICIAR SESIÓN ===================== */}
          {mode === 'login' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00] font-bold shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1f1b10] leading-tight">
                      Acceso al Ecosistema ColorLink
                    </h2>
                    <p className="text-xs sm:text-sm text-[#7f765f]">
                      Ingresa con tus credenciales de usuario registrado
                    </p>
                  </div>
                </div>

                {loginError && (
                  <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-5" id="login-form">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="loginEmail">
                      Correo Electrónico o NIT / Documento
                    </label>
                    <div className="relative">
                      <input
                        id="loginEmail"
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="tu@empresa.com o 900.584.210-7"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 pl-11 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                      <Mail className="w-4 h-4 text-[#7f765f] absolute left-4 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#1f1b10]" htmlFor="loginPassword">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs font-bold text-[#725c00] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="loginPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 pl-11 pr-11 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                      <Lock className="w-4 h-4 text-[#7f765f] absolute left-4 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-[#7f765f] hover:text-[#1f1b10] p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-[#4d4632]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#725c00] focus:ring-[#ffd100] border-[#d1c6ab]"
                      />
                      <span>Recordar mi sesión en este dispositivo</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-bold text-base py-3.5 px-6 rounded-full shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
                    id="btn-submit-login"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1f1b10] border-t-transparent rounded-full animate-spin"></div>
                        <span>Verificando credenciales...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingresar a ColorLink</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social Login Divider */}
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#ebe2cf]"></div>
                  </div>
                  <span className="relative bg-white px-4 text-xs font-semibold text-[#7f765f] uppercase tracking-wider">
                    o ingresa con tu cuenta corporativa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin(DEMO_USERS[0])}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#d1c6ab] bg-white hover:bg-[#fff8f0] text-xs font-bold text-[#1f1b10] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Google Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin(DEMO_USERS[1])}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#d1c6ab] bg-white hover:bg-[#fff8f0] text-xs font-bold text-[#1f1b10] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                    <span>Microsoft Entra ID</span>
                  </button>
                </div>
              </div>

              {/* Bottom helper card */}
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#725c00]">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>¿Aún no tienes cuenta registrada en Pintuco ColorLink?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#725c00] hover:underline whitespace-nowrap"
                >
                  Regístrate gratis aquí →
                </button>
              </div>
            </div>
          )}

          {/* ===================== MODE: REGISTRARSE ===================== */}
          {mode === 'register' && (
            <div className="space-y-6">
              <form onSubmit={handleRegisterSubmit} className="space-y-6" id="register-form">
                {/* Section: Perfil / Tipo de Cuenta */}
                <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#8cb7ff] flex items-center justify-center text-[#0d4788] font-bold shadow-xs">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#1f1b10] leading-tight">
                        Tipo de Perfil Profesional
                      </h2>
                      <p className="text-xs sm:text-sm text-[#7f765f]">
                        Selecciona cómo interactúas con los productos y proyectos Pintuco
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        role: 'Constructora / Arquitecto' as UserRole,
                        label: 'Empresa / Obra',
                        desc: 'Constructoras e ingenierías',
                        icon: Building2,
                      },
                      {
                        role: 'Contratista / Maestro' as UserRole,
                        label: 'Contratista / Maestro',
                        desc: 'Pintor profesional independiente',
                        icon: HardHat,
                      },
                      {
                        role: 'Distribuidor / Tienda' as UserRole,
                        label: 'Ferretería / Distribuidor',
                        desc: 'Comercializador autorizado',
                        icon: Store,
                      },
                      {
                        role: 'Cliente Particular' as UserRole,
                        label: 'Cliente Residencial',
                        desc: 'Propietario particular',
                        icon: Home,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = regRole === item.role;
                      return (
                        <div
                          key={item.role}
                          onClick={() => setRegRole(item.role)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#725c00] bg-[#fcf3e0] shadow-xs'
                              : 'border-[#ebe2cf] bg-white hover:border-[#d1c6ab] hover:bg-[#fff8f0]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Icon
                              className={`w-5 h-5 ${
                                isSelected ? 'text-[#725c00]' : 'text-[#7f765f]'
                              }`}
                            />
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#725c00] bg-[#725c00]'
                                  : 'border-[#d1c6ab]'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                          </div>
                          <div className="text-xs font-bold text-[#1f1b10]">{item.label}</div>
                          <div className="text-[10px] text-[#7f765f] mt-0.5">{item.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Section: Datos Personales / Corporativos */}
                <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00] font-bold shadow-xs">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#1f1b10] leading-tight">
                        Datos de Contacto y Registro
                      </h2>
                      <p className="text-xs sm:text-sm text-[#7f765f]">
                        Información para emisión de fichas, cotizaciones y despacho
                      </p>
                    </div>
                  </div>

                  {regError && (
                    <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {regSuccessMsg && (
                    <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{regSuccessMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regFullName">
                        Nombre Completo o Razón Social *
                      </label>
                      <input
                        id="regFullName"
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Ej: Inversiones y Obras Bogotá S.A.S. o Juan Pérez"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regDocType">
                        Tipo de Documento *
                      </label>
                      <div className="relative">
                        <select
                          id="regDocType"
                          value={regDocType}
                          onChange={(e) => setRegDocType(e.target.value)}
                          className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs appearance-none pr-10"
                        >
                          <option value="NIT">NIT (Empresas y Contratistas)</option>
                          <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                          <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                          <option value="Pasaporte">Pasaporte</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#7f765f]">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regDocNum">
                        Número de Documento *
                      </label>
                      <input
                        id="regDocNum"
                        type="text"
                        required
                        value={regDocNum}
                        onChange={(e) => setRegDocNum(e.target.value)}
                        placeholder="Ej: 900.584.210-7"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regEmail">
                        Correo Electrónico *
                      </label>
                      <input
                        id="regEmail"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="contacto@empresa.com"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regPhone">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        id="regPhone"
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+57 (310) 000-0000"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regCity">
                        Ciudad / Municipio Principal
                      </label>
                      <input
                        id="regCity"
                        type="text"
                        required
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="Bogotá, Medellín, Cali, Barranquilla, Bucaramanga..."
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regPassword">
                        Contraseña *
                      </label>
                      <input
                        id="regPassword"
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="regConfirmPassword">
                        Confirmar Contraseña *
                      </label>
                      <input
                        id="regConfirmPassword"
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-[#ebe2cf] mt-6">
                    <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-[#4d4632]">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-4 h-4 rounded text-[#725c00] focus:ring-[#ffd100] border-[#d1c6ab] mt-0.5"
                      />
                      <span>
                        Acepto los{' '}
                        <a href="#terminos" className="text-[#725c00] font-bold hover:underline">
                          Términos de Servicio
                        </a>{' '}
                        y autorizo el tratamiento de mis datos conforme a la{' '}
                        <a href="#privacidad" className="text-[#725c00] font-bold hover:underline">
                          Política de Privacidad de Pintuco Colombia S.A.S.
                        </a>
                      </span>
                    </label>
                  </div>
                </section>

                {/* Submit button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-[#7f765f] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Registro respaldado por la garantía oficial de Pintuco</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-bold text-base px-9 py-4 rounded-full shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    id="btn-submit-register"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1f1b10] border-t-transparent rounded-full animate-spin"></div>
                        <span>Guardando en Base de Datos...</span>
                      </>
                    ) : (
                      <>
                        <span>Crear Cuenta ColorLink</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf]">
              <h3 className="text-xl font-bold text-[#1f1b10]">
                Recuperar Contraseña
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#4d4632] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {forgotSent ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-[#1f1b10]">
                  ¡Enlace de recuperación enviado!
                </h4>
                <p className="text-xs text-[#7f765f]">
                  Revisa tu bandeja de entrada en {forgotEmail} para restablecer tu clave.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="py-5 space-y-4">
                <p className="text-xs sm:text-sm text-[#4d4632] leading-relaxed">
                  Ingresa tu correo registrado y te enviaremos las instrucciones para restablecer tu acceso.
                </p>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-[#1f1b10]">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-2.5 px-3 text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-full border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#ffd100] text-[#1f1b10] hover:bg-[#ffc800] text-xs font-bold transition-colors"
                  >
                    Enviar Instrucciones
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
