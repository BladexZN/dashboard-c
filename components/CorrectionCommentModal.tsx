import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springConfig, buttonTap } from '../lib/animations';

interface CorrectionCommentModalProps {
  isOpen: boolean;
  onConfirm: (nota: string) => void;
  onCancel: () => void;
}

const CorrectionCommentModal: React.FC<CorrectionCommentModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const [nota, setNota] = useState('');

  const handleConfirm = () => {
    if (nota.trim()) {
      onConfirm(nota.trim());
      setNota('');
    }
  };

  const handleCancel = () => {
    setNota('');
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
          />

          <motion.div
            className="relative w-full max-w-md mx-4 glass border border-orange-500/30 rounded-2xl shadow-apple-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={springConfig.snappy}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <span className="material-icons-round text-orange-500">edit_note</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nota de Corrección</h3>
                  <p className="text-xs text-muted-dark">Describe los cambios requeridos</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-4">
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Cambiar el color del fondo, ajustar el logo a la derecha..."
                className="w-full h-28 glass-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted-dark focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 apple-transition resize-none"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex justify-end gap-3">
              <motion.button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-muted-dark border border-white/10 rounded-xl hover:bg-white/5 apple-transition"
                whileTap={buttonTap}
              >
                Cancelar
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                disabled={!nota.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 apple-transition shadow-apple disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                whileTap={nota.trim() ? buttonTap : undefined}
              >
                <span className="material-icons-round text-sm">send</span>
                Confirmar Corrección
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CorrectionCommentModal;
