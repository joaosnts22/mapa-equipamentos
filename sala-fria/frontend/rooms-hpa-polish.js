const roomsHpaPolishApplied = true;


function installHpaPolishStyles() {
  const previousStyle =
    document.getElementById(
      "roomsHpaPolishStyles"
    );

  if (previousStyle) {
    previousStyle.remove();
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "roomsHpaPolishStyles";

  style.textContent = `
    body.room-hpa-active .room-wrap {
      width: 100%;
      height: 456px;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 12px;
    }

    body.room-hpa-active .room-stage {
      position: relative;
      flex: 0 0 auto;
      width: 792px;
      height: 416px;
      margin: 0;
    }

    body.room-hpa-active .room {
      position: relative;
      width: 792px;
      min-width: 792px;
      height: 416px;
      border-radius: 12px;
      overflow: hidden;
    }

    body.room-hpa-active .room-stage .wall {
      display: block;
      z-index: 5;
    }

    body.room-hpa-active .room-stage .wall.top-left {
      left: 4%;
      top: 4%;
      width: 41%;
      height: 12px;
    }

    body.room-hpa-active .room-stage .wall.top-right {
      left: 55%;
      right: 4%;
      top: 4%;
      height: 12px;
    }

    body.room-hpa-active .room-stage .wall.left-top {
      left: 4%;
      top: 4%;
      bottom: 4%;
      width: 12px;
    }

    body.room-hpa-active .room-stage .wall.left-bottom {
      display: none;
    }

    body.room-hpa-active .room-stage .wall.bottom-left {
      display: block;
      left: 4%;
      right: 4%;
      bottom: 4%;
      height: 12px;
    }

    body.room-hpa-active .room-stage .wall.bottom-right {
      display: none;
    }

    body.room-hpa-active .room-stage .wall.right {
      right: 4%;
      top: 4%;
      bottom: 4%;
      width: 12px;
    }

    body.room-hpa-active .room-stage .door-gap {
      left: 45%;
      top: 1%;
      width: 10%;
      height: 42px;
      z-index: 7;
    }

    body.room-hpa-active .room-stage .door-text {
      left: 50%;
      top: 13%;
      width: auto;
      transform: translateX(-50%);
      text-align: center;
      white-space: nowrap;
      z-index: 7;
    }

    body.room-hpa-active .room-stage .rack.horizontal {
      width: 273px !important;
      height: 42px !important;
      min-width: 273px;
      min-height: 42px;
      max-width: 273px;
      max-height: 42px;
    }

    body.room-hpa-active .room-stage .rack.vertical {
      width: 52px !important;
      height: 313px !important;
      min-width: 52px;
      min-height: 313px;
      max-width: 52px;
      max-height: 313px;
    }

    body.room-hpa-active .rack.horizontal .id {
      font-size: 14px;
    }

    body.room-hpa-active .rack.horizontal .owner {
      font-size: 10px;
    }

    body.room-hpa-active .rack.vertical .id {
      font-size: 14px;
    }

    body.room-hpa-active .rack.vertical .owner {
      font-size: 9px;
    }

    @media (max-width: 880px) {
      body.room-hpa-active .room-wrap {
        justify-content: flex-start;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


installHpaPolishStyles();