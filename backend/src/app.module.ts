import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

/*EXAMPLE*/
// import { MongooseModule } from '@nestjs/mongoose';
// import { ProductsModule } from './products[example]/products_module';


@Module({
    imports: [
        // ProductsModule,
        // MongooseModule.forRoot(`mongodb+srv://USERNAME:PASSWORD@mydatabase.jqfe5bi.mongodb.net/products?retryWrites=true&w=majority`),
        AuthModule,
    ],
    controllers: [],
    providers: [],
})

export class AppModule {}
