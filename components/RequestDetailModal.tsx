import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { RequestData, Attachment, FinalDesign } from '../types';
import { springConfig, buttonTap, buttonHover } from '../lib/animations';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestData | null;
  onRefresh?: () => void;
}

interface DetailState {
  folio: string;
  cliente: string;
  producto: string;
  tipo: string;
  asesor_nombre: string;
  fecha_creacion: string;
  descripcion: string;
  escaleta_video: string;
  material_descargable: string[];
  attachments: Attachment[];
  final_design: FinalDesign | null;
  status: string;
  clientColor?: string;
  clientInitials?: string;
  solicitudId?: string;
}

interface HistoryEvent {
  id: string;
  estado: string;
  timestamp: string;
  usuario_nombre: string;
  nota?: string;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request, onRefresh }) => {
  const [details, setDetails] = useState<DetailState | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFinal, setUploadingFinal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const finalDesignInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && request?.uuid) {
      fetchDetails(request.uuid);
    } else {
      setDetails(null);
      setHistory([]);
    }
  }, [isOpen, request]);

  const fetchDetails = async (uuid: string) => {
    setLoading(true);
    try {
      const { data: solData, error: solError } = await supabase
        .from('solicitudes')
        .select(`*, asesor:usuarios!asesor_id(nombre)`)
        .eq('id', uuid)
        .single();

      if (solError) throw solError;

      const { data: histData, error: histError } = await supabase
        .from('estados_solicitud')
        .select(`*, usuario:usuarios!usuario_id(nombre)`)
        .eq('solicitud_id', uuid)
        .order('timestamp', { ascending: true });

      if (histError) throw histError;

      if (solData) {
        const initials = solData.cliente ? solData.cliente.substring(0, 1).toUpperCase() : 'C';
        const clientColor = request?.clientColor || 'bg-blue-900 text-blue-300';

        setDetails({
          folio: solData.folio ? `#REQ-${solData.folio}` : 'PENDING',
          cliente: solData.cliente,
          producto: solData.producto,
          tipo: solData.tipo,
          asesor_nombre: solData.asesor?.nombre || 'Sin Asignar',
          fecha_creacion: new Date(solData.fecha_creacion).toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          descripcion: solData.descripcion,
          escaleta_video: solData.escaleta_video,
          material_descargable: solData.material_descargable || [],
          attachments: solData.attachments || [],
          final_design: solData.final_design || null,
          status: histData && histData.length > 0 ? histData[histData.length - 1].estado : 'Pendiente',
          clientColor,
          clientInitials: initials,
          solicitudId: uuid
        });
      }

      if (histData) {
        setHistory(histData.map((h: any) => ({
          id: h.id,
          estado: h.estado,
          timestamp: h.timestamp,
          usuario_nombre: h.usuario?.nombre || 'Sistema',
          nota: h.nota
        })));
      }

    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !details?.solicitudId) return;

    setUploading(true);
    const newAttachments: Attachment[] = [...details.attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      try {
        const { error } = await supabase.storage
          .from('design-attachments')
          .upload(filePath, file);

        if (error) {
          console.error('Upload error:', error);
          alert(`Error al subir ${file.name}: ${error.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('design-attachments')
          .getPublicUrl(filePath);

        newAttachments.push({
          id: Date.now().toString() + i,
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    const { error: updateError } = await supabase
      .from('solicitudes')
      .update({ attachments: newAttachments })
      .eq('id', details.solicitudId);

    if (!updateError) {
      setDetails({ ...details, attachments: newAttachments });
      onRefresh?.();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = async (attachment: Attachment) => {
    if (!details?.solicitudId) return;

    const urlParts = attachment.url.split('/');
    const filePath = `attachments/${urlParts[urlParts.length - 1]}`;

    try {
      await supabase.storage.from('design-attachments').remove([filePath]);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    const newAttachments = details.attachments.filter(a => a.id !== attachment.id);

    const { error } = await supabase
      .from('solicitudes')
      .update({ attachments: newAttachments })
      .eq('id', details.solicitudId);

    if (!error) {
      setDetails({ ...details, attachments: newAttachments });
      onRefresh?.();
    }
  };

  const handleFinalDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !details?.solicitudId) return;

    setUploadingFinal(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `final-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `final-designs/${fileName}`;

    try {
      if (details.final_design) {
        const oldUrlParts = details.final_design.url.split('/');
        const oldPath = `final-designs/${oldUrlParts[oldUrlParts.length - 1]}`;
        await supabase.storage.from('design-attachments').remove([oldPath]);
      }

      const { error } = await supabase.storage
        .from('design-attachments')
        .upload(filePath, file);

      if (error) {
        alert(`Error al subir: ${error.message}`);
        setUploadingFinal(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('design-attachments')
        .getPublicUrl(filePath);

      const finalDesign: FinalDesign = {
        id: Date.now().toString(),
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('solicitudes')
        .update({ final_design: finalDesign })
        .eq('id', details.solicitudId);

      if (!updateError) {
        setDetails({ ...details, final_design: finalDesign });
        onRefresh?.();
      }
    } catch (err) {
      console.error('Upload error:', err);
    }

    setUploadingFinal(false);
    if (finalDesignInputRef.current) finalDesignInputRef.current.value = '';
  };

  const removeFinalDesign = async () => {
    if (!details?.solicitudId || !details.final_design) return;

    const urlParts = details.final_design.url.split('/');
    const filePath = `final-designs/${urlParts[urlParts.length - 1]}`;

    try {
      await supabase.storage.from('design-attachments').remove([filePath]);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    const { error } = await supabase
      .from('solicitudes')
      .update({ final_design: null })
      .eq('id', details.solicitudId);

    if (!error) {
      setDetails({ ...details, final_design: null });
      onRefresh?.();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('zip') || type.includes('rar')) return 'folder_zip';
    if (type.includes('photoshop') || type.includes('psd')) return 'brush';
    return 'insert_drive_file';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-500 border-yellow-500';
      case 'En Producción': return 'bg-purple-500 border-purple-500';
      case 'Corrección': return 'bg-orange-500 border-orange-500';
      case 'Entregado': return 'bg-green-500 border-green-500';
      default: return 'bg-gray-500 border-gray-500';
    }
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    }
  };

  const openPreview = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-xl glass h-full border-l border-white/10 shadow-apple-lg flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springConfig.gentle}
          >

            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center glass z-10 shrink-0">
              <div>
                {loading ? (
                  <div className="h-4 w-24 glass-light rounded-lg animate-pulse mb-2"></div>
                ) : (
                  <span className="text-xs text-primary font-bold block mb-1">{details?.folio}</span>
                )}
                {loading ? (
                  <div className="h-6 w-48 glass-light rounded-lg animate-pulse"></div>
                ) : (
                  <h2 className="text-lg font-bold text-text-light dark:text-white leading-tight">{details?.producto}</h2>
                )}
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-muted-light dark:text-muted-dark apple-transition"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <span className="material-icons-round">close</span>
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">

              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 glass-light rounded-2xl animate-pulse"></div>)}
                </div>
              ) : details ? (
                <>
                  {/* Info Grid */}
                  <motion.div
                    className="grid grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springConfig.gentle}
                  >
                    <div>
                      <span className="text-xs text-muted-light dark:text-muted-dark block mb-1">Cliente</span>
                      <div className="flex items-center min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] mr-2 font-bold flex-shrink-0 ${details.clientColor}`}>
                          {details.clientInitials}
                        </div>
                        <span className="text-sm font-medium text-text-light dark:text-white truncate" title={details.cliente}>{details.cliente}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-light dark:text-muted-dark block mb-1">Asesor</span>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-gray-700 text-[9px] flex items-center justify-center text-white mr-2 ring-1 ring-white/10">
                          {details.asesor_nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-text-light dark:text-white">{details.asesor_nombre}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-light dark:text-muted-dark block mb-1">Tipo</span>
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium glass-light text-text-light dark:text-white border border-white/10">
                        {details.tipo}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-light dark:text-muted-dark block mb-1">Creado el</span>
                      <span className="text-xs text-text-light dark:text-white">{details.fecha_creacion}</span>
                    </div>
                  </motion.div>

                  {/* Final Design Section */}
                  <motion.div
                    className="bg-gradient-to-r from-primary/10 to-green-500/10 rounded-2xl p-4 border-2 border-primary/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springConfig.gentle, delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="material-icons-round text-primary mr-2">auto_awesome</span>
                        <h3 className="text-sm font-bold text-text-light dark:text-white">Diseño Final</h3>
                      </div>
                      <input
                        ref={finalDesignInputRef}
                        type="file"
                        accept="image/*,.pdf,.psd,.ai,.zip"
                        onChange={handleFinalDesignUpload}
                        className="hidden"
                      />
                      {!details.final_design && (
                        <motion.button
                          onClick={() => finalDesignInputRef.current?.click()}
                          disabled={uploadingFinal}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-dark apple-transition text-xs font-medium disabled:opacity-50 shadow-apple-glow"
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                        >
                          <span className="material-icons-round text-sm">{uploadingFinal ? 'hourglass_empty' : 'upload'}</span>
                          {uploadingFinal ? 'Subiendo...' : 'Subir Diseño Final'}
                        </motion.button>
                      )}
                    </div>

                    {details.final_design ? (
                      <div className="glass rounded-xl p-3 border border-white/10">
                        <div className="flex items-center">
                          {details.final_design.type.startsWith('image/') ? (
                            <img
                              src={details.final_design.url}
                              alt={details.final_design.name}
                              onClick={() => openPreview(details.final_design!.url)}
                              className="w-16 h-16 rounded-xl object-cover mr-3 border border-white/10 cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary apple-transition"
                              title="Click para ver preview"
                            />
                          ) : (
                            <div
                              onClick={() => openPreview(details.final_design!.url)}
                              className="w-16 h-16 rounded-xl glass-light flex items-center justify-center mr-3 cursor-pointer hover:ring-2 hover:ring-primary apple-transition"
                              title="Click para ver preview"
                            >
                              <span className="material-icons-round text-2xl text-primary">{getFileIcon(details.final_design.type)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              onClick={() => openPreview(details.final_design!.url)}
                              className="text-sm font-medium text-text-light dark:text-white truncate cursor-pointer hover:text-primary apple-transition"
                            >
                              {details.final_design.name}
                            </p>
                            <p className="text-xs text-muted-dark">{formatFileSize(details.final_design.size)}</p>
                            <p className="text-[10px] text-muted-dark mt-0.5">
                              Subido: {new Date(details.final_design.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            <motion.button
                              onClick={() => downloadFile(details.final_design!.url, details.final_design!.name)}
                              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white apple-transition"
                              title="Descargar"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="material-icons-round text-sm">download</span>
                            </motion.button>
                            <motion.button
                              onClick={() => finalDesignInputRef.current?.click()}
                              className="p-2 rounded-xl glass-light text-muted-dark hover:text-primary apple-transition"
                              title="Reemplazar"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="material-icons-round text-sm">sync</span>
                            </motion.button>
                            <motion.button
                              onClick={removeFinalDesign}
                              className="p-2 rounded-xl glass-light text-muted-dark hover:text-red-500 apple-transition"
                              title="Eliminar"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="material-icons-round text-sm">delete</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => finalDesignInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 apple-transition glass"
                      >
                        <span className="material-icons-round text-3xl text-primary/50 mb-2">brush</span>
                        <p className="text-xs text-muted-dark">Sube aquí el diseño final para entrega</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Attachments Section */}
                  <motion.div
                    className="glass-light rounded-2xl p-4 border border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springConfig.gentle, delay: 0.15 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs text-muted-light dark:text-muted-dark block font-bold uppercase tracking-wider">Archivos de Referencia</span>
                        <span className="text-[10px] text-muted-dark">Imágenes de inspiración y material de apoyo</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.zip,.rar,.psd,.ai"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white apple-transition text-xs font-medium disabled:opacity-50"
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                      >
                        <span className="material-icons-round text-sm">{uploading ? 'hourglass_empty' : 'add'}</span>
                        {uploading ? 'Subiendo...' : 'Agregar'}
                      </motion.button>
                    </div>

                    {details.attachments.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {details.attachments.map((attachment, idx) => (
                          <motion.div
                            key={attachment.id}
                            className="flex items-center p-2 rounded-xl glass border border-white/10 group hover:border-primary/50 apple-transition"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...springConfig.gentle, delay: idx * 0.03 }}
                          >
                            {attachment.type?.startsWith('image/') ? (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                onClick={() => openPreview(attachment.url)}
                                className="w-10 h-10 rounded-lg object-cover mr-2 flex-shrink-0 cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary apple-transition"
                              />
                            ) : (
                              <div
                                onClick={() => openPreview(attachment.url)}
                                className="w-10 h-10 rounded-lg glass-light flex items-center justify-center mr-2 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary apple-transition"
                              >
                                <span className="material-icons-round text-muted-dark">{getFileIcon(attachment.type || '')}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-text-light dark:text-white truncate cursor-pointer hover:text-primary" onClick={() => openPreview(attachment.url)}>
                                {attachment.name}
                              </p>
                              <p className="text-[10px] text-muted-dark">{formatFileSize(attachment.size)}</p>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 apple-transition">
                              <button onClick={() => downloadFile(attachment.url, attachment.name)} className="p-1 text-muted-dark hover:text-primary" title="Descargar">
                                <span className="material-icons-round text-sm">download</span>
                              </button>
                              <button onClick={() => removeAttachment(attachment)} className="p-1 text-muted-dark hover:text-red-500" title="Eliminar">
                                <span className="material-icons-round text-sm">close</span>
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 apple-transition"
                      >
                        <span className="material-icons-round text-xl text-muted-dark mb-1">cloud_upload</span>
                        <p className="text-xs text-muted-dark">Clic para subir archivos de referencia</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Timeline History */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springConfig.gentle, delay: 0.2 }}
                  >
                    <h3 className="text-xs font-bold text-text-light dark:text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Historial de Estados</h3>
                    <div className="relative pl-2 space-y-6">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10"></div>

                      {history.length === 0 ? (
                        <p className="text-xs text-muted-dark pl-4">No hay historial disponible.</p>
                      ) : (
                        history.map((event, idx) => (
                          <motion.div
                            key={event.id}
                            className="relative flex items-start group"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...springConfig.gentle, delay: idx * 0.05 }}
                          >
                            <div className={`absolute left-0 mt-1 w-3.5 h-3.5 rounded-full border-2 ${getStatusColor(event.estado)} glass z-10 group-hover:scale-110 apple-transition`}></div>
                            <div className="ml-6 w-full">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-text-light dark:text-white">{event.estado}</p>
                                <span className="text-[10px] text-muted-light dark:text-muted-dark whitespace-nowrap ml-2">
                                  {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-dark mt-0.5">
                                por <span className="text-text-light dark:text-gray-400">{event.usuario_nombre}</span>
                              </p>
                              {event.nota && (
                                <p className="text-xs text-gray-500 italic mt-1 glass-light p-1.5 rounded-lg border border-white/10">
                                  "{event.nota}"
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    className="glass-light rounded-2xl p-4 border border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springConfig.gentle, delay: 0.25 }}
                  >
                    <span className="text-xs text-muted-light dark:text-muted-dark block mb-2 font-bold uppercase tracking-wider">Descripción / Notas</span>
                    <p className="text-sm text-text-light dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {details.descripcion || "Sin descripción."}
                    </p>
                  </motion.div>

                  {/* Brief Section */}
                  {details.escaleta_video && (
                    <motion.div
                      className="glass-light rounded-2xl p-4 border border-white/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springConfig.gentle, delay: 0.3 }}
                    >
                      <span className="text-xs text-primary block mb-2 font-bold uppercase tracking-wider">Brief de Diseño</span>
                      <p className="text-sm text-text-light dark:text-gray-300 leading-relaxed whitespace-pre-line text-xs">
                        {details.escaleta_video}
                      </p>
                    </motion.div>
                  )}

                  {/* External Links */}
                  {(details.material_descargable && details.material_descargable.length > 0 && details.material_descargable[0] !== '') && (
                    <motion.div
                      className="glass-light rounded-2xl p-4 border border-white/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springConfig.gentle, delay: 0.35 }}
                    >
                      <span className="text-xs text-muted-light dark:text-muted-dark block mb-3 font-bold uppercase tracking-wider">Links Externos</span>
                      <div className="flex flex-col gap-2">
                        {details.material_descargable.map((link, idx) => (
                          link ? (
                            <a
                              key={idx}
                              href={link.startsWith('http') ? link : `https://${link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-2 rounded-xl glass border border-white/10 hover:border-primary/50 hover:text-primary apple-transition group"
                            >
                              <span className="material-icons-round text-lg mr-2 text-muted-dark group-hover:text-primary">link</span>
                              <span className="text-xs truncate flex-1">{link}</span>
                              <span className="material-icons-round text-xs text-muted-dark group-hover:translate-x-1 apple-transition">open_in_new</span>
                            </a>
                          ) : null
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-muted-dark">
                  <p>No se pudo cargar la información de la solicitud.</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end glass shrink-0">
              <motion.button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-text-light dark:text-white border border-white/10 rounded-xl hover:bg-white/5 apple-transition shadow-apple"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                Cerrar
              </motion.button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestDetailModal;
