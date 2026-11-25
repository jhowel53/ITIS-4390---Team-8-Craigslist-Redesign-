// Adds a contact form to listings and saves messages to the user's inbox.
document.addEventListener("DOMContentLoaded", () => {
    // Build one shared dialog so each card can open the same compose form.
    const dialog = document.createElement("dialog");
    dialog.className = "contact-seller-dialog";

    const form = document.createElement("form");
    form.className = "contact-seller-form";

    const heading = document.createElement("h2");
    heading.textContent = "Contact Seller";

    const recipient = document.createElement("p");
    recipient.className = "contact-seller-recipient";

    const listing = document.createElement("p");
    listing.className = "contact-seller-listing";

    const label = document.createElement("label");
    label.textContent = "Message";
    const message = document.createElement("textarea");
    message.name = "message";
    message.rows = 5;
    message.maxLength = 2000;
    message.required = true;
    message.setAttribute("aria-label", "Message to seller");
    label.appendChild(message);

    const status = document.createElement("p");
    status.className = "contact-seller-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const actions = document.createElement("div");
    actions.className = "contact-seller-actions";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "listing-create-cancel";
    closeButton.textContent = "Cancel";

    const sendButton = document.createElement("button");
    sendButton.type = "submit";
    sendButton.className = "listing-create-button";
    sendButton.textContent = "Send Message";

    actions.append(closeButton, sendButton);
    form.append(heading, recipient, listing, label, status, actions);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    let activePost = null;

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (sessionStorage.getItem("craigslist-authenticated") !== "true") {
            window.location.href = "login.html";
            return;
        }

        const sender = window.CraigslistAccount.currentUser();
        if (!sender || !activePost) {
            window.location.href = "login.html";
            return;
        }

        const sellerName =
            activePost.querySelector(".hiring-card__username")?.textContent.trim() || "Seller";
        const title =
            activePost.querySelector("h1, h2, h3, h4")?.textContent.trim() || "Listing";

        // Save the message to the sender's and seller's local inboxes.
        try {
            window.CraigslistAccount.sendMessage({
                recipientName: sellerName,
                recipientEmail: activePost.dataset.ownerEmail || "",
                listingTitle: title,
                body: message.value
            });
            status.textContent = "Message sent. You can view it in your Account.";
            message.disabled = true;
            sendButton.hidden = true;
            closeButton.textContent = "Done";
        } catch (error) {
            console.error("Unable to send the seller message.", error);
            status.textContent = error.message || "Unable to send the message. Please try again.";
        }
    });

    window.initContactSellerButtons = () => {
        // Keep Contact Seller beside Save, and skip listings owned by this account.
        document.querySelectorAll("main.content .hiring-card").forEach(card => {
            const saveButton = card.querySelector(".save-item-btn");
            if (!saveButton || card.querySelector(".contact-seller-btn")) {
                return;
            }

            const ownerName =
                card.querySelector(".hiring-card__username")?.textContent.trim() || "";
            const currentUser = window.CraigslistAccount.currentUser();
            if (
                ownerName.toLowerCase() === "you" ||
                (currentUser &&
                    card.dataset.ownerEmail?.toLowerCase() === currentUser.email.toLowerCase())
            ) {
                return;
            }

            let actions = saveButton.parentElement;
            if (!actions.classList.contains("card-action-buttons")) {
                actions = document.createElement("div");
                actions.className = "card-action-buttons";
                saveButton.before(actions);
                actions.appendChild(saveButton);
            }

            const contactButton = document.createElement("button");
            contactButton.type = "button";
            contactButton.className = "contact-seller-btn";
            contactButton.textContent = "Contact Seller";
            contactButton.addEventListener("click", () => {
                if (sessionStorage.getItem("craigslist-authenticated") !== "true") {
                    window.location.href = "login.html";
                    return;
                }

                if (!window.CraigslistAccount.currentUser()) {
                    window.location.href = "login.html";
                    return;
                }

                activePost = card;
                form.reset();
                message.disabled = false;
                sendButton.hidden = false;
                closeButton.textContent = "Cancel";
                status.textContent = "";
                recipient.textContent = "To: " + ownerName;
                listing.textContent =
                    "About: " +
                    (card.querySelector("h1, h2, h3, h4")?.textContent.trim() || "Listing");
                dialog.showModal();
                message.focus();
            });
            actions.appendChild(contactButton);
        });
    };

    window.initContactSellerButtons();
});
