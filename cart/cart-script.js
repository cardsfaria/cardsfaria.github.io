const tbody = document.getElementById("tbody-cart");
const table = document.getElementById("table");

// if it is http redirect to https
if (location.protocol !== "https:") {
  window.location.href = window.location.href.replace("http://", "https://");
}

const getCopyText = () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let text = "Tudo bem, amigo? Eu gostaria de reservar essas cartas: \n\n";
  let quantityOfCards = 0;
  cart.forEach((item) => {
    quantityOfCards += item.quantitySelected;
    text += `${item.quantitySelected}x ${item.name} - ${formatter.format(
      item.price
    )} ${item.additionalInfo ? `- Extra: ${item.additionalInfo}` : ""}\n`;
  });

  text += `\nTotal: ${formatter.format(getCartTotal(cart))}`;
  text += `\nTotal de cards: ${quantityOfCards}`;
  return text;
};

const copyList = () => {
  const text = getCopyText();
  navigator.clipboard.writeText(text);

  Toastify({
    text: "Lista copiada com sucesso!",
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

const emptyCartText = document.getElementById("empty-cart-text");

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const renderCart = (cartParam = []) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let cartArray = cartParam;

  if (cartParam.length <= 0) {
    cartArray = cart;
  }
  if (cartArray.length <= 0) {
    emptyCart(false);
    return;
  }
  renderTotalText();

  emptyCartText.style.display = "none";
  tbody.innerHTML = "";

  cartArray.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${formatter.format(item.price || 0)}</td>
      <td>${item.quantitySelected}</td>
      <td>${item.additionalInfo}</td>
      <td>
        <i style="cursor: pointer;" data-toggle="tooltip-btn-trash" onclick="removeItemFromCart('${
          item.id
        }')" class="fa-solid fa-trash text-danger"></i>

        <i style="cursor: pointer;" onclick="addOneItemCart('${
          item.id
        }')" class="fa-solid fa-add text-success"></i>

        <i style="cursor: pointer;" onclick="removeOneItemFromCart('${
          item.id
        }')" class="fa-solid fa-minus text-warning"></i>

      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById(
    "send-whatsapp"
  ).href = `https://wa.me/5531984113480?text=${encodeURIComponent(
    getCopyText()
  )}`;
};

const mobileCheck = () => {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

const emptyCart = (showMessage = true) => {
  localStorage.removeItem("cart");
  table.innerHTML = "";
  emptyCartText.style.display = "block";
  document.getElementById("total-text").style.display = "none";
  document.getElementById("copy-list").style.display = "none";
  document.getElementById("clear-list").style.display = "none";
  document.getElementById("send-whatsapp").style.display = "none";
  document.getElementById("send-whatsapp").href = "";
  if (showMessage) {
    Toastify({
      text: "Carrinho limpado com sucesso!",
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
};

const removeItemFromCart = (itemId) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((item) => item.id == itemId);
  const newCart = cart.filter((item) => item.id != itemId);
  Toastify({
    text: `Removido ${item.name} com sucesso!`,
    duration: 1000,
    close: true,
    gravity: "right", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)"
    }
  }).showToast();

  if (newCart.length <= 0) {
    emptyCart();
    return;
  }
  localStorage.setItem("cart", JSON.stringify(newCart));
  tbody.innerHTML = "";
  renderCart(newCart);
};

const addOneItemCart = (itemId) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((item) => item.id == itemId);
  if (item.quantitySelected >= parseInt(item.qty)) {
    Toastify({
      text: "Quantidade máxima atingida",
      duration: 1000,
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

  Toastify({
    text: `Adicionado mais 1 ${item.name} com sucesso!`,
    duration: 1000,
    close: true,
    gravity: "right", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)"
    }
  }).showToast();

  const cardIndex = cart.findIndex((c) => c.id == item.id);
  cart[cardIndex].quantitySelected += 1;

  localStorage.setItem("cart", JSON.stringify(cart));
  tbody.innerHTML = "";
  renderCart(cart);
};

const removeOneItemFromCart = (itemId) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((item) => item.id == itemId);

  if (item.quantitySelected <= 1) {
    removeItemFromCart(itemId);
    return;
  }

  Toastify({
    text: `Removido 1 ${item.name} com sucesso!`,
    duration: 1000,
    close: true,
    gravity: "right", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)"
    }
  }).showToast();
  const cardIndex = cart.findIndex((c) => c.id == item.id);
  cart[cardIndex].quantitySelected -= 1;

  localStorage.setItem("cart", JSON.stringify(cart));
  tbody.innerHTML = "";
  renderCart(cart);
};

const getCartTotal = (cart) => {
  return cart.reduce((acc, item) => {
    return acc + parseFloat(item.price) * parseInt(item.quantitySelected);
  }, 0);
};

const clearList = () => {
  if (confirm("Deseja limpar a lista?")) {
    emptyCart();
  }
};

const renderTotalText = () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const total = getCartTotal(cart);
  document.getElementById("total-text").innerHTML =
    "Total: " + formatter.format(total);
  document.getElementById("total-text").style.display = "block";

  document.getElementById("copy-list").style.display = "block";
  document.getElementById("clear-list").style.display = "block";
  if (mobileCheck()) {
    document.getElementById("send-whatsapp").style.display = "block";
  }
};

renderCart();
