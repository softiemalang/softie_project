#include <locale.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"
static const int ids[] = {1,2,4,5,6,7,8,9,10,301};
static const char *names[] = {"MERCURY BARYCENTER","VENUS BARYCENTER","MARS BARYCENTER","JUPITER BARYCENTER","SATURN BARYCENTER","URANUS BARYCENTER","NEPTUNE BARYCENTER","PLUTO BARYCENTER","SUN","MOON"};
static const char *types[] = {"barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","body","body"};
static void fail(const char *m) { fprintf(stderr,"%s\n",m); kclear_c(); exit(1); }
int main(int argc,char **argv) {
 setlocale(LC_NUMERIC,"C"); erract_c("SET",6,"RETURN");
 if(argc<2){fprintf(stderr,"mode required\n");return 2;}
 if(!strcmp(argv[1],"--version")){puts("{\"runnerVersion\":\"de405-canonical-v2-runner\",\"cspiceToolkitVersion\":\"N0067\",\"testOnly\":false}");return 0;}
 const char *spk=NULL,*out=NULL,*start=NULL; int count=7342; double step=864000;
 for(int i=2;i+1<argc;i++){if(!strcmp(argv[i],"--spk"))spk=argv[++i];else if(!strcmp(argv[i],"--output"))out=argv[++i];else if(!strcmp(argv[i],"--start-et"))start=argv[++i];else if(!strcmp(argv[i],"--count"))count=atoi(argv[++i]);else if(!strcmp(argv[i],"--step-seconds"))step=atof(argv[++i]);}
 if(!spk)fail("missing SPK argument");
 furnsh_c(spk); if(failed_c())fail("SPK load failed");
 if(!strcmp(argv[1],"--coverage")) {
  SPICEINT_CELL(objects,100); SPICEDOUBLE_CELL(cover,100);
  spkobj_c(spk,&objects); if(failed_c())fail("spkobj_c failed");
  double commonStart=-1.0e300,commonEnd=1.0e300;
  for(int j=0;j<10;j++) {
   int found=0; for(int i=0;i<objects.card;i++){SpiceInt object; SPICE_CELL_GET_I(&objects,i,&object); if(object==ids[j])found=1;}
   if(!found)fail("canonical target absent from SPK");
   scard_c(0,&cover); spkcov_c(spk,ids[j],&cover); if(failed_c()||cover.card==0)fail("spkcov_c failed");
   for(int i=0;i<wncard_c(&cover);i++){SpiceDouble left,right; wnfetd_c(&cover,i,&left,&right); if(left>commonStart)commonStart=left; if(right<commonEnd)commonEnd=right;}
  }
  printf("{\"coverageStartEt\":\"%.16e\",\"coverageEndEt\":\"%.16e\",\"objectCount\":%d,\"coverageTool\":\"spkobj_c+spkcov_c\",\"coverageToolVersion\":\"N0067\"}\n",commonStart,commonEnd,objects.card);
  kclear_c(); return 0;
 }
 if(strcmp(argv[1],"--generate-overlap-smoke")||!out||!start)fail("only CSPICE overlap smoke generation is supported");
 if(count<1)fail("CSPICE overlap smoke requires count >= 1");
 FILE *f=fopen(out,"wb"); if(!f)fail("output open failed"); double s=atof(start);
 for(int i=0;i<count;i++){double et=s+i*step; for(int j=0;j<10;j++){double st[6],lt; spkez_c(ids[j],et,"J2000","NONE",399,st,&lt); if(failed_c())fail("spkez_c failed"); fprintf(f,"{\"schemaVersion\":\"de405-canonical-v2\",\"etSeconds\":\"%.16e\",\"targetId\":%d,\"target\":\"%s\",\"targetType\":\"%s\",\"observerId\":399,\"observer\":\"EARTH\",\"frame\":\"J2000\",\"aberrationCorrection\":\"NONE\",\"positionKm\":{\"x\":\"%.16e\",\"y\":\"%.16e\",\"z\":\"%.16e\"},\"velocityKmPerSecond\":{\"x\":\"%.16e\",\"y\":\"%.16e\",\"z\":\"%.16e\"}}\n",et,ids[j],names[j],types[j],st[0],st[1],st[2],st[3],st[4],st[5]);}}
 fclose(f); kclear_c(); return 0;
}
