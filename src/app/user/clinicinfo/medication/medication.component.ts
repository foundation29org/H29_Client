import { Component, ViewChild, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgForm, FormControl } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { Data} from 'app/shared/services/data.service';
import swal from 'sweetalert2';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {DateAdapter} from '@angular/material/core';
import { SortService} from 'app/shared/services/sort.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-medication',
    templateUrl: './medication.component.html',
    styleUrls: ['./medication.component.scss']
})

export class MedicationComponent implements OnInit, OnDestroy{
  //Variable Declaration
  date = new FormControl(new Date());
  serializedDate = new FormControl((new Date()).toISOString());
  isSafari:boolean = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  @ViewChild('f') medicationForm: NgForm;
  medications: any;
  medication: any;
  actualMedication: any;
  actualMedications: any;
  oldMedications: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  numberFiles: number = 0
  loading: boolean = false;
  sending: boolean = false;
  viewMedicationForm: boolean = false;
  loadingDataGroup: boolean = false;
  dataGroup: any;
  drugsLang: any;
  sideEffectsLang: any;
  adverseEffectsLang: any;
  locale: string;
  panelMedication: boolean = false;
  drugSelected: string = '';
  historyDrugSelected: any = [];
  viewMeditationSection: boolean = false;
  modalReference: NgbModalRef;
  today = new Date();
  startDate = new Date();
  minDateChangeDose = new Date();
  visit: any;
  indexvisit: any = null;
  section : any = null;
  newTreatment: boolean = false;
  private subscription: Subscription = new Subscription();
  showOnlyQuestion: Boolean = true;
  timeformat="";
  medicationsRelatedMedicalCare:any=[];
  constructor(private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private router: Router, private route: ActivatedRoute, private modalService: NgbModal,
    private data: Data, private adapter: DateAdapter<any>, private sortService: SortService) {
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
    this.locale = this.authService.getLang();
    this.medications = [];
    this.actualMedications = [];
    this.oldMedications = [];

    this.medication = {
    };

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
    this.loadTranslationsElements();

    //cargar los datos del usuario
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      if(res.listpatients.length>0){
        this.authService.setPatientList(res.listpatients);
        this.authService.setCurrentPatient(res.listpatients[0]);
      }else{
        swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
        this.router.navigate(['/user/basicinfo/personalinfo']);
      }
     }, (err) => {
       console.log(err);
       this.loading = false;
     }));


    //coger parámetros por si viene de modulo de visitas
    this.subscription.add( this.route.params.subscribe(params => {
      this.newTreatment = params['newTreatment'];
      if(this.newTreatment){
        if(this.data.storage!=undefined){
          this.visit = this.data.storage;
          this.indexvisit = this.data.storage.index;
          this.section = this.data.storage.section;
          this.newMedication();
          /*if(this.editingPhenotype){
            this.editPhenotype();
          }*/
        }
      }
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
  var data = {answer: answer, type: "drugs", patientId: this.authService.getCurrentPatient().sub};
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
    var data = { type: "drugs", patientId: this.authService.getCurrentPatient().sub};
      this.subscription.add( this.http.post(environment.api+'/api/admin/answers/getanswer/', data)
      .subscribe( (res : any) => {
        if(this.numberFiles > 0){
          let noButton = document.getElementById('noAnswer');
          if(noButton != null){
            (<HTMLInputElement>noButton).checked = false;
            (<HTMLInputElement>noButton).disabled = true;
          }
          let yesButton = document.getElementById('yesAnswer');
          if(yesButton != null){
            (<HTMLInputElement>yesButton).checked = true;
            (<HTMLInputElement>yesButton).disabled = true;
            this.showOnlyQuestion = false;
          }

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

  loadMedications(){
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res0 : any) => {
      if(res0.listpatients.length>0){
        this.authService.setPatientList(res0.listpatients);
        this.authService.setCurrentPatient(res0.listpatients[0]);

         this.subscription.add( this.http.get(environment.api+'/api/medications/'+this.authService.getCurrentPatient().sub)
         .subscribe( (res : any) => {
           this.medications = res;
           this.numberFiles = res.length

           this.getAnswer()
           this.searchTranslationDrugs();
           //agrupar entre actuales y antiguas
           this.groupMedications();
           if(this.drugSelected){
             this.loadHistoryDrugSelected()
           }
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

  groupMedications(){
    this.actualMedications = [];
    this.oldMedications = [];
    for(var i = 0; i < this.medications.length; i++) {
      if(!this.medications[i].endDate){
        this.actualMedications.push(this.medications[i]);
      }else{
        var medicationFound = false;
        if(this.actualMedications.length>0){
          for(var j = 0; j < this.actualMedications.length && !medicationFound; j++) {
            if(this.medications[i].drug == this.actualMedications[j].drug){
              medicationFound = true;
            }
          }
        }

        if(!medicationFound){
          if(this.oldMedications.length>0){
            for(var j = 0; j < this.oldMedications.length && !medicationFound; j++) {
              if(this.medications[i].drug == this.oldMedications[j].drug){
                medicationFound = true;
              }
            }
          }
        }
        if(!medicationFound){
          this.oldMedications.push(this.medications[i]);
        }

      }
    }
  }

  loadTranslationsElements(){

    this.loadingDataGroup = true;
    this.subscription.add( this.http.get(environment.api+'/api/group/medications/'+this.authService.getGroup())
    .subscribe( (res : any) => {
      if(res.medications.data.length == 0){
        //no tiene datos sobre el grupo
      }else{
        this.dataGroup = res.medications.data;
        this.drugsLang = [];
        this.sideEffectsLang = [];
        this.adverseEffectsLang = [];
        if(this.dataGroup.drugs.length>0){
          for(var i = 0; i < this.dataGroup.drugs.length; i++) {
            var found = false;
            for(var j = 0; j < this.dataGroup.drugs[i].translations.length && !found; j++) {
                if(this.dataGroup.drugs[i].translations[j].code == this.authService.getLang()){
                  if(this.dataGroup.drugs[i].drugsSideEffects!=undefined){
                    this.drugsLang.push({name:this.dataGroup.drugs[i].name, translation: this.dataGroup.drugs[i].translations[j].name, drugsSideEffects: this.dataGroup.drugs[i].drugsSideEffects});
                  }else{
                    this.drugsLang.push({name:this.dataGroup.drugs[i].name, translation: this.dataGroup.drugs[i].translations[j].name});
                  }
                  found = true;
                }
            }
          }
          this.drugsLang.sort(this.sortService.GetSortOrder("translation"));

        }

        if(this.dataGroup.sideEffects.length>0){
          for(var i = 0; i < this.dataGroup.sideEffects.length; i++) {
            var found = false;
            for(var j = 0; j < this.dataGroup.sideEffects[i].translationssideEffect.length && !found; j++) {
                if(this.dataGroup.sideEffects[i].translationssideEffect[j].code == this.authService.getLang()){
                    this.sideEffectsLang.push({name: this.dataGroup.sideEffects[i].name, translation: this.dataGroup.sideEffects[i].translationssideEffect[j].name});
                    found = true;
                }
            }
          }
        }

          /*if(this.dataGroup.adverseEffects.length>0){
            for(var i = 0; i < this.dataGroup.adverseEffects.length; i++) {
              var found = false;
              for(var j = 0; j < this.dataGroup.adverseEffects[i].translationsadverseEffect.length && !found; j++) {
                  if(this.dataGroup.adverseEffects[i].translationsadverseEffect[j].code == this.authService.getLang()){
                      this.adverseEffectsLang.push({name: this.dataGroup.adverseEffects[i].name, translation: this.dataGroup.adverseEffects[i].translationsadverseEffect[j].name});
                      found = true;
                  }
              }
            }
          }*/


      }
      this.loadingDataGroup = false;
      this.loadMedications();
     }, (err) => {
       console.log(err);
       this.loadingDataGroup = false;
       this.loadMedications();
     }));

  }

  searchTranslationDrugs(){
    for(var i = 0; i < this.medications.length; i++) {
      var foundTranslation = false;
      for(var j = 0; j < this.drugsLang.length && !foundTranslation; j++) {
        if(this.drugsLang[j].name == this.medications[i].drug){
          for(var k = 0; k < this.drugsLang[j].translation.length && !foundTranslation; k++) {
            this.medications[i].drugTranslate = this.drugsLang[j].translation;
            foundTranslation = true;
          }
        }
      }
    }
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

  changeDose(medication, customContent){
    this.medication = {};
    this.medication = JSON.parse(JSON.stringify(medication));
    this.medication.startDate = this.dateService.transformDate(medication.startDate);
    this.medication.endDate = this.dateService.transformDate(medication.endDate);
    this.medication.startDate = null;
    this.minDateChangeDose = new Date(medication.startDate);
    this.modalReference = this.modalService.open(customContent);
  }

  onSubmitNewDose() {
    if(this.authGuard.testtoken()){
      this.sending = true;
      //this.http.put(environment.api+'/api/medication/newdose/'+this.medication._id, this.medication)
      //var paramssend = { medicationId: this.medication._id, patientId: this.authService.getCurrentPatient().sub };
      var paramssend = this.medication._id+'-code-'+this.authService.getCurrentPatient().sub;
      this.subscription.add( this.http.put(environment.api+'/api/medication/newdose/'+paramssend, this.medication)

      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
          this.sending = false;
          this.modalReference.close();
          if(this.visit!=undefined){
            this.visit.medicalCareSections[this.section].data[this.indexvisit].treatment = res.medication._id;
            this.data.storage = this.visit;
            this.router.navigate(["/user/clinicinfo/medicalcare"]);
          }else{
            this.viewMedicationForm = false;
            this.loadMedications();
          }
       }, (err) => {
         this.modalReference.close();
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
         this.sending = false;
         this.viewMedicationForm = false;
       }));
    }
  }

  stopTaking(medication, customContent){
    this.medication = {};
    this.medication = JSON.parse(JSON.stringify(medication));
    this.medication.startDate = this.dateService.transformDate(medication.startDate);
    this.medication.endDate = this.dateService.transformDate(medication.endDate);
    this.medication.startDate = null;
    this.minDateChangeDose = new Date(medication.startDate);
    this.modalReference = this.modalService.open(customContent);
  }

  onSubmitStopTaking() {

    if(this.authGuard.testtoken()){
      this.sending = true;
      //this.http.put(environment.api+'/api/medication/newdose/'+this.medication._id, this.medication)
      //var paramssend = { medicationId: this.medication._id, patientId: this.authService.getCurrentPatient().sub };

      this.subscription.add( this.http.put(environment.api+'/api/medication/stoptaking/'+this.medication._id, this.medication)

      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
          this.sending = false;
          this.viewMedicationForm = false;
          this.loadMedications();
          this.modalReference.close();
       }, (err) => {
         this.modalReference.close();
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
         this.sending = false;
         this.viewMedicationForm = false;
       }));
    }
  }

  newMedication(){
    this.viewMeditationSection = true;
    this.medication = {};
    this.actualMedication = {};
    this.historyDrugSelected = [];
    this.panelMedication = true;
    this.drugSelected = '';
    this.viewMedicationForm = false;
  }

  updateMedication(medication){
    this.drugSelected = medication.drug;
    this.findSideEffects();
    //this.drugSelected.translation =medication.drugTranslate;
    //this.drugSelected = {name: medication.drug, translation: medication.drugTranslate};
    this.medication = medication;
    this.medication.startDate = this.dateService.transformDate(medication.startDate);
    this.medication.endDate = this.dateService.transformDate(medication.endDate);
    this.loadHistoryDrugSelected();
    this.viewMeditationSection = true;

    //this.viewMedicationForm = true;
    this.panelMedication = true;
  }

  back(){
      this.viewMeditationSection = false;
      this.viewMedicationForm = false;
      this.getAnswer()
  }

  onChangeDrug(value){
    //comprobar si es un medicamento actual o antiguo, si no es ninguno de los dos, mostrar el formulario
    this.findSideEffects();


    this.medication = {};
    this.medication.drug = this.drugSelected;
    this.medication.endDate = null;
    this.loadHistoryDrugSelected();
    this.viewMedicationForm = false;
    //this.viewMedicationForm = true;
  }

  findSideEffects(){
    var enc= false;
    this.sideEffectsLang = [];
    for(var i = 0; i < this.drugsLang.length && !enc; i++) {
      if(this.drugSelected == this.drugsLang[i].name){
        if(this.drugsLang[i].drugsSideEffects!=undefined){
          if(this.dataGroup.sideEffects.length>0){
            for(var j = 0; j < this.dataGroup.sideEffects.length; j++) {
              for(var posi = 0; posi < this.drugsLang[i].drugsSideEffects.length; posi++) {
                if(this.drugsLang[i].drugsSideEffects[posi]==this.dataGroup.sideEffects[j].name){
                  var found = false;
                  for(var k = 0; k < this.dataGroup.sideEffects[j].translationssideEffect.length && !found; k++) {
                      if(this.dataGroup.sideEffects[j].translationssideEffect[k].code == this.authService.getLang()){
                          this.sideEffectsLang.push({name: this.dataGroup.sideEffects[j].name, translation: this.dataGroup.sideEffects[j].translationssideEffect[k].name});
                          found = true;
                      }
                  }
                }
              }

            }
          }
        }
        enc = true;
      }
    }
  }

  newDose(){
    this.medication = {};
    this.medication.drug = this.drugSelected;
    this.viewMedicationForm = true;
  }

  editDrug(actualMedication){
    this.medication = actualMedication;
    this.loadHistoryDrugSelected();
    this.medication.startDate = this.dateService.transformDate(actualMedication.startDate);
    this.medication.endDate = this.dateService.transformDate(actualMedication.endDate);
    this.startDate = new Date(this.medication.startDate);
    this.viewMedicationForm=true;
    this.viewMeditationSection = true;
  }
  deleteEndDate(){
    this.medication.endDate=null;
  }

  fieldchanged(){
    this.startDate = new Date(this.medication.startDate);
  }

  changeNotes(drug, contentNotes){
    this.medication = {};
    this.medication = JSON.parse(JSON.stringify(drug));
    this.medication.startDate = this.dateService.transformDate(drug.startDate);
    this.medication.endDate = this.dateService.transformDate(drug.endDate);
    this.modalReference = this.modalService.open(contentNotes);
  }

  onSubmitChangeNotes(){
    if(this.authGuard.testtoken()){
      this.sending = true;
      //this.http.put(environment.api+'/api/medication/newdose/'+this.medication._id, this.medication)
      //var paramssend = { medicationId: this.medication._id, patientId: this.authService.getCurrentPatient().sub };

      this.subscription.add( this.http.put(environment.api+'/api/medication/changenotes/'+this.medication._id, this.medication)

      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
          this.sending = false;
          this.viewMedicationForm = false;
          this.loadMedications();
          this.modalReference.close();
       }, (err) => {
         this.modalReference.close();
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
         this.sending = false;
         this.viewMedicationForm = false;
       }));
    }
  }

  changeSideEffect(drug, contentSideEffect){
    this.drugSelected = drug.drug;
    this.findSideEffects();
    this.medication = {};
    this.medication = JSON.parse(JSON.stringify(drug));
    this.medication.startDate = this.dateService.transformDate(drug.startDate);
    this.medication.endDate = this.dateService.transformDate(drug.endDate);
    this.modalReference = this.modalService.open(contentSideEffect);
  }

  onSubmitSideEffect(){
    if(this.authGuard.testtoken()){
      this.sending = true;
      //this.http.put(environment.api+'/api/medication/newdose/'+this.medication._id, this.medication)
      //var paramssend = { medicationId: this.medication._id, patientId: this.authService.getCurrentPatient().sub };

      this.subscription.add( this.http.put(environment.api+'/api/medication/sideeffect/'+this.medication._id, this.medication)

      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
          this.sending = false;
          this.viewMedicationForm = false;
          this.loadMedications();
          this.modalReference.close();
       }, (err) => {
         this.modalReference.close();
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
         this.sending = false;
         this.viewMedicationForm = false;
       }));
    }
  }

  loadHistoryDrugSelected(){
    this.historyDrugSelected = [];
    this.actualMedication = {};
    for(var i = 0; i < this.medications.length; i++) {
      if(this.drugSelected == this.medications[i].drug){
        this.historyDrugSelected.push(this.medications[i]);
      }
    }
    if(this.historyDrugSelected.length > 0){
      if(!this.historyDrugSelected[0].endDate){
        this.actualMedication = this.historyDrugSelected[0];
      }
    }
  }

  deleteDose(medication){
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ medication.drugTranslate+' <br> (Dose: '+medication.dose+')',
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
        this.confirmedDeleteDose(medication);
      }
    }).catch(swal.noop);
  }

  confirmedDeleteDose(medication){
    // Hay que ver si alguna entrada de medicalCare tenía esta dosis asociada
    // Si la tenía indicar si se quiere borrar la visita o el medicamento solo

    // Hay que comprobar si el medicamento tiene asociado un Medication prescribed en medicalCare
    var foundInMedicalCare=false;
    var medicalCareAssociated;
    for(var i=0;i<this.medicationsRelatedMedicalCare.length;i++){
      for (var j=0;j<this.medicationsRelatedMedicalCare[i].data.length;j++){
        if(this.medicationsRelatedMedicalCare[i].data[j].treatment!=undefined){
          if(medication._id==this.medicationsRelatedMedicalCare[i].data[j].treatment){
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
        html: this.translate.instant("clinicalinfo.Medication")+" "+ medication.drugTranslate+this.translate.instant("clinicalinfo.is associated to the section of Medical Care")+sectionName+". "+this.translate.instant("clinicalinfo.Do you want to eliminate the visit as well or just the medication?"),
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
                if(medication._id==this.medicationsRelatedMedicalCare[i].data[k].treatment){
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
              //Borrar la dosis
              this.subscription.add( this.http.delete(environment.api+'/api/medication/'+medication._id)
              .subscribe( (res : any) => {
                this.loadMedications();
              }, (err) => {
                console.log(err);
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
                if(medication._id==this.medicationsRelatedMedicalCare[i].data[k].treatment){
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
          //Borrar la dosis
          this.subscription.add( this.http.delete(environment.api+'/api/medication/'+medication._id)
          .subscribe( (res : any) => {
            this.loadMedications();
          }, (err) => {
            console.log(err);
          }));

        }
      }.bind(this)).catch(swal.noop);

    }
    else if(foundInMedicalCare==false){
      //Borrar la dosis
      this.subscription.add( this.http.delete(environment.api+'/api/medication/'+medication._id)
      .subscribe( (res : any) => {
        this.loadMedications();
      }, (err) => {
        console.log(err);
      }));
    }
  }

  deleteMedication(medication){
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ medication.drugTranslate,
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
        this.confirmedDeleteMedication(medication);
      }
    }).catch(swal.noop);
  }

  confirmedDeleteMedication(medication){
    // Hay que comprobar si el medicamento tiene asociado un Medication prescribed en medicalCare
    // si lo tiene : Sacar un Swal de si quiere borrar además la visita o solo el medicamento asociado
    // Si no lo tiene: Se borra el medicamento
    var foundInMedicalCare=false;

    for(var i=0;i<this.medicationsRelatedMedicalCare.length;i++){
      for (var j=0;j<this.medicationsRelatedMedicalCare[i].data.length;j++){
        if(this.medicationsRelatedMedicalCare[i].data[j].treatment!=undefined){
          if(medication._id==this.medicationsRelatedMedicalCare[i].data[j].treatment){
            foundInMedicalCare=true;

          }
        }
      }
    }
    if(foundInMedicalCare==true){
      // Hay que borrar las visitas y/o medicamentos de medicalcare que contengan medicalCareAssociated
      // Tengo que saber cuantas entradas tiene este medicalCareAssociated (cada entrada de dosis es un id)
      // para borrar la medicacion se compara que sea el mismo drug  y el mismo createdBy

      // Tengo que buscar a partir del name y del patientId cuantas entradas de medicamentos hay
      var paramssend = medication.drug+'-code-'+this.authService.getCurrentPatient().sub;
      this.subscription.add(this.http.get(environment.api+'/api/medications/all/'+paramssend)
          .subscribe( (res : any) => {
            //me devuelve la lista de medicamentos para el paciente con ese nombre
            var listmedicationRelatedMedicalcareUpdate=[]
            var medicalCareAssociated=[];
            // recorro esa lista de medicamentos
            for(var k=0;k<res.medications.length;k++){
              // Para cada medicamento tengo que comprobar si está en la lista de medicamentos de medicalcare (por id)
              for(var i=0;i<this.medicationsRelatedMedicalCare.length;i++){
                for (var j=0;j<this.medicationsRelatedMedicalCare[i].data.length;j++){
                  if(this.medicationsRelatedMedicalCare[i].data[j].treatment!=undefined){
                    // Si está:
                    // SACO EL SWAL y tengo que borrar las visitas y/o medicamentos de medicalcare
                    // Cuando haya recorrido la lista entera -> Borro el medicamento
                    if(res.medications[k]._id==this.medicationsRelatedMedicalCare[i].data[j].treatment){
                      listmedicationRelatedMedicalcareUpdate.push(this.medicationsRelatedMedicalCare[i])
                      medicalCareAssociated.push(this.medicationsRelatedMedicalCare[i]);
                    }
                  }
                }
              }
            }

            var sectionNames="";
            for(var i=0;i<medicalCareAssociated.length;i++){
              if(i==(medicalCareAssociated.length-1)){
                switch(medicalCareAssociated[i].name){
                  case 'general':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.general")
                    break;
                  case 'specificVisit':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.specificVisit")
                    break;
                  case 'hospitalization':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.hospitalization")
                    break;
                  case 'emergencies':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.emergencies")
                    break;
                  case 'cardiotest':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.cardiotest")
                    break;
                  case 'respiratorytests':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.respiratorytests")
                    break;
                  case 'bonehealthtest':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.bonehealthtest")
                    break;
                  case 'bloodtest':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.bloodtest")
                    break;
                  case 'surgery':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.surgery")
                    break;
                  default:
                    sectionNames=sectionNames+medicalCareAssociated[i].name;
                    break;
                }
              }
              else{
                switch(medicalCareAssociated[i].name){
                  case 'general':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.general")+", "
                    break;
                  case 'specificVisit':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.specificVisit")+", "
                    break;
                  case 'hospitalization':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.hospitalization")+", "
                    break;
                  case 'emergencies':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.emergencies")+", "
                    break;
                  case 'cardiotest':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.cardiotest")+", "
                    break;
                  case 'respiratorytests':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.respiratorytests")+", "
                    break;
                  case 'bonehealthtest':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.bonehealthtest")+", "
                    break;
                  case 'bloodtest':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.bloodtest")+", "
                    break;
                  case 'surgery':
                    sectionNames=sectionNames+this.translate.instant("medicalcare.surgery")+", "
                    break;
                  default:
                    sectionNames=sectionNames+medicalCareAssociated[i].name+", ";
                    break;



                }
              }
            }

            swal({
              title: this.translate.instant("generics.Are you sure?"),
              html: this.translate.instant("clinicalinfo.Medication")+" "+ medication.drugTranslate+this.translate.instant("clinicalinfo.is associated to the section/s of Medical Care")+sectionNames+". "+this.translate.instant("clinicalinfo.Do you want to eliminate the visit(s) as well or just the medication?"),
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#FF586B',
              confirmButtonText: this.translate.instant("clinicalinfo.Yes, delete also the visit(s)"),
              cancelButtonText: this.translate.instant("clinicalinfo.No, delete only the medication"),
              showCloseButton: true,
              showLoaderOnConfirm: true,
              allowOutsideClick: false
            }).then(function (result){
              if (result.value==true) {
                // borrar todas las secciones que estén asociadas al medicamento (cualquier entrada)
                for(var i=0;i<this.medicationsRelatedMedicalCare.length;i++){
                  for(var j=0;j<listmedicationRelatedMedicalcareUpdate.length;j++){
                    if(this.medicationsRelatedMedicalCare[i]==listmedicationRelatedMedicalcareUpdate[j]){
                      for(var k=0;k<this.medicationsRelatedMedicalCare[i].data.length;k++){
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
                    // Borro el medicamento de medications
                    var paramssend = medication.drug+'-code-'+this.authService.getCurrentPatient().sub;
                    this.subscription.add( this.http.delete(environment.api+'/api/medications/'+paramssend,medication.drug)
                    .subscribe( (res : any) => {
                      this.loadMedications();
                      this.numberFiles--
                      if(this.numberFiles == 0){
                        let yesAnswer = document.getElementById('yesAnswer');
                        (<HTMLInputElement>yesAnswer).disabled = false
                        let noAnswer = document.getElementById('noAnswer');
                        (<HTMLInputElement>noAnswer).disabled = false
                      }
                    }, (err) => {
                      console.log(err);
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
                  for(var j=0;j<listmedicationRelatedMedicalcareUpdate.length;j++){
                    if(this.medicationsRelatedMedicalCare[i]==listmedicationRelatedMedicalcareUpdate[j]){
                      for(var k=0;k<this.medicationsRelatedMedicalCare[i].data.length;k++){
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
                // Borro el medicamento de medications
                var paramssend = medication.drug+'-code-'+this.authService.getCurrentPatient().sub;
                this.subscription.add( this.http.delete(environment.api+'/api/medications/'+paramssend,medication.drug)
                .subscribe( (res : any) => {
                  this.loadMedications();
                  this.numberFiles--
                  if(this.numberFiles == 0){
                    let yesAnswer = document.getElementById('yesAnswer');
                    (<HTMLInputElement>yesAnswer).disabled = false
                    let noAnswer = document.getElementById('noAnswer');
                    (<HTMLInputElement>noAnswer).disabled = false
                  }
                }, (err) => {
                  console.log(err);
                }));


              }
            }.bind(this)).catch(swal.noop);

          }, (err) => {
            if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
              this.authGuard.testtoken();
            }else{
              this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
            }
          }))



    }
    else if(foundInMedicalCare==false){
      var paramssend = medication.drug+'-code-'+this.authService.getCurrentPatient().sub;
      this.subscription.add( this.http.delete(environment.api+'/api/medications/'+paramssend,medication.drug)
      .subscribe( (res : any) => {
        this.loadMedications();
        this.numberFiles--
        if(this.numberFiles == 0){
          let yesAnswer = document.getElementById('yesAnswer');
          (<HTMLInputElement>yesAnswer).disabled = false
          let noAnswer = document.getElementById('noAnswer');
          (<HTMLInputElement>noAnswer).disabled = false
        }
       }, (err) => {
         console.log(err);
       }));
    }
  }

  cancel(){
    //this.viewMeditationSection = false;
    this.viewMedicationForm = false;
  }

  submitInvalidForm() {
    if (!this.medicationForm) { return; }
    const base = this.medicationForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmit() {

    if(this.authGuard.testtoken()){
      this.sending = true;
      if(this.medication._id==null){
        if(this.medication.endDate==undefined){
          this.medication.endDate = null;
        }
        this.subscription.add( this.http.post(environment.api+'/api/medication/'+this.authService.getCurrentPatient().sub, this.medication)
        .subscribe( (res : any) => {
            if(res.message=='fail'){
              this.toastr.error('', this.translate.instant("medication.It has been impossible to save because there are doses in the range of dates") , { showCloseButton: true });
            }else{
              this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
              if(this.visit!=undefined){
                this.visit.medicalCareSections[this.section].data[this.indexvisit].treatment = res.medication._id;
                this.data.storage = this.visit;
                this.router.navigate(["/user/clinicinfo/medicalcare"]);
              }else{
                this.viewMedicationForm = false;
                this.loadMedications();
              }

            }
            this.sending = false;

         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.sending = false;
           this.viewMedicationForm = false;
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/medication/'+this.medication._id, this.medication)
        .subscribe( (res : any) => {
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
            if(this.visit!=undefined){
              this.visit.medicalCareSections[this.section].data[this.indexvisit].treatment = res.medication._id;
              this.data.storage = this.visit;
              this.router.navigate(["/user/clinicinfo/medicalcare"]);
            }else{
              this.viewMedicationForm = false;
              this.loadMedications();
            }
            this.sending = false;
         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.sending = false;
           this.viewMedicationForm = false;
         }));
      }

    }
  }

  selectOtherDrug(){

  }


}
