import { useState, useEffect } from "react";
import { AuthForm } from "./components/AuthForm";
import { EnergyDashboard } from "./components/EnergyDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineDetector } from "./components/OfflineDetector";
import { Toaster } from "./components/ui/sonner";
import { supabase } from "./utils/supabase/client";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // The auth state listener will handle setting the user
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1629800537338-6a082a7aac0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxlbGVjdHJpYyUyMGxpZ2h0bmluZyUyMGVuZXJneSUyMHBvd2VyfGVufDF8fHx8MTc1OTkyOTkxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-emerald-500/10"></div>

        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 text-4xl animate-bounce text-cyan-400 opacity-30">
            ⚡
          </div>
          <div className="absolute top-40 right-32 text-3xl animate-pulse text-emerald-400 opacity-30">
            🌱
          </div>
          <div
            className="absolute bottom-32 left-16 text-4xl animate-bounce text-blue-400 opacity-30"
            style={{ animationDelay: "1s" }}
          >
            💡
          </div>
          <div
            className="absolute bottom-20 right-20 text-3xl animate-pulse text-green-400 opacity-30"
            style={{ animationDelay: "0.5s" }}
          >
            🔋
          </div>
        </div>

        <div className="text-center relative z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-0">
          <div className="text-6xl mb-4 animate-pulse">⚡</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Smart Energy Dashboard
          </h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-cyan-500"></div>
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
          <p className="text-gray-600">
            Initializing your energy insights...
          </p>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <OfflineDetector />
      <Toaster position="top-right" richColors closeButton />
      <div className="min-h-screen">
        {user ? (
          <EnergyDashboard />
        ) : (
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        )}
      </div>
    </ErrorBoundary>
  );
}