/** application main module */

/* global m */

'use strict'

// markup helpers
const a = m.bind(m, 'a')
const br = m.bind(m, 'br')
const button = m.bind(m, 'button')
const div = m.bind(m, 'div')
const form = m.bind(m, 'form')
const input = m.bind(m, 'input')
const label = m.bind(m, 'label')
const li = m.bind(m, 'li')
const span = m.bind(m, 'soan')
const ul = m.bind(m, 'ul')

// permissions list
let perms = []

// permission matcher
const isPermitted = name => Boolean(~perms.indexOf(name))

// main menu item selected class helper
const selectedCls = path => m.route.get() === `/${path}` ? 'pure-menu-selected' : ''

// error helper
const throwError = message => { throw Error(message) }

// logout handler
const doLogout = event => {
  event.preventDefault()
  m.request('/logout').then(initialize)
}

// application layout component
const Layout = {
  view: vnode =>
    div({ id: 'layout' },
      // main menu
      div({ id: 'menu' },
        div({ class: 'pure-menu' },
          ul({ class: 'pure-menu-list' }, [
            isPermitted('overview') &&
              li({ class: `pure-menu-item ${selectedCls('overview')}` },
                a({ class: 'pure-menu-link', href: '#!/overview' }, 'Overview')
              ),
            isPermitted('signup') &&
              li({ class: `pure-menu-item ${selectedCls('signup')}` },
                a({ class: 'pure-menu-link', href: '#!/signup' }, 'Sign up')
              ),
            isPermitted('signin') &&
              li({ class: `pure-menu-item ${selectedCls('signin')}` },
                a({ class: 'pure-menu-link', href: '#!/signin' }, 'Sign in')
              ),
            isPermitted('reviewTodo') &&
              li({ class: `pure-menu-item ${selectedCls('todo')}` },
                a({ class: 'pure-menu-link', href: '#!/todo' }, 'TODO')
              ),
            isPermitted('logout') &&
              li({ class: `pure-menu-item ${selectedCls('logout')}` },
                a({ class: 'pure-menu-link', href: '#!/logout', onclick: doLogout }, 'Logout')
              )
          ])
        )
      ),
      // views mount point
      div({ id: 'main' }, vnode.children)
    )
}

// common view header
const Header = {
  view: vnode =>
    div({ class: 'header', style: 'margin-bottom: 2rem' },
      m('h1', vnode.attrs.h1),
      m('h2', vnode.attrs.h2)
    )
}

// route not found view
const NotFoundView = {
  view: _ =>
    m(Header, {
      h1: 'Ooops!',
      h2: 'Requested route does not exist'
    })
}

// overview route view
const Overview = {
  view: _ => m.trust(`
    <div class="header">
      <h1>Hello and welcome!</h1>
      <h2>Nice to meet you</h2>
    </div>
    <div class="content">
      <h2 class="content-subhead">Introduction</h2>
      <p>
        This minimalistic Koa2 based TODO application represents base usage principles of <code>koa2-rbac-router</code>.
        Server-side code provides REST API endpoints with role-based access control (RBAC). Frontend
        part adjusts its view based on dynamicaly changed list of permissions respectively (usage example).
        <br>
        <br>
        Please visit <a href="https://github.com/IDyukov/koa2-rbac-router">GitHub repository</a>
        for detailed <code>koa2-rbac-router</code> API reference.
      </p>
      <h2 class="content-subhead">Case of use</h2>
      <p>
        To embrace application goals go through following steps:
        <ul>
          <li>
            From left-side menu goto <b>Sign up</b> view and complete registration.
          </li>
          <li>
            Goto <b>Sign in</b> view and login with credentials provided on previous step.
          </li>
        </ul>
        Once steps above completed you should get into <b>TODO</b> view. Also, notice changes in main menu.
        <br>
        <br>
        <i>
          NOTE: In sake of simplicity, signing credentials persistence is not implemented and
          all registration details get lost on backend service restart.
        </i>
      </p>
    </div>
  `)
}

// signup handler
function doSignupRequest (event) {
  event.stopPropagation()
  event.preventDefault()
  const username = document.getElementById('username').value || throwError('Username is mandatory')
  const password = document.getElementById('password').value || throwError('Password is mandatory')
  m.request({
    method: 'POST',
    url: '/signup',
    body: {
      username,
      password
    }
  }).then(result => {
    window.alert('Registration completed')
  }).catch(e => {
    window.alert('Registration failed')
  })
}

// sign up route view
const SignupView = {
  view: _ =>
    div({ id: 'signup' },
      m(Header, {
        h1: 'Sign up',
        h2: 'Please specify registration details'
      }),
      div({ style: { margin: '0 auto', width: '444px' } },
        form({ class: 'pure-form pure-form-stacked' },
          br(),
          input({ class: 'pure-u-1', id: 'username', type: 'text', placeholder: 'Username' }),
          br(),
          input({ class: 'pure-u-1', id: 'password', type: 'password', placeholder: 'Password' }),
          br(),
          button({ class: 'pure-button pure-button-primary pure-u-1', onclick: doSignupRequest }, 'SIGN UP')
    ) ) ) // eslint-disable-line
}

// signin handler
function doSigninRequest (event) {
  event.stopPropagation()
  event.preventDefault()
  const username = document.getElementById('username').value || throwError('Username is mandatory')
  const password = document.getElementById('password').value || throwError('Password is mandatory')
  m.request({
    method: 'POST',
    url: '/signin',
    body: {
      username,
      password
    }
  }).then(initialize)
    .catch(e => {
      window.alert('Authentication failed')
    })
}

// sign in route view
const SigninView = {
  view: _ =>
    div({ id: 'signin' },
      m(Header, {
        h1: 'Sign in',
        h2: 'Please enter login credentials'
      }),
      div({ style: { margin: '0 auto', width: '444px' } },
        form({ class: 'pure-form pure-form-stacked' },
          br(),
          input({ class: 'pure-u-1', id: 'username', type: 'text', placeholder: 'Username' }),
          br(),
          input({ class: 'pure-u-1', id: 'password', type: 'password', placeholder: 'Password' }),
          br(),
          button({ class: 'pure-button pure-button-primary pure-u-1', onclick: doSigninRequest }, 'SIGN IN')
    ) ) ) // eslint-disable-line
}

// application data (state)
const Data = {
  todos: {
    list: [],
    fetch: () => m.request('/todos').then(items => { Data.todos.list = items })
  }
}

// create new item
function doCreateItem (event) {
  event.preventDefault()
  m.request({
    method: 'POST',
    url: '/todos',
    body: {
      text: document.getElementById('todo-item-text').value
    }
  }).then(items => {
    Data.todos.list = items
    document.getElementById('todo-item-text').value = ''
  })
}

// item state change handler
function doUpdateItem (event) {
  const input = event.target
  m.request({
    method: 'PUT',
    url: '/todos/' + input.dataset.id,
    body: {
      done: input.checked
    }
  }).then(items => {
    Data.todos.list = items
  })
}

function doDeleteItem (event) {
  m.request({
    method: 'DELETE',
    url: '/todos/' + event.target.dataset.id
  }).then(items => {
    Data.todos.list = items
  })
}

// TODO view
const TodoView = {
  oninit: Data.todos.fetch,
  view: _ =>
    div({ id: 'todo' },
      m(Header, {
        h1: 'TODO',
        h2: 'Please manage your tasks list'
      }),
      div({ class: 'content', style: { margin: '0 auto', width: '500px' } },
        Data.todos.list.length
          ? ul({ style: { listStyle: 'none', margin: 0, padding: 0 } },
            Data.todos.list.map((item, id) =>
              li({ class: 'pure-g', style: 'padding: 1px 0' },
                label({ class: 'pure-u-18-24', style: 'cursor: pointer; padding-right: 1.25rem' },
                  // checker
                  isPermitted('updateTodo') && input({
                    type: 'checkbox',
                    style: { cursor: 'pointer', margin: '0.5rem 0.75rem' },
                    checked: item.done,
                    onchange: doUpdateItem,
                    'data-id': id
                  }),
                  // text
                  span(`${id + 1}. `),
                  span({ style: `text-decoration: ${item.done ? 'line-through' : 'none'}` },
                    m.trust(item.text)
                  )
                ),
                isPermitted('deleteTodo') &&
                  button({
                    class: 'pure-button pure-u-5-24',
                    style: 'color: red',
                    'data-id': id,
                    onclick: doDeleteItem
                  }, 'DELETE')
              )
            ) ) // eslint-disable-line
          : div({ style: { textAlign: 'center' } }, 'Nothing to do...'),
        br(),
        isPermitted('createTodo') &&
          div({},
            form({ class: 'pure-form' },
              form({ class: 'pure-form pure-g' },
                div({ class: 'pure-u-18-24', style: 'padding-right: 1.25rem' },
                  input({ class: 'pure-u-1', id: 'todo-item-text', placeholder: 'New item...' })
                ),
                button({
                  class: 'pure-button pure-button-primary pure-u-5-24',
                  onclick: doCreateItem
                }, 'APPEND')
    ) ) ) ) ) // eslint-disable-line
}

// application (re-)entry point
function initialize () {
  // load initial permissions list
  m.request('/perms').then(result => {
    perms = result.perms
    // configure routes and expose user interface
    m.route(document.body, '/404', {
      '/404': {
        view: () => m(Layout, m(NotFoundView))
      },
      '/overview': {
        view: () => m(Layout, isPermitted('overview') ? m(Overview) : m(NotFoundView))
      },
      '/signup': {
        view: () => m(Layout, isPermitted('signup') ? m(SignupView) : m(NotFoundView))
      },
      '/signin': {
        view: () => m(Layout, isPermitted('signin') ? m(SigninView) : m(NotFoundView))
      },
      '/todo': {
        view: () => m(Layout, isPermitted('reviewTodo') ? m(TodoView) : m(NotFoundView))
      }
    })
    isPermitted('reviewTodo')
      ? m.route.set('/todo')
      : m.route.set('/overview')
  }).catch(() => {
    document.body.innerHTML = '<b>FATAL: Unable to load permissions</b>'
  })
}

window.addEventListener('error', event => {
  event.preventDefault()
  window.alert(event.message.replace('Uncaught ', ''))
})
window.addEventListener('load', initialize)
