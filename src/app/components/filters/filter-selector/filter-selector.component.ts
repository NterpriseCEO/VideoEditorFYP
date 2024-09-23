import { Component, OnInit } from "@angular/core";
import { TreeNode } from "primeng/api";
import { FilterLibrary } from "src/app/utils/constants";
import { Filter, FilterInstance } from "src/app/utils/interfaces";
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
	recentlyUsedFilters: TreeNode | undefined = undefined;

	selectedFilter: Filter | null = null;
	allFilters: Filter[] = [];

	currentExplandedListItems: number[] = [];

	constructor(private trackService: TracksService) {}

	ngOnInit() {
		this.setAllFilters();
		this.setRecentlyUsedFilters();
		this.regenerateFiltersList();
	}

	setAllFilters() {
		//Applies the type GLFX_Filters to the GLFX_Filters
		//This may or may not be necessary
		const glfx_filters = GLFX_Filters.map((filter) => Object.assign(filter, { type: FilterLibrary.GLFX })) as Filter[];

		//Concatenates the two filter lists and sorts them by category
		this.allFilters = glfx_filters.concat(ImageFilters.map((filter) => Object.assign(filter, { type: FilterLibrary.IMAGE_FILTERS })) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));
	}

	addFilter(option: Filter) {
		//Sends the filter to the track service which sends it to the tracks panel
		this.trackService.addFilter(option);
		this.setRecentlyUsedFilters(option.function);
		this.regenerateFiltersList();
	}

	setRecentlyUsedFilters(filter?: string) {
		const recents: any[] = JSON.parse(localStorage.getItem("recentlyUsedFilters") ?? "[]");

		if(filter && !recents.includes(filter)) {
			if(recents.length === 5) {
				recents.pop();
			}
			recents.unshift(filter);

			localStorage.setItem("recentlyUsedFilters", JSON.stringify(recents));
		}


		if(recents.length === 0) {
			this.recentlyUsedFilters = undefined;
			return;
		}

		const filter0 = this.filters[0];

		this.recentlyUsedFilters = {
			label: "Recently used",
			data: "Recently used",
			type: "category",
			expanded: filter0?.expanded && filter0.label === "Recently used",
			children: recents.map(r => this.allFilters.find(f => r === f.function))?.map(f => {
				return {
					label: f?.displayName,
					value: f
				}
			})
		};
	}

	regenerateFiltersList() {
		const startIndex = this.filters[0]?.label !== "Recently used" && this.recentlyUsedFilters === undefined ? 0 : 1;
		this.currentExplandedListItems = this.filters.filter(category => category.expanded === true).map((c, i) => i);

		let filterCategories = this.allFilters.map((filter) => filter.category);
		//Filters out duplicate categories and maps them to the SelectItemGroup interface
		//This adds all relevant filters to under their respective categories
		let mappedFilters: TreeNode[] = filterCategories.filter((category, index) => filterCategories.indexOf(category) === index)
			.map((category, i) => {
				return {
					label: category,
					data: category,
					type: "category",
					expanded: this.currentExplandedListItems.includes(i),
					//Filters out all filters that don't match the category and maps the rest of them to the SelectItem array
					children: this.allFilters.filter((f) => f.category === category).map((f) => {
						return {
							label: f.displayName,
							value: f
						}
					})
				}
			});

		this.filters = this.recentlyUsedFilters !== undefined ? [this.recentlyUsedFilters, ...mappedFilters]
			: mappedFilters;
	}
}
