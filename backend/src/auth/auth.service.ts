import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthService {
    private readonly _clientId: string = process.env['42_APP_ID'];
    private readonly _clientSecret: string = process.env['42_APP_SECRET'];
    private readonly _callbackURL: string = process.env['42_CALLBACK_URL'];

    async authenticate(code: string): Promise<{ token: string; user: any }> {
        try {
            // Exchange authorization code for access token
            const tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', null, {
                params: {
                    grant_type: 'authorization_code',
                    client_id: this._clientId,
                    client_secret: this._clientSecret,
                    code: code,
                    redirect_uri: this._callbackURL,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const accessToken = tokenResponse.data.access_token;

            // Retrieve user information
            const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const user = userResponse.data;

            return {
                token: accessToken,
                user: user,
            };
        } catch (error) {
            console.error(error);
            throw new Error('Failed to authenticate with 42 API');
        }
    }

    async getUser(accessToken: string): Promise<any> {
        try {
            const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return userResponse.data;
        } catch (error) {
            console.error(error);
            throw new Error('Failed to retrieve user from 42 API');
        }
    }
}
