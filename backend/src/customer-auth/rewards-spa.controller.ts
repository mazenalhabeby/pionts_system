import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';

@Controller('rewards')
export class RewardsSpaController {
  @Get('*path')
  serveRewards(@Req() req: Request, @Res() res: Response) {
    const relative = req.path.replace(/^\/rewards\//, '');
    if (relative.startsWith('assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(path.join(__dirname, '..', '..', '..', 'client-ui', 'dist', relative));
      return;
    }
    res.sendFile(path.join(__dirname, '..', '..', '..', 'client-ui', 'dist', 'index.html'));
  }
}
