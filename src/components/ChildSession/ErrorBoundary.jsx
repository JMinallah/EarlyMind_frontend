import React from 'react';import React from 'react';



class ErrorBoundary extends React.Component {class ErrorBoundary extends React.Component {

  constructor(props) {  constructor(props) {

    super(props);    super(props);

    this.state = { hasError: false, error: null };    this.state = { hasError: false, error: null };

  }  }



  static getDerivedStateFromError(error) {  static getDerivedStateFromError(error) {

    return { hasError: true, error };    return { hasError: true, error };

  }  }



  componentDidCatch(error, errorInfo) {  componentDidCatch(error, errorInfo) {

    console.error('SpeechCapture Error:', error, errorInfo);    console.error('SpeechCapture Error:', error, errorInfo);

  }  }



  render() {  render() {

    if (this.state.hasError) {    if (this.state.hasError) {

      return (      return (

        <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg shadow-lg">        <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg shadow-lg">

          <h2 className="text-2xl font-bold text-red-800 mb-4 text-center">          <h2 className="text-2xl font-bold text-red-800 mb-4 text-center">

            ⚠️ Speech Component Error            ⚠️ Speech Component Error

          </h2>          </h2>

          <div className="space-y-4">          <div className="space-y-4">

            <p className="text-red-700 text-center">            <p className="text-red-700 text-center">

              Something went wrong with the speech recognition component.              Something went wrong with the speech recognition component.

            </p>            </p>

            <button            <button

              onClick={() => {              onClick={() => {

                this.setState({ hasError: false, error: null });                this.setState({ hasError: false, error: null });

                window.location.reload();                window.location.reload();

              }}              }}

              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"

            >            >

              🔄 Reload Page              🔄 Reload Page

            </button>            </button>

            {this.state.error && (            {this.state.error && (

              <details className="mt-4">              <details className="mt-4">

                <summary className="cursor-pointer text-red-600 font-medium">                <summary className="cursor-pointer text-red-600 font-medium">

                  Technical Details                  Technical Details

                </summary>                </summary>

                <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">                <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">

                  {this.state.error.toString()}                  {this.state.error.toString()}

                </pre>                </pre>

              </details>              </details>

            )}            )}

          </div>          </div>

        </div>        </div>

      );      );

    }    }



    return this.props.children;    return this.props.children;

  }  }

}}



export default ErrorBoundary;export default ErrorBoundary;