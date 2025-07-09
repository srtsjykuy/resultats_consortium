import React, { useState, useEffect } from 'react';
import { Clock, Star, Sparkles, Trophy, Crown, Zap } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useCountdown } from './hooks/useCountdown';

// Animated background stars
const AnimatedStars = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          <Star className="w-1 h-1 text-yellow-300 fill-current" />
        </div>
      ))}
    </div>
  );
};

// Shooting star animation
const ShootingStars = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-shooting-star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
            animationDelay: `${i * 2}s`,
          }}
        >
          <div className="w-1 h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent rounded-full" />
        </div>
      ))}
    </div>
  );
};

// Countdown timer component
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg">
      <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-blue-200 text-sm uppercase tracking-wider">
        {label}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
      <TimeUnit value={timeLeft.days} label="Jours" />
      <TimeUnit value={timeLeft.hours} label="Heures" />
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <TimeUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
};

// Connection status component
const ConnectionStatus = ({ error, onRetry }: { error: string | null; onRetry: () => void }) => {
  if (!error) return null;

  return (
    <div className="bg-red-500/20 backdrop-blur-md rounded-2xl p-6 border border-red-400/30 shadow-lg max-w-md mx-auto mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <Zap className="w-6 h-6 text-red-400" />
        <h3 className="text-lg font-semibold text-white">Erreur de Connexion</h3>
      </div>
      <p className="text-red-200 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300"
      >
        Réessayer
      </button>
    </div>
  );
};

function App() {
  const { settings, loading, error, refetch } = useCountdown();

  // Default settings if no database connection
  const defaultSettings = {
    title: "LES RÉSULTATS SERONT DISPONIBLES DANS",
    description: "Les résultats exceptionnels de nos membres d'élite seront bientôt révélés.",
    target_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    is_active: true
  };

  const currentSettings = settings || defaultSettings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 relative overflow-hidden">
      <AnimatedStars />
      <ShootingStars />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Crown className="w-12 h-12 text-yellow-400" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              CONSORTIUM
            </h1>
            <Crown className="w-12 h-12 text-yellow-400" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-300" />
            <h2 className="text-xl md:text-2xl text-blue-200 font-light tracking-wide">
              DES ESPRITS EXCEPTIONNELS
            </h2>
            <Sparkles className="w-6 h-6 text-blue-300" />
          </div>
        </div>

        {/* Connection Error */}
        <ConnectionStatus error={error} onRetry={refetch} />

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-2xl w-full border border-white/20 shadow-2xl animate-fade-in-delay">
          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" text="Connexion en cours..." />
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                  {currentSettings.title}
                </h3>
                {currentSettings.description && (
                  <p className="text-blue-200 text-lg leading-relaxed">
                    {currentSettings.description}
                  </p>
                )}
              </div>

              {/* Countdown */}
              {currentSettings.is_active && (
                <div className="mb-8 animate-slide-up">
                  <CountdownTimer targetDate={currentSettings.target_date} />
                </div>
              )}

              {/* Decorative Elements */}
              <div className="flex items-center justify-center space-x-6 mt-8 animate-slide-up-delay">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center animate-fade-in-delay">
          <p className="text-blue-300 text-sm">
            Excellence • Innovation • Leadership
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;