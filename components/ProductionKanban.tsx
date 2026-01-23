import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RequestData, RequestStatus, RequestType } from '../types';
import { springConfig, buttonTap } from '../lib/animations';

interface ProductionKanbanProps {
  requests: RequestData[];
  onStatusChange: (id: string, status: RequestStatus) => void;
  onViewDetail: (request: RequestData) => void;
  onEditRequest: (request: RequestData) => void;
  onDelete: (request: RequestData) => void;
  loading?: boolean;
}

const COLUMNS: RequestStatus[] = ['Pendiente', 'En Producción', 'Corrección', 'Entregado'];
const ITEMS_PER_COLUMN = 12;
const LOAD_MORE_INCREMENT = 12;
const MAX_ANIMATED_ITEMS = 8;

// Colores por tipo de solicitud
const TYPE_COLORS: Record<RequestType, { bg: string; border: string; text: string; line: string }> = {
  'Nueva solicitud': { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', line: 'bg-green-500' },
  'Corrección/Añadido': { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', line: 'bg-orange-500' },
  'Ajuste': { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', line: 'bg-blue-500' },
};

// Estilos de columna por estado
const getColumnStyles = (status: RequestStatus) => {
  switch (status) {
    case 'Pendiente':
      return { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', header: 'bg-yellow-500/10', dot: 'bg-yellow-500' };
    case 'En Producción':
      return { bg: 'bg-purple-500/5', border: 'border-purple-500/20', header: 'bg-purple-500/10', dot: 'bg-purple-500' };
    case 'Corrección':
      return { bg: 'bg-orange-500/5', border: 'border-orange-500/20', header: 'bg-orange-500/10', dot: 'bg-orange-500' };
    case 'Entregado':
      return { bg: 'bg-green-500/5', border: 'border-green-500/20', header: 'bg-green-500/10', dot: 'bg-green-500' };
    default:
      return { bg: 'bg-white/5', border: 'border-white/10', header: 'bg-white/5', dot: 'bg-gray-500' };
  }
};

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
}

const KanbanCard = memo<KanbanCardProps>(({
  req, idx, isExactMatch, isDragging, deleteConfirmId,
  onDragStart, onDragEnd, onViewDetail, onEditRequest, onDeleteClick
}) => {
  const shouldAnimate = idx < MAX_ANIMATED_ITEMS;
  const typeColors = TYPE_COLORS[req.type] || TYPE_COLORS['Nueva solicitud'];

  return (
    <motion.div
      layout
      key={req.id}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
      transition={shouldAnimate ? springConfig.snappy : { duration: 0.1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      draggable
      onDragStart={(e) => onDragStart(e as any, req.id)}
      onDragEnd={onDragEnd}
      onClick={() => onViewDetail(req)}
      className={`
        relative p-3 rounded-xl border select-none cursor-grab active:cursor-grabbing group
        ${isDragging
          ? 'opacity-60 scale-[1.02] border-primary shadow-apple-glow bg-white/5 z-50 ring-1 ring-primary'
          : 'glass border-white/10 hover:border-primary/40 hover:shadow-apple'}
        ${isExactMatch ? 'border-primary ring-2 ring-primary shadow-apple-glow z-10' : ''}
      `}
    >
      {/* Top Row: Client Label */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate max-w-[180px]">
          {req.client}
        </span>
        <span className="text-[10px] text-gray-600">
          {req.id.replace('#REQ-', '')}
        </span>
      </div>

      {/* Main Title */}
      <h4 className="text-sm font-bold text-white mb-2 leading-snug relative z-10 line-clamp-2" title={req.product}>
        {req.product}
      </h4>

      {/* Badges Row */}
      <div className="flex flex-wrap gap-1.5 mb-2 relative z-10">
        {/* Type Badge */}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
          {req.type}
        </span>
        {/* Priority Badge - only show if high/urgent */}
        {(req.priority === 'Alta' || req.priority === 'Urgente') && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
            {req.priority}
          </span>
        )}
      </div>

      {/* Bottom Row: User & Date */}
      <div className="flex items-center justify-between border-t border-white/10 pt-2 relative z-10">
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center text-[9px] text-primary font-bold shadow-sm">
            {req.advisorInitials}
          </div>
          <span className="text-[10px] font-bold text-gray-400 truncate max-w-[70px]">
            {req.advisor?.split(' ')[0] || ''}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            <span className="text-[9px] text-gray-400">
              {req.date}
            </span>
          </div>
          {/* Action buttons on hover */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); onEditRequest(req); }}
            className="p-1 rounded-lg apple-transition text-muted-dark hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100"
            title="Editar"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="material-icons-round text-xs">edit</span>
          </motion.button>
          <motion.button
            onClick={(e) => onDeleteClick(e, req)}
            className={`p-1 rounded-lg apple-transition ${deleteConfirmId === req.id
              ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500'
              : 'text-muted-dark hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'
            }`}
            title={deleteConfirmId === req.id ? '¡Confirmar!' : 'Eliminar'}
          >
            <span className="material-icons-round text-xs">
              {deleteConfirmId === req.id ? 'warning' : 'delete'}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

KanbanCard.displayName = 'KanbanCard';

const ProductionKanban: React.FC<ProductionKanbanProps> = ({ requests, onStatusChange, onViewDetail, onEditRequest, onDelete, loading = false }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<RequestStatus | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteTimeoutId, setDeleteTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track how many items to show per column
  const [columnLimits, setColumnLimits] = useState<Record<RequestStatus, number>>({
    'Pendiente': ITEMS_PER_COLUMN,
    'En Producción': ITEMS_PER_COLUMN,
    'Corrección': ITEMS_PER_COLUMN,
    'Entregado': ITEMS_PER_COLUMN,
  });

  const processedRequests = useMemo(() => {
    let filtered = requests;

    if (localSearch.trim()) {
      const query = localSearch.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const folio = r.id.toLowerCase();
        const folioNumber = folio.replace('#req-', '').replace('#', '');
        const client = (r.client || '').toLowerCase();
        const product = (r.product || '').toLowerCase();
        return folio.includes(query) || folioNumber.includes(query) || client.includes(query) || product.includes(query);
      });
    }

    return filtered;
  }, [requests, localSearch]);

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
    setActiveDropZone(prev => prev !== status ? status : prev);
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
    setColumnLimits(prev => ({
      ...prev,
      [status]: prev[status] + LOAD_MORE_INCREMENT
    }));
  }, []);

  // Skeleton Loading Component
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full"
      >
        <div className="glass border border-white/10 p-5 rounded-2xl shadow-apple mb-6 animate-pulse">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-6 w-40 bg-white/10 rounded-lg mb-2"></div>
              <div className="h-4 w-56 bg-white/5 rounded-lg"></div>
            </div>
            <div className="h-10 w-64 bg-white/10 rounded-xl"></div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full gap-5 px-1">
            {COLUMNS.map((status) => (
              <div key={status} className="min-w-[300px] max-w-[320px] rounded-2xl border border-white/10 bg-white/5 animate-pulse">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                      <div className="h-4 w-24 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-5 w-8 bg-white/10 rounded-full"></div>
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass p-4 rounded-2xl border border-white/10">
                      <div className="h-4 w-20 bg-white/10 rounded mb-3"></div>
                      <div className="h-5 w-full bg-white/10 rounded mb-2"></div>
                      <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springConfig.gentle}
      className="flex flex-col h-full"
    >
      {/* Search Bar Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig.snappy}
        className="glass border border-white/10 p-5 rounded-2xl shadow-apple mb-6 flex-shrink-0"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-icons-round text-primary">view_kanban</span>
              Tablero Kanban
            </h2>
            <p className="text-sm text-muted-dark">
              Gestión visual de diseños por estado.
              {processedRequests.length > 0 && (
                <span className="ml-2 text-primary">({processedRequests.length} solicitudes)</span>
              )}
            </p>
          </div>
          <div className="relative w-full md:max-w-md group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons-round text-muted-dark group-focus-within:text-primary apple-transition">search</span>
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar cliente, producto o folio..."
              className="w-full glass border border-white/10 text-sm text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 apple-transition placeholder-muted-dark"
            />
          </div>
        </div>
      </motion.div>

      {/* Kanban Board - Layout Horizontal */}
      {processedRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 glass border border-white/10 border-dashed rounded-2xl"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
            <span className="material-icons-round text-muted-dark text-3xl">search_off</span>
          </div>
          <h3 className="text-lg font-bold text-white">No se encontraron solicitudes</h3>
          <p className="text-muted-dark mt-1">Intenta buscar con otro término o verifica el filtro.</p>
        </motion.div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden pb-4"
        >
          {/* Contenedor horizontal de columnas */}
          <div className="flex h-full gap-5 min-w-[1400px] px-1">
            {COLUMNS.map((status, colIdx) => {
              const allColumnRequests = processedRequests.filter(r => r.status === status);
              const currentLimit = columnLimits[status];
              const columnRequests = allColumnRequests.slice(0, currentLimit);
              const hasMore = allColumnRequests.length > currentLimit;
              const remainingCount = allColumnRequests.length - currentLimit;
              const isDropZoneActive = activeDropZone === status;
              const colStyles = getColumnStyles(status);

              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig.gentle, delay: colIdx * 0.05 }}
                  className={`
                    flex flex-col h-full w-full min-w-[300px] max-w-[320px] rounded-2xl border
                    ${isDropZoneActive
                      ? `${colStyles.bg} border-2 ${colStyles.border} ring-2 ring-primary/30`
                      : `${colStyles.bg} ${colStyles.border}`
                    }
                    apple-transition
                  `}
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  {/* Column Header - Sticky */}
                  <div className={`sticky top-0 z-10 px-4 py-3 rounded-t-2xl ${colStyles.header} border-b ${colStyles.border} backdrop-blur-sm`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className={`w-2.5 h-2.5 rounded-full ${colStyles.dot}`}
                        />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">{status}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold glass border border-white/10 text-white">
                        {allColumnRequests.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    <AnimatePresence mode="popLayout">
                      {columnRequests.map((req, idx) => {
                        const isExactMatch = localSearch && req.id.toLowerCase() === localSearch.toLowerCase();
                        const isDragging = draggedRequestId === req.id;

                        return (
                          <KanbanCard
                            key={req.id}
                            req={req}
                            idx={idx}
                            isExactMatch={!!isExactMatch}
                            isDragging={isDragging}
                            deleteConfirmId={deleteConfirmId}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onViewDetail={onViewDetail}
                            onEditRequest={onEditRequest}
                            onDeleteClick={handleDeleteClick}
                          />
                        );
                      })}
                    </AnimatePresence>

                    {columnRequests.length === 0 && !localSearch && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl"
                      >
                        <span className="material-icons-round text-muted-dark text-2xl mb-2">drag_indicator</span>
                        <p className="text-xs text-muted-dark text-center">Arrastra tarjetas aquí</p>
                      </motion.div>
                    )}

                    {/* Load More Button */}
                    {hasMore && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pt-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={buttonTap}
                          onClick={() => handleLoadMore(status)}
                          className="w-full px-4 py-2 glass border border-white/10 rounded-xl text-xs font-medium text-white hover:bg-white/5 hover:border-primary/30 apple-transition flex items-center justify-center gap-1"
                        >
                          <span className="material-icons-round text-sm">expand_more</span>
                          Cargar más ({remainingCount})
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default memo(ProductionKanban);
