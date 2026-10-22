const roomsUiApplied = true;


const ROOM_DEFINITIONS = {
  sala_fria: {
    label: "Sala Fria",
    square: false
  },

  sala_hpa: {
    label: "Sala B",
    square: true
  }
};


let activeRoomKey =
  localStorage.getItem(
    "mapaSalaAtiva"
  )
  || "sala_fria";


if (
  !ROOM_DEFINITIONS[
    activeRoomKey
  ]
) {
  activeRoomKey =
    "sala_fria";
}


window.activeRoomKey =
  activeRoomKey;


function getRackRoom(
  rack
) {
  return (
    rack?.salaKey
    || rack?.sala_key
    || "sala_fria"
  );
}


function getActiveRoomRacks() {
  return racks.filter(
    rack =>
      getRackRoom(rack)
      === activeRoomKey
  );
}


function runWithActiveRoomRacks(
  callback
) {
  const allRacks =
    racks.slice();

  const roomRacks =
    allRacks.filter(
      rack =>
        getRackRoom(rack)
        === activeRoomKey
    );

  racks.splice(
    0,
    racks.length,
    ...roomRacks
  );

  try {
    return callback();
  } finally {
    racks.splice(
      0,
      racks.length,
      ...allRacks
    );
  }
}


const renderBeforeRooms =
  render;


render =
  function renderCurrentRoom() {
    return runWithActiveRoomRacks(
      () => renderBeforeRooms()
    );
  };


const updateCountsBeforeRooms =
  updateCounts;


updateCounts =
  function updateCurrentRoomCounts() {
    return runWithActiveRoomRacks(
      () =>
        updateCountsBeforeRooms()
    );
  };


const originalFetchForRooms =
  window.fetch.bind(
    window
  );


window.fetch =
  async function fetchWithRoom(
    input,
    options = {}
  ) {
    const requestUrl =
      typeof input === "string"
        ? input
        : input?.url || "";

    const requestMethod =
      String(
        options?.method || "GET"
      ).toUpperCase();

    if (
      requestMethod === "POST"
      && requestUrl === "/api/racks"
      && typeof options?.body
        === "string"
    ) {
      try {
        const requestData =
          JSON.parse(
            options.body
          );

        requestData.sala_key =
          activeRoomKey;

        options = {
          ...options,
          body: JSON.stringify(
            requestData
          )
        };
      } catch (error) {
        console.error(
          "Nao foi possivel incluir "
          + "a sala na nova fileira.",
          error
        );
      }
    }

    return originalFetchForRooms(
      input,
      options
    );
  };


const createRackBeforeRooms =
  createRackThroughApi;


createRackThroughApi =
  async function createRackInRoom() {
    const allRacks =
      racks.slice();

    const currentRoomRacks =
      allRacks.filter(
        rack =>
          getRackRoom(rack)
          === activeRoomKey
      );

    racks.splice(
      0,
      racks.length,
      ...currentRoomRacks
    );

    let createdRack = null;

    try {
      createdRack =
        await createRackBeforeRooms();

      if (createdRack) {
        createdRack.salaKey =
          activeRoomKey;
      }

      return createdRack;
    } finally {
      const updatedRoomRacks =
        racks.slice();

      racks.splice(
        0,
        racks.length,
        ...allRacks
      );

      updatedRoomRacks.forEach(
        roomRack => {
          const alreadyExists =
            racks.some(
              rack =>
                rack.rackKey
                === roomRack.rackKey
            );

          if (!alreadyExists) {
            racks.push(
              roomRack
            );
          }
        }
      );

      render();
      updateCounts();
    }
  };


function createRoomSwitcher() {
  document.getElementById(
    "roomSwitcher"
  )?.remove();

  const switcher =
    document.createElement(
      "nav"
    );

  switcher.id =
    "roomSwitcher";

  switcher.className =
    "room-switcher";

  switcher.setAttribute(
    "aria-label",
    "Selecionar sala"
  );

  Object.entries(
    ROOM_DEFINITIONS
  ).forEach(
    ([roomKey, roomData]) => {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "room-switch-button";

      button.dataset.roomKey =
        roomKey;

      button.textContent =
        roomData.label;

      button.onclick = () => {
        changeActiveRoom(
          roomKey
        );
      };

      switcher.appendChild(
        button
      );
    }
  );

  const header =
    document.querySelector(
      ".header"
    );

  if (header) {
    header.insertAdjacentElement(
      "afterend",
      switcher
    );
  }
}


function updateRoomSwitcher() {
  document
    .querySelectorAll(
      ".room-switch-button"
    )
    .forEach(
      button => {
        const selected =
          button.dataset.roomKey
          === activeRoomKey;

        button.classList.toggle(
          "active",
          selected
        );

        button.setAttribute(
          "aria-pressed",
          selected
            ? "true"
            : "false"
        );
      }
    );
}


function applyRoomAppearance() {
  const roomDefinition =
    ROOM_DEFINITIONS[
      activeRoomKey
    ];

  document.body.classList.toggle(
    "room-hpa-active",
    Boolean(
      roomDefinition?.square
    )
  );

  const mapHeading =
    document.querySelector(
      ".map-title"
    );

  if (mapHeading) {
    mapHeading.dataset.roomKey =
      activeRoomKey;
  }
}


function changeActiveRoom(
  roomKey
) {
  if (
    !ROOM_DEFINITIONS[
      roomKey
    ]
  ) {
    return;
  }

  activeRoomKey =
    roomKey;

  window.activeRoomKey =
    activeRoomKey;

  localStorage.setItem(
    "mapaSalaAtiva",
    activeRoomKey
  );

  selectedRackId = null;

  overlay?.classList.remove(
    "open"
  );

  applyRoomAppearance();
  updateRoomSwitcher();
  updateCounts();
  render();

  const roomName =
    ROOM_DEFINITIONS[
      roomKey
    ].label;

  showStatus(
    roomName.toUpperCase()
  );
}


function installRoomStyles() {
  if (
    document.getElementById(
      "roomSwitcherStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "roomSwitcherStyles";

  style.textContent = `
    .room-switcher {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 5px;
      width: fit-content;
      border: 1px solid var(--line);
      border-radius: 13px;
      background: #07111f;
    }

    .room-switch-button {
      border: 1px solid transparent;
      border-radius: 9px;
      background: transparent;
      color: var(--muted);
      padding: 10px 16px;
      font-weight: 800;
      cursor: pointer;
      transition:
        background 0.18s,
        color 0.18s,
        border-color 0.18s;
    }

    .room-switch-button:hover {
      color: #ffffff;
      background: #122238;
    }

    .room-switch-button.active {
      color: #ffffff;
      background: #0e7490;
      border-color: #22d3ee;
      box-shadow:
        0 0 18px #22d3ee22;
    }

    body.room-hpa-active
    .room-wrap {
      height: 760px;
    }

    body.room-hpa-active
    .room-stage {
      width: 760px;
      height: 760px;
      margin: 0 auto;
    }

    body.room-hpa-active
    .room {
      width: 760px;
      min-width: 760px;
      height: 760px;
    }

    body.room-hpa-active
    .room-stage
    .wall.top-left {
      left: 4%;
      top: 4%;
      width: 36%;
    }

    body.room-hpa-active
    .room-stage
    .wall.top-right {
      left: 60%;
      right: 4%;
      top: 4%;
    }

    body.room-hpa-active
    .room-stage
    .wall.left-top {
      left: 4%;
      top: 4%;
      bottom: 4%;
    }

    body.room-hpa-active
    .room-stage
    .wall.bottom-left {
      left: 4%;
      right: 4%;
      bottom: 4%;
    }

    body.room-hpa-active
    .room-stage
    .wall.right {
      right: 4%;
      top: 4%;
      bottom: 4%;
    }

    body.room-hpa-active
    .room-stage
    .door-gap {
      left: 40%;
      top: 2.7%;
      width: 20%;
      height: 66px;
    }

    body.room-hpa-active
    .room-stage
    .door-text {
      left: 50%;
      top: 13%;
      transform: translateX(-50%);
      white-space: nowrap;
    }

    @media(max-width: 850px) {
      .room-switcher {
        width: 100%;
      }

      .room-switch-button {
        flex: 1;
      }

      body.room-hpa-active
      .room-stage,
      body.room-hpa-active
      .room {
        width: 700px;
        min-width: 700px;
        height: 700px;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


function initializeRoomsUi() {
  installRoomStyles();
  createRoomSwitcher();
  applyRoomAppearance();
  updateRoomSwitcher();
  updateCounts();
  render();
}


initializeRoomsUi();