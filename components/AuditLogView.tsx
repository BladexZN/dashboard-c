import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditLogEntry, RequestData } from '../types';
import { springConfig, buttonTap, buttonHover } from '../lib/animations';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  deletedRequests?: RequestData[];
  onRestore?: (id: string) => void;
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, deletedRequests = [], onRestore }) => {
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'trash'>('history');

  const filteredLogs = useMemo(() => {
    return logs.filter(log =>
      log.folio.toLowerCase().includes(filterText.toLowerCase()) ||
      log.status.toLowerCase().includes(filterText.toLowerCase()) ||
      log.user.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [logs, filterText]);

  const filteredTrash = useMemo(() => {
    return deletedRequests.filter(req =>
       req.id.toLowerCase().includes(filterText.toLowerCase()) ||
       req.client.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [deletedRequests, filterText]);

  const handleExportCSV = () => {
    if (activeTab === 'history') {
      const headers = ["Fecha", "Folio", "Usuario", "Estado", "Acción"];
      const rows = filteredLogs.map(log => [
        log.displayTime,
        log.folio,
        log.user,
        log.status,
        log.action
      ]);

      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "bitacora_digital_dc.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig.gentle}
      >
        <h2 className="text-xl font-bold text-text-light dark:text-white">Bitácora del Sistema</h2>
        <div className="flex space-x-3">
           <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={activeTab === 'history' ? "Buscar en bitácora..." : "Buscar en papelera..."}
              className="glass-light border border-white/10 rounded-xl px-3 py-2 text-sm text-text-light dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none apple-transition"
           />
           {activeTab === 'history' && (
             <motion.button
               onClick={handleExportCSV}
               className="flex items-center px-4 py-2 glass border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 apple-transition shadow-apple"
               whileHover={buttonHover}
               whileTap={buttonTap}
             >
               <span className="material-icons-round mr-2 text-base">download</span>
               Exportar CSV
             </motion.button>
           )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex space-x-1 border-b border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...springConfig.gentle, delay: 0.1 }}
      >
        <motion.button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 apple-transition flex items-center ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-dark hover:text-text-light dark:hover:text-white'}`}
          whileTap={buttonTap}
        >
          <span className="material-icons-round mr-2 text-base">history</span>
          Historial de Cambios
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('trash')}
          className={`px-4 py-2 text-sm font-medium border-b-2 apple-transition flex items-center ${activeTab === 'trash' ? 'border-red-500 text-red-500' : 'border-transparent text-muted-dark hover:text-red-400'}`}
          whileTap={buttonTap}
        >
          <span className="material-icons-round mr-2 text-base">delete_outline</span>
          Solicitudes Eliminadas (Papelera)
        </motion.button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'history' ? (
          <motion.div
            key="history"
            className="glass border border-white/10 rounded-2xl overflow-hidden shadow-apple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springConfig.gentle}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-xs uppercase text-muted-light dark:text-muted-dark font-medium">
                    <th className="px-6 py-4">Fecha / Hora</th>
                    <th className="px-6 py-4">Folio</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Detalle Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm">
                  {filteredLogs.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="text-center py-8 text-muted-dark">No hay registros de actividad.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <motion.tr
                        key={log.id}
                        className="hover:bg-white/5 apple-transition"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springConfig.gentle, delay: idx * 0.02 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-text-light dark:text-gray-300 text-xs">{log.displayTime}</td>
                        <td className="px-6 py-4 font-medium text-primary">{log.folio}</td>
                        <td className="px-6 py-4 text-text-light dark:text-white">{log.user}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border
                            ${log.status === 'Pendiente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                            ${log.status === 'En Producción' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                            ${log.status === 'Corrección' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                            ${log.status === 'Entregado' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                          `}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-light dark:text-muted-dark text-xs">
                           {log.action}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="trash"
            className="glass border border-white/10 rounded-2xl overflow-hidden shadow-apple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springConfig.gentle}
          >
             <div className="bg-red-500/5 p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center text-red-500 text-sm">
                   <span className="material-icons-round mr-2">delete</span>
                   <span>Mostrando solicitudes eliminadas. Puedes restaurarlas para que vuelvan al tablero.</span>
                </div>
             </div>
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-xs uppercase text-muted-light dark:text-muted-dark font-medium">
                    <th className="px-6 py-4">Folio</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Servicio</th>
                    <th className="px-6 py-4">Eliminado Por</th>
                    <th className="px-6 py-4">Fecha Eliminación</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm">
                  {filteredTrash.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="text-center py-12 text-muted-dark">
                          <span className="material-icons-round text-3xl mb-2 block opacity-30">delete_sweep</span>
                          Papelera vacía
                       </td>
                    </tr>
                  ) : (
                    filteredTrash.map((req, idx) => (
                      <motion.tr
                        key={req.id}
                        className="hover:bg-red-500/5 apple-transition group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springConfig.gentle, delay: idx * 0.02 }}
                      >
                        <td className="px-6 py-4 font-medium text-text-light dark:text-white">{req.id}</td>
                        <td className="px-6 py-4 text-text-light dark:text-gray-300 max-w-[180px]">
                          <span className="truncate block" title={req.client}>{req.client}</span>
                        </td>
                        <td className="px-6 py-4 text-text-light dark:text-gray-300 max-w-[180px]">
                          <span className="truncate block" title={req.product}>{req.product}</span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center text-xs glass-light rounded-lg px-2 py-1 w-fit border border-white/10">
                              <span className="material-icons-round text-sm mr-1 text-muted-dark">person</span>
                              {req.deleted_by}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-muted-light dark:text-muted-dark text-xs">
                           {req.deleted_at ? new Date(req.deleted_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <motion.button
                             onClick={() => onRestore && onRestore(req.uuid)}
                             className="inline-flex items-center px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-medium apple-transition border border-primary/20"
                             whileHover={buttonHover}
                             whileTap={buttonTap}
                           >
                              <span className="material-icons-round mr-1.5 text-sm">restore_from_trash</span>
                              Restaurar
                           </motion.button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogView;
