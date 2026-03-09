import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })
import app from './app.js'

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
