import { _decorator, CCString, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameInstaller')
export class GameInstaller extends Component {

    protected start(): void {
        this.installDependencies()
    }

    installDependencies() {
        // registerSingleton('witcher', Witcher);
        // registerSingleton('Sound', SoundManager);
    }
}


