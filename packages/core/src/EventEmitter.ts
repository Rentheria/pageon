export type Listener<T> = (payload: T) => void;

export class EventEmitter<EventMap extends Record<string, unknown>> {
  private listeners = new Map<keyof EventMap, Set<Listener<unknown>>>();

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    const eventListeners = this.listeners.get(event) ?? new Set<Listener<unknown>>();
    eventListeners.add(listener as Listener<unknown>);
    this.listeners.set(event, eventListeners);

    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    eventListeners.delete(listener as Listener<unknown>);
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    for (const listener of eventListeners) {
      (listener as Listener<EventMap[K]>)(payload);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
