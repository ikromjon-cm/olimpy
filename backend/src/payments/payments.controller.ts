import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('click/prepare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Click to\'lov uchun tayyorlash' })
  @ApiResponse({ status: 200, description: 'Click to\'lov parametrlari' })
  async clickPrepare(@Body('registrationId') registrationId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.clickPrepare(registrationId);
  }

  @Public()
  @Post('click/prepare-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Click prepare webhook (Click dan keladi)' })
  @ApiResponse({ status: 200 })
  async clickPrepareWebhook(@Body() body: { merchant_trans_id: string; amount: number; sign_string: string }) {
    // Click prepare webhook - usually just returns success
    return { error: 0, error_note: 'Success' };
  }

  @Public()
  @Post('click/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Click complete webhook (Click dan keladi)' })
  @ApiResponse({ status: 200 })
  async clickComplete(@Body() body: {
    merchant_trans_id: string;
    click_trans_id: string;
    sign_string: string;
    action: number;
    error: number;
    error_note: string;
  }) {
    if (Number(body.error) !== 0) {
      console.error('Click payment error', { 
        merchant_trans_id: body.merchant_trans_id, 
        error: body.error, 
        error_note: body.error_note 
      });
      return { error: 0, error_note: 'Success' };
    }

    const result = await this.paymentsService.clickComplete(
      body.merchant_trans_id,
      body.click_trans_id,
      body.sign_string
    );

    return { error: result.success ? 0 : -1, error_note: result.error || 'Success' };
  }

  @Post('payme/create-receipt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payme to\'lov uchun receipt yaratish' })
  @ApiResponse({ status: 200, description: 'Payme transaction ID' })
  async paymeCreateReceipt(@Body('registrationId') registrationId: string) {
    return this.paymentsService.paymeCreateReceipt(registrationId);
  }

  @Public()
  @Post('payme')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payme webhook (Payme dan keladi)' })
  @ApiResponse({ status: 200 })
  async paymeWebhook(@Body() body: {
    id: number;
    method: string;
    params: any;
  }) {
    const { method, params } = body;

    switch (method) {
      case 'CheckPerformTransaction':
        return this.paymentsService.paymeCheckPerformTransaction(params);
      case 'CreateTransaction':
        return this.paymentsService.paymePerformTransaction(params);
      case 'PerformTransaction':
        return this.paymentsService.paymePerformTransaction(params);
      case 'CheckTransaction':
        return this.paymentsService.paymeCheckTransaction(params);
      case 'CancelTransaction':
        return this.paymentsService.paymeCancelTransaction(params);
      default:
        return { error: { code: -32601, message: 'Method not found' } };
    }
  }

  @Get('status/:registrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'To\'lov holatini tekshirish' })
  @ApiResponse({ status: 200 })
  async getPaymentStatus(@Param('registrationId') registrationId: string) {
    return this.paymentsService.getPaymentStatus(registrationId);
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening to\'lovlarim' })
  @ApiResponse({ status: 200 })
  async getMyPayments(@CurrentUser('id') userId: string) {
    return this.paymentsService.getUserPayments(userId);
  }

  @Post('refund/:registrationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'To\'lovni qaytarish (Admin)' })
  @ApiResponse({ status: 200 })
  async refund(@Param('registrationId') registrationId: string, @Body('reason') reason: string) {
    await this.paymentsService.refund(registrationId, reason);
    return { message: 'Refund jarayoni boshlandi' };
  }
}