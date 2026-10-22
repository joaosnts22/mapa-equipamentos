const equipmentDocumentUploadUiApplied = true;

const showEquipmentModalBeforeDocumentUpload =
  window.showEquipmentModal;

const DOCUMENT_UPLOAD_MAX_BYTES =
  50 * 1024 * 1024;

const DOCUMENT_UPLOAD_TYPES = [
  "Foto",
  "Diagrama",
  "Manual",
  "GMUD",
  "Inventario",
  "Outro"
];


function createDocumentUploadButton() {
  const button =
    document.createElement(
      "button"
    );

  button.type = "button";

  button.id =
    "addEquipmentDocumentButton";

  button.className =
    "mini-btn primary";

  button.textContent =
    "+ Adicionar documento";

  return button;
}


function createDocumentUploadField(
  labelText
) {
  const field =
    document.createElement(
      "div"
    );

  field.className =
    "form-field full";

  const label =
    document.createElement(
      "label"
    );

  label.textContent =
    labelText;

  field.appendChild(
    label
  );

  return field;
}


function createDocumentTypeSelect() {
  const select =
    document.createElement(
      "select"
    );

  select.id =
    "documentUploadType";

  DOCUMENT_UPLOAD_TYPES.forEach(
    documentType => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        documentType;

      option.textContent =
        documentType;

      if (
        documentType
        === "Outro"
      ) {
        option.selected = true;
      }

      select.appendChild(
        option
      );
    }
  );

  return select;
}


function createDocumentUploadForm() {
  const form =
    document.createElement(
      "section"
    );

  form.id =
    "equipmentDocumentUploadForm";

  form.className =
    "card item-form";

  form.hidden = true;

  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    "Adicionar documento";

  const errorBox =
    document.createElement(
      "div"
    );

  errorBox.id =
    "documentUploadError";

  errorBox.className =
    "form-error";

  const grid =
    document.createElement(
      "div"
    );

  grid.className =
    "form-grid";

  const fileField =
    createDocumentUploadField(
      "ARQUIVO *"
    );

  const fileInput =
    document.createElement(
      "input"
    );

  fileInput.id =
    "documentUploadFile";

  fileInput.type =
    "file";

  fileInput.accept = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".zip"
  ].join(",");

  fileField.appendChild(
    fileInput
  );

  const nameField =
    createDocumentUploadField(
      "NOME DO DOCUMENTO *"
    );

  const nameInput =
    document.createElement(
      "input"
    );

  nameInput.id =
    "documentUploadName";

  nameInput.maxLength =
    255;

  nameInput.placeholder =
    "Ex.: Manual do equipamento";

  nameField.appendChild(
    nameInput
  );

  const typeField =
    createDocumentUploadField(
      "TIPO DE DOCUMENTO *"
    );

  typeField.appendChild(
    createDocumentTypeSelect()
  );

  const descriptionField =
    createDocumentUploadField(
      "DESCRICAO"
    );

  const descriptionInput =
    document.createElement(
      "textarea"
    );

  descriptionInput.id =
    "documentUploadDescription";

  descriptionInput.placeholder =
    "Informacoes adicionais sobre o documento";

  descriptionField.appendChild(
    descriptionInput
  );

  grid.appendChild(
    fileField
  );

  grid.appendChild(
    nameField
  );

  grid.appendChild(
    typeField
  );

  grid.appendChild(
    descriptionField
  );

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "form-actions";

  const cancelButton =
    document.createElement(
      "button"
    );

  cancelButton.type =
    "button";

  cancelButton.id =
    "cancelDocumentUpload";

  cancelButton.className =
    "mini-btn";

  cancelButton.textContent =
    "Cancelar";

  const saveButton =
    document.createElement(
      "button"
    );

  saveButton.type =
    "button";

  saveButton.id =
    "saveDocumentUpload";

  saveButton.className =
    "mini-btn primary";

  saveButton.textContent =
    "Enviar documento";

  actions.appendChild(
    cancelButton
  );

  actions.appendChild(
    saveButton
  );

  form.appendChild(
    title
  );

  form.appendChild(
    errorBox
  );

  form.appendChild(
    grid
  );

  form.appendChild(
    actions
  );

  return form;
}


function showDocumentUploadError(
  message
) {
  const errorBox =
    document.getElementById(
      "documentUploadError"
    );

  if (!errorBox) {
    return;
  }

  errorBox.textContent =
    message
    || "Nao foi possivel enviar o documento.";

  errorBox.classList.add(
    "show"
  );
}


function clearDocumentUploadError() {
  const errorBox =
    document.getElementById(
      "documentUploadError"
    );

  if (!errorBox) {
    return;
  }

  errorBox.textContent = "";

  errorBox.classList.remove(
    "show"
  );
}


function closeDocumentUploadForm() {
  const form =
    document.getElementById(
      "equipmentDocumentUploadForm"
    );

  const addButton =
    document.getElementById(
      "addEquipmentDocumentButton"
    );

  if (form) {
    form.hidden = true;
  }

  if (addButton) {
    addButton.hidden = false;
  }

  clearDocumentUploadError();
}


function openDocumentUploadForm() {
  const form =
    document.getElementById(
      "equipmentDocumentUploadForm"
    );

  const addButton =
    document.getElementById(
      "addEquipmentDocumentButton"
    );

  if (form) {
    form.hidden = false;
  }

  if (addButton) {
    addButton.hidden = true;
  }

  clearDocumentUploadError();

  document.getElementById(
    "documentUploadFile"
  )?.focus();
}


function encodeDocumentHeader(
  value
) {
  return encodeURIComponent(
    String(value || "")
  );
}


function validateDocumentUpload(
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
    throw new Error(
      "O equipamento nao possui databaseId valido."
    );
  }

  const fileInput =
    document.getElementById(
      "documentUploadFile"
    );

  const selectedFile =
    fileInput?.files?.[0];

  if (!selectedFile) {
    throw new Error(
      "Selecione um arquivo."
    );
  }

  if (selectedFile.size < 1) {
    throw new Error(
      "O arquivo selecionado esta vazio."
    );
  }

  if (
    selectedFile.size
    > DOCUMENT_UPLOAD_MAX_BYTES
  ) {
    throw new Error(
      "O arquivo ultrapassa o limite de 50 MiB."
    );
  }

  const documentName =
    String(
      document.getElementById(
        "documentUploadName"
      )?.value || ""
    ).trim();

  if (!documentName) {
    throw new Error(
      "Informe o nome do documento."
    );
  }

  const documentType =
    String(
      document.getElementById(
        "documentUploadType"
      )?.value || ""
    ).trim();

  if (
    !DOCUMENT_UPLOAD_TYPES.includes(
      documentType
    )
  ) {
    throw new Error(
      "Selecione um tipo de documento valido."
    );
  }

  const description =
    String(
      document.getElementById(
        "documentUploadDescription"
      )?.value || ""
    ).trim();

  return {
    equipmentId,
    selectedFile,
    documentName,
    documentType,
    description
  };
}


async function uploadEquipmentDocument(
  equipment
) {
  if (!isAdministrator()) {
    throw new Error(
      "Entre como administrador "
      + "para adicionar documentos."
    );
  }

  const uploadData =
    validateDocumentUpload(
      equipment
    );

  const response = await fetch(
    "/api/documentos/equipamentos/"
    + uploadData.equipmentId,
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type":
          uploadData.selectedFile.type
          || "application/octet-stream",
        "X-Document-Name":
          encodeDocumentHeader(
            uploadData.documentName
          ),
        "X-Document-Type":
          encodeDocumentHeader(
            uploadData.documentType
          ),
        "X-Document-Description":
          encodeDocumentHeader(
            uploadData.description
          ),
        "X-Original-Filename":
          encodeDocumentHeader(
            uploadData.selectedFile.name
          )
      },
      body: uploadData.selectedFile
    }
  );

  if (response.status === 401) {
    authenticatedUser = null;

    applyAuthenticationState();

    throw new Error(
      "A sessao administrativa expirou. "
      + "Entre novamente antes de enviar."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "O usuario atual nao possui permissao "
      + "para adicionar documentos."
    );
  }

  if (!response.ok) {
    throw new Error(
      await readDocumentApiError(
        response
      )
    );
  }

  return await response.json();
}


function installDocumentUploadUi(
  equipment
) {
  if (!isAdministrator()) {
    return;
  }

  const section =
    document.getElementById(
      "equipmentDocumentsSection"
    );

  if (!section) {
    return;
  }

  if (
    document.getElementById(
      "equipmentDocumentUploadForm"
    )
  ) {
    return;
  }

  const addButton =
    createDocumentUploadButton();

  const uploadForm =
    createDocumentUploadForm();

  section.insertBefore(
    addButton,
    section.children[1] || null
  );

  section.appendChild(
    uploadForm
  );

  addButton.onclick = () => {
    openDocumentUploadForm();
  };

  document.getElementById(
    "cancelDocumentUpload"
  ).onclick = () => {
    closeDocumentUploadForm();
  };

  document.getElementById(
    "documentUploadFile"
  ).onchange = event => {
    const selectedFile =
      event.target.files?.[0];

    const nameInput =
      document.getElementById(
        "documentUploadName"
      );

    if (
      selectedFile
      && nameInput
      && !nameInput.value.trim()
    ) {
      nameInput.value =
        selectedFile.name;
    }
  };

  document.getElementById(
    "saveDocumentUpload"
  ).onclick =
    async event => {
      event.preventDefault();

      clearDocumentUploadError();

      const saveButton =
        event.currentTarget;

      const originalText =
        saveButton.textContent;

      saveButton.disabled = true;

      saveButton.textContent =
        "Enviando...";

      try {
        await uploadEquipmentDocument(
          equipment
        );

        closeDocumentUploadForm();

        await loadEquipmentDocuments(
          equipment
        );

        showStatus(
          "DOCUMENTO ADICIONADO"
        );
      } catch (error) {
        console.error(
          "Falha ao adicionar documento.",
          error
        );

        showDocumentUploadError(
          error.message
        );
      } finally {
        const currentButton =
          document.getElementById(
            "saveDocumentUpload"
          );

        if (currentButton) {
          currentButton.disabled =
            false;

          currentButton.textContent =
            originalText;
        }
      }
    };
}


window.showEquipmentModal =
  function showEquipmentModalWithDocumentUpload(
    rack,
    equipment
  ) {
    const result =
      showEquipmentModalBeforeDocumentUpload(
        rack,
        equipment
      );

    installDocumentUploadUi(
      equipment
    );

    return result;
  };