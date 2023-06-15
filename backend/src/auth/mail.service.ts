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
import axios from "axios";

@Injectable()
export class MailService {
  private readonly apiKey: string = process.env.SENDINBLUE_API_KEY;
  private readonly senderEmail: string = process.env.SENDER_EMAIL;
  private readonly apiUrl: string = process.env.SENDINBLUE_API_URL;

  async sendVerificationCode(email: string, code: string): Promise<void> {
	try {
		var SibApiV3Sdk = require('sib-api-v3-typescript');
		
		var apiInstance = new SibApiV3Sdk.SMTPApi()
		console.log("inside");

		// Configure API key authorization: api-key
		var apiKey = apiInstance.authentications['apiKey'];
		apiKey.apiKey = this.apiKey

		// Configure API key authorization: partner-key
		var partnerKey = apiInstance.authentications['partnerKey'];
		partnerKey.apiKey = this.apiKey

		var sendSmtpEmail = {
			to: [{
				email: email,
			}],
			templateId: 9,
			params: { verification_code: code },
			headers: {
				'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2' //look here closer
			}
		};

		apiInstance.sendTransacEmail(sendSmtpEmail);
		console.log("ZAEBIS!!!");
	} catch (error) {
		throw (error);
	}
  }
}



//   async sendVerificationCode(email: string, code: string): Promise<void> {
// 		try {
// 			const data = {
// 				templateId: 9,
// 				sender: {
// 					name: "Estonian Hedgehogs",
// 					email: this.senderEmail,
// 				},
// 				to: [ { email: email } ],
// 				params: { verification_code: code },
// 			};
	
// 			const headers = {
// 				"accept": "application/json",
// 				"api-key": this.apiKey,
// 				"content-Type": "application/json",
// 			};
	
// 			await axios.post(this.apiUrl, data, { headers });
// 		} catch (error) {
// 			throw error;
// 		}
// 	}
// }