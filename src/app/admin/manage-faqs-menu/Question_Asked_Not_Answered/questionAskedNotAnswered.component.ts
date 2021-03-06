import { Component, ViewChild, ViewEncapsulation, OnDestroy} from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { LangService } from 'app/shared/services/lang.service';
import { FaqService } from 'app/shared/services/faq.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
import { addMinutes } from 'date-fns';
import { Router } from '@angular/router';
import { Data} from 'app/shared/services/data.service';
import {DateAdapter} from '@angular/material/core';



import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'app-question-asked-not-answered',
    templateUrl: './questionAskedNotAnswered.component.html',
    styleUrls: ['./questionAskedNotAnswered.component.scss'],
    providers: [LangService, FaqService],
    encapsulation: ViewEncapsulation.None
})

export class QuestionAskedNotAnsweredComponent implements OnDestroy{

  private subscription: Subscription = new Subscription();

  FAQsNotAnswered: any = [];
  FAQsNotAnsweredCopy: any = [];
  groupId: any;
  modalReference: NgbModalRef;
  isLoading: boolean = false;
  filterActive: boolean = false;
  filterScoreActive: boolean = false;
  filterLanguageActive: boolean =false;
  filterElementsList: any = [];
  dataQNA: any =[];
  timeformat="";


  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, private langService: LangService, private faqService: FaqService, public toastr: ToastsManager, private modalService: NgbModal, private router: Router, private data: Data,private adapter: DateAdapter<any>){
      this.getNotAnsweredFAQs();
      this.adapter.setLocale(this.authService.getLang());
      switch(this.authService.getLang()){
        case 'en':
          this.timeformat="M/d/yy";
          break;
        case 'es':
            this.timeformat="d/M/yy";
            break;
        case 'nl':
            this.timeformat="d-M-yy";
            break;
        default:
            this.timeformat="M/d/yy";
            break;

      }
    }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Functions for get the FAQs
  getNotAnsweredFAQs(){
    this.FAQsNotAnswered=[];
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        this.groupId = resGroup._id;
        //this.subscription.add((this.http.get(environment.api+'/api/bots/'+this.groupId),{params:this.authService.getToken})
        this.subscription.add(this.http.get(environment.api+'/api/bots/'+this.groupId)
        .subscribe( (res : any) => {
            this.FAQsNotAnswered=res;
            this.isLoading=false;
          }, (err) => {
            this.isLoading=false;
            console.log(err);
        }));
      }));

  }

  //Functions for delete suggested FAQ
  deleteSuggestedQuestion(dataJSON){
    this.isLoading=true;

    let id= dataJSON._id;
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        this.groupId = resGroup._id;
        var paramssend = {id:id};
        this.subscription.add(this.http.delete((environment.api+'/api/bots/'+ this.groupId), {"params":paramssend})
          .subscribe( (res : any) => {
            //this.showPanelNewQnAPairs = false;
            this.getNotAnsweredFAQs();
            return;
            //this.showPanelNewQnAPairs = true;


          }, (err) => {
            this.isLoading=false;
            console.log(err);
          }));
      }));

  }

  confirmDeleteFAQQuestion(dataJSON){
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ dataJSON.data[1].userQuestion,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#FF586B',
        confirmButtonText: this.translate.instant("generics.Delete"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        if (result.value == true){
          this.deleteSuggestedQuestion(dataJSON);
        }
        //this.phenotype.data.splice(index, 1);
      }
    }).catch(swal.noop);
  }


  //Funtions for include the FAQs
  includeFAQs(dataJSON:any){
    let userQuestion = dataJSON.data[1].userQuestion;
    //this.data.storage = {medicalCareSections: userQuestion, showPanelNewQnAPairs : true};
    //this.router.navigate(['admin/managefaqs/managefaqs']);

    this.router.navigate(['/admin/managefaqs/managefaqs'], { queryParams: { showPanelNewQnAPairs : true, userQuestion:userQuestion } })
  }


  openPanelEditCuratedBy(QNA, ContentEditCuratedBy){
    this.dataQNA = QNA;
    this.modalReference = this.modalService.open(ContentEditCuratedBy);
  }

  saveDataQNA(){
    this.subscription.add(this.http.put((environment.api+'/api/bots/'+ this.dataQNA._id), this.dataQNA)
      .subscribe( (res : any) => {
      }, (err) => {
        console.log(err);
      }));

      this.modalReference.close();

  }

  //Functions for filter

  openPanelSelectFilter(contentFilter){
    //Abrira la ventana emergente mostrando dos entradas de texto: valor minimo y valor maximo de score
    let ngbModalOptions: NgbModalOptions = {
      backdrop : 'static',
      keyboard : false
    };
    this.modalReference = this.modalService.open(contentFilter, ngbModalOptions);

  }

  applyFilter(valueScoreMin,valueScoreMax){
    this.filterElementsList=[];

    this.filterActive = true;
    this.filterScoreActive = true;
    if(valueScoreMin==undefined){valueScoreMin="0";}
    if(valueScoreMax==undefined){valueScoreMax="100";}

    // Copy all FAQs in a internal variable (Avoid calls to the database when the filter is deleted)
    this.FAQsNotAnsweredCopy = this.FAQsNotAnswered;

    for (var i= 0; i< this.FAQsNotAnswered.length;i++){
      if(((JSON.parse(JSON.stringify(this.FAQsNotAnswered[i].data[0].answers[0].score)))>=valueScoreMin)&&((JSON.parse(JSON.stringify(this.FAQsNotAnswered[i].data[0].answers[0].score)))<=valueScoreMax)){
        this.filterElementsList.push(this.FAQsNotAnswered[i]);
      }
    }
    this.FAQsNotAnswered=[];
    this.FAQsNotAnswered=this.filterElementsList;
    this.modalReference.close();

  }

  removeFilter(){
    this.FAQsNotAnswered=[];
    this.FAQsNotAnswered=this.FAQsNotAnsweredCopy;
    this.FAQsNotAnsweredCopy=[];
    this.filterActive=false;
    this.filterScoreActive=false;
    this.filterLanguageActive=false;

  }

  applyFilterLang(language){

    this.filterElementsList=[];

    this.filterActive = true;
    this.filterLanguageActive=true;


    // Copy all FAQs in a internal variable (Avoid calls to the database when the filter is deleted)
    this.FAQsNotAnsweredCopy = this.FAQsNotAnswered;

    for (var i= 0; i< this.FAQsNotAnswered.length;i++){
      if((JSON.parse(JSON.stringify(this.FAQsNotAnswered[i].lang)))==language){
        this.filterElementsList.push(this.FAQsNotAnswered[i]);
      }
    }
    this.FAQsNotAnswered=[];
    this.FAQsNotAnswered=this.filterElementsList;
    this.modalReference.close();

  }

}
