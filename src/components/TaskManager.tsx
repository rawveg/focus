import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Check, X, Edit3, Trash2, Clock } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
}

interface TaskManagerProps {
  currentTask: Task | null;
  onTaskSelect: (task: Task | null) => void;
  onTaskComplete: () => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ 
  currentTask, 
  onTaskSelect, 
  onTaskComplete 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    estimatedPomodoros: 1
  });

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('pomodoro-tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      estimatedPomodoros: newTask.estimatedPomodoros,
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: Date.now()
    };

    setTasks(prev => [task, ...prev]);
    setNewTask({ title: '', description: '', estimatedPomodoros: 1 });
    setShowAddForm(false);
    showSuccess('Task added successfully!');
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (currentTask?.id === taskId) {
      onTaskSelect(null);
    }
    showSuccess('Task deleted');
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, isCompleted: true, completedAt: Date.now() }
        : task
    ));
    if (currentTask?.id === taskId) {
      onTaskSelect(null);
    }
    showSuccess('Task completed! 🎉');
  };

  const incrementPomodoro = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
        : task
    ));
  };

  // Auto-increment pomodoro for current task when session completes
  useEffect(() => {
    if (currentTask) {
      incrementPomodoro(currentTask.id);
    }
  }, [onTaskComplete]);

  const activeTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);

  return (
    <div className="space-y-6">
      {/* Current Task Display */}
      {currentTask && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-blue-900">Current Task</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTaskSelect(null)}
                className="text-blue-700 hover:text-blue-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-medium text-blue-900 mb-2">{currentTask.title}</h3>
            {currentTask.description && (
              <p className="text-sm text-blue-700 mb-3">{currentTask.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-blue-600">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {currentTask.completedPomodoros}/{currentTask.estimatedPomodoros} pomodoros
              </span>
              <div className="flex-1 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (currentTask.completedPomodoros / currentTask.estimatedPomodoros) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Pomodoros
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={newTask.estimatedPomodoros}
                onChange={(e) => setNewTask(prev => ({ 
                  ...prev, 
                  estimatedPomodoros: parseInt(e.target.value) || 1 
                }))}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={addTask} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tasks</CardTitle>
            {!showAddForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeTasks.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No tasks yet. Add one to get started!</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {activeTasks.map(task => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  currentTask?.id === task.id 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
                      <div className="ml-3 flex-1 max-w-24 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (task.completedPomodoros / task.estimatedPomodoros) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {currentTask?.id !== task.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTaskSelect(task)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Select
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => completeTask(task.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-4">
                Completed Tasks ({completedTasks.length})
              </h4>
              <div className="space-y-2">
                {completedTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-green-50 border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-900 line-through">
                          {task.title}
                        </span>
                      </div>
                      <span className="text-xs text-green-600">
                        {task.completedPomodoros} pomodoros
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;