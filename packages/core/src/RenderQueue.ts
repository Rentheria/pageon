export type RenderPriority = 1 | 2 | 3 | 4;

interface QueueTask<T> {
  id: string;
  priority: RenderPriority;
  execute: () => Promise<T>;
  cancelled: boolean;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export class RenderQueue {
  private queue: Array<QueueTask<unknown>> = [];
  private active = false;
  private activeTaskId: string | null = null;
  private scheduled = false;

  get activeRenders(): number {
    return this.active ? 1 : 0;
  }

  enqueue<T>(id: string, priority: RenderPriority, execute: () => Promise<T>): Promise<T> {
    this.cancel(id);
    return new Promise<T>((resolve, reject) => {
      const task: QueueTask<T> = { id, priority, execute, cancelled: false, resolve, reject };
      this.queue.push(task as QueueTask<unknown>);
      this.queue.sort((a, b) => a.priority - b.priority);
      if (!this.scheduled) {
        this.scheduled = true;
        queueMicrotask(() => {
          this.scheduled = false;
          void this.run();
        });
      }
    });
  }

  cancel(id?: string): void {
    if (!id) {
      this.queue.forEach((task) => {
        task.cancelled = true;
        task.reject(new Error('RENDER_CANCELLED'));
      });
      this.queue = [];
      return;
    }

    this.queue = this.queue.filter((task) => {
      if (task.id !== id) return true;
      task.cancelled = true;
      task.reject(new Error('RENDER_CANCELLED'));
      return false;
    });
  }

  private async run(): Promise<void> {
    if (this.active) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    this.active = true;
    this.activeTaskId = next.id;

    try {
      if (next.cancelled) {
        return;
      }
      const value = await next.execute();
      if (!next.cancelled) {
        next.resolve(value);
      }
    } catch (error) {
      if (!next.cancelled) {
        next.reject(error);
      }
    } finally {
      this.active = false;
      this.activeTaskId = null;
      if (this.queue.length > 0) {
        void this.run();
      }
    }
  }
}
