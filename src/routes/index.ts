import { Router } from "express";
import UserRouter from "./user";
import ImageRouter from "./image";
import AssessmentRouter from "./assessment";
import AuthController from "@src/controllers/auth";
class MainRoutes {
    public routers: Router;
    private authController: AuthController;
  
    constructor() {
      this.routers = Router();
      this.authController = new AuthController();
      this.config();
    }
  
    private config() {
      // Customer
      this.routers.use("/user", new UserRouter().router);
      this.routers.use("/assessment", new AssessmentRouter().router);
      this.routers.use("/image", this.authController.authenticateJWT, new ImageRouter().router);
    }
  }
  
  export default new MainRoutes().routers;