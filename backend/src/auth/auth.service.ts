import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly authorizationCodes: Map<string, any> = new Map();

  private readonly accessTokenSecret = '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'; // replace with your own secret key
  private readonly accessTokenExpirationTime = 3600; // access token expiration time in seconds

  async issueAccessToken(user: any): Promise<string> {
    const payload = { sub: user.id, name: user.name, email: user.email };
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpirationTime,
    });
    return accessToken;
  }

  async generateAuthorizationCode(user: any, clientId: string): Promise<string> {
    const code = uuidv4();
    this.authorizationCodes.set(code, { user, clientId });
    return code;
  }

  async exchangeAuthorizationCodeForToken(code: string): Promise<any> {
    const authCode = this.authorizationCodes.get(code);
    if (!authCode) {
      throw new Error('Invalid authorization code');
    }
    this.authorizationCodes.delete(code);
    const accessToken = await this.issueAccessToken(authCode.user);
    return { access_token: accessToken };
  }
}