//tracks module file
import { NgModule } from "@angular/core";
import { SanitiseUrlPipe } from "./sanitise-url";

@NgModule({
	declarations: [
		SanitiseUrlPipe
	],
	exports: [SanitiseUrlPipe],
})
export class PipesModule { }