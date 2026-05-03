const COUNTRIES = [
  "ALG", "ARG", "AUS", "BEL", "BIH", "BRA", "CAN", "CIV", "COL", "CRO",
  "ECU", "ENG", "ESP", "FRA", "FWC", "GER", "GHA", "IRN", "JPN", "KOR",
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
  FWC: { name: "FIFA World Cup", flag: "🏆" },
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
  $("readStickerButton").addEventListener("click", readStickerByCode);
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




function parseStickerCodesStrict(text) {
  const countryPattern = COUNTRIES.join("|");
  const normalized = String(text || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/J\s*P\s*N/g, "JPN")
    .replace(/B\s*R\s*A/g, "BRA")
    .replace(/A\s*R\s*G/g, "ARG")
    .replace(/U\s*S\s*A/g, "USA")
    .replace(/[|;:•·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const directCodeRegex = new RegExp(`\\b(${countryPattern})\\s*[-_./]?\\s*([0-9OILS]{1,2})\\b`, "g");
  const items = [];
  let match;

  while ((match = directCodeRegex.exec(normalized)) !== null) {
    const country = match[1];
    const rawNumber = normalizeOcrNumberText(match[2]);
    const number = Number(rawNumber);

    if (!COUNTRIES.includes(country)) continue;
    if (number < 1 || number > STICKERS_PER_COUNTRY) continue;

    items.push({ country, number });
  }

  return items;
}

function formatStickerCode(item) {
  return `${item.country} ${String(item.number).padStart(2, "0")}`;
}


function parseSingleStickerCode(rawCode) {
  const items = parseStickerCodesStrict(rawCode);
  return items.length ? items[0] : null;
}

function readStickerByCode() {
  const rawCode = prompt("Digite ou cole o(s) código(s) da figurinha.\n\nExemplos:\nJPN 10\nJPN 10, JPN 15\nBRA 01, ARG 12");

  if (rawCode === null) return;

  const items = parseStickerCodesStrict(rawCode);

  if (!items.length) {
    alert("Código inválido. Use o formato JPN 10, BRA 01, ARG 12 etc.");
    return;
  }

  applyReadStickerItems(items, "manual");
}






























function applyReadStickerItems(items, source = "foto") {
  const grouped = groupParsedItems(items);
  const messages = [];
  let totalRead = 0;

  for (const [country, stickerItems] of Object.entries(grouped)) {
    for (const item of stickerItems) {
      const currentQty = state.inventory[country][item.number] || 0;
      const nextQty = currentQty + item.qty;
      const code = `${country} ${String(item.number).padStart(2, "0")}`;

      state.inventory[country][item.number] = nextQty;
      totalRead += item.qty;

      if (currentQty === 0 && nextQty === 1) {
        messages.push(`${code}: adicionada ao álbum.`);
      } else if (currentQty === 0 && nextQty > 1) {
        messages.push(`${code}: adicionada ao álbum e ${nextQty - 1} repetida(s).`);
      } else if (currentQty === 1) {
        messages.push(`${code}: já existia; agora está em Repetidas.`);
      } else {
        messages.push(`${code}: repetida atualizada para qtd. ${nextQty}.`);
      }
    }
  }

  saveState();
  renderAll();

  const sourceLabel = "Leitura concluída";
  alert(`${sourceLabel}.\nTotal lido: ${totalRead}\n\n${messages.slice(0, 8).join("\n")}${messages.length > 8 ? "\n..." : ""}`);
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

function normalizeOcrNumberText(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/S/g, "5");
}

function parseStickerText(text) {
  const countryPattern = COUNTRIES.join("|");
  const countryNumberRegex = new RegExp(`\\b(${countryPattern})\\s*[-_./]?\\s*([0-9OILS]{1,2})\\b`, "g");
  const normalized = text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(countryNumberRegex, (_, country, rawNumber) => `${country} ${normalizeOcrNumberText(rawNumber)}`)
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
        const legacyFwgValue = country === "FWC" ? imported?.inventory?.FWG?.[number] : undefined;
        const normalizedValue = Number.isInteger(value) && value >= 0 ? value : 0;
        const normalizedLegacyFwgValue = Number.isInteger(legacyFwgValue) && legacyFwgValue >= 0 ? legacyFwgValue : 0;
        fresh.inventory[country][number] = country === "FWC"
          ? Math.max(normalizedValue, normalizedLegacyFwgValue)
          : normalizedValue;
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
  const reportHtml = buildAlbumReportHtml();
  downloadReportFile(reportHtml, `copa-2026-relatorio-album-${new Date().toISOString().slice(0, 10)}.html`);
}

function exportDuplicatesPdfReport() {
  const rows = getDuplicateRows();
  if (!rows.length) {
    alert("Não há figurinhas repetidas para exportar.");
    return;
  }

  const reportHtml = buildDuplicatesReportHtml(rows);
  downloadReportFile(reportHtml, `copa-2026-relatorio-repetidas-${new Date().toISOString().slice(0, 10)}.html`);
}

function downloadReportFile(reportHtml, filename) {
  const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildAlbumReportHtml() {
  const summary = getSummary();

  const rows = COUNTRIES.map((country) => {
    const meta = getCountryMeta(country);
    const cells = [];

    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      const qty = state.inventory[country][number] || 0;
      const statusClass = qty === 0 ? "missing" : qty === 1 ? "owned" : "duplicate";
      const code = `${country} ${String(number).padStart(2, "0")}`;
      cells.push(`<td class="sticker-cell ${statusClass}"><strong>${code}</strong><span>qtd ${qty}</span></td>`);
    }

    return `
      <tr>
        <td class="country-cell">
          <strong>${escapeHtml(meta.name)} (${country})</strong>
        </td>
        ${cells.join("")}
      </tr>`;
  }).join("");

  return buildReportDocument({
    title: "Copa 2026 - Álbum de Figurinhas",
    summary: `Total no álbum: ${summary.ownedTypes}/${TOTAL_STICKERS} | Faltantes: ${summary.missing}`,
    body: `
      <table class="album-table">
        <thead>
          <tr>
            <th>País</th>
            ${Array.from({ length: STICKERS_PER_COUNTRY }, (_, index) => `<th>${String(index + 1).padStart(2, "0")}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `,
    hideHeaderCredit: false,
    hideLegend: false
  });
}

function buildDuplicatesReportHtml(rows) {
  const tableRows = rows.map((row) => {
    const meta = getCountryMeta(row.country);
    return `
      <tr>
        <td><strong>${escapeHtml(meta.name)} (${row.country})</strong></td>
        <td><strong>${row.code}</strong></td>
        <td>${row.extra}</td>
      </tr>`;
  }).join("");

  return buildReportDocument({
    title: "Copa 2026 - Figurinhas Repetidas",
    summary: "",
    body: `
      <table class="duplicates-table">
        <thead>
          <tr>
            <th>País</th>
            <th>Figurinha</th>
            <th>Repetidas</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `,
    hideHeaderCredit: true,
    hideLegend: true
  });
}

function buildReportDocument({ title, summary, body, hideHeaderCredit = false, hideLegend = false }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 9mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
    }

    .page {
      background: #ffffff;
      width: 100%;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 10px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 8px;
    }

    h1 {
      font-size: 17px;
      margin: 0 0 4px;
    }

    .meta {
      font-size: 10px;
      color: #475569;
      line-height: 1.35;
    }

    .credit {
      text-align: right;
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th {
      background: #e2e8f0;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      padding: 4px;
      font-size: 7px;
      text-align: center;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 3px;
      font-size: 7px;
      vertical-align: middle;
    }

    .country-cell {
      width: 86px;
      font-size: 7px;
    }

    .sticker-cell {
      width: 23px;
      text-align: center;
      line-height: 1.1;
      padding: 2px 1px;
    }

    .sticker-cell strong {
      display: block;
      font-size: 5.8px;
      white-space: nowrap;
      margin-bottom: 1px;
    }

    .sticker-cell span {
      display: block;
      font-size: 5.8px;
      color: #334155;
      white-space: nowrap;
    }

    .missing {
      background: #fee2e2;
      border-color: #ef4444;
    }

    .owned {
      background: #dcfce7;
      border-color: #22c55e;
    }

    .duplicate {
      background: #fed7aa;
      border-color: #ea580c;
    }

    .duplicates-table th,
    .duplicates-table td {
      font-size: 10px;
      padding: 6px;
      text-align: left;
    }

    .legend {
      margin-top: 8px;
      font-size: 9px;
      color: #475569;
    }

    footer {
      margin-top: 10px;
      font-size: 9px;
      color: #475569;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
    }

    @media screen {
      body {
        padding: 16px;
        background: #f8fafc;
      }

      .page {
        background: #ffffff;
        max-width: 210mm;
        margin: 0 auto;
        padding: 9mm;
        box-shadow: 0 10px 30px rgba(15, 23, 42, .12);
      }

      .screen-help {
        display: block;
        margin: 0 auto 12px;
        max-width: 210mm;
        color: #475569;
        font-size: 13px;
      }
    }

    @media print {
      .screen-help {
        display: none;
      }

      .page {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="screen-help">Arquivo de relatório salvo. Para transformar em PDF, abra este arquivo e use a opção de impressão/salvar como PDF.</div>
  <div class="page">
    <header>
      <div>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">${summary ? `${escapeHtml(summary)}<br>` : ""}Gerado em ${escapeHtml(new Date().toLocaleString("pt-BR"))}</div>
      </div>
      ${hideHeaderCredit ? "" : '<div class="credit">Criado por Marcelo Ferreira</div>'}
    </header>

    ${body}

    ${hideLegend ? "" : '<div class="legend">Legenda: vermelho = faltante | verde = Total no álbum | laranja = repetida</div>'}

    <footer>
      <span>Copa 2026</span>
      <strong>Criado por Marcelo Ferreira</strong>
    </footer>
  </div>
</body>
</html>`;
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function buildPrintDocument({ title, summary, body, hideHeaderCredit = false, hideLegend = false }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 9mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 10px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 8px;
    }

    h1 {
      font-size: 17px;
      margin: 0 0 4px;
    }

    .meta {
      font-size: 10px;
      color: #475569;
      line-height: 1.35;
    }

    .credit {
      text-align: right;
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th {
      background: #e2e8f0;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      padding: 4px;
      font-size: 7px;
      text-align: center;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 3px;
      font-size: 7px;
      vertical-align: middle;
    }

    .country-cell {
      width: 72px;
      font-size: 7px;
    }

    .album-range {
      width: 68px;
      font-weight: 700;
      font-size: 7px;
      white-space: nowrap;
    }

    .sticker-cell {
      width: 21px;
      text-align: center;
      line-height: 1.1;
      padding: 2px 1px;
    }

    .sticker-cell strong {
      display: block;
      font-size: 5.8px;
      white-space: nowrap;
      margin-bottom: 1px;
    }

    .sticker-cell span {
      display: block;
      font-size: 5.8px;
      color: #334155;
      white-space: nowrap;
    }

    .missing {
      background: #fee2e2;
      border-color: #ef4444;
    }

    .owned {
      background: #dcfce7;
      border-color: #22c55e;
    }

    .duplicate {
      background: #fed7aa;
      border-color: #ea580c;
    }

    .duplicates-table th,
    .duplicates-table td {
      font-size: 10px;
      padding: 6px;
      text-align: left;
    }

    .legend {
      margin-top: 8px;
      font-size: 9px;
      color: #475569;
    }

    footer {
      margin-top: 10px;
      font-size: 9px;
      color: #475569;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
    }

    @media screen {
      body {
        padding: 16px;
        background: #f8fafc;
      }

      .page {
        background: #ffffff;
        max-width: 210mm;
        margin: 0 auto;
        padding: 9mm;
        box-shadow: 0 10px 30px rgba(15, 23, 42, .12);
      }

      .screen-help {
        display: block;
        margin: 0 auto 12px;
        max-width: 210mm;
        color: #475569;
        font-size: 13px;
      }
    }

    @media print {
      .screen-help {
        display: none;
      }

      .page {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="screen-help">Use a opção de impressão do navegador para salvar como PDF.</div>
  <div class="page">
    <header>
      <div>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">${summary ? `${escapeHtml(summary)}<br>` : ""}Gerado em ${escapeHtml(new Date().toLocaleString("pt-BR"))}</div>
      </div>
      ${hideHeaderCredit ? "" : '<div class="credit">Criado por Marcelo Ferreira</div>'}
    </header>

    ${body}

    ${hideLegend ? "" : '<div class="legend">Legenda: vermelho = faltante | verde = Total no álbum | laranja = repetida</div>'}

    <footer>
      <span>Copa 2026</span>
      <strong>Criado por Marcelo Ferreira</strong>
    </footer>
  </div>
</body>
</html>`;
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
