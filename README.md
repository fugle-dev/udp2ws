# udp2ws

> Relay UDP packets to WebSocket server

## Install

```sh
$ npm install --save udp2ws
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
  - `multicastAddress` {string} The IP multicast group address.
  - `multicastInterface` {string} The local IP address associated with a network interface.
  - `wssOptions` {Object} Set of configurable options to set on the WebSocket server. Please see [ws](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocketserver) documentation for details.
  - `middleware` {Function} Define middleware function to intercept incoming UDP packets.

#### Example

```js
const relay = new Relay({
  port: '1234',
  multicastAddress: '224.0.0.114',
  middleware: (msg, rInfo, next) => {
    // messages with longer length will not be relayed, because 'next' will not be invoked.
    if (msg.length <= 120) {
      next(msg);
    }
  },
});
```

### relay.listen(port[, callback])

Starts the relay (WebSocket) server listening for connections.

- `port` {number} The port where to bind the server.
- `callback` {Function} Called when the server is listening for connections.

### relay.close([callback])

Stops the relay (WebSocket) server from accepting new connections.

## License

[MIT](LICENSE)
