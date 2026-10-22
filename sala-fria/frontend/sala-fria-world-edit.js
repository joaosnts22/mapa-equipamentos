const salaFriaWorldEditApplied = true;


const SALA_FRIA_BASE_WIDTH =
  3200;

const SALA_FRIA_BASE_HEIGHT =
  545;

const SALA_FRIA_WORLD_OFFSET_X =
  0;

const SALA_FRIA_WORLD_OFFSET_Y =
  900;

const SALA_FRIA_WORLD_WIDTH =
  4200;

const SALA_FRIA_WORLD_HEIGHT =
  1500;


function installSalaFriaWorldEditStyles() {
  if (
    document.getElementById(
      "salaFriaWorldEditStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "salaFriaWorldEditStyles";

  style.textContent = `
    body.sala-fria-extended
    #room {
      overflow: visible !important;
    }

    body.sala-fria-extended
    #room.editing {
      overflow: visible !important;
    }

    body.sala-fria-extended
    .sala-fria-extension.editing
    .sala-fria-new-room,
    body.sala-fria-extended
    .sala-fria-extension.editing
    .sala-fria-corridor {
      background-color: #081526;
      background-image:
        radial-gradient(
          circle,
          #74cfff99 1.25px,
          transparent 1.5px
        );
      background-size: 25px 25px;
      background-position: 0 0;
    }

    body.sala-fria-extended
    .sala-fria-extension.editing
    .sala-fria-new-room {
      box-shadow:
        inset 0 0 0 1px #172434,
        inset 0 0 24px #22d3ee0f;
    }

    body.sala-fria-extended
    .sala-fria-extension.editing
    .sala-fria-corridor {
      box-shadow:
        inset 0 0 0 1px #172434,
        inset 0 0 24px #22d3ee0f;
    }

    .sala-fria-connection-mask {
      position: absolute;
      z-index: 10;
      left: 682px;
      top: 892px;
      width: 138px;
      height: 30px;
      box-sizing: border-box;
      border-left: 5px solid #ef4444;
      border-right: 5px solid #ef4444;
      background-color: #081526;
      background-image:
        linear-gradient(
          #1c30451f 1px,
          transparent 1px
        ),
        linear-gradient(
          90deg,
          #1c30451f 1px,
          transparent 1px
        );
      background-size: 25px 25px;
      pointer-events: none;
    }

    body:not(.sala-fria-extended)
    .sala-fria-connection-mask,
    body.room-hpa-active
    .sala-fria-connection-mask {
      display: none;
    }

    body.sala-fria-extended
    #room.editing
    .rack {
      z-index: 12;
    }

    body.sala-fria-extended
    #room
    .rack {
      transform-origin: center;
    }
  `;

  document.head.appendChild(
    style
  );
}


function createSalaFriaConnectionMask() {
  const stage =
    document.getElementById(
      "roomStage"
    );

  if (!stage) {
    return null;
  }

  let mask =
    document.getElementById(
      "salaFriaConnectionMask"
    );

  if (mask) {
    return mask;
  }

  mask =
    document.createElement(
      "div"
    );

  mask.id =
    "salaFriaConnectionMask";

  mask.className =
    "sala-fria-connection-mask";

  stage.appendChild(
    mask
  );

  return mask;
}


function updateSalaFriaWorldEditState() {
  const extension =
    document.getElementById(
      "salaFriaExtension"
    );

  if (!extension) {
    return;
  }

  extension.classList.toggle(
    "editing",
    Boolean(
      editMode
      && window.activeRoomKey
      === "sala_fria"
    )
  );
}


function normalizeWorldRackData() {
  let sequence = 1;

  racks.forEach(
    rack => {
      if (
        rack.layout === "vertical"
      ) {
        rack.w = 1.625;
        rack.h = 57.4679;
        rack.front = "right";

      } else if (
        rack.layout === "horizontal"
      ) {
        rack.w = 8.5313;
        rack.h = 7.7064;
        rack.front = "bottom";
      }

      if (
        !(
          "displayName"
          in rack
        )
      ) {
        rack.displayName =
          String(
            rack.id || ""
          ).startsWith(
            "SEM-NOME-"
          )
            ? ""
            : rack.id;
      }

      rack.x =
        Number.isFinite(
          Number(rack.x)
        )
          ? Number(rack.x)
          : 0;

      rack.y =
        Number.isFinite(
          Number(rack.y)
        )
          ? Number(rack.y)
          : 0;

      if (
        !Array.isArray(
          rack.items
        )
      ) {
        rack.items = [];
      }

      rack.items.forEach(
        item => {
          if (!item.id) {
            item.id =
              "EQ-"
              + sequence;

            sequence += 1;
          }

          if (
            !(
              "manufacturer"
              in item
            )
          ) {
            item.manufacturer = "";
          }

          if (
            !(
              "serial"
              in item
            )
          ) {
            item.serial = "";
          }

          if (
            !(
              "function"
              in item
            )
          ) {
            item.function = "";
          }

          if (
            !(
              "notes"
              in item
            )
          ) {
            item.notes = "";
          }

          if (
            !Number.isInteger(
              item.column
            )
          ) {
            item.column = 1;
          }

          if (
            !Number.isInteger(
              item.columnSpan
            )
          ) {
            item.columnSpan = 1;
          }
        }
      );
    }
  );
}


normalizeData =
  normalizeWorldRackData;


const moveDragBeforeWorld =
  moveDrag;


moveDrag = function(
  event
) {
  if (
    !drag
    || window.activeRoomKey
    !== "sala_fria"
    || !document.body.classList
      .contains(
        "sala-fria-extended"
      )
  ) {
    return moveDragBeforeWorld(
      event
    );
  }

  pointerMoved = true;

  const {
    rack,
    element,
    roomRect,
    offsetX,
    offsetY
  } = drag;

  const rackWidth =
    element.offsetWidth;

  const rackHeight =
    element.offsetHeight;

  let localX =
    event.clientX
    - roomRect.left
    - offsetX;

  let localY =
    event.clientY
    - roomRect.top
    - offsetY;

  localX =
    Math.round(
      localX
      / GRID_SIZE
    )
    * GRID_SIZE;

  localY =
    Math.round(
      localY
      / GRID_SIZE
    )
    * GRID_SIZE;

  const minimumX =
    -SALA_FRIA_WORLD_OFFSET_X;

  const minimumY =
    -SALA_FRIA_WORLD_OFFSET_Y;

  const maximumX =
    SALA_FRIA_WORLD_WIDTH
    - SALA_FRIA_WORLD_OFFSET_X
    - rackWidth;

  const maximumY =
    SALA_FRIA_WORLD_HEIGHT
    - SALA_FRIA_WORLD_OFFSET_Y
    - rackHeight;

  localX =
    Math.max(
      minimumX,
      Math.min(
        localX,
        maximumX
      )
    );

  localY =
    Math.max(
      minimumY,
      Math.min(
        localY,
        maximumY
      )
    );

  rack.x =
    Number(
      (
        localX
        / SALA_FRIA_BASE_WIDTH
        * 100
      ).toFixed(4)
    );

  rack.y =
    Number(
      (
        localY
        / SALA_FRIA_BASE_HEIGHT
        * 100
      ).toFixed(4)
    );

  element.style.left =
    localX + "px";

  element.style.top =
    localY + "px";
};


const setEditModeBeforeWorldEdit =
  setEditMode;


setEditMode = function(
  active
) {
  const result =
    setEditModeBeforeWorldEdit(
      active
    );

  updateSalaFriaWorldEditState();

  return result;
};


function installSalaFriaWorldEdit() {
  installSalaFriaWorldEditStyles();

  createSalaFriaConnectionMask();

  updateSalaFriaWorldEditState();
}


installSalaFriaWorldEdit();