import { FilterLibrary, TrackType } from "./constants";

export interface Filter {
	function: string;
	category: string;
	displayName: string;
	properties: any[];
	type: FilterLibrary;
}

//Keep this for reference
// export interface FilterInstance extends Omit<Filter, "properties"> {
// 	enabled: boolean;
// 	properties: any[];
// }

export interface FilterInstance extends Filter {
	enabled: boolean;
	index?: number;
	properties: FilterPropertyInstance[];
}

export interface FilterProperty {
	name: string;
	propertyType: string;
	defaultValue: any;
	slot: number;
	min?: number;
	max?: number;
	step?: number;
	options?: any[];
}

export interface FilterPropertyInstance extends FilterProperty {
	value: any;
}

export interface Track {
	id: number;
	isVisible: boolean;
	name: string;
	type: TrackType; //Video, webcam or screen capture
	colour: string;
	clips?: ClipInstance[];
	filters?: FilterInstance[];
	source?: any; // If screen capture, this is the source/ source id
}

export interface Clip {
	name: string;
	location: string;
	duration: number;
	totalDuration: number;
	type?: TrackType;
	thumbnail?: string;
}

export interface ClipInstance extends Clip {
	in: number;
	startTime: number;
}