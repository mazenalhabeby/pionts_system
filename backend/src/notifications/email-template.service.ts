import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplateService {
  private baseLayout(
    brandName: string,
    primaryColor: string,
    content: string,
    preheader = '',
  ): string {
    const brand = brandName || 'Pionts';
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${brand}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #111111; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #111111;">${preheader}${'&nbsp;&zwnj;'.repeat(30)}</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #111111;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; width: 100%;">

          <!-- Sender Identity -->
          <tr>
            <td align="center" style="padding: 0 0 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: ${primaryColor}; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; text-align: center;">
                      <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff;">${brand.charAt(0).toUpperCase()}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">${brand}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background: #1a1a1a; border-radius: 16px; border: 1px solid #2a2a2a; overflow: hidden;">
              <!-- Accent bar -->
              <div style="height: 4px; background: linear-gradient(90deg, ${primaryColor}, ${primaryColor}88);"></div>

              <!-- Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 36px 32px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #e0e0e0;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #555555; line-height: 1.5;">
                    <span style="color: #444444;">&#9679;</span>
                    <span style="padding: 0 4px;">Powered by</span>
                    <a href="https://pionts.com" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">Pionts</a>
                    <span style="padding: 0 4px;">&#9679;</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #444444;">
                    Loyalty &amp; Referral Rewards
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private button(label: string, url: string, primaryColor: string): string {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;" width="100%">
        <tr>
          <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" fillcolor="${primaryColor}">
            <center style="color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;">
              ${label}
            </center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${url}" style="display: inline-block; background: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.3px; mso-hide: all;">
              ${label}
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>`;
  }

  private highlightBox(content: string): string {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
        <tr>
          <td style="background: #0f0f0f; border: 1px solid #333333; border-radius: 12px; padding: 24px; text-align: center;">
            ${content}
          </td>
        </tr>
      </table>`;
  }

  private divider(): string {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
        <tr>
          <td style="border-top: 1px solid #2a2a2a; font-size: 1px; line-height: 1px;">&nbsp;</td>
        </tr>
      </table>`;
  }

  welcome(
    customerName: string,
    brandName: string,
    primaryColor: string,
    signupPoints: number,
  ) {
    const name = customerName || 'there';
    const brand = brandName || 'our rewards program';
    return {
      subject: `Welcome to ${brand}!`,
      html: this.baseLayout(
        brandName,
        primaryColor,
        `
        <p style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #ffffff;">
          Welcome, ${name}!
        </p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #999999;">
          You're now part of the ${brand} rewards program.
        </p>

        ${this.highlightBox(`
          <div style="font-size: 13px; color: #999999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Signup Bonus</div>
          <div style="font-size: 42px; font-weight: 800; color: ${primaryColor}; line-height: 1;">+${signupPoints}</div>
          <div style="font-size: 14px; color: #cccccc; margin-top: 6px;">points added to your account</div>
        `)}

        ${this.divider()}

        <p style="margin: 0 0 8px; font-size: 15px; color: #cccccc; font-weight: 600;">
          Here's how to earn more:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 4px 0 0;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #999999;">
              <span style="color: ${primaryColor}; margin-right: 8px;">&#10003;</span>
              Make purchases to earn points on every order
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #999999;">
              <span style="color: ${primaryColor}; margin-right: 8px;">&#10003;</span>
              Refer friends and earn rewards when they shop
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #999999;">
              <span style="color: ${primaryColor}; margin-right: 8px;">&#10003;</span>
              Redeem your points for exclusive discounts
            </td>
          </tr>
        </table>
      `,
        `Welcome! You earned ${signupPoints} points just for signing up.`,
      ),
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
    const name = customerName || 'there';
    const actionLabel = type.replace(/_/g, ' ');
    return {
      subject: `You earned ${points} points!`,
      html: this.baseLayout(
        brandName,
        primaryColor,
        `
        <p style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #ffffff;">
          Points earned!
        </p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #999999;">
          Hey ${name}, great news &mdash; you just earned more points.
        </p>

        ${this.highlightBox(`
          <div style="font-size: 42px; font-weight: 800; color: ${primaryColor}; line-height: 1;">+${points}</div>
          <div style="font-size: 13px; color: #999999; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px;">${actionLabel}</div>
        `)}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #0f0f0f; border-radius: 10px; margin: 0 0 4px;">
          <tr>
            <td style="padding: 16px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #777777; text-transform: uppercase; letter-spacing: 0.5px;">
                    Current Balance
                  </td>
                  <td align="right" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: ${primaryColor};">
                    ${newBalance}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
        `You earned ${points} points from ${actionLabel}. Balance: ${newBalance}`,
      ),
    };
  }

  referralNotification(
    referrerName: string,
    brandName: string,
    primaryColor: string,
    referredName: string,
    pointsEarned: number,
  ) {
    const name = referrerName || 'there';
    return {
      subject: `${referredName} used your referral!`,
      html: this.baseLayout(
        brandName,
        primaryColor,
        `
        <p style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #ffffff;">
          Referral reward!
        </p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #999999;">
          Hey ${name}, your network is growing.
        </p>

        ${this.highlightBox(`
          <div style="font-size: 14px; color: #999999; margin-bottom: 12px;">
            <strong style="color: #ffffff;">${referredName}</strong> joined using your link
          </div>
          <div style="width: 48px; height: 1px; background: #333333; margin: 0 auto 12px;"></div>
          <div style="font-size: 13px; color: #999999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">You earned</div>
          <div style="font-size: 42px; font-weight: 800; color: ${primaryColor}; line-height: 1;">+${pointsEarned}</div>
          <div style="font-size: 14px; color: #cccccc; margin-top: 6px;">points</div>
        `)}

        <p style="margin: 0; font-size: 15px; color: #999999; text-align: center;">
          Keep sharing your referral link to earn even more rewards.
        </p>
      `,
        `${referredName} used your referral link! You earned ${pointsEarned} points.`,
      ),
    };
  }

  orgInvitation(
    inviterName: string,
    orgName: string,
    role: string,
    acceptUrl: string,
  ) {
    const primaryColor = '#ff3c00';
    return {
      subject: `You've been invited to join ${orgName} on Pionts`,
      html: this.baseLayout(
        'Pionts',
        primaryColor,
        `
        <p style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #ffffff;">
          You're invited!
        </p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #999999;">
          <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join an organization on Pionts.
        </p>

        ${this.highlightBox(`
          <div style="font-size: 13px; color: #777777; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Organization</div>
          <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">${orgName}</div>
          <div style="font-size: 14px; color: ${primaryColor}; text-transform: capitalize;">${role}</div>
        `)}

        ${this.button('Accept Invitation', acceptUrl, primaryColor)}

        <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
          This invitation expires in 7 days.
        </p>
      `,
        `${inviterName} invited you to join ${orgName} on Pionts.`,
      ),
    };
  }

  projectInvitation(
    inviterName: string,
    orgName: string,
    projectName: string,
    role: string,
    acceptUrl: string,
  ) {
    const primaryColor = '#ff3c00';
    return {
      subject: `You've been invited to ${projectName} on Pionts`,
      html: this.baseLayout(
        'Pionts',
        primaryColor,
        `
        <p style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #ffffff;">
          You're invited!
        </p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #999999;">
          <strong style="color: #ffffff;">${inviterName}</strong> has invited you to a project on Pionts.
        </p>

        ${this.highlightBox(`
          <div style="font-size: 13px; color: #777777; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Project</div>
          <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">${projectName}</div>
          <div style="font-size: 13px; color: #999999; margin-bottom: 4px;">${orgName}</div>
          <div style="font-size: 14px; color: ${primaryColor}; text-transform: capitalize;">${role}</div>
        `)}

        ${this.button('Accept Invitation', acceptUrl, primaryColor)}

        <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
          This invitation expires in 7 days.
        </p>
      `,
        `${inviterName} invited you to ${projectName} on Pionts.`,
      ),
    };
  }

  verificationCode(brandName: string, primaryColor: string, code: string) {
    const brand = brandName || 'Pionts';
    return {
      subject: `Your ${brand} verification code`,
      html: this.baseLayout(
        brandName,
        primaryColor,
        `
        <p style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #ffffff;">
          Verification code
        </p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #999999;">
          Enter this code in the rewards widget to sign in to your account.
        </p>

        ${this.highlightBox(`
          <div style="font-size: 13px; color: #777777; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your Code</div>
          <div style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: ${primaryColor}; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;">${code}</div>
          <div style="font-size: 12px; color: #666666; margin-top: 10px;">&#9200; Expires in <strong style="color: #cccccc;">10 minutes</strong></div>
        `)}

        ${this.divider()}

        <p style="margin: 0 0 4px; font-size: 17px; font-weight: 700; color: #ffffff;">
          What happens next?
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #999999;">
          Once you're signed in, you'll have full access to your rewards dashboard. Here's what you can do:
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 10px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="36" valign="top" style="padding-right: 12px;">
                    <div style="width: 32px; height: 32px; background: ${primaryColor}22; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">&#11088;</div>
                  </td>
                  <td valign="top">
                    <div style="font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 2px;">Earn Points</div>
                    <div style="font-size: 13px; color: #888888; line-height: 1.4;">Get points for every purchase, writing reviews, following on social media, celebrating your birthday, and more.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="36" valign="top" style="padding-right: 12px;">
                    <div style="width: 32px; height: 32px; background: ${primaryColor}22; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">&#127873;</div>
                  </td>
                  <td valign="top">
                    <div style="font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 2px;">Redeem Rewards</div>
                    <div style="font-size: 13px; color: #888888; line-height: 1.4;">Exchange your points for discount codes you can apply at checkout. The more points you save, the bigger the discount.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="36" valign="top" style="padding-right: 12px;">
                    <div style="width: 32px; height: 32px; background: ${primaryColor}22; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">&#128101;</div>
                  </td>
                  <td valign="top">
                    <div style="font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 2px;">Refer Friends</div>
                    <div style="font-size: 13px; color: #888888; line-height: 1.4;">Share your unique referral link with friends. When they sign up and make a purchase, you both earn bonus points.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="36" valign="top" style="padding-right: 12px;">
                    <div style="width: 32px; height: 32px; background: ${primaryColor}22; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">&#128200;</div>
                  </td>
                  <td valign="top">
                    <div style="font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 2px;">Track Your Progress</div>
                    <div style="font-size: 13px; color: #888888; line-height: 1.4;">View your points balance, transaction history, and referral network all in one place.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${this.divider()}

        <p style="margin: 0; font-size: 13px; color: #555555; text-align: center;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      `,
        `Your verification code is ${code}. Expires in 10 minutes.`,
      ),
    };
  }
}
