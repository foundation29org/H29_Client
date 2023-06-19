import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Object } from 'core-js/library/web/timers';
import { TranslateService } from '@ngx-translate/core';
import { FAQ } from 'app/shared/models/faq.model';
import { LangService } from 'app/shared/services/lang.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { AuthService } from 'app/shared/auth/auth.service';
import { OpenAiService } from 'app/shared/services/openAi.service';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { Subscription } from 'rxjs/Subscription';
import * as marked from 'marked';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  providers: [OpenAiService]
})
export class FaqComponent implements OnDestroy{

  disclaimer: string;
  lang: string = '';
  langName: string = '';
  nameduchenneInter: string = globalvars.duchenneinternational;
  group: string;
  subgroup: string;
  private subscription: Subscription = new Subscription();
  query: string = '';
  queryCopy: string = '';
  callinglangchainraito: boolean = false;
  responseLangchain: string = '';

  constructor(private translate : TranslateService, private langService: LangService, private authService: AuthService, private http: HttpClient, public toastr: ToastsManager, private openAiService: OpenAiService) {

    this.lang = this.authService.getLang();
    this.loadLanguages();
    this.group = this.authService.getGroup();
    this.subgroup = this.authService.getSubgroup();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadLanguages() {
      this.subscription.add( this.langService.getLangs()
      .subscribe( (res : any) => {
        var found = false;
        for (var i = 0; i < res.length && !found; i++) {
          if(res[i].code == this.lang){
            this.langName = res[i].name;
            found = true;
          }
        }
      }));
  }

  search(){
    console.log(this.query)
    this.callinglangchainraito = true;
    var query = {"question": this.query, "lang": this.authService.getLang()};
    this.responseLangchain = '';
    this.subscription.add(this.openAiService.postOpenAi3(query)
      .subscribe((res: any) => {
        console.log(res)
        this.queryCopy = this.query;
        this.query = '';
        this.responseLangchain = res.data;
        this.callinglangchainraito = false;
        
      }, (err) => {
        this.callinglangchainraito = false;
        console.log(err);
        this.toastr.error('', this.translate.instant("generics.error try again"));
        
    }));

  }

}
