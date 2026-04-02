import { _decorator, Component, Node } from 'cc';
import { PotLayer } from './PotLayer';
const { ccclass, property } = _decorator;

@ccclass('Pot')
export class Pot extends Component {
    @property(PotLayer)
    public potLayers: PotLayer[] = []

    
}


