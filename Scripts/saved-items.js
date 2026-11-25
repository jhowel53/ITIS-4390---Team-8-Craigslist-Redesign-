const SAVED_STORAGE_KEY = "craigslist-saved-items";
const CARD_SELECTOR = ".hiring-card, .card, .listing, .post, .item";

function getSavedItems() {
    try {
        const parsed = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function setSavedItems(items) {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(items));
}

function getCardId(card, index) {
    if (card.dataset.saveId) return card.dataset.saveId;
    const heading = card.querySelector("h1, h2, h3, h4")?.textContent?.trim() || "";
    const meta = card.querySelector(".hiring-card__meta, .card__meta")?.textContent?.trim() || "";
    const slug = `${heading}-${meta}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = slug || `saved-card-${window.location.pathname}-${index}`;
    card.dataset.saveId = id;
    return id;
}

function serializeCard(card, id) {
    const title = card.querySelector("h1, h2, h3, h4")?.textContent?.trim() || "Untitled Listing";
    const img = card.querySelector("img");
    const paragraphs = Array.from(card.querySelectorAll("p"));
    const description =
        paragraphs.find(p => !p.closest(".hiring-card__meta, .card__meta"))?.textContent?.trim() || "";
    const meta =
        card.querySelector(".hiring-card__meta, .card__meta")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const linkEl = card.querySelector("a[href]");
    const href = linkEl ? linkEl.getAttribute("href") : "";
    const type = card.classList.contains("hiring-card") ? "Hiring" : "Item";

    return {
        id,
        type,
        title,
        description,
        meta,
        imageSrc: img ? img.getAttribute("src") || "" : "",
        imageAlt: img ? img.getAttribute("alt") || title : title,
        href,
        savedAt: new Date().toISOString()
    };
}

function updateSaveButtonUI(button, isSaved) {
    button.setAttribute("aria-pressed", String(isSaved));
    button.classList.toggle("is-saved", isSaved);
    button.textContent = isSaved ? "Saved" : "Save";
    button.setAttribute("aria-label", isSaved ? "Remove from saved" : "Save item");
}

function toggleSavedCard(card, id, button) {
    const items = getSavedItems();
    const existsIndex = items.findIndex(item => item.id === id);

    if (existsIndex >= 0) {
        items.splice(existsIndex, 1);
        setSavedItems(items);
        updateSaveButtonUI(button, false);
    } else {
        items.unshift(serializeCard(card, id));
        setSavedItems(items);
        updateSaveButtonUI(button, true);
    }
}

function initSaveButtons() {
    const container = document.getElementById("saved-items-container");
    if (container) return; // Handled by saved.html renderer

    const main = document.querySelector("main.content") || document.body;
    const savedIds = new Set(getSavedItems().map(item => item.id));
    const allMatching = Array.from(main.querySelectorAll(CARD_SELECTOR));
    const cards = allMatching.filter(el => !el.parentElement?.closest(CARD_SELECTOR));

    cards.forEach((card, index) => {
        if (card.querySelector(".save-item-btn")) return;

        const id = getCardId(card, index);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "save-item-btn";
        updateSaveButtonUI(button, savedIds.has(id));

        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            toggleSavedCard(card, id, button);
        });

        const body = card.querySelector(".hiring-card__body, .card__body") || card;
        body.appendChild(button);
    });
}

function renderSavedPage() {
    const container = document.getElementById("saved-items-container");
    const emptyState = document.getElementById("saved-empty-state");
    if (!container) return;

    const items = getSavedItems();
    container.replaceChildren();

    if (!items.length) {
        if (emptyState) emptyState.hidden = false;
        return;
    }

    if (emptyState) emptyState.hidden = true;

    items.forEach(item => {
        const article = document.createElement("article");
        article.className = "hiring-card saved-card";
        article.dataset.searchable = "true";

        if (item.imageSrc) {
            const img = document.createElement("img");
            img.className = "hiring-card__image";
            img.src = item.imageSrc;
            img.alt = item.imageAlt || item.title;
            article.appendChild(img);
        }

        const body = document.createElement("div");
        body.className = "hiring-card__body";

        const titleEl = document.createElement("h2");
        if (item.href) {
            const a = document.createElement("a");
            a.href = item.href;
            a.textContent = item.title;
            titleEl.appendChild(a);
        } else {
            titleEl.textContent = item.title;
        }
        body.appendChild(titleEl);

        if (item.description) {
            const desc = document.createElement("p");
            desc.textContent = item.description;
            body.appendChild(desc);
        }

        if (item.meta) {
            const meta = document.createElement("div");
            meta.className = "hiring-card__meta";
            meta.textContent = item.meta;
            body.appendChild(meta);
        }

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "save-item-btn is-saved";
        removeBtn.textContent = "Saved";
        removeBtn.setAttribute("aria-pressed", "true");
        removeBtn.setAttribute("aria-label", `Remove ${item.title} from saved`);

        removeBtn.addEventListener("click", () => {
            const next = getSavedItems().filter(entry => entry.id !== item.id);
            setSavedItems(next);
            renderSavedPage();
        });

        body.appendChild(removeBtn);
        article.appendChild(body);
        container.appendChild(article);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initSaveButtons();
    renderSavedPage();
});