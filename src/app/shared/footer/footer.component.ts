import { Component, HostBinding } from '@angular/core';
declare let cordova: any;
@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})

export class FooterComponent{
    //Variables
    currentDate : Date = new Date();
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

    goToExternalUrl(url){
      if (this.isApp) {
        cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });
      }else{
        window.open(url, '_blank');
      }
    }
}
