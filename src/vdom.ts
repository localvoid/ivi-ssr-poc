export interface RenderState {
    result: string;
}

function escapeText(text: string | boolean | number): string {
    if (typeof text === "string") {
        let result = text;
        let escape = null;
        let start = 0;
        let i;
        for (i = 0; i < text.length; i++) {
            switch (text.charCodeAt(i)) {
                case 38: // &
                    escape = "&amp;";
                    break;
                case 60: // <
                    escape = "&lt;";
                    break;
                case 62: // >
                    escape = "&gt;";
                    break;
                default:
                    continue;
            }
            if (i > start) {
                if (start) {
                    result += text.slice(start, i);
                } else {
                    result = text.slice(start, i);
                }
            }
            result += escape;
            start = i + 1;
        }
        if (start && i !== start) {
            return result + text.slice(start, i);
        }
        return result;
    }
    return text.toString();
}

function escapeAttributeValue(text: string | boolean | number): string {
    if (typeof text === "string") {
        let result = text;
        let escape = null;
        let start = 0;
        let i;
        for (i = 0; i < text.length; i++) {
            switch (text.charCodeAt(i)) {
                case 34: // "
                    escape = "&quot;";
                    break;
                case 38: // &
                    escape = "&amp;";
                    break;
                default:
                    continue;
            }
            if (i > start) {
                if (start) {
                    result += text.slice(start, i);
                } else {
                    result = text.slice(start, i);
                }
            }
            result += escape;
            start = i + 1;
        }
        if (start && i !== start) {
            return result + text.slice(start, i);
        }
        return result;
    }
    return text.toString();
}

export type Context<T = {}> = T;

export interface SelectorData<I = {}, O = I> {
    in: I;
    out: O;
}

export interface ConnectDescriptor<I, O, P> {
    select: (prev: SelectorData<I, O> | null, props: P, context: Context) => SelectorData<I, O>;
    render: (props: O) => VNode;
}

export const enum VNodeFlags {
    Text = 1,
    Element = 1 << 1,
    ComponentFunction = 1 << 2,
    ComponentClass = 1 << 3,
    ChildrenBasic = 1 << 4,
    ChildrenVNode = 1 << 5,
    ChildrenArray = 1 << 6,
    Key = 1 << 7,
    Connect = 1 << 8,
    UpdateContext = 1 << 9,
    DeepConnect = 1 << 10,
    Component = ComponentFunction | ComponentClass,
    Syncable = Text | Element | Component | Key | Connect | UpdateContext,
}

export const enum SyncFlags {
    DirtyContext = 1,
}

export interface ComponentFunction {
    (props: any): VNode;
    shouldUpdate?: (oldProps: any, newProps: any) => boolean;
    shouldAugment?: (props: any) => boolean;
}

export interface ComponentClass {
    new (props: any): Component;
}

export abstract class Component {
    props: any;

    constructor(props: any) {
        this.props = props;
    }

    shouldUpdate(oldProps: any, newProps: any): boolean {
        return oldProps !== newProps;
    }

    abstract render(): VNode;
}

export class BlueprintNode {
    _vnode: VNode;
    _openString: string;
    _closeString: string;
    _children: BlueprintNode[] | BlueprintNode | string | number | boolean | null | undefined;
    _flags: VNodeFlags;
    _tag: string | ComponentClass | ComponentFunction | ConnectDescriptor<any, any, any> | null;
    _key: any;
    _props: any;
    _style: any;
    _className: string | null;
    _data: Component | SelectorData | Context | null;
    _childrenKeyIndex: Map<any, BlueprintNode> | null;
    _childrenPosIndex: Map<any, BlueprintNode> | null;

    constructor(
        vnode: VNode,
        children: BlueprintNode[] | BlueprintNode | string | number | boolean | null | undefined,
        data: Component | SelectorData | Context | null,
        openString: string,
        closeString: string,
    ) {
        this._vnode = vnode;
        this._openString = openString;
        this._closeString = closeString;
        this._children = children;
        this._flags = vnode._flags;
        this._tag = vnode._tag;
        this._key = vnode._key;
        this._props = vnode._props;
        this._style = vnode._style;
        this._className = vnode._className;
        this._data = data;

        let childrenKeyIndex = null;
        let childrenPosIndex = null;
        if ((vnode._flags & VNodeFlags.ChildrenArray) !== 0) {
            children = children as BlueprintNode[];
            for (let i = 0; i < children.length; i++) {
                const c = children[i];
                if ((c._flags & VNodeFlags.Key) !== 0) {
                    if (childrenKeyIndex === null) {
                        childrenKeyIndex = new Map<any, BlueprintNode>();
                    }
                    childrenKeyIndex.set(c._key, c);
                } else {
                    if (childrenPosIndex === null) {
                        childrenPosIndex = new Map<any, BlueprintNode>();
                    }
                    childrenPosIndex.set(c._key, c);
                }
            }
        }

        this._childrenKeyIndex = childrenKeyIndex;
        this._childrenPosIndex = childrenPosIndex;
    }
}

export class VNode {
    _flags: VNodeFlags;
    _children: VNode[] | VNode | string | number | boolean | null | undefined;
    _tag: string | ComponentClass | ComponentFunction | ConnectDescriptor<any, any, any> | null;
    _key: any;
    _props: any;
    _style: any;
    _className: string | null;

    constructor(
        flags: number,
        tag: string | ComponentFunction | ComponentClass | ConnectDescriptor<any, any, any> | null,
        props: any,
        className: string | null,
        children: VNode[] | VNode | string | number | boolean | null | undefined,
    ) {
        this._flags = flags;
        this._children = children;
        this._tag = tag;
        this._key = 0;
        this._props = props;
        this._className = className;
    }

    key(key: any): VNode {
        this._flags |= VNodeFlags.Key;
        this._key = key;
        return this;
    }

    className(className: string | null): VNode {
        this._className = className;
        return this;
    }

    style(style: any): VNode {
        this._style = style;
        return this;
    }

    props(props: any): VNode {
        this._props = props;
        return this;
    }

    children(...children: Array<VNode[] | VNode | string | number | null>): VNode;
    children(): VNode {
        const children = arguments;
        let f = 0;
        let r = null;
        if (children.length === 1) {
            r = children[0] as VNode[] | VNode | string | number | null;
            if (typeof r === "object") {
                if (r !== null) {
                    if (r.constructor === Array) {
                        r = r as VNode[];
                        if (r.length > 1) {
                            f = VNodeFlags.ChildrenArray;
                        } else if (r.length === 1) {
                            f = VNodeFlags.ChildrenVNode;
                            r = r[0];
                        } else {
                            r = null;
                        }
                    } else {
                        f = VNodeFlags.ChildrenVNode;
                    }
                }
            } else {
                f = VNodeFlags.ChildrenBasic;
            }
        } else {
            let i;
            let j = 0;
            let k = 0;
            let c;
            for (i = 0; i < children.length; i++) {
                c = children[i];
                if (c !== null) {
                    if (c.constructor === Array) {
                        if (c.length > 0) {
                            k += c.length;
                            j++;
                            r = c;
                        }
                    } else {
                        k++;
                        j++;
                        r = c;
                    }
                }
            }
            if (j > 0) {
                if ((j | k) === 1) {
                    if (typeof r === "object") {
                        if (r.constructor === Array) {
                            if (k > 1) {
                                f = VNodeFlags.ChildrenArray;
                            } else {
                                f = VNodeFlags.ChildrenVNode;
                                r = r[0];
                            }
                        } else {
                            f = VNodeFlags.ChildrenVNode;
                        }
                    } else {
                        f = VNodeFlags.ChildrenBasic;
                    }
                } else {
                    f = VNodeFlags.ChildrenArray;
                    r = new Array(k);
                    k = 0;
                    for (i = 0; i < children.length; i++) {
                        c = children[i];
                        if (typeof c === "object") {
                            if (c !== null) {
                                if (c.constructor === Array) {
                                    for (j = 0; j < c.length; j++) {
                                        r[k++] = c[j] as VNode;
                                    }
                                } else {
                                    r[k++] = c as VNode;
                                    if ((c._flags & VNodeFlags.Key) === 0) {
                                        c._key = i;
                                    }
                                }
                            }
                        } else {
                            c = r[k++] = new VNode(VNodeFlags.Text, null, null, null, c as string | number);
                            c._key = i;
                        }
                    }
                }
            }
        }
        this._flags |= f;
        this._children = r;
        return this;
    }
}

function attributeName(name: string): string {
    switch (name) {
        case "acceptCharset":
            return "accept-charset";
        case "htmlFor":
            return "for";
    }
    return name;
}

function renderElementProps(props: any): string {
    let result = "";

    const keys = Object.keys(props);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = props[key];
        if (value !== null) {
            if (typeof value === "boolean" && value) {
                result += ` ${key}`;
            } else {
                result += ` ${attributeName(key)}="${escapeAttributeValue(value)}"`;
            }
        }
    }

    return result;
}

function renderElementStyle(style: { [key: string]: any }): string {
    const keys = Object.keys(style);
    if (keys.length === 0) {
        return "";
    }

    let result = ` style="`;
    let semicolon = false;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = style[key];
        if (semicolon) {
            result += ";";
        } else {
            semicolon = true;
        }
        result += `${key}:${escapeAttributeValue(value)}`;
    }

    return `${result}"`;
}

function renderOpenElement(node: VNode): string {
    let result = "<" + node._tag;

    if (node._className !== null) {
        result += ` class="${node._className}"`;
    }
    if (node._props) {
        result += `${renderElementProps(node._props)}`;
    }
    if (node._style) {
        result += `${renderElementStyle(node._style)}`;
    }

    return result + ">";
}

function renderCloseElement(node: VNode): string {
    return `</${node._tag}>`;
}

function createBlueprintTextNode(node: VNode): BlueprintNode {
    return new BlueprintNode(
        node,
        node._children as string,
        null,
        escapeText(node._children as string),
        "",
    );
}

const closeElementCache = new Map<string, string>();

function createBlueprintElementNode(node: VNode, context: Context): BlueprintNode {
    const flags = node._flags;

    const openString = renderOpenElement(node);

    let childrenInstances = null;
    if (node._children !== null) {
        if ((flags & VNodeFlags.ChildrenBasic) !== 0) {
            childrenInstances = escapeText(node._children as string);
        } else if ((flags & VNodeFlags.ChildrenArray) !== 0) {
            const children = node._children as VNode[];
            childrenInstances = new Array(children.length);
            for (let i = 0; i < children.length; i++) {
                childrenInstances[i] = createBlueprintNode(children[i], context);
            }
        } else {
            childrenInstances = createBlueprintNode(node._children as VNode, context);
        }
    }

    let closeString = closeElementCache.get(node._tag as string);
    if (closeString === undefined) {
        closeString = renderCloseElement(node);
        closeElementCache.set(node._tag as string, closeString);
    }

    return new BlueprintNode(
        node,
        childrenInstances,
        null,
        openString,
        closeString,
    );
}

function createBlueprintComponentNode(node: VNode, context: Context): BlueprintNode {
    const flags = node._flags;
    if (flags & VNodeFlags.ComponentClass) {
        const component = new (node._tag as ComponentClass)(node._props);
        const root = component.render();
        return new BlueprintNode(node, createBlueprintNode(root, context), component, "", "");
    } // (node._flags & VNodeFlags.ComponentFunction)

    if ((flags & VNodeFlags.Connect) !== 0) {
        const connect = node._tag as ConnectDescriptor<any, any, any>;
        const selectData = connect.select(null, node._props, context);
        return new BlueprintNode(
            node,
            createBlueprintNode(connect.render(selectData.out), context),
            selectData,
            "",
            "",
        );
    }

    if ((flags & VNodeFlags.UpdateContext) !== 0) {
        context = Object.assign({}, context, node._props);
        return new BlueprintNode(node, createBlueprintNode(node._children as VNode, context), context, "", "");
    }

    const root = (node._tag as ComponentFunction)(node._props);
    return new BlueprintNode(node, createBlueprintNode(root, context), null, "", "");
}

function createBlueprintNode(node: VNode, context: Context): BlueprintNode {
    const flags = node._flags;
    if (flags & (VNodeFlags.Element | VNodeFlags.Text)) {
        if (flags & VNodeFlags.Text) {
            return createBlueprintTextNode(node);
        } else { // (flags & VNodeFlags.Element)
            return createBlueprintElementNode(node, context);
        }
    }
    return createBlueprintComponentNode(node, context);
}

function optimizeBlueprint(node: BlueprintNode, componentNode?: BlueprintNode): boolean {
    const flags = node._flags;
    if ((flags & (VNodeFlags.Element | VNodeFlags.Component)) !== 0) {
        if ((flags & VNodeFlags.Element) !== 0) {
            let c = false;
            if (componentNode !== undefined) {
                componentNode._openString += node._openString;
            }
            if (node._children !== null) {
                if ((flags & (VNodeFlags.ChildrenArray | VNodeFlags.ChildrenVNode)) !== 0) {
                    if ((flags & VNodeFlags.ChildrenArray) !== 0) {
                        const children = node._children as BlueprintNode[];
                        for (let i = 0; i < children.length; i++) {
                            if (optimizeBlueprint(children[i], componentNode) === true) {
                                c = true;
                            }
                        }
                    } else {
                        c = optimizeBlueprint(node._children as BlueprintNode, componentNode);
                    }
                } else {
                    if (componentNode !== undefined) {
                        componentNode._openString += node._children;
                    }
                }
            }
            if (componentNode !== undefined) {
                componentNode._openString += node._closeString;
            }
            return c;
        } else {
            if ((flags & VNodeFlags.ComponentClass) !== 0) {
                const c = optimizeBlueprint(node._children as BlueprintNode, node);
                if (componentNode !== undefined) {
                    componentNode._openString += node._openString;
                }
                if (c === true) {
                    node._flags |= VNodeFlags.DeepConnect;
                }
                return c;
            } else {
                if ((flags & VNodeFlags.UpdateContext) !== 0) {
                    return optimizeBlueprint(node._children as BlueprintNode, componentNode);
                } else {
                    const c = optimizeBlueprint(node._children as BlueprintNode, node);
                    if (componentNode !== undefined) {
                        componentNode._openString += node._openString;
                    }
                    if (c === true) {
                        node._flags |= VNodeFlags.DeepConnect;
                    }
                    if ((flags & VNodeFlags.Connect) !== 0) {
                        return true;
                    }
                    return c;
                }
            }
        }
    } else {
        if (componentNode !== undefined) {
            componentNode._openString += node._openString;
        }
    }

    return false;
}

export function createBlueprint(node: VNode): BlueprintNode {
    const blueprint = createBlueprintNode(node, {});
    optimizeBlueprint(blueprint);
    return blueprint;
}

function vNodeCanSync(a: BlueprintNode, b: VNode): boolean {
    return (
        (((a._flags ^ b._flags) & VNodeFlags.Syncable) === 0) &&
        a._tag === b._tag &&
        a._key === b._key
    );
}

function vNodeEqualKeys(a: BlueprintNode, b: VNode): boolean {
    return (
        (a._key === b._key) &&
        ((a._flags ^ b._flags) & VNodeFlags.Key) === 0
    );
}

function renderVNode(state: RenderState, b: VNode, context: Context): void {
    const flags = b._flags;
    if (flags & (VNodeFlags.Element | VNodeFlags.Text)) {
        if (flags & VNodeFlags.Text) {
            state.result += escapeText(b._children as string);
        } else { // (flags & VNodeFlags.Element)
            state.result += renderOpenElement(b);
            if (b._children !== null) {
                if (flags & VNodeFlags.ChildrenBasic) {
                    state.result += escapeText(b._children as string);
                } else if (flags & VNodeFlags.ChildrenArray) {
                    const children = b._children as VNode[];
                    for (let i = 0; i < children.length; i++) {
                        renderVNode(state, children[i], context);
                    }
                } else {
                    renderVNode(state, b._children as VNode, context);
                }
            }
            state.result += renderCloseElement(b);
        }
    } else { // (flags & VNodeFlags.Component)
        if (flags & VNodeFlags.ComponentClass) {
            const component = new (b._tag as ComponentClass)(b._props);
            renderVNode(state, component.render(), context);
        } else {// (node._flags & VNodeFlags.ComponentFunction)
            if ((flags & VNodeFlags.Connect) !== 0) {
                const connect = b._tag as ConnectDescriptor<any, any, any>;
                const selectData = connect.select(null, b._props, context);
                renderVNode(
                    state,
                    connect.render(selectData.out),
                    context,
                );
            } else {
                if ((flags & VNodeFlags.UpdateContext) !== 0) {
                    context = Object.assign({}, context, b._props);
                    renderVNode(state, b._children as VNode, context);
                } else {
                    const root = (b._tag as ComponentFunction)(b._props);
                    renderVNode(state, root, context);
                }
            }
        }
    }
}

function patchCheckDeepChanges(
    state: RenderState,
    a: BlueprintNode,
    context: Context,
    syncFlags: SyncFlags,
): void {
    const flags = a._flags;
    if ((flags & (VNodeFlags.Text | VNodeFlags.Element | VNodeFlags.Component)) !== 0) {
        if ((flags & (VNodeFlags.Element | VNodeFlags.Text)) !== 0) {
            state.result += a._openString;
            if ((flags & VNodeFlags.Element) !== 0) {
                if (a._children !== null) {
                    if ((flags & (VNodeFlags.ChildrenVNode | VNodeFlags.ChildrenArray)) !== 0) {
                        let children = a._children;
                        if ((flags & VNodeFlags.ChildrenArray) !== 0) {
                            children = children as BlueprintNode[];
                            for (let i = 0; i < children.length; i++) {
                                patchCheckDeepChanges(state, children[i], context, syncFlags);
                            }
                        } else {
                            patchCheckDeepChanges(state, children as BlueprintNode, context, syncFlags);
                        }
                    } else {
                        state.result += a._children as string;
                    }
                }
                state.result += a._closeString;
            }
        } else {
            if ((flags & VNodeFlags.ComponentClass) !== 0) {
                if ((flags & VNodeFlags.DeepConnect) === 0) {
                    state.result += a._openString;
                } else {
                    patchCheckDeepChanges(state, a._children as BlueprintNode, context, syncFlags);
                }
            } else { // (flags & VNodeFlags.ComponentFunction)
                if ((flags & VNodeFlags.Connect) !== 0) {
                    const connect = a._tag as ConnectDescriptor<any, any, any>;
                    const prevSelectData = a._data as SelectorData;
                    const selectData = connect.select(prevSelectData, a._props, context);
                    const prevChildren = a._children as BlueprintNode;
                    if (prevSelectData === selectData) {
                        if ((flags & VNodeFlags.DeepConnect) === 0) {
                            state.result += a._openString;
                        } else {
                            patchCheckDeepChanges(state, prevChildren, context, syncFlags);
                        }
                    } else {
                        patchVNode(
                            state,
                            prevChildren,
                            connect.render(selectData.out),
                            context,
                            syncFlags,
                        );
                    }
                } else {
                    if ((flags & VNodeFlags.UpdateContext) !== 0) {
                        if ((syncFlags & SyncFlags.DirtyContext) !== 0) {
                            context = Object.assign({}, context, a._props);
                        }
                        patchCheckDeepChanges(state, a._children as BlueprintNode, context, syncFlags);
                    } else {
                        if ((flags & VNodeFlags.DeepConnect) === 0) {
                            state.result += a._openString;
                        } else {
                            patchCheckDeepChanges(state, a._children as BlueprintNode, context, syncFlags);
                        }
                    }
                }
            }
        }
    }
}

function patchVNode(state: RenderState, a: BlueprintNode, b: VNode, context: Context, syncFlags: SyncFlags): void {
    if (a._vnode === b) {
        patchCheckDeepChanges(state, a, context, syncFlags);
    }

    const bFlags = b._flags;
    if (vNodeCanSync(a, b)) {
        if ((bFlags & (VNodeFlags.Text | VNodeFlags.Element)) !== 0) {
            if ((bFlags & VNodeFlags.Text) !== 0) {
                if (a._children === b._children) {
                    state.result += a._openString;
                } else {
                    state.result += escapeText(b._children as string);
                }
            } else { // (flags & VNodeFlags.Element)
                if (a._props !== b._props || a._style !== b._style || a._className !== b._className) {
                    state.result += renderOpenElement(b);
                } else {
                    state.result += a._openString;
                }

                if (a._vnode._children !== b._children) {
                    patchChildren(
                        state,
                        a,
                        a._flags,
                        bFlags,
                        a._children as BlueprintNode[] | BlueprintNode | string | number | boolean,
                        b._children as VNode[] | VNode | string | number | boolean,
                        context,
                        syncFlags,
                    );
                }

                state.result += a._closeString;
            }
        } else { // (flags & VNodeFlags.Component)
            if ((bFlags & VNodeFlags.ComponentClass) !== 0) {
                const component = a._data as Component;
                // Update component props
                const oldProps = a._props;
                const newProps = b._props;
                const oldRoot = a._children as BlueprintNode;
                if (component.shouldUpdate(oldProps, newProps) === true) {
                    const newComponent = new (b._tag as ComponentClass)(newProps);
                    const newRoot = newComponent.render();
                    patchVNode(state, oldRoot, newRoot, context, syncFlags);
                } else {
                    if ((a._flags & VNodeFlags.DeepConnect) === 0) {
                        state.result += a._openString;
                    } else {
                        patchCheckDeepChanges(state, oldRoot, context, syncFlags);
                    }
                }
            } else { // (flags & VNodeFlags.ComponentFunction)
                const fn = b._tag as ComponentFunction;

                if ((bFlags & (VNodeFlags.UpdateContext | VNodeFlags.Connect)) !== 0) {
                    if ((bFlags & VNodeFlags.Connect) !== 0) {
                        const connect = b._tag as ConnectDescriptor<any, any, any>;
                        const prevSelectData = a._data as SelectorData;
                        const selectData = connect.select(prevSelectData, b._props, context);
                        if (prevSelectData === selectData) {
                            patchCheckDeepChanges(
                                state,
                                a._children as BlueprintNode,
                                context,
                                syncFlags,
                            );
                        } else {
                            patchVNode(
                                state,
                                a._children as BlueprintNode,
                                connect.render(selectData.out),
                                context,
                                syncFlags,
                            );
                        }
                    } else {
                        if ((bFlags & VNodeFlags.UpdateContext) !== 0) {
                            if ((syncFlags & SyncFlags.DirtyContext) !== 0 ||
                                (a._props !== b._props)) {
                                // syncFlags |= SyncFlags.DirtyContext;
                                context = Object.assign({}, context, b._props);
                            } else {
                                context = a._data as Context;
                            }
                        }
                        patchVNode(
                            state,
                            a._children as BlueprintNode,
                            b._children as VNode,
                            context,
                            syncFlags,
                        );
                    }
                } else {
                    if ((fn.shouldUpdate === undefined && a._props !== b._props) ||
                        (fn.shouldUpdate !== undefined && fn.shouldUpdate(a._props, b._props) === true)) {
                        patchVNode(
                            state,
                            a._children as BlueprintNode,
                            fn(b._props),
                            context,
                            syncFlags,
                        );
                    } else {
                        if ((a._flags & VNodeFlags.DeepConnect) === 0) {
                            state.result += a._openString;
                        } else {
                            patchCheckDeepChanges(state, a._children as BlueprintNode, context, syncFlags);
                        }
                    }
                }
            }
        }
    } else {
        renderVNode(state, b, context);
    }
}

function patchChildren(
    state: RenderState,
    aParent: BlueprintNode,
    aParentFlags: VNodeFlags,
    bParentFlags: VNodeFlags,
    a: BlueprintNode[] | BlueprintNode | string | number | boolean,
    b: VNode[] | VNode | string | number | boolean,
    context: Context,
    syncFlags: SyncFlags,
): void {
    let i = 0;
    let synced;
    let node;

    if (a === null) {
        if ((bParentFlags & (VNodeFlags.ChildrenBasic | VNodeFlags.ChildrenArray)) !== 0) {
            if ((bParentFlags & VNodeFlags.ChildrenBasic) !== 0) {
                state.result += escapeText(b as string);
            } else {
                b = b as VNode[];
                do {
                    renderVNode(state, b[i++], context);
                } while (i < b.length);
            }
        } else if ((bParentFlags & VNodeFlags.ChildrenVNode) !== 0) {
            renderVNode(state, b as VNode, context);
        }
    } else if (b === null) {
        // empty
    } else {
        if ((aParentFlags & VNodeFlags.ChildrenBasic) !== 0) {
            if ((bParentFlags & VNodeFlags.ChildrenBasic) !== 0) {
                state.result += escapeText(b as string);
            } else {
                if ((bParentFlags & VNodeFlags.ChildrenArray) !== 0) {
                    b = b as VNode[];
                    do {
                        renderVNode(state, b[i++], context);
                    } while (i < b.length);
                } else {
                    renderVNode(state, b as VNode, context);
                }
            }
        } else if ((aParentFlags & VNodeFlags.ChildrenArray) !== 0) {
            a = a as BlueprintNode[];
            if ((bParentFlags & VNodeFlags.ChildrenBasic) !== 0) {
                state.result += escapeText(b as string);
            } else if ((bParentFlags & VNodeFlags.ChildrenArray) !== 0) {
                patchChildrenTrackByKeys(
                    state,
                    aParent._childrenKeyIndex,
                    aParent._childrenPosIndex,
                    a,
                    b as VNode[],
                    context,
                    syncFlags,
                );
            } else {
                b = b as VNode;
                synced = false;
                i = 0;
                do {
                    node = a[i];
                    if (vNodeEqualKeys(node, b)) {
                        patchVNode(state, node, b, context, syncFlags);
                        synced = true;
                        break;
                    }
                    i++;
                } while (i < a.length);

                if (!synced) {
                    renderVNode(state, b, context);
                }
            }
        } else if ((aParentFlags & VNodeFlags.ChildrenVNode) !== 0) {
            a = a as BlueprintNode;
            if ((bParentFlags & VNodeFlags.ChildrenBasic) !== 0) {
                state.result += escapeText(b as string);
            } else if ((bParentFlags & VNodeFlags.ChildrenArray) !== 0) {
                b = b as VNode[];
                for (i = 0; i < b.length; i++) {
                    node = b[i];
                    if (vNodeEqualKeys(a, node)) {
                        patchVNode(state, a, node, context, syncFlags);
                    } else {
                        renderVNode(state, b[i], context);
                    }
                }
            } else {
                patchVNode(state, a, b as VNode, context, syncFlags);
            }
        }
    }
}

function patchChildrenTrackByKeys(
    state: RenderState,
    keyIndex: Map<any, BlueprintNode> | null,
    posIndex: Map<any, BlueprintNode> | null,
    a: BlueprintNode[],
    b: VNode[],
    context: Context,
    syncFlags: SyncFlags,
): void {
    let aStart = 0;
    let bStart = 0;
    const aEnd = a.length - 1;
    const bEnd = b.length - 1;
    let aStartNode = a[aStart];
    let bStartNode = b[bStart];
    let aNode;
    let bNode;

    while (vNodeEqualKeys(aStartNode, bStartNode)) {
        patchVNode(state, aStartNode, bStartNode, context, syncFlags);
        aStart++;
        bStart++;
        if (aStart > aEnd || bStart > bEnd) {
            break;
        }
        aStartNode = a[aStart];
        bStartNode = b[bStart];
    }

    while (bStart <= bEnd) {
        aNode = undefined;
        bNode = b[bStart++];
        if ((bNode._flags & VNodeFlags.Key) !== 0) {
            if (keyIndex !== null) {
                aNode = keyIndex.get(bNode._key);
            }
        } else {
            if (posIndex !== null) {
                aNode = posIndex.get(bNode._key);
            }
        }
        if (aNode === undefined) {
            renderVNode(state, bNode, context);
        } else {
            patchVNode(state, aNode, bNode, context, syncFlags);
        }
    }
}

export function render(state: RenderState, node: VNode, blueprint?: BlueprintNode): void {
    if (blueprint === undefined) {
        renderVNode(state, node, {});
    } else {
        patchVNode(state, blueprint, node, {}, 0);
    }
}

export function $t(content: string | number | boolean | null): VNode {
    return new VNode(VNodeFlags.Text, null, null, null, content);
}

export function $h(tagName: string, className?: string): VNode {
    return new VNode(
        VNodeFlags.Element,
        tagName,
        null,
        className === undefined ? null : className,
        null);
}

export function $c(c: ComponentFunction | ComponentClass, props?: any): VNode {
    return new VNode(
        (c.prototype.render === undefined) ? VNodeFlags.ComponentFunction : VNodeFlags.ComponentClass,
        c,
        props!,
        null,
        null);
}

export function $connect<I, O, P>(
    connectDescriptor: ConnectDescriptor<I, O, P>,
    props: P,
): VNode {
    return new VNode(
        VNodeFlags.ComponentFunction | VNodeFlags.Connect,
        connectDescriptor,
        props,
        null,
        null,
    );
}

export function $context<T = {}>(context: Context<T>, child: VNode): VNode {
    return new VNode(
        VNodeFlags.ComponentFunction | VNodeFlags.UpdateContext,
        null,
        context,
        null,
        child);
}

export function isComponentClass(componentClass: any): componentClass is ComponentClass {
    return componentClass.prototype.render !== undefined;
}

export function connect(
    select: (prev: SelectorData<any, any> | null, props: any, context: Context) => SelectorData<any, any>,
    render: ComponentClass | ((props: any) => VNode),
): (props: any) => VNode {
    let descriptor: ConnectDescriptor<any, any, any>;
    descriptor = {
        select,
        render: (isComponentClass(render)) ?
            function (props: any): VNode {
                return $c(render, props);
            } :
            render,
    };
    return function (props: any): VNode {
        return $connect(descriptor, props);
    };
}

export function selectorData<I>(i: I): SelectorData<I, I>;
export function selectorData<I, O>(i: I, o: O): SelectorData<I, O>;
export function selectorData<I, O>(i: I, o?: O): SelectorData<I, O> {
    return {
        in: i,
        out: (o === undefined ? i : o) as O,
    };
}
