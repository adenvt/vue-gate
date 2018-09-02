class GateProxy {
  constructor (gate, type) {
    this.target  = gate
    this.type    = type
    this.handler = { get: this.proxyGet }
    this.proxy   = new Proxy(this, this.handler)
  }

  proxyGet (proxy, prop, receiver) {
    const target = proxy.target
    const origin = Reflect.get(target, prop, receiver)

    if (origin === undefined) {
      return (...args) => {
        const method = target.policies[proxy.type][prop]

        if (method !== undefined)
          return target.policy(proxy.type, prop, ...args)

        const alias = target.alias[prop]

        if (alias === undefined)
          throw new Error(`[Vue Gate] Cannot find action '${prop}' in '${target.type}'`)

        const [type, action] = alias.split('->')

        return target.policy(type, action, ...args)
      }
    }

    return origin.bind(target)
  }
}

export default class Gate {
  constructor (options) {
    this.auth     = options.auth
    this.policies = options.policies
    this.alias    = options.alias || {}
  }

  policy (type, action, ...params) {
    const rule = this.policies[type]

    if (rule === undefined)
      throw new Error(`[Vue Gate] Cannot find policy '${type}'`)

    const method = rule[action]
    if (method === undefined)
      throw new Error(`[Vue Gate] Cannot find action '${action}' in '${type}'`)

    const vm = new GateProxy(this, type)

    return method.call(vm.proxy, this.auth, ...params)
  }

  allow (action, type, ...params) {
    return this.policy(type, action, ...params)
  }

  deny (action, type, ...params) {
    return !this.policy(type, action, ...params)
  }

  can (action, type, ...params) {
    return this.policy(type, action, ...params)
  }

  cannot (action, type, ...params) {
    return !this.policy(type, action, ...params)
  }

  static install (Vue) {
    const isDef = v => v !== undefined

    Vue.mixin({
      beforeCreate () {
        if (isDef(this.$options.gate)) {
          this._gateRoot = this
          this._gate     = this.$options.gate
        } else
          this._gateRoot = (this.$parent && this.$parent._gateRoot) || this
      },
    })

    Object.defineProperty(Vue.prototype, '$gate', {
      get () {
        return this._gateRoot._gate
      },
    })

    Object.defineProperty(Vue.prototype, '$can', {
      get () {
        return this.$gate.allow.bind(this.$gate)
      },
    })

    Object.defineProperty(Vue.prototype, '$cannot', {
      get () {
        return this.$gate.deny.bind(this.$gate)
      },
    })
  }
}
