import React from 'react';
import './App.css';

import {
  initialState,
  addMember,
  State as RotatorState,
  assignNext,
  skipAndAssignNext,
  revertAssignment,
  Member,
} from './rotator';

interface AppState {
  newMemberId: string;
  rotator: RotatorState;
  error: string | undefined;
}

const isSkipped = (state: RotatorState, member: Member) => {
  for (const skippedMemberId of state.skippedMemberIds) {
    if (member.id === skippedMemberId) {
      return true;
    }
  }

  return false;
};

class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);

    const localStorageState = localStorage.getItem('rotatorState');
    if (typeof localStorageState === 'string') {
      this.state = JSON.parse(localStorageState);
    } else {
      this.state = {
        newMemberId: '',
        // @ts-ignore
        rotator: initialState(),
        error: undefined,
      };
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Rotator Prototype</h1>
          <form onSubmit={this.handleAdd.bind(this)}>
            <div>
              New Member:
              <input
                type="text"
                value={this.state.newMemberId}
                onChange={this.handleChangeNewMemberName.bind(this)}
              />
              <input type="submit" value="Add" />
            </div>
            <div>
              <input
                type="button"
                value="Assign Next"
                onClick={this.handleAssignNext.bind(this)}
              />
              <input
                type="button"
                value="Skip And Assign Next"
                onClick={this.handleSkipAndAssignNext.bind(this)}
              />
              <input
                type="button"
                value="Revert Assignment"
                onClick={this.handleRevertAssignment.bind(this)}
              />
              <input
                type="button"
                value="Save"
                onClick={this.handleSave.bind(this)}
              />
              <input
                type="button"
                value="Clear"
                onClick={this.handleClear.bind(this)}
              />
            </div>
            <div>Last Error: {this.state.error}</div>
            <div style={{ float: 'left' }}>
              <table>
                <thead>
                  <tr>
                    <td>ID</td>
                    <td>Count</td>
                    <td>Last Assigned</td>
                  </tr>
                </thead>
                <tbody>
                  {this.state.rotator.members.map((member, i) => (
                    <tr
                      className={
                        this.state.rotator &&
                        this.state.rotator.currentMember &&
                        (this.state.rotator.currentMember.id === member.id
                          ? 'current'
                          : isSkipped(this.state.rotator, member)
                          ? 'skipped'
                          : '')
                      }
                      key={i}
                    >
                      <td>{member.id}</td>
                      <td>{member.count}</td>
                      <td>
                        {member.lastAssigned === 0
                          ? '-'
                          : new Date(member.lastAssigned).toISOString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ float: 'left' }}>
              <pre className="react-state">
                <code>{JSON.stringify(this.state, null, 2)}</code>
              </pre>
            </div>
          </form>
        </header>
      </div>
    );
  }

  handleChangeNewMemberName(event: React.FormEvent<HTMLInputElement>) {
    // @ts-ignore
    this.setState({ newMemberId: event.target.value });
  }

  handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (this.state.newMemberId !== '') {
        this.setState({
          newMemberId: '',
          rotator: addMember(this.state.rotator, this.state.newMemberId),
        });
      }
    } catch (err) {
      this.setState({ error: err.message });
    }
  }

  handleAssignNext(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault();
    try {
      this.setState({
        rotator: assignNext(this.state.rotator, new Date()),
      });
    } catch (err) {
      this.setState({ error: err.message });
    }
  }

  handleSkipAndAssignNext(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault();
    try {
      this.setState({
        rotator: skipAndAssignNext(this.state.rotator, new Date()),
      });
    } catch (err) {
      this.setState({ error: err.message });
    }
  }

  handleRevertAssignment(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault();
    try {
      this.setState({
        rotator: revertAssignment(this.state.rotator),
      });
    } catch (err) {
      this.setState({ error: err.message });
    }
  }

  handleSave(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault();
    localStorage.setItem('rotatorState', JSON.stringify(this.state));
  }

  handleClear(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault();
    this.setState({ rotator: initialState() });
  }
}

export default App;
