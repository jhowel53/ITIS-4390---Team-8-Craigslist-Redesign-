// Lets signed-in users add a new listing card to the current page.
document.addEventListener("DOMContentLoaded", () => {
    const createButton = document.getElementById("createListingPostButton");
    const dialog = document.getElementById("createListingDialog");
    const form = document.getElementById("createListingForm");
    const cancelButton = document.getElementById("cancelCreateListing");
    const status = document.getElementById("createListingStatus");
    const grid = document.querySelector(".listing-card-grid");

    // Send signed-out visitors through the existing login page.
    function requireLogin() {
        if (sessionStorage.getItem("craigslist-authenticated") === "true") {
            return true;
        }

        window.location.href = "login.html";
        return false;
    }

    createButton.addEventListener("click", () => {
        if (requireLogin()) {
            dialog.showModal();
        }
    });

    cancelButton.addEventListener("click", () => {
        dialog.close();
    });

    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    // Load an optional upload as a data URL for the new card.
    function readImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                } else {
                    reject(new Error("The selected image could not be read."));
                }
            });
            reader.addEventListener("error", () => {
                reject(reader.error || new Error("The selected image could not be read."));
            });
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        status.textContent = "";

        if (!requireLogin()) {
            dialog.close();
            return;
        }

        const values = new FormData(form);
        const title = values.get("title").trim();
        const category = values.get("category");
        const details = values.get("details").trim();
        const locationInput = values.get("location").trim();
        const locationMatch = locationInput.match(/^([^,]+),\s*([A-Za-z]{2})$/);

        if (!locationMatch) {
            status.textContent = "Enter a city and two-letter state code, such as Charlotte, NC.";
            return;
        }

        const location = locationMatch[1].trim() + ", " + locationMatch[2].toUpperCase();
        const imageFile = values.get("image");
        let imageSource = "";

        if (imageFile && imageFile.size > 0) {
            try {
                imageSource = await readImage(imageFile);
            } catch (error) {
                console.error("Unable to read the selected listing image.", error);
                status.textContent = "The selected image could not be loaded. Please try another file.";
                return;
            }
        }

        // Build a safe card from the form fields, then register it with the page.
        const card = document.createElement("article");
        const currentUser = window.CraigslistAccount.currentUser();
        card.className = "hiring-card";
        card.dataset.saveId = "listing-" + Date.now() + "-" + Math.random().toString(36).slice(2);
        card.dataset.category = category;
        card.dataset.location = location;
        card.dataset.searchable = "true";
        card.dataset.ownerEmail = currentUser?.email || "";

        if (form.dataset.postType === "hiring") {
            card.dataset.neighborhood = values.get("neighborhood");
        } else {
            card.dataset.price = String(Number(values.get("price")));
        }

        if (imageSource) {
            const image = document.createElement("img");
            image.className = "hiring-card__image";
            image.src = imageSource;
            image.alt = title;
            card.appendChild(image);
        } else {
            const imagePlaceholder = document.createElement("div");
            imagePlaceholder.className = "hiring-card__image";
            imagePlaceholder.setAttribute("aria-hidden", "true");
            card.appendChild(imagePlaceholder);
        }

        const body = document.createElement("div");
        body.className = "hiring-card__body";

        const heading = document.createElement("h2");
        heading.textContent = title;
        body.appendChild(heading);

        const description = document.createElement("p");
        if (form.dataset.postType === "search") {
            const price = Number(values.get("price"));
            const formattedPrice = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD"
            }).format(price);
            description.textContent = formattedPrice + " · " + details;
        } else {
            description.textContent = details;
        }
        body.appendChild(description);

        const metadata = document.createElement("footer");
        metadata.className = "hiring-card__meta";

        const username = document.createElement("span");
        username.className = "hiring-card__username";
        username.textContent = currentUser?.name || "You";
        metadata.appendChild(username);

        const locationText = document.createElement("span");
        locationText.className = "hiring-card__location";
        locationText.textContent = location;
        metadata.appendChild(locationText);

        const date = document.createElement("time");
        date.dateTime = new Date().toISOString().slice(0, 10);
        date.textContent = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).format(new Date());
        metadata.appendChild(date);

        body.appendChild(metadata);
        card.appendChild(body);
        grid.prepend(card);

        window.registerListingCard(card);
        window.initSaveButtons();
        window.initContactSellerButtons();
        dialog.close();
        form.reset();
    });
});
