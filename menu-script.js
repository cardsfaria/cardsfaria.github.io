const currentPath = window.location.href.split("/")[3];

const menuTemplate = ({ id, name, path }) => `
<li class="nav-item" style="margin-right: 30px">
  <a id="${id}" class="nav-link font-lg" href="${path}" style="font-size: 20px" aria-current="page">${name}</a>
</li>
`;

const menuObject = [
  {
    id: "-nav",
    name: "Estoque",
    path: "/"
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
    name: "Por lista",
    path: "/list"
  }
];

const menu = document.getElementById("menu");

menuObject.forEach((item) => (menu.innerHTML += menuTemplate(item)));

const currentNav = document.getElementById(`${currentPath}-nav`);
if (currentNav) {
  currentNav.classList.add("active");
}
