import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post()
    async authenticate(@Body() body: { accessToken: string }) {
        try {
            // Use the access token to get the user information from 42 API
            const user = await this.authService.getUser(body.accessToken);
            console.log('Authenticated user:', user);
        } catch (error) {
            console.error(error);
        }
    }
}
