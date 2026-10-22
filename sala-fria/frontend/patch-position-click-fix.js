const patchPositionClickFixApplied = true;


let patchPositionPointerState = null;


function getPatchPositionByNumber(
  positionNumber
) {
  const context =
    window.patchMapContext;

  if (
    !context
    || !context.databaseId
    || !Array.isArray(
      context.positions
    )
  ) {
    return null;
  }

  return context.positions.find(
    position =>
      Number(
        position.numero_posicao
      )
      === positionNumber
  ) || null;
}


document.addEventListener(
  "pointerdown",
  event => {
    const clickedElement =
      event.target instanceof Element
        ? event.target
        : null;

    const positionButton =
      clickedElement?.closest(
        ".patch-map-position"
      );

    if (
      !positionButton
      || positionButton.disabled
      || positionButton.closest(
        "#patchReadonlyMap"
      )
    ) {
      patchPositionPointerState =
        null;

      return;
    }

    const positionNumber =
      Number(
        positionButton.dataset
          .patchNumber
      );

    if (
      !Number.isInteger(
        positionNumber
      )
      || positionNumber < 1
      || positionNumber > 32
    ) {
      patchPositionPointerState =
        null;

      return;
    }

    patchPositionPointerState = {
      pointerId:
        event.pointerId,
      positionNumber:
        positionNumber,
      startX:
        event.clientX,
      startY:
        event.clientY
    };
  },
  true
);


document.addEventListener(
  "pointerup",
  event => {
    const state =
      patchPositionPointerState;

    patchPositionPointerState =
      null;

    if (
      !state
      || event.pointerId
      !== state.pointerId
    ) {
      return;
    }

    const movementX =
      Math.abs(
        event.clientX
        - state.startX
      );

    const movementY =
      Math.abs(
        event.clientY
        - state.startY
      );

    if (
      movementX > 7
      || movementY > 7
    ) {
      return;
    }

    const position =
      getPatchPositionByNumber(
        state.positionNumber
      );

    if (!position) {
      console.error(
        "Posicao do patch nao encontrada.",
        {
          positionNumber:
            state.positionNumber,
          patchMapContext:
            window.patchMapContext
        }
      );

      return;
    }

    if (
      typeof openPatchPositionEditor
      !== "function"
    ) {
      window.alert(
        "O editor individual do patch "
        + "nao foi carregado."
      );

      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    openPatchPositionEditor(
      position
    );
  },
  true
);


document.addEventListener(
  "pointercancel",
  event => {
    if (
      patchPositionPointerState
      && event.pointerId
      === patchPositionPointerState
        .pointerId
    ) {
      patchPositionPointerState =
        null;
    }
  },
  true
);