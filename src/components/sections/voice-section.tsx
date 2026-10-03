'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  User,
  Brain,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface TriageSession {
  id: string
  patientName: string
  status: 'waiting' | 'in-progress' | 'completed' | 'escalated'
  priority: 'EMERGENCY' | 'URGENT' | 'ROUTINE'
  startTime: string
  transcript?: string
}

const mockSessions: TriageSession[] = [
  {
    id: '1',
    patientName: 'Rajesh Kumar',
    status: 'in-progress',
    priority: 'URGENT',
    startTime: '2 min ago',
    transcript: 'Patient reports chest pain radiating to left arm...',
  },
  {
    id: '2',
    patientName: 'Priya Sharma',
    status: 'waiting',
    priority: 'ROUTINE',
    startTime: '5 min ago',
  },
  {
    id: '3',
    patientName: 'Amit Patel',
    status: 'completed',
    priority: 'URGENT',
    startTime: '15 min ago',
    transcript: 'Patient has fever of 102°F for 3 days. Recommended visit.',
  },
  {
    id: '4',
    patientName: 'Sunita Devi',
    status: 'escalated',
    priority: 'EMERGENCY',
    startTime: '8 min ago',
    transcript: 'Severe allergic reaction - anaphylaxis suspected. Escalated to clinician.',
  },
  {
    id: '5',
    patientName: 'Vikram Singh',
    status: 'completed',
    priority: 'ROUTINE',
    startTime: '22 min ago',
    transcript: 'Medication refill request for Metformin. Approved for 30-day supply.',
  },
]

const priorityColors: Record<string, string> = {
  EMERGENCY: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  URGENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  ROUTINE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const statusIcons: Record<string, React.ElementType> = {
  waiting: Clock,
  'in-progress': Mic,
  completed: CheckCircle2,
  escalated: AlertTriangle,
}

export function VoiceSection() {
  const { isVoiceActive, setIsVoiceActive } = useAppStore()
  const [sessions, setSessions] = useState<TriageSession[]>(mockSessions)
  const [selectedSession, setSelectedSession] = useState<TriageSession | null>(mockSessions[0])
  const [isMuted, setIsMuted] = useState(false)
  const [volumeOn, setVolumeOn] = useState(true)
  const [voiceLevel, setVoiceLevel] = useState(0)

  const handleToggleVoice = useCallback(() => {
    if (!isVoiceActive) {
      setIsVoiceActive(true)
      // Simulate voice activity
      const interval = setInterval(() => {
        setVoiceLevel(Math.random() * 100)
      }, 150)
      setTimeout(() => {
        clearInterval(interval)
        setVoiceLevel(0)
        setIsVoiceActive(false)
        toast({ title: 'Voice Triage Complete', description: 'Patient triaged as URGENT priority' })
      }, 5000)
    } else {
      setIsVoiceActive(false)
      setVoiceLevel(0)
    }
  }, [isVoiceActive, setIsVoiceActive])

  const handleEndSession = useCallback((sessionId: string) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, status: 'completed' as const } : s))
    if (selectedSession?.id === sessionId) {
      setSelectedSession({ ...selectedSession, status: 'completed' })
    }
    toast({ title: 'Session Ended', description: 'Voice triage session completed' })
  }, [sessions, selectedSession])

  const activeSessions = sessions.filter(s => s.status === 'in-progress' || s.status === 'waiting')
  const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'escalated')

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isVoiceActive ? 'bg-red-100 dark:bg-red-900 animate-pulse' : 'bg-teal-100 dark:bg-teal-900'}`}>
            <Mic className={`h-6 w-6 ${isVoiceActive ? 'text-red-700 dark:text-red-300' : 'text-teal-700 dark:text-teal-300'}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Voice Triage Workflows</h2>
            <p className="text-sm text-muted-foreground">AI-powered voice-assisted patient triage</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            {activeSessions.length} Active
          </Badge>
          <Badge variant={isVoiceActive ? 'destructive' : 'default'} className="gap-1">
            {isVoiceActive ? '● LIVE' : '○ STANDBY'}
          </Badge>
        </div>
      </div>

      {/* Voice Control Panel */}
      <Card className={isVoiceActive ? 'border-2 border-red-300 dark:border-red-700' : ''}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice Control
          </CardTitle>
          <CardDescription>{isVoiceActive ? 'Voice triage session in progress' : 'Start a new voice triage session'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Main Mic Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleToggleVoice}
                size="lg"
                className={`h-20 w-20 rounded-full ${
                  isVoiceActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {isVoiceActive ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
            </motion.div>

            {/* Voice Level Indicator */}
            <div className="flex-1 w-full">
              {isVoiceActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Listening...</span>
                    <div className="flex gap-0.5">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-red-500 rounded-full"
                          animate={{ height: `${Math.max(4, Math.random() * 24)}px` }}
                          transition={{ duration: 0.15, repeat: Infinity, repeatType: 'reverse' }}
                        />
                      ))}
                    </div>
                  </div>
                  <Progress value={voiceLevel} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    "I've been experiencing chest pain for the last 2 hours..."
                  </p>
                </motion.div>
              )}
              {!isVoiceActive && (
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">Click the microphone to start a voice triage session</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports Hindi, English, Kannada, Tamil & 8 more languages</p>
                </div>
              )}
            </div>

            {/* Audio Controls */}
            {isVoiceActive && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => setVolumeOn(!volumeOn)}>
                  {volumeOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleToggleVoice()}>
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription>{activeSessions.length} voice triage sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions.map((session, i) => {
                  const StatusIcon = statusIcons[session.status] || Clock
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                        selectedSession?.id === session.id ? 'ring-1 ring-teal-500' : ''
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${session.status === 'in-progress' ? 'bg-red-100 dark:bg-red-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                          <StatusIcon className={`h-4 w-4 ${session.status === 'in-progress' ? 'text-red-600' : 'text-amber-600'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{session.patientName}</span>
                            <Badge className={`text-[10px] ${priorityColors[session.priority]}`}>{session.priority}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{session.startTime}</span>
                        </div>
                        {session.status === 'in-progress' && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEndSession(session.id) }}>
                            <PhoneOff className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Completed Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completed Sessions</CardTitle>
              <CardDescription>{completedSessions.length} sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {completedSessions.map((session, i) => {
                  const StatusIcon = statusIcons[session.status] || CheckCircle2
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-4 w-4 shrink-0 ${session.status === 'escalated' ? 'text-red-600' : 'text-green-600'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{session.patientName}</span>
                            <Badge className={`text-[10px] ${priorityColors[session.priority]}`}>{session.priority}</Badge>
                            {session.status === 'escalated' && (
                              <Badge variant="destructive" className="text-[10px]">Escalated</Badge>
                            )}
                          </div>
                          {session.transcript && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{session.transcript}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{session.startTime}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Detail */}
        <div className="space-y-4">
          {selectedSession ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedSession.patientName}
                </CardTitle>
                <CardDescription>Session started {selectedSession.startTime}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Priority</span>
                    <Badge className={priorityColors[selectedSession.priority]}>{selectedSession.priority}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline">{selectedSession.status}</Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">AI Analysis</p>
                  <div className="p-3 rounded-lg bg-accent/50 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-teal-600" />
                      <span className="font-medium">Triage Recommendation</span>
                    </div>
                    <p className="text-muted-foreground">
                      {selectedSession.priority === 'EMERGENCY'
                        ? 'Immediate clinician escalation required. Critical symptoms detected.'
                        : selectedSession.priority === 'URGENT'
                        ? 'Schedule appointment within 2 hours. Monitor vitals closely.'
                        : 'Standard appointment scheduling. No immediate concerns.'}
                    </p>
                  </div>
                </div>
                {selectedSession.transcript && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Transcript</p>
                      <p className="text-sm text-muted-foreground">{selectedSession.transcript}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Mic className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Select a session to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Voice System Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Triage Time</span>
                <span className="font-medium">4.2 min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Accuracy Rate</span>
                <span className="font-medium text-green-600">94.7%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Escalation Rate</span>
                <span className="font-medium text-amber-600">3.1%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Languages Supported</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Today&apos;s Sessions</span>
                <span className="font-medium">{sessions.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
