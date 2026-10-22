const patchResponsiveFixApplied = true;


function installPatchResponsiveStyles() {
  if (
    document.getElementById(
      "patchResponsiveFixStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "patchResponsiveFixStyles";

  style.textContent = `
    /*
     * O drawer volta a respeitar a altura real
     * da janela do navegador.
     */
    .overlay .drawer {
      height: 100dvh !important;
      max-height: 100dvh !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .overlay .drawer-head {
      flex: 0 0 auto !important;
    }

    /*
     * A área interna passa a poder encolher.
     * Sem min-height:0, elementos flexíveis
     * ultrapassam a altura da janela.
     */
    .drawer-body.patch-map-active {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      height: auto !important;
      overflow: hidden !important;
      padding: 10px 12px !important;
    }

    /*
     * O formulário ocupa somente a altura
     * realmente disponível no drawer.
     */
    .item-form.patch-map-form {
      height: 100% !important;
      min-height: 0 !important;
      max-height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      padding: 12px !important;
    }

    .patch-map-toggle {
      flex: 0 0 auto !important;
      margin-bottom: 7px !important;
    }

    .patch-map-toggle .form-field {
      margin: 0 !important;
    }

    /*
     * Os dados físicos ficam compactos,
     * mas quebram de linha em telas menores.
     */
    .patch-map-context {
      flex: 0 0 auto !important;
      grid-template-columns:
        minmax(190px, 2fr)
        minmax(150px, 1fr)
        minmax(130px, .8fr)
        minmax(90px, .55fr)
        minmax(90px, .55fr)
        !important;
      gap: 7px !important;
      margin-bottom: 7px !important;
      padding: 8px !important;
    }

    .patch-map-context-title {
      margin-bottom: 0 !important;
    }

    .patch-map-context
    .form-field input,
    .patch-map-context
    .form-field select {
      padding: 8px 9px !important;
    }

    /*
     * O mapa usa o espaço restante.
     * min-height:0 permite que o mapa
     * encolha quando a janela diminui.
     */
    .patch-map-area {
      flex: 1 1 0 !important;
      min-height: 0 !important;
      height: auto !important;
      overflow: hidden !important;
      padding: 10px !important;
    }

    .patch-map-head {
      flex: 0 0 auto !important;
      margin-bottom: 6px !important;
    }

    .patch-map-title {
      font-size: clamp(
        15px,
        1.5vw,
        19px
      ) !important;
    }

    .patch-map-help {
      margin-top: 2px !important;
    }

    /*
     * A visualização horizontal passa a
     * adaptar a altura ao navegador.
     */
    .patch-map-viewport {
      flex: 1 1 0 !important;
      min-height: 180px !important;
      height: auto !important;
      max-height: none !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
    }

    .patch-map-track {
      height: 100% !important;
      min-height: 180px !important;
      padding-top: clamp(
        30px,
        5vh,
        44px
      ) !important;
      padding-bottom: clamp(
        30px,
        5vh,
        44px
      ) !important;
    }

    /*
     * Os racks também reduzem um pouco
     * a altura em janelas mais baixas.
     */
    .patch-map-position {
      height: clamp(
        145px,
        27vh,
        210px
      ) !important;
    }

    .patch-map-disabled-note {
      flex: 0 0 auto !important;
      margin: 5px 0 0 !important;
    }

    /*
     * Os botões permanecem sempre visíveis.
     */
    .patch-map-form .form-actions {
      position: sticky !important;
      z-index: 15 !important;
      bottom: 0 !important;
      flex: 0 0 auto !important;
      margin: 7px -12px -12px !important;
      padding: 10px 12px !important;
      border-top: 1px solid #26384e !important;
      background:
        linear-gradient(
          180deg,
          #081424f2,
          #081424
        ) !important;
      box-shadow:
        0 -10px 24px #0005 !important;
    }

    /*
     * Notebook ou navegador com pouca altura.
     */
    @media (max-height: 820px) {
      .overlay .drawer-head {
        padding:
          9px 16px !important;
      }

      .overlay .drawer-head h2 {
        font-size:
          21px !important;
      }

      .drawer-body.patch-map-active {
        padding:
          7px 10px !important;
      }

      .item-form.patch-map-form {
        padding:
          9px !important;
      }

      .patch-map-toggle {
        margin-bottom:
          5px !important;
      }

      .patch-map-context {
        padding:
          6px 8px !important;
        margin-bottom:
          5px !important;
      }

      .patch-map-context-title {
        display: none !important;
      }

      .patch-map-context
      .form-field label {
        margin-bottom:
          3px !important;
      }

      .patch-map-context
      .form-field input,
      .patch-map-context
      .form-field select {
        padding:
          6px 8px !important;
      }

      .patch-map-area {
        padding:
          8px !important;
      }

      .patch-map-help {
        font-size:
          9px !important;
      }

      .patch-map-status {
        padding:
          4px 7px !important;
      }

      .patch-map-disabled-note {
        display: none !important;
      }

      .patch-map-form
      .form-actions {
        margin:
          5px -9px -9px !important;
        padding:
          8px 10px !important;
      }
    }

    /*
     * Tela estreita: os dados passam
     * para duas colunas e o conjunto
     * continua rolável.
     */
    @media (max-width: 1050px) {
      .patch-map-context {
        grid-template-columns:
          1fr 1fr !important;
      }

      .patch-map-context
      .form-field:first-of-type {
        grid-column:
          1 / -1 !important;
      }

      .patch-map-viewport {
        min-height:
          210px !important;
      }
    }

    /*
     * Celular ou janela muito estreita.
     * Nesse caso o formulário inteiro pode
     * rolar verticalmente, sem cortar ações.
     */
    @media (max-width: 700px) {
      .drawer-body.patch-map-active {
        overflow-y:
          auto !important;
      }

      .item-form.patch-map-form {
        height:
          auto !important;
        min-height:
          100% !important;
        overflow:
          visible !important;
      }

      .patch-map-context {
        grid-template-columns:
          1fr !important;
      }

      .patch-map-context
      .form-field {
        grid-column:
          1 / -1 !important;
      }

      .patch-map-area {
        flex:
          0 0 auto !important;
        height:
          390px !important;
      }

      .patch-map-viewport {
        min-height:
          270px !important;
      }

      .patch-map-form
      .form-actions {
        position:
          sticky !important;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


function refreshPatchResponsiveLayout() {
  const patchForm =
    document.querySelector(
      ".item-form.patch-map-form"
    );

  if (!patchForm) {
    return;
  }

  const drawer =
    patchForm.closest(
      ".drawer"
    );

  const drawerHead =
    drawer?.querySelector(
      ".drawer-head"
    );

  const drawerBody =
    drawer?.querySelector(
      ".drawer-body"
    );

  if (
    !drawer
    || !drawerBody
  ) {
    return;
  }

  const availableHeight =
    window.innerHeight
    - (
        drawerHead
          ?.getBoundingClientRect()
          .height
        || 0
      );

  drawerBody.style.height =
    Math.max(
      320,
      availableHeight
    )
    + "px";

  const actions =
    patchForm.querySelector(
      ".form-actions"
    );

  const mapArea =
    patchForm.querySelector(
      ".patch-map-area"
    );

  if (
    actions
    && mapArea
  ) {
    actions.style.display =
      "flex";
  }
}


function installPatchResponsiveLayout() {
  installPatchResponsiveStyles();

  refreshPatchResponsiveLayout();

  if (
    window
      .patchResponsiveResizeInstalled
  ) {
    return;
  }

  window
    .patchResponsiveResizeInstalled =
      true;

  window.addEventListener(
    "resize",
    () => {
      window.requestAnimationFrame(
        refreshPatchResponsiveLayout
      );
    }
  );
}


const showItemFormBeforeResponsivePatch =
  showItemForm;


showItemForm = function(
  rack,
  item = null
) {
  const result =
    showItemFormBeforeResponsivePatch(
      rack,
      item
    );

  window.setTimeout(
    installPatchResponsiveLayout,
    40
  );

  return result;
};


document.addEventListener(
  "change",
  event => {
    if (
      event.target?.id
      !== "fIsPatch"
    ) {
      return;
    }

    window.setTimeout(
      installPatchResponsiveLayout,
      40
    );
  }
);