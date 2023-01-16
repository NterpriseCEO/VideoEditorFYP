import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";

import { FilterSelectorComponent } from "./filter-selector/filter-selector.component";
import { ListboxModule } from "primeng/listbox";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";

@NgModule({
	declarations: [
    	FilterSelectorComponent
	],
	imports: [
		BrowserModule,
		ListboxModule,
		FormsModule,
		ButtonModule,
		TooltipModule
	],
	exports: [FilterSelectorComponent],
})
export class FiltersModule { }