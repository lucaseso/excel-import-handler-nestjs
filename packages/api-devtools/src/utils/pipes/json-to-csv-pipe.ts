import { Transform, TransformCallback } from "stream";

export class JsonToCsvPipe extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    chunk: Buffer | string,
    encoding: string,
    cb: TransformCallback
  ): void {
    // Converte JSON diretamente em CSV e passa para o próximo stream
    const csvLine =
      Object.values(chunk).join(";") + "\n";
    cb(null, csvLine);
  }
}
