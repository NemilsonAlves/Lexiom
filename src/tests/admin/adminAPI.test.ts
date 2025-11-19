import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { adminAPIService } from '../../services/admin/adminAPI';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe('Admin API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Authentication', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        adminUser: {
          id: '123',
          email: 'admin@lexiom.com',
          fullName: 'Admin User',
          role: 'super_admin'
        }
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await adminAPIService.login('admin@lexiom.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('admin_token', 'mock-jwt-token');
    });

    it('should handle login failure', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const result = await adminAPIService.login('admin@lexiom.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should logout and clear token', () => {
      adminAPIService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_token');
      expect(adminAPIService.isAuthenticated()).toBe(false);
    });

    it('should check authentication status', () => {
      // Test with token
      localStorageMock.getItem.mockReturnValue('valid-token');
      expect(adminAPIService.isAuthenticated()).toBe(true);

      // Test without token
      localStorageMock.getItem.mockReturnValue(null);
      expect(adminAPIService.isAuthenticated()).toBe(false);
      
      // Reset mock
      localStorageMock.getItem.mockReturnValue('valid-token');
    });
  });

  describe('Module Management', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('valid-token');
    });

    it('should fetch modules successfully', async () => {
      const mockModules = [
        {
          id: '1',
          name: 'Process Management',
          identifier: 'process_management',
          is_active: true,
          is_core: true
        },
        {
          id: '2',
          name: 'Document Management',
          identifier: 'document_management',
          is_active: false,
          is_core: false
        }
      ];

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModules
      });

      const result = await adminAPIService.getModules();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockModules);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/modules'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });

    it('should toggle module status', async () => {
      const mockResponse = { id: '1', is_active: false };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await adminAPIService.toggleModule('1', true);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/modules/1/toggle'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ is_active: true })
        })
      );
    });
  });

  describe('Permission Management', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('valid-token');
    });

    it('should fetch roles successfully', async () => {
      const mockRoles = [
        { id: '1', name: 'Super Admin', description: 'Full system access' },
        { id: '2', name: 'Manager', description: 'Limited admin access' }
      ];

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      });

      const result = await adminAPIService.getRoles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoles);
    });

    it('should fetch permissions successfully', async () => {
      const mockPermissions = [
        { id: '1', name: 'modules:read', resource: 'modules', action: 'read' },
        { id: '2', name: 'modules:update', resource: 'modules', action: 'update' }
      ];

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions
      });

      const result = await adminAPIService.getPermissions();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPermissions);
    });

    it('should update role permissions', async () => {
      const mockRolePermissions = [
        { role_id: '1', permission_id: '1', granted: true, granted_at: '2024-01-01', granted_by: 'admin' }
      ];

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await adminAPIService.updateRolePermissions(mockRolePermissions);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/role-permissions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rolePermissions: mockRolePermissions })
        })
      );
    });
  });

  describe('Subscription Plan Management', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('valid-token');
    });

    it('should fetch subscription plans successfully', async () => {
      const mockPlans = [
        {
          id: '1',
          name: 'Basic Plan',
          price: 29.99,
          currency: 'BRL',
          billing_cycle: 'monthly',
          max_users: 5,
          max_storage_gb: 50
        },
        {
          id: '2',
          name: 'Professional Plan',
          price: 99.99,
          currency: 'BRL',
          billing_cycle: 'monthly',
          max_users: 25,
          max_storage_gb: 500
        }
      ];

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlans
      });

      const result = await adminAPIService.getSubscriptionPlans();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPlans);
    });

    it('should create subscription plan', async () => {
      const newPlan = {
        name: 'Enterprise Plan',
        price: 299.99,
        currency: 'BRL',
        billing_cycle: 'monthly' as const,
        max_users: 100,
        max_storage_gb: 2000
      };

      const mockResponse = { id: '3', ...newPlan };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await adminAPIService.createSubscriptionPlan(newPlan);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('Audit Logs', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('valid-token');
    });

    it('should fetch audit logs with pagination', async () => {
      const mockLogs = [
        {
          id: '1',
          user_id: 'admin-1',
          action: 'module_activated',
          resource_type: 'legal_module',
          resource_id: 'module-1',
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          user_id: 'admin-1',
          action: 'permissions_updated',
          resource_type: 'role_permissions',
          resource_id: 'role-1',
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs
      });

      const result = await adminAPIService.getAuditLogs({ page: 1, limit: 50 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLogs);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/audit-logs?page=1&limit=50'),
        expect.any(Object)
      );
    });

    it('should fetch audit logs with search filters', async () => {
      const mockLogs = [
        {
          id: '1',
          user_id: 'admin-1',
          action: 'module_activated',
          resource_type: 'legal_module',
          resource_id: 'module-1'
        }
      ];

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs
      });

      const result = await adminAPIService.getAuditLogs({
        search: 'module',
        action: 'module_activated',
        resource_type: 'legal_module'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLogs);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/audit-logs?search=module&action=module_activated&resource_type=legal_module'),
        expect.any(Object)
      );
    });
  });

  describe('Dashboard Analytics', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('valid-token');
    });

    it('should fetch dashboard analytics', async () => {
      const mockAnalytics = {
        totalUsers: 50,
        activeUsers: 45,
        totalModules: 15,
        activeModules: 12,
        recentActivity: []
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics
      });

      const result = await adminAPIService.getDashboardAnalytics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalytics);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('valid-token');
    });

    it('should handle network errors', async () => {
      (global.fetch as unknown as Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await adminAPIService.getModules();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle server errors', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Internal server error' })
      });

      const result = await adminAPIService.getModules();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle malformed JSON responses', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      const result = await adminAPIService.getModules();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });
  });

  describe('Authorization', () => {
    it('should include authorization header when token is available', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await adminAPIService.getModules();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/modules'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should not include authorization header when token is not available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await adminAPIService.getModules();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });
});
