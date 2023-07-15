import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from "@angular/core";
import { MenuItem } from "primeng/api";
import { debounceTime, Subject } from "rxjs";
import { FilterInstance } from "src/app/utils/interfaces";

@Component({
	selector: "app-filter",
	templateUrl: "./filter-instance.component.html",
	styleUrls: ["./filter-instance.component.scss"]
})
export class FilterInstanceComponent implements OnInit {

	@Input() filter!: FilterInstance;
	@Output() filterChange = new EventEmitter<FilterInstance>();

	@Output() onRemove = new EventEmitter();
	@Output() toggleFilter = new EventEmitter();

	dropdownItems: MenuItem[] = [];

	modelChanged: Subject<[any, any]> = new Subject();

	constructor() {
		this.listenForEvents();
	}

	ngOnInit() {
		this.dropdownItems = [
			{
				label: "Reset",
				icon: "pi pi-refresh",
				disabled: !this.filter?.properties,
				command: () => {
					//Sets the value of the filter properties to their default values
					//This is done to reset the filter
					this.filter.properties.forEach((property) => {
						property.value = property.defaultValue;
					});
					this.filterChange.emit(this.filter);
				}
			},
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
		this.filter.properties.forEach((property) => {
			property.value = property.value ?? property.defaultValue;
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
