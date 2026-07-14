const API = "/api";

// ---- Tema segun hora del dia ----

function aplicarTema() {
  const hora = new Date().getHours();
  const clases = ["tema-manana", "tema-tarde", "tema-noche"];
  document.body.classList.remove(...clases);
  if (hora >= 5 && hora < 12) {
    document.body.classList.add("tema-manana");
  } else if (hora >= 12 && hora < 19) {
    document.body.classList.add("tema-tarde");
  } else {
    document.body.classList.add("tema-noche");
  }
}

// ---- Pestanas (Resumen / Editar) ----

let tabActual = 0;
const TOTAL_TABS = 2;

function cambiarTab(index) {
  tabActual = Math.max(0, Math.min(TOTAL_TABS - 1, index));
  document.querySelectorAll(".tab-page").forEach((page) => {
    page.hidden = Number(page.dataset.page) !== tabActual;
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.tab) === tabActual);
  });
}

function inicializarSwipe() {
  const area = document.getElementById("swipe-area");
  let startX = 0;
  let startY = 0;
  let tracking = false;

  area.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  });

  area.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const UMBRAL = 50;
    if (Math.abs(deltaX) > UMBRAL && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        cambiarTab(tabActual + 1);
      } else {
        cambiarTab(tabActual - 1);
      }
    }
  });
}

// ---- Contenido aleatorio ----

async function cargarRandom() {
  const notaEl = document.getElementById("random-nota");
  const imgWrap = document.getElementById("random-imagen-wrap");
  const imgEl = document.getElementById("random-imagen");
  try {
    const res = await fetch(`${API}/random`);
    const data = await res.json();
    notaEl.textContent = data.nota ? `"${data.nota.texto}"` : "Agrega tus propias notas motivacionales.";
    if (data.imagen) {
      imgEl.src = `/images/${data.imagen.filename}`;
      imgWrap.hidden = false;
    } else {
      imgWrap.hidden = true;
    }
  } catch (e) {
    notaEl.textContent = "No se pudo cargar el contenido del momento.";
  }
}

// ---- Metas ----

let editandoGoalId = null;

async function cargarGoals() {
  const res = await fetch(`${API}/goals`);
  const goals = await res.json();
  renderGoalsResumen(goals);
  renderGoalsEditar(goals);
}

function renderGoalsResumen(goals) {
  const lista = document.getElementById("goals-list-resumen");
  lista.innerHTML = "";
  if (goals.length === 0) {
    lista.innerHTML = "<p>No hay metas todavia.</p>";
    return;
  }
  goals.forEach((g) => {
    const item = document.createElement("div");
    item.className = "goal-item";
    item.innerHTML = `
      <div class="goal-item-top">
        <span class="goal-titulo">${escapeHtml(g.titulo)}</span>
        <span class="goal-categoria">${escapeHtml(g.categoria)}</span>
      </div>
      <div class="goal-progreso-bar">
        <div class="goal-progreso-fill" style="width:${g.progreso}%"></div>
      </div>
    `;
    lista.appendChild(item);
  });
}

function renderGoalsEditar(goals) {
  const lista = document.getElementById("goals-list-editar");
  lista.innerHTML = "";
  if (goals.length === 0) {
    lista.innerHTML = "<p>No hay metas todavia. Crea la primera.</p>";
    return;
  }
  goals.forEach((g) => {
    const item = document.createElement("div");
    item.className = "goal-item";
    item.innerHTML = `
      <div class="goal-item-top">
        <span class="goal-titulo">${escapeHtml(g.titulo)}</span>
        <span class="goal-categoria">${escapeHtml(g.categoria)}</span>
      </div>
      <div class="goal-progreso-bar">
        <div class="goal-progreso-fill" style="width:${g.progreso}%"></div>
      </div>
      <div class="goal-actions">
        <button class="btn-secondary" data-accion="editar" data-id="${g.id}">Editar</button>
        <button class="btn-secondary" data-accion="eliminar" data-id="${g.id}">Eliminar</button>
      </div>
    `;
    lista.appendChild(item);
  });

  lista.querySelectorAll("[data-accion='editar']").forEach((btn) => {
    btn.addEventListener("click", () => abrirFormMeta(goals.find((g) => g.id === btn.dataset.id)));
  });
  lista.querySelectorAll("[data-accion='eliminar']").forEach((btn) => {
    btn.addEventListener("click", () => eliminarGoal(btn.dataset.id));
  });
}

function abrirFormMeta(goal) {
  const form = document.getElementById("goal-form");
  form.hidden = false;
  if (goal) {
    editandoGoalId = goal.id;
    document.getElementById("goal-id").value = goal.id;
    document.getElementById("goal-titulo").value = goal.titulo;
    document.getElementById("goal-categoria").value = goal.categoria;
    document.getElementById("goal-progreso").value = goal.progreso;
    document.getElementById("goal-progreso-valor").textContent = goal.progreso;
  } else {
    editandoGoalId = null;
    form.reset();
    document.getElementById("goal-progreso-valor").textContent = 0;
  }
}

function cerrarFormMeta() {
  document.getElementById("goal-form").hidden = true;
  document.getElementById("goal-form").reset();
  editandoGoalId = null;
}

async function guardarGoal(e) {
  e.preventDefault();
  const titulo = document.getElementById("goal-titulo").value.trim();
  const categoria = document.getElementById("goal-categoria").value.trim();
  const progreso = Number(document.getElementById("goal-progreso").value);

  if (editandoGoalId) {
    await fetch(`${API}/goals/${editandoGoalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, categoria, progreso }),
    });
  } else {
    await fetch(`${API}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, categoria, progreso }),
    });
  }
  cerrarFormMeta();
  cargarGoals();
}

async function eliminarGoal(id) {
  if (!confirm("Eliminar esta meta?")) return;
  await fetch(`${API}/goals/${id}`, { method: "DELETE" });
  cargarGoals();
}

// ---- Calendario ----

let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let calendarioData = {};
let fechaSeleccionada = null;

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

async function cargarCalendario() {
  const res = await fetch(`${API}/calendar`);
  calendarioData = await res.json();
  renderCalendario();
}

function renderCalendario() {
  renderCalendarioEn("calendar-grid-resumen", "calendar-titulo-resumen", false);
  renderCalendarioEn("calendar-grid-editar", "calendar-titulo-editar", true);
}

function renderCalendarioEn(gridId, tituloId, interactivo) {
  document.getElementById(tituloId).textContent = `${NOMBRES_MES[mesActual]} ${anioActual}`;

  const grid = document.getElementById(gridId);
  grid.innerHTML = "";

  ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].forEach((d) => {
    const label = document.createElement("div");
    label.className = "calendar-day-label";
    label.textContent = d;
    grid.appendChild(label);
  });

  const primerDia = new Date(anioActual, mesActual, 1);
  // getDay(): 0=domingo..6=sabado -> convertir a lunes=0..domingo=6
  const offset = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    const vacio = document.createElement("div");
    vacio.className = "calendar-day empty";
    grid.appendChild(vacio);
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = `${anioActual}-${String(mesActual + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const info = calendarioData[fecha];
    const celda = document.createElement("button");
    celda.type = "button";
    celda.className = "calendar-day" + (info ? ` ${info.color}` : "") + (interactivo ? "" : " readonly");
    celda.textContent = dia;
    celda.title = info && info.nota ? info.nota : "";
    if (interactivo) {
      celda.addEventListener("click", () => abrirModalDia(fecha, info));
    } else {
      celda.disabled = true;
    }
    grid.appendChild(celda);
  }
}

function cambiarMes(delta) {
  mesActual += delta;
  if (mesActual < 0) {
    mesActual = 11;
    anioActual -= 1;
  } else if (mesActual > 11) {
    mesActual = 0;
    anioActual += 1;
  }
  renderCalendario();
}

function abrirModalDia(fecha, info) {
  fechaSeleccionada = fecha;
  document.getElementById("dia-modal-fecha").textContent = fecha;
  document.getElementById("dia-nota").value = info ? info.nota || "" : "";
  const radios = document.querySelectorAll("#dia-form input[name='color']");
  radios.forEach((r) => (r.checked = info ? r.value === info.color : false));
  document.getElementById("dia-modal").hidden = false;
}

function cerrarModalDia() {
  document.getElementById("dia-modal").hidden = true;
  fechaSeleccionada = null;
}

async function guardarDia(e) {
  e.preventDefault();
  const color = document.querySelector("#dia-form input[name='color']:checked");
  if (!color || !fechaSeleccionada) return;
  const nota = document.getElementById("dia-nota").value.trim();
  await fetch(`${API}/calendar/${fechaSeleccionada}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ color: color.value, nota }),
  });
  cerrarModalDia();
  cargarCalendario();
}

// ---- Banco de motivacion ----

async function cargarMotivacion() {
  const [notesRes, imagesRes] = await Promise.all([
    fetch(`${API}/notes`),
    fetch(`${API}/images`),
  ]);
  renderNotasGrid(await notesRes.json());
  renderImagenesGrid(await imagesRes.json());
}

function franjaBadge(franja) {
  return franja === "manana" || franja === "noche" ? franja : "";
}

function renderNotasGrid(notes) {
  const grid = document.getElementById("notas-grid");
  grid.innerHTML = "";
  if (notes.length === 0) {
    grid.innerHTML = "<p class='motivacion-vacio'>No hay frases todavia.</p>";
    return;
  }
  notes.forEach((n) => {
    const badge = franjaBadge(n.franja);
    const card = document.createElement("div");
    card.className = "motivacion-card";
    card.innerHTML = `
      ${badge ? `<span class="motivacion-badge">${badge}</span>` : ""}
      <span class="motivacion-card-texto">${escapeHtml(n.texto)}</span>
      <button class="btn-secondary motivacion-card-eliminar">Eliminar</button>
    `;
    card.querySelector(".motivacion-card-eliminar").addEventListener("click", () => eliminarNota(n.id));
    grid.appendChild(card);
  });
}

function renderImagenesGrid(images) {
  const grid = document.getElementById("imagenes-grid");
  grid.innerHTML = "";
  if (images.length === 0) {
    grid.innerHTML = "<p class='motivacion-vacio'>No hay imagenes todavia.</p>";
    return;
  }
  images.forEach((img) => {
    const badge = franjaBadge(img.franja);
    const card = document.createElement("div");
    card.className = "motivacion-card";
    card.innerHTML = `
      ${badge ? `<span class="motivacion-badge">${badge}</span>` : ""}
      <img src="/images/${img.filename}" alt="Imagen motivacional">
      <button class="btn-secondary motivacion-card-eliminar">Eliminar</button>
    `;
    card.querySelector(".motivacion-card-eliminar").addEventListener("click", () => eliminarImagen(img.id));
    grid.appendChild(card);
  });
}

async function agregarNota(e) {
  e.preventDefault();
  const texto = document.getElementById("nota-texto").value.trim();
  const franja = document.getElementById("nota-franja").value;
  if (!texto) return;
  await fetch(`${API}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, franja }),
  });
  document.getElementById("nota-form").reset();
  cargarMotivacion();
}

async function eliminarNota(id) {
  if (!confirm("Eliminar esta frase?")) return;
  await fetch(`${API}/notes/${id}`, { method: "DELETE" });
  cargarMotivacion();
}

async function agregarImagen(e) {
  e.preventDefault();
  const fileInput = document.getElementById("imagen-file");
  const franja = document.getElementById("imagen-franja").value;
  if (!fileInput.files.length) return;
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("franja", franja);
  await fetch(`${API}/images`, { method: "POST", body: formData });
  document.getElementById("imagen-form").reset();
  cargarMotivacion();
}

async function eliminarImagen(id) {
  if (!confirm("Eliminar esta imagen?")) return;
  await fetch(`${API}/images/${id}`, { method: "DELETE" });
  cargarMotivacion();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---- Init ----

document.addEventListener("DOMContentLoaded", () => {
  aplicarTema();
  cambiarTab(0);
  inicializarSwipe();

  cargarRandom();
  cargarGoals();
  cargarCalendario();
  cargarMotivacion();

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => cambiarTab(Number(btn.dataset.tab)));
  });

  document.getElementById("btn-nueva-meta").addEventListener("click", () => abrirFormMeta(null));
  document.getElementById("btn-cancelar-meta").addEventListener("click", cerrarFormMeta);
  document.getElementById("goal-form").addEventListener("submit", guardarGoal);
  document.getElementById("goal-progreso").addEventListener("input", (e) => {
    document.getElementById("goal-progreso-valor").textContent = e.target.value;
  });

  document.querySelectorAll(".btn-mes-anterior").forEach((btn) => {
    btn.addEventListener("click", () => cambiarMes(-1));
  });
  document.querySelectorAll(".btn-mes-siguiente").forEach((btn) => {
    btn.addEventListener("click", () => cambiarMes(1));
  });
  document.getElementById("dia-form").addEventListener("submit", guardarDia);
  document.getElementById("btn-cerrar-modal").addEventListener("click", cerrarModalDia);

  document.getElementById("nota-form").addEventListener("submit", agregarNota);
  document.getElementById("imagen-form").addEventListener("submit", agregarImagen);
});
