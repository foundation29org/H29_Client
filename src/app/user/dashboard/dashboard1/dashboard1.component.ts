import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { globalvars } from 'app/shared/global-variables';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
//import * as BotChat from "botframework-webchat";
import { Subscription } from 'rxjs/Subscription';

declare let cordova: any;

@Component({
    selector: 'app-dashboard1',
    templateUrl: './dashboard1.component.html',
    styleUrls: ['./dashboard1.component.scss']
})

export class Dashboard1Component implements OnDestroy{
  group: string;
  subgroup: string;
  nameduchenneInter: string = globalvars.duchenneinternational;
  namediabetes: string = 'Diabetes';
  nameundiagnosed: string = 'Undiagnosed';

  userId: string = '';
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  lang: string = 'en';
  urlimg: string = 'assets/img/Duchenne_en.jpg';
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private sanitizer: DomSanitizer, private router: Router){
     this.group = this.authService.getGroup();
     this.subgroup = this.authService.getSubgroup();
     this.userId = this.authService.getIdUser();
     this.lang = this.authService.getLang();
     this.urlimg = 'assets/img/Duchenne_'+this.lang+'.jpg';
     window.scrollTo(0, 0)
  }

    goToExternalUrl(url){
  		if (this.isApp) {
        cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });
  		}else{
  			window.open(url, '_blank');
  		}
    };


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
