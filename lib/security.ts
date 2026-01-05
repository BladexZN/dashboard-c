// Security module for production environment
// Disables console.log, console.warn, console.info in production
// Keeps console.error for debugging critical issues

const isProduction = import.meta.env.PROD;

export const initSecurity = () => {
  if (isProduction) {
    // Disable console methods in production
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    // Keep console.error for critical issues
  }
};

// Deterministic color generator based on string hash
// Provides consistent colors for the same client name
export const getClientColor = (clientName: string): string => {
  const colors = [
    "bg-blue-900 text-blue-300",
    "bg-green-900 text-green-300",
    "bg-indigo-900 text-indigo-300",
    "bg-pink-900 text-pink-300",
    "bg-teal-900 text-teal-300",
    "bg-purple-900 text-purple-300",
    "bg-amber-900 text-amber-300",
    "bg-cyan-900 text-cyan-300"
  ];

  // Generate deterministic hash from string
  let hash = 0;
  for (let i = 0; i < clientName.length; i++) {
    const char = clientName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return colors[Math.abs(hash) % colors.length];
};
