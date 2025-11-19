import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminDashboard } from '../AdminDashboard/AdminDashboard';
import { ModuleManagement } from '../ModuleManagement/ModuleManagement';
import { PermissionMatrix } from '../PermissionMatrix/PermissionMatrix';
import { SubscriptionPlanManagement } from '../SubscriptionPlanManagement/SubscriptionPlanManagement';
import { AuditLogViewer } from '../AuditLogViewer/AuditLogViewer';
import { LegalTemplateManagement } from '../LegalTemplateManagement/LegalTemplateManagement';
import { BackupRollbackSystem } from '../BackupRollbackSystem/BackupRollbackSystem';
import ClientesPage from '../Clients/ClientesPage';
import { Card } from '../Card/Card';
import { 
  Shield, 
  Package, 
  Key, 
  CreditCard, 
  History, 
  Users, 
  Settings,
  FileText,
  Database,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminSidebar: React.FC<{ 
  activeSection: string; 
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}> = ({ activeSection, setActiveSection, isCollapsed, toggleSidebar }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'modules', label: 'Módulos', icon: Package },
    { id: 'permissions', label: 'Permissões', icon: Key },
    { id: 'plans', label: 'Planos', icon: CreditCard },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'audit', label: 'Auditoria', icon: History },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Admin</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-lexiom-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const AdminHeader: React.FC<{ 
  adminUser: AdminUser | null; 
  onLogout: () => void;
  toggleSidebar: () => void;
}> = ({ adminUser, onLogout, toggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            Painel de Administração - Lexiom
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-lexiom-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {adminUser?.full_name?.charAt(0).toUpperCase() || adminUser?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900">{adminUser?.full_name || adminUser?.email}</div>
              <div className="text-xs text-gray-500">{adminUser?.role}</div>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const AdminInterface: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminUser();
  }, []);

  const loadAdminUser = async () => {
    try {
      // Get current user from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('No authenticated user found');
        return;
      }

      // Load admin user data
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setAdminUser(data);

    } catch (error) {
      console.error('Error loading admin user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'clientes':
        return <ClientesPage />;
      case 'modules':
        return <ModuleManagement />;
      case 'permissions':
        return <PermissionMatrix />;
      case 'plans':
        return <SubscriptionPlanManagement />;
      case 'audit':
        return <AuditLogViewer />;
      case 'templates':
        return <LegalTemplateManagement />;
      case 'backup':
        return <BackupRollbackSystem />;
      case 'users':
        return (
          <Card title="Gerenciamento de Usuários" variant="standard">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
              <p className="text-gray-600">O gerenciamento de usuários será implementado em breve.</p>
            </div>
          </Card>
        );
      case 'settings':
        return (
          <Card title="Configurações do Sistema" variant="standard">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
              <p className="text-gray-600">As configurações do sistema serão implementadas em breve.</p>
            </div>
          </Card>
        );
      default:
        return <AdminDashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lexiom-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando interface administrativa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader 
          adminUser={adminUser} 
          onLogout={onLogout}
          toggleSidebar={toggleSidebar}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
