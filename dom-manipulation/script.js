document.addEventListener('DOMContentLoaded', () => {
    let quotes = [];
    let categories = new Set();
    const API_URL = 'https://jsonplaceholder.typicode.com/posts'; 

    function loadQuotes() {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
            quotes = JSON.parse(storedQuotes);
        } else {
            quotes = [
                { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
                { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", category: "Motivation" },
                
            ];
            saveQuotes();
        }
        populateCategories();
    }

    function saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    }

    function showRandomQuote() {
        const filteredQuotes = getFilteredQuotes();
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const randomQuote = filteredQuotes[randomIndex];
        const quoteDisplay = document.getElementById('quoteDisplay');
        quoteDisplay.innerHTML = `"${randomQuote.text}" - <em>${randomQuote.category}</em>`;
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
    }

    function loadLastViewedQuote() {
        const lastViewedQuote = sessionStorage.getItem('lastViewedQuote');
        if (lastViewedQuote) {
            const quote = JSON.parse(lastViewedQuote);
            const quoteDisplay = document.getElementById('quoteDisplay');
            quoteDisplay.innerHTML = `"${quote.text}" - <em>${quote.category}</em>`;
        }
    }

    function createAddQuoteForm() {
        const form = document.getElementById('add-quote-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const quoteText = document.getElementById('quote-text').value;
            const quoteCategory = document.getElementById('quote-category').value;
            const newQuote = { text: quoteText, category: quoteCategory };
            quotes.push(newQuote);
            categories.add(quoteCategory);
            saveQuotes();
            populateCategories();
            form.reset();
            await postQuoteToServer(newQuote); 
        });
    }

    function exportQuotesToJson() {
        const jsonQuotes = JSON.stringify(quotes, null, 2);
        const blob = new Blob([jsonQuotes], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quotes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    window.importFromJsonFile = function(event) {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            const importedQuotes = JSON.parse(event.target.result);
            quotes.push(...importedQuotes);
            saveQuotes();
            populateCategories();
            alert('Quotes imported successfully!');
        };
        fileReader.readAsText(event.target.files[0]);
    };

    function populateCategories() {
        categories.clear();
        quotes.map(quote => categories.add(quote.category));
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        const lastSelectedCategory = localStorage.getItem('selectedCategory');
        if (lastSelectedCategory) {
            categoryFilter.value = lastSelectedCategory;
        }
    }

    function getFilteredQuotes() {
        const selectedCategory = document.getElementById('categoryFilter').value;
        if (selectedCategory === 'all') {
            return quotes;
        }
        return quotes.filter(quote => quote.category === selectedCategory);
    }

    window.filterQuotes = function() {
        const selectedCategory = document.getElementById('categoryFilter').value;
        localStorage.setItem('selectedCategory', selectedCategory);
        showRandomQuote();
    };

    async function fetchQuotesFromServer() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const serverQuotes = await response.json();
            updateQuotes(serverQuotes);
        } catch (error) {
            console.error('Failed to fetch quotes from server:', error);
        }
    }

    async function postQuoteToServer(quote) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(quote),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            console.log('Posted quote to server:', result);
        } catch (error) {
            console.error('Failed to post quote to server:', error);
        }
    }

    function updateQuotes(serverQuotes) {
        let hasConflict = false;
        serverQuotes.forEach(serverQuote => {
            const existingQuote = quotes.find(quote => quote.text === serverQuote.text);
            if (!existingQuote) {
                quotes.push(serverQuote);
            } else if (existingQuote.category !== serverQuote.category) {
                hasConflict = true;
                existingQuote.category = serverQuote.category; 
            }
        });
        if (hasConflict) {
            alert('Conflicts were detected and resolved. Server data has been prioritized.');
        }
        saveQuotes();
        populateCategories();
    }

    async function syncQuotes() {
        await fetchQuotesFromServer(); 
        alert('Quotes synced with server!'); 
    }

    function startDataSync() {
        setInterval(syncQuotes, 10000); 
    }

    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    document.getElementById('exportButton').addEventListener('click', exportQuotesToJson);
    document.getElementById('importFile').addEventListener('change', importFromJsonFile);

    loadQuotes();
    loadLastViewedQuote();
    createAddQuoteForm();
    showRandomQuote();
    startDataSync(); 
});