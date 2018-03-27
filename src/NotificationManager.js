import React, { Component } from 'react';
import { toast ,ToastContainer} from 'react-toastify';
import { css } from 'glamor';
import Transition from 'react-transition-group/Transition';
const ZoomInAndOut = ({ children, position, ...props }) => (
    <Transition
      {...props}
      timeout={350}
      onEnter={ node => node.classList.add('zoomIn', 'animate')}
      onExit={node => {
        node.classList.remove('zoomIn', 'animate');
        node.classList.add('zoomOut', 'animate');
      }}
    >
      {children}
    </Transition>
  );
// const CloseButton = ({ background, closeToast }) => (
//     <i
//       className={css({backgrount:background})}
//       onClick={closeToast}
//     >
//     delete
//     </i>
//   );

class NotificationManager extends Component {

    constructor(props){
        super(props);
        this.state = {
            message : this.props.message,
            time : this.props.time
        }
    }

componentDidMount = () => {
    
    this.renderToast();
    
};

componentDidUpdate = () => {
    
    this.renderToast();
    
};

renderToast = ()=>{
  toast(this.props.message, {
    
    className: css({
        background: "white",
        color:this.props.text,
        transition: ZoomInAndOut,
        border : `solid 1px ${this.props.headerColor}`,
        borderTop: `solid 3px ${this.props.themeColor}`,
        borderRadius:"4px",
        fontSize:"12px",
        opacity:"0.7"
    })
  });
};


  render(){
    return <div><ToastContainer className="notification-popup" transition={ZoomInAndOut} closeButton={false} autoClose={this.state.time} hideProgressBar={true}/></div>;
  }
}

export default NotificationManager ;