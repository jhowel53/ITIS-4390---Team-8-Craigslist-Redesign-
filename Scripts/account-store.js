// Keeps account details and messages in the browser for this demo.
window.CraigslistAccount = (() => {
    // Keep the demo accounts, login state, and messages in browser storage.
    const USERS_KEY = "craigslist-users";
    const MESSAGES_KEY = "craigslist-messages";
    const AUTH_KEY = "craigslist-authenticated";
    const USER_ID_KEY = "craigslist-user-id";
    const USER_EMAIL_KEY = "craigslist-user-email";
    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const passwordIterations = 120000;

    // Read stored lists carefully so damaged browser data doesn't pass silently.
    function readArray(key) {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return [];
        }

        const records = JSON.parse(raw);
        if (!Array.isArray(records)) {
            throw new Error("Stored account data is invalid.");
        }
        return records;
    }

    function writeArray(key, records) {
        localStorage.setItem(key, JSON.stringify(records));
    }

    function createId() {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function createSalt() {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function hexToBytes(hex) {
        return new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    }

    // Give each password its own salt before hashing it.
    async function hashPassword(password, salt) {
        if (!crypto.subtle) {
            throw new Error("Password updates require a secure browser context.");
        }

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const bits = await crypto.subtle.deriveBits({
            name: "PBKDF2",
            salt: hexToBytes(salt),
            iterations: passwordIterations,
            hash: "SHA-256"
        }, key, 256);

        return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function activateUser(user) {
        sessionStorage.setItem(AUTH_KEY, "true");
        sessionStorage.setItem(USER_ID_KEY, user.id);
        sessionStorage.setItem(USER_EMAIL_KEY, user.email);
    }

    // Use the saved session ID to find the account currently signed in.
    function currentUser() {
        if (sessionStorage.getItem(AUTH_KEY) !== "true") {
            return null;
        }

        const users = readArray(USERS_KEY);
        const id = sessionStorage.getItem(USER_ID_KEY);
        const email = sessionStorage.getItem(USER_EMAIL_KEY);
        return users.find(user =>
            (id && user.id === id) ||
            (!id && email && user.email.toLowerCase() === email.toLowerCase())
        ) || null;
    }

    function findUserByEmail(users, email) {
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // New accounts get a unique ID and a salted password hash before they're saved.
    async function createUser(name, email, password) {
        const users = readArray(USERS_KEY);
        if (findUserByEmail(users, email)) {
            const error = new Error("An account already uses this email address.");
            error.field = "email";
            throw error;
        }

        const salt = createSalt();
        const user = {
            id: createId(),
            name,
            email,
            passwordSalt: salt,
            passwordHash: await hashPassword(password, salt)
        };
        users.push(user);
        writeArray(USERS_KEY, users);
        activateUser(user);
        return user;
    }

    async function register(name, email, password) {
        return createUser(name.trim(), email.trim().toLowerCase(), password);
    }

    // Existing demo logins still work; new emails get a local account on first login.
    async function signIn(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const users = readArray(USERS_KEY);
        let user = findUserByEmail(users, normalizedEmail);

        if (user) {
            const enteredHash = await hashPassword(password, user.passwordSalt);
            if (enteredHash !== user.passwordHash) {
                const error = new Error("The password is incorrect.");
                error.field = "password";
                throw error;
            }
        } else {
            const salt = createSalt();
            user = {
                id: createId(),
                name: normalizedEmail.split("@")[0],
                email: normalizedEmail,
                passwordSalt: salt,
                passwordHash: await hashPassword(password, salt)
            };
            users.push(user);
            writeArray(USERS_KEY, users);
        }

        activateUser(user);
        return user;
    }

    // Update the account record and keep the current session pointing at it.
    function updateEmail(email) {
        const user = currentUser();
        if (!user) {
            throw new Error("Please sign in again to update your account.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!emailPattern.test(normalizedEmail)) {
            const error = new Error("Enter a valid email address.");
            error.field = "email";
            throw error;
        }

        const users = readArray(USERS_KEY);
        const storedUser = users.find(other => other.id === user.id);
        if (!storedUser) {
            throw new Error("The current account could not be found.");
        }
        if (users.some(other =>
            other.id !== user.id && other.email.toLowerCase() === normalizedEmail
        )) {
            const error = new Error("An account already uses this email address.");
            error.field = "email";
            throw error;
        }

        storedUser.email = normalizedEmail;
        writeArray(USERS_KEY, users);
        sessionStorage.setItem(USER_EMAIL_KEY, normalizedEmail);
        return storedUser;
    }

    // Check the old password first, then replace it with a fresh salted hash.
    async function changePassword(currentPassword, newPassword) {
        const user = currentUser();
        if (!user) {
            throw new Error("Please sign in again to update your password.");
        }

        const users = readArray(USERS_KEY);
        const storedUser = users.find(other => other.id === user.id);
        if (!storedUser) {
            throw new Error("The current account could not be found.");
        }

        const currentHash = await hashPassword(currentPassword, storedUser.passwordSalt);
        if (currentHash !== user.passwordHash) {
            const error = new Error("The current password is incorrect.");
            error.field = "currentPassword";
            throw error;
        }

        const salt = createSalt();
        storedUser.passwordSalt = salt;
        storedUser.passwordHash = await hashPassword(newPassword, salt);
        writeArray(USERS_KEY, users);
    }

    // Save a message with both account IDs so it can show up in either inbox.
    function sendMessage({ recipientName, recipientEmail, listingTitle, body }) {
        const sender = currentUser();
        if (!sender) {
            throw new Error("Please sign in to contact the seller.");
        }

        const users = readArray(USERS_KEY);
        const recipient = recipientEmail
            ? findUserByEmail(users, recipientEmail)
            : users.find(user => user.name.toLowerCase() === recipientName.toLowerCase());
        const messages = readArray(MESSAGES_KEY);

        messages.unshift({
            id: createId(),
            senderId: sender.id,
            senderName: sender.name,
            senderEmail: sender.email,
            recipientId: recipient?.id || "",
            recipientName,
            recipientEmail: recipient?.email || recipientEmail || "",
            listingTitle,
            body: body.trim(),
            createdAt: new Date().toISOString()
        });
        writeArray(MESSAGES_KEY, messages);
    }

    // Show sent messages and anything addressed to the signed-in account.
    function messagesForCurrentUser() {
        const user = currentUser();
        if (!user) {
            return [];
        }

        return readArray(MESSAGES_KEY).filter(message =>
            message.senderId === user.id ||
            message.recipientId === user.id ||
            message.senderEmail === user.email ||
            message.recipientEmail === user.email ||
            (!message.recipientId &&
                message.recipientName.toLowerCase() === user.name.toLowerCase())
        );
    }

    // Clear the login markers when someone signs out.
    function signOut() {
        sessionStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(USER_ID_KEY);
        sessionStorage.removeItem(USER_EMAIL_KEY);
    }

    return {
        currentUser,
        register,
        signIn,
        updateEmail,
        changePassword,
        sendMessage,
        messagesForCurrentUser,
        signOut
    };
})();
