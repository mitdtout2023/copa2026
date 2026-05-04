/**
 * Copa 2026 - Backend de sincronização compatível com Vercel/iPhone
 *
 * IMPORTANTE:
 * 1. Publique como Web App.
 * 2. Executar como: você.
 * 3. Quem tem acesso: qualquer pessoa com o link.
 * 4. Use a URL terminada em /exec.
 */

function doPost(e) {
  try {
    var raw = "";
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }

    var body = JSON.parse(raw || "{}");
    var action = body.action;
    var syncId = String(body.syncId || "").trim();
    var requestId = String(body.requestId || "");

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
        requestId: requestId,
        version: version,
        updatedAt: version
      }));

      return jsonOutput({ ok: true, version: version, type: "text", requestId: requestId });
    }

    if (action === "pushState") {
      if (!body.state || !body.state.inventory) {
        return jsonOutput({ ok: false, error: "Estado do álbum obrigatório." });
      }

      props.setProperty("sync:" + syncId, JSON.stringify({
        type: "state",
        text: "",
        state: body.state,
        requestId: requestId,
        version: version,
        updatedAt: version
      }));

      return jsonOutput({ ok: true, version: version, type: "state", requestId: requestId });
    }

    return jsonOutput({ ok: false, error: "Ação inválida." });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var callback = "";
  try {
    var syncId = String((e.parameter && e.parameter.syncId) || "").trim();
    callback = String((e.parameter && e.parameter.callback) || "").trim();

    if (!syncId) {
      return outputResponse({ ok: false, error: "syncId obrigatório." }, callback);
    }

    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty("sync:" + syncId);

    if (!raw) {
      return outputResponse({
        ok: true,
        type: "",
        text: "",
        state: null,
        requestId: "",
        version: "",
        updatedAt: ""
      }, callback);
    }

    var data = JSON.parse(raw);

    return outputResponse({
      ok: true,
      type: data.type || "",
      text: data.text || "",
      state: data.state || null,
      requestId: data.requestId || "",
      version: data.version || "",
      updatedAt: data.updatedAt || ""
    }, callback);
  } catch (err) {
    return outputResponse({ ok: false, error: String(err) }, callback);
  }
}

function outputResponse(obj, callback) {
  if (callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(obj) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return jsonOutput(obj);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
