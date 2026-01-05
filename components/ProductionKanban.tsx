import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RequestData, RequestStatus } from '../types';
import { springConfig, buttonTap } from '../lib/animations';

interface ProductionKanbanProps {
  requests: RequestData[];
  onStatusChange: (id: string, status: RequestStatus) => void;
  onViewDetail: (request: RequestData) => void;
  onEditRequest: (request: RequestData) => void;
  onDelete: (request: RequestData) => void;
}

const SECTIONS: RequestStatus[] = ['Pendiente', 'En Producción', 'Corrección', 'Listo', 'Entregado'];
const ITEMS_PER_SECTION = 12;
const MAX_ANIMATED_ITEMS = 8;

// Memoized KanbanCard component for performance
interface KanbanCardProps {
  req: RequestData;
  idx: number;
  isExactMatch: boolean;
  isDragging: boolean;
  deleteConfirmId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onViewDetail: (request: RequestData) => void;
  onEditRequest: (request: RequestData) => void;
  onDeleteClick: (e: React.MouseEvent, req: RequestData) => void;
  getPriorityColor: (p: string) => string;
}

const KanbanCard = memo<KanbanCardProps>(({
  req, idx, isExactMatch, isDragging, deleteConfirmId,
  onDragStart, onDragEnd, onViewDetail, onEditRequest, onDeleteClick, getPriorityColor
}) => {
  const shouldAnimate = idx < MAX_ANIMATED_ITEMS;

  return (
    <motion.div
      key={req.id}
      draggable
      onDragStart={(e) => onDragStart(e as any, req.id)}
      onDragEnd={onDragEnd}
      onClick={() => onViewDetail(req)}
      className={`
        glass p-5 rounded-2xl border flex flex-col relative overflow-hidden group shadow-apple
        ${isDragging ? 'opacity-40 scale-95 ring-2 ring-primary/50' : 'opacity-100'}
        ${isExactMatch
           ? 'border-primary ring-2 ring-primary shadow-apple-glow z-10'
           : 'border-white/10 hover:border-primary/50 hover:shadow-apple-lg'}
        apple-transition cursor-grab active:cursor-grabbing
      `}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldAnimate ? { ...springConfig.gentle, delay: idx * 0.015 } : { duration: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={buttonTap}
    >
       {/* Accent Line */}
       <div className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(req.priority)} opacity-80`}></div>

       <div className="pl-3">
         <div className="flex justify-between items-start mb-3">
            <span className={`text-xs font-medium ${isExactMatch ? 'text-primary' : 'text-muted-dark'}`}>{req.id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg uppercase font-bold tracking-wider ${
               req.priority === 'Urgente' ? 'text-red-500 bg-red-500/10' : 'text-muted-dark glass-light'
            }`}>{req.priority}</span>
         </div>

         <h4 className="text-base font-bold text-text-light dark:text-white mb-1 leading-snug pr-2 select-none line-clamp-2" title={req.product}>{req.product}</h4>
         <p className="text-sm text-muted-light dark:text-muted-dark mb-5 truncate select-none" title={req.client}>{req.client}</p>

         <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center">
               <div className="w-7 h-7 rounded-full bg-gray-700 text-[10px] flex items-center justify-center text-white mr-2 border-2 border-white/10 ring-1 ring-white/5">
                 {req.advisorInitials}
               </div>
               <span className="text-xs text-muted-dark select-none">{req.date}</span>
            </div>

            <div className="flex items-center space-x-1">
              {/* Edit Button */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); onEditRequest(req); }}
                className="p-1.5 rounded-lg apple-transition text-muted-dark hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100"
                title="Editar solicitud"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="material-icons-round text-lg">edit</span>
              </motion.button>

              {/* Delete Button with double-click confirmation */}
              <motion.button
                onClick={(e) => onDeleteClick(e, req)}
                className={`
                  p-1.5 rounded-lg apple-transition
                  ${deleteConfirmId === req.id
                    ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500 scale-110'
                    : 'text-muted-dark hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'
                  }
                `}
                title={deleteConfirmId === req.id ? '¡Click para confirmar eliminación!' : 'Eliminar solicitud'}
                animate={deleteConfirmId === req.id ? { scale: [1, 1.1, 1] } : {}}
                transition={deleteConfirmId === req.id ? { repeat: Infinity, duration: 0.8 } : springConfig.snappy}
              >
                <span className="material-icons-round text-lg">
                  {deleteConfirmId === req.id ? 'warning' : 'delete_outline'}
                </span>
              </motion.button>
            </div>
         </div>
       </div>
    </motion.div>
  );
});

KanbanCard.displayName = 'KanbanCard';

const ProductionKanban: React.FC<ProductionKanbanProps> = ({ requests, onStatusChange, onViewDetail, onEditRequest, onDelete }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<RequestStatus | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteTimeoutId, setDeleteTimeoutId] = useState<NodeJS.Timeout | null>(null);
  // Pagination state: track how many items to show per section
  const [visibleCounts, setVisibleCounts] = useState<Record<RequestStatus, number>>({
    'Pendiente': ITEMS_PER_SECTION,
    'En Producción': ITEMS_PER_SECTION,
    'Corrección': ITEMS_PER_SECTION,
    'Listo': ITEMS_PER_SECTION,
    'Entregado': ITEMS_PER_SECTION
  });

  const processedRequests = useMemo(() => {
    let filtered = requests;

    if (localSearch.trim()) {
      const query = localSearch.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const folio = r.id.toLowerCase();
        const folioNumber = folio.replace('#req-', '').replace('#', '');
        return folio.includes(query) || folioNumber.includes(query);
      });
    }

    return filtered;
  }, [requests, localSearch]);

  const getPriorityColor = useCallback((p: string) => {
    if (p === 'Alta' || p === 'Urgente') return 'bg-red-500';
    if (p === 'Media') return 'bg-yellow-500';
    return 'bg-green-500';
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedRequestId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedRequestId(null);
    setActiveDropZone(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: RequestStatus) => {
    e.preventDefault();
    setActiveDropZone(status);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: RequestStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");

    if (id) {
       onStatusChange(id, status);
    }

    setDraggedRequestId(null);
    setActiveDropZone(null);
  }, [onStatusChange]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, req: RequestData) => {
    e.stopPropagation();

    if (deleteConfirmId === req.id) {
      if (deleteTimeoutId) {
        clearTimeout(deleteTimeoutId);
        setDeleteTimeoutId(null);
      }
      setDeleteConfirmId(null);
      onDelete(req);
    } else {
      if (deleteTimeoutId) {
        clearTimeout(deleteTimeoutId);
      }
      setDeleteConfirmId(req.id);

      const timeout = setTimeout(() => {
        setDeleteConfirmId(null);
        setDeleteTimeoutId(null);
      }, 3000);
      setDeleteTimeoutId(timeout);
    }
  }, [deleteConfirmId, deleteTimeoutId, onDelete]);

  const handleLoadMore = useCallback((status: RequestStatus) => {
    setVisibleCounts(prev => ({
      ...prev,
      [status]: prev[status] + ITEMS_PER_SECTION
    }));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Search Bar Section */}
      <motion.div
        className="glass border border-white/10 p-6 rounded-2xl shadow-apple"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig.gentle}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h2 className="text-lg font-bold text-text-light dark:text-white">
               Tablero de Diseño
             </h2>
             <p className="text-sm text-muted-light dark:text-muted-dark">Gestiona el flujo de trabajo arrastrando las tarjetas.</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons-round text-muted-dark">search</span>
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar por folio (ej. #REQ-2094)"
              className="w-full glass-light text-sm text-text-light dark:text-white rounded-xl pl-10 pr-4 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 apple-transition placeholder-muted-light dark:placeholder-muted-dark"
            />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {processedRequests.length === 0 ? (
         <motion.div
           className="text-center py-16 glass rounded-2xl border border-white/10 border-dashed"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={springConfig.gentle}
         >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-light mb-4">
              <span className="material-icons-round text-muted-dark text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-medium text-text-light dark:text-white">No se encontró ese folio</h3>
            <p className="text-muted-light dark:text-muted-dark mt-1">Intenta buscar con otro número o verifica el filtro.</p>
         </motion.div>
      ) : (
        <div className="space-y-10">
          {SECTIONS.map((status, sectionIdx) => {
            const sectionRequests = processedRequests.filter(r => r.status === status);
            const isDropZoneActive = activeDropZone === status;

            if (sectionRequests.length === 0 && localSearch && !draggedRequestId) return null;

            return (
              <motion.div
                key={status}
                className={`
                   space-y-4 rounded-2xl apple-transition
                   ${isDropZoneActive ? 'bg-primary/5 ring-2 ring-primary border-transparent p-4 -m-4' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig.gentle, delay: sectionIdx * 0.05 }}
              >
                {/* Section Header */}
                <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                  <div className={`w-3 h-3 rounded-full ${status === 'Listo' ? 'bg-primary' : status === 'En Producción' ? 'bg-purple-500' : status === 'Corrección' ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
                  <h3 className="text-xl font-bold text-text-light dark:text-white">{status}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium glass-light border border-white/10 text-text-light dark:text-muted-dark">
                    {sectionRequests.length}
                  </span>
                </div>

                {/* Grid */}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-[100px] ${isDropZoneActive ? 'opacity-80' : ''}`}>
                  {sectionRequests.slice(0, visibleCounts[status]).map((req, idx) => {
                     const isExactMatch = localSearch && req.id.toLowerCase() === localSearch.toLowerCase();
                     const isDragging = draggedRequestId === req.id;

                     return (
                       <KanbanCard
                         key={req.id}
                         req={req}
                         idx={idx}
                         isExactMatch={isExactMatch}
                         isDragging={isDragging}
                         deleteConfirmId={deleteConfirmId}
                         onDragStart={handleDragStart}
                         onDragEnd={handleDragEnd}
                         onViewDetail={onViewDetail}
                         onEditRequest={onEditRequest}
                         onDeleteClick={handleDeleteClick}
                         getPriorityColor={getPriorityColor}
                       />
                     );
                  })}
                  {sectionRequests.length === 0 && !localSearch && (
                    <div className="col-span-full py-6 flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl opacity-60">
                      <p className="text-xs text-muted-dark pointer-events-none">Arrastra tarjetas aquí</p>
                    </div>
                  )}
                </div>

                {/* Load More Button */}
                {sectionRequests.length > visibleCounts[status] && (
                  <motion.button
                    onClick={() => handleLoadMore(status)}
                    className="w-full mt-4 py-3 glass border border-white/10 rounded-xl text-sm font-medium text-muted-dark hover:text-white hover:border-primary/50 apple-transition flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="material-icons-round text-lg">expand_more</span>
                    <span>Cargar más ({sectionRequests.length - visibleCounts[status]} restantes)</span>
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductionKanban;
