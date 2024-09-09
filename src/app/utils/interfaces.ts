import { FilterLibrary, TrackType } from "./constants";

export interface Filter {
	function: string;
	category: string;
	displayName: string;
	properties: FilterProperty[];
	type: FilterLibrary;
}

//Keep this for reference
// export interface FilterInstance extends Omit<Filter, "properties"> {
// 	enabled: boolean;
// 	properties: any[];
// }

export interface FilterInstance {
	enabled: boolean;
	type: FilterLibrary;
	function: string;
	index?: number;
	properties: any;
}

export interface FilterProperty {
	name: string;
	displayName: string;
	propertyType: string;
	defaultValue: any;
	slot?: number;
	min?: number;
	max?: number;
	step?: number;
	options?: any[];
}

export interface Track {
	id: number;
	isVisible: boolean | TrackVisibility[];
	name: string;
	type: TrackType; //Video, webcam or screen capture
	colour: string;
	clips?: ClipInstance[];
	filters?: FilterInstance[];
	layerFilter?: any;
	source?: any; // If screen capture, this is the source/ source id
	width?: number;
	height?: number;
	muted?: boolean;
}

export interface TrackVisibility {
	startTime: number;
	duration: number;
	on: boolean;
}

export interface Clip {
	id: number;
	name: string;
	location: string;
	totalDuration: number;
	duration: number;
	type?: TrackType;
	thumbnail?: string;
	needsRelinking?: boolean;
}

export interface ClipInstance extends Clip {
	in: number;
	startTime: number;
	width?: number;
	height?: number;
}

export interface Project {
	name: string;
	dateCreated: Date;
	lastModifiedDate: Date;
	location: string;
	clips: Clip[];
	tracks: Track[];
}

export interface ZoomSliderPosition {
	left: number;
	center: number;
	right: number;
}