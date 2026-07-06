let lastSlice = 0;
const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

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
  const cards = JSON.parse(localStorage.getItem("cards")) || [];
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

  const cards = JSON.parse(localStorage.getItem("cards")) || [];
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

// Em desenvolvimento (localhost) consome a API local; em produção, a API real.
const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://api.cardsfaria.com";

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
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("lastModified", new Date());
  setFilters(true);
  if (loading) {
    loading.hidden = true;
  }
  window.location.reload();

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
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    cardsContainer.innerHTML
  ) {
    if (currentPath === "list" && foundCards && foundCards.length > 0) {
      createDomCards(foundCards, "cards-filter-row");
    } else if (currentPath === "filtrar") {
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

  if (localStorage.getItem("cards") && localStorage.getItem("lastModified")) {
    const lastModified = new Date(localStorage.getItem("lastModified"));
    const addMinutes = 15;
    const lastModifiedPlusHour = new Date(
      lastModified.getTime() + addMinutes * 60000
    );
    const now = new Date();
    if (now >= lastModifiedPlusHour) {
      await separeteCards();
    }
  } else {
    await separeteCards();
  }
  if (searchBtn && resetBtn) {
    searchBtn.disabled = false;
    resetBtn.disabled = false;
  }

  if (loading) loading.hidden = true;
})();
