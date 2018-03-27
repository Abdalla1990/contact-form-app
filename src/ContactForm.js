import React, { Component } from 'react';
import {SpotfulAppCommunicationApi} from './spotful-app-communication-api.min.js';
import './css/styles.scss';
import lodash from 'lodash';
import generateEmailContent from './generateEmailContent';
import sendEmail from './sendEmail';
import {shadeColor,blendColor,isLight} from './themeColorManager';
import NotificationManager from './NotificationManager';
class ContactForm extends Component {

    constructor(props){

        super(props);
        this.state={
            payloadFields : [], // has all the payload fields (updated on every update ) is called for gathering labels and values 
            jsx:[], // contains all the jsx fields generated 
            email:undefined, // contains the receipent email 
            fieldsValues : {}, // an object of fieldId and its value 
            themeColor : "#000000",//the default theme color of the form
            message : undefined, // message displayed upon form submission
            error : false , // if error occured during the atempt to send the email
            success : false, // if nothing went wrong
            requiredFields:[], // contains all the required fields for form validation purposes
            thankYouMessage : "Thank you for contacting us,your email has been received.", // the default thank you message upone form submission
            buttonText : "send", // the default value of the submit button
            labelsAndValues:[] // where all the labels and values are gatherd 
        }
        
    }

    // JSX GENERATORS ======================================

    //generates the jsx code for the input fields 
    generateTextField = (id,placeholder,label) => {
      return (
        <div className="input-group"key={id}>
          <label className="label" style={{color:this.state.labelColor}}>{label}</label>
          <input className="field"  type="text" name={id} placeholder={placeholder} onChange={this.handleChange}/>
        </div>
      )
    }
  
    //generates the jsx code for the textArea fields 
    generateTextAreaField (id,placeholder,label) {
      return (
        <div className="input-group" key={id}>
          <label className="label" style={{color:this.state.labelColor}}>{label}</label>
          <textarea className="field" name={id} placeholder={placeholder} onChange={this.handleChange}/>
        </div>
      )
    }
  
    //generates the jsx code for the richText fields 
    generateRichTextField (id,data) {
      return (
        <div className="richText" style={{color:this.state.labelColor}} key={id} dangerouslySetInnerHTML={{ __html: data }} >
            
        </div>
      )
    }
    


    // JSX GENERATORS ======================================


    // gets called on every update event 
    updateEventListner = (payload)=>{
      // console.log('payload : ',payload);
      payload.value.formFieldList &&
      this.setState(()=>({payloadFields:payload.value.formFieldList}));
      // contains all the jsx code that gets rendered dynamically
      let jsx = [] ;
      //stores all the fields created by the user and their values
      let fieldsValues = {};
      //empty notification system variables on every update happens 
      this.setState(()=>({error:false,success:false,message:undefined}));
      
      // the recipient contactEmail 
      let email = undefined ;
      payload.value.contactEmail ? email = payload.value.contactEmail : email = undefined ;
      // if email is not empty , add it to the state 
      email !== undefined && 
      this.setState(()=>({email}));

      //stores all the required fields for form validation
      let requiredFields = [];
      
      // add the themecolor to the state
      let themeColor = payload.value.themeColor ; 
      themeColor !== undefined && this.setState(()=>({ themeColor : payload.value.themeColor}));
      
      //stores the thank you message 
      let thankYouMessage = undefined;
      thankYouMessage = payload.value.thankYouMessage;
      (thankYouMessage!==undefined && thankYouMessage !== "")&&
      this.setState(()=>({thankYouMessage}));

      //stores the button text
      let buttonText = undefined;
      buttonText = payload.value.buttonText;
      buttonText !== undefined && this.setState(()=>({buttonText}));

      // fields iterator (which calls jsx generators )
      payload.value.formFieldList &&
      payload.value.formFieldList.map((field)=>{
      
        //check for the type and generate the field accordingly
        if(field.item === "textField"){
          
          jsx.push(this.generateTextField(field.id,field.data.placeholderField,field.data.labelField));
        
        }else if (field.item === "textareaField"){
         
          jsx.push(this.generateTextAreaField(field.id,field.data.placeholderField,field.data.labelField));
        
        }else if (field.item === "richTextField"){
         
          jsx.push(this.generateRichTextField(field.id,field.data));
        
        }
       
        //add required fields to the state for form validation 
        if(typeof field.data === 'object'){
          if(field.data.required === true){
            let requiredField = {label:field.data.labelField}
            requiredFields.push(requiredField)
          }
          //save the required fields to the state
          this.setState(()=>({requiredFields}));
        }
      });
      
      //save the fieldsVales to the state
      
      // add the jsx to the state 
      jsx !== undefined && 
      this.setState(()=>({jsx}));

      // call the themeColor handler
      this.handleThemeColor();
      
      // check if any new fields was added this time 
      payload.value.formFieldList !== undefined &&
      this.getFields(payload.value.formFieldList);

    }


    //gets all the fields by their Id
    //make sure to update the fields array withput overrwiting the existing values.
    getFields = (FormFields)=>{
      let newFields = {};
      FormFields.map((field,index)=>{
        //get the key of the field
        let key = Object.keys(this.state.fieldsValues).filter((k) =>{return k === field.id.toString()})
        //if the field is already added to the list ignore it 
        if(field.id.toString() === key[0]){

        }else{
          newFields[field.id]="";
        }
        
      })

      //extracting the fields from the state 
      let {fieldsValues} = this.state;
      // if the exisitng fields and the new fields array are equal ! dont do anything
      if(JSON.stringify(newFields) === JSON.stringify(fieldsValues)){

      }else{
        
        // add the newFields to the fieldsValues and then setState
        Object.assign(fieldsValues,newFields);
        // console.log('###################### after merge : ', fieldsValues)
        this.setState(()=>({fieldsValues}));
      }
      
    }

    /* ============ IMPORTANT INFO =======================
      (a promise) which gets called before form submission 
      it generates a new state variable called labelsAndValues
      that carries the actual labels and its corresponding values 
      in the state there is fieldsValues which looks like this : {23973849361230: ""} where 23973849361230 is an id of the field and "" contains the value of that field if any 
      in the payload coming from the edito there is labelField value which contines the actual label of that field : FormFields[index].data.labelField
      labelsAndValues gets the value of fieldsValues and maps it to the actual label (living in FormFields[index].data.labelField) in one array and that array is what gets sent to generateEmailContent 
    =============================================================*/
     getLabels = (FormFields)=>{
      let labels = []; // contains all the labels 
      let promise = new Promise((resolve,reject)=>{
        Object.keys(this.state.fieldsValues).map((field,index)=>{ // loop throw the fieldsValues
         
          //if the label is undefined , it means its a text block or a deleted field(in some cases),there is no need to include that in the email body
          if(FormFields[index]){
            FormFields[index].data.labelField !== undefined &&
            //add the label and value to labels 
            // ** this.state.fieldsValues[field] looks for the value in an object by its given key
            // ** FormFields[index].data.labelField  looks for the label in the payload coming from the editor by the field index in the payload
            labels.push({label :FormFields[index].data.labelField , value : this.state.fieldsValues[field]});
          }
          
        });
  
       //send the labelsAndValues to the state
        this.setState(()=>({labelsAndValues : labels}));
        
        //once everything is up , check if its containing any data , and return the promise value 
        setTimeout(()=>{
          if(this.state.labelsAndValues.length === 0){
            return reject();
          }else{
            return resolve();
          }
        },500)
        
      });

      return promise ;
     
    }
  //gets called on every render 
  componentDidMount = () =>{
    if(SpotfulAppCommunicationApi !== undefined){
        SpotfulAppCommunicationApi.ready();
       
        //call the updateEventListner function
        SpotfulAppCommunicationApi.addEventListener('update',this.updateEventListner);
        SpotfulAppCommunicationApi.addEventListener('show',(payload)=>{
          console.log('show');
          document.body.style.display = "block";
        });
        SpotfulAppCommunicationApi.addEventListener('hide',(payload)=>{
          console.log('hide');
          document.body.style.display = "none";
        });
        
    }
    
  }
 
  handleThemeColor = ()=>{
    
    let headerColor = shadeColor(this.state.themeColor,0.5);

    let labelColor = blendColor("#000000",this.state.themeColor,0.30);

    let backgroundColor = shadeColor(this.state.themeColor,0.95);

    var lightness = isLight(this.state.themeColor);
    
    let buttonTextColor = undefined ; 
    //if the themecolor is light 
    if (lightness === true) {
      //make the button text color the same as label colors (which are always dark)
      buttonTextColor = labelColor ;
      
    
    }else{
      //make the button text color the same as the background color (which is always light)
      buttonTextColor = backgroundColor ;
    
    }
    //add these variables to the state 
    this.setState(()=>({headerColor,labelColor,backgroundColor,buttonTextColor}));
  }

  //gets called on every form submittion
  handleFormSubmission = (e)=>{
   
    e.preventDefault();
    this.setState(()=>({error:false,success:false,message:undefined}));
    
    this.getLabels(this.state.payloadFields).then((res)=>{

      let template = "" ;
      // any error
      let error = undefined;
      //message of failure or success 
      let message = undefined ;
      
  
      //check for any form validtion
      let formValidated = this.validateForm();
      
      if(formValidated.valid === false){
        
        error = true ;
        message = formValidated.message ;
        this.setState(()=>({error,success:false,message:message}));
      
      }else {
        
        //send the email
        template = generateEmailContent(this.state.labelsAndValues);
        sendEmail(template,this.state.email);
        //set the state with the appropriate message to be displayed 
        this.setState(()=>({success:true,error:false,message:this.state.thankYouMessage}));
      
      }
  
    }).catch((err)=>{

    });
  
  }

  
  validateForm = ()=>{

    let valid = true ;
    let message = ""
    let theField = "";

    if(this.state.email !== undefined && this.state.email.includes('@')){
      this.state.requiredFields.map((requiredField,index)=>{
        // console.log('requiredField : ', requiredField.label);
        this.state.labelsAndValues.map((field,index) => {
          // console.log('field : ', field.label);
          if(requiredField.label === field.label){
            // console.log('################## i found it ');
            if(field.value === "" || field.value === undefined){
              // console.log('################## this field is required  ');
                valid = false;
                theField += '  '+field.label;
            }
          } 
        });
        message = `${theField} can't be empty`
      });
    }else{
      valid = false ;
      message = "invalid recipient email"
    }
      

    return {valid , message} ; 
  }
  
  //gets called on every change happen to any fields added 
  handleChange =(evt)=> {
    this.setState(()=>({initialUpdate : false}));
    //clear the notification variables
    this.setState(()=>({error:false,success:false,message:undefined}));
    // we get the evt.target.name (which is the label of the changing field)
    // and use it to target the key on our `state` object with the same name, using bracket syntax 
    const {fieldsValues} = this.state ;
      //update the state (...fieldsVaalues) is called spreading which is an ES6 syntax which copies the whole object and then look for the editted keys in it to be changed 
      //very handy in update operations
    //  console.log('change ' , evt.target.name , evt.target.value );
    // destructuring the fields from the state (ES6 syntax)
    this.setState({fieldsValues :{ ...fieldsValues , [evt.target.name]: evt.target.value   } });
    
    
  }


  render() {
     
    // console.log('state : ', this.state)
    document.body.style.backgroundColor = this.state.backgroundColor ;
    

    return (
      <div className="app" style={{borderTopColor:this.state.headerColor}}>
        <div className="app-body">
        {this.state.message && <NotificationManager ref="notification" message={this.state.message} time={8000} background={this.state.backgroundColor} text={this.state.labelColor} headerColor={this.state.headerColor} themeColor={this.state.themeColor}/>}
          <form className="form" onSubmit={this.handleFormSubmission}>
            {this.state.jsx}
            <button className="button" type="submit" style={{backgroundColor:this.state.themeColor , color : this.state.buttonTextColor}}>{this.state.buttonText}</button>
          </form>
        </div>
      </div>
    );
  }
}

export default ContactForm;
