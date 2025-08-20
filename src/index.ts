import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { requestAPI } from './handler';

/**
 * Initialization data for the server-paste extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'server-paste:plugin',
  description: 'Use server to get clipboard contents',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
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

      // Create custom context menu for the textarea
      const contextMenu = document.createElement('div');
      contextMenu.style.cssText = `
        position: fixed;
        background: white;
        color: black;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 4px 0;
        display: none;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      `;

      // Create copy option
      const copyOption = document.createElement('div');
      copyOption.textContent = 'Copy';
      copyOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        user-select: none;
        border-bottom: 1px solid #eee;
      `;

      // Add hover effect for copy option
      copyOption.addEventListener('mouseenter', () => {
        copyOption.style.backgroundColor = '#f0f0f0';
      });

      copyOption.addEventListener('mouseleave', () => {
        copyOption.style.backgroundColor = 'transparent';
      });

      // Handle copy option click
      copyOption.addEventListener('click', () => {
        console.log('Copy option clicked!');
        const selectedText = textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd
        );
        if (selectedText) {
          navigator.clipboard
            .writeText(selectedText)
            .then(() => {
              console.log('Text copied to clipboard:', selectedText);
            })
            .catch(err => {
              console.error('Failed to copy text:', err);
            });
        } else {
          console.log('No text selected to copy');
        }
        contextMenu.style.display = 'none';
      });

      // Create paste option
      const pasteOption = document.createElement('div');
      pasteOption.textContent = 'Paste';
      pasteOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        user-select: none;
      `;

      // Add hover effect for paste option
      pasteOption.addEventListener('mouseenter', () => {
        pasteOption.style.backgroundColor = '#f0f0f0';
      });

      pasteOption.addEventListener('mouseleave', () => {
        pasteOption.style.backgroundColor = 'transparent';
      });

      // Handle paste option click
      pasteOption.addEventListener('click', () => {
        console.log('Paste option clicked!');
        requestAPI<any>('clipboard')
          .then(data => {
            console.log(data);
            // Replace current selection with clipboard data
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentValue = textarea.value;
            const newValue =
              currentValue.substring(0, start) +
              data +
              currentValue.substring(end);
            textarea.value = newValue;

            // Set cursor position after the pasted content
            textarea.selectionStart = start + data.length;
            textarea.selectionEnd = start + data.length;

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

    app.shell.add(widget, 'main');
    // Activate the widget
    app.shell.activateById(widget.id);

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
    palette.addItem({ command, category: 'Tutorial' });
  }
};

export default plugin;
