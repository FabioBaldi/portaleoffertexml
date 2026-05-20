(() => {
  const NS = "http://www.acquirenteunico.it/schemas/SII_AU/OffertaRetail/01";
  const XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";

  const formEl = document.getElementById("builder-form");
  const outputEl = document.getElementById("xml-output");
  const importEl = document.getElementById("xml-import");
  const fileActionEl = document.getElementById("file-action");
  const fileVersionEl = document.getElementById("file-version");
  const fileDescriptionEl = document.getElementById("file-description");
  const zipDescriptionEl = document.getElementById("zip-description");
  const generateBtn = document.getElementById("btn-generate");
  const downloadBtn = document.getElementById("btn-download");
  const resetBtn = document.getElementById("btn-reset");
  const messagesEl = document.getElementById("messages");
  const checkoutPanelEl = document.getElementById("checkout-panel");
  const checkoutHeadingEl = document.getElementById("checkout-heading");
  const checkoutTextEl = document.getElementById("checkout-text");
  const checkoutStatusEl = document.getElementById("checkout-status");
  const startCheckoutBtn = document.getElementById("btn-start-checkout");
  const checkoutModalEl = document.getElementById("checkout-modal");
  const checkoutModalHeadingEl = document.getElementById("checkout-modal-heading");
  const checkoutModalTextEl = document.getElementById("checkout-modal-text");
  const checkoutModalStatusEl = document.getElementById("checkout-modal-status");
  const startCheckoutModalBtn = document.getElementById("btn-start-checkout-modal");
  const closeCheckoutModalBtn = document.getElementById("checkout-modal-close");

  const option = (value, label) => ({ value, label });
  const FILE_DESCRIPTION_PATTERN = /^[A-Za-z0-9]{1,25}$/;
  const FILE_PIVA_PATTERN = /^[A-Za-z0-9]+$/;
  const FILE_ACTIONS = new Set(["INSERIMENTO", "AGGIORNAMENTO"]);
  const FILE_DESCRIPTION_MAX_LENGTH = 25;
  const FLOW_CODES = {
    INSERIMENTO: "0050",
    AGGIORNAMENTO: "0051",
  };
  const FORMAT_VERSIONS = new Set(["01", "02"]);
  const PAYMENT_TOKEN_KEY = "xml_unlock_token";
  const PAYMENT_DRAFT_KEY = "xml_checkout_draft";
  const PAYMENT_AMOUNT_LABEL = "10\u20AC";

  let unlockToken = sessionStorage.getItem(PAYMENT_TOKEN_KEY) || "";
  let zipReady = false;

  const MONTH_OPTIONS = [
    option("01", "01 - Gennaio"),
    option("02", "02 - Febbraio"),
    option("03", "03 - Marzo"),
    option("04", "04 - Aprile"),
    option("05", "05 - Maggio"),
    option("06", "06 - Giugno"),
    option("07", "07 - Luglio"),
    option("08", "08 - Agosto"),
    option("09", "09 - Settembre"),
    option("10", "10 - Ottobre"),
    option("11", "11 - Novembre"),
    option("12", "12 - Dicembre"),
  ];

  const OPTIONS = {
    tipoMercato: [
      option("01", "01 - Elettrico"),
      option("02", "02 - Gas"),
      option("03", "03 - Dual Fuel"),
    ],
    offertaSingola: [
      option("SI", "SI - sottoscrivibile singolarmente"),
      option("NO", "NO - solo in abbinamento"),
    ],
    tipoCliente: [
      option("01", "01 - Domestico"),
      option("02", "02 - Altri Usi"),
      option("03", "03 - Condominio uso domestico (Gas)"),
    ],
    domesticoResidente: [
      option("01", "01 - Domestico residente"),
      option("02", "02 - Domestico non residente"),
      option("03", "03 - Tutte"),
    ],
    tipoOfferta: [
      option("01", "01 - Fisso"),
      option("02", "02 - Variabile"),
      option("03", "03 - FLAT"),
      option("04", "04 - Mista"),
    ],
    offertaOnnicomprensiva: [
      option("01", "01 - Offerta onnicomprensiva"),
      option("02", "02 - Offerta onnicomprensiva a canone"),
    ],
    tipologiaAttContr: [
      option("01", "01 - Cambio Fornitore"),
      option("02", "02 - Prima Attivazione"),
      option("03", "03 - Riattivazione"),
      option("04", "04 - Voltura"),
      option("99", "99 - Sempre"),
    ],
    modalitaAttivazione: [
      option("01", "01 - Solo web"),
      option("02", "02 - Qualsiasi canale"),
      option("03", "03 - Punto vendita"),
      option("04", "04 - Teleselling"),
      option("05", "05 - Agenzia"),
      option("99", "99 - Altro"),
    ],
    idxPrezzoEnergia: [
      option("01", "01 - PUN Index GME trimestrale"),
      option("02", "02 - TTF trimestrale"),
      option("03", "03 - PSV trimestrale"),
      option("04", "04 - Psbil trimestrale"),
      option("05", "05 - PE trimestrale"),
      option("06", "06 - Cmem mensile"),
      option("07", "07 - Pfor trimestrale"),
      option("08", "08 - PUN Index GME bimestrale"),
      option("09", "09 - TTF bimestrale"),
      option("10", "10 - PSV bimestrale"),
      option("11", "11 - Psbil bimestrale"),
      option("12", "12 - PUN Index GME mensile"),
      option("13", "13 - TTF mensile"),
      option("14", "14 - PSV mensile"),
      option("15", "15 - Psbil mensile"),
      option("99", "99 - Altro"),
    ],
    fasciaPrezzo: [
      option("01", "01 - Monorario/F1"),
      option("02", "02 - F2"),
      option("03", "03 - F3"),
      option("04", "04 - F4"),
      option("05", "05 - F5"),
      option("06", "06 - F6"),
      option("07", "07 - Peak"),
      option("08", "08 - OffPeak"),
      option("91", "91 - F2+F3"),
      option("92", "92 - F1+F3"),
      option("93", "93 - F1+F2"),
    ],
    modalitaPagamento: [
      option("01", "01 - Domiciliazione bancaria"),
      option("02", "02 - Domiciliazione postale"),
      option("03", "03 - Domiciliazione carta di credito"),
      option("04", "04 - Bollettino precompilato"),
      option("99", "99 - Altro"),
    ],
    componentiRegolateCodice: [
      option("01", "01 - PCV"),
      option("02", "02 - PPE"),
      option("03", "03 - CCR"),
      option("04", "04 - CPR"),
      option("05", "05 - GRAD"),
      option("06", "06 - QTint"),
      option("07", "07 - QTpsv"),
      option("09", "09 - QVD_fissa"),
      option("10", "10 - QVD_variabile"),
    ],
    tipologiaFasce: [
      option("01", "01 - Monorario"),
      option("02", "02 - F1, F2"),
      option("03", "03 - F1, F2, F3"),
      option("04", "04 - F1, F2, F3, F4"),
      option("05", "05 - F1, F2, F3, F4, F5"),
      option("06", "06 - F1, F2, F3, F4, F5, F6"),
      option("07", "07 - Peak / OffPeak"),
    ],
    tipoDispacciamento: [
      option("01", "01 - Corrispettivo Dispacciamento"),
      option("02", "02 - PD"),
      option("09", "09 - Corrispettivo Capacita STG"),
      option("10", "10 - Corrispettivo capacita MT"),
      option("11", "11 - Reintegrazione oneri salvaguardia"),
      option("12", "12 - Reintegrazione oneri tutele graduali"),
      option("13", "13 - DispBT"),
      option("14", "14 - CdispD"),
      option("99", "99 - Altro"),
    ],
    tipologiaComponenteImpresa: [
      option("01", "01 - STANDARD"),
      option("02", "02 - OPZIONALE"),
    ],
    macroareaComponenteImpresa: [
      option("01", "01 - Commercializzazione quota fissa"),
      option("02", "02 - Commercializzazione quota energia"),
      option("04", "04 - Prezzo quota energia"),
      option("05", "05 - Una Tantum"),
      option("06", "06 - FER / Energia Verde"),
    ],
    fasciaComponente: [
      option("01", "01 - Monorario/F1"),
      option("02", "02 - F2"),
      option("03", "03 - F3"),
      option("04", "04 - F4"),
      option("05", "05 - F5"),
      option("06", "06 - F6"),
      option("07", "07 - Peak"),
      option("08", "08 - OffPeak"),
      option("91", "91 - F2+F3"),
      option("92", "92 - F1+F3"),
      option("93", "93 - F1+F2"),
    ],
    unitaMisuraPrezzo: [
      option("01", "01 - /Anno"),
      option("02", "02 - /kW"),
      option("03", "03 - /kWh"),
      option("04", "04 - /Smc"),
      option("06", "06 - Percentuale"),
    ],
    tipoPrezzo: [
      option("01", "01 - Fisso"),
      option("02", "02 - Variabile"),
    ],
    tipologiaCondizione: [
      option("01", "01 - Attivazione"),
      option("02", "02 - Disattivazione"),
      option("03", "03 - Recesso"),
      option("04", "04 - Offerta pluriennale"),
      option("05", "05 - Oneri recesso anticipato"),
      option("99", "99 - Altro"),
    ],
    limitante: [
      option("01", "01 - Si, e limitante"),
      option("02", "02 - No, non e limitante"),
    ],
    codiceComponenteFascia: [
      option("01", "01 - PCV"),
      option("02", "02 - PPE"),
      option("03", "03 - CCR"),
      option("04", "04 - CPR"),
      option("05", "05 - GRAD"),
      option("06", "06 - QTint"),
      option("07", "07 - QTpsv"),
      option("09", "09 - QVD_fissa"),
      option("10", "10 - QVD_variabile"),
      option("11", "11 - F1"),
      option("12", "12 - F2"),
      option("13", "13 - F3"),
      option("14", "14 - F4"),
      option("15", "15 - F5"),
      option("16", "16 - F6"),
      option("17", "17 - Peak"),
      option("18", "18 - OffPeak"),
      option("91", "91 - F2+F3"),
      option("92", "92 - F1+F3"),
      option("93", "93 - F1+F2"),
    ],
    validitaSconto: [
      option("01", "01 - Ingresso"),
      option("02", "02 - Entro 12 mesi"),
      option("03", "03 - Oltre 12 mesi"),
    ],
    ivaSconto: [
      option("01", "01 - SI"),
      option("02", "02 - NO"),
    ],
    condizioneApplicazione: [
      option("00", "00 - Non condizionato"),
      option("01", "01 - Fatturazione elettronica"),
      option("02", "02 - Gestione online"),
      option("03", "03 - Fatturazione elettronica + domiciliazione bancaria"),
      option("99", "99 - Altro"),
    ],
    tipologiaSconto: [
      option("01", "01 - Sconto fisso"),
      option("02", "02 - Sconto Potenza"),
      option("03", "03 - Sconto Vendita"),
      option("04", "04 - Sconto su tutela"),
    ],
    unitaMisuraPrezzoSconto: [
      option("01", "01 - /Anno"),
      option("02", "02 - /kW"),
      option("03", "03 - /kWh"),
      option("04", "04 - /Smc"),
      option("06", "06 - Percentuale"),
    ],
    macroareaServizio: [
      option("01", "01 - Caldaia"),
      option("02", "02 - Mobility"),
      option("03", "03 - Solare termico"),
      option("04", "04 - Fotovoltaico"),
      option("05", "05 - Climatizzazione"),
      option("06", "06 - Polizza assicurativa"),
      option("99", "99 - Altro"),
    ],
  };

  const SCHEMA = {
    kind: "group",
    key: "root",
    xmlTag: "Offerta",
    open: true,
    children: [
      {
        kind: "group",
        key: "identificativiOfferta",
        title: "Identificativi Offerta",
        xmlTag: "IdentificativiOfferta",
        required: true,
        open: true,
        children: [
          {
            kind: "field",
            key: "PIVA_UTENTE",
            xmlTag: "PIVA_UTENTE",
            label: "Partita IVA utente",
            widget: "text",
            required: true,
            note: "Campo obbligatorio.",
          },
          {
            kind: "field",
            key: "COD_OFFERTA",
            xmlTag: "COD_OFFERTA",
            label: "Codice offerta",
            widget: "text",
            required: true,
            maxLength: 32,
            pattern: /^[A-Za-z0-9]+$/,
            patternMessage: "Codice offerta: sono ammessi solo lettere e numeri, senza spazi o caratteri speciali.",
            note: "Campo obbligatorio. Massimo 32 caratteri; solo lettere e numeri.",
          },
        ],
      },
      {
        kind: "group",
        key: "dettaglioOfferta",
        title: "Dettaglio Offerta",
        xmlTag: "DettaglioOfferta",
        required: true,
        open: true,
        children: [
          {
            kind: "field",
            key: "TIPO_MERCATO",
            xmlTag: "TIPO_MERCATO",
            label: "Tipo mercato",
            widget: "select",
            required: true,
            options: OPTIONS.tipoMercato,
          },
          {
            kind: "field",
            key: "OFFERTA_SINGOLA",
            xmlTag: "OFFERTA_SINGOLA",
            label: "Offerta singola",
            widget: "select",
            requiredWhen: (root, local) => local.TIPO_MERCATO && local.TIPO_MERCATO !== "03",
            note: "Obbligatorio se TIPO_MERCATO diverso da 03.",
            options: OPTIONS.offertaSingola,
          },
          {
            kind: "field",
            key: "TIPO_CLIENTE",
            xmlTag: "TIPO_CLIENTE",
            label: "Tipo cliente",
            widget: "select",
            required: true,
            options: OPTIONS.tipoCliente,
          },
          {
            kind: "field",
            key: "DOMESTICO_RESIDENTE",
            xmlTag: "DOMESTICO_RESIDENTE",
            label: "Domestico residente",
            widget: "select",
            note: "Compilare se utile per cliente domestico.",
            options: OPTIONS.domesticoResidente,
          },
          {
            kind: "field",
            key: "TIPO_OFFERTA",
            xmlTag: "TIPO_OFFERTA",
            label: "Tipo offerta",
            widget: "select",
            required: true,
            options: OPTIONS.tipoOfferta,
          },
          {
            kind: "field",
            key: "OFFERTA_ONNICOMPRENSIVA",
            xmlTag: "OFFERTA_ONNICOMPRENSIVA",
            label: "Offerta onnicomprensiva",
            widget: "select",
            options: OPTIONS.offertaOnnicomprensiva,
            note: "Tag introdotto nel tracciato v5.0.",
          },
          {
            kind: "field",
            key: "CONSUMO_CANONE",
            xmlTag: "CONSUMO_CANONE",
            label: "Consumo canone",
            widget: "number",
            requiredWhen: (root, local) => local.OFFERTA_ONNICOMPRENSIVA === "02",
            note: "Obbligatorio se OFFERTA_ONNICOMPRENSIVA = 02.",
          },
          {
            kind: "field",
            key: "TIPOLOGIA_ATT_CONTR",
            xmlTag: "TIPOLOGIA_ATT_CONTR",
            label: "Tipologie attivazione contrattuale",
            widget: "multiselect",
            required: true,
            options: OPTIONS.tipologiaAttContr,
            note: "Selezione multipla.",
          },
          {
            kind: "field",
            key: "NOME_OFFERTA",
            xmlTag: "NOME_OFFERTA",
            label: "Nome offerta",
            widget: "text",
            required: true,
          },
          {
            kind: "field",
            key: "DESCRIZIONE",
            xmlTag: "DESCRIZIONE",
            label: "Descrizione offerta",
            widget: "textarea",
            rows: 5,
            required: true,
          },
          {
            kind: "field",
            key: "DURATA",
            xmlTag: "DURATA",
            label: "Durata condizioni economiche",
            widget: "number",
            required: true,
            note: "Espressa in mesi. -1 se indeterminata.",
          },
          {
            kind: "field",
            key: "GARANZIE",
            xmlTag: "GARANZIE",
            label: "Garanzie",
            widget: "textarea",
            rows: 4,
            required: true,
            note: "Se nessuna garanzia, valorizzare NO.",
          },
          {
            kind: "group",
            key: "modalitaAttivazione",
            title: "Modalita Attivazione",
            xmlTag: "ModalitaAttivazione",
            required: true,
            children: [
              {
                kind: "field",
                key: "MODALITA",
                xmlTag: "MODALITA",
                label: "Modalita",
                widget: "multiselect",
                required: true,
                options: OPTIONS.modalitaAttivazione,
              },
              {
                kind: "field",
                key: "DESCRIZIONE",
                xmlTag: "DESCRIZIONE",
                label: "Descrizione modalita",
                widget: "textarea",
                rows: 3,
                requiredWhen: (root, local) => Array.isArray(local.MODALITA) && local.MODALITA.includes("99"),
                note: "Obbligatorio se una modalita e 99.",
              },
            ],
          },
          {
            kind: "group",
            key: "contatti",
            title: "Contatti",
            xmlTag: "Contatti",
            required: true,
            children: [
              {
                kind: "field",
                key: "TELEFONO",
                xmlTag: "TELEFONO",
                label: "Telefono",
                widget: "text",
                required: true,
              },
              {
                kind: "field",
                key: "URL_SITO_VENDITORE",
                xmlTag: "URL_SITO_VENDITORE",
                label: "URL sito venditore",
                widget: "text",
                note: "Nel PDF v5.0 risulta obbligatorio.",
              },
              {
                kind: "field",
                key: "URL_OFFERTA",
                xmlTag: "URL_OFFERTA",
                label: "URL offerta",
                widget: "text",
                required: true,
                note: "Nel PDF v5.0 risulta obbligatorio.",
              },
            ],
          },
        ],
      },
      {
        kind: "repeater",
        key: "riferimentiPrezzoEnergia",
        title: "Riferimenti Prezzo Energia",
        xmlTag: "RiferimentiPrezzoEnergia",
        addLabel: "Aggiungi riferimento prezzo",
        note: "Sezione ripetibile. In v5.0 puo contenere piu di un indice per TIPO_CLIENTE = 01.",
        children: [
          {
            kind: "field",
            key: "IDX_PREZZO_ENERGIA",
            xmlTag: "IDX_PREZZO_ENERGIA",
            label: "Indice prezzo energia",
            widget: "select",
            required: true,
            options: OPTIONS.idxPrezzoEnergia,
          },
          {
            kind: "field",
            key: "COEFFICIENTE",
            xmlTag: "COEFFICIENTE",
            label: "Coefficiente",
            widget: "text",
            note: "Tag presente nel tracciato v5.0.",
          },
          {
            kind: "field",
            key: "FASCIA_PREZZO",
            xmlTag: "FASCIA_PREZZO",
            label: "Fascia prezzo",
            widget: "select",
            options: OPTIONS.fasciaPrezzo,
            note: "Tag presente nel tracciato v5.0.",
          },
          {
            kind: "field",
            key: "ALTRO",
            xmlTag: "ALTRO",
            label: "Descrizione altro indice",
            widget: "textarea",
            rows: 3,
            requiredWhen: (root, local) => local.IDX_PREZZO_ENERGIA === "99",
          },
        ],
      },
      {
        kind: "group",
        key: "validitaOfferta",
        title: "Validita Offerta",
        xmlTag: "ValiditaOfferta",
        required: true,
        children: [
          {
            kind: "field",
            key: "DATA_INIZIO",
            xmlTag: "DATA_INIZIO",
            label: "Data inizio",
            widget: "text",
            required: true,
            placeholder: "GG/MM/AAAA_HH:MM:SS",
          },
          {
            kind: "field",
            key: "DATA_FINE",
            xmlTag: "DATA_FINE",
            label: "Data fine",
            widget: "text",
            required: true,
            placeholder: "GG/MM/AAAA_HH:MM:SS",
          },
        ],
      },
      {
        kind: "group",
        key: "caratteristicheOfferta",
        title: "Caratteristiche Offerta",
        xmlTag: "CaratteristicheOfferta",
        note: "Compilare solo se applicabile.",
        children: [
          {
            kind: "field",
            key: "CONSUMO_MIN",
            xmlTag: "CONSUMO_MIN",
            label: "Consumo minimo",
            widget: "number",
            requiredWhen: (root) => getValue(root, "dettaglioOfferta.TIPO_OFFERTA") === "03",
          },
          {
            kind: "field",
            key: "CONSUMO_MAX",
            xmlTag: "CONSUMO_MAX",
            label: "Consumo massimo",
            widget: "number",
            requiredWhen: (root) => getValue(root, "dettaglioOfferta.TIPO_OFFERTA") === "03",
          },
          {
            kind: "field",
            key: "POTENZA_MIN",
            xmlTag: "POTENZA_MIN",
            label: "Potenza minima",
            widget: "text",
          },
          {
            kind: "field",
            key: "POTENZA_MAX",
            xmlTag: "POTENZA_MAX",
            label: "Potenza massima",
            widget: "text",
          },
        ],
      },
      {
        kind: "group",
        key: "offertaDual",
        title: "Offerta Dual",
        xmlTag: "OffertaDual",
        note: "Sezione utile per TIPO_MERCATO = 03.",
        children: [
          {
            kind: "field",
            key: "OFFERTE_CONGIUNTE_EE",
            xmlTag: "OFFERTE_CONGIUNTE_EE",
            label: "Offerte congiunte EE",
            widget: "list",
            placeholder: "Una riga per COD_OFFERTA oppure valori separati da virgola",
          },
          {
            kind: "field",
            key: "OFFERTE_CONGIUNTE_GAS",
            xmlTag: "OFFERTE_CONGIUNTE_GAS",
            label: "Offerte congiunte GAS",
            widget: "list",
            placeholder: "Una riga per COD_OFFERTA oppure valori separati da virgola",
          },
        ],
      },
      {
        kind: "repeater",
        key: "metodiPagamento",
        title: "Metodo Pagamento",
        xmlTag: "MetodoPagamento",
        addLabel: "Aggiungi metodo pagamento",
        startWithOne: true,
        required: true,
        children: [
          {
            kind: "field",
            key: "MODALITA_PAGAMENTO",
            xmlTag: "MODALITA_PAGAMENTO",
            label: "Modalita pagamento",
            widget: "select",
            required: true,
            options: OPTIONS.modalitaPagamento,
          },
          {
            kind: "field",
            key: "DESCRIZIONE",
            xmlTag: "DESCRIZIONE",
            label: "Descrizione modalita pagamento",
            widget: "text",
            requiredWhen: (root, local) => local.MODALITA_PAGAMENTO === "99",
          },
        ],
      },
      {
        kind: "group",
        key: "componentiRegolate",
        title: "Componenti Regolate",
        xmlTag: "ComponentiRegolate",
        children: [
          {
            kind: "field",
            key: "CODICE",
            xmlTag: "CODICE",
            label: "Codici componenti regolate",
            widget: "multiselect",
            options: OPTIONS.componentiRegolateCodice,
          },
        ],
      },
      {
        kind: "group",
        key: "tipoPrezzo",
        title: "Tipo Prezzo",
        xmlTag: "TipoPrezzo",
        children: [
          {
            kind: "field",
            key: "TIPOLOGIA_FASCE",
            xmlTag: "TIPOLOGIA_FASCE",
            label: "Tipologia fasce",
            widget: "select",
            options: OPTIONS.tipologiaFasce,
          },
        ],
      },
      {
        kind: "group",
        key: "fasceOrarieSettimanali",
        title: "Fasce Orarie Settimanali",
        xmlTag: "FasceOrarieSettimanali",
        note: "Compilare se si usano fasce configurabili.",
        children: [
          { kind: "field", key: "F_LUNEDI", xmlTag: "F_LUNEDI", label: "F_LUNEDI", widget: "text" },
          { kind: "field", key: "F_MARTEDI", xmlTag: "F_MARTEDI", label: "F_MARTEDI", widget: "text" },
          { kind: "field", key: "F_MERCOLEDI", xmlTag: "F_MERCOLEDI", label: "F_MERCOLEDI", widget: "text" },
          { kind: "field", key: "F_GIOVEDI", xmlTag: "F_GIOVEDI", label: "F_GIOVEDI", widget: "text" },
          { kind: "field", key: "F_VENERDI", xmlTag: "F_VENERDI", label: "F_VENERDI", widget: "text" },
          { kind: "field", key: "F_SABATO", xmlTag: "F_SABATO", label: "F_SABATO", widget: "text" },
          { kind: "field", key: "F_DOMENICA", xmlTag: "F_DOMENICA", label: "F_DOMENICA", widget: "text" },
          { kind: "field", key: "F_FESTIVITA", xmlTag: "F_FESTIVITA", label: "F_FESTIVITA", widget: "text" },
        ],
      },
      {
        kind: "repeater",
        key: "dispacciamenti",
        title: "Dispacciamento",
        xmlTag: "Dispacciamento",
        addLabel: "Aggiungi dispacciamento",
        children: [
          {
            kind: "field",
            key: "TIPO_DISPACCIAMENTO",
            xmlTag: "TIPO_DISPACCIAMENTO",
            label: "Tipo dispacciamento",
            widget: "select",
            required: true,
            options: OPTIONS.tipoDispacciamento,
          },
          {
            kind: "field",
            key: "VALORE_DISP",
            xmlTag: "VALORE_DISP",
            label: "Valore dispacciamento",
            widget: "text",
            requiredWhen: (root, local) => local.TIPO_DISPACCIAMENTO === "99",
            note: "Obbligatorio solo se Tipo dispacciamento = 99 - Altro. Negli altri casi lasciare vuoto.",
          },
          {
            kind: "field",
            key: "NOME",
            xmlTag: "NOME",
            label: "Nome componente",
            widget: "text",
            required: true,
          },
          {
            kind: "field",
            key: "DESCRIZIONE",
            xmlTag: "DESCRIZIONE",
            label: "Descrizione componente",
            widget: "text",
          },
        ],
      },
      {
        kind: "repeater",
        key: "componentiImpresa",
        title: "Componente Impresa",
        xmlTag: "ComponenteImpresa",
        addLabel: "Aggiungi componente impresa",
        startWithOne: true,
        children: [
          {
            kind: "field",
            key: "NOME",
            xmlTag: "NOME",
            label: "Nome componente impresa",
            widget: "text",
            required: true,
          },
          {
            kind: "field",
            key: "DESCRIZIONE",
            xmlTag: "DESCRIZIONE",
            label: "Descrizione componente impresa",
            widget: "text",
            required: true,
          },
          {
            kind: "field",
            key: "TIPOLOGIA",
            xmlTag: "TIPOLOGIA",
            label: "Tipologia componente impresa",
            widget: "select",
            required: true,
            options: OPTIONS.tipologiaComponenteImpresa,
          },
          {
            kind: "field",
            key: "MACROAREA",
            xmlTag: "MACROAREA",
            label: "Macroarea componente impresa",
            widget: "multiselect",
            required: true,
            options: OPTIONS.macroareaComponenteImpresa,
          },
          {
            kind: "repeater",
            key: "intervalliPrezzi",
            title: "Intervallo Prezzi",
            xmlTag: "IntervalloPrezzi",
            addLabel: "Aggiungi intervallo prezzi",
            startWithOne: true,
            required: true,
            children: [
              {
                kind: "field",
                key: "FASCIA_COMPONENTE",
                xmlTag: "FASCIA_COMPONENTE",
                label: "Fascia componente",
                widget: "select",
                options: OPTIONS.fasciaComponente,
              },
              {
                kind: "field",
                key: "CONSUMO_DA",
                xmlTag: "CONSUMO_DA",
                label: "Consumo da",
                widget: "number",
              },
              {
                kind: "field",
                key: "CONSUMO_A",
                xmlTag: "CONSUMO_A",
                label: "Consumo a",
                widget: "number",
              },
              {
                kind: "field",
                key: "PREZZO",
                xmlTag: "PREZZO",
                label: "Prezzo",
                widget: "text",
                required: true,
              },
              {
                kind: "field",
                key: "UNITA_MISURA",
                xmlTag: "UNITA_MISURA",
                label: "Unita misura",
                widget: "select",
                required: true,
                options: OPTIONS.unitaMisuraPrezzo,
              },
              {
                kind: "field",
                key: "TIPO_PREZZO",
                xmlTag: "TIPO_PREZZO",
                label: "Tipo prezzo",
                widget: "select",
                requiredWhen: (root) => getValue(root, "dettaglioOfferta.TIPO_OFFERTA") === "04",
                note: "Nel PDF v5.0 e richiesto per offerte miste.",
                options: OPTIONS.tipoPrezzo,
              },
              {
                kind: "group",
                key: "periodoValidita",
                title: "Periodo Validita",
                xmlTag: "PeriodoValidita",
                children: [
                  {
                    kind: "field",
                    key: "DURATA",
                    xmlTag: "DURATA",
                    label: "Durata periodo",
                    widget: "number",
                  },
                  {
                    kind: "field",
                    key: "VALIDO_FINO",
                    xmlTag: "VALIDO_FINO",
                    label: "Valido fino",
                    widget: "text",
                    placeholder: "MM/AAAA",
                  },
                  {
                    kind: "field",
                    key: "MESE_VALIDITA",
                    xmlTag: "MESE_VALIDITA",
                    label: "Mesi validita",
                    widget: "multiselect",
                    options: MONTH_OPTIONS,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        kind: "repeater",
        key: "condizioniContrattuali",
        title: "Condizioni Contrattuali",
        xmlTag: "CondizioniContrattuali",
        addLabel: "Aggiungi condizione contrattuale",
        startWithOne: true,
        required: true,
        children: [
          {
            kind: "field",
            key: "TIPOLOGIA_CONDIZIONE",
            xmlTag: "TIPOLOGIA_CONDIZIONE",
            label: "Tipologia condizione",
            widget: "select",
            required: true,
            options: OPTIONS.tipologiaCondizione,
          },
          {
            kind: "field",
            key: "ALTRO",
            xmlTag: "ALTRO",
            label: "Altro tipologia condizione",
            widget: "text",
            requiredWhen: (root, local) => local.TIPOLOGIA_CONDIZIONE === "99",
          },
          {
            kind: "field",
            key: "DESCRIZIONE",
            xmlTag: "DESCRIZIONE",
            label: "Descrizione condizione",
            widget: "textarea",
            rows: 4,
            required: true,
          },
          {
            kind: "field",
            key: "LIMITANTE",
            xmlTag: "LIMITANTE",
            label: "Limitante",
            widget: "select",
            required: true,
            options: OPTIONS.limitante,
          },
        ],
      },
      {
        kind: "group",
        key: "zoneOfferta",
        title: "Zone Offerta",
        xmlTag: "ZoneOfferta",
        children: [
          {
            kind: "field",
            key: "REGIONE",
            xmlTag: "REGIONE",
            label: "Regioni",
            widget: "list",
            placeholder: "Codici ISTAT, uno per riga o separati da virgola",
          },
          {
            kind: "field",
            key: "PROVINCIA",
            xmlTag: "PROVINCIA",
            label: "Province",
            widget: "list",
            placeholder: "Codici ISTAT, uno per riga o separati da virgola",
          },
          {
            kind: "field",
            key: "COMUNE",
            xmlTag: "COMUNE",
            label: "Comuni",
            widget: "list",
            placeholder: "Codici ISTAT, uno per riga o separati da virgola",
          },
        ],
      },
      {
        kind: "repeater",
        key: "sconti",
        title: "Sconto",
        xmlTag: "Sconto",
        addLabel: "Aggiungi sconto",
        children: [
          {
            kind: "field",
            key: "NOME",
            xmlTag: "NOME",
            label: "Nome sconto",
            widget: "text",
            required: true,
          },
          {
            kind: "field",
            key: "DESCRIZIONE",
            xmlTag: "DESCRIZIONE",
            label: "Descrizione sconto",
            widget: "textarea",
            rows: 4,
            required: true,
          },
          {
            kind: "field",
            key: "CODICE_COMPONENTE_FASCIA",
            xmlTag: "CODICE_COMPONENTE_FASCIA",
            label: "Codice componente / fascia",
            widget: "multiselect",
            options: OPTIONS.codiceComponenteFascia,
          },
          {
            kind: "field",
            key: "VALIDITA",
            xmlTag: "VALIDITA",
            label: "Validita sconto",
            widget: "select",
            options: OPTIONS.validitaSconto,
            note: "Necessario se non valorizzi PeriodoValidita.",
          },
          {
            kind: "field",
            key: "IVA_SCONTO",
            xmlTag: "IVA_SCONTO",
            label: "IVA sconto",
            widget: "select",
            required: true,
            options: OPTIONS.ivaSconto,
          },
          {
            kind: "group",
            key: "periodoValidita",
            title: "Periodo Validita Sconto",
            xmlTag: "PeriodoValidita",
            children: [
              {
                kind: "field",
                key: "DURATA",
                xmlTag: "DURATA",
                label: "Durata periodo",
                widget: "number",
              },
              {
                kind: "field",
                key: "VALIDO_FINO",
                xmlTag: "VALIDO_FINO",
                label: "Valido fino",
                widget: "text",
                placeholder: "MM/AAAA",
              },
              {
                kind: "field",
                key: "MESE_VALIDITA",
                xmlTag: "MESE_VALIDITA",
                label: "Mesi validita",
                widget: "multiselect",
                options: MONTH_OPTIONS,
              },
            ],
          },
          {
            kind: "group",
            key: "condizione",
            title: "Condizione Sconto",
            xmlTag: "Condizione",
            required: true,
            children: [
              {
                kind: "field",
                key: "CONDIZIONE_APPLICAZIONE",
                xmlTag: "CONDIZIONE_APPLICAZIONE",
                label: "Condizione applicazione",
                widget: "select",
                required: true,
                options: OPTIONS.condizioneApplicazione,
              },
              {
                kind: "field",
                key: "DESCRIZIONE_CONDIZIONE",
                xmlTag: "DESCRIZIONE_CONDIZIONE",
                label: "Descrizione condizione",
                widget: "textarea",
                rows: 3,
                requiredWhen: (root, local) => local.CONDIZIONE_APPLICAZIONE === "99",
              },
            ],
          },
          {
            kind: "repeater",
            key: "prezziSconto",
            title: "Prezzi Sconto",
            xmlTag: "PrezziSconto",
            addLabel: "Aggiungi prezzo sconto",
            startWithOne: true,
            required: true,
            children: [
              {
                kind: "field",
                key: "TIPOLOGIA",
                xmlTag: "TIPOLOGIA",
                label: "Tipologia sconto",
                widget: "select",
                required: true,
                options: OPTIONS.tipologiaSconto,
              },
              {
                kind: "field",
                key: "VALIDO_DA",
                xmlTag: "VALIDO_DA",
                label: "Valido da",
                widget: "number",
              },
              {
                kind: "field",
                key: "VALIDO_FINO",
                xmlTag: "VALIDO_FINO",
                label: "Valido fino",
                widget: "number",
              },
              {
                kind: "field",
                key: "UNITA_MISURA",
                xmlTag: "UNITA_MISURA",
                label: "Unita misura sconto",
                widget: "select",
                required: true,
                options: OPTIONS.unitaMisuraPrezzoSconto,
              },
              {
                kind: "field",
                key: "PREZZO",
                xmlTag: "PREZZO",
                label: "Prezzo sconto",
                widget: "text",
                required: true,
              },
            ],
          },
        ],
      },
      {
        kind: "repeater",
        key: "prodottiServiziAggiuntivi",
        title: "Prodotti / Servizi Aggiuntivi",
        xmlTag: "ProdottiServiziAggiuntivi",
        addLabel: "Aggiungi prodotto o servizio",
        children: [
          {
            kind: "field",
            key: "NOME",
            xmlTag: "NOME",
            label: "Nome prodotto / servizio",
            widget: "text",
            required: true,
          },
          {
            kind: "field",
            key: "DETTAGLIO",
            xmlTag: "DETTAGLIO",
            label: "Dettaglio",
            widget: "textarea",
            rows: 4,
            required: true,
          },
          {
            kind: "field",
            key: "MACROAREA",
            xmlTag: "MACROAREA",
            label: "Macroarea servizio",
            widget: "select",
            options: OPTIONS.macroareaServizio,
          },
          {
            kind: "field",
            key: "DETTAGLI_MACROAREA",
            xmlTag: "DETTAGLI_MACROAREA",
            label: "Dettagli macroarea",
            widget: "text",
            requiredWhen: (root, local) => local.MACROAREA === "99",
          },
        ],
      },
    ],
  };

  function getValue(obj, path) {
    if (!obj || !path) {
      return undefined;
    }
    return path.split(".").reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj);
  }

  function buildForm() {
    formEl.innerHTML = "";
    SCHEMA.children.forEach((node) => {
      formEl.appendChild(renderNode(node));
    });
  }

  function renderNode(node, initialValue) {
    if (node.kind === "group") {
      return renderGroup(node, initialValue);
    }
    if (node.kind === "repeater") {
      return renderRepeater(node, initialValue);
    }
    return renderField(node, initialValue);
  }

  function renderGroup(node, initialValue) {
    const details = document.createElement("details");
    details.className = "node";
    details.dataset.key = node.key;
    if (node.open) {
      details.open = true;
    }

    const summary = document.createElement("summary");
    summary.innerHTML = `
      <div class="node-summary">
        <strong>${escapeHtml(node.title || node.xmlTag || node.key)}</strong>
        ${node.note ? `<small>${escapeHtml(node.note)}</small>` : ""}
      </div>
      <span class="tag-name">${escapeHtml(node.xmlTag || node.key)}</span>
    `;
    details.appendChild(summary);

    const body = document.createElement("div");
    body.className = "node-body";
    node.children.forEach((child) => {
      const childValue = initialValue ? initialValue[child.key] : undefined;
      body.appendChild(renderNode(child, childValue));
    });
    details.appendChild(body);
    return details;
  }

  function renderRepeater(node, initialValue) {
    const wrapper = document.createElement("details");
    wrapper.className = "node";
    wrapper.dataset.key = node.key;
    wrapper.open = Boolean(node.startWithOne || (Array.isArray(initialValue) && initialValue.length));

    const summary = document.createElement("summary");
    summary.innerHTML = `
      <div class="node-summary">
        <strong>${escapeHtml(node.title || node.xmlTag || node.key)}</strong>
        ${node.note ? `<small>${escapeHtml(node.note)}</small>` : ""}
      </div>
      <span class="tag-name">${escapeHtml(node.xmlTag)}</span>
    `;
    wrapper.appendChild(summary);

    const items = document.createElement("div");
    items.className = "repeater-items";
    wrapper.appendChild(items);

    const toolbar = document.createElement("div");
    toolbar.className = "repeater-toolbar";

    const note = document.createElement("span");
    note.className = "muted";
    note.textContent = "Sezione ripetibile";
    toolbar.appendChild(note);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = node.addLabel || "Aggiungi elemento";
    addButton.addEventListener("click", () => {
      items.appendChild(buildRepeaterItem(node));
      updateRepeaterItemIndexes(items);
      wrapper.open = true;
    });
    toolbar.appendChild(addButton);

    wrapper.appendChild(toolbar);

    if (Array.isArray(initialValue) && initialValue.length) {
      initialValue.forEach((entry) => items.appendChild(buildRepeaterItem(node, entry)));
    } else if (node.startWithOne) {
      items.appendChild(buildRepeaterItem(node));
    }

    updateRepeaterItemIndexes(items);
    return wrapper;
  }

  function buildRepeaterItem(node, initialValue) {
    const item = document.createElement("div");
    item.className = "repeater-item";
    item.dataset.key = node.key;

    const toolbar = document.createElement("div");
    toolbar.className = "item-toolbar";

    const title = document.createElement("span");
    title.className = "item-index";
    title.textContent = node.title || node.xmlTag;
    toolbar.appendChild(title);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Rimuovi";
    removeButton.addEventListener("click", () => {
      item.remove();
      const items = item.parentElement;
      if (items) {
        updateRepeaterItemIndexes(items);
      }
    });
    toolbar.appendChild(removeButton);
    item.appendChild(toolbar);

    const body = document.createElement("div");
    body.className = "node-body";
    node.children.forEach((child) => {
      const childValue = initialValue ? initialValue[child.key] : undefined;
      body.appendChild(renderNode(child, childValue));
    });
    item.appendChild(body);

    return item;
  }

  function renderField(node, initialValue) {
    const field = document.createElement("div");
    field.className = "field node";
    field.dataset.key = node.key;
    if (node.widget === "multiselect") {
      field.classList.add("inline-checkboxes");
    }

    const labelRow = document.createElement("div");
    labelRow.className = "field-label-row";

    const label = document.createElement("label");
    label.textContent = node.label || node.xmlTag || node.key;
    labelRow.appendChild(label);

    const badge = document.createElement("span");
    const badgeKind = node.required ? "required" : node.requiredWhen ? "conditional" : "optional";
    badge.className = `badge ${badgeKind}`;
    badge.textContent = node.required ? "Obbligatorio" : node.requiredWhen ? "Condizionale" : "Opzionale";
    labelRow.appendChild(badge);

    if (node.xmlTag) {
      const tag = document.createElement("span");
      tag.className = "tag-name";
      tag.textContent = node.xmlTag;
      labelRow.appendChild(tag);
    }

    field.appendChild(labelRow);

    if (node.note) {
      const note = document.createElement("div");
      note.className = "field-note";
      note.textContent = node.note;
      field.appendChild(note);
    }

    const control = document.createElement("div");
    control.className = "field-control";
    control.appendChild(buildControl(node, initialValue));
    field.appendChild(control);
    return field;
  }

  function buildControl(node, initialValue) {
    switch (node.widget) {
      case "textarea": {
        const textarea = document.createElement("textarea");
        textarea.rows = node.rows || 4;
        textarea.placeholder = node.placeholder || "";
        textarea.value = typeof initialValue === "string" ? initialValue : "";
        return textarea;
      }
      case "number": {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.placeholder = node.placeholder || "";
        input.value = initialValue ?? "";
        return input;
      }
      case "select": {
        const select = document.createElement("select");
        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = "-- seleziona --";
        select.appendChild(blank);
        (node.options || []).forEach((entry) => {
          const opt = document.createElement("option");
          opt.value = entry.value;
          opt.textContent = entry.label;
          if (initialValue === entry.value) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
        return select;
      }
      case "multiselect": {
        const grid = document.createElement("div");
        grid.className = "choice-grid";
        const selected = Array.isArray(initialValue) ? initialValue : [];
        (node.options || []).forEach((entry) => {
          const choice = document.createElement("label");
          const input = document.createElement("input");
          input.type = "checkbox";
          input.value = entry.value;
          input.checked = selected.includes(entry.value);
          const text = document.createElement("span");
          text.textContent = entry.label;
          choice.appendChild(input);
          choice.appendChild(text);
          grid.appendChild(choice);
        });
        return grid;
      }
      case "list": {
        const textarea = document.createElement("textarea");
        textarea.rows = 4;
        textarea.placeholder = node.placeholder || "";
        textarea.value = Array.isArray(initialValue) ? initialValue.join("\n") : (initialValue || "");
        return textarea;
      }
      case "text":
      default: {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = node.placeholder || "";
        if (node.maxLength) {
          input.maxLength = node.maxLength;
        }
        if (node.pattern instanceof RegExp) {
          input.pattern = node.pattern.source;
        }
        if (node.patternMessage) {
          input.title = node.patternMessage;
        }
        input.value = initialValue ?? "";
        return input;
      }
    }
  }

  function updateRepeaterItemIndexes(itemsContainer) {
    Array.from(itemsContainer.children).forEach((item, index) => {
      const label = item.querySelector(".item-index");
      if (label) {
        label.textContent = `${label.textContent.split(" #")[0]} #${index + 1}`;
      }
    });
  }

  function collectState() {
    const state = {};
    Array.from(formEl.children).forEach((child, index) => {
      const node = SCHEMA.children[index];
      state[node.key] = collectNode(node, child);
    });
    return state;
  }

  function collectNode(node, element) {
    if (!element) {
      return node.kind === "repeater" ? [] : {};
    }

    if (node.kind === "group") {
      const body = element.querySelector(":scope > .node-body");
      const result = {};
      node.children.forEach((child) => {
        const childEl = getDirectChildNode(body, child.key);
        result[child.key] = collectNode(child, childEl);
      });
      return result;
    }

    if (node.kind === "repeater") {
      const itemsContainer = element.querySelector(":scope > .repeater-items");
      const items = Array.from(itemsContainer ? itemsContainer.children : []);
      return items.map((item) => {
        const body = item.querySelector(":scope > .node-body");
        const result = {};
        node.children.forEach((child) => {
          const childEl = getDirectChildNode(body, child.key);
          result[child.key] = collectNode(child, childEl);
        });
        return result;
      });
    }

    if (node.widget === "multiselect") {
      return Array.from(element.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
    }

    const input = element.querySelector("input, textarea, select");
    if (!input) {
      return "";
    }

    if (node.widget === "list") {
      return splitList(input.value);
    }

    return String(input.value || "").trim();
  }

  function getDirectChildNode(container, key) {
    if (!container) {
      return null;
    }
    return Array.from(container.children).find((child) => child.dataset && child.dataset.key === key) || null;
  }

  function splitList(value) {
    return String(value || "")
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function generateXml() {
    const state = collectState();
    const errors = [];
    const body = SCHEMA.children
      .map((node) => emitNode(node, state[node.key], state, state, errors, 1))
      .filter(Boolean)
      .join("");

    if (errors.length) {
      outputEl.value = "";
      showMessage("error", "Controlla i campi obbligatori prima di generare l'XML.", errors);
      return "";
    }

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      `<Offerta xmlns="${NS}" xmlns:xsi="${XSI_NS}" xsi:schemaLocation="${NS} OffertaRetail_01.xsd">\n` +
      body +
      "</Offerta>\n";

    outputEl.value = xml;
    showMessage("success", "XML generato con successo.");
    return xml;
  }

  function emitNode(node, value, rootState, localState, errors, depth) {
    if (node.kind === "group") {
      const childXml = node.children
        .map((child) => emitNode(child, value ? value[child.key] : undefined, rootState, value || {}, errors, depth + 1))
        .filter(Boolean)
        .join("");

      if (!childXml) {
        if (isRequired(node, rootState, localState)) {
          errors.push(`${node.title || node.xmlTag}: sezione obbligatoria non valorizzata.`);
        }
        return "";
      }

      return `${indent(depth)}<${node.xmlTag}>\n${childXml}${indent(depth)}</${node.xmlTag}>\n`;
    }

    if (node.kind === "repeater") {
      const rows = Array.isArray(value) ? value : [];
      const xmlRows = rows
        .map((entry) => {
          const innerXml = node.children
            .map((child) => emitNode(child, entry ? entry[child.key] : undefined, rootState, entry || {}, errors, depth + 1))
            .filter(Boolean)
            .join("");
          if (!innerXml) {
            return "";
          }
          return `${indent(depth)}<${node.xmlTag}>\n${innerXml}${indent(depth)}</${node.xmlTag}>\n`;
        })
        .filter(Boolean)
        .join("");

      if (!xmlRows && isRequired(node, rootState, localState)) {
        errors.push(`${node.title || node.xmlTag}: almeno un elemento e obbligatorio.`);
      }
      return xmlRows;
    }

    const required = isRequired(node, rootState, localState);

    if (node.widget === "multiselect" || node.widget === "list") {
      const values = Array.isArray(value) ? value.filter(Boolean) : [];
      if (!values.length) {
        if (required) {
          errors.push(`${node.label}: campo obbligatorio.`);
        }
        return "";
      }
      return values.map((entry) => `${indent(depth)}<${node.xmlTag}>${escapeXml(entry)}</${node.xmlTag}>\n`).join("");
    }

    const text = String(value || "").trim();
    if (!text) {
      if (required) {
        errors.push(`${node.label}: campo obbligatorio.`);
      }
      return "";
    }
    const validationError = validateField(node, text);
    if (validationError) {
      errors.push(validationError);
      return "";
    }
    return `${indent(depth)}<${node.xmlTag}>${escapeXml(text)}</${node.xmlTag}>\n`;
  }

  function validateField(node, text) {
    if (node.maxLength && text.length > node.maxLength) {
      return `${node.label}: massimo ${node.maxLength} caratteri.`;
    }
    if (node.pattern instanceof RegExp && !node.pattern.test(text)) {
      return node.patternMessage || `${node.label}: formato non valido.`;
    }
    return "";
  }

  function isRequired(node, rootState, localState) {
    if (typeof node.requiredWhen === "function") {
      return Boolean(node.requiredWhen(rootState, localState));
    }
    return Boolean(node.required);
  }

  function indent(depth) {
    return "  ".repeat(depth);
  }

  function escapeXml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showMessage(type, text, details = []) {
    messagesEl.className = `messages is-visible ${type}`;
    let html = `<strong>${escapeHtml(text)}</strong>`;
    if (details.length) {
      html += "<ul>" + details.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("") + "</ul>";
    }
    messagesEl.innerHTML = html;
  }

  function clearMessage() {
    messagesEl.className = "messages";
    messagesEl.innerHTML = "";
  }

  function setCheckoutStatus(text = "", tone = "muted") {
    if (!checkoutStatusEl) {
      return;
    }

    checkoutStatusEl.textContent = text;
    if (tone) {
      checkoutStatusEl.dataset.tone = tone;
    } else {
      delete checkoutStatusEl.dataset.tone;
    }

    if (checkoutModalStatusEl) {
      checkoutModalStatusEl.textContent = text;
      if (tone) {
        checkoutModalStatusEl.dataset.tone = tone;
      } else {
        delete checkoutModalStatusEl.dataset.tone;
      }
    }
  }

  function getCheckoutUiState() {
    const isUnlocked = Boolean(unlockToken);
    let state = "idle";
    let heading = "Ultimo passaggio";
    let text = "Compila la maschera e premi Genera ZIP per preparare il file finale. Il pagamento viene richiesto solo al momento del download.";
    let buttonText = `Paga ${PAYMENT_AMOUNT_LABEL} per scaricare il file`;
    let buttonDisabled = true;
    let statusText = "Il pulsante finale si attiva solo dopo la generazione del ZIP.";
    let statusTone = "muted";

    if (zipReady && isUnlocked) {
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
      text = `Il file e pronto. Completa il pagamento di ${PAYMENT_AMOUNT_LABEL} per scaricare lo ZIP finale.`;
      buttonText = `Paga ${PAYMENT_AMOUNT_LABEL} per scaricare il file`;
      buttonDisabled = false;
      statusText = "Ultimo passaggio: pagamento Stripe prima del download.";
      statusTone = "accent";
    } else if (isUnlocked) {
      state = "unlocked";
      heading = "Pagamento confermato";
      text = "Hai gia un utilizzo disponibile. Premi Genera ZIP per preparare il file finale e poi scaricarlo.";
      buttonText = "Scarica ZIP ora";
      buttonDisabled = true;
      statusText = "Pagamento registrato. Genera prima il ZIP finale.";
      statusTone = "success";
    }

    return {
      state,
      heading,
      text,
      buttonText,
      buttonDisabled,
      statusText,
      statusTone,
    };
  }

  function applyCheckoutUi(viewState) {
    if (checkoutPanelEl) {
      checkoutPanelEl.dataset.state = viewState.state;
    }
    if (checkoutHeadingEl) {
      checkoutHeadingEl.textContent = viewState.heading;
    }
    if (checkoutTextEl) {
      checkoutTextEl.textContent = viewState.text;
    }
    if (startCheckoutBtn) {
      startCheckoutBtn.textContent = viewState.buttonText;
      startCheckoutBtn.disabled = viewState.buttonDisabled;
    }
    if (checkoutModalEl) {
      checkoutModalEl.dataset.state = viewState.state;
    }
    if (checkoutModalHeadingEl) {
      checkoutModalHeadingEl.textContent = viewState.heading;
    }
    if (checkoutModalTextEl) {
      checkoutModalTextEl.textContent = viewState.text;
    }
    if (startCheckoutModalBtn) {
      startCheckoutModalBtn.textContent = viewState.buttonText;
      startCheckoutModalBtn.disabled = viewState.buttonDisabled;
    }
  }

  function openCheckoutModal() {
    if (!checkoutModalEl) {
      return;
    }

    checkoutModalEl.hidden = false;
    checkoutModalEl.classList.add("is-open");
    checkoutModalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      if (startCheckoutModalBtn && !startCheckoutModalBtn.disabled) {
        startCheckoutModalBtn.focus();
      } else if (closeCheckoutModalBtn) {
        closeCheckoutModalBtn.focus();
      }
    }, 30);
  }

  function closeCheckoutModal() {
    if (!checkoutModalEl) {
      return;
    }

    checkoutModalEl.classList.remove("is-open");
    checkoutModalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    checkoutModalEl.hidden = true;
  }

  function updateCheckoutPanel({ preserveStatus = false } = {}) {
    if (!checkoutPanelEl || !startCheckoutBtn) {
      return;
    }

    const viewState = getCheckoutUiState();
    applyCheckoutUi(viewState);

    if (!preserveStatus) {
      setCheckoutStatus(viewState.statusText, viewState.statusTone);
    }
  }

  function clearCheckoutDraft() {
    sessionStorage.removeItem(PAYMENT_DRAFT_KEY);
  }

  function saveCheckoutDraft(xml) {
    const trimmedXml = String(xml || "").trim();
    if (!trimmedXml) {
      clearCheckoutDraft();
      return;
    }

    sessionStorage.setItem(
      PAYMENT_DRAFT_KEY,
      JSON.stringify({
        xml: trimmedXml,
        fileAction: String(fileActionEl.value || "").trim().toUpperCase(),
        fileVersion: String(fileVersionEl.value || "").trim(),
      })
    );
  }

  function restoreCheckoutDraft() {
    const raw = sessionStorage.getItem(PAYMENT_DRAFT_KEY);
    if (!raw) {
      return false;
    }

    try {
      const draft = JSON.parse(raw);
      const xml = typeof draft.xml === "string" ? draft.xml.trim() : "";
      if (!xml) {
        clearCheckoutDraft();
        return false;
      }

      importXml(xml, "", { prepared: true, silent: true, keepOutput: true });
      if (FILE_ACTIONS.has(draft.fileAction)) {
        fileActionEl.value = draft.fileAction;
      }
      if (FORMAT_VERSIONS.has(draft.fileVersion)) {
        fileVersionEl.value = draft.fileVersion;
      }
      updateFileDescriptionPreview();
      setCheckoutStatus("Bozza finale ripristinata. Puoi continuare dal passaggio di pagamento o download.", "muted");
      return true;
    } catch {
      clearCheckoutDraft();
      return false;
    }
  }

  function invalidatePreparedZip(reason = "") {
    const hadPreparedZip = zipReady;
    if (!hadPreparedZip) {
      return;
    }

    zipReady = false;
    clearCheckoutDraft();
    closeCheckoutModal();
    updateCheckoutPanel({ preserveStatus: Boolean(reason) });
    if (reason) {
      setCheckoutStatus(reason, "muted");
    }
  }

  function scrollCheckoutPanelIntoView() {
    if (checkoutPanelEl) {
      checkoutPanelEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function clearUnlockToken() {
    unlockToken = "";
    sessionStorage.removeItem(PAYMENT_TOKEN_KEY);
    updateCheckoutPanel();
  }

  async function startCheckout() {
    if (unlockToken) {
      await downloadZip();
      return;
    }

    if (!zipReady) {
      showMessage("error", "Premi prima Genera ZIP per arrivare al pagamento finale.");
      updateCheckoutPanel();
      return;
    }

    startCheckoutBtn.disabled = true;
    setCheckoutStatus("Reindirizzamento a Stripe in corso...", "accent");

    try {
      saveCheckoutDraft(outputEl.value);
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
      updateCheckoutPanel({ preserveStatus: true });
    }
  }

  async function consumeUnlockForDownload() {
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
      clearUnlockToken();
      showMessage("error", payload.message || "Il pagamento non risulta piu disponibile.");
      return false;
    }

    return true;
  }

  function resetForm() {
    buildForm();
    zipReady = false;
    clearCheckoutDraft();
    closeCheckoutModal();
    fileActionEl.value = "INSERIMENTO";
    fileVersionEl.value = "01";
    fileDescriptionEl.value = "";
    zipDescriptionEl.value = "";
    outputEl.value = "";
    clearMessage();
    updateCheckoutPanel();
  }

  function importXml(text, fileName = "", options = {}) {
    const { prepared = false, silent = false, keepOutput = false } = options;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML non valido.");
      }

      const root = xmlDoc.documentElement;
      if (!root || root.localName !== "Offerta") {
        throw new Error("Il file selezionato non sembra un XML Offerta.");
      }

      buildForm();
      SCHEMA.children.forEach((node) => {
        const formNode = Array.from(formEl.children).find((child) => child.dataset && child.dataset.key === node.key);
        populateNode(node, formNode, root);
      });
      populateFileNameFields(fileName);
      zipReady = prepared;
      if (!prepared) {
        clearCheckoutDraft();
      }
      updateFileDescriptionPreview();
      outputEl.value = keepOutput ? String(text || "").trim() : "";
      if (!prepared) {
        closeCheckoutModal();
      }
      if (!silent) {
        showMessage("success", "XML importato nella maschera.");
      }
      updateCheckoutPanel();
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  function populateFileNameFields(fileName) {
    const match = String(fileName || "").match(/^[A-Za-z0-9]+_(INSERIMENTO|AGGIORNAMENTO)_([A-Za-z0-9]{1,25})\.xml$/i);
    if (!match) {
      return;
    }
    fileActionEl.value = match[1].toUpperCase();
  }

  function updateFileDescriptionPreview() {
    const state = collectState();
    const description = buildFileDescription(getValue(state, "dettaglioOfferta.NOME_OFFERTA"));
    fileDescriptionEl.value = description;
    zipDescriptionEl.value = description;
  }

  function populateNode(node, formNode, xmlParent) {
    if (!formNode) {
      return;
    }

    if (node.kind === "group") {
      const xmlNode = getDirectXmlChild(xmlParent, node.xmlTag);
      if (!xmlNode) {
        return;
      }
      const body = formNode.querySelector(":scope > .node-body");
      node.children.forEach((child) => {
        const childFormNode = getDirectChildNode(body, child.key);
        populateNode(child, childFormNode, xmlNode);
      });
      return;
    }

    if (node.kind === "repeater") {
      const xmlNodes = getDirectXmlChildren(xmlParent, node.xmlTag);
      const itemsContainer = formNode.querySelector(":scope > .repeater-items");
      if (!itemsContainer) {
        return;
      }
      itemsContainer.innerHTML = "";
      xmlNodes.forEach((xmlNode) => {
        const item = buildRepeaterItem(node);
        itemsContainer.appendChild(item);
        const body = item.querySelector(":scope > .node-body");
        node.children.forEach((child) => {
          const childFormNode = getDirectChildNode(body, child.key);
          populateNode(child, childFormNode, xmlNode);
        });
      });
      if (!xmlNodes.length && node.startWithOne) {
        itemsContainer.appendChild(buildRepeaterItem(node));
      }
      updateRepeaterItemIndexes(itemsContainer);
      return;
    }

    if (node.widget === "multiselect") {
      const xmlNodes = getDirectXmlChildren(xmlParent, node.xmlTag);
      const values = xmlNodes.map((entry) => entry.textContent.trim());
      formNode.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.checked = values.includes(input.value);
      });
      return;
    }

    if (node.widget === "list") {
      const xmlNodes = getDirectXmlChildren(xmlParent, node.xmlTag);
      const textarea = formNode.querySelector("textarea");
      if (textarea) {
        textarea.value = xmlNodes.map((entry) => entry.textContent.trim()).join("\n");
      }
      return;
    }

    const xmlNode = getDirectXmlChild(xmlParent, node.xmlTag);
    if (!xmlNode) {
      return;
    }
    const input = formNode.querySelector("input, textarea, select");
    if (input) {
      input.value = xmlNode.textContent.trim();
    }
  }

  function getDirectXmlChildren(parent, localName) {
    return Array.from(parent.children).filter((child) => child.localName === localName);
  }

  function getDirectXmlChild(parent, localName) {
    return getDirectXmlChildren(parent, localName)[0] || null;
  }

  function prepareZipForDownload() {
    const xml = generateXml().trim();
    if (!xml) {
      zipReady = false;
      clearCheckoutDraft();
      updateCheckoutPanel();
      return;
    }

    zipReady = true;
    outputEl.value = xml;
    saveCheckoutDraft(xml);
    updateCheckoutPanel();

    if (unlockToken) {
      showMessage("success", "ZIP pronto. Usa il pulsante in fondo per scaricare il file.");
      setCheckoutStatus("Pagamento gia registrato. Ora puoi scaricare il file finale.", "success");
    } else {
      showMessage("success", `ZIP pronto. Completa il pagamento di ${PAYMENT_AMOUNT_LABEL} con il pulsante in fondo per scaricare il file.`);
      setCheckoutStatus("ZIP pronto per il pagamento finale su Stripe.", "accent");
    }

    updateCheckoutPanel({ preserveStatus: true });
    openCheckoutModal();
  }

  async function downloadZip() {
    if (!zipReady) {
      showMessage("error", "Premi prima Genera ZIP per preparare il file finale.");
      updateCheckoutPanel();
      return;
    }

    const xml = generateXml().trim();
    if (!xml) {
      zipReady = false;
      clearCheckoutDraft();
      updateCheckoutPanel();
      return;
    }

    if (!unlockToken) {
      showMessage("error", `Completa il pagamento di ${PAYMENT_AMOUNT_LABEL} prima di scaricare lo ZIP.`);
      updateCheckoutPanel();
      return;
    }

    const allowed = await consumeUnlockForDownload();
    if (!allowed) {
      return;
    }

    const state = collectState();
    const names = buildDownloadNames(state);
    if (!names) {
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
    clearUnlockToken();
    closeCheckoutModal();
    showMessage("success", `ZIP generato: ${names.zipFileName}`);
    setCheckoutStatus("Download completato. Per un nuovo ZIP sara richiesto un nuovo pagamento.", "muted");
    updateCheckoutPanel({ preserveStatus: true });
  }

  function buildDownloadNames(state) {
    const errors = [];
    const cpUtente = buildCpUtente();
    const piva = String(getValue(state, "identificativiOfferta.PIVA_UTENTE") || "").trim();
    const codOfferta = String(getValue(state, "identificativiOfferta.COD_OFFERTA") || "").trim();
    const action = String(fileActionEl.value || "").trim().toUpperCase();
    const version = String(fileVersionEl.value || "").trim();
    const offerName = String(getValue(state, "dettaglioOfferta.NOME_OFFERTA") || "").trim();
    const xmlDescription = buildFileDescription(offerName);
    const zipDescription = xmlDescription;
    const flowCode = FLOW_CODES[action] || "";
    fileDescriptionEl.value = xmlDescription;
    zipDescriptionEl.value = zipDescription;

    if (!piva) {
      errors.push("PIVA_UTENTE: obbligatoria per nominare il file.");
    } else if (!FILE_PIVA_PATTERN.test(piva)) {
      errors.push("PIVA_UTENTE: sono ammessi solo caratteri alfanumerici nel nome file.");
    }

    if (!FILE_ACTIONS.has(action)) {
      errors.push("AZIONE: selezionare INSERIMENTO oppure AGGIORNAMENTO.");
    }

    if (!FORMAT_VERSIONS.has(version)) {
      errors.push("VERSIONE_FORMATO_FILE: selezionare 01 oppure 02.");
    }

    if (!codOfferta) {
      errors.push("COD_OFFERTA: obbligatorio per nominare l'XML interno allo ZIP.");
    } else if (!/^[A-Za-z0-9]{32}$/.test(codOfferta)) {
      errors.push("COD_OFFERTA: per il nome dell'XML interno deve contenere esattamente 32 caratteri alfanumerici.");
    }

    if (!offerName) {
      errors.push("NOME_OFFERTA: obbligatorio per creare la DESCRIZIONE del nome file.");
    } else if (!xmlDescription) {
      errors.push("DESCRIZIONE file: il NOME_OFFERTA deve contenere almeno un carattere alfanumerico.");
    } else if (!FILE_DESCRIPTION_PATTERN.test(xmlDescription)) {
      errors.push("DESCRIZIONE file: massimo 25 caratteri alfanumerici, senza spazi e senza underscore.");
    }

    if (errors.length) {
      showMessage("error", "Controlla il nome dei file prima di scaricare lo ZIP.", errors);
      return null;
    }

    return {
      xmlFileName: `${cpUtente}_${codOfferta}_${xmlDescription}.XML`,
      zipFileName: `${piva}_TO2_${flowCode}_${version}_${zipDescription}.ZIP`,
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

  importEl.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    importXml(text, file.name);
    event.target.value = "";
  });

  formEl.addEventListener("input", () => {
    updateFileDescriptionPreview();
    invalidatePreparedZip("Hai modificato la maschera. Premi di nuovo Genera ZIP per aggiornare il file finale.");
  });
  formEl.addEventListener("change", () => {
    updateFileDescriptionPreview();
    invalidatePreparedZip("Hai modificato la maschera. Premi di nuovo Genera ZIP per aggiornare il file finale.");
  });
  generateBtn.addEventListener("click", () => {
    generateXml();
    updateCheckoutPanel();
  });
  downloadBtn.addEventListener("click", prepareZipForDownload);
  resetBtn.addEventListener("click", resetForm);
  startCheckoutBtn.addEventListener("click", startCheckout);
  if (startCheckoutModalBtn) {
    startCheckoutModalBtn.addEventListener("click", startCheckout);
  }
  if (closeCheckoutModalBtn) {
    closeCheckoutModalBtn.addEventListener("click", closeCheckoutModal);
  }
  if (checkoutModalEl) {
    checkoutModalEl.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.dataset.closeCheckoutModal === "true") {
        closeCheckoutModal();
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCheckoutModal();
    }
  });

  buildForm();
  restoreCheckoutDraft();
  updateFileDescriptionPreview();
  const paymentParams = new URLSearchParams(window.location.search);
  if (paymentParams.get("payment") === "success") {
    showMessage("success", "Pagamento confermato. Il pulsante in fondo ora ti permette di scaricare il ZIP.");
    setCheckoutStatus("Pagamento confermato. Scarica ora il file finale.", "success");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  if (paymentParams.get("payment") === "cancelled") {
    showMessage("error", "Pagamento annullato. Quando vuoi, usa il pulsante in fondo per riprovare.");
    setCheckoutStatus("Pagamento annullato. Il file resta pronto per un nuovo tentativo.", "accent");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  updateCheckoutPanel({ preserveStatus: paymentParams.has("payment") });
  if (paymentParams.get("payment") === "success" || paymentParams.get("payment") === "cancelled") {
    openCheckoutModal();
  }
})();
