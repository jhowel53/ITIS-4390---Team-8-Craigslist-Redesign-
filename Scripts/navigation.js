// Sets up the shared header, page navigation, theme, and search.
const THEME_STORAGE_KEY = "craigslist-theme";

function getStartingTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }

    return "light";
}

function setTheme(theme, saveTheme = true) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;

    if (saveTheme) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    syncThemeToggle();
}

function syncThemeToggle() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const toggle = document.getElementById("check");
    const status = document.getElementById("themeStatus");
    const toggleLabel = document.querySelector('label[for="check"]');

    if (toggle) {
        toggle.checked = isDark;
        toggle.setAttribute(
            "aria-label",
            isDark ? "Dark mode on. Switch to light mode" : "Light mode on. Switch to dark mode"
        );
    }

    if (status) {
        status.textContent = isDark ? "Dark" : "Light";
    }

    if (toggleLabel) {
        toggleLabel.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    }
}

// Apply saved theme when the page loads.
setTheme(getStartingTheme(), false);

// Handles the theme toggle after the header is dynamically loaded.
document.addEventListener("change", event => {
    if (event.target instanceof HTMLInputElement && event.target.id === "check") {
        setTheme(event.target.checked ? "dark" : "light");
    }
});

function initHeaderEvents() {
    const menuButton = document.querySelector(".sidebar_button");
    const sidebar = document.getElementById("sidebar");
    const headerTop = document.querySelector(".header_top");
    const searchToggle = document.querySelector(".mobile-search-toggle");
    const searchForm = document.querySelector(".search_bar");
    const searchInput = document.getElementById("searchInput");
    const searchCloseButton = document.querySelector(".search-close-button");

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

    // Close sidebar when a navigation link is clicked.
    sidebar.addEventListener("click", event => {
        if (event.target instanceof HTMLAnchorElement) {
            setMenuOpen(false);
        }
    });

    // Close sidebar when the user clicks outside of hamburger menu.
    document.addEventListener("click", event => {
        const isSearchInteraction = searchToggle?.contains(event.target) ||
            searchForm?.contains(event.target);

        if (
            !sidebar.contains(event.target) &&
            !menuButton.contains(event.target) &&
            !isSearchInteraction
        ) {
            setMenuOpen(false);
        }
    });

    if (!headerTop || !searchToggle || !searchForm || !searchInput || !searchCloseButton) {
        return;
    }

    const setSearchOpen = isOpen => {
        headerTop.classList.toggle("is-search-open", isOpen);
        searchToggle.setAttribute("aria-expanded", String(isOpen));
        searchToggle.setAttribute("aria-label", isOpen ? "Close search" : "Open search");

        if (isOpen) {
            searchInput.focus();
        } else {
            searchInput.value = "";
            triggerSearch();
            searchToggle.focus();
        }
    };

    searchToggle.addEventListener("click", () => {
        setSearchOpen(true);
    });

    searchCloseButton.addEventListener("click", () => {
        setSearchOpen(false);
    });

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            setSearchOpen(false);
        }
    });

    document.addEventListener("click", event => {
        if (
            headerTop.classList.contains("is-search-open") &&
            !headerTop.contains(event.target)
        ) {
            setSearchOpen(false);
        }
    });
}

// Load the shared header and point signed-in visitors to their account.
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

            const accountLink = document.querySelector('.account-link');
            if (sessionStorage.getItem('craigslist-authenticated') === 'true') {
                accountLink.href = 'account.html';
                accountLink.setAttribute('aria-label', 'Account');
                accountLink.querySelector('span').textContent = 'Account';
            }

            // Highlight the current page link in the navigation header.
            const currentPath = window.location.pathname;
            document.querySelectorAll('#header-placeholder a[href]').forEach(link => {
                if (new URL(link.href).pathname === currentPath) {
                    link.setAttribute('aria-current', 'page');
                }
            });

            // Re-initialize header interactions after header loads.
            if (typeof initHeaderEvents === 'function') {
                initHeaderEvents();
            }

            // Make the toggle match the current saved theme.
            syncThemeToggle();
        })
        .catch(error => console.error('Error loading header:', error));
});

document.addEventListener("DOMContentLoaded", function () {
    fetch('../Components/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load footer component');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;

            // Highlight the current page link in the navigation footer.
            const currentPath = window.location.pathname;
            document.querySelectorAll('#footer-placeholder a[href]').forEach(link => {
                if (new URL(link.href).pathname === currentPath) {
                    link.setAttribute('aria-current', 'page');
                }
            });
            
            // Optional: Re-initialize any interactive footer listeners 
            // (like hamburger sidebar toggle) if they depend on DOM elements loaded dynamically.
            if (typeof initFooterEvents === 'function') {
                initFooterEvents();
            }
        })
        .catch(error => console.error('Error loading footer:', error));
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
    // Ignore card metadata so search stays focused on the title and description.
    const getSearchFields = item => {
        const title = item.querySelector(
            "[data-search-title], h1, h2, h3, h4, h5, h6"
        )?.textContent.trim() || "";
        let description = item.querySelector(
            "[data-search-description], p"
        )?.textContent.trim() || "";

        if (item.hasAttribute("data-price")) {
            description = description.replace(/^\s*\$[\d,]+(?:\.\d{1,2})?\s*·\s*/, "");
        }

        return { title, description, text: `${title} ${description}`.trim() };
    };

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
        getSearchFields(item).text.toLocaleLowerCase().includes(query)
    );

    items.forEach(item => {
        item.hidden = !matches.includes(item);
    });

    suggestions.replaceChildren();
    suggestions.hidden = matches.length === 0;
    input.setAttribute("aria-expanded", String(matches.length > 0));

    // Show up to eight matching content snippets as live suggestions.
    matches.slice(0, 8).forEach(item => {
        const fields = getSearchFields(item);
        const text = fields.text.replace(/\s+/g, " ");
        const option = document.createElement("li");
        const button = document.createElement("button");

        option.className = "search_suggestion";
        button.type = "button";
        button.textContent = text.length > 100 ? `${text.slice(0, 97)}...` : text;

        button.addEventListener("click", event => {
            event.stopPropagation();
            input.value = fields.title || text;
            triggerSearch();
            input.focus();
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
