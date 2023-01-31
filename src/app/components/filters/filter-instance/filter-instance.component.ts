import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from "@angular/core";
import { MenuItem } from "primeng/api";
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

	constructor() {}

	ngOnInit() {
		this.dropdownItems = [
			{
				label: "Reset",
				icon: "pi pi-refresh",
				disabled: !this.filter.properties,
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
			property.value = property.defaultValue;
		});
	}
}
