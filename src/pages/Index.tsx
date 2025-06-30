import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PomodoroTimer from "@/components/PomodoroTimer";
import TaskManager from "@/components/TaskManager";
import Statistics from "@/components/Statistics";
import Achievements from "@/components/Achievements";
import Calendar from "@/components/Calendar";
import ThemeToggle from "@/components/ThemeToggle";
import DataExport from "@/components/DataExport";
import { Timer, CheckSquare, BarChart3, Trophy, Calendar as CalendarIcon, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface ScheduledSession {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  duration: number;
  type: 'work' | 'break' | 'longBreak';
  taskId?: string;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
}

const Index = () => {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('timer');

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

  // Update tasks when they change
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTasks = localStorage.getItem('pomodoro-tasks');
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (error) {
          console.error('Failed to load tasks:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when tasks are updated
    const handleTaskUpdate = () => {
      handleStorageChange();
    };

    window.addEventListener('tasksUpdated', handleTaskUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tasksUpdated', handleTaskUpdate);
    };
  }, []);

  const handleTaskComplete = () => {
    setCompletedSessions(prev => prev + 1);
  };

  const handleStartScheduledSession = (session: ScheduledSession) => {
    // If session is linked to a task, set it as current task
    if (session.taskId) {
      const task = tasks.find(t => t.id === session.taskId);
      if (task) {
        setCurrentTask(task);
      }
    }

    // Switch to timer tab
    setActiveTab('timer');
    
    // Show success message
    showSuccess(`Starting scheduled session: ${session.title}`);
    
    // You could also automatically start the timer here if desired
    // by passing additional props to PomodoroTimer
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-8 px-4 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        {/* Header with data export, github link, and theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <DataExport />
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <a
                href="https://github.com/rawveg/focus"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
              >
                <Github className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">
            Focus
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
            Stay productive with the Pomodoro Technique. Work in focused intervals, take regular breaks, and achieve more.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20">
              <TabsTrigger value="timer" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <Timer className="h-4 w-4" />
                <span>Timer</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <CheckSquare className="h-4 w-4" />
                <span>Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <Trophy className="h-4 w-4" />
                <span>Goals</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <BarChart3 className="h-4 w-4" />
                <span>Statistics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timer" className="space-y-8">
              <div className="flex justify-center">
                <PomodoroTimer 
                  currentTask={currentTask}
                  onTaskComplete={handleTaskComplete}
                />
              </div>
              
              {/* How it works section */}
              <div className="mt-20 max-w-4xl mx-auto">
                <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-12 text-center tracking-tight">
                  How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200 shadow-lg">
                      <span className="text-2xl font-light text-white">1</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Focus</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Work with complete concentration for 25 minutes on a single task
                    </p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200 shadow-lg">
                      <span className="text-2xl font-light text-white">2</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Break</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Take a 5-minute break to rest, stretch, and recharge your mind
                    </p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-purple-500 dark:bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200 shadow-lg">
                      <span className="text-2xl font-light text-white">3</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Repeat</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      After 4 focus sessions, enjoy a longer 15-minute break
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <TaskManager 
                currentTask={currentTask}
                onTaskSelect={setCurrentTask}
                onTaskComplete={handleTaskComplete}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <Calendar 
                tasks={tasks}
                onStartSession={handleStartScheduledSession}
              />
            </TabsContent>

            <TabsContent value="achievements">
              <Achievements />
            </TabsContent>

            <TabsContent value="stats">
              <Statistics completedSessions={completedSessions} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Licensed under the{' '}
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
              >
                GNU Affero General Public License v3.0
              </a>
              {' '}•{' '}
              <a
                href="https://github.com/rawveg/focus/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
              >
                View License
              </a>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              © {new Date().getFullYear()} Tim Green. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;