(() => {
  const PAYMENT_TOKEN_KEY = "xml_unlock_token";
  const PAYMENT_DRAFT_KEY = "xml_checkout_draft_v2";
  const FILE_DESCRIPTION_MAX_LENGTH = 25;
  const FILE_DESCRIPTION_PATTERN = /^[A-Za-z0-9]{1,25}$/;
  const FILE_PIVA_PATTERN = /^[A-Za-z0-9]+$/;
  const FILE_ACTIONS = new Set(["INSERIMENTO", "AGGIORNAMENTO"]);
  const FORMAT_VERSIONS = new Set(["01", "02"]);
  const FLOW_CODES = {
    INSERIMENTO: "0050",
    AGGIORNAMENTO: "0051",
  };
  const EURO_LABEL = `10${String.fromCharCode(8364)}`;

  const formEl = document.getElementById("builder-form");
  const outputEl = document.getElementById("xml-output");
  const generateBtn = document.getElementById("btn-generate");
  const originalDownloadBtn = document.getElementById("btn-download");
  const fileActionEl = document.getElementById("file-action");
  const fileVersionEl = document.getElementById("file-version");
  const fileDescriptionEl = document.getElementById("file-description");
  const zipDescriptionEl = document.getElementById("zip-description");
  const messagesEl = document.getElementById("messages");
  const outputPanelEl = document.querySelector(".output-panel");
  const oldPaywallEl = document.getElementById("payment-gate");

  if (!formEl || !outputEl || !generateBtn || !originalDownloadBtn || !outputPanelEl) {
    return;
  }

  let unlockToken = sessionStorage.getItem(PAYMENT_TOKEN_KEY) || "";
  let zipReady = false;
  let preparedPayload = null;

  injectStyles();
  disableLegacyPaywall();
  enableUsageMode();

  const prepareBtn = replaceDownloadButton();
  const checkoutPanel = createCheckoutPanel();
  const checkoutBtn = checkoutPanel.querySelector("#btn-final-checkout");
  const checkoutStatusEl = checkoutPanel.querySelector("#final-checkout-status");
  const checkoutHeadingEl = checkoutPanel.querySelector("#final-checkout-heading");
  const checkoutTextEl = checkoutPanel.querySelector("#final-checkout-text");

  restoreDraft();

  formEl.addEventListener("input", handleFormChange);
  formEl.addEventListener("change", handleFormChange);
  fileActionEl.addEventListener("change", handleFormChange);
  fileVersionEl.addEventListener("change", handleFormChange);
  prepareBtn.addEventListener("click", prepareZip);
  checkoutBtn.addEventListener("click", handleCheckoutOrDownload);

  const paymentParams = new URLSearchParams(window.location.search);
  if (paymentParams.get("payment") === "success") {
    showPageMessage("success", "Pagamento confermato. Il pulsante finale ora permette di scaricare il file.");
    setCheckoutStatus("Pagamento confermato. Scarica ora il file finale.", "success");
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (paymentParams.get("payment") === "cancelled") {
    showPageMessage("error", "Pagamento annullato. Il file resta pronto per un nuovo tentativo.");
    setCheckoutStatus("Pagamento annullato. Puoi riprovare dal pulsante finale.", "accent");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  updateCheckoutPanel(Boolean(paymentParams.get("payment")));

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .payment-gate { display: none !important; }
      #final-checkout-panel {
        margin-top: 18px;
        padding: 22px;
        border: 1px solid rgba(0, 74, 152, 0.12);
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(239, 245, 252, 0.98));
        box-shadow: 0 12px 28px rgba(15, 34, 56, 0.06);
        display: grid;
        gap: 18px;
      }
      #final-checkout-panel[data-state="ready"] {
        border-color: rgba(255, 140, 0, 0.24);
        background: linear-gradient(180deg, rgba(255, 249, 241, 0.99), rgba(255, 242, 221, 0.97));
      }
      #final-checkout-panel[data-state="unlocked"] {
        border-color: rgba(33, 122, 75, 0.22);
        background: linear-gradient(180deg, rgba(237, 249, 243, 0.99), rgba(231, 246, 237, 0.97));
      }
      .final-checkout-eyebrow {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #004a98;
      }
      #final-checkout-heading {
        margin: 0 0 10px;
        font-size: 1.35rem;
        color: #0d3768;
      }
      #final-checkout-text,
      #final-checkout-status {
        margin: 0;
        line-height: 1.6;
      }
      #final-checkout-text {
        color: #637a92;
      }
      .final-checkout-actions {
        display: grid;
        gap: 12px;
      }
      #btn-final-checkout {
        width: 100%;
        min-height: 48px;
        border: 1px solid #c96c00;
        border-radius: 16px;
        background: linear-gradient(180deg, #ffa12f 0%, #e67e00 100%);
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      #final-checkout-panel[data-state="idle"] #btn-final-checkout {
        background: linear-gradient(180deg, #dde5ef 0%, #ced9e7 100%);
        border-color: rgba(0, 74, 152, 0.12);
        color: #6a7f96;
      }
      #final-checkout-panel[data-state="unlocked"] #btn-final-checkout {
        background: linear-gradient(180deg, #0d5db8 0%, #004a98 100%);
        border-color: #003f82;
      }
      #btn-final-checkout:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }
      #final-checkout-status {
        min-height: 24px;
        font-weight: 700;
        color: #0d3768;
      }
      #final-checkout-status[data-tone="accent"] { color: #8a4b00; }
      #final-checkout-status[data-tone="success"] { color: #217a4b; }
      #final-checkout-status[data-tone="muted"] { color: #637a92; }
    `;
    document.head.appendChild(style);
  }

  function disableLegacyPaywall() {
    if (oldPaywallEl) {
      oldPaywallEl.hidden = true;
      oldPaywallEl.style.display = "none";
      oldPaywallEl.setAttribute("aria-hidden", "true");
    }
  }

  function enableUsageMode() {
    const controls = [
      fileActionEl,
      fileVersionEl,
      generateBtn,
      originalDownloadBtn,
      document.getElementById("btn-reset"),
      ...formEl.querySelectorAll("input, textarea, select, button"),
    ];

    controls.forEach((control) => {
      if (!control || control === fileDescriptionEl || control === zipDescriptionEl) {
        return;
      }
      control.disabled = false;
    });
  }

  function replaceDownloadButton() {
    const replacement = originalDownloadBtn.cloneNode(true);
    replacement.textContent = "Genera ZIP";
    originalDownloadBtn.replaceWith(replacement);
    return replacement;
  }

  function createCheckoutPanel() {
    const panel = document.createElement("section");
    panel.id = "final-checkout-panel";
    panel.dataset.state = "idle";
    panel.innerHTML = `
      <div class="final-checkout-copy">
        <p class="final-checkout-eyebrow">Download finale</p>
        <h3 id="final-checkout-heading">Ultimo passaggio</h3>
        <p id="final-checkout-text">Compila la maschera e premi Genera ZIP per preparare il file finale. Il pagamento viene richiesto solo al momento del download.</p>
      </div>
      <div class="final-checkout-actions">
        <button id="btn-final-checkout" type="button" disabled>Paga ${EURO_LABEL} per scaricare il file</button>
        <p id="final-checkout-status" data-tone="muted">Il pulsante finale si attiva solo dopo la generazione del ZIP.</p>
      </div>
    `;
    outputPanelEl.appendChild(panel);
    return panel;
  }

  function handleFormChange() {
    updateDescriptionPreviews();
    invalidatePreparedZip("Hai modificato la maschera. Premi di nuovo Genera ZIP per aggiornare il file finale.");
  }

  function prepareZip() {
    generateBtn.click();
    const xml = String(outputEl.value || "").trim();
    if (!xml) {
      invalidatePreparedZip();
      updateCheckoutPanel();
      return;
    }

    preparedPayload = collectPreparedPayload(xml);
    if (!preparedPayload) {
      invalidatePreparedZip();
      return;
    }

    zipReady = true;
    saveDraft(preparedPayload);
    updateCheckoutPanel();

    if (unlockToken) {
      showPageMessage("success", "ZIP pronto. Il pagamento risulta gia registrato.");
      setCheckoutStatus("Pagamento gia registrato. Ora puoi scaricare il file finale.", "success");
    } else {
      showPageMessage("success", `ZIP pronto. Completa il pagamento di ${EURO_LABEL} con il pulsante finale per scaricare il file.`);
      setCheckoutStatus("ZIP pronto per il pagamento finale su Stripe.", "accent");
    }

    updateCheckoutPanel(true);
    checkoutPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function handleCheckoutOrDownload() {
    if (!zipReady || !preparedPayload) {
      showPageMessage("error", "Premi prima Genera ZIP per preparare il file finale.");
      updateCheckoutPanel();
      return;
    }

    if (unlockToken) {
      await downloadPreparedZip();
      return;
    }

    checkoutBtn.disabled = true;
    setCheckoutStatus("Reindirizzamento a Stripe in corso...", "accent");

    try {
      saveDraft(preparedPayload);
      const response = await fetch("./api/create-checkout-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.message || "Impossibile creare la sessione di pagamento.");
      }
      window.location.href = payload.url;
    } catch (error) {
      setCheckoutStatus(error.message || "Impossibile avviare il pagamento.", "accent");
      updateCheckoutPanel(true);
    }
  }

  async function downloadPreparedZip() {
    const xml = String(preparedPayload && preparedPayload.xml ? preparedPayload.xml : outputEl.value || "").trim();
    if (!xml) {
      invalidatePreparedZip("Il file finale non e piu disponibile. Premi di nuovo Genera ZIP.");
      return;
    }

    const names = buildDownloadNames(preparedPayload);
    if (!names) {
      return;
    }

    const response = await fetch("./api/consume-access", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        accessToken: unlockToken,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      unlockToken = "";
      sessionStorage.removeItem(PAYMENT_TOKEN_KEY);
      showPageMessage("error", payload.message || "Il pagamento non risulta piu disponibile.");
      updateCheckoutPanel();
      return;
    }

    const blob = createZipBlob(names.xmlFileName, xml);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = names.zipFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    unlockToken = "";
    sessionStorage.removeItem(PAYMENT_TOKEN_KEY);
    zipReady = false;
    preparedPayload = null;
    sessionStorage.removeItem(PAYMENT_DRAFT_KEY);
    showPageMessage("success", `ZIP generato: ${names.zipFileName}`);
    setCheckoutStatus("Download completato. Per un nuovo ZIP sara richiesto un nuovo pagamento.", "muted");
    updateCheckoutPanel(true);
  }

  function collectPreparedPayload(xml) {
    const payload = {
      xml,
      piva: readFieldValue("PIVA_UTENTE"),
      codOfferta: readFieldValue("COD_OFFERTA"),
      offerName: readFieldValue("NOME_OFFERTA"),
      action: String(fileActionEl.value || "").trim().toUpperCase(),
      version: String(fileVersionEl.value || "").trim(),
    };

    updateDescriptionPreviews(payload.offerName);
    return payload;
  }

  function readFieldValue(key) {
    const node = formEl.querySelector(`[data-key="${key}"]`);
    const input = node ? node.querySelector("input, textarea, select") : null;
    return input ? String(input.value || "").trim() : "";
  }

  function updateDescriptionPreviews(offerName = readFieldValue("NOME_OFFERTA")) {
    const description = buildFileDescription(offerName);
    if (fileDescriptionEl) {
      fileDescriptionEl.value = description;
    }
    if (zipDescriptionEl) {
      zipDescriptionEl.value = description;
    }
  }

  function invalidatePreparedZip(reason = "") {
    if (!zipReady && !preparedPayload) {
      return;
    }

    zipReady = false;
    preparedPayload = null;
    sessionStorage.removeItem(PAYMENT_DRAFT_KEY);
    updateCheckoutPanel(Boolean(reason));
    if (reason) {
      setCheckoutStatus(reason, "muted");
    }
  }

  function saveDraft(payload) {
    sessionStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(payload));
  }

  function restoreDraft() {
    const raw = sessionStorage.getItem(PAYMENT_DRAFT_KEY);
    if (!raw) {
      return;
    }

    try {
      preparedPayload = JSON.parse(raw);
      if (!preparedPayload || !preparedPayload.xml) {
        throw new Error("draft_missing");
      }
      zipReady = true;
      outputEl.value = preparedPayload.xml;
      if (FILE_ACTIONS.has(preparedPayload.action)) {
        fileActionEl.value = preparedPayload.action;
      }
      if (FORMAT_VERSIONS.has(preparedPayload.version)) {
        fileVersionEl.value = preparedPayload.version;
      }
      updateDescriptionPreviews(preparedPayload.offerName);
    } catch {
      preparedPayload = null;
      zipReady = false;
      sessionStorage.removeItem(PAYMENT_DRAFT_KEY);
    }
  }

  function updateCheckoutPanel(preserveStatus = false) {
    let state = "idle";
    let heading = "Ultimo passaggio";
    let text = "Compila la maschera e premi Genera ZIP per preparare il file finale. Il pagamento viene richiesto solo al momento del download.";
    let buttonText = `Paga ${EURO_LABEL} per scaricare il file`;
    let buttonDisabled = true;
    let statusText = "Il pulsante finale si attiva solo dopo la generazione del ZIP.";
    let statusTone = "muted";

    if (zipReady && unlockToken) {
      state = "unlocked";
      heading = "Pagamento confermato";
      text = "Il file e pronto. Usa il pulsante qui sotto per scaricare un solo ZIP con il pagamento gia registrato.";
      buttonText = "Scarica ZIP ora";
      buttonDisabled = false;
      statusText = "Download sbloccato per un solo utilizzo.";
      statusTone = "success";
    } else if (zipReady) {
      state = "ready";
      heading = "ZIP pronto al pagamento";
      text = `Il file e pronto. Completa il pagamento di ${EURO_LABEL} per scaricare lo ZIP finale.`;
      buttonText = `Paga ${EURO_LABEL} per scaricare il file`;
      buttonDisabled = false;
      statusText = "Ultimo passaggio: pagamento Stripe prima del download.";
      statusTone = "accent";
    } else if (unlockToken) {
      state = "unlocked";
      heading = "Pagamento confermato";
      text = "Hai gia un utilizzo disponibile. Premi Genera ZIP per preparare il file finale e poi scaricarlo.";
      buttonText = "Scarica ZIP ora";
      buttonDisabled = true;
      statusText = "Pagamento registrato. Genera prima il ZIP finale.";
      statusTone = "success";
    }

    checkoutPanel.dataset.state = state;
    checkoutHeadingEl.textContent = heading;
    checkoutTextEl.textContent = text;
    checkoutBtn.textContent = buttonText;
    checkoutBtn.disabled = buttonDisabled;

    if (!preserveStatus) {
      setCheckoutStatus(statusText, statusTone);
    }
  }

  function setCheckoutStatus(text, tone) {
    checkoutStatusEl.textContent = text || "";
    checkoutStatusEl.dataset.tone = tone || "muted";
  }

  function buildDownloadNames(payload) {
    const errors = [];
    const xmlDescription = buildFileDescription(payload.offerName);
    const flowCode = FLOW_CODES[payload.action] || "";

    if (!payload.piva) {
      errors.push("PIVA_UTENTE: obbligatoria per nominare il file.");
    } else if (!FILE_PIVA_PATTERN.test(payload.piva)) {
      errors.push("PIVA_UTENTE: sono ammessi solo caratteri alfanumerici nel nome file.");
    }

    if (!FILE_ACTIONS.has(payload.action)) {
      errors.push("AZIONE: selezionare INSERIMENTO oppure AGGIORNAMENTO.");
    }

    if (!FORMAT_VERSIONS.has(payload.version)) {
      errors.push("VERSIONE_FORMATO_FILE: selezionare 01 oppure 02.");
    }

    if (!payload.codOfferta) {
      errors.push("COD_OFFERTA: obbligatorio per nominare l'XML interno allo ZIP.");
    } else if (!/^[A-Za-z0-9]{32}$/.test(payload.codOfferta)) {
      errors.push("COD_OFFERTA: per il nome dell'XML interno deve contenere esattamente 32 caratteri alfanumerici.");
    }

    if (!payload.offerName) {
      errors.push("NOME_OFFERTA: obbligatorio per creare la DESCRIZIONE del nome file.");
    } else if (!xmlDescription) {
      errors.push("DESCRIZIONE file: il NOME_OFFERTA deve contenere almeno un carattere alfanumerico.");
    } else if (!FILE_DESCRIPTION_PATTERN.test(xmlDescription)) {
      errors.push("DESCRIZIONE file: massimo 25 caratteri alfanumerici, senza spazi e senza underscore.");
    }

    if (errors.length) {
      showPageMessage("error", "Controlla il nome dei file prima di scaricare lo ZIP.", errors);
      return null;
    }

    return {
      xmlFileName: `${buildCpUtente()}_${payload.codOfferta}_${xmlDescription}.XML`,
      zipFileName: `${payload.piva}_TO2_${flowCode}_${payload.version}_${xmlDescription}.ZIP`,
    };
  }

  function buildCpUtente(date = new Date()) {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}0`;
  }

  function buildFileDescription(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, FILE_DESCRIPTION_MAX_LENGTH);
  }

  function createZipBlob(fileName, content) {
    const encoder = new TextEncoder();
    const fileNameBytes = encoder.encode(fileName);
    const dataBytes = encoder.encode(content);
    const crc = crc32(dataBytes);
    const { dosDate, dosTime } = getDosDateTime(new Date());
    const localHeader = new ArrayBuffer(30 + fileNameBytes.length);
    const localView = new DataView(localHeader);
    const localBytes = new Uint8Array(localHeader);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, fileNameBytes.length, true);
    localView.setUint16(28, 0, true);
    localBytes.set(fileNameBytes, 30);

    const centralHeader = new ArrayBuffer(46 + fileNameBytes.length);
    const centralView = new DataView(centralHeader);
    const centralBytes = new Uint8Array(centralHeader);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, fileNameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, 0, true);
    centralBytes.set(fileNameBytes, 46);

    const endRecord = new ArrayBuffer(22);
    const endView = new DataView(endRecord);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, 1, true);
    endView.setUint16(10, 1, true);
    endView.setUint32(12, centralHeader.byteLength, true);
    endView.setUint32(16, localHeader.byteLength + dataBytes.length, true);
    endView.setUint16(20, 0, true);

    return new Blob([localHeader, dataBytes, centralHeader, endRecord], { type: "application/zip" });
  }

  function getDosDateTime(date) {
    const year = Math.max(1980, date.getFullYear());
    return {
      dosTime: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      dosDate: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    };
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function showPageMessage(type, text, details = []) {
    if (!messagesEl) {
      return;
    }

    messagesEl.className = `messages is-visible ${type}`;
    let html = `<strong>${escapeHtml(text)}</strong>`;
    if (details.length) {
      html += "<ul>" + details.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("") + "</ul>";
    }
    messagesEl.innerHTML = html;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const CRC32_TABLE = (() => {
    const table = [];
    for (let i = 0; i < 256; i += 1) {
      let value = i;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      table.push(value >>> 0);
    }
    return table;
  })();
})();
