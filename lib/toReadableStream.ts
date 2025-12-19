import { ReadableStream, ReadableStreamDefaultReader } from "node:stream/web";

export const toReadableStream = (stream: ReadableStreamDefaultReader<Uint8Array>) => {
  const readableStream = new ReadableStream<Uint8Array>({
    start(controller) {
      function push() {
        stream.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
          push();
        });
      }
      push();
    }
  });

  return readableStream;
};
