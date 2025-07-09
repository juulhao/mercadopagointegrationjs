import { Ignitor, prettyPrint } from '@adonisjs/core'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(() => {
      app.container.resolving('Adonis/Core/Server', (server) => {
        server.listen('localhost', 3333)
      })
    })
  })
  .httpServer()
  .start()
  .then(() => {
    console.log(prettyPrint.colors.green('🚀 Server started on http://localhost:3333'))
  })
  .catch((error) => {
    process.exitCode = 1
    console.error(error)
  })
