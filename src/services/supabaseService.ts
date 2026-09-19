import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { ProjectRequest, UserProfile } from '../types';

export interface SupabaseReservationRecord {
  id: string;
  order_code: string;
  project_id: string;
  client_name: string;
  destination_address: string;
  delivery_mode: 'delivery' | 'pickup';
  dispatch_hub: string;
  status: string;
  items: any[];
  expires_at: string;
  created_at?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
  timestamp: string;
}

/**
 * Tests live connection to Supabase
 */
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const client = getSupabaseClient();
  const now = new Date().toLocaleTimeString('es-CO');

  if (!client || !isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no configuradas aún en .env',
      timestamp: now,
    };
  }

  try {
    // Ping with a lightweight query to verify connectivity
    const { error } = await client.from('project_requests').select('id').limit(1);
    if (error) {
      // If relation is being created, cache updating or empty, it still confirms reaching your Supabase instance
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST204' ||
        error.code === '42P01' ||
        error.message.toLowerCase().includes('relation') ||
        error.message.toLowerCase().includes('schema cache')
      ) {
        return {
          connected: true,
          message: 'Conexión exitosa con Supabase (Instancia vinculada)',
          timestamp: now,
        };
      }
      return {
        connected: false,
        message: `Supabase API: ${error.message}`,
        timestamp: now,
      };
    }
    return {
      connected: true,
      message: 'Conexión activa con Supabase PostgreSQL',
      timestamp: now,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Fallo de conexión: ${err?.message || 'Error desconocido'}`,
      timestamp: now,
    };
  }
}

/**
 * Fetch all project requests from Supabase
 */
export async function getRemoteProjectRequests(): Promise<ProjectRequest[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('project_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getRemoteProjectRequests:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    // Map database rows to TypeScript ProjectRequest interface
    return data.map((row: any) => ({
      id: row.id || row.code,
      createdAt: row.created_at || new Date().toISOString(),
      client: row.client_data || {
        fullName: row.client_name || 'Cliente Pintuco',
        documentType: row.client_doc_type || 'Cédula de Ciudadanía',
        documentNumber: row.client_doc_number || '',
        email: row.client_email || '',
        phone: row.client_phone || '',
      },
      city: row.city || 'Bogotá',
      address: row.address || '',
      areaM2: Number(row.area_m2) || 0,
      requiredDate: row.required_date || '',
      surfaceType: row.surface_type || 'Pared',
      condition: row.condition || 'Nuevo',
      environment: row.environment || 'interior',
      photoUrl: row.photo_url || undefined,
      additionalDetails: row.additional_details || '',
      colorFamily: row.color_family || '',
      finishPreference: row.finish_preference || 'Mate',
      status: row.status || 'radicado',
      diagnosis: row.diagnosis_data || undefined,
      quotation: row.quotation_data || undefined,
      productionOrder: row.production_order_data || undefined,
      assignedAdvisor: row.assigned_advisor || undefined,
      technicalReviewNotes: row.technical_review_notes || undefined,
    }));
  } catch (err) {
    console.error('Error fetching from Supabase:', err);
    return null;
  }
}

/**
 * Create or save a new project request into Supabase
 */
export async function saveRemoteProjectRequest(request: ProjectRequest): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: request.id,
      client_name: request.client.fullName,
      client_doc_type: request.client.documentType,
      client_doc_number: request.client.documentNumber,
      client_email: request.client.email,
      client_phone: request.client.phone,
      client_data: request.client,
      city: request.city,
      address: request.address,
      area_m2: request.areaM2,
      required_date: request.requiredDate,
      surface_type: request.surfaceType,
      condition: request.condition,
      environment: request.environment,
      photo_url: request.photoUrl || null,
      additional_details: request.additionalDetails || '',
      color_family: request.colorFamily || '',
      finish_preference: request.finishPreference || 'Mate',
      status: request.status,
      diagnosis_data: request.diagnosis || null,
      quotation_data: request.quotation || null,
      production_order_data: request.productionOrder || null,
      assigned_advisor: request.assignedAdvisor || null,
      technical_review_notes: request.technicalReviewNotes || null,
      created_at: request.createdAt || new Date().toISOString(),
    };

    const { error } = await client
      .from('project_requests')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Error saving to Supabase project_requests:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in saveRemoteProjectRequest:', err);
    return false;
  }
}

/**
 * Save an inventory reservation into Supabase
 */
export async function saveRemoteInventoryReservation(reservation: {
  orderCode: string;
  projectId: string;
  clientName: string;
  destinationAddress: string;
  deliveryMode: 'delivery' | 'pickup';
  dispatchHub: string;
  status: string;
  items: any[];
  expiresInHours?: number;
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (reservation.expiresInHours || 48));

    const payload = {
      order_code: reservation.orderCode,
      project_id: reservation.projectId,
      client_name: reservation.clientName,
      destination_address: reservation.destinationAddress,
      delivery_mode: reservation.deliveryMode,
      dispatch_hub: reservation.dispatchHub,
      status: reservation.status,
      items: reservation.items,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('inventory_reservations')
      .insert(payload);

    if (error) {
      console.warn('Error saving to Supabase inventory_reservations:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in saveRemoteInventoryReservation:', err);
    return false;
  }
}

/**
 * Save user profile into Supabase profiles table
 */
export async function saveRemoteUserProfile(user: UserProfile): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      document_type: user.documentType,
      document_number: user.documentNumber,
      phone: user.phone,
      city: user.city,
      company_name: user.companyName || null,
      avatar_url: user.avatarUrl || null,
      created_at: user.createdAt || new Date().toISOString(),
    };

    const { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Error saving to Supabase profiles:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in saveRemoteUserProfile:', err);
    return false;
  }
}

/**
 * Supabase Auth: Sign In
 */
export async function signInWithSupabaseAuth(email: string, pass: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  return await client.auth.signInWithPassword({
    email,
    password: pass,
  });
}

/**
 * Supabase Auth: Sign Up
 */
export async function signUpWithSupabaseAuth(email: string, pass: string, metadata: any) {
  const client = getSupabaseClient();
  if (!client) return null;
  return await client.auth.signUp({
    email,
    password: pass,
    options: {
      data: metadata,
    },
  });
}
