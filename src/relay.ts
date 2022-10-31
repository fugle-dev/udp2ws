import { createSocket, Socket, RemoteInfo, SocketType } from 'dgram';
import * as WebSocket from 'ws';

const SOCKET = Symbol('Relay#socket');
const WSS = Symbol('Relay#wss');

export interface RelayOptions {
  type?: SocketType;
  port: number;
  address?: string;
  exclusive?: boolean;
  multicastAddress?: string,
  multicastInterface?: string,
  wssOptions?: WebSocket.ServerOptions,
  interceptor?: (msg: Buffer, rinfo: RemoteInfo) => any,
}

export class Relay {
  private [SOCKET]?: Socket;
  private [WSS]?: WebSocket.Server;

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

  private bindSocket(wss: WebSocket.Server): WebSocket.Server {
    const { type, address, port, exclusive, multicastAddress, multicastInterface, interceptor } = this.options;

    const socket = createSocket({
      type: type || 'udp4',
      reuseAddr: true,
    });

    socket.bind({ port, address, exclusive }, () => {
      if (multicastAddress) {
        socket.addMembership(multicastAddress, multicastInterface);
      }
    });

    socket.on('message', (msg, rinfo) => {
      if (interceptor) {
        const message = interceptor(msg, rinfo);
        if (message) {
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
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
        new WebSocket.Server({
          server,
          ...wssOptions,
        })
      );
      server.listen(port, listeningListener);
    } else {
      this[WSS] = this.bindSocket(
        new WebSocket.Server({
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
