import { DurableObject } from 'cloudflare:workers';

class InvalidState extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'InvalidState';
	}
}

export default class Counter extends DurableObject {
	private isDestroyed = false;

	async increment() {
		if (this.isDestroyed) {
			throw new InvalidState('cannot increment counter as it is pending to be destroyed');
		}

		// ctx is defined by the super class
		let value: number = (await this.ctx.storage.get('value')) ?? 0;

		value++;
		await this.ctx.storage.put('value', value);

		return value;
	}

	/**
	 * Clears data stored in transactional storage, the object will be evicted when it is idle for a while
	 */
	async destroy() {
		await this.ctx.storage.delete('value');
		this.isDestroyed = true;
	}
}
