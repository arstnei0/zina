import { batch, computed, effect, memo, signal, untrack } from "."

it("signal effect", () => {
	let run = 0
	const count = signal(0)
	effect(() => {
		count()
		run += 1
	})
	count(1)
	count(2)
	expect(run).toBe(3)
})

it("computed", () => {
	let run = 0
	const count = signal(0)
	const double = computed(() => count() * 2)
	effect(() => {
		double()
		run += 1
		if (run === 4) {
			expect(double()).toBe(2)
		}
	})
	count(0)
	count(0)
	count(1)
	expect(run).toBe(4)
})

it("memo", () => {
	let run = 0
	const count = signal(0)
	const double = memo(() => count() * 2)
	effect(() => {
		double()
		run += 1
		if (run === 4) {
			expect(double()).toBe(2)
		}
	})
	count(0)
	count(0)
	count(1)
	expect(run).toBe(2)
})

it("without batch", () => {
	let run = 0
	const a = signal(0)
	const b = signal(0)
	const c = memo(() => a() + b())
	effect(() => {
		c()
		run += 1
	})
	a(1)
	b(1)
	expect(run).toBe(3)
})

it("with batch", () => {
	let run = 0
	const a = signal(0)
	const b = signal(0)
	const c = memo(() => a() + b())
	effect(() => {
		c()
		run += 1
	})
	batch(() => {
		a(1)
		b(1)
	})
	expect(run).toBe(2)
})

it("untrack", () => {
	const count = signal(0)
	const double = computed(() => untrack(count) * 2)
	count(1)
	expect(double()).toBe(0)
})
