import React from 'react';
import ReactDOM from 'react-dom';
import { VictoryBar, VictoryLabel, VictoryChart, VictoryTheme, VictoryTooltip, VictoryVoronoiTooltip, VictoryZoomContainer } from 'victory';
import jsonData from '../../data/the.json';

// For the code region:
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

// Get the part of the data for plotting.
let dataObj = jsonData.promises;

let sourceFiles = {};

// Constant to turn the AbsoluteHugeInt into a manageable double.
let DIV_FOR_SCALE = 100000000000000;

function isInvalidPromiseDatum(o) {
  return  undefined == o["startTime"] ||
          undefined == o["endTime"] ||
          undefined == o["elapsedTime"] ||
          undefined == o["source"];
}

// Turn the JSON object into something usable.
function processJSON(theDataObj) {

  // console.log(theDataObj)

  let rData = [];
  // for(var i = 0; i < Object.keys(theDataObj).length; i++) {
  for (var i in Object.keys(theDataObj)) {
    console.log(`i: ${i}`);
    let o = theDataObj[i];

    if (o == undefined)
      continue;

    // console.log("theDataObj[" + i + "]: ");
    // console.log(o);

    // Check for undefined properties.
    if (isInvalidPromiseDatum(o))
      continue;

    // Edit the object contents.
    o["x"] = Number(i);
    // Turn the strings into numbers.
    o["y0"] = Number(o["startTime"])/DIV_FOR_SCALE;
    o["y"] = Number(o["endTime"])/DIV_FOR_SCALE;
    o["elapsedTime"] = Number(o["elapsedTime"])/DIV_FOR_SCALE;

    // Build label for tooltip.
    o["label"] = `UID: ${i}\nelapsedTime: ${o["elapsedTime"]}\nsource: ${o["source"]}`;

    // Push modified object to an array (needed by Victory).
    console.log("Modified o:");
    console.log(o);
    rData.push(o);
  }

  return rData;
}

function getSourceForLocation(loc) {
  let source = "";

  // Parse loc to get the a) file name, and b) location of the relevant bit.
  // Example: (sequential.js:5:9:5:23)
  // Split on 1st ":".
  let pos = loc.indexOf(":");
  // Slicing from 1 b/c we want to get rid of opening "(".
  let fileName = loc.slice(1, pos);
  // Slicing up to len - 1 b/c we want to get rid of closing ")".
  let indexInFile = loc.slice(pos+1, loc.length - 1);

  // There are three more indices in the name.
  let r1, r2, c1, c2;
  let i = 0;
  for (; i < 3; i ++) {
    pos = indexInFile.indexOf(":");
    if (i == 0) {
      r1 = Number(indexInFile.slice(0, pos));
      indexInFile = indexInFile.slice(pos+1, indexInFile.length);
    } else if (i == 1) {
      c1 = Number(indexInFile.slice(0, pos));
      indexInFile = indexInFile.slice(pos+1, indexInFile.length);
    } else {
      r2 = Number(indexInFile.slice(0, pos));
      c2 = Number(indexInFile.slice(pos+1, indexInFile.length));
    }
  }

  r1 -= 1;
  r2 -= 1;

  // Find row, then column:
  let theSource = sourceFiles[fileName];
  // let parsingString = false;
  let theChar = "";
  let rowsToGo = r1;
  for (i = 0; i < theSource.length; i++) {
    theChar = theSource[i];

    if (rowsToGo == 0) {
      // We found the start row.
      // Find start column.
      i += c1;
      break;
    }

    if (theChar == "\n") {
      rowsToGo--;
    }
  }

  rowsToGo = r2 - r1;
  let start = i;
  let j = i;

  if (r1 == r2) {
    j = start + c2 - c1;
  } else {
    for (; j < theSource.length; j++) {
      theChar = theSource[j];
  
      if (rowsToGo == 0) {
          j += c2;
          break;
      }
  
      if (theChar == "\n") {
        rowsToGo--;
      }
    }
  }

  // This is the source that we want to highlight.
  let sourceToHighlight = theSource.slice(start - 1, j);

  // For now: Construct a new source with some shit around the promise.
  // let retSource = theSource.slice(0, start - 1) + " ### " + sourceToHighlight + " ### " + theSource.slice(j, theSource.length);
  // Actually, we should be able to play with the pre.

  return theSource;
}

// Initial data array.
let data = processJSON(dataObj);

console.log(dataObj);
console.log(data);

// Debug: what is the data array?
// console.log(data);

{/* <VictoryLabel
      name="source-label"
      textAnchor="left" verticalAnchor="left"
      x={60} y={20}
      style={{fontSize: 30}}
      text="Hello World!"
    /> */ }

class SourceLabel extends React.Component {
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

// class SourceArea extends React.Component {

//   constructor() {
//     super();
//     this.state = {
//       externalMutations: undefined,
//       sourceToDisplay: "Your source will be here."
//     }
//   }

//   displaySource(sourceSection) {
//     this.setState({
//       mutation: () => ({ sourceToDisplay: getSourceForLocation(sourceSection) })
//     })
//   }

//   render() {
//     return (
//       <g>
//         <VictoryLabel {...this.props}
//           text = { this.state.sourceToDisplay }
//         />
//       </g>
//     )
//   }
// }

SourceLabel.defaultEvents = VictoryTooltip.defaultEvents;

// This is the component that we want to modify --- this creates the visualization.
class Main extends React.Component {

  // Constructor: to enable mutation, need externalMutations field.
  constructor() {
    super();
    this.state = {
      externalMutations: undefined,
      theData: data,
      sourceToDisplay: "// promise source will appear here"
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

  onReadSource(event) {
    // For the jump-to-source:
    let fileReader = new FileReader();

    function readSourceFile(evt, file) {
      // console.log(evt.target.result);
      sourceFiles[file.name] = evt.target.result;

      // console.log(sourceFiles);
    }

    function parseData(entries){
      for (var i=0; i<entries.length; i++) {
        fileReader.onloadend = (function(file) {
          return function(evt) {
            readSourceFile(evt, file)
          };
        })(entries[i]);
        fileReader.readAsText(entries[i]);
      }
    }

    parseData(event.target.files);

    // fileReader.readAsText(event.target.files[0]);
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
        <input type="file" name="file" onChange={this.onReadSource.bind(this)}/>
        {/* <button
          onClick={this.redraw.bind(this)}
          style={buttonStyle}
        >
          Redraw
        </button> */}
        <h1>Promise Visualizer</h1>
        <VictoryChart
          style={{parent: {maxWidth: "70%"}}}
          width={600}
          height={300}
          containerComponent={<VictoryZoomContainer/>}
          domainPadding={10}
          theme={VictoryTheme.material}
          // This is the plug to mutating the chart.
          externalEventMutations={this.state.externalMutations}
          // Possible events:
          events={[
            {
              target: "data",
              childName: ["main-interval", "source-area"], // "main-interval",
              eventHandlers: {
                onClick: () => {
                  return [
                    // Enqueue an event to clear formatting on data points.
                    { target: "data", 
                      childName: "main-interval", 
                      eventKey: "all",
                      mutation: () => ({ style: undefined })
                    },
                    // Enqueue event to fill a data point and display it.
                    { target: "data",
                      childName: "main-interval",
                      mutation: (props) => {
                        this.clearClicks
                        // Ok. Here, props.datum is the thing that was clicked on.
                        // Let's try to get it to print the correct file contents...

                        let datum = props.datum;
                        // console.log("Source: " + getSourceForLocation(datum.source));

                        // return { text: getSourceForLocation(datum.source) }
                        // return { text: "Goodbye world, lol." };

                        this.setState({
                          sourceToDisplay: getSourceForLocation(datum.source),
                        });

                        return {
                          style: Object.assign({}, props.style, {fill: "tomato"})
                        };
                    }
                }]},
                // onClick: (event) => {
                //   console.log(event);
                //   // alert(`Source location: ${event}`)
                // },
                onMouseOver: () => {
                  return [{
                    target: "data",
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
          {/* The main visualization: */}
          <VictoryBar 
            horizontal 
            name="main-interval"
            labelComponent={<VictoryTooltip constrainToVisibleArea/>}
            // labels={({ datum }) => `${source}`}
            // labelComponent={<SourceLabel />}
            data={this.state.theData}
          />
        </VictoryChart>
        {/* For the Source Area on the right: 
            Hopefully it can still communicate with main-interval... */}
        <Editor
          name = "source-area"
          value = {this.state.sourceToDisplay}
          onValueChange = {code => this.setState({ code })}
          highlight = {code => highlight(code, languages.js)}
          padding = {10}
          style = {{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
        {/* <VictoryLabel {...this.props}
          name="source-area"
          text = { this.state.sourceToDisplay }
        /> */}
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