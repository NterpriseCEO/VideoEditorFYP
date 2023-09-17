import { Component, OnInit } from "@angular/core";
import { TreeNode } from "primeng/api";
import { FilterLibrary } from "src/app/utils/constants";
import { Filter } from "src/app/utils/interfaces";
import GLFX_Filters from "./filter-definitions/GLFX_Filters.json";
import ImageFilters from "./filter-definitions/ImageFilters.json";
import { TracksService } from "src/app/services/tracks.service";

@Component({
	selector: "app-filter-selector",
	templateUrl: "./filter-selector.component.html",
	styleUrls: ["./filter-selector.component.scss"]
})
export class FilterSelectorComponent implements OnInit {

	filters: TreeNode[] = [];

	selectedFilter: Filter | null = null;

	constructor(private trackService: TracksService) {}

	ngOnInit() {
		//Applies the type GLFX_Filters to the GLFX_Filters
		//This may or may not be necessary
		GLFX_Filters.filters = GLFX_Filters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.GLFX}));

		let allFilters;

		//Concatenates the two filter lists and sorts them by category
		allFilters = GLFX_Filters.filters.concat(ImageFilters.filters.map((filter) => Object.assign(filter, { type: FilterLibrary.IMAGE_FILTERS })) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));

		let filterCategories = allFilters.map((filter) => filter.category);
		//Filters out duplicate categories and maps them to the SelectItemGroup interface
		//This adds all relevant filters to under their respective categories
		let mappedFilters: TreeNode[] = filterCategories.filter((category, index) => filterCategories.indexOf(category) === index)
			.map((category) => {
				return {
					label: category,
					data: category,
					type: "category",
					//Filters out all filters that don't match the category and maps the rest of them to the SelectItem array
					children: allFilters.filter((f) => f.category === category).map((f) => {
						return {
							label: f.displayName,
							value: f
						}
					})
				}
			});
		this.filters = mappedFilters;
	}

	addFilter(option: Filter) {
		//Sends the filter to the track service which sends it to the tracks panel
		this.trackService.addFilter(option);
	}
}
