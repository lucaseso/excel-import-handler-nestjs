import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import * as Busboy from 'busboy';
import { Request } from 'express';

export const FileStream = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Observable<any> => {
    const req: Request = ctx.switchToHttp().getRequest();
    const subject = new Subject<any>();

    const busboy = Busboy({ headers: req.headers });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      // Emit the stream and file information through the Subject
      subject.next({ fieldname, file, filename, encoding, mimetype });

      file.on('end', () => {
        subject.complete(); // Complete the Observable when the file ends
      });
    });

    busboy.on('error', (error) => {
      subject.error(error); // Emit an error if something goes wrong
    });

    req.pipe(busboy);

    return subject.asObservable();
  },
);
