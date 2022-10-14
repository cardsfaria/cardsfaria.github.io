const currentPath = window.location.href.split('/')[3];


const menuTemplate = ({id, name, path}) => `
<li class="nav-item">
  <a id="${id}" class="nav-link" href="${path}" aria-current="page">${name}</a>
</li>
`

const menuObject = [
  {
    id: '-nav',
    name: 'Home',
    path: '/',
  },
  {
    id: 'filtrar-nav',
    name: 'Filtrar',
    path: '/filtrar',
  },
  {
    id: 'cart-nav',
    name: 'Carrinho',
    path: '/cart',
  },
  {
    id: 'list-nav',
    name: 'Por lista',
    path: '/list',
  }
];

const menu = document.getElementById('menu');

menuObject.forEach(item => menu.innerHTML += menuTemplate(item));

const currentNav = document.getElementById(`${currentPath}-nav`);
if(currentNav) {
  currentNav.classList.add('active');
}