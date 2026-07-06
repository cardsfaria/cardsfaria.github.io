let cardsNotFound = [];
let foundCards = [];

const resetList = () => {
  const list = document.getElementById("card-list");
  list.value = "";
  const cardsContainer = document.getElementById("cards-filter-row");
  cardsContainer.innerHTML = "";
  cardsNotFound = [];
  foundCards = [];
};

const searchForList = () => {
  const cardsContainer = document.getElementById("cards-filter-row");
  const list = document.getElementById("card-list")?.value;
  cardsContainer.innerHTML = "";
  cardsNotFound = [];
  foundCards = [];
  lastSlice = 0;

  if (!list) {
    Toastify({
      text: "Preencha com uma lista",
      duration: 2000,
      close: true,
      gravity: "right", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "linear-gradient(to right, #FFD400, #FFDD3C)"
      }
    }).showToast();
  }

  const cards = JSON.parse(localStorage.getItem("cards")) || [];
  const arrayList = list.split("\n");

  arrayList.forEach((rawLine) => {
    // Remove espaços antes/depois — comum ao colar de outros sites (item 10).
    const line = (rawLine || "").trim();
    if (!line) return;

    const name = containsNumber(line)
      ? removeFirstWord(line)
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
      : line
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "");

    const foundCard = cards.find(
      (item) =>
        item.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "") === name ||
        item["Nome Portugues"]
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "") === name
    );
    if (foundCard) {
      foundCards.push(foundCard);
    } else {
      cardsNotFound.push(line);
    }
  });

  // Popup mostra os ENCONTRADOS + um aviso menor com os faltantes (item 3).
  const modalButton = document.getElementById("modal-button");
  const modalText = document.getElementById("modal-text");
  const modalMissing = document.getElementById("modal-missing");

  modalText.innerHTML = "";
  if (foundCards.length > 0) {
    foundCards.forEach(
      (card) => (modalText.innerHTML += `<li>${card.name}</li>`)
    );
  } else {
    modalText.innerHTML = "<li>Nenhuma carta encontrada.</li>";
  }

  if (modalMissing) {
    modalMissing.innerHTML = "";
    if (cardsNotFound.length > 0) {
      modalMissing.innerHTML =
        `<hr /><strong>Não encontradas (${cardsNotFound.length}):</strong>` +
        `<ul>${cardsNotFound.map((c) => `<li>${c}</li>`).join("")}</ul>`;
    }
  }

  if (foundCards.length > 0 || cardsNotFound.length > 0) {
    modalButton.click();
  }

  createDomCards(foundCards, "cards-filter-row");
};

const addFoundsToCart = () => {
  if (foundCards.length <= 0) {
    Toastify({
      text: "Nenhuma carta encontrada, faça a busca primeiro.",
      duration: 2000,
      close: true,
      gravity: "right", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "linear-gradient(to right, #FFD400, #FFDD3C)"
      }
    }).showToast();
    return;
  }

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let addedCards = 0;
  foundCards.forEach((card) => {
    const foundCard = cart.find((item) => item.id === card.id);
    if (!foundCard) {
      card.quantitySelected = 1;
      cart.push(card);
      addedCards++;
    }
  });

  if (addedCards === 0) {
    return Toastify({
      text: `Nenhuma carta adicionada, o limite de todas foi atingido.`,
      duration: 1000,
      close: true,
      gravity: "right", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)"
      }
    }).showToast();
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  Toastify({
    text: `Adicionado ${addedCards} cards ao carrinho!`,
    duration: 1000,
    close: true,
    gravity: "right", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)"
    }
  }).showToast();
};

const containsNumber = (str) => {
  return /\d/.test(str);
};

const removeFirstWord = (str) => {
  const indexOfSpace = str.indexOf(" ");

  if (indexOfSpace === -1) {
    return "";
  }

  return str.substring(indexOfSpace + 1).trim();
};
