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
