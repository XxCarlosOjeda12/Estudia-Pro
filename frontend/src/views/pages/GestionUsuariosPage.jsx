const GestionUsuariosPage = ({ users, onDelete }) => {
  const handleDelete = (id) => {
    if (confirm('¿Eliminar este usuario?')) {
      onDelete(id);
    }
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
        <p className="text-slate-500 dark:text-slate-400">Administra los usuarios registrados en la plataforma.</p>
      </div>
      <div className="glass-effect-light p-6 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-light-border dark:border-dark-border text-left">
              <th className="py-2">Nombre</th>
              <th className="py-2">Email</th>
              <th className="py-2">Rol</th>
              <th className="py-2">Estado</th>
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
                <td className="py-3 space-x-2">
              <button className="text-blue-500 hover:underline text-sm">Editar</button>
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
