import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const DATA_DIR = path.resolve(process.cwd(), 'data')

/**
 * Vite plugin that provides a simple REST API for reading/writing JSON files
 * under the data/ directory.
 *
 * Routes:
 * - GET  /api/data/:path     → read JSON file
 * - HEAD /api/data/:path     → check if file exists
 * - PUT  /api/data/:path     → write JSON file
 * - GET  /api/data/:dir?list=true → list files in directory
 */
export function dataApiPlugin(): Plugin {
  return {
    name: 'data-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/data/')) {
          return next()
        }

        const urlObj = new URL(req.url, 'http://localhost')
        const relativePath = urlObj.pathname.replace('/api/data/', '')
        const filePath = path.join(DATA_DIR, relativePath)

        // Prevent directory traversal
        if (!filePath.startsWith(DATA_DIR)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        if (req.method === 'HEAD') {
          if (fs.existsSync(filePath)) {
            res.statusCode = 200
            res.end()
          } else {
            res.statusCode = 404
            res.end()
          }
          return
        }

        if (req.method === 'GET') {
          // List directory
          if (urlObj.searchParams.get('list') === 'true') {
            try {
              if (!fs.existsSync(filePath)) {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end('[]')
                return
              }
              const entries = fs.readdirSync(filePath, { recursive: true })
                .map(e => String(e))
                .filter(e => e.endsWith('.json'))
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(entries))
            } catch {
              res.statusCode = 500
              res.end('Error listing directory')
            }
            return
          }

          // Read file
          try {
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end('Not found')
              return
            }
            const content = fs.readFileSync(filePath, 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(content)
          } catch {
            res.statusCode = 500
            res.end('Error reading file')
          }
          return
        }

        if (req.method === 'PUT') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              // Ensure directory exists
              const dir = path.dirname(filePath)
              fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(filePath, body, 'utf-8')
              res.statusCode = 200
              res.end('OK')
            } catch {
              res.statusCode = 500
              res.end('Error writing file')
            }
          })
          return
        }

        next()
      })
    },
  }
}
