import { ProjectRequest, DirectOrder } from '../types';

export interface RenderDbStatus {
  configured: boolean;
  connected: boolean;
  provider: string;
  version?: string;
  message?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Checks connectivity with Render PostgreSQL through the backend API
 */
export async function checkRenderDbStatus(): Promise<RenderDbStatus> {
  try {
    const res = await fetch('/api/db/status');
    if (!res.ok) {
      return {
        configured: false,
        connected: false,
        provider: 'Render PostgreSQL',
        message: 'Endpoint de base de datos no disponible',
      };
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      provider: 'Render PostgreSQL',
      message: 'Modo local sin conexión remota a PostgreSQL',
      error: err.message,
    };
  }
}

/**
 * Loads project requests from Render PostgreSQL
 */
export async function fetchProjectsFromDb(): Promise<ProjectRequest[] | null> {
  try {
    const res = await fetch('/api/db/projects');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && Array.isArray(data.projects)) {
      return data.projects;
    }
    return null;
  } catch (err) {
    console.warn('[RenderDb] Error cargando proyectos de PostgreSQL:', err);
    return null;
  }
}

/**
 * Persists or updates a project request in Render PostgreSQL
 */
export async function saveProjectToDb(project: ProjectRequest): Promise<boolean> {
  try {
    const res = await fetch('/api/db/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('[RenderDb] Error guardando proyecto en PostgreSQL:', err);
    return false;
  }
}

/**
 * Loads direct store orders from Render PostgreSQL
 */
export async function fetchOrdersFromDb(): Promise<DirectOrder[] | null> {
  try {
    const res = await fetch('/api/db/orders');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      return data.orders;
    }
    return null;
  } catch (err) {
    console.warn('[RenderDb] Error cargando órdenes de PostgreSQL:', err);
    return null;
  }
}

/**
 * Persists a direct store order in Render PostgreSQL
 */
export interface EmailDeliveryResult {
  success: boolean;
  simulated?: boolean;
  provider?: 'Resend' | 'SMTP' | 'Ethereal' | 'Simulator' | string;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  diagnostic?: string;
  redirected?: boolean;
  redirectedTo?: string;
  originalTo?: string;
}

export interface SaveOrderResponse {
  success: boolean;
  id?: string;
  sapOrderCode?: string;
  emailResult?: EmailDeliveryResult | null;
}

/**
 * Persists a direct store order in Render PostgreSQL and sends invoice email
 */
export async function saveOrderToDb(order: DirectOrder): Promise<SaveOrderResponse> {
  try {
    const res = await fetch('/api/db/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return {
      success: !!data.success,
      id: data.id,
      sapOrderCode: data.sapOrderCode,
      emailResult: data.emailResult || null,
    };
  } catch (err) {
    console.warn('[RenderDb] Error guardando orden en PostgreSQL:', err);
    return { success: false };
  }
}

/**
 * Sends or resends an electronic invoice email for a direct store order
 */
export async function sendOrderInvoiceNotification(
  order: DirectOrder,
  targetEmail?: string
): Promise<{ success: boolean; result?: EmailDeliveryResult; error?: string }> {
  try {
    const res = await fetch('/api/notifications/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, targetEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'No se pudo enviar la factura por correo' };
    }
    return { success: !!data.success, result: data.result };
  } catch (err: any) {
    console.warn('[EmailNotification] Error enviando factura:', err);
    return { success: false, error: 'Error de conexión al enviar la factura' };
  }
}

export interface RegisterUserData {
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  role?: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  city?: string;
  companyName?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: any;
  emailResult?: EmailDeliveryResult;
  error?: string;
  fallback?: boolean;
}

/**
 * Registers a new user directly in Render PostgreSQL (triggers welcome email)
 */
export async function registerUserInDb(userData: RegisterUserData): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Error al registrar usuario en la base de datos' };
    }
    return data;
  } catch (err: any) {
    console.warn('[RenderDb] Error en registro de usuario:', err);
    return { success: false, error: 'No se pudo comunicar con el servidor de base de datos' };
  }
}

/**
 * Authenticates user credentials against Render PostgreSQL
 */
export async function loginUserInDb(email: string, password?: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Credenciales inválidas' };
    }
    return data;
  } catch (err: any) {
    console.warn('[RenderDb] Error en login de usuario:', err);
    return { success: false, error: 'No se pudo verificar el usuario en la base de datos' };
  }
}

/**
 * Requests a 6-digit password reset code sent by email
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; message?: string; error?: string; emailResult?: EmailDeliveryResult }> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'No se pudo procesar la recuperación de contraseña' };
    }
    return data;
  } catch (err: any) {
    console.warn('[Auth] Error solicitando recuperación de contraseña:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

/**
 * Verifies the 6-digit reset code and sets a new password
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'No se pudo restablecer la contraseña' };
    }
    return data;
  } catch (err: any) {
    console.warn('[Auth] Error confirmando nueva contraseña:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

/**
 * Upserts a user profile into Render PostgreSQL
 */
export async function saveUserToDb(user: any): Promise<boolean> {
  try {
    const res = await fetch('/api/db/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('[RenderDb] Error guardando usuario en PostgreSQL:', err);
    return false;
  }
}

/**
 * Fetches all registered users from Render PostgreSQL
 */
export async function fetchUsersFromDb(): Promise<any[] | null> {
  try {
    const res = await fetch('/api/db/users');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && Array.isArray(data.users)) {
      return data.users;
    }
    return null;
  } catch (err) {
    console.warn('[RenderDb] Error cargando usuarios de PostgreSQL:', err);
    return null;
  }
}

/**
 * Triggers an email notification for a project status change
 */
export async function sendProjectStatusNotification(
  project: ProjectRequest,
  newStatus: string,
  previousStatus?: string
): Promise<{ success: boolean; result?: EmailDeliveryResult }> {
  try {
    const res = await fetch('/api/notifications/project-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project,
        newStatus,
        previousStatus,
      }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: !!data.success, result: data.result };
  } catch (err) {
    console.warn('[EmailNotification] Error enviando notificación de estado:', err);
    return { success: false };
  }
}


