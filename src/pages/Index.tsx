import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PomodoroTimer from "@/components/PomodoroTimer";
import TaskManager from "@/components/TaskManager";
import Statistics from "@/components/Statistics";
import ThemeToggle from "@/components/ThemeToggle";
import { Timer, CheckSquare, BarChart3 } from 'lucide-react';

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

const Index = () => {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);

  const handleTaskComplete = () => {
    setCompletedSessions(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-8 px-4 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        {/* Header with theme toggle */}
        <div className="flex justify-end mb-8">
          <ThemeToggle />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">
            Focus
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
            Stay productive with the Pomodoro Technique. Work in focused intervals, take regular breaks, and achieve more.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="timer" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20">
              <TabsTrigger value="timer" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <Timer className="h-4 w-4" />
                <span>Timer</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <CheckSquare className="h-4 w-4" />
                <span>Tasks</span>
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

            <TabsContent value="stats">
              <Statistics completedSessions={completedSessions} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;