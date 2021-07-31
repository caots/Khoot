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
        query = query.where(builder => builder.where("assessment.title", "like", `%${title}%`).orWhere('assessment.join_key', title))
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

  public async getAssessmentByJoinKey(joinKey: string, name: string): Promise<any> {
    try {
      let assessment: any = await AssessmentModel.query()
        .select(["assessment.*"]).where("assessment.is_deleted", IS_DELETED.No)
        .andWhere("assessment.status", COMMON_STATUS.Active)
        .andWhere("assessment.join_key", joinKey);
      const listOrder = await this.getAllQuestionAssessment(assessment[0].id, true);
      assessment[0].questions = listOrder;
      const palyer = await PlayerModel.query().insert({ name: name });
      assessment[0].player = palyer;
      return assessment[0];
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getDetailsAssessment(assessmentId: number): Promise<any> {
    try {
      let query = AssessmentModel.query().findById(assessmentId);
      const assessment = await query;
      const listQuestion = await this.getAllQuestionAssessment(assessment.id);
      const listResultAssessment = await this.getAllRersultAssessment(assessment.id);
      assessment.questions = listQuestion;
      assessment.listResults = listResultAssessment;
      return assessment;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async createResultsAssessment(data: any): Promise<any> {
    try {
      const playerId = data.playerId;
      const assessment_id = data.id;

      const questions = data.questions;
      let results = [];
      questions.map((question, index) => {
        let checkCorrectAnsw = -1;
        question.answers.map((ans, i) => {
          if (ans.status) checkCorrectAnsw = i;
        });
        results.push(checkCorrectAnsw);
      })

      // check point 
      const assessment = await this.getDetailsAssessment(assessment_id);
      let point = 0;
      assessment.questions.map((question, index) => {
        let checkCorrectAnsw = -1;
        JSON.parse(question.full_answers).map((ans, i) => {
          if (ans.status) checkCorrectAnsw = i
        });
        if(checkCorrectAnsw == results[index] && results[index] >= 0) point += question.point;
      })

      const newResultAssessment = {
        player_id: playerId,
        assessment_id: assessment_id,
        point: point,
        results: JSON.stringify(results)
      } as ResultAssessmentModel;
      return ResultAssessmentModel.query().insert(newResultAssessment);
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
      const id = assessment.id;
      assessment.status = status;
      delete assessment.id;
      delete assessment.created_at;
      delete assessment.updated_at;
      delete assessment.listResults;
      delete assessment.updated_at;
      const newAssessment = await AssessmentModel.query().updateAndFetchById(id, assessment);
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

  public async getAllQuestionAssessment(assessmentId: number, isPlayer = false): Promise<QuestionModel[]> {
    try {
      let listOrder;
      if (isPlayer) {
        listOrder = await QuestionModel.query()
          .select([
            "question.id", "question.title", "question.type", "question.answers", "question.point", "question.created_at", "question.updated_at", "question.image"
          ]).leftJoin("assessment as ASS", "question.assessment_id", "ASS.id")
          .where("question.assessment_id", assessmentId);
      } else {
        listOrder = await QuestionModel.query()
          .select([
            "question.*"
          ]).leftJoin("assessment as ASS", "question.assessment_id", "ASS.id")
          .where("question.assessment_id", assessmentId);
      }
      return listOrder;
    } catch (err) {
      throw new HttpException(500, err.message);
    }
  }

  public async getAllRersultAssessment(assessmentId: number): Promise<ResultAssessmentModel[]> {
    try {
      let listResult = await ResultAssessmentModel.query()
        .select([
          "result_assessment.*", "PL.name as name_player"
        ]).leftJoin("player as PL", "result_assessment.player_id", "PL.id")
        .where("result_assessment.assessment_id", assessmentId);
      return listResult;
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