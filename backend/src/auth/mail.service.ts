/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   mail.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/26 12:37:34 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:38:48 by rmazurit         ###   ########.fr       */
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
			const data = {
				sender: {
					name: "Estonian Hedgehogs",
					email: this.senderEmail,
				},
				to: [ { email: email } ],
				subject: "Verification Code",
				htmlContent: `<html><head></head><body><p>Hello,</p>Your verification code: ${code}</p></body></html>`,
			};
	
			const headers = {
				"Accept": "application/json",
				"api-key": this.apiKey,
				"Content-Type": "application/json",
			};
	
			await axios.post(this.apiUrl, data, { headers });
		} catch (error) {
				throw error;
		}
	}
}