import { useCallback } from 'react';
import { orgApi } from '../../api';
import { useFetch, SettingsIcon } from '@pionts/shared';
import OrgDetailsForm from './OrgDetailsForm';
import MemberList from './MemberList';

interface Member {
  id: number | string;
  name?: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function OrgSettings() {
  // Org details
  const { data: orgData, refresh: refreshOrg } = useFetch(
    useCallback(() => orgApi.getOrg(), []),
  );

  // Members
  const { data: members, refresh: refreshMembers } = useFetch(
    useCallback(() => orgApi.getMembers(), []),
  );

  const memberList: Member[] = members || [];

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-bg-surface border border-border-default rounded-2xl px-8 py-7 flex items-center gap-4.5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white bg-[#6366f1]">
          <SettingsIcon size={24} />
        </div>
        <div>
          <div className="text-[22px] font-extrabold text-text-primary leading-tight max-sm:text-lg">Organization</div>
          <div className="text-[13px] text-text-muted mt-0.5">Manage your team and organization</div>
        </div>
      </div>

      {orgData && (
        <OrgDetailsForm initialName={orgData.name || ''} onSaved={refreshOrg} />
      )}

      <MemberList members={memberList} onRefresh={refreshMembers} />
    </div>
  );
}
