# BrainBrowser Surface UI

## Background history
Historically, **BrainBrowser** (and in particular the *Surface* module) was thought as a library, independant of all kind of UI element. This allowed a high level of abstraction and to develop the core without being too much concerned about the ergonomics. When the core eventually reached a decent stage of development and became richer in term of features, some web projects were built around the core to show the community what BrainBrowser was capable of. So far, these projects were distributed along with the core source, in the `examples` subfolder. In parallel, other larger and more mature projects have started to use the core of BrainBrowser, not directly as a dependency, but through its Javascript/Ajax API. [Loris](http://mcin-cnim.ca/neuroimagingtechnologies/loris/) and [Cbrain](http://mcin-cnim.ca/neuroimagingtechnologies/cbrain/) are notable examples of such use.

## Gathering features
Having several independant projects that all use the Suface module of BrainBrowser for specialized needs is a great thing. Though, after some brainstorming sessions, the development team decided to gather the main features (if not all) and to make them available under a unique project: **BrainBrowser Surface UI**.

## Impact
This project is the result of an important refactoring, thus, the users have to keep in mind a few things:
- It was a necessity to modify the core code and this is not entirely backward compatible.
- For external projects that are using the API, this should still be working fine (to be tested more...)
- The core code is still independant from any kind of UI. We still stick to the philosophy of strictly splitting UI and core.

## Retro compatibility
For an easier evolution to this refactoring, we kept the basic integration of BrainBrowser Surface pretty similar to what it used to be.  
[Here](./minimalIntegration.html) is a minimalistic integration example that may be a good starting point.

## Possible evolution
**BrainBrowser Surface UI** implements the UI but not only. Few parts of it could actually be tranfered to the core since they are not UI opiniated. This is mainly the case for features like annotation management, grid and axes creation or even tuning some settings using URL arguments. This transfer work will be done progressively. Putting it in a MVC architecture, the already-existing core would be the *Model*, while **BrainBrowser Surface UI** would be the *View* and few *Controllers*.


## UI software architecture
Here is a an attempt of a simplified class diagram to show the classes and their relations:  

![](uml/class.png)

Keep in mind that JS that do properly allow to develop with *classes*, here we actually use objects and *prototypes*.

### The objects
The following is the list of the objects that compose **BrainBrowser Surface UI** and their basic functionalities.

First, let's be clear on the *jargon*:

- **model**: a bunch of 3D shapes stored in the same file.  

- **shape**: a closed 3D volume with a surface made out of a large amount of vertice and triangles. A model can contain one or more shapes. A shape can also be of a specific color.

- **vertex** : *(plur: vertice)* a vertex is a point in spatial coordinate system, usually at the crossing of two lines or a plane and a line. In the context of Surface Viewer, they have 3D coordinates and are rather used the other way around: to draw a triangle, we need three vertices that are not aligned.

- **Attribute by composition**: in an object oriented paradigm, an attribute *A* is said *by composition* when it is referenced within an object *B*. If *B* is destroyed, *A* is destroyed too. *A* can be part of the composition of only one object but could possibly be aggregated to others.  

- **Attribute by aggregation**: in an object oriented paradigm, an attribute *A* is said *by aggragation* when it is instanciated outsite an object *B* but *B* uses a reference to *A* as one of its attributes. If *B* is destroyed, *A* is not (except if explicitly stated). *A* can be aggregated to one or more objects.  

- **Callback**: a function that is called in response to an event. Other than the event throwing/listening context, a function that is given as an argument of another function can also be called a callback since it can be called *conditionnally*.


#### ShapeIndexer
Does NOT need to know the `viewer`.  
When loading a model, all the shapes from this model have to:
- be kept in memory
- be listed in a easy-to-access structure
- get a unique ID
- know its overall position within the entire list of shapes (across all models)

A ShapeIndexer instance is an attribute of ShapeController by composition.

#### ShapeController
Does need to know the `viewer`.  
Initialize some callbacks.  
An instance of ShapeController manages the side panel widgets related to the model and their shapes. When a model is loaded, a new sub panel is created. In this panel, some "toggle visibility" buttons a complete widget is added for each shape, allowing the user to tune the opacity of each related shape. ShapeController also deals with the shape *search engine* at the top of the right-side panel.

When the user shift+click on a 3D shape, the shapeController object reacts to that and makes the associated shape-widget visible in the window and blinking.

ShapeController load the folowing Handlebars templates:
- opacityWidget
- shapeTab
- tabName

#### ShapePicker
Does need to know the `viewer`.  
Using the pick() method from BrainBrowser Viewer was not enough and we needed something that was easily customizable with a callback. ShapePicker helps the user defining a behavior for when he is clicking on a shape, potentially while pressing shift, ctrl/cmd or both. No behavior is directly implemented in ShapePicker.js, look into initialize.js for that.

#### ModelLoader
Does need to know the `viewer`.  
While most of the file reading/parsing work is done in BrainBrowser's core, the bridge between a HTML file input DOM element and the core is necessary. ModelLoader deals with the file extensions and wrap the core methods in order to make them simpler to access.

#### VertexIndexingController
Does need to know the `viewer`.  
Initialize some callbacks.  
Vertex indexing is a powerful features that allows mainly two things:
- Applying a color map to a shape
- Giving names to shape regions

In both case, each vertex is associated with a value (index), potentially shared by other vertice. When loading a color map, a color is associated with a specific index, when loading a label list, a name is associated with a index.

#### AnnotationController
Does need to know the `viewer`.  
Initialize some callbacks.  
Allow the user to manually add point annotations by clicking on a shape. The annotations are sphere shaped colorful objects that lays at the surface of a model's shape. The data structure allows not only single points annotations but also polylines and polygons but this later feature are not yet available from the UI.
Other than a list of 3D coordinates, an annotation comes with a name, a description and a color.

Thanks to AnnotationController, the user can load and save annotation from/to JSON files.


#### GridManager
Does need to know the `viewer`.  
Initialize some callbacks.  
A grid manager is an instance of the GridManager class. It creates a grid that surrounds all the visible shapes, over the three orthogonal planes. A shape is considered "visible" as long as it opacity is higher than an *opacityThreshold*  (see `setOpacityThreshold`).
No matter where the center of rotation is (since it can be moved), the grid will adapt its own size to be centered on the center of rotation and to cover all the visible objects.  
The grid step is also adjustable thanks to a slider which callback is managed internally to GridManager (see `initCallbacks`).


#### UriParamController
Does need to know the `viewer`.  
In the context of embeding **BrainBrowser Surface UI** in a webpage using *iframes*, it is convenient to give some arguments in the URL. Among others, the instance of UriParamController can load models, annotations files, hide the UI, autorotate, etc.  
For a complete list of features and how to use them, read the header of UriParamController.js .


#### AxisBox
Does NOT need `viewer` as attribute.  
The axis box is a lightweight independtant THREEjs context that shows the three orthogonal axes with different colors. In the context of **BrainBrowser Surface UI**, it is used to show the orientation/rotation of the models.  
To build an instance of AxisBox, only a div id is needed, then, its orientation is modified using `applyQuaternion`. Here, we use this later method in a callback, every time the model is dragged.

AxisBox can be used in an independant project since it does not rely on BrainBrowser dependencies.


### Other files
In addition to classes, **BrainBrowser Surface UI** is composed of file that are not directly involved in an object oriented design.

#### core.js
Mostly contains the instantiations of previously described classes. It also contains the `start` calback for BrainBrowser Surface Viewer and the callback to the `displaymodel` event.

#### initialize.js
Instantiate few objects, preload the Handlebars templates and, most importantly, setup two kind of callbacks:
- the *UI* callbacks `defineUiCallbacks`: actions triggered when the user interacts with widgets.
- the *event* callbacks `definesEventCallbacks`: response to specific events from shape picker or visibility threshold passing.


### Events
As we previously described, some objects declare their callbacks within their own method, while some others declare their callbacks externally. Why such choice?

The callbacks declared internally are attached to specific widget and work only with *this* and (possibly) the `viewer`, which in this case would be an attribute of *this*.

On the other hand, callbacks declared externally (initialize.js) follow at least one of this rule:
- they don't use any custom made objects and only play with the DOM with JQuery
- they only use the `viewer` and no other custom objects
- they need several custom objects that have no point being attributes of each other.
