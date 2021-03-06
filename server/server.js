const path = require('path');
const express = require ('express');
const app = express();
const publicPath = path.join(__dirname,'..');
const demoPath = path.join(__dirname,'..','demo/index.html');
const spotfulUiPath = path.join(__dirname,'..','/vendor/spotful-ui/dist/spotful-ui.js');
const port = process.env.PORT || 3000 ;

app.use(express.static(publicPath));

app.get('/',(req,res)=>{
    console.log('redirect', res)
    res.redirect('/demo');
});

// app.use(express.static(demoPath));

app.get('/demo',(req,res)=>{

    console.log('redirect', res)
    res.sendFile(demoPath);
});


app.listen(port, ()=>{
    console.log(`app is running on ${port}`);
});