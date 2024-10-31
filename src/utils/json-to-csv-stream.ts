import { Transform, TransformCallback } from 'stream';

export class JsonToCsvTransform extends Transform {
  constructor() {
    super({ encoding: 'utf8' });
  }

  _transform(
    chunk: Buffer | string,
    encoding: string,
    cb: TransformCallback,
  ): void {
    // Converte JSON diretamente em CSV e passa para o próximo stream
    const csvLine =
      Object.values(JSON.parse(chunk.toString())).join(';') + '\n';
    cb(null, csvLine);
  }
}
