import React from 'react';
import { motion } from 'framer-motion';
import { Page } from '../types';
import { springConfig, buttonTap } from '../lib/animations';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {

  const navItemClass = (page: Page) =>
    `flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
      currentPage === page
        ? 'glass text-primary shadow-apple'
        : 'text-muted-light dark:text-muted-dark hover:bg-white/5 hover:text-text-light dark:hover:text-text-dark'
    }`;

  return (
    <aside className="w-72 glass border-r border-white/10 flex flex-col flex-shrink-0 h-full">
      <motion.div
        className="p-6 flex items-center space-x-3 cursor-pointer"
        onClick={() => onNavigate('dashboard')}
        whileHover={{ scale: 1.02 }}
        whileTap={buttonTap}
        transition={springConfig.snappy}
      >
        <div className="w-10 h-10 flex-shrink-0 glass rounded-xl flex items-center justify-center border border-white/10 overflow-hidden shadow-apple">
          <img src="https://i.imgur.com/fJgCqFA.png" alt="DC Digital Logo" className="w-full h-full object-contain p-1" />
        </div>
        <span className="text-sm font-bold tracking-tight text-text-light dark:text-white leading-tight">
          Digital DC<br/>Dashboard Production
        </span>
      </motion.div>

      <div className="px-4 mb-4">
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons-round text-muted-dark text-lg group-focus-within:text-primary transition-colors">search</span>
          </span>
          <input
            className="w-full glass-light text-sm text-text-light dark:text-text-dark rounded-xl pl-9 pr-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-light dark:placeholder-muted-dark apple-transition"
            placeholder="Buscar..."
            type="text"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <motion.div
          onClick={() => onNavigate('dashboard')}
          className={navItemClass('dashboard')}
          whileHover={{ x: 4 }}
          whileTap={buttonTap}
          transition={springConfig.snappy}
        >
          <span className="material-icons-round mr-3 text-lg">dashboard</span>
          Dashboard
        </motion.div>
        <motion.div
          onClick={() => onNavigate('solicitudes')}
          className={navItemClass('solicitudes')}
          whileHover={{ x: 4 }}
          whileTap={buttonTap}
          transition={springConfig.snappy}
        >
          <span className="material-icons-round mr-3 text-lg">assignment</span>
          Solicitudes
        </motion.div>

        <motion.div
          onClick={() => onNavigate('produccion')}
          className={navItemClass('produccion')}
          whileHover={{ x: 4 }}
          whileTap={buttonTap}
          transition={springConfig.snappy}
        >
          <span className="material-icons-round mr-3 text-lg">brush</span>
          Tablero de Diseño
        </motion.div>

        <motion.div
          onClick={() => onNavigate('bitacora')}
          className={navItemClass('bitacora')}
          whileHover={{ x: 4 }}
          whileTap={buttonTap}
          transition={springConfig.snappy}
        >
          <span className="material-icons-round mr-3 text-lg">history_edu</span>
          Bitácora
        </motion.div>
        <motion.div
          onClick={() => onNavigate('reportes')}
          className={navItemClass('reportes')}
          whileHover={{ x: 4 }}
          whileTap={buttonTap}
          transition={springConfig.snappy}
        >
          <span className="material-icons-round mr-3 text-lg">bar_chart</span>
          Reportes
        </motion.div>
        <motion.div
          onClick={() => onNavigate('usuarios')}
          className={navItemClass('usuarios')}
          whileHover={{ x: 4 }}
          whileTap={buttonTap}
          transition={springConfig.snappy}
        >
          <span className="material-icons-round mr-3 text-lg">people</span>
          Usuarios
        </motion.div>
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <motion.div
          onClick={() => onNavigate('configuracion')}
          className={navItemClass('configuracion')}
          whileHover={{ x: 4 }}
          whileTap={buttonTap}
          transition={springConfig.snappy}
        >
          <span className="material-icons-round mr-3 text-lg">settings</span>
          Configuración
        </motion.div>
      </div>
    </aside>
  );
};

export default Sidebar;
