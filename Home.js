import {Link} from 'react-router-dom'; 

export default function Home() {
    return (
        /*the header and app styling are based on the div they are contained in make sure to double check whats where*/
       /* <Link to ="/hard"><button className="hard">Hard</button></Link>*/
            <div className="App">
                <div className="tabs">
              <Link to="/home"><button className="home">Home</button></Link>
              <Link to ="/hard"><button className="hard">Mixer</button></Link>

            </div>
        
              <header className="App-header">
              
                <center><img src="ImagesToUse/Digital_DJ_Logo.jpg" alt="Digital DJ Logo!!" /></center>
                
                <p>
             Welcome to the Digital DJ app! 
                </p>
              <p><Mode/></p>
             
              </header>
            </div>
            
         
          );}
         
        function Mode() {
          return (
            <div className="mode">
           <p> ABOUT US</p>
           <p> Section about what buttons do</p>
            </div>
          );
        }
          
        
       