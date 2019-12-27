import { architect, Network } from '@liquid-carrot/carrot';
import utils from '../utils'
import _ from 'lodash';

const examples = utils.examples.mirror;

class Handler {

  constructor() {
    this.suspend = false;
  }

  initialize() {
    console.log('INIT')
    this.network = architect.Perceptron(3, 5, 7, 11, 7, 5, 3);
    this.i = 0;
  }

  loop() {
    this.network.train(examples, { iterations: this.updateInterval, rate: this.learningRate, error: this.cutoff })
    this.i += this.updateInterval;

    const evaluation = utils.evaluate(this.network, examples);
    self.postMessage({
      event: 'update',
      epoch: this.i,
      network: this.network.toJSON(),
      results: evaluation.results,
      score: evaluation.score
    })

    if (this.i < this.goestimes && !this.suspend) {
      self.setTimeout(() => { this.loop() }, 100)
    }
  }

  goes(message) {
    this.goestimes = +message.goestimes;
    this.updateInterval = +message.updateInterval;
    this.learningRate = +message.learningRate;
    this.cutoff = +message.cutoff;

    // post initial state
    self.postMessage({ epoch: 0, network: this.network.toJSON(), results: utils.evaluate(this.network, examples) });
    this.loop();
  }

  pause() {
    this.suspend = true;
  }

  resume() {
    this.suspend = false;
    this.loop();
  }

  load(network) {
    this.network = Network.fromJSON(network)
  }
}

const handler = new Handler;
self.addEventListener('message', (message) => {
  switch (message.data.event) {
    case 'initialize':
      handler.initialize();
      break;
    case 'goes':
      handler.goes(message.data);
      break;
    case 'pause':
      handler.pause();
      break;
    case 'resume':
      handler.resume();
      break;
    case 'load':
      handler.load(message.data.network);
  }
})