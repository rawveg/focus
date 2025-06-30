import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Target,
  CheckCircle
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface ScheduledSession {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  duration: number; // in minutes
  type: 'work' | 'break' | 'longBreak';
  taskId?: string;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
}

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

interface CalendarProps {
  tasks: Task[];
  onStartSession: (session: ScheduledSession) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, onStartSession }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduledSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 25,
    type: 'work' as 'work' | 'break' | 'longBreak',
    taskId: ''
  });

  // Load scheduled sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('pomodoro-scheduled-sessions');
    if (savedSessions) {
      try {
        setScheduledSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Failed to load scheduled sessions:', error);
      }
    }
  }, []);

  // Save scheduled sessions to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-scheduled-sessions', JSON.stringify(scheduledSessions));
  }, [scheduledSessions]);

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date: string) => {
    return scheduledSessions.filter(session => session.date === date);
  };

  // Add or update session
  const saveSession = () => {
    if (!newSession.title.trim() || !selectedDate || !newSession.startTime) {
      showError('Please fill in all required fields');
      return;
    }

    const session: ScheduledSession = {
      id: editingSession?.id || Date.now().toString(),
      title: newSession.title.trim(),
      description: newSession.description.trim(),
      date: selectedDate,
      startTime: newSession.startTime,
      duration: newSession.duration,
      type: newSession.type,
      taskId: newSession.taskId || undefined,
      isCompleted: editingSession?.isCompleted || false,
      completedAt: editingSession?.completedAt,
      createdAt: editingSession?.createdAt || Date.now()
    };

    if (editingSession) {
      setScheduledSessions(prev => prev.map(s => s.id === session.id ? session : s));
      showSuccess('Session updated successfully!');
    } else {
      setScheduledSessions(prev => [...prev, session]);
      showSuccess('Session scheduled successfully!');
    }

    resetForm();
  };

  // Delete session
  const deleteSession = (sessionId: string) => {
    setScheduledSessions(prev => prev.filter(s => s.id !== sessionId));
    showSuccess('Session deleted');
  };

  // Mark session as completed
  const completeSession = (sessionId: string) => {
    setScheduledSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, isCompleted: true, completedAt: Date.now() }
        : s
    ));
    showSuccess('Session marked as completed!');
  };

  // Reset form
  const resetForm = () => {
    setNewSession({
      title: '',
      description: '',
      startTime: '',
      duration: 25,
      type: 'work',
      taskId: ''
    });
    setSelectedDate('');
    setEditingSession(null);
    setShowAddDialog(false);
  };

  // Open edit dialog
  const openEditDialog = (session: ScheduledSession) => {
    setEditingSession(session);
    setNewSession({
      title: session.title,
      description: session.description || '',
      startTime: session.startTime,
      duration: session.duration,
      type: session.type,
      taskId: session.taskId || ''
    });
    setSelectedDate(session.date);
    setShowAddDialog(true);
  };

  // Open add dialog for specific date
  const openAddDialog = (date: string) => {
    setSelectedDate(date);
    setShowAddDialog(true);
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Get session type color
  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'break':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'longBreak':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  // Get task by ID
  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const calendarDays = getCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Focus Calendar
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousMonth}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white min-w-[140px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextMonth}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => openAddDialog(formatDate(new Date()))}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Session</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const dateString = formatDate(date);
              const sessionsForDate = getSessionsForDate(dateString);
              const isCurrentMonthDate = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !isCurrentMonthDate ? 'opacity-40' : ''
                  } ${
                    isTodayDate ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
                  }`}
                  onClick={() => openAddDialog(dateString)}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Sessions for this date */}
                  <div className="space-y-1">
                    {sessionsForDate.slice(0, 3).map(session => (
                      <div
                        key={session.id}
                        className={`text-xs p-1 rounded border ${getSessionTypeColor(session.type)} ${
                          session.isCompleted ? 'opacity-60 line-through' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(session);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{session.startTime}</span>
                          {session.isCompleted && <CheckCircle className="h-3 w-3" />}
                        </div>
                        <div className="truncate">{session.title}</div>
                      </div>
                    ))}
                    {sessionsForDate.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{sessionsForDate.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const todayString = formatDate(new Date());
            const todaySessions = getSessionsForDate(todayString).sort((a, b) => 
              a.startTime.localeCompare(b.startTime)
            );

            if (todaySessions.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions scheduled for today</p>
                  <Button
                    onClick={() => openAddDialog(todayString)}
                    variant="outline"
                    className="mt-4"
                  >
                    Schedule Your First Session
                  </Button>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {todaySessions.map(session => {
                  const task = session.taskId ? getTaskById(session.taskId) : null;
                  
                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border ${getSessionTypeColor(session.type)} ${
                        session.isCompleted ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{session.startTime}</span>
                            <Badge variant="outline" className="text-xs">
                              {session.duration}m
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {session.type === 'longBreak' ? 'Long Break' : session.type}
                            </Badge>
                            {session.isCompleted && (
                              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className={`font-semibold mb-1 ${
                            session.isCompleted ? 'line-through' : ''
                          }`}>
                            {session.title}
                          </h3>
                          
                          {session.description && (
                            <p className="text-sm opacity-75 mb-2">{session.description}</p>
                          )}
                          
                          {task && (
                            <div className="flex items-center space-x-2 text-sm opacity-75">
                              <Target className="h-3 w-3" />
                              <span>Task: {task.title}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!session.isCompleted && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onStartSession(session)}
                                className="flex items-center space-x-1"
                              >
                                <Play className="h-3 w-3" />
                                <span>Start</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => completeSession(session.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(session)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSession(session.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Add/Edit Session Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Edit Session' : 'Schedule New Session'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session Title *
              </label>
              <Input
                placeholder="e.g., Morning Focus Session"
                value={newSession.title}
                onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Optional description..."
                value={newSession.description}
                onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time *
                </label>
                <Input
                  type="time"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={newSession.duration}
                  onChange={(e) => setNewSession(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || 25 
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Type
                </label>
                <Select
                  value={newSession.type}
                  onValueChange={(value: 'work' | 'break' | 'longBreak') => 
                    setNewSession(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Focus Work</SelectItem>
                    <SelectItem value="break">Short Break</SelectItem>
                    <SelectItem value="longBreak">Long Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newSession.type === 'work' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link to Task (Optional)
                </label>
                <Select
                  value={newSession.taskId}
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, taskId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No task</SelectItem>
                    {tasks.filter(task => !task.isCompleted).map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button onClick={saveSession} className="flex-1">
                {editingSession ? 'Update Session' : 'Schedule Session'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;