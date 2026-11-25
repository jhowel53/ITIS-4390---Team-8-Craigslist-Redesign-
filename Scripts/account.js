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
        messagesContainer.replaceChildren();
        messagesEmptyState.hidden = messages.length > 0;

        messages.forEach(message => {
            const article = document.createElement("article");
            article.className = "account-message";

            const direction = document.createElement("p");
            direction.className = "account-message-direction";
            direction.textContent = message.senderId === accountUser.id
                ? "Sent to " + message.recipientName
                : "Received from " + message.senderName;

            const heading = document.createElement("h3");
            heading.textContent = message.listingTitle;

            const body = document.createElement("p");
            body.textContent = message.body;

            const time = document.createElement("time");
            time.dateTime = message.createdAt;
            time.textContent = new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            }).format(new Date(message.createdAt));

            article.append(direction, heading, body, time);
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

        // The account store checks the current password before saving the new one.
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
