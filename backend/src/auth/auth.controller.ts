//AUTH API

import { Controller, Body, Header, Param, Get, Post, Put, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')

export class AuthController {

    constructor(private readonly AuthService: AuthService) {}

    @Get()
    getHelloWorld(): string {
        return this.AuthService.getHelloWorld();
    }
}
