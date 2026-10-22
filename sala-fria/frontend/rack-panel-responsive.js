const rackPanelResponsiveApplied = true;


function installRackPanelResponsiveStyles() {
  const previousStyle =
    document.getElementById(
      "rackPanelResponsiveStyles"
    );

  if (previousStyle) {
    previousStyle.remove();
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "rackPanelResponsiveStyles";

  style.textContent = `
    .overlay {
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .drawer {
      width:
        min(
          1600px,
          calc(100vw - 48px)
        );

      height:
        min(
          920px,
          calc(100vh - 48px)
        );

      max-width:
        calc(100vw - 48px);

      max-height:
        calc(100vh - 48px);

      margin: auto;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: #081424;
      box-shadow:
        0 28px 90px #000b;
    }

    .drawer-head {
      position: relative;
      top: auto;
      flex: 0 0 auto;
      padding: 16px 20px;
      border-bottom:
        1px solid var(--line);
    }

    .drawer-head h2 {
      margin: 2px 0 0;
      font-size:
        clamp(
          22px,
          2vw,
          31px
        );
    }

    .drawer-body {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      padding: 12px;
      overflow: hidden;
    }

    .rack-workspace {
      width: 100%;
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .rack-toolbar {
      flex: 0 0 auto;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .rack-search {
      flex: 1 1 320px;
      min-width: 220px;
    }

    .rack-viewport {
      flex: 1 1 auto;
      width: 100%;
      height: auto;
      min-height: 0;
      overflow: auto;
      border-radius: 13px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 10px;
      background: #030810;
    }

    .rack-stage {
      flex: 0 0 auto;
      width: 1200px;
      height: 720px;
      margin: 0 auto;
      padding: 18px;
      transform-origin: top center;
    }

    .rack-face-grid {
      margin: 0 auto;
    }

    .equipment-dialog {
      width:
        min(
          620px,
          calc(100vw - 40px)
        );

      max-height:
        calc(100vh - 40px);
    }

    @media (max-width: 900px) {
      .overlay {
        padding: 12px;
      }

      .drawer {
        width:
          calc(100vw - 24px);

        height:
          calc(100vh - 24px);

        max-width:
          calc(100vw - 24px);

        max-height:
          calc(100vh - 24px);

        border-radius: 14px;
      }

      .drawer-head {
        padding: 13px 15px;
      }

      .drawer-body {
        padding: 8px;
      }

      .rack-toolbar {
        align-items: stretch;
      }

      .rack-search {
        flex-basis: 100%;
        width: 100%;
      }

      .zoom-bar {
        flex: 1 1 auto;
      }
    }

    @media (max-width: 600px) {
      .overlay {
        padding: 0;
      }

      .drawer {
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
        border: 0;
        border-radius: 0;
      }

      .drawer-head h2 {
        font-size: 22px;
      }

      .rack-toolbar
      .mini-btn {
        flex: 1 1 auto;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


installRackPanelResponsiveStyles();