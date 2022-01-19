import { createSocket, Socket, RemoteInfo, SocketType } from 'dgram';
import { WebSocket, WebSocketServer, ServerOptions } from 'ws';

const SOCKET = Symbol('Relay#socket');
const WSS = Symbol('Relay#wss');

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
  private [SOCKET]?: Socket;
  private [WSS]?: WebSocketServer;

  constructor(private readonly options: RelayOptions) {
    if (!options?.port) {
      throw new Error(`Missing required "port" option`);
    }
    this.options = options;
  }

  get socket() {
    return this[SOCKET];
  }

  get wss() {
    return this[WSS];
  }

  private bindSocket(wss: WebSocketServer): WebSocketServer {
    const { type, address, port, multicastAddress, multicastInterface, middleware } = this.options;

    const socket = createSocket(type || 'udp4');

    socket.bind(port, address, () => {
      if (multicastAddress) {
        socket.addMembership(multicastAddress, multicastInterface);
      }
    });

    socket.on('message', (msg, rinfo) => {
      if (middleware) {
        middleware(msg, rinfo, (data) => {
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              if (Array.isArray(data)) {
                data.forEach(d => client.send(d));
              } else {
                client.send(data);
              }
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

    this[SOCKET] = socket;

    return wss;
  }

  public listen(port?: number, listeningListener?: () => void): this {
    const { server, ...wssOptions } = this.options.wssOptions || {};

    if (!port && !wssOptions.port) {
      throw new Error(`Argument "port" or "wssOptions.port" must be specified`);
    }

    if (server) {
      this[WSS] = this.bindSocket(
        new WebSocketServer({
          server,
          ...wssOptions,
        })
      );
      server.listen(port, listeningListener);
    } else {
      this[WSS] = this.bindSocket(
        new WebSocketServer({
          ...wssOptions,
          port: port || wssOptions.port,
        }, listeningListener)
      );
    }

    return this;
  }

  public close(callback?: (err?: Error) => void): this {
    this.socket?.close();
    this.wss?.close(callback);
    if (!this.wss && callback) callback();
    return this;
  }
}
