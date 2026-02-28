import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SecretKeyGuard } from '../common/guards/secret-key.guard';
import { SecretKeyProject } from '../common/decorators/secret-key-project.decorator';
import { DiscountService } from './discount.service';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { MarkUsedDto } from './dto/mark-used.dto';

@Controller('api/v1/discount')
@UseGuards(SecretKeyGuard)
@Throttle({ default: { ttl: 60000, limit: 300 } })
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post('validate')
  async validate(
    @SecretKeyProject() project: { id: number },
    @Body() dto: ValidateDiscountDto,
  ) {
    return this.discountService.validate(project.id, dto.code);
  }

  @Post('mark-used')
  async markUsed(
    @SecretKeyProject() project: { id: number },
    @Body() dto: MarkUsedDto,
  ) {
    return this.discountService.markUsed(project.id, dto.code);
  }
}
