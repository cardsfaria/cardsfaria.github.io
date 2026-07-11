const urlSearchParams = new URLSearchParams(window.location.search);
const { urlCard } = Object.fromEntries(urlSearchParams.entries());

if(!urlCard) {
  window.location.href = '/';
}

const getCardsSafe = () =>
  typeof loadCards === 'function'
    ? loadCards()
    : (JSON.parse(localStorage.getItem('cards')) || []);

const getColorsTemplate = (colors) => {
  let template = '';
  (colors || []).forEach((color) => {
    template += `<abbr class="mtg-symbol mtg-symbol-${color}" style="width: 14px; height: 14px;"></abbr>`;
  });
  return template;
}

const cardTypes = {
  C: 'Criatura',
  E: 'Encantamento',
  I: 'Instantâneo',
  A: 'Artefato',
  F: 'Feitiço',
  T: 'Tokens',
  L: 'Terreno',
  P: 'Planeswalker',
}

const cardRares = {
  C: 'Comum',
  I: 'Incomum',
  R: 'Rara',
  M: 'Mítica',
}

const goBack = () => {
  // Volta pra lista preservando filtros + scroll (salvos em sessionStorage).
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/';
  }
};

const cardContainerTemplate = (card) => `
<button type="button" class="btn btn-dark mb-3" onclick="goBack()">
  <i class="fa-solid fa-arrow-left"></i> Voltar
</button>
<div class="row">
    <div class="col-md-4">
      <div class="card-image2 w-100">
        <img
          src="${card.image}"
        />
      </div>
    </div>
    <div class="col-md-8 position-relative">
      <div class="d-flex justify-content-start align-items-center">
        <div class="d-flex flex-column">
          <span style="font-size: 35px;">${card.name}</span>
          <span style="font-size: 20px; opacity: 70%;" class="font-italic">${card['Nome Portugues']}</span>
        </div>
      </div>
      <hr />
      <div class="mt-4" style="font-size: 17px">
        <strong style="opacity: 75%;">Cores: </strong>
          ${getColorsTemplate(card.category)}
      </div>
      <div class="mt-2" style="font-size: 17px">
        <strong style="opacity: 75%;">Tipo: </strong>
        <span>${(card.Tipo || '-').replace(/-/g, ' / ')}${card.subtipo && card.subtipo !== '-' ? ' — ' + card.subtipo.replace(/-/g, ' ') : ''}</span>
      </div>
      <div class="mt-2" style="font-size: 17px">
        <strong style="opacity: 75%;">Raridade: </strong>
        <span>${card.Raridade || '-'}</span>
      </div>
      <div class="mt-2" style="font-size: 17px">
        <strong style="opacity: 75%;">Coleção: </strong>
        <span>${card.colecao || '-'}</span>
      </div>
      <div class="mt-2" style="font-size: 17px">
        <strong style="opacity: 75%;">Acabamento: </strong>
        <span>${card.acabamento || card['FOIL?'] || '-'}</span>
      </div>
      <div class="mt-2" style="font-size: 17px">
        <strong style="opacity: 75%;">Artista: </strong>
        <span>${card.artista || '-'}</span>
      </div>
      <div class="mt-2" style="font-size: 17px">
        <strong style="opacity: 75%;">Informações adicionais: </strong>
        <span>${card.additionalInfo || ''}</span>
      </div>

      <div class="mt-2" style="font-size: 20px">
        <strong style="opacity: 75%;">Quantidade: </strong>
        <span>${card.qty}x</span>
      </div>

      <div class="mt-2 pb-5" style="font-size: 20px">
        <strong style="opacity: 75%;">Preço: </strong>
        <span>${formatter.format(card.price || 0)}</span>
      </div>

      <div class="position-absolute text-danger bottom-0 end-0 me-3" style="font-size: 25px;">
        <button
          type="button"
          class="btn btn-dark btn-floating btn-lg"
          id="cart-${card.id}"
          onclick="addToCart('${card.id}')"
        >
        <i class="fa-solid fa-cart-shopping"></i>
        </button>
      </div>
      <div class="position-absolute bottom-0">
        <span>Compare o preço na <a target="_blank" href="https://www.ligamagic.com.br/?view=cards/card&card=${card.name}">liga magic</a></span>
      </div>

    </div>
</div>
  `;


// Renderiza a carta. Como os dados podem chegar de forma ASSÍNCRONA (IndexedDB
// no iOS, ou fetch se não houver cache), esta função é chamada tanto agora quanto
// pelo boot do cards-script (window.renderCardsPage) assim que os cards estiverem
// prontos — evita a "página em branco" quando loadCards() ainda está vazio.
const renderCardDetail = () => {
  const cardContainer = document.getElementById('card-container');
  if (!cardContainer) return;

  const cards = getCardsSafe();
  const card = cards.find((c) => c.id === parseInt(urlCard));

  if (!card) {
    if (cards.length === 0) {
      // Dados ainda não chegaram — mostra "carregando" (o boot re-renderiza).
      cardContainer.innerHTML =
        '<div class="text-center py-5">Carregando carta…</div>';
    } else {
      // Dados prontos, mas o id não existe.
      cardContainer.innerHTML =
        '<button type="button" class="btn btn-dark mb-3" onclick="goBack()">' +
        '<i class="fa-solid fa-arrow-left"></i> Voltar</button>' +
        '<div class="text-center py-4">Carta não encontrada.</div>';
    }
    return;
  }

  cardContainer.innerHTML = cardContainerTemplate(card);
};

// O boot do cards-script chama isto quando os cards ficam prontos.
window.renderCardsPage = renderCardDetail;
renderCardDetail();