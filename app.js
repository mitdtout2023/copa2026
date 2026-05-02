const COUNTRIES = [
  "ALG", "ARG", "AUS", "BEL", "BIH", "BRA", "CAN", "CIV", "COL", "CRO",
  "ECU", "ENG", "ESP", "FRA", "FWG", "GER", "GHA", "IRN", "JPN", "KOR",
  "KSA", "MAR", "MEX", "NED", "NOR", "PAN", "POR", "QAT", "RSA", "SCO",
  "SEN", "SUI", "TUN", "URU", "USA", "UZB"
];
const STICKERS_PER_COUNTRY = 20;
const STORAGE_KEY = "figurinhas-copa-2026-state-v1";
const API_KEY_STORAGE = "figurinhas-openai-api-key";

let state = createEmptyState();
let parsedItems = [];
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
    updatedAt: new Date().toISOString(),
    model: "gpt-4.1-mini"
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    fresh.model = saved.model || "gpt-4.1-mini";
    state = fresh;
  } catch (error) {
    console.warn("Não foi possível carregar o estado salvo.", error);
  }
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  state.model = $("modelName")?.value?.trim() || state.model;
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
    option.textContent = country;
    select.appendChild(option);
  }
}

function setupEvents() {
  $("countryFilter").addEventListener("change", renderAlbum);
  $("tapMode").addEventListener("change", renderAlbum);
  $("resetVisibleCountry").addEventListener("click", resetVisibleCountry);
  $("copyMissing").addEventListener("click", () => copyText(buildMissingText()));
  $("copyDuplicates").addEventListener("click", () => copyText(buildDuplicatesText()));
  $("parseManual").addEventListener("click", parseManualText);
  $("analyzeAI").addEventListener("click", analyzeWithOpenAI);
  $("applyParsed").addEventListener("click", applyParsedItems);
  $("clearParsed").addEventListener("click", clearParsed);
  $("exportJson").addEventListener("click", exportJson);
  $("importJson").addEventListener("change", importJson);
  $("resetAll").addEventListener("click", resetAll);
  $("modelName").addEventListener("change", saveState);
  $("saveApiKey").addEventListener("change", persistApiKeyPreference);
  $("apiKey").addEventListener("change", persistApiKeyPreference);
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

  for (const country of COUNTRIES) {
    for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
      const qty = state.inventory[country][number];
      if (qty === 0) missing += 1;
      if (qty >= 1) ownedTypes += 1;
      if (qty > 1) {
        duplicateTypes += 1;
        duplicateExtras += qty - 1;
      }
    }
  }
  return { ownedTypes, missing, duplicateTypes, duplicateExtras };
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

    const header = document.createElement("header");
    header.innerHTML = `<h3>${country}</h3><span class="country-stats">${owned}/${STICKERS_PER_COUNTRY} no álbum • ${dup} extras</span>`;

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

function countDuplicateExtrasByCountry(country) {
  let count = 0;
  for (let number = 1; number <= STICKERS_PER_COUNTRY; number++) {
    const qty = state.inventory[country][number];
    if (qty > 1) count += qty - 1;
  }
  return count;
}

function updateStickerFromTap(country, number) {
  const mode = $("tapMode").value;
  const current = state.inventory[country][number];
  if (mode === "increment") {
    state.inventory[country][number] = current + 1;
  } else if (mode === "decrement") {
    state.inventory[country][number] = Math.max(0, current - 1);
  } else {
    state.inventory[country][number] = current > 0 ? 0 : 1;
  }
  saveState();
  renderAll();
}

function resetVisibleCountry() {
  const selected = $("countryFilter").value;
  if (selected === "ALL") {
    alert("Selecione um país específico para limpar.");
    return;
  }
  if (!confirm(`Limpar todas as figurinhas de ${selected}?`)) return;
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
    const pills = duplicates
      ? values.map((item) => `<span class="pill">${country} ${item.number} • qtd. ${item.qty} • sobra ${item.extra}</span>`).join("")
      : values.map((number) => `<span class="pill">${country} ${number}</span>`).join("");
    card.innerHTML = `<strong>${country}</strong><div class="pill-list">${pills}</div>`;
    container.appendChild(card);
  }
}

function buildMissingText() {
  const map = getMissingMap();
  const lines = Object.entries(map).map(([country, nums]) => `${country} ${nums.join(", ")}`);
  return lines.length ? lines.join("\n") : "Nenhuma figurinha faltante.";
}

function buildDuplicatesText() {
  const map = getDuplicatesMap();
  const lines = Object.entries(map).map(([country, items]) => {
    const values = items.map((item) => `${item.number} (qtd. ${item.qty}, sobra ${item.extra})`).join(", ");
    return `${country} ${values}`;
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
    .replace(/([A-Z]{3})(\d)/g, "$1 $2")
    .replace(/(\d)([A-Z]{3})/g, "$1 $2")
    .replace(/[;|]/g, " ");

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

function parseManualText() {
  const text = $("manualText").value.trim();
  if (!text) {
    alert("Cole uma lista ou texto antes de analisar.");
    return;
  }
  parsedItems = parseStickerText(text);
  updateParsedResult("Texto lido localmente");
}

function updateParsedResult(sourceLabel = "Resultado") {
  const grouped = groupParsedItems(parsedItems);
  const lines = [];
  lines.push(`${sourceLabel}`);
  lines.push(`Total identificado: ${parsedItems.length}`);
  lines.push("");

  if (!parsedItems.length) {
    lines.push("Nenhuma figurinha reconhecida. Use o formato ARG 1, 4, 7 ou envie uma foto mais nítida.");
  } else {
    for (const [country, values] of Object.entries(grouped)) {
      const numbers = values.map((item) => item.qty > 1 ? `${item.number} x${item.qty}` : `${item.number}`).join(", ");
      lines.push(`${country} ${numbers}`);
    }
  }

  $("aiResult").textContent = lines.join("\n");
  $("applyParsed").disabled = parsedItems.length === 0;
}

function groupParsedItems(items) {
  const groups = {};
  for (const item of items) {
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

async function analyzeWithOpenAI() {
  const apiKey = $("apiKey").value.trim();
  const model = $("modelName").value.trim() || "gpt-4.1-mini";
  const files = Array.from($("imageInput").files || []);
  const manualText = $("manualText").value.trim();

  if (!apiKey) {
    alert("Informe sua OpenAI API Key.");
    return;
  }
  if (!files.length && !manualText) {
    alert("Envie pelo menos uma foto ou cole um texto.");
    return;
  }

  persistApiKeyPreference();
  $("analyzeAI").disabled = true;
  $("aiResult").textContent = "Analisando com ChatGPT/OpenAI...";

  try {
    const imageParts = [];
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      imageParts.push({ type: "input_image", image_url: dataUrl });
    }

    const prompt = buildOpenAIPrompt(manualText);
    const body = {
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            ...imageParts
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "figurinhas_identificadas",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    country: { type: "string", enum: COUNTRIES },
                    number: { type: "integer", minimum: 1, maximum: 20 }
                  },
                  required: ["country", "number"]
                }
              },
              notes: { type: "string" }
            },
            required: ["items", "notes"]
          }
        }
      }
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Erro HTTP ${response.status}`);
    }

    const text = extractOutputText(data);
    const parsed = JSON.parse(text);
    parsedItems = (parsed.items || [])
      .filter((item) => COUNTRIES.includes(item.country) && item.number >= 1 && item.number <= STICKERS_PER_COUNTRY)
      .map((item) => ({ country: item.country, number: Number(item.number) }));

    updateParsedResult(`Resultado da IA${parsed.notes ? ` — ${parsed.notes}` : ""}`);
  } catch (error) {
    console.error(error);
    $("aiResult").textContent = `Erro na análise: ${error.message}\n\nAlternativa: cole o texto manualmente no campo acima e toque em “Ler texto localmente”.`;
  } finally {
    $("analyzeAI").disabled = false;
  }
}

function buildOpenAIPrompt(manualText) {
  return `Você é um assistente para controle de figurinhas do álbum Copa 2026.
Identifique apenas figurinhas dos países permitidos e números de 1 a 20.
Países permitidos: ${COUNTRIES.join(", ")}.

Regras:
- Se uma mesma figurinha aparecer repetida, inclua a mesma combinação mais de uma vez em items.
- Use somente o código do país exatamente como listado.
- Ignore números fora de 1 a 20.
- Não invente figurinhas que não estejam visíveis ou no texto.
- Responda somente no JSON estruturado solicitado.

Texto informado pelo usuário:
${manualText || "(sem texto; analisar apenas imagem)"}`;
}

function extractOutputText(responseData) {
  if (responseData.output_text) return responseData.output_text;

  const chunks = [];
  for (const output of responseData.output || []) {
    for (const content of output.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }

  const text = chunks.join("\n").trim();
  if (!text) throw new Error("A resposta da API não retornou texto estruturado.");
  return text;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function applyParsedItems() {
  if (!parsedItems.length) return;
  const mode = $("applyMode").value;
  const grouped = groupParsedItems(parsedItems);

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
  alert("Resultado aplicado ao álbum.");
}

function clearParsed() {
  parsedItems = [];
  $("aiResult").textContent = "Nenhum resultado analisado ainda.";
  $("applyParsed").disabled = true;
}

function persistApiKeyPreference() {
  const shouldSave = $("saveApiKey").checked;
  const key = $("apiKey").value.trim();
  if (shouldSave && key) {
    localStorage.setItem(API_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
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
    fresh.model = imported.model || state.model;
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

function resetAll() {
  if (!confirm("Deseja apagar todas as marcações do álbum?")) return;
  state = createEmptyState();
  saveState();
  clearParsed();
  renderAll();
}

init();
