/* Alke Wallet - lógica principal (jQuery + localStorage)
   Objetivo: código claro, modular y fácil de leer.
*/

const KEYS = {
  users: "aw_users",
  currentUser: "aw_current_user",
  balancePrefix: "aw_balance_",
  contactsPrefix: "aw_contacts_",
  txPrefix: "aw_transactions_"
};

$(document).ready(function () {
  const page = $("body").data("page");

  // Protección de pantallas (si no hay sesión, vuelve a login)
  if (!["login", "register"].includes(page)) {
    if (!getCurrentUser()) {
      window.location.href = "login.html";
      return;
    }
  }

  if (page === "login") initLogin();
  if (page === "register") initRegister();
  if (page === "menu") initMenu();
  if (page === "deposit") initDeposit();
  if (page === "sendmoney") initSendMoney();
  if (page === "transactions") initTransactions();
  if (page === "withdraw") initWithdraw();

});

/* =========================
   Pantalla: Retiro
========================= */
function initWithdraw() {
  const email = getCurrentUser();
  $("#currentBalance").text(formatCLP(getBalance(email)));

  $("#withdrawForm").submit(function (e) {
    e.preventDefault();

    const $amount = $("#withdrawAmount");
    const $btn = $(this).find("button[type='submit']");
    const amount = Number($amount.val());

    markInvalid($amount, false);

    if (!Number.isFinite(amount) || amount <= 0) {
      markInvalid($amount, true);
      showAlert("#alertWithdraw", "danger", "Ingresa un monto válido mayor a 0.");
      return;
    }

    const current = getBalance(email);

    if (amount > current) {
      markInvalid($amount, true);
      showAlert("#alertWithdraw", "danger", "Saldo insuficiente para realizar el retiro.");
      return;
    }

    setButtonLoading($btn, true, "Realizar retiro");

    const newBalance = current - amount;
    setBalance(email, newBalance);

    addTransaction(email, {
      tipo: "retiro",
      titulo: "Retiro",
      amount: -amount,
      datetime: nowStamp()
    });

    $("#withdrawInfo").text(`Monto retirado: ${formatCLP(amount)}`);
    showAlert("#alertWithdraw", "success", "Retiro realizado. Volviendo al menú...");

    setTimeout(() => window.location.href = "menu.html", 1500);
  });
}


/* =========================
   Helpers UI
========================= */
function showAlert(containerSelector, type, message) {
  const html = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>`;
  $(containerSelector).html(html);
}

function formatCLP(amount) {
  return Number(amount).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  });
}

// Loader simple en botones (UX)
function setButtonLoading($btn, isLoading, labelNormal) {
  if (isLoading) {
    $btn.prop("disabled", true);
    $btn.html(`<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...`);
  } else {
    $btn.prop("disabled", false);
    $btn.text(labelNormal);
  }
}

// Validación visual con Bootstrap
function markInvalid($input, isInvalid) {
  if (isInvalid) $input.addClass("is-invalid");
  else $input.removeClass("is-invalid");
}

/* =========================
   Storage: usuarios y sesión
========================= */
function getUsers() {
  const raw = localStorage.getItem(KEYS.users);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

function userExists(email) {
  return getUsers().some(u => u.email.toLowerCase() === email.toLowerCase());
}

function createUser(name, email, password) {
  const users = getUsers();
  users.push({ name, email, password });
  saveUsers(users);

  // Inicialización por usuario
  setBalance(email, 250000);
  saveTransactions(email, []);
  saveContacts(email, []);
}

function setCurrentUser(email) {
  localStorage.setItem(KEYS.currentUser, email);
}

function getCurrentUser() {
  return localStorage.getItem(KEYS.currentUser);
}

function clearSession() {
  localStorage.removeItem(KEYS.currentUser);
}

/* =========================
   Storage: saldo
========================= */
function balanceKey(email) {
  return KEYS.balancePrefix + email.toLowerCase();
}

function getBalance(email) {
  const raw = localStorage.getItem(balanceKey(email));
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function setBalance(email, value) {
  const n = Number(value);
  localStorage.setItem(balanceKey(email), String(Number.isFinite(n) ? n : 0));
}

/* =========================
   Storage: transacciones
   tx = { tipo: 'deposito'|'envio'|'recibo', titulo, amount, datetime }
========================= */
function txKey(email) {
  return KEYS.txPrefix + email.toLowerCase();
}

function getTransactions(email) {
  const raw = localStorage.getItem(txKey(email));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveTransactions(email, list) {
  localStorage.setItem(txKey(email), JSON.stringify(list));
}

function addTransaction(email, tx) {
  const list = getTransactions(email);
  list.unshift(tx);
  saveTransactions(email, list);
}

function nowStamp() {
  const d = new Date();
  return d.toLocaleString("es-CL", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

/* =========================
   Storage: contactos
========================= */
function contactsKey(email) {
  return KEYS.contactsPrefix + email.toLowerCase();
}

function getContacts(email) {
  const raw = localStorage.getItem(contactsKey(email));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveContacts(email, list) {
  localStorage.setItem(contactsKey(email), JSON.stringify(list));
}

function addContact(email, contact) {
  const list = getContacts(email);
  list.push(contact);
  saveContacts(email, list);
}

/* =========================
   Pantalla: Login
========================= */
function initLogin() {
  $("#loginForm").submit(function (e) {
    e.preventDefault();

    const email = $("#email").val().trim();
    const password = $("#password").val().trim();

    if (!email || !password) {
      showAlert("#alertLogin", "danger", "Completa email y contraseña.");
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      showAlert("#alertLogin", "danger", "No existe una cuenta con ese email. Regístrate primero.");
      return;
    }

    if (user.password !== password) {
      showAlert("#alertLogin", "danger", "Contraseña incorrecta.");
      return;
    }

    setCurrentUser(user.email);
    showAlert("#alertLogin", "success", "Inicio de sesión exitoso. Redirigiendo...");

    setTimeout(() => window.location.href = "menu.html", 900);
  });
}

/* =========================
   Pantalla: Registro
========================= */
function initRegister() {
  $("#registerForm").submit(function (e) {
    e.preventDefault();

    const name = $("#fullName").val().trim();
    const email = $("#regEmail").val().trim();
    const pass1 = $("#regPassword").val().trim();
    const pass2 = $("#regPassword2").val().trim();

    if (!name || !email || !pass1 || !pass2) {
      showAlert("#alertRegister", "danger", "Completa todos los campos.");
      return;
    }

    if (pass1.length < 4) {
      showAlert("#alertRegister", "danger", "La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (pass1 !== pass2) {
      showAlert("#alertRegister", "danger", "Las contraseñas no coinciden.");
      return;
    }

    if (userExists(email)) {
      showAlert("#alertRegister", "warning", "Ese email ya está registrado.");
      return;
    }

    createUser(name, email, pass1);
    showAlert("#alertRegister", "success", "Cuenta creada correctamente. Redirigiendo al login...");

    setTimeout(() => window.location.href = "login.html", 1000);
  });
}

/* =========================
   Pantalla: Menú
========================= */
function initMenu() {
  const email = getCurrentUser();
  const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

  $("#welcomeUser").text(user ? `Sesión: ${user.name}` : `Sesión: ${email}`);
  $("#balanceAmount").text(formatCLP(getBalance(email)));

  $("#resetDemoBtn").off("click").on("click", function (e) {
  e.preventDefault();

  const ok = confirm("¿Seguro que quieres borrar los datos de la demo? Esta acción no se puede deshacer.");
  if (!ok) return;

  resetDemoData();

  // Opcional: también corta sesión por si acaso
  clearSession();

  alert("Datos borrados. Volviendo al login...");
  window.location.href = "login.html";
});


  $("#logoutBtn").off("click").on("click", function () {
    clearSession();
    window.location.href = "login.html";
  });

  $("#goDeposit").off("click").on("click", function () {
    showAlert("#alertMenu", "info", "Redirigiendo a Depositar...");
    setTimeout(() => window.location.href = "deposit.html", 600);
  });

  $("#goSend").off("click").on("click", function () {
    showAlert("#alertMenu", "info", "Redirigiendo a Enviar Dinero...");
    setTimeout(() => window.location.href = "sendmoney.html", 600);
  });

  $("#goTx").off("click").on("click", function () {
    showAlert("#alertMenu", "info", "Redirigiendo a Últimos Movimientos...");
    setTimeout(() => window.location.href = "transactions.html", 600);
  });
    // Botón y navbar: Retirar
  $("#goWithdraw, #navWithdraw").off("click").on("click", function (e) {
    e.preventDefault();
    showAlert("#alertMenu", "info", "Redirigiendo a Retirar...");
    setTimeout(() => window.location.href = "withdraw.html", 600);
  });

  // Navbar: Depositar
  $("#navDeposit").off("click").on("click", function (e) {
    e.preventDefault();
    $("#goDeposit").trigger("click");
  });

  // Navbar: Enviar
  $("#navSend").off("click").on("click", function (e) {
    e.preventDefault();
    $("#goSend").trigger("click");
  });

  // Navbar: Movimientos
  $("#navTx").off("click").on("click", function (e) {
    e.preventDefault();
    $("#goTx").trigger("click");
  });
}



/* =========================
   Pantalla: Depósito
========================= */
function initDeposit() {
  const email = getCurrentUser();
  $("#currentBalance").text(formatCLP(getBalance(email)));

  $("#depositForm").submit(function (e) {
    e.preventDefault();

    const $amount = $("#depositAmount");
    const $btn = $(this).find("button[type='submit']");
    const amount = Number($amount.val());

    markInvalid($amount, false);

    if (!Number.isFinite(amount) || amount <= 0) {
      markInvalid($amount, true);
      showAlert("#alertDeposit", "danger", "Ingresa un monto válido mayor a 0.");
      return;
    }

    // UX: spinner en el botón
    setButtonLoading($btn, true, "Realizar depósito");

    const current = getBalance(email);
    const newBalance = current + amount;
    setBalance(email, newBalance);

    addTransaction(email, {
      tipo: "deposito",
      titulo: "Depósito",
      amount: amount,
      datetime: nowStamp()
    });

    $("#depositInfo").text(`Monto depositado: ${formatCLP(amount)}`);
    showAlert("#alertDeposit", "success", "Depósito realizado. Volviendo al menú...");

    setTimeout(() => window.location.href = "menu.html", 1500);
  });
}

/* =========================
   Pantalla: Enviar / Recibir
========================= */
function initSendMoney() {
  const email = getCurrentUser();

  // Toggle nuevo contacto
  $("#toggleContactForm").click(() => $("#contactFormBox").toggleClass("d-none"));
  $("#cancelContactForm").click(() => $("#contactFormBox").addClass("d-none"));

  // Cargar contactos
  renderContactsSelect(email);
    // Autocompletar (sugerencias mientras escribe)
  $("#searchTerm").on("input", function () {
    const term = $(this).val().trim().toLowerCase();
    const contacts = getContacts(email);
    const $box = $("#suggestions");

    if (!term) {
      $box.addClass("d-none").empty();
      return;
    }

    const matches = contacts
      .map((c, i) => ({ c, i }))
      .filter(x =>
        x.c.nombre.toLowerCase().includes(term) ||
        (x.c.alias && x.c.alias.toLowerCase().includes(term))
      )
      .slice(0, 6);

    if (matches.length === 0) {
      $box.html(`<button type="button" class="list-group-item list-group-item-action disabled">Sin coincidencias</button>`)
          .removeClass("d-none");
      return;
    }

    const html = matches.map(x => {
      const alias = x.c.alias ? ` • ${x.c.alias}` : "";
      return `
        <button type="button" class="list-group-item list-group-item-action" data-index="${x.i}">
          <strong>${x.c.nombre}</strong><span class="text-muted">${alias}</span><br>
          <small class="text-muted">${x.c.banco}</small>
        </button>`;
    }).join("");

    $box.html(html).removeClass("d-none");
  });

  // Click en sugerencia: selecciona contacto y habilita enviar
  $("#suggestions").on("click", "button[data-index]", function () {
    const idx = $(this).data("index");
    $("#contactSelect").val(String(idx)).trigger("change");
    $("#suggestions").addClass("d-none").empty();
  });

  // Ocultar sugerencias al salir del campo
  $(document).on("click", function (e) {
    const clickedInside = $(e.target).closest("#suggestions, #searchTerm").length > 0;
    if (!clickedInside) $("#suggestions").addClass("d-none").empty();
  });


  // Mostrar botón enviar si hay selección
  $("#contactSelect").on("change", function () {
    if ($(this).val()) $("#sendBtn").removeClass("d-none");
    else $("#sendBtn").addClass("d-none");
  });

  // Guardar contacto (con validación visual)
  $("#contactForm").submit(function (e) {
    e.preventDefault();

    const $btn = $("#saveContactBtn");
    const $name = $("#cName");
    const $cbu = $("#cCBU");
    const $bank = $("#cBank");

    const nombre = $name.val().trim();
    const cbu = $cbu.val().trim();
    const alias = $("#cAlias").val().trim();
    const banco = $bank.val().trim();

    markInvalid($name, false);
    markInvalid($cbu, false);
    markInvalid($bank, false);

    let hasError = false;

    if (!nombre) { markInvalid($name, true); hasError = true; }
    if (!banco) { markInvalid($bank, true); hasError = true; }
    if (!/^\d+$/.test(cbu) || cbu.length < 10) { markInvalid($cbu, true); hasError = true; }

    if (hasError) {
      showAlert("#alertSend", "danger", "Revisa los campos del contacto.");
      return;
    }

    setButtonLoading($btn, true, "Guardar");

    addContact(email, { nombre, cbu, alias, banco });
    renderContactsSelect(email);
    $("#contactForm")[0].reset();
    $("#contactFormBox").addClass("d-none");

    showAlert("#alertSend", "success", "Contacto guardado.");
    setTimeout(() => setButtonLoading($btn, false, "Guardar"), 350);
  });

  // Buscar
  $("#searchForm").submit(function (e) {
    e.preventDefault();
    const term = $("#searchTerm").val().trim().toLowerCase();

    if (!term) {
      renderContactsSelect(email);
      showAlert("#alertSend", "info", "Mostrando todos los contactos.");
      return;
    }

    const contacts = getContacts(email);
    const filtered = contacts.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      (c.alias && c.alias.toLowerCase().includes(term))
    );

    renderContactsSelect(email, filtered);
    showAlert("#alertSend", "info", "Resultados filtrados.");
  });

  // Enviar dinero
  $("#sendForm").submit(function (e) {
    e.preventDefault();

    const $select = $("#contactSelect");
    const $amount = $("#sendAmount");
    const $btn = $("#sendBtn");

    const idx = $select.val();
    const amount = Number($amount.val());

    markInvalid($select, false);
    markInvalid($amount, false);

    if (!idx) { markInvalid($select, true); return; }
    if (isNaN(amount) || amount <= 0) { markInvalid($amount, true); return; }

    const balance = getBalance(email);
    if (amount > balance) {
      showAlert("#alertSend", "danger", "Saldo insuficiente.");
      return;
    }

    setButtonLoading($btn, true, "Enviar dinero");

    const contacts = getContacts(email);
    const contact = contacts[Number(idx)];

    setBalance(email, balance - amount);

    addTransaction(email, {
      tipo: "envio",
      titulo: `Envío a ${contact.nombre}`,
      amount: -amount,
      datetime: nowStamp()
    });

    $("#sendMsg").text(`Envío realizado: ${formatCLP(amount)} a ${contact.nombre}`);
    showAlert("#alertSend", "success", "Transferencia realizada correctamente.");
    $("#sendAmount").val("");

    setTimeout(() => setButtonLoading($btn, false, "Enviar dinero"), 350);
  });

  // Recibir dinero (simulado)
  $("#receiveForm").submit(function (e) {
    e.preventDefault();

    const $from = $("#fromName");
    const $amount = $("#receiveAmount");
    const $btn = $("#receiveBtn");

    const from = $from.val().trim();
    const amount = Number($amount.val());

    markInvalid($from, false);
    markInvalid($amount, false);

    let hasError = false;
    if (!from) { markInvalid($from, true); hasError = true; }
    if (isNaN(amount) || amount <= 0) { markInvalid($amount, true); hasError = true; }

    if (hasError) return;

    setButtonLoading($btn, true, "Simular recepción");

    const newBalance = getBalance(email) + amount;
    setBalance(email, newBalance);

    addTransaction(email, {
      tipo: "recibo",
      titulo: `Recibo de ${from}`,
      amount: amount,
      datetime: nowStamp()
    });

    $("#receiveMsg").text(`Recibido: ${formatCLP(amount)} de ${from}`);
    showAlert("#alertSend", "success", "Recepción registrada correctamente.");
    $("#receiveForm")[0].reset();

    setTimeout(() => setButtonLoading($btn, false, "Simular recepción"), 350);
  });
}

function renderContactsSelect(email, listOverride) {
  const contacts = listOverride || getContacts(email);
  const $select = $("#contactSelect");

  $select.empty();
  $select.append('<option value="">Selecciona...</option>');

  contacts.forEach((c, index) => {
    const label = `${c.nombre} (${c.banco}${c.alias ? " - " + c.alias : ""})`;
    $select.append(`<option value="${index}">${label}</option>`);
  });

  $("#sendBtn").addClass("d-none");
}

/* =========================
   Pantalla: Movimientos
========================= */
function initTransactions() {
  const email = getCurrentUser();
  renderTxList(email, "todos");

  $("#txFilter").on("change", function () {
    renderTxList(email, $(this).val());
  });
}

function renderTxList(email, filter) {
  const list = getTransactions(email);
  const $ul = $("#txList");
  $ul.empty();

  const filtered = (filter === "todos")
    ? list
    : list.filter(tx => tx.tipo === filter);

  if (filtered.length === 0) {
    $ul.append('<li class="text-muted">No hay movimientos para este filtro.</li>');
    return;
  }

  filtered.forEach(tx => {
    const cls = tx.amount >= 0 ? "pos" : "neg";
    const sign = tx.amount >= 0 ? "+ " : "- ";
    const item = `
      <li>
        <div>
          <div class="tx-title">${tx.titulo}</div>
          <div class="tx-date">${tx.datetime}</div>
        </div>
        <div class="tx-amount ${cls}">${sign}${formatCLP(Math.abs(tx.amount))}</div>
      </li>
    `;
    $ul.append(item);
  });
}
function resetDemoData() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("aw_")) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
