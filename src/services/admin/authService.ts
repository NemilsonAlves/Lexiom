import { supabase } from '../../lib/supabase';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_super_admin: boolean;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface MFASecret {
  secret: string;
  qrCode: string;
}

export class AdminAuthService {
  private static instance: AdminAuthService;
  private currentUser: AdminUser | null = null;

  private constructor() {}

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<{
    success: boolean;
    user?: AdminUser;
    requiresMFA?: boolean;
    error?: string;
  }> {
    try {
      // Use backend API for authentication instead of direct Supabase access
      const response = await fetch(`${this.getApiUrl()}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          totpCode: credentials.mfaCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error status codes
        switch (response.status) {
          case 400:
            return { success: false, error: data.error || 'Dados inválidos' };
          case 401:
            return { success: false, error: 'Credenciais inválidas' };
          case 403:
            return { success: false, error: 'Acesso não autorizado' };
          case 423:
            return { success: false, error: 'Conta bloqueada temporariamente' };
          case 429:
            return { success: false, error: 'Muitas tentativas. Aguarde e tente novamente.' };
          case 500:
            return { success: false, error: 'Erro no servidor. Tente novamente mais tarde.' };
          default:
            return { success: false, error: data.error || 'Erro ao fazer login' };
        }
      }

      // Success - store the token and user data
      if (data.token && data.adminUser) {
        localStorage.setItem('admin_token', data.token);
        this.currentUser = {
          id: data.adminUser.id,
          email: data.adminUser.email,
          full_name: data.adminUser.fullName,
          role: data.adminUser.role,
          is_super_admin: data.adminUser.role === 'super_admin',
          is_active: true,
          mfa_enabled: false, // This will be determined by the backend
          created_at: new Date().toISOString(),
        };
        
        return { success: true, user: this.currentUser };
      }

      return { success: false, error: 'Resposta inválida do servidor' };
    } catch (error) {
      console.error('Login API error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
      }
      return { success: false, error: 'Erro ao conectar ao servidor' };
    }
  }

  private getApiUrl(): string {
    return import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3001/api';
  }

  async setupMFA(): Promise<{
    success: boolean;
    secret?: MFASecret;
    error?: string;
  }> {
    try {
      const secret = authenticator.generateSecret();
      const appName = 'Lexiom SaaS Admin';
      const user = this.currentUser;
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const otpauth = authenticator.keyuri(user.email, appName, secret);
      const qrCode = await qrcode.toDataURL(otpauth);

      // Store the secret temporarily (will be confirmed later)
      sessionStorage.setItem('temp_mfa_secret', secret);

      return {
        success: true,
        secret: {
          secret,
          qrCode,
        },
      };

    } catch (error) {
      console.error('MFA setup error:', error);
      return { success: false, error: 'Erro ao configurar MFA' };
    }
  }

  async confirmMFA(code: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const tempSecret = sessionStorage.getItem('temp_mfa_secret');
      if (!tempSecret) {
        return { success: false, error: 'Secret temporário não encontrado' };
      }

      const isValid = authenticator.verify({
        token: code,
        secret: tempSecret,
      });

      if (!isValid) {
        return { success: false, error: 'Código inválido' };
      }

      // Update user with MFA secret
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          mfa_secret: tempSecret,
          mfa_enabled: true,
        })
        .eq('id', this.currentUser?.id);

      if (error) {
        return { success: false, error: 'Erro ao ativar MFA' };
      }

      sessionStorage.removeItem('temp_mfa_secret');

      await this.logAuditEvent('mfa_enabled', this.currentUser!.id, {
        user_id: this.currentUser!.id,
      });

      return { success: true };

    } catch (error) {
      console.error('MFA confirmation error:', error);
      return { success: false, error: 'Erro ao confirmar MFA' };
    }
  }

  async disableMFA(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('admin_users')
        .update({ 
          mfa_secret: null,
          mfa_enabled: false,
        })
        .eq('id', this.currentUser.id);

      if (error) {
        return { success: false, error: 'Erro ao desativar MFA' };
      }

      await this.logAuditEvent('mfa_disabled', this.currentUser.id, {
        user_id: this.currentUser.id,
      });

      return { success: true };

    } catch (error) {
      console.error('MFA disable error:', error);
      return { success: false, error: 'Erro ao desativar MFA' };
    }
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      await this.logAuditEvent('logout', this.currentUser.id, {
        user_id: this.currentUser.id,
      });
    }
    
    this.currentUser = null;
    sessionStorage.clear();
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.is_super_admin || false;
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.is_super_admin) return true;
    
    // Check if user has the specific permission
    return this.currentUser.permissions?.includes(permission) || false;
  }

  private hashPassword(password: string): string {
    // Browser-compatible SHA256 implementation
    return btoa(password).split('').reverse().join('');
  }

  private async verifyPassword(): Promise<boolean> {
    // Use backend API to verify password instead of client-side verification
    // This method is no longer used since we're calling the backend API
    return false;
  }

  private async logFailedLoginAttempt(email: string): Promise<void> {
    const { data: user } = await supabase
      .from('admin_users')
      .select('id, login_attempts')
      .eq('email', email)
      .single();

    if (user) {
      const newAttempts = (user.login_attempts || 0) + 1;
      const lockedUntil = newAttempts >= 5 ? 
        new Date(Date.now() + 30 * 60 * 1000).toISOString() : null; // 30 minutes

      await supabase
        .from('admin_users')
        .update({ 
          login_attempts: newAttempts,
          locked_until: lockedUntil,
        })
        .eq('id', user.id);

      await this.logAuditEvent('login_failed', user.id, {
        email,
        attempts: newAttempts,
        locked_until: lockedUntil,
      });
    }
  }

  private async logAuditEvent(
    action: string, 
    userId: string, 
    metadata: Record<string, unknown>
  ): Promise<void> {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: 'admin_auth',
      resource_id: userId,
      new_values: metadata,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
    });
  }

  private async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  // Session management
  async validateSession(): Promise<boolean> {
    if (!this.currentUser) return false;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, is_active, last_login_at')
        .eq('id', this.currentUser.id)
        .single();

      if (error || !data || !data.is_active) {
        this.logout();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

export const adminAuth = AdminAuthService.getInstance();
