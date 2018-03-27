import axios from 'axios';
let sendEmail =  (template,to) =>{
    
    console.log('template ',template )
    
    let payload = new FormData();
    payload.append('content', template);
    payload.append('to', to);
    payload.append('subject', "Spotful Mailing Service");

    
    axios({

        method: 'post',
        url: 'https://api-test.bespotful.com/mailer/send',
        data: payload
    })
    .then( (response)=> {
      console.log(response);
    })
    .catch( (error)=> {
      console.log('error',error);
    });
}

 export default sendEmail ;
