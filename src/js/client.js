import React from 'react';
import ReactDOM from 'react-dom';
// import { VictoryBar, VictoryLabel, VictoryChart, VictoryTheme, VictoryTooltip, VictoryVoronoiTooltip, VictoryZoomContainer } from 'victory';
import jsonData from '../../data/the.json';
import Prism from "prismjs";
import { Multiselect } from "multiselect-react-dropdown";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceArea } from 'recharts';

// For the code region:
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import 'prismjs/plugins/line-highlight/prism-line-highlight'
// import { VictoryScatter } from 'victory';

// From ./components.js
import {SourceLabel, PrismCode, PromiseIntervalLabel} from './components';

// Style Sheets
import '../css/the.css';

// Get the part of the data for plotting.
let dataObj = jsonData.promises;

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
    // o["x"] = Number(i);
    o["id"] = Number(i);
    // Turn the strings into numbers.
    // o["y0"] = Number(o["startTime"])/DIV_FOR_SCALE;
    // o["y"] = Number(o["endTime"])/DIV_FOR_SCALE;
    o["time"] = [Number(o["startTime"])/DIV_FOR_SCALE, Number(o["endTime"])/DIV_FOR_SCALE];
    // o["time"] = [30, 50];
    o["elapsedTime"] = Number(o["elapsedTime"])/DIV_FOR_SCALE;
    o["file"] = o["source"].slice(1, o["source"].indexOf(":"));

    // Build label for tooltip.
    o["label"] = `UID: ${i}\nelapsedTime: ${o["elapsedTime"]}\nsource: ${o["source"]}`;

    // Push modified object to an array (needed by Victory).
    rData.push(o);
  }

  console.log(rData);

  rData.reverse();

  return rData;
}

function getSourcesFromData(data) {
  let sourceFiles = new Set();

  for (var i = 0; i < data.length; i++) {
    var o = data[i];
    sourceFiles.add(o["source"].slice(1, o["source"].indexOf(":")));
  }

  return Array.from(sourceFiles);
}

// Initial data array.
let data = processJSON(dataObj);
let initDropdownItems = getSourcesFromData(data);

function getMaxElapsedTime(data) {
  var max = 0;
  for (var i = 0; i < data.length; i ++) {
    var o = data[i];

    max = Math.max(max, o["elapsedTime"]);
  }

  return max;
}

function getTimeRange(data) {
  var min = data[1]["startTime"];
  var max = 0;
  for (var i = 0; i < data.length; i ++) {
    var o = data[i];

    min = Math.min(min, o["startTime"]);
    max = Math.max(max, o["endTime"]);
  }

  return [min/DIV_FOR_SCALE, max/DIV_FOR_SCALE];
}

// SourceLabel.defaultEvents = VictoryTooltip.defaultEvents;

// Debug:
console.log('The data: ')
console.log(data)
console.log('Minmax: ')
console.log(getTimeRange(data))

function getInitialStateFromData(data) {
  return {
    externalMutations: undefined,
    regexFilter: "*",
    regexFilterOut: "test",
    theData: data,
    displayData: data,
    sourceSelectorList: initDropdownItems,
    filterBySelectedSource: false,
    filterByElapsedTime: false,
    filesToFilterIn: [],
    filesToFilterOut: [],
    minElapsedTime: 0,
    maxElapsedTime: getMaxElapsedTime(data),
    minMaxTimeRange: getTimeRange(data),
    refAreaLeft: getTimeRange(data)[0],
    refAreaRight: getTimeRange(data)[1],
    left : 'dataMin',
    right : 'dataMax',
    top : 'dataMax',
    bottom : 'dataMin',
    top2 : 'dataMax',
    bottom2: 'dataMin',
    sourceToDisplay: "// promise code will appear here...\n// and the promise will be highlighted like this \n// for your convenience",
    loadedSources: {},
    highlightArea: "2",
    ogWindowLocation: window.location
  }
}

const getAxisYDomain = (from, to, ref, offset) => {
	const refData = data.slice(from-1, to);
  let [ bottom, top ] = [ refData[0][ref], refData[0][ref] ];
  refData.forEach( d => {
  	if ( d[ref] > top ) top = d[ref];
    if ( d[ref] < bottom ) bottom = d[ref];
  });
  
  return [ (bottom|0) - offset, (top|0) + offset ]
};

// This is the component that we want to modify --- this creates the visualization.
class Main extends React.Component {

  // Constructor: to enable mutation, need externalMutations field.
  constructor() {
    super();

    this.state = getInitialStateFromData(data);
  }

  // For loading the file.
  onChangeHandler(event) {
    let fileReader = new FileReader();

    fileReader.onloadend = ((e) => {
      let newData = processJSON(JSON.parse(fileReader.result).promises);
      this.setState(getInitialStateFromData(newData));
      // this.setState({
      //   loaded: 0,
      //   externalMutations: undefined,
      //   regexFilter: "",
      //   theData: newData,
      //   displayData: newData,
      //   sourceSelectorList: getSourcesFromData(newData),
      //   filterBySelectedSource: false,
      //   filterByElapsedTime: false,
      //   filesToFilterIn: [],
      //   filesToFilterOut: [],
      //   minElapsedTime: 0,
      //   maxElapsedTime: getMaxElapsedTime(newData),
      //   minMaxTimeRange: getTimeRange(newData),
      //   sourceToDisplay: "// promise code will appear here...\n// and the promise will be highlighted like this \n// for your convenience",
      //   loadedSources: {},
      //   highlightArea: "2"
      // })
    }).bind(this);

    fileReader.readAsText(event.target.files[0]);
  }

  // For Zooming
  zoom() {  
  	let { refAreaLeft, refAreaRight, displayData } = this.state;

		if ( refAreaLeft === refAreaRight || refAreaRight === '' ) {
    	this.setState( () => ({
      	refAreaLeft : '',
        refAreaRight : ''
      }) );
    	return;
    }

    console.log("refAreaLeft: " + refAreaLeft);

		// xAxis domain
	  if ( refAreaLeft > refAreaRight ) 
    		[ refAreaLeft, refAreaRight ] = [ refAreaRight, refAreaLeft ];

		// yAxis domain
    const [ bottom, top ] = getAxisYDomain( refAreaLeft, refAreaRight, 'id', 1 );
    
    this.setState( () => ({
      refAreaLeft : '',
      refAreaRight : '',
    	displayData : displayData.slice(),
      left : refAreaLeft,
      right : refAreaRight,
      bottom : bottom,
      top: top
    } ) );
  };

  zoomOut() {
  	const { displayData } = this.state;
  	this.setState( () => ({
      displayData : displayData.slice(),
      refAreaLeft : '',
      refAreaRight : '',
      left : 'dataMin',
      right : 'dataMax',
      top : 'dataMax',
      bottom : 'dataMin'
    }) );
  }

  handleAddSourceToDisplay(selectedList, selectedItem) {
    let displayMe = [];

    let filterOut = this.state.filesToFilterOut;

    // Update displayData
    for (var i = 0; i < this.state.theData.length; i++) {
      let o = this.state.theData[i];

      if (selectedList.includes(o["file"]) && !filterOut.includes(o["file"]))
        displayMe.push(o);
    }

    this.setState({
      displayData: displayMe,
      filesToFilterIn: selectedList,
      filterBySelectedSource: true
    });
  }

  handleRemoveSourceToDisplay(selectedList, selectedItem) {
    let displayMe = [];

    let filteringBySelectedSource = ! selectedList.length == 0;

    let filterOut = this.state.filesToFilterOut;

    // Update displayData
    for (var i = 0; i < this.state.theData.length; i++) {
      let o = this.state.theData[i];

      if ((!filteringBySelectedSource || (filteringBySelectedSource && selectedList.includes(o["file"]))) && !filterOut.includes(o["file"]))
        displayMe.push(o);
    }

    this.setState({
      displayData: displayMe,
      filesToFilterIn: selectedList,
      filterBySelectedSource: filteringBySelectedSource
    });
  }

  handleAddSourceToIgnore(selectedList, selectedItem) {
    let displayMe = [];

    let filterIn = this.state.filesToFilterIn;

    // Update displayData
    for (var i = 0; i < this.state.theData.length; i++) {
      let o = this.state.theData[i];

      if (!selectedList.includes(o["file"]) && (!this.state.filterBySelectedSource || (this.state.filterBySelectedSource && filterIn.includes(o["file"]))))
        displayMe.push(o);
    }

    this.setState({
      displayData: displayMe,
      filesToFilterOut: selectedList
    });
  }

  handleRemoveSourceToIgnore(selectedList, selectedItem) {
    let displayMe = [];

    let filterIn = this.state.filesToFilterIn;

    // Update displayData
    for (var i = 0; i < this.state.theData.length; i++) {
      let o = this.state.theData[i];

      if (!selectedList.includes(o["file"]) && (!this.state.filterBySelectedSource || (this.state.filterBySelectedSource && filterIn.includes(o["file"]))))
        displayMe.push(o);
    }

    this.setState({
      displayData: displayMe,
      filesToFilterOut: selectedList
    });
  }

  handleChangeToRegexFilter(event) {
    this.setState({
      regexFilter: event.target.value
    })
  }

  handleAddSourceToIgnore(event) {
    alert('A name was submitted: ' + this.state.value);
    event.preventDefault();
  }

  // For removing the mutations.
  removeMutation() {
    this.setState({
      externalMutations: undefined
    });
  }

  // For this particular example, this is to clear the effect of the clicks.
  // We will modify this.
  clearMutations() {
    this.setState({
      externalMutations: [
        {
          childName: "main-interval",
          target: ["data"],
          eventKey: "all",
          mutation: () => ({ style: undefined }),
          callback: this.removeMutation.bind(this)
        }
      ]
    });
  }

  highlightRelatedPromises(sourceToRelate) {
    this.setState({
      externalMutations: [
        {
          childName: "main-interval",
          target: ["data"],
          eventKey: "all",
          mutation: (p) => {
            if (p.datum.source == sourceToRelate)
              return { style: {fill: "tomato"}}
            else
              return { style: undefined }
          },
          callback: this.removeMutation.bind(this)
        }
      ]
    })
  }

  onReadSource(event) {

    // Get files from the event.
    let files = event.target.files;

    // Update the state with this after.
    let newLoadedSources = {};

    // For parallelism.
    let processTheseFiles = {};

    for (let i=0; i<files.length; i++) {
      let filePathMinusRoot = files[i].webkitRelativePath.slice(files[i].webkitRelativePath.indexOf("/") + 1);
      if (this.state.sourceSelectorList.includes(filePathMinusRoot)) {
        processTheseFiles[filePathMinusRoot] = files[i];
      }
    }

    let numToComplete = Object.keys(processTheseFiles).length;
    console.log(`Need to read ${numToComplete} files.`);

    // Only load files which originate promises.
    // for (let i=0; i<processTheseFiles.length; i++) {
    for (let fileName in processTheseFiles) {
      console.log("Looping...");
      // Need to read the file.
      // New one for each file we want to read? Maximum parallelism.
      let fileReader = new FileReader();
      fileReader.onloadend = ((evt) => {
        console.log("Finished reading file.");
        newLoadedSources[fileName] = evt.target.result;
        numToComplete--;

        if (numToComplete == 0) {
          // We are done. Update the state.
          this.setState({
            loadedSources: newLoadedSources
          });
        }
      }).bind(this);

      fileReader.readAsText(processTheseFiles[fileName]);
    }
  }

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

  handleSubmitMin(event) {
    // alert('A min was submitted: ' + this.state.minElapsedTime);
    // event.preventDefault();
  }

  handleSubmitMax(event) {
    // alert('A max was submitted: ' + this.state.maxElapsedTime);
    // event.preventDefault();
  }

  handleSubmitFilterRegex(event) {

  }

  handleSubmitFilterOutRegex(event) {

  }

  handleChangeToRegexFilter(event) {
    // for Regex matching
    var newData = [];

    try {
      new RegExp(event.target.value)
    } catch(e) {
      console.log("Invalid Regex.")
      this.setState({regexFilter: event.target.value});
      return false;
    }

    for (var i = 0; i < this.state.theData.length; i++) {
      var o = this.state.theData[i];

      // For readability. You can optimize this probably.
      var condition = o.source.match(event.target.value);

      if (condition) {
        console.log(o.source + " matched " + event.target.value);
        newData.push(o);
      } else {

      }
    }

    this.setState({
      displayData: newData,
      regexFilter: event.target.value});
  }

  handleChangeToRegexFilterOut(event) {
    // for Regex matching
    var newData = [];

    try {
      new RegExp(event.target.value)
    } catch(e) {
      console.log("Invalid Regex.")
      this.setState({regexFilterOut: event.target.value});
      return false;
    }

    for (var i = 0; i < this.state.theData.length; i++) {
      var o = this.state.theData[i];

      // For readability. You can optimize this probably.
      var condition = ! o.source.match(event.target.value);

      if (condition) {
        console.log(o.source + " matched " + event.target.value);
        newData.push(o);
      } else {

      }
    }

    this.setState({
      displayData: newData,
      regexFilterOut: event.target.value});
  }

  componentDidMount() {
    Prism.highlightAll();
  }

  clickOnPromiseInterval(barElement) {
    var datum = barElement.activePayload[0].payload;

    function getSourceForLocation(loc, sources) {
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
      let theSource = sources[fileName];
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

      // Move r1 and r2 up by one, cause of starting at line 1 not line 0.
      r1++;
      r2++;

      // This is the source that we want to highlight.
      // let sourceToHighlight = theSource.slice(start - 1, j);

      return {theSource: theSource,
              lineRange: r1 + "-" + r2};
    }

    let sourceAndRange = getSourceForLocation(datum.source, this.state.loadedSources);

    this.setState({
      sourceToDisplay: sourceAndRange["theSource"],
      highlightArea: sourceAndRange["lineRange"]
    });

    // Update window location to jump to source.
    // TODO: the window keeps snapping here...
    // window.location = this.state.ogWindowLocation + `#code-area.${sourceAndRange["lineRange"]}`;

    // return {
    //   style: Object.assign({}, props.style, {fill: "tomato"})
    // };
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
        <script src="https://ssvg.io/ssvg-auto.js"></script>
        {/* Reset button, style specified above. */}
        <button
          onClick={this.clearMutations.bind(this)}
          style={buttonStyle}
        >
          Reset
        </button>
        <input name="selectProfile" type="file" onChange={this.onChangeHandler.bind(this)}/>
        <input name="selectRootDir" type="file" onChange={this.onReadSource.bind(this)} webkitdirectory="" directory=""/>
        <h1>Promise Visualizer</h1>
          <div>
            Select files to view promise chains originating in them.
          </div>
          <Multiselect
            options={this.state.sourceSelectorList}
            isObject={false}
            onSelect={this.handleAddSourceToDisplay.bind(this)}
            onRemove={this.handleRemoveSourceToDisplay.bind(this)}
          />
          <div>
            Select files to *ignore* promise chains originating in them.
          </div>
          <Multiselect
            options={this.state.sourceSelectorList}
            isObject={false}
            onSelect={this.handleAddSourceToIgnore.bind(this)}
            onRemove={this.handleRemoveSourceToIgnore.bind(this)}
          />
        <form onSubmit={this.handleSubmitFilterRegex.bind(this)}>
          <label>
            Filter displayed files by regex:
            <input type="text" value={this.state.regexFilter} onChange={this.handleChangeToRegexFilter.bind(this)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <form onSubmit={this.handleSubmitFilterOutRegex.bind(this)}>
          <label>
            Filter *out* displayed files by regex:
            <input type="text" value={this.state.regexFilterOut} onChange={this.handleChangeToRegexFilterOut.bind(this)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
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
        <a
          href="javascript: void(0);"
          className="btn update"
          onClick={this.zoomOut.bind( this )}
        >
          Zoom Out
        </a>
        <BarChart width={600} height={300} data={this.state.displayData} layout='vertical'
        // onClick={this.clickOnPromiseInterval.bind(this)}
        onMouseDown = { (e) => {
          this.setState({refAreaLeft:e.activePayload[0].payload.time[0]}) }
        }
        onMouseMove = { (e) => this.state.refAreaLeft && this.setState({refAreaRight:e.activePayload[0].payload.time[1]}) }
        onMouseUp = { this.zoom.bind( this ) }
        >
          {/* <XAxis allowDataOverflow={true} dataKey="time" type="number" domain={this.state.minMaxTimeRange}/> */}
          <XAxis allowDataOverflow={true} dataKey="time" type="number" domain={[this.state.left, this.state.right]}/>
          <YAxis allowDataOverflow={true} type="category" dataKey="id" domain={[this.state.bottom, this.state.top]} yAxisId="0"/>
          {/* <YAxis orientation="right" allowDataOverflow={true} type="category" dataKey="id" domain={[this.state.bottom2, this.state.top2]} yAxisId="1"/> */}
          {/* <XAxis 
              allowDataOverflow={true}
              dataKey="time"
              domain={[this.state.left, this.state.right]}
              type="number"
            />
            <YAxis 
              allowDataOverflow={true}
              domain={[this.state.bottom, this.state.top]}
              dataKey="id"
              type="number"
              yAxisId="1"
             />
            <YAxis 
              orientation="right"
              allowDataOverflow={true}
              domain={[this.state.bottom2, this.state.top2]}
              dataKey="id"
              type="number"
              yAxisId="2"
             />  */}
          <Tooltip content=<PromiseIntervalLabel/>/>
          <Bar dataKey="time" fill="#8884d8" onClick={this.clickOnPromiseInterval.bind(this)}/>
        </BarChart>
        {/* <VictoryChart
          style={{parent: {maxWidth: "70%"}}}
          width={600}
          height={300}
          containerComponent={<VictoryZoomContainer/>}
          domainPadding={10}
          theme={VictoryTheme.material}
          // This is the plug to mutating the chart.
          externalEventMutations={this.state.externalMutations}
          // Possible events:
          // These moved into the VictoryBar so as to get the tooltips to work correctly.
        >
          <VictoryBar
            horizontal
            name="main-interval"
            labelComponent={<VictoryTooltip
              constrainToVisibleArea/>}
            data={this.state.displayData}
            style={{
              data: {fill: "black"}
            }}
            events={[
              {
                target: "data",
                childName: ["main-interval", "source-area"],
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
                          this.clearClicks;
                          // Ok. Here, props.datum is the thing that was clicked on.
                          let datum = props.datum;

                          function getSourceForLocation(loc, sources) {
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
                            let theSource = sources[fileName];
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

                            // Move r1 and r2 up by one, cause of starting at line 1 not line 0.
                            r1++;
                            r2++;

                            // This is the source that we want to highlight.
                            // let sourceToHighlight = theSource.slice(start - 1, j);

                            return {theSource: theSource,
                                    lineRange: r1 + "-" + r2};
                          }

                          let sourceAndRange = getSourceForLocation(datum.source, this.state.loadedSources);

                          this.setState({
                            sourceToDisplay: sourceAndRange["theSource"],
                            highlightArea: sourceAndRange["lineRange"]
                          });

                          // Update window location to jump to source.
                          // TODO: the window keeps snapping here...
                          // window.location = this.state.ogWindowLocation + `#code-area.${sourceAndRange["lineRange"]}`;

                          return {
                            style: Object.assign({}, props.style, {fill: "tomato"})
                          };
                      }
                  }]},
                  onMouseOver: () => {
                    return [
                      {
                        target: "data",
                        mutation: (props) => {
                          this.highlightRelatedPromises.bind(this)(props.datum.source);
                          return {style: {fill: "tomato"}}
                        }
                     }, {
                        target: "labels",
                        mutation: () => ({ active: true })
                      }
                    ];
                  },
                  onMouseOut: () => {
                    return [
                      {
                        target: "data",
                        mutation: () => {
                          this.clearMutations.bind(this)();
                        }
                      }, {
                        target: "labels",
                        mutation: () => ({ active: false })
                      }
                    ];
                  }
                }
              }
            ]}
          />
        </VictoryChart> */}
        <PrismCode
          code={this.state.sourceToDisplay}
          language="js"
          plugins={["line-highlight", "line-number"]}
          linesToHighlight={this.state.highlightArea}
        />
      </div>
    );
  }
}

// This is the last thing that should run, which actually builds the app.
const app = document.getElementById('app');
ReactDOM.render(<Main />, app);
