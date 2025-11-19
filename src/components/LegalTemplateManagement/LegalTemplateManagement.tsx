import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { adminAPIService } from '../../services/admin/adminAPI';
import type { LegalTemplateData } from '../../services/admin/adminAPI';
import { Card } from '../Card/Card';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Upload,
  Eye,
  Copy,
  X,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface LegalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  version: string;
  is_active: boolean;
  is_approved: boolean;
  approved_by: string;
  approved_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}

interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  default_value?: string;
  options?: string[];
}

export const LegalTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LegalTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<LegalTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    content: '',
    variables: [] as TemplateVariable[],
    version: '1.0.0'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load templates via API (com token)
      const templatesRes = await adminAPIService.getLegalTemplates();
      if (!templatesRes.success) throw new Error(templatesRes.error || 'Falha ao carregar templates');
      const mapped = (templatesRes.data || []).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        content: t.content,
        variables: [],
        version: String(t.version),
        is_active: t.is_active,
        is_approved: t.is_approved,
        approved_by: '',
        approved_at: '',
        created_by: '',
        created_at: t.created_at,
        updated_at: t.updated_at
      }));
      setTemplates(mapped.sort((a, b) => a.name.localeCompare(b.name)));

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

    } catch (error) {
      console.error('Error loading template data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      if (!templateForm.name.trim() || !templateForm.content.trim()) {
        alert('Por favor, preencha o nome e conteúdo do template');
        return;
      }

      const templateData: Partial<LegalTemplateData> = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim(),
        category: templateForm.category,
        content: templateForm.content.trim(),
        version: parseInt(templateForm.version.split('.')[0] || '1', 10),
        is_active: true,
        is_approved: false
      };

      const createRes = await adminAPIService.createLegalTemplate(templateData);
      if (!createRes.success || !createRes.data) throw new Error(createRes.error || 'Falha ao criar template');
      setTemplates(prev => [...prev, {
        id: createRes.data.id,
        name: createRes.data.name,
        description: createRes.data.description,
        category: createRes.data.category,
        content: createRes.data.content,
        variables: [],
        version: String(createRes.data.version),
        is_active: createRes.data.is_active,
        is_approved: createRes.data.is_approved,
        approved_by: '',
        approved_at: '',
        created_by: '',
        created_at: createRes.data.created_at,
        updated_at: createRes.data.updated_at
      }]);
      resetForm();
      setShowModal(false);
      
      // Log the creation
      await logTemplateChange(createRes.data.id, 'template_created');

    } catch (error) {
      console.error('Error creating template:', error);
      alert('Erro ao criar template');
    }
  };

  const updateTemplate = async () => {
    try {
      if (!editingTemplate) return;

      const templateDataUpdate: Partial<LegalTemplateData> = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim(),
        category: templateForm.category,
        content: templateForm.content.trim(),
        version: parseInt(templateForm.version.split('.')[0] || '1', 10),
        is_approved: false
      };

      const updateRes = await adminAPIService.updateLegalTemplate(editingTemplate.id, templateDataUpdate);
      if (!updateRes.success || !updateRes.data) throw new Error(updateRes.error || 'Falha ao atualizar template');
      setTemplates(prev => prev.map(t => t.id === updateRes.data!.id ? {
        ...t,
        name: updateRes.data!.name,
        description: updateRes.data!.description,
        category: updateRes.data!.category,
        content: updateRes.data!.content,
        version: String(updateRes.data!.version),
        is_approved: updateRes.data!.is_approved,
        updated_at: updateRes.data!.updated_at
      } : t));
      resetForm();
      setShowModal(false);
      setEditingTemplate(null);
      
      // Log the update
      await logTemplateChange(updateRes.data.id, 'template_updated');

    } catch (error) {
      console.error('Error updating template:', error);
      alert('Erro ao atualizar template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const delRes = await adminAPIService.deleteLegalTemplate(templateId);
      if (!delRes.success) throw new Error(delRes.error || 'Falha ao excluir template');

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      // Log the deletion
      await logTemplateChange(templateId, 'template_deleted');

    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Erro ao excluir template');
    }
  };

  const approveTemplate = async (templateId: string) => {
    try {
      const approvePayload: Partial<LegalTemplateData> & { approved_by?: string; approved_at?: string } = {
        is_approved: true,
        approved_by: 'current-user-id',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const approveRes = await adminAPIService.updateLegalTemplate(templateId, approvePayload);
      if (!approveRes.success || !approveRes.data) throw new Error(approveRes.error || 'Falha ao aprovar');
      setTemplates(prev => prev.map(t => t.id === approveRes.data!.id ? {
        ...t,
        is_approved: true,
        updated_at: approveRes.data!.updated_at
      } : t));
      
      // Log the approval
      await logTemplateChange(templateId, 'template_approved');

    } catch (error) {
      console.error('Error approving template:', error);
      alert('Erro ao aprovar template');
    }
  };

  const duplicateTemplate = async (template: LegalTemplate) => {
    try {
      const duplicatedData: Partial<LegalTemplateData> = {
        name: `${template.name} (Cópia)`,
        description: template.description,
        category: template.category,
        content: template.content,
        version: 1,
        is_active: true,
        is_approved: false
      };

      const dupRes = await adminAPIService.createLegalTemplate(duplicatedData);
      if (!dupRes.success || !dupRes.data) throw new Error(dupRes.error || 'Falha ao duplicar');
      setTemplates(prev => [...prev, {
        id: dupRes.data.id,
        name: dupRes.data.name,
        description: dupRes.data.description,
        category: dupRes.data.category,
        content: dupRes.data.content,
        variables: [],
        version: String(dupRes.data.version),
        is_active: dupRes.data.is_active,
        is_approved: dupRes.data.is_approved,
        approved_by: '',
        approved_at: '',
        created_by: '',
        created_at: dupRes.data.created_at,
        updated_at: dupRes.data.updated_at
      }]);
      
      // Log the duplication
      await logTemplateChange(dupRes.data.id, 'template_duplicated');

    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Erro ao duplicar template');
    }
  };

  const exportTemplate = (template: LegalTemplate) => {
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      variables: template.variables,
      version: template.version,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const templateData = JSON.parse(e.target?.result as string);
        
        const importedData: Partial<LegalTemplateData> = {
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          content: templateData.content,
          version: typeof templateData.version === 'number' ? templateData.version : 1,
          is_active: true,
          is_approved: false
        };

        const importRes = await adminAPIService.createLegalTemplate(importedData);
        if (!importRes.success || !importRes.data) throw new Error(importRes.error || 'Falha ao importar');
        setTemplates(prev => [...prev, {
          id: importRes.data.id,
          name: importRes.data.name,
          description: importRes.data.description,
          category: importRes.data.category,
          content: importRes.data.content,
          variables: [],
          version: String(importRes.data.version),
          is_active: importRes.data.is_active,
          is_approved: importRes.data.is_approved,
          approved_by: '',
          approved_at: '',
          created_by: '',
          created_at: importRes.data.created_at,
          updated_at: importRes.data.updated_at
        }]);
        
        // Log the import
        await logTemplateChange(importRes.data.id, 'template_imported');

        alert('Template importado com sucesso!');

      } catch (error) {
        console.error('Error importing template:', error);
        alert('Erro ao importar template');
      }
    };
    reader.readAsText(file);
  };

  const logTemplateChange = async (templateId: string, action: string) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: 'current-user-id', // This would come from auth context
        action: action,
        resource_type: 'legal_template',
        resource_id: templateId,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging template change:', error);
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      content: '',
      variables: [],
      version: '1.0.0'
    });
  };

  const startEditing = (template: LegalTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      variables: template.variables.map(v => ({
        name: v,
        description: '',
        type: 'text' as const,
        required: false
      })),
      version: template.version
    });
    setShowModal(true);
  };

  const getFilteredTemplates = () => {
    return templates.filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const getStatusIcon = (template: LegalTemplate) => {
    if (!template.is_active) return <XCircle className="w-4 h-4 text-red-500" />;
    if (template.is_approved) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusText = (template: LegalTemplate) => {
    if (!template.is_active) return 'Inativo';
    if (template.is_approved) return 'Aprovado';
    return 'Pendente';
  };

  const getStatusColor = (template: LegalTemplate) => {
    if (!template.is_active) return 'text-red-600 bg-red-100';
    if (template.is_approved) return 'text-green-600 bg-green-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lexiom-primary"></div>
      </div>
    );
  }

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-soehne font-bold text-lexiom-text">
            Gerenciamento de Templates Legais
          </h1>
          <p className="text-gray-600 font-inter mt-1">
            Crie, edite e gerencie templates jurídicos para uso no sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-4 py-2 bg-lexiom-secondary text-white rounded-lg hover:bg-lexiom-secondary/90 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              onChange={importTemplate}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Template</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card title="Filtros" variant="standard">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
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
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => (
          <Card
            key={template.id}
            title={template.name}
            variant="standard"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(template)}
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(template)}`}>
                    {getStatusText(template)}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{template.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Categoria:</span>
                <span className="font-medium">{template.category}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Versão:</span>
                <span className="font-medium">{template.version}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Variáveis:</span>
                <span className="font-medium">{template.variables.length}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Criado em:</span>
                <span className="font-medium">
                  {new Date(template.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEditing(template)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateTemplate(template)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportTemplate(template)}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Exportar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  {!template.is_approved && (
                    <button
                      onClick={() => approveTemplate(template.id)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Aprovar
                    </button>
                  )}
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Template
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                    placeholder="Ex: Contrato de Prestação de Serviços"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  rows={2}
                  placeholder="Descreva o propósito deste template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo do Template
                </label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary font-mono text-sm"
                  placeholder="Digite o conteúdo do template aqui... Use {variavel} para variáveis."
                />
                <div className="mt-1 text-xs text-gray-500">
                  Use {'{variavel}'} para variáveis. Ex: {'{cliente_nome}'}, {'{data_contrato}'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Versão
                </label>
                <input
                  type="text"
                  value={templateForm.version}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  placeholder="1.0.0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingTemplate ? updateTemplate : createTemplate}
                className="px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
              >
                {editingTemplate ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Visualizar Template: {previewTemplate.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                <p className="text-gray-600">{previewTemplate.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Categoria</h4>
                <p className="text-gray-600">{previewTemplate.category}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Versão</h4>
                <p className="text-gray-600">{previewTemplate.version}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Variáveis</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.variables.map((variable, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Conteúdo</h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{previewTemplate.content}</pre>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => exportTemplate(previewTemplate)}
                className="flex items-center space-x-2 px-4 py-2 bg-lexiom-secondary text-white rounded-lg hover:bg-lexiom-secondary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
