import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

type TimerState = 'work' | 'shortBreak' | 'longBreak';

const PomodoroTimer = () => {
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25 * 60, // 25 minutes in seconds
    shortBreakDuration: 5 * 60, // 5 minutes in seconds
    longBreakDuration: 15 * 60, // 15 minutes in seconds
    sessionsUntilLongBreak: 4
  });

  const [currentState, setCurrentState] = useState<TimerState>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current session duration based on state
  const getCurrentDuration = () => {
    switch (currentState) {
      case 'work':
        return settings.workDuration;
      case 'shortBreak':
        return settings.shortBreakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
      default:
        return settings.workDuration;
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    const total = getCurrentDuration();
    return ((total - timeLeft) / total) * 100;
  };

  // Start/pause timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset current session
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getCurrentDuration());
  };

  // Move to next session
  const nextSession = () => {
    if (currentState === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setCurrentState('longBreak');
        setTimeLeft(settings.longBreakDuration);
        showSuccess('Great work! Time for a long break!');
      } else {
        setCurrentState('shortBreak');
        setTimeLeft(settings.shortBreakDuration);
        showSuccess('Work session complete! Take a short break.');
      }
    } else {
      setCurrentState('work');
      setTimeLeft(settings.workDuration);
      showSuccess('Break over! Ready to focus?');
    }
    setIsRunning(false);
  };

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            nextSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Update timer when settings change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getCurrentDuration());
    }
  }, [settings, currentState]);

  const getStateLabel = () => {
    switch (currentState) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus Time';
    }
  };

  const getStateColor = () => {
    switch (currentState) {
      case 'work':
        return 'text-red-600';
      case 'shortBreak':
        return 'text-green-600';
      case 'longBreak':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Pomodoro Timer</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <p className={`text-lg font-medium ${getStateColor()}`}>
            {getStateLabel()}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="text-6xl font-mono font-bold">
            {formatTime(timeLeft)}
          </div>

          {/* Progress Bar */}
          <Progress value={getProgress()} className="h-2" />

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Start</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={resetTimer}
              variant="outline"
              size="lg"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Reset</span>
            </Button>
          </div>

          {/* Session Counter */}
          <div className="text-sm text-gray-600">
            <p>Completed Sessions: {completedSessions}</p>
            <p>
              Next long break in: {settings.sessionsUntilLongBreak - (completedSessions % settings.sessionsUntilLongBreak)} sessions
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentState('work');
                setTimeLeft(settings.workDuration);
                setIsRunning(false);
              }}
            >
              Work
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentState('shortBreak');
                setTimeLeft(settings.shortBreakDuration);
                setIsRunning(false);
              }}
            >
              Short Break
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentState('longBreak');
                setTimeLeft(settings.longBreakDuration);
                setIsRunning(false);
              }}
            >
              Long Break
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.workDuration / 60}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  workDuration: parseInt(e.target.value) * 60
                }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Short Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration / 60}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  shortBreakDuration: parseInt(e.target.value) * 60
                }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration / 60}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  longBreakDuration: parseInt(e.target.value) * 60
                }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Sessions until long break
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  sessionsUntilLongBreak: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PomodoroTimer;