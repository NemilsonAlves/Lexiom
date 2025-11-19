import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../Card/Card';
import { 
  CheckCircle, 
  XCircle, 
  Plus,
  Star
} from 'lucide-react';

interface SubscriptionPlan {
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

interface PlanModule {
  plan_id: string;
  module_id: string;
  is_enabled: boolean;
  usage_limit: number;
  created_at: string;
}

interface LegalModule {
  id: string;
  name: string;
  identifier: string;
  description: string;
  category: string;
  is_active: boolean;
  is_core: boolean;
  version: string;
  dependencies: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const SubscriptionPlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [modules, setModules] = useState<LegalModule[]>([]);
  const [planModules, setPlanModules] = useState<Map<string, Map<string, PlanModule>>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'BRL',
    billing_cycle: 'monthly' as 'monthly' | 'yearly' | 'custom',
    features: [] as string[],
    max_users: 1,
    max_storage_gb: 10,
    is_popular: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load legal modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('legal_modules')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Load plan modules
      const { data: planModulesData, error: planModulesError } = await supabase
        .from('plan_module_permissions')
        .select('*');

      if (planModulesError) throw planModulesError;

      // Build plan modules matrix
      const planModulesMap = new Map<string, Map<string, PlanModule>>();
      (plansData || []).forEach(plan => {
        const planMods = new Map<string, PlanModule>();
        (planModulesData || []).forEach(pm => {
          if (pm.plan_id === plan.id) {
            planMods.set(pm.module_id, pm);
          }
        });
        planModulesMap.set(plan.id, planMods);
      });
      setPlanModules(planModulesMap);

    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlanModule = (planId: string, moduleId: string) => {
    const newPlanModules = new Map(planModules);
    const planMods = newPlanModules.get(planId) || new Map<string, PlanModule>();
    const currentModule = planMods.get(moduleId);
    
    if (currentModule) {
      currentModule.is_enabled = !currentModule.is_enabled;
    } else {
      planMods.set(moduleId, {
        plan_id: planId,
        module_id: moduleId,
        is_enabled: true,
        usage_limit: 0,
        created_at: new Date().toISOString()
      });
    }
    
    newPlanModules.set(planId, planMods);
    setPlanModules(newPlanModules);
  };

  const createPlan = async () => {
    try {
      if (!newPlan.name.trim()) {
        alert('Por favor, insira um nome para o plano');
        return;
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([{
          name: newPlan.name.trim(),
          description: newPlan.description.trim(),
          price: newPlan.price,
          currency: newPlan.currency,
          billing_cycle: newPlan.billing_cycle,
          features: newPlan.features,
          max_users: newPlan.max_users,
          max_storage_gb: newPlan.max_storage_gb,
          is_active: true,
          is_popular: newPlan.is_popular,
          stripe_price_id: '', // This would be created via Stripe API
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => [...prev, data]);
      setNewPlan({
        name: '',
        description: '',
        price: 0,
        currency: 'BRL',
        billing_cycle: 'monthly',
        features: [],
        max_users: 1,
        max_storage_gb: 10,
        is_popular: false
      });
      setShowPlanModal(false);

    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Erro ao criar plano');
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, is_active: !currentStatus } : p
      ));

    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Erro ao alterar status do plano');
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    if (plan.is_popular) return <Star className="w-5 h-5 text-yellow-500" />;
    if (!plan.is_active) return <XCircle className="w-5 h-5 text-red-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const formatPrice = (price: number, currency: string, billing_cycle: string) => {
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price);
    
    const cycleText = billing_cycle === 'monthly' ? '/mês' : 
                     billing_cycle === 'yearly' ? '/ano' : '/ciclo';
    
    return `${formattedPrice} ${cycleText}`;
  };

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
            Gerenciamento de Planos
          </h1>
          <p className="text-gray-600 font-inter mt-1">
            Configure planos de assinatura e permissões por plano
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Plano</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <Card
            key={plan.id}
            title={plan.name}
            variant="standard"
            className={plan.is_popular ? 'ring-2 ring-yellow-400' : ''}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getPlanIcon(plan)}
                {plan.is_popular && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <button
                onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  plan.is_active 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {plan.is_active ? 'Ativo' : 'Inativo'}
              </button>
            </div>
            <div className="space-y-4">
              {/* Plan Info */}
              <div>
                <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                <div className="text-2xl font-bold text-lexiom-text">
                  {formatPrice(plan.price, plan.currency, plan.billing_cycle)}
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuários:</span>
                  <span className="font-medium">{plan.max_users === 999 ? 'Ilimitado' : plan.max_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Armazenamento:</span>
                  <span className="font-medium">{plan.max_storage_gb} GB</span>
                </div>
              </div>

              {/* Features */}
              {plan.features.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recursos:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Module Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Módulos Disponíveis:</h4>
                <div className="space-y-2">
                  {modules.map(module => {
                    const planModule = planModules.get(plan.id)?.get(module.id);
                    const isEnabled = planModule?.is_enabled || false;
                    
                    return (
                      <div key={module.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{module.name}</span>
                        <button
                          onClick={() => togglePlanModule(plan.id, module.id)}
                          className={`p-1 rounded ${
                            isEnabled 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {isEnabled ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-gray-100">
                <button className="w-full px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors">
                  Configurar Plano
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Plan Creation Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar Novo Plano
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Plano
                  </label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                    placeholder="Ex: Plano Profissional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço
                  </label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  rows={3}
                  placeholder="Descreva as características deste plano..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moeda
                  </label>
                  <select
                    value={newPlan.currency}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciclo de Cobrança
                  </label>
                  <select
                    value={newPlan.billing_cycle}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, billing_cycle: e.target.value as 'monthly' | 'yearly' | 'custom' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Usuários
                  </label>
                  <input
                    type="number"
                    value={newPlan.max_users}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, max_users: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Armazenamento (GB)
                </label>
                <input
                  type="number"
                  value={newPlan.max_storage_gb}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, max_storage_gb: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newPlan.is_popular}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, is_popular: e.target.checked }))}
                    className="rounded border-gray-300 text-lexiom-primary focus:ring-lexiom-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Marcar como plano popular
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createPlan}
                className="px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
              >
                Criar Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};