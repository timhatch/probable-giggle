# Media client for Perseus App

Minimal media client to output a CSV file for use in video overlays

Variations: none

## Init 

~~~
npm install
~~~

## Run

Edit the params.js file to define 
- the IP address of the results server (default is 127.0.0.1 which will almost certainly require changing)
- the location of the output file
- the competition, group and route parameters to be included

- run options are "ifsc" for standard format results and "cwif" for cwif qualification results
~~~
npm run ifsc    
npm run cwif
~~~
