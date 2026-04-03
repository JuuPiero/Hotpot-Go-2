import { _decorator, Component, Node } from 'cc';
import { print } from '../Core/utils';
import { registerValue } from '../Core/DIContainer';
import super_html_playable from '../Core/super_html_playable';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
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


    protected onEnable(): void {
        EventBus.on(GameEvent.LEVEL_COMPLETED, this.onLevelCompleted)
        EventBus.on(GameEvent.LEVEL_FAILED, this.onLevelFailed)
        EventBus.on(GameEvent.BUFFER_FULL, this.onLevelFailed)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.LEVEL_COMPLETED, this.onLevelCompleted)
        EventBus.off(GameEvent.LEVEL_FAILED, this.onLevelFailed)
        EventBus.off(GameEvent.BUFFER_FULL, this.onLevelFailed)
    }

    protected start(): void {
        EventBus.emit(GameEvent.NEW_GAME)
    }

    private onLevelCompleted = () => {
        print('Level completed! You win!')
    }

    private onLevelFailed = () => {
        print('Level failed! Try again!')
    }

    public test() {
        print("hello world")
    }

}


