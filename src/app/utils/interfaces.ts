import { FilterLibrary } from "./constants";

export interface Filter {
	name: string;
	properties: (number | boolean)[];
	enabled: boolean;
	type: FilterLibrary;
}