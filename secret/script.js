const getHtmlPage = async () => {
  const response = await fetch('https://perfiloptical.com/api/faria-cards', {  headers: {'Access-Control-Allow-Origin': '*' }});

  
  const template = await response.json();

  const dom = new DOMParser().parseFromString(template.ligamagic, 'text/html');
  // const estoqueLinhas = Array.prototype.slice.call(dom.getElementsByClassName('estoque-linha'));
  // estoqueLinhas.forEach((linha, index) => {
  //   if(index > 5) return;
  //   const children = Array.prototype.slice.call(linha.children);
  //   children.forEach(child => console.log(child.innerText));
  // });

   const estoqueLinhas = Array.prototype.slice.call(dom.getElementsByClassName('mob-preco-desconto'));
  estoqueLinhas.forEach((linha, index) => {
    if(index > 5) return;
    console.log(linha.innerText);
  });

  //

}