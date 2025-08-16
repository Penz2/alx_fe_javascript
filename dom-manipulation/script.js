// ===== Quotes Array =====
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Perseverance" }
];

// ===== DOM Elements =====
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

// ===== Save Quotes to Local Storage =====
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ===== Show Random Quote =====
function showRandomQuote() {
  let filteredQuotes = quotes;

  // Check if category filter is applied
  const selectedCategory = categoryFilter.value;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  quoteDisplay.textContent = filteredQuotes[randomIndex].text + " — " + filteredQuotes[randomIndex].category;
  
  // Save last viewed quote (sessionStorage example)
  sessionStorage.setItem("lastQuote", quoteDisplay.textContent);
}

// ===== Add Quote =====
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newQuote = {
    text: textInput.value.trim(),
    category: categoryInput.value.trim()
  };

  if (newQuote.text && newQuote.category) {
    quotes.push(newQuote);
    saveQuotes();
    populateCategories(); // Update dropdown if new category
    textInput.value = "";
    categoryInput.value = "";
    alert("Quote added successfully!");
  } else {
    alert("Please enter both a quote and category.");
  }
}

// ===== Populate Categories Dropdown =====
function populateCategories() {
  // Extract unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  // Clear old options (except 'All Categories')
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  // Add categories
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

// ===== Filter Quotes by Category =====
function filterQuotes() {
  const selectedCategory = categoryFilter.value;

  // Save preference
  localStorage.setItem("selectedCategory", selectedCategory);

  // Show a random quote from selected category
  showRandomQuote();
}

// ===== Event Listeners =====
newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", filterQuotes);

// ===== Initialization =====
populateCategories();
showRandomQuote();

// Restore last viewed quote if exists (from session storage)
const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  quoteDisplay.textContent = lastQuote;
}


