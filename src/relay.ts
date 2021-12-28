import { createSocket, SocketType } from 'dgram';
import { WebSocket, WebSocketServer, ServerOptions } from 'ws';

export interface RelayOptions {
  type?: SocketType;
  port: number;
  address?: string;
  multicastAddress?: string,
  multicastInterface?: string,
  wssOptions?: ServerOptions,
}

export class Relay {
  constructor(private readonly options: RelayOptions) {
    if (!options?.port) {
      throw new Error(`Missing required "port" option`);
    }
    this.options = options;
  }

  bindSocket(wss: WebSocketServer) {
    const { type, address, port, multicastAddress, multicastInterface } = this.options;

    const socket = createSocket(type || 'udp4');

    socket.bind(port, address, () => {
      if (multicastAddress) {
        socket.addMembership(multicastAddress, multicastInterface);
      }
    });

    socket.on('message', (msg, rinfo) => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    });

    wss.on('connection', (ws) => {
      ws.on('message', (data, isBinary) => {
        socket.send(data.toString(), port, address);
      });
    });

    return wss;
  }

  listen(port: number, listeningListener?: () => void): WebSocketServer {
    const { server, ...wssOptions } = this.options?.wssOptions || {};

    if (server) {
      const wss = this.bindSocket(
        new WebSocketServer({
          server,
          ...wssOptions,
        })
      );
      server.listen(port, listeningListener);
      return wss;
    }

    const wss = this.bindSocket(
      new WebSocketServer({
        ...wssOptions,
        port: port || wssOptions.port,
      }, listeningListener));
    return wss;
  }
}
