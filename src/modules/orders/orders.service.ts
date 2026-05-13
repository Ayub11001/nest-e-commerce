import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrderApiResponseDto, OrderResponseDto } from './dto/order-response.dto';
import { Order, OrderItem, OrderStatus, Prisma, Product, User } from '@prisma/client';
import { QueryOrderDto } from './dto/queryOrder.dto';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderApiResponseDto<OrderResponseDto>> {
        // createOrderDto => items -> each item -> ( productId, price, quantity )
        const { items, shippingAddress } = createOrderDto;
        for(const item of items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId }
            })
            if(!product) {
                throw new NotFoundException(`Product with id: ${item.productId} not found`)
            }
            if(product.stock < item.quantity) {
                throw new BadRequestException(`Insufficient Stock for product ${product.name}. Available stock ${product.stock}, Ordered quantity ${item.quantity}`)
            }
        }

        const totalAmount = items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
        );

        const latestCart = await this.prisma.cart.findFirst({
            where: { userId, checkedOut: false },
            orderBy: { createdAt: 'desc' }
        });

        const order = await this.prisma.$transaction(
            async tx => {
                const newOrder = await tx.order.create({
                    data: {
                        userId,
                        status: OrderStatus.PENDING,
                        totalAmount,
                        shippingAddress,
                        cartId: latestCart?.id,
                        orderItems: {
                            create: items.map(
                                item => ({
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    price: item.price
                                })
                            )
                        }
                    },
                    include: {
                        orderItems: {
                            include: {
                                product: true
                            }
                        },
                        user: true,
                    }
                });

                await Promise.all(
                    items.map(
                        (item) => tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } }
                        })
                    )
                )
                return newOrder;
            }
        );

        return this.wrap(order);
    }

    async getAll(query: QueryOrderDto): Promise<{
        data: OrderResponseDto[];
        page: number;
        limit: number;
        total: number;
    }> {
        const {
            page = 1, 
            limit = 10,
            status,
            search
        } = query;
        const skip: number = (page-1) * limit;

        const where: Prisma.OrderWhereInput = {};
        if (status) where.status = status;
        if (search) where.OR = [
            { id: { contains: search, mode: 'insensitive' } },
            { orderNumber: { contains: search, mode: 'insensitive' } }
        ];

        const [ orders, total ] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    user: true,
                },
                orderBy: { createdAt: "desc" },
            }),

            this.prisma.order.count({where}),
        ]);

        return {
            data: orders.map(
                order => this.map(order)
            ),
            total,
            page,
            limit
        }
    }




    private wrap(
        order: Order & { 
            orderItems: (OrderItem & { product: Product })[];
            user: User
        }
    ): OrderApiResponseDto<OrderResponseDto> { 
        return {
            success: true,
            message: 'Order placed successfully',
            data: this.map(order),
        }
    }

    private map(
        order: Order & { 
            orderItems: (OrderItem & { product: Product })[];
            user: User 
        }
    ): OrderResponseDto {
        return {
            id: order.id,
            userId: order.userId,
            status: order.status,
            shippingAddress: order.shippingAddress || '',
            total: Number(order.totalAmount),
            items: order.orderItems.map(
                item => {
                    return {
                        id: item.id,
                        productId: item.productId,
                        productName: item.product.name,
                        quantity: item.quantity,
                        price: Number(item.price),
                        subtotal: Number(item.price) * item.quantity,
                        createdAt: item.createdAt,
                        updatedAt: item.updartedAt
                    }
                }
            ),
            ...(order.user && {
                userEmail: order.user.email,
                userName: `${order.user.firstName || ''}${order.user.lastName || ''}`.trim()
            }),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }
    }
}
