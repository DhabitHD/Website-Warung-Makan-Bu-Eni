import { buatAplikasi } from './app'
import { env } from './config/env'

const app = buatAplikasi()

app.listen(env.PORT, () => {
  console.log(`API berjalan di http://localhost:${env.PORT}/api/v1`)
})
