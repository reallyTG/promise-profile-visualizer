import React from 'react';
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