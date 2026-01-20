type ProjectData = {
  title:string,
  date:string,
  tags:string[],
  role:number,
  tech:number,
  provider: number,
  image:{
    url:string,
    alt:string
  },
  description:string,
  siteurl:string
}

type roles = {
  [key:number] : {
    name:string
  }
}

type techs = {
  [key:number] : {
    name:string
  }
}

type projectprovider = {
  [key:number] : {
    name:string
  }
}
