import { asValue, AwilixContainer } from 'awilix'
import fastify, { FastifyInstance } from 'fastify'
import { diContainer, diContainerClassic, FastifyAwilixOptions, fastifyAwilixPlugin, Cradle, RequestCradle } from '../../lib/index'

import { expect } from 'tstyche'

expect<{}>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ disposeOnClose: false }>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ container: AwilixContainer<Cradle> }>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ injectionMode: 'CLASSIC' }>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ injectionMode: 'PROXY' }>().type.toBeAssignableTo<FastifyAwilixOptions>()

expect<{ disposeOnResponse: false }>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ asyncInit: false; asyncDispose: false }>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ asyncInit: true; asyncDispose: true }>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ eagerInject: true }>().type.toBeAssignableTo<FastifyAwilixOptions>()

expect<{ strictBooleanEnforced: true }>().type.toBeAssignableTo<FastifyAwilixOptions>()
expect<{ strictBooleanEnforced: false }>().type.toBeAssignableTo<FastifyAwilixOptions>()

interface MailService {
  greet(name: string): void
}
interface User {
  name: string
}

declare module '../../lib/index' {
  interface Cradle {
    mailService: MailService
  }
  interface RequestCradle {
    user: User
  }
}

expect<AwilixContainer<Cradle>>().type.toBe(diContainer)
expect<AwilixContainer<Cradle>>().type.toBe(diContainerClassic)

expect<AwilixContainer<Cradle & RequestCradle>>().type.not.toBe(diContainer)
expect<AwilixContainer<RequestCradle>>().type.not.toBe(diContainer)
expect<AwilixContainer<Cradle & RequestCradle>>().type.not.toBe(diContainerClassic)
expect<AwilixContainer<RequestCradle>>().type.not.toBe(diContainerClassic)

expect<MailService>().type.toBe(diContainer.cradle.mailService)
expect<MailService>().type.toBe(diContainer.resolve('mailService'))

const app: FastifyInstance = fastify()

app.register(fastifyAwilixPlugin, {})

app.addHook('onRequest', (request, _reply, done) => {
  request.diScope.register({
    user: asValue({
      name: 'John Doe',
    }),
  })
  done()
})

app.get('/user', (request) => {
  expect<AwilixContainer<Cradle & RequestCradle>>().type.toBe(request.diScope)

  const mailService = request.diScope.cradle.mailService
  const user = request.diScope.cradle.user

  expect<MailService>().type.toBe(mailService)
  expect<User>().type.toBe(user)

  mailService.greet(user.name)
})