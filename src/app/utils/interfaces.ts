import { FilterLibrary } from "./constants";

export interface Filter {
	function: string;
	displayName: string;
	properties: (number | boolean)[];
	enabled: boolean;
	type: FilterLibrary;
}