// import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { SendSmtpEmail } from '@sendinblue/client';

// @Injectable()
// export class MailService {
//   private readonly apiKey: string = process.env.SENDINBLUE_API_KEY;
//   private readonly senderEmail: string = process.env.SENDER_EMAIL;

//   constructor() {}

//   async sendVerificationCode(destEmail: string, code: string): Promise<void> {
// 		try {
// 			const sendSmtpEmail = new SendSmtpEmail();
	
// 			sendSmtpEmail.to = [{ email: destEmail }];
// 			sendSmtpEmail.sender = { email: this.senderEmail, name: 'Estonian Hedgehogs' };
// 			sendSmtpEmail.templateId = 1;
// 			sendSmtpEmail.params = { verification_code: code };
	
// 			// Initialize Sendinblue API client
// 			const SibApiV3Sdk = require('sib-api-v3-sdk');
			
// 			const defaultClient = SibApiV3Sdk.ApiClient.instance;
// 			defaultClient.authentications['api-key'].apiKey = this.apiKey;
// 			const sendApi = new SibApiV3Sdk.SMTPApi();
// 			console.log("-------");
	
// 			// Send email using Sendinblue client library
// 			await sendApi.sendTransacEmail(sendSmtpEmail);
// 		} catch (error) {
//       if (error instanceof HttpException) {
//         throw error;
//       } else {
// 				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
//       }
//     }
//   }w
// }

import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateEmailCampaign, EmailCampaignsApi } from 'sib-api-v3-sdk';

export class MailService {
  private readonly apiKey: string = process.env.SENDINBLUE_API_KEY;
  private readonly senderEmail: string = process.env.SENDER_EMAIL;

  async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      const SibApiV3Sdk = require('sib-api-v3-sdk');
      const defaultClient = SibApiV3Sdk.ApiClient.instance;

      // Set the API key
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = this.apiKey;

      const apiInstance = new EmailCampaignsApi();

      const emailCampaigns = new CreateEmailCampaign();
      emailCampaigns.name = 'Verification Code';
      emailCampaigns.subject = 'Your verification code';
      emailCampaigns.sender = { name: 'Estonian Hedgehogs', email: this.senderEmail };
      emailCampaigns.type = 'classic';
      emailCampaigns.htmlContent = `Your verification code is ${code}`;
      emailCampaigns.to = [{ email }];
      
      await apiInstance.createEmailCampaign(emailCampaigns);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException('Oops... Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}