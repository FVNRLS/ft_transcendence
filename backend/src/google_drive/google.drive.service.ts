import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleDriveService {
  private readonly oauth2Client: OAuth2Client;
  private readonly drive: any;


  //TODO: continue here with guthub tutorial!
  constructor() {
    // Initialize the OAuth2 client with the Google API credentials
    this.oauth2Client = new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });

    // Initialize the Google Drive API client with the OAuth2 client
    this.oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const drive = google.drive({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  /**
   	* Uploads a file to Google Drive and returns the ID of the uploaded file.
   	* @param stream The file stream to upload
   	* @param filename The name of the file to upload
   	* @returns The ID of the uploaded file
	*/
	async upload(stream: Readable, filename: string): Promise<{ id: string }> {
    // Authenticate with the Google API using the credentials
    const credentials = await this.oauth2Client.getAccessToken();
    if (!credentials || !credentials.token) {
      throw new HttpException('Failed to get Google access token', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Create a new file in Google Drive
    const res = await this.drive.files.create({
      requestBody: {
        name: filename,
        mimeType: 'image/png', // Change the MIME type to match your file type
      },
      media: {
        mimeType: 'image/png', // Change the MIME type to match your file type
        body: stream,
      },
    });

    // Return the ID of the created file
    return { id: res.data.id };
  }
}
