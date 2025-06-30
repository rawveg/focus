import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Flame, 
  Clock, 
  Calendar, 
  Star, 
  Award, 
  Zap, 
  Crown,
  Medal,
  CheckCircle,
  TrendingUp,
  Coffee,
  Moon,
  Sun
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'focus' | 'consistency' | 'milestones' | 'special';
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: number;
  resetDate: number;
  icon: React.ReactNode;
}

interface SessionRecord {
  date: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completedAt: number;
  taskId?: string;
  taskTitle?: string;
}

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('pomodoro-sessions');
    const savedTasks = localStorage.getItem('pomodoro-tasks');
    const savedAchievements = localStorage.getItem('pomodoro-achievements');
    const savedGoals = localStorage.getItem('pomodoro-goals');

    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    }

    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    }

    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements));
      } catch (error) {
        console.error('Failed to load achievements:', error);
      }
    } else {
      initializeAchievements();
    }

    if (savedGoals) {
      try {
        const loadedGoals = JSON.parse(savedGoals);
        // Check if goals need to be reset
        const updatedGoals = loadedGoals.map((goal: Goal) => {
          if (shouldResetGoal(goal)) {
            return resetGoal(goal);
          }
          return goal;
        });
        setGoals(updatedGoals);
      } catch (error) {
        console.error('Failed to load goals:', error);
      }
    } else {
      initializeGoals();
    }
  }, []);

  // Initialize default achievements
  const initializeAchievements = () => {
    const defaultAchievements: Achievement[] = [
      // Focus Achievements
      {
        id: 'first-session',
        title: 'Getting Started',
        description: 'Complete your first focus session',
        icon: <Play className="h-5 w-5" />,
        category: 'focus',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common'
      },
      {
        id: 'focus-10',
        title: 'Focused Mind',
        description: 'Complete 10 focus sessions',
        icon: <Target className="h-5 w-5" />,
        category: 'focus',
        requirement: 10,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common'
      },
      {
        id: 'focus-50',
        title: 'Concentration Master',
        description: 'Complete 50 focus sessions',
        icon: <Zap className="h-5 w-5" />,
        category: 'focus',
        requirement: 50,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare'
      },
      {
        id: 'focus-100',
        title: 'Productivity Guru',
        description: 'Complete 100 focus sessions',
        icon: <Crown className="h-5 w-5" />,
        category: 'focus',
        requirement: 100,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'epic'
      },
      {
        id: 'focus-500',
        title: 'Legendary Focus',
        description: 'Complete 500 focus sessions',
        icon: <Trophy className="h-5 w-5" />,
        category: 'focus',
        requirement: 500,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'legendary'
      },

      // Consistency Achievements
      {
        id: 'streak-3',
        title: 'Building Habits',
        description: 'Maintain a 3-day streak',
        icon: <Flame className="h-5 w-5" />,
        category: 'consistency',
        requirement: 3,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common'
      },
      {
        id: 'streak-7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: <Calendar className="h-5 w-5" />,
        category: 'consistency',
        requirement: 7,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare'
      },
      {
        id: 'streak-30',
        title: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        icon: <Medal className="h-5 w-5" />,
        category: 'consistency',
        requirement: 30,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'epic'
      },
      {
        id: 'streak-100',
        title: 'Unstoppable Force',
        description: 'Maintain a 100-day streak',
        icon: <Star className="h-5 w-5" />,
        category: 'consistency',
        requirement: 100,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'legendary'
      },

      // Milestone Achievements
      {
        id: 'first-task',
        title: 'Task Creator',
        description: 'Create your first task',
        icon: <CheckCircle className="h-5 w-5" />,
        category: 'milestones',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common'
      },
      {
        id: 'complete-10-tasks',
        title: 'Task Crusher',
        description: 'Complete 10 tasks',
        icon: <Award className="h-5 w-5" />,
        category: 'milestones',
        requirement: 10,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare'
      },
      {
        id: 'focus-time-10h',
        title: 'Time Master',
        description: 'Accumulate 10 hours of focus time',
        icon: <Clock className="h-5 w-5" />,
        category: 'milestones',
        requirement: 36000, // 10 hours in seconds
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'epic'
      },

      // Special Achievements
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Complete a session before 8 AM',
        icon: <Sun className="h-5 w-5" />,
        category: 'special',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare'
      },
      {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Complete a session after 10 PM',
        icon: <Moon className="h-5 w-5" />,
        category: 'special',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare'
      },
      {
        id: 'coffee-break',
        title: 'Coffee Connoisseur',
        description: 'Take 50 short breaks',
        icon: <Coffee className="h-5 w-5" />,
        category: 'special',
        requirement: 50,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common'
      }
    ];

    setAchievements(defaultAchievements);
  };

  // Initialize default goals
  const initializeGoals = () => {
    const now = Date.now();
    const defaultGoals: Goal[] = [
      {
        id: 'daily-sessions',
        title: 'Daily Focus',
        description: 'Complete 4 focus sessions today',
        type: 'daily',
        target: 4,
        currentProgress: 0,
        isCompleted: false,
        resetDate: getNextResetDate('daily'),
        icon: <Target className="h-5 w-5" />
      },
      {
        id: 'daily-time',
        title: 'Daily Time Goal',
        description: 'Focus for 2 hours today',
        type: 'daily',
        target: 7200, // 2 hours in seconds
        currentProgress: 0,
        isCompleted: false,
        resetDate: getNextResetDate('daily'),
        icon: <Clock className="h-5 w-5" />
      },
      {
        id: 'weekly-sessions',
        title: 'Weekly Warrior',
        description: 'Complete 20 focus sessions this week',
        type: 'weekly',
        target: 20,
        currentProgress: 0,
        isCompleted: false,
        resetDate: getNextResetDate('weekly'),
        icon: <TrendingUp className="h-5 w-5" />
      },
      {
        id: 'monthly-tasks',
        title: 'Monthly Achiever',
        description: 'Complete 15 tasks this month',
        type: 'monthly',
        target: 15,
        currentProgress: 0,
        isCompleted: false,
        resetDate: getNextResetDate('monthly'),
        icon: <Trophy className="h-5 w-5" />
      }
    ];

    setGoals(defaultGoals);
  };

  // Helper functions for goal reset dates
  const getNextResetDate = (type: 'daily' | 'weekly' | 'monthly'): number => {
    const now = new Date();
    switch (type) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek.getTime();
      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth.getTime();
      default:
        return now.getTime();
    }
  };

  const shouldResetGoal = (goal: Goal): boolean => {
    return Date.now() >= goal.resetDate;
  };

  const resetGoal = (goal: Goal): Goal => {
    return {
      ...goal,
      currentProgress: 0,
      isCompleted: false,
      completedAt: undefined,
      resetDate: getNextResetDate(goal.type)
    };
  };

  // Update achievements and goals based on current data
  useEffect(() => {
    if (sessions.length > 0 || tasks.length > 0) {
      updateAchievements();
      updateGoals();
    }
  }, [sessions, tasks]);

  const updateAchievements = () => {
    const workSessions = sessions.filter(s => s.type === 'work');
    const completedTasks = tasks.filter(t => t.isCompleted);
    const totalFocusTime = workSessions.reduce((total, s) => total + s.duration, 0);
    const shortBreaks = sessions.filter(s => s.type === 'shortBreak');
    
    // Calculate streak
    const streak = calculateStreak();

    const updatedAchievements = achievements.map(achievement => {
      let newProgress = achievement.currentProgress;
      let isUnlocked = achievement.isUnlocked;

      switch (achievement.id) {
        case 'first-session':
        case 'focus-10':
        case 'focus-50':
        case 'focus-100':
        case 'focus-500':
          newProgress = workSessions.length;
          break;
        case 'streak-3':
        case 'streak-7':
        case 'streak-30':
        case 'streak-100':
          newProgress = streak;
          break;
        case 'first-task':
          newProgress = tasks.length > 0 ? 1 : 0;
          break;
        case 'complete-10-tasks':
          newProgress = completedTasks.length;
          break;
        case 'focus-time-10h':
          newProgress = totalFocusTime;
          break;
        case 'early-bird':
          newProgress = workSessions.some(s => {
            const hour = new Date(s.completedAt).getHours();
            return hour < 8;
          }) ? 1 : 0;
          break;
        case 'night-owl':
          newProgress = workSessions.some(s => {
            const hour = new Date(s.completedAt).getHours();
            return hour >= 22;
          }) ? 1 : 0;
          break;
        case 'coffee-break':
          newProgress = shortBreaks.length;
          break;
      }

      // Check if achievement should be unlocked
      if (!isUnlocked && newProgress >= achievement.requirement) {
        isUnlocked = true;
        showSuccess(`🏆 Achievement Unlocked: ${achievement.title}!`);
      }

      return {
        ...achievement,
        currentProgress: newProgress,
        isUnlocked,
        unlockedAt: isUnlocked && !achievement.isUnlocked ? Date.now() : achievement.unlockedAt
      };
    });

    setAchievements(updatedAchievements);
    localStorage.setItem('pomodoro-achievements', JSON.stringify(updatedAchievements));
  };

  const updateGoals = () => {
    const today = new Date().toDateString();
    const thisWeek = getWeekStart();
    const thisMonth = getMonthStart();

    const todaySessions = sessions.filter(s => 
      new Date(s.completedAt).toDateString() === today && s.type === 'work'
    );
    const todayFocusTime = todaySessions.reduce((total, s) => total + s.duration, 0);

    const thisWeekSessions = sessions.filter(s => 
      s.completedAt >= thisWeek.getTime() && s.type === 'work'
    );

    const thisMonthTasks = tasks.filter(t => 
      t.isCompleted && t.completedAt && t.completedAt >= thisMonth.getTime()
    );

    const updatedGoals = goals.map(goal => {
      let newProgress = goal.currentProgress;
      let isCompleted = goal.isCompleted;

      switch (goal.id) {
        case 'daily-sessions':
          newProgress = todaySessions.length;
          break;
        case 'daily-time':
          newProgress = todayFocusTime;
          break;
        case 'weekly-sessions':
          newProgress = thisWeekSessions.length;
          break;
        case 'monthly-tasks':
          newProgress = thisMonthTasks.length;
          break;
      }

      // Check if goal is completed
      if (!isCompleted && newProgress >= goal.target) {
        isCompleted = true;
        showSuccess(`🎯 Goal Completed: ${goal.title}!`);
      }

      return {
        ...goal,
        currentProgress: newProgress,
        isCompleted,
        completedAt: isCompleted && !goal.isCompleted ? Date.now() : goal.completedAt
      };
    });

    setGoals(updatedGoals);
    localStorage.setItem('pomodoro-goals', JSON.stringify(updatedGoals));
  };

  const calculateStreak = (): number => {
    const workSessions = sessions.filter(s => s.type === 'work');
    if (workSessions.length === 0) return 0;

    const today = new Date().toDateString();
    const todaySessions = workSessions.filter(s => 
      new Date(s.completedAt).toDateString() === today
    );

    if (todaySessions.length === 0) return 0;

    let streak = 1;
    let checkDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    while (true) {
      const dayString = checkDate.toDateString();
      const daySessions = workSessions.filter(s => 
        new Date(s.completedAt).toDateString() === dayString
      );

      if (daySessions.length > 0) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    return streak;
  };

  const getWeekStart = (): Date => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const getMonthStart = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'rare':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'epic':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'legendary':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);
  const completedGoals = goals.filter(g => g.isCompleted);
  const activeGoals = goals.filter(g => !g.isCompleted);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {unlockedAchievements.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Achievements</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedGoals.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Goals Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {calculateStreak()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Current Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Completion</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals">Active Goals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {activeGoals.map(goal => (
              <Card key={goal.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {goal.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {goal.title}
                        </h3>
                        <Badge variant="outline" className="capitalize">
                          {goal.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {goal.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Progress</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {goal.id.includes('time') 
                              ? `${formatTime(goal.currentProgress)} / ${formatTime(goal.target)}`
                              : `${goal.currentProgress} / ${goal.target}`
                            }
                          </span>
                        </div>
                        <Progress 
                          value={(goal.currentProgress / goal.target) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {completedGoals.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Completed Goals
                </h3>
                <div className="grid gap-3">
                  {completedGoals.map(goal => (
                    <Card key={goal.id} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div className="flex-1">
                            <h4 className="font-medium text-green-900 dark:text-green-100">
                              {goal.title}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Completed {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                            ✓ Done
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Unlocked Achievements ({unlockedAchievements.length})
              </h3>
              <div className="grid gap-4">
                {unlockedAchievements.map(achievement => (
                  <Card key={achievement.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${getRarityColor(achievement.rarity)}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {achievement.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getRarityColor(achievement.rarity)}>
                                {achievement.rarity}
                              </Badge>
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Unlocked {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Locked Achievements ({lockedAchievements.length})
              </h3>
              <div className="grid gap-4">
                {lockedAchievements.map(achievement => (
                  <Card key={achievement.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {achievement.title}
                            </h3>
                            <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {achievement.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-300">Progress</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {achievement.id.includes('time') 
                                  ? `${formatTime(achievement.currentProgress)} / ${formatTime(achievement.requirement)}`
                                  : `${achievement.currentProgress} / ${achievement.requirement}`
                                }
                              </span>
                            </div>
                            <Progress 
                              value={(achievement.currentProgress / achievement.requirement) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Add missing Play import
import { Play } from 'lucide-react';

export default Achievements;