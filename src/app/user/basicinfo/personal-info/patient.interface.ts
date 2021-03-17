export class Patient {
  constructor(
    public userName: string,
    public surname: string,
    public street: string,
    public postalCode: string,
    public citybirth: string,
    public provincebirth: string,
    public countrybirth: string,
    public city: string,
    public province: string,
    public country: string,
    public phone1: string,
    public phone2: string,
    public birthDate: Date,
    public gender: string,
    public siblings: Array<Sibling>,
    public parents: Array<Parent>
  ){}
}

export interface Sibling {
    gender: string;
    affected: YesNo;
}

export interface Parent {
    highEducation: string;
    profession: string;
    relationship: string;
    nameCaregiver: string;
}

export enum YesNo {
    yes = 'yes' ,
    no = 'no'
}
