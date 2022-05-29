import { TickList } from '../utils/tickList';
import { Tick } from './tick';
/**
 * A data provider for ticks that is backed by an in-memory array of ticks.
 */
export class TickListDataProvider {
    constructor(ticks, tickSpacing) {
        const ticksMapped = ticks.map(t => (t instanceof Tick ? t : new Tick(t)));
        TickList.validateList(ticksMapped, tickSpacing);
        this.ticks = ticksMapped;
    }
    async getTick(tick) {
        return TickList.getTick(this.ticks, tick);
    }
    async nextInitializedTickWithinOneWord(tick, lte, tickSpacing) {
        return TickList.nextInitializedTickWithinOneWord(this.ticks, tick, lte, tickSpacing);
    }
}
//# sourceMappingURL=tickListDataProvider.js.map