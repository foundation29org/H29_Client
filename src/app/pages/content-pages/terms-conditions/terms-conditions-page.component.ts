import { Component, OnInit } from '@angular/core';
import { globalvars } from 'app/shared/global-variables';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
declare let cordova: any;

@Component({
    selector: 'app-terms-conditions-page',
    templateUrl: './terms-conditions-page.component.html',
    styleUrls: ['./terms-conditions-page.component.scss']
})

export class TermsConditionsPageComponent implements OnInit{
  showSecurity: boolean = false;
  role: string = '';
  group: string = '';
  duchenneinternational: string = globalvars.duchenneinternational;
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  constructor(public activeModal: NgbActiveModal, public translate: TranslateService, private modalService: NgbModal) {
    setTimeout(function () {
        this.goTo('initpos');
    }.bind(this), 500);

  }

  ngOnInit() {
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  openSecurity() {
    this.showSecurity = true;
    setTimeout(function () {
        this.goTo('initposSecurity');
    }.bind(this), 200);
  }

  back(){
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
}
