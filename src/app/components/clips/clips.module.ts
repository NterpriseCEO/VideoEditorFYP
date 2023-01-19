//tracks module file
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
// import { FormsModule } from "@angular/forms";

import { DataViewModule } from "primeng/dataview";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";

import { ImportsPanelComponent } from "./imports-panel/imports-panel.component";

@NgModule({
	declarations: [
		ImportsPanelComponent
	],
	imports: [
		BrowserModule,
		// FormsModule,
		DataViewModule,
		DropdownModule,
		TooltipModule,
		InputTextModule,
		ButtonModule
	],
	exports: [ImportsPanelComponent]
})
export class ClipsModule { }