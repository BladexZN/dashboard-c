import React from 'react';
import { motion } from 'framer-motion';
import { springConfig } from '../lib/animations';

interface StatsRowProps {
  stats: {
    total: number;
    pending: number;
    production: number;
    completed: number;
  };
  loading?: boolean;
}

const StatsRow: React.FC<StatsRowProps> = ({ stats, loading }) => {
  const data = [
    {
      title: "Total Solicitudes",
      value: stats.total,
      icon: "folder_open",
      colorClass: "text-primary",
      bgClass: "bg-primary/10 group-hover:bg-primary"
    },
    {
      title: "Pendientes",
      value: stats.pending,
      icon: "hourglass_empty",
      colorClass: "text-yellow-500",
      bgClass: "bg-yellow-500/10 group-hover:bg-yellow-500"
    },
    {
      title: "En Producción",
      value: stats.production,
      icon: "precision_manufacturing",
      colorClass: "text-purple-500",
      bgClass: "bg-purple-500/10 group-hover:bg-purple-500"
    },
    {
      title: "Entregado",
      value: stats.completed,
      icon: "check_circle",
      colorClass: "text-green-500",
      bgClass: "bg-green-500/10 group-hover:bg-green-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((stat, index) => (
        <motion.div
          key={index}
          className="glass border border-white/10 rounded-2xl p-5 flex items-center space-x-4 cursor-default group shadow-apple"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig.gentle, delay: index * 0.05 }}
          whileHover={{
            scale: 1.02,
            y: -2,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
          }}
        >
          <motion.div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${stat.bgClass} ${stat.colorClass} group-hover:text-white`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springConfig.bouncy}
          >
            <span className="material-icons-round">{stat.icon}</span>
          </motion.div>
          <div className="flex-1">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 w-16 glass-light rounded-lg animate-pulse"></div>
                <div className="h-3 w-24 glass-light rounded-lg animate-pulse"></div>
              </div>
            ) : (
              <>
                <motion.p
                  className="text-2xl font-bold text-text-light dark:text-white"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...springConfig.bouncy, delay: index * 0.05 + 0.2 }}
                >
                  {stat.value}
                </motion.p>
                <p className="text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider">{stat.title}</p>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsRow;
