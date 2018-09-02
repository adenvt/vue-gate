# vue-gate
> Simple Vue authorization plugin

[![npm version](https://badge.fury.io/js/vue-gate.svg)](https://badge.fury.io/js/vue-gate)

## Getting Started

```bash
npm install vue-gate --save
```
in `main.js`

```js
import Vue from 'vue'
import VueGate from 'vue-gate'

Vue.use(VueGate)

// Define your credibility
const auth = {
  id    : 1,
  name  : 'Lorem Ipsum',
  role  : 'admin',
  active: true,
}

// Write policy
const PostPolicy = {
  edit (auth, post) {
    return auth.id === post.user_id
  }

  remove (auth, post) {
    return this.edit(post)
      && auth.role === 'admin'
  }
}

// Registering auth and policies
const gate = new VueGate({
  auth: auth,
  policies: {
    post: PostPolicy,
  }
})

// Registering gate to Vue
new Vue({
  el: '#app',
  gate: gate,
})
```

In template

```html
<ul>
  <li v-for="post in posts">
    {{ post.title }}
    <a href="#" v-if="$can('edit', 'post', post)">
      Edit
    </a>
  </li>
</ul>
```

## Licence
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
