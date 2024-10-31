import { ZodError } from 'zod';

export type FileErrorItem = {
  line: number;
  column: string | number;
  messages: (string | i18nMessage)[];
};

export type i18nMessage = {
  message: string;
  translationArgs: any;
};

export type columnErrorMap = Map<string | number, Array<i18nMessage | string>> &
  Error;

export interface ILineValidationError {
  line: number;
  validationErrors: Error[] | columnErrorMap;

  formatToResponse(): FileErrorItem[];
}

export class ZodValidationError implements ILineValidationError {
  line: number;
  validationErrors: ZodError[];

  constructor(line, validationErrors) {
    this.line = line
    this.validationErrors = validationErrors
  }

  formatToResponse(): FileErrorItem[] {
    const result: FileErrorItem[] = [];
    for (const lineError of this.validationErrors) {
      const { fieldErrors } = lineError.flatten();

      for (const key in fieldErrors) {
        result.push({
          line: this.line,
          column: key,
          messages: fieldErrors[key],
        });
      }
    }

    return result;
  }
}

export class LineValidationError implements ILineValidationError {
  line: number;
  validationErrors: columnErrorMap;

  constructor(line) {
    this.line = line;
    this.validationErrors = new Map() as columnErrorMap;
  }

  formatToResponse(): FileErrorItem[] {
    const result: FileErrorItem[] = [];

    for (const column of this.validationErrors.keys()) {
      result.push({
        line: this.line,
        column,
        messages: this.validationErrors.get(column),
      });
    }

    return result;
  }

  addErrorToColumn(column, value: i18nMessage | string) {
    if (!this.validationErrors.has(column)) {
      this.validationErrors.set('column', []);
    }

    this.validationErrors.get('column').push(value);
  }
}
