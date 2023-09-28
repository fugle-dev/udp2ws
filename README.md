# udp2ws

[![NPM version][npm-image]][npm-url]
[![Build Status][action-image]][action-url]
[![Coverage Status][codecov-image]][codecov-url]

> Relay UDP packets to WebSocket server

## Install

```sh
$ npm install --save udp2ws ws
```

## Usage

```js
import { Relay } from 'udp2ws';

const relay = new Relay({ port: 1234 });

relay.listen(3000, () => {
  console.log('relay server listening on port 3000');
});
```

## API

### new Relay(options)

Create a new relay instance.

- `options`: Set of configurable options to set on the relay. Can have the following fields:
  - `type` {string} Either 'udp4' or 'udp6'. **Default:**`udp4`
  - `port` {number} Destination port.
  - `address` {string} Destination host name or IP address.
  - `exclusive` {boolean} Boolean value true or false. **Default:**`false`
  - `multicastAddress` {string} The IP multicast group address.
  - `multicastInterface` {string} The local IP address associated with a network interface.
  - `wssOptions` {Object} Set of configurable options to set on the WebSocket server. Please see [ws](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocketserver) documentation for details.
  - `interceptor` {Function} Define the function to intercept incoming UDP packets.

#### Example

```js
const relay = new Relay({
  port: '1234',
  multicastAddress: '224.0.0.114',
  interceptor: (msg, rInfo) => {
    // messages with longer length will not be relayed
    if (msg.length <= 120) return msg;
  },
});
```

### relay.listen(port[, callback])

Starts the relay (WebSocket) server listening for connections.

- `port` {number} The port where to bind the server.
- `callback` {Function} Called when the server is listening for connections.

### relay.close([callback])

Stops the relay (WebSocket) server from accepting new connections.

### relay.socket

Accesses the `dgram.Socket` instance, which is available when the relay server is started.

### relay.wss

Accesses the `ws.WebSocketServer` instance, which is available when the relay server is started.

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/udp2ws.svg
[npm-url]: https://npmjs.com/package/udp2ws
[action-image]: https://img.shields.io/github/actions/workflow/status/fugle-dev/udp2ws/node.js.yml?branch=master
[action-url]: https://github.com/fugle-dev/udp2ws/actions/workflows/node.js.yml
[codecov-image]: https://img.shields.io/codecov/c/github/fugle-dev/udp2ws.svg
[codecov-url]: https://codecov.io/gh/fugle-dev/udp2ws
