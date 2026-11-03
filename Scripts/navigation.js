const menuButton = document.querySelector(".sidebar_button");
const sidebar = document.getElementById("sidebar");

if (menuButton && sidebar) {
    const setMenuOpen = isOpen => {
        sidebar.classList.toggle("is-open", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
    };
    // Toggle sidebar when the hamburger menu is clicked.
    menuButton.addEventListener("click", () => {
        setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });
    //Close sidebar when a navigation link is clicked.
    sidebar.addEventListener("click", event => {
        if (event.target instanceof HTMLAnchorElement) {
            setMenuOpen(false);
        }
    });
    // Close sidebar when the user clicks outside of hamburger menu.
    document.addEventListener("click", event => {
        if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
            setMenuOpen(false);
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    fetch('../Components/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header component');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            
            // Optional: Re-initialize any interactive header listeners 
            // (like hamburger sidebar toggle) if they depend on DOM elements loaded dynamically.
            if (typeof initHeaderEvents === 'function') {
                initHeaderEvents();
            }
        })
        .catch(error => console.error('Error loading header:', error));
});

function triggerSearch() {
    const input = document.getElementById("searchInput");
    const suggestions = document.getElementById("searchSuggestions");
    const content = document.querySelector("main.content");

    if (!input || !suggestions || !content) {
        return;
    }

    const query = input.value.trim().toLocaleLowerCase();
    const itemSelector = "[data-searchable], article, .card, .listing, .post, .item";
    const markedItems = Array.from(content.querySelectorAll(itemSelector));

    // Search individual listings if available, otherwise search main content blocks
    const items = markedItems.length
        ? markedItems.filter(item => !item.querySelector(itemSelector))
        : Array.from(content.children).filter(item =>
            !item.matches("h1, h2, h3, h4, h5, h6, [data-search-empty]")
        );

    let emptyState = content.querySelector("[data-search-empty]");

    // Clearing the input restores every item and removes all search UI
    if (!query) {
        items.forEach(item => {
            item.hidden = false;
        });
        suggestions.replaceChildren();
        suggestions.hidden = true;
        input.setAttribute("aria-expanded", "false");
        emptyState?.remove();
        return;
    }

    const matches = items.filter(item =>
        item.textContent.toLocaleLowerCase().includes(query)
    );

    items.forEach(item => {
        item.hidden = !matches.includes(item);
    });

    suggestions.replaceChildren();
    suggestions.hidden = matches.length === 0;
    input.setAttribute("aria-expanded", String(matches.length > 0));

    // Show up to eight matching content snippets as live suggestions.
    matches.slice(0, 8).forEach(item => {
        const text = item.textContent.trim().replace(/\s+/g, " ");
        const option = document.createElement("li");
        const button = document.createElement("button");

        option.className = "search_suggestion";
        button.type = "button";
        button.textContent = text.length > 100 ? `${text.slice(0, 97)}...` : text;
        button.addEventListener("click", () => {
            input.value = text;
            triggerSearch();
        });
        option.append(button);
        suggestions.append(option);
    });

    if (matches.length) {
        emptyState?.remove();
        return;
    }

    // Keeps an empty state visible when nothing matches the query.
    if (!emptyState) {
        emptyState = document.createElement("p");
        emptyState.dataset.searchEmpty = "true";
        emptyState.className = "search_empty_state";
        emptyState.setAttribute("role", "status");
        content.append(emptyState);
    }
    emptyState.textContent = "No results found.";
}
