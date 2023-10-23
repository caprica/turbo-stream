# Turbo Stream

A streaming data transport format that aims to support built-in features such as Promises, Dates, RegExps, Maps, Sets and more.

## Shout Out!

Shout out to Rich Harris and his https://github.com/rich-harris/devalue project. Devalue has heavily influenced this project and portions
of the code have been directly lifted from it. I highly recommend checking it out if you need something more cusomizable or without streaming support.

## Installation

```bash
npm install turbo-stream
```

## Usage

```js
import { decode, encode } from "turbo-stream";

const encodedStream = encode(Promise.resolve(42));
const decoded = await decode(encodedStream);
console.log(decoded.value); // a Promise
console.log(await decoded.value); // 42
await decoded.done; // wait for the stream to finish
```
