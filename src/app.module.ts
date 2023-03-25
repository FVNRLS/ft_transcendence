import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsModule } from './products/products_module';


@Module({
    imports: [
        ProductsModule,
        MongooseModule.forRoot(`mongodb+srv://USERNAME:PASSWORD@mydatabase.jqfe5bi.mongodb.net/products?retryWrites=true&w=majority`),
    ],
    controllers: [],
    providers: [],
})

export class AppModule {}
