import { Transform, TransformCallback } from 'stream';
import { ZodSchema } from 'zod';
import { BulkValidationException } from '../exceptions/bulk-validation.exception';
import {
  ILineValidationError,
  ZodValidationError,
} from '../exceptions/line-error';
import { HeaderValidationException } from '../exceptions/header-validation.exception';

export class EntityValidationPipe extends Transform {
  private errors: ILineValidationError[] = [];
  private schema: ZodSchema;
  private headers: string[];

  constructor(headers: string[], schema: ZodSchema) {
    super({ objectMode: false });
    this.schema = schema;
    this.headers = headers;
  }

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    try {
      const line = JSON.parse(chunk.toString()); // Parse o JSON

      // Se a linha for o cabeçalho, apenas marca como já processada e pula a validação
      if (line.rowNumber == 1) {
        for (let i = 0; i < this.headers.length; i++) {
          // +1 no array da linha porque o ExcelJS retorna o 0 vazio
          if (this.headers[i] !== line.values[i+1]) {
            this.emit('error', new HeaderValidationException()); // Emite um evento se houver erros
          }
        }
        return callback(); // Pula o restante da lógica para cabeçalho
      }

      // Mapea os campos baseado no cabeçalho esperado
      const lineObject: Record<string, any> = {};
      for (let i = 0; i < this.headers.length; i++) {
        lineObject[this.headers[i]] = line.values[i + 1]; // +1 porque o ExcelJS retorna o 0 vazio
      }

      // Valida a linha usando o schema fornecido
      const result = this.schema.safeParse(lineObject);

      if (!result.success) {
        // Coleta erros se a validação falhar
        this.errors.push(
          new ZodValidationError(line.rowNumber, [result.error]),
        );
      } else {
        // Se passar na validação, envia para a próxima stream
        this.push(chunk);
      }

      callback(); // Próxima linha
    } catch (error) {
      callback(error); // Emite erro se falhar ao fazer parse
    }
  }

  _final(callback: TransformCallback): void {
    if (this.errors.length > 0) {
      this.emit('error', new BulkValidationException(this.errors)); // Emite um evento se houver erros
    }
    callback(); // Finaliza a stream
  }
}
