/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:56:32 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:39:57 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Worker } from "worker_threads";

/*
1. The NestFactory.create method creates a new NestJS application 
instance based on the AppModule imported from the application codebase.

2. The app.useGlobalPipes method registers a ValidationPipe as a global middleware for the application. 
This means that all incoming requests will be automatically validated against the schema 
defined in their respective DTO classes, and any validation errors will 
result in a BadRequestException being thrown.

3. The app.enableCors method enables Cross-Origin Resource Sharing (CORS) for the application. 
This allows clients from different domains to make requests to the application API. 
In this case, the origin property is set to true, which means that any domain can make requests to the API,
and the credentials property is set to true, which allows the client to 
include cookies and authentication headers in the request.

4. The app.listen method starts the application server and listens for incoming requests on the specified port. 
The port number is read from the process.env.PORT environment variable if it"s defined, otherwise, it defaults to port 5000.

5. Finally, the bootstrap function is called to start the application. This function is usually called at the end of the application"s entry file.
*/
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const PORT = process.env.PORT || 5000;

  app.enableCors({
		origin: true,
		credentials: true,
	});

  await app.listen(PORT);
}

bootstrap();
