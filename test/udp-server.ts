import * as dgram from 'dgram';

interface Options {
  port: number;
  broadcast?: boolean;
  multicastAddress?: string;
}

export function createServer(options: Options) {
  const server = dgram.createSocket('udp4');

  if (options.broadcast) {
    server.on('listening', () => {
      server.setBroadcast(!0);
      server.setTTL(128);
      server.send('hello', options.port);
    });
  } else if (options.multicastAddress) {
    server.on('listening', () => {
      server.addMembership(options.multicastAddress as string);
      server.setMulticastTTL(128);
      server.send('hello', options.port, options.multicastAddress);
    });
  } else {
    server.on('message', (msg, rinfo) => {
      server.send(msg, rinfo.port, rinfo.address)
    });
  }

  server.bind(options.broadcast || options.multicastAddress ? 0 : options.port);

  return server;
}
