const currentPath = window.location.href.split("/")[3];

// "destaque" pinta o item de dourado: é o menu mais usado do site.
const menuTemplate = ({ id, name, path, destaque }) => `
<li class="nav-item" style="margin-right: 30px">
  <a id="${id}" class="nav-link font-lg${
  destaque ? " nav-destaque" : ""
}" href="${path}" style="font-size: 20px" aria-current="page">${name}</a>
</li>
`;

const menuObject = [
  {
    id: "-nav",
    name: "Filtros",
    path: "/",
    destaque: true
  },
  {
    id: "recentes-nav",
    name: "Adicionadas Recentemente",
    path: "/recentes"
  },
  {
    id: "cart-nav",
    name: "Carrinho",
    path: "/cart"
  },
  {
    id: "list-nav",
    name: "Busca por lista",
    path: "/list"
  }
];

const menu = document.getElementById("menu");

menuObject.forEach((item) => (menu.innerHTML += menuTemplate(item)));

const currentNav = document.getElementById(`${currentPath}-nav`);
if (currentNav) {
  currentNav.classList.add("active");
}
