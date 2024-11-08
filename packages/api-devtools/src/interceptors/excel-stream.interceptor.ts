import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import * as Busboy from "busboy";
import * as ExcelJS from "exceljs";
import { Readable } from "stream";

@Injectable()
export class ExcelStreamInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (request.headers["content-type"]?.startsWith("multipart/form-data")) {
      const busboy = Busboy({ headers: request.headers });
      request["stopReading"] = false;

      // Criar um stream legível para as folhas de trabalho
      const excelStream = new Readable({
        objectMode: true, // Ativa o modo objeto
        read() {
          // Inicia a stream para ler o arquivo na requisição
          request.pipe(busboy);
        },
      });

      // Intercepta e trata o arquivo enviado
      busboy.on("file", async (_, fileStream, metadata) => {
        // Apenas processar arquivos do Excel
        if (
          metadata.mimeType !==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          response.status(400).send("Tipo de arquivo não suportado");
          return;
        }

        // Criar o leitor de workbooks do ExcelJS
        const workbookReader: any = new ExcelJS.stream.xlsx.WorkbookReader(
          fileStream,
          {}
        );

        for await (const worksheetReader of workbookReader) {
          for await (const row of worksheetReader) {
            // evitar uso desnecessário de recursos caso exista erro
            if (request["stopReading"]) {
              break;
            }
            excelStream.push(row);
          }
          break;
        }

        // Encerrar stream
        excelStream.push(null);

        // Encerra a leitura do arquivo pra liberar o busboy
        fileStream.resume();
      });

      // Anexa o stream à requisição
      request["excelStream"] = excelStream;

      return next.handle(); // Chama o próximo manipulador (controlador)
    } else {
      return next.handle(); // Se não for um arquivo multipart, prossegue normalmente
    }
  }
}
