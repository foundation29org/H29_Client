import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { LangService } from 'app/shared/services/lang.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { SortService} from 'app/shared/services/sort.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-proms',
    templateUrl: './proms.component.html',
    styleUrls: ['./proms.component.scss'],
    providers: [LangService],
})

export class PromsComponent implements OnInit, OnDestroy{
  //Variable Declaration
  groups: Array<any> = [];
  groupSelected: any = {};

  sections: any = [];
  section: any;
  editingsection: boolean = false;
  modalReference: NgbModalRef;

  @ViewChild('fsection') sectionForm: NgForm;

  @ViewChild('f') promsForm: NgForm;
  proms: any;
  prom: any;
  promsCopy: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  sending: boolean = false;
  translations: any = [];
  editing: boolean = false;
  newvalue: string = '';
  actualHpo: string = '';
  actualSection: any = {};
  showError: boolean = false;
  showTranslations: boolean = false;
  langs: any;
  langSelected: any = [];
  sectionsAndProms: any = [];
  sectionsAndPromsOrigin: any = [];
  hasTranslation: boolean = true;
  actualIdSectionsAndProms: string = null;
  contTranslates: number = 0;
  groupPhenotype: any = [];
  editingValue: boolean = false;
  indexValue: number = 0;
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private router: Router, private langService: LangService, private modalService: NgbModal, private sortService: SortService) {

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.proms = [
    ];

    this.section = {
      name: '',
      description:'',
      enabled: true,
      order: null
    };

    this.prom = {
      name: '',
    	responseType: '',
    	question: '',
    	values: [],
    	section: '',
    	order: null,
    	periodicity: "1",
      relatedTo: null,
      disableDataPoints: null,
      width: '',
      isRequired: false,
      enabled: true,
      hideQuestion: false,
      marginTop: false,
      hpo: ''
    };


    this.loadTranslations();

    this.loadGroups();
    this.loadLanguages();


  }

  loadPhenotypeGroup(name){
    this.subscription.add( this.http.get(environment.api+'/api/group/phenotype/'+name)
    .subscribe( (res : any) => {
      //res.infoPhenotype.data.sort(this.sortService.GetSortOrder("name"));
      this.groupPhenotype = res.infoPhenotype.data;
     }, (err) => {
       console.log(err);
     }));
  }



  loadGroups() {
    //cargar los grupos actuales
    this.subscription.add( this.http.get(environment.api+'/api/groups/')
    .subscribe( (res : any) => {
      this.groups = res;
     }, (err) => {
       console.log(err);
     }));
  }

  resetSection(){
    this.section = {
      name: '',
      description:'',
      enabled: true,
      order: null
    };
  }

  resetForm() {
    this.prom = {
      name: '',
      responseType: '',
      question: '',
      values: [],
      section: '',
      order: null,
      periodicity: "1",
      relatedTo: null,
      disableDataPoints: null,
      width: '',
      isRequired: false,
      enabled: true,
      hideQuestion:false,
      marginTop:false,
      new: true,
      hpo: ''
    };
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

  newSection(contentNewSection){
    this.resetSection();
    this.modalReference = this.modalService.open(contentNewSection);
  }

  closePanelSection(){
    this.modalReference.close();
    this.showError = false;
    this.onChangeGroup(this.groupSelected);
  }

  closePanelProm(){
    this.modalReference.close();
    this.showError = false;
    this.seeProms(this.actualSection);
  }


  onChangeGroup(value){
    //las tres líneas siguientes son para inicializar las traduciones si se cambia de grupo
    this.langSelected = [];
    this.sectionsAndProms = [];
    this.sectionsAndPromsOrigin = [];
    this.editingsection = false;
    this.resetSection();
    //cargar la info
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/group/sections/'+value._id)
    .subscribe( (res : any) => {
      res.sort(this.sortService.GetSortOrder("order"));
      this.sections = res;
      this.actualSection = {};
      this.loading = false;
     }, (err) => {
       console.log(err);
       this.loading = false;
     }));
     this.loadPhenotypeGroup(value.name);
  }

  submitInvalidSectionForm() {
    this.showError = true;
    if (!this.sectionForm) { return; }
    const base = this.sectionForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  submitNewSection(){
    this.showError=false;
    if(this.authGuard.testtoken()){
      this.sending = true;

      if(this.section._id){

        swal({
            title: 'Important, read!',
            html: 'Do you want to overwrite the section title and the description? If you overwrite, remember to make the corresponding translations for each language.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#FF586B',
            confirmButtonText: 'Yes, overwrite',
            cancelButtonText: this.translate.instant("generics.No"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false
        }).then((result) => {
          if (result.value) {
            this.section.machacar = true;
            this.updateSection();
          }else{
            this.section.machacar = false;
            this.updateSection();
          }
        }).catch(swal.noop);



      }else{
        this.subscription.add( this.http.post(environment.api+'/api/group/section/'+this.groupSelected._id, this.section)
        .subscribe( (res : any) => {
          this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
            this.sending = false;
            this.closePanelSection();
            this.onChangeGroup(this.groupSelected);
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
  }

  updateSection(){
    this.subscription.add( this.http.put(environment.api+'/api/group/section/'+this.section._id, this.section)
    .subscribe( (res : any) => {
      this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
        this.sending = false;
        this.closePanelSection();
        this.onChangeGroup(this.groupSelected);
     }, (err) => {
       if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
         this.authGuard.testtoken();
       }else{
         this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
       }
       this.sending = false;
     }));
  }

  editSection(section, contentNewSection){
    this.editingsection = true;
    this.section = section;
    this.modalReference = this.modalService.open(contentNewSection);
  }

  confirmDeleteSection(section){
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ section.name,
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
        this.deleteSection(section._id);
      }
    }).catch(swal.noop);
  }

  deleteSection(sectionId){
    this.subscription.add( this.http.delete(environment.api+'/api/group/section/'+sectionId)
    .subscribe( (res : any) => {
      this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
        this.sending = false;
        this.onChangeGroup(this.groupSelected);
     }, (err) => {
       if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
         this.authGuard.testtoken();
       }else{
         this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
       }
       this.sending = false;
     }));
  }

  seeProms(section){
    this.actualSection = section;
    this.resetForm();
    this.proms = [];
    //cargar la info
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/group/proms/'+section._id)
    .subscribe( (res : any) => {
      if(res.length == 0){
        //no tiene proms
        this.resetForm();
      }else{
        res.sort(this.sortService.GetSortOrder("order"));
        this.proms = res;
      }
      this.loading = false;
     }, (err) => {
       console.log(err);
       this.loading = false;
     }));

  }

  newProm(contentProm){
    this.resetForm();
    var relatedToValue=null
    if(this.proms.length>0){
      this.prom.relatedTo=this.proms[0]._id;
    }
    this.prom.section = this.actualSection._id;
    this.editing = false;
    this.modalReference = this.modalService.open(contentProm);
  }

  addProm(){
    this.proms.push(JSON.parse(JSON.stringify(this.prom)));
    this.promsForm.reset();
    this.prom.values = [];
  }

  editProm(prom, contentProm){
    this.prom = prom;
    this.editing = true;
    this.modalReference = this.modalService.open(contentProm);
  }

  newValueForProm(){
    this.prom.values.push({value: this.newvalue, hpo: this.actualHpo});
    this.newvalue = '';
    this.actualHpo = '';
    this.editingValue = false;
  }

  editValueForProm(index){
    if(this.prom.values[index].value){
      this.newvalue = this.prom.values[index].value;
      this.actualHpo = this.prom.values[index].hpo;
    }else{
      this.newvalue = this.prom.values[index];
      this.actualHpo = '';
    }

    this.editingValue = true;
    this.indexValue = index;
  }

  saveValueForProm(){
    this.prom.values[this.indexValue] = {};
    this.prom.values[this.indexValue].value = this.newvalue;
    this.prom.values[this.indexValue].hpo = this.actualHpo;

    this.indexValue = 0;
    this.newvalue = '';
    this.actualHpo = '';
    this.editingValue = false;
  }

  deleteValueForProm(index){
    this.prom.values.splice(index, 1);
  }




  confirmDeleteProm(prom){
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ prom.name,
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
        this.deleteProm(prom);
      }
    }).catch(swal.noop);
  }

  deleteProm(prom){
    var paramssend = this.authService.getIdUser()+'-code-'+prom._id;
    this.subscription.add( this.http.delete(environment.api+'/api/group/prom/'+paramssend)
    .subscribe( (res : any) => {
      this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
        this.sending = false;
        this.seeProms(this.actualSection);
     }, (err) => {
       if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
         this.authGuard.testtoken();
       }else{
         this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
       }
       this.sending = false;
     }));
  }

  submitInvalidForm() {
    this.showError=true;
    if (!this.promsForm) { return; }
    const base = this.promsForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmit() {
    this.showError=false;
    if(this.authGuard.testtoken()){

      this.sending = true;

      if(this.prom._id){


        swal({
            title: 'Important, read!',
            html: 'Do you want to overwrite the datapoint values? If you overwrite, remember to make the corresponding translations for each language. The same if the question field has changed.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#FF586B',
            confirmButtonText: 'Yes, overwrite',
            cancelButtonText: this.translate.instant("generics.No"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false
        }).then((result) => {
          if (result.value) {
            this.prom.machacar = true;
            this.updateProm();
          }else{
            this.prom.machacar = false;
            this.updateProm();
          }
        }).catch(swal.noop);



      }else{
        var paramssend = this.authService.getIdUser()+'-code-'+this.groupSelected._id;
        this.subscription.add( this.http.post(environment.api+'/api/group/prom/'+paramssend, this.prom)
        .subscribe( (res : any) => {
          this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
            this.closePanelProm();
            this.seeProms(this.actualSection);
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
  }

  updateProm(){
    this.subscription.add( this.http.put(environment.api+'/api/group/prom/'+this.authService.getIdUser(), this.prom)
    .subscribe( (res : any) => {
      this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
        this.closePanelProm();
        this.seeProms(this.actualSection);
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

  showPanelTranslations(){
    this.showTranslations = true;
  }

  back(){
    this.showTranslations = false;
  }

  loadLanguages() {
      this.subscription.add( this.langService.getLangs()
      .subscribe( (res : any) => {
        this.langs=res;
      }));
  }

  onChangeLang(lang){
    this.langSelected = lang;
    this.loading = true;
    this.sectionsAndProms = [];
    this.sectionsAndPromsOrigin = [];
    this.actualIdSectionsAndProms = null;
    this.hasTranslation = false;

    var paramssend = lang.code+'-code-'+this.groupSelected._id;
    this.subscription.add( this.http.get(environment.api+'/api/translationstructureproms/'+paramssend)
    .subscribe( (res : any) =>{
      if(res.message){
        this.hasTranslation = false;

        var paramssend = this.langSelected.code+'-code-'+this.groupSelected._id;
        this.subscription.add( this.http.get(environment.api+'/api/structureproms/'+paramssend)
        .subscribe( (res1 : any) =>{
          this.sectionsAndProms = res1;
          this.sectionsAndPromsOrigin = res1;
          this.maketranslation();

        }, (err) => {
          console.log(err);
          this.loading = false;
          this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
        }));
      }else{
        (res.structureProm.data).sort(this.sortService.GetSortOrderSections("order"));
        for (var i = 0; i < (res.structureProm.data).length; i++) {
          (res.structureProm.data)[i].promsStructure.sort(this.sortService.GetSortOrderProms("order"));
        }
        this.hasTranslation = true;
        this.sectionsAndProms = res.structureProm.data;
        this.sectionsAndPromsOrigin = res.structureProm.data;
        this.actualIdSectionsAndProms = res.structureProm._id;
      }
      this.loading = false;
    }, (err) => {
      console.log(err);
      this.loading = false;
      this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
    }));
  }

  maketranslation(){
    //traducir a ingles
    this.subscription.add( this.http.post('https://api.cognitive.microsoft.com/sts/v1.0/issueToken','')
    .subscribe( (res : any) => {
      sessionStorage.setItem('tokenMicrosoftTranslator', res);

      var jsonText = [];
      //comprobar el idioma
      if(this.sectionsAndProms.length>0){
        jsonText = [{"Text": this.sectionsAndProms[0].section.name}];
      }

      var numPieces = this.sectionsAndProms.length;

      this.contTranslates = 0;
     for (var i = 0; i < numPieces; i++) {
       //section name
       var sectionName = this.sectionsAndProms[i].section.name;
       jsonText = [{"Text":sectionName}];
       this.getTranslationSection(jsonText, i, 'name', numPieces)
       //description of section
       var sectionDescription = this.sectionsAndProms[i].section.description;
       var jsonText2 = [{"Text":sectionDescription}];
       this.getTranslationDescriptionSection(jsonText2, i, 'description')

       for (var j = 0; j < this.sectionsAndProms[i].promsStructure.length; j++) {
         var promQuestion = this.sectionsAndProms[i].promsStructure[j].structure.question;
         var jsonpromQuestion = [{"Text":promQuestion}];
         this.getTranslationProm(jsonpromQuestion, i, j, 'question')

         if(this.sectionsAndProms[i].promsStructure[j].structure.values.length>0){
           for (var k = 0; k < this.sectionsAndProms[i].promsStructure[j].structure.values.length; k++) {

             //la siguiente condicion sobrará
             var promValue = '';
             if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].value){
               promValue = this.sectionsAndProms[i].promsStructure[j].structure.values[k].value;
             }else{
               promValue = this.sectionsAndProms[i].promsStructure[j].structure.values[k];
             }

             var jsonpromValue = [{"Text":promValue}];
             this.getTranslationValue(jsonpromValue, i, j, k)
           }
         }

       }
      }

     }, (err) => {
       console.log(err);
       this.loading = false;
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  getTranslationSection(jsonText, i, field, numPieces){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.langSelected.code, jsonText)
    .subscribe( (res : any) => {
      this.sectionsAndProms[i].section[field] = res[0].translations[0].text;
      this.contTranslates++;
      if(this.contTranslates == numPieces){
        //this.showInfo(this.sectionsAndProms);
       // this.loading = false;
      }
     }, (err) => {
       this.contTranslates++;
       if(this.contTranslates == numPieces){
         //this.showInfo(this.sectionsAndProms);
        // this.loading = false;
       }
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  getTranslationDescriptionSection(jsonText, i, field){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.langSelected.code, jsonText)
    .subscribe( (res : any) => {
      this.sectionsAndProms[i].section[field] = res[0].translations[0].text;
     }, (err) => {
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  getTranslationProm(jsonText, i, j,  field){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.langSelected.code, jsonText)
    .subscribe( (res : any) => {
       this.sectionsAndProms[i].promsStructure[j].structure[field] = res[0].translations[0].text;
     }, (err) => {
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  getTranslationValue(jsonText, i, j, k){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.langSelected.code, jsonText)
    .subscribe( (res : any) => {
      // esta condición sobrará
      if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].value){
        this.sectionsAndProms[i].promsStructure[j].structure.values[k] = {original: this.sectionsAndProms[i].promsStructure[j].structure.values[k].value, translation: res[0].translations[0].text, hpo: this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo};
      }else{
        this.sectionsAndProms[i].promsStructure[j].structure.values[k] = {original: this.sectionsAndProms[i].promsStructure[j].structure.values[k], translation: res[0].translations[0].text, hpo: null};
      }

     }, (err) => {
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  saveTranslation(){
    this.loading = true;
    if(this.actualIdSectionsAndProms==null){
      //var paramssend = this.langSelected.code+'-code-'+this.groupSelected._id;
      var paramssend = { lang: this.langSelected.code, data: this.sectionsAndProms, groupId: this.groupSelected._id};
      this.subscription.add( this.http.post(environment.api+'/api/structureproms', paramssend)
      .subscribe( (res : any) =>{
        this.actualIdSectionsAndProms = res._id;
        this.loading = false;
      }, (err) => {
        console.log(err);
        this.loading = false;
        this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
      }));
    }else{
      var paramssend2 = { lang: this.langSelected.code, data: this.sectionsAndProms};
      this.subscription.add( this.http.put(environment.api+'/api/structureproms/'+this.actualIdSectionsAndProms, paramssend2)
      .subscribe( (res : any) =>{
        this.loading = false;
      }, (err) => {
        console.log(err);
        this.loading = false;
        this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
      }));
    }

  }

}
