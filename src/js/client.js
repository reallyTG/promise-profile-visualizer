import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import { VictoryBar, VictoryLabel, VictoryChart, VictoryTheme, VictoryTooltip, VictoryVoronoiTooltip, VictoryZoomContainer } from 'victory';
import jsonData from '../../data/the.json';

// For the code region:
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

// For the dropdown
class DynamicSelect extends Component {
    constructor(props){
        super(props)
    }

    //On the change event for the select box pass the selected value back to the parent
    handleChange(event) {
      let selectedValue = event.target.value;
      this.props.onSelectChange(selectedValue);
    }

    render(){
        let arrayOfData = this.props.arrayOfData;

        let options = arrayOfData.map((data) =>
            <option 
                key={data}
                value={data}
            >
                {data}
            </option>
        );

        return (
          <select name="customSearch" className="custom-search-select" onChange={this.handleChange.bind(this)}>
              <option>Select Item</option>
              {options}
          </select>
        )
    }
}

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
    let o = theDataObj[i];

    if (o == undefined)
      continue;

    // Check for undefined properties.
    if (isInvalidPromiseDatum(o))
      continue;

    // Edit the object contents.
    o["x"] = Number(i);
    // Turn the strings into numbers.
    o["y0"] = Number(o["startTime"])/DIV_FOR_SCALE;
    o["y"] = Number(o["endTime"])/DIV_FOR_SCALE;
    o["elapsedTime"] = Number(o["elapsedTime"])/DIV_FOR_SCALE;
    o["file"] = o["source"].slice(1, o["source"].indexOf(":"));

    // Build label for tooltip.
    o["label"] = `UID: ${i}\nelapsedTime: ${o["elapsedTime"]}\nsource: ${o["source"]}`;

    // Push modified object to an array (needed by Victory).
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

function getSourcesFromData(data) {
  let sourceFiles = new Set();

  console.log(data);

  for (var i = 0; i < data.length; i++) {
    var o = data[i];
    sourceFiles.add(o["source"].slice(1, o["source"].indexOf(":")));
  }

  return Array.from(sourceFiles);
}

// Initial data array.
let data = processJSON(dataObj);
let initDropdownItems = getSourcesFromData(data);

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

function getMaxElapsedTime(data) {
  var max = 0;
  for (var i = 0; i < data.length; i ++) {
    var o = data[i];

    max = Math.max(max, o["elapsedTime"]);
  }

  console.log(`max: ${max}`);

  return max;
}

SourceLabel.defaultEvents = VictoryTooltip.defaultEvents;

// This is the component that we want to modify --- this creates the visualization.
class Main extends React.Component {

  // Constructor: to enable mutation, need externalMutations field.
  constructor() {
    super();
    this.state = {
      externalMutations: undefined,
      theData: data,
      displayData: data,
      sourceSelectorList: initDropdownItems,
      filterBySelectedSource: false,
      selectedSourceFile: "none",
      filterByElapsedTime: false,
      minElapsedTime: 0,
      maxElapsedTime: getMaxElapsedTime(data),
      sourceToDisplay: "// promise source will appear here"
    };
  }

  // For handling the source dropdown
  handleSelectChange(selectedValue) {

    let displayMe = [];

    console.log("selected value")
    console.log(selectedValue)

    console.log("this.state.theData:")
    console.log(this.state.theData)

    // Update displayData
    for (var i = 0; i < this.state.theData.length; i++) {
      let o = this.state.theData[i];

      if (o["file"] == selectedValue)
        displayMe.push(o);
    }

    console.log(displayMe);

    this.setState({
      displayData: displayMe,
      filterBySelectedSource: true,
      selectedSourceFile: selectedValue
    });
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
      let newData = processJSON(JSON.parse(fileReader.result).promises);
      this.setState({
        loaded: 0,
        theData: newData,
        displayData: newData,
        sourceSelectorList: getSourcesFromData(newData),
        filterBySelectedSource: false,
        filterByElapsedTime: false,
        minElapsedTime: 0,
        maxElapsedTime: getMaxElapsedTime(newData),
        selectedSourceFile: "none"
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

  // handleUpdateForElapsedFilter() {
  //   function filterDataForDisplay(data) {
  //     var newData = [];
  //     for (var i = 0; i < data.length; i++) {
  //       var o = data[i];
  //       // For readability. You can optimize this probably.
  //       var elapsedFilterBool = (!this.state.filterByElapsedTime || (this.state.filterByElapsedTime && o.elapsedTime >= this.state.minElapsedTime && o.elapsedTime <= this.state.maxElapsedTime));
  //       // var sourceFilterBool = (!this.state.filterBySelectedSource || (this.staet.filterBySelectedSource && ))
  //       if (elapsedFilterBool)       
  //         newData.push(o);
  //     }
  //   }
  //   this.setState({
  //     displayData: filterDataForDisplay(this.state.displayData)
  //   })
  // }

  handleChangeMin(event) {

    var newData = [];

    for (var i = 0; i < this.state.theData.length; i++) {
      var o = this.theData.data[i];

      // For readability. You can optimize this probably.
      var elapsedFilterBool = o.elapsedTime >= event.target.value && o.elapsedTime <= this.state.maxElapsedTime;

      if (elapsedFilterBool)
        newData.push(o);
    }

    this.setState({
      displayData: newData,
      filterByElapsedTime: true,
      minElapsedTime: event.target.value});
  }

  handleSubmitMin(event) {
    // alert('A min was submitted: ' + this.state.minElapsedTime);
    event.preventDefault();
  }

  handleChangeMax(event) {

    var newData = [];

    for (var i = 0; i < this.state.theData.length; i++) {
      var o = this.state.theData[i];

      // For readability. You can optimize this probably.
      var elapsedFilterBool = o.elapsedTime >= this.state.minElapsedTime && o.elapsedTime <= event.target.value;

      if (elapsedFilterBool)
        newData.push(o);
    }

    this.setState({
      displayData: newData,
      filterByElapsedTime: true,
      maxElapsedTime: event.target.value});
  }

  handleSubmitMax(event) {
    // alert('A max was submitted: ' + this.state.maxElapsedTime);
    event.preventDefault();
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
        <p>
          <div>
            Select files to view promise chains originating in them.
          </div>
          <DynamicSelect 
            arrayOfData={this.state.sourceSelectorList} 
            onSelectChange={this.handleSelectChange.bind(this)}
          />
        </p>
        <p>
          <div>
            Filter promises based on elapsed time.
          </div>
          <form onSubmit={this.handleSubmitMin.bind(this)}>
            <label>
              Min elapsed time:
              <input type="text" value={this.state.minElapsedTime} onChange={this.handleChangeMin.bind(this)} />
            </label>
            <input type="submit" value="Submit" />
          </form>
          <form onSubmit={this.handleSubmitMax.bind(this)}>
            <label>
              Max elapsed time:
              <input type="text" value={this.state.maxElapsedTime} onChange={this.handleChangeMax.bind(this)} />
            </label>
            <input type="submit" value="Submit" />
          </form>
        </p>
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
            // samples prop does nothing
            // labels={({ datum }) => `${source}`}
            // labelComponent={<SourceLabel />}
            data={this.state.displayData}
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