import { test } from "node:test";
import { expect } from "expect";

import { decode, encode } from "./turbo-stream.js";
import { Deferred, type DecodePlugin, type EncodePlugin } from "./utils.js";

async function quickDecode(stream: ReadableStream<Uint8Array>) {
  const decoded = await decode(stream);
  await decoded.done;
  return decoded.value;
}

test("should encode and decode undefined", async () => {
  const input = undefined;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode null", async () => {
  const input = null;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode boolean", async () => {
  const input = true;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);

  const input2 = false;
  const output2 = await quickDecode(encode(input2));
  expect(output2).toEqual(input2);
});

test("should encode and decode number", async () => {
  const input = 42;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode string", async () => {
  const input = "Hello World";
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode Date", async () => {
  const input = new Date();
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode NaN", async () => {
  const input = NaN;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode Infinity", async () => {
  const input = Infinity;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode -Infinity", async () => {
  const input = -Infinity;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode -0", async () => {
  const input = -0;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode BigInt", async () => {
  const input = BigInt(42);
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode RegExp", async () => {
  const input = /foo/g;
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode Symbol", async () => {
  const input = Symbol.for("foo");
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode URL", async () => {
  const input = new URL("https://example.com");
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode object with null prototype", async () => {
  const input = Object.create(null);
  input.foo = "bar";
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode Map", async () => {
  const input = new Map([
    ["foo", "bar"],
    ["baz", "qux"],
  ]);
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode Set", async () => {
  const input = new Set(["foo", "bar"]);
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode an Error", async () => {
  const input = new Error("foo");
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode an EvalError", async () => {
  const input = new EvalError("foo");
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode array", async () => {
  const input = [1, 2, 3];
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode array with holes", async () => {
  const input = [1, , 3];
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode object", async () => {
  const input = { foo: "bar" };
  const output = await quickDecode(encode(input));
  expect(output).toEqual(input);
});

test("should encode and decode object with undefined", async () => {
  const input = { foo: undefined };
  const output = (await quickDecode(encode(input))) as typeof input;
  expect(output).toEqual(input);
  expect("foo" in output).toBe(true);
});

test("should encode and decode promise", async () => {
  const input = Promise.resolve("foo");
  const decoded = await decode(encode(input));
  expect(decoded.value).toBeInstanceOf(Promise);
  expect(await decoded.value).toEqual(await input);
  await decoded.done;
});

test("should encode and decode subsequent null from promise in object value", async () => {
  const input = { root: null, promise: Promise.resolve(null) };
  const decoded = await decode(encode(input));
  const value = decoded.value as typeof input;
  expect(await value.promise).toEqual(await input.promise);
  await decoded.done;
});

test("should encode and decode subsequent undefined from promise in object value", async () => {
  const input = { root: undefined, promise: Promise.resolve(undefined) };
  const decoded = await decode(encode(input));
  const value = decoded.value as typeof input;
  expect(await value.promise).toEqual(await input.promise);
  await decoded.done;
});

test("should encode and decode rejected promise", async () => {
  const input = Promise.reject(new Error("foo"));
  const decoded = await decode(encode(input));
  expect(decoded.value).toBeInstanceOf(Promise);
  await expect(decoded.value).rejects.toEqual(
    await input.catch((reason) => reason)
  );
  await decoded.done;
});

test("should encode and decode object with promises as values", async () => {
  const input = { foo: Promise.resolve("bar") };
  const decoded = await decode(encode(input));
  const value = decoded.value as typeof input;
  expect(value).toEqual({ foo: expect.any(Promise) });
  expect(await value.foo).toEqual(await input.foo);
  await decoded.done;
});

test("should encode and decode object with rejected promise", async () => {
  const input = { foo: Promise.reject(new Error("bar")) };
  const decoded = await decode(encode(input));
  const value = decoded.value as typeof input;
  expect(value.foo).toBeInstanceOf(Promise);
  expect(value.foo).rejects.toEqual(await input.foo.catch((reason) => reason));
  return decoded.done;
});

test("should encode and decode set with promises as values", async () => {
  const prom = Promise.resolve("foo");
  const input = new Set([prom, prom]);
  const decoded = await decode(encode(input));
  const value = decoded.value as typeof input;
  expect(value).toEqual(new Set([expect.any(Promise)]));
  const proms = Array.from(value);
  expect(await proms[0]).toEqual(await Array.from(input)[0]);
  await decoded.done;
});

test("should encode and decode custom type", async ({ mock }) => {
  class Custom {
    child: Custom | undefined;
    constructor(public foo: string) {}
  }
  const input = new Custom("bar");
  input.child = new Custom("baz");

  const decoder = mock.fn<DecodePlugin>((type, foo, child) => {
    if (type === "Custom") {
      const value = new Custom(foo as string);
      value.child = child as Custom | undefined;
      return { value };
    }
  });

  const encoder = mock.fn<EncodePlugin>((value) => {
    if (value instanceof Custom) {
      return ["Custom", value.foo, value.child];
    }
  });

  const decoded = await decode(
    encode(input, {
      plugins: [encoder],
    }),
    {
      plugins: [decoder],
    }
  );
  const value = decoded.value as Custom;
  expect(value).toBeInstanceOf(Custom);
  expect(value.foo).toEqual(input.foo);
  expect(value.child).toBeInstanceOf(Custom);
  expect(value.child?.foo).toEqual(input.child.foo);

  expect(encoder.mock.callCount()).toBe(2);
  expect(decoder.mock.callCount()).toBe(2);
});

test("should encode and decode custom type when nested alongside Promise", async () => {
  class Custom {
    constructor(public foo: string) {}
  }
  const input = {
    number: 1,
    array: [2, "foo", 3],
    set: new Set(["bar", "baz"]),
    custom: new Custom("qux"),
    promise: Promise.resolve("resolved"),
  };
  const decoded = (await decode(
    encode(input, {
      plugins: [
        (value) => {
          if (value instanceof Custom) {
            return ["Custom", value.foo];
          }
        },
      ],
    }),
    {
      plugins: [
        (type, foo) => {
          if (type === "Custom") {
            return { value: new Custom(foo as string) };
          }
        },
      ],
    }
  )) as unknown as {
    value: {
      number: number;
      array: [];
      set: Set<string>;
      custom: Custom;
      promise: Promise<string>;
    };
  };
  expect(decoded.value.number).toBe(input.number);
  expect(decoded.value.array).toEqual(input.array);
  expect(decoded.value.set).toEqual(input.set);
  expect(decoded.value.custom).toBeInstanceOf(Custom);
  expect(decoded.value.custom.foo).toBe("qux");
  expect(await decoded.value.promise).toBe("resolved");
});

test("should propagate abort reason to deferred promises for sync resolved promise", async () => {
  const abortController = new AbortController();
  const reason = new Error("reason");
  abortController.abort(reason);
  const decoded = await decode(
    encode(Promise.resolve("foo"), { signal: abortController.signal })
  );
  await expect(decoded.value).rejects.toEqual(reason);
});

test("should propagate abort reason to deferred promises for async resolved promise", async () => {
  const abortController = new AbortController();
  const deferred = new Deferred();
  const reason = new Error("reason");
  const decoded = await decode(
    encode(deferred.promise, { signal: abortController.signal })
  );
  abortController.abort(reason);
  await expect(decoded.value).rejects.toEqual(reason);
});
