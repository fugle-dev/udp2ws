import { createServer } from 'http';
import { Relay } from '../src';

describe('Relay', () => {
  describe('constructor()', () => {
    it('should be instantiated', () => {
      const relay = new Relay({ port: 41234 });
      expect(relay).toBeInstanceOf(Relay);
      expect(relay).toMatchObject({ options: { port: 41234 } });
    });

    it('should be instantiated with wssOptions', () => {
      const server = createServer();
      const relay = new Relay({ port: 41234, wssOptions: { server } });
      expect(relay).toBeInstanceOf(Relay);
      expect(relay).toMatchObject({ options: { port: 41234, wssOptions: { server } } });
    });

    it('should throw error with missing port option', () => {
      expect(() => {
        // @ts-expect-error
        const relay = new Relay();
      }).toThrowError();
    });
  });

  describe('listen()', () => {
    it('should listen for connections', (done) => {
      const relay = new Relay({ port: 41234 }).listen(3000);
      // @ts-expect-error
      expect(relay.wss.options.port).toBe(3000);
      relay.close(done);
    });

    it('should listen for connections with wssOptions.port', (done) => {
      // @ts-expect-error
      const relay = new Relay({ port: 41234, wssOptions: { port: 3000 } }).listen();
      // @ts-expect-error
      expect(relay.wss.options.port).toBe(3000);
      relay.close(done);
    });

    it('should listen for connections with external server', (done) => {
      const server = createServer();
      const relay = new Relay({ port: 41234, wssOptions: { server } }).listen(3000);
      // @ts-expect-error
      expect(server.address().port).toBe(3000);
      server.close(() => relay.close(done));
    });
  });

  describe('close()', () => {
    it('should close relay server', (done) => {
      const relay = new Relay({ port: 41234 }).listen(3000);
      relay.close();
      // @ts-expect-error
      relay.wss.on('close', done);
    });

    it('should close without listening', (done) => {
      const relay = new Relay({ port: 41234 });
      // @ts-expect-error
      expect(relay.wss).toBe(undefined);
      relay.close(done);
    });
  });
});
