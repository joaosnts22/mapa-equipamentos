const rackModuleLabelsApplied = true;


function getRackModuleLabelPrefix(
  rack
) {
  const visibleName =
    String(
      rack?.displayName
      || rack?.id
      || ""
    ).trim().toUpperCase();

  if (
    /^[A-Y]$/.test(
      visibleName
    )
  ) {
    return visibleName;
  }

  return "";
}


function removeRackModuleLabels() {
  document
    .querySelectorAll(
      ".rack-module-labels"
    )
    .forEach(
      element => {
        element.remove();
      }
    );
}


function renderRackModuleLabels(
  rack
) {
  removeRackModuleLabels();

  const grid =
    document.getElementById(
      "rackFaceGrid"
    );

  if (!grid || !rack) {
    return;
  }

  const moduleCount =
    Math.max(
      1,
      Number(
        rack.quantidadeModulos
        || 8
      )
    );

  const prefix =
    getRackModuleLabelPrefix(
      rack
    );

  const labels =
    document.createElement(
      "div"
    );

  labels.className =
    "rack-module-labels";

  labels.style.gridTemplateColumns =
    "repeat("
    + moduleCount
    + ", minmax(0, 1fr))";

  for (
    let moduleNumber = 1;
    moduleNumber <= moduleCount;
    moduleNumber += 1
  ) {
    const label =
      document.createElement(
        "div"
      );

    label.className =
      "rack-module-label";

    label.textContent =
      prefix
        ? prefix + moduleNumber
        : String(moduleNumber);

    label.title =
      prefix
        ? (
            "Fileira "
            + prefix
            + ", rack "
            + moduleNumber
          )
        : (
            "Rack "
            + moduleNumber
          );

    labels.appendChild(
      label
    );
  }

  grid.appendChild(
    labels
  );
}


function scheduleRackModuleLabels(
  rack
) {
  window.requestAnimationFrame(
    () => {
      window.requestAnimationFrame(
        () => {
          renderRackModuleLabels(
            rack
          );
        }
      );
    }
  );
}


function installRackModuleLabelStyles() {
  if (
    document.getElementById(
      "rackModuleLabelStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "rackModuleLabelStyles";

  style.textContent = `
    .rack-face-grid {
      overflow: visible !important;
    }

    .rack-module-labels {
      position: absolute;
      z-index: 8;
      left: 0;
      right: 0;
      top: -38px;
      height: 30px;
      display: grid;
      gap: 2px;
      pointer-events: none;
    }

    .rack-module-label {
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 3px;
      border: 1px solid #22d3ee66;
      border-radius: 7px;
      background:
        linear-gradient(
          180deg,
          #17314a,
          #0c1d30
        );
      color: #b8efff;
      box-shadow:
        0 5px 14px #0006;
      font-size: clamp(
        9px,
        1vw,
        12px
      );
      font-weight: 900;
      line-height: 1;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rack-module-labels
    + .rack-cell {
      position: relative;
    }

    @media (max-width: 800px) {
      .rack-module-labels {
        top: -34px;
        height: 27px;
      }

      .rack-module-label {
        padding: 3px 2px;
        font-size: 9px;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


const renderRackWorkspaceBeforeLabels =
  renderRackWorkspace;


renderRackWorkspace = function(
  rack
) {
  const result =
    renderRackWorkspaceBeforeLabels(
      rack
    );

  scheduleRackModuleLabels(
    rack
  );

  return result;
};


installRackModuleLabelStyles();