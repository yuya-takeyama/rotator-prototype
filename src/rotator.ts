export interface Member {
  id: string;
  count: number;
  lastAssigned: number;
  prevAssigned: number;
}

export interface State {
  members: Member[];
  currentMember: Member | undefined;
  prevMember: Member | undefined;
  skippedMemberIds: string[];
}

export const initialState = (): State => {
  return {
    members: [],
    currentMember: undefined,
    prevMember: undefined,
    skippedMemberIds: [],
  };
};

export const addMember = (state: State, memberId: string): State => {
  for (const member of state.members) {
    if (member.id === memberId) {
      throw new Error(`Duplicated member ID: ${memberId}`);
    }
  }

  const maxCount = getMaxCount(state.members);

  return {
    ...state,
    members: [
      ...state.members,
      {
        id: memberId,
        count: maxCount < 1 ? 0 : maxCount - 1,
        lastAssigned: 0,
        prevAssigned: 0,
      },
    ],
  };
};

export const assignNext = (state: State, now: Date): State => {
  const member = designateFromMembers(state.members);
  return {
    ...assign(state, member, now),
    skippedMemberIds: [],
  };
};

const designateFromMembers = (members: Member[]): Member => {
  const unassignedMembers = members.filter(
    (member) => member.lastAssigned === 0,
  );
  if (unassignedMembers.length > 0) {
    return unassignedMembers[0];
  }

  const minCount = getMinCount(members);
  const minCountMembers = members.filter((member) => member.count === minCount);
  if (minCountMembers.length > 0) {
    return minCountMembers.sort((a, b) => {
      if (a.lastAssigned < b.lastAssigned) {
        return -1;
      }
      if (a.lastAssigned > b.lastAssigned) {
        return 1;
      }

      return 0;
    })[0];
  }

  throw new Error('Not implemented');
};

const getMaxCount = (members: Member[]): number => {
  let max = -1;
  for (const member of members) {
    if (member.count > max) {
      max = member.count;
    }
  }

  return max;
};

const getMinCount = (members: Member[]): number => {
  let min = Infinity;
  for (const member of members) {
    if (member.count < min) {
      min = member.count;
    }
  }

  return min;
};

const assign = (state: State, target: Member, now: Date): State => {
  const increasedTarget = increment(target, now);
  const members = state.members.map((member) => {
    return {
      ...(member.id === target.id ? increasedTarget : member),
    };
  });

  return {
    ...state,
    members,
    currentMember: increasedTarget,
    prevMember: state.currentMember,
  };
};

const increment = (member: Member, now: Date): Member => {
  return {
    ...member,
    count: member.count + 1,
    lastAssigned: now.getTime(),
    prevAssigned: member.lastAssigned,
  };
};

export const skipAndAssignNext = (state: State, now: Date): State => {
  if (typeof state.currentMember === 'undefined') {
    throw new Error('not implemented');
  }
  if (state.skippedMemberIds.length >= state.members.length - 1) {
    throw new Error('No one is remaining to assign next');
  }
  let newState = { ...state };
  const current = state.currentMember;
  newState = {
    ...newState,
    members: revert(newState.members, current),
    skippedMemberIds: newState.skippedMemberIds.concat(current.id),
  };

  const membersExceptSkipped = newState.members.filter((member) => {
    for (const skippedId of newState.skippedMemberIds) {
      if (member.id === skippedId) {
        return false;
      }
    }

    return true;
  });
  const member = designateFromMembers(membersExceptSkipped);
  return assign(newState, member, now);
};

const revert = (members: Member[], revertedMember: Member): Member[] => {
  return members.map((member) => {
    if (member.id === revertedMember.id) {
      return {
        ...member,
        count: member.count - 1,
        lastAssigned: member.prevAssigned,
        prevAssigned: 0,
      };
    } else {
      return member;
    }
  });
};

export const revertAssignment = (state: State): State => {
  if (typeof state.currentMember === 'undefined') {
    throw new Error('There is no previous state to revert to');
  }
  if (typeof state.prevMember === 'undefined') {
    throw new Error('There is no previous state to revert to');
  }

  return {
    members: revert(state.members, state.currentMember),
    currentMember: state.prevMember,
    prevMember: undefined,
    skippedMemberIds: state.skippedMemberIds,
  };
};
