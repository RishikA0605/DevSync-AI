const { HocuspocusProvider } = require('@hocuspocus/provider');
const WebSocket = require('ws');

const provider = new HocuspocusProvider({
  url: 'ws://127.0.0.1:3001/collaboration/note-cmt313cc50000igl2ha15gt0j',
  name: 'note-cmt313cc50000igl2ha15gt0j',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJuYW1lIjoiVGVzdCIsImlhdCI6MTc4NzMzMDc2OSwiZXhwIjoxNzg3MzQ1MTY5fQ.zkEhLW7lTb1yyiFkQ2aXy5EC1mToMx_NdptskCiUYHE',
  WebSocketPolyfill: WebSocket,
  onConnect: () => {
    console.log('CONNECTED TO HOCUSPOCUS SERVER!');
    process.exit(0);
  },
  onDisconnect: (e) => {
    console.log('DISCONNECTED:', e);
    process.exit(1);
  },
  onAuthenticationFailed: () => {
    console.log('AUTH FAILED!');
  }
});
