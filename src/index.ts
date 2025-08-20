import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { Clipboard } from '@jupyterlab/apputils';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { requestAPI } from './handler';

/**
 * Initialization data for the server-paste extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'server-paste:plugin',
  description: 'Use server to get clipboard contents',
  autoStart: true,
  requires: [ILauncher],
  activate: (app: JupyterFrontEnd, launcher: ILauncher) => {
    console.log('JupyterLab extension server-paste is activated!');

    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const content = new Widget();
      const widget = new MainAreaWidget({ content });
      widget.id = 'server-paste';
      widget.title.closable = true;

      const textarea = document.createElement('textarea');
      content.node.appendChild(textarea);
      textarea.className = 'server-paste-text';

      // Create custom context menu for the textarea
      const contextMenu = document.createElement('div');
      contextMenu.className = 'server-paste-context-menu';

      // Create copy option
      const copyOption = document.createElement('div');
      copyOption.textContent = 'Copy';
      copyOption.className = 'server-paste-menu-option copy-option';

      // Handle copy option click
      copyOption.addEventListener('click', () => {
        console.log('Copy option clicked!');
        const selectedText = textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd
        );
        console.log('selectedText', selectedText);
        Clipboard.copyToSystem(selectedText);
        contextMenu.style.display = 'none';
      });

      // Create paste option
      const pasteOption = document.createElement('div');
      pasteOption.textContent = 'Paste';
      pasteOption.className = 'server-paste-menu-option';

      // Handle paste option click
      pasteOption.addEventListener('click', () => {
        requestAPI<any>('clipboard')
          .then(data => {
            // Replace current selection with clipboard data
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentValue = textarea.value;
            const newValue =
              currentValue.substring(0, start) +
              data.content +
              currentValue.substring(end);
            textarea.value = newValue;

            // Set cursor position after the pasted content
            textarea.selectionStart = start + data.content.length;
            textarea.selectionEnd = start + data.content.length;

            // Focus the textarea to maintain user interaction
            textarea.focus();
          })
          .catch(reason => {
            console.error(
              `The server_paste server extension appears to be missing.\n${reason}`
            );
          });
        contextMenu.style.display = 'none';
      });

      contextMenu.appendChild(copyOption);
      contextMenu.appendChild(pasteOption);
      document.body.appendChild(contextMenu);

      // Show context menu on right click
      textarea.addEventListener('contextmenu', e => {
        e.preventDefault();
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
      });

      // Hide context menu when clicking outside
      document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
      });

      // Hide context menu on escape key
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          contextMenu.style.display = 'none';
        }
      });

      return widget;
    };

    let widget = newWidget();

    // Add an application command
    const command: string = 'server-paste:open';
    app.commands.addCommand(command, {
      label: 'paste-server-test',
      execute: () => {
        // Regenerate the widget if disposed
        if (widget.isDisposed) {
          widget = newWidget();
        }
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        // Activate the widget
        app.shell.activateById(widget.id);
      }
    });

    // Add the command to the palette.
    launcher.add({ command });
  }
};

export default plugin;
