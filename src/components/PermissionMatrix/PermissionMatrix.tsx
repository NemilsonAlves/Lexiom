import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../Card/Card';
import { 
  Shield, 
  Users, 
  Key, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  is_active: boolean;
}



export const PermissionMatrix: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Map<string, Map<string, boolean>>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Load permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);

      // Load role permissions
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rolePermissionsError) throw rolePermissionsError;

      // Build permission matrix
      const permissionMatrix = new Map<string, Map<string, boolean>>();
      (rolesData || []).forEach(role => {
        const rolePerms = new Map<string, boolean>();
        (rolePermissionsData || []).forEach(rp => {
          if (rp.role_id === role.id && rp.granted) {
            rolePerms.set(rp.permission_id, true);
          }
        });
        permissionMatrix.set(role.id, rolePerms);
      });
      setRolePermissions(permissionMatrix);

    } catch (error) {
      console.error('Error loading permission data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    const newRolePermissions = new Map(rolePermissions);
    const rolePerms = newRolePermissions.get(roleId) || new Map<string, boolean>();
    rolePerms.set(permissionId, !rolePerms.get(permissionId));
    newRolePermissions.set(roleId, rolePerms);
    setRolePermissions(newRolePermissions);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      setIsLoading(true);
      
      // Prepare bulk insert/update
      const updates: Record<string, unknown>[] = [];
      
      roles.forEach(role => {
        const rolePerms = rolePermissions.get(role.id) || new Map<string, boolean>();
        permissions.forEach(permission => {
          const granted = rolePerms.get(permission.id) || false;
          updates.push({
            role_id: role.id,
            permission_id: permission.id,
            granted,
            granted_at: new Date().toISOString(),
            granted_by: 'current-user-id' // This would come from auth context
          });
        });
      });

      // Delete existing permissions for these roles
      const roleIds = roles.map(r => r.id);
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .in('role_id', roleIds);

      if (deleteError) throw deleteError;

      // Insert new permissions
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(updates);

      if (insertError) throw insertError;

      setHasChanges(false);
      alert('Permissões salvas com sucesso!');

    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Erro ao salvar permissões');
    } finally {
      setIsLoading(false);
    }
  };

  const createRole = async () => {
    try {
      if (!newRole.name.trim()) {
        alert('Por favor, insira um nome para a função');
        return;
      }

      const { data, error } = await supabase
        .from('roles')
        .insert([{
          name: newRole.name.trim(),
          description: newRole.description.trim(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setRoles(prev => [...prev, data]);
      setNewRole({ name: '', description: '' });
      setShowRoleModal(false);
      
      // Initialize permissions for new role
      const newRolePermissions = new Map(rolePermissions);
      newRolePermissions.set(data.id, new Map<string, boolean>());
      setRolePermissions(newRolePermissions);

    } catch (error) {
      console.error('Error creating role:', error);
      alert('Erro ao criar função');
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta função?')) return;

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(prev => prev.filter(r => r.id !== roleId));
      const newRolePermissions = new Map(rolePermissions);
      newRolePermissions.delete(roleId);
      setRolePermissions(newRolePermissions);

    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Erro ao excluir função');
    }
  };

  const getFilteredPermissions = () => {
    return permissions.filter(permission => {
      const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           permission.resource.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const getCategories = () => {
    const categories = new Set(permissions.map(p => p.category));
    return Array.from(categories).sort();
  };

  const getPermissionIcon = (permission: Permission) => {
    switch (permission.category) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'modules': return <Key className="w-4 h-4" />;
      default: return <Key className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lexiom-primary"></div>
      </div>
    );
  }

  const filteredPermissions = getFilteredPermissions();
  const categories = getCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-soehne font-bold text-lexiom-text">
            Matriz de Permissões
          </h1>
          <p className="text-gray-600 font-inter mt-1">
            Gerencie permissões por função e controle de acesso baseado em papéis (RBAC)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <button
              onClick={saveChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          )}
          <button
            onClick={() => setShowRoleModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Função</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card title="Filtros" variant="standard">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar permissões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Permission Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissão
                </th>
                {roles.map(role => (
                  <th key={role.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="space-y-1">
                      <div>{role.name}</div>
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => deleteRole(role.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir função"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPermissions.map(permission => (
                <tr key={permission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getPermissionIcon(permission)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {permission.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {permission.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          {permission.resource} • {permission.action}
                        </div>
                      </div>
                    </div>
                  </td>
                  {roles.map(role => {
                    const rolePerms = rolePermissions.get(role.id) || new Map<string, boolean>();
                    const hasPermission = rolePerms.get(permission.id) || false;
                    
                    return (
                      <td key={role.id} className="px-4 py-4 text-center">
                        <button
                          onClick={() => togglePermission(role.id, permission.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            hasPermission 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={hasPermission ? 'Remover permissão' : 'Conceder permissão'}
                        >
                          {hasPermission ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Creation Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar Nova Função
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Função
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  placeholder="Ex: Gerente de Projetos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  rows={3}
                  placeholder="Descreva as responsabilidades desta função..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createRole}
                className="px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
              >
                Criar Função
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
