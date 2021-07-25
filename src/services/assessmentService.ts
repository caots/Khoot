import moment from "moment";
import { raw, transaction } from "objection";
import HttpException from "@src/middleware/exceptions/httpException";
import logger from "@src/middleware/logger";
import { UserRepository } from "@src/repositories/userRepository";
import AssessmentModel from "@src/models/assessment";
import QuestionModel from "@src/models/question";
import ResultAssessmentModel from "@src/models/result_assessment";
import PlayerModel from "@src/models/player";
import { PAGE_SIZE, TYPE_QUESTION, COMMON_STATUS, USER_ROLE, IS_DELETED } from "@src/config";
import UserSessionMOdel from "@src/models/user_session";

export default class AssessmentService {

  public async getAllAssessment(
    userId,
    status,
    title,
    orderNo = 0,
    fromDate = '',
    toDate = '',
    page = 0,
    pageSize = PAGE_SIZE.Standand
  ): Promise<any> {
    try {
      const orderArrays = this.getOrder(typeof orderNo === 'string' ? Number.parseInt(orderNo) : orderNo);

      let query = AssessmentModel.query()
        .select(["assessment.*"]).where("assessment.is_deleted", IS_DELETED.No);
      if (status && status != '' && status != COMMON_STATUS.ALL) {
        query = query.where("assessment.status", status);
      }
      if (userId) {
        query = query.where("assessment.user_id", userId);
      }
      if (title) {
        query = query.where(builder => builder.where("assessment.title", "like", `%${title}%`))
      }
      query = query.orderBy(orderArrays[0], orderArrays[1]);
      query = query.whereRaw(this.genQueryCompareDateCart(fromDate, toDate));
      const listAssessment = await query.page(page, pageSize);
      listAssessment.results = await Promise.all(
        listAssessment.results.map(async (assessment: AssessmentModel) => {
          const listOrder = await this.getAllQuestionAssessment(assessment.id);
          assessment.questions = listOrder;
          return assessment;
        })
      );
      return listAssessment;

    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getDetailsAssessment(assessmentId: number): Promise<any> {
    try {
      let query = AssessmentModel.query().findById(assessmentId);
      const assessment = await query;
      const listQuestion = await this.getAllQuestionAssessment(assessment.id);
      assessment.questions = listQuestion;
      return assessment;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async createAssessment(assessment: AssessmentModel, questions: any[]): Promise<any> {
    try {
      const scrappy = await transaction(AssessmentModel, QuestionModel,
        async (assessmentModel, questionModel) => {
          const newAssessment = await assessmentModel.query().insert(assessment);
          // add order
          if (!questions || questions.length == 0) { return null; }
          await Promise.all(
            questions.map(async (question: QuestionModel) => {
              const newQuestion = {
                title: question.title,
                type: question.type,
                answers: JSON.stringify(question.answers),
                full_answers: JSON.stringify(question.full_answers),
                point: question.point,
                image: question.image,
                assessment_id: newAssessment.id
              } as QuestionModel;
              return questionModel.query().insert(newQuestion);
            }));
          return newAssessment;
        });
      logger.info("create Assessment");
      logger.info(JSON.stringify(scrappy));
      const result = await this.getDetailsAssessment(scrappy.id);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateAssessment(assessment: AssessmentModel, questions: any[]): Promise<any> {
    try {
      if (assessment?.created_at) delete assessment.created_at;
      if (assessment?.updated_at) delete assessment.updated_at;

      const scrappy = await transaction(AssessmentModel, QuestionModel,
        async (assessmentModel, questionModel) => {
          const updateAssessment = await assessmentModel.query().updateAndFetchById(assessment.id, assessment);
          // update question
          if (questions && questions.length > 0) {
            let listOldQuestions = await QuestionModel.query().select(["*"]).where("assessment_id", updateAssessment.id);
            await Promise.all(
              listOldQuestions.map(async data => {
                return QuestionModel.query().delete().where("assessment_id", data.assessment_id);
              })
            )
            await Promise.all(
              questions.map(async (question: QuestionModel) => {
                const newQuestion = {
                  title: question.title,
                  type: question.type,
                  answers: JSON.stringify(question.answers),
                  full_answers: JSON.stringify(question.full_answers),
                  point: question.point,
                  image: question.image,
                  assessment_id: updateAssessment.id
                } as QuestionModel;
                return questionModel.query().insert(newQuestion);
              }));
          }
          return updateAssessment;
        });
      logger.info("update Assessment");
      logger.info(JSON.stringify(scrappy));
      const result = await this.getDetailsAssessment(scrappy.id);
      return result;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async updateStatusAssessment(assessment: AssessmentModel, status): Promise<AssessmentModel> {
    try {
      assessment.status = status;
      const newAssessment = await AssessmentModel.query().updateAndFetchById(assessment.id, assessment);
      return newAssessment;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async deleteAssessment(assessment: AssessmentModel): Promise<AssessmentModel> {
    try {
      assessment.is_deleted = IS_DELETED.Yes;
      delete assessment.questions;
      const newAssessment = await AssessmentModel.query().updateAndFetchById(assessment.id, assessment);
      return newAssessment;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getAllQuestionAssessment(assessmentId: number): Promise<QuestionModel[]> {
    try {
      const listOrder = await QuestionModel.query()
        .select([
          "question.*"
        ]).leftJoin("assessment as ASS", "question.assessment_id", "ASS.id")
        .where("question.assessment_id", assessmentId);
      return listOrder;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public genQueryCompareDateCart(fromDate, toDate) {
    if (fromDate == '' && toDate == '') { return "" }
    let query = '';
    if (fromDate != '' && toDate == '') query = `(assessment.created_at >= '${fromDate}')`;
    else if (fromDate == '' && toDate != '') query = `(assessment.created_at <= '${toDate}')`;
    else query = `(assessment.created_at >= '${fromDate}' and assessment.created_at <= '${toDate}')`;
    return query;
  }

  public getOrder(orderBy: number) {
    let orders;
    switch (orderBy) {
      case 0:
        orders = ["assessment.created_at", "desc"];
        break;
      case 1:
        orders = ["assessment.created_at", "asc"];
        break;
      default:
        orders = ["assessment.created_at", "desc"];
        break;
    }
    return orders;
  }


}