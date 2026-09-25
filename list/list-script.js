let cardsNotFound = [];
let foundCards = []; // todas as impressões encontradas (o que aparece na tela)
let pedidos = []; // uma entrada por linha da lista, com as opções daquela carta

// Compara nomes ignorando maiúsculas, acentos e espaços nas pontas.
const normalizarNome = (valor) =>
  (valor || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const resetList = () => {
  const list = document.getElementById("card-list");
  list.value = "";
  const cardsContainer = document.getElementById("cards-filter-row");
  cardsContainer.innerHTML = "";
  cardsNotFound = [];
  foundCards = [];
  pedidos = [];
};

const searchForList = () => {
  const cardsContainer = document.getElementById("cards-filter-row");
  const list = document.getElementById("card-list")?.value;
  cardsContainer.innerHTML = "";
  cardsNotFound = [];
  foundCards = [];
  pedidos = [];
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

  const cards = (typeof loadCards === "function"
    ? loadCards()
    : JSON.parse(localStorage.getItem("cards")) || []);
  const arrayList = list.split("\n");

  const jaNaTela = new Set();

  arrayList.forEach((rawLine) => {
    // Remove espaços antes/depois — comum ao colar de outros sites (item 10).
    const line = (rawLine || "").trim();
    if (!line) return;

    const name = normalizarNome(
      containsNumber(line) ? removeFirstWord(line) : line
    );
    if (!name) return;

    // TODAS as impressões da carta, não só a primeira. A mesma carta costuma
    // ter várias edições/idiomas/condições e quem monta a lista precisa ver as
    // opções — é o que a busca normal já faz.
    const opcoes = cards.filter(
      (item) =>
        normalizarNome(item.name) === name ||
        normalizarNome(item["Nome Portugues"]) === name
    );

    if (opcoes.length <= 0) {
      cardsNotFound.push(line);
      return;
    }

    pedidos.push({ linha: line, opcoes });

    // Se a mesma carta vier em duas linhas, não repete os cards na tela.
    opcoes.forEach((card) => {
      const chave =
        typeof cardKey === "function" ? cardKey(card) : String(card.id);
      if (jaNaTela.has(chave)) return;
      jaNaTela.add(chave);
      foundCards.push(card);
    });
  });

  // Popup mostra os ENCONTRADOS + um aviso menor com os faltantes (item 3).
  const modalButton = document.getElementById("modal-button");
  const modalText = document.getElementById("modal-text");
  const modalMissing = document.getElementById("modal-missing");

  modalText.innerHTML = "";
  if (pedidos.length > 0) {
    // Uma linha por carta pedida, dizendo quantas versões existem no estoque.
    pedidos.forEach((pedido) => {
      const total = pedido.opcoes.length;
      const versoes = total > 1 ? ` <small>(${total} versões)</small>` : "";
      modalText.innerHTML += `<li>${pedido.opcoes[0].name}${versoes}</li>`;
    });
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
  if (pedidos.length <= 0) {
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

  pedidos.forEach((pedido) => {
    // UMA versão por linha pedida (a primeira da lista). O botão significa
    // "adiciona as cartas que eu listei", não "todas as versões de cada uma" —
    // para escolher outra versão, é só usar o carrinho do card na tela.
    const card = pedido.opcoes[0];
    // Compara pelo código único, não pelo id (que é a posição na planilha e
    // muda quando o estoque é editado).
    const chave =
      typeof cardKey === "function" ? cardKey(card) : String(card.id);
    const noCarrinho = cart.find(
      (item) =>
        (typeof cardKey === "function" ? cardKey(item) : String(item.id)) ===
        chave
    );
    const estoque = parseInt(card.qty) || 1;
    const jaTem = noCarrinho ? noCarrinho.quantitySelected || 0 : 0;

    if (jaTem >= estoque) return; // respeita o estoque disponível

    if (noCarrinho) {
      noCarrinho.quantitySelected = jaTem + 1;
    } else {
      // Cópia: sem isso o quantitySelected gruda no card do catálogo em memória.
      cart.push({ ...card, quantitySelected: 1 });
    }
    addedCards++;
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
