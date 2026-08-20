const queues = new Map<string, Promise<unknown>>();

export async function serialize<T>(
	key: string,
	fn: () => Promise<T>,
): Promise<T> {
	const previous = queues.get(key) ?? Promise.resolve();
	const run = previous.then(fn, fn);

	const cleanup = run.then(
		() => undefined,
		() => undefined,
	);
	queues.set(key, cleanup);
	cleanup.finally(() => {
		if (queues.get(key) === cleanup) {
			queues.delete(key);
		}
	});

	return run;
}
