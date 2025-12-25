import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RequestData, RequestStatus } from '../types';
import { springConfig, buttonTap, buttonHover } from '../lib/animations';
import CustomSelect from './CustomSelect';

interface RequestsTableProps {
  requests: RequestData[];
  onStatusChange: (id: string, newStatus: RequestStatus) => void;
  onNewRequest: () => void;
  onEditRequest: (request: RequestData) => void;
  onRowClick: (request: RequestData) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterAdvisor: string;
  setFilterAdvisor: (advisor: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  advisors: string[];
  onDelete: (request: RequestData) => void;
}

const STATUS_OPTIONS: RequestStatus[] = ['Pendiente', 'En Producción', 'Listo', 'Entregado', 'Corrección'];

const RequestsTable: React.FC<RequestsTableProps> = ({
  requests,
  onStatusChange,
  onNewRequest,
  onEditRequest,
  onRowClick,
  filterStatus,
  setFilterStatus,
  filterAdvisor,
  setFilterAdvisor,
  searchQuery,
  setSearchQuery,
  advisors,
  onDelete
}) => {
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);

  const handleStatusClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenStatusDropdown(openStatusDropdown === id ? null : id);
  };

  const handleStatusSelect = (e: React.MouseEvent, id: string, status: RequestStatus) => {
    e.stopPropagation();
    onStatusChange(id, status);
    setOpenStatusDropdown(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, request: RequestData) => {
    e.stopPropagation();
    if (deleteArmedId === request.id) {
      onDelete(request);
      setDeleteArmedId(null);
    } else {
      setDeleteArmedId(request.id);
      setTimeout(() => {
        setDeleteArmedId((current) => current === request.id ? null : current);
      }, 3000);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
        setOpenStatusDropdown(null);
        setDeleteArmedId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <motion.div
      className="glass border border-white/10 rounded-2xl flex flex-col h-full shadow-apple"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfig.gentle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Table Filters/Actions */}
      <div className="p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'Todos', label: 'Todos los estados' },
              ...STATUS_OPTIONS.map(s => ({ value: s, label: s }))
            ]}
            icon="filter_list"
            className="min-w-[160px]"
          />
          <CustomSelect
            value={filterAdvisor}
            onChange={setFilterAdvisor}
            options={[
              { value: 'Todos', label: 'Asesor: Todos' },
              ...advisors.map(a => ({ value: a, label: a }))
            ]}
            className="min-w-[140px]"
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons-round text-muted-dark text-lg">search</span>
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-light text-sm text-text-light dark:text-text-dark rounded-xl pl-9 pr-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-muted-light dark:placeholder-muted-dark apple-transition"
              placeholder="Buscar por folio, cliente..."
              type="text"
            />
          </div>
          <motion.button
            onClick={onNewRequest}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center apple-transition shadow-apple-glow"
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springConfig.snappy}
          >
            <span className="material-icons-round text-lg mr-1">add</span>
            Nueva Solicitud
          </motion.button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-light dark:text-muted-dark bg-white/5">
              <th className="px-6 py-4 font-medium w-12">
                <input className="rounded-lg border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer" type="checkbox"/>
              </th>
              <th className="px-6 py-4 font-medium">Folio</th>
              <th className="px-6 py-4 font-medium">Cliente</th>
              <th className="px-6 py-4 font-medium">Servicio / Tratamiento</th>
              <th className="px-6 py-4 font-medium">Tipo</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Asesor</th>
              <th className="px-6 py-4 font-medium">Fecha</th>
              <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-white/10">
            {requests.length === 0 ? (
               <tr>
                 <td colSpan={9} className="text-center py-8 text-muted-light dark:text-muted-dark">No se encontraron solicitudes</td>
               </tr>
            ) : (
              requests.map((req, idx) => (
                <motion.tr
                  key={req.id}
                  className="hover:bg-white/5 apple-transition group cursor-pointer"
                  onClick={() => onRowClick(req)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig.gentle, delay: idx * 0.02 }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input className="rounded-lg border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer" type="checkbox"/>
                  </td>
                  <td className="px-6 py-4 font-medium text-text-light dark:text-white">{req.id}</td>
                  <td className="px-6 py-4 text-text-light dark:text-gray-300 max-w-[200px]">
                    <div className="flex items-center min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] mr-2 font-bold flex-shrink-0 ${req.clientColor}`}>
                        {req.clientInitials}
                      </div>
                      <span className="truncate" title={req.client}>{req.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-light dark:text-gray-300 max-w-[200px]">
                    <span className="truncate block" title={req.product}>{req.product}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border
                      ${req.type === 'Nueva solicitud' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                      ${req.type === 'Corrección/Añadido' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                      ${req.type === 'Ajuste' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                    `}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <motion.button
                      onClick={(e) => handleStatusClick(e, req.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border apple-transition
                      ${req.status === 'Pendiente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                      ${req.status === 'En Producción' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                      ${req.status === 'Corrección' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                      ${req.status === 'Listo' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                      ${req.status === 'Entregado' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : ''}
                    `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {req.status === 'Pendiente' && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>}
                      {req.status === 'En Producción' && <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5 animate-pulse"></span>}
                      {req.status === 'Corrección' && <span className="material-icons-round text-[10px] mr-1">edit</span>}
                      {req.status === 'Listo' && <span className="material-icons-round text-[10px] mr-1">check</span>}
                      {req.status === 'Entregado' && <span className="material-icons-round text-[10px] mr-1">done_all</span>}
                      {req.status}
                    </motion.button>

                    {/* Status Dropdown */}
                    <AnimatePresence>
                      {openStatusDropdown === req.id && (
                        <motion.div
                          className="absolute z-10 top-full left-0 mt-1 w-40 glass border border-white/10 rounded-xl shadow-apple-lg overflow-hidden"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={springConfig.snappy}
                        >
                          {STATUS_OPTIONS.map((status, statusIdx) => (
                            <motion.button
                              key={status}
                              onClick={(e) => handleStatusSelect(e, req.id, status)}
                              className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 apple-transition ${req.status === status ? 'text-primary font-bold' : 'text-text-light dark:text-text-dark'}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: statusIdx * 0.03 }}
                              whileHover={{ x: 4 }}
                            >
                              {status}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                  <td className="px-6 py-4 text-text-light dark:text-gray-400">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-gray-700 text-[9px] flex items-center justify-center text-white mr-2">{req.advisorInitials}</div>
                      {req.advisor}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-light dark:text-muted-dark text-xs">{req.date}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">

                      {/* 2-Click Delete Button */}
                      <div className="relative">
                        <motion.button
                          onClick={(e) => handleDeleteClick(e, req)}
                          className={`
                            p-2 rounded-full apple-transition flex items-center
                            ${deleteArmedId === req.id
                               ? 'bg-red-500 text-white w-auto px-3 shadow-md'
                               : 'text-muted-light dark:text-muted-dark hover:text-red-500 hover:bg-red-500/10'
                            }
                          `}
                          title={deleteArmedId === req.id ? 'Click para confirmar eliminación' : 'Eliminar solicitud'}
                          whileHover={deleteArmedId !== req.id ? { scale: 1.1 } : {}}
                          whileTap={{ scale: 0.9 }}
                          animate={deleteArmedId === req.id ? { scale: [1, 1.05, 1] } : {}}
                          transition={deleteArmedId === req.id ? { repeat: Infinity, duration: 0.8 } : springConfig.snappy}
                        >
                          <span className="material-icons-round text-lg">
                             {deleteArmedId === req.id ? 'delete_forever' : 'delete'}
                          </span>
                          <AnimatePresence>
                            {deleteArmedId === req.id && (
                              <motion.span
                                className="text-xs font-bold ml-1"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                              >
                                Confirmar
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>

                      <motion.button
                        title="Editar"
                        onClick={(e) => { e.stopPropagation(); onEditRequest(req); }}
                        className="p-2 text-muted-light dark:text-muted-dark hover:text-primary hover:bg-primary/10 rounded-full apple-transition"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="material-icons-round text-lg">edit</span>
                      </motion.button>
                      <motion.button
                        className="p-2 text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-white hover:bg-white/5 rounded-full apple-transition"
                        onClick={(e) => { e.stopPropagation(); onRowClick(req); }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="material-icons-round text-lg">more_vert</span>
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <p className="text-xs text-muted-light dark:text-muted-dark">Mostrando <span className="font-medium text-text-light dark:text-white">{requests.length > 0 ? 1 : 0}</span> a <span className="font-medium text-text-light dark:text-white">{Math.min(5, requests.length)}</span> de <span className="font-medium text-text-light dark:text-white">{requests.length}</span> resultados</p>
        <div className="flex items-center space-x-2">
          <motion.button
            className="p-2 rounded-lg hover:bg-white/5 text-muted-light dark:text-muted-dark disabled:opacity-50 apple-transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="material-icons-round text-sm">chevron_left</span>
          </motion.button>
          <motion.button
            className="px-3 py-1 text-xs rounded-lg bg-primary text-white font-medium shadow-apple-glow"
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            1
          </motion.button>
          <motion.button
            className="px-3 py-1 text-xs rounded-lg hover:bg-white/5 text-muted-light dark:text-muted-dark apple-transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            2
          </motion.button>
          <motion.button
            className="p-2 rounded-lg hover:bg-white/5 text-muted-light dark:text-muted-dark apple-transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="material-icons-round text-sm">chevron_right</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default RequestsTable;
