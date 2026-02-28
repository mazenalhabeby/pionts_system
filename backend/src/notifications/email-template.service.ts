import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplateService {
  private baseLayout(brandName: string, primaryColor: string, content: string): string {
    return `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #050505; color: #f2f2f2; padding: 40px; border-radius: 12px;">
        <h1 style="color: ${primaryColor}; font-size: 22px; margin: 0 0 24px; text-transform: uppercase;">${brandName || 'Pionts'}</h1>
        ${content}
        <p style="margin: 24px 0 0; font-size: 12px; color: #666; border-top: 1px solid #333; padding-top: 16px;">
          Powered by <a href="https://pionts.com" style="color: ${primaryColor}; text-decoration: none;">Pionts</a>
        </p>
      </div>
    `;
  }

  welcome(customerName: string, brandName: string, primaryColor: string, signupPoints: number) {
    return {
      subject: `Welcome to ${brandName || 'our rewards program'}!`,
      html: this.baseLayout(brandName, primaryColor, `
        <p style="margin: 0 0 12px; font-size: 16px;">Hey ${customerName || 'there'}! 👋</p>
        <p style="margin: 0 0 12px; font-size: 15px;">
          You've been awarded <strong style="color: ${primaryColor};">${signupPoints} points</strong> just for signing up.
        </p>
        <p style="margin: 0; font-size: 15px;">
          Earn more points by making purchases, referring friends, and completing actions. Redeem your points for discounts!
        </p>
      `),
    };
  }

  pointsEarned(
    customerName: string,
    brandName: string,
    primaryColor: string,
    points: number,
    type: string,
    newBalance: number,
  ) {
    return {
      subject: `You earned ${points} points!`,
      html: this.baseLayout(brandName, primaryColor, `
        <p style="margin: 0 0 12px; font-size: 16px;">Hey ${customerName || 'there'}!</p>
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: 700; color: ${primaryColor};">+${points}</span>
          <div style="font-size: 13px; color: #999; margin-top: 4px;">points from ${type.replace(/_/g, ' ')}</div>
        </div>
        <p style="margin: 0; font-size: 15px;">
          Your new balance: <strong style="color: ${primaryColor};">${newBalance} points</strong>
        </p>
      `),
    };
  }

  referralNotification(
    referrerName: string,
    brandName: string,
    primaryColor: string,
    referredName: string,
    pointsEarned: number,
  ) {
    return {
      subject: `${referredName} used your referral!`,
      html: this.baseLayout(brandName, primaryColor, `
        <p style="margin: 0 0 12px; font-size: 16px;">Hey ${referrerName || 'there'}!</p>
        <p style="margin: 0 0 12px; font-size: 15px;">
          <strong>${referredName}</strong> just signed up using your referral link.
          You've earned <strong style="color: ${primaryColor};">${pointsEarned} points</strong>!
        </p>
        <p style="margin: 0; font-size: 15px;">Keep sharing your link to earn even more rewards.</p>
      `),
    };
  }

  orgInvitation(inviterName: string, orgName: string, role: string, acceptUrl: string) {
    const primaryColor = '#ff3c00';
    return {
      subject: `You've been invited to join ${orgName} on Pionts`,
      html: this.baseLayout('Pionts', primaryColor, `
        <p style="margin: 0 0 12px; font-size: 16px;">Hey there!</p>
        <p style="margin: 0 0 12px; font-size: 15px;">
          <strong>${inviterName}</strong> has invited you to join <strong style="color: ${primaryColor};">${orgName}</strong> as a <strong>${role}</strong>.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background: ${primaryColor}; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">Accept Invitation</a>
        </div>
        <p style="margin: 0; font-size: 13px; color: #999;">This invitation expires in 7 days.</p>
      `),
    };
  }

  projectInvitation(inviterName: string, orgName: string, projectName: string, role: string, acceptUrl: string) {
    const primaryColor = '#ff3c00';
    return {
      subject: `You've been invited to ${projectName} on Pionts`,
      html: this.baseLayout('Pionts', primaryColor, `
        <p style="margin: 0 0 12px; font-size: 16px;">Hey there!</p>
        <p style="margin: 0 0 12px; font-size: 15px;">
          <strong>${inviterName}</strong> has invited you to the project <strong style="color: ${primaryColor};">${projectName}</strong> (${orgName}) as a <strong>${role}</strong>.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background: ${primaryColor}; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">Accept Invitation</a>
        </div>
        <p style="margin: 0; font-size: 13px; color: #999;">This invitation expires in 7 days.</p>
      `),
    };
  }

  verificationCode(brandName: string, primaryColor: string, code: string) {
    return {
      subject: `Your ${brandName || 'Pionts'} verification code`,
      html: this.baseLayout(brandName, primaryColor, `
        <p style="margin: 0 0 8px; font-size: 16px;">Your verification code is:</p>
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: ${primaryColor};">${code}</span>
        </div>
        <p style="margin: 0; font-size: 14px; color: #999;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      `),
    };
  }
}
