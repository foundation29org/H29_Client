import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LangService } from 'app/shared/services/lang.service';
import { Subscription } from 'rxjs/Subscription';
import { AuthService } from 'app/shared/auth/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-navbar-nolog',
    templateUrl: './navbar-nolog.component.html',
    styleUrls: ['./navbar-nolog.component.scss'],
    providers: [LangService]
})

export class NavbarComponentNolog implements OnDestroy{
    currentLang = 'en';
    toggleClass = 'ft-maximize';
    langs: any;
    title: any;
    private subscription: Subscription = new Subscription();

    constructor(public translate: TranslateService, private langService:LangService,private authService: AuthService, private titleService: Title) {
      this.translate.use('en');
      this.loadLanguages();
      this.title= this.titleService
    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    loadLanguages() {
        this.subscription.add( this.langService.getLangs()
        .subscribe( (res : any) => {
          this.langs=res;
          if(sessionStorage.getItem('lang')){
            this.translate.use(sessionStorage.getItem('lang'));
          }else{
            const browserLang: string = this.translate.getBrowserLang();
            var foundlang = false;
            for(let lang of this.langs) {
              if(browserLang.match(lang.code)){
                this.translate.use(lang.code);
                foundlang = true;
              }
            }
          }

         }, (err) => {
           console.log(err);
         }));
    }


    ChangeLanguage(language: string) {
        this.authService.setLang(language);
        this.translate.use(language);
        //location.reload();
    }

}
