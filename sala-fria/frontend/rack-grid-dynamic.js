const rackGridDynamicApplied = true;


window.renderRackWorkspace =
  function renderRackWorkspaceDynamic(
    rack
  ) {
    const body =
      document.querySelector(
        ".drawer-body"
      );

    if (!body || !rack) {
      console.error(
        "Nao foi possivel montar "
        + "a grade dinamica da fileira.",
        {
          body,
          rack
        }
      );

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

    const ruCount =
      Math.max(
        1,
        Number(
          rack.quantidadeRU
          || 44
        )
      );

    body.innerHTML = `
      <div class="rack-workspace">
        <div class="rack-toolbar">
          <input
            id="rackSearch"
            class="rack-search"
            placeholder="Buscar equipamento nesta fileira"
          >

          <div class="zoom-bar">
            <button
              id="rackZoomOut"
              class="zoom-btn"
              type="button"
            >
              −
            </button>

            <span
              id="rackZoomValue"
              class="zoom-value"
            >
              100%
            </span>

            <button
              id="rackZoomReset"
              class="zoom-btn"
              type="button"
            >
              100%
            </button>

            <button
              id="rackZoomIn"
              class="zoom-btn"
              type="button"
            >
              +
            </button>
          </div>

          ${
            editMode
              ? `
                <button
                  id="addItemButton"
                  class="mini-btn primary"
                  type="button"
                >
                  + Adicionar equipamento
                </button>

                <button
                  id="editRackButton"
                  class="mini-btn"
                  type="button"
                >
                  Editar fileira
                </button>
              `
              : ""
          }
        </div>

        <div
          id="rackViewport"
          class="rack-viewport"
        >
          <div
            id="rackStage"
            class="rack-stage"
          >
            <div
              id="rackFaceGrid"
              class="rack-face-grid"
            ></div>
          </div>
        </div>
      </div>
    `;

    const grid =
      document.getElementById(
        "rackFaceGrid"
      );

    grid.style.gridTemplateColumns =
      `repeat(${moduleCount}, 1fr)`;

    grid.style.gridTemplateRows =
      `repeat(${ruCount}, 1fr)`;

    grid.dataset.moduleCount =
      String(moduleCount);

    grid.dataset.ruCount =
      String(ruCount);

    for (
      let row = 1;
      row <= ruCount;
      row += 1
    ) {
      for (
        let column = 1;
        column <= moduleCount;
        column += 1
      ) {
        const cell =
          document.createElement(
            "div"
          );

        cell.className =
          "rack-cell";

        cell.style.gridRow =
          String(row);

        cell.style.gridColumn =
          String(column);

        grid.appendChild(
          cell
        );
      }
    }

    const rackItems =
      Array.isArray(rack.items)
        ? rack.items
        : [];

    rackItems.forEach(
      item => {
        const equipment =
          document.createElement(
            "button"
          );

        equipment.type =
          "button";

        equipment.className =
          "rack-equipment"
          + (
            editMode
              ? " editable"
              : ""
          );

        equipment.dataset.itemId =
          item.id;

        const startRu =
          Math.max(
            1,
            Number(
              item.start || 1
            )
          );

        const heightRu =
          Math.max(
            1,
            Number(
              item.units || 1
            )
          );

        const moduleNumber =
          Math.max(
            1,
            Number(
              item.moduloRack
              ?? item.modulo_rack
              ?? item.column
              ?? 1
            )
          );

        const columnSpan =
          Math.max(
            1,
            Number(
              item.columnSpan || 1
            )
          );

        const rowStart =
          (
            ruCount + 1
          )
          - (
            startRu
            + heightRu
            - 1
          );

        const rowEnd =
          rowStart
          + heightRu;

        equipment.style.gridRow =
          `${rowStart} / ${rowEnd}`;

        equipment.style.gridColumn =
          `${moduleNumber} / span ${columnSpan}`;

        equipment.textContent =
          `U${startRu} • ${item.name}`;

        equipment.onclick = () => {
          if (!rackPanMoved) {
            showEquipmentModal(
              rack,
              item
            );
          }

          rackPanMoved = false;
        };

        grid.appendChild(
          equipment
        );
      }
    );

    document.getElementById(
      "rackSearch"
    ).oninput = event => {
      filterRackItems(
        rack,
        event.target.value
      );
    };

    document.getElementById(
      "rackZoomOut"
    ).onclick = () => {
      setRackZoom(
        rackZoom - 0.1
      );
    };

    document.getElementById(
      "rackZoomIn"
    ).onclick = () => {
      setRackZoom(
        rackZoom + 0.1
      );
    };

    document.getElementById(
      "rackZoomReset"
    ).onclick = () => {
      setRackZoom(1);
    };

    const rackViewport =
      document.getElementById(
        "rackViewport"
      );

    rackViewport.addEventListener(
      "wheel",
      event => {
        event.preventDefault();
      },
      {
        passive: false
      }
    );

    rackViewport.addEventListener(
      "pointerdown",
      startRackPan
    );

    rackViewport.addEventListener(
      "pointermove",
      moveRackPan
    );

    rackViewport.addEventListener(
      "pointerup",
      endRackPan
    );

    rackViewport.addEventListener(
      "pointercancel",
      endRackPan
    );

    if (editMode) {
      document.getElementById(
        "addItemButton"
      ).onclick = () => {
        showItemForm(
          rack
        );
      };

      document.getElementById(
        "editRackButton"
      ).onclick = () => {
        showRackForm(
          rack
        );
      };
    }

    setRackZoom(
      rackZoom
    );
  };