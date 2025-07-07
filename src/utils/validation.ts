// Utilitaires de validation sécurisée
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
  return nameRegex.test(name);
};

export const validateNumber = (number: string): boolean => {
  const numberRegex = /^[0-9]{1,10}$/;
  return numberRegex.test(number);
};

export const validatePoints = (points: number): boolean => {
  return Number.isInteger(points) && points >= 0 && points <= 100;
};

export const validateCSVData = (data: string[]): boolean => {
  if (data.length < 5) return false;
  
  const [nom, prenom, email, numero, pointsStr] = data;
  const points = parseInt(pointsStr) || 0;
  
  return (
    validateName(nom) &&
    validateName(prenom) &&
    validateEmail(email) &&
    validateNumber(numero) &&
    validatePoints(points)
  );
};