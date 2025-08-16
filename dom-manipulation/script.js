let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The purpose of our lives is to be happy.", category: "Happiness" }
];

// ====== Save and Load Quotes ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  quotes = JSON.parse(localStorage.getItem("quotes")) || quotes;
}

// ====== Random Quote Display ======
function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));
}

// ====== Add New Quote ======
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
  }

  textInput.value = "";
  categoryInput.value = "";
}

// ====== Category Dropdown ======
function populateCategories() {
  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    filter.appendChild(option);
  });

  const lastSelected = localStorage.getItem("selectedCategory");
  if (lastSelected) {
    filter.value = lastSelected;
    filterQuotes();
  }
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const quoteDisplay = document.getElementById("quoteDisplay");
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
  } else {
    const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
    quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
  }
}

// ====== Import / Export JSON ======
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
    syncQuotes("postBulk", importedQuotes); // Push imported quotes to server
  };
  fileReader.readAsText(event.target.files[0]);
}

// ====== Simulated Server Sync ======
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from server (mock)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();

    // Simulate server response as quote objects
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

// ====== Push quotes to server ======
async function syncQuotes(action, data) {
  try {
    if (action === "post") {
      await fetch(SERVER_URL, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json; charset=UTF-8" } // FIXED
      });
    } else if (action === "postBulk") {
      for (const quote of data) {
        await fetch(SERVER_URL, {
          method: "POST",
          body: JSON.stringify(quote),
          headers: { "Content-Type": "application/json; charset=UTF-8" } // FIXED
        });
      }
    }
  } catch (error) {
    console.error("Error syncing quotes:", error);
  }
}

// ====== Notify User of Sync Events ======
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

// ====== Init ======
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
window.onload = () => {
  loadQuotes();
  populateCategories();

  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const parsedQuote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").textContent = `"${parsedQuote.text}" — ${parsedQuote.category}`;
  }

  // Periodically sync with server
  setInterval(fetchQuotesFromServer, 15000); // every 15 seconds
};
