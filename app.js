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
const REMOVE_PASSWORD = "talita10";
const LEGACY_STORAGE_KEY = "figurinhas-copa-2026-state-v1";

let state = createEmptyState();
let parsedItems = [];
let lastComparison = [];
let parsedAlreadyApplied = false;
let deferredInstallPrompt = null;
let removeModeActive = false;

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
  $("toggleRemoveMode").addEventListener("click", toggleRemoveMode);
  $("resetVisibleCountry").addEventListener("click", resetVisibleCountry);
  $("copyMissing").addEventListener("click", () => copyText(buildMissingText()));
  $("copyDuplicates").addEventListener("click", () => copyText(buildDuplicatesText()));
  $("parseManual").addEventListener("click", parseManualText);
  $("clearManualText").addEventListener("click", clearManualText);
  $("applyParsed").addEventListener("click", () => applyParsedItems({ silent: false, allowRepeat: true }));
  $("clearParsed").addEventListener("click", clearParsed);
  $("exportJson").addEventListener("click", exportJson);
  $("exportPdf").addEventListener("click", exportPdfReport);
  $("exportDuplicatesPdf").addEventListener("click", exportDuplicatesPdfReport);
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


function requireRemovePassword(actionLabel = "remover figurinhas") {
  const password = prompt(`Digite a senha para ${actionLabel}:`);
  if (password === null) return false;
  if (password !== REMOVE_PASSWORD) {
    alert("Senha incorreta.");
    return false;
  }
  return true;
}

function toggleRemoveMode() {
  if (!removeModeActive && !requireRemovePassword("ativar o modo de remoção")) return;

  removeModeActive = !removeModeActive;
  renderRemoveModeUi();
  renderAlbum();
}

function renderRemoveModeUi() {
  const button = $("toggleRemoveMode");
  const help = $("tapHelpText");

  if (!button || !help) return;

  if (removeModeActive) {
    button.textContent = "Modo remover ativo";
    button.classList.add("danger", "remove-active");
    button.classList.remove("ghost");
    help.textContent = "Modo remover ativo: toque em uma figurinha para subtrair 1 unidade do álbum.";
  } else {
    button.textContent = "Remover figurinha";
    button.classList.remove("danger", "remove-active");
    button.classList.add("ghost");
    help.textContent = "Se ela já estiver no álbum, o toque soma como repetida. Para remover do álbum, use o botão Remover figurinha com senha.";
  }
}


function renderAll() {
  renderRemoveModeUi();
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
  if ($("duplicateExtrasCount")) $("duplicateExtrasCount").textContent = summary.duplicateExtras;
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

  if (removeModeActive) {
    if (current <= 0) {
      alert(`${country} ${String(number).padStart(2, "0")} já está zerada.`);
      return;
    }

    state.inventory[country][number] = current - 1;
    saveState();
    renderAll();
    return;
  }

  state.inventory[country][number] = current + 1;
  saveState();
  renderAll();
}

function removeDuplicateExtra(country, number) {
  if (!requireRemovePassword(`remover uma repetida de ${country} ${String(number).padStart(2, "0")}`)) return;
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

  if (!requireRemovePassword(`limpar o país ${getCountryLabel(selected)}`)) return;
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
    .replace(/([A-Z]{3})\s*[-_./]?\s*(0?[1-9]|1[0-9]|20)\b/g, "$1 $2")
    .replace(/\bN[UÚ]?MERO\b|\bNUMERO\b|\bNRO\b|\bNº\b|\bNO\.?\b/g, " ")
    .replace(/[;|•·]/g, " ")
    .replace(/[,:]/g, " ");

  // Aceita:
  // BRA 01
  // BRA01
  // BRA 1, 2, 3
  // BRA 12 x2
  // BRA 12 qtd 2
  const tokenRegex = new RegExp(
    `\\bX\\s*([1-9]\\d*)\\b|\\bQTD\\.?\\s*([1-9]\\d*)\\b|\\bQUANTIDADE\\s*([1-9]\\d*)\\b|\\b(${countryPattern})\\b|\\b(0?[1-9]|1[0-9]|20)\\b`,
    "g"
  );

  const items = [];
  let currentCountry = null;
  let lastItem = null;
  let match;

  while ((match = tokenRegex.exec(normalized)) !== null) {
    const multiplier = Number(match[1] || match[2] || match[3] || 0);
    const country = match[4];
    const numberText = match[5];

    if (multiplier && lastItem) {
      for (let i = 1; i < multiplier; i++) {
        items.push({ country: lastItem.country, number: lastItem.number });
      }
      continue;
    }

    if (country) {
      currentCountry = country;
      lastItem = null;
      continue;
    }

    if (numberText && currentCountry) {
      const number = Number(numberText);
      if (number >= 1 && number <= STICKERS_PER_COUNTRY) {
        const item = { country: currentCountry, number };
        items.push(item);
        lastItem = item;
      }
    }
  }

  return items;
}



function clearManualText() {
  $("manualText").value = "";
  const fileInput = $("textFileInput");
  if (fileInput) fileInput.value = "";
  clearParsed();
  $("manualText").focus();
}

async function importTextFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();

    // Substitui o conteúdo anterior para não contar novamente figurinhas já importadas.
    $("manualText").value = text;
    clearParsed();
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

  parsedAlreadyApplied = false;
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
      const numbers = values.map((item) => {
        const code = String(item.number).padStart(2, "0");
        return item.qty > 1 ? `${code} x${item.qty}` : code;
      }).join(", ");
      lines.push(`${getCountryLabel(country)}: ${numbers}`);
    }
    lines.push("");
    lines.push("Verificação no álbum atual:");
    for (const item of comparison) {
      lines.push(`${getCountryLabel(item.country)} ${String(item.number).padStart(2, "0")} — leitura x${item.readQty} | atual ${item.currentQty} → ${item.afterQty} | ${item.status}`);
    }
  }

  if (parsedAlreadyApplied) {
    lines.push("");
    lines.push("Status: resultado já aplicado ao álbum. Para importar novamente, altere o texto e toque em Ler texto e atualizar.");
  }

  $("aiResult").textContent = lines.join("\n");
  $("applyParsed").disabled = parsedItems.length === 0 || parsedAlreadyApplied;
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

  if (parsedAlreadyApplied) {
    alert("Este resultado já foi aplicado. Para importar novamente, altere o texto e toque em Ler texto e atualizar.");
    return;
  }

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
  parsedAlreadyApplied = true;
  updateParsedResult("Resultado aplicado ao álbum", { comparison: comparisonBefore });

  if (!silent) {
    alert("Resultado aplicado ao álbum.");
  }
}

function clearParsed() {
  parsedItems = [];
  lastComparison = [];
  parsedAlreadyApplied = false;
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




async function exportPdfReport() {
  const pages = buildAlbumPdfPages();
  const pdfBytes = await createA4CanvasPdf(pages);
  downloadPdfBytes(pdfBytes, `copa-2026-album-a4-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function exportDuplicatesPdfReport() {
  const duplicateRows = getDuplicateRows();
  if (!duplicateRows.length) {
    alert("Não há figurinhas repetidas para exportar.");
    return;
  }

  const pages = buildDuplicatesPdfPages(duplicateRows);
  const pdfBytes = await createA4CanvasPdf(pages);
  downloadPdfBytes(pdfBytes, `copa-2026-repetidas-a4-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function downloadPdfBytes(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildAlbumPdfPages() {
  const rowsPerPage = 25;
  const pages = [];

  for (let index = 0; index < COUNTRIES.length; index += rowsPerPage) {
    const countries = COUNTRIES.slice(index, index + rowsPerPage);
    pages.push((ctx, metrics, pageNumber, totalPages) => {
      drawPdfBaseHeader(ctx, metrics, "Copa 2026 - Álbum de Figurinhas", pageNumber, totalPages);
      drawAlbumPdfTable(ctx, countries, metrics);
      drawPdfFooter(ctx, metrics);
    });
  }

  return pages;
}

function buildDuplicatesPdfPages(rows) {
  const rowsPerPage = 30;
  const pages = [];

  for (let index = 0; index < rows.length; index += rowsPerPage) {
    const pageRows = rows.slice(index, index + rowsPerPage);
    pages.push((ctx, metrics, pageNumber, totalPages) => {
      drawPdfBaseHeader(ctx, metrics, "Copa 2026 - Figurinhas Repetidas", pageNumber, totalPages);
      drawDuplicatesPdfTable(ctx, pageRows, metrics);
      drawPdfFooter(ctx, metrics);
    });
  }

  return pages;
}

function getDuplicateRows() {
  const rows = [];

  for (const country of COUNTRIES) {
    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      const qty = state.inventory[country][number] || 0;
      if (qty > 1) {
        rows.push({
          country,
          number,
          qty,
          extra: qty - 1,
          code: `${country} ${String(number).padStart(2, "0")}`
        });
      }
    }
  }

  return rows;
}

function drawPdfBaseHeader(ctx, metrics, title, pageNumber, totalPages) {
  const { margin, width } = metrics;
  const summary = getSummary();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, metrics.width, metrics.height);

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillText(title, margin, 52);

  ctx.fillStyle = "#475569";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margin, 78);

  ctx.textAlign = "right";
  ctx.fillText(`Página ${pageNumber} de ${totalPages}`, width - margin, 52);
  ctx.fillText(`Total no álbum: ${summary.ownedTypes}/${TOTAL_STICKERS} | Faltantes: ${summary.missing} | Tipos repetidos: ${summary.duplicateTypes}`, width - margin, 78);
  ctx.textAlign = "left";
}

function drawAlbumPdfTable(ctx, countries, metrics) {
  const { margin, width } = metrics;
  const startY = 112;
  const rowHeight = 34;
  const tableWidth = width - margin * 2;
  const flagW = 72;
  const countryW = 185;
  const albumW = 160;
  const stickersW = tableWidth - flagW - countryW - albumW;
  const codeW = stickersW / STICKERS_PER_COUNTRY;

  drawHeaderRow(ctx, margin, startY, tableWidth, rowHeight, [
    { text: "Bandeira", x: margin + 10 },
    { text: "País", x: margin + flagW + 10 },
    { text: "Álbum", x: margin + flagW + countryW + 10 },
    { text: "Figurinhas 01 a 20", x: margin + flagW + countryW + albumW + 10 }
  ]);

  let y = startY + rowHeight;

  countries.forEach((country, rowIndex) => {
    const meta = getCountryMeta(country);

    ctx.fillStyle = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(margin, y, tableWidth, rowHeight);

    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(margin, y, tableWidth, rowHeight);

    // Coluna Bandeira: usa emoji/ícone de bandeira renderizado no canvas.
    ctx.font = "24px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Arial, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(meta.flag || getFlagFallback(country), margin + 18, y + 24);

    ctx.font = "700 13px Arial, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(meta.name, margin + flagW + 10, y + 15);

    ctx.font = "10px Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(country, margin + flagW + 10, y + 28);

    ctx.font = "700 11px Arial, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`${country} 01 até ${country} 20`, margin + flagW + countryW + 10, y + 21);

    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      const qty = state.inventory[country][number] || 0;
      const x = margin + flagW + countryW + albumW + (number - 1) * codeW;
      const code = `${country} ${String(number).padStart(2, "0")}`;

      ctx.fillStyle = qty === 0 ? "#fee2e2" : qty === 1 ? "#dcfce7" : "#fed7aa";
      ctx.fillRect(x + 1.5, y + 4, codeW - 3, rowHeight - 8);

      ctx.strokeStyle = qty === 0 ? "#ef4444" : qty === 1 ? "#22c55e" : "#ea580c";
      ctx.strokeRect(x + 1.5, y + 4, codeW - 3, rowHeight - 8);

      ctx.textAlign = "center";
      ctx.font = "6.5px Arial, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(code, x + codeW / 2, y + 16);

      ctx.font = "6px Arial, sans-serif";
      ctx.fillStyle = "#334155";
      ctx.fillText(`qtd ${qty}`, x + codeW / 2, y + 27);
      ctx.textAlign = "left";
    }

    drawVerticalLine(ctx, margin + flagW, startY, y + rowHeight);
    drawVerticalLine(ctx, margin + flagW + countryW, startY, y + rowHeight);
    drawVerticalLine(ctx, margin + flagW + countryW + albumW, startY, y + rowHeight);

    y += rowHeight;
  });
}

function drawDuplicatesPdfTable(ctx, rows, metrics) {
  const { margin, width } = metrics;
  const startY = 112;
  const rowHeight = 34;
  const tableWidth = width - margin * 2;

  const flagW = 80;
  const countryW = 245;
  const codeW = 140;
  const qtyW = 110;
  const extraW = tableWidth - flagW - countryW - codeW - qtyW;

  drawHeaderRow(ctx, margin, startY, tableWidth, rowHeight, [
    { text: "Bandeira", x: margin + 10 },
    { text: "País", x: margin + flagW + 10 },
    { text: "Figurinha", x: margin + flagW + countryW + 10 },
    { text: "Quantidade", x: margin + flagW + countryW + codeW + 10 },
    { text: "Repetidas extras", x: margin + flagW + countryW + codeW + qtyW + 10 }
  ]);

  let y = startY + rowHeight;

  rows.forEach((row, rowIndex) => {
    const meta = getCountryMeta(row.country);

    ctx.fillStyle = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(margin, y, tableWidth, rowHeight);

    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(margin, y, tableWidth, rowHeight);

    ctx.font = "24px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Arial, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(meta.flag || getFlagFallback(row.country), margin + 20, y + 24);

    ctx.font = "700 13px Arial, sans-serif";
    ctx.fillText(`${meta.name} (${row.country})`, margin + flagW + 10, y + 21);

    ctx.font = "700 14px Arial, sans-serif";
    ctx.fillText(row.code, margin + flagW + countryW + 10, y + 21);

    ctx.font = "700 14px Arial, sans-serif";
    ctx.fillText(String(row.qty), margin + flagW + countryW + codeW + 10, y + 21);

    ctx.fillStyle = "#ea580c";
    ctx.font = "700 14px Arial, sans-serif";
    ctx.fillText(String(row.extra), margin + flagW + countryW + codeW + qtyW + 10, y + 21);

    drawVerticalLine(ctx, margin + flagW, startY, y + rowHeight);
    drawVerticalLine(ctx, margin + flagW + countryW, startY, y + rowHeight);
    drawVerticalLine(ctx, margin + flagW + countryW + codeW, startY, y + rowHeight);
    drawVerticalLine(ctx, margin + flagW + countryW + codeW + qtyW, startY, y + rowHeight);

    y += rowHeight;
  });
}

function drawHeaderRow(ctx, x, y, width, height, columns) {
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#cbd5e1";
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 14px Arial, sans-serif";

  for (const col of columns) {
    ctx.fillText(col.text, col.x, y + 22);
  }
}

function drawVerticalLine(ctx, x, y1, y2) {
  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
}

function drawPdfFooter(ctx, metrics) {
  const { margin, width, height } = metrics;

  ctx.fillStyle = "#64748b";
  ctx.font = "13px Arial, sans-serif";
  ctx.fillText("Legenda: vermelho = faltante | verde = Total no álbum | laranja = repetida", margin, height - 28);

  ctx.textAlign = "right";
  ctx.font = "700 13px Arial, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText("Criado por Marcelo Ferreira", width - margin, height - 28);
  ctx.textAlign = "left";
}

async function createA4CanvasPdf(pageDrawers) {
  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;
  const canvasWidth = 1240;
  const canvasHeight = 1754;
  const metrics = {
    width: canvasWidth,
    height: canvasHeight,
    margin: 46
  };

  const imageBytesList = [];

  for (let index = 0; index < pageDrawers.length; index++) {
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.imageSmoothingEnabled = true;

    pageDrawers[index](ctx, metrics, index + 1, pageDrawers.length);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    imageBytesList.push({
      bytes: dataUrlToBytes(dataUrl),
      width: canvasWidth,
      height: canvasHeight
    });
  }

  return buildPdfWithJpegPages(imageBytesList, pageWidthPt, pageHeightPt);
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildPdfWithJpegPages(images, pageWidth, pageHeight) {
  const parts = [];
  const offsets = [0];

  const pushText = (text) => {
    parts.push(new TextEncoder().encode(text));
  };

  const pushBytes = (bytes) => {
    parts.push(bytes);
  };

  const currentLength = () => parts.reduce((sum, part) => sum + part.length, 0);

  const objects = [];
  const addObject = (bodyParts) => {
    objects.push(bodyParts);
    return objects.length;
  };

  const catalogRef = addObject([""]);
  const pagesRef = addObject([""]);

  const pageRefs = [];

  images.forEach((image, index) => {
    const imageRef = addObject([
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
      image.bytes,
      "\nendstream"
    ]);

    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${index + 1} Do\nQ`;
    const contentRef = addObject([`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`]);

    const pageRef = addObject([
      `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageRef} 0 R >> >> >> /Contents ${contentRef} 0 R >>`
    ]);

    pageRefs.push(pageRef);
  });

  objects[catalogRef - 1] = [`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`];
  objects[pagesRef - 1] = [`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`];

  pushText("%PDF-1.4\n");

  for (let index = 0; index < objects.length; index++) {
    offsets[index + 1] = currentLength();
    pushText(`${index + 1} 0 obj\n`);
    for (const part of objects[index]) {
      if (typeof part === "string") pushText(part);
      else pushBytes(part);
    }
    pushText("\nendobj\n");
  }

  const xrefOffset = currentLength();
  pushText(`xref\n0 ${objects.length + 1}\n`);
  pushText("0000000000 65535 f \n");

  for (let index = 1; index <= objects.length; index++) {
    pushText(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }

  pushText(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const totalLength = currentLength();
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function getFlagFallback(country) {
  const map = {
    ALG: "DZ", ARG: "AR", AUS: "AU", BEL: "BE", BIH: "BA", BRA: "BR",
    CAN: "CA", CIV: "CI", COL: "CO", CRO: "HR", ECU: "EC", ENG: "ENG",
    ESP: "ES", FRA: "FR", FWG: "FWC", GER: "DE", GHA: "GH", IRN: "IR",
    JPN: "JP", KOR: "KR", KSA: "SA", MAR: "MA", MEX: "MX", NED: "NL",
    NOR: "NO", PAN: "PA", POR: "PT", QAT: "QA", RSA: "ZA", SCO: "SCO",
    SEN: "SN", SUI: "CH", TUN: "TN", URU: "UY", USA: "US", UZB: "UZ"
  };
  return map[country] || country;
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



function rectCommand(x, y, width, height, rgb) {
  return `q ${rgb} rg ${x} ${y} ${width} ${height} re f Q`;
}

function textCommand(text, x, y, fontSize, font = "F1") {
  return `BT /${font} ${fontSize} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function escapePdfText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
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
  if (!requireRemovePassword("limpar todo o álbum")) return;
  if (!confirm("Deseja apagar todas as marcações do álbum?")) return;
  state = createEmptyState();
  saveState();
  clearParsed();
  renderAll();
}

init();
