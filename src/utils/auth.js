// Verificar autenticación
export function checkAuthentication() {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  if (isAuthenticated !== 'true' || !usuario.id) {
    window.location.href = '/login.html';
    return null;
  }
  
  return usuario;
}

// Cerrar sesión
export function logout() {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('usuario');
    window.location.href = '/login.html';
  }
}

// Mostrar información del usuario en el perfil sidebar
export function displayUserProfile(usuario) {
  const profileDiv = document.getElementById('userProfileSidebar');
  if (profileDiv) {
    profileDiv.innerHTML = `
      <div class="perfil-info">
        <p><strong>${usuario.nombre} ${usuario.apellido}</strong></p>
        <p style="font-size: 0.8rem;">${usuario.correo}</p>
      </div>
    `;
  }
}
