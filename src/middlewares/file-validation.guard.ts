import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Busboy from 'busboy';

@Injectable()
export class FileValidationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    return new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      let hasFile = false;

      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        hasFile = true;

        // Valida o tipo MIME do arquivo
        if (mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          reject(new HttpException('Tipo de arquivo não suportado', HttpStatus.BAD_REQUEST));
        }

        // Armazena o stream do arquivo no req
        req.fileStream = file;
      });

      busboy.on('finish', () => {
        if (!hasFile) {
          reject(new HttpException('Nenhum arquivo enviado', HttpStatus.BAD_REQUEST));
        }
        resolve(true);
      });

      req.pipe(busboy);
    });
  }
}
