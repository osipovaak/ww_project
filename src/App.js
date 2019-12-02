import React, { Component } from 'react';
import ReactDOM from "react-dom";

import "antd/dist/antd.css";
import './css/App.css';
import './css/base.css';

import { Menu, Button } from "antd";
import cookie from 'react-cookies';
import axios from "axios";

import WrappedLogin from "./components/login";
import WrappedSearchFDAForm from "./components/search";
import PastSearches from "./components/pastSearches";
import host from "./config";

//styles for components to render at top of the page
const btnStyle = {
  "marginTop": "150px"
};

const loginStyle = {
  "marginTop": "-150px"
};

const searchStyle = {
  "marginTop": "-150px"
};

const historyStyle = {
  top: "75px",
  position: "absolute",
  width: "100%"
};

//starting point of app
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      keyVisibility: { btnVisibility: true, loginVisibility: false, searchVisibility: false, histroyVisibility: false }
    };
  };

  //find out if logged in on first load
  componentDidMount() {
    this.checkForUser();
  }

  //goes throught the possible visible elements and updates 
  //stateName to the value, and the rest to !value;
  updateState = (stateName, value) => { //allows to update any key of state to a new value
    let allStates = Object.assign({}, this.state);
    for (const key in allStates.keyVisibility) {
      if (key === stateName) allStates.keyVisibility[key] = value;
      else allStates.keyVisibility[key] = !value;
    }

    this.setState(allStates);
  };

  //update user go back to home screen
  onLoggedIn = (user) => {
    this.setState({ currentUser: user });
    this.updateState("btnVisibility", true);
  };

  //check the cookies for sessionID and username
  checkForUser = () => { 
    const user = cookie.load("user");
    const session = cookie.load("sessionID");

    if (user && session) {
      this.setState({ currentUser: user });
    }
  };

  //send logout query
  //done here since has nothing to do with other components
  logout = () => {
    let session = cookie.load("sessionID"); //current session

    //try to get the data from DB. respond appropriately
    axios.get(host + '/logout', { params: { sessionID: session } })
      .then(() => { //need to set the a cookie for session id and update parent's state
        cookie.remove("sessionID");
        cookie.remove("user");
        this.onLoggedIn("");
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    return (<div>
      <Menu mode="horizontal">
        <Menu.Item key="Home" onClick={() => this.updateState("btnVisibility", true)}>
          Dangerous Dinner
        </Menu.Item>
        <Menu.Item key="OldSearched" className={this.state.currentUser ? "" : "hidden"}
          onClick={() => this.updateState("histroyVisibility", true)}>
          Check Past Searches
        </Menu.Item>
        <Menu.Item key="Login" style={{ float: 'right' }}
          onClick={() => {
            if (this.state.currentUser) { //need to logout
              this.logout();
            }
            else {
              this.updateState("loginVisibility", true);
            }
          }}>
          {this.state.currentUser ? "Logout" : "Login"}
        </Menu.Item>
        <Menu.Item key={"Hello"} style={{ float: 'right', cursor: "default"}} disabled={true}
          className={this.state.currentUser ? "" : "hidden"}>
          {"Hello " + this.state.currentUser}
        </Menu.Item>
      </Menu>
      <div className={"centeredBtn " + (this.state.keyVisibility.btnVisibility ? "visible" : "hidden")}>
        <Button type="primary" shape="round" icon="search" size={"large"}
          style={btnStyle} onClick={() => this.updateState("searchVisibility", true)}>
          Make a Search
        </Button>
      </div>
      <div className={"centered " + (this.state.keyVisibility.loginVisibility ? "visible" : "hidden")}
        style={loginStyle}>
        <WrappedLogin onLoggedIn={this.onLoggedIn} mode={this.state.currentUser ? "Logout" : "Login"} />
      </div>
      <div className={" " + (this.state.keyVisibility.searchVisibility ? "visible" : "hidden")}
        style={searchStyle}>
        <WrappedSearchFDAForm loggedIn={this.state.currentUser ? true : false} visible={this.state.keyVisibility.searchVisibility}/>
      </div>
      <div className={(this.state.keyVisibility.histroyVisibility ? "visible" : "hidden")}
        style={historyStyle}>
        <PastSearches visible={this.state.keyVisibility.histroyVisibility} />
      </div>
    </div>
    );
  };
};

export default App;

ReactDOM.render(<App />, document.getElementById("root"));
