import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppRoutingModule } from "./app-routing.module";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MenubarModule } from "primeng/menubar";
import { PanelModule } from "primeng/panel";
import { SplitterModule } from 'primeng/splitter';
import { ButtonModule } from "primeng/button";

import { AppComponent } from "./app.component";
import { TracksModule } from "./components/tracks/tracks.module";
import { ViewsModule } from "./views/views.module";

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		MenubarModule,
		PanelModule,
		BrowserAnimationsModule,
		FormsModule,
		TracksModule,
		ButtonModule,
		SplitterModule,
		ViewsModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
