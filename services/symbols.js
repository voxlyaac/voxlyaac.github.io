// services/symbols.js — OpenSymbols API search (ES module)

export async function search(query) {
  const res = await fetch(`https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data;
}
