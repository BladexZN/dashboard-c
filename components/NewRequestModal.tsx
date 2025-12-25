import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { RequestData, RequestType, User, UserProfile, Attachment } from '../types';
import { springConfig, buttonTap, buttonHover } from '../lib/animations';
import CustomSelect from './CustomSelect';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<RequestData>) => void;
  initialData?: RequestData | null;
  advisors?: User[];
  currentUser?: UserProfile | null;
}

const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose, onSave, initialData, advisors = [], currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    client: '',
    product: '',
    type: 'Nueva solicitud' as RequestType,
    advisorId: '',
    advisorName: '',
    description: '',
    escaleta: '',
    downloadable_links: [''],
    attachments: [] as Attachment[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        client: initialData.client || '',
        product: initialData.product || '',
        type: initialData.type || 'Nueva solicitud',
        advisorId: initialData.advisorId || '',
        advisorName: initialData.advisor || '',
        description: initialData.description || '',
        escaleta: initialData.escaleta || '',
        downloadable_links: initialData.downloadable_links && initialData.downloadable_links.length > 0
          ? [...initialData.downloadable_links]
          : [''],
        attachments: initialData.attachments || []
      });
    } else {
      setFormData({
        client: '',
        product: '',
        type: 'Nueva solicitud',
        advisorId: currentUser?.id || '',
        advisorName: currentUser?.nombre || '',
        description: '',
        escaleta: '',
        downloadable_links: [''],
        attachments: []
      });
    }
  }, [initialData, isOpen, currentUser]);

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.downloadable_links];
    newLinks[index] = value;
    setFormData({ ...formData, downloadable_links: newLinks });
  };

  const addLinkField = () => {
    setFormData({
      ...formData,
      downloadable_links: [...formData.downloadable_links, '']
    });
  };

  const removeLinkField = (index: number) => {
    if (formData.downloadable_links.length <= 1) {
      handleLinkChange(0, '');
      return;
    }
    const newLinks = formData.downloadable_links.filter((_, i) => i !== index);
    setFormData({ ...formData, downloadable_links: newLinks });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const newAttachments: Attachment[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      try {
        const { data, error } = await supabase.storage
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

        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...newAttachments]
    });

    setUploading(false);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (attachment: Attachment) => {
    const urlParts = attachment.url.split('/');
    const filePath = `attachments/${urlParts[urlParts.length - 1]}`;

    try {
      await supabase.storage.from('design-attachments').remove([filePath]);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    setFormData({
      ...formData,
      attachments: formData.attachments.filter(a => a.id !== attachment.id)
    });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialData && currentUser?.estado !== 'Activo') {
      alert('Tu usuario no está activo. No puedes crear solicitudes.');
      return;
    }

    const finalLinks = formData.downloadable_links.filter(link => link.trim() !== '');

    onSave({
      ...formData,
      advisor: formData.advisorName,
      advisorId: formData.advisorId,
      downloadable_links: finalLinks,
      attachments: formData.attachments
    });
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const isCreationBlocked = !initialData && (!currentUser || currentUser.estado !== 'Activo');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative glass border border-white/10 rounded-2xl shadow-apple-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springConfig.gentle}
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-light dark:text-white">
                {initialData ? 'Editar Solicitud' : 'Nueva Solicitud'}
              </h2>
              <motion.button
                onClick={onClose}
                className="text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-white apple-transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="material-icons-round">close</span>
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-muted-light dark:text-muted-dark mb-1">Cliente</label>
                <input
                  required
                  type="text"
                  className="w-full glass-light border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-light dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none apple-transition"
                  placeholder="Nombre del cliente"
                  value={formData.client}
                  onChange={e => setFormData({ ...formData, client: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-light dark:text-muted-dark mb-1">Servicio / Tratamiento</label>
                <input
                  required
                  type="text"
                  className="w-full glass-light border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-light dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none apple-transition"
                  placeholder="Ej: Rejuvenecimiento facial, Limpieza profunda..."
                  value={formData.product}
                  onChange={e => setFormData({ ...formData, product: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-light dark:text-muted-dark mb-1">Tipo</label>
                  <CustomSelect
                    value={formData.type}
                    onChange={(val) => setFormData({ ...formData, type: val as RequestType })}
                    options={[
                      { value: 'Nueva solicitud', label: 'Nueva solicitud' },
                      { value: 'Corrección/Añadido', label: 'Corrección/Añadido' },
                      { value: 'Ajuste', label: 'Ajuste' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-light dark:text-muted-dark mb-1">Asesor</label>
                  {initialData ? (
                    <CustomSelect
                      value={formData.advisorId}
                      onChange={(selectedId) => {
                        const selectedUser = advisors.find(u => u.id === selectedId);
                        setFormData({
                          ...formData,
                          advisorId: selectedId,
                          advisorName: selectedUser ? selectedUser.name : ''
                        });
                      }}
                      options={advisors.length > 0
                        ? advisors.map(user => ({ value: user.id, label: user.name }))
                        : [{ value: '', label: 'Cargando asesores...' }]
                      }
                      placeholder="Seleccionar Asesor"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={formData.advisorName || 'Cargando...'}
                        className="w-full glass-light/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-muted-light dark:text-muted-dark cursor-not-allowed"
                      />
                      <p className="text-[10px] text-muted-dark mt-1">Asignado automáticamente al usuario actual</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-light dark:text-muted-dark mb-1">Descripción / Notas</label>
                <textarea
                  rows={2}
                  className="w-full glass-light border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-light dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none apple-transition"
                  placeholder="Detalles adicionales..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              {/* Brief Section */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <h3 className="text-xs font-bold text-text-light dark:text-white uppercase tracking-wider mb-3">Brief de Diseño</h3>
                <div>
                  <label className="block text-xs font-medium text-muted-light dark:text-muted-dark mb-1">Instrucciones y detalles</label>
                  <textarea
                    rows={4}
                    className="w-full glass-light border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-light dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none apple-transition"
                    placeholder="Escribe aquí las instrucciones para el diseño..."
                    value={formData.escaleta}
                    onChange={e => setFormData({ ...formData, escaleta: e.target.value })}
                  ></textarea>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-text-light dark:text-white uppercase tracking-wider">Archivos de Referencia</h3>
                    <p className="text-[10px] text-muted-dark mt-0.5">Imágenes de inspiración, referencias, logos, etc.</p>
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
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white apple-transition text-xs font-medium disabled:opacity-50"
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                  >
                    <span className="material-icons-round text-sm">{uploading ? 'hourglass_empty' : 'upload_file'}</span>
                    {uploading ? 'Subiendo...' : 'Subir Archivos'}
                  </motion.button>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="mb-3">
                    <div className="w-full glass-light rounded-full h-1.5">
                      <motion.div
                        className="bg-primary h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Attachments Grid */}
                {formData.attachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {formData.attachments.map((attachment, idx) => (
                      <motion.div
                        key={attachment.id}
                        className="flex items-center p-2 rounded-xl glass-light border border-white/10 group hover:border-primary/50 apple-transition"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...springConfig.gentle, delay: idx * 0.03 }}
                      >
                        {attachment.type.startsWith('image/') ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-10 h-10 rounded-lg object-cover mr-2 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg glass flex items-center justify-center mr-2 flex-shrink-0">
                            <span className="material-icons-round text-muted-dark">{getFileIcon(attachment.type)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-light dark:text-white truncate">{attachment.name}</p>
                          <p className="text-[10px] text-muted-dark">{formatFileSize(attachment.size)}</p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => removeAttachment(attachment)}
                          className="p-1 text-muted-dark hover:text-red-500 opacity-0 group-hover:opacity-100 apple-transition"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <span className="material-icons-round text-sm">close</span>
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {formData.attachments.length === 0 && !uploading && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 apple-transition"
                  >
                    <span className="material-icons-round text-2xl text-muted-dark mb-2">cloud_upload</span>
                    <p className="text-xs text-muted-dark">Arrastra archivos aquí o haz clic para subir</p>
                    <p className="text-[10px] text-muted-dark mt-1">JPG, PNG, PDF, ZIP, PSD (max 50MB)</p>
                  </div>
                )}
              </div>

              {/* External Links Section */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-text-light dark:text-white uppercase tracking-wider">Links Externos</h3>
                  <motion.button
                    type="button"
                    onClick={addLinkField}
                    className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white apple-transition shadow-sm"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="material-icons-round text-sm">add</span>
                  </motion.button>
                </div>

                <div className="space-y-3">
                  {formData.downloadable_links.map((link, index) => {
                    const isValid = isValidUrl(link);
                    return (
                      <motion.div
                        key={index}
                        className="space-y-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springConfig.snappy, delay: index * 0.03 }}
                      >
                        <label className="block text-[10px] font-medium text-muted-dark ml-1">Link {index + 1}</label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              className={`w-full glass-light border rounded-xl px-3 py-2.5 text-sm text-text-light dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none apple-transition ${!isValid && link ? 'border-red-500/50 ring-red-500/10' : 'border-white/10'}`}
                              placeholder="Pega aquí el link del material"
                              value={link}
                              onChange={e => handleLinkChange(index, e.target.value)}
                            />
                            {!isValid && link && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 material-icons-round text-red-500 text-sm" title="URL inválida">error_outline</span>
                            )}
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => removeLinkField(index)}
                            className="p-2 text-muted-dark hover:text-red-500 apple-transition"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <span className="material-icons-round text-base">delete_outline</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-muted-light dark:text-muted-dark hover:bg-white/5 rounded-xl apple-transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={buttonTap}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isCreationBlocked || uploading}
                  className="px-4 py-2.5 text-sm font-medium bg-primary hover:bg-primary-dark text-white rounded-xl shadow-apple-glow apple-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  {initialData ? 'Guardar Cambios' : 'Guardar Solicitud'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewRequestModal;
