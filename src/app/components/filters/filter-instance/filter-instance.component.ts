import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { MenuItem } from "primeng/api";
import { debounceTime, Subject } from "rxjs";
import { Filter, FilterInstance } from "src/app/utils/interfaces";
import GLFX_Filters from "../filter-selector/filter-definitions/GLFX_Filters.json";
import ImageFilters from "../filter-selector/filter-definitions/ImageFilters.json";
import { FilterLibrary } from "src/app/utils/constants";

@Component({
	selector: "app-filter",
	templateUrl: "./filter-instance.component.html",
	styleUrls: ["./filter-instance.component.scss"]
})
export class FilterInstanceComponent implements OnInit, OnChanges {

	@Input() filter!: FilterInstance;
	@Output() filterChange = new EventEmitter<FilterInstance>();

	@Output() onRemove = new EventEmitter();
	@Output() toggleFilter = new EventEmitter();

	filterDefinition!: Filter;
	allFilters: Filter[] = [];

	dropdownItems: MenuItem[] = [];

	modelChanged: Subject<[any, any]> = new Subject();

	constructor() {
		const glfx_filters = GLFX_Filters.map((filter) => Object.assign(filter, { type: FilterLibrary.GLFX })) as Filter[];

		//Concatenates the two filter lists and sorts them by category
		this.allFilters = glfx_filters.concat(ImageFilters.map((filter) => Object.assign(filter, { type: FilterLibrary.IMAGE_FILTERS })) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));
	}

	ngOnChanges(changes: SimpleChanges) {
		if(changes["filter"]) {
			this.filterDefinition = this.allFilters.find((f) => f.function === this.filter.function)!;
		}
	}

	ngOnInit() {
		this.listenForEvents();

		this.dropdownItems = !this.filter?.properties ? [] :
			[
				{
					label: "Reset",
					icon: "pi pi-refresh",
					command: () => {
						//Sets the value of the filter properties to their default values
						//This is done to reset the filter
						this.filterDefinition.properties.forEach((property) => {
							this.filter.properties[property.name] = property.defaultValue;
						});
						this.filterChange.emit(this.filter);
					}
				}
			];

		this.dropdownItems = [
			...this.dropdownItems,
			{
				label: "Remove",
				icon: "pi pi-trash",
				command: () => this.onRemove.emit()
			}
		];

		if(!this.filter.properties) {
			return;
		}
		//Sets the initial value of the filter properties to their default values
		this.filterDefinition.properties.forEach((property) => {
			this.filter.properties[property.name] = this.filter.properties[property.name] ?? property.defaultValue;
		});
	}

	listenForEvents() {
		this.modelChanged.pipe(debounceTime(400)).subscribe((data) => {
			//Waits 200 milliseconds before applying the filter
			//This prevents the project history from being spammed with filter changes
			this.filter!.properties!.find(prop => prop.name == data[1].name)!.value = data[0];
			this.filterChange.emit(this.filter);
		});
	}

	debounceFilterChange(event: Event, property: any) {
		//Debounces the filter change event
		//This is done to prevent the filter from being applied multiple times
		this.modelChanged.next([event, property]);
	}
}
