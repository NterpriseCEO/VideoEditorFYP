import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
	selector: "app-layer-filter",
	templateUrl: "./layer-filter.component.html",
	styleUrls: ["./layer-filter.component.scss"]
})
export class LayerFilterComponent {

	@Input() layerFilter: any;
	@Input() trackID!: number;
	@Output() layerFilterChange = new EventEmitter<string>();

	layerFilters: any[] = [
		{ name: "None", function: "" },
		{ name: "Source over", function: "source-over" },
		{ name: "Source in", function: "source-in" },
		{ name: "Source out", function: "source-out" },
		{ name: "Source atop", function: "source-atop" },
		{ name: "Destination over", function: "destination-over" },
		{ name: "Destination in", function: "destination-in" },
		{ name: "Destination out", function: "destination-out" },
		{ name: "Destination atop", function: "destination-atop" },
		{ name: "Lighter", function: "lighter" },
		{ name: "Copy", function: "copy" },
		{ name: "XOR", function: "xor" },
		{ name: "Multiply", function: "multiply" },
		{ name: "Screen", function: "screen" },
		{ name: "Overlay", function: "overlay" },
		{ name: "Darken", function: "darken" },
		{ name: "Lighten", function: "lighten" },
		{ name: "Color dodge", function: "color-dodge" },
		{ name: "Color burn", function: "color-burn" },
		{ name: "Hard light", function: "hard-light" },
		{ name: "Soft light", function: "soft-light" },
		{ name: "Difference", function: "difference" },
		{ name: "Exclusion", function: "exclusion" },
		{ name: "Hue", function: "hue" },
		{ name: "Saturation", function: "saturation" },
		{ name: "Color", function: "color" },
		{ name: "Luminosity", function: "luminosity" }
	];

	constructor() { }

}
