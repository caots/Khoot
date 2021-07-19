import { Router } from "express";
import AssessmentController from '@src/controllers/assessment';
import AuthController from "@src/controllers/auth";
import { checkTeacher } from '@src/middleware/role';

export default class AssessmentRouter {
  public router: Router;
  private assessmentController: AssessmentController;
  private authController: AuthController;

  public constructor() {
    this.router = Router();
    this.assessmentController = new AssessmentController();
    this.authController = new AuthController();
    this.config();
  }
  private config() {
    this.router.get("/list", this.authController.authenticateJWT, checkTeacher(), this.assessmentController.getAllAssessment);
    this.router.get("/:id", this.authController.authenticateJWT, checkTeacher(), this.assessmentController.getDetailsAssessment);
    this.router.post("/", this.authController.authenticateJWT, checkTeacher(), this.assessmentController.createAssessment);
    this.router.put("/", this.authController.authenticateJWT, checkTeacher(), this.assessmentController.updateAssessment);
    this.router.put("/status/", this.authController.authenticateJWT, checkTeacher(), this.assessmentController.updateStatusAssessment);
    this.router.delete("/:id", this.authController.authenticateJWT, checkTeacher(), this.assessmentController.deleteAssessment);
  }

}