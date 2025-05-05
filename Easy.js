import React from 'react';
import {Link} from 'react-router-dom'; 
/*Make a button to open an advanced setting section below the easy mode stuff*/

export default function Easy()
{
const [category, setCategory] = React.useState('');
const handleCategoryChange = (category) => {
setCategory(category);
console.log(category);}
  
  
  return(
   /*the header and app styling are based on the div they are contained in make sure to double check whats where*/
      /* <Link to ="/hard"><button className="hard">Hard</button></Link>*/
   <div className="App">
                 <div className="tabs">
               <Link to="/home"><button className="home">Home</button></Link>
               <Link to ="/easy"><button className="easy">Easy</button></Link>
              
             </div>
             
                <h1>Easy Mode</h1>
                  
              <Upload/>
              <Youtube/>


              <select name="category" value={category} onChange={event => handleCategoryChange(event.target.value)}>
              <option id="0" >Vocals/accompaniment</option>
              <option id="1" >Vocals/Drums/bass/other</option>
              <option id="2" >Vocals/Drums/bass/piano/other</option>
              </select>

             

              </div>
             


)
}
function Upload() {
  return (
    <button className="upload">
      Upload Files 
    </button>
    
  );
}


function Youtube() {
  return (
    <button className="Youtube">
      Youtube URL
    </button>
    
  );
}
