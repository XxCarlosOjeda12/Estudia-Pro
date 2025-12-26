import { useState } from 'react';

const GestionUsuariosPage = ({ users, onDelete, onUpdate }) => {
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '', verified: false, is_premium: false });

  const handleDelete = (id) => {
    if (confirm('¿Eliminar este usuario?')) {
      onDelete(id);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      is_premium: user.is_premium || user.premium || false
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingUser && onUpdate) {
      await onUpdate(editingUser.id, formData);
      setEditingUser(null);
    }
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
        <p className="text-slate-500 dark:text-slate-400">Administra los usuarios registrados en la plataforma.</p>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-light-border dark:border-dark-border">
            <h3 className="text-xl font-bold mb-4">Editar Usuario</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={formData.role.toLowerCase()}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="creador">Creador</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Verificado</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium">Usuario Premium</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:opacity-80 transition-opacity">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-effect-light p-6 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-light-border dark:border-dark-border text-left">
              <th className="py-2">Nombre</th>
              <th className="py-2">Email</th>
              <th className="py-2">Rol</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Premium</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-light-border dark:border-dark-border">
                <td className="py-3">{user.name}</td>
                <td className="py-3">{user.email}</td>
                <td className="py-3">
                  <span className="bg-primary/20 text-primary text-xs py-1 px-2 rounded-full uppercase">{user.role}</span>
                </td>
                <td className="py-3">
                  <span className={`text-xs py-1 px-2 rounded-full ${user.verified ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {user.verified ? 'Verificado' : 'Pendiente'}
                  </span>
                </td>
                <td className="py-3">
                  {(user.is_premium || user.premium) ? (
                    <span className="text-emerald-500 font-medium text-sm">Activado</span>
                  ) : (
                    <span className="text-slate-400 text-sm">Desactivado</span>
                  )}
                </td>
                <td className="py-3 space-x-2">
                  <button className="text-blue-500 hover:underline text-sm" onClick={() => handleEditClick(user)}>Editar</button>
                  <button className="text-red-500 hover:underline text-sm" onClick={() => handleDelete(user.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionUsuariosPage;
