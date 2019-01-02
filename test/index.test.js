/* eslint-env node, jest */

const Gate = require('../dist/vue-gate.common')

const auth = {
  id    : 1,
  name  : 'Ade Novid',
  role  : 'admin',
  active: true,
}

const posts = [
  {
    id    : 1,
    title : 'Lorem ipsum dolor sit amet.',
    userId: 1,
  },
  {
    id    : 2,
    title : 'Lorem ipsum dolor sit amet.',
    userId: 2,
  },
]

const GlobalPolicy = {
  isAdmin (auth) {
    return auth.role === 'admin'
  },
  isActive (auth) {
    return auth.active === true
  },
  isActiveAdmin () {
    return this.isAdmin() && this.isActive()
  },
  isCanChain () {
    return this.isActiveAdmin()
  },
  expose: ['isActive', 'isCanChain'],
}

const PostPolicy = {
  view (auth, rute) {
    return this.isAdmin() && rute.name === 'settings'
  },
  update (auth, post) {
    return auth.id === post.userId
  },
  remove (auth, post) {
    return this.update(post)
  },
  ruleA (auth) {
    return auth.id === 1
  },
  ruleB () {
    return this.ruleA() && true
  },
  ruleC () {
    return this.ruleA() && this.policy('global', 'isActiveAdmin')
  },
  ruleD () {
    return this.isAdmin()
  },
  ruleE () {
    return this.callMe()
  },
  ruleF () {
    return this.isActive()
  },
  ruleG () {
    return this.isAdmin() && this.isCanChain()
  },
}

// Dummy route
const route = {
  matched: [
    {
      path    : 'settings',
      name    : 'settings',
      redirect: '/settings/theme',
      meta    : {
        gate: {
          type  : 'post',
          action: 'view',
        },
      },
    },
    {
      path: 'theme',
      name: 'settings-theme',
    },
    {
      path: 'update',
      name: 'settings-update',
    },
    {
      path: 'info',
      name: 'settings-info',
    },
  ],
}

const gate = new Gate({
  auth    : auth,
  policies: {
    post  : PostPolicy,
    global: GlobalPolicy,
  },
  alias: {
    isAdmin: 'global->isActiveAdmin',
    callMe (auth) {
      return auth.id === 1 && this.policy('global', 'isAdmin')
    },
  },
})

describe('Aggregate function', () => {
  test('can() / allow() should true when conditions meet', () => {
    expect(gate.can('update', 'post', posts[0])).toBe(true)
    expect(gate.allow('update', 'post', posts[0])).toBe(true)
  })

  test('can() / allow() should false when conditions not meet', () => {
    expect(gate.can('update', 'post', posts[1])).toBe(false)
    expect(gate.allow('update', 'post', posts[1])).toBe(false)
  })

  test('cannot() / deny() should false when conditions meet', () => {
    expect(gate.cannot('update', 'post', posts[0])).toBe(false)
    expect(gate.deny('update', 'post', posts[0])).toBe(false)
  })

  test('cannot() / deny() should true when conditions not meet', () => {
    expect(gate.cannot('update', 'post', posts[1])).toBe(true)
    expect(gate.deny('update', 'post', posts[1])).toBe(true)
  })
})

describe('Call another action', () => {
  test('call another action in same policy', () => {
    expect(gate.policy('post', 'remove', posts[0])).toBe(true)
    expect(gate.policy('post', 'ruleB')).toBe(true)
  })

  test('call another action in different policy', () => {
    expect(gate.policy('post', 'ruleC')).toBe(true)
  })
})

describe('Alias action', () => {
  test('call alias action', () => {
    expect(gate.policy('post', 'ruleD')).toBe(true)
  })

  test('call alias action (closure)', () => {
    expect(gate.policy('post', 'ruleE')).toBe(true)
  })

  test('call expose action', () => {
    expect(gate.policy('post', 'ruleF')).toBe(true)
    expect(gate.policy('post', 'ruleG')).toBe(true)
  })
})

describe('Error handling', () => {
  test('call not exist policy & action', () => {
    expect(() => gate.policy('noExist', 'noExistRule')).toThrow(`[Vue Gate] Cannot find policy 'noExist'`)
    expect(() => gate.policy('post', 'noExistRule')).toThrow(`[Vue Gate] Cannot find action 'noExistRule' in 'post'`)
  })

  test("call action 'expose'", () => {
    expect(() => gate.policy('post', 'expose')).toThrow(`[Vue Gate] Cannot find action 'expose' in 'post'`)
  })
})

describe('Vue router handling', () => {
  test('route guard', () => {
    expect(gate.guard(route)).toBe(true)
  })
})
