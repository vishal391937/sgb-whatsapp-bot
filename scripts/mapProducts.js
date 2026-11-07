async function getImagesInPage(url) {
  const res = await fetch(url);
  const html = await res.text();
  const regex = /https:\/\/sgbagroindustries\.com\/wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi;
  const imgs = [...new Set(html.match(regex) || [])].filter(u => !u.includes("Logo") && !u.includes("cropped") && !u.includes("body-bg"));
  console.log("Images for:", url);
  imgs.forEach(i => console.log("  ", i));
}

getImagesInPage('https://sgbagroindustries.com/product/sgb-143r-brush-cutter/');
getImagesInPage('https://sgbagroindustries.com/product/sgb-backpack-trolly/');
getImagesInPage('https://sgbagroindustries.com/product/sgb-tiller-attachment/');
