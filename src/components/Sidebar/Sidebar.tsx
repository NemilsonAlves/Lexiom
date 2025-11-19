import React from 'react';
import { Scale, FileText, Users, Calendar, Columns, Settings, HelpCircle } from 'lucide-react';

interface SidebarProps {
  currentModule?: string;
  onModuleChange?: (module: string) => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

const navigationItems: NavItem[] = [
  { id: 'processos', name: 'Processos', icon: Scale, color: 'text-blue-600' },
  { id: 'documentos', name: 'Documentos', icon: FileText, color: 'text-green-600' },
  { id: 'clientes', name: 'Clientes', icon: Users, color: 'text-purple-600' },
  { id: 'agenda', name: 'Agenda', icon: Calendar, color: 'text-orange-600' },
  { id: 'kanban', name: 'Kanban', icon: Columns, color: 'text-pink-600' },
];

const utilityItems: NavItem[] = [
  { id: 'configuracoes', name: 'Configurações', icon: Settings, color: 'text-gray-600' },
  { id: 'ajuda', name: 'Ajuda', icon: HelpCircle, color: 'text-gray-600' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentModule = 'processos', 
  onModuleChange 
}) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange?.(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-lexiom-primary text-white shadow-lexiom'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-lexiom-primary'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                <span className="font-inter font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-lexiom-gold rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Utility Items */}
        <div className="space-y-2">
          {utilityItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange?.(item.id)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-lexiom-primary transition-all duration-200"
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-inter font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-lexiom-primary rounded-full flex items-center justify-center">
            <span className="text-white font-inter font-semibold text-sm">DS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-inter font-medium text-gray-900 truncate">
              Dr. Silva
            </p>
            <p className="text-xs font-inter text-gray-500 truncate">
              Advogado Senior
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};