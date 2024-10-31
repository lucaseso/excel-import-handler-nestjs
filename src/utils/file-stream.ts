import * as busboy from 'busboy';
import { Request } from 'express';
import internal from 'stream';

export function handleFileStream(
  req: Request,
  handleFileStream: (file: internal.Readable) => void,
) {
  const bb = busboy({ headers: req.headers });

  bb.on('file', (fieldname, file) => {
    file.on('error', () => {
      bb.emit('error');
    });

    file.on('end', () => {
      bb.emit('finish');
    });

    handleFileStream(file);
  });

  bb.on('error', (error) => {
    throw error; // Emit an error if something goes wrong
  });

  bb.on('finish', () => {
    console.log('terminou');
  });

  req.pipe(bb);
}
