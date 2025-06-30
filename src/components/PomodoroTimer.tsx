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

interface TimerState {
  currentState: 'work' | 'shortBreak' | 'longBreak';
  timeLeft: number;
  isRunning: boolean;
  completedSessions: number;
  lastUpdateTime: number;
  sessionStartTime: number;
}

type SessionType = 'work' | 'shortBreak' | 'longBreak';

const STORAGE_KEYS = {
  SETTINGS: 'pomodoro-settings',
  TIMER_STATE: 'pomodoro-timer-state'
};

const PomodoroTimer = () => {
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25 * 60, // 25 minutes in seconds
    shortBreakDuration: 5 * 60, // 5 minutes in seconds
    longBreakDuration: 15 * 60, // 15 minutes in seconds
    sessionsUntilLongBreak: 4
  });

  const [currentState, setCurrentState] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current session duration based on state
  const getCurrentDurationForState = (state: SessionType, currentSettings: PomodoroSettings) => {
    switch (state) {
      case 'work':
        return currentSettings.workDuration;
      case 'shortBreak':
        return currentSettings.shortBreakDuration;
      case 'longBreak':
        return currentSettings.longBreakDuration;
      default:
        return currentSettings.workDuration;
    }
  };

  const getCurrentDuration = () => {
    return getCurrentDurationForState(currentState, settings);
  };

  // Initialize from localStorage on component mount
  useEffect(() => {
    // Load settings first
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    let loadedSettings = settings;
    
    if (savedSettings) {
      try {
        loadedSettings = JSON.parse(savedSettings);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }

    // Load timer state
    const savedTimerState = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    if (savedTimerState) {
      try {
        const parsedState: TimerState = JSON.parse(savedTimerState);
        const now = Date.now();
        const timeSinceLastUpdate = Math.floor((now - parsedState.lastUpdateTime) / 1000);

        if (parsedState.isRunning && timeSinceLastUpdate > 0) {
          // Calculate how much time should have passed
          const newTimeLeft = Math.max(0, parsedState.timeLeft - timeSinceLastUpdate);
          
          if (newTimeLeft > 0) {
            // Timer is still running
            setCurrentState(parsedState.currentState);
            setTimeLeft(newTimeLeft);
            setIsRunning(true);
            setCompletedSessions(parsedState.completedSessions);
            console.log('Restored running timer with', newTimeLeft, 'seconds left');
          } else {
            // Timer should have finished, calculate how many sessions completed
            const sessionDuration = getCurrentDurationForState(parsedState.currentState, loadedSettings);
            const totalElapsed = timeSinceLastUpdate + (sessionDuration - parsedState.timeLeft);
            
            // Simulate the sessions that would have completed
            simulateCompletedSessions(parsedState, totalElapsed, loadedSettings);
          }
        } else {
          // Timer was paused, restore exact state
          setCurrentState(parsedState.currentState);
          setTimeLeft(parsedState.timeLeft);
          setIsRunning(parsedState.isRunning);
          setCompletedSessions(parsedState.completedSessions);
          console.log('Restored paused timer state');
        }
      } catch (error) {
        console.error('Failed to parse saved timer state:', error);
      }
    }

    setIsInitialized(true);
  }, []);

  const simulateCompletedSessions = (lastState: TimerState, totalElapsedTime: number, currentSettings: PomodoroSettings) => {
    let remainingTime = totalElapsedTime;
    let currentSessionType = lastState.currentState;
    let sessions = lastState.completedSessions;
    
    while (remainingTime > 0) {
      const sessionDuration = getCurrentDurationForState(currentSessionType, currentSettings);
      
      if (remainingTime >= sessionDuration) {
        // Complete this session
        remainingTime -= sessionDuration;
        
        if (currentSessionType === 'work') {
          sessions++;
          // Determine next session type
          if (sessions % currentSettings.sessionsUntilLongBreak === 0) {
            currentSessionType = 'longBreak';
          } else {
            currentSessionType = 'shortBreak';
          }
        } else {
          currentSessionType = 'work';
        }
      } else {
        // Partial session
        const newTimeLeft = sessionDuration - remainingTime;
        setCurrentState(currentSessionType);
        setTimeLeft(newTimeLeft);
        setCompletedSessions(sessions);
        setIsRunning(true);
        console.log('Restored to partial session with', newTimeLeft, 'seconds left');
        return;
      }
    }
    
    // If we get here, we're at the start of a new session
    setCurrentState(currentSessionType);
    setTimeLeft(getCurrentDurationForState(currentSessionType, currentSettings));
    setCompletedSessions(sessions);
    setIsRunning(false);
    console.log('Multiple sessions completed, now at start of new session');
  };

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      const timerState: TimerState = {
        currentState,
        timeLeft,
        isRunning,
        completedSessions,
        lastUpdateTime: Date.now(),
        sessionStartTime: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(timerState));
      console.log('Saved timer state:', timerState);
    }
  }, [currentState, timeLeft, isRunning, completedSessions, isInitialized]);

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

  // Update timer when settings change (but only if not running)
  useEffect(() => {
    if (!isRunning && isInitialized) {
      setTimeLeft(getCurrentDuration());
    }
  }, [settings, currentState]);

  const getStateLabel = () => {
    switch (currentState) {
      case 'work':
        return 'Focus';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus';
    }
  };

  const getStateColor = () => {
    switch (currentState) {
      case 'work':
        return 'text-blue-600';
      case 'shortBreak':
        return 'text-green-600';
      case 'longBreak':
        return 'text-purple-600';
      default:
        return 'text-blue-600';
    }
  };

  const getProgressColor = () => {
    switch (currentState) {
      case 'work':
        return 'bg-blue-500';
      case 'shortBreak':
        return 'bg-green-500';
      case 'longBreak':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Don't render until we've loaded from localStorage
  if (!isInitialized) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-8 py-16 text-center">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Main Timer Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Timer</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
            >
              <Settings className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <p className={`text-sm font-medium ${getStateColor()} tracking-wide uppercase`}>
            {getStateLabel()}
          </p>
        </div>

        {/* Timer Display */}
        <div className="px-8 pb-6">
          <div className="text-center mb-8">
            <div className="text-7xl font-light text-gray-900 tracking-tighter mb-4">
              {formatTime(timeLeft)}
            </div>
            
            {/* Progress Ring */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - getProgress() / 100)}`}
                  className={currentState === 'work' ? 'text-blue-500' : currentState === 'shortBreak' ? 'text-green-500' : 'text-purple-500'}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(getProgress())}%
                </span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={toggleTimer}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                isRunning 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                  : currentState === 'work' 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200' 
                    : currentState === 'shortBreak'
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
                      : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200'
              }`}
            >
              {isRunning ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </button>
            
            <button
              onClick={resetTimer}
              className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all duration-200 shadow-lg"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          {/* Session Info */}
          <div className="text-center space-y-1 mb-6">
            <p className="text-sm text-gray-600">
              Session {completedSessions + 1}
            </p>
            <p className="text-xs text-gray-500">
              {settings.sessionsUntilLongBreak - (completedSessions % settings.sessionsUntilLongBreak)} until long break
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => {
                setCurrentState('work');
                setTimeLeft(settings.workDuration);
                setIsRunning(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${
                currentState === 'work' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => {
                setCurrentState('shortBreak');
                setTimeLeft(settings.shortBreakDuration);
                setIsRunning(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${
                currentState === 'shortBreak' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Break
            </button>
            <button
              onClick={() => {
                setCurrentState('longBreak');
                setTimeLeft(settings.longBreakDuration);
                setIsRunning(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${
                currentState === 'longBreak' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Long Break
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-8 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Duration
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.workDuration / 60}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      workDuration: parseInt(e.target.value) * 60
                    }))}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    min
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Break
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakDuration / 60}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      shortBreakDuration: parseInt(e.target.value) * 60
                    }))}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    min
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Long Break
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration / 60}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      longBreakDuration: parseInt(e.target.value) * 60
                    }))}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    min
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sessions Until Long Break
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
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;