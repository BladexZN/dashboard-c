import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { User } from '../types';
import { springConfig } from '../lib/animations';
import CustomSelect from './CustomSelect';

const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('Todos');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedUsers: User[] = data.map((u: any) => ({
            id: u.id,
            name: u.nombre || 'Sin nombre',
            email: u.email || 'No email',
            role: u.rol || 'Sin rol',
            status: (u.estado as 'Activo' | 'Inactivo') || 'Activo',
            avatar: u.avatar_url || ''
          }));
          setUsers(mappedUsers);
        }
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchStatus = statusFilter === 'Todos' || user.status === statusFilter;
      const matchRole = roleFilter === 'Todos' || user.role === roleFilter;
      return matchStatus && matchRole;
    });
  }, [users, statusFilter, roleFilter]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map(u => u.role));
    return ['Todos', ...Array.from(roles)];
  }, [users]);

  if (loading) {
     return (
        <div className="flex items-center justify-center h-64">
           <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
        </div>
     );
  }

  if (error) {
    return (
      <motion.div
        className="p-6 text-center text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig.gentle}
      >
        <p>Error cargando usuarios: {error}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
       <motion.div
         className="flex items-center justify-between"
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={springConfig.gentle}
       >
        <h2 className="text-xl font-bold text-text-light dark:text-white">Usuarios del Sistema</h2>
      </motion.div>

      <motion.div
        className="flex flex-col sm:flex-row gap-4 glass p-4 rounded-2xl border border-white/10 shadow-apple"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig.gentle, delay: 0.05 }}
      >
         <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-muted-dark uppercase">Estado:</label>
            <CustomSelect
               value={statusFilter}
               onChange={setStatusFilter}
               options={[
                  { value: 'Todos', label: 'Todos' },
                  { value: 'Activo', label: 'Activo' },
                  { value: 'Inactivo', label: 'Inactivo' }
               ]}
               className="min-w-[120px]"
            />
         </div>
         <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-muted-dark uppercase">Rol:</label>
            <CustomSelect
               value={roleFilter}
               onChange={setRoleFilter}
               options={uniqueRoles.map(role => ({ value: role, label: role }))}
               className="min-w-[140px]"
            />
         </div>
      </motion.div>

      <motion.div
        className="glass border border-white/10 rounded-2xl overflow-hidden shadow-apple"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig.gentle, delay: 0.1 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase text-muted-light dark:text-muted-dark font-medium">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
               {filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-dark">No se encontraron usuarios.</td></tr>
               ) : (
                  filteredUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      className="hover:bg-white/5 apple-transition"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springConfig.gentle, delay: idx * 0.02 }}
                    >
                       <td className="px-6 py-4">
                          <div className="flex items-center">
                             <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs mr-3 border border-primary/30 overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user.name.charAt(0).toUpperCase()
                                )}
                             </div>
                             <span className="font-medium text-text-light dark:text-white">{user.name}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-text-light dark:text-gray-300">{user.role}</td>
                       <td className="px-6 py-4 text-muted-light dark:text-muted-dark text-xs">{user.email}</td>
                       <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                             ${user.status === 'Activo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}
                          `}>
                             {user.status}
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

export default UsersView;
