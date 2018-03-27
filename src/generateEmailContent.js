let generateEmailContent =  (fields)=>{
    
    
    
    console.log('array ', fields );
    let html = "";

    for(let i in fields) {

        html += "<p>" + fields[i].label + " " + fields[i].value + "</p>";

    }

    console.log('html ', html );
    return html

    
}

export default generateEmailContent ;