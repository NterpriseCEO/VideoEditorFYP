import { Component, OnInit } from "@angular/core";
import { SelectItemGroup } from "primeng/api";
import { FilterLibrary } from "src/app/utils/constants";
import { Filter } from "src/app/utils/interfaces";
import GLFX_Filters from "./filter-definitions/GLFX_Filters.json";
import ImageFilters from "./filter-definitions/ImageFilters.json";

@Component({
	selector: "app-filter-selector",
	templateUrl: "./filter-selector.component.html",
	styleUrls: ["./filter-selector.component.scss"]
})
export class FilterSelectorComponent {


	filters: SelectItemGroup[] = [];

	selectedFilter: Filter | null = null;

	constructor() {
		//Applies the type GLFX_Filters to the GLFX_Filters
		//This may or may not be necessary
		GLFX_Filters.filters = GLFX_Filters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.GLFX}));
		//assign ImageFilters to GLFX_Filters
		console.log(ImageFilters.filters as Filter[]);

		let allFilters;

		//Concatenates the two filter lists and sorts them by category
		allFilters = GLFX_Filters.filters.concat(ImageFilters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.IMAGE_FILTERS})) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));

		console.log(allFilters);

		let filterCategories = allFilters.map((filter) => filter.category);
		//Filters out duplicate categories and maps them to the SelectItemGroup interface
		//This adds all relevant filters to under their respective categories
		let mappedFilters = filterCategories.filter((category, index) => filterCategories.indexOf(category) === index)
			.map((category) => {
			return {
				label: category,
				value: category,
				//Filters out all filters that don't match the category and maps the rest of them to the SelectItem array
				items: allFilters.filter((f) => f.category === category).map((f) => {
					return {
						label: f.displayName,
						value: f
					}
				})
			}
		});
		

		this.filters = mappedFilters as SelectItemGroup[];
	}

}
