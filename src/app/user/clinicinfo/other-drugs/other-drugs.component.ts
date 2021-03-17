import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgForm, FormControl } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { SortService} from 'app/shared/services/sort.service';
import { DateService } from 'app/shared/services/date.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import swal from 'sweetalert2';
import {DateAdapter} from '@angular/material/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-otherdrugs',
    templateUrl: './other-drugs.component.html',
    styleUrls: ['./other-drugs.component.scss']
})

export class OtherDrugsComponent implements OnInit, OnDestroy{
  //Variable Declaration

  @ViewChild('f') drugForm: NgForm;
  drugs: any;
  drug: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  savingDrug: boolean = false;
  addedDrug: boolean = false;
  today: any = new Date();
  startDate: any= new Date();
  numberFiles: number = 0
  lang = 'en';
  showOnlyQuestion: Boolean = true;
  isSafari:boolean = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
  isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);
  private subscription: Subscription = new Subscription();
  timeformat="";
  medicationsRelatedMedicalCare:any=[];


  constructor(private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private router: Router,private sortService: SortService, private adapter: DateAdapter<any>, private route: ActivatedRoute) {
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

    this.subscription.add( this.route.params.subscribe(params => {
        if(params['showOther']){
          this.addedDrug = true;
          this.drug = {
            type: 'Other',
            name: '',
            dose: '',
            startDate: null,
            endDate: null,
            notes: ''
          }
        }
      }));

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.drugs = [];
    if(this.drug==undefined){
      this.drug = {
        type: 'Supplements',
        name: '',
        dose: '',
        startDate: null,
        endDate: null,
        notes: ''
      }
    }


    this.loadTranslations();
    this.adapter.setLocale(this.authService.getLang());
    this.loadData();
    this.lang = this.authService.getLang();


  }

  loadData(){
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res0 : any) => {
      if(res0.listpatients.length>0){
        this.authService.setPatientList(res0.listpatients);
        this.authService.setCurrentPatient(res0.listpatients[0]);

         this.subscription.add( this.http.get(environment.api+'/api/othermedication/'+this.authService.getCurrentPatient().sub)
         .subscribe( (res : any) => {
           res.sort(this.sortService.GetSortOrder("type"));
           this.drugs = res;
           this.numberFiles = res.length
           this.getAnswer()
           this.loadMedicationsRelatedMedicalCare();
           this.loading = false;
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
    }
    if((<HTMLInputElement>yesAnswer).checked == false && (<HTMLInputElement>noAnswer).checked == true){
      answer = false;
      this.showOnlyQuestion = true
    }
    var data = {answer: answer, type: "otherDrugs", patientId: this.authService.getCurrentPatient().sub};
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
    var data = { type: "otherDrugs", patientId: this.authService.getCurrentPatient().sub};
    this.subscription.add( this.http.post(environment.api+'/api/admin/answers/getanswer/', data)
    .subscribe( (res : any) => {
      if(this.numberFiles > 0){
        let noButton = document.getElementById('noAnswer');
        (<HTMLInputElement>noButton).checked = false;
        //(<HTMLInputElement>noButton).disabled = true;
        let yesButton = document.getElementById('yesAnswer');
        (<HTMLInputElement>yesButton).checked = true;
        //(<HTMLInputElement>yesButton).disabled = true
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

  loadMedicationsRelatedMedicalCare(){
    this.medicationsRelatedMedicalCare=[];
    this.subscription.add(this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res0 : any) => {
      if(res0.listpatients.length>0){
        this.authService.setPatientList(res0.listpatients);
        this.authService.setCurrentPatient(res0.listpatients[0]);

         this.subscription.add(this.http.get(environment.api+'/api/medicalcare/'+this.authService.getCurrentPatient().sub)
         .subscribe( (res : any) => {
           if(!res.message){
              for (var j = 0; j < res.medicalCare.data.length; j++) {
                this.medicationsRelatedMedicalCare.push(res.medicalCare.data[j])
              }
           }
           this.loading = false;
          }, (err) => {
            console.log(err);
            this.loading = false;
          }))

     }else{
       swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
       this.router.navigate(['/user/basicinfo/personalinfo']);
     }
    }, (err) => {
      console.log(err);
      this.loading = false;
      this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
    }))
  }

  newDrug(){
    this.addedDrug = true;
    this.drug = {
      type: 'Supplements',
      name: '',
      dose: '',
      startDate: null,
      endDate: null,
      notes: ''
    }
  }

  cancelNewDrug(){
    this.addedDrug = false;
    this.loadData();
  }

  submitInvalidForm() {
    if (!this.drugForm) { return; }
    const base = this.drugForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  fieldchanged(){
    this.startDate = new Date(this.drug.startDate);
  }

  editDrug(index){
    this.drug = this.drugs[index];
    this.drug.startDate = this.dateService.transformDate(this.drug.startDate);
    this.drug.endDate = this.dateService.transformDate(this.drug.endDate);
    this.startDate = new Date(this.drug.startDate);
    this.addedDrug = true;
  }

  confirmDeleteDrug(index){
    var parseDate = this.dateService.transformDate(this.drugs[index].startDate);
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ this.drugs[index].name+ ' ('+  parseDate+')',
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
        this.deleteDrug(index);
        this.numberFiles--
        if(this.numberFiles == 0){
          let yesAnswer = document.getElementById('yesAnswer');
          //(<HTMLInputElement>yesAnswer).disabled = false
          let noAnswer = document.getElementById('noAnswer');
          //(<HTMLInputElement>noAnswer).disabled = false
        }
      }
    }).catch(swal.noop);
  }

  deleteDrug(index){
    if(this.authGuard.testtoken()){

      // Hay que hacer lo mismo que en medication: Comprobar si otherDrug está incluido en alguna entrada de medicalcare
      // Hay que comprobar si el medicamento tiene asociado un Medication prescribed en medicalCare
      var foundInMedicalCare=false;
      var medicalCareAssociated;
      for(var i=0;i<this.medicationsRelatedMedicalCare.length;i++){
        for (var j=0;j<this.medicationsRelatedMedicalCare[i].data.length;j++){
          if(this.medicationsRelatedMedicalCare[i].data[j].treatment!=undefined){
            if(this.drugs[index]._id==this.medicationsRelatedMedicalCare[i].data[j].treatment){
              foundInMedicalCare=true;
              medicalCareAssociated=this.medicationsRelatedMedicalCare[i];
            }
          }
        }
      }
      if(foundInMedicalCare==true){
        var sectionName;
        switch(medicalCareAssociated.name){
          case 'general':
            sectionName=this.translate.instant("medicalcare.general")
            break;
          case 'specificVisit':
            sectionName=this.translate.instant("medicalcare.specificVisit")
            break;
          case 'hospitalization':
            sectionName=this.translate.instant("medicalcare.hospitalization")
            break;
          case 'emergencies':
            sectionName=this.translate.instant("medicalcare.emergencies")
            break;
          case 'cardiotest':
            sectionName=this.translate.instant("medicalcare.cardiotest")
            break;
          case 'respiratorytests':
            sectionName=this.translate.instant("medicalcare.respiratorytests")
            break;
          case 'bonehealthtest':
            sectionName=this.translate.instant("medicalcare.bonehealthtest")
            break;
          case 'bloodtest':
            sectionName=this.translate.instant("medicalcare.bloodtest")
            break;
          case 'surgery':
            sectionName=this.translate.instant("medicalcare.surgery")
            break;
          default:
            sectionName=medicalCareAssociated[i].name
            break;

        }
        swal({
          title: this.translate.instant("generics.Are you sure?"),
          html: this.translate.instant("clinicalinfo.Medication")+" "+ this.drugs[index].name+this.translate.instant("clinicalinfo.is associated to the section of Medical Care")+sectionName+". "+this.translate.instant("clinicalinfo.Do you want to eliminate the visit as well or just the medication?"),
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#FF586B',
          confirmButtonText: this.translate.instant("clinicalinfo.Yes, delete also the visit"),
          cancelButtonText: this.translate.instant("clinicalinfo.No, delete only the medication"),
          showCloseButton: true,
          showLoaderOnConfirm: true,
          allowOutsideClick: false
        }).then(function (result){
          if (result.value==true) {
            // borrar todas las secciones que estén asociadas al medicamento (cualquier entrada)
            for(var i=0;i<this.medicationsRelatedMedicalCare.length;i++){
              if(this.medicationsRelatedMedicalCare[i]==medicalCareAssociated){
                for(var k=0;k<this.medicationsRelatedMedicalCare[i].data.length;k++){
                  if(this.drugs[index]._id==this.medicationsRelatedMedicalCare[i].data[k].treatment){
                    this.medicationsRelatedMedicalCare[i].data.splice(k, 1)
                  }
                }
              }
            }

            // Upload medicalCare
            this.subscription.add(this.http.post(environment.api+'/api/medicalcare/'+this.authService.getCurrentPatient().sub, this.medicationsRelatedMedicalCare)
            .subscribe( (res : any) => {
              if(res.message=='fail'){
                this.toastr.error('', this.translate.instant("vaccinations.It was not possible to save because the vaccine already exists on the selected date"), { showCloseButton: true });
              }else{
                this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
                this.subscription.add( this.http.delete(environment.api+'/api/othermedication/'+this.drugs[index]._id)
                .subscribe( (res : any) => {
                  if(res.message=="The drug has been deleted"){

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

            }, (err) => {
              if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
                this.authGuard.testtoken();
              }else{
                this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
              }
            }))


          }
          else if(result.dismiss=="cancel"){
            for(var i=0;i<this.medicationsRelatedMedicalCare.length;i++){
              if(this.medicationsRelatedMedicalCare[i]==medicalCareAssociated){
                for(var k=0;k<this.medicationsRelatedMedicalCare[i].data.length;k++){
                  if(this.drugs[index]._id==this.medicationsRelatedMedicalCare[i].data[k].treatment){
                    this.medicationsRelatedMedicalCare[i].data[k].treatment=undefined;
                  }
                }
              }
            }

            // Upload medicalCare
            this.subscription.add(this.http.post(environment.api+'/api/medicalcare/'+this.authService.getCurrentPatient().sub, this.medicationsRelatedMedicalCare)
            .subscribe( (res : any) => {
              if(res.message=='fail'){
                this.toastr.error('', this.translate.instant("vaccinations.It was not possible to save because the vaccine already exists on the selected date"), { showCloseButton: true });
              }else{
                this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });

              }

            }, (err) => {
              if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
                this.authGuard.testtoken();
              }else{
                this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
              }
            }))
            this.subscription.add( this.http.delete(environment.api+'/api/othermedication/'+this.drugs[index]._id)
            .subscribe( (res : any) => {
              if(res.message=="The drug has been deleted"){

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
        }.bind(this)).catch(swal.noop);
      }
      else if(foundInMedicalCare==false){
        this.subscription.add( this.http.delete(environment.api+'/api/othermedication/'+this.drugs[index]._id)
        .subscribe( (res : any) => {
          if(res.message=="The drug has been deleted"){

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
  }

  submitDrug() {
    if(this.authGuard.testtoken()){
      this.savingDrug = true;
      if(this.drug._id==null){
        this.subscription.add( this.http.post(environment.api+'/api/othermedication/'+this.authService.getCurrentPatient().sub, this.drug)
        .subscribe( (res : any) => {
          if(res.message=='fail'){
            this.toastr.error('', this.translate.instant("medication.It was not possible to save because the drug already exists on the selected date"), { showCloseButton: true });
          }else{
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
            this.addedDrug = false;
            this.loadData();
          }
          this.savingDrug = false;

         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.savingDrug = false;
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/othermedication/'+this.drug._id, this.drug)
        .subscribe( (res : any) => {
          if(res.message=='fail'){
            this.toastr.error('', this.translate.instant("medication.It was not possible to save because the drug already exists on the selected date"), { showCloseButton: true });
          }else{
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
            this.addedDrug = false;
            this.loadData();
          }
          this.savingDrug = false;

         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.savingDrug = false;
         }));
      }

    }
  }

  deleteEndDate(){
    this.drug.endDate=null;
  }

  changeDrugType(){
    this.drug.name = '';
  }

}
