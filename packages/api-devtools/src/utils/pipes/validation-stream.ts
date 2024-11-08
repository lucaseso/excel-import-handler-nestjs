import { Transform, TransformCallback } from "stream";
import { ZodSchema } from "zod";
import { BulkValidationException } from "../exceptions/bulk-validation.exception";
import {
  ILineValidationError,
  ZodValidationError,
} from "../exceptions/line-error";
import { HeaderValidationException } from "../exceptions/header-validation.exception";

/**
 * Pipe para transformar e validar linhas de Excel usando um cabeçalho e um schema Zod.
 * 
 * Esta pipe executa tanto a transformação quanto a validação dos dados das linhas de um arquivo Excel.
 * Embora combine duas responsabilidades, isso é justificado por:
 * 
 * - **Redução de Overhead de Listeners**: Cada pipe adicional em uma stream adiciona um listener. Em um contexto de
 *   processamento intenso de dados, como o tratamento de arquivos Excel grandes, adicionar múltiplas pipes pode resultar
 *   em uso excessivo de recursos de listeners, afetando o desempenho do Node.js.
 * 
 * - **Contexto Integrado para Validação e Transformação**: Ambas operações dependem do cabeçalho (`header`) e do schema
 *   (`schema`), facilitando a interação quando combinadas. Esta abordagem permite transformar as linhas de dados e, em
 *   seguida, validá-las no mesmo escopo, otimizando o processamento.
 * 
 * - **Simplicidade e Manutenção**: Em sistemas onde transformação e validação de dados Excel são operações centrais,
 *   esta abordagem simplifica o código e facilita a manutenção, evitando uma hierarquia complexa de pipes que poderia
 *   prejudicar a legibilidade.
 * 
 * @template T O tipo de dados de saída após validação e transformação.
 * @param header O cabeçalho das colunas para mapear os dados de Excel.
 * @param schema Schema Zod para validação dos dados transformados.
 */
export class ExcelToObjectPipe extends Transform {
  private errors: ILineValidationError[] = [];
  private schema: ZodSchema;
  private headers: string[];

  constructor(headers: string[], schema: ZodSchema) {
    super({ objectMode: true });
    this.schema = schema;
    this.headers = headers;
  }

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    try {
      // Se a linha for o cabeçalho, apenas marca como já processada e pula a validação
      if (chunk.number == 1) {
        for (let i = 0; i < this.headers.length; i++) {
          // +1 no array da linha porque o ExcelJS retorna o 0 vazio
          if (this.headers[i] !== chunk.values[i + 1]) {
            this.emit("error", new HeaderValidationException()); // Emite um evento se houver erros
          }
        }
        return callback(); // Pula o restante da lógica para cabeçalho
      }

      // Mapea os campos baseado no cabeçalho esperado
      const lineObject: Record<string, any> = {};
      for (let i = 0; i < this.headers.length; i++) {
        lineObject[this.headers[i]] = chunk.values[i + 1]; // +1 porque o ExcelJS retorna o 0 vazio
      }

      // Valida a linha usando o schema fornecido
      const result = this.schema.safeParse(lineObject);

      if (!result.success) {
        // Coleta erros se a validação falhar
        this.errors.push(new ZodValidationError(chunk.number, [result.error]));
      } else {
        // Se passar na validação, envia para a próxima stream
        this.push(lineObject);
      }

      callback();
    } catch (error) {
      callback(error); // Emite erro se falhar ao fazer parse
    }
  }

  _final(callback: TransformCallback): void {
    if (this.errors.length > 0) {
      callback(new BulkValidationException(this.errors)); // Emite um evento se houver erros
    }
    callback();
  }
}
