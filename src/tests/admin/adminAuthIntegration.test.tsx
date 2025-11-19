import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminApp } from '../../components/AdminApp/AdminApp';
import { AdminInterface } from '../../components/AdminInterface/AdminInterface';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Admin Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.clear();
  });

  describe('Login Flow', () => {
    it('should authenticate admin user successfully', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'test-jwt-token',
            user: {
              id: 1,
              email: 'admin@test.com',
              role: 'super_admin',
              mfa_required: false
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            modules: [],
            totalUsers: 100,
            activeUsers: 80,
            totalRevenue: 10000
          })
        });

      render(<AdminApp />, { wrapper: TestWrapper });

      // Fill login form
      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'admin@test.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(loginButton);

      // Wait for successful login and redirect
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Verify token is stored
      expect(localStorage.getItem('adminToken')).toBe('test-jwt-token');
    });

    it('should handle MFA verification when required', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: null,
            user: {
              id: 1,
              email: 'admin@test.com',
              role: 'super_admin',
              mfa_required: true
            },
            mfa_token: 'mfa-challenge-token'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'test-jwt-token',
            user: {
              id: 1,
              email: 'admin@test.com',
              role: 'super_admin',
              mfa_required: false
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            modules: [],
            totalUsers: 100,
            activeUsers: 80,
            totalRevenue: 10000
          })
        });

      render(<AdminApp />, { wrapper: TestWrapper });

      // Fill login form
      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'admin@test.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(loginButton);

      // Wait for MFA verification screen
      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      });

      // Enter MFA code
      const mfaInput = screen.getByPlaceholderText('000000');
      const verifyButton = screen.getByRole('button', { name: /verify/i });

      await userEvent.type(mfaInput, '123456');
      await userEvent.click(verifyButton);

      // Wait for successful login
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle login errors', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'Invalid credentials'
          })
        });

      render(<AdminApp />, { wrapper: TestWrapper });

      // Fill login form with invalid credentials
      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'invalid@test.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(loginButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Verify user stays on login page
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'));

      render(<AdminApp />, { wrapper: TestWrapper });

      // Fill login form
      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'admin@test.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(loginButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should automatically redirect to dashboard if token exists', async () => {
      localStorage.setItem('adminToken', 'existing-token');

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            modules: [],
            totalUsers: 100,
            activeUsers: 80,
            totalRevenue: 10000
          })
        });

      render(<AdminApp />, { wrapper: TestWrapper });

      // Should redirect to dashboard automatically
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle token validation failure', async () => {
      localStorage.setItem('adminToken', 'invalid-token');

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'Invalid token'
          })
        });

      render(<AdminApp />, { wrapper: TestWrapper });

      // Should redirect back to login
      await waitFor(() => {
        expect(screen.getByText('Admin Login')).toBeInTheDocument();
      });

      // Verify token is removed
      expect(localStorage.getItem('adminToken')).toBeNull();
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully and redirect to login', async () => {
      localStorage.setItem('adminToken', 'test-token');

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            modules: [],
            totalUsers: 100,
            activeUsers: 80,
            totalRevenue: 10000
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Logged out successfully'
          })
        });

      render(
        <Routes>
          <Route path="/admin/*" element={<AdminInterface onLogout={() => {}} />} />
          <Route path="/admin/login" element={<div>Login Page</div>} />
        </Routes>,
        { 
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
              <MemoryRouter initialEntries={['/admin']}>
                {children}
              </MemoryRouter>
            </QueryClientProvider>
          )
        }
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await userEvent.click(logoutButton);

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      // Verify token is removed
      expect(localStorage.getItem('adminToken')).toBeNull();
    });
  });

  describe('Protected Routes', () => {
    it('should prevent access to admin routes without authentication', async () => {
      render(
        <Routes>
          <Route path="/admin/*" element={<AdminInterface onLogout={() => {}} />} />
          <Route path="/admin/login" element={<div>Login Required</div>} />
        </Routes>,
        { 
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
              <MemoryRouter initialEntries={['/admin/dashboard']}>
                {children}
              </MemoryRouter>
            </QueryClientProvider>
          )
        }
      );

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText('Login Required')).toBeInTheDocument();
      });
    });

    it('should allow access to admin routes with valid authentication', async () => {
      localStorage.setItem('adminToken', 'valid-token');

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            modules: [],
            totalUsers: 100,
            activeUsers: 80,
            totalRevenue: 10000
          })
        });

      render(
        <Routes>
          <Route path="/admin/*" element={<AdminInterface onLogout={() => {}} />} />
        </Routes>,
        { 
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
              <MemoryRouter initialEntries={['/admin/dashboard']}>
                {children}
              </MemoryRouter>
            </QueryClientProvider>
          )
        }
      );

      // Should show dashboard
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from API errors and show user-friendly messages', async () => {
      localStorage.setItem('adminToken', 'valid-token');

      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            modules: [],
            totalUsers: 100,
            activeUsers: 80,
            totalRevenue: 10000
          })
        });

      render(<AdminApp />, { wrapper: TestWrapper });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Should recover and show dashboard on retry
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });
  });
});