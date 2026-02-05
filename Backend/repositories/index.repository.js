import { executeQuery } from '../lib/db.js'

class IndexRepository {
  async healthCheck() {
    return await executeQuery('SELECT 1')
  }
}

export default IndexRepository