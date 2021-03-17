import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

declare var AzureStorage: any;

export interface IBlobAccessToken {
  blobAccountUrl: string;
  sasToken: string;
  containerName: string;
  patientId: string;
}

@Injectable()
export class BlobStorageMedicalCareService {
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() changeFilesBlob: EventEmitter<any> = new EventEmitter();
  private finishedOrError = false;
  uploaded = false;
  filesOnBlob: any = [];
  blobService: any;

  init(accessToken: IBlobAccessToken){
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());
  }

  uploadToBlobStorage(accessToken: IBlobAccessToken, file: File, filename: string, index1: number, index2: number): Observable<number> {
    const progress$ = new Subject<number>();
    const speedSummary = this.uploadFile(accessToken, file, filename,index1, index2, progress$);

    this.refreshProgress(speedSummary, progress$);

    return progress$.asObservable();
  }

  createContainerIfNotExists(accessToken: IBlobAccessToken){
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());
      this.blobService.createContainerIfNotExists(accessToken.containerName, {
        publicAccessLevel: 'blob'
      }, function(error, result, response) {
        if (!error) {
          // if result = true, container was created.
          // if result = false, container already existed.
        }
      }.bind(this));
  }


  private uploadFile(accessToken: IBlobAccessToken, file: File, filename: string, index1: number, index2: number, progress$: Subject<number>): any {
    this.uploaded = false;
    const customBlockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());

    this.blobService.singleBlobPutThresholdInBytes = customBlockSize;

    return this.blobService.createBlockBlobFromBrowserFile(
      accessToken.containerName,
      filename,
      file,
      { blockSize: customBlockSize },
      this.callback(index1, index2, progress$, accessToken)
    );
  }

  private refreshProgress(speedSummary: any, progress$: Subject<number>): void {
    setTimeout(() => {
      if (!this.uploaded) {
        const progress = speedSummary.getCompletePercent();
        progress$.next(progress);
        this.refreshProgress(speedSummary, progress$);
      }
    }, 200);
  }

  private callback(index1: number, index2: number, progress$: Subject<number>, accessToken: IBlobAccessToken): (error, result, response) => void {
    return (error, result, response) => {
      this.finishedOrError = true;
      if (error) {
        progress$.error('Error uploading to blob storage: ' + JSON.stringify(accessToken));
        this.uploaded = false;
      } else {
        progress$.next(100);
        progress$.complete();
        //call to nodejs for call microsoft genomics
        this.uploaded = true;
        var params = {uploaded: this.uploaded, index1: index1, index2: index2};
        this.change.emit(params);
      }
    };
  }


  deleteBlob(containerName, blobName){


    this.blobService.deleteBlob(containerName, blobName, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) {
        // if result = true, container was created.
        // if result = false, container already existed.
      }
    }.bind(this));
  }
}
