import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {

    constructor() {}

    getHelloWorld(): string {
        return 'Hello World!';
    }
}
