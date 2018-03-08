import React, { Component } from 'react';
import logo from './logo.svg';
import TitleBar from './components/TitleBar'
import './App.css';
import {deepOrange500} from "material-ui/styles/colors";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";

const _muiTheme = function () {
  return getMuiTheme({
    palette: {
      accent1Color: deepOrange500,
    },
    userAgent: navigator.userAgent,
  });
}

class App extends Component {
  render() {
    return (
      <MuiThemeProvider muiTheme={_muiTheme()}>
        {TitleBar('SwissBorg Polling token')}
      </MuiThemeProvider>
    );
  }
}

export default App;
