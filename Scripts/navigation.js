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
