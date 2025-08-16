// ====== QUOTES DATA ======
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Perseverance" }
];

// ====== DOM ELEMENTS ======
const quoteDisplay   = document.getElementById("quoteDisplay");
const newQuoteBtn    = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn      = document.getElementById("exportBtn");
const importFile     = document.getElementById("importFile");
const syncNowBtn     = document.getElementById("syncNow");
const syncStatus     = document.getElementById("syncStatus");
const conflictsDiv   = document.getElementById("conflicts");

// ====== STORAGE HELPERS ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ====== CATEGORY DROPDOWN ======
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) categoryFilter.value = savedCategory;
}

// ====== SHOW RANDOM QUOTE (RESPECT FILTER) ======
function showRandomQuote() {
  let filteredQuotes = quotes;
  const selectedCategory = categoryFilter.value;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;

  sessionStorage.setItem("lastQuote", quoteDisplay.textContent);
}

// ====== FILTER HANDLER ======
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// ====== ADD NEW QUOTE ======
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newQuote = {
    id: undefined, // not synced yet
    text: (textInput?.value || "").trim(),
    category: (categoryInput?.value || "").trim(),
    updatedAt: new Date().toISOString(),
    source: "local"
  };

  if (newQuote.text && newQuote.category) {
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    textInput.value = "";
    categoryInput.value = "";
    alert("Quote added successfully!");
  } else {
    alert("Please enter both a quote and category.");
  }
}

// ====== EXPORT TO JSON ======
function exportToJsonFile() {
  const jsonData = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// ====== IMPORT FROM JSON ======
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid format");
      importedQuotes.forEach(q => {
        if (!q.updatedAt) q.updatedAt = new Date().toISOString();
      });
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Error importing file: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ====== EVENT LISTENERS ======
if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);
if (categoryFilter) categoryFilter.addEventListener("change", filterQuotes);
if (exportBtn) exportBtn.addEventListener("click", exportToJsonFile);
if (importFile) importFile.addEventListener("change", importFromJsonFile);

// ====================================================================
// ================ SYNC WITH MOCK SERVER + CONFLICTS =================
// ====================================================================

const SERVER_ENDPOINT = "https://jsonplaceholder.typicode.com/posts";
let lastConflicts = [];

function setStatus(msg, isError = false) {
  if (!syncStatus) return;
  syncStatus.textContent = msg;
  syncStatus.style.color = isError ? "red" : "inherit";
}

function renderConflicts(conflicts) {
  if (!conflictsDiv) return;
  conflictsDiv.innerHTML = "";
  if (!conflicts || conflicts.length === 0) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `<strong>Conflicts resolved (server won by default):</strong>`;
  const ul = document.createElement("ul");

  conflicts.forEach((c, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <div><em>ID:</em> ${c.id}</div>
        <div><em>Local:</em> "${c.local.text}" — ${c.local.category}</div>
        <div><em>Server:</em> "${c.server.text}" — ${c.server.category}</div>
        <button data-action="keep-local" data-idx="${i}">Keep Local</button>
        <button data-action="keep-server" data-idx="${i}">Keep Server</button>
      </div>
    `;
    ul.appendChild(li);
  });

  wrap.appendChild(ul);
  conflictsDiv.appendChild(wrap);
  lastConflicts = conflicts;
}

if (conflictsDiv) {
  conflictsDiv.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-idx"));
    const action = btn.getAttribute("data-action");
    resolveConflict(idx, action === "keep-local" ? "local" : "server");
  });
}

function resolveConflict(idx, keep) {
  const c = lastConflicts[idx];
  if (!c) return;
  const pos = quotes.findIndex(q => q.id === c.id);
  if (pos === -1) return;
  quotes[pos] = keep === "local" ? c.local : c.server;
  saveQuotes();
  populateCategories();
  showRandomQuote();
  setStatus(`Conflict for ID ${c.id} resolved: kept ${keep}.`);
  renderConflicts([]); 
}

function serverPostToQuote(p) {
  return {
    id: p.id,
    text: p.body || "",
    category: p.title || "General",
    updatedAt: new Date().toISOString(),
    source: "server"
  };
}

async function fetchServerQuotes() {
  const res = await fetch(`${SERVER_ENDPOINT}?_limit=15`);
  if (!res.ok) throw new Error(`Server fetch failed: ${res.status}`);
  const data = await res.json();
  return data.map(serverPostToQuote);
}

async function pushLocalNewQuotes() {
  const unsynced = quotes.filter(q => !q.id);
  for (const q of unsynced) {
    const res = await fetch(SERVER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: q.category || "General",
        body: q.text,
        userId: 1
      })
    });
    const posted = await res.json();
    q.id = posted.id;
    q.updatedAt = new Date().toISOString();
  }
}

function mergeServerQuotes(serverQuotes) {
  const conflicts = [];
  const byId = new Map(quotes.filter(q => q.id != null).map(q => [q.id, q]));

  for (const s of serverQuotes) {
    const local = byId.get(s.id);
    if (!local) {
      quotes.push(s);
    } else if (local.text !== s.text || local.category !== s.category) {
      conflicts.push({ id: s.id, local: { ...local }, server: { ...s } });
      const idx = quotes.findIndex(q => q.id === s.id);
      if (idx !== -1) quotes[idx] = s;
    }
  }
  return conflicts;
}

async function syncWithServer() {
  try {
    setStatus("Syncing with server…");
    await pushLocalNewQuotes();
    const serverQuotes = await fetchServerQuotes();
    const conflicts = mergeServerQuotes(serverQuotes);
    saveQuotes();
    populateCategories();
    renderConflicts(conflicts);
    setStatus(`Synced. ${conflicts.length ? `${conflicts.length} conflicts (server won).` : "No conflicts."}`);
  } catch (err) {
    setStatus(`Sync failed: ${err.message}`, true);
  }
}

if (syncNowBtn) syncNowBtn.addEventListener("click", syncWithServer);
setInterval(syncWithServer, 30000);

// ====== INIT ======
window.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    quoteDisplay.textContent = lastQuote;
  } else {
    showRandomQuote();
  }
  setTimeout(syncWithServer, 1200);
});

