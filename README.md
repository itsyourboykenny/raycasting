# Raycasting engine in TypeScript
## Usage
Compile all src/*.ts into a single script.js file and embed into your html.  
  
There are 3 main components: LocationData, Minimap and Renderer
- LocationData `LocationData(map: number[][])`
  - This object monitors keyevents and updates it's internal `x,y` coordinates and angle at which the player is looking
  - Contains the map data
  - Minimap and Renderer will update according to it's `x,y` value
- Minimap `Minimap(canvasID:str, player: LocationData)`
  - Minimap location is determined by CSS
  - Reads data from LocationData
  - `Minimap.draw()` will need to be called for each animation frame
- Renderer `Rederer(canvasID: str, player: LocationData)`
  - Responsible for drawing the player's field of view
  - Will be drawn to the canvas specified by their ID
  - `Renderer.draw()` will need to be called for each animation frame

## Example
See `main.js` for a basic usage example

See it in action:
https://excellent-pickle-sprite.glitch.me/
