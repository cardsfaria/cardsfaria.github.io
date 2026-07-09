let lastSlice = 0;
const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

// Versão do schema dos cards no localStorage. Sempre que a FORMA dos dados
// mudar (novos campos vindos da API, mudança de estrutura), incremente aqui.
// Se a versão salva no aparelho for diferente, limpamos o cache local e
// rebuscamos da API — evita que um dispositivo com dados antigos trave o site.
const CARDS_SCHEMA_VERSION = "2026-07-08";

const ensureCardsSchema = () => {
  try {
    if (localStorage.getItem("cardsSchema") !== CARDS_SCHEMA_VERSION) {
      localStorage.removeItem("cards");
      localStorage.removeItem("lastModified");
      localStorage.removeItem("colors");
      localStorage.setItem("cardsSchema", CARDS_SCHEMA_VERSION);
    }
  } catch (e) {
    // localStorage indisponível (modo privado/quota) — segue sem cache.
  }
};

// Fallback em memória. O catálogo (~2,7MB) pode estourar a cota do localStorage
// no Safari iOS (limite ~5MB contado em UTF-16) ou ser recusado no modo privado.
// Nesse caso os cards vivem só em memória e a página renderiza sem o reload.
window.__cardsMem = window.__cardsMem || null;

const loadCards = () => {
  try {
    const raw = localStorage.getItem("cards");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // parse/leitura falhou — cai no fallback em memória.
  }
  return window.__cardsMem || [];
};
window.loadCards = loadCards;

// ---- IndexedDB: cache grande que PERSISTE no iOS (onde o localStorage, ~5MB,
// recusa o catálogo). Assíncrono; usado como fonte para hidratar a memória no
// boot. Cai de pé (retorna vazio/false) se indexedDB estiver indisponível
// (ex.: modo privado antigo do Safari). ----
const IDB_NAME = "cardsfaria";
const IDB_STORE = "kv";

const idbOpen = () =>
  new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });

const idbGet = async (key) => {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return undefined;
  }
};

const idbSet = async (key, val) => {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    return false;
  }
};
window.idbGet = idbGet;

// Persiste os cards em: memória (leitura síncrona) + IndexedDB (persistente,
// iOS) + localStorage (rápido no desktop). O carimbo de tempo vai junto.
const saveCards = (cards) => {
  window.__cardsMem = cards;
  const stamp = new Date().toISOString();
  window.__cardsMemTime = stamp;

  // IndexedDB — assíncrono, não bloqueia o render (fire and forget).
  idbSet("cards", cards);
  idbSet("meta", { lastModified: stamp, schema: CARDS_SCHEMA_VERSION });

  try {
    localStorage.setItem("cards", JSON.stringify(cards));
    localStorage.setItem("lastModified", stamp);
    return true;
  } catch (e) {
    return false; // localStorage cheio (iOS) — segue via memória + IndexedDB.
  }
};
window.saveCards = saveCards;

document.getElementById("menu-button")?.click();

const cartToast = (text, ok = true) =>
  Toastify({
    text,
    duration: 2000,
    close: true,
    gravity: "right",
    position: "right",
    stopOnFocus: true,
    style: {
      background: ok
        ? "linear-gradient(to right, #00b09b, #96c93d)"
        : "linear-gradient(to right, #FFD400, #FFDD3C)"
    }
  }).showToast();

// Seletor de quantidade no card (só aparece quando há mais de 1 disponível).
const changeQty = (cardId, delta) => {
  const cards = loadCards();
  const card = cards.find((c) => c.id == cardId);
  const max = parseInt(card?.qty) || 1;
  const el = document.getElementById("qtysel-" + cardId);
  if (!el) return;
  let v = parseInt(el.textContent) || 1;
  v = Math.min(max, Math.max(1, v + delta));
  el.textContent = v;
};

const addToCart = (cardId) => {
  // Reset do carrinho após 7 dias sem adicionar (mantido).
  const lastAddedDate = localStorage.getItem("lastAddedDate")
    ? new Date(localStorage.getItem("lastAddedDate"))
    : null;

  if (!lastAddedDate) {
    localStorage.setItem("lastAddedDate", new Date());
  } else {
    const days = Math.round(
      (new Date().getTime() - lastAddedDate.getTime()) / (1000 * 3600 * 24)
    );
    if (days > 7) {
      localStorage.setItem("lastAddedDate", new Date());
      localStorage.setItem("cart", JSON.stringify([]));
    }
  }

  const cards = loadCards();
  const card = cards.find((c) => c.id == cardId);
  if (!card) return;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const available = parseInt(card.qty) || 1;

  // Quantidade escolhida no seletor (default 1).
  const sel = document.getElementById("qtysel-" + cardId);
  const wanted = sel ? parseInt(sel.textContent) || 1 : 1;

  const cardInCart = cart.find((c) => c.id == cardId);
  const already = cardInCart ? cardInCart.quantitySelected : 0;
  const canAdd = Math.max(0, available - already);

  if (canAdd <= 0) {
    cartToast("Você já tem o máximo disponível no carrinho", false);
    return;
  }

  const toAdd = Math.min(wanted, canAdd);

  if (cardInCart) {
    cardInCart.quantitySelected += toAdd;
  } else {
    card.quantitySelected = toAdd;
    cart.push(card);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  cartToast(
    `Adicionado ${toAdd} ${toAdd === 1 ? "unidade" : "unidades"} de ${
      card.name
    } ao carrinho`
  );

  if (sel) sel.textContent = 1; // volta o seletor pra 1
};

let mybutton = document.getElementById("btn-back-to-top");

function backToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function scrollFunction() {
  if (!mybutton) return;

  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

if (mybutton) {
  mybutton.addEventListener("click", backToTop);
}

// Produção (cardsfaria.com / github.io) usa a API real. Qualquer outro host
// (localhost, 127.0.0.1 ou IP da rede local ao testar no celular) usa a API no
// MESMO host na porta 8000 — assim o celular alcança o servidor de dev.
const IS_PROD =
  /(^|\.)cardsfaria\.com$/.test(window.location.hostname) ||
  window.location.hostname.endsWith("github.io");
const API_BASE = IS_PROD
  ? "https://api.cardsfaria.com"
  : `${window.location.protocol}//${window.location.hostname}:8000`;

const getCards = () => {
  return fetch(`${API_BASE}/api/fetchCards`);
};

const gotoPage = (page) => {
  window.location.href = page;
};

const LANG_FLAGS = {
  PT: "🇧🇷", BR: "🇧🇷", EN: "🇺🇸", ES: "🇪🇸", SP: "🇪🇸",
  JP: "🇯🇵", JA: "🇯🇵", FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹",
  RU: "🇷🇺", KR: "🇰🇷", KO: "🇰🇷", CN: "🇨🇳", ZH: "🇨🇳"
};

const getLangBadge = (idioma) => {
  const code = (idioma || "").toUpperCase().trim();
  if (!code) return "";
  const flag = LANG_FLAGS[code];
  return `<span class="badge-lang" title="Idioma: ${code}">${
    flag ? flag + " " : ""
  }${code}</span>`;
};

const getCondBadge = (condicao) => {
  const cond = (condicao || "").toUpperCase().trim();
  if (!cond) return "";
  let cls = "def";
  if (cond.includes("NM")) cls = "nm";
  else if (cond.includes("SP")) cls = "sp";
  else if (cond.includes("MP")) cls = "mp";
  else if (cond.includes("HP")) cls = "hp";
  else if (cond.includes("DM")) cls = "dmg";
  return `<span class="badge-cond badge-cond--${cls}" title="Condição: ${cond}">${cond}</span>`;
};

const getCardTemplate = (card) => {
  const avail = parseInt(card.qty) || 0;
  const stepper =
    avail > 1
      ? `<div class="qty-stepper" role="group" aria-label="Quantidade">
          <button type="button" class="qty-btn" onclick="changeQty('${card.id}', -1)" aria-label="Diminuir">−</button>
          <span class="qty-val" id="qtysel-${card.id}">1</span>
          <button type="button" class="qty-btn" onclick="changeQty('${card.id}', 1)" aria-label="Aumentar">+</button>
        </div>`
      : `<span class="qty-single">Última unidade</span>`;

  return `
<div class="col-6 col-lg-4">
  <div class="card position-relative">
    <div class="card-info">
      <span>${card.name}</span>
    </div>
    <div class="card-colecao">${card.colecao || ""}</div>

    <div class="card-image-wrapper shadow">
      <div style="cursor: pointer;" class="card-image w-100">
        <a target="_blank" href="/card?urlCard=${card.id}">
          <img
            src="${
              card?.image
                ? card?.image
                : "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" +
                  card.id +
                  "&type=card"
            }"
          />
        </a>
      </div>
    </div>

    <div class="card-info card-price">
      <span>${formatter.format(card.price || 0)}</span>
    </div>

    ${
      getLangBadge(card.idioma) || getCondBadge(card.condicao)
        ? `<div class="card-meta">${getLangBadge(card.idioma)}${getCondBadge(
            card.condicao
          )}</div>`
        : ""
    }

    <div class="card-stock">${avail} ${
    avail === 1 ? "disponível" : "disponíveis"
  }</div>

    ${
      card.additionalInfo
        ? `<span class="card-info2 text-danger">${card.additionalInfo}</span>`
        : ""
    }

    <div class="card-buy">
      ${stepper}
      <button
        type="button"
        class="btn btn-dark btn-floating"
        id="cart-${card.id}"
        onclick="addToCart('${card.id}')"
        aria-label="Adicionar ao carrinho"
      >
        <i class="fa-solid fa-cart-shopping"></i>
      </button>
    </div>
  </div>
</div>
`;
};

const separeteCards = async (category = null) => {
  const cards = [];

  const loading = document.getElementById("loading");

  if (loading) {
    loading.hidden = false;
  }

  const response = await getCards();

  if (response.ok) {
    let allCardsData = await response.json();

    for (let i = 0; i < allCardsData.length; i++) {
      let card = allCardsData[i];
      card.category = (card.category || "")
        .split("-")
        .map((category) => category.trim());
      if (!card.category.includes("F") && !card.category.includes("RA")) {
        card.price = parseFloat(card.price);
        if (card["Custo"]) {
          card["Custo"] = parseInt(card["Custo"]);
        } else {
          card["Custo"] = 24;
        }
        card["id"] = cards.length + 1;

        cards.push(card);
      }
    }
  }
  saveCards(cards);

  if (loading) {
    loading.hidden = true;
  }

  // Renderiza direto da memória (sem reload — igual em todas as plataformas).
  // Cada página registra sua função em window.renderCardsPage.
  if (typeof window.renderCardsPage === "function") {
    window.renderCardsPage();
  } else if (typeof setFilters === "function") {
    setFilters(true);
  }
  // Em páginas sem esses hooks (ex.: card/list), os dados já estão em
  // window.__cardsMem/IndexedDB e o script da página os lê via loadCards().

  return cards;
};

const createDomCards = (
  cards,
  container = "cards-filter-row",
  noPaginate = false
) => {
  const cardsContainer = document.getElementById(container);

  if (noPaginate) {
    cards.forEach((card) => {
      cardsContainer.innerHTML += getCardTemplate(card);
    });
    const loading = document.getElementById("loading");
    if (loading) loading.hidden = true;
    return;
  }

  if (!cardsContainer) return;
  const cardsToRender = cards.slice(lastSlice, lastSlice + 9);
  lastSlice += 9;

  cardsToRender.forEach((card) => {
    cardsContainer.innerHTML += getCardTemplate(card);
  });

  const loading = document.getElementById("loading");
  if (loading) loading.hidden = true;
};

window.onscroll = async function () {
  const cardsContainer = document.getElementById("cards-filter-row");

  if (
    cardsContainer &&
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    cardsContainer.innerHTML
  ) {
    if (currentPath === "list" && foundCards && foundCards.length > 0) {
      createDomCards(foundCards, "cards-filter-row");
    } else if (
      currentPath === "filtrar" ||
      currentPath === "index.html" ||
      !currentPath // home
    ) {
      createDomCards(await setFilters(false), "cards-filter-row");
    }
  }
  scrollFunction();
};

(async () => {
  const searchBtn = document.getElementById("search-btn");
  const resetBtn = document.getElementById("reset-btn");
  const loading = document.getElementById("loading");
  if (searchBtn && resetBtn) {
    searchBtn.disabled = true;
    resetBtn.disabled = true;
  }

  // Cache antigo (schema diferente) é descartado antes de qualquer leitura.
  ensureCardsSchema();

  // Descobre o carimbo de tempo do cache. No desktop vem do localStorage; no
  // iOS (localStorage cheio) hidrata a memória a partir do IndexedDB.
  let lastModified = localStorage.getItem("lastModified");

  if (loadCards().length === 0) {
    const [idbCards, idbMeta] = await Promise.all([
      idbGet("cards"),
      idbGet("meta"),
    ]);
    if (idbMeta && idbMeta.schema !== CARDS_SCHEMA_VERSION) {
      // Schema mudou: descarta o cache do IndexedDB.
      await idbSet("cards", null);
    } else if (Array.isArray(idbCards) && idbCards.length) {
      window.__cardsMem = idbCards;
      lastModified = (idbMeta && idbMeta.lastModified) || lastModified;
    }
  }

  const CACHE_MINUTES = 15;
  const fresh =
    loadCards().length > 0 &&
    lastModified &&
    Date.now() - new Date(lastModified).getTime() < CACHE_MINUTES * 60000;

  if (fresh) {
    // Cache válido (localStorage ou IndexedDB) — renderiza sem buscar da API.
    if (typeof window.renderCardsPage === "function") {
      window.renderCardsPage();
    }
  } else {
    // Sem cache ou cache velho — busca da API (separeteCards renderiza no fim).
    await separeteCards();
  }

  if (searchBtn && resetBtn) {
    searchBtn.disabled = false;
    resetBtn.disabled = false;
  }

  if (loading) loading.hidden = true;
})();
