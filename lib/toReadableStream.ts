import { ReadableStream, ReadableStreamDefaultReader } from "stream/web";

export const toReadableStream = (stream: ReadableStreamDefaultReader<Uint8Array>) => {
  const readableStream = new ReadableStream({
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
