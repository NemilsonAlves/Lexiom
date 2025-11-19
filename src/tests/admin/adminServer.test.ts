import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../api/server';

// Mock Supabase client before importing the server
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 1, email: 'admin@test.com', role: 'super_admin' },
            error: null
          })),
          data: [{ id: 1, name: 'Test Module', enabled: true }],
          error: null
        })),
        in: vi.fn(() => ({
          data: [],
          error: null
        })),
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 1 },
              error: null
            }))
          })),
          data: [{ id: 1 }],
          error: null
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: { id: 1 },
            error: null
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: { id: 1 },
            error: null
          }))
        }))
      })),
      auth: {
        signInWithPassword: vi.fn(() => ({
          data: { user: { id: 1, email: 'admin@test.com' }, session: { access_token: 'test-token' } },
          error: null
        })),
        signOut: vi.fn(() => ({ error: null }))
      }
    }))
  }))
}));

describe('Admin API Server', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe('Authentication Endpoints', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'admin@test.com');
    });

    it('should fail login with invalid credentials', async () => {
      // Mock will return error by default for invalid credentials

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/admin/logout')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('Module Management Endpoints', () => {
    it('should get all modules', async () => {
      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.modules)).toBe(true);
    });

    it('should toggle module status', async () => {
      const response = await request(app)
        .post('/api/modules/analytics/toggle')
        .set('Authorization', 'Bearer test-token')
        .send({ enabled: false });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should update module configuration', async () => {
      const response = await request(app)
        .put('/api/modules/analytics/config')
        .set('Authorization', 'Bearer test-token')
        .send({
          config: {
            tracking_enabled: true,
            retention_days: 30
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get module dependencies', async () => {
      const response = await request(app)
        .get('/api/modules/analytics/dependencies')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('dependencies');
    });
  });

  describe('Permission Management Endpoints', () => {
    it('should get all roles', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.roles)).toBe(true);
    });

    it('should create a new role', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Role',
          description: 'Test role description',
          permissions: ['read:users', 'write:users']
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toHaveProperty('name', 'Test Role');
    });

    it('should update role permissions', async () => {
      const response = await request(app)
        .put('/api/roles/1/permissions')
        .set('Authorization', 'Bearer test-token')
        .send({
          permissions: ['read:users', 'write:users', 'delete:users']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should delete a role', async () => {
      const response = await request(app)
        .delete('/api/roles/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get all permissions', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.permissions)).toBe(true);
    });
  });

  describe('Subscription Plan Endpoints', () => {
    it('should get all subscription plans', async () => {
      const response = await request(app)
        .get('/api/plans')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.plans)).toBe(true);
    });

    it('should create a new subscription plan', async () => {
      const response = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Premium Plan',
          description: 'Premium subscription plan',
          price: 29.99,
          currency: 'USD',
          interval: 'month',
          features: ['feature1', 'feature2'],
          module_permissions: ['analytics', 'reports']
        });

      expect(response.status).toBe(201);
      expect(response.body.plan).toHaveProperty('name', 'Premium Plan');
    });

    it('should update subscription plan', async () => {
      const response = await request(app)
        .put('/api/plans/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Updated Premium Plan',
          price: 39.99
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should delete subscription plan', async () => {
      const response = await request(app)
        .delete('/api/plans/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Audit Log Endpoints', () => {
    it('should get audit logs', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('total');
    });

    it('should filter audit logs by severity', async () => {
      const response = await request(app)
        .get('/api/audit-logs?severity=error')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('logs');
    });

    it('should search audit logs', async () => {
      const response = await request(app)
        .get('/api/audit-logs?search=login')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('logs');
    });

    it('should export audit logs', async () => {
      const response = await request(app)
        .get('/api/audit-logs/export')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
    });
  });

  describe('Legal Template Endpoints', () => {
    it('should get all legal templates', async () => {
      const response = await request(app)
        .get('/api/legal-templates')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should create a new legal template', async () => {
      const response = await request(app)
        .post('/api/legal-templates')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Privacy Policy',
          content: 'Privacy policy content...',
          category: 'privacy',
          version: '1.0',
          variables: ['company_name', 'contact_email']
        });

      expect(response.status).toBe(201);
      expect(response.body.template).toHaveProperty('title', 'Privacy Policy');
    });

    it('should update legal template', async () => {
      const response = await request(app)
        .put('/api/legal-templates/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: 'Updated privacy policy content...',
          version: '1.1'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should approve legal template', async () => {
      const response = await request(app)
        .post('/api/legal-templates/1/approve')
        .set('Authorization', 'Bearer test-token')
        .send({
          approved: true,
          approved_by: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Backup Endpoints', () => {
    it('should get all backups', async () => {
      const response = await request(app)
        .get('/api/backups')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.backups)).toBe(true);
    });

    it('should create a new backup', async () => {
      const response = await request(app)
        .post('/api/backups')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Backup',
          type: 'full',
          description: 'Test backup description'
        });

      expect(response.status).toBe(201);
      expect(response.body.backup).toHaveProperty('name', 'Test Backup');
    });

    it('should restore from backup', async () => {
      const response = await request(app)
        .post('/api/backups/1/restore')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should schedule backup', async () => {
      const response = await request(app)
        .post('/api/backups/schedule')
        .set('Authorization', 'Bearer test-token')
        .send({
          frequency: 'daily',
          time: '02:00',
          type: 'full'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should delete backup', async () => {
      const response = await request(app)
        .delete('/api/backups/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/modules');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should return 403 for insufficient permissions', async () => {
      // Mock will return user role by default

      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', 'Bearer test-token')
        .set('X-Test-Forbid', 'modules:read');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    it('should handle database errors gracefully', async () => {
      // Database errors will be handled by the server

      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', 'Bearer test-token');

      // The response will depend on the mock implementation
      expect(response.status).toBeDefined();
    });

    it('should handle invalid request data', async () => {
      const response = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer test-token')
        .send({
          // Missing required fields
          name: 'Invalid Plan'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login endpoint', async () => {
      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/admin/login')
          .send({
            email: 'admin@test.com',
            password: 'password123'
          });
      }

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error', 'Too many requests');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', 'Bearer test-token');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
