<template>
	<div :key="frame">
		<Graph :network="graphNetwork" v-if="graphNetwork" :enable3d="enable3d" />
		<div id="content">
			<div class="d-flex flex-row flexatron">
				<div class="controls">
					<div class="input-group input-group-sm">
						<div class="input-group-prepend" v-tooltip.right="'Maximum samples to feed the network'">
							<span class="input-group-text">X</span>
						</div>
						<input type="text" class="form-control" v-model="goestimes" @change="updateGoestimes" />
					</div>
					<div class="input-group input-group-sm">
						<div class="input-group-prepend" v-tooltip.right="'Minimum error rate before stopping'">
							<span class="input-group-text">cutoff</span>
						</div>
						<input type="text" class="form-control" v-model="cutoff" @change="updateCutoff" />
					</div>
					<div class="input-group input-group-sm">
						<div class="input-group-prepend" v-tooltip.right="'Update vis after epochs'">
							<span class="input-group-text">update</span>
						</div>
						<input
							type="text"
							class="form-control"
							v-model="updateInterval"
							@change="updateUpdateInterval"
						/>
					</div>
				</div>
				<div class="controls">
					<div class="input-group input-group-sm">
						<div class="input-group-prepend" v-tooltip.left="'Network learning rate'">
							<span class="input-group-text">learning</span>
						</div>
						<input type="text" class="form-control" v-model="learningRate" @change="updateLearningRate" />
					</div>
					<div class="input-group input-group-sm">
						<div class="input-group-prepend" v-tooltip.left="'Node delta momentum'">
							<span class="input-group-text">momentum</span>
						</div>
						<input type="text" class="form-control" v-model="momentum" @change="updateMomentum" />
					</div>
				</div>
			</div>
			<div class="d-flex flex-row flexatron">
				<div class="btn-group" role="group" aria-label="Basic example">
					<button
						type="button"
						:class="btnClass('mirror')"
						@click="setExamples('mirror'); save();"
					>mirror</button>
					<button type="button" :class="btnClass('X2')" @click="setExamples('X2'); save();">X2</button>
					<button type="button" :class="btnClass('AND')" @click="setExamples('AND'); save();">AND</button>
					<button type="button" :class="btnClass('OR')" @click="setExamples('OR'); save();">OR</button>
					<button type="button" :class="btnClass('XOR')" @click="setExamples('XOR'); save();">XOR</button>
					<button type="button" :class="btnClass('NAND')" @click="setExamples('NAND'); save();">NAND</button>
					<button type="button" :class="btnClass('NOR')" @click="setExamples('NOR'); save();">NOR</button>
					<button type="button" :class="btnClass('XNOR')" @click="setExamples('XNOR'); save();">XNOR</button>
				</div>
				<div class="input-group special">
					<div class="input-group-prepend">
						<button @click="save(); goesX()" class="btn btn-danger" type="button">GOES</button>
					</div>
					<button type="button" class="btn btn-primary" @click="stop">STOP</button>
					<button type="button" class="btn btn-outline-success" @click="save">save</button>
					<button type="button" class="btn btn-outline-info" @click="load">load</button>
				</div>
			</div>
			<div class="d-flex flex-row flexatron">
				<table id="result">
					<tr v-for="(result, index) in results" :key="index">
						<td class="input">{{result.input.join(',')}}</td>
						<td class="ideal">{{result.ideal.join(',')}}</td>
						<td class="actual">{{result.actual.join(' ')}}</td>
					</tr>
				</table>
				<table id="current">
					<tr>
						<th>time</th>
						<td>{{elapsedTime}}s</td>
					</tr>
					<tr>
						<th>epoch</th>
						<td>{{epoch}}</td>
					</tr>
					<tr>
						<th>MSE</th>
						<td>{{MSE}}</td>
					</tr>
				</table>
			</div>
			<div class="btn-group" role="group"></div>
			<Errors :errors="errors" v-if="errors" />
			<Genome :network="network" v-if="network" />
		</div>
	</div>
</template>

<script lang="ts">
import _ from "lodash";

import Vue from "vue";
import Graph from "./components/graph.vue";
import GenomeComponent from "./components/genome.vue";
import Errors from "./components/errors.vue";

import utils from "./utils";

let { Network, Neat, methods } = require("@liquid-carrot/carrot");

function normalize(low, high, value) {
	return (value - low) / (high - low);
}
function denormalize(low, high, value) {
	return +low + value * (high - low);
}

export default Vue.extend({
	name: "app",

	components: {
		Graph,
		Genome: GenomeComponent,
		Errors
	},

	data() {
		return {
			population: [],
			network: null,
			neat: null,
			graphNetwork: null,
			normalize: false,
			examples: utils.examples.XOR,
			genome: null,
			results: [],
			frame: 0,
			activeExamples: "mirror",
			goestimes:
				localStorage.getItem("goestimes") === null
					? 1000
					: localStorage.getItem("goestimes"),
			cutoff:
				localStorage.getItem("cutoff") === null
					? 0.001
					: localStorage.getItem("cutoff"),
			updateInterval:
				localStorage.getItem("updateInterval") === null
					? 100
					: localStorage.getItem("updateInterval"),
			learningRate:
				localStorage.getItem("learningRate") === null
					? 0.001
					: localStorage.getItem("learningRate"),
			momentum:
				localStorage.getItem("momentum") === null
					? 0.5
					: localStorage.getItem("momentum"),
			MSE: 0,
			errors: [],
			epoch: 0,
			runFunc: null,
			timeout: null,
			startTime: new Date(),
			elapsedTime: null,
			enable3d: true
		};
	},
	async created() {
		document.title = "liquid carrot vis";
		let examples = localStorage.getItem("activeExamples");
		if (examples === null) {
			examples = "XOR";
      this.setExamples(examples);
      this.save();
      this.load();
		}
    this.setExamples(examples);
		this.load();
	},
	methods: {
		pause() {
			window.clearTimeout(this.timeout);
		},
		resume() {
			window.setTimeout(this.runFunc, 1);
		},
		stop() {
			window.clearTimeout(this.timeout);
			this.errors = [];
			this.enable3d = true;
		},
		setExamples(index) {
			localStorage.setItem("activeExamples", index);

			this.normalize = false;
			if (index == "X2") {
				this.normalize = true;
			}
			this.errors = [];

			const config = {
				learningRate: this.learningRate,
				momentum: this.momentum
			};
			this.examples = utils.examples[index];

			if (index == "mirror") {
				this.neat = new Neat(3, 3);
			} else {
				this.neat = new Neat(2, 1);
			}
		},

		updateDisplay(epoch) {
			const results = [];
			let MSE = 0;
			_.each(this.examples, example => {
				// activate network
				const actual = this.network.activate(example.input);

				// add every error to the MSE
				_.each(example.output, (ideal, index) => {
					MSE += Math.pow(actual[index] - ideal, 2);
				});

				// add result to display
				results.push({
					input: example.input,
					ideal: example.output,
					actual: _.map(actual, output => utils.toDecimaNum(output, 10))
				});
			});

			// finally set all display properties
			this.MSE = MSE * 0.5;
			this.graphNetwork = this.network;
			this.results = results;
			this.errors.push(this.MSE);
			if (this.errors.length > 100) this.errors.splice(0, 1);
			this.frame++;
			this.epoch = epoch;
			this.elapsedTime =
				(new Date().getTime() - this.startTime.getTime()) / 1000;
		},

		goesX() {
			let i = 0;
			this.startTime = new Date();
			this.enable3d = false;

			const goes = async () => {
				for (let j = 0; j < this.updateInterval; j++) {
					this.neat.evolve(this.examples);
				}
				i += parseInt(this.updateInterval);
				this.network = this.neat.getFittest(this.examples);
				this.updateDisplay(i);

				if (this.MSE > this.cutoff && i < this.goestimes) {
					this.timeout = window.setTimeout(goes, 10);
				} else {
					this.timeout = false;
					this.enable3d = true;
					this.runFunc = null;
				}
			};
			this.timeout = window.setTimeout(goes, 0);
			this.runFunc = goes;
		},

		btnClass(examples) {
			if (examples == localStorage.getItem("activeExamples"))
				return "btn btn-info";
			return "btn btn-secondary";
		},
		updateGoestimes() {
			window.localStorage.setItem("goestimes", this.goestimes);
			location.reload();
		},
		updateCutoff() {
			window.localStorage.setItem("cutoff", this.cutoff);
			location.reload();
		},
		updateUpdateInterval() {
			window.localStorage.setItem("updateInterval", this.updateInterval);
			location.reload();
		},
		updateLearningRate() {
			window.localStorage.setItem("learningRate", this.learningRate);
			location.reload();
		},
		updateMomentum() {
			window.localStorage.setItem("momentum", this.momentum);
			location.reload();
		},
		save() {
			console.log("SAVING");
			const population = _.map(this.neat.population, network =>
				network.toJSON()
      );
			window.localStorage.setItem("genome", JSON.stringify(population));
		},
		load() {
			console.log("LOADING");
      const loaded = JSON.parse(window.localStorage.getItem("genome"));
			const population = _.map(loaded, network => {
				return Network.fromJSON(network);
      });
      this.neat = new Neat(this.examples)
			this.neat.population = population;
      this.network = this.neat.getFittest(this.examples);
      this.updateDisplay(0);
		}
	}
});
</script>

<style lang="scss">
html body {
	background-color: #0c0c0c;
	color: #eee;
}
#content {
	padding: 20px;
}
input[type="text"] {
	background-color: black;
	color: #ddd;
	border: 0;
}
html pre {
	color: #eee;
}
.flexatron {
	margin-bottom: 10px;
	& > * {
		margin-right: 20px;
		flex: 1;
	}
}
#result {
	font-family: "Consolas";
	td {
		border: 1px solid #333;
		padding: 5px;
	}
	.input {
		color: yellow;
	}
	.output {
		color: #aaa;
	}
	.result {
		color: white;
	}
}
#trend {
	margin-bottom: 20px;
}
html .btn {
	padding: 10px;
}
html .btn-secondary {
	background-color: black;
	color: white;
}
html .input-group-text {
	width: 100px;
	background-color: black;
	color: white;
	border-right: 1px solid white;
}
.btn-group.special {
	display: flex;
}
.special .btn {
	flex: 1;
}
#current td {
	padding-left: 15px;
}

.tooltip {
	display: block !important;
	z-index: 10000;
	.tooltip-inner {
		background: #333;
		color: white;
		border-radius: 5px;
		padding: 5px 10px 4px;
		border-bottom: 3px solid #46828d;
	}
	&[x-placement^="right"] {
		margin-left: 5px;
		.tooltip-arrow {
			border-width: 5px 5px 5px 0;
			border-left-color: transparent !important;
			border-top-color: transparent !important;
			border-bottom-color: transparent !important;
			left: -5px;
			top: calc(50% - 5px);
			margin-left: 0;
			margin-right: 0;
		}
	}
	&[x-placement^="left"] {
		margin-right: 5px;
		.tooltip-arrow {
			border-width: 5px 0 5px 5px;
			border-top-color: transparent !important;
			border-right-color: transparent !important;
			border-bottom-color: transparent !important;
			right: -5px;
			top: calc(50% - 5px);
			margin-left: 0;
			margin-right: 0;
		}
	}
	&[aria-hidden="true"] {
		visibility: hidden;
		opacity: 0;
		transition: opacity 0.15s, visibility 0.15s;
	}
	&[aria-hidden="false"] {
		visibility: visible;
		opacity: 1;
		transition: opacity 0.15s;
	}
}
</style>
