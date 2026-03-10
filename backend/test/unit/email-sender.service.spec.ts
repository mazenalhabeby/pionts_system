import { EmailSenderService } from '../../src/notifications/email-sender.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockSendMail = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });

describe('EmailSenderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('console-only fallback (no SMTP_HOST)', () => {
    it('should not create transporter when SMTP_HOST is not set', () => {
      const configService = { get: jest.fn().mockReturnValue(undefined) };
      new EmailSenderService(configService as any);
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should return true without sending when no transporter', async () => {
      const configService = { get: jest.fn().mockReturnValue(undefined) };
      const service = new EmailSenderService(configService as any);
      const result = await service.send('user@test.com', 'Subject', '<p>Hi</p>');
      expect(result).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('with SMTP configured', () => {
    let service: EmailSenderService;

    beforeEach(() => {
      const configMap: Record<string, string> = {
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user@example.com',
        SMTP_PASS: 'secret',
        SMTP_SECURE: 'false',
        FROM_EMAIL: 'Test <noreply@example.com>',
      };
      const configService = { get: jest.fn((key: string) => configMap[key]) };
      service = new EmailSenderService(configService as any);
    });

    it('should create transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'user@example.com', pass: 'secret' },
      });
    });

    it('should call sendMail with correct arguments', async () => {
      mockSendMail.mockResolvedValue({ messageId: '123' });
      const result = await service.send('to@test.com', 'Hello', '<p>Body</p>');
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'Test <noreply@example.com>',
        to: 'to@test.com',
        subject: 'Hello',
        html: '<p>Body</p>',
      });
    });

    it('should use fromName override when provided', async () => {
      mockSendMail.mockResolvedValue({ messageId: '456' });
      await service.send('to@test.com', 'Hi', '<p>Body</p>', 'MyApp');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'MyApp <noreply@pionts.com>' }),
      );
    });

    it('should return false on sendMail error', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));
      const result = await service.send('to@test.com', 'Fail', '<p>Err</p>');
      expect(result).toBe(false);
    });
  });

  describe('SMTP_SECURE auto-detection', () => {
    it('should set secure=true when port is 465', () => {
      const configMap: Record<string, string> = {
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_USER: 'u',
        SMTP_PASS: 'p',
      };
      const configService = { get: jest.fn((key: string) => configMap[key]) };
      new EmailSenderService(configService as any);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('should set secure=true when SMTP_SECURE is "true"', () => {
      const configMap: Record<string, string> = {
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'u',
        SMTP_PASS: 'p',
        SMTP_SECURE: 'true',
      };
      const configService = { get: jest.fn((key: string) => configMap[key]) };
      new EmailSenderService(configService as any);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });
  });
});
