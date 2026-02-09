import IndexRepository from '../repositories/index.repository.js'

class IndexService {
  constructor() {
    this.indexRepo = new IndexRepository()
  }
  
  async healthCheck() {
    try {
      await this.indexRepo.healthCheck()
      return {
        status: 'healthy',
        database: 'connected',
      }
    } catch (error) {
      console.error('Health check DB error:', error.message)
      throw new Error('Database connection failed')
    }
  }
  
  getServerInfo() {
    return {
      message: 'Restaurant API v1.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    }
  }
}

export default IndexService