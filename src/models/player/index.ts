import Model from "@src/config/knexConnection";
import { autoImplementWithBase } from "@src/utils";
import IPlayerEntities from './entities'

export default class PlayerModal extends autoImplementWithBase(Model)<IPlayerEntities>(){
    static get tableName() {
        return "player";
    }

    static get idColumn() {
        return "id";
    }
}