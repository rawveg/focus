import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  ShieldOff, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX,
  Monitor,
  Smartphone,
  Bell,
  BellOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface BlockedSite {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  createdAt: number;
}

interface DistractionSettings {
  websiteBlocking: boolean;
  notificationBlocking: boolean;
  fullscreenMode: boolean;
  soundAlerts: boolean;
  breakReminders: boolean;
  focusOverlay: boolean;
  blockedSites: BlockedSite[];
  whitelistedSites: string[];
  blockingSchedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: string[];
  };
}

interface DistractionBlockerProps {
  isTimerRunning: boolean;
  currentSessionType: 'work' | 'shortBreak' | 'longBreak';
  onFocusModeChange: (enabled: boolean) => void;
}

const DistractionBlocker: React.FC<DistractionBlockerProps> = ({
  isTimerRunning,
  currentSessionType,
  onFocusModeChange
}) => {
  const [settings, setSettings] = useState<DistractionSettings>({
    websiteBlocking: false,
    notificationBlocking: false,
    fullscreenMode: false,
    soundAlerts: true,
    breakReminders: true,
    focusOverlay: false,
    blockedSites: [],
    whitelistedSites: [],
    blockingSchedule: {
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  });

  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [showAddSiteDialog, setShowAddSiteDialog] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockedAttempts, setBlockedAttempts] = useState<string[]>([]);
  const [focusOverlayActive, setFocusOverlayActive] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoro-distraction-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to load distraction settings:', error);
      }
    } else {
      // Initialize with common distracting sites
      const defaultBlockedSites: BlockedSite[] = [
        { id: '1', url: 'facebook.com', name: 'Facebook', isActive: true, createdAt: Date.now() },
        { id: '2', url: 'twitter.com', name: 'Twitter', isActive: true, createdAt: Date.now() },
        { id: '3', url: 'instagram.com', name: 'Instagram', isActive: true, createdAt: Date.now() },
        { id: '4', url: 'youtube.com', name: 'YouTube', isActive: true, createdAt: Date.now() },
        { id: '5', url: 'reddit.com', name: 'Reddit', isActive: true, createdAt: Date.now() },
        { id: '6', url: 'tiktok.com', name: 'TikTok', isActive: true, createdAt: Date.now() },
        { id: '7', url: 'netflix.com', name: 'Netflix', isActive: true, createdAt: Date.now() }
      ];
      
      setSettings(prev => ({
        ...prev,
        blockedSites: defaultBlockedSites
      }));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-distraction-settings', JSON.stringify(settings));
  }, [settings]);

  // Handle focus mode activation
  useEffect(() => {
    if (isTimerRunning && currentSessionType === 'work') {
      if (settings.websiteBlocking || settings.fullscreenMode || settings.focusOverlay) {
        setIsBlocking(true);
        onFocusModeChange(true);
        
        if (settings.focusOverlay) {
          setFocusOverlayActive(true);
        }
        
        if (settings.fullscreenMode) {
          enterFullscreen();
        }
        
        if (settings.notificationBlocking) {
          requestNotificationPermission();
        }
        
        showSuccess('🛡️ Focus mode activated! Distractions blocked.');
      }
    } else {
      if (isBlocking) {
        setIsBlocking(false);
        onFocusModeChange(false);
        setFocusOverlayActive(false);
        
        if (document.fullscreenElement) {
          exitFullscreen();
        }
        
        showSuccess('Focus mode deactivated.');
      }
    }
  }, [isTimerRunning, currentSessionType, settings]);

  // Website blocking simulation (in a real app, this would integrate with browser extensions)
  useEffect(() => {
    if (isBlocking && settings.websiteBlocking) {
      const checkInterval = setInterval(() => {
        // Simulate checking current URL
        const currentUrl = window.location.hostname;
        const isBlocked = settings.blockedSites.some(site => 
          site.isActive && currentUrl.includes(site.url.replace('www.', ''))
        );
        
        if (isBlocked) {
          setBlockedAttempts(prev => [...prev, currentUrl]);
          showError('🚫 Website blocked during focus session!');
        }
      }, 5000);

      return () => clearInterval(checkInterval);
    }
  }, [isBlocking, settings.websiteBlocking, settings.blockedSites]);

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.log('Exit fullscreen failed:', err);
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const addBlockedSite = () => {
    if (!newSiteUrl.trim() || !newSiteName.trim()) {
      showError('Please enter both URL and name');
      return;
    }

    const newSite: BlockedSite = {
      id: Date.now().toString(),
      url: newSiteUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, ''),
      name: newSiteName.trim(),
      isActive: true,
      createdAt: Date.now()
    };

    setSettings(prev => ({
      ...prev,
      blockedSites: [...prev.blockedSites, newSite]
    }));

    setNewSiteUrl('');
    setNewSiteName('');
    setShowAddSiteDialog(false);
    showSuccess('Site added to block list');
  };

  const removeSite = (siteId: string) => {
    setSettings(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(site => site.id !== siteId)
    }));
    showSuccess('Site removed from block list');
  };

  const toggleSiteActive = (siteId: string) => {
    setSettings(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.map(site =>
        site.id === siteId ? { ...site, isActive: !site.isActive } : site
      )
    }));
  };

  const updateSetting = (key: keyof DistractionSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getBlockingStatus = () => {
    if (!isTimerRunning) return 'inactive';
    if (currentSessionType !== 'work') return 'break';
    if (isBlocking) return 'active';
    return 'inactive';
  };

  const blockingStatus = getBlockingStatus();

  return (
    <div className="space-y-6">
      {/* Focus Overlay */}
      {focusOverlayActive && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none">
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-3 pointer-events-auto">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-gray-900 dark:text-white">Focus Mode Active</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFocusOverlayActive(false)}
                className="p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Card */}
      <Card className={`border-2 ${
        blockingStatus === 'active' 
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
          : blockingStatus === 'break'
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              {blockingStatus === 'active' ? (
                <Shield className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldOff className="h-5 w-5 text-gray-400" />
              )}
              <span>Distraction Blocker</span>
            </CardTitle>
            <Badge variant={blockingStatus === 'active' ? 'default' : 'secondary'}>
              {blockingStatus === 'active' ? 'Active' : 
               blockingStatus === 'break' ? 'Break Time' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {settings.blockedSites.filter(s => s.isActive).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Blocked Sites</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {blockedAttempts.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Blocked Today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {settings.websiteBlocking ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Web Blocking</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {settings.fullscreenMode ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Fullscreen</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="blocking" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blocking">Website Blocking</TabsTrigger>
          <TabsTrigger value="focus">Focus Mode</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="blocking" className="space-y-6">
          {/* Website Blocking Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Website Blocking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Enable Website Blocking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Block distracting websites during focus sessions
                  </p>
                </div>
                <Switch
                  checked={settings.websiteBlocking}
                  onCheckedChange={(checked) => updateSetting('websiteBlocking', checked)}
                />
              </div>

              {/* Blocked Sites List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">Blocked Sites</h4>
                  <Dialog open={showAddSiteDialog} onOpenChange={setShowAddSiteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Site
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Blocked Site</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Site URL</label>
                          <Input
                            placeholder="e.g., facebook.com"
                            value={newSiteUrl}
                            onChange={(e) => setNewSiteUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Display Name</label>
                          <Input
                            placeholder="e.g., Facebook"
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={addBlockedSite} className="flex-1">
                            Add Site
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddSiteDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {settings.blockedSites.map(site => (
                    <div
                      key={site.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={site.isActive}
                          onCheckedChange={() => toggleSiteActive(site.id)}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {site.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {site.url}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSite(site.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="focus" className="space-y-6">
          {/* Focus Mode Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Focus Mode Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Fullscreen Mode</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Enter fullscreen during focus sessions
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.fullscreenMode}
                    onCheckedChange={(checked) => updateSetting('fullscreenMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-purple-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Focus Overlay</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Show subtle overlay to indicate focus mode
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.focusOverlay}
                    onCheckedChange={(checked) => updateSetting('focusOverlay', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BellOff className="h-5 w-5 text-orange-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Block Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Minimize system notifications during focus
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notificationBlocking}
                    onCheckedChange={(checked) => updateSetting('notificationBlocking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Sound Alerts</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Play sounds when blocking distractions
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundAlerts}
                    onCheckedChange={(checked) => updateSetting('soundAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Break Reminders</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Remind to take breaks during long focus sessions
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.breakReminders}
                    onCheckedChange={(checked) => updateSetting('breakReminders', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFocusOverlayActive(!focusOverlayActive)}
                  className="flex items-center space-x-2"
                >
                  {focusOverlayActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{focusOverlayActive ? 'Hide' : 'Show'} Overlay</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (document.fullscreenElement) {
                      exitFullscreen();
                    } else {
                      enterFullscreen();
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Monitor className="h-4 w-4" />
                  <span>Toggle Fullscreen</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          {/* Blocking Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blocking Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Scheduled Blocking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Automatically enable blocking during specific hours
                  </p>
                </div>
                <Switch
                  checked={settings.blockingSchedule.enabled}
                  onCheckedChange={(checked) => 
                    updateSetting('blockingSchedule', { ...settings.blockingSchedule, enabled: checked })
                  }
                />
              </div>

              {settings.blockingSchedule.enabled && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <Input
                        type="time"
                        value={settings.blockingSchedule.startTime}
                        onChange={(e) => 
                          updateSetting('blockingSchedule', {
                            ...settings.blockingSchedule,
                            startTime: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <Input
                        type="time"
                        value={settings.blockingSchedule.endTime}
                        onChange={(e) => 
                          updateSetting('blockingSchedule', {
                            ...settings.blockingSchedule,
                            endTime: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Active Days</label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                        const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                        const isActive = settings.blockingSchedule.days.includes(dayKey);
                        
                        return (
                          <Button
                            key={day}
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            onClick={() => {
                              const newDays = isActive
                                ? settings.blockingSchedule.days.filter(d => d !== dayKey)
                                : [...settings.blockingSchedule.days, dayKey];
                              
                              updateSetting('blockingSchedule', {
                                ...settings.blockingSchedule,
                                days: newDays
                              });
                            }}
                            className="text-xs"
                          >
                            {day}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked Attempts Log */}
          {blockedAttempts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Recent Blocked Attempts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {blockedAttempts.slice(-10).map((attempt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                    >
                      <span className="text-sm text-red-700 dark:text-red-300">{attempt}</span>
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBlockedAttempts([])}
                  className="mt-3 w-full"
                >
                  Clear Log
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DistractionBlocker;