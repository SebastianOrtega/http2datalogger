

##Los parametros permitidos en la configuración son: 

antenna
eventNum
format
idHex
peakRssi
reads
name
timestamp

Se separan con comas ejemplo: 

orden=name,antenna,idHex,timestamp


##Terminador de líneas

Es el terminador que se agrega al final de cada linea, puede ser \n o \r\n

##Prueba

Server Socket: nc -l 10000

###formato de configuración Zebra de envio de datos: 

```http://[ip del server]:[puerto]/zebra/[nombre del lector]```

```http://192.168.0.44:3000/zebra/Lector1```

![Ejemplo1](./ejemplo1.png)
![Ejemplo2](./ejemplo2.png)


