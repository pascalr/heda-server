import React from 'react'

import { t } from "../translate"
import { ajax } from "./utils"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state so the next render will show the fallback UI.    
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    let url = window.location.pathname+(window.location.search||'')
    let data = {error: error.toString(), info: info.componentStack, url}
    ajax({url: '/log_error', type: 'POST', data, error: errors => console.error('ERROR AJAX...', errors)})
  }
  render() {
    if (this.state.hasError) {
      return <>
        <div className="trunk text-center">
          <br/><br/><br/>
          <img src="/sorry.jpg" style={{height: '50vh', margin: 'auto'}}/>
          <br/><br/><br/>
          <h1 className="h003">{t('Sorry_error')}</h1>
        </div>
      </>
    }
    return this.props.children;
  }
}
