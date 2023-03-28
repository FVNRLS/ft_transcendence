import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { CreateProductDto } from './dto/create_product_dto';
import { UpdateProductDto } from './dto/update_product_dto';
import { ProductService } from './products_service';
import { Product } from './schemas/product_schema';


@Controller('products[example]')
export class ProductsController {
    constructor(private readonly productsService: ProductService) {
    } //injects a service to controller


    @Get()
    //@Redirect('https://goggle.com', 301) //possible to set redirection (just example)
    getAll(): Promise<Product[]> {
        return this.productsService.getAll();
    }

    @Get(':id')
    getOne(@Param('id') id: string): Promise<Product | null> {
        return this.productsService.getById(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Header('Cache-Control', 'none')
    create(@Body() createProductDto: CreateProductDto): Promise<Product | null> {
        return this.productsService.create(createProductDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<Product | null> {
        return this.productsService.remove(id);
    }

    @Put(':id')
    update(@Body() updateProductDto: UpdateProductDto, @Param('id') id: string): Promise<Product | null> {
        return this.productsService.update(id, updateProductDto);
    }
}
