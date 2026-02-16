import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page } from '../types';
import { springConfig, buttonTap } from '../lib/animations';

// Board-to-designer mapping: each designer only sees their assigned board
const DESIGNER_BOARD_MAP: Record<string, number> = {
  'yessica@digitaldc.com': 1,
  'ramondesign@digitaldc.com': 2,
};

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  activeBoard: number;
  onBoardChange: (board: number) => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, activeBoard, onBoardChange, userEmail }) => {
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);

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

        {/* Tablero de Diseño with board dropdown */}
        <div>
          <motion.div
            onClick={() => setBoardMenuOpen(!boardMenuOpen)}
            className={navItemClass('produccion')}
            whileHover={{ x: 4 }}
            whileTap={buttonTap}
            transition={springConfig.snappy}
          >
            <span className="material-icons-round mr-3 text-lg">brush</span>
            <span className="flex-1">Tablero de Diseño</span>
            <motion.span
              className="material-icons-round text-base"
              animate={{ rotate: boardMenuOpen ? 180 : 0 }}
              transition={springConfig.snappy}
            >
              expand_more
            </motion.span>
          </motion.div>

          <AnimatePresence>
            {boardMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-6 pl-3 border-l border-white/10 mt-1 space-y-0.5">
                  {([1, 2].filter(board => {
                    if (!userEmail) return true;
                    const assignedBoard = DESIGNER_BOARD_MAP[userEmail.toLowerCase()];
                    return assignedBoard == null || assignedBoard === board;
                  })).map(board => (
                    <motion.div
                      key={board}
                      onClick={() => { onBoardChange(board); onNavigate('produccion'); }}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer apple-transition ${
                        currentPage === 'produccion' && activeBoard === board
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-dark hover:bg-white/5 hover:text-white'
                      }`}
                      whileHover={{ x: 3 }}
                      whileTap={buttonTap}
                      transition={springConfig.snappy}
                    >
                      <span className="material-icons-round mr-2 text-sm">dashboard</span>
                      Tablero {board}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
