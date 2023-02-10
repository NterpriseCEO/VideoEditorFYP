import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppRoutingModule } from "./app-routing.module";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MenubarModule } from "primeng/menubar";
import { PanelModule } from "primeng/panel";
import { SplitterModule } from "primeng/splitter";
import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from "primeng/confirmdialog";

import { AppComponent } from "./app.component";
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
		ButtonModule,
		SplitterModule,
		ViewsModule,
		ToastModule,
		ConfirmDialogModule
	],
	providers: [MessageService, ConfirmationService],
	bootstrap: [AppComponent]
})
export class AppModule { }
