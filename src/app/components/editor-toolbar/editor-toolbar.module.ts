import { NgModule } from "@angular/core";

import { MenubarModule } from "primeng/menubar";

import { EditorToollbarComponent } from "./editor-toolbar.component";
import { TracksModule } from "../tracks/tracks.module";

@NgModule({
	declarations: [
		EditorToollbarComponent
	],
	imports: [
		MenubarModule,
		TracksModule
	],
	exports: [EditorToollbarComponent]
})
export class EditorToolbarModule { }