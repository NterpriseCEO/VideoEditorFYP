import { FilterLibrary } from "./constants";

export interface Filter {
	function: string;
	category: string;
	displayName: string;
	properties: any[];
	type: FilterLibrary;
}

export interface FilterInstance extends Filter {
	enabled: boolean;
}