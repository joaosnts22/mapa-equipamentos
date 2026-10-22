const equipmentDocumentsUiApplied = true;

const showEquipmentModalBeforeDocuments =
  window.showEquipmentModal;


function readDocumentApiError(
  response
) {
  return response
    .json()
    .then(data => {
      if (
        typeof data?.detail
        === "string"
      ) {
        return data.detail;
      }

      return JSON.stringify(
        data?.detail || data
      );
    })
    .catch(() => (
      "O servidor respondeu com HTTP "
      + response.status
      + "."
    ));
}


function formatDocumentDate(
  dateValue
) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(
    dateValue
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "pt-BR"
  );
}


function createDocumentSection() {
  const section =
    document.createElement(
      "section"
    );

  section.id =
    "equipmentDocumentsSection";

  section.className =
    "card item";

  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    "Documentos";

  const content =
    document.createElement(
      "div"
    );

  content.id =
    "equipmentDocumentsContent";

  content.className =
    "equipment-documents-content";

  content.textContent =
    "Carregando documentos...";

  section.appendChild(
    title
  );

  section.appendChild(
    content
  );

  return section;
}


function installDocumentStyles() {
  if (
    document.getElementById(
      "equipmentDocumentStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "equipmentDocumentStyles";

  style.textContent = `
    .equipment-documents-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
      color: #cdd9e5;
      font-size: 13px;
    }

    .equipment-document-entry {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #0c1828;
    }

    .equipment-document-name {
      color: #afeaff;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .equipment-document-meta {
      margin-top: 5px;
      color: var(--muted);
      font-size: 11px;
    }

    .equipment-document-description {
      margin-top: 8px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .equipment-document-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .equipment-documents-empty {
      padding: 16px;
      border: 1px dashed var(--line);
      border-radius: 10px;
      color: var(--muted);
      text-align: center;
    }

    .equipment-documents-error {
      padding: 12px;
      border: 1px solid #ef4444;
      border-radius: 9px;
      background: #4a1d24;
      color: #fecaca;
    }
  `;

  document.head.appendChild(
    style
  );
}


function renderEquipmentDocuments(
  documents
) {
  const content =
    document.getElementById(
      "equipmentDocumentsContent"
    );

  if (!content) {
    return;
  }

  content.replaceChildren();

  if (
    !Array.isArray(documents)
    || documents.length === 0
  ) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "equipment-documents-empty";

    empty.textContent =
      "Nenhum documento vinculado.";

    content.appendChild(
      empty
    );

    return;
  }

  documents.forEach(documentItem => {
    const entry =
      document.createElement(
        "article"
      );

    entry.className =
      "equipment-document-entry";

    const name =
      document.createElement(
        "div"
      );

    name.className =
      "equipment-document-name";

    name.textContent =
      documentItem.nome_documento
      || "Documento sem nome";

    const meta =
      document.createElement(
        "div"
      );

    meta.className =
      "equipment-document-meta";

    const formattedDate =
      formatDocumentDate(
        documentItem.criado_em
      );

    meta.textContent = [
      documentItem.tipo_documento
      || "Outro",
      formattedDate
    ]
      .filter(Boolean)
      .join(" | ");

    entry.appendChild(
      name
    );

    entry.appendChild(
      meta
    );

    if (documentItem.descricao) {
      const description =
        document.createElement(
          "div"
        );

      description.className =
        "equipment-document-description";

      description.textContent =
        documentItem.descricao;

      entry.appendChild(
        description
      );
    }

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "equipment-document-actions";

    const openLink =
      document.createElement(
        "a"
      );

    openLink.className =
      "mini-btn primary";

    openLink.textContent =
      "Abrir documento";

    openLink.href =
      "/api/documentos/"
      + documentItem.id
      + "/arquivo";

    openLink.target =
      "_blank";

    openLink.rel =
      "noopener noreferrer";

    actions.appendChild(
      openLink
    );

    entry.appendChild(
      actions
    );

    content.appendChild(
      entry
    );
  });
}


function showEquipmentDocumentError(
  message
) {
  const content =
    document.getElementById(
      "equipmentDocumentsContent"
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
    "equipment-documents-error";

  errorBox.textContent =
    message
    || "Nao foi possivel carregar os documentos.";

  content.appendChild(
    errorBox
  );
}


async function loadEquipmentDocuments(
  equipment
) {
  const equipmentId = Number(
    equipment?.databaseId
  );

  if (
    !Number.isInteger(
      equipmentId
    )
    || equipmentId < 1
  ) {
    showEquipmentDocumentError(
      "O equipamento nao possui "
      + "databaseId valido."
    );

    return;
  }

  try {
    const response = await fetch(
      "/api/documentos/equipamentos/"
      + equipmentId,
      {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        await readDocumentApiError(
          response
        )
      );
    }

    const documents =
      await response.json();

    renderEquipmentDocuments(
      documents
    );
  } catch (error) {
    console.error(
      "Falha ao carregar documentos "
      + "do equipamento.",
      error
    );

    showEquipmentDocumentError(
      error.message
    );
  }
}


window.showEquipmentModal =
  function showEquipmentModalWithDocuments(
    rack,
    equipment
  ) {
    const result =
      showEquipmentModalBeforeDocuments(
        rack,
        equipment
      );

    installDocumentStyles();

    const modalBody =
      document.getElementById(
        "equipmentModalBody"
      );

    if (!modalBody) {
      return result;
    }

    modalBody.appendChild(
      createDocumentSection()
    );

    loadEquipmentDocuments(
      equipment
    );

    return result;
  };


installDocumentStyles();