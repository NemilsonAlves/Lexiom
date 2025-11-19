interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

interface LoginResponse {
  token: string;
  adminUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface ModuleData {
  id: string;
  name: string;
  description: string;
  identifier: string;
  category: string;
  version: string;
  is_active: boolean;
  is_core: boolean;
  dependencies: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PermissionData {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface RolePermissionData {
  role_id: string;
  permission_id: string;
  granted: boolean;
  granted_at: string;
  granted_by: string;
}

interface LegalTemplateData {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  is_active: boolean;
  is_approved: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface LegalAreaModuleField {
  name: string;
  type: string;
  required: boolean;
}

interface LegalAreaJurisprudence {
  fonte: string;
  referencia: string;
  resumo: string;
}

interface LegalAreaHistoryItem {
  data: string;
  evento: string;
  usuario_id: string;
}

interface LegalAreaModule {
  setor: string;
  formulario: Record<string, unknown>;
  tipo_de_acao: string;
  campos: LegalAreaModuleField[];
  jurisprudencia: LegalAreaJurisprudence[];
  historico: LegalAreaHistoryItem[];
  created_at: string;
  updated_at: string;
}

interface SubscriptionPlanData {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'custom';
  features: string[];
  max_users: number;
  max_storage_gb: number;
  is_active: boolean;
  is_popular: boolean;
  stripe_price_id: string;
  created_at: string;
  updated_at: string;
}

interface AuditLogData {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  admin_user?: {
    email: string;
    full_name: string;
  };
}

interface DashboardAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalModules: number;
  activeModules: number;
  totalPlans: number;
  recentActivity: AuditLogData[];
  pendingApprovals?: number;
  moduleAnalytics?: Array<{
    moduleId: string;
    moduleName: string;
    usageCount: number;
    errorCount: number;
    lastUsedAt: string;
    performance: number;
  }>;
}

class AdminAPIService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3001/api';
    this.token = localStorage.getItem('admin_token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { success: false, error: errorData.error || 'Request failed' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Authentication
  async login(email: string, password: string, totpCode?: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, totpCode }),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('admin_token', this.token);
    }

    return response;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Module Management
  async getModules(): Promise<ApiResponse<ModuleData[]>> {
    return this.request<ModuleData[]>('/modules');
  }

  async toggleModule(moduleId: string, isActive: boolean): Promise<ApiResponse<ModuleData>> {
    return this.request<ModuleData>(`/modules/${moduleId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async updateModuleConfig(moduleId: string, config: Record<string, unknown>): Promise<ApiResponse<ModuleData>> {
    return this.request<ModuleData>(`/modules/${moduleId}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  // Permission Management
  async getRoles(): Promise<ApiResponse<RoleData[]>> {
    return this.request<RoleData[]>('/roles');
  }

  async getPermissions(): Promise<ApiResponse<PermissionData[]>> {
    return this.request<PermissionData[]>('/permissions');
  }

  async getRolePermissions(): Promise<ApiResponse<RolePermissionData[]>> {
    return this.request<RolePermissionData[]>('/role-permissions');
  }

  async updateRolePermissions(rolePermissions: RolePermissionData[]): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/role-permissions', {
      method: 'POST',
      body: JSON.stringify({ rolePermissions }),
    });
  }

  async createRole(name: string, description: string): Promise<ApiResponse<RoleData>> {
    return this.request<RoleData>('/roles', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteRole(roleId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Subscription Plan Management
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlanData[]>> {
    return this.request<SubscriptionPlanData[]>('/plans');
  }

  async createSubscriptionPlan(planData: Partial<SubscriptionPlanData>): Promise<ApiResponse<SubscriptionPlanData>> {
    return this.request<SubscriptionPlanData>('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async updateSubscriptionPlan(planId: string, planData: Partial<SubscriptionPlanData>): Promise<ApiResponse<SubscriptionPlanData>> {
    return this.request<SubscriptionPlanData>(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  }

  async toggleSubscriptionPlan(planId: string, isActive: boolean): Promise<ApiResponse<SubscriptionPlanData>> {
    return this.request<SubscriptionPlanData>(`/plans/${planId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    resource_type?: string;
  }): Promise<ApiResponse<AuditLogData[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    return this.request<AuditLogData[]>(`/audit-logs?${queryParams.toString()}`);
  }

  // Dashboard Analytics
  async getDashboardAnalytics(): Promise<ApiResponse<DashboardAnalytics>> {
    return this.request<DashboardAnalytics>('/analytics/dashboard');
  }

  // User Management
  async getAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
    return this.request<AdminUser[]>('/admin/users');
  }

  async createAdminUser(userData: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
    return this.request<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateAdminUser(userId: string, userData: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
    return this.request<AdminUser>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async toggleAdminUser(userId: string, isActive: boolean): Promise<ApiResponse<AdminUser>> {
    return this.request<AdminUser>(`/admin/users/${userId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // MFA Management
  async setupMFA(): Promise<ApiResponse<{ secret: string; qrCode: string }>> {
    return this.request<{ secret: string; qrCode: string }>('/admin/mfa/setup', {
      method: 'POST',
    });
  }

  async verifyMFA(totpCode: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/admin/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    });
  }

  async disableMFA(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/admin/mfa/disable', {
      method: 'POST',
    });
  }

  // System Health
  async getSystemHealth(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Backup and Restore
  async createBackup(): Promise<ApiResponse<{ backupId: string; downloadUrl: string }>> {
    return this.request<{ backupId: string; downloadUrl: string }>('/system/backup', {
      method: 'POST',
    });
  }

  async restoreBackup(backupId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/system/restore/${backupId}`, {
      method: 'POST',
    });
  }

  // Legal Templates
  async getLegalTemplates(): Promise<ApiResponse<LegalTemplateData[]>> {
    const res = await this.request<{ templates: LegalTemplateData[] }>('/legal-templates');
    if (!res.success) return { success: false, error: res.error };
    return { success: true, data: res.data?.templates ?? [] };
  }

  async createLegalTemplate(templateData: Partial<LegalTemplateData>): Promise<ApiResponse<LegalTemplateData>> {
    const res = await this.request<{ template: LegalTemplateData }>('/legal-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
    if (!res.success) return { success: false, error: res.error };
    return { success: true, data: res.data?.template };
  }

  async updateLegalTemplate(templateId: string, templateData: Partial<LegalTemplateData>): Promise<ApiResponse<LegalTemplateData>> {
    const res = await this.request<{ template: LegalTemplateData }>(`/legal-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
    if (!res.success) return { success: false, error: res.error };
    return { success: true, data: res.data?.template };
  }

  async deleteLegalTemplate(templateId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/legal-templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Legal Area Modules
  async getLegalAreaModules(): Promise<ApiResponse<LegalAreaModule[]>> {
    const res = await this.request<{ areas: LegalAreaModule[] }>(
      '/legal/area-modules'
    );
    if (!res.success) return { success: false, error: res.error };
    return { success: true, data: res.data?.areas ?? [] };
  }

  async createLegalAreaModule(area: Partial<LegalAreaModule>): Promise<ApiResponse<LegalAreaModule>> {
    const res = await this.request<{ area: LegalAreaModule }>(
      '/legal/area-modules',
      {
        method: 'POST',
        body: JSON.stringify(area),
      }
    );
    if (!res.success) return { success: false, error: res.error };
    return { success: true, data: res.data?.area };
  }

  async updateLegalAreaModule(setor: string, area: Partial<LegalAreaModule>): Promise<ApiResponse<LegalAreaModule>> {
    const res = await this.request<{ area: LegalAreaModule }>(
      `/legal/area-modules/${encodeURIComponent(setor)}`,
      {
        method: 'PUT',
        body: JSON.stringify(area),
      }
    );
    if (!res.success) return { success: false, error: res.error };
    return { success: true, data: res.data?.area };
  }

  async deleteLegalAreaModule(setor: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(
      `/legal/area-modules/${encodeURIComponent(setor)}`,
      { method: 'DELETE' }
    );
  }

  async seedLegalAreaModules(): Promise<ApiResponse<{ success: boolean; count: number }>> {
    return this.request<{ success: boolean; count: number }>(
      '/legal/area-modules/seed',
      { method: 'POST' }
    );
  }
  // Clients
  async checkClientDuplicate(cpfCnpj: string): Promise<ApiResponse<{ success: boolean; mensagem?: string }>> {
    const res = await this.request<{ success: boolean; mensagem?: string }>(`/clients/duplicate?cpf_cnpj=${encodeURIComponent(cpfCnpj)}`);
    return res;
  }

  async createClient(payload: {
    nome_completo: string;
    cpf_cnpj: string;
    tipo_cliente?: 'fisica' | 'juridica';
    telefone: string;
    email?: string;
    endereco?: string;
    observacoes?: string;
  }): Promise<ApiResponse<{ success: boolean; mensagem: string; cliente: unknown }>> {
    const res = await this.request<{ success: boolean; mensagem: string; cliente: unknown }>(`/clients`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res;
  }
}

// Create and export a singleton instance
export const adminAPIService = new AdminAPIService();

// Export types for use in components
export type {
  ModuleData,
  RoleData,
  PermissionData,
  RolePermissionData,
  SubscriptionPlanData,
  AuditLogData,
  DashboardAnalytics,
  AdminUser,
  LegalTemplateData
};
