import { Component, OnInit } from '@angular/core';
import { FilterLibrary } from 'src/app/utils/constants';
import { Filter } from 'src/app/utils/interfaces';

@Component({
	selector: 'app-filter-selector',
	templateUrl: './filter-selector.component.html',
	styleUrls: ['./filter-selector.component.scss']
})
export class FilterSelectorComponent {

	constructor() { }

	filters: Filter[] = [
		{function: "zoomBlur", displayName: "Zoom blur", properties: [231.99996948242188, 293, 1], enabled: false, type: FilterLibrary.GLFX},
		{function: "bulgePinch", displayName: "Bulge Pinch", properties: [320, 239.5, 200, 1], enabled: false, type: FilterLibrary.GLFX},
		{function: "edgeWork", displayName: "Edge work", properties: [10], enabled: false, type: FilterLibrary.GLFX},
		{function: "oil", displayName: "Oil painting", properties: [5, 32], enabled: false, type: FilterLibrary.IMAGE_FILTERS},
		{function: "invert", displayName: "Invert colours",properties: [], enabled: false, type: FilterLibrary.IMAGE_FILTERS},
		{function: "sepia", displayName: "Sepia", properties: [1], enabled: false, type: FilterLibrary.GLFX},
		{function: "vignette", displayName: "Vignette", properties: [0.5, 0.5], enabled: false, type: FilterLibrary.GLFX},
		{function: "colorHalftone", displayName: "Colour halftone", properties: [320, 239.5, 0.25, 4], enabled: false, type: FilterLibrary.GLFX},
		{function: "twirl", displayName: "Twirl", properties: [0.5, 0.5, 200, 360], enabled: false, type: FilterLibrary.IMAGE_FILTERS},
	];

	selectedFilter: Filter | null = null;
}
