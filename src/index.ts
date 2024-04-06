/* based on the work of:
 *  -> https://github.com/thomasLecler/jupyterlab-autorun-cells
 *  -> https://github.com/LinearLogic/jupyterlab-autorun-cells
 *  -> https://github.com/epi2me-labs/jupyterlab-autorun-cells [https://pypi.org/project/jupyterlab-autorun-cells/] (deleted)
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  Cell, CodeCell, ICellModel, MarkdownCell
} from '@jupyterlab/cells';

import {
  INotebookTracker, NotebookPanel
} from '@jupyterlab/notebook';

/**
 * Extension constants
 */

const PLUGIN = 'coremem-autorun';

const FLAG = 'autorun';

/**
 * Initialization data for the @epi2melabs/jupyterlab-autorun-cells extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coremem/jupyterlab-autorun-cells:plugin',
  description: 'Allows toggling of code cells to execute automatically after opening a notebook.',
  requires: [ INotebookTracker ],
  autoStart: true,
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {

    app.commands.addCommand(`${PLUGIN}:toggle`, {
      label: 'Toggle autorun cell at launch',
      execute: () => {
        if (!tracker.activeCell) return;
        const cell: Cell = tracker.activeCell;
        if (cell.model.getMetadata(FLAG)) {
            cell.model.setMetadata(FLAG, false);
            cell.removeClass(PLUGIN);
            return
        }
        cell.model.setMetadata(FLAG, true);
        cell.addClass(PLUGIN);
      }
    });

    app.contextMenu.addItem({
      command: `${PLUGIN}:toggle`,
      selector: '.jp-Cell',
      rank: 30
    });

    // https://discourse.jupyter.org/t/autorun-some-code-cells-jupyterlab3/8737/4
    tracker.widgetAdded.connect(async (tracker: INotebookTracker, notebookPanel: NotebookPanel) => {
      await notebookPanel.revealed;
      await notebookPanel.sessionContext.ready
      notebookPanel.content.widgets.forEach((cell: Cell<ICellModel>) => {
        if (!cell.model.getMetadata(FLAG)) return;
        cell.addClass(PLUGIN);
        switch (cell.model.type) {
        case 'code':
          CodeCell.execute((cell as CodeCell), notebookPanel.sessionContext);
          break;
        case 'markdown':
          (cell as MarkdownCell).rendered = true;
          break;
        }
      });
    });
  }
};

export default plugin;
