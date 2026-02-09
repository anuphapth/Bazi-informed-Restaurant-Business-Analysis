import IndexService from '../services/index.service.js'

const indexService = new IndexService()

export const health = async (req, res) => {
  try {
    const result = await indexService.healthCheck()
    return res.status(200).json(result)
  } catch (error) {
    console.error('Health check DB error:', error.message)
    return res.status(503).json({
      status: 'unhealthy',
    })
  }
}

export const server = (req, res) => {
  const result = indexService.getServerInfo()
  return res.json(result)
}
