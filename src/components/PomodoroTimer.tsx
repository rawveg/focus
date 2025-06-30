import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import toast from 'react-hot-toast';

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

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  soundEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

interface TimerState {
  currentState: 'work' | 'shortBreak' | 'longBreak';
  timeLeft: number;
  isRunning: boolean;
  completedSessions: number;
  lastUpdateTime: number;
  sessionStartTime: number;
}

interface SessionRecord {
  date: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completedAt: number;
  taskId?: string;
  taskTitle?: string;
}

type SessionType = 'work' | 'shortBreak' | 'longBreak';

const STORAGE_KEYS = {
  SETTINGS: 'pomodoro-settings',
  TIMER_STATE: 'pomodoro-timer-state',
  SESSIONS: 'pomodoro-sessions'
};

interface PomodoroTimerProps {
  currentTask?: Task | null;
  onTaskComplete?: () => void;
  onTimerStateChange?: (isRunning: boolean, sessionType: SessionType) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  currentTask, 
  onTaskComplete,
  onTimerStateChange
}) => {
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25 * 60, // 25 minutes in seconds
    shortBreakDuration: 5 * 60, // 5 minutes in seconds
    longBreakDuration: 15 * 60, // 15 minutes in seconds
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    autoStartBreaks: false,
    autoStartWork: false
  });

  const [currentState, setCurrentState] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Notify parent component of timer state changes
  useEffect(() => {
    if (onTimerStateChange && isInitialized) {
      onTimerStateChange(isRunning, currentState);
    }
  }, [isRunning, currentState, onTimerStateChange, isInitialized]);

  // Save session to history
  const saveSession = (type: SessionType, duration: number) => {
    const session: SessionRecord = {
      date: new Date().toDateString(),
      type,
      duration,
      completedAt: Date.now(),
      taskId: currentTask?.id,
      taskTitle: currentTask?.title
    };

    const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    let sessions: SessionRecord[] = [];
    
    if (savedSessions) {
      try {
        sessions = JSON.parse(savedSessions);
      } catch (error) {
        console.error('Failed to parse saved sessions:', error);
      }
    }

    sessions.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  };

  // Create notification sound
  const playNotificationSound = () => {
    if (!settings.soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

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
            toast.success('Timer resumed from where you left off!');
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
    let completedWhileAway = 0;
    
    while (remainingTime > 0) {
      const sessionDuration = getCurrentDurationForState(currentSessionType, currentSettings);
      
      if (remainingTime >= sessionDuration) {
        // Complete this session
        remainingTime -= sessionDuration;
        completedWhileAway++;
        
        // Save the completed session
        saveSession(currentSessionType, sessionDuration);
        
        if (currentSessionType === 'work') {
          sessions++;
          if (onTaskComplete) onTaskComplete();
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
        
        if (completedWhileAway > 0) {
          toast.success(`${completedWhileAway} session(s) completed while you were away!`);
        }
        return;
      }
    }
    
    // If we get here, we're at the start of a new session
    setCurrentState(currentSessionType);
    setTimeLeft(getCurrentDurationForState(currentSessionType, currentSettings));
    setCompletedSessions(sessions);
    setIsRunning(false);
    
    if (completedWhileAway > 0) {
      toast.success(`${completedWhileAway} session(s) completed while you were away!`);
    }
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

  // Skip to next session
  const skipSession = () => {
    setIsRunning(false);
    nextSession();
  };

  // Move to next session
  const nextSession = () => {
    playNotificationSound();
    
    // Save completed session
    const sessionDuration = getCurrentDuration();
    saveSession(currentState, sessionDuration - timeLeft);
    
    if (currentState === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Notify parent component about task completion
      if (onTaskComplete) onTaskComplete();
      
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setCurrentState('longBreak');
        setTimeLeft(settings.longBreakDuration);
        toast.success('🎉 Great work! Time for a long break!');
        if (settings.autoStartBreaks) {
          setIsRunning(true);
        }
      } else {
        setCurrentState('shortBreak');
        setTimeLeft(settings.shortBreakDuration);
        toast.success('✅ Work session complete! Take a short break.');
        if (settings.autoStartBreaks) {
          setIsRunning(true);
        }
      }
    } else {
      setCurrentState('work');
      setTimeLeft(settings.workDuration);
      toast.success('💪 Break over! Ready to focus?');
      if (settings.autoStartWork) {
        setIsRunning(true);
      }
    }
    
    if (!settings.autoStartBreaks && !settings.autoStartWork) {
      setIsRunning(false);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
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

  // Update document title with timer
  useEffect(() => {
    if (isInitialized) {
      const stateEmoji = currentState === 'work' ? '🍅' : currentState === 'shortBreak' ? '☕' : '🌴';
      const statusEmoji = isRunning ? '▶️' : '⏸️';
      const taskInfo = currentTask ? ` - ${currentTask.title}` : '';
      document.title = `${statusEmoji} ${formatTime(timeLeft)} ${stateEmoji}${taskInfo} Focus Timer`;
    }
    
    return () => {
      document.title = 'Focus Timer';
    };
  }, [timeLeft, isRunning, currentState, currentTask, isInitialized]);

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
        return 'text-blue-600 dark:text-blue-400';
      case 'shortBreak':
        return 'text-green-600 dark:text-green-400';
      case 'longBreak':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStateEmoji = () => {
    switch (currentState) {
      case 'work':
        return '🍅';
      case 'shortBreak':
        return '☕';
      case 'longBreak':
        return '🌴';
      default:
        return '🍅';
    }
  };

  // Don't render until we've loaded from localStorage
  if (!isInitialized) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
          <div className="px-8 py-16 text-center">
            <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Current Task Display */}
      {currentTask && (
        <div className="mb-6 p-4 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="text-center">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Working on</div>
            <div className="font-semibold text-blue-900 dark:text-blue-100">{currentTask.title}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {currentTask.completedPomodoros}/{currentTask.estimatedPomodoros} pomodoros
            </div>
          </div>
        </div>
      )}

      {/* Main Timer Card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Timer</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
              >
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
              >
                <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getStateEmoji()}</span>
            <p className={`text-sm font-medium ${getStateColor()} tracking-wide uppercase`}>
              {getStateLabel()}
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="px-8 pb-6">
          <div className="text-center mb-8">
            <div className="text-7xl font-light text-gray-900 dark:text-white tracking-tighter mb-4">
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
                  className="text-gray-200 dark:text-gray-700"
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
                  className={currentState === 'work' ? 'text-blue-500 dark:text-blue-400' : currentState === 'shortBreak' ? 'text-green-500 dark:text-green-400' : 'text-purple-500 dark:text-purple-400'}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {Math.round(getProgress())}%
                </span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-3 mb-6">
            <button
              onClick={toggleTimer}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                isRunning 
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300' 
                  : currentState === 'work' 
                    ? 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-blue-800' 
                    : currentState === 'shortBreak'
                      ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white shadow-green-200 dark:shadow-green-800'
                      : 'bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700 text-white shadow-purple-200 dark:shadow-purple-800'
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
              className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center transition-all duration-200 shadow-lg"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={skipSession}
              className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center transition-all duration-200 shadow-lg"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Session Info */}
          <div className="text-center space-y-1 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Session {completedSessions + 1}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Long Break
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
          <div className="px-8 py-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                    min
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:outline-none transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                    min
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                    min
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sound Notifications
                  </label>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-start Breaks
                  </label>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, autoStartBreaks: !prev.autoStartBreaks }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoStartBreaks ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoStartBreaks ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-start Work
                  </label>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, autoStartWork: !prev.autoStartWork }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoStartWork ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoStartWork ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;