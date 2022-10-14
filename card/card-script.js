const urlCard = window.location.href.split('/')[4];

if(!urlCard) {
  window.location.href = '/';
}
const cards = JSON.parse(localStorage.getItem('cards'));
const card  = cards.find(card => card.id === parseInt(urlCard));

const getColorsTemplate = (colors) => {
  let template = '';
  colors.forEach((color) => {
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

const cardContainerTemplate = (card) => `
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
        <span>${cardTypes[card.Tipo]}</span>
      </div>
      <div class="mt-2" style="font-size: 17px">
        <strong style="opacity: 75%;">Raridade: </strong>
        <span>${cardRares[card.Raridade]}</span>
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
      </div>
      <div class="position-absolute bottom-0">
        <span>Compare o preço na <a target="_blank" href="https://www.ligamagic.com.br/?view=cards/card&card=${card.name}">liga magic</a></span>
      </div>

    </div>
</div>
  `;


const cardContainer = document.getElementById('card-container');
cardContainer.innerHTML = cardContainerTemplate(card);