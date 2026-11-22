import * as vscode from 'vscode';
import { ChatPanel } from './chatPanel';

export function activate(context: vscode.ExtensionContext) {
  const sendToApi = async (text: string): Promise<string> => {
    const url = vscode.workspace
      .getConfiguration('promptineer')
      .get<string>('apiUrl');

    if (!url) {
      throw new Error('Set "promptineer.apiUrl" in Settings first.');
    }


// edit request: if your API has other json shape , change this line
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }) // <<<<<<<<<<<<<
    });
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

/*
example on edit request:

//OpenAI-style example:

body: JSON.stringify({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: text }]
})

*/
    if (!response.ok) {
      throw new Error('API returned HTTP ' + response.status);
    }




// edit response: the api should respond with this expected body
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
    const data = await response.json() as {
      reply?: string; response?: string; text?: string;
    };

    return data.reply ?? data.response ?? data.text ?? JSON.stringify(data);
  };

// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

/*
example on edit response

// API returns { answer: "..." }
const data = await response.json() as { answer: string };
return data.answer;

// API returns OpenAI-style { choices: [{ message: { content: "..." } }] }
const data = await response.json() as {
  choices: { message: { content: string } }[];
};
return data.choices[0].message.content;

// API returns plain text, not JSON — replace both lines with:
return await response.text();

*/

  const openChat = vscode.commands.registerCommand(
    'promptineer.openChat',
    () => ChatPanel.show(sendToApi)
  );

  context.subscriptions.push(openChat);
}

export function deactivate() {}