// En los tests no tiene sentido conectarse al realtime de Supabase:
// el WebSocket de node choca con jsdom, así que lo reemplazamos por uno que no hace nada.
class WebSocketFalso {
  readyState = 3;
  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
}
globalThis.WebSocket = WebSocketFalso as unknown as typeof WebSocket;
