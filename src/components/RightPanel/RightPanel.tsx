import React from 'react';
import { Sparkles, Mic, FileText, Search, Zap, Bot } from 'lucide-react';
import { Card } from '../Card/Card';

interface RightPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

interface AIShortcut {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ 
  isVisible = true, 
  onClose 
}) => {
  if (!isVisible) return null;

  const aiShortcuts: AIShortcut[] = [
    {
      id: 'legal-research',
      title: 'Pesquisa Jurídica',
      description: 'Buscar jurisprudência e legislação',
      icon: Search,
      color: 'text-blue-600',
      action: () => console.log('Pesquisa jurídica'),
    },
    {
      id: 'document-analysis',
      title: 'Análise de Documentos',
      description: 'Analisar contratos e petições',
      icon: FileText,
      color: 'text-green-600',
      action: () => console.log('Análise de documentos'),
    },
    {
      id: 'case-strategy',
      title: 'Estratégia de Caso',
      description: 'Sugestões de estratégia processual',
      icon: Zap,
      color: 'text-yellow-600',
      action: () => console.log('Estratégia de caso'),
    },
    {
      id: 'legal-chat',
      title: 'Assistente Jurídico',
      description: 'Converse com IA sobre o caso',
      icon: Bot,
      color: 'text-purple-600',
      action: () => console.log('Assistente jurídico'),
    },
  ];

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-lexiom-primary to-lexiom-gold rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-soehne font-semibold text-lexiom-text">IA Jurídica</h2>
              <p className="text-xs text-gray-500 font-inter">Assistente inteligente</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* AI Shortcuts */}
      <div className="flex-1 p-6 space-y-4">
        <h3 className="font-inter font-semibold text-gray-900 mb-4">Ferramentas de IA</h3>
        
        {aiShortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.id}
              onClick={shortcut.action}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${shortcut.color} bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition-all`}>
                  <Icon className={`w-4 h-4 ${shortcut.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-inter font-medium text-gray-900 text-sm">
                    {shortcut.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 font-inter">
                    {shortcut.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Voice Assistant */}
      <div className="p-6 border-t border-gray-200">
        <Card
          title="Assistente de Voz"
          description="Use comandos de voz para navegação"
          variant="minimal"
        >
          <div className="flex items-center justify-center py-4">
            <button className="w-16 h-16 bg-gradient-to-r from-lexiom-primary to-lexiom-gold rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 group">
              <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 font-inter">
            Clique para ativar o assistente de voz
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-t border-gray-200">
        <h3 className="font-inter font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors font-inter text-sm">
            Nova Petição
          </button>
          <button className="w-full px-4 py-2 bg-white border border-lexiom-primary text-lexiom-primary rounded-lg hover:bg-lexiom-primary/5 transition-colors font-inter text-sm">
            Agendar Audiência
          </button>
        </div>
      </div>
    </aside>
  );
};