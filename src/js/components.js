import React from 'react';
import PropTypes from 'prop-types';
import { VictoryLabel, VictoryTooltip } from 'victory';
import Prism from "prismjs"

export class SourceLabel extends React.Component {
    render() {
        return (
            <g>
                <VictoryLabel {...this.props}/>
                <VictoryTooltip
                {...this.props}
                x={120} y={80}
                orientation="top"
                pointerLength={0}
                cornerRadius={5}
                flyoutWidth={100}
                flyoutHeight={100}
                flyoutStyle={{ fill: "white" }}
                />
            </g>
        );
    }
}

export class PrismCode extends React.Component {
    constructor(props) {
        super(props)
        this.ref = React.createRef()
    }
    componentDidMount() {
        this.highlight()
    }
    componentDidUpdate() {
        this.highlight()
    }
    highlight() {
        if (this.ref && this.ref.current) {
        Prism.highlightElement(this.ref.current)
        }
    }
    render() {
        const { code, plugins, language, linesToHighlight } = this.props
        return (
        <pre id="code-area" className={!plugins ? "" : plugins.join(" ")} data-line={linesToHighlight}>
            <code ref={this.ref} className={`language-${language}`}>
            {code.trim()}
            </code>
        </pre>
        )
    }
}

export class PromiseIntervalLabel extends React.Component {

    constructor(props) {
        super(props);
    }
  
    getIntroOfPromise(payload) {
        // Is it always payload[0]?
        return `Promise source: ${payload[0]["payload"]["source"]}`;
    }
  
    render() {
      const { active } = this.props;
  
      if (active) {
        const { payload, label } = this.props;
        return (
          <div className="promise-int-tooltip">
            <p className="label">{`Promise ID: ${label}`}</p>
            <p className="intro">{this.getIntroOfPromise(payload)}</p>
          </div>
        );
      }
  
      return null;
    }
  }

  PromiseIntervalLabel.propTypes = {
    type: PropTypes.string,
    payload: PropTypes.array,
    label: PropTypes.number,
  }

  