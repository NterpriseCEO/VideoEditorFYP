import { FilterLibrary } from "./constants";

export interface Filter {
	name: string;
	properties: number[];
	enabled: boolean;
	type: FilterLibrary;
}