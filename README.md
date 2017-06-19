Proof of Concept implementation for the new render to string algorithm.

## API

```ts
function createBlueprint(node: VNode): BlueprintNode;
function render(state: RenderState, node: VNode, blueprint?: BlueprintNode): void;
```

## Example

```ts
const blueprint = createBlueprint($h("div"));

const renderState = {
    result: "",
};

render(renderState, $h("div").children("Hello World"), blueprint);
```
