import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Object } from 'core-js/library/web/timers';
import { TranslateService } from '@ngx-translate/core';
import { FaqService } from 'app/shared/services/faq.service';
import { FAQ } from 'app/shared/models/faq.model';
import { LangService } from 'app/shared/services/lang.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { Subscription } from 'rxjs/Subscription';
import * as marked from 'marked';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  providers: [FaqService]
})
export class FaqComponent implements OnDestroy{

  faqs: FAQ[];
  faqsCopy: FAQ[];
  disclaimer: string;
  lang: string = '';
  langName: string = '';
  loadedfaqs = false;
  emailAdmin: string = '';
  hasfaqs: boolean = false;
  nameduchenneInter: string = globalvars.duchenneinternational;
  group: string;
  subgroup: string;
  private subscription: Subscription = new Subscription();

  constructor(private faqService: FaqService, private translate : TranslateService, private langService: LangService, private authService: AuthService, private http: HttpClient) {
    this.loadFaqs();
    //this.faqs = faqService.faqs;
    //this.disclaimer= faqService.disclaimer;
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

  loadFaqs(){
    this.hasfaqs = false;
    this.faqs = [];
    this.disclaimer = this.translate.instant("faqs.disclaimer");
    var paramssend = { lang: this.authService.getLang(), group: this.authService.getGroup() };
    this.subscription.add( this.http.get(environment.api+'/api/qna',{params: paramssend})
    .subscribe( (res0 : any) => {
      if(res0.knowledgeBaseID){//res.knowledgeBaseID
        //una vez obtenido el KnowledgeBaseID, obtener las preguntas y respuestas
        this.subscription.add( this.faqService.loadDataknowledgeBaseID(res0.knowledgeBaseID)
        .subscribe( (res : any) => {
          if(res.qnaDocuments){
            if(res.qnaDocuments.length>0){
              this.hasfaqs = true;
            }else{
              this.hasfaqs = false;
            }
          }

          for(var ob in res.qnaDocuments){
            if((res.qnaDocuments[ob].answer).indexOf('[')!=-1){
              const markdownHtml = marked(res.qnaDocuments[ob].answer);
              res.qnaDocuments[ob].answer=markdownHtml;
            }
            let faq  = new FAQ(Number(ob), res.qnaDocuments[ob].questions[0], res.qnaDocuments[ob].answer, null);
            if(res.qnaDocuments[ob].questions[0]!=""){
              this.faqs.push(faq);
            }
         }
          this.faqsCopy=this.faqs;
          this.loadedfaqs = true;
         }, (err) => {
          this.loadedfaqs = true;
        }));
      }else{
        this.loadedfaqs = true;

        //load adminGroup
        this.subscription.add( this.http.get(environment.api+'/api/groupadmin/'+this.authService.getGroup())
        .subscribe( (res : any) => {
          this.emailAdmin = res.email;
         }, (err) => {
           console.log(err);
         }));
        //this.faqs = null;
      }


     }, (err) => {
       console.log(err);
     }));
  }


  filter(searchValue: string) {

    if(searchValue === '')
    {
      this.faqs = this.faqsCopy;
    }
    else{
      this.faqs = this.faqs.filter((faqs: FAQ) => faqs.title.toUpperCase().indexOf(searchValue.toUpperCase()) != -1 ||  faqs.content.toUpperCase().indexOf(searchValue.toUpperCase()) != -1 );
    }
  }

}
