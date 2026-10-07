import { Module } from '@nestjs/common';
import { LeadsAdminController, LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TurnstileService } from './turnstile.service';

@Module({
  controllers: [LeadsController, LeadsAdminController],
  providers: [LeadsService, TurnstileService],
})
export class LeadsModule {}
