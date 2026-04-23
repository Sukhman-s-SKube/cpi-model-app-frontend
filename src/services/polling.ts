export interface PollingOptions<T> {
  intervalMs?: number;
  shouldStop: (value: T) => boolean;
  onTick: (value: T) => void;
  signal?: AbortSignal;
}

export async function poll<T>(
  fetcher: () => Promise<T>,
  options: PollingOptions<T>,
): Promise<T> {
  const intervalMs = options.intervalMs ?? 2000;

  while (true) {
    if (options.signal?.aborted) {
      throw new DOMException('Polling aborted', 'AbortError');
    }

    const value = await fetcher();
    options.onTick(value);

    if (options.shouldStop(value)) {
      return value;
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
      options.signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Polling aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  }
}
