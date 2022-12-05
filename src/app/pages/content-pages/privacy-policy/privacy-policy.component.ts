import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
declare let cordova: any;

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})

export class PrivacyPolicyPageComponent {
  showSecurity: boolean = false;
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

  constructor(public translate: TranslateService) {
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  back(){
    window.history.back();
  }

  back2(){
    this.showSecurity = false;
    setTimeout(function () {
        this.goTo('stepback');
    }.bind(this), 500);

  }

  goToExternalUrl(url){
    if (this.isApp) {
      cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });
    }else{
      window.open(url, '_blank');
    }
  }

  openSecurity() {
    this.showSecurity = true;
    setTimeout(function () {
        this.goTo('initposSecurity');
    }.bind(this), 200);
  }
}
