import { get } from "lodash";
import AssessmentModel from '@src/models/assessment';
import AssessmentService from '@src/services/assessmentService';
import { badRequest, created, ok, unAuthorize } from "@src/middleware/response";
import { NextFunction, Request, Response } from "express";
import { COMMON_SUCCESS } from "@src/config/message";
import { IS_DELETED, COMMON_STATUS, PAGE_SIZE } from "@src/config";
import MsValidate from "@src/utils/validate";

export default class AssessmentController {

  public async getAllAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentService = new AssessmentService();
      const userId = get(req, "query.userId", null);
      const title = get(req, "query.title", null);
      const order = get(req, "query.order", null);
      const status = get(req, "query.status", null);
      const page = parseInt(get(req, "query.page", 0));
      const pageSize = parseInt(get(req, "query.pageSize", PAGE_SIZE.Standand));
      const fromDate = req.param('from_date');
      const toDate = req.param('to_date');
      let results = await assessmentService.getAllAssessment(userId, status, title, order, fromDate, toDate, page, pageSize);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async getDetailsAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = get(req, "params.id", 0);
      const assessmentService = new AssessmentService();
      let results = await assessmentService.getDetailsAssessment(id);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const msValidate = new MsValidate();
      const assessment = await msValidate.validateUpdateAssessment(req.body);
      assessment.status = COMMON_STATUS.Active;
      assessment.is_deleted = IS_DELETED.No;
      assessment.join_key = `${new Date().getTime()}-${assessment.user_id}`;
      const assessmentService = new AssessmentService();
      const questions = assessment?.questions || [];
      delete assessment.questions;
      let results = await assessmentService.createAssessment(assessment, questions);
      if(!results) return badRequest({ message: "Insert Assessment Error!" }, req, res);
      return created(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const msValidate = new MsValidate();
      const assessment = await msValidate.validateUpdateAssessment(req.body);
      const assessmentService = new AssessmentService();
      const questions = assessment?.questions || [];
      delete assessment.questions;
      let results = await assessmentService.updateAssessment(assessment, questions);
      if(!results) return badRequest({ message: "Update Assessment Error!" }, req, res);
      return created(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async updateStatusAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, status } = req.body;
      const assessmentService = new AssessmentService();
      const assessment = await assessmentService.getDetailsAssessment(id);
      if (!assessment) return badRequest({ message: "Find not found this assessment!" }, req, res);
      delete assessment.questions;
      let results = await assessmentService.updateStatusAssessment(assessment, status);
      return ok(results, req, res);
    } catch (err) {
      next(err);
    }
  }

  public async deleteAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = get(req, "params.id", 0);
      const assessmentService = new AssessmentService();
      const assessment = await assessmentService.getDetailsAssessment(id);
      const result = await assessmentService.deleteAssessment(assessment);
      if (!result || !assessment) return badRequest({ message: "Delete fail!" }, req, res);
      return ok({ message: COMMON_SUCCESS.deleted }, req, res);
    } catch (err) {
      next(err);
    }
  }
} 