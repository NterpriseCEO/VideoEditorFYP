import { NgModule } from "@angular/core";

import { MenubarModule } from "primeng/menubar";
import { InplaceModule } from "primeng/inplace";
import { InputTextModule } from "primeng/inputtext";
import { FormsModule } from "@angular/forms";

import { EditorToollbarComponent } from "./editor-toolbar.component";
import { TracksModule } from "../tracks/tracks.module";

@NgModule({
	declarations: [
		EditorToollbarComponent
	],
	imports: [
		MenubarModule,
		TracksModule,
		InplaceModule,
		InputTextModule,
		FormsModule
	],
	exports: [EditorToollbarComponent]
})
export class EditorToolbarModule { }