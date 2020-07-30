shapeKeys = {
  path: 'd',
  polygon: 'points',
  polyline: 'points',
};

items = [];

document.querySelector('.mapa_cr_okresy').children.forEach((ch) => {
  let code = null;
  ch.classList.forEach((cls) => {
    if (cls.startsWith('CZ')) {
      code = cls;
    }
  });

  items.push({
    type: ch.localName,
    code,
    shape: ch.getAttribute(shapeKeys[ch.localName]),
  });
});

console.log(JSON.stringify(items));
