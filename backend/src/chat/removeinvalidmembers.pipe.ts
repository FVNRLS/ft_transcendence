/*
https://docs.nestjs.com/pipes
*/

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class RemoveInvalidMembersPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && value.members) {
      value.members = value.members.filter(member => member && member.id);
    }
    return value;
  }
}
