import $ from "jquery";
import fx from "animation/fx";
import translator from "animation/translator";
import { hideCallback } from "mobile/hide_top_overlay";
import resizeCallbacks from "core/utils/resize_callbacks";
import config from "core/config";
import typeUtils from "core/utils/type";
import { animation } from "ui/drawer/ui.drawer.rendering.strategy";

import "common.css!";
import "ui/drawer";

const DRAWER_MENU_CONTENT_CLASS = "dx-drawer-menu-content";
const DRAWER_CONTENT_CLASS = "dx-drawer-content";
const DRAWER_SHADER_CLASS = "dx-drawer-shader";

const position = $element => $element.position().left;

const mockFxAnimate = (animations, type, output) => {
    animations[type] = (config) => {
        let position = config.position || 0,
            $element = config.$element;

        output.push({
            $element,
            type,
            start: translator.locate($element).left,
            duration: config.duration,
            end: position
        });

        translator.move($element, { left: position });

        if(config.endAction) {
            config.endAction();
        }
    };
};

const animationCapturing = {
    start() {
        this._capturedAnimations = [];
        this._animation = $.extend({}, animation);

        mockFxAnimate(animation, "moveTo", this._capturedAnimations);

        return this._capturedAnimations;
    },
    teardown() {
        $.extend(animation, this._animation);

        delete this._capturedAnimations;
        delete this._animations;
    }
};


QUnit.testStart(() => {
    const markup = '\
    <style>\
        .dx-drawer-menu-content {\
                width: 200px;\
        }\
    </style>\
    \
    <div id="drawer">\
        <div id="content">Test Content</div>\
    </div>\
    <div id="drawerContainer" style="width: 100px">\
        <div id="drawer2"></div>\
    </div>\
        <div id="contentTemplate">\
        <div data-options="dxTemplate: { name: \'customMenu\' }">\
            Test Menu Template\
        </div>\
            <div data-options="dxTemplate: { name: \'customContent\' }">\
            Test Content Template\
        </div>\
    </div>';

    $("#qunit-fixture").html(markup);
});

QUnit.module("api");

QUnit.test("defaults", assert => {
    const $element = $("#drawer").dxDrawer({});
    const instance = $element.dxDrawer("instance");

    assert.equal(instance.option("revealMode"), "slide", "revealMode is OK");
    assert.equal(instance.option("openedStateMode"), "push", "mode is OK");
    assert.equal(instance.option("position"), "left", "position is OK");
    assert.equal(instance.option("shading"), true, "shading is OK");
});

QUnit.test("content() function", assert => {
    const $element = $("#drawer").dxDrawer({});
    const instance = $element.dxDrawer("instance");
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);
    assert.equal(typeUtils.isRenderer(instance.content()), !!config().useJQuery, "menu element");
    assert.equal($menu.get(0), $(instance.content()).get(0), "content function return correct DOMNode");
});

QUnit.test("viewContent() function", assert => {
    const $element = $("#drawer").dxDrawer({});
    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);

    assert.equal($content.get(0), $(instance.viewContent()).get(0), "content function return correct DOMNode");
});

QUnit.test("drawer preserve content", assert => {
    const $content = $("#drawer #content"),
        $element = $("#drawer").dxDrawer({});

    assert.equal($content[0], $element.find("#content")[0]);
});

QUnit.test("show and hide functions", assert => {
    const $element = $("#drawer").dxDrawer({});
    const instance = $element.dxDrawer("instance");

    instance.show();
    assert.equal(instance.option("opened"), true, "menu was shown");

    instance.hide();
    assert.equal(instance.option("opened"), false, "menu was hidden");
});

QUnit.test("toggle function", assert => {
    const $element = $("#drawer").dxDrawer({});
    const instance = $element.dxDrawer("instance");
    const opened = instance.option("opened");

    instance.toggle();
    assert.equal(instance.option("opened"), !opened, "menu was shown");

    instance.toggle();
    assert.equal(instance.option("opened"), opened, "menu was hidden");
});

QUnit.test("subscribe on toggle function should fired at the end of animation", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: false
    });

    const instance = $element.dxDrawer("instance");
    let count = 0;
    const done = assert.async();

    instance.toggle().done(() => {
        count++;
        assert.equal(count, 1, "callback not fired at animation start");
        done();
    });

    assert.equal(count, 0, "callback not fired at animation start");
});


QUnit.module("navigation");

QUnit.test("content container should have correct position if menu isn't visible", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: false
    });

    const instance = $element.dxDrawer("instance");
    const $content = $(instance.viewContent());

    assert.equal(position($content), 0, "container rendered at correct position");
});

QUnit.test("content container should have correct position if menu is visible", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: true
    });

    const instance = $element.dxDrawer("instance");
    const $content = $(instance.viewContent());
    const $menu = $(instance.content());

    assert.equal(position($content), $menu.width(), "container rendered at correct position");
});

QUnit.test("content container should have correct position after resize", assert => {
    const $element = $("#drawer2").dxDrawer({
        width: "100%",
        opened: true
    });

    const instance = $element.dxDrawer("instance");
    const $content = $(instance.viewContent());
    const elementWidth = $element.width();

    $("#drawerContainer").width(elementWidth * 2);
    resizeCallbacks.fire();

    assert.equal(position($content), $(instance.content()).width(), "container rendered at correct position");
});

QUnit.test("content container should have correct position if it is rendered in invisible container", assert => {
    const $container = $("#drawerContainer");
    const $element = $("#drawer2");

    $container.detach();

    const instance = $element.dxDrawer({
        width: "100%",
        opened: true,
        maxWidth: 50
    }).dxDrawer("instance");

    const $content = $(instance.viewContent());

    $container.appendTo("#qunit-fixture");
    $element.trigger("dxshown");

    assert.equal(position($content), 50, "container rendered at correct position");
});

QUnit.test("menu should be hidden after hideTopOverlayCallback calling", assert => {
    const instance = $("#drawer").dxDrawer({
        opened: true
    }).dxDrawer("instance");

    hideCallback.fire();
    assert.equal(instance.option("opened"), false, "hidden after back button event");
});

QUnit.test("hideTopOverlayCallback be removed on dispose", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: true
    });

    $element.remove();
    assert.ok(!hideCallback.hasCallback());
});

QUnit.test("drawer should not handle hideTopOverlayCallback if it isn't visible", assert => {
    $("#drawer").dxDrawer({
        opened: false
    });

    assert.ok(!hideCallback.hasCallback());
});

QUnit.module("animation", {
    beforeEach() {
        this.capturedAnimations = animationCapturing.start();
    },
    afterEach() {
        animationCapturing.teardown();
    }
});

QUnit.test("animationEnabled option test", assert => {
    fx.off = false;

    const origFX = fx.animate;
    let animated = false;

    fx.animate = () => {
        animated = true;
        return $.Deferred().resolve().promise();
    };

    try {
        const $drawer = $("#drawer").dxDrawer({
            opened: true,
            animationEnabled: false
        });

        const drawer = $drawer.dxDrawer("instance");

        drawer.option("opened", false);

        assert.equal(animated, false, "animation was not present");

        drawer.option("animationEnabled", true);
        drawer.option("opened", true);

        assert.equal(animated, true, "animation present");
    } finally {
        fx.animate = origFX;
    }
});

QUnit.test("animationDuration option test", function(assert) {
    const $drawer = $("#drawer").dxDrawer({
        opened: false,
        animationEnabled: true,
        openedStateMode: "push"
    });

    const drawer = $drawer.dxDrawer("instance");


    drawer.option("animationDuration", 300);

    drawer.toggle();
    assert.equal(this.capturedAnimations[0].duration, 300, "duration is correct");
    drawer.option("animationDuration", 10000);
    drawer.toggle();
    assert.equal(this.capturedAnimations[1].duration, 10000, "duration is correct");
});

QUnit.module("shader");

QUnit.test("shader should be visible if menu is opened", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: true
    });

    const $shader = $element.find("." + DRAWER_SHADER_CLASS);

    assert.ok($shader.is(":visible"), "shader is visible");
});

QUnit.test("shader should not be visible if menu is closed", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: false
    });

    const $shader = $element.find("." + DRAWER_SHADER_CLASS);

    assert.ok($shader.is(":hidden"), "shader is visible");
});

QUnit.test("click on shader should not close menu", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: true
    });

    const instance = $element.dxDrawer("instance");
    const $shader = $element.find("." + DRAWER_SHADER_CLASS);

    $shader.trigger("dxclick");
    assert.ok(!instance.option("opened"), "menu was closed");
});

QUnit.test("shader should be visible during animation", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: false
    });

    const instance = $element.dxDrawer("instance");
    const $shader = $element.find("." + DRAWER_SHADER_CLASS);

    instance.show();
    assert.ok($shader.is(":visible"), "shader is visible during animation");
});

QUnit.test("shader should have correct position", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: true
    });

    const instance = $element.dxDrawer("instance");
    const $content = $(instance.viewContent());
    const $shader = $element.find("." + DRAWER_SHADER_CLASS);

    assert.equal($shader.offset().left, $content.offset().left, "shader has correct position");
});

QUnit.test("shader should have correct position after widget resize", assert => {
    const $element = $("#drawer2").dxDrawer({
        width: "100%",
        opened: true
    });

    const instance = $element.dxDrawer("instance");
    const $content = $(instance.viewContent());
    const $shader = $element.find("." + DRAWER_SHADER_CLASS);
    const menuWidth = $(instance.content()).width();

    $("#drawerContainer").width(menuWidth * 2);
    resizeCallbacks.fire();

    assert.equal($shader.offset().left, $content.offset().left, "shader has correct position");
});

QUnit.module("push mode");

QUnit.test("minWidth should be rendered correctly in push mode", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: true,
        openedStateMode: "push"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 200, "content has correct left when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 50, "content has correct left when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in push mode", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 300,
        opened: true,
        openedStateMode: "push"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 300, "content has correct left when maxWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");

    fx.off = false;
});

QUnit.test("Drawer should be rendered correctly in push mode, right menu position", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        opened: true,
        position: "right",
        openedStateMode: "push"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, -200, "content has correct left when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");

    fx.off = false;
});

QUnit.test("minWidth should be rendered correctly in push mode, right menu position", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        position: "right",
        opened: true,
        openedStateMode: "push"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, -200, "content has correct left when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, -50, "content has correct left when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in push mode, right menu position", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 300,
        position: "right",
        opened: true,
        openedStateMode: "push"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, -300, "content has correct left when maxWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");

    fx.off = false;
});

QUnit.module("shrink mode");

QUnit.test("minWidth should be rendered correctly in shrink mode, expand", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        revealMode: "expand",
        contentTemplate: 'contentTemplate',
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.css("padding-left"), "50px", "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 50, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.css("padding-left"), "200px", "content has correct left when minWidth is set");
    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("minWidth should be rendered correctly in shrink mode, right menu position, expand", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        position: "right",
        revealMode: "expand",
        contentTemplate: 'contentTemplate',
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.css("padding-right"), "50px", "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 950, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 50, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.css("padding-right"), "200px", "content has correct left when minWidth is set");
    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 800, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in shrink mode, expand", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 100,
        opened: false,
        revealMode: "expand",
        contentTemplate: 'contentTemplate',
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.css("padding-left"), "0px", "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 0, "menu has correct width when maxWidth is set");

    instance.toggle();

    assert.equal($content.css("padding-left"), "100px", "content has correct left when maxWidth is set");
    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 100, "menu has correct width when maxWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in shrink mode, right menu position, expand", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 100,
        opened: false,
        revealMode: "expand",
        position: "right",
        contentTemplate: 'contentTemplate',
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.css("padding-right"), "0px", "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 1000, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 0, "menu has correct width when maxWidth is set");

    instance.toggle();

    assert.equal($content.css("padding-right"), "100px", "content has correct left when maxWidth is set");
    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 900, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 100, "menu has correct width when maxWidth is set");

    fx.off = false;
});

QUnit.test("minWidth should be rendered correctly in shrink mode, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        revealMode: "slide",
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, -150, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("minWidth should be rendered correctly in shrink mode, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        revealMode: "slide",
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, -150, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in shrink mode, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 100,
        opened: false,
        revealMode: "slide",
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, -200, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, -100, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    fx.off = false;
});

QUnit.test("minWidth should be rendered correctly in shrink mode, right menu position, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        position: "right",
        revealMode: "slide",
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 950, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 800, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in shrink mode, right menu position, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 100,
        opened: false,
        position: "right",
        revealMode: "slide",
        openedStateMode: "shrink"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 1000, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 900, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    fx.off = false;
});

QUnit.module("overlap mode");

QUnit.test("minWidth should be rendered correctly in overlap mode, expand", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        revealMode: "expand",
        openedStateMode: "overlap"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 50, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in overlap mode, expand", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 100,
        opened: false,
        revealMode: "expand",
        openedStateMode: "overlap"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 0, "menu has correct width when maxWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 100, "menu has correct width when maxWidth is set");

    fx.off = false;
});

QUnit.test("minWidth should be rendered correctly in overlap mode, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        revealMode: "slide",
        openedStateMode: "overlap"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, -150, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 0, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in overlap mode, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 100,
        opened: false,
        revealMode: "slide",
        openedStateMode: "overlap"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, -200, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, -100, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    fx.off = false;
});

QUnit.test("minWidth should be rendered correctly in overlap mode, right menu position, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        minWidth: 50,
        opened: false,
        position: "right",
        revealMode: "slide",
        openedStateMode: "overlap"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 950, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when minWidth is set");
    assert.equal($menu.position().left, 800, "menu has correct left when minWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when minWidth is set");

    fx.off = false;
});

QUnit.test("maxWidth should be rendered correctly in overlap mode, right menu position, slide", assert => {
    fx.off = true;

    const $element = $("#drawer").dxDrawer({
        maxWidth: 100,
        opened: false,
        revealMode: "slide",
        position: "right",
        openedStateMode: "overlap"
    });

    const instance = $element.dxDrawer("instance");
    const $content = $element.find("." + DRAWER_CONTENT_CLASS).eq(0);
    const $menu = $element.find("." + DRAWER_MENU_CONTENT_CLASS).eq(0);

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 1000, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    instance.toggle();

    assert.equal($content.position().left, 0, "content has correct left when maxWidth is set");
    assert.equal($menu.position().left, 900, "menu has correct left when maxWidth is set");
    assert.equal($menu.width(), 200, "menu has correct width when maxWidth is set");

    fx.off = false;
});

QUnit.module("rtl");

QUnit.test("content should have correct position if menu is visible in rtl mode", assert => {
    const $element = $("#drawer").dxDrawer({
        opened: true,
        rtlEnabled: true
    });

    const instance = $element.dxDrawer("instance");
    const $content = $(instance.viewContent());
    const $menu = $(instance.content());

    assert.equal(position($content), -$menu.width(), "container rendered at correct position");
});

