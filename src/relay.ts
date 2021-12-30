import { createSocket, Socket, RemoteInfo, SocketType } from 'dgram';
import { WebSocket, WebSocketServer, ServerOptions } from 'ws';

export interface RelayOptions {
  type?: SocketType;
  port: number;
  address?: string;
  multicastAddress?: string,
  multicastInterface?: string,
  wssOptions?: ServerOptions,
  middleware?: (msg: Buffer, rinfo: RemoteInfo, next: (data: any) => void) => void,
}

export class Relay {
  private socket?: Socket;
  private wss?: WebSocketServer;

  constructor(private readonly options: RelayOptions) {
    if (!options?.port) {
      throw new Error(`Missing required "port" option`);
    }
    this.options = options;
  }

  private bindSocket(wss: WebSocketServer): WebSocketServer {
    const { type, address, port, multicastAddress, multicastInterface } = this.options;

    const socket = createSocket(type || 'udp4');

    socket.bind(port, address, () => {
      if (multicastAddress) {
        socket.addMembership(multicastAddress, multicastInterface);
      }
    });

    socket.on('message', (msg, rinfo) => {
      if (this.options.middleware) {
        this.options.middleware(msg, rinfo, (data) => {
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(data);
            }
          });
        });
      } else {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
          }
        });
      }
    });

    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        socket.send(data as any, port, address);
      });
    });

    this.socket = socket;

    return wss;
  }

  listen(port: number, listeningListener?: () => void): this {
    const { server, ...wssOptions } = this.options.wssOptions || {};

    if (server) {
      const wss = this.bindSocket(
        new WebSocketServer({
          server,
          ...wssOptions,
        })
      );
      server.listen(port, listeningListener);
      this.wss = wss;
      return this;
    }

    const wss = this.bindSocket(
      new WebSocketServer({
        ...wssOptions,
        port: port || wssOptions.port,
      }, listeningListener));
    this.wss = wss;
    return this;
  }

  close(callback?: () => void) {
    this.socket?.close();
    this.wss?.close(callback);
    if (!this.wss && callback) callback();
  }
}
