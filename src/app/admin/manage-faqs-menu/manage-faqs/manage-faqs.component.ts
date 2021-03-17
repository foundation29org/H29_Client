import { Component, ViewChild, ViewEncapsulation, OnDestroy, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { LangService } from 'app/shared/services/lang.service';
import { FaqService } from 'app/shared/services/faq.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { QnaPair } from './qna-pair.interface';
import { Subscription } from 'rxjs/Subscription';
import { addMinutes } from 'date-fns';

import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge } from 'rxjs/operators'


let categoriesInfo=[];
const URLQna=environment.f29api+'/api/knowledgebases/';
const URLQnaForKnowledgeBasesOperationOperations=environment.f29api+'/api/operations/'

@Component({
    selector: 'app-manage-faqs',
    templateUrl: './manage-faqs.component.html',
    styleUrls: ['./manage-faqs.component.scss'],
    providers: [LangService, FaqService],
    encapsulation: ViewEncapsulation.None
})

export class ManageFaqsComponent implements OnInit, OnDestroy{
  @ViewChild('form') manageFaqsForm: NgForm;
  @ViewChild('f') NewQnaPairForm: NgForm;

  @Input() faqIncluded: any;

  langs: any;
  datadest:any=null;
  lang2: string = '';
  loadingFaqs: boolean = false;
  waiting: boolean = false;
  savingQnAPair: boolean = false;
  KnowledgesSaved: any = [];
  KnowledgesNoSaved: any = [];
  actualKnowledge: any = [];
  showNewKnowledgesLang: boolean = false;
  newKnowledgeLang: any = [];
  showPanelNewQnAPairs: boolean = false;
  showPanelSelectionQna: boolean = false;
  actualQna: QnaPair = {id: 0, questions: [], answer: "", metadata:[]};
  actualQnaCopy: QnaPair = {id: 0, questions: [], answer: "", metadata:[]};
  lastPublishedTimestamp: Date = null;
  pendingOperation: boolean = false;
  private subscription: Subscription = new Subscription();
  includedFaqNewQNA: any = [];
  categoriesInfo:any=[];
  categoriesNewAdded:any=[];
  selectedItems:any = [];
  modelTemp: any;
  searchingFAQs:boolean=false;
  foundQna:boolean=false;
  modalReference: NgbModalRef;
  /*FAQsNotAnswered: any = [];
  FAQsNotAnsweredCopy: any = [];
  numberOfQuestion: any = 0;
  groupId: any;
  modalReference: NgbModalRef;
  isLoading: boolean = false;
  filterActive: boolean = false;
  filterElementsList: any = [];*/

  // Flag search
  searchCategories = (text$: Observable<string>) =>
  text$.pipe(
    debounceTime(200),
    map(term => {
      if(term === ''){
        this.foundQna = false;
        this.searchingFAQs = false;
        return [];
      }else{
        var resultSearch = this.categoriesInfo.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 100)
        if(resultSearch.length==0){
          this.foundQna = false;
        }else{
          this.foundQna = true;
        }
        this.searchingFAQs = false;
        return resultSearch
      }
    }
  )

  );



  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, private langService: LangService, private faqService: FaqService, public toastr: ToastsManager, private modalService: NgbModal, private route: ActivatedRoute, private router: Router){
    this.loadingFaqs = true;
    this.categoriesNewAdded=[];
    this.loadLanguages();
    this.langs = langService.langs;
    this.lang2 = this.authService.getLang();
    //this.onChangeLang2(this.lang2);

    //this.getNotAnsweredFAQs();
  }


  ngOnInit(){

    this.subscription.add(this.route
      .queryParams
      .subscribe(params => {
        // Defaults to 0 if no query param provided.
        this.actualQna = {id: 0, questions: [], answer: "",metadata:[]};
        var temp = params['userQuestion'] || "";
        this.actualQna.questions.push({q:temp, id:Math.random()});
        this.showPanelNewQnAPairs = params['showPanelNewQnAPairs'] || false;
      }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadLanguages() {
      this.subscription.add( this.langService.getLangs()
      .subscribe( (res : any) => {
        this.langs = res;
        this.loadAvailablesQnas();
      }));
  }

  loadAvailablesQnas(){
    this.KnowledgesSaved = [];
    this.KnowledgesNoSaved = [];
    var paramssend = { group: this.authService.getGroup() };
    this.subscription.add( this.http.get(environment.api+'/api/qnas',{params: paramssend})
    .subscribe( (res : any) => {
      for (var i = 0; i < this.langs.length; i++) {
        var found = false;
        for (var j = 0; j < res.length && !found; j++) {
          if(this.langs[i].code==res[j].lang){
            found = true;
            this.KnowledgesSaved.push({name:this.langs[i].name, code:this.langs[i].code, knowledgeBaseID:res[j].knowledgeBaseID});
          }
        }
        if(!found){
          this.KnowledgesNoSaved.push({name:this.langs[i].name, code:this.langs[i].code});
        }
      }

      if(this.KnowledgesSaved.length > 0){
        if(this.actualKnowledge.length == 0){
          this.actualKnowledge = this.KnowledgesSaved[0];
        }else{

          found = false;
          for (var i = 0; i < this.KnowledgesSaved.length && !found; i++) {
            if(this.actualKnowledge.code == this.KnowledgesSaved[i].code){
              this.actualKnowledge = this.KnowledgesSaved[i];
              found = true;
            }
          }
          if(!found){
            this.actualKnowledge = this.KnowledgesSaved[0];
          }

        }


      this.onChangeLang2(this.actualKnowledge);

      }
     }, (err) => {
       console.log(err);
     }));
  }

  onChangeLang2(newValue) {
    this.loadingFaqs = true;
    //var paramssend2 = this.authService.getGroup()+"-code-"+this.actualKnowledge.code;
    this.subscription.add(this.http.get(environment.api+'/api/admin/qna/getCategories/'+this.actualKnowledge.knowledgeBaseID)
    .subscribe( (res : any) => {
      this.categoriesInfo=res.categories;
        //this.actualKnowledge = this.KnowledgesSaved[0].knowledgeBaseID;
        this.subscription.add( this.faqService.loadDataknowledgeBaseID(newValue.knowledgeBaseID)
        .subscribe( (res : any) => {
          this.datadest=res.qnaDocuments;
          this.loadingFaqs = false;

          //get lastPublishedTimestamp
          this.getLastPublishedTimestamp(newValue.knowledgeBaseID);

        }, (err) => {
        console.log(err);
        this.onChangeLang2(newValue);
        this.loadingFaqs = false;
      }));
    }, (err) => {
      console.log(err);
    }));

  }

  onSearchChange(){
    this.searchingFAQs = true;
  }

  getLastPublishedTimestamp(knowledgeBaseID){
    this.subscription.add( this.http.get(URLQna+knowledgeBaseID)
      .subscribe( (res : any) => {
        this.lastPublishedTimestamp = res.lastPublishedTimestamp;
       }, (err) => {
         console.log(err);
       }));
  }


 newKnowledgesLang(){
    this.showNewKnowledgesLang = true;
  }

  cancelNewKnowledgesLang(){
    this.showNewKnowledgesLang = false;
  }

  addKnowledgesLang(){
    this.showNewKnowledgesLang = false;
    this.loadingFaqs = true;
    //var paramssend = {name: this.authService.getGroup()+ ' ('+ this.newKnowledgeLang.code +')'};
    var paramssend = {name: this.authService.getGroup()+ ' ('+ this.newKnowledgeLang.code +')',qnaList:[],urls:[],files:[]}

    this.subscription.add( this.http.post(URLQna+'create',paramssend)
      .subscribe( (res : any) => {
        this.actualKnowledge = this.newKnowledgeLang;
        this.comprobarEstado(res.operationId, 'addKnowledgesLang');
       }, (err) => {
         console.log(err);
         this.loadingFaqs = false;
       }));
  }

  comprobarEstado(operationId, operationType){
    this.pendingOperation = true;
    this.subscription.add( this.http.get(URLQnaForKnowledgeBasesOperationOperations+operationId)
      .subscribe( (res2 : any) => {
        if(res2.operationState == "Succeeded"){
          this.actualKnowledge = this.newKnowledgeLang;
          var resourceLocation= res2.resourceLocation;
          var respuesta = resourceLocation.split("knowledgebases/");
          this.actualKnowledge.knowledgeBaseID = respuesta[1];//kbId

          if(operationType == 'addKnowledgesLang'){
            this.createKnowledgeBase(this.newKnowledgeLang.code,  respuesta[1]);//kbId
          }
          if(operationType == 'deleteQuestion' || operationType == 'updateQuestion'){
            this.publishKnowledgebase();
          }

        }else{
          this.wait(5000);
          this.comprobarEstado(operationId, operationType);
        }

       }, (err) => {
         console.log(err);
         this.loadingFaqs = false;
       }));
  }

  wait(ms){
     var start = new Date().getTime();
     var end = start;
     while(end < start + ms) {
       end = new Date().getTime();
    }
  }

  createKnowledgeBase(lang, knowledgeBaseID){
    var paramssend = {lang: lang, group: this.authService.getGroup(), knowledgeBaseID};
    this.subscription.add( this.http.post(environment.api+'/api/admin/qna/'+this.authService.getIdUser(),paramssend)
      .subscribe( (res : any) => {
        this.loadingFaqs = false;
        this.loadAvailablesQnas();
       }, (err) => {
         console.log(err);
         this.loadingFaqs = false;
       }));
  }

  deleteKnowledge(){
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        text: this.translate.instant("faqs.Frequently asked questions will be eliminated")+': '+this.actualKnowledge.name,
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
        this.confirmDeleteKnowledge();
      }

    }).catch(swal.noop);

  }

  confirmDeleteKnowledge(){
    this.subscription.add( this.http.delete(URLQna+this.actualKnowledge.knowledgeBaseID)
      .subscribe( (res : any) => {
        //eliminar de la base de datos
        var paramssend = this.authService.getIdUser()+'-knowledgeBaseID-'+this.actualKnowledge.knowledgeBaseID;
        this.subscription.add( this.http.delete(environment.api+'/api/admin/qna/'+paramssend)
          .subscribe( (res : any) => {
            this.actualKnowledge = [];
            this.loadAvailablesQnas();
           }, (err) => {
             console.log(err);
           }));

       }, (err) => {
         console.log(err);
       }));
  }


  newQuestion() {
    //this.datadest.push({questions :[], answer:''});
    this.showPanelNewQnAPairs = true;
    this.actualQna = {id: 0, questions: [], answer: "",metadata:[]};
    this.actualQna.questions.push({q:'', id:Math.random()});
    //this.numberOfQuestion=0;

  }

  addQuestion() {
    this.actualQna.questions.push({q:'', id:Math.random()});
  }

  addQuestionWithText(text){
    var index = 0;
    this.actualQna.questions[index] = ({q:text, id:index});
  }

  deleteAltQuestion(question, index){
    this.actualQna.questions = this.actualQna.questions.filter(function(item) {
        return question.id !== item.id
    })
  }


  cancelNewQnaPair(){
    var copyQuestions = [];
    for (var i = 0; i < this.actualQna.questions.length; i++) {
      var temp = this.actualQna.questions[i].q;
      copyQuestions.push(temp);
    }
    this.actualQna.questions= copyQuestions;
    this.showPanelNewQnAPairs = false;
  }

  updateQuestion(id,index){
    this.selectedItems=[];
    this.showPanelNewQnAPairs = true;
    this.actualQna = this.datadest[index];
    this.selectedItems=[];
    for (var i=0;i<this.actualQna.metadata.length;i++){
      if(this.actualQna.metadata[i].name.toLowerCase()=="category"){
        this.selectedItems.push(this.actualQna.metadata[i].value)
      }
    }
    this.actualQnaCopy = JSON.parse(JSON.stringify(this.actualQna));
    var copyQuestions = [];
    for (var i = 0; i < this.actualQna.questions.length; i++) {
      var temp = this.actualQna.questions[i];
      copyQuestions.push({q:temp, id:Math.random()});
    }
    this.actualQna.questions= copyQuestions;
  }

  submitInvalidForm() {
    if (!this.NewQnaPairForm) { return; }
    const base = this.NewQnaPairForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmitNewQnaPair(){
    //guardar las categorias asociadas a esa faq en qna
    this.savingQnAPair = true;
    var paramssend;
    if(this.actualQna.id != 0){
      //updateQuestion
      var copyQuestions = [];
      for (var i = 0; i < this.actualQna.questions.length; i++) {
        var temp = this.actualQna.questions[i].q;
        copyQuestions.push(temp);

      }
      this.actualQna.questions= copyQuestions;
      for (var j = 0; j < this.actualQna.questions.length; j++) {
        var enc = false;
        for (var k = 0; k < this.actualQnaCopy.questions.length && !enc; k++) {
          if(this.actualQnaCopy.questions[k] == this.actualQna.questions[j]){
            this.actualQnaCopy.questions.splice(k, 1);
            enc = true;
          }
        }
      }
      var metadataString="";
      for( var k=0;k<this.selectedItems.length;k++){
        metadataString=metadataString+this.selectedItems[k]+" ";
        //metadata.push({name:"category",value:this.selectedItems[k]});
      }
      if(metadataString!=""){
        this.actualQna.metadata=[{name:"category",value:metadataString}];
      }else{
        this.actualQna.metadata=[]
      }

      if(this.actualQna.questions != this.actualQnaCopy.questions && this.actualQnaCopy.questions != []){
        if(metadataString!=""){
          paramssend = {update: {qnaList:[{id:this.actualQna.id,answer: this.actualQna.answer,questions :{add: this.actualQna.questions,delete: this.actualQnaCopy.questions},metadata:{add:[{name:"category",value:metadataString}]}}]}};
        }else{
          paramssend = {update: {qnaList:[{id:this.actualQna.id,answer: this.actualQna.answer,questions :{add: this.actualQna.questions,delete: this.actualQnaCopy.questions,metadata:{add:[{name:"category",value:''}]}}}]}};
        }

      }else{
        if(metadataString!=""){
          paramssend = {update: {qnaList:[{id:this.actualQna.id, answer: this.actualQna.answer, questions :{add: this.actualQna.questions},metadata:{add:[{name:"category",value:metadataString}]}}]}};
        }else{
          paramssend = {update: {qnaList:[{id:this.actualQna.id, answer: this.actualQna.answer, questions :{add: this.actualQna.questions},metadata:{add:[{name:"category",value:''}]}}]}};
        }

      }

      //paramssend = {update: {qnaList:{add:[this.actualQna], delete:this.actualQnaCopy.questions}}};
    }else{
      //new
      var copyQuestions = [];
      for (var i = 0; i < this.actualQna.questions.length; i++) {
        var temp = this.actualQna.questions[i].q;
        copyQuestions.push(temp);
      }
      this.actualQna.questions= copyQuestions;

      var metadataString="";
      for( var k=0;k<this.selectedItems.length;k++){
        metadataString=metadataString+this.selectedItems[k]+" ";
        //metadata.push({name:"category",value:this.selectedItems[k]});
      }
      if(metadataString!=""){
        this.actualQna.metadata=[{name:"category",value:metadataString}];
      }else{
        this.actualQna.metadata=[]
      }
      paramssend = {add: {qnaList:[this.actualQna]}};
    }

    this.subscription.add( this.http.patch(URLQna+this.actualKnowledge.knowledgeBaseID,paramssend)
      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });

        this.savingQnAPair = false;
        this.showPanelNewQnAPairs = false;
        this.waiting = false;
        if(this.actualQna.id != 0){
          var enc = false;
          for( var jiji=0;jiji<this.datadest.length && !enc;jiji++){
            if(this.datadest[jiji].id == this.actualQna.id){
              this.datadest[jiji] = this.actualQna;
              enc = true;
            }
          }
        }else{
          var lastId= this.datadest[this.datadest.length-1].id
          this.actualQna.id = lastId+1;
          this.datadest.push(this.actualQna);
        }

        //this.comprobarEstado(res.operationId, 'updateQuestion');

        this.selectedItems=[];
        this.categoriesNewAdded=[];
        this.modelTemp='';


       }, (err) => {
         console.log(err);
         this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
       }));

  }


  publishKnowledgebase(){
    this.waiting = true;
    this.pendingOperation = true;
    this.subscription.add( this.http.post(URLQna+this.actualKnowledge.knowledgeBaseID,'')
      .subscribe( (res : any) => {

        this.pendingOperation = false;
        //this.loadAvailablesQnas();
        this.wait(5000);
        this.waiting = false;
        this.onChangeLang2(this.actualKnowledge);

        this.pendingOperation = false;

       }, (err) => {
         console.log(err);
         this.wait(5000);
         this.publishKnowledgebase();
       }));
  }

  deleteQuestion(id,index) {

      swal({
          title: this.translate.instant("generics.Are you sure?"),
          text: this.translate.instant("lang.The question will be deleted"),
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
          this.preDeleteQuestion(id, index);
        }

      }).catch(swal.noop);

    }

    preDeleteQuestion(id, index){
      this.waiting = true;
      var paramssend = {add:{}, delete: {ids:[id]}};
      this.subscription.add( this.http.patch(URLQna+this.actualKnowledge.knowledgeBaseID,paramssend)
        .subscribe( (res : any) => {
          //this.loadAvailablesQnas();
          var datadetcopy = [];
          delete this.datadest[index];
          for (var i = 0; i < this.datadest.length; i++) {
            if(this.datadest[i]!=undefined){
              datadetcopy.push(this.datadest[i]);
            }

          }
          this.datadest = datadetcopy;
          this.waiting = false;

          //this.comprobarEstado(res.operationId, 'deleteQuestion');

         }, (err) => {
           console.log(err);
         }));
    }
    // Manage Categories:
    confirmDeleteItem(item){
      var categoryCreatednew=false;
      for(var i =0;i<this.categoriesNewAdded.length;i++){
        if(item==this.categoriesNewAdded[i]){
          categoryCreatednew=true;
        }
      }
      if(categoryCreatednew==true){
        swal({
          title: this.translate.instant("generics.Are you sure?"),
          text: this.translate.instant("faqs.The category had just been created and will be removed")+': '+item,
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
            this.deleteItemAndCategory(item);
          }else{
            this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
          }

        }).catch(swal.noop);
      }
      else{
        this.deleteItem(item);
      }


    }
    deleteItem(item) {
      this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
      //this.inputEl.nativeElement.focus();
    }
    deleteItemAndCategory(item) {
      var params=this.authService.getGroup()+"-code-"+this.actualKnowledge.code+"-code-"+item;
      this.subscription.add( this.http.delete(environment.api+'/api/admin/qna/deleteCategory/'+params)
      .subscribe( (res : any) => {
        if(res){
          //cargar las categorias otra vez
          //this.loadLabs();
          //var paramssend2 = this.authService.getGroup()+"-code-"+this.actualKnowledge.code;
          this.subscription.add(this.http.get(environment.api+'/api/admin/qna/getCategories/'+this.actualKnowledge.knowledgeBaseID)
          .subscribe( (res : any) => {
            this.selectedItems=[];
            //this.categoriesNewAdded=[];
            this.categoriesInfo=res.categories;
            this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
            this.categoriesNewAdded.splice(this.categoriesNewAdded.indexOf(item), 1);
            //this.onChangeLang2(this.actualKnowledge);
          }, (err) => {
            console.log(err);
          }));
        }
        this.loadingFaqs = false;
       }, (err) => {
         console.log(err);
         this.loadingFaqs = false;
       }));

    }
    selected($e) {
      $e.preventDefault();
      this.selectedItems.push($e.item);
      this.modelTemp = '';
      //this.inputEl.nativeElement.value = '';
    }
    addCategory(categoryName){
      this.loadingFaqs=true;

      // Añadir la categoria a la lista de categorias de la coleccion de faqs de Azure
      var params=this.authService.getGroup()+"-code-"+this.actualKnowledge.code;
      this.subscription.add( this.http.post(environment.api+'/api/admin/qna/setCategories/'+params, {category:categoryName})
      .subscribe( (res : any) => {
        if(res){
          this.selectedItems.push(categoryName);
          this.modelTemp = '';
          this.categoriesNewAdded.push(categoryName)
          //cargar las categorias otra vez
          //this.loadLabs();
          //var paramssend2 = this.authService.getGroup()+"-code-"+this.actualKnowledge.code;
          this.subscription.add(this.http.get(environment.api+'/api/admin/qna/getCategories/'+this.actualKnowledge.knowledgeBaseID)
          .subscribe( (res : any) => {
            //this.selectedItems=[];
            //this.categoriesNewAdded=[];
            this.categoriesInfo=res.categories;
          }, (err) => {
            console.log(err);
          }));
        }
        this.loadingFaqs = false;
       }, (err) => {
         console.log(err);
         this.loadingFaqs = false;
       }));
    }

    updateQuestionsLangs(info, op){
      //enviar el array de cambios
      if(this.authGuard.testtoken()){
        this.waiting = true;
        //cargar los datos del usuario
        var finalparam = '{ "langs" : ' +info+'}';
        this.subscription.add( this.http.put(environment.api+'/api/admin/faqs/'+this.authService.getIdUser(), info)
        .subscribe( (res : any) => {
          //resturrar el idioma que tenía
          //this.onChangeLang2(this.lang2);
          if(op=='delete'){
            this.toastr.success('',  this.translate.instant("lang.Question deleted successfully"), { showCloseButton: true });
          }else if(op=='add'){
            this.toastr.success('', this.translate.instant("lang.Question added correctly"), { showCloseButton: true });
          }
          this.waiting = false;
         }, (err) => {
           console.log(err);
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else if(err.error.message=="without permission"){
             swal(this.translate.instant("generics.Warning"), this.translate.instant("generics.notpermission"), "error");
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.waiting = false;
         }));
       }
    }

    deleteCategory(index){
      swal({
          title: this.translate.instant("generics.Are you sure?"),
          text: this.translate.instant("faqs.The following category will be eliminated")+': '+this.categoriesInfo[index],
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
          this.confirmDeleteCategory(this.categoriesInfo[index]);
        }

      }).catch(swal.noop);
    }

    confirmDeleteCategory(category){
      this.deleteItemAndCategory(category);
    }

    showPanelCategories(panelShowCategories){
      this.modalReference = this.modalService.open(panelShowCategories);
    }

}
