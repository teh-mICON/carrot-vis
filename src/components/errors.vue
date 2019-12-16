<template>
	<div>
		<!--<trend :data="chart" :gradient="gradient" smooth />-->
		<!--<TrendChart :datasets="datasets" :labels="labels" />-->
		<TrendChart
			:datasets="datasets"
			:grid="{
     verticalLines: true,
     horizontalLines: true
  }"
			:min="0"
			v-if="this.errors.length > 1"
			:labels="labels"
			id="trend"
		></TrendChart>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";
import utils from "../utils";

export default Vue.extend({
	name: "errors",

	props: ["errors"],
	data() {
		return {
			chart: this.errors,
			gradient: ["#F00", "#0F0"],
			datasets: [{ data: this.errors, fill: true, className: "error_chart" }],
			labels: {
				yLabels: 5,
				yLabelsTextFormatter: val => utils.toDecimaNum(val)
			}
		};
	},

	mounted() {}
});
</script>

<style>


#trend {
	height: 300px;
}

#trend .label text {
  fill: white;
  font-size: 10px;
}

#trend .stroke {
	stroke: #46828d;
	stroke-width: 2;
}
#trend .fill {
	fill: #46828d;
	fill-opacity: 0.1;
}
</style>