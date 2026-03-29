import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Star,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';

function activityLabel(lastDate) {
  if (!lastDate) return 'Never active';
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastDate === today) return 'Active today';
  if (lastDate === yesterday) return 'Active yesterday';
  return `Last active ${lastDate}`;
}

export default function ProfileConnections({ userId, theme }) {
  const accent = theme?.accent || '#2DD4BF';

  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [removing, setRemoving] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [inviteSelections, setInviteSelections] = useState({});
  const [invitingGroupId, setInvitingGroupId] = useState(null);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [groupError, setGroupError] = useState('');
  const [groupSuccess, setGroupSuccess] = useState('');

  const friendsMap = useMemo(
    () => Object.fromEntries(friends.map((friend) => [friend.user_id, friend])),
    [friends]
  );

  const loadFriends = async () => {
    if (!userId || userId === 'frontend-user') {
      setFriends([]);
      setFriendsLoading(false);
      return;
    }

    setFriendsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/social/friends/${userId}`);
      const data = await response.json();
      setFriends(data.friends ?? []);
    } catch {
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const loadGroups = async () => {
    if (!userId || userId === 'frontend-user') {
      setGroups([]);
      setGroupsLoading(false);
      return;
    }

    setGroupsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/social/groups/overview/${userId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to load groups');
      }
      setGroups(data.groups ?? []);
      setGroupError('');
      setOpenGroupId((current) => current ?? data.groups?.[0]?.group_id ?? null);
    } catch {
      setGroups([]);
      setGroupError('Could not load groups right now.');
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
    loadGroups();
  }, [userId]);

  useEffect(() => {
    if (!query.trim() || !userId || userId === 'frontend-user') {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/social/search?q=${encodeURIComponent(query)}&user_id=${userId}`
        );
        const data = await response.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query, userId]);

  const handleAddFriend = async (friend) => {
    try {
      await fetch('http://localhost:8000/api/social/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, friend_id: friend.user_id }),
      });
      setAddedIds((current) => new Set([...current, friend.user_id]));
      setResults((current) => current.filter((user) => user.user_id !== friend.user_id));
      await Promise.all([loadFriends(), loadGroups()]);
    } catch {}
  };

  const handleRemoveFriend = async (friendId) => {
    setRemoving(friendId);
    try {
      await fetch(
        `http://localhost:8000/api/social/friends/remove?user_id=${userId}&friend_id=${friendId}`,
        { method: 'DELETE' }
      );
      await loadFriends();
    } catch {
    } finally {
      setRemoving(null);
    }
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) return;

    setCreatingGroup(true);
    setGroupError('');
    setGroupSuccess('');
    try {
      const response = await fetch('http://localhost:8000/api/social/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: userId, name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create group');
      }

      setGroupName('');
      setGroupSuccess(
        data.already_exists
          ? `"${name}" already exists. Opened your existing group.`
          : `Created "${name}". You are the owner.`
      );
      await loadGroups();
      setOpenGroupId(data.group?.group_id ?? null);
    } catch (error) {
      setGroupError(error.message || 'Failed to create group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleInviteFriend = async (groupId) => {
    const friendId = inviteSelections[groupId];
    if (!friendId) return;

    setInvitingGroupId(groupId);
    setGroupError('');
    setGroupSuccess('');
    try {
      const response = await fetch('http://localhost:8000/api/social/groups/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, inviter_id: userId, friend_id: friendId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send invite');
      }

      setInviteSelections((current) => ({ ...current, [groupId]: '' }));
      setGroupSuccess('Invite sent.');
      await loadGroups();
    } catch (error) {
      setGroupError(error.message || 'Failed to send invite.');
    } finally {
      setInvitingGroupId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} style={{ color: accent }} />
          <h2 className="font-semibold text-dark">Friends</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          This is tied to your signed-in account. Add friends here and they follow your Auth0 login identity.
        </p>

        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-3">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search users by name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1 text-sm focus:outline-none text-dark placeholder-gray-400"
          />
          {searching && <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />}
        </div>

        {query.trim() && results.length > 0 && (
          <div className="space-y-2 mb-4">
            {results.map((user) => (
              <div key={user.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <img
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-9 h-9 rounded-full bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{user.name}</p>
                </div>
                {addedIds.has(user.user_id) ? (
                  <span className="text-xs font-medium text-green-600">Added</span>
                ) : (
                  <button
                    onClick={() => handleAddFriend(user)}
                    className="text-xs px-3 py-1.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: accent }}
                  >
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {query.trim() && !searching && results.length === 0 && (
          <p className="text-xs text-gray-400 mb-4">No users found for "{query}".</p>
        )}

        {friendsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="animate-spin text-gray-300" />
          </div>
        ) : friends.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-4 py-5 text-center">
            <p className="text-sm text-gray-500">No friends added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div key={friend.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <img
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.name}`}
                  alt={friend.name}
                  className="w-10 h-10 rounded-full bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-dark truncate">{friend.name}</p>
                    <span className="text-xs text-gray-400">Lv {friend.level}</span>
                    <span className="text-xs text-gray-400">{friend.xp.toLocaleString()} XP</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{activityLabel(friend.last_activity_date)}</p>
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend.user_id)}
                  disabled={removing === friend.user_id}
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Remove friend"
                >
                  {removing === friend.user_id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserMinus size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus size={16} style={{ color: accent }} />
          <h2 className="font-semibold text-dark">Groups</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Create a group, then invite people from your friend list. Invited users can accept after they log in.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Group name"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={handleCreateGroup}
            disabled={creatingGroup || !groupName.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            {creatingGroup ? 'Creating...' : 'Create Group'}
          </button>
        </div>

        {groupError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
            {groupError}
          </div>
        )}

        {groupSuccess && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-100 px-3 py-2 text-sm text-green-700">
            {groupSuccess}
          </div>
        )}

        {groupsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="animate-spin text-gray-300" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-4 py-5 text-center">
            <p className="text-sm text-gray-500">No groups yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const isOpen = openGroupId === group.group_id;
              const isOwner = group.is_owner || group.owner_id === userId;
              const inviteableFriends = friends.filter(
                (friend) =>
                  !group.member_ids.includes(friend.user_id) &&
                  !group.pending_invite_ids.includes(friend.user_id)
              );

              return (
                <div key={group.group_id} className="border border-gray-100 rounded-2xl p-4">
                  <button
                    onClick={() => setOpenGroupId(isOpen ? null : group.group_id)}
                    className="w-full flex items-center justify-between gap-3 mb-3 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-dark">{group.name}</h3>
                        {isOwner && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                            <Star size={12} className="fill-current" />
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {group.member_count} members • Created by {group.owner_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ backgroundColor: `${accent}20`, color: accent }}
                      >
                        {group.pending_invite_ids.length} pending
                      </span>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <>
                      {isOwner ? (
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                          <select
                            value={inviteSelections[group.group_id] ?? ''}
                            onChange={(event) =>
                              setInviteSelections((current) => ({
                                ...current,
                                [group.group_id]: event.target.value,
                              }))
                            }
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                          >
                            <option value="">Invite a friend</option>
                            {inviteableFriends.map((friend) => (
                              <option key={friend.user_id} value={friend.user_id}>
                                {friend.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleInviteFriend(group.group_id)}
                            disabled={invitingGroupId === group.group_id || !inviteSelections[group.group_id]}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                            style={{ backgroundColor: accent }}
                          >
                            {invitingGroupId === group.group_id ? 'Inviting...' : 'Send Invite'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mb-3">
                          Only the group owner can send invites.
                        </p>
                      )}

                      {isOwner && inviteableFriends.length === 0 && (
                        <p className="text-xs text-gray-400 mb-3">
                          Everyone in your friend list is already in this group or already invited.
                        </p>
                      )}

                      <div className="space-y-2">
                        {group.members.map((member, index) => (
                          <div key={member.user_id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
                            <div className="w-6 text-xs font-bold text-gray-400">#{index + 1}</div>
                            <img
                              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                              alt={member.name}
                              className="w-8 h-8 rounded-full bg-gray-100"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-dark truncate">
                                  {member.name}
                                  {member.user_id === userId ? ' (You)' : ''}
                                </p>
                                {member.user_id === group.owner_id && (
                                  <Star size={12} className="text-amber-500 fill-current shrink-0" />
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-dark">{member.xp.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">Lv {member.level}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {group.pending_invite_ids.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.pending_invite_ids.map((inviteeId) => (
                            <span
                              key={inviteeId}
                              className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700"
                            >
                              Pending: {friendsMap[inviteeId]?.name ?? 'Friend'}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
