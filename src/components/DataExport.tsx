import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, FileText, Database, Calendar, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface ExportData {
  version: string;
  exportDate: string;
  settings: any;
  tasks: any[];
  sessions: any[];
  timerState: any;
}

const DataExport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get all data from localStorage
  const getAllData = (): ExportData => {
    const settings = localStorage.getItem('pomodoro-settings');
    const tasks = localStorage.getItem('pomodoro-tasks');
    const sessions = localStorage.getItem('pomodoro-sessions');
    const timerState = localStorage.getItem('pomodoro-timer-state');
    const theme = localStorage.getItem('pomodoro-theme');

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings: settings ? JSON.parse(settings) : null,
      tasks: tasks ? JSON.parse(tasks) : [],
      sessions: sessions ? JSON.parse(sessions) : [],
      timerState: timerState ? JSON.parse(timerState) : null,
      theme: theme || 'system'
    };
  };

  // Export data as JSON file
  const exportData = (type: 'all' | 'tasks' | 'sessions' | 'settings') => {
    try {
      let data: any;
      let filename: string;

      switch (type) {
        case 'all':
          data = getAllData();
          filename = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'tasks':
          const tasks = localStorage.getItem('pomodoro-tasks');
          data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            type: 'tasks',
            tasks: tasks ? JSON.parse(tasks) : []
          };
          filename = `pomodoro-tasks-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'sessions':
          const sessions = localStorage.getItem('pomodoro-sessions');
          data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            type: 'sessions',
            sessions: sessions ? JSON.parse(sessions) : []
          };
          filename = `pomodoro-sessions-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'settings':
          const settings = localStorage.getItem('pomodoro-settings');
          const theme = localStorage.getItem('pomodoro-theme');
          data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            type: 'settings',
            settings: settings ? JSON.parse(settings) : null,
            theme: theme || 'system'
          };
          filename = `pomodoro-settings-${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`${type === 'all' ? 'Complete backup' : type} exported successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export data. Please try again.');
    }
  };

  // Import data from JSON
  const importDataFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setImportData(content);
        validateAndPreviewImport(content);
      } catch (error) {
        console.error('Failed to read file:', error);
        showError('Failed to read file. Please check the file format.');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  // Validate and preview import data
  const validateAndPreviewImport = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      
      // Basic validation
      if (!data.version || !data.exportDate) {
        throw new Error('Invalid backup file format');
      }

      setImportStatus('success');
      showSuccess('File validated successfully! Review the data below.');
    } catch (error) {
      console.error('Validation failed:', error);
      setImportStatus('error');
      showError('Invalid file format. Please select a valid Pomodoro backup file.');
    }
  };

  // Execute the import
  const executeImport = (mergeMode: boolean = false) => {
    try {
      const data = JSON.parse(importData);

      if (!mergeMode) {
        // Clear existing data
        localStorage.removeItem('pomodoro-settings');
        localStorage.removeItem('pomodoro-tasks');
        localStorage.removeItem('pomodoro-sessions');
        localStorage.removeItem('pomodoro-timer-state');
        localStorage.removeItem('pomodoro-theme');
      }

      // Import data based on type
      if (data.type) {
        // Partial import
        switch (data.type) {
          case 'tasks':
            if (data.tasks) {
              if (mergeMode) {
                const existingTasks = localStorage.getItem('pomodoro-tasks');
                const existing = existingTasks ? JSON.parse(existingTasks) : [];
                const merged = [...existing, ...data.tasks];
                localStorage.setItem('pomodoro-tasks', JSON.stringify(merged));
              } else {
                localStorage.setItem('pomodoro-tasks', JSON.stringify(data.tasks));
              }
            }
            break;
          case 'sessions':
            if (data.sessions) {
              if (mergeMode) {
                const existingSessions = localStorage.getItem('pomodoro-sessions');
                const existing = existingSessions ? JSON.parse(existingSessions) : [];
                const merged = [...existing, ...data.sessions];
                localStorage.setItem('pomodoro-sessions', JSON.stringify(merged));
              } else {
                localStorage.setItem('pomodoro-sessions', JSON.stringify(data.sessions));
              }
            }
            break;
          case 'settings':
            if (data.settings) {
              localStorage.setItem('pomodoro-settings', JSON.stringify(data.settings));
            }
            if (data.theme) {
              localStorage.setItem('pomodoro-theme', data.theme);
            }
            break;
        }
      } else {
        // Full backup import
        if (data.settings) {
          localStorage.setItem('pomodoro-settings', JSON.stringify(data.settings));
        }
        if (data.tasks) {
          if (mergeMode) {
            const existingTasks = localStorage.getItem('pomodoro-tasks');
            const existing = existingTasks ? JSON.parse(existingTasks) : [];
            const merged = [...existing, ...data.tasks];
            localStorage.setItem('pomodoro-tasks', JSON.stringify(merged));
          } else {
            localStorage.setItem('pomodoro-tasks', JSON.stringify(data.tasks));
          }
        }
        if (data.sessions) {
          if (mergeMode) {
            const existingSessions = localStorage.getItem('pomodoro-sessions');
            const existing = existingSessions ? JSON.parse(existingSessions) : [];
            const merged = [...existing, ...data.sessions];
            localStorage.setItem('pomodoro-sessions', JSON.stringify(merged));
          } else {
            localStorage.setItem('pomodoro-sessions', JSON.stringify(data.sessions));
          }
        }
        if (data.theme) {
          localStorage.setItem('pomodoro-theme', data.theme);
        }
        // Note: We don't import timer state as it's session-specific
      }

      showSuccess(`Data ${mergeMode ? 'merged' : 'imported'} successfully! Please refresh the page to see changes.`);
      setIsOpen(false);
      setImportData('');
      setImportStatus('idle');
      
      // Suggest page refresh
      setTimeout(() => {
        if (window.confirm('Would you like to refresh the page to apply the imported data?')) {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error('Import failed:', error);
      showError('Failed to import data. Please check the file format.');
    }
  };

  // Get data statistics
  const getDataStats = () => {
    const tasks = localStorage.getItem('pomodoro-tasks');
    const sessions = localStorage.getItem('pomodoro-sessions');
    
    const taskCount = tasks ? JSON.parse(tasks).length : 0;
    const sessionCount = sessions ? JSON.parse(sessions).length : 0;
    const completedTasks = tasks ? JSON.parse(tasks).filter((t: any) => t.isCompleted).length : 0;
    
    return { taskCount, sessionCount, completedTasks };
  };

  const stats = getDataStats();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Database className="h-4 w-4" />
          <span>Backup & Restore</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Backup & Restore Data</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            {/* Data Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Data Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.taskCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedTasks}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.sessionCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Options</h3>
              
              <div className="grid gap-3">
                <Button
                  onClick={() => exportData('all')}
                  className="flex items-center justify-between p-4 h-auto bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Complete Backup</div>
                      <div className="text-sm opacity-75">All settings, tasks, and session history</div>
                    </div>
                  </div>
                  <FileText className="h-4 w-4" />
                </Button>

                <Button
                  onClick={() => exportData('tasks')}
                  className="flex items-center justify-between p-4 h-auto bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Tasks Only</div>
                      <div className="text-sm opacity-75">Export your task list and progress</div>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                    {stats.taskCount} tasks
                  </span>
                </Button>

                <Button
                  onClick={() => exportData('sessions')}
                  className="flex items-center justify-between p-4 h-auto bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Session History</div>
                      <div className="text-sm opacity-75">Export your productivity statistics</div>
                    </div>
                  </div>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">
                    {stats.sessionCount} sessions
                  </span>
                </Button>

                <Button
                  onClick={() => exportData('settings')}
                  className="flex items-center justify-between p-4 h-auto bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Settings Only</div>
                      <div className="text-sm opacity-75">Export timer settings and preferences</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importDataFromFile(file);
                    }
                  }}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Click to select a backup file or drag and drop
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Supports .json files exported from this app
                  </div>
                </label>
              </div>

              {/* Import Status */}
              {importStatus !== 'idle' && (
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                  importStatus === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {importStatus === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="text-sm">
                    {importStatus === 'success' 
                      ? 'File validated successfully!' 
                      : 'Invalid file format or corrupted data.'}
                  </span>
                </div>
              )}

              {/* Import Preview */}
              {importData && importStatus === 'success' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Import Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Warning:</strong> Importing will replace your current data. 
                        Make sure to export your current data first if you want to keep it.
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => executeImport(false)}
                          className="flex-1"
                          variant="destructive"
                        >
                          Replace All Data
                        </Button>
                        <Button
                          onClick={() => executeImport(true)}
                          className="flex-1"
                          variant="outline"
                        >
                          Merge with Existing
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DataExport;