// Fills the account page and handles profile, password, and message actions.
const accountSuccessMessage = document.getElementById("account-success-message");
const successMessage = sessionStorage.getItem("accountSuccessMessage");
const accountUser = window.CraigslistAccount.currentUser();

// Keep account details and messages behind the sign-in flow.
if (sessionStorage.getItem("craigslist-authenticated") !== "true" || !accountUser) {
    window.location.href = "login.html";
} else {
    if (successMessage) {
        accountSuccessMessage.textContent = successMessage;
        accountSuccessMessage.hidden = false;
        sessionStorage.removeItem("accountSuccessMessage");
    }

    const accountName = document.getElementById("accountName");
    const accountEmail = document.getElementById("accountEmail");
    const emailStatus = document.getElementById("emailStatus");
    const passwordStatus = document.getElementById("passwordStatus");
    const messagesContainer = document.getElementById("accountMessages");
    const messagesEmptyState = document.getElementById("messagesEmptyState");

    accountName.textContent = accountUser.name;
    accountEmail.value = accountUser.email;

    // Rebuild the mailbox from the messages tied to this account.
    function renderMessages() {
        const messages = window.CraigslistAccount.messagesForCurrentUser();
        const conversations = new Map();
        messagesContainer.replaceChildren();

        // Group messages by seller and listing so each chat has one reply bar.
        messages.forEach(message => {
            const isSent = message.senderId === accountUser.id ||
                message.senderEmail === accountUser.email;
            const personName = isSent ? message.recipientName : message.senderName;
            const personEmail = isSent ? message.recipientEmail : message.senderEmail;
            const title = message.listingTitle || "Chat";
            const key = personName.toLowerCase() + "|" + title.toLowerCase();
            let conversation = conversations.get(key);

            if (!conversation) {
                conversation = {
                    name: personName,
                    email: personEmail || "",
                    title,
                    messages: []
                };
                conversations.set(key, conversation);
            } else if (!conversation.email && personEmail) {
                conversation.email = personEmail;
            }

            conversation.messages.push(message);
        });

        messagesEmptyState.hidden = conversations.size > 0;

        conversations.forEach(conversation => {
            const article = document.createElement("article");
            article.className = "account-conversation";

            const heading = document.createElement("h3");
            heading.textContent = "Chat with " + conversation.name;

            const listing = document.createElement("p");
            listing.className = "account-conversation-listing";
            listing.textContent = "About: " + conversation.title;

            const history = document.createElement("div");
            history.className = "account-chat-history";
            conversation.messages.sort(
                (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
            );

            conversation.messages.forEach(message => {
                const isSent = message.senderId === accountUser.id ||
                    message.senderEmail === accountUser.email;
                const bubble = document.createElement("article");
                bubble.className = isSent
                    ? "account-chat-message account-chat-message--sent"
                    : "account-chat-message";

                const direction = document.createElement("p");
                direction.className = "account-message-direction";
                direction.textContent = isSent ? "You" : message.senderName;

                const body = document.createElement("p");
                body.textContent = message.body;

                const time = document.createElement("time");
                time.dateTime = message.createdAt;
                time.textContent = new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short"
                }).format(new Date(message.createdAt));

                bubble.append(direction, body, time);
                history.appendChild(bubble);
            });

            const composer = document.createElement("form");
            composer.className = "account-chat-form";

            const input = document.createElement("input");
            input.type = "text";
            input.name = "message";
            input.maxLength = 2000;
            input.placeholder = "Write a message...";
            input.setAttribute("aria-label", "Message " + conversation.name);
            input.required = true;

            const sendButton = document.createElement("button");
            sendButton.type = "submit";
            sendButton.className = "listing-create-button";
            sendButton.textContent = "Send";

            const status = document.createElement("p");
            status.className = "account-status";
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");

            composer.append(input, sendButton, status);
            composer.addEventListener("submit", event => {
                event.preventDefault();
                const body = input.value.trim();
                if (!body) {
                    status.textContent = "Type a message before sending.";
                    input.focus();
                    return;
                }

                try {
                    window.CraigslistAccount.sendMessage({
                        recipientName: conversation.name,
                        recipientEmail: conversation.email,
                        listingTitle: conversation.title,
                        body
                    });
                    renderMessages();
                } catch (error) {
                    console.error("Unable to send chat message.", error);
                    status.textContent = error.message || "Unable to send the message.";
                }
            });

            article.append(heading, listing, history, composer);
            messagesContainer.appendChild(article);
        });
    }

    document.getElementById("accountEmailForm").addEventListener("submit", event => {
        event.preventDefault();
        emailStatus.textContent = "";

        try {
            const updatedUser = window.CraigslistAccount.updateEmail(accountEmail.value);
            accountEmail.value = updatedUser.email;
            emailStatus.textContent = "Email updated.";
            renderMessages();
        } catch (error) {
            console.error("Unable to update account email.", error);
            emailStatus.textContent = error.message || "Unable to update email.";
        }
    });

    document.getElementById("accountPasswordForm").addEventListener("submit", async event => {
        event.preventDefault();
        passwordStatus.textContent = "";
        const passwordForm = event.currentTarget;

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        if (newPassword !== confirmNewPassword) {
            passwordStatus.textContent = "The new passwords do not match.";
            return;
        }

        // checks the current password before saving the new one.
        try {
            await window.CraigslistAccount.changePassword(currentPassword, newPassword);
            passwordForm.reset();
            passwordStatus.textContent = "Password updated.";
        } catch (error) {
            console.error("Unable to update account password.", error);
            passwordStatus.textContent = error.message || "Unable to update password.";
        }
    });

    document.getElementById("signOutButton").addEventListener("click", () => {
        window.CraigslistAccount.signOut();
        window.location.href = "login.html";
    });

    renderMessages();
}
