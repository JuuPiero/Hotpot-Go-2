import { _decorator, CCString, Component, Node } from 'cc';

const { ccclass, property, executionOrder } = _decorator;

@ccclass('GameInstaller')
@executionOrder(0)
export class GameInstaller extends Component {

    protected onLoad(): void {
        this.installDependencies()
    }

    installDependencies() {
        // registerSingleton('witcher', Witcher);
        // registerSingleton('Sound', SoundManager);
    }
}


