const historyDataUiApplied = true;

const openHistoryPanelBeforeData =
  window.openHistoryPanel;


function historyFriendlyEntity(
  entityType
) {
  const names = {
    rack: "Fileira",
    equipamento: "Equipamento",
    documento: "Documento"
  };

  return (
    names[entityType]
    || entityType
    || "Entidade"
  );
}


function historyFriendlyAction(
  action
) {
  const names = {
    criacao: "Criacao",
    atualizacao: "Atualizacao",
    remocao_logica: "Remocao",
    alteracao_posicao:
      "Alteracao de posicao",
    alteracao_posicao_equipamento:
      "Alteracao de posicao"
  };

  return (
    names[action]
    || action
    || "Alteracao"
  );
}


function formatHistoryDate(
  dateValue
) {
  const date = new Date(
    dateValue
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      dateValue || ""
    );
  }

  return date.toLocaleString(
    "pt-BR"
  );
}


function installHistoryDataStyles() {
  if (
    document.getElementById(
      "historyDataStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "historyDataStyles";

  style.textContent = `
    .history-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .history-summary {
      color: var(--muted);
      font-size: 12px;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .history-entry {
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #0c1828;
    }

    .history-entry-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
    }

    .history-entry-title {
      color: #afeaff;
      font-weight: 850;
    }

    .history-entry-date {
      color: var(--muted);
      font-size: 11px;
      white-space: nowrap;
    }

    .history-entry-meta {
      margin-top: 7px;
      color: #cdd9e5;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .history-error {
      padding: 14px;
      border: 1px solid #ef4444;
      border-radius: 10px;
      background: #4a1d24;
      color: #fecaca;
    }
  `;

  document.head.appendChild(
    style
  );
}


function createHistoryToolbar(
  total
) {
  const toolbar =
    document.createElement(
      "div"
    );

  toolbar.className =
    "history-toolbar";

  const summary =
    document.createElement(
      "div"
    );

  summary.className =
    "history-summary";

  summary.textContent =
    "Registros encontrados: "
    + total;

  const refreshButton =
    document.createElement(
      "button"
    );

  refreshButton.type =
    "button";

  refreshButton.id =
    "historyRefreshButton";

  refreshButton.className =
    "mini-btn";

  refreshButton.textContent =
    "Atualizar";

  refreshButton.onclick = () => {
    loadHistoryData();
  };

  toolbar.appendChild(
    summary
  );

  toolbar.appendChild(
    refreshButton
  );

  return toolbar;
}


function createHistoryEntry(
  item
) {
  const entry =
    document.createElement(
      "article"
    );

  entry.className =
    "history-entry";

  const header =
    document.createElement(
      "div"
    );

  header.className =
    "history-entry-head";

  const title =
    document.createElement(
      "div"
    );

  title.className =
    "history-entry-title";

  title.textContent =
    historyFriendlyEntity(
      item.tipo_entidade
    )
    + " | "
    + historyFriendlyAction(
      item.acao
    );

  const date =
    document.createElement(
      "div"
    );

  date.className =
    "history-entry-date";

  date.textContent =
    formatHistoryDate(
      item.data_operacao
    );

  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "history-entry-meta";

  meta.textContent =
    "Chave: "
    + item.entidade_key
    + " | Usuario: "
    + item.usuario
    + " | Registro: "
    + item.id;

  header.appendChild(
    title
  );

  header.appendChild(
    date
  );

  entry.appendChild(
    header
  );

  entry.appendChild(
    meta
  );

  return entry;
}


function renderHistoryData(
  responseData
) {
  const content =
    document.getElementById(
      "historyContent"
    );

  if (!content) {
    return;
  }

  content.replaceChildren();

  const items =
    Array.isArray(
      responseData?.itens
    )
      ? responseData.itens
      : [];

  content.appendChild(
    createHistoryToolbar(
      Number(
        responseData?.total || 0
      )
    )
  );

  if (items.length === 0) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "history-placeholder";

    empty.textContent =
      "Nenhum registro historico encontrado.";

    content.appendChild(
      empty
    );

    return;
  }

  const list =
    document.createElement(
      "div"
    );

  list.className =
    "history-list";

  items.forEach(item => {
    list.appendChild(
      createHistoryEntry(
        item
      )
    );
  });

  content.appendChild(
    list
  );
}


function showHistoryDataError(
  message
) {
  const content =
    document.getElementById(
      "historyContent"
    );

  if (!content) {
    return;
  }

  content.replaceChildren();

  const errorBox =
    document.createElement(
      "div"
    );

  errorBox.className =
    "history-error";

  errorBox.textContent =
    message
    || "Nao foi possivel carregar o historico.";

  content.appendChild(
    errorBox
  );
}


async function loadHistoryData() {
  if (!isAdministrator()) {
    showHistoryDataError(
      "Entre como administrador "
      + "para consultar o historico."
    );

    return;
  }

  const content =
    document.getElementById(
      "historyContent"
    );

  if (content) {
    content.innerHTML =
      '<div class="history-placeholder">'
      + "Carregando historico..."
      + "</div>";
  }

  try {
    const response = await fetch(
      "/api/historico?limite=50",
      {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      }
    );

    if (response.status === 401) {
      authenticatedUser = null;

      applyAuthenticationState();

      throw new Error(
        "A sessao administrativa expirou."
      );
    }

    if (!response.ok) {
      throw new Error(
        "A consulta do historico "
        + "respondeu com HTTP "
        + response.status
        + "."
      );
    }

    const responseData =
      await response.json();

    renderHistoryData(
      responseData
    );
  } catch (error) {
    console.error(
      "Falha ao carregar historico.",
      error
    );

    showHistoryDataError(
      error.message
    );
  }
}


window.openHistoryPanel =
  function openHistoryPanelWithData() {
    const result =
      openHistoryPanelBeforeData();

    if (isAdministrator()) {
      loadHistoryData();
    }

    return result;
  };


installHistoryDataStyles();