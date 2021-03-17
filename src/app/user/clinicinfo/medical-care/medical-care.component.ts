import { Component, ViewChild, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from "@angular/router";
import { NgForm, FormControl } from '@angular/forms';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { Data} from 'app/shared/services/data.service';
import swal from 'sweetalert2';
import { BlobStorageMedicalCareService, IBlobAccessToken } from 'app/shared/services/blob-storage-medical-care.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Observable } from 'rxjs/Observable';
import {DateAdapter} from '@angular/material/core';
import { Subscription } from 'rxjs/Subscription';
import { DialogService  } from 'app/shared/services/dialog.service';
import { SortService } from 'app/shared/services/sort.service';
import { ignoreElements } from 'rxjs/operator/ignoreElements';

declare var device;
declare let cordova: any;
declare let window: any;
declare let FileTransfer: any;
declare global {
    interface Navigator {
      camera: {
          getPicture: (par1,par2,par3) => any; // Or whatever is the type of the exitApp function
      }
    }
}

@Component({
    selector: 'app-medicalCare',
    templateUrl: './medical-care.component.html',
    styleUrls: ['./medical-care.component.scss'],
    providers: [ApiDx29ServerService]
})

export class MedicalCareComponent implements OnInit, OnDestroy{
  //Variable Declaration

  @ViewChild('f') visitForm: NgForm;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  medicalCareSections: any = [];
  generaldata: any = {};
  visitdata: any = {};
  hospitalization: any = {};
  emergencies: any = {};
  cardiotest: any = {};
  respiratorytests: any = {};
  bonehealthtest: any = {};
  bloodtest: any = {};
  surgery: any = {};

  specificVisitCount: number = 0;
  hospitalizationCount: number = 0;
  emergenciesCount: number = 0;
  cardiotestCount: number = 0;
  respiratorytestsCount: number = 0;
  bonehealthtestCount: number = 0;
  bloodtestCount: number = 0;
  surgeryCount: number = 0;

  visits: any;
  visit: any;
  savingVisit: boolean = false;
  addedVisit: boolean = false;
  today = new Date();
  startDate = new Date();
  medication: any;
  drug:any;
  treatment: any = {};
  modalReference: NgbModalRef;
  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: '',
    patientId: ''
  };
  uploadProgress: Observable<number>;
  //uploadingGenotype: boolean = false;
  filesOnBlob: any = [];
  totalSize: number = 0;
  uploaded: boolean = false;
  isSafari:boolean = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
  isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  namesection: string = '';
  hasChanges:boolean = false;
  private subscription: Subscription = new Subscription();

  clinicalActivation: boolean=false;
  specificVisitActivation:boolean=false;
  hospitalizationActivation:boolean=false;
  emergenciesActivation:boolean=false;
  cardiotestActivation:boolean=false;
  respiratorytestsActivation:boolean=false;
  bonehealthtestActivation:boolean=false;
  bloodtestActivation:boolean=false;
  surgeryActivation:boolean=false;


  // Variables for medication storage
  date = new FormControl(new Date());
  serializedDate = new FormControl((new Date()).toISOString());
  @ViewChild('f') medicationForm: NgForm;
  medications: any;
  actualMedication: any;
  actualMedications: any;
  oldMedications: any;
  numberFiles: number = 0
  sending: boolean = false;
  viewMedicationForm: boolean = false;
  viewOtherMedicationForm: boolean = false;
  loadingDataGroup: boolean = false;
  dataGroup: any;
  drugsLang: any;
  drugs:any;
  sideEffectsLang: any;
  adverseEffectsLang: any;
  locale: string;
  panelMedication: boolean = false;
  drugSelected: string = '';
  historyDrugSelected: any = [];
  viewMeditationSection: boolean = false;
  minDateChangeDose = new Date();
  indexvisit: any = null;
  section : any = null;
  showOnlyQuestion: Boolean = true;
  endOfPage: Boolean = false;
  timeformat="";
  actualGroup: string = '';
  duchennenetherlands: string = globalvars.duchennenetherlands;

  constructor(private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService,
    private authGuard: AuthGuard,public dialogService: DialogService, private router: Router, private route: ActivatedRoute, private data: Data, private modalService: NgbModal, private blob: BlobStorageMedicalCareService, private adapter: DateAdapter<any>,private sortService: SortService, private apiDx29ServerService: ApiDx29ServerService) {
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

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if(this.hasChanges){
      var obser =this.dialogService.confirm(this.translate.instant("generics.Discard changes for")+ ' ' +this.translate.instant("clinicalinfo.Medical Care")+'?');

      return obser}
    return true;
	}

  ngOnInit() {
    this.clinicalActivation=false;
    this.specificVisitActivation=false;
    this.hospitalizationActivation=false;
    this.emergenciesActivation=false;
    this.cardiotestActivation=false;
    this.respiratorytestsActivation=false;
    this.bonehealthtestActivation=false;
    this.bloodtestActivation=false;
    this.surgeryActivation=false;

    this.medications = [];
    this.actualMedications = [];
    this.oldMedications = [];

    this.medication = {};
    this.drugs=[];
    this.drug = {
      type: 'Supplements',
      name: '',
      dose: '',
      startDate: null,
      endDate: null,
      notes: ''
    }

    this.initVariables();

    this.loadTranslations();
    this.loadOtherDrugs();

    this.loadTranslationsElements();

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


     //cargar los datos del usuario
     this.loading = true;
     this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
     .subscribe( (res : any) => {
       if(res.listpatients.length>0){
         this.authService.setPatientList(res.listpatients);
         this.authService.setCurrentPatient(res.listpatients[0]);
         this.actualGroup = this.authService.getGroup();
       }else{
         swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
         this.router.navigate(['/user/basicinfo/personalinfo']);
       }
      }, (err) => {
        console.log(err);
        this.loading = false;
      }));


    //coger parámetros por si viene de modulo de visitas
    this.subscription.add(this.route.params.subscribe(params => {
      if(this.data.storage!=undefined){
        this.fieldchanged();
        this.medicalCareSections = this.data.storage.medicalCareSections;

      }else{
        this.loadData();
        this.loadTranslationsElements();
      }

    }));

    this.subscription.add(this.blob.change.subscribe(params => {
       this.uploaded = params.uploaded;
       this.medicalCareSections[params.index1].data[params.index2].uploadingGenotype = false;
      // this.uploadingGenotype = false;
       //swal('Done', '', "success");
     }));

   this.subscription.add(this.blob.changeFilesBlob.subscribe(filesOnBlob => {
     this.totalSize = 0;
      this.filesOnBlob = this.blob.filesOnBlob;
      for(var index in this.filesOnBlob){
         this.totalSize += (this.filesOnBlob[index].contentLength/1024/1024);
      }
      this.loading = false;
    }));

    //permisos
    if(this.isApp){
      var permissions = cordova.plugins.permissions;

     var list_permissions = [
        permissions.READ_EXTERNAL_STORAGE,
        permissions.WRITE_EXTERNAL_STORAGE
     ];

     permissions.requestPermissions(list_permissions, requestSuccess, requestError);

     var num_permissions = list_permissions.length;

    }

    function requestSuccess(){
      for (var i = 0; i < num_permissions; i++) {
        permissions.checkPermission(list_permissions[i], function( status ){
          if ( status.hasPermission ) {
            //console.warn("Yes :D -> " + list_permissions[i]);
          }
          else {
            //console.warn("No :( -> " + list_permissions[i]);
          }
        });
      }
    }

    function requestError(){
      console.warn("Permissions request error");
    }



  }

  @HostListener('window:scroll', ['$event'])
  public onWindowScroll(event: Event): void {
    if(!this.savingVisit && this.hasChanges){
      var initWidth= $('.card').width();
      $('#savingRequest').css({'position':'fixed','width':initWidth,'top':$(window).scrollTop()-10+'px','z-index':'9999'});
    }else{
        $('#savingRequest').css({'position':'relative'});
    }
  }

  initVariables(){
    this.medicalCareSections =[
      {name: 'general', tranlation: this.translate.instant("medicalcare.general"), data: []},
      {name: 'specificVisit', tranlation: this.translate.instant("medicalcare.specificVisit"), data: []},
      {name: 'hospitalization', tranlation: this.translate.instant("medicalcare.hospitalization"), data: []},
      {name: 'emergencies', tranlation: this.translate.instant("medicalcare.emergencies"), data: []},
      {name: 'cardiotest', tranlation: this.translate.instant("medicalcare.cardiotest"), data: []},
      {name: 'respiratorytests', tranlation: this.translate.instant("medicalcare.respiratorytests"), data: []},
      {name: 'bonehealthtest', tranlation: this.translate.instant("medicalcare.bonehealthtest"), data: []},
      {name: 'bloodtest', tranlation: this.translate.instant("medicalcare.bloodtest"), data: []},
      {name: 'surgery', tranlation: this.translate.instant("medicalcare.surgery"), data: []}
    ];

    this.generaldata = {
      clinician: '',
      hospital: '',
      multidisciplanary: false,
      distance: '',
      otherHospital: '',
      hospitalrecord: ''
    };

    this.visitdata = {
      clinician: '',
      hospital: '',
      date: '',
      treatment: '',
      otherHospital: '',
      hospitalrecord: ''
    };

    this.hospitalization = {
      hospital: '',
      reason: '',
      startdate: '',
      enddate: '',
      icu: '',
      days: '',
      treatment: '',
      otherHospital: '',
      otherReason: '',
      hospitalrecord: ''
    };

    this.emergencies = {
      hospital: '',
      reason: '',
      date: '',
      treatment: '',
      otherHospital: '',
      otherReason: '',
      hospitalrecord: ''
    }

    this.cardiotest = {
      typeoftest: '',
      date: '',
      hospitalrecord: '',
      pulse: '',
      bloodpressure: '',
      bloodpressure2: '',
      lvef: '',
      uploadingGenotype: false
    }

    this.respiratorytests = {
      typeoftest: '',
      otherTest: '',
      date: '',
      hospitalrecord: '',
      fvc: '',
      pef: '',
      mipmep: '',
      uploadingGenotype: false
    }

    this.bonehealthtest = {
      typeoftest: '',
      date: '',
      hospitalrecord: '',
      uploadingGenotype: false
    }

    this.bloodtest = {
      hospitalrecord: '',
      date: '',
      uploadingGenotype: false
    }

    this.surgery = {
      typeoftest: '',
      date: '',
      hospitalrecord: '',
      uploadingGenotype: false
    }

    this.visits = [];
    this.visit = {
      clinician: {},
      date: null,
      hospital: {},
      treatment: ''
    }
  }

  loadData(){
    this.hasChanges = false;
    this.loading = true;
    this.subscription.add(this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res0 : any) => {
      if(res0.listpatients.length>0){
        this.authService.setPatientList(res0.listpatients);
        this.authService.setCurrentPatient(res0.listpatients[0]);

         this.subscription.add(this.http.get(environment.api+'/api/medicalcare/'+this.authService.getCurrentPatient().sub)
         .subscribe( (res : any) => {
           if(!res.message){
             for (var i = 0; i < this.medicalCareSections.length; i++) {
               var found = false;
               for (var j = 0; j < res.medicalCare.data.length && !found; j++) {
                 if(this.medicalCareSections[i].name == res.medicalCare.data[j].name ){
                   found = true;
                   this.medicalCareSections[i].data = res.medicalCare.data[j].data;

                   if(this.medicalCareSections[i].data.length != 0 && this.medicalCareSections[i].name != "general"){
                     this.checkedCheckBox(this.medicalCareSections[i].name)
                   }
                 }
               }
             }

             //this.medicalCareSections = res.medicalCare.data;
              this.specificVisitCount = res.medicalCare.data[1].data.length;
              this.hospitalizationCount = res.medicalCare.data[2].data.length;
              this.emergenciesCount = res.medicalCare.data[3].data.length;
              this.cardiotestCount = res.medicalCare.data[4].data.length;
              this.respiratorytestsCount = res.medicalCare.data[5].data.length;
              this.bonehealthtestCount = res.medicalCare.data[6].data.length;
              this.bloodtestCount = res.medicalCare.data[7].data.length;
              this.surgeryCount = res.medicalCare.data[8].data.length;
           }
           this.getAnswer()
           this.loading = false;
          }, (err) => {
            console.log(err);
            this.loading = false;
          }))
          this.getAzureBlobSasToken();

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

  getAzureBlobSasToken(){
    this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    this.accessToken.patientId = this.authService.getCurrentPatient().sub;
    this.subscription.add( this.apiDx29ServerService.getAzureBlobSasToken(this.accessToken.containerName)
    .subscribe( (res : any) => {
      this.accessToken.sasToken = '?'+res;
      this.blob.init(this.accessToken);
    }, (err) => {
      console.log(err);
    }));
  }

  //stats questions
  setAnswer(event){

    let yesAnswer = document.getElementById('yesAnswer'+event.target.attributes.name.nodeValue);
    //var yesAnswerChecked = (<HTMLInputElement>yesAnswer).checked;
    let noAnswer = document.getElementById('noAnswer'+event.target.attributes.name.nodeValue);
    //var noAnswerChecked = (<HTMLInputElement>noAnswer).checked;

    //exclusive checkBox
    if((<HTMLInputElement>yesAnswer).checked == true && (<HTMLInputElement>noAnswer).checked == true){
      this.changeCheck(event.target.attributes.id.nodeValue,event.target.attributes.name.nodeValue)
    }
    //set answer
    var answer
    if((<HTMLInputElement>yesAnswer).checked == false && (<HTMLInputElement>noAnswer).checked == false){
      answer = undefined;
    }
    if((<HTMLInputElement>yesAnswer).checked == true && (<HTMLInputElement>noAnswer).checked == false){
      answer = true;
    }
    if((<HTMLInputElement>yesAnswer).checked == false && (<HTMLInputElement>noAnswer).checked == true){
      answer = false;
    }
    var data = {answer: answer, type: event.target.attributes.name.nodeValue, patientId: this.authService.getCurrentPatient().sub};
    this.subscription.add( this.http.post(environment.api+'/api/admin/answers/setanswers', data)
    .subscribe( (res : any) => {
    }))
    if(data.answer==true&&data.type!=undefined){
      for(var i=0;i<this.medicalCareSections.length;i++){
        if(this.medicalCareSections[i].name==data.type){
          //checksectionBoolean
            //this.setSection(data.type);
            //this.goTo(data.type)
            this.newData(i,data.type)


        }
      }
    }
    else if(data.answer==undefined&&data.type!=undefined){
      for(var i=0;i<this.medicalCareSections.length;i++){
        if(this.medicalCareSections[i].name==data.type){
          this.deleteData(i,0);
        }
      }
    }
  }

  changeCheck(buttonId,buttonName){
    if(buttonId == 'yesAnswer'+buttonName){
      let checkButton = document.getElementById('noAnswer'+buttonName);
      (<HTMLInputElement>checkButton).checked = !(<HTMLInputElement>checkButton).checked;
    }
    if(buttonId == 'noAnswer'+buttonName){
      let checkButton = document.getElementById('yesAnswer'+buttonName);
      (<HTMLInputElement>checkButton).checked = !(<HTMLInputElement>checkButton).checked;
    }
  }

  checkedCheckBox(type){
    let noButton = document.getElementById('noAnswer'+type);
    (<HTMLInputElement>noButton).checked = false;
    let yesButton = document.getElementById('yesAnswer'+type);
    (<HTMLInputElement>yesButton).checked = true;
  }

  getAnswerType(type, answer){
    if(answer == true){
      let noButton = document.getElementById('noAnswer'+type);
      (<HTMLInputElement>noButton).checked = false;
      let yesButton = document.getElementById('yesAnswer'+type);
      (<HTMLInputElement>yesButton).checked = true;
      this.medicalCareSections.forEach(sections => {
        if(sections.name == type){
          if(sections.data.length > 0){
            (<HTMLInputElement>yesButton).disabled = true;
            (<HTMLInputElement>noButton).disabled = true;
          }
        }
      });
    }
    else if (answer == false){
      let noButton = document.getElementById('noAnswer'+type);
      (<HTMLInputElement>noButton).checked = true;
      let yesButton = document.getElementById('yesAnswer'+type);
      (<HTMLInputElement>yesButton).checked = false;
    }
    else{
      let noButton = document.getElementById('noAnswer'+type);
      (<HTMLInputElement>noButton).checked = false;
      let yesButton = document.getElementById('yesAnswer'+type);
      (<HTMLInputElement>yesButton).checked = false;
    }
  }

  getAnswer(){
    var data = { type: "medicalCare", patientId: this.authService.getCurrentPatient().sub};
    this.subscription.add( this.http.post(environment.api+'/api/admin/answers/getanswer/', data)
    .subscribe( (res : any) => {
      this.medicalCareSections.forEach(element => {
        switch(element.name){
          case 'specificVisit':
            this.getAnswerType('specificVisit',res.answer[0].specificVisit)
            break;
          case 'hospitalization':
            this.getAnswerType('hospitalization',res.answer[0].hospitalization)
            break;
          case 'emergencies':
            this.getAnswerType('emergencies',res.answer[0].emergencies)
            break;
          case 'cardiotest':
            this.getAnswerType('cardiotest',res.answer[0].cardiotest)
            break;
          case 'respiratorytests':
            this.getAnswerType('respiratorytests',res.answer[0].respiratorytests)
            break;
          case 'bonehealthtest':
            this.getAnswerType('bonehealthtest',res.answer[0].bonehealthtest)
            break;
          case 'bloodtest':
            this.getAnswerType('bloodtest',res.answer[0].bloodtest)
            break;
          case 'surgery':
            this.getAnswerType('surgery',res.answer[0].surgery)
            break;
          default:
            break;
        }
      });

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

  goTo(url){
    this.setSection(url);
    document.getElementById(url).scrollIntoView(true);

  }

  newData(index, info){
    this.setSectionToAddData(this.medicalCareSections[index].name);
    this.medicalCareSections[index].data.push({choise:'',date:null});
    if(index==0||index==1||index==2||index==3){
      this.medicalCareSections[index].data[this.medicalCareSections[index].data.length-1].hospital='Other'
    }
    var yesAnswer=document.getElementById('yesAnswer'+this.medicalCareSections[index].name);
    if(index!=0){
    (<HTMLInputElement>yesAnswer).checked=true;

      var data = {answer: true, type: this.medicalCareSections[index].name, patientId: this.authService.getCurrentPatient().sub};
      this.subscription.add( this.http.post(environment.api+'/api/admin/answers/setanswers', data)
      .subscribe( (res : any) => {
      }))
    }

  }

  deleteData(index, k){
    var medicationId = this.medicalCareSections[index].data[k].treatment;
    var medicationName="";
    if(medicationId!="" && medicationId!=undefined){
      this.subscription.add(this.http.get(environment.api+'/api/medication/'+medicationId)
      .subscribe( (res : any) => {
        medicationName="";
        if(res.medication==undefined){
        //if(res.message=="There are no medication"){
          // cargar tambien los other medications
          this.subscription.add(this.http.get(environment.api+'/api/othermedicationID/'+medicationId)
          .subscribe( (res1 : any) => {
            medicationName=res1.medication.name;
            swal({
              title: this.translate.instant("medication.You associated a medicine to this visit.")+" ("+medicationName+")",
              html: this.translate.instant("medication.Do you want to delete medicine data as well?"),
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#FF586B',
              confirmButtonText: this.translate.instant("generics.Yes"),
              cancelButtonText: this.translate.instant("generics.No"),
              showLoaderOnConfirm: true,
              allowOutsideClick: false
            }).then((result) => {
              if (result.value == true){
                // Buscar medicación actual (id=treatment)
                // Buscar todas las medicaciones con el mismo medicamento
                // Encontrar entre esas la que tenga end date mas reciente
                // Borrar la medicacion actual y abrir la otra (end date=current taking)
                var paramssend = this.authService.getCurrentPatient().sub+"-code-"+medicationId;
                this.subscription.add( this.http.delete(environment.api+'/api/othermedication/update/'+paramssend)
                .subscribe( (res : any) => {
                  if((this.medicalCareSections[index].data[k].hospitalrecord!=undefined)&&( this.medicalCareSections[index].data[k].hospitalrecord!='')){
                    this.blob.deleteBlob(this.accessToken.containerName , this.medicalCareSections[index].data[k].hospitalrecord);

                  }
                  this.medicalCareSections[index].data.splice(k, 1);
                  if(this.medicalCareSections[index].data.length == 0){
                    this.activeCheckBox(this.medicalCareSections[index].name)
                  }
                }, (err) => {
                  console.log(err);
                }));

              }
            }).catch(swal.noop);

          }, (err) => {
            console.log(err);
          }));
        }
        else{
          medicationName=res.medication.drug;
          swal({
            title: this.translate.instant("medication.You associated a medicine to this visit.")+" ("+medicationName+")",
            html: this.translate.instant("medication.Do you want to delete medicine data as well?"),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#FF586B',
            confirmButtonText: this.translate.instant("generics.Yes"),
            cancelButtonText: this.translate.instant("generics.No"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false
          }).then((result) => {
            if (result.value == true){
              // Buscar medicación actual (id=treatment)
              // Buscar todas las medicaciones con el mismo medicamento
              // Encontrar entre esas la que tenga end date mas reciente
              // Borrar la medicacion actual y abrir la otra (end date=current taking)
              var paramssend = this.authService.getCurrentPatient().sub+"-code-"+medicationId;
              this.subscription.add( this.http.delete(environment.api+'/api/medications/update/'+paramssend)
              .subscribe( (res : any) => {
                if((this.medicalCareSections[index].data[k].hospitalrecord!=undefined)&&( this.medicalCareSections[index].data[k].hospitalrecord!='')){
                  this.blob.deleteBlob(this.accessToken.containerName , this.medicalCareSections[index].data[k].hospitalrecord);

                }
                this.medicalCareSections[index].data.splice(k, 1);
                if(this.medicalCareSections[index].data.length == 0){
                  this.activeCheckBox(this.medicalCareSections[index].name)
                }
              }, (err) => {
                console.log(err);
              }));
            }
          }).catch(swal.noop);


        }
      }, (err) => {
        console.log(err);
      }));
    }
    else{
      if((this.medicalCareSections[index].data[k].hospitalrecord!=undefined)&&( this.medicalCareSections[index].data[k].hospitalrecord!='')){
        this.blob.deleteBlob(this.accessToken.containerName , this.medicalCareSections[index].data[k].hospitalrecord);

      }
      this.medicalCareSections[index].data.splice(k, 1);
      if(this.medicalCareSections[index].data.length == 0){
        this.activeCheckBox(this.medicalCareSections[index].name)
      }
    }
  }

  activeCheckBox(type){
    let noButton = document.getElementById('noAnswer'+type);
    if(noButton!=null){
      (<HTMLInputElement>noButton).disabled = false;
    }
    let yesButton = document.getElementById('yesAnswer'+type);
    if(yesButton!=null){
      (<HTMLInputElement>yesButton).disabled = false
    }
  }

  deleteDataAndFile(index, k){
    //eliminar del blob
    this.blob.deleteBlob(this.accessToken.containerName , this.medicalCareSections[index].data[k].hospitalrecord);
    this.medicalCareSections[index].data[k].hospitalrecord = '';
    this.submitNewVisit2();
  }

  onFileChange(event: any, index1, index2): void {
    if((event.target.files[0].size /1024/1024) + this.totalSize > 4000){
      swal('Space limit exceeded. Delete some file or hire more space.', '', "error");
    }else{

      var filename = event.target.files[0].name;
      var extension = filename.substr(filename.lastIndexOf('.'));
      filename = filename.split(extension)[0];
      filename = filename + 'medicalcare' + index1 + '-' + index2+extension;
      this.medicalCareSections[index1].data[index2].hospitalrecord = filename;
      this.medicalCareSections[index1].data[index2].uploadingGenotype = true;
      this.uploadProgress = this.blob
        .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, index1, index2);
    }

  }

  newVisit(){
    this.addedVisit = true;
    this.visit = {
      clinician: {},
      date: null,
      hospital: {},
      treatment: ''
    }
  }

  cancelNewVisit(){
    this.addedVisit = false;
  }

  submitInvalidForm() {
    if (!this.visitForm) { return; }
    const base = this.visitForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  viewTreatment(section, index,contentTreatment){
    this.treatment = {};
    this.subscription.add(this.http.get(environment.api+'/api/medication/'+this.medicalCareSections[section].data[index].treatment)
    .subscribe( (res : any) => {
      this.treatment = res.medication;
      if( this.treatment==undefined){
      //if(res.message=="There are no medication"){
        // cargar tambien los other medications
        this.subscription.add(this.http.get(environment.api+'/api/othermedicationID/'+this.medicalCareSections[section].data[index].treatment)
        .subscribe( (res1 : any) => {
          this.treatment={
            drug:res1.medication.name,
            dose:res1.medication.dose,
            startDate:res1.medication.startDate,
            endDate:res1.medication.endDate
          }
          this.modalReference = this.modalService.open(contentTreatment);

        }, (err) => {
          console.log(err);
        }))
      }
      else{
        this.modalReference = this.modalService.open(contentTreatment);
      }
     }, (err) => {
       console.log(err);
     }))
  }

  submitNewVisit() {
    if(this.authGuard.testtoken()){
      this.savingVisit = true;
      for (var i = 0; i < this.medicalCareSections.length; i++) {
         //this.medicalCareSections[i].splice(1,1); //quitar la propiedad translation
         delete this.medicalCareSections[i]['tranlation'];
      }
      this.subscription.add(this.http.post(environment.api+'/api/medicalcare/'+this.authService.getCurrentPatient().sub, this.medicalCareSections)
      .subscribe( (res : any) => {
        if(res.message=='fail'){
          this.toastr.error('', this.translate.instant("vaccinations.It was not possible to save because the vaccine already exists on the selected date"), { showCloseButton: true });
        }else{
          this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
          this.addedVisit = false;
          this.data.storage = undefined;
          this.loadData();
          this.loadTranslationsElements();
        }
        this.initVariables();
        this.savingVisit = false;

       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
         this.initVariables();
         this.savingVisit = false;
       }))
    }
  }

  submitNewVisit2() {

    if(this.authGuard.testtoken()){
      this.savingVisit = true;
      for (var i = 0; i < this.medicalCareSections.length; i++) {
         //this.medicalCareSections[i].splice(1,1); //quitar la propiedad translation
         delete this.medicalCareSections[i]['tranlation'];
      }
      this.subscription.add(this.http.post(environment.api+'/api/medicalcare/'+this.authService.getCurrentPatient().sub, this.medicalCareSections)
      .subscribe( (res : any) => {
        if(res.message=='fail'){
          this.toastr.error('', this.translate.instant("vaccinations.It was not possible to save because the vaccine already exists on the selected date"), { showCloseButton: true });
        }else{
          this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
          this.addedVisit = false;
          this.data.storage = undefined;
          //this.loadData();
          this.hasChanges = false;
        }
        this.medicalCareSections[0].tranlation =this.translate.instant("medicalcare.general");
        this.medicalCareSections[1].tranlation =this.translate.instant("medicalcare.specificVisit");
        this.medicalCareSections[2].tranlation =this.translate.instant("medicalcare.hospitalization");
        this.medicalCareSections[3].tranlation =this.translate.instant("medicalcare.emergencies");
        this.medicalCareSections[4].tranlation =this.translate.instant("medicalcare.cardiotest");
        this.medicalCareSections[5].tranlation =this.translate.instant("medicalcare.respiratorytests");
        this.medicalCareSections[6].tranlation =this.translate.instant("medicalcare.bonehealthtest");
        this.medicalCareSections[7].tranlation =this.translate.instant("medicalcare.bloodtest");
        this.medicalCareSections[8].tranlation =this.translate.instant("medicalcare.surgery");
        this.savingVisit = false;

       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
         this.initVariables();
         this.savingVisit = false;
       }))
    }
  }

  newTreatment(section, index,contentMedication){
    this.data.storage = {medicalCareSections: this.medicalCareSections, index : index, section: section};
    this.visit = this.data.storage;
    this.indexvisit = this.data.storage.index;
    this.section = this.data.storage.section;
    this.newMedication();
    //this.router.navigate(["/user/clinicinfo/medication"]);
    let ngbModalOptions: NgbModalOptions = {
      backdrop : 'static',
      keyboard : false
    };
    this.modalReference = this.modalService.open(contentMedication, ngbModalOptions);
  }

  deleteTreatment(section, index){
    var medicationId = this.medicalCareSections[section].data[index].treatment;
    var medicationName="";
    this.subscription.add(this.http.get(environment.api+'/api/medication/'+medicationId)
    .subscribe( (res : any) => {

      if(res.medication==undefined){
      //if(res.message=="There are no medication"){
        // cargar tambien los other medications
        this.subscription.add(this.http.get(environment.api+'/api/othermedicationID/'+medicationId)
        .subscribe( (res1 : any) => {
          medicationName=res1.medication.name;
          if(medicationId!=""){
            swal({
              title: medicationName,
              html: this.translate.instant("medication.Do you want to delete this medication for this visit?"),
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#FF586B',
              confirmButtonText: this.translate.instant("generics.Yes"),
              cancelButtonText: this.translate.instant("generics.No"),
              showLoaderOnConfirm: true,
              allowOutsideClick: false
            }).then((result) => {
              if (result.value == true){
                // Buscar medicación actual (id=treatment)
                // Buscar todas las medicaciones con el mismo medicamento
                // Encontrar entre esas la que tenga end date mas reciente
                // Borrar la medicacion actual y abrir la otra (end date=current taking)
                var paramssend = this.authService.getCurrentPatient().sub+"-code-"+medicationId;
                this.subscription.add( this.http.delete(environment.api+'/api/othermedication/update/'+paramssend)
                .subscribe( (res : any) => {
                }, (err) => {
                  console.log(err);
                }));
              }
            }).catch(swal.noop);
          }
        }, (err) => {
          console.log(err);
        }))
      }
      else{
        medicationName=res.medication.drug;
        if(medicationId!=""){
          swal({
            title: medicationName,
            html: this.translate.instant("medication.Do you want to delete this medication for this visit?"),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#FF586B',
            confirmButtonText: this.translate.instant("generics.Yes"),
            cancelButtonText: this.translate.instant("generics.No"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false
          }).then((result) => {
            if (result.value == true){
              // Buscar medicación actual (id=treatment)
              // Buscar todas las medicaciones con el mismo medicamento
              // Encontrar entre esas la que tenga end date mas reciente
              // Borrar la medicacion actual y abrir la otra (end date=current taking)
              var paramssend = this.authService.getCurrentPatient().sub+"-code-"+medicationId;
              this.subscription.add( this.http.delete(environment.api+'/api/medications/update/'+paramssend)
              .subscribe( (res : any) => {
              }, (err) => {
                console.log(err);
              }));
            }
          }).catch(swal.noop);
        }
      }

     }, (err) => {
       console.log(err);
     }))


    this.medicalCareSections[section].data[index].treatment = '';
    this.data.storage = undefined;
    this.submitNewVisit2();
  }

  fieldchanged(){
    this.hasChanges = true;
  }

  downloadFile(containerName, fileName){
      var dirFicheros, directorio;
      var esAndroid = false;
      var assetURL = "{{accessToken.blobAccountUrl}}/"+containerName+"/"+fileName+this.accessToken.sasToken;
      if(device.platform == 'android' || device.platform == 'Android'){
        esAndroid = true;
        dirFicheros =  cordova.file.externalRootDirectory;
        directorio = 'Download';
      }else{
        dirFicheros =  cordova.file.documentsDirectory;
        directorio = 'Documents';
        cordova.InAppBrowser.open(assetURL, "_system", { location: "yes", closebuttoncaption: "Done" });
      }


      if(esAndroid){
        var fileTransfer = new FileTransfer();
        var urlToFile1 = dirFicheros + directorio + '/' + fileName;
        fileTransfer.download(assetURL, urlToFile1,
          function(entry) {
            window.resolveLocalFileSystemURL(dirFicheros, function (fileSystem) {
                fileSystem.getDirectory(directorio, { create: true }, function (dirEntry) {

                  swal({
                      title: 'Saved on download folder.',
                      type: 'success',
                      showCancelButton: false,
                      confirmButtonColor: "#DD6B55",
                      confirmButtonText: 'ok',
                      }
                  );

                }, function(error){
                    console.log(error);
                    swal({
                        title: 'error2',
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: 'ok',
                        }
                    );
                });
            },
            function(event){
                console.log( event.target.error.code );
                swal({
                    title: 'error3',
                    type: 'error',
                    showCancelButton: false,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: 'ok',
                    }
                );
            });

          },
          function(err) {
            console.log("Error4");
            console.dir(err);
          });
        }
  }

  setSection(seccion){
    switch(seccion){
      case 'general':
        this.clinicalActivation=!this.clinicalActivation;
        this.specificVisitActivation=false;
        this.hospitalizationActivation=false;
        this.emergenciesActivation=false;
        this.cardiotestActivation=false;
        this.respiratorytestsActivation=false;
        this.bonehealthtestActivation=false;
        this.bloodtestActivation=false;
        this.surgeryActivation=false;
        break;
      case 'specificVisit':
          this.clinicalActivation=false;
          this.specificVisitActivation=!this.specificVisitActivation;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'hospitalization':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=!this.hospitalizationActivation;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'emergencies':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=!this.emergenciesActivation;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'cardiotest':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=!this.cardiotestActivation;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'respiratorytests':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=!this.respiratorytestsActivation;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'bonehealthtest':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=!this.bonehealthtestActivation;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'bloodtest':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=!this.bloodtestActivation;
          this.surgeryActivation=false;
        break;
      case 'surgery':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=!this.surgeryActivation;
        break;
      default:
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
    }
  }


  setSectionToAddData(seccion){
    switch(seccion){
      case 'general':
        this.clinicalActivation=true;
        this.specificVisitActivation=false;
        this.hospitalizationActivation=false;
        this.emergenciesActivation=false;
        this.cardiotestActivation=false;
        this.respiratorytestsActivation=false;
        this.bonehealthtestActivation=false;
        this.bloodtestActivation=false;
        this.surgeryActivation=false;
        break;
      case 'specificVisit':
          this.clinicalActivation=false;
          this.specificVisitActivation=true;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'hospitalization':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=true;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'emergencies':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=true;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'cardiotest':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=true;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'respiratorytests':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=true;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'bonehealthtest':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=true;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
      case 'bloodtest':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=true;
          this.surgeryActivation=false;
        break;
      case 'surgery':
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=true;
        break;
      default:
          this.clinicalActivation=false;
          this.specificVisitActivation=false;
          this.hospitalizationActivation=false;
          this.emergenciesActivation=false;
          this.cardiotestActivation=false;
          this.respiratorytestsActivation=false;
          this.bonehealthtestActivation=false;
          this.bloodtestActivation=false;
          this.surgeryActivation=false;
        break;
    }
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
            //coger parámetros por si viene de modulo de notificaciones
            this.subscription.add( this.route.params.subscribe(params => {
              var section = params['section'];
              switch(section){
                case 'Regular care':
                  this.clinicalActivation=true;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=false;
                  document.getElementById("general").scrollIntoView(true);
                break;
                case 'Specific visit':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=true;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=false;
                  document.getElementById("specificVisit").scrollIntoView(true);
                break;
                case 'Hospitalization':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=true;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=false;
                  document.getElementById("hospitalization").scrollIntoView(true);
                break;
                case 'Emergencies':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=true;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=false;
                  document.getElementById("emergencies").scrollIntoView(true);
                break;
                case 'Cardio test':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=true;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=false;
                  document.getElementById("cardiotest").scrollIntoView(true);
                break;
                case 'Respiratory tests':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=true;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=false;
                  document.getElementById("respiratorytests").scrollIntoView(true);
                break;
                case 'Bonehealth test':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=true;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=false;
                  document.getElementById("bonehealthtest").scrollIntoView(true);
                break;
                case 'Blood test':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=true;
                  this.surgeryActivation=false;
                  document.getElementById("bloodtest").scrollIntoView(true);
                break;
                case 'Surgery':
                  this.clinicalActivation=false;
                  this.specificVisitActivation=false;
                  this.hospitalizationActivation=false;
                  this.emergenciesActivation=false;
                  this.cardiotestActivation=false;
                  this.respiratorytestsActivation=false;
                  this.bonehealthtestActivation=false;
                  this.bloodtestActivation=false;
                  this.surgeryActivation=true;
                  document.getElementById("surgery").scrollIntoView(true);
                break;
                }
              }));
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
      }

      this.loadingDataGroup = false;
      this.loadMedications();
      }, (err) => {
        console.log(err);
        this.loadingDataGroup = false;
        this.loadMedications();
      }));

  }
  loadOtherDrugs(){
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
          }, (err) => {
            console.log(err);
          }));
     }
   }, (err) => {
     console.log(err);
     this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
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
    this.medication = medication;
    this.medication.startDate = this.dateService.transformDate(medication.startDate);
    this.medication.endDate = this.dateService.transformDate(medication.endDate);
    this.loadHistoryDrugSelected();
    this.viewMeditationSection = true;
    this.panelMedication = true;
  }

  onChangeDrug(value){
    //this.viewMedicationForm = false;
    this.viewOtherMedicationForm=false;
    //comprobar si es un medicamento actual o antiguo, si no es ninguno de los dos, mostrar el formulario
    this.findSideEffects();
    this.medication = {};
    this.medication.drug = this.drugSelected;
    this.medication.endDate = null;
    this.loadHistoryDrugSelected();
    this.viewMedicationForm = true;

  }
  onChangeNewDrug(){
    this.drugSelected=null;
    this.viewMedicationForm = false;
    this.viewOtherMedicationForm=false;
    this.drug = {
      type: 'Supplements',
      name: '',
      dose: '',
      startDate: null,
      endDate: null,
      notes: ''
    }
    this.viewOtherMedicationForm=true;
  }

  deleteEndDate(){
    this.medication.endDate=null;
  }
  deleteEndDate2(){
    this.drug.endDate=null;
  }

  fieldchanged2(){
    this.startDate = new Date(this.medication.startDate);
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

  onSubmit() {

    /* Hay que comprobar si ya se estaba tomando ese medicamento (end date = current taking) o no:
      1. En caso de que no, se añadirá el medicamento con los datos de este formulario.
      2. En caso de que si, se tiene que sacar un "swal" de confirmación.
      Hay que avisar al paciente de que ese medicamento lo tiene como "current taking",
      y preguntarle si quiere modificarlo o no.
        a. Si no lo quiere modificar ->
          Se cierra el swal pero se continua dentro del popup de nuevo medicamento
        b. Si lo quiere modificar ->
          Hay que actualizar el que tuviese con end date = current taking, a la fecha actual.
          Y después añadir el nuevo que se ha completado en el formulario.
    */
   if(this.authGuard.testtoken()){
    this.sending = true;
      if(this.medication.endDate==undefined){
        this.medication.endDate = null;
      }
      this.subscription.add( this.http.post(environment.api+'/api/medication/'+this.authService.getCurrentPatient().sub, this.medication)
      .subscribe( (res : any) => {
          if(res.message=='fail'){
            // -- -- -- -- CASO 2: Ya existia -- -- -- -- --
            swal({
              title: this.translate.instant("medication.Modify current data for")+'('+ this.medication.drug +')',
              html: this.translate.instant("medication.Introduce new values"),
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#FF586B',
              confirmButtonText: this.translate.instant("generics.Update"),
              cancelButtonText: this.translate.instant("generics.No, cancel"),
              showLoaderOnConfirm: true,
              allowOutsideClick: false
            }).then((result) => {
              if (result.value) {
                if (result.value == true){
                  // Cambiar de actualMedication endDate = hoy, y guardar actual y medication
                  var suma1dia= 1*24*60*60*1000; //(días * 24 horas * 60 minutos * 60 segundos * 1000 milésimas de segundo)
                  var fecha = this.medication.startDate.getTime()-suma1dia;
                  this.actualMedication.endDate = fecha;
                  this.subscription.add( this.http.put(environment.api+'/api/medication/'+this.actualMedication._id, this.actualMedication)
                  .subscribe( (res : any) => {
                    if(res.message!="Medication updated"){
                      this.toastr.error('', this.translate.instant("generics.Data saved fail") , { showCloseButton: true });
                    }else{
                      // Si se ha modificado bien la otra que estaba con current taking:
                      // Guardamos ahora la medicacion modificada en este formulario
                      this.subscription.add( this.http.post(environment.api+'/api/medication/'+this.authService.getCurrentPatient().sub, this.medication)
                      .subscribe( (res : any) => {
                        if(res.message=='fail'){
                          this.toastr.error('', this.translate.instant("generics.Data saved fail") , { showCloseButton: true });
                        }else{
                          // Se ha guardado la medicacion de acuerdo a lo que se haya introducido en el formulario
                          this.visit.medicalCareSections[this.section].data[this.indexvisit].treatment = res.medication._id;
                          this.hasChanges = true;
                          this.loadTranslationsElements();
                          this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
                          this.modalReference.close();
                          this.viewMedicationForm = false;
                          this.viewOtherMedicationForm=false;
                        }
                        this.sending = false;

                      }, (err) => {
                        if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
                          this.authGuard.testtoken();
                        }else{
                          this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
                        }
                        this.sending = false;
                      }));
                    }
                    this.sending = false;
                  }, (err) => {
                    if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
                      this.authGuard.testtoken();
                    }else{
                      this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
                    }
                    this.sending = false;
                  }));
                }
              }
            }).catch(swal.noop);

          }else{
            // -- -- -- -- CASO 1: No existia -- -- -- -- --
            // Se ha guardado la medicacion de acuerdo a lo que se haya introducido en el formulario

            this.visit.medicalCareSections[this.section].data[this.indexvisit].treatment = res.medication._id;
            this.hasChanges = true;
            this.loadTranslationsElements();
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
            this.modalReference.close();
            this.viewMedicationForm = false;
            this.viewOtherMedicationForm=false;
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
  onSubmitOtherDrug(){

    this.subscription.add( this.http.post(environment.api+'/api/othermedication/'+this.authService.getCurrentPatient().sub, this.drug)
    .subscribe( (res : any) => {
      if(res.message=='fail'){
        console.log("FAIL!!")
        swal({
          title: this.translate.instant("medication.Modify current data for")+'('+ this.drug.name +')',
          html: this.translate.instant("medication.Introduce new values"),
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#FF586B',
          confirmButtonText: this.translate.instant("generics.Update"),
          cancelButtonText: this.translate.instant("generics.No, cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false
        }).then((result) => {
          if (result.value) {
            var params=this.authService.getCurrentPatient().sub+"-code-"+this.drug.name;
            this.subscription.add(this.http.get(environment.api+'/api/othermedicationName/'+params).subscribe((res:any)=>{
              if(res){
                var oldDrug=res;
                var suma1dia= 1*24*60*60*1000; //(días * 24 horas * 60 minutos * 60 segundos * 1000 milésimas de segundo)
                var fecha = this.drug.startDate.getTime()-suma1dia;
                oldDrug.endDate = fecha;
                this.subscription.add( this.http.put(environment.api+'/api/othermedication/'+oldDrug._id, oldDrug)
                .subscribe( (res : any) =>{
                  if(res.message=='fail'){
                    this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
                  }
                  else{
                    this.subscription.add( this.http.post(environment.api+'/api/othermedication/'+this.authService.getCurrentPatient().sub, this.drug)
                    .subscribe( (res : any) => {
                      if(res.message=='fail'){
                        this.toastr.error('', this.translate.instant("medication.It was not possible to save because the drug already exists on the selected date"), { showCloseButton: true });
                      }else{
                        // Se ha guardado la medicacion de acuerdo a lo que se haya introducido en el formulario
                        this.visit.medicalCareSections[this.section].data[this.indexvisit].treatment = res.medication._id;
                        this.hasChanges = true;
                        this.loadOtherDrugs();
                        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
                        this.modalReference.close();
                        this.viewMedicationForm = false;
                        this.viewOtherMedicationForm=false;
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
                  this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
                }));
              }
            }, (err) => {
              this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
            }));
          }
        });

      }else{
        // Se ha guardado la medicacion de acuerdo a lo que se haya introducido en el formulario
        this.visit.medicalCareSections[this.section].data[this.indexvisit].treatment = res.medication._id;
        this.hasChanges = true;
        this.loadOtherDrugs();
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
        this.modalReference.close();
        this.viewMedicationForm = false;
        this.viewOtherMedicationForm=false;
      }

    }, (err) => {
      if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
        this.authGuard.testtoken();
      }else{
        this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
      }
    }));



  }

  closeContentMedication(){
    this.drugSelected=null;
    this.viewMedicationForm = false;
    this.viewOtherMedicationForm=false;
    this.drug = {
      type: 'Supplements',
      name: '',
      dose: '',
      startDate: null,
      endDate: null,
      notes: ''
    }
    this.modalReference.close();
  }

}
