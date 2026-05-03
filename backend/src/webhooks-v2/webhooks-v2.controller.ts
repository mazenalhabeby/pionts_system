import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';
import { Project } from '@prisma/client';
import { ApiKeyV2Guard } from '../api-v2/guards/api-key-v2.guard';
import { V2Project } from '../api-v2/decorators/v2-project.decorator';
import { WebhooksV2Service } from './webhooks-v2.service';

class RegisterEndpointDto {
  @IsString() @IsNotEmpty() url: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) events: string[];
}

@Controller('api/v2/webhooks')
@UseGuards(ApiKeyV2Guard)
@SkipThrottle()
export class WebhooksV2Controller {
  constructor(private readonly webhooksV2Service: WebhooksV2Service) {}

  @Post()
  async register(@V2Project() project: Project, @Body() dto: RegisterEndpointDto) {
    return this.webhooksV2Service.registerEndpoint(project.id, dto.url, dto.events);
  }

  @Get()
  async list(@V2Project() project: Project) {
    return this.webhooksV2Service.listEndpoints(project.id);
  }

  @Delete(':id')
  async remove(@V2Project() project: Project, @Param('id') id: string) {
    await this.webhooksV2Service.deleteEndpoint(project.id, Number(id));
    return { success: true };
  }

  @Get(':id/logs')
  async logs(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.webhooksV2Service.getDeliveryLogs(Number(id), limit ? Number(limit) : 50);
  }

  @Post(':id/test')
  async test(@V2Project() project: Project, @Param('id') id: string) {
    return this.webhooksV2Service.sendTestEvent(project.id, Number(id));
  }
}
