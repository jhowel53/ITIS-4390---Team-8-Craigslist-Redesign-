function initHeaderEvents() {
    const menuButton = document.querySelector(".sidebar_button");
    const sidebar = document.getElementById("sidebar");

    if (!menuButton || !sidebar) return;

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

            // Highlight the current page link in the navigation header.
            const currentPath = window.location.pathname;
            document.querySelectorAll('#header-placeholder a[href]').forEach(link => {
                if (new URL(link.href).pathname === currentPath) {
                    link.setAttribute('aria-current', 'page');
                }
            });
            
            // Optional: Re-initialize any interactive header listeners 
            // (like hamburger sidebar toggle) if they depend on DOM elements loaded dynamically.
            if (typeof initHeaderEvents === 'function') {
                initHeaderEvents();
            }
        })
        .catch(error => console.error('Error loading header:', error));
});

// Reusable loading feedback for page navigation.
function getPageLoader() {
    let loader = document.getElementById('page-loader');

    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'page-loader';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-label', 'Loading page');
        loader.innerHTML = '<div class="page-loader__spinner" aria-hidden="true"></div>';
        document.body.appendChild(loader);
    }

    return loader;
}

function showPageLoader() {
    const loader = getPageLoader();
    document.body.setAttribute('aria-busy', 'true');
    loader.classList.add('is-visible');
}

function hidePageLoader() {
    const loader = document.getElementById('page-loader');
    document.body.removeAttribute('aria-busy');

    if (loader) {
        loader.classList.remove('is-visible');
    }
}

// Show a brief loading state before moving to another page in the prototype.
document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');

    if (!link) return;

    const href = link.getAttribute('href');
    if (
        !href ||
        href === '#' ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank' ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return;
    }

    event.preventDefault();
    showPageLoader();

    window.setTimeout(() => {
        window.location.href = href;
    }, 450);
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
