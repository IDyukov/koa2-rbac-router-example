/**
 * koa2-rbac-router example application
 */

'use strict'

const ROLES_FILE = './roles.yaml'

const Koa = require('koa2')
const { Router, RBAC } = require('koa2-rbac-router')
const bodyParser = require('koa-body')
const fs = require('fs')
const { promisify } = require('util')
const serve = require('koa-static')
const yaml = require('js-yaml')

const readFile = promisify(fs.readFile)

// users database
const users = {}

// sessions
const sessions = new Map()

// todos
const defaultTodos = [
  'Discover <a href="https://koajs.com/">Koa2</a>',
  'Discover <a href="https://mithril.js.org/">Mithril</a>',
  'Discover <a href="https://purecss.io/">Pure.css</a>',
  'Start new project with <a href="https://github.com/IDyukov/koa2-rbac-router">koa2-rbac-router</a>'
]

// - entry point -
;(async function () {
  // application instance
  const app = new Koa()

  // setup body parser
  app.use(bodyParser())

  const getRole = ctx => sessions.has(ctx.cookies.get('sessionId')) ? 'member' : 'anonym'

  // application router
  const router = new Router({
    // allow automatic RBAC matching
    ctxRolesFetcher: getRole,
    // serve web UI files (handle non-API requests)
    notFoundHandler: serve('./www')
  })
  app.use(router)

  // define routes
  router
    // query permissions
    .map('perms', 'GET /perms', ctx => {
      // RBAC.resolve(...) returns Set, convert it to Array
      ctx.body = { perms: Array.from(RBAC.resolve(getRole(ctx))) }
    })
    // user registration
    .map('signup', 'POST /signup', ctx => {
      const { username, password } = ctx.request.body
      if (!username) ctx.throw(400, 'Username is required')
      if (users[username]) ctx.throw(400, 'User already exists')
      if (!password) ctx.throw(400, 'Password is required')
      users[username] = password
      ctx.status = 200
    })
    // user sign in
    .map('signin', 'POST /signin', ctx => {
      const { username, password } = ctx.request.body
      username || ctx.throw(400, 'Username is required')
      password || ctx.throw(400, 'Password is required')
      if (users[username] !== password) ctx.throw(401)
      const sessionId = `${username}:${password}`
      sessions.has(sessionId) || // do not reset existing session
        sessions.set(sessionId, defaultTodos.map(text => ({ text, done: false })))
      ctx.cookies.set('sessionId', sessionId)
      ctx.status = 200
    })
    // user logout
    .map('logout', '/logout', ctx => {
      sessions.delete(ctx.cookies.get('sessionId'))
      ctx.cookies.set('sessionId', null)
      ctx.status = 200
    })

  // TODO API
  const todoRouter = new Router({
    // following check is redundant (due to RBAC restrictions)
    // and implemented for demo purposes only
    preambleHandler: ctx => getRole(ctx) !== 'anonym' || ctx.throw(401)
  })
  todoRouter
    .get('reviewTodo', '/', ctx => {
      const todos = sessions.get(ctx.cookies.get('sessionId'))
      ctx.body = todos
      ctx.status = 200
    })
    .post('createTodo', '/', ctx => {
      const todos = sessions.get(ctx.cookies.get('sessionId'))
      const { text } = ctx.request.body
      text || ctx.throw(400, 'Item text is required')
      todos.push({ text, done: false })
      ctx.body = todos // to prevent extra API call
      ctx.status = 201
    })
    .put('updateTodo', '/:id', ctx => {
      const todos = sessions.get(ctx.cookies.get('sessionId'))
      const id = parseInt(ctx.params.id, 10)
      ;(id >= 0 && id < todos.length) || ctx.throw(400, 'Invalid item identifier')
      Object.assign(todos[id], ctx.request.body)
      ctx.body = todos // to prevent extra API call
      ctx.status = 200
    })
    .delete('deleteTodo', '/:id', ctx => {
      const todos = sessions.get(ctx.cookies.get('sessionId'))
      const id = parseInt(ctx.params.id, 10)
      ;(id >= 0 && id < todos.length) || ctx.throw(400, 'Invalid item identifier')
      todos.splice(id, 1)
      ctx.body = todos // to prevent extra API call
      ctx.status = 200
    })
  // mount TODO API
  router.use('/todos', todoRouter)

  // asynchronously load roles specs
  const roles = await readFile(ROLES_FILE)
  // setup access control rules
  RBAC.setup(yaml.safeLoad(roles))

  // start serving
  app.listen(8080)
})()
