import * as WebSocket from 'ws';
import { createServer } from './udp-server';
import { Relay } from '../src';
import { Socket } from 'dgram';

describe('udpws', () => {
  it('should receive UDP packets from relay', (done) => {
    const port = 41234;
    const wssPort = 8080;
    const server = createServer({ port });
    const relay = new Relay({ port }).listen(wssPort);
    const ws = new WebSocket(`ws://localhost:${wssPort}`);

    ws.on('open', () => {
      ws.send('hello');
    });

    ws.on('message', (msg, isBinary) => {
      expect(isBinary).toBe(true);
      expect(msg.toString()).toBe('hello');
      ws.close();
    });

    ws.on('close', () => {
      relay.close(() => server.close(done));
    })
  });

  it('should receive UDP packets from relay with broadcast', (done) => {
    const port = 41234;
    const wssPort = 8080;

    let server: Socket;
    const relay = new Relay({ port }).listen(wssPort);
    const ws = new WebSocket(`ws://localhost:${wssPort}`);

    ws.on('open', () => {
      server = createServer({ port, broadcast: true });
    });

    ws.on('message', (msg, isBinary) => {
      expect(isBinary).toBe(true);
      expect(msg.toString()).toBe('hello');
      ws.close();
    });

    ws.on('close', () => {
      relay.close(() => server.close(done));
    })
  });

  it('should receive UDP multicast packets from relay', (done) => {
    const port = 41234;
    const multicastAddress = '224.100.100.100';
    const wssPort = 8080;

    let server: Socket;
    const relay = new Relay({ port, multicastAddress }).listen(wssPort);
    const ws = new WebSocket(`ws://localhost:${wssPort}`);

    ws.on('open', () => {
      server = createServer({ port, multicastAddress });
    });

    ws.on('message', (msg, isBinary) => {
      expect(isBinary).toBe(true);
      expect(msg.toString()).toBe('hello');
      ws.close();
    });

    ws.on('close', () => {
      relay.close(() => server.close(done));
    });
  });

  it('should receive UDP multicast packets from relay with middleware', (done) => {
    const port = 41234;
    const multicastAddress = '224.100.100.100';
    const wssPort = 8080;

    let server: Socket;
    const relay = new Relay({
      port,
      multicastAddress,
      middleware: (msg, rInfo, next) => {
        next('hi');
      },
    }).listen(wssPort);
    const ws = new WebSocket(`ws://localhost:${wssPort}`);

    ws.on('open', () => {
      server = createServer({ port, multicastAddress });
    });

    ws.on('message', (msg, isBinary) => {
      expect(msg.toString()).toBe('hi');
      ws.close();
    });

    ws.on('close', () => {
      relay.close(() => server.close(done));
    });
  });
});
