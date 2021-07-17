import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import moment from "moment";
import IQuestionEntities from './entities'

export default class QuestionModel extends autoImplementWithBase(Model)<IQuestionEntities>() {
  public created_at?: string;
  public updated_at?: string;
  static get tableName() {
    return "question";
  }

  static get idColumn() {
    return "id";
  }
  public $beforeInsert() {
    this.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }

  public $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }
}