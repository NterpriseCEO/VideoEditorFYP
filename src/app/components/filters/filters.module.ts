import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { MenuModule } from "primeng/menu";
import { TreeModule } from "primeng/tree";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { ToolbarModule } from "primeng/toolbar";
import { KnobModule } from "primeng/knob";
import { CheckboxModule } from "primeng/checkbox";
import { DropdownModule } from "primeng/dropdown";
import { InplaceModule } from "primeng/inplace";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";

import { FilterSelectorComponent } from "./filter-selector/filter-selector.component";
import { FilterInstanceComponent } from "./filter-instance/filter-instance.component";
import { LayerFilterComponent } from "./layer-filter/layer-filter.component";

@NgModule({
	declarations: [
		FilterSelectorComponent,
		FilterInstanceComponent,
		LayerFilterComponent
	],
	imports: [
		BrowserModule,
		TreeModule,
		FormsModule,
		ButtonModule,
		TooltipModule,
		MenuModule,
		ToolbarModule,
		KnobModule,
		CheckboxModule,
		DropdownModule,
		InplaceModule,
		InputNumberModule,
		InputTextModule
	],
	exports: [FilterSelectorComponent, FilterInstanceComponent, LayerFilterComponent],
})
export class FiltersModule { }