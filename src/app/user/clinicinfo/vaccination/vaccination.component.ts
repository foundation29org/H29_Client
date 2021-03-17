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
import { Subscription } from 'rxjs/Subscription';
import {DateAdapter} from '@angular/material/core';


@Component({
    selector: 'app-vaccination',
    templateUrl: './vaccination.component.html',
    styleUrls: ['./vaccination.component.scss']
})

export class VaccinationComponent implements OnInit, OnDestroy{
  //Variable Declaration

  @ViewChild('f') vaccinationForm: NgForm;
  vaccinations: any;
  vaccination: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  savingVaccination: boolean = false;
  addedVaccination: boolean = false;
  today = new Date();
  numberFiles: number = 0
  lang = 'en';
  showOnlyQuestion: Boolean = true;
  private subscription: Subscription = new Subscription();
  timeformat="";

  constructor(private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private router: Router,private adapter: DateAdapter<any>) {
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
    this.vaccinations = [];
    this.vaccination = {
      name: '',
      date: null
    }

    this.loadTranslations();
    this.loadData();
    this.lang = this.authService.getLang();

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

  loadData(){
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res0 : any) => {
      if(res0.listpatients.length>0){
        this.authService.setPatientList(res0.listpatients);
        this.authService.setCurrentPatient(res0.listpatients[0]);

         this.subscription.add( this.http.get(environment.api+'/api/vaccinations/'+this.authService.getCurrentPatient().sub)
         .subscribe( (res : any) => {
           this.vaccinations = res;
           this.numberFiles = res.length
           this.loading = false;
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
      this.showOnlyQuestion = true;
    }
    if((<HTMLInputElement>yesAnswer).checked == true && (<HTMLInputElement>noAnswer).checked == false){
      answer = true;
      this.showOnlyQuestion = false;
    }
    if((<HTMLInputElement>yesAnswer).checked == false && (<HTMLInputElement>noAnswer).checked == true){
      answer = false;
      this.showOnlyQuestion = true;
    }
    var data = {answer: answer, type: "vaccinations", patientId: this.authService.getCurrentPatient().sub};
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
    var data = { type: "vaccinations", patientId: this.authService.getCurrentPatient().sub};
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

  newVaccination(){
    this.addedVaccination = true;
    this.vaccination = {
      name: '',
      date: null
    }
  }

  cancelNewVaccination(){
    this.addedVaccination = false;
  }

  submitInvalidForm() {
    if (!this.vaccinationForm) { return; }
    const base = this.vaccinationForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }


  confirmDeleteVaccination(index){
    var parseDate = this.dateService.transformDate(this.vaccinations[index].date);
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ this.vaccinations[index].name+ ' ('+  parseDate+')',
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
        this.deleteVaccination(index);
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

  deleteVaccination(index){
    if(this.authGuard.testtoken()){

      this.subscription.add( this.http.delete(environment.api+'/api/vaccination/'+this.vaccinations[index]._id)
      .subscribe( (res : any) => {
        if(res.message=="The vaccination has been deleted"){

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

  submitNewVaccination() {

    if(this.authGuard.testtoken()){
      this.savingVaccination = true;

      this.subscription.add( this.http.post(environment.api+'/api/vaccination/'+this.authService.getCurrentPatient().sub, this.vaccination)
      .subscribe( (res : any) => {
        if(res.message=='fail'){
          this.toastr.error('', this.translate.instant("vaccinations.It was not possible to save because the vaccine already exists on the selected date"), { showCloseButton: true });
        }else{
          this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
          this.addedVaccination = false;
          this.loadData();
        }
        this.savingVaccination = false;

       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
         this.savingVaccination = false;
       }));
    }
  }

}
