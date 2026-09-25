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
    // O catálogo NÃO é mais guardado no localStorage: ~7,7MB em UTF-16, contra
    // a cota de ~5MB do Safari iOS. Removemos o resquício das versões antigas
    // — inclusive o "[]" que travava o aparelho em "nenhuma carta encontrada"
    // — e assim liberamos a cota de volta.
    localStorage.removeItem("cards");

    if (localStorage.getItem("cardsSchema") !== CARDS_SCHEMA_VERSION) {
      localStorage.removeItem("lastModified");
      localStorage.removeItem("colors");
      localStorage.setItem("cardsSchema", CARDS_SCHEMA_VERSION);
    }
  } catch (e) {
    // localStorage indisponível (modo privado/quota) — segue sem cache.
  }
};

// Os cards vivem em memória (leitura síncrona, fonte única da verdade) e são
// persistidos no IndexedDB, que aguenta o catálogo inteiro em qualquer
// plataforma. O localStorage guarda só o carimbo de tempo, que é minúsculo.
window.__cardsMem = window.__cardsMem || null;

const loadCards = () => window.__cardsMem || [];
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
      // Estouro de cota aborta a transação sem disparar onerror. Sem isto a
      // promessa ficava pendurada para sempre.
      tx.onabort = () => reject(tx.error || new Error("abort"));
    });
  } catch (e) {
    return false;
  }
};
window.idbGet = idbGet;

// Persiste os cards em: memória (leitura síncrona) + IndexedDB (persistente em
// qualquer plataforma). O carimbo de tempo vai junto — e também no
// localStorage, por ser pequeno o bastante para sempre caber.
const saveCards = async (cards) => {
  // NUNCA sobrescreve o cache com uma lista vazia. Gravar [] apagava o catálogo
  // bom e, como a regravação com os dados certos falhava por cota no iOS, o
  // aparelho ficava travado em "nenhuma carta encontrada" para sempre.
  if (!Array.isArray(cards) || cards.length === 0) return false;

  window.__cardsMem = cards;
  const stamp = new Date().toISOString();
  window.__cardsMemTime = stamp;

  // ORDEM IMPORTA: grava as cartas primeiro e só carimba a hora se elas
  // realmente persistiram. Quando as duas gravações eram disparadas juntas, a
  // pequena (o carimbo) passava e a grande (3,9MB de cartas) podia falhar —
  // o aparelho ficava com catálogo velho e carimbo novo, se achava atualizado
  // e nunca mais buscava o estoque novo.
  const gravou = await idbSet("cards", cards);
  if (!gravou) return false;

  await idbSet("meta", { lastModified: stamp, schema: CARDS_SCHEMA_VERSION });

  try {
    localStorage.setItem("lastModified", stamp);
  } catch (e) {
    // localStorage indisponível — o carimbo do IndexedDB já basta.
  }
  return true;
};
window.saveCards = saveCards;

// ---- Identidade da carta no carrinho ----
// O campo "id" é apenas a POSIÇÃO da carta na planilha (ver separeteCards): ao
// cadastrar ou remover qualquer carta, os ids de todas as seguintes mudam. O
// "searchCode" é o código único e estável, então é ele que identifica a carta.
// (Há uma cópia destas duas funções em cart/cart-script.js, porque a página do
// carrinho não carrega este arquivo.)
const cardKey = (card) =>
  String((card && card.searchCode) || "#" + (card && card.id));
window.cardKey = cardKey;

// Junta linhas repetidas da mesma carta num item só, somando as quantidades e
// respeitando o estoque disponível.
const mergeCart = (cart) => {
  const porChave = new Map();
  (cart || []).forEach((item) => {
    const key = cardKey(item);
    const estoque = parseInt(item.qty) || 1;
    const atual = porChave.get(key);
    if (atual) {
      atual.quantitySelected = Math.min(
        estoque,
        (atual.quantitySelected || 1) + (item.quantitySelected || 1)
      );
    } else {
      porChave.set(key, {
        ...item,
        quantitySelected: Math.min(estoque, item.quantitySelected || 1)
      });
    }
  });
  return [...porChave.values()];
};
window.mergeCart = mergeCart;

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

  // Procura pelo CÓDIGO da carta, não pelo id: o id é só a posição na planilha
  // e muda toda vez que uma carta é cadastrada ou removida. Era por isso que a
  // mesma carta entrava duas vezes no pedido, furando o estoque.
  const key = cardKey(card);
  const cardInCart = cart.find((c) => cardKey(c) === key);
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
  // A API não manda ETag nem Last-Modified, então o navegador não tem como
  // revalidar e pode devolver uma cópia guardada — o site mostraria o estoque
  // de dias atrás. URL sempre diferente + no-store garantem resposta nova.
  return fetch(`${API_BASE}/api/fetchCards?t=${Date.now()}`, {
    cache: "no-store"
  });
};

const gotoPage = (page) => {
  window.location.href = page;
};

// Idioma -> país da bandeira. (Emoji de bandeira não renderiza no Windows/desktop,
// por isso usamos SVG inline abaixo, que funciona igual em qualquer sistema.)
const LANG_TO_FLAG = {
  EN: "US", PT: "BR", BR: "BR", ES: "ES", SP: "ES",
  JP: "JP", JA: "JP", FR: "FR", DE: "DE", IT: "IT",
  RU: "RU", KR: "KR", KO: "KR", CN: "CN", ZH: "CN", CH: "CN",
};

// Bandeirinhas em SVG (viewBox 24x16). Simples, mas reconhecíveis.
const FLAG_SVG = {
  US: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><g fill="#b22234"><rect width="24" height="2.46"/><rect y="4.92" width="24" height="2.46"/><rect y="9.85" width="24" height="2.46"/><rect y="13.54" width="24" height="2.46"/></g><rect width="10" height="8.6" fill="#3c3b6e"/></svg>',
  BR: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#009b3a"/><path d="M12 2 22 8 12 14 2 8Z" fill="#fedf00"/><circle cx="12" cy="8" r="3.2" fill="#002776"/></svg>',
  ES: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#c60b1e"/><rect y="4" width="24" height="8" fill="#ffc400"/></svg>',
  JP: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><circle cx="12" cy="8" r="4.5" fill="#bc002d"/></svg>',
  FR: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#0055a4"/><rect x="16" width="8" height="16" fill="#ef4135"/></svg>',
  DE: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#000"/><rect y="5.33" width="24" height="5.33" fill="#dd0000"/><rect y="10.66" width="24" height="5.34" fill="#ffce00"/></svg>',
  IT: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#009246"/><rect x="16" width="8" height="16" fill="#ce2b37"/></svg>',
  RU: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#0039a6"/><rect y="10.66" width="24" height="5.34" fill="#d52b1e"/></svg>',
  KR: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><circle cx="12" cy="8" r="4.5" fill="#0047a0"/><path d="M7.5 8a4.5 4.5 0 0 1 9 0Z" fill="#cd2e3a"/></svg>',
  CN: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#de2910"/><text x="3.5" y="11.5" font-size="10" fill="#ffde00">★</text></svg>',
};

const flagFor = (code) => {
  const svg = FLAG_SVG[LANG_TO_FLAG[code]];
  return svg ? `<span class="flag-ic">${svg}</span>` : "";
};

const getLangBadge = (idioma) => {
  const code = (idioma || "").toUpperCase().trim();
  if (!code) return "";
  // Cor por idioma: PT azul, EN vermelho, demais cinza.
  let cls = "other";
  if (code === "PT" || code === "BR") cls = "pt";
  else if (code === "EN") cls = "en";
  return `<span class="badge-lang badge-lang--${cls}" title="Idioma: ${code}">${flagFor(
    code
  )}${code}</span>`;
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

// Acabamento: só Foil e Promo ganham selo. Os demais (Borderless, arte
// estendida, textless...) a pessoa reconhece pela arte da própria carta.
// "Promo-Foil" rende os dois selos, porque é as duas coisas.
const ACAB_DESTAQUE = { foil: "Foil", promo: "Promo" };

const getAcabBadge = (card) => {
  const raw = (card.acabamento || card["FOIL?"] || "").trim();
  if (!raw) return "";
  const tokens = [];
  raw.split("-").forEach((t) => {
    const k = t.trim().toLowerCase();
    if (ACAB_DESTAQUE[k] && !tokens.includes(k)) tokens.push(k);
  });
  return tokens
    .map(
      (k) =>
        `<span class="badge-acab" title="Acabamento: ${ACAB_DESTAQUE[k]}">${ACAB_DESTAQUE[k]}</span>`
    )
    .join("");
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
      : "";
  // Com 1 unidade só mostra "Última unidade" (antes repetia "1 disponível" ao lado).
  const stockLabel = avail > 1 ? `${avail} disponíveis` : "Última unidade";

  // Selos numa linha só, abaixo da imagem: acabamento + idioma + condição.
  const badges =
    getAcabBadge(card) + getLangBadge(card.idioma) + getCondBadge(card.condicao);

  return `
<div class="col-6 col-lg-4">
  <div class="card position-relative">
    <div class="card-info card-title">
      <span>${card.name}</span>
    </div>
    <div class="card-colecao">${card.colecao || ""}</div>

    <div class="card-image-wrapper shadow">
      <div style="cursor: pointer;" class="card-image w-100">
        <a href="/card?urlCard=${card.id}" onclick="if(window.saveListState)window.saveListState()">
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

    ${badges ? `<div class="card-meta">${badges}</div>` : ""}

    <div class="card-info card-price">
      <span>${formatter.format(card.price || 0)}</span>
    </div>

    ${
      card.additionalInfo
        ? `<span class="card-info2 text-danger">${card.additionalInfo}</span>`
        : ""
    }

    <div class="card-buy">
      ${stepper}
      <span class="card-stock">${stockLabel}</span>
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

  // Só cacheia se veio conteúdo de verdade. Se a API respondeu com erro
  // (5xx/429 do rate limit) ou devolveu lista vazia, preservamos o cache
  // anterior em vez de destruí-lo — melhor mostrar dados de ontem do que
  // uma tela vazia.
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

  // Se a busca não trouxe nada, devolve o cache preservado (não a lista vazia).
  return cards.length > 0 ? cards : loadCards();
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

  // Hidrata a memória a partir do IndexedDB (única fonte persistente do
  // catálogo). O carimbo de tempo vem junto; o do localStorage é só um reforço.
  let lastModified = localStorage.getItem("lastModified");

  {
    const [idbCards, idbMeta] = await Promise.all([
      idbGet("cards"),
      idbGet("meta"),
    ]);
    if (idbMeta && idbMeta.schema !== CARDS_SCHEMA_VERSION) {
      // Schema mudou: descarta o cache do IndexedDB (cards e carimbo, senão o
      // carimbo velho sobreviveria e seria comparado contra um cache já morto).
      await Promise.all([idbSet("cards", null), idbSet("meta", null)]);
      lastModified = null;
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
    // Cache válido (IndexedDB) — renderiza sem buscar da API.
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
