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
import swal from 'sweetalert2';

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

  groupId: string;

  constructor(private translate : TranslateService, private langService: LangService, private authService: AuthService, private http: HttpClient, public toastr: ToastsManager, private openAiService: OpenAiService) {

    this.lang = this.authService.getLang();
    this.loadLanguages();
    this.group = this.authService.getGroup();
    this.subgroup = this.authService.getSubgroup();
    this.initEnvironment();
  }

  initEnvironment(){
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        this.groupId = resGroup._id;
      }, (err) => {
        console.log(err);
      }));
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

  sendFeedback(valueVote){
    var data = {"answer": this.responseLangchain,"userQuestion":this.queryCopy,"value": valueVote};
    var info = {
      "lang":this.lang,
      "data":data,
      "type": "qna",
      "user":this.authService.getIdUser()
    }
    this.subscription.add(this.http.post((environment.api+'/api/bot/'+ this.groupId), info)
      .subscribe( (res : any) => {
        swal({
          type: 'success',
          html: this.translate.instant("faqs.thanksvote")
        })
      }, (err) => {
        console.log(err);
      }));
  }

}
