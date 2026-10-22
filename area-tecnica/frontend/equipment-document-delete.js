const equipmentDocumentDeleteUiApplied = true;

const renderEquipmentDocumentsBeforeDelete =
  window.renderEquipmentDocuments;


function documentNameForDelete(
  documentItem
) {
  return String(
    documentItem?.nome_documento
    || "Documento sem nome"
  );
}


async function deleteDocumentThroughApi(
  documentItem
) {
  if (!isAdministrator()) {
    throw new Error(
      "Entre como administrador "
      + "para excluir documentos."
    );
  }

  const documentId = Number(
    documentItem?.id
  );

  if (
    !Number.isInteger(
      documentId
    )
    || documentId < 1
  ) {
    throw new Error(
      "O documento nao possui ID valido."
    );
  }

  const response = await fetch(
    "/api/documentos/"
    + documentId,
    {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json"
      }
    }
  );

  if (response.status === 401) {
    authenticatedUser = null;

    applyAuthenticationState();

    throw new Error(
      "A sessao administrativa expirou. "
      + "Entre novamente antes de excluir."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "O usuario atual nao possui permissao "
      + "para excluir documentos."
    );
  }

  if (response.status === 404) {
    throw new Error(
      await readDocumentApiError(
        response
      )
      || "O documento nao foi encontrado."
    );
  }

  if (
    response.status === 409
    || response.status === 422
  ) {
    const message =
      await readDocumentApiError(
        response
      );

    const conflictError =
      new Error(
        message
        || "Nao foi possivel excluir o documento."
      );

    conflictError.isConflict = true;

    throw conflictError;
  }

  if (!response.ok) {
    throw new Error(
      await readDocumentApiError(
        response
      )
      || (
        "O servidor respondeu com HTTP "
        + response.status
        + "."
      )
    );
  }

  return await response.json();
}


function showDocumentDeleteError(
  message
) {
  const content =
    document.getElementById(
      "equipmentDocumentsContent"
    );

  if (!content) {
    window.alert(
      message
      || "Nao foi possivel excluir o documento."
    );

    return;
  }

  let errorBox =
    document.getElementById(
      "equipmentDocumentDeleteError"
    );

  if (!errorBox) {
    errorBox =
      document.createElement(
        "div"
      );

    errorBox.id =
      "equipmentDocumentDeleteError";

    errorBox.className =
      "equipment-documents-error";

    content.prepend(
      errorBox
    );
  }

  errorBox.textContent =
    message
    || "Nao foi possivel excluir o documento.";
}


async function confirmAndDeleteDocument(
  equipment,
  documentItem,
  deleteButton
) {
  const documentName =
    documentNameForDelete(
      documentItem
    );

  const confirmed =
    window.confirm(
      "Excluir o documento "
      + documentName
      + "?\n\n"
      + "O documento deixara de aparecer "
      + "no mapa, mas o arquivo fisico sera "
      + "preservado para auditoria."
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    deleteButton.textContent;

  deleteButton.disabled = true;

  deleteButton.textContent =
    "Excluindo...";

  try {
    await deleteDocumentThroughApi(
      documentItem
    );

    await loadEquipmentDocuments(
      equipment
    );

    showStatus(
      "DOCUMENTO EXCLUIDO"
    );
  } catch (error) {
    console.error(
      "Falha ao excluir documento.",
      error
    );

    showDocumentDeleteError(
      error.message
    );

    if (error.isConflict) {
      showStatus(
        "EXCLUSAO DE DOCUMENTO BLOQUEADA"
      );
    }
  } finally {
    const currentButton =
      document.getElementById(
        "deleteDocumentButton-"
        + documentItem.id
      );

    if (currentButton) {
      currentButton.disabled =
        false;

      currentButton.textContent =
        originalText;
    }
  }
}


function installDocumentDeleteButtons(
  equipment,
  documents
) {
  if (!isAdministrator()) {
    return;
  }

  if (!Array.isArray(documents)) {
    return;
  }

  const entries =
    document.querySelectorAll(
      ".equipment-document-entry"
    );

  entries.forEach(
    (
      entry,
      index
    ) => {
      const documentItem =
        documents[index];

      if (!documentItem) {
        return;
      }

      const actions =
        entry.querySelector(
          ".equipment-document-actions"
        );

      if (!actions) {
        return;
      }

      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.type =
        "button";

      deleteButton.id =
        "deleteDocumentButton-"
        + documentItem.id;

      deleteButton.className =
        "mini-btn danger";

      deleteButton.textContent =
        "Excluir documento";

      deleteButton.onclick =
        async event => {
          event.preventDefault();
          event.stopPropagation();

          await confirmAndDeleteDocument(
            equipment,
            documentItem,
            deleteButton
          );
        };

      actions.appendChild(
        deleteButton
      );
    }
  );
}


let currentDocumentEquipment = null;


window.renderEquipmentDocuments =
  function renderEquipmentDocumentsWithDelete(
    documents
  ) {
    const result =
      renderEquipmentDocumentsBeforeDelete(
        documents
      );

    installDocumentDeleteButtons(
      currentDocumentEquipment,
      documents
    );

    return result;
  };


const showEquipmentModalBeforeDocumentDelete =
  window.showEquipmentModal;


window.showEquipmentModal =
  function showEquipmentModalWithDocumentDelete(
    rack,
    equipment
  ) {
    currentDocumentEquipment =
      equipment;

    return showEquipmentModalBeforeDocumentDelete(
      rack,
      equipment
    );
  };