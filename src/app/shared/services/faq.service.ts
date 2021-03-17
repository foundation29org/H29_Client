import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { FAQ } from 'app/shared/models/faq.model';



@Injectable()
export class FaqService {

    public disclaimer: string;
    public faqs: FAQ[] = [];

    constructor(public translate : TranslateService, private authService: AuthService, private http: HttpClient) {}

    loadDataknowledgeBaseID(knowledgeBaseID: any){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.f29api+'/api/knowledgebases/'+knowledgeBaseID+'/Prod/qna')
      .map( (res : any) => {
          for(var ob in res.qnaDocuments){
            let faq  = new FAQ(Number(ob), res.qnaDocuments[ob].questions[0], res.qnaDocuments[ob].answer,res.qnaDocuments[ob].metadata);
            if(res.qnaDocuments[ob].questions[0]!=""){
              this.faqs.push(faq);
            }
         }
            return res;
         }, (err) => {
           console.log(err);
           return {};
         })
    }

}
