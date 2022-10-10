const currentPath = window.location.href.split('/')[3];

const notFoundText = document.getElementById('not-found-cards');
notFoundText.hidden = true;

document.getElementById('filter-nav').href = `${'http://' + window.location.host + "/filtrar"}`
document.getElementById('home-nav').href = `${'http://' + window.location.host + "/"}`

//Get the button
let mybutton = document.getElementById("btn-back-to-top");

function scrollFunction() {
  if(!mybutton) return;

  if (
    document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20
  ) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

if(mybutton) {
  mybutton.addEventListener("click", backToTop);
}

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

function backToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

const getCards = () => {

  return fetch("//magicshowcase.apphb.com/home/proxy?address=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1T7MpDLrNndOFKDnzEZvG0tFDsphZx6BW7Qg-o4xmr_o%2Fpub%3Fgid%3D0%26single%3Dtrue%26output%3Dtsv");
};

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const getCardTemplate = (card) =>  `
<div class="col-md-4 col-sm-6 col-xs-12">
  <div class="card">
  <div class="card-info">
    <span>${card.name}</span>
  </div>

  <div class="card-image-wrapper shadow">
    <div class="card-image w-100">
      <img
        src="${card?.image ? card?.image : 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + card.id + '&type=card'}"
      />
    </div>
    
  </div>

  <div class="card-info card-price">
    <span>${formatter.format(card.price || 0)}</span>
  </div>
  <div class="card-info card-qty">
    <span>Qtde: ${card.qty}x</span>
  </div>
  <span class="text-danger text-center card-info2">${card.additionalInfo || '-'}</span>
  </div>
  </div>
</div>
   


`

const separeteCards = async (category = null) => {
  const cards = [];

  const loading = document.getElementById('loading');

  loading.hidden = false;

  const response = await getCards();
 
    if (response.ok) {
      const data = await response.text()
        let allCardsData = data.split('\n');
        let columns = allCardsData[0].split('\t');

        for (let i = 1; i < allCardsData.length; i++) {
            let cardData = allCardsData[i].split('\t');

            let card = {};

            if (cardData[0]) {
                for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                    card[columns[columnIndex].trim()] = cardData[columnIndex].trim();
                }

                card.category = card.category.split('-').map(category => category.trim());
               
                if(!card.category.includes('F') && !card.category.includes('RA')) {
                  card.price = parseFloat(card.price);
                  if(card['C']) {
                    card['C'] = parseInt(card['C']);
                  } else {
                    card['C'] = 24;
                  }

                  cards.push(card);
                }
            }
        }
    }
  localStorage.setItem('cards', JSON.stringify(cards));
  localStorage.setItem('lastModified', new Date());
  loading.hidden = true;

  return cards;
}

let lastSlice = 0;
let changedColors = false;
let changedCMC = false;
let changedRarity = false;
let changedType = false;
const handleChangedColors = () => changedColors = true;
const handleChangedCMC = () => changedCMC = true;
const handleChangedRarity = () => changedRarity = true;
const handleChangedType = () => changedType = true;

const colors = [{id: 'red', name: 'Vermelho'}, { id: 'blue', name: 'Azul'}, { id: 'black', name: 'Preto'}, { id: 'white', name: 'Branco'}, { id: 'green', name: 'Verde'}, { id: 'golden', name: 'Dourado'}, { id: 'lands', name: 'Terrenos'}, { id: 'tokens', name: 'Tokens'}, { id: 'foil', name: 'Foil'}, { id: 'colorless', name: 'Colorless'}];

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
    {id: 'U', name: 'Incomum'},
    {id: 'R', name: 'Rara'},
    {id: 'M', name: 'Mitico-Rara'},
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

const setFilters = async (setInHtml = false) => {
  const cardsContainer = document.getElementById('cards-filter-row');

  if(!checkIfHasSelected(cmcs, 'cmc-') && !checkIfHasSelected(colors, '') && !checkIfHasSelected(rarities, 'rare-') && !checkIfHasSelected(types, 'type-')) {
    lastSlice = 0;
    notFoundText.hidden = false;
    cardsContainer.innerHTML = '';
    return;
  }

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
  
  let cards = JSON.parse(localStorage.getItem('cards'));

  cards = cardsFilterRow(cards);
  cards = cmcFilterRow(cards);
  cards = rarityFilterRow(cards);
  cards = typesFilterRow(cards);
  cards = orderCards(cards);

  if(setInHtml) {
    createDomCards(cards);
  }

  if(cards.length <= 0) notFoundText.hidden = false;

  return cards;
}

const cardsFilterRow = (cards) => {
  
  const red = document.getElementById('red').checked;
  const blue = document.getElementById('blue').checked;
  const black = document.getElementById('black').checked;
  const white = document.getElementById('white').checked;
  const green = document.getElementById('green').checked;
  const golden = document.getElementById('golden').checked;
  const lands = document.getElementById('lands').checked;
  const tokens = document.getElementById('tokens').checked;
  const foil = document.getElementById('foil').checked;
  const colorless = document.getElementById('colorless').checked;
 
  const colors = {
    red,
    blue,
    black,
    white,
    green,
    golden,
    lands,
    tokens,
    colorless
  }

  const colorsReference = getColorsReference(colors);
  if(colorsReference.length <= 0) {
    return cards;
  }

  
  return cards.filter(card => {
    if(foil) {
      return card['FOIL?'] && card.category.some(category => colorsReference.includes(category))
    }
    return card.category.some(category => colorsReference.includes(category));
  });
  
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
    'cmc01': (card) => parseInt(card['C']) == 0 || parseInt(card['C']) == 1,
    'cmc2': (card) => parseInt(card['C']) == 2,
    'cmc3': (card) => parseInt(card['C']) == 3,
    'cmc4': (card) => parseInt(card['C']) == 4,
    'cmc5': (card) => parseInt(card['C']) == 5,
    'cmc6': (card) => parseInt(card['C']) >= 6,
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
  const incomum = document.getElementById('rare-U').checked;
  const rara = document.getElementById('rare-R').checked;
  const miticorara = document.getElementById('rare-M').checked;
  
  const raritiesCheck = {
    comum,
    incomum,
    rara,
    miticorara,
  }

  if(Object.values(raritiesCheck).every(type => !type)) {
    return cards;
  }

  const raritiesFilter = {
    'comum': (card) => card['Raridade'] === 'C',
    'incomum': (card) => card['Raridade'] === 'U',
    'rara': (card) => card['Raridade'] === 'R',
    'miticorara': (card) => card['Raridade'] === 'M',
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
  
  const typesCheck = {
    feitico,
    criatura,
    instantanea,
    artefato,
    tokens,
    encantamentos,
    planeswalker
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
  if(!orderElement || !orderElement.value) return cards;
  const order = orderElement.value.split('-')[1];
  const field = orderElement.value.split('-')[0];
  return setOrder(order, field, cards);

}

const setOrder = (order, field, cards) => {

  if(field === 'name') {
    if(order === 'asc') {
      return cards.sort((a, b) => {
        let tA = a[field].toUpperCase();
        let tB = b[field].toUpperCase();
        if (tA < tB) {
          return -1;
        }
        if (tA > tB) {
          return 1;
        }
        return 0;
      });
    }
  
    return cards.sort((a, b) => {
      let tA = a[field].toUpperCase();
      let tB = b[field].toUpperCase();
      if (tA > tB) {
        return -1;
      }
      if (tA < tB) {
        return 1;
      }
      return 0;
    });
  }

  if(order === 'desc') {
    return cards.sort((a, b) => b[field] - a[field]);
  }

  return cards.sort((a, b) => a[field] - b[field]);
}

const getRACards = () => {
  const cards = JSON.parse(localStorage.getItem('cards'));
  return cards.filter(card => card['1598'] === 'RA').slice(0, 18);
}

const getColorsReference = (colors) => {
  const reference = [];
  const colorsReference = {
    red: 'R',
    blue: 'U',
    black: 'B',
    white: 'W',
    green: 'G',
    golden: 'D',
    lands: 'L',
    tokens: 'T',
    colorless: 'C'
  }

  for (const [key, value] of Object.entries(colors)) {
    
    if(value) {
      reference.push(colorsReference[key]);
    }
  }
  return reference;

}


window.onscroll = async function() {
  const search = document.getElementById('search')?.value;
  const cardsContainer = document.getElementById('cards-filter-row');

  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200 && !search && (checkIfHasSelected(cmcs, 'cmc-') || checkIfHasSelected(colors, '') || checkIfHasSelected(rarities, 'rare-') || checkIfHasSelected(types, 'type-')) && cardsContainer.innerHTML) {
    createDomCards(await setFilters(false), 'cards-filter-row');
  }
  scrollFunction();
};



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



const createDomCards = (cards, container = 'cards-filter-row', noPaginate = false) => {

  const cardsContainer = document.getElementById(container);

  const search = document.getElementById('search')?.value;
  if(search) {
    cardsContainer.innerHTML = '';
    const filterSearch = cards.filter(card => card.name.toLowerCase().includes(search.toLowerCase()));
    filterSearch.forEach(card => {
      cardsContainer.innerHTML += getCardTemplate(card);
    });
    return;
  }

  if(noPaginate) {
    cards.forEach(card => {
      cardsContainer.innerHTML += getCardTemplate(card);
    });
    const loading = document.getElementById('loading');
    if(loading) loading.hidden = true;
    return;
  }

  if(!cardsContainer) return;
  const cardsToRender = cards.slice(lastSlice, lastSlice + 9);
  lastSlice += 9;

  cardsToRender.forEach(card => {
    cardsContainer.innerHTML += getCardTemplate(card);
  });

  const loading = document.getElementById('loading');
  if(loading) loading.hidden = true;

}


(async () => {

  if(currentPath.includes('filtrar')) {
    createFilter();
    createCMCFilter();
    createRaritiesFilter();
    createTypeFilter();
    
  }
  const searchBtn = document.getElementById('search-btn');
  const resetBtn = document.getElementById('reset-btn');
  const loading = document.getElementById('loading');
  if(searchBtn && resetBtn) {
    searchBtn.disabled = true;
    resetBtn.disabled = true;
  }
  
  if(localStorage.getItem('cards') && localStorage.getItem('lastModified')) {
    const lastModified = new Date(localStorage.getItem('lastModified'));
    const lastModifiedPlusHour = new Date(lastModified.getTime() + 30*60000);
    localStorage.setItem('oneHourFromNow', lastModifiedPlusHour);
    const now = new Date();
    if(now >= lastModifiedPlusHour) {
      await separeteCards();
    } 
  } else {
    await separeteCards();
  }
  if(searchBtn && resetBtn) {
    searchBtn.disabled = false;
    resetBtn.disabled = false;
  }
 
  loading.hidden = true;
  if(currentPath.includes('test') || currentPath.includes('index') || !currentPath) {
    createDomCards(getRACards(), 'cardss', true);
  }
  
})();





