const mensajeError = document.getElementsByClassName("error")[0];

const form = document.getElementById('register_form');
form.addEventListener('submit', async e => {
  e.preventDefault();

  const elems = form.elements;

const payload = {
  tipo_documento: elems['tipo_documento'].value,
  num_documento: elems['num_documento'].value,
  fecha_emision: elems['fecha_emision'].value,
  email: elems['email'].value,
  password: elems['password'].value,
  mayor: elems['mayor'].checked,
  menor: elems['menor'].checked
};


  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resJson = await res.json();

    if (!res.ok) {
      console.warn('Error del servidor:', resJson.message);
      return mensajeError.classList.toggle("escondido", false);
    }

    if (resJson.redirect) {
      window.location.href = resJson.redirect;
    }

  } catch (err) {
    console.error('Error en fetch:', err);
  }
});
