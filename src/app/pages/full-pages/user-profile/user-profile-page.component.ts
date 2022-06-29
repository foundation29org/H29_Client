import { Component, ViewChild, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { Router } from '@angular/router';
import { User } from './user.interface';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { LangService } from 'app/shared/services/lang.service';
import swal from 'sweetalert2';
import { sha512 } from "js-sha512";
import { Injectable, Injector } from '@angular/core';
import { EventsService} from 'app/shared/services/events.service';
import { Subscription } from 'rxjs/Subscription';
import * as jsPDF from 'jspdf'
import { DatePipe } from '@angular/common';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { RequestOptions } from '@angular/http';
declare let cordova: any;
declare let window: any;
declare let FileTransfer: any;
declare var device;

@Component({
    selector: 'app-user-profile-page',
    templateUrl: './user-profile-page.component.html',
    styleUrls: ['./user-profile-page.component.scss'],
    providers: [LangService]
})

@Injectable()
export class UserProfilePageComponent implements OnInit, OnDestroy {
    //Variable Declaration
    @ViewChild('f') userForm: NgForm;
    @ViewChild('fPass') passwordForm: NgForm;

    modalReference: NgbModalRef;
    public user: any;
    private userCopy: User;
    langs: any;
    private msgDataSavedOk: string;
    private msgDataSavedFail: string;
    private msgDownload: string;
    private msgView: string;
    private msgtoDownload: string;
    loading: boolean = false;
    loadingModalPDF: boolean = false;
    sending: boolean = false;
    activeTittleMenu: string = 'General';
    msgActiveTittleMenu: string = '';
    item: number = 0;
    tittleGeneral: string = '';
    tittlePassword: string = '';
    tittleExportData: string = '';
    credentials: any = {};
    filteredPDFsections = [];
    promsTraducidos: any;
    listaPromsTraducidos: any;
    listaSectionsTraducidos: any;
    userGroup: any;
    groupsInfo: any;
    openurl: string ='';

    dateNow;
    timeformat;


    private subscription: Subscription = new Subscription();

    role: string = '';

    generatingPDF:boolean=false;
    exportPDFSelected:boolean=false;
    pdfGenerated:boolean=true;
    duchenneinternational: string = globalvars.duchenneinternational;
    subgroup: string;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

    constructor(private http: HttpClient, private modalService: NgbModal, private datePipe: DatePipe, private authService: AuthService, public toastr: ToastsManager, public translate: TranslateService, private authGuard: AuthGuard, private langService:LangService, private elRef: ElementRef, private router: Router, private dateService: DateService, private inj: Injector) {
      this.subgroup = this.authService.getSubgroup();
      //obter las lista de idiomas
      this.loadLanguages();

      switch(this.authService.getLang()){
        case 'en':
          this.timeformat="MM-dd-yyyy";
          break;
        case 'es':
            this.timeformat="dd-MM-yyyy";
            break;
        case 'nl':
            this.timeformat="dd-MM-yyyy";
            break;
        default:
            this.timeformat="MM-dd-yyyy";
            break;

      }


      $.getScript("./assets/js/docs/pdf/pdf.js").done(function(script, textStatus) {
      });

      $.getScript("./assets/js/docs/pdf/pdf.worker.js").done(function(script, textStatus) {
      });
     }

     ngOnDestroy() {
       this.subscription.unsubscribe();
     }

     loadLanguages() {
       this.subscription.add( this.langService.getLangs()
       .subscribe( (res : any) => {
         this.langs=res;
       }));
     }

    ngOnInit() {
      //this.dateNow=new Date();

      //cargar los datos del usuario
      this.loading = true;
      this.role = this.authService.getRole();
      this.subscription.add( this.http.get(environment.api+'/api/users/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        this.user = res.user;
        this.userGroup = res.user.group
        this.userCopy = JSON.parse(JSON.stringify(res.user));
        this.loading = false;
        this.translate.use(this.user.lang);

       }, (err) => {
         console.log(err);
         this.loading = false;
       }));

       this.subscription.add( this.translate.onLangChange.subscribe((event: { lang: string, translations: any }) => {
         this.loadTranslations();
       }));

       this.loadTranslations();

       this.credentials = {
         password: '',
         password2: '',
         actualpassword: ''
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
      this.translate.get('profile.General').subscribe((res: string) => {
        this.tittleGeneral=res;
        this.msgActiveTittleMenu = res;
      });
      this.translate.get('generics.Password').subscribe((res: string) => {
        this.tittlePassword=res;
      });
      this.translate.get('generics.ExportData').subscribe((res: string) => {
        this.tittleExportData=res;
      });
      this.translate.get('generics.Download').subscribe((res: string) => {
        this.msgDownload=res;
      });
      this.translate.get('generics.View').subscribe((res: string) => {
        this.msgView=res;
      });
      this.translate.get('generics.To download the file').subscribe((res: string) => {
        this.msgtoDownload=res;
      });

    }

    onChangeLang(newValue, index) {
      //this.translate.use(newValue);
      //this.onSubmit();
    }

    resetForm() {
      this.user= JSON.parse(JSON.stringify(this.userCopy));
      this.translate.use(this.user.lang);
      this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
    }

    submitInvalidForm() {
      if (!this.userForm) { return; }
      const base = this.userForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    differenceOf2Arrays (array1, array2) {
      const temp = [];
      for (var i in array1) {
      if(!array2.includes(array1[i])) temp.push(array1[i]);
      }
      for(i in array2) {
      if(!array1.includes(array2[i])) temp.push(array2[i]);
      }
      return temp.sort((a,b) => a-b);
    }

    onSubmit() {
      if(this.authGuard.testtoken()){
        this.sending = true;
        this.subscription.add( this.http.put(environment.api+'/api/users/'+this.authService.getIdUser(), this.user)
        .subscribe( (res : any) => {
          if(this.userCopy.lang!=this.user.lang){
          //enviar al componente customizer para que recargue el bot para el nuevo idioma
            var eventsLang = this.inj.get(EventsService);
            eventsLang.broadcast('changelang', this.user.lang);
          }

          //para no estar emitiendo sin haber cambiado los módulos, mirar si hay algún modulo distinto que haya cambiado
          var result = this.differenceOf2Arrays (this.userCopy.modules, this.user.modules)
          if(result.length>0){
            var eventsService = this.inj.get(EventsService);
            eventsService.broadcast('changemodules', this.user.modules);
          }


          this.user = res.user;
          this.userCopy = JSON.parse(JSON.stringify(res.user));
          this.authService.setLang(this.user.lang);
          this.translate.use(this.user.lang);
          this.sending = false;
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });

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
    }


  SetActive(event, panelId: string) {
      var hElement: HTMLElement = this.elRef.nativeElement;
      //now you can simply get your elements with their class name
      var allAnchors = hElement.getElementsByClassName('list-group-item');
      //do something with selected elements
      [].forEach.call(allAnchors, function (item: HTMLElement) {
        item.setAttribute('class', 'list-group-item no-border');
      });
      //set active class for selected item
      event.currentTarget.setAttribute('class', 'list-group-item bg-blue-grey bg-lighten-5 border-right-primary border-right-2');

      if (panelId === 'panelGeneral') {
        this.activeTittleMenu = "General";
        this.msgActiveTittleMenu = this.tittleGeneral;
      }else if (panelId === 'panelPassword') {
        this.activeTittleMenu = "Password";
        this.msgActiveTittleMenu = this.tittlePassword;
      }else if (panelId === 'PanelExportData') {
        this.activeTittleMenu = "ExportData";
        this.msgActiveTittleMenu = this.tittleExportData;
      }

      $('.content-overlay').removeClass('show');
      $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
      $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');

    }

    toggleMenu(){
      if($('.chat-app-sidebar-toggle').hasClass('ft-align-justify')){
        $('.chat-app-sidebar-toggle').removeClass('ft-align-justify').addClass('ft-x');
        $('.chat-sidebar').removeClass('d-none d-sm-none').addClass('d-block d-sm-block');
        $('.content-overlay').addClass('show');
      }else{
        $('.content-overlay').removeClass('show');
        $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
        $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');
      }
    }

    submitInvalidPassForm() {
      if (!this.passwordForm) { return; }
      const base = this.passwordForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched();
        }
      }
    }

    onSubmitPass(){
      this.sending = true;

      this.passwordForm.value.actualpassword=sha512(this.passwordForm.value.actualpassword);
        this.passwordForm.value.password=sha512(this.passwordForm.value.password);
        var paramssend = { email: this.user.email, actualpassword: this.passwordForm.value.actualpassword, newpassword: this.passwordForm.value.password};

        this.subscription.add( this.http.post(environment.api+'/api/newpass',paramssend)
        .subscribe( (res : any) => {


            if(res.message == "password changed"){
              swal('', this.translate.instant("recoverpass.Password changed"), "success");
            }else if(res.message == "Login failed" || res.message == "Not found"){
              swal('', this.translate.instant("profile.The current password is incorrect"), "error");
            }else if(res.message == "Account is temporarily locked"){
              swal('', this.translate.instant("login.Account is temporarily locked"), "error");
              this.authService.logout();
              this.router.navigate([this.authService.getLoginUrl()]);
            }else if(res.message == "Account is unactivated"){
                swal('', this.translate.instant("login.The account is not activated"), "error");
            }
            this.sending = false;
            this.passwordForm.reset();
         }, (err) => {
           //errores de fallos
           var errormsg=err.error.message;
           swal(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again")+' error: '+ errormsg, "error");
           this.sending = false;
           this.passwordForm.reset();
         }));

    }

    exportData(tipo){
      this.loading = true
      document.getElementById('content').innerHTML = "";
      this.subscription.add(this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        if(res.listpatients.length>0){
          this.authService.setPatientList(res.listpatients);
          this.authService.setCurrentPatient(res.listpatients[0]);
          this.subscription.add( this.http.get(environment.api+'/api/exportdata/' + res.listpatients[0].sub)
          .subscribe( (res : any) => {
            this.export(tipo,res);
          }))
        }else{
          swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
          this.router.navigate(['/user/basicinfo/personalinfo']);
        }
      }))
    }

    openPDFModal(modalPDF){
      this.exportPDFSelected=true;
      this.loadingModalPDF=true;
      this.generatingPDF=true;
      this.pdfGenerated=false;

      let ngbModalOptions: NgbModalOptions = {
        backdrop : 'static',
        keyboard : false
      };
      this.modalReference = this.modalService.open(modalPDF, ngbModalOptions);

      var hasGroup = false;

              this.subscription.add( this.http.get(environment.api+'/api/groups/')
              .subscribe( (res : any) => {
                this.groupsInfo = res
                var userGroupId

                res.forEach(grupo => {
                  if(grupo.name == this.userGroup){
                    hasGroup = true;
                    userGroupId = grupo._id
                    var paramssend = this.user.lang+'-code-'+userGroupId;
                     this.subscription.add( this.http.get(environment.api+'/api/translationstructureproms/'+paramssend)
                    .subscribe( (res : any) =>{
                      if(res.structureProm!=undefined){
                        this.promsTraducidos = res
                        //translate proms
                        var promTranslated = []
                        res.structureProm.data.forEach(structure => {
                          for(var c = 0; c < structure.promsStructure.length; c++){
                            promTranslated.push({question: structure.promsStructure[c].structure.question,
                            responseType: structure.promsStructure[c].structure.responseType,
                            relatedTo: structure.promsStructure[c].structure.relatedto,
                            values: structure.promsStructure[c].structure.values,
                            id: structure.promsStructure[c].structure._id,
                            section: structure.section.name})
                          }
                        })
                        this.listaPromsTraducidos = promTranslated
                        //translate section names
                        var sectionNames = []
                        this.promsTraducidos.structureProm.data.forEach(structure => {
                          sectionNames.push({id:structure.section._id,
                          name:structure.section.name})
                        });
                        this.listaSectionsTraducidos = sectionNames
                      }

                      this.loadingModalPDF=false;

                    }, (err) => {
                      console.log(err);
                      //this.modalReference = this.modalService.open(modalPDF, ngbModalOptions);
                      this.modalReference.close();
                      this.loadingModalPDF=false;
                    }));
                  }
                });

                if(!hasGroup){
                  //this.modalReference = this.modalService.open(modalPDF/*, ngbModalOptions*/);
                  this.loadingModalPDF=false;
                }

              }, (err) => {
                console.log(err);
                this.modalReference.close();
                this.loadingModalPDF=false;
              }));


    }

    selectSections(type){
      let socialInfo = document.getElementById('socialInfo');
      let anthropometry = document.getElementById('anthropometry');
      let medication = document.getElementById('medication');
      let clinicalTrials = document.getElementById('clinicalTrials');
      let medicalCare = document.getElementById('medicalCare');
      let courseOfTheDisease = document.getElementById('courseOfTheDisease');
      let filterButton = document.getElementById('filterButton');
      if(type == "select"){

        (<HTMLInputElement>socialInfo).checked = true;
        (<HTMLInputElement>anthropometry).checked = true;
        (<HTMLInputElement>medication).checked = true;
        (<HTMLInputElement>clinicalTrials).checked = true;
        (<HTMLInputElement>medicalCare).checked = true;
        (<HTMLInputElement>courseOfTheDisease).checked = true;
        (<HTMLInputElement>filterButton).disabled = false;
      }
      else if(type == "deselect"){
        (<HTMLInputElement>socialInfo).checked = false;
        (<HTMLInputElement>anthropometry).checked = false;
        (<HTMLInputElement>medication).checked = false;
        (<HTMLInputElement>clinicalTrials).checked = false;
        (<HTMLInputElement>medicalCare).checked = false;
        (<HTMLInputElement>courseOfTheDisease).checked = false;
        (<HTMLInputElement>filterButton).disabled = true;

      }
      else if(type == "filter"){


        this.filteredPDFsections = []

        if((<HTMLInputElement>socialInfo).checked){
          this.filteredPDFsections.push("socialInfo");
        }
        if((<HTMLInputElement>anthropometry).checked){
          this.filteredPDFsections.push("anthropometry");
        }
        if((<HTMLInputElement>medication).checked){
          this.filteredPDFsections.push("medication");
        }
        if((<HTMLInputElement>clinicalTrials).checked){
          this.filteredPDFsections.push("clinicalTrials");
        }
        if((<HTMLInputElement>medicalCare).checked){
          this.filteredPDFsections.push("medicalCare");
        }
        if(this.promsTraducidos!=undefined){
          if((<HTMLInputElement>courseOfTheDisease).checked){
            this.filteredPDFsections.push("courseOfTheDisease");
          }
        }

        this.exportData('pdf')
        this.modalReference.close();
      }
    }

    setFilter(event){
      var noSelected = true;

      let socialInfo = document.getElementById('socialInfo');
      let anthropometry = document.getElementById('anthropometry');
      let medication = document.getElementById('medication');
      let clinicalTrials = document.getElementById('clinicalTrials');
      let medicalCare = document.getElementById('medicalCare');
      let courseOfTheDisease = document.getElementById('courseOfTheDisease');
      let filterButton = document.getElementById('filterButton');
      if((<HTMLInputElement>socialInfo).checked){
        noSelected = false;
      }
      if((<HTMLInputElement>anthropometry).checked){
        noSelected = false;
      }
      if((<HTMLInputElement>medication).checked){
        noSelected = false;
      }
      if((<HTMLInputElement>clinicalTrials).checked){
        noSelected = false;
      }
      if((<HTMLInputElement>medicalCare).checked){
        noSelected = false;
      }
      if(this.promsTraducidos!=undefined){
        if((<HTMLInputElement>courseOfTheDisease).checked){
          noSelected = false;
        }
      }

      if(noSelected){
        (<HTMLInputElement>filterButton).disabled = true
      }
      else{
        (<HTMLInputElement>filterButton).disabled = false
      }
    }


    export(tipo, data){
      //cargar los datos del usuario

      switch(tipo){
        case "json":{
          var json = JSON.stringify(data);
          var blob = new Blob([json], {type: "application/json"});
          this.openurl  = URL.createObjectURL(blob);
          var p = document.createElement('p');
          var t = document.createTextNode(this.msgDownload+":");
          if(this.isApp){
            if(device.platform == 'iOS'){
              t = document.createTextNode(this.msgView+":");

            }
          }
          p.appendChild(t);
          document.getElementById('content').appendChild(p);
          var a = document.createElement('a');
          var dateNow = new Date();
          var stringDateNow = this.dateService.transformDate(dateNow);
          if(!this.isApp){
            a.download    = "dataHealth29_"+stringDateNow+".json";
            a.href        = this.openurl;
          }else{
            a.href        = "javascript:void(0)";
          }

          a.textContent = "dataHealth29_"+stringDateNow+".json";
          document.getElementById('content').appendChild(a);
          if (this.isApp) {

            if(device.platform != 'iOS'){
              var p = document.createElement('p');
              var t = document.createTextNode('Data saved on download folder');
              p.appendChild(t);
              document.getElementById('content').appendChild(p);
              this.saveBlob2File(a.textContent, blob);
            }else{
              var p = document.createElement('p');
              var t = document.createTextNode(this.msgtoDownload);
              p.appendChild(t);
              document.getElementById('content').appendChild(p);
            }
            this.goToExternalUrl(this.openurl);
          }
          //this.loading = false;
          this.loading = false
          break;
        }
        case "pdf":{
          this.generatingPDF = true;
          var doc = new jsPDF()
          this.parsePDF(data,doc);

          // Save the PDF
          var date = new Date()
          doc.save(this.datePipe.transform(date, this.timeformat) + '-Report.pdf');
          var blob2 = doc.output('blob');
          this.openurl  = URL.createObjectURL(blob2);
          var p = document.createElement('p');
          var t = document.createTextNode(this.msgDownload+":");
          if(this.isApp){
            if(device.platform == 'iOS'){
              t = document.createTextNode(this.msgView+":");
            }
          }
          p.appendChild(t);
          document.getElementById('content').appendChild(p);
          var a = document.createElement('a');
          var dateNow = new Date();
          var stringDateNow = this.dateService.transformDate(dateNow);
          if(!this.isApp){
            a.download    = "dataHealth29_"+stringDateNow+".pdf";
            a.href        = this.openurl;
          }else{
            a.href        = "javascript:void(0)";
          }
          a.textContent = this.datePipe.transform(date, this.timeformat) + '-Report.pdf';
          document.getElementById('content').appendChild(a);


          var name = this.datePipe.transform(date, this.timeformat) + '-Report.pdf';
          if (this.isApp) {

            if(device.platform != 'iOS'){
              var p = document.createElement('p');
              var t = document.createTextNode('Pdf saved on download folder');
              p.appendChild(t);
              document.getElementById('content').appendChild(p);
              this.saveBlob2File(name, blob);
            }else{
              var p = document.createElement('p');
              var t = document.createTextNode(this.msgtoDownload);
              p.appendChild(t);
              document.getElementById('content').appendChild(p);
            }
            this.goToExternalUrl(this.openurl);
          }
          this.generatingPDF=false;
          this.pdfGenerated=true;
          this.loading = false
          break;
        }
        default:{
          break;
        }
      }
    }

    goToExternalUrl(url){
      if (this.isApp) {

        if(device.platform == 'iOS'){
          cordova.InAppBrowser.open(this.openurl, '_blank', 'location=yes');
        }else{
          cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });

        }

      }else{
        window.open(url, '_blank');
      }
    }

    saveBlob2File (fileName, blob) {
        var folder = cordova.file.externalRootDirectory + 'Download'
        if(device.platform == 'iOS'){
          folder = cordova.file.documentsDirectory;
        }
        window.resolveLocalFileSystemURL(folder, function (dirEntry) {
          this.createFile(dirEntry, fileName, blob)
        }.bind(this), this.onErrorLoadFs)
      }

      createFile (dirEntry, fileName, blob) {
        // Creates a new file
        dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
          this.writeFile(fileEntry, blob)
        }.bind(this), this.onErrorCreateFile)
      }

      writeFile (fileEntry, dataObj) {
        // Create a FileWriter object for our FileEntry
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            swal({
                title: 'Saved on download folder.',
                type: 'success',
                showCancelButton: false,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: 'ok',
                }
            );
          }

          fileWriter.onerror = function (error) {
            console.log('Failed file write: ' + error)
          }
          fileWriter.write(dataObj)
        })
      }

      onErrorLoadFs (error) {
        console.log(error)
      }

      onErrorCreateFile (error) {
        console.log(error)
      }

    newHeather(doc){
      // heather
      var lineText = 0
      var img = document.createElement('img');
      var date = new Date()
      if(this.user.group == this.duchenneinternational){
        img.src = "https://health29.org/assets/img/duchenne-medium.png"
      }
      else{
        img.src = "https://health29.org/assets/img/duchenne-medium.png"
      }
      doc.addImage(img, 'png', 20, lineText+= 5, 20, 10);
      doc.setFontType("bold");
      doc.setFontSize(15);
      doc.text(80, lineText+= 5, this.translate.instant("generics.PatientReport"));
      doc.setFontSize(12);
      doc.text(170, lineText, this.datePipe.transform(date, this.timeformat))
      // footer
      var logoHealth = document.createElement('img');
      logoHealth.src = "https://health29.org/assets/img/duchenne-medium.png"
      doc.addImage(logoHealth, 'png', 20, 280, 20, 10);
      doc.setFontType("normal");
      doc.setFontSize(10);
      doc.text(105, 286, "Copyright " + this.datePipe.transform(date, 'yyyy'))
      doc.setTextColor(0,157,160)
      doc.text(130, 286,  "http://www.foundation29.org/ ")
      doc.setTextColor(0,0,0)
      doc.text(176, 286, "All rights reserved.")
      return lineText
    }

    checkIfNewPage(doc, lineText){
      if(lineText < 280){
        return lineText
      }
      else{
        doc.addPage()
        lineText = this.newHeather(doc)
        return lineText + 20
      }
    }

    writePromsInPDF(firstProm,doc, prom, lineText, promPosition, promTranslated){
      if(prom[0].relatedTo == null ||(prom[0].relatedTo == firstProm[0].promId)){
        if(prom[0].hideQuestion == false){
          lineText = this.checkIfNewPage(doc,lineText += 10)
          if(prom[0].responseType == "Title"){//title
            doc.setFontType("bold");
            doc.setFontSize(11);
            doc.setTextColor(0,0,0)
            //doc.text(promPosition, lineText, prom[0].question)
            doc.text(promPosition, lineText, promTranslated.question)
            doc.setFontType("normal");
          }
          else{// label & more
            var hideLabel = false;
            if(prom[0].responseType == "Label"){
              doc.setTextColor(0,0,0)
              if((prom[0].question).indexOf('Please, choose which options are applicable to you')!=-1){
                lineText -= 10;
                hideLabel = true;
              }
            }
            else if(prom[0].name == "Pregunta"){
              lineText -= 10;
              hideLabel = true;
            }
            else{
              doc.setTextColor(117,120,125)
            }

            if(!hideLabel){
              doc.setFontType("normal");
              doc.setFontSize(11);
              //doc.text(promPosition, lineText, prom[0].question)

              // si tiene \n salto de pagina
              var s = promTranslated.question.split('\n');
              /*if(s.length > 1){
                for(var q = 1; q < s.length; q++){
                  lineText = this.checkIfNewPage(doc,lineText += 5)
                }
              }*/

              // para arrays largos normales
              if(promTranslated.question.length > 104 && s.length <= 1){
                var promlength = promTranslated.question.length
                var promstart = 0
                var promNextMark = 95
                var newLineText = lineText
                while(promlength > 0){
                  //uno despues de " "
                  var numberOfJump = 1+ promTranslated.question.lastIndexOf(" ", promNextMark);
                  var res = promTranslated.question.slice(promstart, promstart + numberOfJump);
                  doc.text(promPosition, newLineText, res)
                  promNextMark = numberOfJump + 95
                  promstart += numberOfJump
                  promlength -= numberOfJump
                  if(promlength > 0){
                    newLineText = this.checkIfNewPage(doc,newLineText += 5)
                  }
                }
                lineText = newLineText
              }
              else{
                doc.text(promPosition, lineText, promTranslated.question)
              }
            }



          }
        }
        //escribir segun el tipo de respuesta
        if(prom[0].responseType == "Toogle"){//yes o no
          lineText = this.checkIfNewPage(doc,lineText += 5)
          doc.setTextColor(0,0,0)
          doc.setFontType("normal");
          doc.setFontSize(11);
          doc.text(promPosition, lineText, prom[0].data == true? this.translate.instant("generics.Yes") : this.translate.instant("generics.No"))
        }
        else if(prom[0].name == "Pregunta"){//yes o no
          //return lineText
          //lineText = this.checkIfNewPage(doc,lineText += 5)
          //doc.setTextColor(0,0,0)
          //doc.setFontType("normal");
          //doc.setFontSize(11);
          /*if(prom[0].data == "Yes"){
            doc.text(promPosition, lineText, this.translate.instant("generics.Yes"))
          }
          else if(prom[0].data == "No"){
            doc.text(promPosition, lineText, this.translate.instant("generics.No"))
          }
          else{
            doc.text(promPosition, lineText, "-")
          }*/
        }
        else if(prom[0].responseType == "CheckboxList"){//list of prom.values if data == true
          if(prom[0].data.length > 0){
            var contador = 0
            prom[0].data.forEach(data => {
              if(data == true){
                lineText = this.checkIfNewPage(doc,lineText += 5)
                doc.setTextColor(0,0,0)
                doc.setFontType("normal");
                doc.setFontSize(11);
                if(prom[0].values[contador].value != undefined){
                  promTranslated.values.forEach(element => {
                    if(prom[0].values[contador].value == element.original){
                      doc.text(promPosition, lineText, element.translation);
                    }
                  });
                }
                else{
                  //doc.text(promPosition, lineText, prom[0].values[contador]);
                  promTranslated.values.forEach(element => {
                    if(prom[0].values[contador] == element.original){
                      doc.text(promPosition, lineText, element.translation);
                    }
                  });
                }
                contador++
              }
            });
          }
          else{
            lineText = this.checkIfNewPage(doc,lineText += 5)
            doc.setTextColor(0,0,0)
            doc.setFontType("normal");
            doc.setFontSize(11);
            doc.text(promPosition, lineText, "-");
          }
        }
        else if(prom[0].responseType == "Date"){//substring date
          lineText = this.checkIfNewPage(doc,lineText += 5)
          doc.setTextColor(0,0,0)
          doc.setFontType("normal");
          doc.setFontSize(11);
          doc.text(promPosition, lineText, prom[0].data != ""? this.datePipe.transform(prom[0].data, this.timeformat) : "-")
        }
        else if(prom[0].responseType == "ChoiseSet"){//list of prom.values if data == value
          if(prom[0].data.length > 0 || prom[0].data != ""){
            prom[0].data.forEach(data => {
              for(var c = 0; c<prom[0].values.length; c++){
                if(data == prom[0].values[c].value || data == prom[0].values[c]){
                  lineText = this.checkIfNewPage(doc,lineText += 5)
                  doc.setTextColor(0,0,0)
                  doc.setFontType("normal");
                  doc.setFontSize(11);
                  if(data != undefined){
                    promTranslated.values.forEach(element => {
                      if(data == element.original){
                        doc.text(promPosition, lineText, element.translation);
                      }
                    });
                    //doc.text(promPosition, lineText, data);
                  }
                  else{
                    doc.text(promPosition, lineText, "-");
                  }
                }
              }
            });
          }
          else{
            lineText = this.checkIfNewPage(doc,lineText += 5)
            doc.setTextColor(0,0,0)
            doc.setFontType("normal");
            doc.setFontSize(11);
            doc.text(promPosition, lineText, "-");
          }

        }
        else if(prom[0].responseType == "Choise"){
          lineText = this.checkIfNewPage(doc,lineText += 5)
          doc.setTextColor(0,0,0)
          doc.setFontType("normal");
          doc.setFontSize(11);
          if(prom[0].data != ""){
            promTranslated.values.forEach(element => {
              if(prom[0].data == element.original){
                doc.text(promPosition, lineText, element.translation);
              }
            });
          }
          else{
            doc.text(promPosition, lineText, "-");
          }
          //doc.text(promPosition, lineText, prom[0].data != ""? prom[0].data : "-");
        }
        else if(prom[0].responseType == "ChoiseAndDate"){//list of prom.values if data == value & substring date
          if(prom[0].data.length > 0){
            prom[0].values.forEach(value => {
              for(var c = 0; c < prom[0].data.length; c++){
                if(value.value == prom[0].data[c].choise){
                  lineText = this.checkIfNewPage(doc,lineText += 5)
                  doc.setTextColor(0,0,0)
                  doc.setFontType("normal");
                  doc.setFontSize(11);
                  if(prom[0].data[c].choise != undefined){
                    promTranslated.values.forEach(element => {
                      if(prom[0].data[c].choise == element.original){
                        doc.text(promPosition, lineText, element.translation);
                      }
                    });
                    //doc.text(promPosition, lineText, prom[0].data[c].choise);
                  }
                  else{
                    doc.text(promPosition, lineText, "-");
                  }
                  doc.text(promPosition + 140, lineText, this.datePipe.transform(prom[0].data[c].date, this.timeformat));
                }
              }
            });
          }
          else{
            lineText = this.checkIfNewPage(doc,lineText += 5)
            doc.setTextColor(0,0,0)
            doc.setFontType("normal");
            doc.setFontSize(11);
            doc.text(promPosition, lineText, "-");
          }
        }
        else if (prom[0].responseType != "Title" && prom[0].responseType != "Label"){
          lineText = this.checkIfNewPage(doc,lineText += 5)
          doc.setTextColor(0,0,0)
          doc.setFontType("normal");
          doc.setFontSize(11);
          var esObjeto = this.isObject(prom[0].data);
          if(esObjeto){

            prom[0].data.forEach(element => {
              if(prom[0].responseType=='TextAndDoubleChoiseAndRangeDate'){
                var infotemp = element
                doc.setTextColor(117,120,125)
                doc.text(20, lineText, this.translate.instant("generics.Start Date"));
                doc.text(80, lineText, this.translate.instant("generics.End Date"));
                doc.text(140, lineText, this.translate.instant("Course Of The disease.Area"));
                doc.setTextColor(0,0,0)
                if(infotemp.startDate == null){
                  doc.text(20, lineText+= 5, '-');
                }else{
                  doc.text(20, lineText+= 5, this.datePipe.transform(infotemp.startDate, this.timeformat));
                }

                if(infotemp.endDate == null){
                  doc.text(80, lineText, '-');
                }else{
                  doc.text(80, lineText, this.datePipe.transform(infotemp.endDate, this.timeformat));
                }


                doc.text(140, lineText, infotemp.area);

                doc.setTextColor(117,120,125)
                doc.text(20, lineText+= 10, this.translate.instant("Course Of The disease.Grade"));
                doc.text(120, lineText, this.translate.instant("Course Of The disease.Cause of pain"));
                doc.setTextColor(0,0,0)
                doc.text(20, lineText+= 5, infotemp.grade);
                doc.text(120, lineText, infotemp.CauseOfPain);

              }else if(prom[0].responseType=='ChoiseAndRangeDate'){
                var infotemp = element
                doc.setTextColor(117,120,125)
                var cont= 0;
                if(infotemp.startDate != undefined){
                  doc.text(20, lineText, this.translate.instant("generics.Start Date"));
                  cont++;
                }
                if(infotemp.endDate != undefined){
                  if(infotemp.startDate == undefined){
                    doc.text(20, lineText, this.translate.instant("generics.End Date"));
                  }else{
                    doc.text(80, lineText, this.translate.instant("generics.End Date"));
                  }

                  cont++;
                }
                if(infotemp.other != undefined){
                  if(infotemp.startDate == undefined && infotemp.endDate != undefined){
                    doc.text(80, lineText, this.translate.instant("generics.Other"));
                  }else if(infotemp.endDate == undefined && infotemp.startDate == undefined){
                    doc.text(20, lineText, this.translate.instant("generics.Other"));
                  }else if(infotemp.endDate == undefined && infotemp.startDate != undefined){
                    doc.text(80, lineText, this.translate.instant("generics.Other"));
                  }else{
                    doc.text(140, lineText, this.translate.instant("generics.Other"));
                  }
                  cont++;
                }
                doc.setTextColor(0,0,0)
                if(infotemp.startDate != undefined){
                  doc.text(20, lineText+= 5, this.datePipe.transform(infotemp.startDate, this.timeformat));
                }
                if(infotemp.endDate != undefined){
                  if(infotemp.startDate == undefined){
                    doc.text(20, lineText+= 5, this.datePipe.transform(infotemp.endDate, this.timeformat));
                  }else{
                    doc.text(80, lineText, this.datePipe.transform(infotemp.endDate, this.timeformat));
                  }

                }
                if(infotemp.other != undefined){
                  if(infotemp.startDate == undefined && infotemp.endDate != undefined){
                    doc.text(80, lineText, infotemp.other);
                  }else if(infotemp.endDate == undefined && infotemp.startDate == undefined){
                    doc.text(20, lineText+= 5, infotemp.other);
                  }else if(infotemp.endDate == undefined && infotemp.startDate != undefined){
                    doc.text(80, lineText, infotemp.other);
                  }else{
                    doc.text(140, lineText, infotemp.other);
                  }


                }

                doc.setTextColor(117,120,125)
                if(infotemp.date != undefined){
                  doc.text(20, lineText+= 10, 'date');
                  cont++;
                }
                if(infotemp.choise != undefined){
                  var esInicio = false;
                  if(infotemp.date == undefined){
                    esInicio = true;
                  }
                  var optionLabel = promTranslated.question

                  if(esInicio){
                    doc.text(20, lineText+= 10, optionLabel);
                  }else{
                    doc.text(120, lineText, optionLabel);
                  }

                  cont++;
                }
                doc.setTextColor(0,0,0)
                if(infotemp.date != undefined){
                  doc.text(20, lineText+= 5, this.datePipe.transform(infotemp.date, this.timeformat));
                }
                if(infotemp.choise != undefined){
                  var esInicio = false;
                  if(infotemp.date == undefined){
                    esInicio = true;
                  }
                  if(esInicio){
                    doc.text(20, lineText+=5, infotemp.choise);
                  }else{
                    doc.text(120, lineText, infotemp.choise);
                  }

                }
                doc.text(20, lineText+= 10, '____________________________________________________________________________');
              }else{
                doc.text(20, lineText, JSON.stringify(element));
                doc.text(20, lineText+= 10, '____________________________________________________________________________');
              }
              doc.text(0, lineText+= 10, '');
            })
            doc.text(0, lineText+= 10, '');

          }else{
            doc.text(promPosition, lineText, prom[0].data != ""? prom[0].data : "-");
          }

        }
      }
      else if((prom[0].relatedTo != null)&&(prom[0].relatedTo != firstProm[0].promId)){
        if(prom[0].data != ""){
          promTranslated.values.forEach(element => {
            if(prom[0].data == element.original){
              doc.text(promPosition+5, lineText, element.translation);
            }
          });
        }
      }

      return lineText
    }

    isObject(obj) {
      return obj === Object(obj);
    }

    translateSectionName(section){
      const sectionFound = this.listaSectionsTraducidos.find(element => element.id == section.id)
      return sectionFound
    }

    translateSectionProm(prom){
      const promFound = this.listaPromsTraducidos.find(element => element.id == prom[0].promId)
      return promFound
    }

    parsePDF(pdf, doc){
      var lineText = this.newHeather(doc)

      //anthropometry variables
      var userUnits = pdf.find(function(element){
        if(element.name == "user"){
          return element;
        }
      })
      var lengthunit = userUnits.data.lengthunit
      var massunit = userUnits.data.massunit
      var isAnthropometry = false;
      var anthropometryLineText = 0
      var isHeight = false
      var isWeight = false

      //medication variables
      var isMedication = false;
      var medicationLineText = 0

      //medicalCare variables
      var medicalCareLineText = 0

      pdf.forEach(element => {
        switch(element.name){
          case "patient":{
            doc.setFontSize(15);
            doc.text(20, lineText += 20, this.translate.instant("personalinfo.Personal patient information"));
            doc.setFontType("normal");
            doc.setFontSize(11);
            doc.setTextColor(117,120,125)
            doc.text(20, lineText += 10, this.translate.instant("personalinfo.First Name"));
            doc.text(80, lineText, this.translate.instant("personalinfo.Last Name"));
            doc.text(140, lineText, this.translate.instant("personalinfo.Gender"));
            doc.setTextColor(0,0,0)
            doc.text(20, lineText += 5, (element.data.patientName != "" && element.data.patientName != undefined && element.data.patientName != null)? element.data.patientName : "-");
            doc.text(80, lineText, (element.data.surname != "" && element.data.surname != undefined && element.data.surname != null)? element.data.surname : "-");
            var gender = "-"
            if(element.data.gender != "" && element.data.gender != undefined && element.data.gender != null){
              if(element.data.gender == "male"){
                gender = this.translate.instant("personalinfo.Male")
              }
              if(element.data.gender == "female"){
                gender = this.translate.instant("personalinfo.Female")
              }
            }
            doc.text(140, lineText, gender);

            doc.setFontType("bold");
            doc.setFontSize(12);
            doc.text(20, lineText += 15, this.translate.instant("personalinfo.Date and place of birth"));
            doc.setFontType("normal");
            doc.setFontSize(11);
            doc.setTextColor(117,120,125)
            doc.text(20, lineText += 10, this.translate.instant("personalinfo.Birth Date"));
            doc.text(80, lineText, this.translate.instant("personalinfo.City"));
            doc.setTextColor(0,0,0)
            doc.text(20, lineText += 5, (element.data.birthDate != "" && element.data.birthDate != undefined && element.data.birthDate != null)? this.datePipe.transform(element.data.birthDate, this.timeformat) : "-");
            doc.text(80, lineText, (element.data.citybirth != "" && element.data.citybirth != undefined && element.data.citybirth != null)? element.data.citybirth : "-");
            doc.setTextColor(117,120,125)
            doc.text(20, lineText += 10, this.translate.instant("personalinfo.ProvinceStateRegion"));
            doc.text(80, lineText, this.translate.instant("personalinfo.Country"));
            doc.setTextColor(0,0,0)
            doc.text(20, lineText += 5, (element.data.provincebirth != "" && element.data.provincebirth != undefined && element.data.provincebirth != null)? element.data.provincebirth : "-");
            doc.text(80, lineText, (element.data.citybirth != "" && element.data.countrybirth != undefined && element.data.countrybirth != null)? element.data.countrybirth : "-");

            doc.setFontType("bold");
            doc.setFontSize(12);
            doc.text(20, lineText += 15, this.translate.instant("personalinfo.Place of residence"));
            doc.setFontType("normal");
            doc.setFontSize(11);
            doc.setTextColor(117,120,125)
            doc.text(20, lineText += 10, this.translate.instant("personalinfo.Street"));
            doc.text(80, lineText, this.translate.instant("personalinfo.Postal Code"));
            doc.setTextColor(0,0,0)
            doc.text(20, lineText += 5, (element.data.street != "" && element.data.street != undefined && element.data.street != null)? element.data.street : "-");
            doc.text(80, lineText, (element.data.postalCode != "" && element.data.postalCode != undefined && element.data.postalCode != null)? element.data.postalCode : "-");
            doc.setTextColor(117,120,125)
            doc.text(20, lineText += 10, this.translate.instant("personalinfo.City"));
            doc.text(80, lineText, this.translate.instant("personalinfo.ProvinceStateRegion"));
            doc.text(140, lineText, this.translate.instant("personalinfo.Country"));
            doc.setTextColor(0,0,0)
            doc.text(20, lineText += 5, (element.data.city != "" && element.data.city != undefined && element.data.city != null)? element.data.city : "-");
            doc.text(80, lineText, (element.data.province != "" && element.data.province != undefined && element.data.province != null)? element.data.province : "-");
            doc.text(140, lineText, (element.data.country != "" && element.data.country != undefined && element.data.country != null)? element.data.country : "-");

            doc.setFontType("bold");
            doc.setFontSize(12);
            doc.text(20, lineText += 15, this.translate.instant("personalinfo.Telephone numbers"));
            doc.setFontType("normal");
            doc.setFontSize(11);
            doc.setTextColor(117,120,125)
            doc.text(20, lineText += 10, this.translate.instant("personalinfo.Phone") + " 1");
            doc.text(80, lineText, this.translate.instant("personalinfo.Phone") + " 2");
            doc.setTextColor(0,0,0)
            doc.text(20, lineText += 5, (element.data.phone1 != "" && element.data.phone1 != undefined && element.data.phone1 != null)? element.data.phone1 : "-");
            doc.text(80, lineText, (element.data.phone2 != "" && element.data.phone2 != undefined && element.data.phone2 != null)? element.data.phone2 : "-");


            break;
          }
          case "socialInfo":{
            var filter = this.filteredPDFsections.find(function(element){
              if(element == "socialInfo"){
                return true;
              }
            })
            if(filter == "socialInfo"){
              doc.addPage();
              lineText = this.newHeather(doc)
              doc.setFontType("bold");
              doc.setFontSize(15);
              doc.text(20, lineText += 20, this.translate.instant("social.Social patient information"));
              doc.setFontSize(12);
              doc.text(20, lineText += 15, this.translate.instant("social.Education"));
              doc.setFontType("normal");
              doc.setFontSize(11);
              doc.setTextColor(117,120,125)
              doc.text(20, lineText += 10, this.translate.instant("social.Type"));
              doc.setTextColor(0,0,0)
              doc.setFontSize(9);
              var dataEducation = "-"
              if(element.data.education != "" && element.data.education != undefined && element.data.education != null){
                if(element.data.education == "regularEducation"){
                  dataEducation = this.translate.instant("social.Regular education")
                }
                if(element.data.education == "mainstreamEducation"){
                  dataEducation = this.translate.instant("social.Mainstream education")
                }
                if(element.data.education == "specialEducation"){
                  dataEducation = this.translate.instant("social.Special education")
                }
              }
              doc.text(20, lineText += 5, dataEducation);

              doc.setFontType("normal");
              doc.setFontSize(11);
              doc.setTextColor(117,120,125)
              doc.text(20, lineText += 10, this.translate.instant("social.Completed Education"));
              doc.setTextColor(0,0,0)
              doc.setFontSize(9);
              var completedEducation = "-"
              if(this.user.group == this.duchenneinternational && this.subgroup != '3900'){
                if(element.data.completedEducation != "" && element.data.completedEducation != undefined && element.data.completedEducation != null){
                  if(element.data.completedEducation == "0int"){
                    completedEducation = this.translate.instant("education.Primary education:")
                  }
                  if(element.data.completedEducation == "1int"){
                    completedEducation = this.translate.instant("education.Secondary education:")
                  }
                  if(element.data.completedEducation == "2int"){
                    completedEducation = this.translate.instant("education.Vocational education")
                  }
                }
                doc.text(20, lineText+= 5, completedEducation);
              }else if(this.user.group == this.duchenneinternational && this.subgroup == '3900'){
                doc.text(20, lineText+= 5, (element.data.completedEducation != "" && element.data.completedEducation != undefined && element.data.completedEducation != null)? element.data.completedEducation : "-");
              }else{
                if(element.data.completedEducation != "" && element.data.completedEducation != undefined && element.data.completedEducation != null){
                  if(element.data.completedEducation == "0"){
                    completedEducation = this.translate.instant("education.Early childhood Education")
                  }
                  if(element.data.completedEducation == "1"){
                    completedEducation = this.translate.instant("education.Primary education")
                  }
                  if(element.data.completedEducation == "2"){
                    completedEducation = this.translate.instant("education.Lower secondary education")
                  }
                  if(element.data.completedEducation == "3"){
                    completedEducation = this.translate.instant("education.Upper secondary education")
                  }
                  if(element.data.completedEducation == "4"){
                    completedEducation = this.translate.instant("education.Post-secondary non-tertiary education")
                  }
                  if(element.data.completedEducation == "5"){
                    completedEducation = this.translate.instant("education.Short-cycle tertiary education")
                  }
                  if(element.data.completedEducation == "6"){
                    completedEducation = this.translate.instant("education.Bachelor or equivalent")
                  }
                  if(element.data.completedEducation == "7"){
                    completedEducation = this.translate.instant("education.Master or equivalent")
                  }
                  if(element.data.completedEducation == "8"){
                    completedEducation = this.translate.instant("education.Doctoral or equivalent")
                  }
                }
                doc.text(20, lineText+= 5, completedEducation);
              }

              doc.setFontType("normal");
              doc.setFontSize(11);
              doc.setTextColor(117,120,125)
              doc.text(20, lineText+= 10, this.translate.instant("social.Current Education"));
              doc.setTextColor(0,0,0)
              doc.setFontSize(9);
              //doc.text(80, lineText, (element.data.completedEducation != "" && element.data.completedEducation != undefined && element.data.completedEducation != null)? element.data.completedEducation : "-");
              var currentEducation = "-"
              if(this.user.group == this.duchenneinternational && this.subgroup != '3900'){

                if(element.data.currentEducation != "" && element.data.currentEducation != undefined && element.data.currentEducation != null){
                  if(element.data.currentEducation == "0int"){
                    currentEducation = this.translate.instant("education.Primary education:")
                  }
                  if(element.data.currentEducation == "1int"){
                    currentEducation = this.translate.instant("education.Secondary education:")
                  }
                  if(element.data.currentEducation == "2int"){
                    currentEducation = this.translate.instant("education.Vocational education")
                  }
                }
                doc.text(20, lineText+= 5, currentEducation);
              }else if(this.user.group == this.duchenneinternational && this.subgroup == '3900'){
                doc.text(20, lineText+= 5, (element.data.currentEducation != "" && element.data.currentEducation != undefined && element.data.currentEducation != null)? element.data.currentEducation : "-");
              }else{
                if(element.data.currentEducation != "" && element.data.currentEducation != undefined && element.data.currentEducation != null){
                  if(element.data.currentEducation == "0"){
                    currentEducation = this.translate.instant("education.Early childhood Education")
                  }
                  if(element.data.currentEducation == "1"){
                    currentEducation = this.translate.instant("education.Primary education")
                  }
                  if(element.data.currentEducation == "2"){
                    currentEducation = this.translate.instant("education.Lower secondary education")
                  }
                  if(element.data.currentEducation == "3"){
                    currentEducation = this.translate.instant("education.Upper secondary education")
                  }
                  if(element.data.currentEducation == "4"){
                    currentEducation = this.translate.instant("education.Post-secondary non-tertiary education")
                  }
                  if(element.data.currentEducation == "5"){
                    currentEducation = this.translate.instant("education.Short-cycle tertiary education")
                  }
                  if(element.data.currentEducation == "6"){
                    currentEducation = this.translate.instant("education.Bachelor or equivalent")
                  }
                  if(element.data.currentEducation == "7"){
                    currentEducation = this.translate.instant("education.Master or equivalent")
                  }
                  if(element.data.currentEducation == "8"){
                    currentEducation = this.translate.instant("education.Doctoral or equivalent")
                  }
                }
                doc.text(20, lineText+= 5, currentEducation);
              }
              //doc.text(140, lineText, (element.data.currentEducation != "" && element.data.currentEducation != undefined && element.data.currentEducation != null)? element.data.currentEducation : "-");

              doc.setFontType("bold");
              doc.setFontSize(12);
              doc.text(20, lineText += 15, this.translate.instant("social.Work"));
              doc.setFontType("normal");
              doc.setFontSize(11);
              doc.setTextColor(117,120,125)
              doc.text(20, lineText += 10, this.translate.instant("social.Work"));
              doc.text(80, lineText, this.translate.instant("social.Hours Work"));
              doc.text(140, lineText, this.translate.instant("personalinfo.Profession"));
              doc.setTextColor(0,0,0)
              var work = "-"
              if(element.data.work != "" && element.data.work != undefined && element.data.work != null){
                if(element.data.work == "volunteer"){
                  work = this.translate.instant("social.Volunteer")
                }
                if(element.data.work == "paid"){
                  work = this.translate.instant("social.Paid")
                }
                if(element.data.work == "no"){
                  work = this.translate.instant("generics.No")
                }
              }
              doc.text(20, lineText += 5, work);
              doc.text(80, lineText, (element.data.hoursWork != "" && element.data.hoursWork != undefined && element.data.hoursWork != null)? element.data.hoursWork : "-");
              doc.text(140, lineText, (element.data.profession != "" && element.data.profession != undefined && element.data.profession != null)? element.data.profession : "-");

              doc.setFontType("bold");
              doc.setFontSize(12);
              doc.text(20, lineText += 15, this.translate.instant("social.LivingSupport"));
              doc.setFontType("normal");
              doc.setFontSize(11);
              doc.setTextColor(117,120,125)
              doc.text(20, lineText += 10, this.translate.instant("social.Living Situation"));
              doc.text(80, lineText, this.translate.instant("social.Support"));
              doc.setTextColor(0,0,0)
              var livingSituation
              if(element.data.livingSituation != "" && element.data.livingSituation != undefined && element.data.livingSituation != null){
                livingSituation = []; //
                for(var l = 0; l<element.data.livingSituation.length ; l++){
                  if(element.data.livingSituation[l] == "parent"){
                    livingSituation[l] = this.translate.instant("social.WithParentCaregivers")
                  }
                  else if(element.data.livingSituation[l] == "institution"){
                    livingSituation[l] = this.translate.instant("social.In an institution")
                  }
                  else if(element.data.livingSituation[l] == "partner"){
                    livingSituation[l] = this.translate.instant("social.With partner")
                  }
                  else if(element.data.livingSituation[l] == "friend"){
                    livingSituation[l] = this.translate.instant("social.WithFriend")
                  }
                  else if(element.data.livingSituation[l] == "independent"){
                    livingSituation[l] = this.translate.instant("social.Independent")
                  }
                  else if(element.data.livingSituation[l] == "other"){
                    livingSituation[l] = this.translate.instant("generics.Other")
                  }
                }
              }
              else{
                livingSituation = "-"
              }
              doc.text(20, lineText += 5, livingSituation);
              var support
              if(element.data.support != "" && element.data.support != undefined && element.data.support != null){
                support = []; //
                for(var l = 0; l<element.data.support.length ; l++){
                  if(element.data.support[l] == "parent"){
                    support[l] = this.translate.instant("social.Parents")
                  }
                  else if(element.data.support[l] == "sibling"){
                    support[l] = this.translate.instant("social.Siblings")
                  }
                  else if(element.data.support[l] == "otherFamilyMembers"){
                    support[l] = this.translate.instant("social.Other family members")
                  }
                  else if(element.data.support[l] == "helpers"){
                    support[l] = this.translate.instant("social.Helpers")
                  }
                  else if(element.data.support[l] == "friends"){
                    support[l] = this.translate.instant("social.Friends")
                  }
                  else if(element.data.support[l] == "helperdog"){
                    support[l] = this.translate.instant("social.Helperdogr")
                  }
                  else if(element.data.support[l] == "other"){
                    support[l] = this.translate.instant("generics.Other")
                  }
                }
              }
              else{
                support = "-"
              }
              doc.text(80, lineText, support);

              doc.setFontType("bold");
              doc.setFontSize(12);
              doc.text(20, lineText += 15, this.translate.instant("social.SportsInterests"));
              doc.setFontType("normal");
              doc.setFontSize(11);
              doc.setTextColor(117,120,125)
              doc.text(20, lineText += 10, this.translate.instant("social.Sports"));
              doc.setTextColor(0,0,0)
              var sports
              if((element.data.sports != "" && element.data.sports != undefined && element.data.sports != null) || element.data.othersport != ''){
                sports = []; //
                for(var l = 0; l<element.data.sports.length ; l++){
                  if(element.data.sports[l] == "Accessible rambling"){
                    sports[l] = this.translate.instant("social.Accessible rambling")
                  }else if(element.data.sports[l] == "Archery"){
                    sports[l] = this.translate.instant("social.Archery")
                  }else if(element.data.sports[l] == "Athletics"){
                    sports[l] = this.translate.instant("social.Athletics")
                  }else if(element.data.sports[l] == "Badminton"){
                    sports[l] = this.translate.instant("social.Badminton")
                  }else if(element.data.sports[l] == "Boccia"){
                    sports[l] = this.translate.instant("social.Boccia")
                  }else if(element.data.sports[l] == "Canoeing"){
                    sports[l] = this.translate.instant("social.Canoeing")
                  }else if(element.data.sports[l] == "Cycling"){
                    sports[l] = this.translate.instant("social.Cycling")
                  }else if(element.data.sports[l] == "soccer"){
                    sports[l] = this.translate.instant("social.Soccer")
                  }else if(element.data.sports[l] == "hourseRiding"){
                    sports[l] = this.translate.instant("social.Horse riding")
                  }else if(element.data.sports[l] == "Inclusive dance"){
                    sports[l] = this.translate.instant("social.Inclusive dance")
                  }else if(element.data.sports[l] == "Karate"){
                    sports[l] = this.translate.instant("social.Karate")
                  }else if(element.data.sports[l] == "Pilates"){
                    sports[l] = this.translate.instant("social.Pilates")
                  }else if(element.data.sports[l] == "Sailing"){
                    sports[l] = this.translate.instant("social.Sailing")
                  }else if(element.data.sports[l] == "Shooting"){
                    sports[l] = this.translate.instant("social.Shooting")
                  }else if(element.data.sports[l] == "Sitting Volleyball"){
                    sports[l] = this.translate.instant("social.Sitting Volleyball")
                  }else if(element.data.sports[l] == "swimming"){
                    sports[l] = this.translate.instant("social.swimming")
                  }else if(element.data.sports[l] == "Taekwondo"){
                    sports[l] = this.translate.instant("social.Taekwondo")
                  }else if(element.data.sports[l] == "Wheelchair Basketball"){
                    sports[l] = this.translate.instant("social.Wheelchair Basketball")
                  }else if(element.data.sports[l] == "Wheelchair Football"){
                    sports[l] = this.translate.instant("social.Wheelchair Football")
                  }else if(element.data.sports[l] == "wheelchairHockey"){
                    sports[l] = this.translate.instant("social.Wheelchair hockey")
                  }else if(element.data.sports[l] == "Wheelchair Rugby"){
                    sports[l] = this.translate.instant("social.Wheelchair Rugby")
                  }else if(element.data.sports[l] == "Wheelchair tennis"){
                    sports[l] = this.translate.instant("social.Wheelchair tennis")
                  }else if(element.data.sports[l] == "Yoga"){
                    sports[l] = this.translate.instant("social.Yoga")
                  }
                  else if(element.data.sports[l] == "none"){
                    sports[l] = this.translate.instant("generics.None")
                  }/*
                  else if(element.data.sports[l] == "other"){
                    sports[l] = this.translate.instant("generics.Other")
                  }*/
                }
                if(element.data.othersport != ''){
                  var info = this.translate.instant("generics.Other")+': '+element.data.othersport;
                  sports.push(info);
                }
              }
              else{
                sports = "-"
              }
              doc.text(20, lineText += 5, sports);
              var lengthSpace= sports.length*5;
              lineText = this.checkIfNewPage(doc,lineText += lengthSpace)
              doc.setTextColor(117,120,125)
              doc.text(20, lineText += 10, this.translate.instant("social.Interests"));
              doc.setTextColor(0,0,0)
              var interests
              if((element.data.interests != "" && element.data.interests != undefined && element.data.interests != null) || element.data.otherinterest != ''){
                interests = []; //
                for(var l = 0; l<element.data.sports.length ; l++){
                  if(element.data.interests[l] == "scouting"){
                    interests[l] = this.translate.instant("social.Scouting")
                  }else if(element.data.interests[l] == "sports"){
                    interests[l] = this.translate.instant("social.Sports")
                  }else if(element.data.interests[l] == "Lego"){
                    interests[l] = this.translate.instant("social.Lego")
                  }else if(element.data.interests[l] == "movies"){
                    interests[l] = this.translate.instant("social.Movies")
                  }else if(element.data.interests[l] == "music"){
                    interests[l] = this.translate.instant("social.Music")
                  }else if(element.data.interests[l] == "mindgames"){
                    interests[l] = this.translate.instant("social.Mindgames")
                  }else if(element.data.interests[l] == "gaming"){
                    interests[l] = this.translate.instant("social.Gaming")
                  }else if(element.data.interests[l] == "none"){
                    interests[l] = this.translate.instant("generics.None")
                  }/*
                  else if(element.data.interests[l] == "other"){
                    interests[l] = this.translate.instant("generics.Other")
                  }*/
                }
                if(element.data.otherinterest != ''){
                  var info = this.translate.instant("generics.Other")+': '+element.data.otherinterest;
                  interests.push(info);
                }
              }
              else{
                interests = "-"
              }
              doc.text(20, lineText += 5, interests);
              var lengthSpace= interests.length*5;
              lineText = this.checkIfNewPage(doc,lineText += lengthSpace)
              //doc.text(20, lineText += 5, (element.data.interests != "" && element.data.interests != undefined && element.data.interests != null)? element.data.interests : "-");
              doc.setTextColor(117,120,125)
              doc.text(20, lineText += 10, this.translate.instant("generics.More information"));
              doc.setTextColor(0,0,0)
              doc.text(20, lineText += 5, (element.data.moreInterests != "" && element.data.moreInterests != undefined && element.data.moreInterests != null)? element.data.moreInterests : "-");

            }//filter

            break;
          }
          case "height":{
            var filter = this.filteredPDFsections.find(function(element){
              if(element == "anthropometry"){
                return true;
              }
            })
            if(filter == "anthropometry"){
              isHeight = true
              if(!isAnthropometry){
                doc.addPage();
                lineText = this.newHeather(doc)
                doc.setFontType("bold");
                doc.setFontSize(15);
                doc.text(20, lineText += 20, this.translate.instant("clinicalinfo.Anthropometry"));
                anthropometryLineText = lineText
                isAnthropometry = true
              }
              if(isAnthropometry){
                doc.setFontType("bold");
                doc.setFontSize(12);
                doc.text(20, anthropometryLineText += 15, this.translate.instant("anthropometry.Height"));
                doc.setFontType("normal");
                doc.setFontSize(11);
                doc.text(20, anthropometryLineText += 10, (element.data.value != "" && element.data.value != undefined && element.data.value != null)? element.data.value : "-");
                doc.text(35, anthropometryLineText, 'cm');
                //doc.text(35, anthropometryLineText, lengthunit);
              }
            }//filter

            break;
          }
          case "heightHistory":{
            if(isHeight){
              doc.setFontSize(12);
              doc.setFontType("bold");
              doc.text(20, anthropometryLineText += 10, this.translate.instant("anthropometry.Height history"));
              doc.setFontType("normal");
              element.data.forEach(height => {
                doc.setTextColor(117,120,125)
                doc.setFontSize(11);
                doc.text(20, anthropometryLineText += 10, this.translate.instant("anthropometry.Height"));
                doc.text(80, anthropometryLineText, this.translate.instant("generics.Date"));
                doc.setTextColor(0,0,0)
                doc.text(20, anthropometryLineText += 5, (height.value != "" && height.value != undefined && height.value != null)? height.value : "-");
                doc.text(35, anthropometryLineText, 'cm');
                //doc.text(35, anthropometryLineText, lengthunit);
                doc.text(80, anthropometryLineText, (height.dateTime != "" && height.dateTime != undefined && height.dateTime != null)?this.datePipe.transform(height.dateTime, this.timeformat) : "-");
              });
            }
            break;
          }
          case "weight":{
            var filter = this.filteredPDFsections.find(function(element){
              if(element == "anthropometry"){
                return true;
              }
            })
            if (filter == "anthropometry"){
              isWeight = true
              if(!isAnthropometry){
                doc.addPage();
                lineText = this.newHeather(doc)
                doc.setFontType("bold");
                doc.setFontSize(15);
                doc.text(20, lineText += 20, this.translate.instant("clinicalinfo.Anthropometry"));
                anthropometryLineText = lineText
                isAnthropometry = true
              }
              if(isAnthropometry){
                doc.setFontType("bold");
                doc.setFontSize(12);
                doc.text(20, anthropometryLineText += 10, this.translate.instant("anthropometry.Weight"));
                doc.setFontType("normal");
                doc.setFontSize(11);
                if(massunit == "lb"){
                  var value = ((element.data.value * 2.20462).toFixed(2).toString());
                  doc.text(20, anthropometryLineText += 5, (element.data.value != "" && element.data.value != undefined && element.data.value != null)? value : "-");
                }
                else if(massunit == "kg"){
                  doc.text(20, anthropometryLineText += 5, (element.data.value != "" && element.data.value != undefined && element.data.value != null)? element.data.value : "-");
                }
                doc.text(35, anthropometryLineText, massunit);
              }
            }//filter

            break;
          }
          case "weightHistory":{
            if(isWeight){
              doc.setFontSize(12);
              doc.setFontType("bold");
              doc.text(20, anthropometryLineText += 10, this.translate.instant("anthropometry.Weight history"));
              doc.setFontType("normal");
              element.data.forEach(weight => {
                doc.setTextColor(117,120,125)
                doc.setFontSize(11);
                doc.text(20, anthropometryLineText += 10, this.translate.instant("anthropometry.Weight"));
                doc.text(80, anthropometryLineText, this.translate.instant("generics.Date"));
                doc.setTextColor(0,0,0)
                if(massunit == "lb"){
                  var value = ((weight.value * 2.20462).toFixed(2).toString());
                  doc.text(20, anthropometryLineText += 5, (weight.value != "" && weight.value != undefined && weight.value != null)? value : "-");
                }
                else if(massunit == "kg"){
                  doc.text(20, anthropometryLineText += 5, (weight.value != "" && weight.value != undefined && weight.value != null)? weight.value : "-");
                }
                doc.text(35, anthropometryLineText, massunit);
                doc.text(80, anthropometryLineText, weight.dateTime != ""? this.datePipe.transform(weight.dateTime, this.timeformat) : "-");
              });
            }
            break;
          }
          case "medication":{
            if(element.data.length > 0){
              var filter = this.filteredPDFsections.find(function(element){
                if(element == "medication"){
                  return true;
                }
              })
              if (filter == "medication"){
                if(!isMedication){
                  doc.addPage();
                  lineText = this.newHeather(doc)
                  doc.setFontType("bold");
                  doc.setFontSize(15);
                  doc.text(20, lineText += 20, this.translate.instant("clinicalinfo.Medication"));
                  medicationLineText = lineText
                  isMedication = true
                }
                if(isMedication){
                  medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                  doc.setFontType("bold");
                  doc.setFontSize(12);
                  doc.text(20, medicationLineText, this.translate.instant("medication.Current drugs"));
                  var contCurrent = 0
                  var medicationsGroupTranslated
                  this.groupsInfo.forEach(groupInfo => {
                    if(groupInfo.name == this.user.group){
                      medicationsGroupTranslated = groupInfo.medications
                    }
                  });
                  element.data.forEach(current => {
                    if(current.endDate == null){/* Hacer la comprobacion de current */
                      contCurrent++
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                      doc.setTextColor(117,120,125)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      doc.text(20, medicationLineText, this.translate.instant("medication.Drug"));
                      doc.text(120, medicationLineText, this.translate.instant("medication.Dose"));
                      doc.text(150, medicationLineText, this.translate.instant("generics.Start Date"));
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                      doc.setTextColor(0,0,0)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      var drug = "-"
                      if (current.drug != "" && current.drug != undefined && current.drug != null){
                        medicationsGroupTranslated.drugs.forEach(drugsInfo => {
                          if(drugsInfo.name == current.drug){
                            drugsInfo.translations.forEach(translation => {
                              if(this.user.lang == translation.code){
                                drug = translation.name
                              }
                            });
                          }
                        });
                      }
                      doc.text(20, medicationLineText, drug);
                      doc.text(120, medicationLineText, (current.dose != "" && current.dose != undefined && current.dose != null)? current.dose : "-");
                      doc.text(130, medicationLineText, this.translate.instant("medication.mg/day"));
                      doc.text(150, medicationLineText, (current.startDate != "" && current.startDate != undefined && current.startDate != null)? this.datePipe.transform(current.startDate, this.timeformat) : "-");
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                      doc.setTextColor(117,120,125)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      doc.text(20, medicationLineText, this.translate.instant("medication.Schedule"));
                      doc.text(50, medicationLineText, this.translate.instant("medication.Compassionate Use"));
                      doc.text(120, medicationLineText, this.translate.instant("medication.Side Effect"));
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                      doc.setTextColor(0,0,0)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      var schedule = "-"
                      if(current.schedule != "" && current.schedule != undefined && current.schedule != null){
                        if(current.schedule == "Daily"){
                          schedule = this.translate.instant("medication.Daily")
                        }
                        if(current.schedule == "10 on / 10 off"){
                          schedule = this.translate.instant("medication.10 on / 10 off")
                        }
                        if(current.schedule == "Other"){
                          schedule = this.translate.instant("generics.Other")
                        }
                      }
                      doc.text(20, medicationLineText, schedule);
                      //doc.text(20, medicationLineText, (current.schedule != "" && current.schedule != undefined && current.schedule != null)? current.schedule : "-");
                      var compassionateUse = "-"
                      if(current.compassionateUse != "" && current.compassionateUse != undefined && current.compassionateUse != null){
                        if(current.compassionateUse == "yes"){
                          compassionateUse = this.translate.instant("generics.Yes")
                        }
                        if(current.compassionateUse == "no"){
                          compassionateUse = this.translate.instant("generics.No")
                        }
                        if(current.compassionateUse == "Don't know"){
                          compassionateUse = this.translate.instant("generics.Dont know")
                        }
                      }
                      doc.text(50, medicationLineText, compassionateUse);
                      //doc.text(50, medicationLineText, (current.compassionateUse != "" && current.compassionateUse != undefined && current.compassionateUse != null)? current.compassionateUse : "-");
                      var sideEffects = [];
                      if (current.sideEffects != "" && current.sideEffects != undefined && current.sideEffects != null){
                        current.sideEffects.forEach(current => {
                        medicationsGroupTranslated.sideEffects.forEach(drugsInfo => {
                          if(drugsInfo.name == current){
                            drugsInfo.translationssideEffect.forEach(translation => {
                              if(this.user.lang == translation.code){
                                sideEffects.push(translation.name)
                              }
                            });
                          }
                        });
                        });
                      }
                      var lengthSpace= sideEffects.length*5;
                      if(sideEffects.length==0){
                        doc.text(120, medicationLineText, '-');
                      }else{
                        doc.text(120, medicationLineText, sideEffects);
                      }

                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += lengthSpace)
                      //doc.text(100, medicationLineText, (current.sideEffects != "" && current.sideEffects != undefined && current.sideEffects != null)? current.sideEffects : "-");
                      //paint line
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                      doc.setDrawColor(222, 226, 230);
                      doc.line(20, medicationLineText, 200, medicationLineText);
                    }

                  })
                  if(contCurrent == 0){
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    doc.text(20, medicationLineText, this.translate.instant("medication.Currently it is not taking drugs"));
                  }
                  medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                  doc.setFontType("bold");
                  doc.setFontSize(12);
                  doc.text(20, medicationLineText, this.translate.instant("medication.Previous drugs"));
                  var contPrevious = 0;
                  element.data.forEach(previous => {
                    if(previous.endDate != null){/* Hacer la comprobacion de previous */
                      contPrevious++
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                      doc.setTextColor(117,120,125)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      doc.text(20, medicationLineText, this.translate.instant("medication.Drug"));
                      doc.text(120, medicationLineText, this.translate.instant("medication.Dose"));
                      doc.text(150, medicationLineText, this.translate.instant("generics.Date"));
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                      doc.setTextColor(0,0,0)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      var drug = "-"
                      if (previous.drug != "" && previous.drug != undefined && previous.drug != null){
                        medicationsGroupTranslated.drugs.forEach(drugsInfo => {
                          if(drugsInfo.name == previous.drug){
                            drugsInfo.translations.forEach(translation => {
                              if(this.user.lang == translation.code){
                                drug = translation.name
                              }
                            });
                          }
                        });
                      }
                      doc.text(20, medicationLineText, drug);
                      doc.text(120, medicationLineText, (previous.dose != "" && previous.dose != undefined && previous.dose != null)? previous.dose : "-");
                      doc.text(130, medicationLineText, this.translate.instant("medication.mg/day"));
                      if(previous.endDate != "" && previous.endDate != undefined && previous.endDate != null){
                        doc.text(150, medicationLineText, ((previous.startDate != "" && previous.startDate != undefined && previous.startDate != null)? this.datePipe.transform(previous.startDate, this.timeformat) : "-" )+ " | " + this.datePipe.transform(previous.endDate, this.timeformat));
                      }else{
                        doc.text(150, medicalCareLineText, ((previous.startdate != "" && previous.startdate != undefined && previous.startdate != null)? this.datePipe.transform(previous.startdate, this.timeformat) : "-") + " | -");
                      }

                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                      doc.setTextColor(117,120,125)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      doc.text(20, medicationLineText, this.translate.instant("medication.Schedule"));
                      doc.text(50, medicationLineText, this.translate.instant("medication.Compassionate Use"));
                      doc.text(120, medicationLineText, this.translate.instant("medication.Side Effect"));
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                      doc.setTextColor(0,0,0)
                      doc.setFontType("normal");
                      doc.setFontSize(11);
                      var schedule = "-"
                      if(previous.schedule != "" && previous.schedule != undefined && previous.schedule != null){
                        if(previous.schedule == "Daily"){
                          schedule = this.translate.instant("medication.Daily")
                        }
                        if(previous.schedule == "10 on / 10 off"){
                          schedule = this.translate.instant("medication.10 on / 10 off")
                        }
                        if(previous.schedule == "Other"){
                          schedule = this.translate.instant("generics.Other' | translate")
                        }
                      }
                      doc.text(20, medicationLineText, schedule);
                      //doc.text(20, medicationLineText, (previous.schedule != "" && previous.schedule != undefined && previous.schedule != null)? previous.schedule : "-");
                      var compassionateUse = "-"
                      if(previous.compassionateUse != "" && previous.compassionateUse != undefined && previous.compassionateUse != null){
                        if(previous.compassionateUse == "yes"){
                          compassionateUse = this.translate.instant("generics.Yes")
                        }
                        if(previous.compassionateUse == "no"){
                          compassionateUse = this.translate.instant("generics.No")
                        }
                        if(previous.compassionateUse == "Don't know"){
                          compassionateUse = this.translate.instant("generics.Dont know")
                        }
                      }
                      doc.text(50, medicationLineText, compassionateUse);
                      //doc.text(50, medicationLineText, (previous.compassionateUse != "" && previous.compassionateUse != undefined && previous.compassionateUse != null)? previous.compassionateUse : "-");
                      var sideEffects = []
                      if (previous.sideEffects != "" && previous.sideEffects != undefined && previous.sideEffects != null){
                        previous.sideEffects.forEach(current => {
                        medicationsGroupTranslated.sideEffects.forEach(drugsInfo => {
                          if(drugsInfo.name == current){
                            drugsInfo.translationssideEffect.forEach(translation => {
                              if(this.user.lang == translation.code){
                                sideEffects.push(translation.name)
                              }
                            });
                          }
                        });
                        });
                      }
                      var lengthSpace= sideEffects.length*5;
                      if(sideEffects.length==0){
                        doc.text(120, medicationLineText, '-');
                      }else{
                        doc.text(120, medicationLineText, sideEffects);
                      }
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += lengthSpace)
                      //doc.text(100, medicationLineText, (previous.sideEffects != "" && previous.sideEffects != undefined && previous.sideEffects != null)? previous.sideEffects : "-");

                      //paint line
                      medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                      doc.setDrawColor(222, 226, 230);
                      doc.line(20, medicationLineText, 200, medicationLineText);
                    }
                  })
                  if(contPrevious == 0){
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    doc.text(20, medicationLineText, this.translate.instant("medication.No older drugs"));
                  }
                }
              }
            }
            break;
          }
          case "otherMedication":{
            if(element.data.length > 0){
              var filter = this.filteredPDFsections.find(function(element){
                if(element == "medication"){
                  return true;
                }
              })
              if (filter == "medication"){
                if(!isMedication){
                  doc.addPage();
                  lineText = this.newHeather(doc)
                  doc.setFontType("bold");
                  doc.setFontSize(15);
                  doc.text(20, lineText += 20, this.translate.instant("clinicalinfo.Medication"));
                  medicationLineText = lineText
                  isMedication = true
                }
                if(isMedication){
                  medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                  doc.setFontType("bold");
                  doc.setFontSize(12);
                  doc.text(20, medicationLineText, this.translate.instant("clinicalinfo.Other Drugs or Supplements"));
                  //paint line
                  medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                  doc.setDrawColor(222, 226, 230);
                  doc.line(20, medicationLineText, 200, medicationLineText);


                  var contOther = 0
                  element.data.forEach(other => {
                    contOther++
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                    doc.setTextColor(117,120,125)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    doc.text(20, medicationLineText, this.translate.instant("medication.Drug"));
                    doc.text(80, medicationLineText, this.translate.instant("social.Type"));
                    doc.text(130, medicationLineText, this.translate.instant("medication.Dose"));
                    doc.text(160, medicationLineText, this.translate.instant("generics.Date"));
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                    doc.setTextColor(0,0,0)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    var otherName = '-';
                    if(other.name != "" && other.name != undefined && other.name != null){
                      if(other.name == "Calcium"){
                        otherName = this.translate.instant("otherdrugs.Calcium")
                      }
                      else if(other.name == "Vitamin D"){
                        otherName = this.translate.instant("otherdrugs.Vitamin D")
                      }
                      else if(other.name == "Green Tea Extract"){
                        otherName = this.translate.instant("otherdrugs.Green Tea Extract")
                      }
                      else if(other.name == "Coenzyme Q10"){
                        otherName = this.translate.instant("otherdrugs.Coenzyme Q10")
                      }
                      else if(other.name == "Creatine"){
                        otherName = this.translate.instant("otherdrugs.Creatine")
                      }
                      else if(other.name == "Arginine"){
                        otherName = this.translate.instant("otherdrugs.Arginine")
                      }
                      else if(other.name == "Taurine"){
                        otherName = this.translate.instant("otherdrugs.Taurine")
                      }
                      else if(other.name == "Carnitine"){
                        otherName = this.translate.instant("otherdrugs.Carnitine")
                      }
                      else if(other.name == "Glutamine"){
                        otherName = this.translate.instant("otherdrugs.Glutamine")
                      }
                      else if(other.name == "Leucine"){
                        otherName = this.translate.instant("otherdrugs.Leucine")
                      }
                      else if(other.name == "Fish oil"){
                        otherName = this.translate.instant("otherdrugs.Fish oil")
                      }
                      else if(other.name == "Vitamin E"){
                        otherName = this.translate.instant("otherdrugs.Vitamin E")
                      }
                      else if(other.name == "Multivitamin"){
                        otherName = this.translate.instant("otherdrugs.Multivitamin")
                      }
                      else if(other.name == "Herbs or plant extracts"){
                        otherName = this.translate.instant("otherdrugs.Herbs or plant extracts")
                      }
                      else if(other.name == "N-acetylcysteine"){
                        otherName = this.translate.instant("otherdrugs.N-acetylcysteine")
                      }
                      else if(other.name == "Protandim"){
                        otherName = this.translate.instant("otherdrugs.Protandim")
                      }
                      else if(other.name == "Resveratrol"){
                        otherName = this.translate.instant("otherdrugs.Resveratrol")
                      }
                      else if(other.name == "Quercetin"){
                        otherName = this.translate.instant("otherdrugs.Quercetin")
                      }
                      else if(other.name == "other"){
                        otherName = this.translate.instant("generics.Other")
                      }else{
                        otherName= other.name;
                      }
                    }
                    else{
                      otherName = "-"
                    }
                    doc.text(20, medicationLineText, otherName);
                    var otherType = "-"
                    if(other.type != "" && other.type != undefined && other.type != null){
                      if(other.type == "Supplements"){
                        otherType = this.translate.instant("otherdrugs.Supplements")
                      }
                      else if(other.type == "Psychopharmaceuticals"){
                        otherType = this.translate.instant("otherdrugs.Psychopharmaceuticals")
                      }
                      else if(other.type == "Pain medication"){
                        otherType = this.translate.instant("otherdrugs.Pain medication")
                      }
                      else if(other.type == "Laxative"){
                        otherType = this.translate.instant("otherdrugs.Laxative")
                      }
                      else if(other.type == "Gastroprotective drugs"){
                        otherType = this.translate.instant("otherdrugs.Gastroprotective drugs")
                      }
                      else if(other.type == "Other"){
                        otherType = this.translate.instant("generics.Other")
                      }
                    }
                    else{
                      otherType = "-"
                    }
                    doc.text(80, medicationLineText, otherType);
                    doc.text(130, medicationLineText, (other.dose != "" && other.dose != undefined && other.dose != null)? other.dose : "-");
                    doc.text(140, medicationLineText, this.translate.instant("medication.mg/day"));
                    if(other.endDate != "" && other.endDate != undefined && other.endDate != null){
                      doc.text(160, medicationLineText, ((other.startDate != "" && other.startDate != undefined && other.startDate != null)? this.datePipe.transform(other.startDate, this.timeformat) : "-" )+ " | " + this.datePipe.transform(other.endDate, this.timeformat));
                    }else{
                      doc.text(160, medicationLineText, ((other.startdate != "" && other.startdate != undefined && other.startdate != null)? this.datePipe.transform(other.startdate, this.timeformat) : "-") + " | -");
                    }
                    //doc.text(140, medicationLineText, ((other.startDate != "" && other.startDate != undefined && other.startDate != null)? this.datePipe.transform(other.startDate, this.timeformat) : "-") + " | " + (other.endDate != "" && other.endDate != undefined && other.endDate != null)? this.datePipe.transform(other.endDate, this.timeformat) : "-");

                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                    doc.setTextColor(117,120,125)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    doc.text(20, medicationLineText, this.translate.instant("medication.Schedule"));
                    doc.text(50, medicationLineText, this.translate.instant("medication.Compassionate Use"));
                    doc.text(130, medicationLineText, this.translate.instant("medication.Side Effect"));
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                    doc.setTextColor(0,0,0)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    var schedule = "-"
                    if(other.schedule != "" && other.schedule != undefined && other.schedule != null){
                      if(other.schedule == "Daily"){
                        schedule = this.translate.instant("medication.Daily")
                      }
                      if(other.schedule == "10 on / 10 off"){
                        schedule = this.translate.instant("medication.10 on / 10 off")
                      }
                      if(other.schedule == "Other"){
                        schedule = this.translate.instant("generics.Other' | translate")
                      }
                    }
                    doc.text(20, medicationLineText, schedule);
                    //doc.text(20, medicationLineText, (other.schedule != "" && other.schedule != undefined && other.schedule != null)? other.schedule : "-");
                    var compassionateUse = "-"
                    if(other.compassionateUse != "" && other.compassionateUse != undefined && other.compassionateUse != null){
                      if(other.compassionateUse == "yes"){
                        compassionateUse = this.translate.instant("generics.Yes")
                      }
                      if(other.compassionateUse == "no"){
                        compassionateUse = this.translate.instant("generics.No")
                      }
                      if(other.compassionateUse == "Don't know"){
                        compassionateUse = this.translate.instant("generics.Dont know")
                      }
                    }
                    doc.text(50, medicationLineText, compassionateUse);
                    //doc.text(50, medicationLineText, (other.compassionateUse != "" && other.compassionateUse != undefined && other.compassionateUse != null)? other.compassionateUse : "-");
                    var sideEffects = []
                    if (other.sideEffects != "" && other.sideEffects != undefined && other.sideEffects != null){
                      other.sideEffects.forEach(current => {
                      medicationsGroupTranslated.sideEffects.forEach(drugsInfo => {
                        if(drugsInfo.name == current){
                          drugsInfo.translationssideEffect.forEach(translation => {
                            if(this.user.lang == translation.code){
                              sideEffects.push(translation.name)
                            }
                          });
                        }
                      });
                      });
                    }
                    var lengthSpace= sideEffects.length*5;
                    if(sideEffects.length==0){
                      doc.text(130, medicationLineText, '-');
                    }else{
                      doc.text(130, medicationLineText, sideEffects);
                    }
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += lengthSpace)

                    //paint line
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                    doc.setDrawColor(222, 226, 230);
                    doc.line(20, medicationLineText, 200, medicationLineText);

                  })
                  if(contOther == 0){
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    doc.text(20, medicationLineText, this.translate.instant("medication.Currently it is not taking drugs"));
                  }
                }
              }
            }
            break;
          }
          case "vaccination":{
            if(element.data.length > 0){
              var filter = this.filteredPDFsections.find(function(element){
                if(element == "medication"){
                  return true;
                }
              })
              if (filter == "medication"){
                if(!isMedication){
                  doc.addPage();
                  lineText = this.newHeather(doc)
                  doc.setFontType("bold");
                  doc.setFontSize(15);
                  doc.text(20, lineText += 20, this.translate.instant("clinicalinfo.Medication"));
                  medicationLineText = lineText
                  isMedication = true
                }
                if(isMedication){
                  medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                  doc.setFontType("bold");
                  doc.setFontSize(12);
                  doc.text(20, medicationLineText, this.translate.instant("clinicalinfo.Vaccinations"));

                  var contVaccinations = 0
                  element.data.forEach(vaccinations => {
                    contVaccinations++
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                    doc.setTextColor(117,120,125)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    doc.text(20, medicationLineText, this.translate.instant("generics.Name"));
                    doc.text(80, medicationLineText, this.translate.instant("generics.Date"));
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 5)
                    doc.setTextColor(0,0,0)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    var vaccinationName = "-"
                    if(this.user.lang == 'nl' && (vaccinations.name != "" && vaccinations.name != undefined && vaccinations.name != null && vaccinations.name!='Other')){
                      if(vaccinations.name == "Flue"){
                        vaccinationName = "Griepvaccin"
                      }
                      else if(vaccinations.name == "D.K.T.P."){
                        vaccinationName = "D.K.T.P."
                      }
                      else if(vaccinations.name == "D.T.P."){
                        vaccinationName = "D.T.P."
                      }
                      else if(vaccinations.name == "H.I.B."){
                        vaccinationName = "H.I.B."
                      }
                      else if(vaccinations.name == "B.M.R."){
                        vaccinationName = "B.M.R."
                      }
                      else if(vaccinations.name == "Pneumococcal"){
                        vaccinationName = "Pneumokokken"
                      }
                      else if(vaccinations.name == "Chicken-pox"){
                        vaccinationName = "Waterpokken"
                      }
                      else if(vaccinations.name == "Meningococcal"){
                        vaccinationName = "Meningokokken ACW(Y)"
                      }
                      else if(vaccinations.name == "Hepatitis A"){
                        vaccinationName = "Hepatitis A"
                      }
                      else if(vaccinations.name == "Hepatitis B"){
                        vaccinationName = "Hepatitis B"
                      }
                      else if(vaccinations.name == "HPV"){
                        vaccinationName = "HPV"
                      }else if(vaccinations.name == "COVID-19"){
                        vaccinationName = "COVID-19"
                      }
                    }
                    else if(this.user.lang != 'nl' && (vaccinations.name != "" && vaccinations.name != undefined && vaccinations.name != null && vaccinations.name!='Other')){
                      vaccinationName = vaccinations.name
                    }else if(vaccinations.freetext != "" && vaccinations.freetext != undefined && vaccinations.freetext != null){
                      vaccinationName = this.translate.instant("generics.Other")+': '+ vaccinations.freetext
                    }
                    doc.text(20, medicationLineText, vaccinationName);
                    doc.text(80, medicationLineText, (vaccinations.date != "" && vaccinations.date != undefined && vaccinations.date != null)? this.datePipe.transform(vaccinations.date, this.timeformat) : "-");

                  })
                  if(contVaccinations == 0){
                    medicationLineText = this.checkIfNewPage(doc,medicationLineText += 10)
                    doc.setFontType("normal");
                    doc.setFontSize(11);
                    doc.text(20, medicationLineText, this.translate.instant("medication.Currently it is not taking drugs"));
                  }
                }
              }
            }
            break;
          }
          case "courseOfDisease":{
            var filter = this.filteredPDFsections.find(function(element){
              if(element == "courseOfTheDisease"){
                return true;
              }
            })
            if (filter == "courseOfTheDisease"){

              element.data.forEach(care => {
                var firstProm=care.listProms[0];
                //add page new section and title section if is enabled
                if(care.enabled == true){
                  doc.addPage();
                  lineText = this.newHeather(doc)
                  lineText = this.checkIfNewPage(doc,lineText += 20)
                  doc.setFontType("bold");
                  doc.setFontSize(15);
                  var sectionName = this.translateSectionName(care)
                  if(sectionName!=undefined){
                    doc.text(20, lineText, this.translate.instant("Course Of The disease.Course Of The disease"));
                    doc.setFontSize(13);
                    doc.text(20, lineText+=5, sectionName.name)
                  }
                  doc.setFontType("normal");
                  doc.setFontSize(11);
                  //variables para varios proms por linea
                  var promPosition = 20
                  var linePrincipio = 0
                  var lineFinal = lineText
                  //recorrer proms y ver responsetype, relatedto, enabled, data y name
                  care.listProms.forEach(prom => {
                    if(prom[0]!=undefined){
                      if(prom[0].enabled == true){
                        var tempoInfo = this.translateSectionProm(prom)
                        if(tempoInfo!=undefined){
                          lineText = this.writePromsInPDF(firstProm,doc, prom, lineText, promPosition, tempoInfo)
                        }
  
                      }
                    }
                    
                  });
                }
              })
            }
          break;
          }
          case "medicalCare":{
            var filter = this.filteredPDFsections.find(function(element){
              if(element == "medicalCare"){
                return true;
              }
            })
            if (filter == "medicalCare"){
              doc.addPage();
              medicalCareLineText = this.newHeather(doc)
              doc.setFontType("bold");
              doc.setFontSize(15);
              doc.text(20, medicalCareLineText += 20, this.translate.instant("clinicalinfo.Medical Care"));
              element.data.data.forEach(care => {
                switch(care.name){
                  case "general":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.general"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.Clinician"));
                        doc.text(80, medicalCareLineText, this.translate.instant("medicalcare.Hospital"));

                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        var clinician = "-"
                        if(type.clinician != "" && type.clinician != undefined && type.clinician != null){
                          if(type.clinician == "Pediatrician"){
                            clinician = this.translate.instant("medicalcare.Pediatrician")
                          }
                          else if(type.clinician == "Neurologist"){
                            clinician = this.translate.instant("medicalcare.Neurologist")
                          }
                          else if(type.clinician == "Neuro-psychologist"){
                            clinician = this.translate.instant("medicalcare.Neuro-psychologist")
                          }
                          else if(type.clinician == "Cardiologist"){
                            clinician = this.translate.instant("medicalcare.Cardiologist")
                          }
                          else if(type.clinician == "Pulmonologist"){
                            clinician = this.translate.instant("medicalcare.Pulmonologist")
                          }
                          else if(type.clinician == "Endocrinologist"){
                            clinician = this.translate.instant("medicalcare.Endocrinologist")
                          }
                          else if(type.clinician == "Nutritionist/Dietician"){
                            clinician = this.translate.instant("medicalcare.Nutritionist/Dietician")
                          }
                          else if(type.clinician == "Physiotherapist"){
                            clinician = this.translate.instant("medicalcare.Physiotherapist")
                          }
                          else if(type.clinician == "Family doctor"){
                            clinician = this.translate.instant("medicalcare.Family doctor")
                          }
                          else if(type.clinician == "Center for Homeventilation"){
                            clinician = this.translate.instant("medicalcare.Center for Homeventilation")
                          }
                          else if(type.clinician == "Dentist/orthodontist"){
                            clinician = this.translate.instant("medicalcare.Dentist/orthodontist")
                          }
                          else if(type.clinician == "Ophthalmologist"){
                            clinician = this.translate.instant("medicalcare.Ophthalmologist")
                          }
                          else if(type.clinician == "Orthopeed"){
                            clinician = this.translate.instant("medicalcare.Orthopeed")
                          }
                          else if(type.clinician == "Rehabilitation doctor"){
                            clinician = this.translate.instant("medicalcare.Rehabilitation doctor")
                          }
                          else if(type.clinician == "Gastroenterologist specialist"){
                            clinician = this.translate.instant("medicalcare.Gastroenterologist specialist")
                          }
                          else if(type.clinician == "Other"){
                            clinician = this.translate.instant("generics.Other")
                          }
                        }
                        doc.text(20, medicalCareLineText, clinician);
                        if(type.hospital != "" && type.hospital != undefined && type.hospital != null && type.hospital!='Other'){
                          doc.text(80, medicalCareLineText, (type.hospital != "" && type.hospital != undefined && type.hospital != null)? type.hospital : "-");
                        }else{
                          doc.text(80, medicalCareLineText, (type.otherHospital != "" && type.otherHospital != undefined && type.otherHospital != null)? type.otherHospital : "-");
                        }

                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.DistanceKm"));
                        doc.text(80, medicalCareLineText, this.translate.instant("medicalcare.Multidisciplinary"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.text(20, medicalCareLineText, (type.distance != "" && type.distance != undefined && type.distance != null)? type.distance : "-");
                        doc.text(80, medicalCareLineText, (type.multidisciplanary != "" && type.multidisciplanary != undefined && type.multidisciplanary != null)? this.translate.instant("generics.Yes") : this.translate.instant("generics.No"));
                      });
                    }
                    break;
                  }
                  case "specificVisit":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.specificVisit"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.specificVisit"));
                        doc.text(80, medicalCareLineText, this.translate.instant("generics.Date"));
                        doc.text(140, medicalCareLineText, this.translate.instant("medicalcare.Hospital"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        var clinician = "-"
                        if(type.clinician != "" && type.clinician != undefined && type.clinician != null){
                          if(type.clinician == "Pediatrician"){
                            clinician = this.translate.instant("medicalcare.Pediatrician")
                          }
                          else if(type.clinician == "Neurologist"){
                            clinician = this.translate.instant("medicalcare.Neurologist")
                          }
                          else if(type.clinician == "Neuro-psychologist"){
                            clinician = this.translate.instant("medicalcare.Neuro-psychologist")
                          }
                          else if(type.clinician == "Cardiologist"){
                            clinician = this.translate.instant("medicalcare.Cardiologist")
                          }
                          else if(type.clinician == "Pulmonologist"){
                            clinician = this.translate.instant("medicalcare.Pulmonologist")
                          }
                          else if(type.clinician == "Endocrinologist"){
                            clinician = this.translate.instant("medicalcare.Endocrinologist")
                          }
                          else if(type.clinician == "Nutritionist/Dietician"){
                            clinician = this.translate.instant("medicalcare.Nutritionist/Dietician")
                          }
                          else if(type.clinician == "Physiotherapist"){
                            clinician = this.translate.instant("medicalcare.Physiotherapist")
                          }
                          else if(type.clinician == "Family doctor"){
                            clinician = this.translate.instant("medicalcare.Family doctor")
                          }
                          else if(type.clinician == "Center for Homeventilation"){
                            clinician = this.translate.instant("medicalcare.Center for Homeventilation")
                          }
                          else if(type.clinician == "Dentist/orthodontist"){
                            clinician = this.translate.instant("medicalcare.Dentist/orthodontist")
                          }
                          else if(type.clinician == "Ophthalmologist"){
                            clinician = this.translate.instant("medicalcare.Ophthalmologist")
                          }
                          else if(type.clinician == "Orthopeed"){
                            clinician = this.translate.instant("medicalcare.Orthopeed")
                          }
                          else if(type.clinician == "Rehabilitation doctor"){
                            clinician = this.translate.instant("medicalcare.Rehabilitation doctor")
                          }
                          else if(type.clinician == "Gastroenterologist specialist"){
                            clinician = this.translate.instant("medicalcare.Gastroenterologist specialist")
                          }
                          else if(type.clinician == "Other"){
                            clinician = this.translate.instant("generics.Other")
                          }
                        }
                        doc.text(20, medicalCareLineText, clinician);
                        doc.text(80, medicalCareLineText, (type.date != "" && type.date != undefined && type.date != null)? this.datePipe.transform(type.date, this.timeformat) : "-");
                        if(type.hospital != "" && type.hospital != undefined && type.hospital != null && type.hospital!='Other'){
                          doc.text(140, medicalCareLineText, (type.hospital != "" && type.hospital != undefined && type.hospital != null)? type.hospital : "-");
                        }else{
                          doc.text(140, medicalCareLineText, (type.otherHospital != "" && type.otherHospital != undefined && type.otherHospital != null)? type.otherHospital : "-");
                        }
                      });
                    }
                    break;
                  }
                  case "hospitalization":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.hospitalization"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("generics.Date"));
                        doc.text(80, medicalCareLineText, this.translate.instant("medicalcare.Hospital"));

                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);

                        if(type.enddate != "" && type.enddate != undefined && type.enddate != null){
                          doc.text(20, medicalCareLineText, ((type.startdate != "" && type.startdate != undefined && type.startdate != null)? this.datePipe.transform(type.startdate, this.timeformat) : "-") + " | " + this.datePipe.transform(type.enddate, this.timeformat));
                        }else{
                          doc.text(20, medicalCareLineText, ((type.startdate != "" && type.startdate != undefined && type.startdate != null)? this.datePipe.transform(type.startdate, this.timeformat) : "-") + " | -");
                        }
                        if(type.hospital != "" && type.hospital != undefined && type.hospital != null && type.hospital!='Other'){
                          doc.text(80, medicalCareLineText, (type.hospital != "" && type.hospital != undefined && type.hospital != null)? type.hospital : "-");
                        }else{
                          doc.text(80, medicalCareLineText, (type.otherHospital != "" && type.otherHospital != undefined && type.otherHospital != null)? type.otherHospital : "-");
                        }

                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.Reason"));
                        if(type.icu == true){
                          doc.text(80, medicalCareLineText, this.translate.instant("medicalcare.Days in ICU"));
                        }

                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);


                        var reason = "-"
                        if((type.reason != "" && type.reason != undefined && type.reason != null)){
                          if(type.reason == "Cardiac"){
                            reason = this.translate.instant("medicalcare.Cardiac")
                          }
                          else if(type.reason == "Respiratory"){
                            reason = this.translate.instant("medicalcare.Respiratory")
                          }
                          else if(type.reason == "Fracture"){
                            reason = this.translate.instant("medicalcare.Fracture")
                          }
                          else if(type.reason == "Kidney"){
                            reason = this.translate.instant("medicalcare.Kidney")
                          }
                          else if(type.reason == "Gastrointestinal"){
                            reason = this.translate.instant("medicalcare.Gastrointestinal")
                          }
                          else if(type.reason == "Orthopedic Surgery spine"){
                            reason = this.translate.instant("medicalcare.Orthopedic Surgery spine")
                          }
                          else if(type.reason == "Orthopedic Surgery feet"){
                            reason = this.translate.instant("medicalcare.Orthopedic Surgery feet")
                          }
                          else if(type.reason == "Other"){
                            reason = this.translate.instant("generics.Other")
                          }
                        }
                        doc.text(20, medicalCareLineText, reason);
                        if(type.icu && type.days!=undefined){
                          doc.text(80, medicalCareLineText, type.icu? type.days : "-");
                        }else{
                          doc.text(80, medicalCareLineText, "-");
                        }


                      });
                    }
                    break;
                  }
                  case "emergencies":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.emergencies"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.Hospital"));
                        doc.text(80, medicalCareLineText, this.translate.instant("medicalcare.Reason"));
                        doc.text(140, medicalCareLineText, this.translate.instant("generics.Date"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        if(type.hospital != "" && type.hospital != undefined && type.hospital != null && type.hospital!='Other'){
                          doc.text(20, medicalCareLineText, (type.hospital != "" && type.hospital != undefined && type.hospital != null)? type.hospital : "-");
                        }else{
                          doc.text(20, medicalCareLineText, (type.otherHospital != "" && type.otherHospital != undefined && type.otherHospital != null)? type.otherHospital : "-");
                        }
                        var reason = "-"
                        if((type.reason != "" && type.reason != undefined && type.reason != null)){
                          if(type.reason == "Cardiac"){
                            reason = this.translate.instant("medicalcare.Cardiac")
                          }
                          else if(type.reason == "Respiratory"){
                            reason = this.translate.instant("medicalcare.Respiratory")
                          }
                          else if(type.reason == "Fracture"){
                            reason = this.translate.instant("medicalcare.Fracture")
                          }
                          else if(type.reason == "Kidney"){
                            reason = this.translate.instant("medicalcare.Kidney")
                          }
                          else if(type.reason == "Gastrointestinal"){
                            reason = this.translate.instant("medicalcare.Gastrointestinal")
                          }
                          else if(type.reason == "Trauma"){
                            reason = this.translate.instant("medicalcare.Trauma")
                          }
                          else if(type.reason == "FES"){
                            reason = this.translate.instant("medicalcare.FES (Fat Embolism Syndrom)")
                          }
                          else if(type.reason == "Other"){
                            reason = this.translate.instant("generics.Other")
                          }
                        }
                        doc.text(80, medicalCareLineText, reason);
                        doc.text(140, medicalCareLineText, (type.date != "" && type.date != undefined && type.date != null)? this.datePipe.transform(type.date, this.timeformat) : "-");
                      });
                    }
                    break;
                  }
                  case "cardiotest":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.cardiotest"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.Type of test"));
                        doc.text(80, medicalCareLineText, this.translate.instant("generics.Date"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        var typeoftest = "-"
                        if((type.typeoftest != "" && type.typeoftest != undefined && type.typeoftest != null)){
                          if(type.typeoftest == "Ultrasound"){
                            typeoftest = this.translate.instant("medicalcare.Ultrasound")
                          }
                          else if(type.typeoftest == "ECG"){
                            typeoftest = this.translate.instant("medicalcare.Electrocardiogram")
                          }
                          else if(type.typeoftest == "24h holter"){
                            typeoftest = "24h holter"
                          }
                          else if(type.typeoftest == "MRI"){
                            typeoftest = this.translate.instant("medicalcare.Magnetic resonance imaging (MRI)")
                          }
                        }
                        doc.text(20, medicalCareLineText, typeoftest);
                        if(type.date != null){
                          doc.text(80, medicalCareLineText, (type.date != "" && type.date != undefined && type.date != null)? this.datePipe.transform(type.date, this.timeformat) : "-");
                        }
                        else{
                          doc.text(80, medicalCareLineText, "-");
                        }
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, "LVEF in %");
                        doc.text(80, medicalCareLineText, this.translate.instant("medicalcare.Blood pressure"));
                        doc.text(140, medicalCareLineText, this.translate.instant("medicalcare.Pulse"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.text(20, medicalCareLineText, (type.lvef != "" && type.lvef != undefined && type.lvef != null)? type.lvef : "-");
                        var bloodpressure = "-"
                        if(type.bloodpressure != "" && type.bloodpressure != undefined && type.bloodpressure != null){
                          bloodpressure = type.bloodpressure
                        }
                        var bloodpressure2 = "-"
                        if(type.bloodpressure2 != "" && type.bloodpressure2 != undefined && type.bloodpressure2 != null){
                          bloodpressure2 = type.bloodpressure2
                        }
                        doc.text(80, medicalCareLineText, bloodpressure + "/" + bloodpressure2);
                        doc.text(140, medicalCareLineText, (type.pulse != "" && type.pulse != undefined && type.pulse != null)? type.pulse : "-");
                      });
                    }
                    break;
                  }
                  case "respiratorytests":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.respiratorytests"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.Type of test"));
                        doc.text(50, medicalCareLineText, this.translate.instant("generics.Date"));
                        doc.text(80, medicalCareLineText, "FVC (%)");
                        doc.text(110, medicalCareLineText, "PEF (L/min)");
                        doc.text(140, medicalCareLineText, "MIP/MEP (cmH2O)");
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        if(type.typeoftest == "Other"){
                          doc.text(20, medicalCareLineText, (type.otherTest != "" && type.otherTest != undefined && type.otherTest != null)? type.otherTest : "-");
                        }
                        else{
                          var typeoftest = "-"
                          if((type.typeoftest != "" && type.typeoftest != undefined && type.typeoftest != null)){
                            if(type.typeoftest == "spirometry"){
                              typeoftest = this.translate.instant("medicalcare.Spirometry")
                            }
                            else if(type.typeoftest == "sleep study"){
                              typeoftest = this.translate.instant("medicalcare.Sleep study")
                            }
                            else if(type.typeoftest == "Blood gas test"){
                              typeoftest = this.translate.instant("medicalcare.Spirometry")
                            }
                            else if(type.typeoftest == "MRI"){
                              typeoftest = this.translate.instant("medicalcare.Blood gas test")
                            }
                          }
                          doc.text(20, medicalCareLineText, typeoftest);
                        }
                        doc.text(50, medicalCareLineText, (type.date != "" && type.date != undefined && type.date != null)? this.datePipe.transform(type.date, this.timeformat) : "-");
                        doc.text(80, medicalCareLineText, (type.fvc != "" && type.fvc != undefined && type.fvc != null)? type.fvc : "-");
                        doc.text(110, medicalCareLineText, (type.pef != "" && type.pef != undefined && type.pef != null)? type.pef : "-");
                        doc.text(140, medicalCareLineText, (type.mipmep != "" && type.mipmep != undefined && type.mipmep != null)? type.mipmep : "-");
                      });
                    }
                    break;
                  }
                  case "bonehealthtest":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.bonehealthtest"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.Type of test"));
                        doc.text(140, medicalCareLineText, this.translate.instant("generics.Date"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        var typeoftest = "-"
                        if((type.typeoftest != "" && type.typeoftest != undefined && type.typeoftest != null)){
                          if(type.typeoftest == "Bone Densitometry (DEXA)"){
                            typeoftest = this.translate.instant("medicalcare.Bone Densitometry (DEXA)")
                          }
                          else if(type.typeoftest == "Spinal X-Ray"){
                            typeoftest = this.translate.instant("medicalcare.Spinal X-Ray")
                          }
                          else if(type.typeoftest == "Scoliosis X-ray"){
                            typeoftest = this.translate.instant("medicalcare.Scoliosis X-ray")
                          }
                        }
                        doc.text(20, medicalCareLineText, typeoftest);
                        doc.text(140, medicalCareLineText, (type.date != "" && type.date != undefined && type.date != null)? this.datePipe.transform(type.date, this.timeformat) : "-");
                      });
                    }
                    break;
                  }
                  case "bloodtest":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.bloodtest"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("generics.Date"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.text(20, medicalCareLineText, (type.date != "" && type.date != undefined && type.date != null)? this.datePipe.transform(type.date, this.timeformat) : "-");
                      });
                    }
                    break;
                  }
                  case "surgery":{
                    if(care.data.length > 0){
                      medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                      doc.setFontType("bold");
                      doc.setFontSize(12);
                      doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.surgery"));
                      care.data.forEach(type => {
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 10)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        doc.setTextColor(117,120,125)
                        doc.text(20, medicalCareLineText, this.translate.instant("medicalcare.Type of surgery"));
                        doc.text(140, medicalCareLineText, this.translate.instant("generics.Date"));
                        medicalCareLineText = this.checkIfNewPage(doc,medicalCareLineText += 5)
                        doc.setTextColor(0,0,0)
                        doc.setFontType("normal");
                        doc.setFontSize(11);
                        var typeoftest = "-"
                        if((type.typeoftest != "" && type.typeoftest != undefined && type.typeoftest != null)){
                          if(type.typeoftest == "Scoliosis surgery"){
                            typeoftest = this.translate.instant("medicalcare.Scoliosis surgery")
                          }
                          else if(type.typeoftest == "Foot surgery"){
                            typeoftest = this.translate.instant("medicalcare.Foot surgery")
                          }
                          else if(type.typeoftest == "Tendonectomy"){
                            typeoftest = this.translate.instant("medicalcare.Tendonectomy")
                          }
                          else if(type.typeoftest == "Fixation or Fracture"){
                            typeoftest = this.translate.instant("medicalcare.Fixation or Fracture")
                          }
                          else if(type.typeoftest == "Tracheostoma"){
                            typeoftest = this.translate.instant("medicalcare.Tracheostoma")
                          }
                          else if(type.typeoftest == "Placing an ICD / pacemaker"){
                            typeoftest = this.translate.instant("medicalcare.Placing an ICD / pacemaker")
                          }
                          else if(type.typeoftest == "PEG probe"){
                            typeoftest = this.translate.instant("medicalcare.PEG probe")
                          }
                          else if(type.typeoftest == "Other"){
                            typeoftest = this.translate.instant("generics.Other")
                          }
                        }
                        doc.text(20, medicalCareLineText, typeoftest);
                        doc.text(140, medicalCareLineText, (type.date != "" && type.date != undefined && type.date != null)? this.datePipe.transform(type.date, this.timeformat) : "-");
                      });
                    }
                    break;
                  }
                  default:{
                    break;
                  }
                }
              })
            }
            break;
          }
          case "clinicalTrials":{
            if(element.data.length > 0){
              var filter = this.filteredPDFsections.find(function(element){
                if(element == "clinicalTrials"){
                  return true;
                }
              })
              if (filter == "clinicalTrials"){
                doc.addPage();
                lineText = this.newHeather(doc)
                doc.setFontType("bold");
                doc.setFontSize(15);
                doc.text(20, lineText += 20, this.translate.instant("clinicalinfo.Clinical Trials"));
                element.data.forEach(trial => {
                  lineText = this.checkIfNewPage(doc,lineText += 10)
                  doc.setTextColor(117,120,125)
                  doc.setFontSize(11);
                  doc.setFontType("normal");
                  doc.text(20, lineText, this.translate.instant("generics.Name"));
                  doc.text(60, lineText, this.translate.instant("clinicaltrials.Taking Part"));
                  doc.text(100, lineText, this.translate.instant("generics.Date"));
                  doc.text(140, lineText, this.translate.instant("clinicaltrials.Drug in Test"));
                  lineText = this.checkIfNewPage(doc,lineText += 5)
                  doc.setTextColor(0,0,0)
                  doc.setFontType("normal");
                  doc.setFontSize(11);
                  doc.text(20, lineText, (trial.nameClinicalTrial != "" && trial.nameClinicalTrial != undefined && trial.nameClinicalTrial != null)? trial.nameClinicalTrial : "-");
                  var takingClinicalTrial = "-"
                  if(trial.takingClinicalTrial != "" && trial.takingClinicalTrial != undefined && trial.takingClinicalTrial != null){
                    if(trial.takingClinicalTrial == "Yes, currently"){
                      takingClinicalTrial = this.translate.instant("clinicaltrials.Yes, currently")
                    }
                    else if(trial.takingClinicalTrial == "No, but previously"){
                      takingClinicalTrial = this.translate.instant("clinicaltrials.No, but previously")
                    }
                    else if(trial.takingClinicalTrial == "Never"){
                      takingClinicalTrial = this.translate.instant("clinicaltrials.Never")
                    }
                    else if(trial.takingClinicalTrial == "Unknown"){
                      takingClinicalTrial = this.translate.instant("clinicaltrials.Unknown")
                    }
                  }
                  doc.text(60, lineText, takingClinicalTrial);
                  doc.text(100, lineText, (trial.date != "" && trial.date != undefined && trial.date != null)? this.datePipe.transform(trial.date, this.timeformat) : "-");
                  doc.text(140, lineText, (trial.drugName != "" && trial.drugName != undefined && trial.drugName != null)? trial.drugName : "-");
                });
              }
            }
            break;
          }
          default:{
            break;
          }
        }
      });
    }
}
