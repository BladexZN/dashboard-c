
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InboxNotification, DateFilter, UserProfile } from '../types';
import { springConfig, buttonTap, buttonHover } from '../lib/animations';
import DatePicker from './DatePicker';

interface HeaderProps {
  title: string;
  subtitle?: string;
  notifications: InboxNotification[];
  unreadCount: number;
  onMarkRead: (id: string, solicitudId?: string) => void;
  onMarkAllRead: () => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  showFilters: boolean;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  dateFilter,
  onDateFilterChange,
  showFilters,
  userProfile,
  onLogout
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isCustomDate = !['Hoy', 'Este Mes', 'Año'].includes(dateFilter);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };

    if (isNotifOpen || isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isNotifOpen, isProfileOpen]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRelativeTime = (dateStr: string) => {
     const date = new Date(dateStr);
     const now = new Date();
     const diffMs = now.getTime() - date.getTime();
     const diffSec = Math.floor(diffMs / 1000);
     const diffMin = Math.floor(diffSec / 60);
     const diffHr = Math.floor(diffMin / 60);
     const diffDays = Math.floor(diffHr / 24);

     if (diffSec < 60) return 'Hace un momento';
     if (diffMin < 60) return `Hace ${diffMin} min`;
     if (diffHr < 24) return `Hace ${diffHr}h`;
     if (diffDays === 1) return 'Ayer';
     return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleCalendarSelect = (date: string) => {
    onDateFilterChange(date);
    setShowCalendar(false);
  };

  const handleNotificationClick = (id: string, solicitudId?: string) => {
    onMarkRead(id, solicitudId);
    setIsNotifOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 glass border-b border-white/10 px-8 py-4 flex items-center justify-between">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={springConfig.gentle}
      >
        <h1 className="text-xl font-bold text-text-light dark:text-white apple-transition">{title}</h1>
        <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">{subtitle || "Sistema de gestión de producción digital"}</p>
      </motion.div>

      <div className="flex items-center space-x-4">
        {showFilters && (
          <motion.div
            className="hidden md:flex items-center glass-light border border-white/10 rounded-xl p-1 space-x-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig.gentle}
          >
            {['Hoy', 'Este Mes', 'Año'].map((filter) => (
              <motion.button
                key={filter}
                onClick={() => onDateFilterChange(filter as DateFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg apple-transition ${dateFilter === filter ? 'bg-primary/20 text-primary shadow-sm' : 'text-text-light dark:text-text-dark hover:bg-white/5'}`}
                whileHover={buttonHover}
                whileTap={buttonTap}
                transition={springConfig.snappy}
              >
                {filter}
              </motion.button>
            ))}

            <div className="w-px h-4 bg-white/10 mx-1"></div>

            <div className="relative">
              <div className="flex items-center">
                <motion.button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-lg apple-transition ${isCustomDate || showCalendar ? 'bg-primary/20 text-primary shadow-sm' : 'text-text-light dark:text-text-dark hover:bg-white/5'}`}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  transition={springConfig.snappy}
                >
                  <span className="material-icons-round text-sm mr-1.5">calendar_today</span>
                  {isCustomDate ? formatDateDisplay(dateFilter) : 'Elegir día'}
                </motion.button>
                {isCustomDate && (
                  <motion.button
                    onClick={() => onDateFilterChange('Hoy')}
                    className="ml-1 p-1 text-muted-dark hover:text-red-500 apple-transition"
                    title="Limpiar filtro"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="material-icons-round text-sm">close</span>
                  </motion.button>
                )}
              </div>

              <DatePicker
                isOpen={showCalendar}
                onClose={() => setShowCalendar(false)}
                selectedDate={isCustomDate ? dateFilter : null}
                onSelect={handleCalendarSelect}
              />
            </div>
          </motion.div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2 rounded-full relative apple-transition ${isNotifOpen ? 'bg-primary/10 text-primary' : 'text-muted-light dark:text-muted-dark hover:bg-white/5'}`}
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springConfig.snappy}
          >
            <span className="material-icons-round text-xl">notifications</span>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-background-light dark:border-background-dark"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={springConfig.bouncy}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-72 glass-darker border border-white/10 rounded-xl shadow-apple-lg z-50 overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={springConfig.snappy}
              >
                <div className="px-3 py-2 border-b border-white/10 flex justify-between items-center bg-black/40">
                  <h3 className="font-semibold text-white text-xs flex items-center">
                    <span className="material-icons-round text-primary mr-1.5 text-sm">notifications</span>
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); onMarkAllRead(); }}
                      className="text-[9px] text-primary hover:text-primary-dark font-bold uppercase tracking-wide"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Marcar todas
                    </motion.button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 text-center"
                    >
                      <span className="material-icons-round text-2xl text-gray-700 mb-1">inbox</span>
                      <p className="text-xs text-muted-dark">Sin notificaciones</p>
                    </motion.div>
                  ) : (
                    notifications.map((n, idx) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: idx * 0.01 }}
                        onClick={() => handleNotificationClick(n.id, n.solicitud_id)}
                        className={`px-2.5 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 apple-transition ${!n.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start">
                          <span className="material-icons-round text-sm text-primary" style={{ marginRight: '-2px' }}>
                            {n.tipo === 'correccion' ? 'error_outline' : n.tipo === 'solicitud_lista' ? 'check_circle' : 'notifications'}
                          </span>
                          <div className="flex-1">
                            <p className={`text-[11px] leading-tight ${!n.is_read ? 'text-white font-medium' : 'text-gray-400'}`}>
                              {n.titulo}
                            </p>
                            <p className="text-[10px] text-muted-dark leading-tight mt-0.5 line-clamp-2">{n.mensaje}</p>
                            <span className="text-[9px] text-gray-500">{getRelativeTime(n.created_at)}</span>
                          </div>
                          {!n.is_read && <span className="w-1.5 h-1.5 bg-primary rounded-full ml-1 mt-1" />}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-3 py-1.5 border-t border-white/10 bg-black/40 text-center">
                    <span className="text-[9px] text-gray-500">
                      Últimas {notifications.length} notificaciones
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
          <motion.button
            className="flex items-center space-x-3 text-left focus:outline-none"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={buttonTap}
            transition={springConfig.snappy}
          >
            {userProfile?.avatar_url ? (
              <img
                alt="User Avatar"
                className="w-8 h-8 rounded-full border border-white/10 object-cover shadow-apple"
                src={userProfile.avatar_url}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs">
                {userProfile?.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <div className="hidden lg:block">
              <p className="text-sm font-medium text-text-light dark:text-white max-w-[150px] truncate">{userProfile?.nombre || 'Cargando...'}</p>
              <p className="text-xs text-muted-light dark:text-muted-dark">{userProfile?.rol || 'Usuario'}</p>
            </div>
            <motion.span
              className="material-icons-round text-muted-dark text-lg hidden lg:block"
              animate={{ rotate: isProfileOpen ? 180 : 0 }}
              transition={springConfig.snappy}
            >
              expand_more
            </motion.span>
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-48 glass border border-white/10 rounded-2xl shadow-apple-lg p-1 z-50 overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={springConfig.snappy}
              >
                 <div className="px-4 py-3 border-b border-white/10 mb-1">
                   <p className="text-sm font-medium text-text-light dark:text-white truncate">{userProfile?.nombre}</p>
                   <p className="text-[10px] text-muted-dark truncate">{userProfile?.email}</p>
                 </div>
                 <motion.button
                   onClick={() => {}}
                   className="w-full text-left px-3 py-2 text-xs text-text-light dark:text-text-dark hover:bg-white/5 rounded-lg flex items-center apple-transition"
                   whileHover={{ x: 4 }}
                   whileTap={buttonTap}
                 >
                    <span className="material-icons-round text-sm mr-2">person</span>
                    Mi Perfil
                 </motion.button>
                 <motion.button
                   onClick={() => {}}
                   className="w-full text-left px-3 py-2 text-xs text-text-light dark:text-text-dark hover:bg-white/5 rounded-lg flex items-center apple-transition"
                   whileHover={{ x: 4 }}
                   whileTap={buttonTap}
                 >
                    <span className="material-icons-round text-sm mr-2">settings</span>
                    Configuración
                 </motion.button>
                 <div className="h-px bg-white/10 my-1"></div>
                 <motion.button
                   onClick={onLogout}
                   className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg flex items-center apple-transition"
                   whileHover={{ x: 4 }}
                   whileTap={buttonTap}
                 >
                    <span className="material-icons-round text-sm mr-2">logout</span>
                    Cerrar Sesión
                 </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
