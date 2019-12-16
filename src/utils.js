import * as _ from "lodash";
function normalize(low, high, value) {
  return (value - low) / (high - low);
}
function denormalize(low, high, value) {
  return +low + value * (high - low);
}

export default {
  normalize,
  denormalize,
  examples: {
    mirror: [
      { input: [1, 0, 0], output: [1, 0, 0] },
      { input: [0, 1, 0], output: [0, 1, 0] },
      { input: [0, 0, 1], output: [0, 0, 1] }
    ],
    mazur: [
      { input: [.05, .10], output: [.01, .99] }
    ],
    X2: [
      { input: [normalize(1, 6, 1)], output: [normalize(2, 12, 2)] },
      { input: [normalize(1, 6, 2)], output: [normalize(2, 12, 4)] },
      { input: [normalize(1, 6, 3)], output: [normalize(2, 12, 6)] },
      { input: [normalize(1, 6, 4)], output: [normalize(2, 12, 8)] },
      { input: [normalize(1, 6, 5)], output: [normalize(2, 12, 10)] },
      { input: [normalize(1, 6, 6)], output: [normalize(2, 12, 12)] }
    ],
    AND: [
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [0] },
      { input: [1, 0], output: [0] },
      { input: [1, 1], output: [1] },
      { input: [1, 1], output: [1] },
      { input: [1, 1], output: [1] }
    ],
    OR: [
      { input: [0, 0], output: [0] },
      { input: [0, 0], output: [0] },
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [1] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [1] }
    ],
    XOR: [
      { input: [0, 1], output: [1] },
      { input: [0, 0], output: [0] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [0] }
    ],
    NAND: [
      { input: [0, 0], output: [1] },
      { input: [0, 1], output: [1] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [0] }
    ],
    NOR: [
      { input: [0, 0], output: [1] },
      { input: [0, 1], output: [0] },
      { input: [1, 0], output: [0] },
      { input: [1, 1], output: [0] }
    ],
    XNOR: [
      { input: [0, 0], output: [1] },
      { input: [0, 1], output: [0] },
      { input: [1, 0], output: [0] },
      { input: [1, 1], output: [1] }
    ]
  },
  toDecimaNum(number, places = 5) {
    const value = number.toFixed(places).padEnd(places, '0')
    return (number < 0)
      ? "" + value
      : '+' + value

  }
};
