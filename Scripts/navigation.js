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
