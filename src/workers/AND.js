import utils from '../utils'
import GateWorker from '../GateWorker';

const gateWorker = new GateWorker(utils.examples.AND);
self.addEventListener('message', (message) => {
  gateWorker.handle(message);
})