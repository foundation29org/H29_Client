import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SortService} from 'app/shared/services/sort.service';
import {DateAdapter} from '@angular/material/core';

@Component({
    selector: 'app-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss'],
    providers: [ApiDx29ServerService]
})

export class StatisticsComponent implements OnDestroy{
  @ViewChild('f') newLangForm: NgForm;

  addedlang: boolean = false;
  lang: any;
  allLangs: any;
  langs: any;
  working: boolean = false;
  loadingUsers: boolean = false;
  users: any = [];
  usersCopy: any = [];
  usersData: any = [];
  userChanged: number = 0
  user: any = {};
  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();
  viewUserSection: boolean = false;
  totalUsersStats: any = [];
  totalStats: number = 0;
  sectionsContent:any=[];
  userSelected: any;
  patient: any;
  numberFiles: number = 0;
  filesOnBlob: any = [];
  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: '',
    patientId: ''
  };
  timeformat="";
  sectionContentListForUser = new Array();


  constructor(private http: HttpClient,
    public translate: TranslateService,
    private authService: AuthService,
    private authGuard: AuthGuard,
    public toastr: ToastsManager,
    private modalService: NgbModal,
    private dateService: DateService,
    private sortService: SortService,
    private blob: BlobStorageService,
    public searchFilterPipe: SearchFilterPipe,
    private adapter: DateAdapter<any>,
  private apiDx29ServerService: ApiDx29ServerService){

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
    this.loadingUsers = true;
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        var groupId = resGroup._id;
        var paramsSend = this.authService.getGroup()+"-code-"+groupId+"-code-"+this.authService.getLang();
        this.subscription.add( this.http.get(environment.api+'/api/admin/stats/'+paramsSend)
        .subscribe( (res : any) => {
          this.users = res;
          this.users=this.users.sort(function(a, b) {
            a = a.userName.toLowerCase();
            b = b.userName.toLowerCase();
            return a < b ? -1 : a > b ? 1 : 0;
          })
          this.usersCopy = JSON.parse(JSON.stringify(this.users));
          this.loadingUsers = false;
        }, (err) => {
          console.log(err);
          this.loadingUsers = false;
        }));
      }, (err) => {
        this.loadingUsers = false;
        console.log(err);
    }));
    this.sectionContentListForUser=[];
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  closePanel(){
    this.users = JSON.parse(JSON.stringify(this.usersCopy));
    this.modalReference.close();
  }
  back(){
    this.viewUserSection = false;
    this.userSelected = '';
  }
  userStatistics(user){
    this.viewUserSection = false;
    this.userSelected = user.userName.toUpperCase();
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+user.userId)
      .subscribe( (res : any) => {
        if(res.listpatients.length>0){
          this.authService.setPatientList(res.listpatients);
          this.authService.setCurrentPatient(res.listpatients[0]);
          //quito el primer caracter, ya que solo deja poner contenedores de 63 caracteres, y tenemos 64
          this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
          this.accessToken.patientId = this.authService.getCurrentPatient().sub;
          //this.blob.createContainerIfNotExists(this.accessToken);
          this.getAzureBlobSasToken();
        }
      }
    ));

    this.subscription.add( this.blob.changeFilesBlob.subscribe(filesOnBlob => {
       this.filesOnBlob = this.blob.filesOnBlob;
       this.numberFiles = filesOnBlob.length
     }));
     var indexData=0;
     user.stats.forEach((stat)=>{
       var indexDataCompare=0;
       user.stats.forEach((statToCompare)=>{
         if((statToCompare.section==stat.section)&&(indexData!=indexDataCompare)){
           statToCompare.data.forEach((dataToAdd)=>{
            stat.data.push(dataToAdd)
           })
           user.stats.splice(indexDataCompare,1)
         }
         indexDataCompare++;
       })
       indexData++
     })
     user.stats.forEach((stat)=>{
       if(stat.totalStats==undefined){
        stat.data.sort(function (a, b){ return a.order - b.order;})
       }
     })
    user.stats=user.stats.sort(function (a, b) { return a.order - b.order; })
    this.getStats(user.stats);
    this.setUserAnswers(user)

  }

  getAzureBlobSasToken(){
    this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    this.accessToken.patientId = this.authService.getCurrentPatient().sub;
    this.subscription.add( this.apiDx29ServerService.getAzureBlobSasToken(this.accessToken.containerName)
    .subscribe( (res : any) => {
      this.accessToken.sasToken = '?'+res;
      this.blob.init(this.accessToken);
      this.blob.loadFilesOnBlob(this.accessToken.containerName);
    }, (err) => {
      console.log(err);
    }));
  }

  getStats(res){
    var totalStats = 0;

    this.sectionContentListForUser=[]
    this.sectionContentListForUser.length=0;
    for(var i =0;i<res.length;i++){
      if(res[i]!=undefined){
        if(res[i].totalStats!=undefined){
          totalStats=res[i].totalStats;
        }
        else{
          // Hasta aqui en ingles
          if(res[i].data!=undefined){
            for(var j=0;j<res[i].data.lenght;j++){
              // comprobar si es la seccion de genotype: chequear si hay archivo subido o no
              if(res[i].section=="Genotype"){
                if(this.numberFiles > 0){
                  //res[i].data[j].stats = 100
                  res[i].data[j].stats = this.translate.instant("stats.Uploaded")
                }
                else{
                  //res[i].data[j].stats = 0
                  res[i].data[j].stats = this.translate.instant("stats.Not uploaded")
                }
              }
              else{
                // Si el resultado de las estadisticas no es un numero, hay que traducir el texto
                // Como Height y Weight
                if(isNaN(res[i].data[j].answers)){
                  res[i].data[j].answers=this.translateAnswers(res[i].data[j].answer);
                }
              }
            }
            this.sectionContentListForUser.push({name:res[i].section,content:res[i].data,isPercentage:true})
          }
        }
      }

    }

    this.totalStats = totalStats;
    this.sectionsContent=this.sectionContentListForUser;


  }
  setUserAnswers(user){
    // lo primero evaluar si hay answers, si array =[] -> todas las answers a NO
    // Si se encuentra answer.type == sectionsContent[i].section  -> answer YES
    // Las de COD buscar a parte: si answer.type==sectionsContent[i].data[j].name SIN TRADUCIR!!!! -> Answer YES
      // para cada estadistica del usuario
      var indexStats=0;
      var hasAnswers=true;
      if(user.answers[0]==undefined){
        hasAnswers=false;
      }

      if(hasAnswers==true){
        user.stats.forEach((stat)=>{
          if(stat!=undefined){
            if((stat.section!=undefined)){
              // Para las secciones con Pregunta
              if((stat.section=="MedicalCare")||(stat.section=="CourseOfTheDisease")
              ||(stat.section=="Medications")||(stat.section=="OtherMedications")
              ||(stat.section=="Vaccinations")||(stat.section=="ClinicalTrials")
              ||(stat.section.toLowerCase()=="genotype")){
                // Recorro el contenido de las secciones
                var indexData=0;
                stat.data.forEach((data)=>{
                  // el caso de medicalCare/general es especial -> No tiene pregunta
                  if(data.name.toLowerCase()=="general"){
                    this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.N/A")
                  }
                  else{
                    // veo si el contenido de la secciones está incluido en las answers
                    var indexAnswers=0;
                    var included=false;
                    var hasAnswers=false;
                    user.answers.forEach((answer)=>{
                      hasAnswers=true;
                      if(answer.type.toLowerCase()==data.name.toLowerCase()){
                        included=true;
                        if((answer.answer == true)||(answer.answer=="Yes")){
                          this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.The patient has answered 'yes'")
                        }
                        else if((answer.answer == false)||(answer.answer=="No")){
                          this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.The patient has answered 'no'")
                        }
                        else{
                          if(stat.section=="CourseOfTheDisease"){
                            if((answer.answer!=undefined)){
                              this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.The patient has answered")
                            }
                            else{
                              this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.The patient has not answered")
                            }
                            //this.sectionsContent[indexStats].content[indexData].answer=answer.answer
                          }
                          else{
                            this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.The patient has not answered")
                          }
                        }
                      }
                      // si no esta incluido
                      if(included==false){
                        this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.The patient has not answered")
                      }
                      indexAnswers++;
                    });
                  }
                  indexData++;
                })
              }
              // Para el resto de secciones se evalua si tienen o no datos -> No hay pregunta en estas secciones
              else{
                var indexData=0;
                stat.data.forEach((data)=>{
                  this.sectionsContent[indexStats].content[indexData].answer= this.translate.instant("stats.N/A")
                  indexData++;
                })
              }
            }
          }
          indexStats++;
        });
      }
      else if(hasAnswers==false){
        this.sectionsContent.forEach((section)=>{
          if((section.name.toLowerCase()=="medicalcare")||(section.name.toLowerCase()=="courseofthedisease")
              ||(section.name.toLowerCase()=="medications")||(section.name.toLowerCase()=="othermedications")
              ||(section.name.toLowerCase()=="vaccinations")||(section.name.toLowerCase()=="clinicaltrials")
              ||(section.name.toLowerCase()=="genotype")){
                section.content.forEach((content)=>{
                  if(content.name.toLowerCase()=="general"){
                    content.answer = this.translate.instant("stats.N/A")
                  }
                  else{
                    content.answer=this.translate.instant("stats.The patient has not answered")
                  }
                })
          }
          else{
            section.content.forEach((content)=>{
              content.answer = this.translate.instant("stats.N/A")
            })
          }

        })

      }

      this.convertStats(user.stats)


  }
  convertStats(stats){
    var indexStats=0;
    stats.forEach((stat)=>{
      if(stat!=undefined){
        if((stat.section!=undefined)){
          // Para las secciones con Pregunta
          if((stat.section.toLowerCase()=="genotype")||(stat.section.toLowerCase()=="anthropometry")){
            var indexData=0;
            stat.data.forEach((data)=>{
              if(data.stats>0){
                this.sectionsContent[indexStats].content[indexData].stats= this.translate.instant("stats.Uploaded")
              }
              else{
                this.sectionsContent[indexStats].content[indexData].stats= this.translate.instant("stats.Not uploaded")
              }
              indexData++;
            });

          }
        }
      }
      indexStats++;
    });

    this.translateSections(stats)

  }
  translateSections(res){
    var sectionsCoDToTranslate=[];
    for(var i=0;i<res.length;i++){
      var sectionName="";
      var indexCoD;
      // Translate name sections, contents
      switch(res[i].section){
        case "SocialInfo":
          sectionName=this.translate.instant('menu.Social Info')
          // traducir el contenido de las secciones que no son de CoD
          res[i].data.forEach(function(data){
            switch(data.name){
              case 'education':
                data.name=this.translate.instant('social.Education')
                break;
              case 'work':
                data.name=this.translate.instant('social.Work')
                break;
              case 'livingSupport':
                data.name=this.translate.instant('social.LivingSupport')
                break;
              case 'sportInterest':
                data.name=this.translate.instant('social.SportsInterests')
                break;
              default:
                break;
            }
          }.bind(this))
          break;
        case "Anthropometry":
          sectionName=this.translate.instant('clinicalinfo.Anthropometry')
          // traducir el contenido de las secciones que no son de CoD
          res[i].data.forEach(function(data){
            switch(data.name){
              case 'height':
                data.name=this.translate.instant('anthropometry.Height')
                break;
              case 'weight':
                data.name=this.translate.instant('anthropometry.Weight')
                break;
              default:
                break;
            }
          }.bind(this));
          break;

        case "Medications":
          sectionName=this.translate.instant('stats.Medications')
          // traducir el contenido de las secciones que no son de CoD
          res[i].data.forEach(function(data){
            switch(data.name){
              case 'drugs':
                data.name=this.translate.instant('clinicalinfo.Drugs')
                break;
              case 'otherDrugs':
                data.name=this.translate.instant('clinicalinfo.Other Drugs')
                break;
              case 'vaccinations':
                data.name=this.translate.instant('clinicalinfo.Vaccinations')
                break;
              default:
                break;

            }
          }.bind(this));
          break;

        case "Genotype":
          sectionName=this.translate.instant('menu.Genotype')
          // traducir el contenido de las secciones que no son de CoD
          res[i].data.forEach(function(data){
            switch(data.name){
              case 'genotype':
                data.name=this.translate.instant('stats.Genetic file')
                break;
              default:
                break;
            }
          }.bind(this));
          break;
        case "ClinicalTrials":
          sectionName=this.translate.instant('clinicalinfo.Clinical Trials')
          // traducir el contenido de las secciones que no son de CoD
          res[i].data.forEach(function(data){
            switch(data.name){
              case 'clinicalTrials':
                data.name=this.translate.instant('clinicalinfo.Clinical Trials')
                break;
              default:
                break;

            }
          }.bind(this));
          break;
        case "MedicalCare":
          sectionName=this.translate.instant('clinicalinfo.Medical Care')
          // traducir el contenido de las secciones que no son de CoD
          res[i].data.forEach(function(data){
            switch(data.name.toLowerCase()){
              case 'general':
                data.name=this.translate.instant('medicalcare.general')
                break;
              case 'specificvisit':
                data.name=this.translate.instant('medicalcare.Specific visit')
                break;
              case 'hospitalization':
                data.name=this.translate.instant('medicalcare.hospitalization')
                break;
              case 'emergencies':
                data.name=this.translate.instant('medicalcare.emergencies')
                break;
              case 'cardiotest':
                data.name=this.translate.instant('medicalcare.cardiotest')
                break;
              case 'respiratorytests':
                data.name=this.translate.instant('medicalcare.respiratorytests')
                break;
              case 'bonehealthtest':
                data.name=this.translate.instant('medicalcare.bonehealthtest')
                break;
              case 'bloodtest':
                data.name=this.translate.instant('medicalcare.bloodtest')
                break;
              case 'surgery':
                data.name=this.translate.instant('medicalcare.surgery')
                break;
              default:
                break;
            }
          }.bind(this));
          break;
        case "CourseOfTheDisease":
          sectionName=res[i].section;
          sectionName=this.translate.instant('Course Of The disease.Course Of The disease')
          sectionsCoDToTranslate.push(res[i])
          indexCoD=i;
          break;
        default:
          sectionName=res[i].section;
          break;

      }
      for(var j=0;j<this.sectionsContent.length;j++){
        if(res[i].section==this.sectionsContent[j].name){
          //set isPercentage
          if((res[i].section=="MedicalCare")||(res[i].section=="ClinicalTrials")
          ||(res[i].section=="Medications")||(res[i].section=="Genotype")
          ||(res[i].section=="Anthropometry")){
            this.sectionsContent[j].isPercentage=false;
          }
          else{
            this.sectionsContent[j].isPercentage=true;
          }
          // translate section name
          this.sectionsContent[j].name=sectionName;
          // And update its content data
          this.sectionsContent[j].content=res[i].data;
        }
      }
    }
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        var groupId = resGroup._id;
        var params=groupId+"-code-"+this.authService.getLang();
        let sections = {sections:[]};
        if(sectionsCoDToTranslate.length>0){
          if(sectionsCoDToTranslate[0].data){
            sections.sections = sectionsCoDToTranslate[0].data;
          }
        }
       
        this.subscription.add(this.http.post(environment.api+'/api/admin/stats/translateCoDSections/'+params, sections).subscribe((resTranslations : any)=>{
          for(var j=0;j<this.sectionsContent.length;j++){
            if(this.sectionsContent[j].name==this.translate.instant('Course Of The disease.Course Of The disease')){
              this.sectionsContent[j].isPercentage=true;
              //var indexContent=0;
              this.sectionsContent[j].content.forEach((sectionCoDContent)=>{
                resTranslations.forEach((sectionTranslated)=>{
                  if(sectionCoDContent.name==sectionTranslated.originalSection){
                    sectionCoDContent.name=sectionTranslated.translatedSection;
                  }
                })
              })

            }
          }
          this.viewUserSection = true;

        }))
      }));

  }
  translateAnswers(answer){
    if(answer == "uploaded"){
      return this.translate.instant("stats.Uploaded")
    }
    else if(answer == "not uploaded"){
      return this.translate.instant("stats.Not uploaded")
    }
    else if(answer == "Yes"){
      return this.translate.instant("stats.Yes")
    }
    else if(answer == "No"){
      return this.translate.instant("stats.No")
    }
    else if(answer == "Not answered"){
      return this.translate.instant("stats.Not answered")
    }
    else if(answer == ""){
      return this.translate.instant("stats.Not answered")
    }
  }
}
