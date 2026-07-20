import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Prisma, PaymentProvider, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private get clickSecretKey(): string {
    return this.configService.get('CLICK_SECRET_KEY') || '';
  }

  private get clickServiceId(): string {
    return this.configService.get('CLICK_SERVICE_ID') || '';
  }

  private get paymeId(): string {
    return this.configService.get('PAYME_ID') || '';
  }

  private get paymeKey(): string {
    return this.configService.get('PAYME_KEY') || '';
  }

  // ==================== CLICK PAYMENT ====================

  async clickPrepare(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true, olympiad: true },
    });

    if (!registration) {
      throw new NotFoundException('Ariza topilmadi');
    }

    if (registration.status !== 'PENDING') {
      throw new BadRequestException('Bu arizaga to\'lov amalga oshirib bo\'lmaydi');
    }

    const amount = Number(registration.olympiad.price);
    
    // Create or update payment record
    const payment = await this.prisma.payment.upsert({
      where: { registrationId },
      create: {
        registrationId,
        provider: PaymentProvider.CLICK,
        transactionId: `click_${registrationId}_${Date.now()}`,
        amount: registration.olympiad.price,
        status: PaymentStatus.PENDING,
      },
      update: {
        amount: registration.olympiad.price,
        status: PaymentStatus.PENDING,
      },
    });

    // Generate Click payment URL
    const params = new URLSearchParams({
      merchant_id: this.clickServiceId,
      amount: amount.toFixed(2),
      transaction_param: registration.id,
      merchant_trans_id: payment.transactionId,
      return_url: `${this.configService.get('FRONTEND_URL')}/payment/success`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
    });

    // Add signature
    const signString = `${this.clickServiceId}${amount.toFixed(2)}${payment.transactionId}${this.clickSecretKey}`;
    const sign = crypto.createHash('md5').update(signString).digest('hex');

    params.append('sign_string', sign);

    const paymentUrl = `https://my.click.uz/services/pay?${params.toString()}`;

    return {
      paymentUrl,
      transactionId: payment.transactionId,
      amount: amount,
    };
  }

  async clickComplete(merchantTransId: string, clickTransId: string, signString: string): Promise<{ success: boolean; error?: string }> {
    // Skip signature verification in development
    const isDev = this.configService.get('NODE_ENV') === 'development';
    if (!isDev) {
      const expectedSign = crypto
        .createHash('md5')
        .update(`${clickTransId}${this.clickServiceId}${this.clickSecretKey}${merchantTransId}`)
        .digest('hex');

      if (signString !== expectedSign) {
        this.logger.error('Click signature verification failed', { merchantTransId, clickTransId });
        return { success: false, error: 'Invalid signature' };
      }
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: merchantTransId },
      include: { registration: { include: { user: true, olympiad: true } } },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { success: true }; // Already processed
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          payedAt: new Date(),
          transactionId: clickTransId, // Update with Click's transaction ID
        },
      });

      await tx.registration.update({
        where: { id: payment.registrationId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Create attendance record
      await tx.attendance.create({
        data: { registrationId: payment.registrationId },
      });
    });

    // Generate PDF ticket asynchronously
    this.generateTicketAsync(payment.registrationId).catch(err => 
      this.logger.error('PDF generation failed', err)
    );

    return { success: true };
  }

  // ==================== PAYME PAYMENT ====================

  async paymeCreateReceipt(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true, olympiad: true },
    });

    if (!registration || registration.status !== 'PENDING') {
      throw new BadRequestException('To\'lov uchun arizani holati to\'g\'ri emas');
    }

    const amount = Number(registration.olympiad.price);
    const paymeTransactionId = `payme_${registrationId}_${Date.now()}`;

    await this.prisma.payment.upsert({
      where: { registrationId },
      create: {
        registrationId,
        provider: PaymentProvider.PAYME,
        transactionId: paymeTransactionId,
        amount: registration.olympiad.price,
        status: PaymentStatus.PENDING,
      },
      update: {
        amount: registration.olympiad.price,
        status: PaymentStatus.PENDING,
        transactionId: paymeTransactionId,
      },
    });

    // For Payme, we need to call their API to create a receipt
    // This is a simplified version - real implementation needs proper Payme API calls
    return {
      paymeTransactionId,
      paymeUrl: `https://checkout.test.paycom.uz/${this.paymeId}`,
      amount: amount,
    };
  }

  // Payme JSON-RPC methods
  async paymeCheckPerformTransaction(params: any) {
    const { amount, account } = params;
    const registrationId = account.registration_id;

    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { olympiad: true },
    });

    if (!registration) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    if (registration.status !== 'PENDING') {
      return { error: { code: -31050, message: 'Order not available for payment' } };
    }

    if (amount !== Number(registration.olympiad.price) * 100) { // Payme uses tiyin
      return { error: { code: -31001, message: 'Incorrect amount' } };
    }

    return { result: { allow: true } };
  }

  async paymePerformTransaction(params: any) {
    const { id, time, amount, account } = params;
    const registrationId = account.registration_id;

    const payment = await this.prisma.payment.findFirst({
      where: { registrationId, provider: PaymentProvider.PAYME },
      include: { registration: { include: { user: true, olympiad: true } } },
    });

    if (!payment) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { result: { create_time: payment.payedAt?.getTime() || time, transaction: id, state: 2 } };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          payedAt: new Date(time),
          transactionId: String(id),
        },
      });

      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'PAID', paidAt: new Date(time) },
      });

      await tx.attendance.create({
        data: { registrationId },
      });
    });

    return { result: { create_time: time, transaction: id, state: 2 } };
  }

  async paymeCheckTransaction(params: any) {
    const { id } = params;
    
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: String(id), provider: PaymentProvider.PAYME },
      include: { registration: true },
    });

    if (!payment) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    return {
      result: {
        create_time: payment.createdAt.getTime(),
        perform_time: payment.payedAt?.getTime() || 0,
        cancel_time: 0,
        transaction: id,
        state: payment.status === PaymentStatus.SUCCESS ? 2 : -1,
        reason: payment.status === PaymentStatus.FAILED ? 1 : null,
      },
    };
  }

  async paymeCancelTransaction(params: any) {
    const { id, reason } = params;

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: String(id), provider: PaymentProvider.PAYME },
    });

    if (!payment) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { error: { code: -31007, message: 'Transaction already completed' } };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.CANCELLED },
    });

    return { result: { state: -1, cancel_time: Date.now() } };
  }

  // ==================== COMMON METHODS ====================

  async getPaymentStatus(registrationId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { registrationId },
      include: { registration: { select: { status: true, olympiadId: true } } },
    });

    if (!payment) {
      return { status: 'NOT_FOUND' };
    }

    return {
      status: payment.status,
      provider: payment.provider,
      amount: payment.amount,
      transactionId: payment.transactionId,
      payedAt: payment.payedAt,
      registrationStatus: payment.registration?.status,
    };
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { registration: { userId } },
      include: {
        registration: {
          include: { olympiad: { select: { title: true, subject: true, examDate: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async refund(registrationId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { registrationId },
      include: { registration: true },
    });

    if (!payment || payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Faqat muvaffaqiyatli to\'langan arizalarni qaytarish mumkin');
    }

    // Process refund based on provider
    if (payment.provider === PaymentProvider.CLICK) {
      await this.clickRefund(payment);
    } else if (payment.provider === PaymentProvider.PAYME) {
      await this.paymeRefund(payment);
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, rawResponse: { refundReason: reason, refundedAt: new Date() } },
    });

    await this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  }

  private async clickRefund(payment: any) {
    // Implement Click refund API call
    this.logger.log(`Click refund initiated for ${payment.transactionId}`);
  }

  private async paymeRefund(payment: any) {
    // Implement Payme refund API call
    this.logger.log(`Payme refund initiated for ${payment.transactionId}`);
  }

  private async generateTicketAsync(registrationId: string) {
    // This will be implemented in FilesModule
    // Import dynamically to avoid circular dependency
    const { FilesService } = await import('../files/files.service');
    // FilesService is not available here directly, will be called from controller
  }
}