import { WeightedGraphWithNodeID } from "../algorithms/graph/weighted_graph_with_node_id";
import { WeightedGraphData } from "./graph_data";

export class WeightedGraphWithNodeIDData extends WeightedGraphData {
	graph: WeightedGraphWithNodeID;
	nameToID: Map<any, number>;
	IDToName: Map<number, any>;
}
