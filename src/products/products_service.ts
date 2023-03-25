import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Promise } from 'mongoose';
import { CreateProductDto } from './dto/create_product_dto';
import { Product, ProductDocument } from './schemas/product_schema'
import { UpdateProductDto } from './dto/update_product_dto';

@Injectable()
export class ProductService {

    constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {

    }

    async getAll(): Promise<Product[]> {
        return this.productModel.find().exec();
    }

    async getById(id: string): Promise<Product | null> {
        return this.productModel.findById(id);
    }

    async create(product: CreateProductDto): Promise<Product | null> {
        const newProduct = await this.productModel.create(product);
        return newProduct.save();
    }

    async remove(id: string): Promise<Product | null> {
        return this.productModel.findByIdAndRemove(id);
    }

    async update(id: string, productDto: UpdateProductDto): Promise<Product | null> {
        return this.productModel.findByIdAndUpdate(id, productDto, {new: true});
    }
}