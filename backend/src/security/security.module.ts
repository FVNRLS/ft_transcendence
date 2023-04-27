import { Module } from "@nestjs/common";
import { SecurityController } from "./security.controller";
import { SecurityService } from "./security.service";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";


@Module({
	imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
		providers: [SecurityService, PrismaService],
    controllers: [SecurityController],
})

export class SecurityModule {}