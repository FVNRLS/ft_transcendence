import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// @ts-ignore
async function bootstrap() : Promise<void> {
    return NestFactory.create(AppModule)
      .then((app) => app.listen(6969))
      .catch((err) => console.error(err));
}

bootstrap()
  .then(() => console.log('Application started successfully.'))
  .catch((err) => console.error(`Error starting application: ${err}`));
