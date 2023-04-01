import { Controller, Post, Body } from '@nestjs/common';
import { OAuth2Request, AuthorizedRequest } from 'nestjs-oauth2-server/dist/ui/dto/oauth2-request.dto';
import { AuthorizedRequest} from 'nestjs-oauth2-server/dist/guards/authorized-request';
import { AuthService } from './auth.service';

@Controller('oauth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  async token(@OAuthRequest() req: AuthorizedRequest) {
    const accessToken = await this.authService.issueAccessToken(req.user);
    return { access_token: accessToken };
  }

  @Post('authorize')
  async authorize(@Body() body: any, @OAuthRequest() req: AuthorizedRequest) {
    const { clientId, redirectUri, responseType } = body;
    const user = req.user;
    // validate client ID, redirect URI, and response type
    const code = await this.authService.generateAuthorizationCode(user, clientId);
    // generate authorization code and store it in a database or cache
    const queryParams = `?code=${code}&state=${body.state}`;
    const authorizeUri = `${redirectUri}${queryParams}`;
    return { authorize_uri: authorizeUri };
  }
}