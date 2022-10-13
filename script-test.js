
const notFoundText = document.getElementById('not-found-cards');
notFoundText.hidden = true;

const showFilterButton = document.getElementById('show-filter-button');
const filters = document.getElementById('filters');

const showFilter = () => {
  toggleButtonText();
  showFilterButton.onclick = hideFilter;
  filters.style.display = 'block'
}

const hideFilter = () => {
  toggleButtonText();
  showFilterButton.onclick = showFilter;
  filters.style.display = 'none'; 
}
 
const toggleButtonText = () => {
  const text = showFilterButton.innerText === "Mostrar filtros" ? "Esconder filtros" : "Mostrar filtros";
  showFilterButton.innerText = text;
}


let changedColors = false;
let changedCMC = false;
let changedRarity = false;
let changedType = false;
const handleChangedColors = () => changedColors = true;
const handleChangedCMC = () => changedCMC = true;
const handleChangedRarity = () => changedRarity = true;
const handleChangedType = () => changedType = true;

const colors = [{id: 'red', name: 'Vermelho'}, { id: 'blue', name: 'Azul'}, { id: 'black', name: 'Preto'}, { id: 'white', name: 'Branco'}, { id: 'green', name: 'Verde'}, { id: 'colorless', name: 'Colorless'}, { id: 'foil', name: 'Foil'}];

const getFiltersTemplate = (color) =>`
  <div class="form-check mt-2">
    <input
      class="form-check-input"
      onchange="handleChangedColors()"
      type="checkbox"
      id="${color.id}"
    />

    <label class="form-check-label" for="${color.id}"> ${color.name} </label>
  </div>
  `

  const cmcs = [
    {id: '01', name: '0-1', cmc: [0, 1]},
    {id: '2', name: '2', cmc: 2},
    {id: '3', name: '3', cmc: 3},
    {id: '4', name: '4', cmc: 4},
    {id: '5', name: '5', cmc: 5},
    {id: '6', name: '6+', cmc: 6},
  ]

  const getFiltersCMCTemplate = (cmc) =>`
  <div class="form-check mt-2">
    <input
      class="form-check-input"
      onchange="handleChangedCMC()"
      type="checkbox"
      id="cmc-${cmc.id}"
    />

    <label class="form-check-label" for="cmc-${cmc.id}"> Custo: ${cmc.name} </label>
  </div>
  `

  const rarities = [
    {id: 'C', name: 'Comum'},
    {id: 'I', name: 'Incomum'},
    {id: 'R', name: 'Rara'},
    {id: 'M', name: 'Mitico-Rara'},
    {id: 'E', name: 'Especial'},
  ]

  const getFiltersRarityTemplate = (rarity) =>`
  <div class="form-check mt-2">
    <input
      class="form-check-input"
      onchange="handleChangedRarity()"
      type="checkbox"
      id="rare-${rarity.id}"
    />

    <label class="form-check-label" for="rare-${rarity.id}"> ${rarity.name} </label>
  </div>
  `

  const types = [
    {id: 'F', name: 'Feitiço'},
    {id: 'C', name: 'Criatura'},
    {id: 'I', name: 'Instantanea'},
    {id: 'A', name: 'Artefato'},
    {id: 'T', name: 'Tokens'},
    {id: 'E', name: 'Encantamentos'},
    {id: 'P', name: 'Planeswalker'},
    {id: 'L', name: 'Terrenos'},
  ]

  const getFiltersTypesTemplate = (type) =>`
  <div class="form-check mt-2">
    <input
      class="form-check-input"
      onchange="handleChangedType()"
      type="checkbox"
      id="type-${type.id}"
    />

    <label class="form-check-label" for="type-${type.id}"> ${type.name} </label>
  </div>
  `

const createFilter = () => {
  const colorFilters = document.getElementById('color-filters');
  colors.forEach(color => {
    colorFilters.innerHTML += getFiltersTemplate(color);
  });
}

const createCMCFilter = () => {
  const cmcFilters = document.getElementById('cmc-filters');
  cmcs.forEach(cmc => {
    cmcFilters.innerHTML += getFiltersCMCTemplate(cmc);
  });
}

const createRaritiesFilter = () => {
  const rarityFilters = document.getElementById('rarity-filters');
  rarities.forEach(rarity => {
    rarityFilters.innerHTML += getFiltersRarityTemplate(rarity);
  });
}

const createTypeFilter = () => {
  const typeFilters = document.getElementById('type-filters');
  types.forEach(type => {
    typeFilters.innerHTML += getFiltersTypesTemplate(type);
  });
}

const resetItem = (array, key) => {
  array.forEach(item => {
    const element = document.getElementById(key + item.id);
    if(element) element.checked = false;
  })
}

const resetFilter = () => {
  resetItem(colors, '');
  resetItem(cmcs, 'cmc-');
  resetItem(types, 'type-');
  resetItem(rarities, 'rare-');
  
  localStorage.removeItem('colors');

  lastSlice = 0;
  changedColors = false;
  changedCMC = false;
  changedRarity = false;
  changedType = false;
  const cardsContainer = document.getElementById('cards-filter-row');
  cardsContainer.innerHTML = '';
  notFoundText.hidden = true;

 document.getElementById('search').value = null;

}

let lastSearch = '';

const setFilters = async (setInHtml = false) => {
  hideFilter();
  const cardsContainer = document.getElementById('cards-filter-row');
  let cards = JSON.parse(localStorage.getItem('cards'));

  notFoundText.hidden = true;

  if(changedColors) {
    cardsContainer.innerHTML = '';
    changedColors = false;
    lastSlice = 0;
  }

  if(changedCMC) {
    cardsContainer.innerHTML = '';
    changedCMC = false;
    lastSlice = 0;
  }

  if(changedOrder) {
    cardsContainer.innerHTML = '';
    changedOrder = false;
    lastSlice = 0;
  }

  if(changedRarity) {
    cardsContainer.innerHTML = '';
    changedRarity = false;
    lastSlice = 0;
  }
  if(changedType) {
    cardsContainer.innerHTML = '';
    changedType = false;
    lastSlice = 0;
  }

  if(checkIfHasSelected(colors, '')) {
    cards = cardsFilterRow(cards);

  }
  if(checkIfHasSelected(cmcs, 'cmc-')) {
    cards = cmcFilterRow(cards);
  }
  if(checkIfHasSelected(rarities, 'rare-')) {
    cards = rarityFilterRow(cards);
  }
  if(checkIfHasSelected(types, 'type-')) {
    cards = typesFilterRow(cards);
  }
  cards = orderCards(cards);


  const search = document.getElementById('search')?.value;
  if(search) {
    if(search !== lastSearch) {
      cardsContainer.innerHTML = '';
      lastSearch = search;
      lastSlice = 0;
    }

    cards = cards.filter(card => card.name.toLowerCase().includes(search.toLowerCase()) || card['Nome Portugues'].toLowerCase().includes(search.toLowerCase()));
  }

  if(cards.length <= 0) notFoundText.hidden = false;

  if(setInHtml) {
    createDomCards(cards);
  }

  return cards;
}

const cardsFilterRow = (cards) => {
  
  const red = document.getElementById('red').checked;
  const blue = document.getElementById('blue').checked;
  const black = document.getElementById('black').checked;
  const white = document.getElementById('white').checked;
  const green = document.getElementById('green').checked;
  const foil = document.getElementById('foil').checked;
  const colorless = document.getElementById('colorless').checked;
 
  const colors = {
    red,
    blue,
    black,
    white,
    green,
    colorless
  }

  const colorsReference = getColorsReference(colors);
  if(!foil && colorsReference.length <= 0) {
    return cards;
  }

  
  return cards.filter(card => {
    if(foil && colorsReference.length <= 0) {
      return Boolean(card['FOIL?']);
    } else if(foil && colorsReference.length > 0) {
      return Boolean(card['FOIL?']) && getCardsWithSameColors(colorsReference, card)
    }
    return getCardsWithSameColors(colorsReference, card);
  });
  
}

const getCardsWithSameColors = (colors, card) => {
  const cardColors = card.category;
  const cardColorsLength = cardColors.length;
  const colorsLength = colors.length;
  if(cardColorsLength === colorsLength) {
    return cardColors.every(color => colors.includes(color));
  }
  if(cardColorsLength > colorsLength) {
    return false;
  }
  if(cardColors.length === 1) {
    return colors.includes(cardColors[0]);
  }
}

const checkIfCardHasCMC = (card) => {
  return !card.category.includes('T') && !card.category.includes('L') && !card.category.includes('X');
}

const cmcFilterRow = (cards) => {
  
  const cmc01 = document.getElementById('cmc-01').checked;
  const cmc2 = document.getElementById('cmc-2').checked;
  const cmc3 = document.getElementById('cmc-3').checked;
  const cmc4 = document.getElementById('cmc-4').checked;
  const cmc5 = document.getElementById('cmc-5').checked;
  const cmc6 = document.getElementById('cmc-6').checked;

  const cmcs = {
    cmc01,
    cmc2,
    cmc3,
    cmc4,
    cmc5,
    cmc6,
  }

  if(Object.values(cmcs).every(type => !type)) {
    return cards;
  }

  const cmcFilter = {
    'cmc01': (card) => parseInt(card['Custo']) == 0 || parseInt(card['Custo']) == 1,
    'cmc2': (card) => parseInt(card['Custo']) == 2,
    'cmc3': (card) => parseInt(card['Custo']) == 3,
    'cmc4': (card) => parseInt(card['Custo']) == 4,
    'cmc5': (card) => parseInt(card['Custo']) == 5,
    'cmc6': (card) => parseInt(card['Custo']) >= 6,
  }


  return cards.filter(card => {
    for (const [key, value] of Object.entries(cmcs)) {
      if(value && cmcFilter[key](card) && checkIfCardHasCMC(card)) {
        return card;
      }
    }
  });
  
}

const rarityFilterRow = (cards) => {
  
  const comum = document.getElementById('rare-C').checked;
  const incomum = document.getElementById('rare-I').checked;
  const rara = document.getElementById('rare-R').checked;
  const miticorara = document.getElementById('rare-M').checked;
  const especial = document.getElementById('rare-E').checked;
  
  const raritiesCheck = {
    comum,
    incomum,
    rara,
    miticorara,
    especial
  }

  if(Object.values(raritiesCheck).every(type => !type)) {
    return cards;
  }

  const raritiesFilter = {
    'comum': (card) => card['Raridade'] === 'C',
    'incomum': (card) => card['Raridade'] === 'I',
    'rara': (card) => card['Raridade'] === 'R',
    'miticorara': (card) => card['Raridade'] === 'M',
    'especial': (card) => card['Raridade'] === 'E',
  }


  return cards.filter(card => {
    for (const [key, value] of Object.entries(raritiesCheck)) {
      if(value && raritiesFilter[key](card)) {
        return card;
      }
    }
  });
  
}

const typesFilterRow = (cards) => {
  
  const feitico = document.getElementById('type-F').checked;
  const criatura = document.getElementById('type-C').checked;
  const instantanea = document.getElementById('type-I').checked;
  const artefato = document.getElementById('type-A').checked;
  const tokens = document.getElementById('type-T').checked;
  const encantamentos = document.getElementById('type-E').checked;
  const planeswalker = document.getElementById('type-P').checked;
  const lands = document.getElementById('type-L').checked;
  
  const typesCheck = {
    feitico,
    criatura,
    instantanea,
    artefato,
    tokens,
    encantamentos,
    planeswalker,
    lands
  }

  if(Object.values(typesCheck).every(type => !type)) {
    return cards;
  }

  const typesFilter = {
    feitico: (card) => card['Tipo'] === 'F',
    criatura: (card) => card['Tipo'] === 'C',
    instantanea: (card) => card['Tipo'] === 'I',
    artefato: (card) => card['Tipo'] === 'A',
    tokens: (card) => card['Tipo'] === 'T',
    lands: (card) => card['Tipo'] === 'L',
    encantamentos: (card) => card['Tipo'] === 'E',
    planeswalker: (card) => card['Tipo'] === 'P'
  }

  return cards.filter(card => {
    for (const [key, value] of Object.entries(typesCheck)) {
      if(value && typesFilter[key](card)) {
        return card;
      }
    }
  });
  
}

let changedOrder = false;
const handleChangedOrder = () => changedOrder = true;

const orderCards = (cards) => {
  const orderElement = document.getElementById('order-select');
  if(!orderElement || !orderElement.value) return cards.sort((a, b) => b['category'].length - a['category'].length);
  const order = orderElement.value.split('-')[1];
  const field = orderElement.value.split('-')[0];
  return setOrder(order, field, cards);

}

const setOrder = (order, field, cards) => {

  if(field === 'name') {
    if(order === 'asc') {
      return cards.sort((a, b) => {
        return a.name.localeCompare(b.name)
      });
    }
    return cards.sort((a, b) => {
      return b.name.localeCompare(a.name)
    });
  }

  if(order === 'desc') {
    return cards.sort((a, b) => b[field] - a[field]);
  }

  return cards.sort((a, b) => a[field] - b[field]);
}

const getRACards = () => {
  const cards = JSON.parse(localStorage.getItem('cards'));
  let ra = cards.filter(card => card['RAD'] === 'RA');
  //ra = [];
  if(ra.length > 0) return ra;

  document.getElementById('not-found-cards-href').style.display = 'block';


}

const getColorsReference = (colors) => {
  const reference = [];
  const colorsReference = {
    red: 'R',
    blue: 'U',
    black: 'B',
    white: 'W',
    green: 'G',
    colorless: 'C'
  }

  for (const [key, value] of Object.entries(colors)) {
    
    if(value) {
      reference.push(colorsReference[key]);
    }
  }
  return reference;

}



const checkIfHasSelected = (array, key = '') => {

  let hasChecked = false;

  array.forEach(item => {
    const element = document.getElementById(key + item.id);
    if(element?.checked) {
      hasChecked = true;
    }
  });
  return hasChecked;
}

if(currentPath.includes('filtrar')) {
  createFilter();
  createCMCFilter();
  createRaritiesFilter();
  createTypeFilter();
}

if(currentPath.includes('test') || currentPath.includes('index') || !currentPath) {
  createDomCards(getRACards(), 'cardss', true);
}