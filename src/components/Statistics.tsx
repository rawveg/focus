import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Target, TrendingUp, Award, Flame } from 'lucide-react';

interface SessionRecord {
  date: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completedAt: number;
  taskId?: string;
  taskTitle?: string;
}

interface StatisticsProps {
  completedSessions: number;
}

const Statistics: React.FC<StatisticsProps> = ({ completedSessions }) => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [streak, setStreak] = useState(0);

  // Load session history from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('pomodoro-sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Failed to load session history:', error);
      }
    }
  }, []);

  // Calculate streak
  useEffect(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const todaySessions = sessions.filter(s => 
      new Date(s.completedAt).toDateString() === today && s.type === 'work'
    );
    
    const yesterdaySessions = sessions.filter(s => 
      new Date(s.completedAt).toDateString() === yesterday && s.type === 'work'
    );

    if (todaySessions.length > 0) {
      // Count consecutive days with work sessions
      let currentStreak = 1;
      let checkDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      while (true) {
        const dayString = checkDate.toDateString();
        const daySessions = sessions.filter(s => 
          new Date(s.completedAt).toDateString() === dayString && s.type === 'work'
        );
        
        if (daySessions.length > 0) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
      
      setStreak(currentStreak);
    } else if (yesterdaySessions.length > 0) {
      setStreak(0); // Broke streak today
    }
  }, [sessions]);

  // Get today's stats
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => 
    new Date(s.completedAt).toDateString() === today
  );
  const todayWorkSessions = todaySessions.filter(s => s.type === 'work');
  const todayFocusTime = todayWorkSessions.reduce((total, s) => total + s.duration, 0);

  // Get this week's stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const thisWeekSessions = sessions.filter(s => 
    s.completedAt >= weekStart.getTime() && s.type === 'work'
  );
  const weeklyFocusTime = thisWeekSessions.reduce((total, s) => total + s.duration, 0);

  // Get this month's stats
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const thisMonthSessions = sessions.filter(s => 
    s.completedAt >= monthStart.getTime() && s.type === 'work'
  );
  const monthlyFocusTime = thisMonthSessions.reduce((total, s) => total + s.duration, 0);

  // Format time in hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get last 7 days data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toDateString();
  });

  const dailyData = last7Days.map(dateString => {
    const daySessions = sessions.filter(s => 
      new Date(s.completedAt).toDateString() === dateString && s.type === 'work'
    );
    return {
      date: dateString,
      sessions: daySessions.length,
      focusTime: daySessions.reduce((total, s) => total + s.duration, 0)
    };
  });

  const maxSessions = Math.max(...dailyData.map(d => d.sessions), 1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {todayWorkSessions.length}
            </div>
            <div className="text-sm text-gray-600">Today's Sessions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(todayFocusTime)}
            </div>
            <div className="text-sm text-gray-600">Focus Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {streak}
            </div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {sessions.filter(s => s.type === 'work').length}
            </div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="chart">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {thisWeekSessions.length}
                  </div>
                  <div className="text-sm text-gray-600">Work Sessions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatTime(weeklyFocusTime)}
                  </div>
                  <div className="text-sm text-gray-600">Focus Time</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Average: {Math.round(weeklyFocusTime / 7 / 60)} minutes per day
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {thisMonthSessions.length}
                  </div>
                  <div className="text-sm text-gray-600">Work Sessions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatTime(monthlyFocusTime)}
                  </div>
                  <div className="text-sm text-gray-600">Focus Time</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Average: {Math.round(monthlyFocusTime / 30 / 60)} minutes per day
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Last 7 Days Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyData.map((day, index) => (
                  <div key={day.date} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${(day.sessions / maxSessions) * 100}%`, minWidth: day.sessions > 0 ? '8px' : '0' }}
                        />
                        <span className="text-sm text-gray-600">
                          {day.sessions} sessions
                        </span>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {formatTime(day.focusTime)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;