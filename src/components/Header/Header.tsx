import React, { useState } from 'react';
import { Search, Bell, User, ChevronDown, Scale, FileText, Users, Calendar, Columns } from 'lucide-react';

interface HeaderProps {
  onModuleChange?: (module: string) => void;
  currentModule?: string;
}

const modules = [
  { id: 'processos', name: 'Processos', icon: Scale },
  { id: 'documentos', name: 'Documentos', icon: FileText },
  { id: 'clientes', name: 'Clientes', icon: Users },
  { id: 'agenda', name: 'Agenda', icon: Calendar },
  { id: 'kanban', name: 'Kanban', icon: Columns },
];

export const Header: React.FC<HeaderProps> = ({ 
  onModuleChange, 
  currentModule = 'processos' 
}) => {
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentModuleData = modules.find(m => m.id === currentModule);
  const CurrentIcon = currentModuleData?.icon || Scale;

  return (
    <header className="bg-lexiom-snow border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Module Selector */}
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-lexiom-primary rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-lexiom-gold" />
            </div>
            <div className="font-soehne text-2xl font-bold text-lexiom-primary">
              Lexiom
            </div>
          </div>

          {/* Module Selector */}
          <div className="relative">
            <button
              onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CurrentIcon className="w-5 h-5 text-lexiom-primary" />
              <span className="font-inter font-medium text-lexiom-text">
                {currentModuleData?.name}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isModuleDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lexiom z-50">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        onModuleChange?.(module.id);
                        setIsModuleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        currentModule === module.id ? 'bg-lexiom-gold/10' : ''
                      }`}
                    >
                      <Icon className="w-5 h-5 text-lexiom-primary" />
                      <span className="font-inter text-lexiom-text">{module.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar processos, documentos, clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary focus:border-transparent font-inter text-sm"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-lexiom-primary transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <button className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-lexiom-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="font-inter text-sm font-medium text-lexiom-text">
              Dr. Silva
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </header>
  );
};