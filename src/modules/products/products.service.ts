import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { Category, Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
        const existingSku = await this.prisma.product.findUnique({
            where: {sku: createProductDto.sku}
        });
        if(existingSku) {
            throw new ConflictException(`Product with sku ${createProductDto.sku} already exists`)
        }

        const product = await this.prisma.product.create({
            data: {
                ...createProductDto,
                price: Prisma.Decimal(createProductDto.price)
            },
            include: {
                category: true
            }
        });

        return this.formatProduct(product)
    }

    

    private formatProduct(product: Product & {category: Category}): ProductResponseDto {
        return {
            ...product,
            price: Number(product.price),
            category: product.category.name
        }
    }
}
