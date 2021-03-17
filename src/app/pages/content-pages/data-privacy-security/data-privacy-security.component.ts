import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
declare let cordova: any;

@Component({
    selector: 'app-data-privacy-security',
    templateUrl: './data-privacy-security.component.html',
    styleUrls: ['./data-privacy-security.component.scss']
})

export class DataPrivacySecurityPageComponent {
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  constructor(public translate: TranslateService) {
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  back(){
    window.history.back();
  }

  goToExternalUrl(url){
    if (this.isApp) {
      cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });
    }else{
      window.open(url, '_blank');
    }
  }

}
