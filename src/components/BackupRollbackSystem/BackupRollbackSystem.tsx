import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../Card/Card';
import { 
  Database, 
  Download, 
  RotateCcw, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Trash2
} from 'lucide-react';

interface BackupRecord {
  id: string;
  name: string;
  description: string;
  type: 'full' | 'partial' | 'config';
  size_mb: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_by: string;
  created_at: string;
  completed_at: string;
  checksum: string;
  tables_included: string[];
  download_url?: string;
}

interface RestoreJob {
  id: string;
  backup_id: string;
  backup_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string;
  error_message?: string;
  restored_by: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  description: string;
  type: 'full' | 'partial';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  is_active: boolean;
  retention_days: number;
  tables_included: string[];
  created_at: string;
  updated_at: string;
}

export const BackupRollbackSystem: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'backups' | 'restore' | 'schedules'>('backups');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [backupForm, setBackupForm] = useState({
    name: '',
    description: '',
    type: 'full' as 'full' | 'partial' | 'config',
    tables: [] as string[]
  });
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    type: 'full' as 'full' | 'partial',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '02:00',
    day_of_week: 0,
    day_of_month: 1,
    retention_days: 30,
    tables: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load backups
      const { data: backupsData, error: backupsError } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (backupsError) throw backupsError;
      setBackups(backupsData || []);

      // Load restore jobs
      const { data: restoreData, error: restoreError } = await supabase
        .from('restore_jobs')
        .select('*')
        .order('started_at', { ascending: false });

      if (restoreError) throw restoreError;
      setRestoreJobs(restoreData || []);

      // Load schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('backup_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

    } catch (error) {
      console.error('Error loading backup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreatingBackup(true);
      
      const backupData = {
        name: backupForm.name,
        description: backupForm.description,
        type: backupForm.type,
        status: 'running',
        size_mb: 0,
        created_by: 'current-user-id', // This would come from auth context
        created_at: new Date().toISOString(),
        tables_included: backupForm.tables
      };

      const { data, error } = await supabase
        .from('system_backups')
        .insert([backupData])
        .select()
        .single();

      if (error) throw error;

      // Simulate backup creation (in a real system, this would trigger the actual backup process)
      setTimeout(async () => {
        const size = Math.floor(Math.random() * 100) + 10; // Random size between 10-110 MB
        const checksum = Math.random().toString(36).substring(2, 15);
        
        const { error: updateError } = await supabase
          .from('system_backups')
          .update({
            status: 'completed',
            size_mb: size,
            checksum: checksum,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (!updateError) {
          loadData(); // Refresh data
        }
      }, 3000); // Simulate 3 second backup process

      setShowCreateModal(false);
      resetBackupForm();
      
      // Log the backup creation
      await logBackupEvent(data.id, 'backup_created');

    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Erro ao criar backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Tem certeza que deseja restaurar este backup? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setRestoringBackup(backupId);
      
      const backup = backups.find(b => b.id === backupId);
      if (!backup) return;

      const restoreData = {
        backup_id: backupId,
        backup_name: backup.name,
        status: 'running',
        restored_by: 'current-user-id', // This would come from auth context
        started_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('restore_jobs')
        .insert([restoreData])
        .select()
        .single();

      if (error) throw error;

      // Simulate restore process (in a real system, this would trigger the actual restore)
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('restore_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (!updateError) {
          loadData(); // Refresh data
        }
      }, 5000); // Simulate 5 second restore process

      // Log the restore operation
      await logBackupEvent(backupId, 'backup_restored');

    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Erro ao restaurar backup');
    } finally {
      setRestoringBackup(null);
    }
  };

  const createSchedule = async () => {
    try {
      const scheduleData = {
        name: scheduleForm.name,
        description: scheduleForm.description,
        type: scheduleForm.type,
        frequency: scheduleForm.frequency,
        time: scheduleForm.time,
        day_of_week: scheduleForm.frequency === 'weekly' ? scheduleForm.day_of_week : null,
        day_of_month: scheduleForm.frequency === 'monthly' ? scheduleForm.day_of_month : null,
        is_active: true,
        retention_days: scheduleForm.retention_days,
        tables_included: scheduleForm.tables,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('backup_schedules')
        .insert([scheduleData])
        .select()
        .single();

      if (error) throw error;

      setSchedules(prev => [...prev, data]);
      setShowScheduleModal(false);
      resetScheduleForm();
      
      // Log the schedule creation
      await logBackupEvent(data.id, 'schedule_created');

    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Erro ao criar agendamento');
    }
  };

  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('backup_schedules')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;

      setSchedules(prev => prev.map(s => 
        s.id === scheduleId ? { ...s, is_active: !isActive } : s
      ));
      
      // Log the schedule toggle
      await logBackupEvent(scheduleId, 'schedule_toggled');

    } catch (error) {
      console.error('Error toggling schedule:', error);
      alert('Erro ao alterar status do agendamento');
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este backup?')) return;

    try {
      const { error } = await supabase
        .from('system_backups')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      setBackups(prev => prev.filter(b => b.id !== backupId));
      
      // Log the backup deletion
      await logBackupEvent(backupId, 'backup_deleted');

    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Erro ao excluir backup');
    }
  };

  const logBackupEvent = async (resourceId: string, action: string) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: 'current-user-id', // This would come from auth context
        action: action,
        resource_type: 'system_backup',
        resource_id: resourceId,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging backup event:', error);
    }
  };

  const resetBackupForm = () => {
    setBackupForm({
      name: '',
      description: '',
      type: 'full',
      tables: []
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      name: '',
      description: '',
      type: 'full',
      frequency: 'daily',
      time: '02:00',
      day_of_week: 0,
      day_of_month: 1,
      retention_days: 30,
      tables: []
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) return '< 1 MB';
    if (sizeInMB < 1024) return `${sizeInMB.toFixed(1)} MB`;
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
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
            Sistema de Backup e Restauração
          </h1>
          <p className="text-gray-600 font-inter mt-1">
            Gerencie backups do sistema, restaurações e agendamentos automáticos
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>Novo Backup</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'backups', label: 'Backups', icon: Database },
            { id: 'restore', label: 'Restaurações', icon: RotateCcw },
            { id: 'schedules', label: 'Agendamentos', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'backups' | 'restore' | 'schedules')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-lexiom-primary text-lexiom-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Backups ({backups.length})
            </h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-lexiom-secondary text-white rounded-lg hover:bg-lexiom-secondary/90 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Backup</span>
            </button>
          </div>

          <div className="grid gap-4">
            {backups.map(backup => (
              <Card
                key={backup.id}
                title={backup.name}
                variant="standard"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(backup.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(backup.status)}`}>
                        {backup.status === 'running' ? 'Em andamento' : 
                         backup.status === 'completed' ? 'Concluído' : 
                         backup.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{backup.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <div className="font-medium capitalize">{backup.type}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Tamanho:</span>
                      <div className="font-medium">{formatFileSize(backup.size_mb)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Criado em:</span>
                      <div className="font-medium">
                        {new Date(backup.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {backup.completed_at && (
                      <div>
                        <span className="text-gray-500">Concluído em:</span>
                        <div className="font-medium">
                          {new Date(backup.completed_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    )}
                  </div>

                  {backup.tables_included.length > 0 && (
                    <div>
                      <span className="text-gray-500 text-sm">Tabelas incluídas:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {backup.tables_included.map((table, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Checksum: {backup.checksum?.substring(0, 8)}...
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <>
                          <button
                            onClick={() => restoreBackup(backup.id)}
                            disabled={restoringBackup === backup.id}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {restoringBackup === backup.id ? 'Restaurando...' : 'Restaurar'}
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteBackup(backup.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Restore Tab */}
      {activeTab === 'restore' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Histórico de Restaurações ({restoreJobs.length})
          </h2>

          <div className="grid gap-4">
            {restoreJobs.map(job => (
              <Card
                key={job.id}
                title={job.backup_name}
                variant="standard"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Iniciado em:</span>
                      <div className="font-medium">
                        {new Date(job.started_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {job.completed_at && (
                      <div>
                        <span className="text-gray-500">Concluído em:</span>
                        <div className="font-medium">
                          {new Date(job.completed_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    )}
                  </div>

                  {job.error_message && (
                    <div>
                      <span className="text-gray-500 text-sm">Erro:</span>
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {job.error_message}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Agendamentos de Backup ({schedules.length})
          </h2>

          <div className="grid gap-4">
            {schedules.map(schedule => (
              <Card
                key={schedule.id}
                title={schedule.name}
                variant="standard"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <button
                      onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        schedule.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {schedule.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">{schedule.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Frequência:</span>
                      <div className="font-medium capitalize">{schedule.frequency}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Horário:</span>
                      <div className="font-medium">{schedule.time}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <div className="font-medium capitalize">{schedule.type}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Retenção:</span>
                      <div className="font-medium">{schedule.retention_days} dias</div>
                    </div>
                  </div>

                  {schedule.tables_included.length > 0 && (
                    <div>
                      <span className="text-gray-500 text-sm">Tabelas:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {schedule.tables_included.map((table, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar Novo Backup
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Backup
                </label>
                <input
                  type="text"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  placeholder="Ex: Backup Completo - Janeiro 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={backupForm.description}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  rows={3}
                  placeholder="Descreva o propósito deste backup..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Backup
                </label>
                <select
                  value={backupForm.type}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, type: e.target.value as 'full' | 'partial' | 'config' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                >
                  <option value="full">Backup Completo</option>
                  <option value="partial">Backup Parcial</option>
                  <option value="config">Apenas Configurações</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetBackupForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createBackup}
                disabled={creatingBackup}
                className="px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors disabled:opacity-50"
              >
                {creatingBackup ? 'Criando...' : 'Criar Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar Agendamento de Backup
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Agendamento
                </label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  placeholder="Ex: Backup Diário Automático"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  rows={2}
                  placeholder="Descreva o agendamento..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequência
                  </label>
                  <select
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dias de Retenção
                </label>
                <input
                  type="number"
                  value={scheduleForm.retention_days}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, retention_days: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary"
                  min="1"
                  max="365"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  resetScheduleForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createSchedule}
                className="px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 transition-colors"
              >
                Criar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
