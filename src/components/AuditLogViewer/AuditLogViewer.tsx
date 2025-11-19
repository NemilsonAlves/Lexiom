import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../Card/Card';
import { 
  History, 
  Search, 
  Filter, 
  Shield, 
  Key, 
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface AuditLog {
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

interface AuditFilters {
  action: string;
  resource_type: string;
  user_id: string;
  date_from: string;
  date_to: string;
  severity: 'all' | 'info' | 'warning' | 'error';
}

export const AuditLogViewer: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AuditFilters>({
    action: '',
    resource_type: '',
    user_id: '',
    date_from: '',
    date_to: '',
    severity: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getLogSeverity = (log: AuditLog): 'info' | 'warning' | 'error' => {
    const errorActions = ['delete', 'deactivate', 'ban', 'lock', 'failed_login'];
    const warningActions = ['update', 'modify', 'change', 'toggle'];
    if (errorActions.some(action => log.action.includes(action))) return 'error';
    if (warningActions.some(action => log.action.includes(action))) return 'warning';
    return 'info';
  };

  const applyFilters = React.useCallback(() => {
    const filtered = auditLogs.filter(log => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          log.action.toLowerCase().includes(searchLower) ||
          log.resource_type.toLowerCase().includes(searchLower) ||
          log.resource_id.toLowerCase().includes(searchLower) ||
          log.admin_user?.email.toLowerCase().includes(searchLower) ||
          log.admin_user?.full_name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.action && log.action !== filters.action) return false;
      if (filters.resource_type && log.resource_type !== filters.resource_type) return false;
      if (filters.user_id && log.user_id !== filters.user_id) return false;
      if (filters.date_from && new Date(log.created_at) < new Date(filters.date_from)) return false;
      if (filters.date_to && new Date(log.created_at) > new Date(filters.date_to)) return false;
      if (filters.severity !== 'all') {
        const logSeverity = getLogSeverity(log);
        if (logSeverity !== filters.severity) return false;
      }
      return true;
    });
    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [auditLogs, searchTerm, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin_user:admin_users!user_id(
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setAuditLogs(data || []);

    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <Plus className="w-4 h-4" />;
    if (action.includes('update')) return <Edit className="w-4 h-4" />;
    if (action.includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (action.includes('login')) return <Key className="w-4 h-4" />;
    if (action.includes('permission')) return <Shield className="w-4 h-4" />;
    return <History className="w-4 h-4" />;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getResourceTypeColor = (resourceType: string) => {
    const colors: Record<string, string> = {
      'user': 'bg-blue-100 text-blue-800',
      'role': 'bg-purple-100 text-purple-800',
      'permission': 'bg-green-100 text-green-800',
      'module': 'bg-orange-100 text-orange-800',
      'plan': 'bg-yellow-100 text-yellow-800',
      'template': 'bg-pink-100 text-pink-800',
      'subscription': 'bg-indigo-100 text-indigo-800'
    };
    return colors[resourceType] || 'bg-gray-100 text-gray-800';
  };

  const formatChanges = (oldValues: Record<string, unknown>, newValues: Record<string, unknown>) => {
    const changes: string[] = [];
    
    if (oldValues && newValues) {
      Object.keys(newValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          changes.push(`${key}: ${oldValues[key]} → ${newValues[key]}`);
        }
      });
    }
    
    return changes.length > 0 ? changes.join(', ') : 'Sem alterações detalhadas';
  };

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Tipo de Recurso', 'ID do Recurso', 'Severidade', 'Mudanças', 'IP'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.admin_user?.email || log.user_id,
        log.action,
        log.resource_type,
        log.resource_id,
        getLogSeverity(log),
        formatChanges(log.old_values, log.new_values),
        log.ip_address
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))].sort();
  const uniqueResourceTypes = [...new Set(auditLogs.map(log => log.resource_type))].sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lexiom-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-soehne font-bold text-lexiom-text">
            Registro de Auditoria
          </h1>
          <p className="text-gray-600 font-inter mt-1">
            Visualize todas as operações administrativas e alterações do sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAuditLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card title="Filtros" variant="standard">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtros Avançados</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ação
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                >
                  <option value="">Todas as ações</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Recurso
                </label>
                <select
                  value={filters.resource_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, resource_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                >
                  <option value="">Todos os tipos</option>
                  {uniqueResourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severidade
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as 'all' | 'info' | 'warning' | 'error' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                >
                  <option value="all">Todas as severidades</option>
                  <option value="info">Informação</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total de Logs" variant="standard">
          <div className="text-2xl font-bold text-gray-900">{auditLogs.length}</div>
        </Card>
        <Card title="Filtrados" variant="standard">
          <div className="text-2xl font-bold text-blue-600">{filteredLogs.length}</div>
        </Card>
        <Card title="Erros" variant="standard">
          <div className="text-2xl font-bold text-red-600">
            {auditLogs.filter(log => getLogSeverity(log) === 'error').length}
          </div>
        </Card>
        <Card title="Avisos" variant="standard">
          <div className="text-2xl font-bold text-yellow-600">
            {auditLogs.filter(log => getLogSeverity(log) === 'warning').length}
          </div>
        </Card>
      </div>

      {/* Audit Logs List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Registros ({currentLogs.length} de {filteredLogs.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {currentLogs.map(log => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(getLogSeverity(log))}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActionIcon(log.action)}
                      <span className="font-medium text-gray-900">
                        {log.admin_user?.full_name || log.admin_user?.email || log.user_id}
                      </span>
                      <span className="text-gray-500">realizou</span>
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-gray-500">em</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(log.resource_type)}`}>
                        {log.resource_type}
                      </span>
                      <span className="text-gray-500">#{log.resource_id}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {formatChanges(log.old_values, log.new_values)}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(log.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>IP: {log.ip_address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {indexOfFirstLog + 1} até {Math.min(indexOfLastLog, filteredLogs.length)} de {filteredLogs.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
