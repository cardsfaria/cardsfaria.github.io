let lastSlice = 0;
const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

document.getElementById("menu-button")?.click();

const addToCart = (cardId) => {
  const button = document.getElementById("cart-" + cardId);

  const lastAddedDate = localStorage.getItem("lastAddedDate")
    ? new Date(localStorage.getItem("lastAddedDate"))
    : null;

  if (!lastAddedDate) {
    localStorage.setItem("lastAddedDate", new Date());
  } else {
    let Difference_In_Time = new Date().getTime() - lastAddedDate.getTime();
    let Difference_In_Days = Math.round(
      Difference_In_Time / (1000 * 3600 * 24)
    );
    if (Difference_In_Days > 7) {
      localStorage.setItem("lastAddedDate", new Date());
      localStorage.setItem("cart", JSON.stringify([]));
    }
  }

  const cards = JSON.parse(localStorage.getItem("cards"));
  let card = cards.find((c) => c.id == cardId);
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  card.quantitySelected = 1;

  const cardInCart = cart.find((c) => c.id == cardId);
  let text = "Adicionado 1 unidade de " + card.name + " ao carrinho";

  if (cardInCart) {
    if (cardInCart.quantitySelected >= parseInt(card.qty)) {
      Toastify({
        text: "Quantidade máxima atingida",
        duration: 2000,
        close: true,
        gravity: "right", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #FFD400, #FFDD3C)"
        }
      }).showToast();
      button.disabled;
      return;
    }
    text = `Alterado a quantidade de ${cardInCart.quantitySelected} para ${
      cardInCart.quantitySelected + 1
    } de ${cardInCart.name} no carrinho.`;

    cardInCart.quantitySelected += 1;
    card = cardInCart;
    const cardIndex = cart.findIndex((c) => c.id == cardId);
    cart.splice(cardIndex, 1);
  }

  cart.push(card);
  Toastify({
    text,
    duration: 2000,
    close: true,
    gravity: "right", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)"
    }
  }).showToast();
  localStorage.setItem("cart", JSON.stringify(cart));
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

const getCardTemplate = (card) => `
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
    
    <div class="card-info card-qty">
      <span>Qtde: ${card.qty}x</span>
    </div>
    <div class="card-bottom">
      <span class="text-danger card-info2">${card.additionalInfo || "-"}</span>
      <button
        type="button"
        class="btn btn-dark btn-floating"
        id="cart-${card.id}"
        onclick="addToCart('${card.id}')"
      >
        <i class="fa-solid fa-cart-shopping"></i>
      </button>
    </div>

    </div>
  </div>
</div>

`;

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
