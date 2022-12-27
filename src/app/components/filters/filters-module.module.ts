import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";

import { FilterSelectorComponent } from './filter-selector/filter-selector.component';
import { ListboxModule } from 'primeng/listbox';

@NgModule({
	declarations: [
    	FilterSelectorComponent
	],
	imports: [
		BrowserModule,
		ListboxModule,
		FormsModule
	],
	exports: [FilterSelectorComponent],
})
export class FiltersModule { }