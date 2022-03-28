import { HeadersList, HeadersObject } from './glossary'
import { normalizeHeaderName } from './utils/normalizeHeaderName'
import { normalizeHeaderValue } from './utils/normalizeHeaderValue'

export default class HeadersPolyfill {
  // Normalized header {"name":"a, b"} storage.
  private headers: Record<string, string> = {}

  // Keeps the mapping between the raw header name
  // and the normalized header name to ease the lookup.
  private names: Map<string, string> = new Map()

  constructor(init?: HeadersInit | HeadersObject | HeadersList) {
    /**
     * @note Cannot check if the `init` is an instance of the `Headers`
     * because that class is only defined in the browser.
     */
    if (
      ['Headers', 'HeadersPolyfill'].includes(init?.constructor.name) ||
      init instanceof HeadersPolyfill
    ) {
      const initialHeaders = init as Headers
      initialHeaders.forEach((value, name) => {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(init)) {
      init.forEach(([name, value]) => {
        this.append(name, Array.isArray(value) ? value.join(', ') : value)
      })
    } else if (init) {
      Object.getOwnPropertyNames(init).forEach((name) => {
        const value = init[name]
        this.append(name, Array.isArray(value) ? value.join(', ') : value)
      })
    }
  }

  [Symbol.iterator]() {
    return this.entries()
  }

  *keys(): IterableIterator<string> {
    for (const name of Object.keys(this.headers)) {
      yield name
    }
  }

  *values(): IterableIterator<string> {
    for (const value of Object.values(this.headers)) {
      yield value
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const name of Object.keys(this.headers)) {
      yield [name, this.get(name)]
    }
  }

  /**
   * Returns a `ByteString` sequence of all the values of a header with a given name.
   */
  get(name: string): string | null {
    return this.headers[normalizeHeaderName(name)] || null
  }

  /**
   * Sets a new value for an existing header inside a `Headers` object, or adds the header if it does not already exist.
   */
  set(name: string, value: string): void {
    const normalizedName = normalizeHeaderName(name)
    this.headers[normalizedName] = normalizeHeaderValue(value)
    this.names.set(normalizedName, name)
  }

  /**
   * Appends a new value onto an existing header inside a `Headers` object, or adds the header if it does not already exist.
   */
  append(name: string, value: string): void {
    const normalizedName = normalizeHeaderName(name)
    let resolvedValue = this.has(normalizedName)
      ? `${this.get(normalizedName)}, ${value}`
      : value

    this.set(name, resolvedValue)
  }

  /**
   * Deletes a header from the `Headers` object.
   */
  delete(name: string): void {
    if (!this.has(name)) {
      return
    }

    const normalizedName = normalizeHeaderName(name)
    delete this.headers[normalizedName]
    this.names.delete(normalizedName)
  }

  /**
   * Returns the object of all the normalized headers.
   */
  all(): Record<string, string> {
    return this.headers
  }

  /**
   * Returns the object of all the raw headers.
   */
  raw(): Record<string, string> {
    const rawHeaders: Record<string, string> = {}

    for (const [name, value] of this.entries()) {
      rawHeaders[this.names.get(name)] = value
    }

    return rawHeaders
  }

  /**
   * Returns a boolean stating whether a `Headers` object contains a certain header.
   */
  has(name: string): boolean {
    return this.headers.hasOwnProperty(normalizeHeaderName(name))
  }

  /**
   * Traverses the `Headers` object,
   * calling the given callback for each header.
   */
  forEach<ThisArg = this>(
    callback: (
      this: ThisArg,
      value: string,
      name: string,
      parent: this
    ) => void,
    thisArg?: ThisArg
  ) {
    for (const name in this.headers) {
      if (this.headers.hasOwnProperty(name)) {
        callback.call(thisArg, this.headers[name], name, this)
      }
    }
  }
}
