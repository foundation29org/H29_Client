import { RouteInfo } from './sidebar.metadata';

//Sidebar menu Routes and data
export const ROUTES: RouteInfo[] = [

    {path: '/user/dashboard/dashboard1', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    {
        path: '', title: 'menu.Basic Info', icon: 'ft-user', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/basicinfo/personalinfo', title: 'menu.Personal Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/basicinfo/socialinfo', title: 'menu.Social Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    {
        path: '', title: 'menu.Clinical information', icon: 'ft-clipboard', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/clinicinfo/anthropometry', title: 'clinicalinfo.Anthropometry', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/courseofthedisease', title: 'Course Of The disease.Course Of The disease', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/medicalcare', title: 'clinicalinfo.Medical Care', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '', title: 'clinicalinfo.Medication', icon: '', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
              { path: '/user/clinicinfo/medication', title: 'clinicalinfo.Drugs', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/otherdrugs', title: 'clinicalinfo.Other Drugs or Supplements', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/vaccinations', title: 'clinicalinfo.Vaccinations', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            ] },
            { path: '/user/clinicinfo/clinicalTrials', title: 'clinicalinfo.Clinical Trials', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    { path: '/user/genotype', title: 'menu.Genotype', icon: 'icon-chemistry', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/user/faq', title: 'menu.FAQs', icon: 'ft-help-circle', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/support', title: 'support.support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

export const ROUTESDUCHENNE: RouteInfo[] = [

    {path: '/user/dashboard/dashboard1', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    {
        path: '', title: 'menu.Basic Info', icon: 'ft-user', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/basicinfo/personalinfo', title: 'menu.Personal Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/basicinfo/socialinfo', title: 'menu.Social Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    {
        path: '', title: 'menu.Clinical information', icon: 'ft-clipboard', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/clinicinfo/anthropometry', title: 'clinicalinfo.Anthropometry', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/courseofthedisease', title: 'Course Of The disease.Course Of The disease', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/medicalcare', title: 'clinicalinfo.Medical Care', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '', title: 'clinicalinfo.Medication', icon: '', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
              { path: '/user/clinicinfo/medication', title: 'clinicalinfo.Drugs', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/otherdrugs', title: 'clinicalinfo.Other Drugs or Supplements', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/vaccinations', title: 'clinicalinfo.Vaccinations', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            ] },
            { path: '/user/clinicinfo/clinicalTrials', title: 'clinicalinfo.Clinical Trials', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    { path: '/user/genotype', title: 'menu.Genotype', icon: 'icon-chemistry', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/user/faq', title: 'menu.Help & FAQs', icon: 'ft-help-circle', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/support', title: 'support.support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

export const ROUTESINTERNATIONAL: RouteInfo[] = [

    {path: '/user/dashboard/dashboard1', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    {
        path: '', title: 'menu.Basic Info', icon: 'ft-user', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/basicinfo/personalinfo', title: 'menu.Personal Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/basicinfo/socialinfo', title: 'menu.Social Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    {
        path: '', title: 'menu.Clinical information', icon: 'ft-clipboard', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/clinicinfo/anthropometry', title: 'clinicalinfo.Anthropometry', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/courseofthedisease', title: 'Course Of The disease.Course Of The disease', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/medicalcare', title: 'clinicalinfo.Medical Care', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '', title: 'clinicalinfo.Medication', icon: '', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
              { path: '/user/clinicinfo/medication', title: 'clinicalinfo.Drugs', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/otherdrugs', title: 'clinicalinfo.Other Drugs or Supplements', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/vaccinations', title: 'clinicalinfo.Vaccinations', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            ] },
            { path: '/user/clinicinfo/clinicalTrials', title: 'clinicalinfo.Clinical Trials', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    { path: '/user/genotype', title: 'menu.Genotype', icon: 'icon-chemistry', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/user/faq', title: 'menu.FAQs', icon: 'ft-help-circle', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/support', title: 'support.support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESUNDIAGNOSED: RouteInfo[] = [

    {path: '/user/dashboard/dashboard1', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    {
        path: '', title: 'menu.Basic Info', icon: 'ft-user', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/basicinfo/personalinfo', title: 'menu.Personal Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/basicinfo/socialinfo', title: 'menu.Social Info', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    {
        path: '', title: 'menu.Clinical information', icon: 'ft-clipboard', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/user/clinicinfo/anthropometry', title: 'clinicalinfo.Anthropometry', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/courseofthedisease', title: 'Course Of The disease.Course Of The disease', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '/user/clinicinfo/medicalcare', title: 'clinicalinfo.Medical Care', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            { path: '', title: 'clinicalinfo.Medication', icon: '', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
              { path: '/user/clinicinfo/medication', title: 'clinicalinfo.Drugs', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/otherdrugs', title: 'clinicalinfo.Other Drugs or Supplements', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
              { path: '/user/clinicinfo/vaccinations', title: 'clinicalinfo.Vaccinations', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
            ] },
            { path: '/user/clinicinfo/clinicalTrials', title: 'clinicalinfo.Clinical Trials', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    { path: '/user/genotype', title: 'menu.Genotype', icon: 'icon-chemistry', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/user/faq', title: 'menu.FAQs', icon: 'ft-help-circle', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/support', title: 'support.support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    //{ path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];


//Sidebar menu Routes and data
export const ROUTESDIABETES: RouteInfo[] = [

    {path: '/user/dashboard/dashboard1', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    {path: '/user/basicinfo/clinicalinfo', title: 'Información Clínica', icon: 'ft-user', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/user/faq', title: 'menu.FAQs', icon: 'ft-help-circle', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    //{ path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESADMIN: RouteInfo[] = [

    {path: '/admin/dashboard-admin', title: 'menu.Dashboard Admin', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    { path: '/admin/managefaqs/questionAskedNotAnswered', title: 'faqs.Questions Asked not Answered', icon: 'ft-help-circle', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: []},
    { path: '/admin/translations', title: 'menu.Translations', icon: 'ft-flag', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/admin/users-admin', title: 'Users', icon: 'ft-users', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/admin/statistics', title: 'menu.Stats', icon: 'ft-percent', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/admin/notifications', title: 'menu.Notifications', icon: 'ft-bell', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/admin/support', title: 'Support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESSUPERADMIN: RouteInfo[] = [

    {path: '/superadmin/dashboard-superadmin', title: 'menu.Dashboard Super Admin', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    { path: '/superadmin/groups', title: 'menu.Groups', icon: 'ft-users', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/phenotypes', title: 'menu.Phenotype', icon: 'ft-file-text', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/langs', title: 'menu.Languages', icon: 'ft-flag', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/manageproms', title: 'Proms', icon: 'ft-activity', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/translations', title: 'menu.Translations', icon: 'ft-flag', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    {
        path: '', title: 'menu.Clinical information', icon: 'ft-clipboard', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false, submenu: [
            { path: '/superadmin/manageclinicinfo/medication', title: 'clinicalinfo.Medication', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ]
    },
    { path: '/superadmin/notifications-superadmin', title: 'menu.Notifications', icon: 'ft-bell', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/support', title: 'Support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];
