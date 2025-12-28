// ============================================================================
// State Machine Builder - Create interactive Lottie animations
// ============================================================================

import type {
  StateMachine,
  State,
  Transition,
  Trigger,
  Condition,
  Action,
  EasingType,
} from '../types';
import { generateId } from '../utils';

export class StateMachineBuilder {
  private stateMachine: StateMachine;
  private stateBuilders: Map<string, StateBuilder> = new Map();

  constructor(name = 'StateMachine') {
    this.stateMachine = {
      id: generateId('sm'),
      name,
      states: [],
      transitions: [],
      initialState: '',
    };
  }

  // --------------------------------------------------------------------------
  // States
  // --------------------------------------------------------------------------

  addState(id: string, configure?: (builder: StateBuilder) => void): this {
    const builder = new StateBuilder(id);
    if (configure) {
      configure(builder);
    }
    this.stateBuilders.set(id, builder);

    if (!this.stateMachine.initialState) {
      this.stateMachine.initialState = id;
    }

    return this;
  }

  setInitialState(stateId: string): this {
    this.stateMachine.initialState = stateId;
    return this;
  }

  // --------------------------------------------------------------------------
  // Transitions
  // --------------------------------------------------------------------------

  addTransition(options: {
    from: string;
    to: string;
    trigger: Trigger;
    conditions?: Condition[];
    duration?: number;
    easing?: EasingType;
  }): this {
    const transition: Transition = {
      id: generateId('tr'),
      from: options.from,
      to: options.to,
      trigger: options.trigger,
      conditions: options.conditions,
      duration: options.duration,
      easing: options.easing,
    };
    this.stateMachine.transitions.push(transition);
    return this;
  }

  onComplete(from: string, to: string, options?: { duration?: number; easing?: EasingType }): this {
    return this.addTransition({
      from,
      to,
      trigger: { type: 'complete' },
      ...options,
    });
  }

  onClick(
    from: string,
    to: string,
    options?: { target?: string; duration?: number; easing?: EasingType }
  ): this {
    return this.addTransition({
      from,
      to,
      trigger: { type: 'click', target: options?.target },
      duration: options?.duration,
      easing: options?.easing,
    });
  }

  onHover(
    from: string,
    to: string,
    options?: { target?: string; duration?: number; easing?: EasingType }
  ): this {
    return this.addTransition({
      from,
      to,
      trigger: { type: 'hover', target: options?.target },
      duration: options?.duration,
      easing: options?.easing,
    });
  }

  onScroll(
    from: string,
    to: string,
    options?: { threshold?: number; duration?: number; easing?: EasingType }
  ): this {
    return this.addTransition({
      from,
      to,
      trigger: { type: 'scroll', value: options?.threshold },
      duration: options?.duration,
      easing: options?.easing,
    });
  }

  onTimeout(
    from: string,
    to: string,
    timeout: number,
    options?: { duration?: number; easing?: EasingType }
  ): this {
    return this.addTransition({
      from,
      to,
      trigger: { type: 'timeout', value: timeout },
      duration: options?.duration,
      easing: options?.easing,
    });
  }

  onCustom(
    from: string,
    to: string,
    eventName: string,
    options?: { conditions?: Condition[]; duration?: number; easing?: EasingType }
  ): this {
    return this.addTransition({
      from,
      to,
      trigger: { type: 'custom', value: eventName },
      conditions: options?.conditions,
      duration: options?.duration,
      easing: options?.easing,
    });
  }

  // --------------------------------------------------------------------------
  // Conditional Transitions
  // --------------------------------------------------------------------------

  when(variable: string, operator: Condition['operator'], value: string | number | boolean): Condition {
    return { variable, operator, value };
  }

  // --------------------------------------------------------------------------
  // Build
  // --------------------------------------------------------------------------

  build(): StateMachine {
    this.stateMachine.states = Array.from(this.stateBuilders.values()).map((b) =>
      b.build()
    );
    return this.stateMachine;
  }

  toJSON(): string {
    return JSON.stringify(this.build());
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(name?: string): StateMachineBuilder {
    return new StateMachineBuilder(name);
  }
}

// ============================================================================
// State Builder
// ============================================================================

export class StateBuilder {
  private state: State;

  constructor(id: string) {
    this.state = {
      id,
      name: id,
    };
  }

  setName(name: string): this {
    this.state.name = name;
    return this;
  }

  playSegment(startFrame: number, endFrame: number): this {
    this.state.animation = {
      ...this.state.animation,
      segment: [startFrame, endFrame],
    };
    return this;
  }

  setLoop(loop: boolean): this {
    this.state.animation = {
      ...this.state.animation,
      loop,
    };
    return this;
  }

  setSpeed(speed: number): this {
    this.state.animation = {
      ...this.state.animation,
      speed,
    };
    return this;
  }

  onEnter(action: Action): this {
    this.state.onEnter = this.state.onEnter ?? [];
    this.state.onEnter.push(action);
    return this;
  }

  onExit(action: Action): this {
    this.state.onExit = this.state.onExit ?? [];
    this.state.onExit.push(action);
    return this;
  }

  setVariable(name: string, value: unknown): this {
    return this.onEnter({
      type: 'setVariable',
      params: { name, value },
    });
  }

  playSound(soundId: string): this {
    return this.onEnter({
      type: 'playSound',
      params: { soundId },
    });
  }

  emit(eventName: string, data?: unknown): this {
    return this.onEnter({
      type: 'emit',
      params: { event: eventName, data },
    });
  }

  goToUrl(url: string, newTab = false): this {
    return this.onEnter({
      type: 'goToUrl',
      params: { url, newTab },
    });
  }

  build(): State {
    return this.state;
  }
}
