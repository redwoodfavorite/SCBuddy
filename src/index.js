const React = require('react')
const ReactDOM = require('react-dom')
const App = require('./App')
const Store = require('./Store')

ReactDOM.render(
  <Store RootComponent={App} />,
  document.getElementById('react-root')
)
