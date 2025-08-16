// ====== QUOTES DATA ======
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The purpose of our lives is to be happy.", category: "Happiness" }
];

// ====== SERVER CONFIG ======
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// ====== LOCAL STORAGE ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  quotes = JSON.parse(localStorage.getItem("quotes")) || quotes;
}

// ====== DOM ELEMENTS ======
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

// ====== POPULATE CATEGORY DROPDOWN ======
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category
  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    categoryFilter.value = savedCategory;
  }
}

// ====== SHOW RANDOM QUOTE (FILTERED) ======
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

  // Save to session
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// ====== FILTER QUOTES BY CATEGORY ======
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
    text: textInput.value.trim(),
    category: categoryInput.value.trim() || "General"
  };

  if (newQuote.text) {
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    alert("Quote added successfully!");
    syncQuotes("post", newQuote); // Push new quote to server
  } else {
    alert("Please enter a quote.");
  }

  textInput.value = "";
  categoryInput.value = "";
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
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
      syncQuotes("postBulk", importedQuotes); // Push imported quotes to server
    } catch (err) {
      alert("Error importing file: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ====== FETCH QUOTES FROM SERVER (MOCK) ======
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();

    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    // Conflict resolution: server always wins
    quotes = [...quotes, ...serverQuotes];
    saveQuotes();
    populateCategories();

    notifyUser("Quotes synced with server.");
  } catch (error) {
    console.error("Error fetching server data:", error);
  }
}

// ====== PUSH QUOTES TO SERVER ======
async function syncQuotes(action, data) {
  try {
    if (action === "post") {
      await fetch(SERVER_URL, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json; charset=UTF-8" }
      });
    } else if (action === "postBulk") {
      for (const quote of data) {
        await fetch(SERVER_URL, {
          method: "POST",
          body: JSON.stringify(quote),
          headers: { "Content-Type": "application/json; charset=UTF-8" }
        });
      }
    }
  } catch (error) {
    console.error("Error syncing quotes:", error);
  }
}

// ====== NOTIFY USER ======
function notifyUser(message, isConflict = false) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.background = isConflict ? "lightcoral" : "lightgreen";
  notification.style.color = "black";
  notification.style.padding = "10px";
  notification.style.margin = "10px 0";
  notification.style.borderRadius = "5px";
  notification.style.fontWeight = "bold";
  document.body.prepend(notification);

  setTimeout(() => notification.remove(), 4000);
}

// ====== EVENT LISTENERS ======
newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", filterQuotes);
exportBtn.addEventListener("click", exportToJsonFile);
importFile.addEventListener("change", importFromJsonFile);

// ====== INIT ======
window.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();

  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const parsedQuote = JSON.parse(lastQuote);
    quoteDisplay.textContent = `"${parsedQuote.text}" — ${parsedQuote.category}`;
  } else {
    showRandomQuote();
  }

  // Periodically sync with server
  setInterval(fetchQuotesFromServer, 15000);
});
