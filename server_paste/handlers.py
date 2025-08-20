import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
import pyperclip

class ClipboardHandler(APIHandler):
    """
    Handles clipboard operations.
    """
    def initialize(self):
        return super().initialize()

    @tornado.web.authenticated
    async def get(self):
        """
        Get the contents of the system clipboard.
        """
        try:
            clipboard_content = self._get_clipboard_content()
            if clipboard_content is not None:
                result = {
                    "success": True,
                    "content": clipboard_content,
                    "message": "Clipboard content retrieved successfully"
                }
            else:
                result = {
                    "success": False,
                    "content": None,
                    "message": "Clipboard is empty or contains non-text content"
                }
        except Exception as e:
            result = {
                "success": False,
                "content": None,
                "message": f"Error retrieving clipboard content: {str(e)}"
            }


        self.finish(result)

    def _get_clipboard_content(self):
        """
        Get clipboard content using tkinter.
        """
        cbText = pyperclip.paste()
        return cbText



def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "server-paste", "clipboard")
    handlers = [(route_pattern, ClipboardHandler)]
    web_app.add_handlers(host_pattern, handlers)
