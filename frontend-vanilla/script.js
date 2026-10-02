// ============================================================
// MedSOP AI — vanilla JS frontend, all 8 pages
// Same backend, zero changes needed there.
// ============================================================
const API_BASE = "http://localhost:8000";

// ---- global-ish state (module scope, not localStorage, so it
// resets on page refresh but persists while navigating) ----
let messages = [];       // chat history
let loading = false;     // chat "waiting for AI" flag
let sopsCache = [];      // last fetched SOP list, reused by Repository + Summary pages
let pendingQuery = null; // set by Emergency page, consumed by Chat page

const QUICK_QUERIES = [
  "How do I admit a patient?",
  "What is the discharge workflow?",
  "Code Blue emergency protocol",
  "PPE guidelines for ICU",
  "Infection control procedure",
  "Patient safety checklist",
];

const EMERGENCY_ITEMS = [
  { title: "Code Blue",        sub: "Cardiac / respiratory arrest", q: "What is the Code Blue emergency protocol?" },
  { title: "Cardiac Arrest",   sub: "ICU / ward response steps",    q: "What is the protocol for a cardiac arrest?" },
  { title: "Fire Evacuation",  sub: "Ward evacuation procedure",    q: "What is the fire evacuation procedure?" },
  { title: "Mass Casualty",    sub: "Multi-patient incident plan",  q: "What is the mass casualty incident protocol?" },
  { title: "Chemical Spill",   sub: "Hazardous material response",  q: "What is the chemical spill response procedure?" },
  { title: "Anaphylaxis",      sub: "Severe allergic reaction",     q: "What is the emergency protocol for anaphylaxis?" },
];

// ============================================================
// API HELPER — every page calls through this. Handles the auth
// header and logs the user out automatically if the token died.
// ============================================================
async function apiFetch(path, { method = "GET", body, isForm = false } = {}) {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null; // no content, e.g. DELETE
  return res.json();
}

// ============================================================
// ELEMENTS
// ============================================================
const loginScreen = document.getElementById("login-screen");
const appScreen   = document.getElementById("app-screen");
const loginForm   = document.getElementById("login-form");
const loginBtn    = document.getElementById("login-btn");
const loginError  = document.getElementById("login-error");
const userNameEl  = document.getElementById("user-name");
const userRoleEl  = document.getElementById("user-role");
const logoutBtn   = document.getElementById("logout-btn");
const viewEl      = document.getElementById("view");
const navItems    = document.querySelectorAll(".nav-item");

// ============================================================
// BOOT + AUTH
// ============================================================
function boot() {
  const token = localStorage.getItem("token");
  if (token) {
    userNameEl.textContent = localStorage.getItem("userName") || "";
    userRoleEl.textContent = localStorage.getItem("userRole") || "";
    applyRoleVisibility();
    showApp();
    route();
  } else {
    showLogin();
  }
}

function applyRoleVisibility() {
  const isAdmin = localStorage.getItem("userRole") === "admin";
  document.querySelectorAll(".admin-only").forEach((el) => {
    el.classList.toggle("hidden", !isAdmin);
  });
}

function showLogin() { loginScreen.classList.remove("hidden"); appScreen.classList.add("hidden"); }
function showApp()   { loginScreen.classList.add("hidden"); appScreen.classList.remove("hidden"); }

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");
  loginBtn.disabled = true;

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Incorrect email or password");
    }
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userRole", data.role);
    userNameEl.textContent = data.name;
    userRoleEl.textContent = data.role;
    applyRoleVisibility();
    showApp();
    window.location.hash = "#dashboard";
    route();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  messages = []; sopsCache = []; pendingQuery = null;
  showLogin();
}
logoutBtn.addEventListener("click", logout);

// ============================================================
// ROUTER — reads location.hash, mounts the matching page,
// highlights the matching nav item. This is the whole "SPA" trick.
// ============================================================
const ROUTES = {
  dashboard:  renderDashboard,
  chat:       renderChat,
  decision:   renderDecision,
  repository: renderRepository,
  summary:    renderSummary,
  analytics:  renderAnalytics,
  users:      renderUsers,
};

function route() {
  const page = (window.location.hash || "#dashboard").slice(1);
  navItems.forEach((el) => el.classList.toggle("active", el.dataset.page === page));
  const fn = ROUTES[page] || renderDashboard;
  viewEl.innerHTML = "";
  fn(viewEl);
}
window.addEventListener("hashchange", route);

// ============================================================
// small DOM helper — avoids repeating createElement boilerplate
// ============================================================
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  children.flat().forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

boot();

// ============================================================
// PAGE 1 — DASHBOARD
// ============================================================
async function renderDashboard(container) {
  const isAdmin = localStorage.getItem("userRole") === "admin";
  container.appendChild(el("div", { class: "page-header" },
    el("h1", {}, `Welcome, ${localStorage.getItem("userName") || ""}`),
    el("p", {}, "Jump into any part of the SOP assistant below.")
  ));

  if (isAdmin) {
    const statsWrap = el("div", { class: "card-grid" });
    container.appendChild(statsWrap);
    try {
      const stats = await apiFetch("/api/v1/analytics/overview");
      statsWrap.appendChild(statCard(stats.total_sops, "Total SOPs"));
      statsWrap.appendChild(statCard(stats.total_queries, "Questions Asked"));
      statsWrap.appendChild(statCard(stats.total_users, "Users"));
      statsWrap.appendChild(statCard(`${stats.avg_confidence}%`, "Avg. Confidence"));
    } catch { statsWrap.remove(); }
  }

  const links = [
    { title: "Ask a question",      sub: "RAG-powered chat over your SOPs", page: "chat" },
    { title: "Emergency mode",      sub: "Fast access to critical protocols", page: "decision" },
    { title: "SOP repository",      sub: "Browse and manage documents", page: "repository" },
    { title: "Generate a summary",  sub: "Quick, detailed, or bullet form", page: "summary" },
  ];
  if (isAdmin) links.push({ title: "Analytics", sub: "Usage and confidence trends", page: "analytics" });
  if (isAdmin) links.push({ title: "Users", sub: "Manage staff accounts", page: "users" });

  const grid = el("div", { class: "link-card-grid" });
  links.forEach((l) => {
    grid.appendChild(el("a", { class: "link-card", href: `#${l.page}` },
      el("span", { class: "lc-title" }, l.title),
      el("span", { class: "lc-sub" }, l.sub)
    ));
  });
  container.appendChild(grid);
}

function statCard(value, label) {
  return el("div", { class: "stat-card" },
    el("div", { class: "stat-value" }, String(value)),
    el("div", { class: "stat-label" }, label)
  );
}

// ============================================================
// PAGE 2 — CHAT (the core RAG page)
// ============================================================
function renderChat(container) {
  const wrap = el("div", { class: "chat-column", style: "height:100%;" });
  const messagesEl = el("div", { class: "messages" });
  const typingRow = el("div", { class: "typing-row hidden" },
    el("span", { class: "dot" }), el("span", { class: "dot" }), el("span", { class: "dot" })
  );
  const input = el("input", { type: "text", id: "chat-input", placeholder: "Ask about any hospital procedure…", autocomplete: "off" });
  const sendBtn = el("button", { type: "submit", id: "send-btn", "aria-label": "Send" }, "➤");
  const form = el("form", { class: "chat-input-row", onsubmit: (e) => { e.preventDefault(); fireSend(); } }, input, sendBtn);

  const quickPanel = el("aside", { class: "quick-panel", style: "border-right:1px solid var(--border-c);" },
    el("h3", {}, "Quick queries"),
    el("div", { class: "quick-list" },
      ...QUICK_QUERIES.map((q) => el("button", { class: "quick-item", type: "button", onclick: () => { input.value = ""; sendMessage(q); } }, q))
    )
  );

  const layout = el("div", { style: "display:grid;grid-template-columns:220px 1fr;height:calc(100vh - 61px);margin:-28px -32px;" },
    quickPanel,
    el("div", { class: "chat-column" }, messagesEl, typingRow, form)
  );
  container.appendChild(layout);

  function fireSend() { const v = input.value.trim(); input.value = ""; sendMessage(v); }

  // re-render any messages already in history (so leaving/returning to Chat keeps context)
  if (messages.length === 0) {
    pushMessage({ role: "ai", text: "Hello! I'm MedSOP AI. Ask me about any hospital procedure — admission, discharge, emergency protocols, and more." }, messagesEl);
  } else {
    messages.forEach((m) => renderMessage(m, messagesEl));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // a query handed off from the Emergency page auto-sends here
  if (pendingQuery) {
    const q = pendingQuery; pendingQuery = null;
    sendMessage(q);
  }

  function pushMessage(msg, target) {
    messages.push(msg);
    renderMessage(msg, target);
    target.scrollTop = target.scrollHeight;
  }

  async function sendMessage(text) {
    if (!text || loading) return;
    pushMessage({ role: "user", text }, messagesEl);
    loading = true; sendBtn.disabled = true; typingRow.classList.remove("hidden");
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const data = await apiFetch("/api/v1/chat/query", { method: "POST", body: { question: text } });
      pushMessage({ role: "ai", text: data.answer, steps: data.steps, sources: data.sources, confidence: data.confidence }, messagesEl);
    } catch (err) {
      pushMessage({ role: "ai", text: "Sorry, I couldn't connect to the AI service. Please try again." }, messagesEl);
    } finally {
      loading = false; sendBtn.disabled = false; typingRow.classList.add("hidden");
    }
  }

  // exposed so quick-query buttons / emergency handoff can reuse the same closure
  window.__sendChatMessage = sendMessage;
}

// Shared rendering rule: steps -> numbered list, sources -> tags + confidence.
// Used only by Chat, but kept as its own function so it stays readable.
function renderMessage(msg, target) {
  const avatar = el("div", { class: "msg-avatar" }, msg.role === "ai" ? "AI" : "U");
  const bubble = el("div", { class: "msg-bubble" }, el("div", {}, msg.text));

  if (msg.steps && msg.steps.length > 0) {
    const list = el("ol", { class: "steps-timeline" });
    msg.steps.forEach((s, i) => list.appendChild(el("li", { "data-n": i + 1 }, s)));
    bubble.appendChild(list);
  }
  if (msg.sources && msg.sources.length > 0) {
    const row = el("div", { class: "sources-row" });
    msg.sources.forEach((s) => row.appendChild(el("span", { class: "source-tag" }, s.sop_title)));
    if (msg.confidence != null) row.appendChild(el("span", { class: "confidence-badge" }, `${Math.round(msg.confidence)}% confidence`));
    bubble.appendChild(row);
  }

  target.appendChild(el("div", { class: `msg ${msg.role}` }, avatar, bubble));
}

// ============================================================
// PAGE 3 — DECISION / EMERGENCY MODE
// Big, low-friction cards. Clicking one hands the query off to
// Chat and jumps there — mirrors what the React DecisionPage did.
// ============================================================
function renderDecision(container) {
  container.appendChild(el("div", { class: "page-header" },
    el("h1", {}, "Emergency Mode"),
    el("p", {}, "One tap to the protocol you need — no typing required.")
  ));

  const grid = el("div", { class: "emergency-grid" });
  EMERGENCY_ITEMS.forEach((item) => {
    grid.appendChild(el("button", {
      class: "emergency-card",
      type: "button",
      onclick: () => {
        pendingQuery = item.q;
        window.location.hash = "#chat";
      },
    },
      el("div", { class: "ec-title" }, item.title),
      el("div", { class: "ec-sub" }, item.sub)
    ));
  });
  container.appendChild(grid);
}

// ============================================================
// PAGE 4 — REPOSITORY (list, filter, upload, delete SOPs)
// ============================================================
const SOP_CATEGORIES = ["admission", "discharge", "infection", "emergency", "clinical", "safety", "admin"];

async function renderRepository(container) {
  const isAdmin = localStorage.getItem("userRole") === "admin";

  container.appendChild(el("div", { class: "page-header" },
    el("h1", {}, "SOP Repository"),
    el("p", {}, "Every procedure document indexed by the assistant.")
  ));

  const searchInput = el("input", { type: "text", placeholder: "Search by title…" });
  const categorySelect = el("select", {},
    el("option", { value: "" }, "All categories"),
    ...SOP_CATEGORIES.map((c) => el("option", { value: c }, c))
  );
  const uploadBtn = el("button", { class: "btn-primary" }, "+ Upload SOP");
  const toolbar = el("div", { class: "toolbar" }, searchInput, categorySelect);
  if (isAdmin) toolbar.appendChild(uploadBtn);
  container.appendChild(toolbar);

  const tableWrap = el("div", {});
  container.appendChild(tableWrap);

  async function loadList() {
    tableWrap.innerHTML = "Loading…";
    try {
      const params = new URLSearchParams();
      if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
      if (categorySelect.value) params.set("category", categorySelect.value);
      const data = await apiFetch(`/api/v1/sops/?${params.toString()}`);
      sopsCache = data.items;
      renderTable(data.items);
    } catch (err) {
      tableWrap.innerHTML = "";
      tableWrap.appendChild(el("div", { class: "empty-state" }, err.message));
    }
  }

  function renderTable(items) {
    tableWrap.innerHTML = "";
    if (items.length === 0) {
      tableWrap.appendChild(el("div", { class: "empty-state" }, "No SOPs found."));
      return;
    }
    const table = el("table", { class: "data-table" });
    table.appendChild(el("thead", {}, el("tr", {},
      el("th", {}, "Title"), el("th", {}, "Category"), el("th", {}, "Status"),
      el("th", {}, "Version"), el("th", {}, "Chunks"), isAdmin ? el("th", {}, "") : null
    )));
    const tbody = el("tbody", {});
    items.forEach((sop) => {
      const row = el("tr", {},
        el("td", {}, sop.title),
        el("td", {}, el("span", { class: "badge cat" }, sop.category)),
        el("td", {}, el("span", { class: `badge status-${sop.status}` }, sop.status)),
        el("td", {}, sop.version || "—"),
        el("td", {}, String(sop.chunk_count))
      );
      if (isAdmin) {
        row.appendChild(el("td", {}, el("button", {
          class: "btn-danger",
          onclick: async () => {
            if (!confirm(`Delete "${sop.title}"? This can't be undone.`)) return;
            try { await apiFetch(`/api/v1/sops/${sop.id}`, { method: "DELETE" }); loadList(); }
            catch (err) { alert(err.message); }
          },
        }, "Delete")));
      }
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
  }

  searchInput.addEventListener("input", debounce(loadList, 350));
  categorySelect.addEventListener("change", loadList);
  uploadBtn.addEventListener("click", () => openUploadModal(loadList));

  loadList();
}

function openUploadModal(onDone) {
  const fileInput = el("input", { type: "file", required: "" });
  const titleInput = el("input", { type: "text", required: "" });
  const catSelect = el("select", {}, ...SOP_CATEGORIES.map((c) => el("option", { value: c }, c)));
  const deptInput = el("input", { type: "text" });
  const versionInput = el("input", { type: "text", placeholder: "e.g. 1.0" });
  const authorInput = el("input", { type: "text" });
  const descInput = el("textarea", {});
  const errorEl = el("p", { class: "error-text hidden" });

  const overlay = el("div", { class: "modal-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } },
    el("div", { class: "modal-box" },
      el("h2", {}, "Upload SOP"),
      field("Document file", fileInput),
      field("Title", titleInput),
      field("Category", catSelect),
      field("Department (optional)", deptInput),
      field("Version (optional)", versionInput),
      field("Author (optional)", authorInput),
      field("Description (optional)", descInput),
      errorEl,
      el("div", { class: "modal-actions" },
        el("button", { class: "btn-secondary", type: "button", onclick: () => overlay.remove() }, "Cancel"),
        el("button", { class: "btn-primary", type: "button", onclick: submit }, "Upload")
      )
    )
  );
  document.body.appendChild(overlay);

  async function submit() {
    if (!fileInput.files[0] || !titleInput.value.trim()) {
      errorEl.textContent = "File and title are required.";
      errorEl.classList.remove("hidden");
      return;
    }
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);
    fd.append("title", titleInput.value.trim());
    fd.append("category", catSelect.value);
    if (deptInput.value) fd.append("department", deptInput.value);
    if (versionInput.value) fd.append("version", versionInput.value);
    if (authorInput.value) fd.append("author", authorInput.value);
    if (descInput.value) fd.append("description", descInput.value);

    try {
      await apiFetch("/api/v1/sops/", { method: "POST", body: fd, isForm: true });
      overlay.remove();
      onDone();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }
  }
}

function field(label, inputEl) {
  return el("div", { class: "form-row" }, el("label", {}, label), inputEl);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ============================================================
// PAGE 5 — SUMMARY (generate quick/detailed/bullet summaries)
// ============================================================
async function renderSummary(container) {
  container.appendChild(el("div", { class: "page-header" },
    el("h1", {}, "SOP Summaries"),
    el("p", {}, "Condense any procedure into a quick, detailed, or bulleted brief.")
  ));

  const sopSelect = el("select", {}, el("option", { value: "" }, "Loading SOPs…"));
  const typeSelect = el("select", {},
    el("option", { value: "quick" }, "Quick"),
    el("option", { value: "detailed" }, "Detailed"),
    el("option", { value: "bullet" }, "Bullet points")
  );
  const genBtn = el("button", { class: "btn-primary" }, "Generate");
  container.appendChild(el("div", { class: "toolbar" }, sopSelect, typeSelect, genBtn));

  const output = el("div", {});
  container.appendChild(output);

  try {
    if (sopsCache.length === 0) {
      const data = await apiFetch("/api/v1/sops/?limit=200");
      sopsCache = data.items;
    }
    sopSelect.innerHTML = "";
    if (sopsCache.length === 0) {
      sopSelect.appendChild(el("option", { value: "" }, "No SOPs uploaded yet"));
    } else {
      sopsCache.forEach((s) => sopSelect.appendChild(el("option", { value: s.id }, s.title)));
    }
  } catch {
    sopSelect.innerHTML = "";
    sopSelect.appendChild(el("option", { value: "" }, "Couldn't load SOPs"));
  }

  genBtn.addEventListener("click", async () => {
    if (!sopSelect.value) return;
    output.innerHTML = "Generating…";
    try {
      const data = await apiFetch("/api/v1/summaries/", {
        method: "POST",
        body: { sop_id: Number(sopSelect.value), summary_type: typeSelect.value },
      });
      output.innerHTML = "";
      const box = el("div", { class: "summary-output" },
        el("h3", {}, data.sop_title),
        el("div", {}, data.content)
      );
      if (data.bullet_points && data.bullet_points.length > 0) {
        const ul = el("ul", {});
        data.bullet_points.forEach((b) => ul.appendChild(el("li", {}, b)));
        box.appendChild(ul);
      }
      output.appendChild(box);
    } catch (err) {
      output.innerHTML = "";
      output.appendChild(el("div", { class: "empty-state" }, err.message));
    }
  });
}

// ============================================================
// PAGE 6 — ANALYTICS (admin only)
// ============================================================
async function renderAnalytics(container) {
  if (localStorage.getItem("userRole") !== "admin") {
    container.appendChild(el("div", { class: "admin-locked" }, "This page is for admins only."));
    return;
  }
  container.appendChild(el("div", { class: "page-header" },
    el("h1", {}, "Analytics"),
    el("p", {}, "How staff are actually using the assistant.")
  ));

  try {
    const overview = await apiFetch("/api/v1/analytics/overview");
    const grid = el("div", { class: "card-grid" },
      statCard(overview.total_sops, "Total SOPs"),
      statCard(overview.total_queries, "Questions Asked"),
      statCard(overview.total_users, "Users"),
      statCard(`${overview.avg_confidence}%`, "Avg. Confidence")
    );
    container.appendChild(grid);

    const topSops = await apiFetch("/api/v1/analytics/top-sops?limit=10");
    container.appendChild(el("h3", { style: "font-family:var(--font-display);font-size:15px;margin:8px 0 14px;" }, "Most searched SOPs"));
    if (topSops.length === 0) {
      container.appendChild(el("div", { class: "empty-state" }, "No queries logged yet."));
      return;
    }
    const max = Math.max(...topSops.map((t) => t.count), 1);
    const barsWrap = el("div", {});
    topSops.forEach((t) => {
      barsWrap.appendChild(el("div", { class: "bar-row" },
        el("span", { class: "bar-label" }, t.title),
        el("span", { class: "bar-track" }, el("span", { class: "bar-fill", style: `width:${(t.count / max) * 100}%` })),
        el("span", { class: "bar-count" }, String(t.count))
      ));
    });
    container.appendChild(barsWrap);
  } catch (err) {
    container.appendChild(el("div", { class: "empty-state" }, err.message));
  }
}

// ============================================================
// PAGE 7 — USERS (admin only)
// ============================================================
async function renderUsers(container) {
  if (localStorage.getItem("userRole") !== "admin") {
    container.appendChild(el("div", { class: "admin-locked" }, "This page is for admins only."));
    return;
  }
  container.appendChild(el("div", { class: "page-header" },
    el("h1", {}, "Users"),
    el("p", {}, "Everyone with access to the assistant.")
  ));

  const addBtn = el("button", { class: "btn-primary" }, "+ Add user");
  container.appendChild(el("div", { class: "toolbar" }, addBtn));
  const tableWrap = el("div", {});
  container.appendChild(tableWrap);

  async function loadUsers() {
    tableWrap.innerHTML = "Loading…";
    try {
      const users = await apiFetch("/api/v1/users/");
      tableWrap.innerHTML = "";
      if (users.length === 0) { tableWrap.appendChild(el("div", { class: "empty-state" }, "No users found.")); return; }
      const table = el("table", { class: "data-table" });
      table.appendChild(el("thead", {}, el("tr", {},
        el("th", {}, "Name"), el("th", {}, "Email"), el("th", {}, "Role"), el("th", {}, "Department"), el("th", {}, "")
      )));
      const tbody = el("tbody", {});
      users.forEach((u) => {
        tbody.appendChild(el("tr", {},
          el("td", {}, u.name),
          el("td", {}, u.email),
          el("td", {}, el("span", { class: "badge cat" }, u.role)),
          el("td", {}, u.department || "—"),
          el("td", {}, el("button", {
            class: "btn-danger",
            onclick: async () => {
              if (!confirm(`Remove ${u.name}?`)) return;
              try { await apiFetch(`/api/v1/users/${u.id}`, { method: "DELETE" }); loadUsers(); }
              catch (err) { alert(err.message); }
            },
          }, "Remove"))
        ));
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
    } catch (err) {
      tableWrap.innerHTML = "";
      tableWrap.appendChild(el("div", { class: "empty-state" }, err.message));
    }
  }

  addBtn.addEventListener("click", () => openAddUserModal(loadUsers));
  loadUsers();
}

function openAddUserModal(onDone) {
  const nameInput = el("input", { type: "text", required: "" });
  const emailInput = el("input", { type: "email", required: "" });
  const passInput = el("input", { type: "password", required: "" });
  const roleSelect = el("select", {}, el("option", { value: "staff" }, "staff"), el("option", { value: "admin" }, "admin"));
  const deptInput = el("input", { type: "text" });
  const errorEl = el("p", { class: "error-text hidden" });

  const overlay = el("div", { class: "modal-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } },
    el("div", { class: "modal-box" },
      el("h2", {}, "Add user"),
      field("Name", nameInput),
      field("Email", emailInput),
      field("Password", passInput),
      field("Role", roleSelect),
      field("Department (optional)", deptInput),
      errorEl,
      el("div", { class: "modal-actions" },
        el("button", { class: "btn-secondary", type: "button", onclick: () => overlay.remove() }, "Cancel"),
        el("button", { class: "btn-primary", type: "button", onclick: submit }, "Create")
      )
    )
  );
  document.body.appendChild(overlay);

  async function submit() {
    if (!nameInput.value.trim() || !emailInput.value.trim() || !passInput.value) {
      errorEl.textContent = "Name, email, and password are required.";
      errorEl.classList.remove("hidden");
      return;
    }
    try {
      await apiFetch("/api/v1/users/", {
        method: "POST",
        body: { name: nameInput.value.trim(), email: emailInput.value.trim(), password: passInput.value, role: roleSelect.value, department: deptInput.value || null },
      });
      overlay.remove();
      onDone();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }
  }
}
