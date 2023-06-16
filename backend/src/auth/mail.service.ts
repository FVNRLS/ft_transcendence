/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   mail.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/26 12:37:34 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 20:00:47 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
	constructor() {}

  async sendVerificationCode(email: string, code: string): Promise<void> {
		try {
			var SibApiV3Sdk = require('sib-api-v3-typescript');
			var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

			var apiKey = apiInstance.authentications['apiKey'];
			apiKey.apiKey = process.env.BREVO_API_KEY;

			var sendSmtpEmail = {
				to: [{
					email: email,
				}],
				templateId: 9,
				params: { verification_code: code }
			};

			apiInstance.sendTransacEmail(sendSmtpEmail);
		} catch (error) {
			throw (error);
		}
  }
}
