const historyUiApplied = true;

const applyAuthenticationStateBeforeHistory =
  window.applyAuthenticationState;


function installHistoryStyles() {
  if (
    document.getElementById(
      "historyUiStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "historyUiStyles";

  style.textContent = `
    .history-overlay {
      position: fixed;
      inset: 0;
      z-index: 60;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #000c;
      backdrop-filter: blur(5px);
    }

    .history-overlay.open {
      display: flex;
    }

    .history-panel {
      width: min(1250px, 100%);
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 17px;
      background: #081424;
      box-shadow: 0 24px 60px #000a;
    }

    .history-header {
      flex: 0 0 auto;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 22px;
      border-bottom: 1px solid var(--line);
      background: #081424f2;
    }

    .history-header small {
      color: var(--cyan);
      font-weight: 800;
      letter-spacing: .08em;
    }

    .history-header h2 {
      margin: 4px 0 0;
      font-size: 28px;
    }

    .history-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      padding: 18px 22px;
    }

    .history-placeholder {
      padding: 40px 20px;
      border: 1px dashed var(--line);
      border-radius: 13px;
      color: var(--muted);
      text-align: center;
    }

    .history-close {
      flex: 0 0 auto;
    }
  `;

  document.head.appendChild(
    style
  );
}


function createHistoryButton() {
  if (
    document.getElementById(
      "historyButton"
    )
  ) {
    return;
  }

  const headerActions =
    document.querySelector(
      ".header-actions"
    );

  const editButtonElement =
    document.getElementById(
      "editButton"
    );

  if (
    !headerActions
    || !editButtonElement
  ) {
    console.error(
      "Nao foi possivel criar "
      + "o botao de historico."
    );

    return;
  }

  const historyButton =
    document.createElement(
      "button"
    );

  historyButton.type =
    "button";

  historyButton.id =
    "historyButton";

  historyButton.className =
    "action-btn";

  historyButton.textContent =
    "Historico";

  historyButton.hidden =
    !isAdministrator();

  historyButton.onclick = () => {
    openHistoryPanel();
  };

  headerActions.insertBefore(
    historyButton,
    editButtonElement
  );
}


function createHistoryPanel() {
  if (
    document.getElementById(
      "historyOverlay"
    )
  ) {
    return;
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "historyOverlay";

  overlay.className =
    "history-overlay";

  const panel =
    document.createElement(
      "section"
    );

  panel.className =
    "history-panel";

  const header =
    document.createElement(
      "header"
    );

  header.className =
    "history-header";

  const titleContainer =
    document.createElement(
      "div"
    );

  const eyebrow =
    document.createElement(
      "small"
    );

  eyebrow.textContent =
    "AUDITORIA ADMINISTRATIVA";

  const title =
    document.createElement(
      "h2"
    );

  title.textContent =
    "Historico de alteracoes";

  titleContainer.appendChild(
    eyebrow
  );

  titleContainer.appendChild(
    title
  );

  const closeButton =
    document.createElement(
      "button"
    );

  closeButton.type =
    "button";

  closeButton.id =
    "historyCloseButton";

  closeButton.className =
    "close history-close";

  closeButton.textContent =
    "X";

  closeButton.title =
    "Fechar historico";

  const content =
    document.createElement(
      "div"
    );

  content.id =
    "historyContent";

  content.className =
    "history-content";

  const placeholder =
    document.createElement(
      "div"
    );

  placeholder.className =
    "history-placeholder";

  placeholder.textContent =
    "A consulta do historico "
    + "sera carregada aqui.";

  content.appendChild(
    placeholder
  );

  header.appendChild(
    titleContainer
  );

  header.appendChild(
    closeButton
  );

  panel.appendChild(
    header
  );

  panel.appendChild(
    content
  );

  overlay.appendChild(
    panel
  );

  document.body.appendChild(
    overlay
  );

  closeButton.onclick = () => {
    closeHistoryPanel();
  };

  overlay.onclick = event => {
    if (event.target === overlay) {
      closeHistoryPanel();
    }
  };
}


function openHistoryPanel() {
  if (!isAdministrator()) {
    showStatus(
      "ENTRE COMO ADMINISTRADOR"
    );

    return;
  }

  const overlay =
    document.getElementById(
      "historyOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.add(
    "open"
  );
}


function closeHistoryPanel() {
  const overlay =
    document.getElementById(
      "historyOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.remove(
    "open"
  );
}


function updateHistoryAuthenticationState() {
  const historyButton =
    document.getElementById(
      "historyButton"
    );

  if (historyButton) {
    historyButton.hidden =
      !isAdministrator();
  }

  if (!isAdministrator()) {
    closeHistoryPanel();
  }
}


window.applyAuthenticationState =
  function applyAuthenticationStateWithHistory() {
    const result =
      applyAuthenticationStateBeforeHistory();

    updateHistoryAuthenticationState();

    return result;
  };


document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Escape"
      && document.getElementById(
        "historyOverlay"
      )?.classList.contains(
        "open"
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      closeHistoryPanel();
    }
  },
  true
);


installHistoryStyles();
createHistoryButton();
createHistoryPanel();
updateHistoryAuthenticationState();