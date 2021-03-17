import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import swal from 'sweetalert2';
import {DateAdapter} from '@angular/material/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-clinicalTrials',
    templateUrl: './clinical-trials.component.html',
    styleUrls: ['./clinical-trials.component.scss']
})

export class ClinicalTrialsComponent implements OnInit, OnDestroy{
  //Variable Declaration
  @ViewChild('f') clinicalTrialForm: NgForm;
  listClinicalTrials: any;
  clinicalTrial: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  saving: boolean = false;
  showOnlyQuestion: boolean = false
  numberFiles: number = 0
  addedClinicalTrial: boolean = false;
  today = new Date();
  isSafari:boolean = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
  isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);
  private subscription: Subscription = new Subscription();
  timeformat="";

  constructor(private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private router: Router, private adapter: DateAdapter<any>) {
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

  ngOnInit() {
    this.listClinicalTrials = [];
    this.clinicalTrial = {
      nameClinicalTrial: '',
      takingClinicalTrial: '',
      drugName: '',
      center: '',
      date: null
    }

    this.loadTranslations();
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
    this.loadData();

  }

  loadData(){
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res0 : any) => {
      if(res0.listpatients.length>0){
        this.authService.setPatientList(res0.listpatients);
        this.authService.setCurrentPatient(res0.listpatients[0]);

         this.subscription.add( this.http.get(environment.api+'/api/clinicaltrial/'+this.authService.getCurrentPatient().sub)
         .subscribe( (res : any) => {
           this.listClinicalTrials = res;
           this.loading = false;
           this.numberFiles = this.listClinicalTrials.length
           this.getAnswer()
          }, (err) => {
            console.log(err);
            this.loading = false;
          }));
     }else{
       swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
       this.router.navigate(['/user/basicinfo/personalinfo']);
     }
   }, (err) => {
     console.log(err);
     this.loading = false;
     this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
   }));
  }

//stats questions
setAnswer(event){
  let yesAnswer = document.getElementById('yesAnswer');
  //var yesAnswerChecked = (<HTMLInputElement>yesAnswer).checked;
  let noAnswer = document.getElementById('noAnswer');
  //var noAnswerChecked = (<HTMLInputElement>noAnswer).checked;

  //exclusive checkBox
  if((<HTMLInputElement>yesAnswer).checked == true && (<HTMLInputElement>noAnswer).checked == true){
    this.changeCheck(event.target.attributes.id.nodeValue)
  }
  //set answer
  var answer
  if((<HTMLInputElement>yesAnswer).checked == false && (<HTMLInputElement>noAnswer).checked == false){
    answer = 'not answered';
    this.showOnlyQuestion = true
  }
  if((<HTMLInputElement>yesAnswer).checked == true && (<HTMLInputElement>noAnswer).checked == false){
    answer = true;
    this.showOnlyQuestion = false
    if(this.addedClinicalTrial==false){
      this.newClinicalTrial();
    }
  }
  if((<HTMLInputElement>yesAnswer).checked == false && (<HTMLInputElement>noAnswer).checked == true){
    answer = false;
    this.showOnlyQuestion = true
  }
  var data = {answer: answer, type: "clinicaltrials", patientId: this.authService.getCurrentPatient().sub};
  this.subscription.add( this.http.post(environment.api+'/api/admin/answers/setanswers', data)
  .subscribe( (res : any) => {
  }))
}

changeCheck(buttonId){
  if(buttonId == 'yesAnswer'){
    let checkButton = document.getElementById('noAnswer');
    (<HTMLInputElement>checkButton).checked = !(<HTMLInputElement>checkButton).checked;
  }
  if(buttonId == 'noAnswer'){
    let checkButton = document.getElementById('yesAnswer');
    (<HTMLInputElement>checkButton).checked = !(<HTMLInputElement>checkButton).checked;
  }
}

getAnswer(){
  var data = { type: "clinicaltrials", patientId: this.authService.getCurrentPatient().sub};
  this.subscription.add( this.http.post(environment.api+'/api/admin/answers/getanswer/', data)
  .subscribe( (res : any) => {
    if(this.numberFiles > 0){
      let noButton = document.getElementById('noAnswer');
      (<HTMLInputElement>noButton).checked = false;
      (<HTMLInputElement>noButton).disabled = true;
      let yesButton = document.getElementById('yesAnswer');
      (<HTMLInputElement>yesButton).checked = true;
      (<HTMLInputElement>yesButton).disabled = true
      this.showOnlyQuestion = false;
    }
    else{
      if(res.answer == true){
        let noButton = document.getElementById('noAnswer');
        (<HTMLInputElement>noButton).checked = false;
        //(<HTMLInputElement>noButton).disabled = true;
        let yesButton = document.getElementById('yesAnswer');
        (<HTMLInputElement>yesButton).checked = true;
        //(<HTMLInputElement>yesButton).disabled = true
        this.showOnlyQuestion = false;
      }
      else if (res.answer == false){
        let noButton = document.getElementById('noAnswer');
        (<HTMLInputElement>noButton).checked = true;
        let yesButton = document.getElementById('yesAnswer');
        (<HTMLInputElement>yesButton).checked = false;
        this.showOnlyQuestion = true;
      }
      else{
        let noButton = document.getElementById('noAnswer');
        (<HTMLInputElement>noButton).checked = false;
        let yesButton = document.getElementById('yesAnswer');
        (<HTMLInputElement>yesButton).checked = false;
        this.showOnlyQuestion = true;
      }
    }
  }))
}

  //traducir cosas
  loadTranslations(){
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk=res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
    });
  }

  newClinicalTrial(){
    this.addedClinicalTrial = true;
    this.clinicalTrial = {
      nameClinicalTrial: '',
      takingClinicalTrial: '',
      drugName: '',
      center: '',
      date: null
    }
  }

  cancelNewClinicalTrial(){
    this.addedClinicalTrial = false;
  }

  submitInvalidForm() {
    if (!this.clinicalTrialForm) { return; }
    const base = this.clinicalTrialForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  editClinicalTrial(index){
    //this.editingIndexSe = index;
    //this.editingSe = true;
    this.clinicalTrial = JSON.parse(JSON.stringify(this.listClinicalTrials[index]));
    this.clinicalTrial.date=this.dateService.transformDate(this.clinicalTrial.date);
    this.addedClinicalTrial = true;
  }

  confirmDeleteClinicalTrial(index){
    var parseDate = this.dateService.transformDate(this.listClinicalTrials[index].date);
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ this.listClinicalTrials[index].nameClinicalTrial+ ' ('+  parseDate+')',
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
        this.deleteClinicalTrial(index);
        this.numberFiles--
        if(this.numberFiles == 0){
          let yesAnswer = document.getElementById('yesAnswer');
          (<HTMLInputElement>yesAnswer).disabled = false
          let noAnswer = document.getElementById('noAnswer');
          (<HTMLInputElement>noAnswer).disabled = false
        }
      }
    }).catch(swal.noop);
  }

  deleteClinicalTrial(index){
    if(this.authGuard.testtoken()){
      this.subscription.add( this.http.delete(environment.api+'/api/clinicaltrial/'+this.listClinicalTrials[index]._id)
      .subscribe( (res : any) => {
          if(res.message=="The clinicalTrial has been deleted"){
            this.toastr.success('', this.translate.instant("generics.It has been successfully removed"), { showCloseButton: true });
            this.loadData();
          }
       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
       }));
     }
  }

  submitNewClinicalTrial() {

    if(this.authGuard.testtoken()){
      this.saving = true;
      if(this.clinicalTrial._id==null){
        this.subscription.add( this.http.post(environment.api+'/api/clinicaltrial/'+this.authService.getCurrentPatient().sub, this.clinicalTrial)
        .subscribe( (res : any) => {
          if(res.message=='fail'){
            this.toastr.error('', this.translate.instant("vaccinations.It was not possible to save because the vaccine already exists on the selected date"), { showCloseButton: true });
          }else{
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
            this.addedClinicalTrial = false;
            this.loadData();
          }
          this.saving = false;

         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.saving = false;
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/clinicaltrial/'+this.clinicalTrial._id, this.clinicalTrial)
        .subscribe( (res : any) => {
          if(res.message=='fail'){
            this.toastr.error('', this.translate.instant("vaccinations.It was not possible to save because the vaccine already exists on the selected date"), { showCloseButton: true });
          }else{
            var data = {answer: true, type: "clinicaltrials", patientId: this.authService.getCurrentPatient().sub};
            this.subscription.add( this.http.post(environment.api+'/api/admin/answers/setanswers', data)
            .subscribe( (res : any) => {
              this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
              this.addedClinicalTrial = false;
              this.loadData();
            }))

          }
          this.saving = false;

         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.saving = false;
         }));
      }

    }
  }

}
