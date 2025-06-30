import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Plus, 
  Crown, 
  Clock, 
  Target, 
  Trophy, 
  MessageCircle, 
  Share2, 
  UserPlus,
  Settings,
  Calendar,
  Flame,
  Star,
  Copy,
  Check,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
  isOnline: boolean;
  currentSession?: {
    type: 'work' | 'break';
    startTime: number;
    duration: number;
    taskTitle?: string;
  };
  todayStats: {
    sessions: number;
    focusTime: number;
    streak: number;
  };
}

interface Team {
  id: string;
  name: string;
  description: string;
  code: string;
  createdAt: number;
  ownerId: string;
  members: TeamMember[];
  settings: {
    allowPublicJoin: boolean;
    requireApproval: boolean;
    shareProgress: boolean;
    enableLeaderboard: boolean;
  };
}

interface TeamSession {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  scheduledTime: number;
  duration: number;
  type: 'focus' | 'break' | 'meeting';
  createdBy: string;
  participants: string[];
  isActive: boolean;
  startedAt?: number;
}

interface TeamMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'message' | 'achievement' | 'session_start' | 'session_complete';
}

const TeamHub: React.FC = () => {
  const [currentUser] = useState<TeamMember>({
    id: 'current-user',
    name: 'You',
    email: 'you@example.com',
    role: 'owner',
    joinedAt: Date.now(),
    isOnline: true,
    todayStats: { sessions: 5, focusTime: 7200, streak: 3 }
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [teamSessions, setTeamSessions] = useState<TeamSession[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    allowPublicJoin: true,
    requireApproval: false,
    shareProgress: true,
    enableLeaderboard: true
  });

  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 25,
    type: 'focus' as 'focus' | 'break' | 'meeting'
  });

  const [joinCode, setJoinCode] = useState('');

  // Load teams from localStorage
  useEffect(() => {
    const savedTeams = localStorage.getItem('pomodoro-teams');
    if (savedTeams) {
      try {
        const loadedTeams = JSON.parse(savedTeams);
        setTeams(loadedTeams);
        if (loadedTeams.length > 0) {
          setActiveTeam(loadedTeams[0]);
        }
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    }
  }, []);

  // Save teams to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-teams', JSON.stringify(teams));
  }, [teams]);

  // Load team data when active team changes
  useEffect(() => {
    if (activeTeam) {
      loadTeamSessions(activeTeam.id);
      loadTeamMessages(activeTeam.id);
    }
  }, [activeTeam]);

  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createTeam = () => {
    if (!newTeam.name.trim()) {
      showError('Please enter a team name');
      return;
    }

    const team: Team = {
      id: Date.now().toString(),
      name: newTeam.name.trim(),
      description: newTeam.description.trim(),
      code: generateTeamCode(),
      createdAt: Date.now(),
      ownerId: currentUser.id,
      members: [currentUser],
      settings: {
        allowPublicJoin: newTeam.allowPublicJoin,
        requireApproval: newTeam.requireApproval,
        shareProgress: newTeam.shareProgress,
        enableLeaderboard: newTeam.enableLeaderboard
      }
    };

    setTeams(prev => [...prev, team]);
    setActiveTeam(team);
    setShowCreateTeam(false);
    setNewTeam({
      name: '',
      description: '',
      allowPublicJoin: true,
      requireApproval: false,
      shareProgress: true,
      enableLeaderboard: true
    });
    showSuccess('Team created successfully!');
  };

  const joinTeam = () => {
    if (!joinCode.trim()) {
      showError('Please enter a team code');
      return;
    }

    // Simulate finding team by code
    const existingTeam = teams.find(t => t.code === joinCode.toUpperCase());
    if (existingTeam) {
      showError('You are already in this team');
      return;
    }

    // Simulate joining a team (in real app, this would be an API call)
    const mockTeam: Team = {
      id: Date.now().toString(),
      name: `Team ${joinCode}`,
      description: 'A collaborative productivity team',
      code: joinCode.toUpperCase(),
      createdAt: Date.now() - 86400000,
      ownerId: 'other-user',
      members: [
        {
          id: 'other-user',
          name: 'Team Leader',
          email: 'leader@example.com',
          role: 'owner',
          joinedAt: Date.now() - 86400000,
          isOnline: true,
          todayStats: { sessions: 8, focusTime: 12000, streak: 5 }
        },
        {
          id: 'member-1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'member',
          joinedAt: Date.now() - 43200000,
          isOnline: false,
          todayStats: { sessions: 3, focusTime: 4500, streak: 2 }
        },
        currentUser
      ],
      settings: {
        allowPublicJoin: true,
        requireApproval: false,
        shareProgress: true,
        enableLeaderboard: true
      }
    };

    setTeams(prev => [...prev, mockTeam]);
    setActiveTeam(mockTeam);
    setShowJoinTeam(false);
    setJoinCode('');
    showSuccess('Successfully joined the team!');
  };

  const createTeamSession = () => {
    if (!newSession.title.trim() || !activeTeam) {
      showError('Please fill in all required fields');
      return;
    }

    const session: TeamSession = {
      id: Date.now().toString(),
      teamId: activeTeam.id,
      title: newSession.title.trim(),
      description: newSession.description.trim(),
      scheduledTime: new Date(newSession.scheduledTime).getTime(),
      duration: newSession.duration,
      type: newSession.type,
      createdBy: currentUser.id,
      participants: [currentUser.id],
      isActive: false
    };

    setTeamSessions(prev => [...prev, session]);
    setShowCreateSession(false);
    setNewSession({
      title: '',
      description: '',
      scheduledTime: '',
      duration: 25,
      type: 'focus'
    });
    showSuccess('Team session created!');
  };

  const joinSession = (sessionId: string) => {
    setTeamSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, participants: [...session.participants, currentUser.id] }
        : session
    ));
    showSuccess('Joined the session!');
  };

  const startSession = (sessionId: string) => {
    setTeamSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, isActive: true, startedAt: Date.now() }
        : session
    ));
    
    // Add message to team chat
    const message: TeamMessage = {
      id: Date.now().toString(),
      teamId: activeTeam!.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: `started the session "${teamSessions.find(s => s.id === sessionId)?.title}"`,
      timestamp: Date.now(),
      type: 'session_start'
    };
    setTeamMessages(prev => [...prev, message]);
    showSuccess('Session started!');
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeTeam) return;

    const message: TeamMessage = {
      id: Date.now().toString(),
      teamId: activeTeam.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: newMessage.trim(),
      timestamp: Date.now(),
      type: 'message'
    };

    setTeamMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const copyTeamCode = () => {
    if (activeTeam) {
      navigator.clipboard.writeText(activeTeam.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showSuccess('Team code copied to clipboard!');
    }
  };

  const loadTeamSessions = (teamId: string) => {
    // Mock team sessions
    const mockSessions: TeamSession[] = [
      {
        id: '1',
        teamId,
        title: 'Morning Focus Sprint',
        description: 'Let\'s start the day with a productive focus session',
        scheduledTime: Date.now() + 3600000,
        duration: 25,
        type: 'focus',
        createdBy: 'other-user',
        participants: ['other-user', 'member-1'],
        isActive: false
      },
      {
        id: '2',
        teamId,
        title: 'Afternoon Deep Work',
        description: 'Tackle complex tasks together',
        scheduledTime: Date.now() + 7200000,
        duration: 45,
        type: 'focus',
        createdBy: 'member-1',
        participants: ['member-1'],
        isActive: false
      }
    ];
    setTeamSessions(mockSessions);
  };

  const loadTeamMessages = (teamId: string) => {
    // Mock team messages
    const mockMessages: TeamMessage[] = [
      {
        id: '1',
        teamId,
        senderId: 'other-user',
        senderName: 'Team Leader',
        content: 'Welcome to the team! Let\'s boost our productivity together 🚀',
        timestamp: Date.now() - 3600000,
        type: 'message'
      },
      {
        id: '2',
        teamId,
        senderId: 'member-1',
        senderName: 'Alice Johnson',
        content: 'Just completed a 25-minute focus session!',
        timestamp: Date.now() - 1800000,
        type: 'session_complete'
      }
    ];
    setTeamMessages(mockMessages);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'focus':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'break':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'meeting':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Team Productivity
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Create or join a team to collaborate on focus sessions, share progress, and motivate each other.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Team</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Name *</label>
                    <Input
                      placeholder="e.g., Design Team, Study Group"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      placeholder="What's this team about?"
                      value={newTeam.description}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Allow public joining</label>
                      <button
                        onClick={() => setNewTeam(prev => ({ ...prev, allowPublicJoin: !prev.allowPublicJoin }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          newTeam.allowPublicJoin ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          newTeam.allowPublicJoin ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Enable leaderboard</label>
                      <button
                        onClick={() => setNewTeam(prev => ({ ...prev, enableLeaderboard: !prev.enableLeaderboard }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          newTeam.enableLeaderboard ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          newTeam.enableLeaderboard ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button onClick={createTeam} className="flex-1">Create Team</Button>
                    <Button variant="outline" onClick={() => setShowCreateTeam(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showJoinTeam} onOpenChange={setShowJoinTeam}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Join Team</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Existing Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Code *</label>
                    <Input
                      placeholder="Enter 6-character team code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button onClick={joinTeam} className="flex-1">Join Team</Button>
                    <Button variant="outline" onClick={() => setShowJoinTeam(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <CardTitle className="text-xl">{activeTeam?.name}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {activeTeam?.members.length} members • Code: {activeTeam?.code}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyTeamCode}
                className="flex items-center space-x-1"
              >
                {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCode ? 'Copied!' : 'Share Code'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateTeam(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="chat">Team Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(activeTeam?.members.reduce((total, member) => total + member.todayStats.focusTime, 0) || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Team Focus Time Today</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTeam?.members.reduce((total, member) => total + member.todayStats.sessions, 0) || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Sessions Completed</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTeam?.members.filter(m => m.isOnline).length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Online Now</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Members */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeTeam?.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                          {member.role === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                          {member.currentSession && (
                            <Badge variant="outline" className="text-xs">
                              {member.currentSession.type === 'work' ? '🍅 Focusing' : '☕ On Break'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {member.todayStats.sessions} sessions • {formatTime(member.todayStats.focusTime)} • {member.todayStats.streak} day streak
                        </div>
                      </div>
                    </div>
                    {member.currentSession && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.currentSession.taskTitle || 'Focus Session'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.floor((Date.now() - member.currentSession.startTime) / 60000)}m elapsed
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Sessions</h3>
            <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Session</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Team Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Session Title *</label>
                    <Input
                      placeholder="e.g., Morning Focus Sprint"
                      value={newSession.title}
                      onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      placeholder="What will you work on together?"
                      value={newSession.description}
                      onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Scheduled Time</label>
                      <Input
                        type="datetime-local"
                        value={newSession.scheduledTime}
                        onChange={(e) => setNewSession(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                      <Input
                        type="number"
                        min="5"
                        max="120"
                        value={newSession.duration}
                        onChange={(e) => setNewSession(prev => ({ ...prev, duration: parseInt(e.target.value) || 25 }))}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button onClick={createTeamSession} className="flex-1">Create Session</Button>
                    <Button variant="outline" onClick={() => setShowCreateSession(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {teamSessions.map(session => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{session.title}</h4>
                        <Badge className={getSessionTypeColor(session.type)}>
                          {session.type}
                        </Badge>
                        {session.isActive && (
                          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                            Live
                          </Badge>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{session.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(session.scheduledTime).toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {session.duration}m
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {session.participants.length} joined
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!session.participants.includes(currentUser.id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => joinSession(session.id)}
                        >
                          Join
                        </Button>
                      )}
                      {session.participants.includes(currentUser.id) && !session.isActive && (
                        <Button
                          size="sm"
                          onClick={() => startSession(session.id)}
                          className="flex items-center space-x-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>Start</span>
                        </Button>
                      )}
                      {session.isActive && (
                        <Button size="sm" variant="outline" disabled>
                          <Eye className="h-3 w-3 mr-1" />
                          Watch
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTeam?.members
                  .sort((a, b) => b.todayStats.focusTime - a.todayStats.focusTime)
                  .map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                          index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                          index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                          'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {member.todayStats.sessions} sessions • {member.todayStats.streak} day streak
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatTime(member.todayStats.focusTime)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">focus time</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {teamMessages.map(message => (
                  <div key={message.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`text-sm ${
                        message.type === 'message' 
                          ? 'text-gray-700 dark:text-gray-300' 
                          : 'text-blue-600 dark:text-blue-400 italic'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamHub;