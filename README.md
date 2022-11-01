<div style="margin-bottom: 1%; padding-bottom: 2%;">
	<img align="right" width="100px" src="/src/assets/img/health29-medium.png">
</div>			

H29 client
===============================================================================================================================

[![Build Status](https://f29.visualstudio.com/Health29/_apis/build/status/pro/H29%20-%20PRO%20-%20client?repoName=foundation29org%2FH29_Client&branchName=main)](https://f29.visualstudio.com/Health29/_build/latest?definitionId=95&repoName=foundation29org%2FH29_Client&branchName=main)
[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

#### 1. Overview

Health29 platform scenarios – main principles

Patient Data Platform

The goal of the platform is to store patient’s data from different conditions and serve as daily support tool for patients and families. Primary users are patients and patient organizations. Secondary users are physicians.

The data stored in Health29 are personal data, demographic data and clinical data (with special focus on phenotype and genotype). Health29 is designed with a patient focus approach, the patient is the ultimate owner of the data and has the last word regarding custody, access by third parties and access revocation.

The other main users of the platform are patient organizations. The patient organizations in Health29 are the aggregators of individual patient information and perform a custodial and advisory role on access to information. In other patient data platforms this role has been assumed by the physician but in Health29 this role can be done by patient organizations.

GDPR is a great opportunity to empower citizens. The possibility for patients to have their medical data is a new paradigm for the healthcare ecosystem. But patients need secure containers where to store that data because medical data is the data with the greatest impact on privacy. Health29 is Foundation 29's data platform that provides patients with that secure container in which to store their medical information.

Patient Data Platform is built with a set of modules to keep information of patients with a disease (*)1:

General data points module: Contains basic personal and clinical data from patients. Data will be accessed and viewed differently according to the type of user (i.e. patient/parent/caregiver, clinicians, researcher, patient manager (usually patient organizations).



Clinical data points module: Contains Patient Reported Outcome Measures (PROMs), they are data generated by patients. This data is stored a structured way and using current standards for capturing clinical data.



Phenotype information module: Assists the user to identify the symptoms of the patient and put together a clinical phenotype. Phenotyping has been done in the past using professionals reading clinical records and extracting symptoms manually or by physicians doing the physical examination and anamnesis (patient’s medical history) capturing process.



Genotype information module: NGS is the primary source of information for patient genomic data. If full NGS data is not available Health29 provide an alternative way to code patient genetic information.

You can consult the documentation on the [architecture of the H29 project](https://health29.readthedocs.io/en/latest/).

This project contains the core of the H29 platform, the webapp from where the frontend will be developed and the communications with different services to provide functionalities. In particular in this repository is the client code of the project.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.1.

The project uses [gitflow workflow](https://nvie.com/posts/a-successful-git-branching-model/).
According to this it has implemented a branch-based system to work with three different environments. Thus, there are two permanent branches in the project:
>- The develop branch to work on the development environment.
>- The master branch to work on the production environment

And for the test environment, release branches will be created.

<p>&nbsp;</p>

#### 2. Configuration: Pre-requisites

This project uses external services.

For each of the environments it will be necessary to configure the value of the secret keys to connect with the different APIs.
So, to be able to compile and execute this project you have to modify the extension of the src/environments/ files, removing ".sample" (for example, you have to modify environments.ts.sample by environments.ts) and here complete the information of the secret keys of the services.

As a minimum, it is mandatory to perform these actions on the environment.ts file (to work locally) in order to compile and run the platform. If you want to use any of the other environments, it is also essential that this file has been modified in addition to the one corresponding to the environment on which you want to work.

##### External services required

To execute the project it is necessary to implement or configure a list of external services according to what is explained in the [H29 architecture document](https://health29.readthedocs.io/en/latest/).

Thus, we will mainly need:

>- Two [Azure Blob storage](https://docs.microsoft.com/en-US/azure/storage/blobs/storage-blobs-introduction), one for settings and the other one for patient information.
>- An [Azure Health Bot](https://azure.microsoft.com/es-es/services/bot-services/health-bot/)
>- F29 apis:
>>- (api) -> TODO: URL to our opensource service


<p>&nbsp;</p>

#### 3. Download and installation

Download the repository code with `git clone` or use download button.
Run `npm install` to install the dependencies.
Angular requires a [current, active LTS, or maintenance LTS](https://nodejs.org/en/about/releases/) version of Node.js.

<p>&nbsp;</p>

#### 4. Deployment

Run `ng serve` or `ng serve -aot`. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

It is mandatory to run the [H29 server](https://github.com/foundation29org/H29_Server) before.

<p>&nbsp;</p>

#### 5. Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

##### Scripts

In the package.json file different scripts have been implemented to perform the build of these environments:
>- build for localhost
>- buildDev for development
>- buildStaging for test
>- buildProd for production
In each case the corresponding environment file is used.

Run `npm run <script>` to build the project for each environment. The build artifacts will be stored in the `dist/` directory.

<p>&nbsp;</p>

#### 6. Testing

##### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

##### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

<p>&nbsp;</p>

#### 7. Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

<p>&nbsp;</p>

#### 8. Other project links needed for deploy H29 platform

You can consult the documentation on the [architecture of the H29 project](https://health29.readthedocs.io/en/latest/).

>- [H29 server](https://github.com/foundation29org/H29_Server)
>- TODO: F29 API services github

<p>&nbsp;</p>
<p>&nbsp;</p>

<div style="border-top: 1px solid !important;
	padding-top: 1% !important;
    padding-right: 1% !important;
    padding-bottom: 0.1% !important;">
	<div align="right">
		<img width="150px" src="https://dx29.ai/assets/img/logo-foundation-twentynine-footer.png">
	</div>
	<div align="right" style="padding-top: 0.5% !important">
		<p align="right">
			Copyright © 2020
			<a style="color:#009DA0" href="https://www.foundation29.org/" target="_blank"> Foundation29</a>
		</p>
	</div>
<div>
