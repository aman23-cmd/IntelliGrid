import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Activity,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceCommand {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  type: 'info' | 'action' | 'alert';
}

export function VoiceAssistant({ currentUsage, monthlyAverage }: { currentUsage: number; monthlyAverage: number }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);

      if (event.results[current].isFinal) {
        processCommand(transcriptText);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error('Voice recognition error', {
          description: event.error,
        });
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setTranscript('');
    };

    // Load previous commands
    const savedCommands = localStorage.getItem('voice-commands');
    if (savedCommands) {
      setCommands(JSON.parse(savedCommands, (key, value) => {
        if (key === 'timestamp') return new Date(value);
        return value;
      }));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (commands.length > 0) {
      localStorage.setItem('voice-commands', JSON.stringify(commands));
    }
  }, [commands]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening...', {
          description: 'Speak a command',
        });
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast.error('Failed to start listening');
      }
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const processCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    let response = '';
    let type: 'info' | 'action' | 'alert' = 'info';

    // Energy status commands
    if (lowerCommand.includes('current') && (lowerCommand.includes('usage') || lowerCommand.includes('consumption'))) {
      response = `Your current energy usage is ${currentUsage.toFixed(1)} kilowatt hours.`;
      type = 'info';
    } else if (lowerCommand.includes('average') || lowerCommand.includes('monthly')) {
      response = `Your monthly average is ${monthlyAverage.toFixed(1)} kilowatt hours.`;
      type = 'info';
    } else if (lowerCommand.includes('compare')) {
      const diff = currentUsage - monthlyAverage;
      const percentage = ((diff / monthlyAverage) * 100).toFixed(1);
      if (diff > 0) {
        response = `You're using ${percentage}% more energy than your monthly average. Consider reducing usage.`;
        type = 'alert';
      } else {
        response = `Great job! You're using ${Math.abs(parseFloat(percentage))}% less energy than your monthly average.`;
        type = 'info';
      }
    }
    // Energy saving tips
    else if (lowerCommand.includes('tip') || lowerCommand.includes('save') || lowerCommand.includes('reduce')) {
      const tips = [
        'Turn off lights when leaving a room to save energy.',
        'Unplug devices when not in use to prevent phantom power consumption.',
        'Use LED bulbs which consume 75% less energy than traditional bulbs.',
        'Set your thermostat 2 degrees lower in winter and higher in summer.',
        'Use natural light during the day instead of artificial lighting.',
        'Run dishwashers and washing machines with full loads only.',
      ];
      response = tips[Math.floor(Math.random() * tips.length)];
      type = 'action';
    }
    // Status check
    else if (lowerCommand.includes('status') || lowerCommand.includes('how am i doing')) {
      if (currentUsage < monthlyAverage * 0.8) {
        response = 'Excellent! Your energy consumption is well below average. Keep up the great work!';
        type = 'info';
      } else if (currentUsage < monthlyAverage * 1.2) {
        response = 'Your energy usage is within normal range. You\'re doing fine!';
        type = 'info';
      } else {
        response = 'Your energy consumption is higher than usual. Consider reviewing your appliances.';
        type = 'alert';
      }
    }
    // Appliance control
    else if (lowerCommand.includes('turn off') || lowerCommand.includes('turn on')) {
      response = 'To control appliances, please connect them via the Bluetooth device manager first.';
      type = 'action';
    }
    // Help
    else if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
      response = 'I can tell you your current usage, monthly average, provide energy saving tips, and help you compare your consumption. Just ask!';
      type = 'info';
    }
    // Default
    else {
      response = 'I didn\'t understand that. Try asking about your current usage, monthly average, or energy saving tips.';
      type = 'info';
    }

    // Add command to history
    const newCommand: VoiceCommand = {
      id: Date.now().toString(),
      command: command,
      response: response,
      timestamp: new Date(),
      type: type,
    };

    setCommands(prev => [newCommand, ...prev].slice(0, 20)); // Keep last 20 commands
    speak(response);

    toast.success('Command processed', {
      description: response.substring(0, 100) + (response.length > 100 ? '...' : ''),
    });
  };

  const getCommandIcon = (type: string) => {
    switch (type) {
      case 'info': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'action': return <Zap className="h-4 w-4 text-green-500" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Volume2 className="h-5 w-5 text-purple-500" />
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
              )}
            </div>
            <h3>Voice Assistant</h3>
          </div>
          <Badge variant={isListening ? 'default' : 'secondary'}>
            {isListening ? 'Listening' : 'Idle'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 min-h-[60px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isListening && transcript ? (
                <motion.p
                  key="transcript"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-center"
                >
                  "{transcript}"
                </motion.p>
              ) : isListening ? (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-6 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-7 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-1 h-4 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Listening...</span>
                </motion.div>
              ) : isSpeaking ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="h-5 w-5 text-purple-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Speaking...</span>
                </motion.div>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground text-center"
                >
                  Click the microphone to start
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={toggleListening}
              disabled={!isSupported || isSpeaking}
              className="flex-1"
              variant={isListening ? 'destructive' : 'default'}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
            {isSpeaking && (
              <Button onClick={stopSpeaking} variant="outline">
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h4 className="text-sm font-medium mb-3">Command History</h4>
        <ScrollArea className="h-[300px]">
          {commands.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No commands yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try saying "What's my current usage?"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {commands.map((cmd) => (
                <motion.div
                  key={cmd.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-muted/30 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm flex-1">{cmd.command}</p>
                  </div>
                  <div className="flex items-start gap-2 ml-6">
                    {getCommandIcon(cmd.type)}
                    <p className="text-sm text-muted-foreground flex-1">{cmd.response}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    {cmd.timestamp.toLocaleTimeString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {!isSupported && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-t border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Voice recognition is not supported in your browser. Please use Chrome or Edge.
          </p>
        </div>
      )}
    </Card>
  );
}
