import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailSenderService } from '../notifications/email-sender.service';
import { EmailTemplateService } from '../notifications/email-template.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailSender: EmailSenderService,
    private readonly emailTemplate: EmailTemplateService,
    private readonly configService: ConfigService,
  ) {}

  async create(orgId: number, invitedById: number, email: string, role: string, projectId?: number) {
    // Validate role based on scope
    if (projectId) {
      if (!['admin', 'editor', 'viewer'].includes(role)) {
        throw new BadRequestException('Project invitation role must be admin, editor, or viewer');
      }
      // Verify project belongs to org
      const project = await this.prisma.project.findFirst({ where: { id: projectId, orgId } });
      if (!project) throw new NotFoundException('Project not found in this organization');
    } else {
      if (!['owner', 'member'].includes(role)) {
        throw new BadRequestException('Org invitation role must be owner or member');
      }
    }

    // Check if user already in org via OrgMembership
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingOrgMembership = await this.prisma.orgMembership.findUnique({
        where: { userId_orgId: { userId: existingUser.id, orgId } },
      });

      if (existingOrgMembership) {
        // User is already in this org — handle project-level invite
        if (projectId) {
          const existingMember = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: existingUser.id } },
          });
          if (existingMember) throw new ConflictException('User is already a member of this project');
        } else {
          throw new ConflictException('User is already a member of this organization');
        }
      }
      // User exists in a different org — that's fine now with multi-org!
    }

    // Check for pending invitation with same email+org (or email+project)
    const pendingWhere: any = { email, orgId, status: 'pending' };
    if (projectId) pendingWhere.projectId = projectId;
    const pendingInvite = await this.prisma.invitation.findFirst({ where: pendingWhere });
    if (pendingInvite) throw new ConflictException('A pending invitation already exists for this email');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.invitation.create({
      data: { orgId, projectId: projectId || null, email, role, token, invitedById, expiresAt },
      include: { org: true, project: true, invitedBy: { select: { name: true, email: true } } },
    });

    await this.sendInvitationEmail(invitation);

    return {
      ...invitation,
      isExistingUser: !!existingUser,
    };
  }

  async accept(token: string, password?: string, name?: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { org: true, project: true },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'pending') throw new BadRequestException(`Invitation has been ${invitation.status}`);
    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } });
      throw new BadRequestException('Invitation has expired');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: invitation.email } });

    if (existingUser) {
      // Existing user — ensure they have org membership
      const existingOrgMembership = await this.prisma.orgMembership.findUnique({
        where: { userId_orgId: { userId: existingUser.id, orgId: invitation.orgId } },
      });

      if (!existingOrgMembership) {
        // Cross-org invite: create OrgMembership for the new org
        const orgRole = invitation.projectId ? 'member' : invitation.role;
        await this.prisma.orgMembership.create({
          data: { userId: existingUser.id, orgId: invitation.orgId, role: orgRole },
        });
      }

      // If project-level invite, add project membership
      if (invitation.projectId) {
        await this.prisma.projectMember.create({
          data: { projectId: invitation.projectId, userId: existingUser.id, role: invitation.role },
        });
      }
    } else {
      // New user — require password and name
      if (!password) throw new BadRequestException('Password is required for new users');
      if (!name) throw new BadRequestException('Name is required for new users');

      const passwordHash = await bcrypt.hash(password, 10);
      const orgRole = invitation.projectId ? 'member' : invitation.role;

      const newUser = await this.prisma.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          name,
        },
      });

      // Create OrgMembership
      await this.prisma.orgMembership.create({
        data: { userId: newUser.id, orgId: invitation.orgId, role: orgRole },
      });

      if (invitation.projectId) {
        await this.prisma.projectMember.create({
          data: { projectId: invitation.projectId, userId: newUser.id, role: invitation.role },
        });
      }
    }

    await this.prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'accepted' } });

    return { success: true };
  }

  async getByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { org: { select: { name: true } }, project: { select: { name: true } } },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');

    // Auto-expire if past date
    if (invitation.status === 'pending' && invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } });
      invitation.status = 'expired';
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: invitation.email } });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      orgName: invitation.org.name,
      projectName: invitation.project?.name || null,
      expiresAt: invitation.expiresAt,
      isExistingUser: !!existingUser,
    };
  }

  async listPending(orgId: number) {
    const invitations = await this.prisma.invitation.findMany({
      where: { orgId, status: 'pending', expiresAt: { gt: new Date() } },
      include: {
        project: { select: { name: true } },
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check which emails are already registered
    const emails = invitations.map((i) => i.email);
    const existingUsers = await this.prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      projectId: inv.projectId,
      projectName: inv.project?.name || null,
      invitedBy: inv.invitedBy.name || inv.invitedBy.email,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      isExistingUser: existingEmails.has(inv.email),
    }));
  }

  async findPendingInOrg(orgId: number, id: number) {
    return this.prisma.invitation.findFirst({
      where: { id, orgId, status: 'pending' },
      select: { id: true, projectId: true },
    });
  }

  async revoke(orgId: number, id: number) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, orgId, status: 'pending' },
    });
    if (!invitation) throw new NotFoundException('Pending invitation not found');

    await this.prisma.invitation.update({ where: { id }, data: { status: 'revoked' } });
    return { success: true };
  }

  async resend(orgId: number, id: number) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, orgId, status: 'pending' },
      include: { org: true, project: true, invitedBy: { select: { name: true, email: true } } },
    });
    if (!invitation) throw new NotFoundException('Pending invitation not found');

    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.invitation.update({ where: { id }, data: { expiresAt: newExpiry } });

    await this.sendInvitationEmail({ ...invitation, expiresAt: newExpiry });

    return { success: true, expiresAt: newExpiry };
  }

  private async sendInvitationEmail(invitation: any) {
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:5173';
    const acceptUrl = `${appUrl}/accept-invite/${invitation.token}`;
    const inviterName = invitation.invitedBy?.name || invitation.invitedBy?.email || 'A team member';

    let template: { subject: string; html: string };
    if (invitation.projectId && invitation.project) {
      template = this.emailTemplate.projectInvitation(
        inviterName,
        invitation.org.name,
        invitation.project.name,
        invitation.role,
        acceptUrl,
      );
    } else {
      template = this.emailTemplate.orgInvitation(
        inviterName,
        invitation.org.name,
        invitation.role,
        acceptUrl,
      );
    }

    await this.emailSender.send(invitation.email, template.subject, template.html);
  }
}
