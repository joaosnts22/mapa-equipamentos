const historyDetailsUiApplied = true;

const createHistoryEntryBeforeDetails =
  window.createHistoryEntry;


function historyFriendlyFieldName(
  fieldName
) {
  const names = {
    id: "ID",
    rack_key: "Chave da fileira",
    equipamento_key:
      "Chave do equipamento",
    display_name: "Nome da fileira",
    nome: "Nome",
    nome_documento:
      "Nome do documento",
    tipo_documento:
      "Tipo de documento",
    descricao: "Descricao",
    area_responsavel:
      "Area responsavel",
    fabricante: "Fabricante",
    modelo: "Modelo",
    numero_serie:
      "Numero de serie",
    patrimonio: "Patrimonio",
    funcao: "Funcao",
    observacoes: "Observacoes",
    modulo_rack:
      "Rack fisico",
    ru_inicial: "RU inicial",
    altura_ru: "Altura em RU",
    quantidade_modulos:
      "Quantidade de racks",
    quantidade_ru:
      "Quantidade de RU",
    posicao_x: "Posicao X",
    posicao_y: "Posicao Y",
    largura: "Largura",
    altura: "Altura",
    layout: "Formato",
    frente: "Frente",
    ordem: "Ordem",
    visivel: "Visivel",
    versao_dados:
      "Versao dos dados",
    criado_em: "Criado em",
    atualizado_em:
      "Atualizado em"
  };

  return (
    names[fieldName]
    || String(fieldName)
      .replaceAll("_", " ")
  );
}


function formatHistoryDetailValue(
  value
) {
  if (value === null) {
    return "Nao informado";
  }

  if (value === undefined) {
    return "Nao informado";
  }

  if (value === true) {
    return "Sim";
  }

  if (value === false) {
    return "Nao";
  }

  if (
    typeof value === "object"
  ) {
    return JSON.stringify(
      value,
      null,
      2
    );
  }

  return String(value);
}


function createHistoryStateBlock(
  titleText,
  stateData
) {
  const block =
    document.createElement(
      "section"
    );

  block.className =
    "history-state-block";

  const title =
    document.createElement(
      "h4"
    );

  title.textContent =
    titleText;

  block.appendChild(
    title
  );

  if (
    !stateData
    || typeof stateData
    !== "object"
    || Array.isArray(stateData)
    || Object.keys(
      stateData
    ).length === 0
  ) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "history-state-empty";

    empty.textContent =
      titleText === "Antes"
        ? "Nao havia estado anterior."
        : "Nao ha dados para este estado.";

    block.appendChild(
      empty
    );

    return block;
  }

  const grid =
    document.createElement(
      "div"
    );

  grid.className =
    "history-state-grid";

  Object.entries(
    stateData
  ).forEach(
    (
      [
        fieldName,
        fieldValue
      ]
    ) => {
      const field =
        document.createElement(
          "div"
        );

      field.className =
        "history-state-field";

      const label =
        document.createElement(
          "span"
        );

      label.className =
        "history-state-label";

      label.textContent =
        historyFriendlyFieldName(
          fieldName
        );

      const value =
        document.createElement(
          "pre"
        );

      value.className =
        "history-state-value";

      value.textContent =
        formatHistoryDetailValue(
          fieldValue
        );

      field.appendChild(
        label
      );

      field.appendChild(
        value
      );

      grid.appendChild(
        field
      );
    }
  );

  block.appendChild(
    grid
  );

  return block;
}


function createHistoryDetails(
  item
) {
  const details =
    document.createElement(
      "div"
    );

  details.className =
    "history-details";

  details.hidden = true;

  details.appendChild(
    createHistoryStateBlock(
      "Antes",
      item.dados_anteriores
    )
  );

  details.appendChild(
    createHistoryStateBlock(
      "Depois",
      item.dados_novos
    )
  );

  return details;
}


function installHistoryDetailsStyles() {
  if (
    document.getElementById(
      "historyDetailsStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "historyDetailsStyles";

  style.textContent = `
    .history-entry-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .history-details {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--line);
    }

    .history-details[hidden] {
      display: none;
    }

    .history-state-block + .history-state-block {
      margin-top: 14px;
    }

    .history-state-block h4 {
      margin: 0 0 9px;
      color: var(--cyan);
      font-size: 13px;
    }

    .history-state-grid {
      display: grid;
      grid-template-columns:
        repeat(
          auto-fit,
          minmax(220px, 1fr)
        );
      gap: 8px;
    }

    .history-state-field {
      min-width: 0;
      padding: 9px;
      border: 1px solid #26384e;
      border-radius: 8px;
      background: #07111f;
    }

    .history-state-label {
      display: block;
      margin-bottom: 5px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .history-state-value {
      margin: 0;
      color: #e4edf5;
      font: inherit;
      font-size: 12px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .history-state-empty {
      padding: 11px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      font-size: 12px;
    }
  `;

  document.head.appendChild(
    style
  );
}


window.createHistoryEntry =
  function createHistoryEntryWithDetails(
    item
  ) {
    const entry =
      createHistoryEntryBeforeDetails(
        item
      );

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "history-entry-actions";

    const detailsButton =
      document.createElement(
        "button"
      );

    detailsButton.type =
      "button";

    detailsButton.className =
      "mini-btn";

    detailsButton.textContent =
      "Ver detalhes";

    const details =
      createHistoryDetails(
        item
      );

    detailsButton.onclick = () => {
      const willOpen =
        details.hidden;

      details.hidden =
        !willOpen;

      detailsButton.textContent =
        willOpen
          ? "Ocultar detalhes"
          : "Ver detalhes";
    };

    actions.appendChild(
      detailsButton
    );

    entry.appendChild(
      actions
    );

    entry.appendChild(
      details
    );

    return entry;
  };


installHistoryDetailsStyles();