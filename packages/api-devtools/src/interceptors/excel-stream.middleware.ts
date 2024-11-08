import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from "@nestjs/common";
import { Request, Response } from "express";
import * as Busboy from "busboy";
import * as ExcelJS from "exceljs";

@Injectable()
export class ExcelStreamMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next) {
    // Verifica se o tipo de conteúdo é multipart/form-data
    if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
      const busboy = Busboy({ headers: req.headers });
      let fileProcessed = false;

      // Cria uma promise para aguardar a leitura do arquivo
      await new Promise<void>((resolve, reject) => {
        busboy.on("file", async (_, fileStream, metadata) => {
          // Verifica se o tipo de arquivo é Excel
          if (
            metadata.mimeType !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ) {
            next(
              new BadRequestException("Only xls and xlsx files are allowed")
            );
            return reject(); // Retorna sem permitir que o request siga
          }

          try {
            // Cria o leitor do Excel
            const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
              fileStream,
              {}
            );

            // Processa a primeira planilha
            for await (const worksheetReader of workbookReader) {
              req["excelStream"] = worksheetReader; // Armazena a excelStream na requisição
              break; // Processa apenas a primeira folha, pode ser adaptado para mais
            }

            // Encerra a leitura do arquivo
            fileStream.resume();
            resolve(); // Conclui o processamento com sucesso
            next();
          } catch (error) {
            reject(error); // Se ocorrer um erro no processamento, rejeita a Promise
          }
        });

        // Evento para caso nenhum arquivo seja enviado
        busboy.on("finish", () => {
          if (!fileProcessed) {
            resolve();
            next(); // Chama o próximo middleware/controller
          }
        });

        req.pipe(busboy);
      });
    } else {
      // Se não for um arquivo multipart, apenas prossegue
      next();
    }
  }
}
