import { useEffect, useState } from 'react';
import { Check, Loader2, Star, Users, X } from 'lucide-react';

export default function GroupLeaderboardPanel({ userId, theme, refreshKey }) {
  const accent = theme?.accent || '#2DD4BF';
  const [groups, setGroups] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingGroupId, setRespondingGroupId] = useState(null);

  const loadData = async () => {
    if (!userId || userId === 'frontend-user') {
      setGroups([]);
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [groupsResponse, invitesResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/social/groups/overview/${userId}`),
        fetch(`http://localhost:8000/api/social/groups/invites/${userId}`),
      ]);
      const [groupsData, invitesData] = await Promise.all([
        groupsResponse.json(),
        invitesResponse.json(),
      ]);
      setGroups(groupsData.groups ?? []);
      setInvites(invitesData.invites ?? []);
    } catch {
      setGroups([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, refreshKey]);

  const handleInviteResponse = async (groupId, accept) => {
    setRespondingGroupId(groupId);
    try {
      await fetch('http://localhost:8000/api/social/groups/invites/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, user_id: userId, accept }),
      });
      await loadData();
    } catch {
    } finally {
      setRespondingGroupId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Users size={16} style={{ color: accent }} />
        <h2 className="font-semibold text-dark">Group Leaderboards</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Your groups and pending invites appear here on the main page.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="space-y-4">
          {invites.length > 0 && (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.group_id} className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <p className="text-sm font-semibold text-dark">{invite.name}</p>
                  <p className="text-xs text-amber-800 mt-1">
                    {invite.owner_name} invited you to join. {invite.member_count} members currently in the group.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleInviteResponse(invite.group_id, true)}
                      disabled={respondingGroupId === invite.group_id}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                      style={{ backgroundColor: accent }}
                    >
                      <Check size={13} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleInviteResponse(invite.group_id, false)}
                      disabled={respondingGroupId === invite.group_id}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 disabled:opacity-40"
                    >
                      <X size={13} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {groups.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-4 py-5 text-center">
              <p className="text-sm text-gray-500">You are not in any groups yet.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.group_id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-dark">{group.name}</h3>
                    <p className="text-xs text-gray-400">
                      {group.member_count} members • Created by {group.owner_name}
                    </p>
                    {group.is_owner && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                        <Star size={12} className="fill-current" />
                        Owner
                      </div>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${accent}20`, color: accent }}
                  >
                    {group.pending_invite_ids.length} pending
                  </span>
                </div>

                <div className="space-y-2">
                  {group.members.slice(0, 5).map((member, index) => (
                    <div key={member.user_id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                      <div className="w-6 text-xs font-bold text-gray-400">#{index + 1}</div>
                      <img
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-8 h-8 rounded-full bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">
                          {member.name}
                          {member.user_id === userId ? ' (You)' : ''}
                        </p>
                        {member.user_id === group.owner_id && (
                          <Star size={12} className="text-amber-500 fill-current" />
                        )}
                        <p className="text-xs text-gray-400">{member.streak} day streak</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-dark">{member.xp.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Lv {member.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
