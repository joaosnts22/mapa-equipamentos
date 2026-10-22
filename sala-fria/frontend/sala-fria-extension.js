const salaFriaExtensionApplied = true;


const SALA_FRIA_WORLD = {
  width: 4200,
  height: 1500,

  originalRoomLeft: 0,
  originalRoomTop: 900,

  originalRoomWidth: 3200,
  originalRoomHeight: 545,

  corridorLeft: 682,
  corridorTop: 60,
  corridorWidth: 138,
  corridorHeight: 854,

  newRoomLeft: 70,
  newRoomTop: 120,
  newRoomWidth: 612,
  newRoomHeight: 430
};


let salaFriaSpawnApplied = false;


function installSalaFriaExtensionStyles() {
  if (
    document.getElementById(
      "salaFriaExtensionStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "salaFriaExtensionStyles";

  style.textContent = `
    body.sala-fria-extended
    #roomStage {
      position: relative !important;
      width: 4200px !important;
      min-width: 4200px !important;
      height: 1500px !important;
      min-height: 1500px !important;
      margin: 0 !important;
      overflow: visible !important;
    }

    body.sala-fria-extended
    #room {
      position: absolute !important;
      left: 0 !important;
      top: 900px !important;
      width: 3200px !important;
      min-width: 3200px !important;
      height: 545px !important;
      min-height: 545px !important;
      margin: 0 !important;
      z-index: 4;
    }

    .sala-fria-extension {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    .sala-fria-extension[hidden] {
      display: none;
    }

    .sala-fria-new-room {
      position: absolute;
      left: 70px;
      top: 120px;
      width: 612px;
      height: 430px;
      border-left: 7px solid #03070c;
      border-top: 7px solid #03070c;
      border-bottom: 7px solid #03070c;
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
      box-shadow:
        inset 0 0 0 1px #172434;
    }

    .sala-fria-corridor {
      position: absolute;
      left: 682px;
      top: 60px;
      width: 138px;
      height: 854px;
      border-left: 7px solid #03070c;
      border-right: 7px solid #03070c;
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
      box-shadow:
        inset 0 0 0 1px #172434;
    }

    .sala-fria-door {
      position: absolute;
      z-index: 3;
      border-color: #ef4444;
      pointer-events: none;
    }

    .sala-fria-door-top {
      left: 682px;
      top: 60px;
      width: 138px;
      height: 31px;
      border-top: 5px solid #ef4444;
      border-left: 5px solid #ef4444;
      border-right: 5px solid #ef4444;
      border-radius: 4px 4px 0 0;
    }

    .sala-fria-door-side {
      left: 680px;
      top: 250px;
      width: 20px;
      height: 82px;
      border-top: 5px solid #ef4444;
      border-bottom: 5px solid #ef4444;
      border-left: 5px solid #ef4444;
      border-radius: 4px 0 0 4px;
    }

    .sala-fria-door-connection {
      left: 682px;
      top: 885px;
      width: 138px;
      height: 32px;
      border-left: 5px solid #ef4444;
      border-right: 5px solid #ef4444;
    }

    .sala-fria-extension-label {
      position: absolute;
      left: 88px;
      top: 137px;
      z-index: 2;
      color: #6f849a;
      font-size: 11px;
      font-weight: 850;
      letter-spacing: .08em;
      pointer-events: none;
    }

    body.room-hpa-active
    .sala-fria-extension {
      display: none !important;
    }

    body.room-hpa-active
    #roomStage {
      margin-left: auto !important;
      margin-right: auto !important;
    }
  `;

  document.head.appendChild(
    style
  );
}


function createSalaFriaExtension() {
  const stage =
    document.getElementById(
      "roomStage"
    );

  if (!stage) {
    return null;
  }

  let extension =
    document.getElementById(
      "salaFriaExtension"
    );

  if (extension) {
    return extension;
  }

  extension =
    document.createElement(
      "div"
    );

  extension.id =
    "salaFriaExtension";

  extension.className =
    "sala-fria-extension";

  extension.innerHTML = `
    <div
      class="sala-fria-new-room"
    ></div>

    <div
      class="sala-fria-corridor"
    ></div>

    <div
      class="
        sala-fria-door
        sala-fria-door-top
      "
    ></div>

    <div
      class="
        sala-fria-door
        sala-fria-door-side
      "
    ></div>

    <div
      class="
        sala-fria-door
        sala-fria-door-connection
      "
    ></div>

    <div
      class="sala-fria-extension-label"
    >
      
    </div>
  `;

  stage.insertBefore(
    extension,
    stage.firstChild
  );

  return extension;
}


function applySalaFriaWorldGeometry() {
  const stage =
    document.getElementById(
      "roomStage"
    );

  const currentRoom =
    document.getElementById(
      "room"
    );

  if (
    !stage
    || !currentRoom
  ) {
    return;
  }

  stage.style.width =
    SALA_FRIA_WORLD.width
    + "px";

  stage.style.minWidth =
    SALA_FRIA_WORLD.width
    + "px";

  stage.style.height =
    SALA_FRIA_WORLD.height
    + "px";

  stage.style.minHeight =
    SALA_FRIA_WORLD.height
    + "px";

  stage.style.margin =
    "0";

  currentRoom.style.position =
    "absolute";

  currentRoom.style.left =
    SALA_FRIA_WORLD
      .originalRoomLeft
    + "px";

  currentRoom.style.top =
    SALA_FRIA_WORLD
      .originalRoomTop
    + "px";

  currentRoom.style.width =
    SALA_FRIA_WORLD
      .originalRoomWidth
    + "px";

  currentRoom.style.minWidth =
    SALA_FRIA_WORLD
      .originalRoomWidth
    + "px";

  currentRoom.style.height =
    SALA_FRIA_WORLD
      .originalRoomHeight
    + "px";

  currentRoom.style.minHeight =
    SALA_FRIA_WORLD
      .originalRoomHeight
    + "px";
}


function restoreDefaultRoomGeometry() {
  const stage =
    document.getElementById(
      "roomStage"
    );

  const currentRoom =
    document.getElementById(
      "room"
    );

  if (
    !stage
    || !currentRoom
  ) {
    return;
  }

  stage.style.width = "";
  stage.style.minWidth = "";
  stage.style.height = "";
  stage.style.minHeight = "";
  stage.style.margin = "";

  currentRoom.style.position = "";
  currentRoom.style.left = "";
  currentRoom.style.top = "";
  currentRoom.style.width = "";
  currentRoom.style.minWidth = "";
  currentRoom.style.height = "";
  currentRoom.style.minHeight = "";
}


function applySalaFriaSpawn(
  force = false
) {
  if (
    window.activeRoomKey
    !== "sala_fria"
  ) {
    return;
  }

  if (
    salaFriaSpawnApplied
    && !force
  ) {
    return;
  }

  window.requestAnimationFrame(
    () => {
      roomWrap.scrollLeft = 0;

      roomWrap.scrollTop =
        SALA_FRIA_WORLD
          .originalRoomTop;

      salaFriaSpawnApplied =
        true;
    }
  );
}


function applySalaFriaExtensionState(
  options = {}
) {
  const roomKey =
    window.activeRoomKey
    || "sala_fria";

  const extension =
    createSalaFriaExtension();

  if (
    roomKey === "sala_fria"
  ) {
    document.body.classList.add(
      "sala-fria-extended"
    );

    if (extension) {
      extension.hidden = false;
    }

    applySalaFriaWorldGeometry();

    applySalaFriaSpawn(
      options.forceSpawn === true
    );

    return;
  }

  document.body.classList.remove(
    "sala-fria-extended"
  );

  if (extension) {
    extension.hidden = true;
  }

  restoreDefaultRoomGeometry();

  salaFriaSpawnApplied = false;
}


function installSalaFriaExtension() {
  installSalaFriaExtensionStyles();

  createSalaFriaExtension();

  applySalaFriaExtensionState({
    forceSpawn: true
  });
}


const changeActiveRoomBeforeExtension =
  changeActiveRoom;


changeActiveRoom = function(
  roomKey
) {
  const result =
    changeActiveRoomBeforeExtension(
      roomKey
    );

  window.requestAnimationFrame(
    () => {
      applySalaFriaExtensionState({
        forceSpawn:
          roomKey === "sala_fria"
      });
    }
  );

  return result;
};


installSalaFriaExtension();