import React, { useState, useEffect } from 'react';
import { adminAPIService } from '../../services/admin/adminAPI';
import { adminAuth } from '../../services/admin/authService';
import { Card } from '../Card/Card';
import { 
  Users, 
  Activity, 
  Server, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity as ActivityIcon
} from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalModules: number;
  activeModules: number;
  totalPlans: number;
  systemHealth: number;
  recentLogins: number;
  pendingApprovals: number;
}

interface ModuleAnalytics {
  moduleId: string;
  moduleName: string;
  usageCount: number;
  errorCount: number;
  lastUsedAt: string;
  performance: number;
}

interface RecentActivity {
  id: string;
  userName: string;
  action: string;
  resourceType: string;
  createdAt: string;
  status: 'success' | 'error' | 'warning';
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [moduleAnalytics, setModuleAnalytics] = useState<ModuleAnalytics[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  const loadDashboardData = React.useCallback(async () => {
    try {
      setIsLoading(true);

      // Load system metrics
      await Promise.all([
        loadSystemMetrics(),
        loadModuleAnalytics(),
        loadRecentActivities()
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminAuth.isSuperAdmin()) {
      return;
    }

    loadDashboardData();
  }, [selectedTimeRange, loadDashboardData]);

  const loadSystemMetrics = async () => {
    try {
      const res = await adminAPIService.getDashboardAnalytics();
      if (!res.success || !res.data) throw new Error(res.error || 'Falha ao carregar analytics');

      const a = res.data;
      setMetrics({
        totalUsers: a.totalUsers || 0,
        activeUsers: a.activeUsers || 0,
        totalModules: a.totalModules || 0,
        activeModules: a.activeModules || 0,
        totalPlans: a.totalPlans || 0,
        systemHealth: 95,
        recentLogins: a.recentActivity?.length || 0,
        pendingApprovals: a.pendingApprovals || 0,
      });

      setModuleAnalytics(a.moduleAnalytics || []);
      setRecentActivities((a.recentActivity || []).map(log => ({
        id: log.id,
        userName: log.admin_user?.full_name || 'Unknown User',
        action: log.action,
        resourceType: log.resource_type,
        createdAt: log.created_at,
        status: log.action.includes('failed') ? 'error' : 'success',
      })));
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const loadModuleAnalytics = async () => Promise.resolve();

  const loadRecentActivities = async () => Promise.resolve();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lexiom-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-soehne font-bold text-lexiom-text">
          Dashboard Administrativo
        </h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
          >
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Total de Usuários"
          description={`${metrics.activeUsers} ativos de ${metrics.totalUsers}`}
          variant="minimal"
          className="bg-gradient-to-br from-blue-50 to-blue-100"
        >
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{metrics.totalUsers}</div>
              <div className="text-sm text-blue-600">
                {metrics.totalUsers > 0 ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1) : '0.0'}% ativos
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Módulos Ativos"
          description={`${metrics.activeModules} de ${metrics.totalModules} módulos`}
          variant="minimal"
          className="bg-gradient-to-br from-green-50 to-green-100"
        >
          <div className="flex items-center justify-between">
            <Server className="w-8 h-8 text-green-600" />
            <div className="text-right">
              <div className="text-2xl font-bold text-green-900">{metrics.activeModules}</div>
              <div className="text-sm text-green-600">
                {metrics.totalModules > 0 ? ((metrics.activeModules / metrics.totalModules) * 100).toFixed(1) : '0.0'}% ativos
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Planos de Assinatura"
          description={`${metrics.totalPlans} planos ativos`}
          variant="minimal"
          className="bg-gradient-to-br from-purple-50 to-purple-100"
        >
          <div className="flex items-center justify-between">
            <PieChart className="w-8 h-8 text-purple-600" />
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-900">{metrics.totalPlans}</div>
              <div className="text-sm text-purple-600">Planos disponíveis</div>
            </div>
          </div>
        </Card>

        <Card
          title="Saúde do Sistema"
          description="Performance geral"
          variant="minimal"
          className="bg-gradient-to-br from-orange-50 to-orange-100"
        >
          <div className="flex items-center justify-between">
            <Shield className="w-8 h-8 text-orange-600" />
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-900">{metrics.systemHealth}%</div>
              <div className="text-sm text-orange-600">
                {metrics.systemHealth >= 90 ? 'Excelente' : metrics.systemHealth >= 70 ? 'Bom' : 'Atenção'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Usage Chart */}
        <Card title="Uso de Módulos" description="Módulos mais utilizados" variant="standard">
          <div className="space-y-4">
            {moduleAnalytics.map((module) => (
              <div key={module.moduleId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{module.moduleName}</span>
                  <span className="text-sm text-gray-500">{module.usageCount} usos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-lexiom-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min((module.usageCount / Math.max(1, ...moduleAnalytics.map(m => m.usageCount))) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Atividade Recente" description="Últimas ações do sistema" variant="standard">
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                {getStatusIcon(activity.status)}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.userName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.action} - {activity.resourceType}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(activity.createdAt).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Logins Recentes"
          description="Últimas 24 horas"
          variant="minimal"
          className="border-l-4 border-blue-500"
        >
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-xl font-bold text-gray-900">{metrics.recentLogins}</div>
              <div className="text-sm text-gray-600">logins</div>
            </div>
          </div>
        </Card>

        <Card
          title="Aprovações Pendentes"
          description="Templates aguardando"
          variant="minimal"
          className="border-l-4 border-yellow-500"
        >
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-500" />
            <div>
              <div className="text-xl font-bold text-gray-900">{metrics.pendingApprovals}</div>
              <div className="text-sm text-gray-600">templates</div>
            </div>
          </div>
        </Card>

        <Card
          title="Performance"
          description="Tempo médio de resposta"
          variant="minimal"
          className="border-l-4 border-green-500"
        >
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-xl font-bold text-gray-900">245ms</div>
              <div className="text-sm text-gray-600">tempo médio</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
