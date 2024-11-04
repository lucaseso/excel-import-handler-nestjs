import {
  Controller,
  HttpException,
  HttpStatus,
  Next,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as busboy from 'busboy';
import * as ExcelJS from 'exceljs';
import {
  RequestExcel,
  ExcelStreamInterceptor,
  EntityValidationPipe,
  JsonToCsvPipe,
} from '@mtrix-df/apidevtools';
import { Response } from 'express';
import { pipeline } from 'stream';
import { createWriteStream } from 'fs';
import { testSchema } from '../../../packages/api-devtools/utils/validation/test-schema';

async function handleFileStream(file: any) {
  try {
    // Create ExcelJS workbook reader and pass the stream
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(file, {});

    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        console.log(row.values);
      }
      break;
    }
    file.emit('finished');
  } catch (error) {
    file.emit('error', error);
  }
}

const header = [
  'CD_LOCALIDADE',
  'NM_LOCALIDADE',
  'CD_BAIRRO',
  'NM_BAIRRO',
  'CD_IBGE',
  'UF',
  'CD_DIST',
];

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/test/interceptor')
  @UseInterceptors(ExcelStreamInterceptor)
  async uploadFileWithInterceptor(
    @Req() req: RequestExcel,
    @Res() res: Response,
    @Next() next,
  ) {
    const excelStream = req.excelStream;

    if (!excelStream) {
      return res.status(400).send('Nenhum arquivo enviado ou processado');
    }

    const validationPipe = new EntityValidationPipe(header, testSchema);
    const jsonToCsvPipe = new JsonToCsvPipe();
    const writeStream = createWriteStream('output.csv', { encoding: 'utf8' });

    pipeline(
      excelStream,
      validationPipe,
      jsonToCsvPipe,
      writeStream,
      (error) => {
        console.timeEnd('upload with stream interceptor');
        if (error instanceof HttpException) {
          return next(error);
        } else if (error) {
          return next(new HttpException(error.message, 400));
        }

        // If successful, handle the finish
        res.json({ message: 'OK' });
      },
    );
  }

  @Post('/test/import')
  uploadFile(@Req() req, @Res() res, @Next() next) {
    console.time('upload with busboy on controller');
    const bb = busboy({ headers: req.headers });

    bb.on('file', (_name, file) => {
      file.on('error', (error) => {
        bb.emit('error', error); // propagate the error to the busboy error event
      });

      file.on('finished', () => {
        bb.emit('finished'); // propagate the error to the busboy
      });

      handleFileStream(file);
    });

    bb.on('error', (error: Error) => {
      req.unpipe(bb);
      bb.removeAllListeners();
      next(error);
    });

    bb.on('finished', () => {
      req.unpipe(bb);
      bb.removeAllListeners();
      res.status(HttpStatus.OK).json();
      console.timeEnd('upload with busboy on controller');
    });

    req.pipe(bb);
  }
}
