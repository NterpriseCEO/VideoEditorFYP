import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MenubarModule } from "primeng/menubar";
import { PanelModule } from "primeng/panel";
import { SplitterModule } from "primeng/splitter";
import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from "primeng/confirmdialog";

import { AppRoutingModule } from "./app-routing.module";

import { AppComponent } from "./app.component";
import { ViewsModule } from "./views/views.module";
import { ProjectFileService } from "./services/project-file-service.service";

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
	providers: [MessageService, ConfirmationService, ProjectFileService],
	bootstrap: [AppComponent]
})
export class AppModule { }
