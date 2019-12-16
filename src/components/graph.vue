<template>
	<div>
		<div ref="graph2d" id="graph2d"></div>
		<div ref="graph3d" id="graph3d"></div>
		<pre v-html="clickedNode" class="json_small"></pre>
		<pre v-html="clickedEdge" class="json_small"></pre>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import ForceGraph3D from "3d-force-graph";
import vis from "vis-network";
import _ from "lodash";
import beautify from "json-beautify";
import format from "json-format-highlight";
import Converter from "hex2dec";
import Color from 'color'

import utils from "../utils";

const NETVIS_COLORS = {
  input: '#4b8c48',
  hidden: '#48688c',
  action: '#b80f0f'
};

function normalize(low, high, value) {
	return (value - low) / (high - low);
}
function denormalize(low, high, value) {
	return +low + value * (high - low);
}

export default Vue.extend({
	name: "vis",

	props: ["network", "enable3d"],
	data() {
		return { clickedEdge: null, clickedNode: null };
	},

	mounted() {
		this.graph(this.$refs["graph2d"], this.network, this);
    if(this.enable3d)
      this.graph3d(this.$refs["graph3d"], this.network, this);
	},

	methods: {
		graph: async (element, network, vue) => {
			const nodesRaw = _.map(network.nodes, (node, index) => {
        node.index = index;
        let color;
				if (node.type == 'input') color = "#dbdd60";
				if (node.type == 'hidden') color = "#92b6ce";
				if (node.type == 'output') color = "#ffffff";

				const dec = denormalize(0, 1, node.activation);
        const hex = Converter.decToHex("" + dec, { prefix: false });
        color = Color(color).darken(dec).hex()
				const connectionMapper = connection => {
					return {
						from: connection.from.index,
						to: connection.to.index,
						weight: connection.weight
					};
        };
				return {
					id: "" + node.index,
					title: "" + node.index,
					label: "" + node.index,
          color: {
            background: color, highlight: 'red'
          },
					custom: {
						id: node.index,
            output: node.activation,
            bias: node.bias,
						connections: _.map(network.connections, connectionMapper)
					}
				};
			});
			const nodes = new vis.DataSet(nodesRaw);

			const max = _.maxBy(network.connections, connection => connection.weight)
				.weight;
			const min = _.minBy(network.connections, connection => connection.weight)
				.weight;
			const edgesRaw = network.connections.map(connection => {
				const normalized = normalize(min, max, connection.weight);
        const width = denormalize(1, 10, normalized);
				return {
					from: connection.from.index,
					to: connection.to.index,
					width,
					arrows: "to",
					color: connection.weight > 0 ? "green" : "red",
					custom: { connection }
				};
			});
			const edges = new vis.DataSet(
				_.remove(edgesRaw, edge => edge !== null)
			);

			const options = {
				autoResize: true,
				height: "250px",
				width: "100%",
				edges: {
					smooth: {
						type: "cubicBezier",
						forceDirection: "vertical"
					}
				},
				layout: {
					hierarchical: {
						direction: "UD",
						sortMethod: "directed"
					}
				},
				physics: false
			};

			const visNetwork = new vis.Network(element, { nodes, edges }, options);

			visNetwork.on("click", properties => {
				const nodeIds = properties.nodes;
				const node = nodes.get(nodeIds)[0];

				const edgeIds = properties.edges;
				const edge = edges.get(edgeIds)[0];

				if (node && node.custom ) {
					vue.clickedNode = format(
						beautify(node.custom, null, 2, 100)
					);
				} else {
					vue.clickedNode = "";
				}
				if (edge && edge.custom && edge.custom.connection) {
					vue.clickedEdge = format(
						beautify(edge.custom.connection, null, 2, 100)
					);
				} else {
					vue.clickedEdge = "";
				}
			});
    },

		async graph3d(element, network, vue) {
      return;
			const max = _.maxBy(network.connections, connection => connection.weight)
				.weight;
			const min = _.minBy(network.connections, connection => connection.weight)
				.weight;

			const gData = {
				nodes: _.map(network.getNodes(), node => ({
					id: node.getId(),
					type: node.getType()
				})),
				links: _.map(network.connections, connection => {
					const normalized = normalize(min, max, connection.weight);
          const width = denormalize(1, 3, normalized);
					return {
						source: connection.from,
            target: connection.to,
            weight: connection.weight,
						width
					};
				})
			};
			const Graph = ForceGraph3D()(element)
				.graphData(gData)
				.linkDirectionalArrowLength(3.5)
				.linkDirectionalArrowRelPos(1)
        .linkCurvature(0.25)
        .linkColor(link => {
          return link.weight > 0 ? 'green' : 'red'
        })
				.nodeColor(node => {
					if (node.type == "input") return NETVIS_COLORS.input;
					if (node.type == "hidden") return NETVIS_COLORS.hidden;
					if (node.type == "action") return NETVIS_COLORS.action;
					return "#ff0000";
				})
				.linkWidth(node => node.width)
        .height(500)
        .backgroundColor('black') ;
		}    
	}
});
</script>

<style>
.json_small {
	font-size: 14px;
	background-color: #111;
}
#graph2d {
  background-color: black;
}
#graph3d {
	height: 500px;
}

</style>
