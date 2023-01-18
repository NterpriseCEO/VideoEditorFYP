import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { MenuModule } from "primeng/menu";
import { ListboxModule } from "primeng/listbox";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { ToolbarModule } from "primeng/toolbar";
import { KnobModule } from "primeng/knob";
import { CheckboxModule } from "primeng/checkbox";
import { DropdownModule } from "primeng/dropdown";

import { FilterSelectorComponent } from "./filter-selector/filter-selector.component";
import { FilterInstanceComponent } from "./filter-instance/filter-instance.component";

@NgModule({
	declarations: [
		FilterSelectorComponent,
		FilterInstanceComponent
	],
	imports: [
		BrowserModule,
		ListboxModule,
		FormsModule,
		ButtonModule,
		TooltipModule,
		MenuModule,
		ToolbarModule,
		KnobModule,
		CheckboxModule,
		DropdownModule
	],
	exports: [FilterSelectorComponent, FilterInstanceComponent],
})
export class FiltersModule { }