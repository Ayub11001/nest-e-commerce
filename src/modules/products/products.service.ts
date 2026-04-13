import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { Category, Prisma, Product } from '@prisma/client';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-porduct.dto';
import { retry } from 'rxjs';

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

    async findOne(id: string): Promise<ProductResponseDto> {
        const product = await this.prisma.product.findUnique({
            where: {id},
            include: {
                category: true
            }
        });
        if(!product) {
            throw new NotFoundException('Product not found')
        }

        return this.formatProduct(product)
    }

    async update(
        id: string, 
        updateProductDto: UpdateProductDto   
    ): Promise<ProductResponseDto> {
        const existingProduct = await this.prisma.product.findUnique({
            where: {id}
        })
        if(!existingProduct) {
            throw new NotFoundException('Product not found');
        }

        if(
            updateProductDto.sku && 
            existingProduct.sku !== updateProductDto.sku
        ) {
            const existingSku = await this.prisma.product.findUnique({
            where: {sku: updateProductDto.sku}
            });
            if(existingSku) {
                throw new ConflictException(`Product with sku ${updateProductDto.sku} already exists`)
            }
        }

        const updateData: any = { ...updateProductDto };
        if(updateProductDto.price !== undefined) {
            updateData.price = new Prisma.Decimal(updateProductDto.price)
        }

        const updatedProduct = await this.prisma.product.update({
            where: {id},
            data: updateData,
            include: {
                category: true
            }
        })

        return this.formatProduct(updatedProduct);
    }

    async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
        const product = await this.prisma.product.findUnique({
            where: {id},
        });
        if(!product) {
            throw new NotFoundException('Product not found');
        }

        const newStock: number = product.stock + quantity;
        if(newStock < 0) {
            throw new BadRequestException('Insufficeint stock')
        }

        const updatedProduct = await this.prisma.product.update({
            where: {id},
            data: {stock: newStock},
            include: {
                category: true
            }
        });

        return this.formatProduct(updatedProduct);
    }

    async remove(id: string): Promise<{
        message: string
    }> {
        const product = await this.prisma.product.findUnique({
            where: {id},
            include: {
                orderItems: true,
                cartItems: true
            }
        });
        if(!product) {
            throw new NotFoundException('Product not found');
        }

        if(product.orderItems.length > 0 || product.cartItems.length > 0) {
            throw new BadRequestException('Cannot delete a product that is a part of a cart or an active order')
        }  

        await this.prisma.product.delete({
            where: {id}
        });

        return {message: 'Product deleted successfully'}
    }

    private formatProduct(product: Product & {category: Category}): ProductResponseDto {
        return {
            ...product,
            price: Number(product.price),
            category: product.category.name
        }
    }
}
