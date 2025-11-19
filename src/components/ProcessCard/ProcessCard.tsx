import React from 'react';
import { Calendar, User, AlertCircle, CheckCircle, Clock, FileText, Eye, Edit, Share2 } from 'lucide-react';
import { Card } from '../Card/Card';

export type ProcessStatus = 'active' | 'pending' | 'completed' | 'urgent';

export interface ProcessCardData {
  id: string;
  title: string;
  caseNumber: string;
  client: string;
  court: string;
  status: ProcessStatus;
  nextHearing?: string;
  responsible: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

interface ProcessCardProps {
  process: ProcessCardData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
}

const statusConfig = {
  active: {
    color: 'bg-green-100 text-green-800 border-green-200',
    headerColor: 'bg-green-500',
    icon: CheckCircle,
    label: 'Ativo',
  },
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    headerColor: 'bg-yellow-500',
    icon: Clock,
    label: 'Pendente',
  },
  completed: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    headerColor: 'bg-blue-500',
    icon: CheckCircle,
    label: 'Concluído',
  },
  urgent: {
    color: 'bg-red-100 text-red-800 border-red-200',
    headerColor: 'bg-red-500',
    icon: AlertCircle,
    label: 'Urgente',
  },
};

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-600', label: 'Baixa' },
  medium: { color: 'bg-orange-100 text-orange-600', label: 'Média' },
  high: { color: 'bg-red-100 text-red-600', label: 'Alta' },
};

export const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onView,
  onEdit,
  onShare,
}) => {
  const status = statusConfig[process.status];
  const StatusIcon = status.icon;
  const priority = process.priority ? priorityConfig[process.priority] : null;

  const cardActions = (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onView?.(process.id)}
        className="p-2 text-gray-600 hover:text-lexiom-primary hover:bg-gray-50 rounded-lg transition-colors"
        title="Visualizar"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => onEdit?.(process.id)}
        className="p-2 text-gray-600 hover:text-lexiom-primary hover:bg-gray-50 rounded-lg transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => onShare?.(process.id)}
        className="p-2 text-gray-600 hover:text-lexiom-primary hover:bg-gray-50 rounded-lg transition-colors"
        title="Compartilhar"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <Card
      title={process.title}
      description={`Processo nº ${process.caseNumber}`}
      headerColor={status.headerColor}
      actions={cardActions}
      className="hover:shadow-lexiom-lg transition-shadow duration-200"
    >
      <div className="space-y-4">
        {/* Status and Priority */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{status.label}</span>
          </div>
          {priority && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
              {priority.label} prioridade
            </span>
          )}
        </div>

        {/* Process Details */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{process.client}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{process.court}</span>
          </div>
          {process.nextHearing && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Próxima audiência: {process.nextHearing}</span>
            </div>
          )}
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Responsável: {process.responsible}</span>
          </div>
        </div>

        {/* Description */}
        {process.description && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600 line-clamp-3">
              {process.description}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Criado em: {process.createdAt}</span>
          <span>Atualizado: {process.updatedAt}</span>
        </div>
      </div>
    </Card>
  );
};