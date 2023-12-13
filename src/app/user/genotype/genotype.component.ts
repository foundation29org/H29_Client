import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import * as xml2js from 'xml2js';
import swal from 'sweetalert2';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import {DateAdapter} from '@angular/material/core';


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

export interface Variant {
    gen: string;
    mutation: string;
    codingsequencechange: string;
    aminoacidchange: string;
    isoform: string;
    genomiccoordinates: string;
}

@Component({
    selector: 'app-genotype',
    templateUrl: './genotype.component.html',
    styleUrls: ['./genotype.component.scss'],
    providers: [ApiDx29ServerService]
})

export class GenotypeComponent implements OnInit, OnDestroy{
  //Variable Declaration
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  genotype: any = {};
  genotypeCopy: any = {};
  mygroup: string = '';
  uploadingGenotype: boolean = false;
  uploadingGenotypeVCF: boolean = false;
  loading: boolean = false;
  sending: boolean = false;
  isApp: boolean = false;
  processing: boolean = false;
  fileData: any;
  //idGenotype: string = null;
  uploadProgress: Observable<number>;
  uploadProgressVCF: Observable<number>;

  numberFiles: number = 0;
  filesOnBlob: any = [];
  totalSize: number = 0;
  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: '',
    patientId: ''
  };

  uploaded: boolean = false;

  showOnlyQuestion: boolean = true;

  editingGenotype: boolean = false;
  selectedOption: boolean = false;

  genlist: any = [];
  @ViewChild('f') manualForm: NgForm;
  private subscription: Subscription = new Subscription();
  group: string;
  timeformat="";

  showinformation:boolean=false;
  duchenneinternational: string = globalvars.duchenneinternational;

  search = (text$: Observable<string>) =>
  text$.pipe(
    debounceTime(200), // Ajusta el tiempo según sea necesario
    distinctUntilChanged(),
    switchMap(term =>
      this.http.get(`https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?df=_code_system,_code,chromosome,Symbol,description,type_of_gene&authenticity_token=&maxList=15&terms=${term.toUpperCase()}`)
        .pipe(
          map((res: any) => res[3] ? res[3].map(gene => gene[3]) : []),
          catchError(() => of([])) // Manejo de errores
        )
    )
  );

  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private authService: AuthService, public toastr: ToastsManager, public translate: TranslateService, private authGuard: AuthGuard, private sortService: SortService, private searchService: SearchService, private blob: BlobStorageService,private adapter: DateAdapter<any>, private apiDx29ServerService: ApiDx29ServerService) {
    this.group = this.authService.getGroup();
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

  onSelect(event: any, index: number) {
    // Actualizar el gen seleccionado para la variante específica
    this.genotype.data[index].gen = event.item;
    //this.genotype.data[index].geninput = null;
  }

    ngOnInit() {

      this.subscription.add( this.route.params.subscribe(params => {
          this.editingGenotype = params['editingGenotype'];
          if(this.editingGenotype){
            this.editGenotype();
          }
      }));


      this.mygroup = this.authService.getGroup();

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

      this.loadTranslations();
      this.genotype = {
        date: null,
        data: [],
        _id: null,
        inputType: 'manual'
      };

      this.genotypeCopy = {
        date: null,
        data: [],
        _id: null,
        inputType: 'manual'
      };

      //cargar los datos del usuario
      this.loading = true;
      this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        if(res.listpatients.length>0){
          this.authService.setPatientList(res.listpatients);
          this.authService.setCurrentPatient(res.listpatients[0]);
          //quito el primer caracter, ya que solo deja poner contenedores de 63 caracteres, y tenemos 64
          /*this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
          this.accessToken.patientId = this.authService.getCurrentPatient().sub;
          this.blob.createContainerIfNotExists(this.accessToken);*/
          this.getAzureBlobSasToken();
          if(this.group!=this.duchenneinternational){
            //cargar el genotipo del usuario
            this.subscription.add( this.http.get(environment.api+'/api/genotypes/'+res.listpatients[0].sub)
            .subscribe( (res : any) => {
              if(res.message){
                //no tiene genotipo
              }else{
                res.genotype.data.sort(this.sortService.GetSortOrder("name"));// los ordeno por nombre?
                this.genotype = res.genotype;
                this.genotypeCopy = JSON.parse(JSON.stringify(res.genotype));
                this.genlist = [];
                for (var i = 0; i < this.genotype.data.length; i++) {
                  //this.genlist[i]=[{name: this.genotype.data[i].gen}];
                  this.genlist.push([{name: this.genotype.data[i].gen}]);
                }
                //this.idGenotype = res.genotype._id;
              }
              this.loading = false;
             }, (err) => {
               console.log(err);
               this.loading = false;
             }));
          }



        }else{
          swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
          this.router.navigate(['/user/basicinfo/personalinfo']);
        }
       }, (err) => {
         console.log(err);
         this.loading = false;
       }));

       this.isApp = this.authService.getIsApp();


       this.subscription.add( this.blob.change.subscribe(uploaded => {
          this.uploaded = uploaded;
          this.uploadingGenotype = false;
          this.uploadingGenotypeVCF = false;
          this.editingGenotype = false;
          swal('Done', '', "success");
        }));

      this.subscription.add( this.blob.changeFilesBlob.subscribe(filesOnBlob => {
        this.totalSize = 0;
         this.filesOnBlob = this.blob.filesOnBlob;
         for(var index in this.filesOnBlob){
            this.totalSize += (this.filesOnBlob[index].contentLength/1024/1024);
         }
         this.loading = false;
         this.numberFiles = filesOnBlob.length
         this.getAnswer()
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
               console.warn("Yes :D -> " + list_permissions[i]);
             }
             else {
               console.warn("No :( -> " + list_permissions[i]);
             }
           });
         }
       }

       function requestError(){
         console.warn("Permissions request error");
       }


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

    //stats questions
    setAnswer(event){

      let yesAnswer = document.getElementById('yesAnswer');
      //var yesAnswerChecked = (<HTMLInputElement>yesAnswer).checked;
      let noAnswer = document.getElementById('noAnswer');

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
      this.postAnswer(answer, "genotype", this.authService.getCurrentPatient().sub)
      this.postAnswer(this.numberFiles, "genotypeFiles", this.authService.getCurrentPatient().sub)//set genotype files number
    }

    postAnswer(answer, type, patientId){
      var data = {answer: answer, type: type, patientId: patientId};
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
      var data = { type: "genotype", patientId: this.authService.getCurrentPatient().sub};
      this.subscription.add( this.http.post(environment.api+'/api/admin/answers/getanswer/', data)
      .subscribe( (res : any) => {

        if(this.numberFiles > 0){
          let noButton = document.getElementById('noAnswer');
          (<HTMLInputElement>noButton).checked = false;
          (<HTMLInputElement>noButton).disabled = true;
          let yesButton = document.getElementById('yesAnswer');
          (<HTMLInputElement>yesButton).checked = true;
          (<HTMLInputElement>yesButton).disabled = true
          this.postAnswer(true, "genotype", this.authService.getCurrentPatient().sub)//set yes answer
          this.postAnswer(this.numberFiles, "genotypeFiles", this.authService.getCurrentPatient().sub)//set genotype files number
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

    editGenotype(){
      this.editingGenotype = true;
    }

    cancelEditGenotype(){
      this.editingGenotype = false;
    }

    showPanelBamFastq(){
      $('#panel-bam-fastq').show();
      $('#sectionsOfGenotype').hide();
      this.selectedOption = true;
    }

    showPanelVcf(){
      $('#panel-vcf').show();
      $('#sectionsOfGenotype').hide();
      this.selectedOption = true;
    }

    showPanelManual(){
      $('#panel-manual').show();
      $('#sectionsOfGenotype').hide();
      this.selectedOption = true;
    }

    back(){
      $('#panel-bam-fastq').hide();
      $('#panel-vcf').hide();
      $('#panel-manual').hide();
      $('#sectionsOfGenotype').show();
      this.selectedOption = false;
    }


    onFileChange(event: any): void {
      if((event.target.files[0].size /1024/1024) + this.totalSize > 4000){
        swal('Space limit exceeded. Delete some file or hire more space.', '', "error");
      }else{
        this.uploadingGenotype = true;
        this.uploadProgress = this.blob
          .uploadToBlobStorage(this.accessToken, event.target.files[0]);
      }

    }

    onFileChangeVCF(event: any): void {
      if((event.target.files[0].size /1024/1024) + this.totalSize > 4000){
        swal('Space limit exceeded. Delete some file or hire more space.', '', "error");
      }else{
        this.uploadingGenotypeVCF = true;
        this.uploadProgressVCF = this.blob
          .uploadToBlobStorage(this.accessToken, event.target.files[0]);
      }

    }


    deleteFile(i){
    this.blob.deleteBlob(this.accessToken.containerName ,this.filesOnBlob[i].name);
    this.numberFiles--
    this.postAnswer(this.numberFiles, "genotypeFiles", this.authService.getCurrentPatient().sub)//set genotype files number
    if(this.numberFiles==0){
      let yesAnswer = document.getElementById('yesAnswer');
      (<HTMLInputElement>yesAnswer).disabled = false
      let noAnswer = document.getElementById('noAnswer');
      (<HTMLInputElement>noAnswer).disabled = false
    }
  }


  confirmDeleteFile(i){
    swal({
      title: this.translate.instant("generics.Are you sure?"),
      text: this.translate.instant("generics.Delete File")+": "+this.filesOnBlob[i].name,
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
        this.deleteFile(i);
      }

    }).catch(swal.noop);
  }

  addVariant() {
    let variant: Variant = {gen: null, mutation: null, codingsequencechange: null, aminoacidchange: null, isoform: null, genomiccoordinates: null};
    this.genotype.data.push(variant);
  }

  deleteVariant(i){
    let textDeleteVariantSwall="";
    let numberVariant = i+1;
    if(this.genotype.data[i].gen==null){
      textDeleteVariantSwall= this.translate.instant("genotype.Empty Variant")+" "+numberVariant;
    }
    else{
      textDeleteVariantSwall=this.genotype.data[i].gen;
    }
    swal({
      title: this.translate.instant("generics.Are you sure?"),
      text: this.translate.instant("genotype.Delete Variant")+": "+textDeleteVariantSwall,
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
        this.confirmDeleteVariant(i);
      }

    }).catch(swal.noop);
  }


  confirmDeleteVariant(index){
    this.genotype.data.splice(index, 1);
    this.uploadChangesVariant();
  }

  uploadChangesVariant() {
    if(this.authGuard.testtoken()){
      //this.sending = true;
      //remove the new property
      for(var hpo in this.genotype.data){
        delete this.genotype.data[hpo].new;
      }
      this.genotype.date = Date.now();
      if(this.genotype._id==null){

        this.subscription.add( this.http.post(environment.api+'/api/genotypes/'+this.authService.getCurrentPatient().sub, this.genotype)
        .subscribe( (res : any) => {
          //this.idGenotype = res.genotype._id;
          this.genotype = {};
          this.genotype = res.genotype;
          this.genotypeCopy = JSON.parse(JSON.stringify(res.genotype));
          //this.sending = false;
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
          //this.returnHomeGenotype();
         }, (err) => {
           console.log(err);
           //this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/genotypes/'+this.genotype._id, this.genotype)
        .subscribe( (res : any) => {
          //this.idGenotype = res.genotype._id;
          this.genotype = res.genotype;
          this.genotypeCopy = JSON.parse(JSON.stringify(res.genotype));
          //this.sending = false;
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
          //this.returnHomeGenotype();
         }, (err) => {
           console.log(err.error);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }
    }
  }

  moreInfo(i){
    var palabra = '.moreinfo'+i;
    var palabra2 ='.bottominfo'+i;
    $(palabra).show();
    $(palabra2).hide();
  }

  hideInfo(i){
    var palabra= '.moreinfo'+i;
    var palabra2 ='.bottominfo'+i;
    $(palabra).hide();
    $(palabra2).show();
  }

  onChangeGen(newValue, index, indice) {
    //this.genlist = [];
    let param = newValue.toUpperCase();
    this.subscription.add( this.http.get('https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?df=_code_system,_code,chromosome,Symbol,description,type_of_gene&authenticity_token=&maxList=15&terms='+param)
    .subscribe( (res : any) => {
      if (res[3] && Array.isArray(res[3])) {
        let tempGenes = [];
        res[3].forEach(gene => {
          // Verificamos que el sub-array del gen tiene al menos 4 elementos
          if (gene[3]) {
            let geneName = gene[3]; 
            tempGenes.push({name: geneName});
            
            // El nombre del gen está en la posición 3 de cada sub-array
            
          }
        });
        if(this.genlist[indice]==undefined){
          this.genlist.push(tempGenes);
        }else{
          this.genlist[indice] = tempGenes;
        }
      }
     }, (err) => {
       console.log(err);
     }));
  }

  onChangeGen2(newValue, index, indice) {
    /*let myHeaders = new Headers();
    myHeaders.append('existingGenes', []);
    let options = new RequestOptions({ headers: myHeaders });*/
    this.subscription.add( this.http.get('https://magallanescontributionservice.azurewebsites.net/api/contribution/SearchGenes'+'?tokenWord='+newValue)
    .subscribe( (res : any) => {
      console.log(res)
      if(this.genlist[indice]==undefined){
        this.genlist.push(res);
      }else{

        this.genlist[indice] = res;
      }

     }, (err) => {
       console.log(err);
     }));
  }

  returnHomeGenotype(){
    this.cancelEditGenotype();
    this.back();
  }

  submitInvalidForm() {
    if (!this.manualForm) { return; }
    const base = this.manualForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmit() {
    if(this.authGuard.testtoken()){
      this.sending = true;
      //remove the new property
      for(var hpo in this.genotype.data){
        delete this.genotype.data[hpo].new;
      }
      this.genotype.date = Date.now();
      if(this.genotype._id==null){

        this.subscription.add( this.http.post(environment.api+'/api/genotypes/'+this.authService.getCurrentPatient().sub, this.genotype)
        .subscribe( (res : any) => {
          //this.idGenotype = res.genotype._id;
          this.genotype = {};
          this.genotype = res.genotype;
          this.genotypeCopy = JSON.parse(JSON.stringify(res.genotype));
          this.sending = false;
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
          this.returnHomeGenotype();
         }, (err) => {
           console.log(err);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/genotypes/'+this.genotype._id, this.genotype)
        .subscribe( (res : any) => {
          //this.idGenotype = res.genotype._id;
          this.genotype = res.genotype;
          this.genotypeCopy = JSON.parse(JSON.stringify(res.genotype));
          this.sending = false;
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
          this.returnHomeGenotype();
         }, (err) => {
           console.log(err.error);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }
    }
  }

  downloadFile(containerName, fileName){
      var dirFicheros, directorio;
      var esAndroid = false;
      var assetURL = this.accessToken.blobAccountUrl+"/"+containerName+"/"+fileName+this.accessToken.sasToken;
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

      showInfo(){
        this.showinformation=!this.showinformation;
      }

  }
