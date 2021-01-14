# Node Lifechecker (currently in development)

## Description 

A node project that allows users to sign up for checking if a website is down or up.
This API also allows users to get notified if the status of the website changes.

This project is made with node and does not use npm or any dependencies.

For this purpose the file system is used as a key-value store (database), but i will update this project to connect with a database without using any node modules 

## Usage 

```bash
$ cd lifechecker
$ node index.js
```

this will start the development http server on port 3000 and https on 3001

if used with
```bash
$ node NODE_ENV=production index.js
```
the ports will be changed to 5000 and 5001 for demonstration purposes
this behaviour can be configured by changing up 'config.js'
