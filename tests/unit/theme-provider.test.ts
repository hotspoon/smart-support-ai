import { describe, expect, it } from "vitest"

import { shouldToggleTheme } from "../../components/theme-provider"

function event(overrides: Partial<KeyboardEvent> = {}) {
  return {
    defaultPrevented: false,
    repeat: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    key: "d",
    target: null,
    ...overrides,
  } as KeyboardEvent
}

describe("shouldToggleTheme", () => {
  it("does not throw or toggle when a keyboard event has no key", () => {
    expect(() => shouldToggleTheme(event({ key: undefined }))).not.toThrow()
    expect(shouldToggleTheme(event({ key: undefined }))).toBe(false)
  })

  it("only toggles for an unmodified D hotkey", () => {
    expect(shouldToggleTheme(event())).toBe(true)
    expect(shouldToggleTheme(event({ key: "D" }))).toBe(true)
    expect(shouldToggleTheme(event({ key: "x" }))).toBe(false)
    expect(shouldToggleTheme(event({ ctrlKey: true }))).toBe(false)
    expect(shouldToggleTheme(event({ repeat: true }))).toBe(false)
  })
})
