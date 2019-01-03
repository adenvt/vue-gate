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

    if (prop === 'expose')
      throw new Error(`[Vue Gate] Cannot find action '${prop}' in '${proxy.type}'`)

    if (origin === undefined) {
      return (...args) => {
        const method = target.policies[proxy.type][prop]

        if (method !== undefined)
          return target.policy(proxy.type, prop, ...args)

        const alias = target.alias[prop]

        if (alias === undefined)
          throw new Error(`[Vue Gate] Cannot find action '${prop}' in '${target.type}'`)

        if (typeof alias === 'function')
          return alias.call(target, target.auth, ...args)

        const [type, action] = alias.split('->')

        return target.policy(type, action, ...args)
      }
    }

    return origin.bind(target)
  }
}

class Gate {
  constructor (options) {
    this.options  = options
    this.auth     = options.auth
    this.policies = options.policies
    this.alias    = options.alias || {}

    this.init()
  }

  set auth (auth) {
    this._auth = auth
  }

  get auth () {
    if (typeof this._auth === 'function')
      return this._auth()

    return this._auth
  }

  init () {
    for (const type in this.policies) {
      const expose = this.policies[type].expose

      if (expose !== undefined) {
        for (const action of expose) {
          Object.defineProperty(this.alias, action, {
            get: () => {
              return `${type}->${action}`
            },
          })
        }
      }
    }

    for (const name in this.alias) {
      const fn = this.alias[name]

      if (typeof fn === 'function')
        this[name] = (...args) => fn.call(this, this.auth, ...args)
    }
  }

  policy (type, action, ...params) {
    const rule = this.policies[type]

    if (rule === undefined)
      throw new Error(`[Vue Gate] Cannot find policy '${type}'`)

    if (action === 'expose')
      throw new Error(`[Vue Gate] Cannot find action '${action}' in '${type}'`)

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

  guard (to, ...params) {
    return to.matched.reduce((status, rute) => {
      if (rute.meta
        && rute.meta.gate
        && rute.meta.gate.type
        && rute.meta.gate.action
      ) {
        return status
          && this.policy(
            rute.meta.gate.type,
            rute.meta.gate.action,
            rute,
            to,
            ...params,
          )
      }

      return status && true
    }, true)
  }

  static install (Vue) {
    const isDef = (v) => v !== undefined

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

export default Gate
