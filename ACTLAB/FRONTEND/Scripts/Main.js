// ==============================
// MAIN.JS 
// ==============================
const API = 'http://localhost:5000/api';
let token, role, name;

// -------------------------------
// Helpers  - parte de back
// -------------------------------
async function request(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
}

// -------------------------------
// Auth flow - login, sesiones
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("login-btn")) {
    document.getElementById("login-btn").onclick = function () {
      window.location.href = "login.html";
    };
  }

  if (location.pathname.endsWith('index.html') || location.pathname === '/') {
    document.getElementById('form-title').innerText = 'Iniciar Sesión';
    document.getElementById('submit-btn').innerText = 'Ingresar';

    document.getElementById('submit-btn').onclick = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const data = await request('/auth/login', 'POST', { email, password });

      if (data.token) {
        token = data.token;
        role = data.role;
        name = data.name;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('name', name);
        window.location = role === 'admin' ? 'admin.html' : 'user.html';
      } else {
        alert(data.msg);
      }
    };
  }

// CARGA INICIAL (user.html & admin.html)
if (token = localStorage.getItem('token')) {
  role = localStorage.getItem('role');
  name = localStorage.getItem('name');

  if (role === 'user' && location.pathname.endsWith('user.html')) {
    initUser();
  }

  if (role === 'admin' && location.pathname.endsWith('admin.html')) {
    initAdmin();
  }
} else {
    if (!location.pathname.endsWith('login.html')) {
    window.location = 'index.html';  
  }
}


  // -------------------------------
  // UX/UI Enhancements
  // -------------------------------
  const navToggle = document.querySelector('.nav-toggle');
  const menuList = document.getElementById('menu-list');

  if (navToggle && menuList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      menuList.classList.toggle('open');
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (menuList && menuList.classList.contains('open')) {
          menuList.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // IntersectionObserver
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.12 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('inview');
    });
  }, observerOptions);
  document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));
});

// -------------------------------
// USER PAGE
// -------------------------------
async function initUser() {
  const me = await request('/auth/me');
  document.getElementById('welcome').innerText = `Hola, ${me.name}`;
  document.getElementById('logout').onclick = () => {
    localStorage.clear();
    window.location = 'index.html';
  };

  document.getElementById('req-appt').onclick = async (e) => {
  e.preventDefault(); // 🔥 Evita que se recargue la página
  const date = document.getElementById('appt-date').value;
  if (!date) return alert("Selecciona una fecha para la cita");
  await request('/appointments', 'POST', { date });
  loadAppts();
};


  document.getElementById('upd-profile').onclick = async () => {
    const name = document.getElementById('new-name').value;
    const password = document.getElementById('new-pass').value;
    await request('/auth/me', 'PUT', { name, password });
    alert('Perfil actualizado');
  };

  async function loadAppts() {
    const list = await request('/appointments');
    const apptList = document.getElementById('appt-list');
    apptList.innerHTML = list.map(a =>
      `<li>${new Date(a.date).toLocaleString()} - ${a.status}</li>`).join('');
  }
  loadAppts();
}

// -------------------------------
// ADMIN PAGE
// -------------------------------
async function initAdmin() {
  document.getElementById('logout').onclick = () => {
    localStorage.clear();
    window.location = 'index.html';
  };

  const list = await request('/appointments/all');
  const allAppts = document.getElementById('all-appts');
  allAppts.innerHTML = list.map(a => {
    return `<tr>
      <td>${a.user.name} (${a.user.email})</td>
      <td>${new Date(a.date).toLocaleString()}</td>
      <td>${a.status}</td>
      <td>
        <button onclick="change('${a._id}', 'confirmed')">✅</button>
        <button onclick="change('${a._id}', 'cancelled')">❌</button>
      </td>
    </tr>`;
  }).join('');

  window.change = async (id, status) => {
    await request(`/appointments/${id}`, 'PUT', { status });
    initAdmin();
  };
}
