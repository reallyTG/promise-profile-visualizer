import React from 'react';
import ReactDOM from 'react-dom';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryStack, VictoryTooltip, VictoryZoomContainer } from 'victory';
import jsonData from '../../data/the.json';

// Get the part of the data for plotting.
let dataObj = jsonData.promises;

// Constant to turn the AbsoluteHugeInt into a manageable double.
let DIV_FOR_SCALE = 100000000000000;

// Turn the JSON object into something usable.
function processJSON(theDataObj) {

  console.log(theDataObj)

  let rData = [];
  for(var i = 0; i < Object.keys(theDataObj).length; i++) {
    let o = theDataObj[i];

    // Edit the object contents.
    o["x"] = i;
    // Turn the strings into numbers.
    o["y0"] = Number(o["startTime"])/DIV_FOR_SCALE;
    o["y"] = Number(o["endTime"])/DIV_FOR_SCALE;
    o["elapsedTime"] = Number(o["elapsedTime"])/DIV_FOR_SCALE;

    // Build label for tooltip.
    o["label"] = `UID: ${i}\nelapsedTime: ${o["elapsedTime"]}\nsource: ${o["source"]}`;

    // Push modified object to an array (needed by Victory).
    rData.push(o);
  }

  return rData;
}

// Initial data array.
let data = processJSON(dataObj);

// Debug: what is the data array?
console.log(data);

// This is the component that we want to modify --- this creates the visualization.
class Main extends React.Component {

  // Constructor: to enable mutation, need externalMutations field.
  constructor() {
    super();
    this.state = {
      externalMutations: undefined,
      theData: data
    };
  }

  // For removing the mutations.
  removeMutation() {
    this.setState({
      externalMutations: undefined
    });
  }

  // For this particular example, this is to clear the effect of the clicks.
  // We will modify this.
  clearClicks() {
    this.setState({
      externalMutations: [
        {
          childName: "main-interval",
          target: ["theData"],
          eventKey: "all",
          mutation: () => ({ style: undefined }),
          callback: this.removeMutation.bind(this)
        }
      ]
    });
  }

  // For loading the file.
  onChangeHandler(event) {
    let fileReader = new FileReader();

    fileReader.onloadend = ((e) => {
      this.setState({
        // dataFile: e,
        loaded: 0,
        theData: processJSON(JSON.parse(fileReader.result).promises)
      })
    }).bind(this);

    fileReader.readAsText(event.target.files[0]);
  }

  render() {
    // Makes the reset button.
    const buttonStyle = {
      backgroundColor: "black",
      color: "white",
      padding: "10px",
      marginTop: "10px"
    };

    return (
      <div>
        {/* Reset button, style specified above. */}
        <button
          onClick={this.clearClicks.bind(this)}
          style={buttonStyle}
        >
          Reset
        </button>
        <input type="file" name="file" onChange={this.onChangeHandler.bind(this)}/>
        {/* <button
          onClick={this.redraw.bind(this)}
          style={buttonStyle}
        >
          Redraw
        </button> */}
        <h1>Promise Visualizer</h1>
        <VictoryChart
          style={{parent: {maxWidth: "70%"}}}
          domainPadding={10}
          theme={VictoryTheme.material}
          // This is the plug to mutating the chart.
          externalEventMutations={this.state.externalMutations}
          // Possible events:
          events={[
            {
              target: "data",
              childName: "main-interval",
              eventHandlers: {
                onClick: () => ({
                  target: "data",
                  mutation: () => ({ style: { fill: "orange" } })
                }),
                onMouseOver: () => {
                  return [{
                    childName: ["main-interval"],
                    mutation: (props) => {
                      return {
                        style: Object.assign({}, props.style, {fill: "tomato"})
                      };
                    }
                  }];
                },
                onMouseOut: () => {
                  return [{
                    childName: ["main-interval"],
                    mutation: () => {
                      return null;
                    }
                  }];
                }
              }
            }
          ]}
        >
        <VictoryBar horizontal name="main-interval"
            labelComponent={<VictoryTooltip
              constrainToVisibleArea />}
            data={this.state.theData}
          />
        </VictoryChart>
      </div>
    );
  }
}

// Before making the viz, load the data.
// Currently hardcoded to <package root>/data/the.json
// const promise_data = wrangleJSON("../../data/the.json");
// let r = {};

// JSON.parse(data, (k, v) => {
//   r[k] = v;
// });

// This is the last thing that should run, which actually builds the app.
const app = document.getElementById('app');
ReactDOM.render(<Main />, app);