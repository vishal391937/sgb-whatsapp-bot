async function fetchShopImages() {
  try {
    const res = await fetch("https://sgbagroindustries.com/shop/");
    const html = await res.text();
    const regex = /https:\/\/sgbagroindustries\.com\/wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi;
    const urls = [...new Set(html.match(regex) || [])];
    console.log("Found image URLs:", urls.length);
    urls.slice(0, 20).forEach(u => console.log(u));
  } catch (err) {
    console.error("Error:", err);
  }
}
fetchShopImages();

