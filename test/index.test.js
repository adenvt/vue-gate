/* eslint-env node, jest */

const Gate = require('../dist/vue-gate')

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
}

const PostPolicy = {
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
}

const gate = new Gate({
  auth    : auth,
  policies: {
    post  : PostPolicy,
    global: GlobalPolicy,
  },
  alias: { isAdmin: 'global->isActiveAdmin' },
})

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

test('call another function in same policy', () => {
  expect(gate.policy('post', 'remove', posts[0])).toBe(true)
  expect(gate.policy('post', 'ruleB')).toBe(true)
})

test('call another function in different policy', () => {
  expect(gate.policy('post', 'ruleC')).toBe(true)
})

test('call alias function', () => {
  expect(gate.policy('post', 'ruleD')).toBe(true)
})

test('call not exist policy / rule should thrown error', () => {
  expect(() => gate.policy('noExist', 'noExistRule')).toThrow(`[Vue Gate] Cannot find policy 'noExist'`)
  expect(() => gate.policy('post', 'noExistRule')).toThrow(`[Vue Gate] Cannot find action 'noExistRule' in 'post'`)
})
