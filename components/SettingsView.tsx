import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { DBNotificationLog, RequestData, AppSettings } from '../types';
import { springConfig, buttonTap } from '../lib/animations';

interface SettingsViewProps {
  requests?: RequestData[];
  settings: AppSettings;
  onToggle: (key: keyof AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ requests = [], settings, onToggle }) => {
  const [notificationLogs, setNotificationLogs] = useState<DBNotificationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('notificaciones_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotificationLogs(data as any);
      }
      setLoadingLogs(false);
    };
    fetchLogs();
  }, []);

  const getRequestFolio = (uuid: string) => {
    const req = requests.find(r => r.uuid === uuid);
    return req ? req.id : '...';
  };

  return (
    <div className="max-w-4xl space-y-8">

      {/* General Settings */}
      <motion.div
        className="glass border border-white/10 rounded-2xl divide-y divide-white/10 shadow-apple"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig.gentle}
      >
        <div className="p-6">
           <h2 className="text-xl font-bold text-text-light dark:text-white mb-2">Preferencias</h2>
           <p className="text-sm text-muted-dark">Configura el comportamiento general del sistema.</p>
        </div>

        <motion.div
          className="p-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springConfig.gentle, delay: 0.1 }}
        >
          <div>
            <h3 className="text-sm font-medium text-text-light dark:text-white">Notificar a Producción</h3>
            <p className="text-xs text-muted-dark mt-1">Enviar alerta al inbox cuando se cree una nueva solicitud.</p>
          </div>
          <motion.button
            onClick={() => onToggle('notifyProduction')}
            className={`w-11 h-6 rounded-full apple-transition relative ${settings.notifyProduction ? 'bg-primary shadow-apple-glow' : 'bg-gray-600'}`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              animate={{ left: settings.notifyProduction ? 24 : 4 }}
              transition={springConfig.snappy}
            />
          </motion.button>
        </motion.div>

        <motion.div
          className="p-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springConfig.gentle, delay: 0.15 }}
        >
          <div>
            <h3 className="text-sm font-medium text-text-light dark:text-white">Notificar a Asesor</h3>
            <p className="text-xs text-muted-dark mt-1">Enviar alerta al inbox del asesor cuando una solicitud pase a estado "Listo".</p>
          </div>
          <motion.button
            onClick={() => onToggle('notifyAdvisor')}
            className={`w-11 h-6 rounded-full apple-transition relative ${settings.notifyAdvisor ? 'bg-primary shadow-apple-glow' : 'bg-gray-600'}`}
            whileTap={{ scale: 0.95 }}
          >
             <motion.span
               className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
               animate={{ left: settings.notifyAdvisor ? 24 : 4 }}
               transition={springConfig.snappy}
             />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Notification Logs Viewer */}
      <motion.div
        className="glass border border-white/10 rounded-2xl overflow-hidden shadow-apple"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig.gentle, delay: 0.1 }}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
           <div>
             <h2 className="text-lg font-bold text-text-light dark:text-white">Historial de Notificaciones (Debug)</h2>
             <p className="text-xs text-muted-dark mt-1">Registro de eventos de notificaciones enviados por el sistema.</p>
           </div>
           <motion.button
             onClick={() => {
               setLoadingLogs(true);
               supabase.from('notificaciones_logs').select('*').order('timestamp', {ascending: false}).limit(20)
                 .then(({data}) => {
                   if (data) setNotificationLogs(data as any);
                   setLoadingLogs(false);
                 });
             }}
             className="p-2 hover:bg-white/5 rounded-xl text-muted-dark apple-transition"
             title="Recargar logs"
             whileHover={{ scale: 1.1 }}
             whileTap={buttonTap}
           >
             <span className={`material-icons-round ${loadingLogs ? 'animate-spin' : ''}`}>refresh</span>
           </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase text-muted-light dark:text-muted-dark font-medium">
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Evento</th>
                <th className="px-6 py-3">Folio</th>
                <th className="px-6 py-3">Destinatario</th>
                <th className="px-6 py-3">Canal</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
               {loadingLogs && notificationLogs.length === 0 ? (
                 <tr><td colSpan={6} className="p-6 text-center text-muted-dark">Cargando...</td></tr>
               ) : notificationLogs.length === 0 ? (
                 <tr><td colSpan={6} className="p-6 text-center text-muted-dark">Sin registros recientes.</td></tr>
               ) : (
                 notificationLogs.map((log, idx) => (
                   <motion.tr
                     key={log.id}
                     className="hover:bg-white/5 apple-transition"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ ...springConfig.gentle, delay: idx * 0.02 }}
                   >
                     <td className="px-6 py-3 text-xs text-muted-dark">
                       {new Date(log.timestamp).toLocaleString()}
                     </td>
                     <td className="px-6 py-3 text-text-light dark:text-white font-medium">{log.tipo}</td>
                     <td className="px-6 py-3 text-primary text-xs">{getRequestFolio(log.solicitud_id)}</td>
                     <td className="px-6 py-3 text-text-light dark:text-gray-300">{log.destinatario}</td>
                     <td className="px-6 py-3 text-xs uppercase text-muted-dark">{log.canal}</td>
                     <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase
                           ${log.status === 'sent' ? 'bg-primary/10 text-primary' :
                             log.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-400'}
                        `}>
                          {log.status}
                        </span>
                     </td>
                   </motion.tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
};

export default SettingsView;
