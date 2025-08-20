class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, payload: any) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(payload));
    }
  }
}

export const achievementEmitter = new EventEmitter();
