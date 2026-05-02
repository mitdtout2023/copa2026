const COUNTRIES = [
  "ALG", "ARG", "AUS", "BEL", "BIH", "BRA", "CAN", "CIV", "COL", "CRO",
  "ECU", "ENG", "ESP", "FRA", "FWG", "GER", "GHA", "IRN", "JPN", "KOR",
  "KSA", "MAR", "MEX", "NED", "NOR", "PAN", "POR", "QAT", "RSA", "SCO",
  "SEN", "SUI", "TUN", "URU", "USA", "UZB"
];

const STICKERS_PER_COUNTRY = 20;
const COUNTRY_META = {
  ALG: { name: "Argélia", flag: "🇩🇿" },
  ARG: { name: "Argentina", flag: "🇦🇷" },
  AUS: { name: "Austrália", flag: "🇦🇺" },
  BEL: { name: "Bélgica", flag: "🇧🇪" },
  BIH: { name: "Bósnia e Herzegovina", flag: "🇧🇦" },
  BRA: { name: "Brasil", flag: "🇧🇷" },
  CAN: { name: "Canadá", flag: "🇨🇦" },
  CIV: { name: "Costa do Marfim", flag: "🇨🇮" },
  COL: { name: "Colômbia", flag: "🇨🇴" },
  CRO: { name: "Croácia", flag: "🇭🇷" },
  ECU: { name: "Equador", flag: "🇪🇨" },
  ENG: { name: "Inglaterra", flag: "🏴" },
  ESP: { name: "Espanha", flag: "🇪🇸" },
  FRA: { name: "França", flag: "🇫🇷" },
  FWG: { name: "FIFA World Cup", flag: "🏆" },
  GER: { name: "Alemanha", flag: "🇩🇪" },
  GHA: { name: "Gana", flag: "🇬🇭" },
  IRN: { name: "Irã", flag: "🇮🇷" },
  JPN: { name: "Japão", flag: "🇯🇵" },
  KOR: { name: "Coreia do Sul", flag: "🇰🇷" },
  KSA: { name: "Arábia Saudita", flag: "🇸🇦" },
  MAR: { name: "Marrocos", flag: "🇲🇦" },
  MEX: { name: "México", flag: "🇲🇽" },
  NED: { name: "Países Baixos", flag: "🇳🇱" },
  NOR: { name: "Noruega", flag: "🇳🇴" },
  PAN: { name: "Panamá", flag: "🇵🇦" },
  POR: { name: "Portugal", flag: "🇵🇹" },
  QAT: { name: "Catar", flag: "🇶🇦" },
  RSA: { name: "África do Sul", flag: "🇿🇦" },
  SCO: { name: "Escócia", flag: "🏴" },
  SEN: { name: "Senegal", flag: "🇸🇳" },
  SUI: { name: "Suíça", flag: "🇨🇭" },
  TUN: { name: "Tunísia", flag: "🇹🇳" },
  URU: { name: "Uruguai", flag: "🇺🇾" },
  USA: { name: "Estados Unidos", flag: "🇺🇸" },
  UZB: { name: "Uzbequistão", flag: "🇺🇿" }
};

function getCountryMeta(country) {
  return COUNTRY_META[country] || { name: country, flag: "🏳️" };
}

function getCountryLabel(country, includeCode = true) {
  const meta = getCountryMeta(country);
  return includeCode ? `${meta.flag} ${meta.name} (${country})` : `${meta.flag} ${meta.name}`;
}

const TOTAL_STICKERS = COUNTRIES.length * STICKERS_PER_COUNTRY;
const STORAGE_KEY = "figurinhas-copa-2026-state-v2";
const LEGACY_STORAGE_KEY = "figurinhas-copa-2026-state-v1";

let state = createEmptyState();
let parsedItems = [];
let lastComparison = [];
let deferredInstallPrompt = null;

const $ = (id) => document.getElementById(id);

function createEmptyState() {
  const inventory = {};
  for (const country of COUNTRIES) {
    inventory[country] = {};
    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      inventory[country][number] = 0;
    }
  }
  return {
    inventory,
    updatedAt: new Date().toISOString()
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    const fresh = createEmptyState();
    for (const country of COUNTRIES) {
      for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
        const value = saved?.inventory?.[country]?.[number];
        fresh.inventory[country][number] = Number.isInteger(value) && value >= 0 ? value : 0;
      }
    }
    fresh.updatedAt = saved.updatedAt || new Date().toISOString();
    state = fresh;
  } catch (error) {
    console.warn("Não foi possível carregar o estado salvo.", error);
  }
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const status = $("saveStatus");
  if (status) {
    status.textContent = `Dados salvos localmente em ${new Date().toLocaleString("pt-BR")}.`;
  }
}

function init() {
  loadState();
  setupTabs();
  setupCountryFilter();
  setupEvents();
  setupPwaInstall();
  setupServiceWorker();

  const savedApiKey = localStorage.getItem(API_KEY_STORAGE) || "";
  $("apiKey").value = savedApiKey;
  $("saveApiKey").checked = Boolean(savedApiKey);
  $("modelName").value = state.model || "gpt-4.1-mini";

  renderAll();
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      $(button.dataset.tab).classList.add("active");
    });
  });
}

function setupCountryFilter() {
  const select = $("countryFilter");
  select.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "Todos os países";
  select.appendChild(allOption);

  for (const country of COUNTRIES) {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = getCountryLabel(country);
    select.appendChild(option);
  }
}

function setupEvents() {
  $("countryFilter").addEventListener("change", renderAlbum);
  $("resetVisibleCountry").addEventListener("click", resetVisibleCountry);
  $("copyMissing").addEventListener("click", () => copyText(buildMissingText()));
  $("copyDuplicates").addEventListener("click", () => copyText(buildDuplicatesText()));
  $("parseManual").addEventListener("click", parseManualText);
  $("applyParsed").addEventListener("click", () => applyParsedItems({ silent: false, allowRepeat: true }));
  $("clearParsed").addEventListener("click", clearParsed);
  $("exportJson").addEventListener("click", exportJson);
  $("exportPdf").addEventListener("click", exportPdfReport);
  $("importJson").addEventListener("change", importJson);
  $("resetAll").addEventListener("click", resetAll);
  $("textFileInput").addEventListener("change", importTextFile);
}

function setupPwaInstall() {
  const button = $("installButton");
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    button.classList.remove("hidden");
  });

  button.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    button.classList.add("hidden");
  });
}

function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn("Service Worker não registrado.", error);
    });
  }
}

function renderAll() {
  renderSummary();
  renderAlbum();
  renderMissing();
  renderDuplicates();
}

function getSummary() {
  let ownedTypes = 0;
  let missing = 0;
  let duplicateTypes = 0;
  let duplicateExtras = 0;
  let physicalTotal = 0;

  for (const country of COUNTRIES) {
    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      const qty = state.inventory[country][number];
      physicalTotal += qty;
      if (qty === 0) missing += 1;
      if (qty >= 1) ownedTypes += 1;
      if (qty > 1) {
        duplicateTypes += 1;
        duplicateExtras += qty - 1;
      }
    }
  }
  return { ownedTypes, missing, duplicateTypes, duplicateExtras, physicalTotal };
}

function renderSummary() {
  const summary = getSummary();
  $("ownedCount").textContent = summary.ownedTypes;
  $("missingCount").textContent = summary.missing;
  $("duplicateTypesCount").textContent = summary.duplicateTypes;
  $("duplicateExtrasCount").textContent = summary.duplicateExtras;
}

function renderAlbum() {
  const container = $("albumGrid");
  const selected = $("countryFilter").value;
  const countriesToShow = selected === "ALL" ? COUNTRIES : [selected];
  container.innerHTML = "";

  for (const country of countriesToShow) {
    const card = document.createElement("article");
    card.className = "country-card";

    const owned = countOwnedByCountry(country);
    const dup = countDuplicateExtrasByCountry(country);
    const physical = countPhysicalByCountry(country);

    const header = document.createElement("header");
    header.innerHTML = `<div><h3>${getCountryLabel(country, false)}</h3><div class="country-code">${country}</div></div><span class="country-stats">${owned}/${STICKERS_PER_COUNTRY} no álbum • ${physical} total • ${dup} extras</span>`;

    const grid = document.createElement("div");
    grid.className = "sticker-grid";

    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      const qty = state.inventory[country][number];
      const button = document.createElement("button");
      button.className = `sticker ${qty === 1 ? "owned" : qty > 1 ? "duplicate" : ""}`;
      button.type = "button";
      button.setAttribute("aria-label", `${country} ${number}, quantidade ${qty}`);
      button.innerHTML = `<span class="sticker-number">${number}</span><span class="sticker-qty">qtd. ${qty}</span>`;
      button.addEventListener("click", () => updateStickerFromTap(country, number));
      grid.appendChild(button);
    }

    card.appendChild(header);
    card.appendChild(grid);
    container.appendChild(card);
  }
}

function countOwnedByCountry(country) {
  let count = 0;
  for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
    if (state.inventory[country][number] > 0) count += 1;
  }
  return count;
}

function countPhysicalByCountry(country) {
  let count = 0;
  for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
    count += state.inventory[country][number];
  }
  return count;
}

function countDuplicateExtrasByCountry(country) {
  let count = 0;
  for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
    const qty = state.inventory[country][number];
    if (qty > 1) count += qty - 1;
  }
  return count;
}

function updateStickerFromTap(country, number) {
  const current = state.inventory[country][number];
  state.inventory[country][number] = current + 1;
  saveState();
  renderAll();
}

function removeDuplicateExtra(country, number) {
  const current = state.inventory[country][number];
  if (current <= 1) return;
  state.inventory[country][number] = current - 1;
  saveState();
  renderAll();
}

function resetVisibleCountry() {
  const selected = $("countryFilter").value;

  if (selected === "ALL") {
    alert("Selecione um país específico para limpar.");
    return;
  }

  if (!confirm(`Limpar todas as figurinhas de ${getCountryLabel(selected)}?`)) return;
  for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
    state.inventory[selected][number] = 0;
  }
  saveState();
  renderAll();
}

function renderMissing() {
  renderGroupedList($("missingList"), getMissingMap(), "Nenhuma figurinha faltante.");
}

function renderDuplicates() {
  renderGroupedList($("duplicatesList"), getDuplicatesMap(), "Nenhuma figurinha repetida.", true);
}

function getMissingMap() {
  const map = {};
  for (const country of COUNTRIES) {
    const nums = [];
    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      if (state.inventory[country][number] === 0) nums.push(number);
    }
    if (nums.length) map[country] = nums;
  }
  return map;
}

function getDuplicatesMap() {
  const map = {};
  for (const country of COUNTRIES) {
    const nums = [];
    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      const qty = state.inventory[country][number];
      if (qty > 1) nums.push({ number, qty, extra: qty - 1 });
    }
    if (nums.length) map[country] = nums;
  }
  return map;
}

function renderGroupedList(container, map, emptyText, duplicates = false) {
  container.innerHTML = "";
  const entries = Object.entries(map);
  if (!entries.length) {
    const card = document.createElement("article");
    card.className = "list-card";
    card.textContent = emptyText;
    container.appendChild(card);
    return;
  }

  for (const [country, values] of entries) {
    const card = document.createElement("article");
    card.className = "list-card";

    const title = document.createElement("strong");
    title.textContent = getCountryLabel(country);

    const pillList = document.createElement("div");
    pillList.className = "pill-list";

    if (duplicates) {
      for (const item of values) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pill duplicate-pill";
        button.textContent = `${country} ${item.number} • qtd. ${item.qty} • sobra ${item.extra}`;
        button.setAttribute("aria-label", `Remover uma repetida de ${country} ${item.number}. Quantidade atual ${item.qty}.`);
        button.addEventListener("click", () => removeDuplicateExtra(country, item.number));
        pillList.appendChild(button);
      }
    } else {
      for (const number of values) {
        const span = document.createElement("span");
        span.className = "pill";
        span.textContent = `${country} ${number}`;
        pillList.appendChild(span);
      }
    }

    card.appendChild(title);
    card.appendChild(pillList);
    container.appendChild(card);
  }
}

function buildMissingText() {
  const map = getMissingMap();
  const lines = Object.entries(map).map(([country, nums]) => `${getCountryLabel(country)}: ${nums.join(", ")}`);
  return lines.length ? lines.join("\n") : "Nenhuma figurinha faltante.";
}

function buildDuplicatesText() {
  const map = getDuplicatesMap();
  const lines = Object.entries(map).map(([country, items]) => {
    const values = items.map((item) => `${item.number} (qtd. ${item.qty}, sobra ${item.extra})`).join(", ");
    return `${getCountryLabel(country)}: ${values}`;
  });
  return lines.length ? lines.join("\n") : "Nenhuma figurinha repetida.";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Lista copiada.");
  } catch {
    prompt("Copie a lista abaixo:", text);
  }
}

function parseStickerText(text) {
  const countryPattern = COUNTRIES.join("|");
  const normalized = text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([A-Z]{3})(\d)/g, "$1 $2")
    .replace(/(\d)([A-Z]{3})/g, "$1 $2")
    .replace(/N[UÚ]MERO|NUMERO|NRO|Nº|NO\.?/g, " ")
    .replace(/[;|•·]/g, " ")
    .replace(/[,:]/g, " ");

  const tokenRegex = new RegExp(`\\b(${countryPattern})\\b|\\b([1-9]|1[0-9]|20)\\b`, "g");
  const items = [];
  let currentCountry = null;
  let match;

  while ((match = tokenRegex.exec(normalized)) !== null) {
    if (match[1]) {
      currentCountry = match[1];
    } else if (match[2] && currentCountry) {
      items.push({ country: currentCountry, number: Number(match[2]) });
    }
  }
  return items;
}


async function importTextFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const currentText = $("manualText").value.trim();
    $("manualText").value = currentText ? `${currentText}\n${text}` : text;
    parseManualText();
  } catch (error) {
    alert(`Não foi possível ler o arquivo de texto: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function parseManualText() {
  const text = $("manualText").value.trim();
  if (!text) {
    alert("Cole ou importe um texto antes de analisar.");
    return;
  }
  parsedItems = parseStickerText(text);
  lastComparison = buildComparison(parsedItems);
  updateParsedResult("Texto lido pelo app", { comparison: lastComparison });

  if ($("autoApply").checked && parsedItems.length) {
    applyParsedItems({ silent: true });
  }
}

function buildComparison(items) {
  const grouped = groupParsedItems(items);
  const comparison = [];

  for (const [country, values] of Object.entries(grouped)) {
    for (const item of values) {
      const current = state.inventory[country][item.number] || 0;
      const after = current + item.qty;
      comparison.push({
        country,
        number: item.number,
        readQty: item.qty,
        currentQty: current,
        afterQty: after,
        status: getReadStatus(current, after)
      });
    }
  }

  return comparison;
}

function getReadStatus(currentQty, afterQty) {
  if (currentQty === 0 && afterQty === 1) return "nova figurinha — adicionada ao álbum";
  if (currentQty === 0 && afterQty > 1) return "nova figurinha — já aparece repetida na leitura";
  if (currentQty === 1) return "já tinha — virou repetida";
  return "já era repetida — quantidade aumentada";
}

function updateParsedResult(sourceLabel = "Resultado", options = {}) {
  const grouped = groupParsedItems(parsedItems);
  const comparison = options.comparison || buildComparison(parsedItems);
  const lines = [];
  lines.push(sourceLabel);
  lines.push(`Total identificado: ${parsedItems.length}`);
  lines.push("");

  if (!parsedItems.length) {
    lines.push("Nenhuma figurinha reconhecida. Use o formato BRA 12, ARG 1, 4, 7 ou envie uma foto mais nítida.");
  } else {
    lines.push("Figurinhas lidas:");
    for (const [country, values] of Object.entries(grouped)) {
      const numbers = values.map((item) => item.qty > 1 ? `${item.number} x${item.qty}` : `${item.number}`).join(", ");
      lines.push(`${getCountryLabel(country)}: ${numbers}`);
    }
    lines.push("");
    lines.push("Verificação no álbum atual:");
    for (const item of comparison) {
      lines.push(`${getCountryLabel(item.country)} ${item.number} — leitura x${item.readQty} | atual ${item.currentQty} → ${item.afterQty} | ${item.status}`);
    }
  }

  $("aiResult").textContent = lines.join("\n");
  $("applyParsed").disabled = parsedItems.length === 0;
}

function groupParsedItems(items) {
  const groups = {};
  for (const item of items) {
    if (!COUNTRIES.includes(item.country)) continue;
    if (item.number < 1 || item.number > STICKERS_PER_COUNTRY) continue;
    if (!groups[item.country]) groups[item.country] = new Map();
    groups[item.country].set(item.number, (groups[item.country].get(item.number) || 0) + 1);
  }

  const output = {};
  for (const country of COUNTRIES) {
    if (!groups[country]) continue;
    output[country] = Array.from(groups[country].entries())
      .sort((a, b) => a[0] - b[0])
      .map(([number, qty]) => ({ number, qty }));
  }
  return output;
}

function applyParsedItems(options = {}) {
  if (!parsedItems.length) return;
  const { silent = false } = options;
  const mode = $("applyMode").value;
  const grouped = groupParsedItems(parsedItems);
  const comparisonBefore = buildComparison(parsedItems);

  if (mode === "replace") {
    state = createEmptyState();
  }

  for (const [country, items] of Object.entries(grouped)) {
    for (const item of items) {
      const current = state.inventory[country][item.number];
      if (mode === "add") {
        state.inventory[country][item.number] = current + item.qty;
      } else {
        state.inventory[country][item.number] = item.qty;
      }
    }
  }

  saveState();
  renderAll();
  lastComparison = comparisonBefore;
  updateParsedResult("Resultado aplicado ao álbum", { comparison: comparisonBefore });

  if (!silent) {
    alert("Resultado aplicado ao álbum.");
  }
}

function clearParsed() {
  parsedItems = [];
  lastComparison = [];
  $("aiResult").textContent = "Nenhum texto analisado ainda.";
  $("applyParsed").disabled = true;
}


function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `figurinhas-copa-2026-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    const fresh = createEmptyState();
    for (const country of COUNTRIES) {
      for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
        const value = imported?.inventory?.[country]?.[number];
        fresh.inventory[country][number] = Number.isInteger(value) && value >= 0 ? value : 0;
      }
    }
    state = fresh;
    saveState();
    renderAll();
    alert("Backup importado.");
  } catch (error) {
    alert(`Não foi possível importar o arquivo: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function exportPdfReport() {
  const lines = buildPdfReportLines();
  const pdf = createPdfFromLines(lines, {
    title: "Figurinhas Copa 2026",
    subtitle: `Relatorio gerado em ${new Date().toLocaleString("pt-BR")}`
  });

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `figurinhas-copa-2026-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildPdfReportLines() {
  const summary = getSummary();
  const lines = [];
  lines.push(`Resumo geral: ${summary.ownedTypes}/${TOTAL_STICKERS} no album | faltantes ${summary.missing} | tipos repetidos ${summary.duplicateTypes} | repetidas extras ${summary.duplicateExtras} | total fisico ${summary.physicalTotal}`);
  lines.push("");
  lines.push("Quantidade por pais e figurinhas faltantes:");
  lines.push("");

  for (const country of COUNTRIES) {
    const owned = countOwnedByCountry(country);
    const physical = countPhysicalByCountry(country);
    const extras = countDuplicateExtrasByCountry(country);
    const missing = [];
    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      if (state.inventory[country][number] === 0) missing.push(number);
    }
    const missingText = missing.length ? missing.join(", ") : "nenhuma";
    lines.push(`${getCountryLabel(country)}: no album ${owned}/20 | total fisico ${physical} | extras ${extras} | faltam: ${missingText}`);
  }

  lines.push("");
  lines.push("Repetidas:");
  const duplicates = getDuplicatesMap();
  if (!Object.keys(duplicates).length) {
    lines.push("Nenhuma figurinha repetida.");
  } else {
    for (const [country, items] of Object.entries(duplicates)) {
      const values = items.map((item) => `${item.number} qtd ${item.qty} sobra ${item.extra}`).join("; ");
      lines.push(`${getCountryLabel(country)}: ${values}`);
    }
  }

  return lines;
}

function createPdfFromLines(rawLines, options = {}) {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 42;
  const topY = 800;
  const lineHeight = 14;
  const maxChars = 92;
  const pages = [];
  let currentPage = [];

  const title = sanitizePdfText(options.title || "Relatorio");
  const subtitle = sanitizePdfText(options.subtitle || "");

  const wrappedLines = rawLines.flatMap((line) => wrapPdfLine(sanitizePdfText(line), maxChars));
  for (const line of wrappedLines) {
    if (currentPage.length >= 48) {
      pages.push(currentPage);
      currentPage = [];
    }
    currentPage.push(line);
  }
  if (currentPage.length) pages.push(currentPage);
  if (!pages.length) pages.push([]);

  const objects = [null];
  const addObject = (value) => {
    objects.push(value);
    return objects.length - 1;
  };

  addObject(""); // 1 catalog placeholder
  addObject(""); // 2 pages placeholder
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"); // 3 font

  const pageRefs = [];
  pages.forEach((pageLines, pageIndex) => {
    const commands = [];
    commands.push(textCommand(title, marginX, topY, 16));
    if (subtitle) commands.push(textCommand(subtitle, marginX, topY - 20, 10));
    commands.push(textCommand(`Pagina ${pageIndex + 1} de ${pages.length}`, 500, topY - 20, 9));

    let y = topY - 46;
    pageLines.forEach((line) => {
      commands.push(textCommand(line || " ", marginX, y, 10));
      y -= lineHeight;
    });

    const content = commands.join("\n");
    const contentRef = addObject(`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`);
    const pageRef = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentRef} 0 R >>`);
    pageRefs.push(pageRef);
  });

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  const encoder = new TextEncoder();
  for (let index = 1; index < objects.length; index++) {
    offsets[index] = encoder.encode(pdf).length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < objects.length; index++) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

function textCommand(text, x, y, fontSize) {
  return `BT /F1 ${fontSize} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function escapePdfText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function sanitizePdfText(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapPdfLine(line, maxChars) {
  if (!line) return [""];
  const result = [];
  let current = "";
  for (const word of line.split(/\s+/)) {
    if (!word) continue;
    if ((current + " " + word).trim().length > maxChars) {
      if (current) result.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) result.push(current);
  return result.length ? result : [""];
}

function resetAll() {
  if (!confirm("Deseja apagar todas as marcações do álbum?")) return;
  state = createEmptyState();
  saveState();
  clearParsed();
  renderAll();
}

init();
