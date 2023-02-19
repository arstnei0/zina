export type effectFn = (
	changed?: [oldValue: unknown, newValue: unknown],
) => void
export type effect_ = {
	deps: Set<signal_>
	fn: effectFn
}
export type effect = [disable: () => void, enable: () => void]

export type getter<value = unknown> = () => value
export type setter<value = unknown> = (newValue: value) => value
export type signal_<value = unknown> = { value: value; effects: Set<effect_> }
export type signal<value = unknown> = getter<value> & setter<value>

let currentEffect: effect_ | null = null
let batching = false
const batched = new Set<effect_>()

function _getter<value = unknown>(this: signal_<value>): value {
	if (currentEffect) {
		currentEffect.deps.add(this)
		this.effects.add(currentEffect)
	}
	return this.value
}

const effectIt = <value>(
	effect: effect_,
	changed?: [oldValue: value, newValue: value],
) => {
	effect.fn(changed)
}

function _setter<value = unknown>(
	this: signal_<value>,
	newValue: value,
): value {
	const oldValue = this.value
	this.value = newValue
	if (batching) {
		this.effects.forEach((effect) => batched.add(effect))
	} else {
		this.effects.forEach((effect) => effectIt(effect, [oldValue, newValue]))
	}
	return oldValue
}

export const signal = <value>(initial: value): signal<value> => {
	const signal_: signal_<value> = { value: initial, effects: new Set() }
	return ((newValue?: value) => {
		if (newValue === undefined) {
			return _getter.call(signal_)
		} else {
			return _setter.call(signal_, newValue)
		}
	}) as signal<value>
}

export const effect = (fn: effectFn): effect => {
	const effect_ = {
		deps: new Set(),
		fn: (changed) => {
			currentEffect = effect_
			fn(changed)
			currentEffect = null
		},
	} as effect_
	effect_.fn()
	return [
		() => {
			effect_.deps.forEach((dep) => {
				dep.effects.delete(effect_)
			})
		},
		() => {
			effect_.deps.forEach((dep) => {
				dep.effects.add(effect_)
			})
		},
	]
}

export type computedFn<value> = () => value
export type computed<value> = getter<value>
export const computed = <value>(fn: computedFn<value>): computed<value> => {
	const computed = signal<value>(null as unknown as value)
	effect(() => {
		computed(fn())
	})
	return computed
}

export type memoFn<value> = () => value
export type memo<value> = getter<value>
export const memo = <value>(fn: memoFn<value>): memo<value> => {
	const computed = signal<value>(null as unknown as value)
	effect((changed) => {
		if (changed) {
			const [oldValue, newValue] = changed
			if (oldValue !== newValue) computed(fn())
		} else computed(fn())
	})
	return computed
}

export const batch = (fn: () => void) => {
	batching = true
	fn()
	batched.forEach((effect_) => effectIt(effect_))
	batched.clear()
	batching = false
}

export const untrack = <value>(fn: getter<value>): value => {
	const currentEffect$ = currentEffect
	currentEffect = null
	const value = fn()
	currentEffect = currentEffect$
	return value
}
