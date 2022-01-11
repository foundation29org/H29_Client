import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart, ActivatedRoute } from "@angular/router";
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { Observable } from 'rxjs/Observable';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { DialogService  } from 'app/shared/services/dialog.service';
import swal from 'sweetalert2';
import {DateAdapter} from '@angular/material/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-courseofthedisease',
    templateUrl: './course-of-the-disease.component.html',
    styleUrls: ['./course-of-the-disease.component.scss']
})

export class CourseOfThediseaseComponent implements OnInit, OnDestroy{
  //Variable Declaration
  sectionsAndProms: any = [];
  section: any;
  proms: any;
  prom: any;
  listPromsChanged: any = [];

  contTranslates: number = 0;
  @ViewChild('f') promsForm: NgForm;

  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  sending: boolean = false;
  isSafari:boolean = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
  isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);
  phenotype: any = {};
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  private subscription: Subscription = new Subscription();
  gradeList:any=[1,2,3,4,5,6,7,8,9,10]

  previousValueData:any=[];
  enableQuestion:any=[];

  constructor(private http: HttpClient, private authService: AuthService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private router: Router, private sortService: SortService, private searchService: SearchService, private adapter: DateAdapter<any>, public dialogService: DialogService,private route: ActivatedRoute) {
    this.adapter.setLocale(this.authService.getLang());
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {

    if(this.listPromsChanged.length>0){
      var obser =this.dialogService.confirm(this.translate.instant("generics.Discard changes for")+ ' ' +this.translate.instant("Course Of The disease.Course Of The disease")+'?');

      return obser}
    return true;
	}

  ngOnInit() {

    this.proms = [
    ];

    this.section = {
      name: '',
      description:'',
      enabled: false
    };

    this.phenotype = {
      validator_id: null,
      validated: false,
      date: null,
      data: [],
      _id: null
    };



    this.loadTranslations();
    this.adapter.setLocale(this.authService.getLang());

    this.loadSectionsAndProms();





  }

  loadSymptoms(){
    this.subscription.add( this.http.get(environment.api+'/api/phenotypes/'+this.authService.getCurrentPatient().sub)
    .subscribe( (res : any) => {
      if(res.message){
        //no tiene fenotipo
      }else{
        this.phenotype = res.phenotype;
      }
     }, (err) => {
       console.log(err);
     }));
  }

  goToAnchor(url){
    for (var i = 0; i < this.sectionsAndProms.length; i++) {
      if(this.sectionsAndProms[i].anchor==url){
        this.sectionsAndProms[i].section.visible =true;
      }else{
        this.sectionsAndProms[i].section.visible =false;
      }
    }
  }


  goTo(url){
    for (var i = 0; i < this.sectionsAndProms.length; i++) {
      if(this.sectionsAndProms[i].section.name==url){
        this.sectionsAndProms[i].section.visible =true;
      }else{
        this.sectionsAndProms[i].section.visible =false;
      }
    }

    /*var urlToSplit = (window.location).toString();
    var spltiurl = urlToSplit.split("#");

    window.location.href = spltiurl[0]+'#'+url;
    window.scrollBy(0,-50);*/


  }

  goPrevious(){
    var enc = false;
    for (var i = 0; i < this.sectionsAndProms.length && !enc; i++) {
      if(this.sectionsAndProms[i].section.visible){
        this.sectionsAndProms[i].section.visible = false;
        this.sectionsAndProms[i-1].section.visible = true;
        enc = true;
        window.scrollTo(0, 0)
      }
    }
  }

  goNext(){
    var enc = false;
    for (var i = 0; i < this.sectionsAndProms.length && !enc; i++) {
      if(this.sectionsAndProms[i].section.visible){
        this.sectionsAndProms[i].section.visible = false;
        this.sectionsAndProms[i+1].section.visible = true;
        enc = true;
        window.scrollTo(0, 0)
      }
    }
  }

  goFinish(){
    window.scrollTo(0, 0)
    this.onSubmit();
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


  showInfo(){
    if(this.sectionsAndProms.length>0){
      this.sectionsAndProms[0].section.visible =true;
    }
    this.sectionsAndProms.sort(this.sortService.GetSortOrderSections("order"));
    for (var i = 0; i < this.sectionsAndProms.length; i++) {
      this.sectionsAndProms[i].promsStructure.sort(this.sortService.GetSortOrderProms("order"));

      //igual sobra el siguiente bucle
      for (var j = 0; j < this.sectionsAndProms[i].promsStructure.length; j++) {
        if(this.sectionsAndProms[i].promsStructure[j].structure.responseType=='Number'){
        }
        if(this.sectionsAndProms[i].promsStructure[j].structure.responseType=='ChoiseAndDate'){
          if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
            this.newchoisedate(i, j);
          }
        }
        if(this.sectionsAndProms[i].promsStructure[j].structure.responseType=='ChoiseAndRangeDate'){
          if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
            this.newchoiserangedate(i, j);
          }
        }
        if(this.sectionsAndProms[i].promsStructure[j].structure.responseType=='NumberChoiseAndDate'){
          if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
            this.newnumberchoisedate(i, j);
          }
        }
        if(this.sectionsAndProms[i].promsStructure[j].structure.responseType=='TextAndDoubleChoiseAndRangeDate'){
          if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
            this.newTextAndDoubleChoiseAndRangeDate(i, j);
          }
        }

      }
    }
    this.loading = false;
    //this.sectionsAndProms = res1;
  }


  getTranslationSection(jsonText, i, field, numPieces){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.authService.getLang(), jsonText)
    .subscribe( (res : any) => {
      this.sectionsAndProms[i].section[field] = res[0].translations[0].text;
      this.contTranslates++;
      if(this.contTranslates == numPieces){
        this.showInfo();
       // this.loading = false;
      }
     }, (err) => {
       this.contTranslates++;
       if(this.contTranslates == numPieces){
         this.showInfo();
        // this.loading = false;
       }
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  getTranslationDescriptionSection(jsonText, i, field){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.authService.getLang(), jsonText)
    .subscribe( (res : any) => {
      this.sectionsAndProms[i].section[field] = res[0].translations[0].text;
     }, (err) => {
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  getTranslationProm(jsonText, i, j,  field){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.authService.getLang(), jsonText)
    .subscribe( (res : any) => {

      if(this.sectionsAndProms[i].promsStructure[j]!=undefined){
        this.sectionsAndProms[i].promsStructure[j].structure[field] = res[0].translations[0].text;
      }

     }, (err) => {
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  getTranslationValue(jsonText, i, j, k){
    this.subscription.add( this.http.post('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+this.authService.getLang(), jsonText)
    .subscribe( (res : any) => {
      if(this.sectionsAndProms[i].promsStructure[j]!=undefined){
        if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].value){
          this.sectionsAndProms[i].promsStructure[j].structure.values[k] = {original: this.sectionsAndProms[i].promsStructure[j].structure.values[k].value, translation: res[0].translations[0].text};
        }else{
          this.sectionsAndProms[i].promsStructure[j].structure.values[k] = {original: this.sectionsAndProms[i].promsStructure[j].structure.values[k], translation: res[0].translations[0].text};
        }
      }

     }, (err) => {
       console.log(err);
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  loadSectionsAndProms(){

    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      if(res.listpatients.length>0){
        this.authService.setPatientList(res.listpatients);
        this.authService.setCurrentPatient(res.listpatients[0]);

        //cargar fenotipo
        this.loadSymptoms();

        //cargar proms
        this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
        .subscribe( (res0 : any) => {
          //con el id del grupo de pacientes, coger la estructura de los proms de cada sección, y ya de paso los datos que tenga guardados el paciente

          var paramssend = { groupId: res0._id, patientId: this.authService.getCurrentPatient().sub};
          this.subscription.add( this.http.get(environment.api+'/api/proms/',{params: paramssend})
          .subscribe( (res1 : any) =>{

            for (var i = 0; i< res1.length;i++){
              for (var j = 0; j < res1[i].promsStructure.length; j++) {
                this.previousValueData.push(res1[i].promsStructure[j].data);
              }
            }

            var paramssend = this.authService.getLang()+'-code-'+res0._id;
            this.subscription.add( this.http.get(environment.api+'/api/translationstructureproms/'+paramssend)
            .subscribe( (res2 : any) =>{
              if(res2.message){
                this.sectionsAndProms = res1;
                //traducciones
                //traducir a ingles
                this.subscription.add( this.http.post('https://api.cognitive.microsoft.com/sts/v1.0/issueToken','')
                .subscribe( (res : any) => {
                  sessionStorage.setItem('tokenMicrosoftTranslator', res);

                  var jsonText = [];
                  //comprobar el idioma
                  if(this.sectionsAndProms.length>0){
                    jsonText = [{"Text": res1[0].section.name}];
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

              }else{
                this.sectionsAndProms = res2.structureProm.data;
                this.sectionsAndProms.sort(this.sortService.GetSortOrderSections("order"));
                res1.sort(this.sortService.GetSortOrderSections("order"));
                for (var i = 0; i < res1.length; i++) {
                  this.sectionsAndProms[i].promsStructure.sort(this.sortService.GetSortOrderProms("order"));
                  res1[i].promsStructure.sort(this.sortService.GetSortOrderProms("order"));

                  for (var j = 0; j < res1[i].promsStructure.length; j++) {
                    if(this.sectionsAndProms[i].promsStructure[j]!== undefined){
                      if(this.sectionsAndProms[i].promsStructure[j].structure.responseType=='ChoiseAndDate' ||
                      this.sectionsAndProms[i].promsStructure[j].structure.responseType=='ChoiseAndRangeDate'||
                      this.sectionsAndProms[i].promsStructure[j].structure.responseType=='TextAndDoubleChoiseAndRangeDate'||
                      this.sectionsAndProms[i].promsStructure[j].structure.responseType=='TextChoiseAndDate'){
                        if(res1[i].promsStructure[j].data==''){
                          res1[i].promsStructure[j].data = [];
                        }
                      }
                      if(this.sectionsAndProms[i].promsStructure[j].structure._id==res1[i].promsStructure[j].structure._id){
                        this.sectionsAndProms[i].promsStructure[j].data = res1[i].promsStructure[j].data;
                      }

                    }

                  }
                }
                this.showInfo();
              }
              //this.enableQuestion=[];
              this.sectionsAndProms.forEach((section)=>{
                this.enableQuestion.push(true)
              })

              var indexSection=0;
              this.sectionsAndProms.forEach((section)=>{
                var firstPromId=section.promsStructure[0].structure._id;
                if(((section.promsStructure[0].data.length==0))||(section.promsStructure[0].data==undefined)
                ||(section.promsStructure[0].data=="No")||(section.promsStructure[0].data=="Do not answer")){
                  this.enableQuestion[indexSection]=false;
                }
                indexSection++;
              });
              //coger parámetros por si viene de modulo de notificaciones
              this.subscription.add( this.route.params.subscribe(params => {
                var section = params['section'];
                if(section!=undefined){
                  this.goToAnchor(section);
                }
              }));

              this.loading = false;
            }, (err) => {
              console.log(err);
              this.loading = false;
              this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
            }));

         }, (err) => {
           console.log(err);
           this.loading = false;
           this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
         }));
       }, (err) => {
         console.log(err);
         this.loading = false;
         this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
       }));
      }else{
        swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
        this.router.navigate(['/user/basicinfo/personalinfo']);
      }
     }, (err) => {
       console.log(err);
       this.loading = false;
     }));

  }


  resetForm() {
    this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
  }

  submitInvalidForm() {
    if (!this.promsForm) { return; }
    const base = this.promsForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  promchanged(prom, idControlField){
    //search if prom is on the list, if exixts, replace

    // Evaluar si es el prom de pregunta (0)
    var datapointQuestion=false;
    this.sectionsAndProms.forEach((section)=>{
      var firstPromId=section.promsStructure[0].structure._id;
      if(prom.structure._id==firstPromId){
        datapointQuestion=true;
      }
    });
    if(datapointQuestion!=false){
      var indexSection=0;
      this.sectionsAndProms.forEach((section)=>{
        if(((section.promsStructure[0].data.length==0))||(section.promsStructure[0].data==undefined)
        ||(section.promsStructure[0].data=="No")||(section.promsStructure[0].data=="Do not answer")){
          this.enableQuestion[indexSection]=false;
        }
        else{
          this.enableQuestion[indexSection]=true;
        }
        indexSection++;
      });
    }

    for (var i = 0; i < this.listPromsChanged.length; i++) {
      if(this.listPromsChanged[i].promId==prom.structure._id){
        this.listPromsChanged.splice(i, 1);
      }
    }
    if(idControlField){
      if(idControlField.control.valid){
        this.listPromsChanged.push({data: prom.data, promId:prom.structure._id});
      }
    }else{
      this.listPromsChanged.push({data: prom.data, promId:prom.structure._id});
    }

  }

  promchangedEvent(prom, event){

    // Actualizar la lista de cambios con los valores de los toogle relacionados con el disabled with
    for (var i = 0; i<this.sectionsAndProms.length;i++){
      for (var j = 0; j < this.sectionsAndProms[i].promsStructure.length; j++) {
        if(((this.sectionsAndProms[i].promsStructure[j].structure.responseType=="Toogle")||
        (this.sectionsAndProms[i].promsStructure[j].structure.responseType=="RadioButtons"))
        &&(prom.structure.disableDataPoints==this.sectionsAndProms[i].promsStructure[j].structure._id)){
          for (var k=0; k<this.sectionsAndProms[i].promsStructure.length;k++){
            if(((this.sectionsAndProms[i].promsStructure[k].structure.responseType=="Toogle")||
            (this.sectionsAndProms[i].promsStructure[j].structure.responseType=="RadioButtons"))
            &&(this.sectionsAndProms[i].promsStructure[k].structure.disableDataPoints==this.sectionsAndProms[i].promsStructure[j].structure._id)){
              for (var l = 0; l < this.listPromsChanged.length; l++) {
                 //search if prom is on the list, if exixts, replace
                if(this.listPromsChanged[l].promId==this.sectionsAndProms[i].promsStructure[k].structure._id){
                  this.listPromsChanged.splice(i, 1);
                }
              }
                this.listPromsChanged.push({data:this.sectionsAndProms[i].promsStructure[k].data,promId:this.sectionsAndProms[i].promsStructure[k].structure._id})
            }
          }
        }
      }
    }

    //search if prom is on the list, if exixts, replace
    for (var i = 0; i < this.listPromsChanged.length; i++) {
      if(this.listPromsChanged[i].promId==prom.structure._id){
        this.listPromsChanged.splice(i, 1);
      }
    }
    this.listPromsChanged.push({data: event, promId:prom.structure._id});


    // Search if any prom has disable with variable asociated to this prom
    for (var i = 0; i<this.sectionsAndProms.length;i++){
      for (var j = 0; j < this.sectionsAndProms[i].promsStructure.length; j++) {
        if((prom.structure.responseType=="Toogle")&&(prom.structure._id!=this.sectionsAndProms[i].promsStructure[j].structure._id)){
          if((event)&&(this.sectionsAndProms[i].promsStructure[j].structure.responseType=="Toogle")&&(this.sectionsAndProms[i].promsStructure[j].structure.disableDataPoints==prom.structure._id)){
            this.previousValueData[j]=(this.sectionsAndProms[i].promsStructure[j].data);
            this.sectionsAndProms[i].promsStructure[j].data=false;

          }
          else if((!event)&&(this.sectionsAndProms[i].promsStructure[j].structure.responseType=="Toogle")&&(this.sectionsAndProms[i].promsStructure[j].structure.disableDataPoints==prom.structure._id)){
            this.sectionsAndProms[i].promsStructure[j].data=this.previousValueData[j];
          }

          else if((event)&&(this.sectionsAndProms[i].promsStructure[j].structure.responseType=="Toogle")&&(prom.structure.disableDataPoints==this.sectionsAndProms[i].promsStructure[j].structure._id)){
            this.previousValueData[j]=(this.sectionsAndProms[i].promsStructure[j].data);
            this.sectionsAndProms[i].promsStructure[j].data=false;
            this.listPromsChanged.push({data: false, promId:this.sectionsAndProms[i].promsStructure[j]});
          }
          else if((!event)&&(this.sectionsAndProms[i].promsStructure[j].structure.responseType=="Toogle")&&(prom.structure.disableDataPoints==this.sectionsAndProms[i].promsStructure[j].structure._id)){
            //Check all datapoints status related with that
            var hasAnyOtherDataPointsDisabledWith=false;
            for (var k=0; k<this.sectionsAndProms[i].promsStructure.length;k++){
              if((this.sectionsAndProms[i].promsStructure[k].structure.responseType=="Toogle")&&(this.sectionsAndProms[i].promsStructure[k].structure.disableDataPoints==this.sectionsAndProms[i].promsStructure[j].structure._id)){
                for(var l=0;l<this.listPromsChanged.length;l++){
                  if(this.listPromsChanged[l].promId==this.sectionsAndProms[i].promsStructure[k].structure._id){
                    if(this.listPromsChanged[l].data==true){
                      hasAnyOtherDataPointsDisabledWith=true;
                    }
                  }
                }

              }
            }
            if(!hasAnyOtherDataPointsDisabledWith){
              this.listPromsChanged.push({data: this.previousValueData[j], promId:this.sectionsAndProms[i].promsStructure[j]});
            }
            else{
              this.sectionsAndProms[i].promsStructure[j].data=false;
              this.listPromsChanged.push({data: false, promId:this.sectionsAndProms[i].promsStructure[j]});
            }
          }
        }
      }
    }


  }


  newchoisedate(i, j){
    this.sectionsAndProms[i].promsStructure[j].data.push({choise:'',date:null});
  }

  newchoiserangedate(i, j){
    this.sectionsAndProms[i].promsStructure[j].data.push({choise:'',startDate:null, endDate:null, other:'',});
  }

  newnumberchoisedate(i, j){
    this.sectionsAndProms[i].promsStructure[j].data.push({number: '',choise:'',date:null, other:'',});
  }

  newTextAndDoubleChoiseAndRangeDate(i, j){
    this.sectionsAndProms[i].promsStructure[j].data.push({CauseOfPain:'',grade:'',area:'',startDate:null, endDate:null});
  }


  deletechoiserangedate(i,j, k){
    this.sectionsAndProms[i].promsStructure[j].data.splice(k, 1);
    if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
      this.newchoiserangedate(i, j);
    }
    this.listPromsChanged.push({data: this.sectionsAndProms[i].promsStructure[j].data, promId:this.sectionsAndProms[i].promsStructure[j].structure._id});
  }

  deletenumberchoisedate(i,j, k){
    this.sectionsAndProms[i].promsStructure[j].data.splice(k, 1);
    if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
      this.newnumberchoisedate(i, j);
    }
    this.listPromsChanged.push({data: this.sectionsAndProms[i].promsStructure[j].data, promId:this.sectionsAndProms[i].promsStructure[j].structure._id});
  }

  deleteTextAndDoubleChoiseAndRangeDate(i,j, k){
    this.sectionsAndProms[i].promsStructure[j].data.splice(k, 1);
    if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
      this.newTextAndDoubleChoiseAndRangeDate(i, j);
    }
    this.listPromsChanged.push({data: this.sectionsAndProms[i].promsStructure[j].data, promId:this.sectionsAndProms[i].promsStructure[j].structure._id});
  }


  deletechoisedate(i,j, k){
    this.sectionsAndProms[i].promsStructure[j].data.splice(k, 1);
    if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
      this.newchoisedate(i, j);
    }
    this.listPromsChanged.push({data: this.sectionsAndProms[i].promsStructure[j].data, promId:this.sectionsAndProms[i].promsStructure[j].structure._id});
  }

  onSubmit() {
    if(this.listPromsChanged.length > 0){
      if(this.authGuard.testtoken()){
        this.sending = true;
        var copyListPromsChanged= JSON.parse(JSON.stringify(this.listPromsChanged));
        this.getHposOfProms(copyListPromsChanged);
        this.subscription.add( this.http.post(environment.api+'/api/proms/'+this.authService.getCurrentPatient().sub, this.listPromsChanged)
        .subscribe( (res : any) => {
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });

          this.listPromsChanged = [];
          this.sending = false;
         }, (err) => {
           console.log(err);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }
    }else{
      this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
    }

  }

  getHposOfProms(listPromsChanged){
    var textToRemoveHpo = [];
    var textToAddHpo = [];
    for (var i = 0; i < this.sectionsAndProms.length; i++) {
      for (var j = 0; j < this.sectionsAndProms[i].promsStructure.length; j++) {
        var enc = false;
        for (var k = 0; k < listPromsChanged.length; k++) {
          if(listPromsChanged[k].promId == this.sectionsAndProms[i].promsStructure[j].structure._id){
            enc = true;
          }
        }
        if(enc){
          if(this.sectionsAndProms[i].promsStructure[j].data!=null){
            if(this.sectionsAndProms[i].promsStructure[j].data.length==0){
              // hpos a quitar
              if(this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Toogle' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Text' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Number' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Date'){
                if(this.sectionsAndProms[i].promsStructure[j].structure.hpo){
                  if(this.sectionsAndProms[i].promsStructure[j].structure.hpo != ""){
                    textToRemoveHpo.push(this.sectionsAndProms[i].promsStructure[j].structure.hpo);
                  }
                }
              }else{
                if(this.sectionsAndProms[i].promsStructure[j].structure.values.length>0){
                  for (var k = 0; k < this.sectionsAndProms[i].promsStructure[j].structure.values.length; k++) {
                    if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo){
                      textToRemoveHpo.push(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo);
                    }
                  }
                }
              }
            }else{
              // hpos a añadir
              if(this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Toogle' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Text' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Number' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Date'){
                if(this.sectionsAndProms[i].promsStructure[j].structure.hpo){
                  if(this.sectionsAndProms[i].promsStructure[j].structure.hpo != ""){
                    textToAddHpo.push(this.sectionsAndProms[i].promsStructure[j].structure.hpo);
                  }
                }
              }else{
                if(this.sectionsAndProms[i].promsStructure[j].structure.values.length>0){
                  var textToAdd = [];
                  var textToRemove = [];
                  for (var k = 0; k < this.sectionsAndProms[i].promsStructure[j].structure.values.length; k++) {
                    if(this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'Choise' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'RadioButtons'){
                      var promValue = this.sectionsAndProms[i].promsStructure[j].structure.values[k].original;
                      if(this.sectionsAndProms[i].promsStructure[j].data == promValue){
                        if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo){
                          textToAdd.push(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo);
                        }
  
                      }else{
                        if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo){
                          if(!this.existsInArray(textToRemove, this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo)){
                            textToRemove.push(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo);
                          }
                          //textToRemove.push(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo);
                        }
                      }
                    }
                    if(this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'ChoiseSet' || this.sectionsAndProms[i].promsStructure[j].structure.responseType == 'CheckboxList'){
                      var promValue = this.sectionsAndProms[i].promsStructure[j].structure.values[k].original;
                      for (var indexData = 0; indexData < this.sectionsAndProms[i].promsStructure[j].data.length; indexData++) {
                        if(this.sectionsAndProms[i].promsStructure[j].data[indexData] == promValue){
                          if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo){
                            textToAdd.push(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo);
                          }
                        }else{
                          if(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo){
                            if(!this.existsInArray(textToRemove, this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo)){
                              textToRemove.push(this.sectionsAndProms[i].promsStructure[j].structure.values[k].hpo);
                            }
                          }
                        }
                      }
  
                    }
  
  
  
                  }
  
                  if(textToRemove.length>0 && textToAdd.length>0){
                    for (var indexData = 0; indexData < textToAdd.length; indexData++) {
                      var enc2 = false;
                      for (var indexData2 = 0; indexData2 < textToRemove.length && !enc2; indexData2++) {
                        if(textToRemove[indexData2] == textToAdd[indexData]){
                          delete textToRemove[indexData2];
                          enc2 = true;
                        }
                      }
                    }
                  }
                  for (var indextextToRemove = 0; indextextToRemove < textToRemove.length; indextextToRemove++) {
                    textToRemoveHpo.push(textToRemove[indextextToRemove]);
                  }
                  for (var indextextToAdd = 0; indextextToAdd < textToAdd.length; indextextToAdd++) {
                    textToAddHpo.push(textToAdd[indextextToAdd]);
                  }
                }
              }
            }
          }
          
        }

      }
    }

    //get hpo names
    this.getHpoNamesAndSaveAdd(textToAddHpo, textToRemoveHpo);

  }

  getHpoNamesAndSaveAdd(textToAddHpo, textToRemoveHpo){
    var hposStrins =[];
    textToAddHpo.forEach(function(element) {
      if(element!=undefined){
        hposStrins.push(element);
      }
    });

    if(hposStrins.length>0){
      let httpParams = new HttpParams();
      hposStrins.forEach(id => {
        httpParams = httpParams.append('symtomCodes', id);
      });

      this.subscription.add( this.http.get(environment.api+'/api/hpoinfoservice/',{params: httpParams})
        .subscribe( (res : any) => {
          for (var i = 0; i < res.length; i++) {
            var found = false;
            for (var j = 0; j < this.phenotype.data.length && !found; j++) {
              if(res[i].id==this.phenotype.data[j].id){
                found = true;
              }
            }
            if(!found){
                this.phenotype.data.push({id: res[i].id,name: res[i].name});
            }
          }
          this.getHpoNamesAndSaveRemove(textToRemoveHpo);

       }, (err) => {
         console.log(err);
         this.getHpoNamesAndSaveRemove(textToRemoveHpo);
       }));
    }else{
      this.getHpoNamesAndSaveRemove(textToRemoveHpo);
    }

  }

  getHpoNamesAndSaveRemove(textToRemoveHpo){
    var hposStrins =[];
    textToRemoveHpo.forEach(function(element) {
      if(element!=undefined){
        hposStrins.push(element);
      }
    });

    if(hposStrins.length>0){
      let httpParams = new HttpParams();
      hposStrins.forEach(id => {
        httpParams = httpParams.append('symtomCodes', id);
      });

      this.subscription.add( this.http.get(environment.api+'/api/hpoinfoservice/',{params: httpParams})
        .subscribe( (res : any) => {
          for (var i = 0; i < res.length; i++) {
            var found = false;
            for (var j = 0; j < this.phenotype.data.length && !found; j++) {
              if(res[i].id==this.phenotype.data[j].id){
                found = true;
                delete this.phenotype.data[j];
              }
            }
          }
          this.saveSymptoms();
       }, (err) => {
         console.log(err);
         this.saveSymptoms();
       }));
    }else{
      this.saveSymptoms();
    }

  }

  existsInArray(arrayc, hpo){
    var result = false;
    for (var i = 0; i < arrayc.length; i++) {
      if(arrayc[i]==hpo){
        result = true;
      }
    }
    return result;
  }

  addSymptom(symptom){
    var foundElement = this.searchService.search(this.phenotype.data,'id', symptom.id);
    if(!foundElement){
      this.phenotype.data.push({id: symptom.id,name: symptom.name, new: true});
    }
  }

  removeSymptom(symptom){
    var foundElement = this.searchService.search(this.phenotype.data,'id', symptom.id);
    if(foundElement){
      var enc = false;
      for(var i = 0; i < this.phenotype.data.length && !enc; i++) {
        if(symptom.id == this.phenotype.data[i].id){
          delete this.phenotype.data[i];
          enc = true;
        }
      }
    }
  }

  saveSymptoms(){
    if(this.authGuard.testtoken()){
      var phenotoSave = JSON.parse(JSON.stringify(this.phenotype));
      phenotoSave.data = [];
      for (var i = 0; i <  this.phenotype.data.length; i++) {
        if(this.phenotype.data[i]!=null){
          phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name});
        }
      }
      this.phenotype = JSON.parse(JSON.stringify(phenotoSave));
      this.phenotype.date = Date.now();
      if(this.phenotype._id==null){
        this.subscription.add( this.http.post(environment.api+'/api/phenotypes/'+this.authService.getCurrentPatient().sub, this.phenotype)
        .subscribe( (res : any) => {
          this.phenotype = res.phenotype;
         }, (err) => {
           console.log(err);
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/phenotypes/'+this.phenotype._id, this.phenotype)
        .subscribe( (res : any) => {
          this.phenotype = res.phenotype;
         }, (err) => {
           console.log(err.error);
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }
    }
  }

}
