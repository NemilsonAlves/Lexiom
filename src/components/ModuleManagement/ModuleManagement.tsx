import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../Card/Card';
import { 
  ToggleLeft, 
  ToggleRight, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Save,
  X,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

interface LegalModule {
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

interface ModuleAnalytics {
  module_id: string;
  usage_count: number;
  error_count: number;
  last_used_at: string;
  performance_metrics: Record<string, unknown>;
}

export const ModuleManagement: React.FC = () => {
  const [modules, setModules] = useState<LegalModule[]>([]);
  const [analytics, setAnalytics] = useState<Map<string, ModuleAnalytics>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    loadModules();
    loadAnalytics();
  }, []);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('legal_modules')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setModules(data || []);

    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('module_analytics')
        .select('*');

      if (error) throw error;

      const analyticsMap = new Map<string, ModuleAnalytics>();
      (data || []).forEach(item => {
        analyticsMap.set(item.module_id, item);
      });
      setAnalytics(analyticsMap);

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const checkDependentModules = (moduleId: string): string[] => {
    return modules
      .filter(m => m.dependencies.includes(moduleId) && m.is_active)
      .map(m => m.id);
  };

  const toggleModule = async (moduleId: string, currentStatus: boolean) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;

      // Check dependencies if activating
      if (!currentStatus && module.dependencies.length > 0) {
        const inactiveDeps = module.dependencies.filter(depId => {
          const dep = modules.find(m => m.id === depId);
          return dep && !dep.is_active;
        });

        if (inactiveDeps.length > 0) {
          alert('Não é possível ativar este módulo. Dependências inativas: ' + 
            inactiveDeps.map(id => modules.find(m => m.id === id)?.name).join(', '));
          return;
        }
      }

      // Check dependent modules if deactivating
      if (currentStatus) {
        const dependentModules = checkDependentModules(moduleId);
        if (dependentModules.length > 0) {
          const dependentNames = dependentModules
            .map(id => modules.find(m => m.id === id)?.name)
            .filter(Boolean)
            .join(', ');
          
          if (!confirm(`Este módulo é dependência de: ${dependentNames}. Deseja realmente desativá-lo?`)) {
            return;
          }
        }
      }

      const { error } = await supabase
        .from('legal_modules')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId);

      if (error) throw error;

      // Update local state
      setModules(prev => prev.map(m => 
        m.id === moduleId ? { ...m, is_active: !currentStatus } : m
      ));

      // Log the change
      await logModuleChange(moduleId, !currentStatus);

    } catch (error) {
      console.error('Error toggling module:', error);
      alert('Erro ao alterar status do módulo');
    }
  };

  const startEditing = (module: LegalModule) => {
    setEditingModule(module.id);
    setEditConfig(module.config);
  };

  const saveConfig = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('legal_modules')
        .update({ 
          config: editConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId);

      if (error) throw error;

      setModules(prev => prev.map(m => 
        m.id === moduleId ? { ...m, config: editConfig } : m
      ));

      setEditingModule(null);
      setEditConfig({});

    } catch (error) {
      console.error('Error saving config:', error);
      alert('Erro ao salvar configuração');
    }
  };

  const cancelEditing = () => {
    setEditingModule(null);
    setEditConfig({});
  };

  const logModuleChange = async (moduleId: string, newStatus: boolean) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: 'current-user-id', // This would come from auth context
        action: newStatus ? 'module_activated' : 'module_deactivated',
        resource_type: 'legal_module',
        resource_id: moduleId,
        new_values: { is_active: newStatus },
      });
    } catch (error) {
      console.error('Error logging module change:', error);
    }
  };

  const exportConfig = () => {
    const config = {
      modules: modules.map(m => ({
        id: m.id,
        name: m.name,
        identifier: m.identifier,
        is_active: m.is_active,
        config: m.config
      })),
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexiom-modules-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.modules && Array.isArray(config.modules)) {
          // Validate and import modules
          for (const moduleConfig of config.modules) {
            if (moduleConfig.id && moduleConfig.identifier) {
              await supabase
                .from('legal_modules')
                .update({
                  is_active: moduleConfig.is_active,
                  config: moduleConfig.config,
                  updated_at: new Date().toISOString()
                })
                .eq('id', moduleConfig.id);
            }
          }
          loadModules();
          alert('Configuração importada com sucesso!');
        }
      } catch (error) {
        console.error('Error importing config:', error);
        alert('Erro ao importar configuração');
      }
    };
    reader.readAsText(file);
  };

  const getModuleStatus = (module: LegalModule) => {
    const moduleAnalytics = analytics.get(module.id);
    const hasErrors = moduleAnalytics && moduleAnalytics.error_count > 0;
    const isRecentlyUsed = moduleAnalytics && moduleAnalytics.last_used_at && 
      new Date(moduleAnalytics.last_used_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (hasErrors) return { status: 'error', label: 'Com erros' };
    if (isRecentlyUsed) return { status: 'success', label: 'Em uso' };
    if (module.is_active) return { status: 'warning', label: 'Ativo' };
    return { status: 'inactive', label: 'Inativo' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lexiom-primary"></div>
      </div>
    );
  }

  const groupedModules = modules.reduce((acc, module) => {
    const category = module.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, LegalModule[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-soehne font-bold text-lexiom-text">
            Gerenciamento de Módulos
          </h1>
          <p className="text-gray-600 font-inter mt-1">
            Ative, desative e configure os módulos jurídicos do sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadModules}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
          <button
            onClick={exportConfig}
            className="flex items-center space-x-2 px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <label className="flex items-center space-x-2 px-4 py-2 bg-lexiom-secondary text-white rounded-lg hover:bg-lexiom-secondary/90 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Module Categories */}
      {Object.entries(groupedModules).map(([category, categoryModules]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-soehne font-semibold text-lexiom-text capitalize">
            {category}
          </h2>
          
          <div className="grid gap-4">
            {categoryModules.map((module) => {
              const moduleStatus = getModuleStatus(module);
              const moduleAnalytics = analytics.get(module.id);
              const isEditing = editingModule === module.id;

              return (
                <Card
                  key={module.id}
                  title={module.name}
                  description={module.description}
                  variant="standard"
                  className={`${module.is_core ? 'border-l-4 border-lexiom-primary' : ''}`}
                  actions={
                    <div className="flex items-center space-x-2">
                      {module.is_core && (
                        <span className="text-xs bg-lexiom-primary text-white px-2 py-1 rounded">
                          Core
                        </span>
                      )}
                      <button
                        onClick={() => startEditing(module)}
                        className="p-2 text-gray-600 hover:text-lexiom-primary hover:bg-gray-50 rounded-lg transition-colors"
                        title="Configurar"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleModule(module.id, module.is_active)}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        title={module.is_active ? 'Desativar' : 'Ativar'}
                        disabled={module.is_core}
                      >
                        {module.is_active ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {/* Module Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Identificador:</span>
                        <div className="font-mono text-gray-900">{module.identifier}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Versão:</span>
                        <div className="text-gray-900">{module.version}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(moduleStatus.status)}`}>
                          {moduleStatus.status === 'success' && <CheckCircle className="w-3 h-3" />}
                          {moduleStatus.status === 'error' && <AlertCircle className="w-3 h-3" />}
                          {moduleStatus.status === 'warning' && <Clock className="w-3 h-3" />}
                          <span>{moduleStatus.label}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Última atualização:</span>
                        <div className="text-gray-900">
                          {new Date(module.updated_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    {moduleAnalytics && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {moduleAnalytics.usage_count}
                            </div>
                            <div className="text-xs text-gray-600">Usos</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {moduleAnalytics.error_count}
                            </div>
                            <div className="text-xs text-gray-600">Erros</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {moduleAnalytics.last_used_at ? 
                                new Date(moduleAnalytics.last_used_at).toLocaleDateString('pt-BR') : 
                                'Nunca'
                              }
                            </div>
                            <div className="text-xs text-gray-600">Último uso</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dependencies */}
                    {module.dependencies.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div>
                          <span className="text-sm font-medium text-gray-700 mb-2 block">
                            Dependências:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {module.dependencies.map(depId => {
                              const dep = modules.find(m => m.id === depId);
                              if (!dep) return null;
                              return (
                                <span
                                  key={depId}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                    dep.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {dep.name}
                                  {dep.is_active ? (
                                    <CheckCircle className="w-3 h-3 ml-1" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 ml-1" />
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Configuration Editor */}
                    {isEditing && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Configuração (JSON)
                            </label>
                            <textarea
                              value={JSON.stringify(editConfig, null, 2)}
                              onChange={(e) => {
                                try {
                                  setEditConfig(JSON.parse(e.target.value));
                                } catch {
                                  // Invalid JSON, ignore
                                }
                              }}
                              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary font-mono text-sm"
                              placeholder='{"feature": true}'
                            />
                            <div className="mt-1 text-xs text-gray-500">
                              Digite um JSON válido para configurar o módulo
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveConfig(module.id)}
                              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Save className="w-4 h-4" />
                              <span>Salvar</span>
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};