// Formulario para crear nueva área común
// Este módulo se puede importar y usar en el dashboard

export function renderCrearAreaComun() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="form-card" style="max-width: 500px; margin: 2rem auto; background: var(--card-bg); box-shadow: 0 8px 32px rgba(31,38,135,0.18); border-radius: 1rem; padding: 2rem; border: 1px solid var(--primary-color);">
      <h2 style="color: var(--primary-color); margin-bottom: 1.5rem; text-align:center;">Crear Nueva Área Común</h2>
      <form id="form-area-comun">
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label for="nombre" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Nombre del área</label>
          <input type="text" id="nombre" name="nombre" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
        </div>
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label for="descripcion" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Descripción</label>
          <textarea id="descripcion" name="descripcion" rows="2" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;"></textarea>
        </div>
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label for="capacidad" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Capacidad máxima</label>
          <input type="number" id="capacidad" name="capacidad" min="1" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
        </div>
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label for="ubicacion" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Ubicación</label>
          <input type="text" id="ubicacion" name="ubicacion" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
        </div>
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label for="pago_por_uso" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Pago por uso (Bs)</label>
          <input type="number" id="pago_por_uso" name="pago_por_uso" min="0" value="0" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary" style="background: var(--primary-color); color: white; border-radius:0.5rem; padding:0.75rem 1.5rem; font-weight:600; border:none; box-shadow:0 2px 8px rgba(31,38,135,0.10);">Crear Área</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('form-area-comun').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      nombre: form.nombre.value,
      descripcion: form.descripcion.value,
      capacidad: parseInt(form.capacidad.value),
      ubicacion: form.ubicacion.value,
      pago_por_uso: parseInt(form.pago_por_uso.value)
    };
    try {
      const res = await fetch('/api/areas-comunes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        form.reset();
        alert('Área común creada correctamente');
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'No se pudo crear el área'));
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message);
    }
  });
}
