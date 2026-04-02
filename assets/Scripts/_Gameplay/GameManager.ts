import { _decorator, Component, Node } from 'cc';
import { print } from '../Core/utils';
import { registerValue } from '../Core/DIContainer';
import super_html_playable from '../Core/super_html_playable';
import { GameConfigSA } from './GameConfigSA';
import { LevelDataSA } from './LevelDataSA';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(GameConfigSA)
    public gameConfig: GameConfigSA = null

    @property(LevelDataSA)
    public currentLevelData: LevelDataSA = null


    protected onLoad(): void {
        registerValue('GameManager', this)
        registerValue('LevelData', this.currentLevelData)
        registerValue('GameConfig', this.gameConfig)
    }

    install() {
        super_html_playable.download()
    }



    protected start(): void {
        EventBus.emit(GameEvent.NEW_GAME)
    }




    public test() {
        print("hello world")
    }

}


