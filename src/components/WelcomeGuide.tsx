import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Zap, Target, Bell, Download, LineChart, Bot, CheckCircle2, Bluetooth, Mic, Box } from 'lucide-react';

interface WelcomeGuideProps {
  show: boolean;
  onClose: () => void;
}

export function WelcomeGuide({ show, onClose }: WelcomeGuideProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Zap className="h-12 w-12 text-cyan-500" />,
      title: "Welcome to Smart Energy Dashboard! ⚡",
      description: "Track, analyze, and optimize your energy consumption with AI-powered insights and cutting-edge 3D visualization.",
      features: [
        "📊 Real-time energy tracking",
        "🤖 AI-powered predictions",
        "🎬 Immersive 3D visualization",
        "📱 Bluetooth device control",
        "🎤 Voice assistant (Alexa-like)",
        "💰 Bill calculator",
        "💡 Smart energy tips"
      ]
    },
    {
      icon: <Box className="h-12 w-12 text-indigo-500" />,
      title: "Experience 3D Energy Visualization 🎬",
      description: "Explore your energy consumption in an immersive 3D environment with real-time animations.",
      features: [
        "Interactive 3D scene with orbit controls",
        "Dynamic energy sphere (changes with usage)",
        "Animated energy rings and particles",
        "3D building model with solar panels",
        "Fullscreen mode for detailed view"
      ]
    },
    {
      icon: <Bluetooth className="h-12 w-12 text-blue-500" />,
      title: "Connect Smart Appliances 📱",
      description: "Connect your Bluetooth-enabled appliances to monitor and control them directly from the dashboard.",
      features: [
        "Scan for nearby Bluetooth devices",
        "Connect smart bulbs, plugs, thermostats",
        "Turn devices on/off remotely",
        "Monitor real-time power consumption",
        "Track device battery levels"
      ]
    },
    {
      icon: <Mic className="h-12 w-12 text-purple-500" />,
      title: "Voice Control Assistant 🎤",
      description: "Use voice commands to check your energy usage and get personalized tips hands-free.",
      features: [
        "Ask about current usage",
        "Get energy-saving tips by voice",
        "Compare usage patterns",
        "Spoken responses from AI assistant",
        "Complete command history"
      ]
    },
    {
      icon: <Target className="h-12 w-12 text-purple-500" />,
      title: "Set Your Energy Goals 🎯",
      description: "Define monthly energy consumption targets and track your progress in real-time.",
      features: [
        "Set realistic monthly goals",
        "Track progress visually",
        "Get achievement notifications",
        "Compare actual vs. target"
      ]
    },
    {
      icon: <Bell className="h-12 w-12 text-orange-500" />,
      title: "Enable Usage Alerts ⚠️",
      description: "Get notified when your daily energy usage exceeds your set threshold.",
      features: [
        "Customizable daily limits",
        "Real-time notifications",
        "Visual warnings",
        "Usage breakdown"
      ]
    },
    {
      icon: <LineChart className="h-12 w-12 text-emerald-500" />,
      title: "Track & Analyze 📈",
      description: "View detailed charts, graphs, and insights about your energy consumption patterns.",
      features: [
        "Daily usage trends",
        "Appliance breakdown",
        "Monthly comparisons",
        "AI predictions"
      ]
    },
    {
      icon: <Bot className="h-12 w-12 text-blue-500" />,
      title: "Get Smart Tips 💡",
      description: "Use the AI chatbot and energy tips to learn how to save energy and reduce costs.",
      features: [
        "Personalized recommendations",
        "24/7 AI assistant",
        "Energy saving strategies",
        "Cost reduction tips"
      ]
    },
    {
      icon: <Download className="h-12 w-12 text-indigo-500" />,
      title: "Backup Your Data 💾",
      description: "Export your data as CSV or create JSON backups to keep your records safe.",
      features: [
        "CSV export for analysis",
        "JSON backup files",
        "Easy restore process",
        "Keep your data safe"
      ]
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('energyDashboardWelcomeShown', 'true');
    onClose();
  };

  const currentStep = steps[step];

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            {currentStep.icon}
          </div>
          <DialogTitle className="text-2xl text-center bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-6">
          {currentStep.features.map((feature, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step 
                  ? 'w-8 bg-gradient-to-r from-cyan-500 to-blue-500' 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 0}
            className="flex-1"
          >
            ← Previous
          </Button>
          
          {step === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              Get Started! 🚀
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              Next →
            </Button>
          )}
        </div>

        <button
          onClick={handleComplete}
          className="text-sm text-gray-500 hover:text-gray-700 text-center w-full mt-2 underline"
        >
          Skip tutorial
        </button>
      </DialogContent>
    </Dialog>
  );
}