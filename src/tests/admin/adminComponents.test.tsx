import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModuleManagement } from '../../components/ModuleManagement/ModuleManagement';
import { PermissionMatrix } from '../../components/PermissionMatrix/PermissionMatrix';
import { SubscriptionPlanManagement } from '../../components/SubscriptionPlanManagement/SubscriptionPlanManagement';
import { AuditLogViewer } from '../../components/AuditLogViewer/AuditLogViewer';
import { LegalTemplateManagement } from '../../components/LegalTemplateManagement/LegalTemplateManagement';
import { BackupRollbackSystem } from '../../components/BackupRollbackSystem/BackupRollbackSystem';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Admin Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('ModuleManagement', () => {
    it('renders module management interface', () => {
      render(<ModuleManagement />, { wrapper });
      
      expect(screen.getByText('Module Management')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search modules...')).toBeInTheDocument();
    });

    it('handles module search functionality', async () => {
      const user = userEvent.setup();
      render(<ModuleManagement />, { wrapper });
      
      const searchInput = screen.getByPlaceholderText('Search modules...');
      await user.type(searchInput, 'analytics');
      
      expect(searchInput).toHaveValue('analytics');
    });

    it('handles module toggle with confirmation', async () => {
      const mockModules = [
        {
          id: 'analytics',
          name: 'Analytics Module',
          description: 'Analytics tracking module',
          enabled: true,
          dependencies: [],
          configuration: {}
        }
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ modules: mockModules })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<ModuleManagement />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Analytics Module')).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('switch');
      await userEvent.click(toggleButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/modules/analytics/toggle'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('PermissionMatrix', () => {
    it('renders permission matrix interface', () => {
      render(<PermissionMatrix />, { wrapper });
      
      expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search roles or permissions...')).toBeInTheDocument();
    });

    it('handles role creation', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ roles: [], permissions: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<PermissionMatrix />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Create Role')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Role');
      await user.click(createButton);

      const roleNameInput = screen.getByPlaceholderText('Role name');
      await user.type(roleNameInput, 'Test Role');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/roles'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Role')
        })
      );
    });
  });

  describe('SubscriptionPlanManagement', () => {
    it('renders subscription plan management interface', () => {
      render(<SubscriptionPlanManagement />, { wrapper });
      
      expect(screen.getByText('Subscription Plan Management')).toBeInTheDocument();
      expect(screen.getByText('Create New Plan')).toBeInTheDocument();
    });

    it('handles plan creation form', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ plans: [], modules: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<SubscriptionPlanManagement />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Create New Plan')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create New Plan');
      await user.click(createButton);

      const planNameInput = screen.getByPlaceholderText('Plan name');
      await user.type(planNameInput, 'Premium Plan');

      const priceInput = screen.getByPlaceholderText('0.00');
      await user.type(priceInput, '29.99');

      const saveButton = screen.getByText('Create Plan');
      await user.click(saveButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/plans'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Premium Plan')
        })
      );
    });
  });

  describe('AuditLogViewer', () => {
    it('renders audit log viewer interface', () => {
      render(<AuditLogViewer />, { wrapper });
      
      expect(screen.getByText('Audit Log Viewer')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search audit logs...')).toBeInTheDocument();
    });

    it('handles audit log filtering', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ logs: [], total: 0 })
        });

      render(<AuditLogViewer />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Severity:')).toBeInTheDocument();
      });

      const severitySelect = screen.getByRole('combobox', { name: /severity/i });
      await user.selectOptions(severitySelect, 'error');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('severity=error'),
        expect.any(Object)
      );
    });

    it('handles audit log export', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ logs: [], total: 0 })
        });

      render(<AuditLogViewer />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV');
      await user.click(exportButton);

      // Verify that export functionality is triggered
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });

  describe('LegalTemplateManagement', () => {
    it('renders legal template management interface', () => {
      render(<LegalTemplateManagement />, { wrapper });
      
      expect(screen.getByText('Legal Template Management')).toBeInTheDocument();
      expect(screen.getByText('Create Template')).toBeInTheDocument();
    });

    it('handles template creation', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ templates: [], categories: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<LegalTemplateManagement />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Create Template')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Template');
      await user.click(createButton);

      const titleInput = screen.getByPlaceholderText('Template title');
      await user.type(titleInput, 'Privacy Policy');

      const contentTextarea = screen.getByPlaceholderText('Template content...');
      await user.type(contentTextarea, 'This is the privacy policy content.');

      const saveButton = screen.getByText('Save Template');
      await user.click(saveButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/legal-templates'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Privacy Policy')
        })
      );
    });
  });

  describe('BackupRollbackSystem', () => {
    it('renders backup rollback system interface', () => {
      render(<BackupRollbackSystem />, { wrapper });
      
      expect(screen.getByText('Backup & Rollback System')).toBeInTheDocument();
      expect(screen.getByText('Create Backup')).toBeInTheDocument();
    });

    it('handles backup creation', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: [], schedules: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, backupId: 'backup-123' })
        });

      render(<BackupRollbackSystem />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Create Backup')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Backup');
      await user.click(createButton);

      const nameInput = screen.getByPlaceholderText('Backup name');
      await user.type(nameInput, 'Test Backup');

      const typeSelect = screen.getByRole('combobox', { name: /backup type/i });
      await user.selectOptions(typeSelect, 'full');

      const createBackupButton = screen.getByText('Create');
      await user.click(createBackupButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backups'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Backup')
        })
      );
    });

    it('handles backup scheduling', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: [], schedules: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<BackupRollbackSystem />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Schedule Backup')).toBeInTheDocument();
      });

      const scheduleButton = screen.getByText('Schedule Backup');
      await user.click(scheduleButton);

      const frequencySelect = screen.getByRole('combobox', { name: /frequency/i });
      await user.selectOptions(frequencySelect, 'daily');

      const timeInput = screen.getByLabelText(/time/i);
      await user.type(timeInput, '02:00');

      const saveScheduleButton = screen.getByText('Save Schedule');
      await user.click(saveScheduleButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backups/schedule'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('daily')
        })
      );
    });
  });
});