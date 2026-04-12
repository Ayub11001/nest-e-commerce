import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Category, Prisma } from '@prisma/client';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        const {name, slug, ...rest} = createCategoryDto;
        const categorySlug = slug ?? name
                                        .toLowerCase()
                                        .replace(/\s+/g, '-')
                                        .replace(/[^\w-]/g, '');

        const existingCategory = await this.prisma.category.findUnique({
            where: {slug: categorySlug}
        });
        if(existingCategory) {
            throw new Error('Category with this slug already exists: ' + categorySlug)
        }    
        
        const category = await this.prisma.category.create({
            data: {
                name,
                slug: categorySlug,
                ...rest
            }
        });
        return this.formatCategory(category, 0)
    }

    async findAll(queryDto: QueryCategoryDto): Promise<{
        data: CategoryResponseDto[],
        meta: {total: number; page: number; limit: number; totalPages: number}
    }> {
        const { isActive, search, page = 1, limit = 10 } = queryDto;
        const where: Prisma.CategoryWhereInput = {};

        if(isActive !== undefined) {
            where.isActive = isActive;
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

        const [total, categroies] = await this.prisma.$transaction([
            this.prisma.category.count({where}),
            this.prisma.category.findMany({
                where,
                skip: (page - 1)*limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { products: true }
                    }
                }
            })
        ])
        
        return {
            data: categroies.map(
                category => this.formatCategory(category, category._count.products)
            ),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total/limit)
            }
        }
    }

    async findOne(id: string): Promise<CategoryResponseDto> {
        const category = await this.prisma.category.findUnique({
            where: {id},
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        if(!category) {
            throw new NotFoundException('Category not found')
        }

        return this.formatCategory(category, category._count.products)
    }

    async findCategoryBySlug(slug: string): Promise<CategoryResponseDto> {
        const category = await this.prisma.category.findUnique({
            where: {slug},
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        if(!category) {
            throw new NotFoundException('Category not found')
        }

        return this.formatCategory(category, category._count.products)
    }

    async update(
        id: string, 
        updateCategoryDto: UpdateCategoryDto
    ): Promise<CategoryResponseDto> {
        const existingCategory = await this.prisma.category.findUnique({
            where: {id}
        });
        if(!existingCategory) {
            throw new NotFoundException("Category not found")
        }

        if(
            updateCategoryDto.slug &&
            updateCategoryDto.slug !== existingCategory.slug
        ) {
            const sulgTaken = await this.prisma.category.findUnique({
                where: {slug: updateCategoryDto.slug}
            });
            if(sulgTaken) {
                throw new ConflictException(`Category with slug ${updateCategoryDto.slug} already exists`)
            }
        }

        const updatedCategory = await this.prisma.category.update({
            where: {slug: updateCategoryDto.slug},
            data: updateCategoryDto,
            include: {
                _count: {
                    select: {products: true}
                }
            }
        })
        return this.formatCategory(updatedCategory, updatedCategory._count.products)
    }

    async delete(id: string): Promise<{
        message: string
    }> {
        const existingCategory = await this.prisma.category.findUnique({
            where: {id},
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        if(!existingCategory) {
            throw new NotFoundException('Category not found')
        }
        if(existingCategory._count.products > 0) {
            throw new BadRequestException(`Cannot delete category with ${existingCategory._count.products} products`)
        }

        await this.prisma.category.delete({
            where: {id}
        });

        return {
            message: 'Category deleted successfully'
        }
    }

    private formatCategory(category: Category, productCount: number): CategoryResponseDto {
        return {
            id: category.id,
            slug: category.slug,
            name: category.name,
            description: category.description,
            imageUrl: category.imageUrl,
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            productCount
        }
    }

}
