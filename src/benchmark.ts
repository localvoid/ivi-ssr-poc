import { Component, $h, $c, $context, createBlueprint, connect, selectorData, render } from "./vdom";
import { Suite } from "benchmark";

function MetabarMessage(props: any) {
    return $h("span", "js-metabarMessage u-textColorDarker")
        .children(
        props.title,
        props.saved ? $h("span", "u-textColorNormal u-marginLeft18").children("Saved") : null,
    );
}

const $MetabarMessage = connect(
    function (prev, props, context: any) {
        const title = context.title;
        const saved = context.saved;
        if (prev && prev.in.title === title && prev.in.saved === saved) {
            return prev;
        }
        return selectorData({ title, saved });
    },
    MetabarMessage,
);

class MetabarButton extends Component {
    render() {
        return $h("div", "u-alignMiddle u-inlineBlock u-verticalAlignTop u-height65 u-xs-height56 " +
            "u-paddingLeft8 u-paddingRight8").children(
            $h("div", "u-alignBlock").children(
                $h("button", "button button--chromeless u-baseColor--buttonNormal js-buttonRequiresPostId")
                    .children(this.props.text),
            ),
        );
    }
}

class MetabarButtonSet extends Component {
    render() {
        return $h("div", "buttonSet")
            .children(
            $h("button", "button button--small button--circle button--chromeless is-touchIconBlackPulse " +
                "is-inSiteNavBar u-baseColor--buttonNormal button--withIcon button--withSvgIcon button--activity " +
                "js-notificationsButton u-marginRight10")
                .children(
                $h("span", "svgIcon svgIcon--bell svgIcon--25px")
                    .children(
                    $h("svg", "svgIcon-use")
                        .props({
                            "width": 25,
                            "height": 25,
                            "viewBox": "-293 409 25 25",
                        })
                        .children(
                        $h("path").props({
                            "d": "M-273.327 423.67l-1.673-1.52v-3.646a5.5 5.5 0 0 0-6.04-5.474c-2.86.273-4" +
                            ".96 2.838-4.96 5.71v3.41l-1.68 1.553c-.204.19-.32.456-.32.734V427a1 1 0 0 0 1" +
                            " 1h3.49a3.079 3.079 0 0 0 3.01 2.45 3.08 3.08 0 0 0 3.01-2.45h3.49a1 1 0 0 0 " +
                            "1-1v-2.59c0-.28-.12-.55-.327-.74zm-7.173 5.63c-.842 0-1.55-.546-1.812-1.3h3.6" +
                            "24a1.92 1.92 0 0 1-1.812 1.3zm6.35-2.45h-12.7v-2.347l1.63-1.51c.236-.216.37-." +
                            "522.37-.843v-3.41c0-2.35 1.72-4.356 3.92-4.565a4.353 4.353 0 0 1 4.78 4.33v3." +
                            "645c0 .324.137.633.376.85l1.624 1.477v2.373z",
                        }),
                    ),
                ),
            ),
        );
    }
}

class MetabarBlock extends Component {
    render() {
        return $h("div", "metabar-block u-floatRight u-xs-absolute u-xs-textAlignRight " +
            "u-xs-right0 u-xs-marginRight20 u-height65 u-xs-height56").children(
            $c(MetabarButton, { text: "Share" }),
            $c(MetabarButton, { text: "Publish" }),
            $c(MetabarButtonSet),
        );
    }
}

class Metabar extends Component {
    render() {
        return $h("div", "metabar-inner u-marginAuto u-maxWidth1000 u-paddingLeft20 u-paddingRight20 js-metabarMiddle")
            .children(
            $h("div", "metabar-block metabar-block--left u-floatLeft u-height65 u-xs-height56")
                .children(
                $h("a", "siteNav-logo").props({ "href": "https:/medium.com", "data-log-event": "home" }),
                $h("span", "svgIcon svgIcon--logoNew svgIcon--45px is-flushLeft")
                    .children(
                    $h("svg", "svgIcon-use")
                        .props({
                            "width": "45",
                            "height": "45",
                            "viewBox": "-17 18 45 45",
                            "data-multipart": "true",
                        })
                        .children(
                        $h("path").props({
                            "d": "M11.525 28.078c-.472-.225-.858.002-.858.506v20.044l8.616 4.113c" +
                            ".948.46 1.717.14 1.717-.7v-19.3a.22.22 0 0 0-.124-.19l-9.35-4.46v-.01z",
                        }),
                        $h("path").props({
                            "d": "22 0 0 0-.124-.19l-9.35-4.46v-.01z",
                        }),
                        $h("path").props({
                            "d": "M.333 43.696l9.83-15.247c.278-.43.89-.6 1.36-.38l9.364 4.47c.06." +
                            "03.082.1.047.15L10.666 48.63.333 43.698v-.002z",
                        }),
                        $h("path").props({
                            "d": "M-8.57 28.35c-.786-.375-1.053-.096-.592.62L.333 43.696l10.333 4." +
                            "932L.356 32.635a.156.156 0 0 0-.06-.054l-8.866-4.23z",
                        }),
                        $h("path").props({
                            "d": "M.333 52.033c0 .84-.643 1.22-1.43.844l-8.045-3.84c-.472-.224-." +
                            "858-.82-.858-1.325V28.89c0-.672.515-.976 1.145-.675l9" +
                            ".133 4.36a.092.092 0 0 1 .055.084v19.37z",
                        }),
                    ),
                    $h("span", "u-textScreenReader").children("Homepage"),
                ),
                $h("div", "u-alignMiddle u-inlineBlock u-verticalAlignTop u-height65 u-xs-height56")
                    .children(
                    $h("div", "u-alignBlock")
                        .children(
                        $MetabarMessage(null),
                        $c(MetabarBlock),
                    ),
                ),
            ),
        );
    }
}

function Post(props: any) {
    return $h("div").children(props);
}

const $Post = connect(
    function (prev, props, context: any) {
        const content = context.content;
        if (prev && prev.in === content) {
            return prev;
        }
        return selectorData(content);
    },
    Post,
);

class Main extends Component {
    render() {
        return $h("main")
            .props({ "role": "main" })
            .children(
            $h("article", "u-sizeViewHeightMin100 u-overflowHidden postArticle postArticle--full")
                .props({ "lang": "en", "data-scroll": "native" })
                .children(
                $Post(null),
            ),
        );
    }
}

class App extends Component {
    render() {
        return $h("div", "site-main surface-container")
            .props({ "id": "container" })
            .children(
            $h("div", "surface")
                .props({ "id": "_obv.shell._surface_1497626198690" }).style({
                    "display": "block",
                    "visibility": "visible",
                })
                .children(
                $h("div", "screenContent surface-content is-supplementalPostContentLoaded")
                    .props({
                        "data-used": "true",
                        "data-action-scope": "_actionscop_2",
                    })
                    .children(
                    $c(Metabar),
                    $h("div", "metabar metabar--spacer js-metabarSpacer u-height65 u-xs-height56"),
                    $c(Main),
                ),
            ),
        );
    }
}

const stateA = {
    title: "",
    saved: false,
    content: "",
};

const stateB = {
    title: "Draft",
    saved: true,
    content: "Hello World",
};

const I = createBlueprint($context(stateA, $c(App)));

// (function () {
//     const a = {
//         result: "",
//     };
//     const b = {
//         result: "",
//     };

//     render(a, $context(stateB, $c(App)));
//     render(b, $context(stateB, $c(App)), I);
//     console.log(a.result);
//     console.log("#####");
//     console.log(b.result);
//     console.log(a.result === b.result);
// }());

new Suite()
    .add("render from scratch", function () {
        const state = {
            result: "",
        };

        render(state, $context(stateB, $c(App)));
    })
    .add("apply diff/patch", function () {
        const state = {
            result: "",
        };

        render(state, $context(stateB, $c(App)), I);
    })
    .on("cycle", function (event: any) {
        console.log(String(event.target));
    })
    .on("complete", function (this: any) {
        console.log("Fastest is " + this.filter("fastest").map("name"));
    })
    .run();
