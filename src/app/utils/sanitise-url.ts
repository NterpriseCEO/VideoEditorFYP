import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
//Bypasses security checks for URLs
@Pipe({name: "sanitiseUrl"})
export class SanitiseUrlPipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) {}

	transform(url): SafeUrl {
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}
}