
class NodeManager {

  constructor(background) { // not using background
    // background is a jquery element that is the agreed upon background for the nodeManager
    this.backgroundDiv = background;
    this.nodes = [];
    this.types = [];
    this.selectedIn = null;
    this.selectedOut = null;
    var me = this;
    this.backgroundDiv.on('mouseup', function(e) {
      // on mouse up, cancel the wire if it is being drawn, and mouse is over notebook
      if (e.target===me.backgroundDiv[0]) {
        me.onCancelWiring(e);
      }
    });
  }

  /**
  * create a new node with new type
  * */
  newNode(cell) {
    var type = this.newType(new NodeType(null, cell.get_text()));
    var newnode = new Node(this, type, cell);
    newnode.addOutputPin(new NodePinOutput(this));
    this.nodes.push(newnode);
    return newnode;
  }
  
  addNode(node) {
    if (!this.nodes.includes(node)) {
      this.nodes.push(node)
    }
  }

  removeNode(node) {
    if (this.nodes.includes(node)) {
      this.nodes.splice(this.nodes.indexOf(node), 1);
    }
  }

  /**
  * load this node from its cell metadata
  * */
  loadNode(cell) {
    // note that the cell currently contains all the nodes data, which is wrong since the function should not be specific to the inputs and outputs of a cell.
    var newnode = new Node(this, null, cell);
    this.nodes.push(newnode);
    newnode.onDeserialize(cell.metadata.nodes);
    return newnode;
  }

  /**
  * what to do after loading all the nodes
  * */
  postLoad() {
    for (var node of this.getNodes()) {
      node.reInitializeWires();
    }
    this.updateNodeWires();
  }

  // getNewNodeInstance(type, cell) {
  //   var newnode = new Node(this, type, cell);
  //   this.nodes.push(newnode);
  //   return newnode;
  // }
  //
  // getNewNodeInstance(title, cell) {
  //   return this.getNewNodeInstance(this.getType(title));
  // }

  // wireNodes(outputNode, inputNode, pinName) {
  //   output = outputNode.getOutput()
  //   input = inputNode.getInputs();
  //   input.wire(output, name);
  // }

  /**
  * how to make all nodes wires update to corect positions and statuses
  * */
  updateNodeWires() {
    for (var node of this.getNodes()) {
      node.updateWires();
    }
  }

  // refreshAllNodesMetadata() {
  //   for (var n of this.getNodes()) {
  //     n.onSavingNode();
  //   }
  // }

  /**
  * find a output from its specific name in VarSpace
  * */
  getOutputByVarName(name) {
    if (!name) {
      return null;
    }
    for (var n of this.getNodes()) {
      for (var o of n.getOutputs()) {
        //console.log('testing', o);
        if (o.getOutputVariable()==name) {
          return o;
        }
      }
    }
    return null;
  }

  /**
  * register a new type
  * */
  newType(type) {
    if (!this.getTypes().includes(type)) {
      this.types.push(type);
    }
    this.consolidateTypes();
    return type;
  }

  /**
  * find a type by title and if not create a new one and register that and return it
  * */
  getType(title, code) {
    for (var t of this.getTypes()) {
      if (t.getTitle()==title) {
        return t;
      }
    }
    return this.newType(new NodeType(title, code));
  }

  /**
  * find any duplicate types and remove duplicates
  * */
  consolidateTypes() {
    var types = this.getTypes();
    var duplicatesFound = false;
    for (var i of types) {
      for (var j of types) {
        if (i.getTitle()==j.getTitle() && i!=j) {
          j.setTitle(j.getTitle()+'_1');
          i.setTitle(i.getTitle()+'_2');
          duplicatesFound = true;
        }
      }
    }
    if (duplicatesFound) {
      for (var n of this.getNodes()) {
        n.updateTitle();
      }
    }
  }

  /**
  * return the list of all registered types
  * */
  getTypes() {
    return this.types;
  }

  // onPan(e) {
  //   //update all nodes wire
  //   for (var node of this.getNodes()) {
  //     node.updateWires();
  //   }
  // }
  //
  // onZoom(e) {
  //   node.updateWires();
  // }
  //
  // onMoveNode(e, node) {
  //   node.updateWires();
  // }

  /**
  * return list of all registered nodes
  * */
  getNodes() {
    return this.nodes;
  }

  /**
  * cancel the wiring of nodes
  * */
  onCancelWiring(e) {
    delete this.selectedIn;
    delete this.selectedOut;
    this.selectedIn = null;
    this.selectedOut = null;
  }

  /**
  * what to do when any pin is pressed or unpressed on
  * */
  onPinSelected(pinInput) {
    //run when a pin thinks its been selected
    if (pinInput.getType()==NodePinInput.INPUT_NODE_TYPE) {
      this.selectedIn = pinInput;
      if (!this.selectedOut) {
        // if no output is selected, draw a wire to the mouse from this pin
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;

        var wire = new WireCurvy(null, this.selectedIn);

        var mx = 0;
        var my = 0;

        // return the mouse position instead of the null output
        wire.getInputPosition = function() {
          return new DOMRect(mx, my);
        }

        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        function elementDrag(e) {
          e = e || window.event;
          // calculate the new cursor position:
          mx = e.clientX;
          my = e.clientY;
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          // set the element's new position:
          wire.update();
        }

        function closeDragElement(e) {
          // remove the wire, and the events
          wire.getSVGHelper().get().remove();
          wire = null;
          document.onmouseup = null;
          document.onmousemove = null;
        }
      }
    } else if (pinInput.getType()==NodePinOutput.OUTPUT_NODE_TYPE) {
      this.selectedOut = pinInput;
      if (!this.selectedIn) {
        // if no input is selected, draw a wire to the mouse from this pin
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;

        var wire = new WireCurvy(this.selectedOut, null);

        var mx = 0;
        var my = 0;

        // return the mouse position instead of the null input
        wire.getOutputPosition = function() {
          return new DOMRect(mx, my);
        }

        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        function elementDrag(e) {
          e = e || window.event;
          // calculate the new cursor position:
          mx = e.clientX;
          my = e.clientY;
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          // set the element's new position:
          wire.update();
        }

        function closeDragElement(e) {
          // remove the wire, and the events
          wire.getSVGHelper().get().remove();
          wire = null;
          document.onmouseup = null;
          document.onmousemove = null;
        }
      }
    }
    var inNonNull = Boolean(this.selectedIn); // false when null, true when nonnull
    var outNonNull = Boolean(this.selectedOut);
    if (inNonNull && outNonNull) {
      this.selectedIn.setOutput(this.selectedOut);
      delete this.selectedIn;
      delete this.selectedOut;
      this.selectedIn = null;
      this.selectedOut = null;
    }
  }

  // getNodeIndex(node) {
  //   return this.nodes.indexOf(node);
  // }

}
