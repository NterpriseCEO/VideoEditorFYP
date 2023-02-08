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
import { ClipComponent } from "./clip/clip.component";
import { SanitiseImageUrlPipe } from "src/app/utils/sanitise-image-url";

@NgModule({
	declarations: [
		ImportsPanelComponent,
		ClipComponent,
		SanitiseImageUrlPipe
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
	exports: [ImportsPanelComponent, ClipComponent]
})
export class ClipsModule { }