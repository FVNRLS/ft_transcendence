import { Injectable } from '@nestjs/common';
import { SendSmtpEmail } from '@sendinblue/client';

@Injectable()
export class SendinblueEmailService {
  private readonly apiKey: string = process.env.SENDINBLUE_API_KEY;
  private readonly senderEmail: string = process.env.SENDER_EMAIL;

  constructor() {}

  async sendVerificationCode(toEmail: string, code: string): Promise<void> {
    const sendSmtpEmail = new SendSmtpEmail();

    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.sender = { email: this.senderEmail, name: 'Estonian Hedgehogs' };
    sendSmtpEmail.templateId = 1;
    sendSmtpEmail.params = { verification_code: code };

    // Initialize Sendinblue API client
    const SibApiV3Sdk = require('sib-api-v3-sdk');
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications['api-key'].apiKey = this.apiKey;
    const sendApi = new SibApiV3Sdk.SMTPApi();

    // Send email using Sendinblue client library
    await sendApi.sendTransacEmail(sendSmtpEmail);
  }
}