// API para solicitudes de mantenimiento
// Aquí se implementan las llamadas al backend (por implementar)

const API_URL = '/api/solicitudes-mantenimiento';

export async function obtenerSolicitudes() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Error al obtener solicitudes');
  return await res.json();
}

export async function crearSolicitud(datos) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!res.ok) throw new Error('Error al crear solicitud');
  return await res.json();
}

export async function asignarPersonal(idSolicitud, idPersonal) {
  const res = await fetch(`${API_URL}/${idSolicitud}/asignar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asignado_a: idPersonal })
  });
  if (!res.ok) throw new Error('Error al asignar personal');
  return await res.json();
}

export async function obtenerPersonal() {
  const res = await fetch(`${API_URL}/personal`);
  if (!res.ok) throw new Error('Error al obtener personal');
  return await res.json();
}

export async function obtenerDepartamentos() {
  const res = await fetch(`${API_URL}/departamentos`);
  if (!res.ok) throw new Error('Error al obtener departamentos');
  return await res.json();
}

// Cambiar estado de solicitud
export async function cambiarEstadoSolicitud(idSolicitud, estado) {
  const res = await fetch(`${API_URL}/${idSolicitud}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  });
  if (!res.ok) throw new Error('Error al cambiar estado');
  return await res.json();
}
