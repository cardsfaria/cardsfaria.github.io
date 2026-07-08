
// Normaliza texto para busca: minúsculo, sem espaços nas pontas e sem
// acento/cedilha (ex.: "  Condená  " -> "condena"). Usado na busca do estoque.
const normalizeSearch = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const notFoundText = document.getElementById('not-found-cards');
notFoundText.hidden = true;

const showFilterButton = document.getElementById('show-filter-button');
const filters = document.getElementById('filters');

let isFilterOpen = false;

// Abre/fecha o painel. No desktop é um grid que aparece/some; no mobile é uma
// gaveta (bottom sheet) que desliza com backdrop.
const setFiltersOpen = (open) => {
  isFilterOpen = open;
  if (filters) filters.classList.toggle('is-open', open);
  const backdrop = document.getElementById('filter-backdrop');
  if (backdrop) backdrop.classList.toggle('is-open', open);
  document.body.classList.toggle('filters-locked', open && window.innerWidth < 768);
  toggleButtonText();
  if (showFilterButton) showFilterButton.onclick = open ? hideFilter : showFilter;
};

const showFilter = () => setFiltersOpen(true);
const hideFilter = () => setFiltersOpen(false);

const toggleButtonText = () => {
  const span = document.getElementById('filter-toggle-text');
  if (span) span.innerText = isFilterOpen ? 'Esconder' : 'Filtros';
}


let changedColors = false;
let changedCMC = false;
let changedRarity = false;
let changedType = false;
const handleChangedColors = () => changedColors = true;
const handleChangedCMC = () => changedCMC = true;
const handleChangedRarity = () => changedRarity = true;
const handleChangedType = () => changedType = true;

const colors = [{id: 'red', name: 'Vermelho'}, { id: 'blue', name: 'Azul'}, { id: 'black', name: 'Preto'}, { id: 'white', name: 'Branco'}, { id: 'green', name: 'Verde'}, { id: 'colorless', name: 'Incolor'}];

const getFiltersTemplate = (color) =>`
  <input class="btn-check" onchange="handleChangedColors()" type="checkbox" id="${color.id}" autocomplete="off" />
  <label class="btn filter-chip" for="${color.id}"><span class="mana-dot mana-${color.id}"></span>${color.name}</label>
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
  <input class="btn-check" onchange="handleChangedCMC()" type="checkbox" id="cmc-${cmc.id}" autocomplete="off" />
  <label class="btn filter-chip" for="cmc-${cmc.id}">${cmc.name}</label>
  `

  const rarities = [
    {id: 'comum', name: 'Comum'},
    {id: 'incomum', name: 'Incomum'},
    {id: 'rara', name: 'Rara'},
    {id: 'mitica', name: 'Mítica'},
    {id: 'especial', name: 'Especial'},
  ]

  const getFiltersRarityTemplate = (rarity) =>`
  <input class="btn-check" onchange="handleChangedRarity()" type="checkbox" id="rare-${rarity.id}" autocomplete="off" />
  <label class="btn filter-chip" for="rare-${rarity.id}">${rarity.name}</label>
  `

  // Tipo é montado dinamicamente a partir dos tipos presentes na base.
  let types = [];

  const getFiltersTypesTemplate = (type) =>`
  <input class="btn-check" onchange="handleChangedType()" type="checkbox" id="type-${type.id}" autocomplete="off" />
  <label class="btn filter-chip" for="type-${type.id}">${type.name}</label>
  `

  // ===== Filtros das colunas novas (base NOVA) =====
  // Idioma é montado dinamicamente a partir dos idiomas que existem na base
  // (novas línguas aparecem sozinhas, com bandeirinha).
  let idiomas = [];
  const IDIOMA_NAMES = {
    EN: 'Inglês', PT: 'Português', ES: 'Espanhol', SP: 'Espanhol',
    JP: 'Japonês', JA: 'Japonês', FR: 'Francês', DE: 'Alemão',
    IT: 'Italiano', RU: 'Russo', KR: 'Coreano', KO: 'Coreano',
    CN: 'Chinês', ZH: 'Chinês', CH: 'Chinês',
  };
  const IDIOMA_FLAGS = {
    EN: '🇺🇸', PT: '🇧🇷', BR: '🇧🇷', ES: '🇪🇸', SP: '🇪🇸',
    JP: '🇯🇵', JA: '🇯🇵', FR: '🇫🇷', DE: '🇩🇪', IT: '🇮🇹',
    RU: '🇷🇺', KR: '🇰🇷', KO: '🇰🇷', CN: '🇨🇳', ZH: '🇨🇳', CH: '🇨🇳',
  };

  const condicoes = [
    { id: 'NM', name: 'NM' },
    { id: 'SP', name: 'SP' },
    { id: 'MP', name: 'MP' },
    { id: 'HP', name: 'HP' },
    { id: 'DMG', name: 'DMG' },
  ];

  // Formato é montado dinamicamente a partir dos formatos presentes na base
  // (Pauper, Premodern, etc. entram sozinhos).
  let formatos = [];

  // Converte token de formato (letra da API antiga OU nome) para o nome por extenso.
  const FORMATO_MAP = {
    s: 'Standard', standard: 'Standard',
    p: 'Pioneer', pioneer: 'Pioneer',
    m: 'Modern', modern: 'Modern',
    l: 'Legacy', legacy: 'Legacy',
    v: 'Vintage', vintage: 'Vintage',
    c: 'Commander', commander: 'Commander',
    pa: 'Pauper', pauper: 'Pauper',
    pre: 'Premodern', premodern: 'Premodern', 't2': 'Standard',
  };
  const canonFormato = (token) => {
    const k = normalizeSearch(token);
    if (!k) return '';
    return FORMATO_MAP[k] || token.trim();
  };

  // Acabamento é montado dinamicamente a partir dos valores da base
  // (FOIL, Borderless, Promo-Foil, Arte Extendida, etc.).
  let foils = [];
  const getAcab = (card) => (card.acabamento || card['FOIL?'] || '').trim();
  const titleCaseAcab = (v) =>
    v
      .split(/(\s|-)/)
      .map((w) =>
        /^[a-zà-úA-ZÀ-Ú]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w
      )
      .join('');

  // Filtros de checkbox novos disparam uma limpeza genérica do container.
  let changedNew = false;
  const handleChangedNew = () => (changedNew = true);

  const getGenericCheckboxTemplate = (item, prefix) => `
  <input class="btn-check" onchange="handleChangedNew()" type="checkbox" id="${prefix}${item.id}" autocomplete="off" />
  <label class="btn filter-chip" for="${prefix}${item.id}">${item.name}</label>
  `;

  const createIdiomaFilter = () => {
    const el = document.getElementById('idioma-filters');
    if (!el) return;
    const cards = JSON.parse(localStorage.getItem('cards')) || [];
    const codes = [
      ...new Set(
        cards.map((c) => (c.idioma || '').toUpperCase().trim()).filter(Boolean)
      ),
    ].sort();
    idiomas = codes.map((code) => ({
      id: code,
      name: (IDIOMA_FLAGS[code] ? IDIOMA_FLAGS[code] + ' ' : '') + (IDIOMA_NAMES[code] || code),
    }));
    el.innerHTML = '';
    idiomas.forEach((i) => (el.innerHTML += getGenericCheckboxTemplate(i, 'idioma-')));
  };

  const createCondicaoFilter = () => {
    const el = document.getElementById('condicao-filters');
    if (!el) return;
    condicoes.forEach((c) => (el.innerHTML += getGenericCheckboxTemplate(c, 'cond-')));
  };

  const createFormatoFilter = () => {
    const el = document.getElementById('formato-filters');
    if (!el) return;
    const cards = JSON.parse(localStorage.getItem('cards')) || [];
    // converte cada token pro nome por extenso (aceita letra da API antiga)
    const tokens = [
      ...new Set(
        cards.flatMap((c) => (c.formato || '').split('-').map(canonFormato)).filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
    formatos = tokens.map((t) => ({ id: normalizeSearch(t), name: t }));
    el.innerHTML = '';
    formatos.forEach((f) => (el.innerHTML += getGenericCheckboxTemplate(f, 'fmt-')));
  };

  const createFoilFilter = () => {
    const el = document.getElementById('foil-filters');
    if (!el) return;
    const cards = JSON.parse(localStorage.getItem('cards')) || [];
    const seen = new Map(); // normalizado -> nome de exibição
    cards.forEach((c) => {
      const v = getAcab(c);
      if (!v) return;
      const key = normalizeSearch(v);
      if (!seen.has(key)) seen.set(key, titleCaseAcab(v));
    });
    foils = [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    el.innerHTML = '';
    foils.forEach((f) => (el.innerHTML += getGenericCheckboxTemplate(f, 'foil-')));
  };

  // Coleção, Subtipo e Artista têm muitos valores -> viram combobox com busca.
  let tomColecao = null;
  let tomSubtipo = null;
  let tomArtista = null;

  // Combobox multi-seleção com busca (Tom Select). Cai de pé se a lib não carregar.
  const initTomSelect = (selectId, placeholder) => {
    const el = document.getElementById(selectId);
    if (!el || typeof TomSelect === 'undefined') return null;
    return new TomSelect(el, {
      plugins: ['remove_button'],
      maxItems: null,
      placeholder,
      hideSelected: true,
      closeAfterSelect: false,
    });
  };

  const populateSelect = (selectId, values) => {
    const select = document.getElementById(selectId);
    if (!select) return;
    values
      .filter((v) => v && v !== '-')
      .sort((a, b) => a.localeCompare(b))
      .forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
      });
  };

  const createColecaoFilter = () => {
    const cards = JSON.parse(localStorage.getItem('cards')) || [];
    const distinct = [...new Set(cards.map((c) => c.colecao))];
    populateSelect('colecao-select', distinct);
    tomColecao = initTomSelect('colecao-select', 'Todas as coleções…');
  };

  const createSubtipoFilter = () => {
    const cards = JSON.parse(localStorage.getItem('cards')) || [];
    // Subtipo pode ser composto ("Cobra-Ninja-Ladino") -> lista os subtipos individuais.
    const distinct = [
      ...new Set(
        cards.flatMap((c) => (c.subtipo || '').split('-').map((s) => s.trim()))
      ),
    ];
    populateSelect('subtipo-select', distinct);
    tomSubtipo = initTomSelect('subtipo-select', 'Todos os subtipos…');
  };

  const createArtistaFilter = () => {
    const cards = JSON.parse(localStorage.getItem('cards')) || [];
    const distinct = [...new Set(cards.map((c) => c.artista))];
    populateSelect('artista-select', distinct);
    tomArtista = initTomSelect('artista-select', 'Todos os artistas…');
  };

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
  if (!typeFilters) return;
  const cards = JSON.parse(localStorage.getItem('cards')) || [];
  const tokens = [
    ...new Set(
      cards.flatMap((c) => (c.Tipo || '').split('-').map((t) => t.trim())).filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
  types = tokens.map((t) => ({ id: normalizeSearch(t), name: t }));
  typeFilters.innerHTML = '';
  types.forEach((type) => (typeFilters.innerHTML += getFiltersTypesTemplate(type)));
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
  resetItem(idiomas, 'idioma-');
  resetItem(condicoes, 'cond-');
  resetItem(formatos, 'fmt-');
  resetItem(foils, 'foil-');

  if (tomColecao) tomColecao.clear();
  if (tomSubtipo) tomSubtipo.clear();
  if (tomArtista) tomArtista.clear();

  localStorage.removeItem('colors');

  lastSlice = 0;
  changedColors = false;
  changedCMC = false;
  changedRarity = false;
  changedType = false;
  changedNew = false;
  notFoundText.hidden = true;

  const searchInput = document.getElementById('search');
  if (searchInput) searchInput.value = '';
  lastSearch = '';

  if (typeof liveApply === 'function') liveApply();
}

let lastSearch = '';

const setFilters = async (setInHtml = false) => {
  // Não esconde mais o painel aqui: a filtragem é ao vivo e o painel fica aberto.
  const cardsContainer = document.getElementById('cards-filter-row');
  let cards = JSON.parse(localStorage.getItem('cards'));

  notFoundText.hidden = true;

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
  if(checkIfHasSelected(idiomas, 'idioma-')) {
    cards = idiomaFilterRow(cards);
  }
  if(checkIfHasSelected(condicoes, 'cond-')) {
    cards = condicaoFilterRow(cards);
  }
  if(checkIfHasSelected(formatos, 'fmt-')) {
    cards = formatoFilterRow(cards);
  }
  if(checkIfHasSelected(foils, 'foil-')) {
    cards = foilFilterRow(cards);
  }
  cards = colecaoFilterRow(cards);
  cards = subtipoFilterRow(cards);
  cards = artistaFilterRow(cards);
  cards = orderCards(cards);


  const search = normalizeSearch(document.getElementById('search')?.value);
  if(search) {
    if(search !== lastSearch) {
      cardsContainer.innerHTML = '';
      lastSearch = search;
      lastSlice = 0;
    }

    cards = cards.filter(card =>
      normalizeSearch(card.name).includes(search) ||
      normalizeSearch(card['Nome Portugues']).includes(search)
    );
  }

  if(cards.length <= 0) notFoundText.hidden = false;

  if(setInHtml) {
    createDomCards(cards);
  }

  return cards;
}

const cardsFilterRow = (cards) => {
  const selected = {
    red: document.getElementById('red')?.checked,
    blue: document.getElementById('blue')?.checked,
    black: document.getElementById('black')?.checked,
    white: document.getElementById('white')?.checked,
    green: document.getElementById('green')?.checked,
    colorless: document.getElementById('colorless')?.checked,
  };

  const colorsReference = getColorsReference(selected);
  if (colorsReference.length <= 0) {
    return cards;
  }

  return cards.filter((card) => getCardsWithSameColors(colorsReference, card));
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

// Raridade agora vem por extenso (Rara, Especial...). Match sem acento.
const rarityFilterRow = (cards) => {
  const selected = rarities
    .filter((r) => document.getElementById('rare-' + r.id)?.checked)
    .map((r) => normalizeSearch(r.name));
  if (selected.length <= 0) return cards;
  return cards.filter((card) => selected.includes(normalizeSearch(card.Raridade)));
}

// Tipo vem por extenso e pode ser composto ("Lendário-Artefato"). Match por token.
const typesFilterRow = (cards) => {
  const selected = types
    .filter((t) => document.getElementById('type-' + t.id)?.checked)
    .map((t) => normalizeSearch(t.name));
  if (selected.length <= 0) return cards;
  return cards.filter((card) => {
    const tokens = (card.Tipo || '').split('-').map((t) => normalizeSearch(t));
    return selected.some((s) => tokens.includes(s));
  });
}

// Foil / Promo (coluna Foil-Promo).
const foilFilterRow = (cards) => {
  const selected = foils
    .filter((f) => document.getElementById('foil-' + f.id)?.checked)
    .map((f) => f.id); // ids são o acabamento normalizado
  if (selected.length <= 0) return cards;
  return cards.filter((card) => selected.includes(normalizeSearch(getAcab(card))));
}

const artistaFilterRow = (cards) => {
  const values = getSelectValues('artista-select');
  if (values.length <= 0) return cards;
  return cards.filter((card) => values.includes(card.artista));
}

// ===== Lógica dos filtros novos (base NOVA) =====
const getCheckedIds = (array, prefix) =>
  array
    .filter((item) => document.getElementById(prefix + item.id)?.checked)
    .map((item) => item.id);

const idiomaFilterRow = (cards) => {
  const selected = getCheckedIds(idiomas, 'idioma-');
  if (selected.length <= 0) return cards;
  return cards.filter((card) => selected.includes((card.idioma || '').toUpperCase()));
};

const condicaoFilterRow = (cards) => {
  const selected = getCheckedIds(condicoes, 'cond-');
  if (selected.length <= 0) return cards;
  return cards.filter((card) => selected.includes((card.condicao || '').toUpperCase()));
};

const formatoFilterRow = (cards) => {
  const selected = formatos
    .filter((f) => document.getElementById('fmt-' + f.id)?.checked)
    .map((f) => normalizeSearch(f.name));
  if (selected.length <= 0) return cards;
  return cards.filter((card) => {
    const toks = (card.formato || '').split('-').map((t) => normalizeSearch(canonFormato(t)));
    return selected.some((s) => toks.includes(s));
  });
};

// Valores selecionados de um <select multiple> (Tom Select mantém o select em sincronia).
const getSelectValues = (id) => {
  const el = document.getElementById(id);
  if (!el) return [];
  return [...el.selectedOptions].map((o) => o.value).filter(Boolean);
};

const colecaoFilterRow = (cards) => {
  const values = getSelectValues('colecao-select');
  if (values.length <= 0) return cards;
  return cards.filter((card) => values.includes(card.colecao));
};

const subtipoFilterRow = (cards) => {
  const values = getSelectValues('subtipo-select');
  if (values.length <= 0) return cards;
  return cards.filter((card) => {
    const parts = (card.subtipo || '').split('-').map((s) => s.trim());
    return values.some((v) => parts.includes(v));
  });
};

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

// Home "Adicionadas Recentemente": a base NOVA não tem mais a coluna RAD/RA,
// então mostramos as últimas N cartas da aba (as adicionadas por último).
const RECENT_COUNT = 20;
const getRecentCards = () => {
  const cards = JSON.parse(localStorage.getItem('cards')) || [];
  if (cards.length <= 0) {
    const href = document.getElementById('not-found-cards-href');
    if (href) href.style.display = 'block';
    return [];
  }
  return cards.slice(-RECENT_COUNT).reverse();
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

// ---- UX ao vivo: contador de resultados, filtros ativos e auto-aplicar ----
const updateResultCount = (n) => {
  const label = `${n === 1 ? 'carta' : 'cartas'}`;
  const el = document.getElementById('result-count');
  if (el) el.innerHTML = `<b>${n}</b> ${label}`;
  const apply = document.getElementById('apply-count');
  if (apply) apply.textContent = `${n} ${label}`;
};

const deselectValue = (id, val) => {
  const ts =
    id === 'colecao-select' ? tomColecao :
    id === 'subtipo-select' ? tomSubtipo :
    id === 'artista-select' ? tomArtista : null;
  if (ts) {
    ts.removeItem(val);
    return;
  }
  const el = document.getElementById(id);
  if (el) [...el.options].forEach((o) => { if (o.value === val) o.selected = false; });
};

const renderActiveFilters = () => {
  const box = document.getElementById('active-filters');
  if (!box) return;

  const tags = [];
  const pushChecked = (arr, prefix, labelFn) =>
    arr.forEach((i) => {
      const el = document.getElementById(prefix + i.id);
      if (el && el.checked) tags.push({ label: labelFn(i), clear: () => (el.checked = false) });
    });

  pushChecked(colors, '', (c) => c.name);
  pushChecked(cmcs, 'cmc-', (c) => 'Custo ' + c.name);
  pushChecked(rarities, 'rare-', (r) => r.name);
  pushChecked(types, 'type-', (t) => t.name);
  pushChecked(idiomas, 'idioma-', (i) => i.name);
  pushChecked(condicoes, 'cond-', (c) => c.name);
  pushChecked(formatos, 'fmt-', (f) => f.name);
  pushChecked(foils, 'foil-', (f) => f.name);
  getSelectValues('colecao-select').forEach((v) =>
    tags.push({ label: v, clear: () => deselectValue('colecao-select', v) })
  );
  getSelectValues('subtipo-select').forEach((v) =>
    tags.push({ label: v, clear: () => deselectValue('subtipo-select', v) })
  );
  getSelectValues('artista-select').forEach((v) =>
    tags.push({ label: v, clear: () => deselectValue('artista-select', v) })
  );

  // Filtro aplicado: troca as cores entre "Filtros" (fica dourado) e "Filtrar"
  // (fica neutro) na toolbar, pra sinalizar que há filtro ativo.
  const searchVal = (document.getElementById('search')?.value || '').trim();
  const hasActive = tags.length > 0 || searchVal.length > 0;
  document.querySelectorAll('.filter-toggle, .filter-apply-top').forEach((b) => {
    if (b) b.classList.toggle('is-active', hasActive);
  });

  box.innerHTML = '';
  if (tags.length <= 0) {
    box.style.display = 'none';
    return;
  }
  box.style.display = 'flex';
  tags.forEach((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'active-tag';
    btn.innerHTML = `${t.label} <i class="fa-solid fa-xmark"></i>`;
    btn.addEventListener('click', () => {
      t.clear();
      liveApply();
    });
    box.appendChild(btn);
  });
};

// Coalesce vários eventos de mudança num único re-render.
let liveApplyPending = false;
const liveApply = () => {
  if (liveApplyPending) return;
  liveApplyPending = true;
  setTimeout(() => {
    liveApplyPending = false;
    const container = document.getElementById('cards-filter-row');
    if (container) container.innerHTML = '';
    lastSlice = 0;
    Promise.resolve(setFilters(true)).then((cards) => {
      updateResultCount((cards || []).length);
      renderActiveFilters();
    });
  }, 0);
};

// Aplica os filtros (renderiza) e recolhe o painel. Usado pelo botão "Filtrar"
// (desktop) e "Ver resultados" (gaveta mobile).
const aplicarFiltros = () => {
  liveApply();
  hideFilter();
};

const wireLiveFiltering = () => {
  // As facetas (chips/comboboxes) NÃO filtram ao selecionar — só ao clicar em
  // "Filtrar". Busca e ordenação continuam ao vivo.
  const orderEl = document.getElementById('order-select');
  if (orderEl) orderEl.addEventListener('change', liveApply);
  const searchEl = document.getElementById('search');
  if (searchEl) {
    let deb;
    searchEl.addEventListener('input', () => {
      clearTimeout(deb);
      deb = setTimeout(liveApply, 300);
    });
  }
};

if(currentPath.includes('recentes')) {
  // Página "Adicionadas Recentemente".
  createDomCards(getRecentCards(), 'cardss', true);
} else if(currentPath.includes('filtrar') || currentPath.includes('index') || !currentPath) {
  // Home (/) e /filtrar são a página de filtros/estoque.
  createFilter();
  createCMCFilter();
  createRaritiesFilter();
  createTypeFilter();
  createIdiomaFilter();
  createCondicaoFilter();
  createFormatoFilter();
  createFoilFilter();
  createColecaoFilter();
  createSubtipoFilter();
  createArtistaFilter();

  wireLiveFiltering();

  // Só abre sozinho no desktop largo. Celular/tablet começam fechados.
  setFiltersOpen(window.innerWidth >= 992);

  liveApply();
}