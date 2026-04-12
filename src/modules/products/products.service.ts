import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { Category, Prisma, Product } from '@prisma/client';
import { QueryProductDto } from './dto/query-product.dto';
import { serialize } from 'v8';

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

    async findAll(queryProductDto: QueryProductDto): Promise<{
        data: ProductResponseDto[],
        meta: {
            page: number,
            total: number, 
            limit: number,
            totalPages: number
        }
    }> {
        const { 
            category, 
            isActive, 
            search, 
            page = 1, 
            limit = 10,
        } = queryProductDto;
        const where: Prisma.ProductWhereInput = {}

        if(category) {
            where.categoryId = category
        }
        if(isActive !== undefined) {
            where.isActive = isActive
        }
        if(search) {
            where.OR = [
                {
                    name: { contains: search, mode: 'insensitive' }
                },
                {
                    description: { contains: search, mode: 'insensitive' }
                }
            ]
        }

        const [total, products] = await this.prisma.$transaction([
            this.prisma.product.count({where}),
            this.prisma.product.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    category: true
                },
                orderBy: {createdAt: 'desc'}
            })
        ])

        return {
            data: products.map(
                product => this.formatProduct(product)
            ),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total/limit)
            }
        }

    }

    private formatProduct(product: Product & {category: Category}): ProductResponseDto {
        return {
            ...product,
            price: Number(product.price),
            category: product.category.name
        }
    }
}
