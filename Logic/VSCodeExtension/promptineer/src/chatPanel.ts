import * as vscode from 'vscode';

type Incoming = { type: 'send'; text: string };
type Outgoing =
  | { type: 'message'; role: 'user' | 'assistant' | 'error'; text: string };

export class ChatPanel {
  private static current: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly onMessage: (text: string) => Promise<string>;
  private disposed = false;

  private constructor(
    panel: vscode.WebviewPanel,
    onMessage: (text: string) => Promise<string>
  ) {
    this.panel = panel;
    this.onMessage = onMessage;

    this.panel.webview.html = this.getHtml();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (msg: Incoming) => {
        if (msg.type !== 'send' || !msg.text.trim()) return;
        this.post({ type: 'message', role: 'user', text: msg.text });

        try {
          const reply = await this.onMessage(msg.text);
          this.post({ type: 'message', role: 'assistant', text: reply });
        } catch (err) {
          this.post({
            type: 'message',
            role: 'error',
            text: err instanceof Error ? err.message : String(err)
          });
        }
      },
      null,
      this.disposables
    );
  }

  public static show(onMessage: (text: string) => Promise<string>): void {
    if (ChatPanel.current) {
      ChatPanel.current.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'promptineerChat',
      'Promptineer Chat',
      vscode.ViewColumn.One,
      { enableScripts: true } // required so webview JS can postMessage
    );

    ChatPanel.current = new ChatPanel(panel, onMessage);
  }

  private post(payload: Outgoing): void {
    this.panel.webview.postMessage(payload);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    ChatPanel.current = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }

  private getHtml(): string {
    const nonce = Math.random().toString(36).slice(2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
  body {
    margin: 0;
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
  }
  #app { display: flex; flex-direction: column; height: 100vh; }
  #messages { flex: 1; overflow-y: auto; padding: 12px; }
  .msg { margin: 6px 0; padding: 8px 10px; border-radius: 6px; white-space: pre-wrap; }
  .user { background: var(--vscode-editor-inactiveSelectionBackground); margin-left: 40px; }
  .assistant { background: var(--vscode-editorWidget-background); margin-right: 40px; }
  .error { color: var(--vscode-errorForeground); }
  #composer {
    display: flex; gap: 8px; padding: 10px;
    border-top: 1px solid var(--vscode-panel-border);
  }
  #input {
    flex: 1; resize: none; min-height: 42px; max-height: 140px; padding: 8px;
    color: var(--vscode-input-foreground);
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    font-family: inherit;
  }
  button {
    padding: 6px 14px; border: none; cursor: pointer;
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
  }
</style>
</head>
<body>
<div id="app">
  <div id="messages"></div>
  <div id="composer">
    <textarea id="input" rows="2" placeholder="Type a prompt..."></textarea>
    <button id="send">Send</button>
  </div>
</div>
<script nonce="${nonce}">
  var vscode = acquireVsCodeApi();
  var input = document.getElementById('input');
  var messages = document.getElementById('messages');
  var sendBtn = document.getElementById('send');

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'msg ' + role;
    div.textContent = text; // textContent prevents HTML injection
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function send() {
    var text = input.value.trim();
    if (!text) return;
    vscode.postMessage({ type: 'send', text: text });
    input.value = '';
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  window.addEventListener('message', function (e) {
    if (e.data.type === 'message') { addMessage(e.data.role, e.data.text); }
  });
</script>
</body>
</html>`;
  }
}