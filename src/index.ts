import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the server-paste extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'server-paste:plugin',
  description: 'Use server to get clipboard contents',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension server-paste is activated!');

    requestAPI<any>('clipboard')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The server_paste server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
