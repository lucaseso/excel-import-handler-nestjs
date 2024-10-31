import { UnprocessableEntityException } from '@nestjs/common';

export class HeaderValidationException extends UnprocessableEntityException {
  constructor() {
    super('Invalid header format: please verify the fields and expected order');
  }
}
