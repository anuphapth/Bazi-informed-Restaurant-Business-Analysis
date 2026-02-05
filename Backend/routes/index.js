import express from "express"
import { server, 
    health 
} from '../controllers/index.js'

const routes = express.Router()

routes.get("/",server)
routes.get("/health",health)

export default routes
