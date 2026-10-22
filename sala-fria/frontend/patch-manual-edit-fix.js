const patchManualEditFixApplied = true;


function refreshPatchManualEditState() {
  const modal =
    document.getElementById(
      "patchPositionModal"
    );

  if (!modal) {
    return;
  }

  const readonly =
    modal.classList.contains(
      "readonly"
    );

  const connectors = [
    {
      type: "entrada",
      fieldId:
        "patchManualInputDestination",
      wrapperId:
        "patchManualInputWrapper",
      indicatorId:
        "patchInputConnectionIndicator"
    },
    {
      type: "saida",
      fieldId:
        "patchManualOutputDestination",
      wrapperId:
        "patchManualOutputWrapper",
      indicatorId:
        "patchOutputConnectionIndicator"
    }
  ];

  connectors.forEach(
    connector => {
      const field =
        document.getElementById(
          connector.fieldId
        );

      const wrapper =
        document.getElementById(
          connector.wrapperId
        );

      const indicator =
        document.getElementById(
          connector.indicatorId
        );

      if (!field) {
        return;
      }

      const automaticConnection =
        indicator?.classList.contains(
          "connected"
        ) === true;

      wrapper?.classList.toggle(
        "automatic",
        automaticConnection
      );

      if (readonly) {
        field.disabled = false;
        field.readOnly = true;

      } else if (
        automaticConnection
      ) {
        field.disabled = true;
        field.readOnly = false;

      } else {
        field.disabled = false;
        field.readOnly = false;
      }
    }
  );
}


const openPatchPositionEditorBeforeManualEditFix =
  openPatchPositionEditor;


openPatchPositionEditor = function(
  position
) {
  const modal =
    document.getElementById(
      "patchPositionModal"
    );

  modal?.classList.remove(
    "readonly"
  );

  const result =
    openPatchPositionEditorBeforeManualEditFix(
      position
    );

  window.setTimeout(
    refreshPatchManualEditState,
    0
  );

  window.setTimeout(
    refreshPatchManualEditState,
    150
  );

  return result;
};


if (
  typeof showPatchConnected
  === "function"
) {
  const showPatchConnectedBeforeManualEditFix =
    showPatchConnected;

  showPatchConnected = function(
    connector,
    connection
  ) {
    const result =
      showPatchConnectedBeforeManualEditFix(
        connector,
        connection
      );

    window.setTimeout(
      refreshPatchManualEditState,
      0
    );

    return result;
  };
}


if (
  typeof showPatchDisconnected
  === "function"
) {
  const showPatchDisconnectedBeforeManualEditFix =
    showPatchDisconnected;

  showPatchDisconnected = function(
    connector
  ) {
    const result =
      showPatchDisconnectedBeforeManualEditFix(
        connector
      );

    window.setTimeout(
      refreshPatchManualEditState,
      0
    );

    return result;
  };
}