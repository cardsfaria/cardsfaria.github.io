let cardsNotFound = [];
let foundCards = [];

const resetList = () => {
  const list = document.getElementById('card-list');
  list.value = '';
  const cardsContainer = document.getElementById('cards-filter-row');
  cardsContainer.innerHTML = '';
  cardsNotFound = [];
  foundCards = [];
}

const searchForList = () => {
  const cardsContainer = document.getElementById('cards-filter-row');
  const list = document.getElementById('card-list')?.value;
  cardsContainer.innerHTML = '';
  cardsNotFound = [];
  foundCards = [];
  lastSlice = 0;

  if(!list) {
    Toastify({
      text: 'Preencha com uma lista',
      duration: 2000,
      close: true,
      gravity: "right", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "linear-gradient(to right, #FFD400, #FFDD3C)",
      },
    }).showToast();
  }

  const cards = JSON.parse(localStorage.getItem('cards')) || [];
  const arrayList = list.split("\n");

  arrayList.forEach(card => {
    const name = (removeFirstWord(card)).toLowerCase();
    const foundCard = cards.find(item => item.name.toLowerCase() === name);
    if(foundCard) {
      foundCards.push(foundCard);
    } else {
      cardsNotFound.push(card);
    }
  });

  if(cardsNotFound.length > 0) {
    const modalButton = document.getElementById('modal-button');
    const modalText = document.getElementById('modal-text');
    modalText.innerHTML = '';
    cardsNotFound.forEach(card => modalText.innerHTML += `<li>${card}</li>`);
    modalButton.click();
  }

  createDomCards(foundCards, 'cards-filter-row');
}

const removeFirstWord = (str) => {
  const indexOfSpace = str.indexOf(' ');

  if (indexOfSpace === -1) {
    return '';
  }

  return str.substring(indexOfSpace + 1).trim();
}
