
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.25.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (94:1) {:else}
    function create_else_block(ctx) {
    	let nav;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let th2;
    	let t7;
    	let th3;
    	let t9;
    	let th4;
    	let t11;
    	let th5;
    	let t13;
    	let tbody;

    	function select_block_type_1(ctx, dirty) {
    		if (/*TableData*/ ctx[1].length) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a = element("a");
    			img = element("img");
    			t0 = text("\n\t\t CHAINrecord");
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "Origin";
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = "Destnation";
    			t7 = space();
    			th3 = element("th");
    			th3.textContent = "Status";
    			t9 = space();
    			th4 = element("th");
    			th4.textContent = "Message";
    			t11 = space();
    			th5 = element("th");
    			th5.textContent = "Action";
    			t13 = space();
    			tbody = element("tbody");
    			if_block.c();
    			if (img.src !== (img_src_value = "/icon.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "30");
    			attr_dev(img, "height", "30");
    			attr_dev(img, "class", "d-inline-block align-top");
    			attr_dev(img, "alt", "");
    			add_location(img, file, 96, 4, 2000);
    			attr_dev(a, "class", "navbar-brand");
    			attr_dev(a, "href", "#");
    			add_location(a, file, 95, 2, 1962);
    			attr_dev(nav, "class", "navbar navbar-light");
    			set_style(nav, "background-color", "#e3f2fd");
    			add_location(nav, file, 94, 1, 1891);
    			attr_dev(th0, "scope", "col");
    			add_location(th0, file, 105, 3, 2186);
    			attr_dev(th1, "scope", "col");
    			add_location(th1, file, 106, 3, 2212);
    			attr_dev(th2, "scope", "col");
    			add_location(th2, file, 107, 3, 2243);
    			attr_dev(th3, "scope", "col");
    			add_location(th3, file, 108, 3, 2278);
    			attr_dev(th4, "scope", "col");
    			add_location(th4, file, 109, 3, 2309);
    			attr_dev(th5, "scope", "col");
    			add_location(th5, file, 110, 3, 2341);
    			add_location(tr, file, 104, 4, 2178);
    			attr_dev(thead, "class", "thead-dark");
    			add_location(thead, file, 103, 2, 2147);
    			add_location(tbody, file, 113, 2, 2392);
    			attr_dev(table, "class", "table");
    			add_location(table, file, 100, 1, 2121);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a);
    			append_dev(a, img);
    			append_dev(a, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(tr, t5);
    			append_dev(tr, th2);
    			append_dev(tr, t7);
    			append_dev(tr, th3);
    			append_dev(tr, t9);
    			append_dev(tr, th4);
    			append_dev(tr, t11);
    			append_dev(tr, th5);
    			append_dev(table, t13);
    			append_dev(table, tbody);
    			if_block.m(tbody, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(tbody, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(table);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(94:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (89:1) {#if bLoading}
    function create_if_block(ctx) {
    	let div;
    	let span;
    	let t1;
    	let h6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			t1 = space();
    			h6 = element("h6");
    			h6.textContent = "Initalizing Web App....";
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file, 90, 2, 1797);
    			attr_dev(div, "class", "spinner-grow");
    			set_style(div, "width", "3rem");
    			set_style(div, "height", "3rem");
    			attr_dev(div, "role", "status");
    			add_location(div, file, 89, 1, 1719);
    			add_location(h6, file, 92, 1, 1848);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h6, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(89:1) {#if bLoading}",
    		ctx
    	});

    	return block;
    }

    // (135:3) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file, 136, 2, 2895);
    			attr_dev(div, "class", "spinner-border text-dark");
    			attr_dev(div, "role", "status");
    			add_location(div, file, 135, 4, 2840);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(135:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (116:2) {#if TableData.length }
    function create_if_block_1(ctx) {
    	let each_1_anchor;
    	let each_value = /*TableData*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*TableData, ReceiveGoods*/ 6) {
    				each_value = /*TableData*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(116:2) {#if TableData.length }",
    		ctx
    	});

    	return block;
    }

    // (126:4) {#if ele[4] == 'Ready for Retrival' }
    function create_if_block_2(ctx) {
    	let button;
    	let t;
    	let button_name_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Receive Goods");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", button_name_value = /*ele*/ ctx[8].awb);
    			attr_dev(button, "class", "btn btn-primary margin-half ");
    			add_location(button, file, 126, 4, 2645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*ReceiveGoods*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*TableData*/ 2 && button_name_value !== (button_name_value = /*ele*/ ctx[8].awb)) {
    				attr_dev(button, "name", button_name_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(126:4) {#if ele[4] == 'Ready for Retrival' }",
    		ctx
    	});

    	return block;
    }

    // (118:2) {#each TableData as ele, i}
    function create_each_block(ctx) {
    	let tr;
    	let th;
    	let t0_value = /*ele*/ ctx[8].awb + "";
    	let t0;
    	let t1;
    	let td0;
    	let t2_value = /*ele*/ ctx[8][0] + "";
    	let t2;
    	let t3;
    	let td1;
    	let t4_value = /*ele*/ ctx[8][1] + "";
    	let t4;
    	let t5;
    	let td2;
    	let t6_value = /*ele*/ ctx[8][4] + "";
    	let t6;
    	let t7;
    	let td3;
    	let t8_value = /*ele*/ ctx[8][5] + "";
    	let t8;
    	let t9;
    	let td4;
    	let t10;
    	let if_block = /*ele*/ ctx[8][4] == "Ready for Retrival" && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			th = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			td0 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td1 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td3 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td4 = element("td");
    			if (if_block) if_block.c();
    			t10 = space();
    			attr_dev(th, "scope", "row");
    			add_location(th, file, 119, 3, 2475);
    			add_location(td0, file, 120, 4, 2510);
    			add_location(td1, file, 121, 3, 2531);
    			add_location(td2, file, 122, 3, 2552);
    			add_location(td3, file, 123, 3, 2573);
    			add_location(td4, file, 124, 3, 2594);
    			add_location(tr, file, 118, 4, 2467);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, th);
    			append_dev(th, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td0);
    			append_dev(td0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(td1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(td3, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			if (if_block) if_block.m(td4, null);
    			append_dev(tr, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*TableData*/ 2 && t0_value !== (t0_value = /*ele*/ ctx[8].awb + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*TableData*/ 2 && t2_value !== (t2_value = /*ele*/ ctx[8][0] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*TableData*/ 2 && t4_value !== (t4_value = /*ele*/ ctx[8][1] + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*TableData*/ 2 && t6_value !== (t6_value = /*ele*/ ctx[8][4] + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*TableData*/ 2 && t8_value !== (t8_value = /*ele*/ ctx[8][5] + "")) set_data_dev(t8, t8_value);

    			if (/*ele*/ ctx[8][4] == "Ready for Retrival") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(td4, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(118:2) {#each TableData as ele, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*bLoading*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file, 87, 0, 1695);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadBlockchainData() {
    	const fm = new Fortmatic("pk_test_7F64757BB0C010B6", "kovan");
    	return new Web3(fm.getProvider());
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let VaultContract;
    	let account;

    	//import Page from './Page.svelte' ;
    	//const fm = new Fortmatic('pk_test_7F64757BB0C010B6', 'kovan');
    	//window.web3 = new Web3(fm.getProvider());
    	let bLoading = true, abisData;

    	onMount(async () => {
    		window.web3 = await loadBlockchainData();

    		//  bLoading = false;
    		loadSmartContract();
    	});

    	async function loadSmartContract() {
    		const web3 = window.web3;
    		const accounts = await web3.eth.getAccounts();
    		account = accounts[0];

    		await fetch("/abis/abis.json").then(response => {
    			return response.json();
    		}).then(myJson => {
    			abisData = myJson;
    		});

    		const networkId = await web3.eth.net.getId();
    		const netData = abisData.networks[networkId];

    		if (netData) {
    			const abi = abisData.abi;
    			const address = netData.address;
    			VaultContract = await new web3.eth.Contract(abi, address); //
    			$$invalidate(0, bLoading = false);
    			loadTableData();
    		}
    	}

    	let TableData = [];

    	async function loadTableData() {
    		$$invalidate(1, TableData = []);

    		if (VaultContract && account) {
    			let awbs = [1001, 1002, 1003];

    			awbs.forEach(function (ele) {
    				VaultContract.methods.getAssignment(ele).call({ from: account }).then(data => {
    					data.awb = ele;
    					$$invalidate(1, TableData = [...TableData, data]);
    				});
    			});
    		}
    	}

    	async function ReceiveGoods(oEvent) {
    		let awb = +this.name;

    		VaultContract.methods.receiveGoods(awb).call({ from: account }).then(
    			data => {
    				loadTableData();
    			},
    			error => {
    				console.debug(error);
    			}
    		);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		VaultContract,
    		account,
    		bLoading,
    		abisData,
    		loadBlockchainData,
    		loadSmartContract,
    		TableData,
    		loadTableData,
    		ReceiveGoods
    	});

    	$$self.$inject_state = $$props => {
    		if ("VaultContract" in $$props) VaultContract = $$props.VaultContract;
    		if ("account" in $$props) account = $$props.account;
    		if ("bLoading" in $$props) $$invalidate(0, bLoading = $$props.bLoading);
    		if ("abisData" in $$props) abisData = $$props.abisData;
    		if ("TableData" in $$props) $$invalidate(1, TableData = $$props.TableData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bLoading, TableData, ReceiveGoods];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
