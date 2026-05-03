/**
 * Copa 2026 - Backend simples de sincronização
 *
 * Como usar:
 * 1. Crie um projeto no Google Apps Script.
 * 2. Cole este código em Code.gs.
 * 3. Faça Deploy > Web app.
 * 4. Execute como: você.
 * 5. Quem tem acesso: qualquer pessoa com o link.
 * 6. Copie a URL /exec e cole no app no campo "URL do Google Apps Script".
 */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var action = body.action;
    var syncId = String(body.syncId || "").trim();

    if (!syncId) {
      return jsonOutput({ ok: false, error: "syncId obrigatório." });
    }

    var version = new Date().toISOString();
    var props = PropertiesService.getScriptProperties();

    if (action === "push") {
      var text = String(body.text || "");

      if (!text) {
        return jsonOutput({ ok: false, error: "Texto obrigatório." });
      }

      props.setProperty("sync:" + syncId, JSON.stringify({
        type: "text",
        text: text,
        state: null,
        version: version,
        updatedAt: version
      }));

      return jsonOutput({ ok: true, version: version, type: "text" });
    }

    if (action === "pushState") {
      if (!body.state || !body.state.inventory) {
        return jsonOutput({ ok: false, error: "Estado do álbum obrigatório." });
      }

      props.setProperty("sync:" + syncId, JSON.stringify({
        type: "state",
        text: "",
        state: body.state,
        version: version,
        updatedAt: version
      }));

      return jsonOutput({ ok: true, version: version, type: "state" });
    }

    return jsonOutput({ ok: false, error: "Ação inválida." });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    var syncId = String((e.parameter && e.parameter.syncId) || "").trim();

    if (!syncId) {
      return jsonOutput({ ok: false, error: "syncId obrigatório." });
    }

    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty("sync:" + syncId);

    if (!raw) {
      return jsonOutput({
        ok: true,
        type: "",
        text: "",
        state: null,
        version: "",
        updatedAt: ""
      });
    }

    var data = JSON.parse(raw);

    return jsonOutput({
      ok: true,
      type: data.type || "",
      text: data.text || "",
      state: data.state || null,
      version: data.version || "",
      updatedAt: data.updatedAt || ""
    });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
