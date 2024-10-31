import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

import { FileErrorItem, ILineValidationError } from './line-error';

export class BulkValidationException extends HttpException {
  public readonly errors: ILineValidationError[];

  constructor(errors: ILineValidationError[], options?: HttpExceptionOptions) {
    super(
      {
        message: 'Bulk Validation Failure',
        errors: errors,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
      options,
    );

    this.errors = errors;
  }

  getResponse() {
    const result: FileErrorItem[] = [];
    for (const error of this.errors) {
      result.push(...error.formatToResponse());
    }

    return {
      errors: result,
      message: this.message,
    };
  }
}
