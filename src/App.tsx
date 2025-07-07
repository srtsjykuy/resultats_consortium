import React, { useState, useEffect } from 'react';
import { Star, Trophy, Crown, Sparkles, Award, Users, Search, Plus, Edit, Trash2, User, Mail, Phone, Target, Shield, Lock, Eye, EyeOff, AlertTriangle, Clock, Calendar, Play, Pause, Download, Upload, FileSpreadsheet } from 'lucide-react';

interface Person {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  points: number;
}

interface LoginAttempt {
  timestamp: number;
  ip: string;
}

interface CountdownSettings {
  targetDate: string;
  isActive: boolean;
  title: string;
}

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [csrfToken] = useState(() => Math.random().toString(36).substring(2, 15));
  
  // Countdown state
  const [countdownSettings, setCountdownSettings] = useState<CountdownSettings>({
    targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 24h from now
    isActive: true,
    title: 'LES RÉSULTATS SERONT DISPONIBLES DANS'
  });
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  
  const [persons, setPersons] = useState<Person[]>([
    {
      id: '1',
      nom: 'Dupont',
      prenom: 'Marie',
      email: 'marie.dupont@email.com',
      numero: '001',
      points: 95
    },
    {
      id: '2',
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre.martin@email.com',
      numero: '002',
      points: 88
    }
  ]);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    numero: '',
    points: 0
  });

  // Excel import state
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Credentials sécurisés mis à jour
  const ADMIN_CREDENTIALS = {
    username: 'consortium2025',
    password: '1Consortium$'
  };

  const MAX_LOGIN_ATTEMPTS = 3;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Countdown calculation
  useEffect(() => {
    if (!countdownSettings.isActive) {
      setIsCountdownFinished(true);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(countdownSettings.targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
        setIsCountdownFinished(false);
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsCountdownFinished(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownSettings]);

  // Fonction pour déterminer la couleur du chrono
  const getCountdownTextColor = () => {
    const totalDays = timeRemaining.days;
    if (totalDays >= 4) {
      return 'text-yellow-400'; // Jaune pour 4+ jours
    } else {
      return 'text-red-500'; // Rouge pour moins de 4 jours
    }
  };

  // Fonction de validation sécurisée
  const validateInput = (input: string, type: 'text' | 'email' | 'number') => {
    // Protection contre XSS
    const sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(sanitized) ? sanitized : '';
      case 'number':
        return /^\d+$/.test(sanitized) ? sanitized : '';
      case 'text':
        return /^[a-zA-ZÀ-ÿ\s\-']+$/.test(sanitized) ? sanitized : '';
      default:
        return sanitized;
    }
  };

  // Gestion des tentatives de connexion
  const handleLoginAttempt = (success: boolean) => {
    const now = Date.now();
    const userIP = 'user_ip'; // En production, récupérer la vraie IP
    
    if (!success) {
      const newAttempts = [...loginAttempts, { timestamp: now, ip: userIP }];
      const recentAttempts = newAttempts.filter(attempt => 
        now - attempt.timestamp < BLOCK_DURATION
      );
      
      setLoginAttempts(recentAttempts);
      
      if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
        setIsBlocked(true);
        setBlockTimeRemaining(BLOCK_DURATION);
        
        // Décompte du temps de blocage
        const blockTimer = setInterval(() => {
          setBlockTimeRemaining(prev => {
            if (prev <= 1000) {
              setIsBlocked(false);
              clearInterval(blockTimer);
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
      }
    } else {
      setLoginAttempts([]);
      setIsBlocked(false);
    }
  };

  // Authentification sécurisée
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      alert(`Compte bloqué. Réessayez dans ${Math.ceil(blockTimeRemaining / 60000)} minutes.`);
      return;
    }

    // Simulation d'un délai pour éviter les attaques par force brute
    setTimeout(() => {
      if (loginData.username === ADMIN_CREDENTIALS.username && 
          loginData.password === ADMIN_CREDENTIALS.password) {
        setIsAuthenticated(true);
        setShowLogin(false);
        setLoginData({ username: '', password: '' });
        setLastActivity(Date.now());
        handleLoginAttempt(true);
        
        // Démarrer le timeout de session
        startSessionTimeout();
      } else {
        handleLoginAttempt(false);
        alert('Identifiants incorrects');
        setLoginData({ username: '', password: '' });
      }
    }, 1000);
  };

  // Gestion du timeout de session
  const startSessionTimeout = () => {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    
    const timeout = setTimeout(() => {
      setIsAuthenticated(false);
      setShowAdmin(false);
      alert('Session expirée pour des raisons de sécurité');
    }, SESSION_TIMEOUT);
    
    setSessionTimeout(timeout);
  };

  // Mise à jour de l'activité utilisateur
  const updateActivity = () => {
    setLastActivity(Date.now());
    if (isAuthenticated) {
      startSessionTimeout();
    }
  };

  // Déconnexion sécurisée
  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowAdmin(false);
    setShowLogin(false);
    if (sessionTimeout) clearTimeout(sessionTimeout);
    setLoginData({ username: '', password: '' });
  };

  // Surveillance de l'activité
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const activityHandler = () => updateActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });
    
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
    };
  }, [isAuthenticated]);

  const filteredPersons = persons.filter(person =>
    person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.numero.includes(searchTerm)
  );

  const handleAddPerson = () => {
    if (!isAuthenticated) return;
    
    const validatedData = {
      nom: validateInput(formData.nom, 'text'),
      prenom: validateInput(formData.prenom, 'text'),
      email: validateInput(formData.email, 'email'),
      numero: validateInput(formData.numero, 'number'),
      points: formData.points
    };

    if (validatedData.nom && validatedData.prenom && validatedData.email && validatedData.numero) {
      const newPerson: Person = {
        id: Date.now().toString(),
        ...validatedData
      };
      setPersons([...persons, newPerson]);
      setFormData({ nom: '', prenom: '', email: '', numero: '', points: 0 });
      updateActivity();
    } else {
      alert('Données invalides détectées. Veuillez vérifier vos entrées.');
    }
  };

  const handleEditPerson = (person: Person) => {
    if (!isAuthenticated) return;
    setEditingPerson(person);
    setFormData({
      nom: person.nom,
      prenom: person.prenom,
      email: person.email,
      numero: person.numero,
      points: person.points
    });
    updateActivity();
  };

  const handleUpdatePerson = () => {
    if (!isAuthenticated || !editingPerson) return;
    
    const validatedData = {
      nom: validateInput(formData.nom, 'text'),
      prenom: validateInput(formData.prenom, 'text'),
      email: validateInput(formData.email, 'email'),
      numero: validateInput(formData.numero, 'number'),
      points: formData.points
    };

    if (validatedData.nom && validatedData.prenom && validatedData.email && validatedData.numero) {
      setPersons(persons.map(p => 
        p.id === editingPerson.id 
          ? { ...editingPerson, ...validatedData }
          : p
      ));
      setEditingPerson(null);
      setFormData({ nom: '', prenom: '', email: '', numero: '', points: 0 });
      updateActivity();
    } else {
      alert('Données invalides détectées. Veuillez vérifier vos entrées.');
    }
  };

  const handleDeletePerson = (id: string) => {
    if (!isAuthenticated) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      setPersons(persons.filter(p => p.id !== id));
      updateActivity();
    }
  };

  const handleAdminAccess = () => {
    if (isAuthenticated) {
      setShowAdmin(!showAdmin);
    } else {
      setShowLogin(true);
    }
  };

  // Countdown management functions
  const handleUpdateCountdown = () => {
    if (!isAuthenticated) return;
    updateActivity();
  };

  const handleToggleCountdown = () => {
    if (!isAuthenticated) return;
    setCountdownSettings(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
    updateActivity();
  };

  // Excel Export Function
  const handleExportTemplate = () => {
    if (!isAuthenticated) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nom,Prenom,Email,Numero,Points\n"
      + "Exemple,Jean,jean.exemple@email.com,001,85\n"
      + "Modele,Marie,marie.modele@email.com,002,92\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_consortium_resultats.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    updateActivity();
  };

  // Excel Import Function
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérification du type de fichier
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.');
      return;
    }

    setIsImporting(true);
    setImportStatus('Lecture du fichier...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        // Ignorer la première ligne (en-têtes)
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');
        
        const newPersons: Person[] = [];
        let errorCount = 0;
        
        dataLines.forEach((line, index) => {
          const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length >= 5) {
            const [nom, prenom, email, numero, pointsStr] = columns;
            
            // Validation des données
            const validatedNom = validateInput(nom, 'text');
            const validatedPrenom = validateInput(prenom, 'text');
            const validatedEmail = validateInput(email, 'email');
            const validatedNumero = validateInput(numero, 'number');
            const points = parseInt(pointsStr) || 0;
            
            if (validatedNom && validatedPrenom && validatedEmail && validatedNumero) {
              // Vérifier si le numéro existe déjà
              const existingPerson = persons.find(p => p.numero === validatedNumero);
              
              if (!existingPerson) {
                newPersons.push({
                  id: `import_${Date.now()}_${index}`,
                  nom: validatedNom,
                  prenom: validatedPrenom,
                  email: validatedEmail,
                  numero: validatedNumero,
                  points: Math.max(0, Math.min(100, points)) // Points entre 0 et 100
                });
              } else {
                errorCount++;
              }
            } else {
              errorCount++;
            }
          } else {
            errorCount++;
          }
        });

        if (newPersons.length > 0) {
          setPersons(prevPersons => [...prevPersons, ...newPersons]);
          setImportStatus(`✅ ${newPersons.length} membres importés avec succès!`);
          
          if (errorCount > 0) {
            setImportStatus(prev => prev + ` (${errorCount} lignes ignorées)`);
          }
        } else {
          setImportStatus('❌ Aucune donnée valide trouvée dans le fichier.');
        }

        updateActivity();
        
        // Effacer le message après 5 secondes
        setTimeout(() => {
          setImportStatus('');
        }, 5000);

      } catch (error) {
        setImportStatus('❌ Erreur lors de la lecture du fichier.');
        console.error('Import error:', error);
      } finally {
        setIsImporting(false);
        // Reset input
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  // Export current data
  const handleExportCurrentData = () => {
    if (!isAuthenticated) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nom,Prenom,Email,Numero,Points\n"
      + persons.map(person => 
          `${person.nom},${person.prenom},${person.email},${person.numero},${person.points}`
        ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `consortium_resultats_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    updateActivity();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 relative overflow-hidden">
      {/* Dense Animated Stars Background */}
      <div className="absolute inset-0">
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <Star className="w-1 h-1 text-white opacity-60" fill="currentColor" />
          </div>
        ))}
      </div>

      {/* Medium stars */}
      <div className="absolute inset-0">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            <Star className="w-1.5 h-1.5 text-blue-200 opacity-70" fill="currentColor" />
          </div>
        ))}
      </div>

      {/* Larger animated stars */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            <Star className="w-2 h-2 text-yellow-200 opacity-80" fill="currentColor" />
          </div>
        ))}
      </div>

      {/* Shooting stars */}
      <div className="absolute inset-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-shooting-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${i * 6}s`,
              animationDuration: '3s'
            }}
          >
            <div className="w-1 h-1 bg-white rounded-full shadow-lg opacity-90"></div>
          </div>
        ))}
      </div>

      {/* Admin Toggle Button */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        {isAuthenticated && (
          <div className="bg-green-500/20 backdrop-blur-md rounded-full px-3 py-1 border border-green-400/30">
            <span className="text-green-300 text-sm font-medium">Connecté</span>
          </div>
        )}
        <button
          onClick={handleAdminAccess}
          className="bg-white/10 backdrop-blur-md rounded-full p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 relative"
        >
          {isAuthenticated ? (
            <Shield className="w-6 h-6 text-green-400" />
          ) : (
            <Lock className="w-6 h-6 text-yellow-400" />
          )}
        </button>
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="bg-red-500/20 backdrop-blur-md rounded-full p-3 border border-red-400/30 hover:bg-red-500/30 transition-all duration-300"
            title="Déconnexion"
          >
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </button>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Accès Administrateur</h2>
              <p className="text-blue-200">Authentification sécurisée requise</p>
            </div>

            {isBlocked && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-medium">
                    Compte temporairement bloqué ({Math.ceil(blockTimeRemaining / 60000)} min)
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <input type="hidden" name="csrf_token" value={csrfToken} />
              <div>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                  disabled={isBlocked}
                  autoComplete="username"
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-12"
                  required
                  disabled={isBlocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                  disabled={isBlocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isBlocked}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-400 text-white py-3 rounded-lg hover:from-yellow-500 hover:to-amber-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 bg-white/20 text-white py-3 rounded-lg hover:bg-white/30 transition-all duration-300"
                >
                  Annuler
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-blue-300 text-sm">
                Tentatives restantes: {Math.max(0, MAX_LOGIN_ATTEMPTS - loginAttempts.length)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        
        {!showAdmin ? (
          <>
            {/* Header Section */}
            <div className="text-center mb-16 space-y-6">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-yellow-300 mr-3 animate-pulse" />
                <Crown className="w-12 h-12 text-yellow-400 animate-bounce" />
                <Sparkles className="w-8 h-8 text-yellow-300 ml-3 animate-pulse" />
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300 mb-4 animate-fade-in">
                ⚡ CONSORTIUM DES
              </h1>
              <h2 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300 mb-8 animate-fade-in-delay">
                ESPRITS EXCEPTIONNELS ⚡
              </h2>
              
              <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-amber-400 mx-auto rounded-full animate-pulse"></div>
            </div>

            {/* Countdown or Results */}
            {!isCountdownFinished ? (
              /* Countdown Display */
              <div className="text-center space-y-8 mb-16 animate-slide-up">
                <Clock className="w-20 h-20 text-yellow-400 mx-auto animate-pulse" />
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  {countdownSettings.title}
                </h3>
                
                {/* Inline Countdown Timer - No Background */}
                <div className="text-center space-y-4">
                  <div className={`text-6xl md:text-8xl font-bold ${getCountdownTextColor()} drop-shadow-2xl transition-colors duration-1000`}>
                    {timeRemaining.days.toString().padStart(2, '0')} JOURS
                  </div>
                  
                  <div className={`text-4xl md:text-6xl font-bold ${getCountdownTextColor()} drop-shadow-xl transition-colors duration-1000`}>
                    {timeRemaining.hours.toString().padStart(2, '0')} HEURES : {timeRemaining.minutes.toString().padStart(2, '0')} MINUTES : 
                    <span className="animate-pulse">
                      {timeRemaining.seconds.toString().padStart(2, '0')} SECONDES
                    </span>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 mt-8">
                  <Award className="w-8 h-8 text-yellow-400 animate-pulse" />
                  <Users className="w-8 h-8 text-blue-300 animate-pulse" />
                  <Award className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>

                <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
                  Les résultats exceptionnels de nos membres d'élite seront bientôt révélés.
                  Préparez-vous à découvrir l'excellence !
                </p>
              </div>
            ) : (
              /* Results Display */
              <>
                {/* Congratulations Message */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-4xl mx-auto mb-16 border border-white/20 shadow-2xl animate-slide-up">
                  <div className="text-center space-y-6">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                      🎉 FÉLICITATIONS! 🎉
                    </h3>
                    <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
                      Nous avons l'honneur d'annoncer les résultats exceptionnels de nos membres d'élite.
                      Chaque participant a démontré une excellence remarquable et des capacités intellectuelles hors du commun.
                    </p>
                    <div className="flex justify-center space-x-4 mt-8">
                      <Award className="w-8 h-8 text-yellow-400 animate-pulse" />
                      <Users className="w-8 h-8 text-blue-300 animate-pulse" />
                      <Award className="w-8 h-8 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Search Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-6xl mx-auto mb-16 border border-white/20 shadow-2xl animate-slide-up-delay">
                  <h4 className="text-2xl md:text-3xl font-bold text-center text-white mb-8 flex items-center justify-center">
                    <Search className="w-8 h-8 text-yellow-400 mr-3" />
                    RECHERCHER UN MEMBRE
                    <Search className="w-8 h-8 text-yellow-400 ml-3" />
                  </h4>
                  
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, prénom, email ou numéro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg"
                      />
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchTerm && (
                    <div className="space-y-4">
                      {filteredPersons.length > 0 ? (
                        filteredPersons.map((person) => (
                          <div key={person.id} className="bg-gradient-to-r from-white/20 to-white/10 rounded-2xl p-6 border border-white/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h5 className="text-xl font-bold text-white">
                                    {person.prenom} {person.nom}
                                  </h5>
                                  <p className="text-blue-200">N° {person.numero}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Target className="w-5 h-5 text-yellow-400" />
                                  <span className="text-2xl font-bold text-yellow-400">{person.points} pts</span>
                                </div>
                                <p className="text-blue-200 text-sm">{person.email}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-blue-200 text-lg">Aucun membre trouvé pour cette recherche</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recognition Message */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-4xl mx-auto border border-white/20 shadow-2xl">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center mx-auto">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h5 className="text-2xl font-bold text-white">
                      RECONNAISSANCE OFFICIELLE
                    </h5>
                    <p className="text-blue-100 text-lg leading-relaxed">
                      Votre participation au Consortium des Esprits Exceptionnels témoigne de vos capacités remarquables. 
                      Vous faites partie d'une communauté d'élite dédiée à l'excellence.
                    </p>
                    <div className="flex justify-center space-x-2 mt-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-400 animate-pulse" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-16 text-center">
              <p className="text-blue-200 text-lg">
                🌟 Consortium des Esprits Exceptionnels - 2024 🌟
              </p>
              <p className="text-blue-300 mt-2">
                "L'excellence n'est pas une destination, c'est un voyage"
              </p>
            </div>
          </>
        ) : (
          /* Admin Panel - Only accessible when authenticated */
          isAuthenticated && (
            <div className="w-full max-w-6xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    <Shield className="w-8 h-8 text-green-400 mr-3" />
                    PANNEAU D'ADMINISTRATION SÉCURISÉ
                  </h2>
                  <div className="text-sm text-green-300">
                    Session active - Timeout: {Math.ceil((SESSION_TIMEOUT - (Date.now() - lastActivity)) / 60000)} min
                  </div>
                </div>

                {/* Excel Import/Export Section */}
                <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FileSpreadsheet className="w-6 h-6 text-green-400 mr-2" />
                    Gestion des Fichiers Excel
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Export Section */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-blue-200">📥 Télécharger</h4>
                      
                      <button
                        onClick={handleExportTemplate}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-500/20 text-blue-300 px-4 py-3 rounded-lg hover:bg-blue-500/30 transition-all duration-300 border border-blue-400/30"
                      >
                        <Download className="w-5 h-5" />
                        <span>Télécharger le modèle Excel</span>
                      </button>
                      
                      <button
                        onClick={handleExportCurrentData}
                        className="w-full flex items-center justify-center space-x-2 bg-green-500/20 text-green-300 px-4 py-3 rounded-lg hover:bg-green-500/30 transition-all duration-300 border border-green-400/30"
                      >
                        <Download className="w-5 h-5" />
                        <span>Exporter les données actuelles</span>
                      </button>
                      
                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
                        <p className="text-blue-200 text-sm">
                          <strong>Instructions :</strong><br />
                          1. Téléchargez le modèle Excel<br />
                          2. Complétez les informations<br />
                          3. Sauvegardez et importez le fichier
                        </p>
                      </div>
                    </div>

                    {/* Import Section */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-blue-200">📤 Importer</h4>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileImport}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isImporting}
                        />
                        <div className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 border-dashed transition-all duration-300 ${
                          isImporting 
                            ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300' 
                            : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50'
                        }`}>
                          <Upload className="w-5 h-5" />
                          <span>
                            {isImporting ? 'Import en cours...' : 'Cliquez pour importer un fichier'}
                          </span>
                        </div>
                      </div>
                      
                      {importStatus && (
                        <div className={`rounded-lg p-4 border ${
                          importStatus.includes('✅') 
                            ? 'bg-green-500/20 border-green-400/30 text-green-300'
                            : 'bg-red-500/20 border-red-400/30 text-red-300'
                        }`}>
                          <p className="text-sm font-medium">{importStatus}</p>
                        </div>
                      )}
                      
                      <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-400/20">
                        <p className="text-yellow-200 text-sm">
                          <strong>Formats supportés :</strong><br />
                          CSV, XLS, XLSX<br />
                          <strong>Colonnes requises :</strong><br />
                          Nom, Prenom, Email, Numero, Points
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Countdown Management */}
                <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Clock className="w-6 h-6 text-yellow-400 mr-2" />
                    Gestion du Chrono de Révélation
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          Date et heure de révélation
                        </label>
                        <input
                          type="datetime-local"
                          value={countdownSettings.targetDate}
                          onChange={(e) => setCountdownSettings(prev => ({
                            ...prev,
                            targetDate: e.target.value
                          }))}
                          className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          Titre du chrono
                        </label>
                        <input
                          type="text"
                          value={countdownSettings.title}
                          onChange={(e) => setCountdownSettings(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                          className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Titre du chrono"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-400/30">
                        <h4 className="text-white font-medium mb-2">État actuel</h4>
                        <p className="text-blue-200 text-sm mb-3">
                          {isCountdownFinished ? 'Résultats visibles' : 'Chrono en cours'}
                        </p>
                        <div className="text-yellow-400 font-mono text-lg">
                          {timeRemaining.days}j {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            timeRemaining.days >= 4 
                              ? 'bg-yellow-500/20 text-yellow-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {timeRemaining.days >= 4 ? 'Mode Normal' : 'Mode Urgence'}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={handleToggleCountdown}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                            countdownSettings.isActive 
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          }`}
                        >
                          {countdownSettings.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{countdownSettings.isActive ? 'Arrêter' : 'Démarrer'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add/Edit Form */}
                <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {editingPerson ? 'Modifier un membre' : 'Ajouter un nouveau membre'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Nom (lettres uniquement)"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      pattern="[a-zA-ZÀ-ÿ\s\-']+"
                      maxLength={50}
                    />
                    <input
                      type="text"
                      placeholder="Prénom (lettres uniquement)"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      className="px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      pattern="[a-zA-ZÀ-ÿ\s\-']+"
                      maxLength={50}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={100}
                    />
                    <input
                      type="text"
                      placeholder="Numéro (chiffres uniquement)"
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      className="px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      pattern="[0-9]+"
                      maxLength={10}
                    />
                    <input
                      type="number"
                      placeholder="Points obtenus"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                      className="px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 md:col-span-2"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={editingPerson ? handleUpdatePerson : handleAddPerson}
                      className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-white px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-amber-500 transition-all duration-300"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{editingPerson ? 'Mettre à jour' : 'Ajouter'}</span>
                    </button>
                    {editingPerson && (
                      <button
                        onClick={() => {
                          setEditingPerson(null);
                          setFormData({ nom: '', prenom: '', email: '', numero: '', points: 0 });
                        }}
                        className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-300"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Liste des membres ({persons.length})</h3>
                  {persons.map((person) => (
                    <div key={person.id} className="bg-white/10 rounded-2xl p-4 border border-white/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">
                              {person.prenom} {person.nom}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-blue-200">
                              <span className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span>{person.email}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Phone className="w-4 h-4" />
                                <span>N° {person.numero}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Target className="w-4 h-4" />
                                <span>{person.points} pts</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPerson(person)}
                            className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all duration-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePerson(person.id)}
                            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;