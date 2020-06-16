import {
  initialState,
  addMember,
  assignNext,
  Member,
  skipAndAssignNext,
  revertAssignment,
} from './rotator';

const nextMilliSecond = (date: Date): Date => {
  return new Date(date.getTime() + 1);
};

interface IdCountPair {
  id: string;
  count: number;
}
const getIdCountPairs = (members: Member[]): IdCountPair[] => {
  return members.map((member) => {
    return { id: member.id, count: member.count };
  });
};

describe('rotator', () => {
  describe('#initialState', () => {
    it('returns initial state', () => {
      expect(initialState()).toEqual({
        members: [],
        currentMemberId: undefined,
        skippedMemberIds: [],
      });
    });
  });

  describe('#addMember', () => {
    it('adds a member', () => {
      const state = initialState();
      expect(addMember(state, 'foo').members).toEqual([
        {
          id: 'foo',
          count: 0,
          lastAssigned: 0,
          prevAssigned: 0,
        },
      ]);
    });

    it('adds multiple members', () => {
      let state = initialState();
      state = addMember(state, 'foo');
      state = addMember(state, 'bar');
      state = addMember(state, 'baz');
      expect(state.members).toEqual([
        {
          id: 'foo',
          count: 0,
          lastAssigned: 0,
          prevAssigned: 0,
        },
        {
          id: 'bar',
          count: 0,
          lastAssigned: 0,
          prevAssigned: 0,
        },
        {
          id: 'baz',
          count: 0,
          lastAssigned: 0,
          prevAssigned: 0,
        },
      ]);
    });

    it('adds new member with count is max - 1', () => {
      let state = initialState();
      state = addMember(state, 'foo');
      state = addMember(state, 'bar');
      state = addMember(state, 'baz');
      let now = new Date();

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      now = nextMilliSecond(now);
      state = assignNext(state, now);

      state = addMember(state, 'hoge');

      expect(getIdCountPairs(state.members)).toEqual([
        { id: 'foo', count: 2 },
        { id: 'bar', count: 2 },
        { id: 'baz', count: 2 },
        { id: 'hoge', count: 1 },
      ]);
    });

    it('raises error when the member ID is duplicated', () => {
      let state = initialState();
      state = addMember(state, 'foo');
      expect(() => {
        addMember(state, 'foo');
      }).toThrowError('Duplicated member ID: foo');
    });
  });

  describe('#assignNext', () => {
    it('assigns in regular rotation', () => {
      let state = initialState();
      state = addMember(state, 'foo');
      state = addMember(state, 'bar');
      state = addMember(state, 'baz');
      let now = new Date();

      // First round
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('foo');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('baz');
      expect(state.currentMember.count).toEqual(1);

      // Second round
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('foo');
      expect(state.currentMember.count).toEqual(2);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(2);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('baz');
      expect(state.currentMember.count).toEqual(2);

      expect(getIdCountPairs(state.members)).toEqual([
        { id: 'foo', count: 2 },
        { id: 'bar', count: 2 },
        { id: 'baz', count: 2 },
      ]);
    });
  });

  describe('#skipAndAssignNext', () => {
    it('assigns in regular rotation', () => {
      let state = initialState();
      state = addMember(state, 'foo');
      state = addMember(state, 'bar');
      state = addMember(state, 'baz');
      let now = new Date();

      // First round
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('foo');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = skipAndAssignNext(state, now);
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      // foo is assigned again
      expect(state.currentMember.id).toEqual('foo');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('baz');
      expect(state.currentMember.count).toEqual(1);

      // Second round
      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(2);

      now = nextMilliSecond(now);
      state = skipAndAssignNext(state, now);
      expect(state.currentMember.id).toEqual('foo');
      expect(state.currentMember.count).toEqual(2);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      // bar is assigned again
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(2);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('baz');
      expect(state.currentMember.count).toEqual(2);

      expect(getIdCountPairs(state.members)).toEqual([
        { id: 'foo', count: 2 },
        { id: 'bar', count: 2 },
        { id: 'baz', count: 2 },
      ]);
    });
  });

  describe('#revertAssignment', () => {
    it('reverts to the previous assignment', () => {
      let state = initialState();
      state = addMember(state, 'foo');
      state = addMember(state, 'bar');
      state = addMember(state, 'baz');
      let now = new Date();

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('foo');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = revertAssignment(state);
      expect(state.currentMember.id).toEqual('foo');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('baz');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = revertAssignment(state);
      expect(state.currentMember.id).toEqual('bar');
      expect(state.currentMember.count).toEqual(1);

      now = nextMilliSecond(now);
      state = assignNext(state, now);
      expect(state.currentMember.id).toEqual('baz');
      expect(state.currentMember.count).toEqual(1);

      expect(getIdCountPairs(state.members)).toEqual([
        { id: 'foo', count: 1 },
        { id: 'bar', count: 1 },
        { id: 'baz', count: 1 },
      ]);
    });

    it('raises error when no one have assigned ever', () => {
      let state = initialState();
      state = addMember(state, 'foo');
      state = addMember(state, 'bar');
      state = addMember(state, 'baz');
      let now = new Date();

      expect(() => {
        revertAssignment(state);
      }).toThrow('There is no previous state to revert to');
    });
  });
});
