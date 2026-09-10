#################################################################     
Combined Earth Rotation Parameter solution consistent with the 
International Terrestrial Reference Frame (ITRF) 2020  

C04 2020 solution
Started on 2023, February 14
Last version (v4) started on 2026, February 5

Former versions in repositories <../eopc04_20_v1>  <../eopc04_20_v2>  <../eopc04_20_v3> 

See also https://hpiers.obspm.fr/iers/eop/eopc04/updateC04.txt   
#################################################################     


Combined Earth Rotation Parameter solution consistent with the International Terrestrial Reference Frame (ITRF) 2020 

Features: 

1) Contain daily values of 8 Earth Rotation parameters with their formal errors: 

- Pole coordinates x, y (")
- UT1 - UTC (ms)
- Celestial pole offsets dX, dY or dPsi, dEps (")
- Pole coordinate rates xrt, yrt ("/day)
- Lenght of day offset LOD   (ms)

2) Download from https://hpiers.obspm.fr/iers/eop/eopc04/

5 options with a new format since 2023, February 14:
 
    i) eopc04.1962-now 	                 : sampled values at  0hUT /     dX, dY IAU 2006/2000A 
   ii) eopc04.dPsi_dEps.1962-now         :                    0hUT / dPsi, dEps IAU 2006/2000A  
  iii) eopc04.12h.1984-now               :                   12hUT /     dX, dY IAU 2006/2000A  
   iv) eopc04.dPsi_dEps.12h.1984-now     :                   12hUT / dPsi, dEps IAU 2006/2000A  
    v) eopc04.dPsi_dEps.IAU1980.1962-now :                    0hUT / dPsi, dEps IAU 1980

The former format with the file "eopc04_IAU2000.62-now" is maintained (without xrt and yrt parameters) : 
	
   vi) eopc04_IAU2000.62-now             :                    0hUT /     dX, dY IAU 2000 

3) Alignement with ITRF and corresponding updates 

- From 1/1/1962 to 31/12/1984, ERP values of those of the C0414 solution consistent with ITRF 2014

- From 1/1/1994 to 31/12/2020 the 12hUT values of the pole coordinates x,y and of their rates xrt and yrt 
are taken equal to the values obtained for the ITRF 2020 solution. 

- From 1/1/2021 to 31/12/2024 x,y, xrt, yrt are taken (12h values) or interpolated (0h values) from 
the ITRF2020-u2024 solution (https://itrf.ign.fr/ftp/pub/itrf/itrf2020-u2024/ITRF2020-u2024_EOP-F1.DAT).
Update effective on February 5, 2026. Former solution was put in repository ../eopc04_20_v3. 

- From 25/2/2024, x,y, xrt, xyrt are derived by a weighted combination of 
IVS Quaterly/Rapid, IGS Final/Rapid, ILRS series 


4) Vondrak combined smoothing:  
    from 1/1/1984  for UT1 and LOD 
    from 25/2/2024 for x,y and ther rates 

5) Calibration of the formal uncertainties of the input individual ERP series according to the dispersion 
with other kindred series        

6) Removal of systematic bais / annual terms with respect to ITRF 2020 solution prolongated 
until the current year (x,y) and IVS Final (UT1, dX, dY) 
 
7) Centers contributing to the final C04 solution (stopping 30 days before the current date):

x, y       : ITRF 2020 + extension (1994-2024), IGS F (2024-from 1 to 3 months before the current date), ILRS (2024-), IDS (1994-2025), IVSR (up to the last 3 months)
UT1        : IVSF-quaterly (1984-from 1 to 3 months before the current date), IVSR (up to the last 3 months), IAA Intensive, USNO Intensive, BKG Intensive
dX, dY     : IVSF-quaterly (1984-up to 3 months before the current date), IVSR (up to the last 3 months)
xrt, yrt   : ITRF 2020 + extension (1994-2024), IGS F quaterly (2024-from 1 to 3 months before the current date), IGS R (up to the last 3 months)
LOD        : IGS F (1998-), IGS-R (up to the last 3 months)


Combined series since 2025/1/1

#============================================================================
#  TECHNIQUE : CENTER         
#============================================================================
1rd  line ; EOP selection and rescaling error : 0 for no EOP / selection for a non zero value 0 giving the factor to be applied to formal error  
2nd       : reference epoch (MJD) for the annual term : A cos(arg) + B sin(arg) with  arg = 2 pi/365.2 d  * (MJD - MJD0)	    
3rd       : x   bias  A   B     unit : micro-arc-second	  
4th       : y   bias  A   B     micro-arc-second	   
5th       : UT1 bias  A   B     micros	  
6th       : dX  bias  A   B     micro-arc-second	  
7th       : dY  bias  A   B     micro-arc-second	  
8th       : xrt bias  A   B     micro-arc-second	  
9th       : yrt bias  A   B     micro-arc-second	  
10th      : LOD bias  A   B     micros	

#============================================================================
#  VLBI : IVS-R        
#============================================================================
          x       y       UT1     dX      dY      xrt     yrt     LOD 
          3.01    1.99    2.87    1.98    1.95    0.00    0.00    1.09            
60676.0000
   -19.800  -20.6000  -19.6000
    12.800  -82.2000   -0.9000
     2.800    1.8000   -2.0000
    -1.500    8.9000   -4.4000
     3.200    4.5000  -12.5000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.100    1.1000    1.7000
#============================================================================
#  VLBI : IVS-F        
#============================================================================
          7.59    7.78   10.51    4.19    4.01    0.00    0.00    2.33
60661.2000
     0.400   -1.8000   28.0000
   -11.300  -22.4000  -34.6000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
#============================================================================
# VLBI - BKG        
#============================================================================  
          0.00    0.00    2.00    1.48    1.39    0.00    0.00    0.61
60676.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     4.100    0.5000   -0.6000
    55.600   -0.4000  -13.5000
    35.200   -8.7000  -12.8000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.100    0.4000   -1.2000
#============================================================================
# VLBI : USNO        
#============================================================================
          0.00    0.00    0.00    0.70    0.60    0.00    0.00    0.18
60676.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
    10.200   -8.2000    9.1000
   -14.600    4.5000    0.5000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     1.100   -2.6000   -1.8000
#============================================================================
# VLBI Intensive : BKG I        
#============================================================================
          0.00    0.00    4.75    0.00    0.00    0.00    0.00    0.00
60676.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
    -2.000   -8.7000    5.7000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
#============================================================================
# VLBI Intensive : IAA I        
#============================================================================
          0.00    0.00    2.03    0.00    0.00    0.00    0.00    0.00
60676.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     5.900  -18.3000    2.8000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
#============================================================================
# VLBI Intensive : IAAR I        
#============================================================================
          0.00    0.00    1.23    0.00    0.00    0.00    0.00    0.00
60676.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
   -56.800   -9.9000  -10.7000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
#============================================================================
# VLBI Intensive : USNO I        
#============================================================================
          0.00    0.00    1.86    0.00    0.00    0.00    0.00    0.00
60676.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
    14.400   -4.2000    0.5000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
#============================================================================
# GNSS : IGS-R        
#============================================================================
          2.59    2.07    0.00    0.00    0.00    2.48    2.63    3.70
60676.0000
    -1.200    8.3000   10.3000
    -1.800   -9.5000   -1.1000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
   -25.000   12.6000    8.1000
    -2.000   -0.5000   20.9000
     1.000   -2.5000    3.4000
#============================================================================
# GNSS : IGS-F        
#============================================================================
          3.56    2.76    0.00    0.00    0.00    3.04    3.02    5.29
60676.0000
   -10.900    9.1000    6.4000
    -6.700  -10.7000   -6.6000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
    -9.800   -0.7000   10.7000
    -1.700    5.9000    5.5000
     0.300   -1.9000    2.6000
#============================================================================
# SLR : ILRS        
#============================================================================
          5.19    5.38    0.00    0.00    0.00    0.00    0.00   10.03
60676.0000
    75.300   51.1000  -54.9000
    63.300  -25.3000   32.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     0.000    0.0000    0.0000
     5.300   -6.5000    1.7000
