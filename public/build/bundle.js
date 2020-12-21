
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
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

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
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
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.31.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Componentes/Jupiter.svelte generated by Svelte v3.31.0 */

    const file = "src/Componentes/Jupiter.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "JÚPITER";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Júpiter (en latín: Iuppiter), también llamado Jove (Iovis), es el principal dios de la mitología romana, padre de dioses y de hombres (pater deorum et hominum).";
    			if (img.src !== (img_src_value = "/img/Jupiter.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 2, 6, 88);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file, 1, 4, 48);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file, 5, 6, 165);
    			add_location(p, file, 6, 6, 229);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file, 4, 4, 132);
    			attr_dev(div2, "id", "Jupiter");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Jupiter", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jupiter> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Jupiter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jupiter",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Componentes/Juno.svelte generated by Svelte v3.31.0 */

    const file$1 = "src/Componentes/Juno.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "JUNO";
    			t2 = space();
    			p = element("p");
    			p.textContent = "En la mitología romana, Juno era una diosa, equivalente a la Hera griega, diosa del matrimonio y reina de los dioses.";
    			if (img.src !== (img_src_value = "/img/Juno.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 2, 6, 85);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$1, 1, 4, 45);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$1, 5, 6, 159);
    			add_location(p, file$1, 6, 6, 220);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$1, 4, 4, 126);
    			attr_dev(div2, "id", "Juno");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Juno", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Juno> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Juno extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Juno",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Componentes/Neptuno.svelte generated by Svelte v3.31.0 */

    const file$2 = "src/Componentes/Neptuno.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "NEPTUNO";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Neptuno es un dios de la mitología romana hijo de los dioses Saturno y Ops, hermano de Júpiter y Plutón. Gobierna todas las aguas y mares y cabalga las olas sobre caballos blancos.";
    			if (img.src !== (img_src_value = "/img/Neptuno.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$2, 2, 6, 88);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$2, 1, 4, 48);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$2, 5, 6, 165);
    			add_location(p, file$2, 6, 6, 229);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$2, 4, 4, 132);
    			attr_dev(div2, "id", "Neptuno");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Neptuno", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Neptuno> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Neptuno extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Neptuno",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Componentes/Venus.svelte generated by Svelte v3.31.0 */

    const file$3 = "src/Componentes/Venus.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "VENUS";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Venus fue la diosa del amor, la belleza y la fertilidad de la mitología romana a quien se adoraba y festejaba en muchas fiestas y mitos religiosos romanos.";
    			if (img.src !== (img_src_value = "/img/Venus.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$3, 2, 6, 86);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$3, 1, 4, 46);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$3, 5, 6, 161);
    			add_location(p, file$3, 6, 6, 223);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$3, 4, 4, 128);
    			attr_dev(div2, "id", "Venus");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Venus", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Venus> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Venus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Venus",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Componentes/Marte.svelte generated by Svelte v3.31.0 */

    const file$4 = "src/Componentes/Marte.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "MARTE";
    			t2 = space();
    			p = element("p");
    			p.textContent = "En la mitología romana, Marte, en latín Mārs, tenía muchos atributos, era el dios de la guerra, la virilidad masculina, la violencia.";
    			if (img.src !== (img_src_value = "/img/Marte.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$4, 2, 6, 86);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$4, 1, 4, 46);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$4, 5, 6, 161);
    			add_location(p, file$4, 6, 6, 223);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$4, 4, 4, 128);
    			attr_dev(div2, "id", "Marte");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Marte", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Marte> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Marte extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Marte",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Componentes/Apolo.svelte generated by Svelte v3.31.0 */

    const file$5 = "src/Componentes/Apolo.svelte";

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "APOLO";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Apolo (en griego: Ἀπόλλων, transl. Apóllōn, o Ἀπέλλων, transl. Apellōn) es una de las deidades principales de la mitología griega, dios del sol y las bellas artes.";
    			if (img.src !== (img_src_value = "/img/Apolo.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$5, 2, 6, 86);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$5, 1, 4, 46);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$5, 5, 6, 161);
    			add_location(p, file$5, 6, 6, 223);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$5, 4, 4, 128);
    			attr_dev(div2, "id", "Apolo");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Apolo", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Apolo> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Apolo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Apolo",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Componentes/Vulcano.svelte generated by Svelte v3.31.0 */

    const file$6 = "src/Componentes/Vulcano.svelte";

    function create_fragment$7(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "VULCANO";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Vulcano  (en latín, Volcānus, Volchanus, Volkanus)es el dios romano del fuego, además de patrón de los oficios relacionados con los hornos en la religión de la Antigua Roma.";
    			if (img.src !== (img_src_value = "/img/Vulcano.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$6, 2, 6, 88);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$6, 1, 4, 48);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$6, 5, 6, 165);
    			add_location(p, file$6, 6, 6, 229);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$6, 4, 4, 132);
    			attr_dev(div2, "id", "Vulcano");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Vulcano", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Vulcano> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Vulcano extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Vulcano",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Componentes/Pluton.svelte generated by Svelte v3.31.0 */

    const file$7 = "src/Componentes/Pluton.svelte";

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "PLUTÓN";
    			t2 = space();
    			p = element("p");
    			p.textContent = "En la mitología griega, Hades (en griego antiguo ᾍδης Hadēs, originalmente Ἅιδης Haidēs o Ἀΐδης Aïdēs —dórico Ἀΐδας Aidas—, ‘el invisible’)​ alude tanto al antiguo inframundo griego como al dios de este.";
    			if (img.src !== (img_src_value = "/img/hades.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$7, 3, 5, 93);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$7, 2, 6, 54);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$7, 6, 5, 171);
    			add_location(p, file$7, 7, 5, 233);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$7, 5, 6, 139);
    			attr_dev(div2, "id", "Hades");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$7, 1, 4, 6);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pluton", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pluton> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Pluton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pluton",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Componentes/Mercurio.svelte generated by Svelte v3.31.0 */

    const file$8 = "src/Componentes/Mercurio.svelte";

    function create_fragment$9(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "MERCURIO";
    			t2 = space();
    			p = element("p");
    			p.textContent = "En la mitología romana, Mercurio (en latín, Mercurius) era un importante dios del comercio, hijo de Júpiter y de Maia Maiestas. Su nombre está relacionado con la palabra latina merx (‘mercancía’).";
    			if (img.src !== (img_src_value = "/img/Mercurio.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$8, 2, 6, 89);
    			attr_dev(div0, "class", "card-image dios_img");
    			add_location(div0, file$8, 1, 4, 49);
    			attr_dev(span, "class", "card-title dioses_tit center");
    			add_location(span, file$8, 5, 6, 167);
    			add_location(p, file$8, 6, 6, 232);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$8, 4, 4, 134);
    			attr_dev(div2, "id", "Mercurio");
    			attr_dev(div2, "class", "card transparent");
    			add_location(div2, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Mercurio", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Mercurio> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Mercurio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mercurio",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Componentes/Header.svelte generated by Svelte v3.31.0 */

    const file$9 = "src/Componentes/Header.svelte";

    function create_fragment$a(ctx) {
    	let nav;
    	let div;
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div = element("div");
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = "../img/Logo_dioses_de_roma.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "250vw");
    			attr_dev(img, "alt", "Logo Dioses de Roma");
    			add_location(img, file$9, 4, 44, 219);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "brand-logo center svelte-143ymqr");
    			add_location(a, file$9, 4, 6, 181);
    			attr_dev(div, "class", "nav-wrapper");
    			add_location(div, file$9, 3, 4, 149);
    			attr_dev(nav, "class", "transparent svelte-143ymqr");
    			set_style(nav, "box-shadow", "0 0px 0px 0 rgba(0,0,0,0), 0 0px 0px 0px rgba(0,0,0,0.0), 0 0px 0px 0 rgba(0,0,0,0.0)", 1);
    			add_location(nav, file$9, 2, 0, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div);
    			append_dev(div, a);
    			append_dev(a, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFoundation = /** @class */ (function () {
        function MDCFoundation(adapter) {
            if (adapter === void 0) { adapter = {}; }
            this.adapter_ = adapter;
        }
        Object.defineProperty(MDCFoundation, "cssClasses", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports every
                // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "strings", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "numbers", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "defaultAdapter", {
            get: function () {
                // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
                // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
                // validation.
                return {};
            },
            enumerable: true,
            configurable: true
        });
        MDCFoundation.prototype.init = function () {
            // Subclasses should override this method to perform initialization routines (registering events, etc.)
        };
        MDCFoundation.prototype.destroy = function () {
            // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
        };
        return MDCFoundation;
    }());

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCComponent = /** @class */ (function () {
        function MDCComponent(root, foundation) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            this.root_ = root;
            this.initialize.apply(this, __spread(args));
            // Note that we initialize foundation here and not within the constructor's default param so that
            // this.root_ is defined and can be used within the foundation class.
            this.foundation_ = foundation === undefined ? this.getDefaultFoundation() : foundation;
            this.foundation_.init();
            this.initialSyncWithDOM();
        }
        MDCComponent.attachTo = function (root) {
            // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
            // returns an instantiated component with its root set to that element. Also note that in the cases of
            // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
            // from getDefaultFoundation().
            return new MDCComponent(root, new MDCFoundation({}));
        };
        /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
        MDCComponent.prototype.initialize = function () {
            var _args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _args[_i] = arguments[_i];
            }
            // Subclasses can override this to do any additional setup work that would be considered part of a
            // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
            // initialized. Any additional arguments besides root and foundation will be passed in here.
        };
        MDCComponent.prototype.getDefaultFoundation = function () {
            // Subclasses must override this method to return a properly configured foundation class for the
            // component.
            throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
                'foundation class');
        };
        MDCComponent.prototype.initialSyncWithDOM = function () {
            // Subclasses should override this method if they need to perform work to synchronize with a host DOM
            // object. An example of this would be a form control wrapper that needs to synchronize its internal state
            // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
            // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
        };
        MDCComponent.prototype.destroy = function () {
            // Subclasses may implement this method to release any resources / deregister any listeners they have
            // attached. An example of this might be deregistering a resize event from the window object.
            this.foundation_.destroy();
        };
        MDCComponent.prototype.listen = function (evtType, handler, options) {
            this.root_.addEventListener(evtType, handler, options);
        };
        MDCComponent.prototype.unlisten = function (evtType, handler, options) {
            this.root_.removeEventListener(evtType, handler, options);
        };
        /**
         * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
         */
        MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
            if (shouldBubble === void 0) { shouldBubble = false; }
            var evt;
            if (typeof CustomEvent === 'function') {
                evt = new CustomEvent(evtType, {
                    bubbles: shouldBubble,
                    detail: evtData,
                });
            }
            else {
                evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(evtType, shouldBubble, false, evtData);
            }
            this.root_.dispatchEvent(evt);
        };
        return MDCComponent;
    }());

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * @fileoverview A "ponyfill" is a polyfill that doesn't modify the global prototype chain.
     * This makes ponyfills safer than traditional polyfills, especially for libraries like MDC.
     */
    function closest(element, selector) {
        if (element.closest) {
            return element.closest(selector);
        }
        var el = element;
        while (el) {
            if (matches(el, selector)) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }
    function matches(element, selector) {
        var nativeMatches = element.matches
            || element.webkitMatchesSelector
            || element.msMatchesSelector;
        return nativeMatches.call(element, selector);
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses = {
        LIST_ITEM_ACTIVATED_CLASS: 'mdc-list-item--activated',
        LIST_ITEM_CLASS: 'mdc-list-item',
        LIST_ITEM_DISABLED_CLASS: 'mdc-list-item--disabled',
        LIST_ITEM_SELECTED_CLASS: 'mdc-list-item--selected',
        ROOT: 'mdc-list',
    };
    var strings = {
        ACTION_EVENT: 'MDCList:action',
        ARIA_CHECKED: 'aria-checked',
        ARIA_CHECKED_CHECKBOX_SELECTOR: '[role="checkbox"][aria-checked="true"]',
        ARIA_CHECKED_RADIO_SELECTOR: '[role="radio"][aria-checked="true"]',
        ARIA_CURRENT: 'aria-current',
        ARIA_DISABLED: 'aria-disabled',
        ARIA_ORIENTATION: 'aria-orientation',
        ARIA_ORIENTATION_HORIZONTAL: 'horizontal',
        ARIA_ROLE_CHECKBOX_SELECTOR: '[role="checkbox"]',
        ARIA_SELECTED: 'aria-selected',
        CHECKBOX_RADIO_SELECTOR: 'input[type="checkbox"]:not(:disabled), input[type="radio"]:not(:disabled)',
        CHECKBOX_SELECTOR: 'input[type="checkbox"]:not(:disabled)',
        CHILD_ELEMENTS_TO_TOGGLE_TABINDEX: "\n    ." + cssClasses.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses.LIST_ITEM_CLASS + " a\n  ",
        FOCUSABLE_CHILD_ELEMENTS: "\n    ." + cssClasses.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses.LIST_ITEM_CLASS + " a,\n    ." + cssClasses.LIST_ITEM_CLASS + " input[type=\"radio\"]:not(:disabled),\n    ." + cssClasses.LIST_ITEM_CLASS + " input[type=\"checkbox\"]:not(:disabled)\n  ",
        RADIO_SELECTOR: 'input[type="radio"]:not(:disabled)',
    };
    var numbers = {
        UNSET_INDEX: -1,
    };

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var ELEMENTS_KEY_ALLOWED_IN = ['input', 'button', 'textarea', 'select'];
    function isNumberArray(selectedIndex) {
        return selectedIndex instanceof Array;
    }
    var MDCListFoundation = /** @class */ (function (_super) {
        __extends(MDCListFoundation, _super);
        function MDCListFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCListFoundation.defaultAdapter, adapter)) || this;
            _this.wrapFocus_ = false;
            _this.isVertical_ = true;
            _this.isSingleSelectionList_ = false;
            _this.selectedIndex_ = numbers.UNSET_INDEX;
            _this.focusedItemIndex_ = numbers.UNSET_INDEX;
            _this.useActivatedClass_ = false;
            _this.ariaCurrentAttrValue_ = null;
            _this.isCheckboxList_ = false;
            _this.isRadioList_ = false;
            return _this;
        }
        Object.defineProperty(MDCListFoundation, "strings", {
            get: function () {
                return strings;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCListFoundation, "cssClasses", {
            get: function () {
                return cssClasses;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCListFoundation, "numbers", {
            get: function () {
                return numbers;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCListFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClassForElementIndex: function () { return undefined; },
                    focusItemAtIndex: function () { return undefined; },
                    getAttributeForElementIndex: function () { return null; },
                    getFocusedElementIndex: function () { return 0; },
                    getListItemCount: function () { return 0; },
                    hasCheckboxAtIndex: function () { return false; },
                    hasRadioAtIndex: function () { return false; },
                    isCheckboxCheckedAtIndex: function () { return false; },
                    isFocusInsideList: function () { return false; },
                    isRootFocused: function () { return false; },
                    notifyAction: function () { return undefined; },
                    removeClassForElementIndex: function () { return undefined; },
                    setAttributeForElementIndex: function () { return undefined; },
                    setCheckedCheckboxOrRadioAtIndex: function () { return undefined; },
                    setTabIndexForListItemChildren: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCListFoundation.prototype.layout = function () {
            if (this.adapter_.getListItemCount() === 0) {
                return;
            }
            if (this.adapter_.hasCheckboxAtIndex(0)) {
                this.isCheckboxList_ = true;
            }
            else if (this.adapter_.hasRadioAtIndex(0)) {
                this.isRadioList_ = true;
            }
        };
        /**
         * Sets the private wrapFocus_ variable.
         */
        MDCListFoundation.prototype.setWrapFocus = function (value) {
            this.wrapFocus_ = value;
        };
        /**
         * Sets the isVertical_ private variable.
         */
        MDCListFoundation.prototype.setVerticalOrientation = function (value) {
            this.isVertical_ = value;
        };
        /**
         * Sets the isSingleSelectionList_ private variable.
         */
        MDCListFoundation.prototype.setSingleSelection = function (value) {
            this.isSingleSelectionList_ = value;
        };
        /**
         * Sets the useActivatedClass_ private variable.
         */
        MDCListFoundation.prototype.setUseActivatedClass = function (useActivated) {
            this.useActivatedClass_ = useActivated;
        };
        MDCListFoundation.prototype.getSelectedIndex = function () {
            return this.selectedIndex_;
        };
        MDCListFoundation.prototype.setSelectedIndex = function (index) {
            if (!this.isIndexValid_(index)) {
                return;
            }
            if (this.isCheckboxList_) {
                this.setCheckboxAtIndex_(index);
            }
            else if (this.isRadioList_) {
                this.setRadioAtIndex_(index);
            }
            else {
                this.setSingleSelectionAtIndex_(index);
            }
        };
        /**
         * Focus in handler for the list items.
         */
        MDCListFoundation.prototype.handleFocusIn = function (_, listItemIndex) {
            if (listItemIndex >= 0) {
                this.adapter_.setTabIndexForListItemChildren(listItemIndex, '0');
            }
        };
        /**
         * Focus out handler for the list items.
         */
        MDCListFoundation.prototype.handleFocusOut = function (_, listItemIndex) {
            var _this = this;
            if (listItemIndex >= 0) {
                this.adapter_.setTabIndexForListItemChildren(listItemIndex, '-1');
            }
            /**
             * Between Focusout & Focusin some browsers do not have focus on any element. Setting a delay to wait till the focus
             * is moved to next element.
             */
            setTimeout(function () {
                if (!_this.adapter_.isFocusInsideList()) {
                    _this.setTabindexToFirstSelectedItem_();
                }
            }, 0);
        };
        /**
         * Key handler for the list.
         */
        MDCListFoundation.prototype.handleKeydown = function (evt, isRootListItem, listItemIndex) {
            var isArrowLeft = evt.key === 'ArrowLeft' || evt.keyCode === 37;
            var isArrowUp = evt.key === 'ArrowUp' || evt.keyCode === 38;
            var isArrowRight = evt.key === 'ArrowRight' || evt.keyCode === 39;
            var isArrowDown = evt.key === 'ArrowDown' || evt.keyCode === 40;
            var isHome = evt.key === 'Home' || evt.keyCode === 36;
            var isEnd = evt.key === 'End' || evt.keyCode === 35;
            var isEnter = evt.key === 'Enter' || evt.keyCode === 13;
            var isSpace = evt.key === 'Space' || evt.keyCode === 32;
            if (this.adapter_.isRootFocused()) {
                if (isArrowUp || isEnd) {
                    evt.preventDefault();
                    this.focusLastElement();
                }
                else if (isArrowDown || isHome) {
                    evt.preventDefault();
                    this.focusFirstElement();
                }
                return;
            }
            var currentIndex = this.adapter_.getFocusedElementIndex();
            if (currentIndex === -1) {
                currentIndex = listItemIndex;
                if (currentIndex < 0) {
                    // If this event doesn't have a mdc-list-item ancestor from the
                    // current list (not from a sublist), return early.
                    return;
                }
            }
            var nextIndex;
            if ((this.isVertical_ && isArrowDown) || (!this.isVertical_ && isArrowRight)) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusNextElement(currentIndex);
            }
            else if ((this.isVertical_ && isArrowUp) || (!this.isVertical_ && isArrowLeft)) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusPrevElement(currentIndex);
            }
            else if (isHome) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusFirstElement();
            }
            else if (isEnd) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusLastElement();
            }
            else if (isEnter || isSpace) {
                if (isRootListItem) {
                    // Return early if enter key is pressed on anchor element which triggers synthetic MouseEvent event.
                    var target = evt.target;
                    if (target && target.tagName === 'A' && isEnter) {
                        return;
                    }
                    this.preventDefaultEvent_(evt);
                    if (this.isSelectableList_()) {
                        this.setSelectedIndexOnAction_(currentIndex);
                    }
                    this.adapter_.notifyAction(currentIndex);
                }
            }
            this.focusedItemIndex_ = currentIndex;
            if (nextIndex !== undefined) {
                this.setTabindexAtIndex_(nextIndex);
                this.focusedItemIndex_ = nextIndex;
            }
        };
        /**
         * Click handler for the list.
         */
        MDCListFoundation.prototype.handleClick = function (index, toggleCheckbox) {
            if (index === numbers.UNSET_INDEX) {
                return;
            }
            if (this.isSelectableList_()) {
                this.setSelectedIndexOnAction_(index, toggleCheckbox);
            }
            this.adapter_.notifyAction(index);
            this.setTabindexAtIndex_(index);
            this.focusedItemIndex_ = index;
        };
        /**
         * Focuses the next element on the list.
         */
        MDCListFoundation.prototype.focusNextElement = function (index) {
            var count = this.adapter_.getListItemCount();
            var nextIndex = index + 1;
            if (nextIndex >= count) {
                if (this.wrapFocus_) {
                    nextIndex = 0;
                }
                else {
                    // Return early because last item is already focused.
                    return index;
                }
            }
            this.adapter_.focusItemAtIndex(nextIndex);
            return nextIndex;
        };
        /**
         * Focuses the previous element on the list.
         */
        MDCListFoundation.prototype.focusPrevElement = function (index) {
            var prevIndex = index - 1;
            if (prevIndex < 0) {
                if (this.wrapFocus_) {
                    prevIndex = this.adapter_.getListItemCount() - 1;
                }
                else {
                    // Return early because first item is already focused.
                    return index;
                }
            }
            this.adapter_.focusItemAtIndex(prevIndex);
            return prevIndex;
        };
        MDCListFoundation.prototype.focusFirstElement = function () {
            this.adapter_.focusItemAtIndex(0);
            return 0;
        };
        MDCListFoundation.prototype.focusLastElement = function () {
            var lastIndex = this.adapter_.getListItemCount() - 1;
            this.adapter_.focusItemAtIndex(lastIndex);
            return lastIndex;
        };
        /**
         * @param itemIndex Index of the list item
         * @param isEnabled Sets the list item to enabled or disabled.
         */
        MDCListFoundation.prototype.setEnabled = function (itemIndex, isEnabled) {
            if (!this.isIndexValid_(itemIndex)) {
                return;
            }
            if (isEnabled) {
                this.adapter_.removeClassForElementIndex(itemIndex, cssClasses.LIST_ITEM_DISABLED_CLASS);
                this.adapter_.setAttributeForElementIndex(itemIndex, strings.ARIA_DISABLED, 'false');
            }
            else {
                this.adapter_.addClassForElementIndex(itemIndex, cssClasses.LIST_ITEM_DISABLED_CLASS);
                this.adapter_.setAttributeForElementIndex(itemIndex, strings.ARIA_DISABLED, 'true');
            }
        };
        /**
         * Ensures that preventDefault is only called if the containing element doesn't
         * consume the event, and it will cause an unintended scroll.
         */
        MDCListFoundation.prototype.preventDefaultEvent_ = function (evt) {
            var target = evt.target;
            var tagName = ("" + target.tagName).toLowerCase();
            if (ELEMENTS_KEY_ALLOWED_IN.indexOf(tagName) === -1) {
                evt.preventDefault();
            }
        };
        MDCListFoundation.prototype.setSingleSelectionAtIndex_ = function (index) {
            if (this.selectedIndex_ === index) {
                return;
            }
            var selectedClassName = cssClasses.LIST_ITEM_SELECTED_CLASS;
            if (this.useActivatedClass_) {
                selectedClassName = cssClasses.LIST_ITEM_ACTIVATED_CLASS;
            }
            if (this.selectedIndex_ !== numbers.UNSET_INDEX) {
                this.adapter_.removeClassForElementIndex(this.selectedIndex_, selectedClassName);
            }
            this.adapter_.addClassForElementIndex(index, selectedClassName);
            this.setAriaForSingleSelectionAtIndex_(index);
            this.selectedIndex_ = index;
        };
        /**
         * Sets aria attribute for single selection at given index.
         */
        MDCListFoundation.prototype.setAriaForSingleSelectionAtIndex_ = function (index) {
            // Detect the presence of aria-current and get the value only during list initialization when it is in unset state.
            if (this.selectedIndex_ === numbers.UNSET_INDEX) {
                this.ariaCurrentAttrValue_ =
                    this.adapter_.getAttributeForElementIndex(index, strings.ARIA_CURRENT);
            }
            var isAriaCurrent = this.ariaCurrentAttrValue_ !== null;
            var ariaAttribute = isAriaCurrent ? strings.ARIA_CURRENT : strings.ARIA_SELECTED;
            if (this.selectedIndex_ !== numbers.UNSET_INDEX) {
                this.adapter_.setAttributeForElementIndex(this.selectedIndex_, ariaAttribute, 'false');
            }
            var ariaAttributeValue = isAriaCurrent ? this.ariaCurrentAttrValue_ : 'true';
            this.adapter_.setAttributeForElementIndex(index, ariaAttribute, ariaAttributeValue);
        };
        /**
         * Toggles radio at give index. Radio doesn't change the checked state if it is already checked.
         */
        MDCListFoundation.prototype.setRadioAtIndex_ = function (index) {
            this.adapter_.setCheckedCheckboxOrRadioAtIndex(index, true);
            if (this.selectedIndex_ !== numbers.UNSET_INDEX) {
                this.adapter_.setAttributeForElementIndex(this.selectedIndex_, strings.ARIA_CHECKED, 'false');
            }
            this.adapter_.setAttributeForElementIndex(index, strings.ARIA_CHECKED, 'true');
            this.selectedIndex_ = index;
        };
        MDCListFoundation.prototype.setCheckboxAtIndex_ = function (index) {
            for (var i = 0; i < this.adapter_.getListItemCount(); i++) {
                var isChecked = false;
                if (index.indexOf(i) >= 0) {
                    isChecked = true;
                }
                this.adapter_.setCheckedCheckboxOrRadioAtIndex(i, isChecked);
                this.adapter_.setAttributeForElementIndex(i, strings.ARIA_CHECKED, isChecked ? 'true' : 'false');
            }
            this.selectedIndex_ = index;
        };
        MDCListFoundation.prototype.setTabindexAtIndex_ = function (index) {
            if (this.focusedItemIndex_ === numbers.UNSET_INDEX && index !== 0) {
                // If no list item was selected set first list item's tabindex to -1.
                // Generally, tabindex is set to 0 on first list item of list that has no preselected items.
                this.adapter_.setAttributeForElementIndex(0, 'tabindex', '-1');
            }
            else if (this.focusedItemIndex_ >= 0 && this.focusedItemIndex_ !== index) {
                this.adapter_.setAttributeForElementIndex(this.focusedItemIndex_, 'tabindex', '-1');
            }
            this.adapter_.setAttributeForElementIndex(index, 'tabindex', '0');
        };
        /**
         * @return Return true if it is single selectin list, checkbox list or radio list.
         */
        MDCListFoundation.prototype.isSelectableList_ = function () {
            return this.isSingleSelectionList_ || this.isCheckboxList_ || this.isRadioList_;
        };
        MDCListFoundation.prototype.setTabindexToFirstSelectedItem_ = function () {
            var targetIndex = 0;
            if (this.isSelectableList_()) {
                if (typeof this.selectedIndex_ === 'number' && this.selectedIndex_ !== numbers.UNSET_INDEX) {
                    targetIndex = this.selectedIndex_;
                }
                else if (isNumberArray(this.selectedIndex_) && this.selectedIndex_.length > 0) {
                    targetIndex = this.selectedIndex_.reduce(function (currentIndex, minIndex) { return Math.min(currentIndex, minIndex); });
                }
            }
            this.setTabindexAtIndex_(targetIndex);
        };
        MDCListFoundation.prototype.isIndexValid_ = function (index) {
            var _this = this;
            if (index instanceof Array) {
                if (!this.isCheckboxList_) {
                    throw new Error('MDCListFoundation: Array of index is only supported for checkbox based list');
                }
                if (index.length === 0) {
                    return true;
                }
                else {
                    return index.some(function (i) { return _this.isIndexInRange_(i); });
                }
            }
            else if (typeof index === 'number') {
                if (this.isCheckboxList_) {
                    throw new Error('MDCListFoundation: Expected array of index for checkbox based list but got number: ' + index);
                }
                return this.isIndexInRange_(index);
            }
            else {
                return false;
            }
        };
        MDCListFoundation.prototype.isIndexInRange_ = function (index) {
            var listSize = this.adapter_.getListItemCount();
            return index >= 0 && index < listSize;
        };
        MDCListFoundation.prototype.setSelectedIndexOnAction_ = function (index, toggleCheckbox) {
            if (toggleCheckbox === void 0) { toggleCheckbox = true; }
            if (this.isCheckboxList_) {
                this.toggleCheckboxAtIndex_(index, toggleCheckbox);
            }
            else {
                this.setSelectedIndex(index);
            }
        };
        MDCListFoundation.prototype.toggleCheckboxAtIndex_ = function (index, toggleCheckbox) {
            var isChecked = this.adapter_.isCheckboxCheckedAtIndex(index);
            if (toggleCheckbox) {
                isChecked = !isChecked;
                this.adapter_.setCheckedCheckboxOrRadioAtIndex(index, isChecked);
            }
            this.adapter_.setAttributeForElementIndex(index, strings.ARIA_CHECKED, isChecked ? 'true' : 'false');
            // If none of the checkbox items are selected and selectedIndex is not initialized then provide a default value.
            var selectedIndexes = this.selectedIndex_ === numbers.UNSET_INDEX ? [] : this.selectedIndex_.slice();
            if (isChecked) {
                selectedIndexes.push(index);
            }
            else {
                selectedIndexes = selectedIndexes.filter(function (i) { return i !== index; });
            }
            this.selectedIndex_ = selectedIndexes;
        };
        return MDCListFoundation;
    }(MDCFoundation));

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCList = /** @class */ (function (_super) {
        __extends(MDCList, _super);
        function MDCList() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(MDCList.prototype, "vertical", {
            set: function (value) {
                this.foundation_.setVerticalOrientation(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "listElements", {
            get: function () {
                return [].slice.call(this.root_.querySelectorAll("." + cssClasses.LIST_ITEM_CLASS));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "wrapFocus", {
            set: function (value) {
                this.foundation_.setWrapFocus(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "singleSelection", {
            set: function (isSingleSelectionList) {
                this.foundation_.setSingleSelection(isSingleSelectionList);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "selectedIndex", {
            get: function () {
                return this.foundation_.getSelectedIndex();
            },
            set: function (index) {
                this.foundation_.setSelectedIndex(index);
            },
            enumerable: true,
            configurable: true
        });
        MDCList.attachTo = function (root) {
            return new MDCList(root);
        };
        MDCList.prototype.initialSyncWithDOM = function () {
            this.handleClick_ = this.handleClickEvent_.bind(this);
            this.handleKeydown_ = this.handleKeydownEvent_.bind(this);
            this.focusInEventListener_ = this.handleFocusInEvent_.bind(this);
            this.focusOutEventListener_ = this.handleFocusOutEvent_.bind(this);
            this.listen('keydown', this.handleKeydown_);
            this.listen('click', this.handleClick_);
            this.listen('focusin', this.focusInEventListener_);
            this.listen('focusout', this.focusOutEventListener_);
            this.layout();
            this.initializeListType();
        };
        MDCList.prototype.destroy = function () {
            this.unlisten('keydown', this.handleKeydown_);
            this.unlisten('click', this.handleClick_);
            this.unlisten('focusin', this.focusInEventListener_);
            this.unlisten('focusout', this.focusOutEventListener_);
        };
        MDCList.prototype.layout = function () {
            var direction = this.root_.getAttribute(strings.ARIA_ORIENTATION);
            this.vertical = direction !== strings.ARIA_ORIENTATION_HORIZONTAL;
            // List items need to have at least tabindex=-1 to be focusable.
            [].slice.call(this.root_.querySelectorAll('.mdc-list-item:not([tabindex])'))
                .forEach(function (el) {
                el.setAttribute('tabindex', '-1');
            });
            // Child button/a elements are not tabbable until the list item is focused.
            [].slice.call(this.root_.querySelectorAll(strings.FOCUSABLE_CHILD_ELEMENTS))
                .forEach(function (el) { return el.setAttribute('tabindex', '-1'); });
            this.foundation_.layout();
        };
        /**
         * Initialize selectedIndex value based on pre-selected checkbox list items, single selection or radio.
         */
        MDCList.prototype.initializeListType = function () {
            var _this = this;
            var checkboxListItems = this.root_.querySelectorAll(strings.ARIA_ROLE_CHECKBOX_SELECTOR);
            var singleSelectedListItem = this.root_.querySelector("\n      ." + cssClasses.LIST_ITEM_ACTIVATED_CLASS + ",\n      ." + cssClasses.LIST_ITEM_SELECTED_CLASS + "\n    ");
            var radioSelectedListItem = this.root_.querySelector(strings.ARIA_CHECKED_RADIO_SELECTOR);
            if (checkboxListItems.length) {
                var preselectedItems = this.root_.querySelectorAll(strings.ARIA_CHECKED_CHECKBOX_SELECTOR);
                this.selectedIndex =
                    [].map.call(preselectedItems, function (listItem) { return _this.listElements.indexOf(listItem); });
            }
            else if (singleSelectedListItem) {
                if (singleSelectedListItem.classList.contains(cssClasses.LIST_ITEM_ACTIVATED_CLASS)) {
                    this.foundation_.setUseActivatedClass(true);
                }
                this.singleSelection = true;
                this.selectedIndex = this.listElements.indexOf(singleSelectedListItem);
            }
            else if (radioSelectedListItem) {
                this.selectedIndex = this.listElements.indexOf(radioSelectedListItem);
            }
        };
        /**
         * Updates the list item at itemIndex to the desired isEnabled state.
         * @param itemIndex Index of the list item
         * @param isEnabled Sets the list item to enabled or disabled.
         */
        MDCList.prototype.setEnabled = function (itemIndex, isEnabled) {
            this.foundation_.setEnabled(itemIndex, isEnabled);
        };
        MDCList.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addClassForElementIndex: function (index, className) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.classList.add(className);
                    }
                },
                focusItemAtIndex: function (index) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.focus();
                    }
                },
                getAttributeForElementIndex: function (index, attr) { return _this.listElements[index].getAttribute(attr); },
                getFocusedElementIndex: function () { return _this.listElements.indexOf(document.activeElement); },
                getListItemCount: function () { return _this.listElements.length; },
                hasCheckboxAtIndex: function (index) {
                    var listItem = _this.listElements[index];
                    return !!listItem.querySelector(strings.CHECKBOX_SELECTOR);
                },
                hasRadioAtIndex: function (index) {
                    var listItem = _this.listElements[index];
                    return !!listItem.querySelector(strings.RADIO_SELECTOR);
                },
                isCheckboxCheckedAtIndex: function (index) {
                    var listItem = _this.listElements[index];
                    var toggleEl = listItem.querySelector(strings.CHECKBOX_SELECTOR);
                    return toggleEl.checked;
                },
                isFocusInsideList: function () {
                    return _this.root_.contains(document.activeElement);
                },
                isRootFocused: function () { return document.activeElement === _this.root_; },
                notifyAction: function (index) {
                    _this.emit(strings.ACTION_EVENT, { index: index }, /** shouldBubble */ true);
                },
                removeClassForElementIndex: function (index, className) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.classList.remove(className);
                    }
                },
                setAttributeForElementIndex: function (index, attr, value) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.setAttribute(attr, value);
                    }
                },
                setCheckedCheckboxOrRadioAtIndex: function (index, isChecked) {
                    var listItem = _this.listElements[index];
                    var toggleEl = listItem.querySelector(strings.CHECKBOX_RADIO_SELECTOR);
                    toggleEl.checked = isChecked;
                    var event = document.createEvent('Event');
                    event.initEvent('change', true, true);
                    toggleEl.dispatchEvent(event);
                },
                setTabIndexForListItemChildren: function (listItemIndex, tabIndexValue) {
                    var element = _this.listElements[listItemIndex];
                    var listItemChildren = [].slice.call(element.querySelectorAll(strings.CHILD_ELEMENTS_TO_TOGGLE_TABINDEX));
                    listItemChildren.forEach(function (el) { return el.setAttribute('tabindex', tabIndexValue); });
                },
            };
            return new MDCListFoundation(adapter);
        };
        /**
         * Used to figure out which list item this event is targetting. Or returns -1 if
         * there is no list item
         */
        MDCList.prototype.getListItemIndex_ = function (evt) {
            var eventTarget = evt.target;
            var nearestParent = closest(eventTarget, "." + cssClasses.LIST_ITEM_CLASS + ", ." + cssClasses.ROOT);
            // Get the index of the element if it is a list item.
            if (nearestParent && matches(nearestParent, "." + cssClasses.LIST_ITEM_CLASS)) {
                return this.listElements.indexOf(nearestParent);
            }
            return -1;
        };
        /**
         * Used to figure out which element was clicked before sending the event to the foundation.
         */
        MDCList.prototype.handleFocusInEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            this.foundation_.handleFocusIn(evt, index);
        };
        /**
         * Used to figure out which element was clicked before sending the event to the foundation.
         */
        MDCList.prototype.handleFocusOutEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            this.foundation_.handleFocusOut(evt, index);
        };
        /**
         * Used to figure out which element was focused when keydown event occurred before sending the event to the
         * foundation.
         */
        MDCList.prototype.handleKeydownEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            var target = evt.target;
            this.foundation_.handleKeydown(evt, target.classList.contains(cssClasses.LIST_ITEM_CLASS), index);
        };
        /**
         * Used to figure out which element was clicked before sending the event to the foundation.
         */
        MDCList.prototype.handleClickEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            var target = evt.target;
            // Toggle the checkbox only if it's not the target of the event, or the checkbox will have 2 change events.
            var toggleCheckbox = !matches(target, strings.CHECKBOX_RADIO_SELECTOR);
            this.foundation_.handleClick(index, toggleCheckbox);
        };
        return MDCList;
    }(MDCComponent));

    function forwardEventsBuilder(component, additionalEvents = []) {
      const events = [
        'focus', 'blur',
        'fullscreenchange', 'fullscreenerror', 'scroll',
        'cut', 'copy', 'paste',
        'keydown', 'keypress', 'keyup',
        'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
        'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
        'touchcancel', 'touchend', 'touchmove', 'touchstart',
        'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture',
        ...additionalEvents
      ];

      function forward(e) {
        bubble(component, e);
      }

      return node => {
        const destructors = [];

        for (let i = 0; i < events.length; i++) {
          destructors.push(listen(node, events[i], forward));
        }

        return {
          destroy: () => {
            for (let i = 0; i < destructors.length; i++) {
              destructors[i]();
            }
          }
        }
      };
    }

    function exclude(obj, keys) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const cashIndex = name.indexOf('$');
        if (cashIndex !== -1 && keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
          continue;
        }
        if (keys.indexOf(name) !== -1) {
          continue;
        }
        newObj[name] = obj[name];
      }

      return newObj;
    }

    function useActions(node, actions) {
      let objects = [];

      if (actions) {
        for (let i = 0; i < actions.length; i++) {
          const isArray = Array.isArray(actions[i]);
          const action = isArray ? actions[i][0] : actions[i];
          if (isArray && actions[i].length > 1) {
            objects.push(action(node, actions[i][1]));
          } else {
            objects.push(action(node));
          }
        }
      }

      return {
        update(actions) {
          if ((actions && actions.length || 0) != objects.length) {
            throw new Error('You must not change the length of an actions array.');
          }

          if (actions) {
            for (let i = 0; i < actions.length; i++) {
              if (objects[i] && 'update' in objects[i]) {
                const isArray = Array.isArray(actions[i]);
                if (isArray && actions[i].length > 1) {
                  objects[i].update(actions[i][1]);
                } else {
                  objects[i].update();
                }
              }
            }
          }
        },

        destroy() {
          for (let i = 0; i < objects.length; i++) {
            if (objects[i] && 'destroy' in objects[i]) {
              objects[i].destroy();
            }
          }
        }
      }
    }

    /* node_modules/@smui/list/List.svelte generated by Svelte v3.31.0 */
    const file$a = "node_modules/@smui/list/List.svelte";

    // (18:0) {:else}
    function create_else_block$1(ctx) {
    	let ul;
    	let ul_class_value;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[24].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], null);

    	let ul_levels = [
    		{
    			class: ul_class_value = "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    			? "mdc-list--non-interactive"
    			: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    			? "smui-list--three-line"
    			: "") + "\n    "
    		},
    		{ role: /*role*/ ctx[8] },
    		/*props*/ ctx[9]
    	];

    	let ul_data = {};

    	for (let i = 0; i < ul_levels.length; i += 1) {
    		ul_data = assign(ul_data, ul_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			set_attributes(ul, ul_data);
    			add_location(ul, file$a, 18, 2, 478);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			/*ul_binding*/ ctx[26](ul);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, ul, /*use*/ ctx[0])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[10].call(null, ul)),
    					listen_dev(ul, "MDCList:action", /*handleAction*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 8388608) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[23], dirty, null, null);
    				}
    			}

    			set_attributes(ul, ul_data = get_spread_update(ul_levels, [
    				(!current || dirty[0] & /*className, nonInteractive, dense, avatarList, twoLine, threeLine*/ 126 && ul_class_value !== (ul_class_value = "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    				? "mdc-list--non-interactive"
    				: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    				? "smui-list--three-line"
    				: "") + "\n    ")) && { class: ul_class_value },
    				(!current || dirty[0] & /*role*/ 256) && { role: /*role*/ ctx[8] },
    				dirty[0] & /*props*/ 512 && /*props*/ ctx[9]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty[0] & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (default_slot) default_slot.d(detaching);
    			/*ul_binding*/ ctx[26](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(18:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (1:0) {#if nav}
    function create_if_block$1(ctx) {
    	let nav_1;
    	let nav_1_class_value;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[24].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], null);

    	let nav_1_levels = [
    		{
    			class: nav_1_class_value = "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    			? "mdc-list--non-interactive"
    			: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    			? "smui-list--three-line"
    			: "") + "\n    "
    		},
    		/*props*/ ctx[9]
    	];

    	let nav_1_data = {};

    	for (let i = 0; i < nav_1_levels.length; i += 1) {
    		nav_1_data = assign(nav_1_data, nav_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			nav_1 = element("nav");
    			if (default_slot) default_slot.c();
    			set_attributes(nav_1, nav_1_data);
    			add_location(nav_1, file$a, 1, 2, 12);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav_1, anchor);

    			if (default_slot) {
    				default_slot.m(nav_1, null);
    			}

    			/*nav_1_binding*/ ctx[25](nav_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, nav_1, /*use*/ ctx[0])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[10].call(null, nav_1)),
    					listen_dev(nav_1, "MDCList:action", /*handleAction*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 8388608) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[23], dirty, null, null);
    				}
    			}

    			set_attributes(nav_1, nav_1_data = get_spread_update(nav_1_levels, [
    				(!current || dirty[0] & /*className, nonInteractive, dense, avatarList, twoLine, threeLine*/ 126 && nav_1_class_value !== (nav_1_class_value = "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    				? "mdc-list--non-interactive"
    				: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    				? "smui-list--three-line"
    				: "") + "\n    ")) && { class: nav_1_class_value },
    				dirty[0] & /*props*/ 512 && /*props*/ ctx[9]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty[0] & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav_1);
    			if (default_slot) default_slot.d(detaching);
    			/*nav_1_binding*/ ctx[25](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(1:0) {#if nav}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*nav*/ ctx[11]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, ['default']);
    	const forwardEvents = forwardEventsBuilder(get_current_component(), ["MDCList:action"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { nonInteractive = false } = $$props;
    	let { dense = false } = $$props;
    	let { avatarList = false } = $$props;
    	let { twoLine = false } = $$props;
    	let { threeLine = false } = $$props;
    	let { vertical = true } = $$props;
    	let { wrapFocus = false } = $$props;
    	let { singleSelection = false } = $$props;
    	let { selectedIndex = null } = $$props;
    	let { radiolist = false } = $$props;
    	let { checklist = false } = $$props;
    	let element;
    	let list;
    	let role = getContext("SMUI:list:role");
    	let nav = getContext("SMUI:list:nav");
    	let instantiate = getContext("SMUI:list:instantiate");
    	let getInstance = getContext("SMUI:list:getInstance");
    	let addLayoutListener = getContext("SMUI:addLayoutListener");
    	let removeLayoutListener;
    	setContext("SMUI:list:nonInteractive", nonInteractive);

    	if (!role) {
    		if (singleSelection) {
    			role = "listbox";
    			setContext("SMUI:list:item:role", "option");
    		} else if (radiolist) {
    			role = "radiogroup";
    			setContext("SMUI:list:item:role", "radio");
    		} else if (checklist) {
    			role = "group";
    			setContext("SMUI:list:item:role", "checkbox");
    		} else {
    			role = "list";
    			setContext("SMUI:list:item:role", undefined);
    		}
    	}

    	if (addLayoutListener) {
    		removeLayoutListener = addLayoutListener(layout);
    	}

    	onMount(async () => {
    		if (instantiate !== false) {
    			$$invalidate(22, list = new MDCList(element));
    		} else {
    			$$invalidate(22, list = await getInstance());
    		}

    		if (singleSelection) {
    			list.initializeListType();
    			$$invalidate(13, selectedIndex = list.selectedIndex);
    		}
    	});

    	onDestroy(() => {
    		if (instantiate !== false) {
    			list && list.destroy();
    		}

    		if (removeLayoutListener) {
    			removeLayoutListener();
    		}
    	});

    	function handleAction(e) {
    		if (list && list.listElements[e.detail.index].classList.contains("mdc-list-item--disabled")) {
    			e.preventDefault();
    			$$invalidate(22, list.selectedIndex = selectedIndex, list);
    		} else if (list && list.selectedIndex === e.detail.index) {
    			$$invalidate(13, selectedIndex = e.detail.index);
    		}
    	}

    	function layout(...args) {
    		return list.layout(...args);
    	}

    	function setEnabled(...args) {
    		return list.setEnabled(...args);
    	}

    	function getDefaultFoundation(...args) {
    		return list.getDefaultFoundation(...args);
    	}

    	function nav_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(7, element);
    		});
    	}

    	function ul_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(7, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(31, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("nonInteractive" in $$new_props) $$invalidate(2, nonInteractive = $$new_props.nonInteractive);
    		if ("dense" in $$new_props) $$invalidate(3, dense = $$new_props.dense);
    		if ("avatarList" in $$new_props) $$invalidate(4, avatarList = $$new_props.avatarList);
    		if ("twoLine" in $$new_props) $$invalidate(5, twoLine = $$new_props.twoLine);
    		if ("threeLine" in $$new_props) $$invalidate(6, threeLine = $$new_props.threeLine);
    		if ("vertical" in $$new_props) $$invalidate(14, vertical = $$new_props.vertical);
    		if ("wrapFocus" in $$new_props) $$invalidate(15, wrapFocus = $$new_props.wrapFocus);
    		if ("singleSelection" in $$new_props) $$invalidate(16, singleSelection = $$new_props.singleSelection);
    		if ("selectedIndex" in $$new_props) $$invalidate(13, selectedIndex = $$new_props.selectedIndex);
    		if ("radiolist" in $$new_props) $$invalidate(17, radiolist = $$new_props.radiolist);
    		if ("checklist" in $$new_props) $$invalidate(18, checklist = $$new_props.checklist);
    		if ("$$scope" in $$new_props) $$invalidate(23, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		MDCList,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		nonInteractive,
    		dense,
    		avatarList,
    		twoLine,
    		threeLine,
    		vertical,
    		wrapFocus,
    		singleSelection,
    		selectedIndex,
    		radiolist,
    		checklist,
    		element,
    		list,
    		role,
    		nav,
    		instantiate,
    		getInstance,
    		addLayoutListener,
    		removeLayoutListener,
    		handleAction,
    		layout,
    		setEnabled,
    		getDefaultFoundation,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(31, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("nonInteractive" in $$props) $$invalidate(2, nonInteractive = $$new_props.nonInteractive);
    		if ("dense" in $$props) $$invalidate(3, dense = $$new_props.dense);
    		if ("avatarList" in $$props) $$invalidate(4, avatarList = $$new_props.avatarList);
    		if ("twoLine" in $$props) $$invalidate(5, twoLine = $$new_props.twoLine);
    		if ("threeLine" in $$props) $$invalidate(6, threeLine = $$new_props.threeLine);
    		if ("vertical" in $$props) $$invalidate(14, vertical = $$new_props.vertical);
    		if ("wrapFocus" in $$props) $$invalidate(15, wrapFocus = $$new_props.wrapFocus);
    		if ("singleSelection" in $$props) $$invalidate(16, singleSelection = $$new_props.singleSelection);
    		if ("selectedIndex" in $$props) $$invalidate(13, selectedIndex = $$new_props.selectedIndex);
    		if ("radiolist" in $$props) $$invalidate(17, radiolist = $$new_props.radiolist);
    		if ("checklist" in $$props) $$invalidate(18, checklist = $$new_props.checklist);
    		if ("element" in $$props) $$invalidate(7, element = $$new_props.element);
    		if ("list" in $$props) $$invalidate(22, list = $$new_props.list);
    		if ("role" in $$props) $$invalidate(8, role = $$new_props.role);
    		if ("nav" in $$props) $$invalidate(11, nav = $$new_props.nav);
    		if ("instantiate" in $$props) instantiate = $$new_props.instantiate;
    		if ("getInstance" in $$props) getInstance = $$new_props.getInstance;
    		if ("addLayoutListener" in $$props) addLayoutListener = $$new_props.addLayoutListener;
    		if ("removeLayoutListener" in $$props) removeLayoutListener = $$new_props.removeLayoutListener;
    		if ("props" in $$props) $$invalidate(9, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(9, props = exclude($$props, [
    			"use",
    			"class",
    			"nonInteractive",
    			"dense",
    			"avatarList",
    			"twoLine",
    			"threeLine",
    			"vertical",
    			"wrapFocus",
    			"singleSelection",
    			"selectedIndex",
    			"radiolist",
    			"checklist"
    		]));

    		if ($$self.$$.dirty[0] & /*list, vertical*/ 4210688) {
    			 if (list && list.vertical !== vertical) {
    				$$invalidate(22, list.vertical = vertical, list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*list, wrapFocus*/ 4227072) {
    			 if (list && list.wrapFocus !== wrapFocus) {
    				$$invalidate(22, list.wrapFocus = wrapFocus, list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*list, singleSelection*/ 4259840) {
    			 if (list && list.singleSelection !== singleSelection) {
    				$$invalidate(22, list.singleSelection = singleSelection, list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*list, singleSelection, selectedIndex*/ 4268032) {
    			 if (list && singleSelection && list.selectedIndex !== selectedIndex) {
    				$$invalidate(22, list.selectedIndex = selectedIndex, list);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		nonInteractive,
    		dense,
    		avatarList,
    		twoLine,
    		threeLine,
    		element,
    		role,
    		props,
    		forwardEvents,
    		nav,
    		handleAction,
    		selectedIndex,
    		vertical,
    		wrapFocus,
    		singleSelection,
    		radiolist,
    		checklist,
    		layout,
    		setEnabled,
    		getDefaultFoundation,
    		list,
    		$$scope,
    		slots,
    		nav_1_binding,
    		ul_binding
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$b,
    			create_fragment$b,
    			safe_not_equal,
    			{
    				use: 0,
    				class: 1,
    				nonInteractive: 2,
    				dense: 3,
    				avatarList: 4,
    				twoLine: 5,
    				threeLine: 6,
    				vertical: 14,
    				wrapFocus: 15,
    				singleSelection: 16,
    				selectedIndex: 13,
    				radiolist: 17,
    				checklist: 18,
    				layout: 19,
    				setEnabled: 20,
    				getDefaultFoundation: 21
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get use() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nonInteractive() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nonInteractive(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get avatarList() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set avatarList(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get twoLine() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set twoLine(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get threeLine() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set threeLine(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wrapFocus() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wrapFocus(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get singleSelection() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set singleSelection(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIndex() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radiolist() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radiolist(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checklist() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checklist(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		return this.$$.ctx[19];
    	}

    	set layout(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setEnabled() {
    		return this.$$.ctx[20];
    	}

    	set setEnabled(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getDefaultFoundation() {
    		return this.$$.ctx[21];
    	}

    	set getDefaultFoundation(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Stores result from supportsCssVariables to avoid redundant processing to
     * detect CSS custom variable support.
     */
    var supportsCssVariables_;
    function detectEdgePseudoVarBug(windowObj) {
        // Detect versions of Edge with buggy var() support
        // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
        var document = windowObj.document;
        var node = document.createElement('div');
        node.className = 'mdc-ripple-surface--test-edge-var-bug';
        // Append to head instead of body because this script might be invoked in the
        // head, in which case the body doesn't exist yet. The probe works either way.
        document.head.appendChild(node);
        // The bug exists if ::before style ends up propagating to the parent element.
        // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
        // but Firefox is known to support CSS custom properties correctly.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
        var computedStyle = windowObj.getComputedStyle(node);
        var hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        return hasPseudoVarBug;
    }
    function supportsCssVariables(windowObj, forceRefresh) {
        if (forceRefresh === void 0) { forceRefresh = false; }
        var CSS = windowObj.CSS;
        var supportsCssVars = supportsCssVariables_;
        if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
            return supportsCssVariables_;
        }
        var supportsFunctionPresent = CSS && typeof CSS.supports === 'function';
        if (!supportsFunctionPresent) {
            return false;
        }
        var explicitlySupportsCssVars = CSS.supports('--css-vars', 'yes');
        // See: https://bugs.webkit.org/show_bug.cgi?id=154669
        // See: README section on Safari
        var weAreFeatureDetectingSafari10plus = (CSS.supports('(--css-vars: yes)') &&
            CSS.supports('color', '#00000000'));
        if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
            supportsCssVars = !detectEdgePseudoVarBug(windowObj);
        }
        else {
            supportsCssVars = false;
        }
        if (!forceRefresh) {
            supportsCssVariables_ = supportsCssVars;
        }
        return supportsCssVars;
    }
    function getNormalizedEventCoords(evt, pageOffset, clientRect) {
        if (!evt) {
            return { x: 0, y: 0 };
        }
        var x = pageOffset.x, y = pageOffset.y;
        var documentX = x + clientRect.left;
        var documentY = y + clientRect.top;
        var normalizedX;
        var normalizedY;
        // Determine touch point relative to the ripple container.
        if (evt.type === 'touchstart') {
            var touchEvent = evt;
            normalizedX = touchEvent.changedTouches[0].pageX - documentX;
            normalizedY = touchEvent.changedTouches[0].pageY - documentY;
        }
        else {
            var mouseEvent = evt;
            normalizedX = mouseEvent.pageX - documentX;
            normalizedY = mouseEvent.pageY - documentY;
        }
        return { x: normalizedX, y: normalizedY };
    }

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * Stores result from applyPassive to avoid redundant processing to detect
     * passive event listener support.
     */
    var supportsPassive_;
    /**
     * Determine whether the current browser supports passive event listeners, and
     * if so, use them.
     */
    function applyPassive(globalObj, forceRefresh) {
        if (globalObj === void 0) { globalObj = window; }
        if (forceRefresh === void 0) { forceRefresh = false; }
        if (supportsPassive_ === undefined || forceRefresh) {
            var isSupported_1 = false;
            try {
                globalObj.document.addEventListener('test', function () { return undefined; }, {
                    get passive() {
                        isSupported_1 = true;
                        return isSupported_1;
                    },
                });
            }
            catch (e) {
            } // tslint:disable-line:no-empty cannot throw error due to tests. tslint also disables console.log.
            supportsPassive_ = isSupported_1;
        }
        return supportsPassive_ ? { passive: true } : false;
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$1 = {
        // Ripple is a special case where the "root" component is really a "mixin" of sorts,
        // given that it's an 'upgrade' to an existing component. That being said it is the root
        // CSS class that all other CSS classes derive from.
        BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
        FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
        FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
        ROOT: 'mdc-ripple-upgraded',
        UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
    };
    var strings$1 = {
        VAR_FG_SCALE: '--mdc-ripple-fg-scale',
        VAR_FG_SIZE: '--mdc-ripple-fg-size',
        VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
        VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
        VAR_LEFT: '--mdc-ripple-left',
        VAR_TOP: '--mdc-ripple-top',
    };
    var numbers$1 = {
        DEACTIVATION_TIMEOUT_MS: 225,
        FG_DEACTIVATION_MS: 150,
        INITIAL_ORIGIN_SCALE: 0.6,
        PADDING: 10,
        TAP_DELAY_MS: 300,
    };

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    // Activation events registered on the root element of each instance for activation
    var ACTIVATION_EVENT_TYPES = [
        'touchstart', 'pointerdown', 'mousedown', 'keydown',
    ];
    // Deactivation events registered on documentElement when a pointer-related down event occurs
    var POINTER_DEACTIVATION_EVENT_TYPES = [
        'touchend', 'pointerup', 'mouseup', 'contextmenu',
    ];
    // simultaneous nested activations
    var activatedTargets = [];
    var MDCRippleFoundation = /** @class */ (function (_super) {
        __extends(MDCRippleFoundation, _super);
        function MDCRippleFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCRippleFoundation.defaultAdapter, adapter)) || this;
            _this.activationAnimationHasEnded_ = false;
            _this.activationTimer_ = 0;
            _this.fgDeactivationRemovalTimer_ = 0;
            _this.fgScale_ = '0';
            _this.frame_ = { width: 0, height: 0 };
            _this.initialSize_ = 0;
            _this.layoutFrame_ = 0;
            _this.maxRadius_ = 0;
            _this.unboundedCoords_ = { left: 0, top: 0 };
            _this.activationState_ = _this.defaultActivationState_();
            _this.activationTimerCallback_ = function () {
                _this.activationAnimationHasEnded_ = true;
                _this.runDeactivationUXLogicIfReady_();
            };
            _this.activateHandler_ = function (e) { return _this.activate_(e); };
            _this.deactivateHandler_ = function () { return _this.deactivate_(); };
            _this.focusHandler_ = function () { return _this.handleFocus(); };
            _this.blurHandler_ = function () { return _this.handleBlur(); };
            _this.resizeHandler_ = function () { return _this.layout(); };
            return _this;
        }
        Object.defineProperty(MDCRippleFoundation, "cssClasses", {
            get: function () {
                return cssClasses$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "strings", {
            get: function () {
                return strings$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "numbers", {
            get: function () {
                return numbers$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    browserSupportsCssVars: function () { return true; },
                    computeBoundingRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    containsEventTarget: function () { return true; },
                    deregisterDocumentInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    deregisterResizeHandler: function () { return undefined; },
                    getWindowPageOffset: function () { return ({ x: 0, y: 0 }); },
                    isSurfaceActive: function () { return true; },
                    isSurfaceDisabled: function () { return true; },
                    isUnbounded: function () { return true; },
                    registerDocumentInteractionHandler: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                    registerResizeHandler: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    updateCssVariable: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCRippleFoundation.prototype.init = function () {
            var _this = this;
            var supportsPressRipple = this.supportsPressRipple_();
            this.registerRootHandlers_(supportsPressRipple);
            if (supportsPressRipple) {
                var _a = MDCRippleFoundation.cssClasses, ROOT_1 = _a.ROOT, UNBOUNDED_1 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.addClass(ROOT_1);
                    if (_this.adapter_.isUnbounded()) {
                        _this.adapter_.addClass(UNBOUNDED_1);
                        // Unbounded ripples need layout logic applied immediately to set coordinates for both shade and ripple
                        _this.layoutInternal_();
                    }
                });
            }
        };
        MDCRippleFoundation.prototype.destroy = function () {
            var _this = this;
            if (this.supportsPressRipple_()) {
                if (this.activationTimer_) {
                    clearTimeout(this.activationTimer_);
                    this.activationTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_ACTIVATION);
                }
                if (this.fgDeactivationRemovalTimer_) {
                    clearTimeout(this.fgDeactivationRemovalTimer_);
                    this.fgDeactivationRemovalTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_DEACTIVATION);
                }
                var _a = MDCRippleFoundation.cssClasses, ROOT_2 = _a.ROOT, UNBOUNDED_2 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.removeClass(ROOT_2);
                    _this.adapter_.removeClass(UNBOUNDED_2);
                    _this.removeCssVars_();
                });
            }
            this.deregisterRootHandlers_();
            this.deregisterDeactivationHandlers_();
        };
        /**
         * @param evt Optional event containing position information.
         */
        MDCRippleFoundation.prototype.activate = function (evt) {
            this.activate_(evt);
        };
        MDCRippleFoundation.prototype.deactivate = function () {
            this.deactivate_();
        };
        MDCRippleFoundation.prototype.layout = function () {
            var _this = this;
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
            }
            this.layoutFrame_ = requestAnimationFrame(function () {
                _this.layoutInternal_();
                _this.layoutFrame_ = 0;
            });
        };
        MDCRippleFoundation.prototype.setUnbounded = function (unbounded) {
            var UNBOUNDED = MDCRippleFoundation.cssClasses.UNBOUNDED;
            if (unbounded) {
                this.adapter_.addClass(UNBOUNDED);
            }
            else {
                this.adapter_.removeClass(UNBOUNDED);
            }
        };
        MDCRippleFoundation.prototype.handleFocus = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.addClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        MDCRippleFoundation.prototype.handleBlur = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.removeClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        /**
         * We compute this property so that we are not querying information about the client
         * until the point in time where the foundation requests it. This prevents scenarios where
         * client-side feature-detection may happen too early, such as when components are rendered on the server
         * and then initialized at mount time on the client.
         */
        MDCRippleFoundation.prototype.supportsPressRipple_ = function () {
            return this.adapter_.browserSupportsCssVars();
        };
        MDCRippleFoundation.prototype.defaultActivationState_ = function () {
            return {
                activationEvent: undefined,
                hasDeactivationUXRun: false,
                isActivated: false,
                isProgrammatic: false,
                wasActivatedByPointer: false,
                wasElementMadeActive: false,
            };
        };
        /**
         * supportsPressRipple Passed from init to save a redundant function call
         */
        MDCRippleFoundation.prototype.registerRootHandlers_ = function (supportsPressRipple) {
            var _this = this;
            if (supportsPressRipple) {
                ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerInteractionHandler(evtType, _this.activateHandler_);
                });
                if (this.adapter_.isUnbounded()) {
                    this.adapter_.registerResizeHandler(this.resizeHandler_);
                }
            }
            this.adapter_.registerInteractionHandler('focus', this.focusHandler_);
            this.adapter_.registerInteractionHandler('blur', this.blurHandler_);
        };
        MDCRippleFoundation.prototype.registerDeactivationHandlers_ = function (evt) {
            var _this = this;
            if (evt.type === 'keydown') {
                this.adapter_.registerInteractionHandler('keyup', this.deactivateHandler_);
            }
            else {
                POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerDocumentInteractionHandler(evtType, _this.deactivateHandler_);
                });
            }
        };
        MDCRippleFoundation.prototype.deregisterRootHandlers_ = function () {
            var _this = this;
            ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterInteractionHandler(evtType, _this.activateHandler_);
            });
            this.adapter_.deregisterInteractionHandler('focus', this.focusHandler_);
            this.adapter_.deregisterInteractionHandler('blur', this.blurHandler_);
            if (this.adapter_.isUnbounded()) {
                this.adapter_.deregisterResizeHandler(this.resizeHandler_);
            }
        };
        MDCRippleFoundation.prototype.deregisterDeactivationHandlers_ = function () {
            var _this = this;
            this.adapter_.deregisterInteractionHandler('keyup', this.deactivateHandler_);
            POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterDocumentInteractionHandler(evtType, _this.deactivateHandler_);
            });
        };
        MDCRippleFoundation.prototype.removeCssVars_ = function () {
            var _this = this;
            var rippleStrings = MDCRippleFoundation.strings;
            var keys = Object.keys(rippleStrings);
            keys.forEach(function (key) {
                if (key.indexOf('VAR_') === 0) {
                    _this.adapter_.updateCssVariable(rippleStrings[key], null);
                }
            });
        };
        MDCRippleFoundation.prototype.activate_ = function (evt) {
            var _this = this;
            if (this.adapter_.isSurfaceDisabled()) {
                return;
            }
            var activationState = this.activationState_;
            if (activationState.isActivated) {
                return;
            }
            // Avoid reacting to follow-on events fired by touch device after an already-processed user interaction
            var previousActivationEvent = this.previousActivationEvent_;
            var isSameInteraction = previousActivationEvent && evt !== undefined && previousActivationEvent.type !== evt.type;
            if (isSameInteraction) {
                return;
            }
            activationState.isActivated = true;
            activationState.isProgrammatic = evt === undefined;
            activationState.activationEvent = evt;
            activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== undefined && (evt.type === 'mousedown' || evt.type === 'touchstart' || evt.type === 'pointerdown');
            var hasActivatedChild = evt !== undefined && activatedTargets.length > 0 && activatedTargets.some(function (target) { return _this.adapter_.containsEventTarget(target); });
            if (hasActivatedChild) {
                // Immediately reset activation state, while preserving logic that prevents touch follow-on events
                this.resetActivationState_();
                return;
            }
            if (evt !== undefined) {
                activatedTargets.push(evt.target);
                this.registerDeactivationHandlers_(evt);
            }
            activationState.wasElementMadeActive = this.checkElementMadeActive_(evt);
            if (activationState.wasElementMadeActive) {
                this.animateActivation_();
            }
            requestAnimationFrame(function () {
                // Reset array on next frame after the current event has had a chance to bubble to prevent ancestor ripples
                activatedTargets = [];
                if (!activationState.wasElementMadeActive
                    && evt !== undefined
                    && (evt.key === ' ' || evt.keyCode === 32)) {
                    // If space was pressed, try again within an rAF call to detect :active, because different UAs report
                    // active states inconsistently when they're called within event handling code:
                    // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
                    // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
                    // We try first outside rAF to support Edge, which does not exhibit this problem, but will crash if a CSS
                    // variable is set within a rAF callback for a submit button interaction (#2241).
                    activationState.wasElementMadeActive = _this.checkElementMadeActive_(evt);
                    if (activationState.wasElementMadeActive) {
                        _this.animateActivation_();
                    }
                }
                if (!activationState.wasElementMadeActive) {
                    // Reset activation state immediately if element was not made active.
                    _this.activationState_ = _this.defaultActivationState_();
                }
            });
        };
        MDCRippleFoundation.prototype.checkElementMadeActive_ = function (evt) {
            return (evt !== undefined && evt.type === 'keydown') ? this.adapter_.isSurfaceActive() : true;
        };
        MDCRippleFoundation.prototype.animateActivation_ = function () {
            var _this = this;
            var _a = MDCRippleFoundation.strings, VAR_FG_TRANSLATE_START = _a.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a.VAR_FG_TRANSLATE_END;
            var _b = MDCRippleFoundation.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
            var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation.numbers.DEACTIVATION_TIMEOUT_MS;
            this.layoutInternal_();
            var translateStart = '';
            var translateEnd = '';
            if (!this.adapter_.isUnbounded()) {
                var _c = this.getFgTranslationCoordinates_(), startPoint = _c.startPoint, endPoint = _c.endPoint;
                translateStart = startPoint.x + "px, " + startPoint.y + "px";
                translateEnd = endPoint.x + "px, " + endPoint.y + "px";
            }
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
            // Cancel any ongoing activation/deactivation animations
            clearTimeout(this.activationTimer_);
            clearTimeout(this.fgDeactivationRemovalTimer_);
            this.rmBoundedActivationClasses_();
            this.adapter_.removeClass(FG_DEACTIVATION);
            // Force layout in order to re-trigger the animation.
            this.adapter_.computeBoundingRect();
            this.adapter_.addClass(FG_ACTIVATION);
            this.activationTimer_ = setTimeout(function () { return _this.activationTimerCallback_(); }, DEACTIVATION_TIMEOUT_MS);
        };
        MDCRippleFoundation.prototype.getFgTranslationCoordinates_ = function () {
            var _a = this.activationState_, activationEvent = _a.activationEvent, wasActivatedByPointer = _a.wasActivatedByPointer;
            var startPoint;
            if (wasActivatedByPointer) {
                startPoint = getNormalizedEventCoords(activationEvent, this.adapter_.getWindowPageOffset(), this.adapter_.computeBoundingRect());
            }
            else {
                startPoint = {
                    x: this.frame_.width / 2,
                    y: this.frame_.height / 2,
                };
            }
            // Center the element around the start point.
            startPoint = {
                x: startPoint.x - (this.initialSize_ / 2),
                y: startPoint.y - (this.initialSize_ / 2),
            };
            var endPoint = {
                x: (this.frame_.width / 2) - (this.initialSize_ / 2),
                y: (this.frame_.height / 2) - (this.initialSize_ / 2),
            };
            return { startPoint: startPoint, endPoint: endPoint };
        };
        MDCRippleFoundation.prototype.runDeactivationUXLogicIfReady_ = function () {
            var _this = this;
            // This method is called both when a pointing device is released, and when the activation animation ends.
            // The deactivation animation should only run after both of those occur.
            var FG_DEACTIVATION = MDCRippleFoundation.cssClasses.FG_DEACTIVATION;
            var _a = this.activationState_, hasDeactivationUXRun = _a.hasDeactivationUXRun, isActivated = _a.isActivated;
            var activationHasEnded = hasDeactivationUXRun || !isActivated;
            if (activationHasEnded && this.activationAnimationHasEnded_) {
                this.rmBoundedActivationClasses_();
                this.adapter_.addClass(FG_DEACTIVATION);
                this.fgDeactivationRemovalTimer_ = setTimeout(function () {
                    _this.adapter_.removeClass(FG_DEACTIVATION);
                }, numbers$1.FG_DEACTIVATION_MS);
            }
        };
        MDCRippleFoundation.prototype.rmBoundedActivationClasses_ = function () {
            var FG_ACTIVATION = MDCRippleFoundation.cssClasses.FG_ACTIVATION;
            this.adapter_.removeClass(FG_ACTIVATION);
            this.activationAnimationHasEnded_ = false;
            this.adapter_.computeBoundingRect();
        };
        MDCRippleFoundation.prototype.resetActivationState_ = function () {
            var _this = this;
            this.previousActivationEvent_ = this.activationState_.activationEvent;
            this.activationState_ = this.defaultActivationState_();
            // Touch devices may fire additional events for the same interaction within a short time.
            // Store the previous event until it's safe to assume that subsequent events are for new interactions.
            setTimeout(function () { return _this.previousActivationEvent_ = undefined; }, MDCRippleFoundation.numbers.TAP_DELAY_MS);
        };
        MDCRippleFoundation.prototype.deactivate_ = function () {
            var _this = this;
            var activationState = this.activationState_;
            // This can happen in scenarios such as when you have a keyup event that blurs the element.
            if (!activationState.isActivated) {
                return;
            }
            var state = __assign({}, activationState);
            if (activationState.isProgrammatic) {
                requestAnimationFrame(function () { return _this.animateDeactivation_(state); });
                this.resetActivationState_();
            }
            else {
                this.deregisterDeactivationHandlers_();
                requestAnimationFrame(function () {
                    _this.activationState_.hasDeactivationUXRun = true;
                    _this.animateDeactivation_(state);
                    _this.resetActivationState_();
                });
            }
        };
        MDCRippleFoundation.prototype.animateDeactivation_ = function (_a) {
            var wasActivatedByPointer = _a.wasActivatedByPointer, wasElementMadeActive = _a.wasElementMadeActive;
            if (wasActivatedByPointer || wasElementMadeActive) {
                this.runDeactivationUXLogicIfReady_();
            }
        };
        MDCRippleFoundation.prototype.layoutInternal_ = function () {
            var _this = this;
            this.frame_ = this.adapter_.computeBoundingRect();
            var maxDim = Math.max(this.frame_.height, this.frame_.width);
            // Surface diameter is treated differently for unbounded vs. bounded ripples.
            // Unbounded ripple diameter is calculated smaller since the surface is expected to already be padded appropriately
            // to extend the hitbox, and the ripple is expected to meet the edges of the padded hitbox (which is typically
            // square). Bounded ripples, on the other hand, are fully expected to expand beyond the surface's longest diameter
            // (calculated based on the diagonal plus a constant padding), and are clipped at the surface's border via
            // `overflow: hidden`.
            var getBoundedRadius = function () {
                var hypotenuse = Math.sqrt(Math.pow(_this.frame_.width, 2) + Math.pow(_this.frame_.height, 2));
                return hypotenuse + MDCRippleFoundation.numbers.PADDING;
            };
            this.maxRadius_ = this.adapter_.isUnbounded() ? maxDim : getBoundedRadius();
            // Ripple is sized as a fraction of the largest dimension of the surface, then scales up using a CSS scale transform
            this.initialSize_ = Math.floor(maxDim * MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE);
            this.fgScale_ = "" + this.maxRadius_ / this.initialSize_;
            this.updateLayoutCssVars_();
        };
        MDCRippleFoundation.prototype.updateLayoutCssVars_ = function () {
            var _a = MDCRippleFoundation.strings, VAR_FG_SIZE = _a.VAR_FG_SIZE, VAR_LEFT = _a.VAR_LEFT, VAR_TOP = _a.VAR_TOP, VAR_FG_SCALE = _a.VAR_FG_SCALE;
            this.adapter_.updateCssVariable(VAR_FG_SIZE, this.initialSize_ + "px");
            this.adapter_.updateCssVariable(VAR_FG_SCALE, this.fgScale_);
            if (this.adapter_.isUnbounded()) {
                this.unboundedCoords_ = {
                    left: Math.round((this.frame_.width / 2) - (this.initialSize_ / 2)),
                    top: Math.round((this.frame_.height / 2) - (this.initialSize_ / 2)),
                };
                this.adapter_.updateCssVariable(VAR_LEFT, this.unboundedCoords_.left + "px");
                this.adapter_.updateCssVariable(VAR_TOP, this.unboundedCoords_.top + "px");
            }
        };
        return MDCRippleFoundation;
    }(MDCFoundation));

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCRipple = /** @class */ (function (_super) {
        __extends(MDCRipple, _super);
        function MDCRipple() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.disabled = false;
            return _this;
        }
        MDCRipple.attachTo = function (root, opts) {
            if (opts === void 0) { opts = { isUnbounded: undefined }; }
            var ripple = new MDCRipple(root);
            // Only override unbounded behavior if option is explicitly specified
            if (opts.isUnbounded !== undefined) {
                ripple.unbounded = opts.isUnbounded;
            }
            return ripple;
        };
        MDCRipple.createAdapter = function (instance) {
            return {
                addClass: function (className) { return instance.root_.classList.add(className); },
                browserSupportsCssVars: function () { return supportsCssVariables(window); },
                computeBoundingRect: function () { return instance.root_.getBoundingClientRect(); },
                containsEventTarget: function (target) { return instance.root_.contains(target); },
                deregisterDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterInteractionHandler: function (evtType, handler) {
                    return instance.root_.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterResizeHandler: function (handler) { return window.removeEventListener('resize', handler); },
                getWindowPageOffset: function () { return ({ x: window.pageXOffset, y: window.pageYOffset }); },
                isSurfaceActive: function () { return matches(instance.root_, ':active'); },
                isSurfaceDisabled: function () { return Boolean(instance.disabled); },
                isUnbounded: function () { return Boolean(instance.unbounded); },
                registerDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.addEventListener(evtType, handler, applyPassive());
                },
                registerInteractionHandler: function (evtType, handler) {
                    return instance.root_.addEventListener(evtType, handler, applyPassive());
                },
                registerResizeHandler: function (handler) { return window.addEventListener('resize', handler); },
                removeClass: function (className) { return instance.root_.classList.remove(className); },
                updateCssVariable: function (varName, value) { return instance.root_.style.setProperty(varName, value); },
            };
        };
        Object.defineProperty(MDCRipple.prototype, "unbounded", {
            get: function () {
                return Boolean(this.unbounded_);
            },
            set: function (unbounded) {
                this.unbounded_ = Boolean(unbounded);
                this.setUnbounded_();
            },
            enumerable: true,
            configurable: true
        });
        MDCRipple.prototype.activate = function () {
            this.foundation_.activate();
        };
        MDCRipple.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        MDCRipple.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCRipple.prototype.getDefaultFoundation = function () {
            return new MDCRippleFoundation(MDCRipple.createAdapter(this));
        };
        MDCRipple.prototype.initialSyncWithDOM = function () {
            var root = this.root_;
            this.unbounded = 'mdcRippleIsUnbounded' in root.dataset;
        };
        /**
         * Closure Compiler throws an access control error when directly accessing a
         * protected or private property inside a getter/setter, like unbounded above.
         * By accessing the protected property inside a method, we solve that problem.
         * That's why this function exists.
         */
        MDCRipple.prototype.setUnbounded_ = function () {
            this.foundation_.setUnbounded(Boolean(this.unbounded_));
        };
        return MDCRipple;
    }(MDCComponent));

    function Ripple(node, props = {ripple: false, unbounded: false, color: null, classForward: () => {}}) {
      let instance = null;
      let addLayoutListener = getContext('SMUI:addLayoutListener');
      let removeLayoutListener;
      let classList = [];

      function addClass(className) {
        const idx = classList.indexOf(className);
        if (idx === -1) {
          node.classList.add(className);
          classList.push(className);
          if (props.classForward) {
            props.classForward(classList);
          }
        }
      }

      function removeClass(className) {
        const idx = classList.indexOf(className);
        if (idx !== -1) {
          node.classList.remove(className);
          classList.splice(idx, 1);
          if (props.classForward) {
            props.classForward(classList);
          }
        }
      }

      function handleProps() {
        if (props.ripple && !instance) {
          // Override the Ripple component's adapter, so that we can forward classes
          // to Svelte components that overwrite Ripple's classes.
          const _createAdapter = MDCRipple.createAdapter;
          MDCRipple.createAdapter = function(...args) {
            const adapter = _createAdapter.apply(this, args);
            adapter.addClass = function(className) {
              return addClass(className);
            };
            adapter.removeClass = function(className) {
              return removeClass(className);
            };
            return adapter;
          };
          instance = new MDCRipple(node);
          MDCRipple.createAdapter = _createAdapter;
        } else if (instance && !props.ripple) {
          instance.destroy();
          instance = null;
        }
        if (props.ripple) {
          instance.unbounded = !!props.unbounded;
          switch (props.color) {
            case 'surface':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'primary':
              addClass('mdc-ripple-surface');
              addClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'secondary':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              addClass('mdc-ripple-surface--accent');
              return;
          }
        }
        removeClass('mdc-ripple-surface');
        removeClass('mdc-ripple-surface--primary');
        removeClass('mdc-ripple-surface--accent');
      }

      handleProps();

      if (addLayoutListener) {
        removeLayoutListener = addLayoutListener(layout);
      }

      function layout() {
        if (instance) {
          instance.layout();
        }
      }

      return {
        update(newProps = {ripple: false, unbounded: false, color: null, classForward: []}) {
          props = newProps;
          handleProps();
        },

        destroy() {
          if (instance) {
            instance.destroy();
            instance = null;
            removeClass('mdc-ripple-surface');
            removeClass('mdc-ripple-surface--primary');
            removeClass('mdc-ripple-surface--accent');
          }

          if (removeLayoutListener) {
            removeLayoutListener();
          }
        }
      }
    }

    /* node_modules/@smui/list/Item.svelte generated by Svelte v3.31.0 */
    const file$b = "node_modules/@smui/list/Item.svelte";

    // (40:0) {:else}
    function create_else_block$2(ctx) {
    	let li;
    	let li_class_value;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[20].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

    	let li_levels = [
    		{
    			class: li_class_value = "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n      " + (/*role*/ ctx[6] === "menuitem" && /*selected*/ ctx[7]
    			? "mdc-menu-item--selected"
    			: "") + "\n    "
    		},
    		{ role: /*role*/ ctx[6] },
    		/*role*/ ctx[6] === "option"
    		? {
    				"aria-selected": /*selected*/ ctx[7] ? "true" : "false"
    			}
    		: {},
    		/*role*/ ctx[6] === "radio" || /*role*/ ctx[6] === "checkbox"
    		? {
    				"aria-checked": /*checked*/ ctx[10] ? "true" : "false"
    			}
    		: {},
    		{ tabindex: /*tabindex*/ ctx[0] },
    		/*props*/ ctx[12]
    	];

    	let li_data = {};

    	for (let i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (default_slot) default_slot.c();
    			set_attributes(li, li_data);
    			add_location(li, file$b, 40, 2, 1053);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			/*li_binding*/ ctx[23](li);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, li, /*use*/ ctx[1])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[13].call(null, li)),
    					action_destroyer(Ripple_action = Ripple.call(null, li, {
    						ripple: /*ripple*/ ctx[3],
    						unbounded: false,
    						color: /*color*/ ctx[4]
    					})),
    					listen_dev(li, "click", /*action*/ ctx[15], false, false, false),
    					listen_dev(li, "keydown", /*handleKeydown*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 524288) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
    				}
    			}

    			set_attributes(li, li_data = get_spread_update(li_levels, [
    				(!current || dirty & /*className, activated, selected, disabled, role*/ 484 && li_class_value !== (li_class_value = "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n      " + (/*role*/ ctx[6] === "menuitem" && /*selected*/ ctx[7]
    				? "mdc-menu-item--selected"
    				: "") + "\n    ")) && { class: li_class_value },
    				(!current || dirty & /*role*/ 64) && { role: /*role*/ ctx[6] },
    				dirty & /*role, selected*/ 192 && (/*role*/ ctx[6] === "option"
    				? {
    						"aria-selected": /*selected*/ ctx[7] ? "true" : "false"
    					}
    				: {}),
    				dirty & /*role, checked*/ 1088 && (/*role*/ ctx[6] === "radio" || /*role*/ ctx[6] === "checkbox"
    				? {
    						"aria-checked": /*checked*/ ctx[10] ? "true" : "false"
    					}
    				: {}),
    				(!current || dirty & /*tabindex*/ 1) && { tabindex: /*tabindex*/ ctx[0] },
    				dirty & /*props*/ 4096 && /*props*/ ctx[12]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, color*/ 24) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3],
    				unbounded: false,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot) default_slot.d(detaching);
    			/*li_binding*/ ctx[23](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(40:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:23) 
    function create_if_block_1(ctx) {
    	let span;
    	let span_class_value;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[20].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

    	let span_levels = [
    		{
    			class: span_class_value = "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    "
    		},
    		/*activated*/ ctx[5] ? { "aria-current": "page" } : {},
    		{ tabindex: /*tabindex*/ ctx[0] },
    		/*props*/ ctx[12]
    	];

    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file$b, 21, 2, 547);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			/*span_binding*/ ctx[22](span);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[1])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[13].call(null, span)),
    					action_destroyer(Ripple_action = Ripple.call(null, span, {
    						ripple: /*ripple*/ ctx[3],
    						unbounded: false,
    						color: /*color*/ ctx[4]
    					})),
    					listen_dev(span, "click", /*action*/ ctx[15], false, false, false),
    					listen_dev(span, "keydown", /*handleKeydown*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 524288) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
    				}
    			}

    			set_attributes(span, span_data = get_spread_update(span_levels, [
    				(!current || dirty & /*className, activated, selected, disabled*/ 420 && span_class_value !== (span_class_value = "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    ")) && { class: span_class_value },
    				dirty & /*activated*/ 32 && (/*activated*/ ctx[5] ? { "aria-current": "page" } : {}),
    				(!current || dirty & /*tabindex*/ 1) && { tabindex: /*tabindex*/ ctx[0] },
    				dirty & /*props*/ 4096 && /*props*/ ctx[12]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, color*/ 24) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3],
    				unbounded: false,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			/*span_binding*/ ctx[22](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:23) ",
    		ctx
    	});

    	return block;
    }

    // (1:0) {#if nav && href}
    function create_if_block$2(ctx) {
    	let a;
    	let a_class_value;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[20].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

    	let a_levels = [
    		{
    			class: a_class_value = "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    "
    		},
    		{ href: /*href*/ ctx[9] },
    		/*activated*/ ctx[5] ? { "aria-current": "page" } : {},
    		{ tabindex: /*tabindex*/ ctx[0] },
    		/*props*/ ctx[12]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$b, 1, 2, 20);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			/*a_binding*/ ctx[21](a);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, a, /*use*/ ctx[1])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[13].call(null, a)),
    					action_destroyer(Ripple_action = Ripple.call(null, a, {
    						ripple: /*ripple*/ ctx[3],
    						unbounded: false,
    						color: /*color*/ ctx[4]
    					})),
    					listen_dev(a, "click", /*action*/ ctx[15], false, false, false),
    					listen_dev(a, "keydown", /*handleKeydown*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 524288) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*className, activated, selected, disabled*/ 420 && a_class_value !== (a_class_value = "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    ")) && { class: a_class_value },
    				(!current || dirty & /*href*/ 512) && { href: /*href*/ ctx[9] },
    				dirty & /*activated*/ 32 && (/*activated*/ ctx[5] ? { "aria-current": "page" } : {}),
    				(!current || dirty & /*tabindex*/ 1) && { tabindex: /*tabindex*/ ctx[0] },
    				dirty & /*props*/ 4096 && /*props*/ ctx[12]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, color*/ 24) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3],
    				unbounded: false,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			/*a_binding*/ ctx[21](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(1:0) {#if nav && href}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*nav*/ ctx[14] && /*href*/ ctx[9]) return 0;
    		if (/*nav*/ ctx[14] && !/*href*/ ctx[9]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let counter = 0;

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, ['default']);
    	const dispatch = createEventDispatcher();
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let checked = false;
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { ripple = true } = $$props;
    	let { color = null } = $$props;
    	let { nonInteractive = getContext("SMUI:list:nonInteractive") } = $$props;
    	let { activated = false } = $$props;
    	let { role = getContext("SMUI:list:item:role") } = $$props;
    	let { selected = false } = $$props;
    	let { disabled = false } = $$props;
    	let { tabindex = !nonInteractive && !disabled && (selected || checked) && "0" || "-1" } = $$props;
    	let { href = false } = $$props;
    	let { inputId = "SMUI-form-field-list-" + counter++ } = $$props;
    	let element;
    	let addTabindexIfNoItemsSelectedRaf;
    	let nav = getContext("SMUI:list:item:nav");
    	setContext("SMUI:generic:input:props", { id: inputId });
    	setContext("SMUI:generic:input:setChecked", setChecked);

    	onMount(() => {
    		// Tabindex needs to be '0' if this is the first non-disabled list item, and
    		// no other item is selected.
    		if (!selected && !nonInteractive) {
    			let first = true;
    			let el = element;

    			while (el.previousSibling) {
    				el = el.previousSibling;

    				if (el.nodeType === 1 && el.classList.contains("mdc-list-item") && !el.classList.contains("mdc-list-item--disabled")) {
    					first = false;
    					break;
    				}
    			}

    			if (first) {
    				// This is first, so now set up a check that no other items are
    				// selected.
    				addTabindexIfNoItemsSelectedRaf = window.requestAnimationFrame(addTabindexIfNoItemsSelected);
    			}
    		}
    	});

    	onDestroy(() => {
    		if (addTabindexIfNoItemsSelectedRaf) {
    			window.cancelAnimationFrame(addTabindexIfNoItemsSelectedRaf);
    		}
    	});

    	function addTabindexIfNoItemsSelected() {
    		// Look through next siblings to see if none of them are selected.
    		let noneSelected = true;

    		let el = element;

    		while (el.nextSibling) {
    			el = el.nextSibling;

    			if (el.nodeType === 1 && el.classList.contains("mdc-list-item") && el.attributes["tabindex"] && el.attributes["tabindex"].value === "0") {
    				noneSelected = false;
    				break;
    			}
    		}

    		if (noneSelected) {
    			// This is the first element, and no other element is selected, so the
    			// tabindex should be '0'.
    			$$invalidate(0, tabindex = "0");
    		}
    	}

    	function action(e) {
    		if (disabled) {
    			e.preventDefault();
    		} else {
    			dispatch("SMUI:action", e);
    		}
    	}

    	function handleKeydown(e) {
    		const isEnter = e.key === "Enter" || e.keyCode === 13;
    		const isSpace = e.key === "Space" || e.keyCode === 32;

    		if (isEnter || isSpace) {
    			action(e);
    		}
    	}

    	function setChecked(isChecked) {
    		$$invalidate(10, checked = isChecked);
    		$$invalidate(0, tabindex = !nonInteractive && !disabled && (selected || checked) && "0" || "-1");
    	}

    	function a_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(11, element);
    		});
    	}

    	function span_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(11, element);
    		});
    	}

    	function li_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(11, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(28, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("ripple" in $$new_props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("color" in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ("nonInteractive" in $$new_props) $$invalidate(17, nonInteractive = $$new_props.nonInteractive);
    		if ("activated" in $$new_props) $$invalidate(5, activated = $$new_props.activated);
    		if ("role" in $$new_props) $$invalidate(6, role = $$new_props.role);
    		if ("selected" in $$new_props) $$invalidate(7, selected = $$new_props.selected);
    		if ("disabled" in $$new_props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ("tabindex" in $$new_props) $$invalidate(0, tabindex = $$new_props.tabindex);
    		if ("href" in $$new_props) $$invalidate(9, href = $$new_props.href);
    		if ("inputId" in $$new_props) $$invalidate(18, inputId = $$new_props.inputId);
    		if ("$$scope" in $$new_props) $$invalidate(19, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		counter,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		createEventDispatcher,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		Ripple,
    		dispatch,
    		forwardEvents,
    		checked,
    		use,
    		className,
    		ripple,
    		color,
    		nonInteractive,
    		activated,
    		role,
    		selected,
    		disabled,
    		tabindex,
    		href,
    		inputId,
    		element,
    		addTabindexIfNoItemsSelectedRaf,
    		nav,
    		addTabindexIfNoItemsSelected,
    		action,
    		handleKeydown,
    		setChecked,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(28, $$props = assign(assign({}, $$props), $$new_props));
    		if ("checked" in $$props) $$invalidate(10, checked = $$new_props.checked);
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("ripple" in $$props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("color" in $$props) $$invalidate(4, color = $$new_props.color);
    		if ("nonInteractive" in $$props) $$invalidate(17, nonInteractive = $$new_props.nonInteractive);
    		if ("activated" in $$props) $$invalidate(5, activated = $$new_props.activated);
    		if ("role" in $$props) $$invalidate(6, role = $$new_props.role);
    		if ("selected" in $$props) $$invalidate(7, selected = $$new_props.selected);
    		if ("disabled" in $$props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ("tabindex" in $$props) $$invalidate(0, tabindex = $$new_props.tabindex);
    		if ("href" in $$props) $$invalidate(9, href = $$new_props.href);
    		if ("inputId" in $$props) $$invalidate(18, inputId = $$new_props.inputId);
    		if ("element" in $$props) $$invalidate(11, element = $$new_props.element);
    		if ("addTabindexIfNoItemsSelectedRaf" in $$props) addTabindexIfNoItemsSelectedRaf = $$new_props.addTabindexIfNoItemsSelectedRaf;
    		if ("nav" in $$props) $$invalidate(14, nav = $$new_props.nav);
    		if ("props" in $$props) $$invalidate(12, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(12, props = exclude($$props, [
    			"use",
    			"class",
    			"ripple",
    			"color",
    			"nonInteractive",
    			"activated",
    			"selected",
    			"disabled",
    			"tabindex",
    			"href",
    			"inputId"
    		]));
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		tabindex,
    		use,
    		className,
    		ripple,
    		color,
    		activated,
    		role,
    		selected,
    		disabled,
    		href,
    		checked,
    		element,
    		props,
    		forwardEvents,
    		nav,
    		action,
    		handleKeydown,
    		nonInteractive,
    		inputId,
    		$$scope,
    		slots,
    		a_binding,
    		span_binding,
    		li_binding
    	];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			use: 1,
    			class: 2,
    			ripple: 3,
    			color: 4,
    			nonInteractive: 17,
    			activated: 5,
    			role: 6,
    			selected: 7,
    			disabled: 8,
    			tabindex: 0,
    			href: 9,
    			inputId: 18
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get use() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nonInteractive() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nonInteractive(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activated() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activated(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get role() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set role(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputId() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputId(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/common/ClassAdder.svelte generated by Svelte v3.31.0 */

    // (1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class="{smuiClass} {className}"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >
    function create_default_slot(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class=\\\"{smuiClass} {className}\\\"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{
    			use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    		},
    		{
    			class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    		},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"])
    	];

    	var switch_value = /*component*/ ctx[2];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot] },
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = (dirty & /*forwardEvents, use, smuiClass, className, exclude, $$props*/ 59)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*forwardEvents, use*/ 17 && {
    						use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    					},
    					dirty & /*smuiClass, className*/ 10 && {
    						class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    					},
    					dirty & /*exclude, $$props*/ 32 && get_spread_object(exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"]))
    				])
    			: {};

    			if (dirty & /*$$scope*/ 256) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*component*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const internals = {
    	component: null,
    	smuiClass: null,
    	contexts: {}
    };

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ClassAdder", slots, ['default']);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { component = internals.component } = $$props;
    	let { forwardEvents: smuiForwardEvents = [] } = $$props;
    	const smuiClass = internals.class;
    	const contexts = internals.contexts;
    	const forwardEvents = forwardEventsBuilder(get_current_component(), smuiForwardEvents);

    	for (let context in contexts) {
    		if (contexts.hasOwnProperty(context)) {
    			setContext(context, contexts[context]);
    		}
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("component" in $$new_props) $$invalidate(2, component = $$new_props.component);
    		if ("forwardEvents" in $$new_props) $$invalidate(6, smuiForwardEvents = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		internals,
    		setContext,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		use,
    		className,
    		component,
    		smuiForwardEvents,
    		smuiClass,
    		contexts,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("component" in $$props) $$invalidate(2, component = $$new_props.component);
    		if ("smuiForwardEvents" in $$props) $$invalidate(6, smuiForwardEvents = $$new_props.smuiForwardEvents);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		component,
    		smuiClass,
    		forwardEvents,
    		$$props,
    		smuiForwardEvents,
    		slots,
    		$$scope
    	];
    }

    class ClassAdder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			use: 0,
    			class: 1,
    			component: 2,
    			forwardEvents: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClassAdder",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get use() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function classAdderBuilder(props) {
      function Component(...args) {
        Object.assign(internals, props);
        return new ClassAdder(...args);
      }

      Component.prototype = ClassAdder;

      // SSR support
      if (ClassAdder.$$render) {
        Component.$$render = (...args) => Object.assign(internals, props) && ClassAdder.$$render(...args);
      }
      if (ClassAdder.render) {
        Component.render = (...args) => Object.assign(internals, props) && ClassAdder.render(...args);
      }

      return Component;
    }

    /* node_modules/@smui/common/Span.svelte generated by Svelte v3.31.0 */
    const file$c = "node_modules/@smui/common/Span.svelte";

    function create_fragment$e(ctx) {
    	let span;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let span_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file$c, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[0])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, span))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			set_attributes(span, span_data = get_spread_update(span_levels, [dirty & /*$$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Span", slots, ['default']);
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let { use = [] } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, slots];
    }

    class Span extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Span",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get use() {
    		throw new Error("<Span>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Span>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Text = classAdderBuilder({
      class: 'mdc-list-item__text',
      component: Span,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-list-item__primary-text',
      component: Span,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-list-item__secondary-text',
      component: Span,
      contexts: {}
    });

    var Graphic = classAdderBuilder({
      class: 'mdc-list-item__graphic',
      component: Span,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-list-item__meta',
      component: Span,
      contexts: {}
    });

    /* node_modules/@smui/common/Div.svelte generated by Svelte v3.31.0 */
    const file$d = "node_modules/@smui/common/Div.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let div_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$d, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[0])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, div))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Div", slots, ['default']);
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let { use = [] } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, slots];
    }

    class Div extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Div",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get use() {
    		throw new Error("<Div>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Div>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    classAdderBuilder({
      class: 'mdc-list-group',
      component: Div,
      contexts: {}
    });

    /* node_modules/@smui/common/H3.svelte generated by Svelte v3.31.0 */
    const file$e = "node_modules/@smui/common/H3.svelte";

    function create_fragment$g(ctx) {
    	let h3;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let h3_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let h3_data = {};

    	for (let i = 0; i < h3_levels.length; i += 1) {
    		h3_data = assign(h3_data, h3_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			if (default_slot) default_slot.c();
    			set_attributes(h3, h3_data);
    			add_location(h3, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);

    			if (default_slot) {
    				default_slot.m(h3, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, h3, /*use*/ ctx[0])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, h3))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			set_attributes(h3, h3_data = get_spread_update(h3_levels, [dirty & /*$$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("H3", slots, ['default']);
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let { use = [] } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, slots];
    }

    class H3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "H3",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get use() {
    		throw new Error("<H3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<H3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Subheader = classAdderBuilder({
      class: 'mdc-list-group__subheader',
      component: H3,
      contexts: {}
    });

    /* node_modules/@smui/list/Separator.svelte generated by Svelte v3.31.0 */
    const file$f = "node_modules/@smui/list/Separator.svelte";

    // (13:0) {:else}
    function create_else_block$3(ctx) {
    	let li;
    	let li_class_value;
    	let useActions_action;
    	let forwardEvents_action;
    	let mounted;
    	let dispose;

    	let li_levels = [
    		{
    			class: li_class_value = "\n      mdc-list-divider\n      " + /*className*/ ctx[1] + "\n      " + (/*padded*/ ctx[4] ? "mdc-list-divider--padded" : "") + "\n      " + (/*inset*/ ctx[5] ? "mdc-list-divider--inset" : "") + "\n    "
    		},
    		{ role: "separator" },
    		/*props*/ ctx[6]
    	];

    	let li_data = {};

    	for (let i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			set_attributes(li, li_data);
    			add_location(li, file$f, 13, 2, 257);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, li, /*use*/ ctx[0])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[7].call(null, li))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(li, li_data = get_spread_update(li_levels, [
    				dirty & /*className, padded, inset*/ 50 && li_class_value !== (li_class_value = "\n      mdc-list-divider\n      " + /*className*/ ctx[1] + "\n      " + (/*padded*/ ctx[4] ? "mdc-list-divider--padded" : "") + "\n      " + (/*inset*/ ctx[5] ? "mdc-list-divider--inset" : "") + "\n    ") && { class: li_class_value },
    				{ role: "separator" },
    				dirty & /*props*/ 64 && /*props*/ ctx[6]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(13:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (1:0) {#if group || nav}
    function create_if_block$3(ctx) {
    	let hr;
    	let hr_class_value;
    	let useActions_action;
    	let forwardEvents_action;
    	let mounted;
    	let dispose;

    	let hr_levels = [
    		{
    			class: hr_class_value = "\n      mdc-list-divider\n      " + /*className*/ ctx[1] + "\n      " + (/*padded*/ ctx[4] ? "mdc-list-divider--padded" : "") + "\n      " + (/*inset*/ ctx[5] ? "mdc-list-divider--inset" : "") + "\n    "
    		},
    		/*props*/ ctx[6]
    	];

    	let hr_data = {};

    	for (let i = 0; i < hr_levels.length; i += 1) {
    		hr_data = assign(hr_data, hr_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			set_attributes(hr, hr_data);
    			add_location(hr, file$f, 1, 2, 21);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, hr, /*use*/ ctx[0])),
    					action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[7].call(null, hr))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(hr, hr_data = get_spread_update(hr_levels, [
    				dirty & /*className, padded, inset*/ 50 && hr_class_value !== (hr_class_value = "\n      mdc-list-divider\n      " + /*className*/ ctx[1] + "\n      " + (/*padded*/ ctx[4] ? "mdc-list-divider--padded" : "") + "\n      " + (/*inset*/ ctx[5] ? "mdc-list-divider--inset" : "") + "\n    ") && { class: hr_class_value },
    				dirty & /*props*/ 64 && /*props*/ ctx[6]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(1:0) {#if group || nav}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*group*/ ctx[2] || /*nav*/ ctx[3]) return create_if_block$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Separator", slots, []);
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { group = false } = $$props;
    	let { nav = false } = $$props;
    	let { padded = false } = $$props;
    	let { inset = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("group" in $$new_props) $$invalidate(2, group = $$new_props.group);
    		if ("nav" in $$new_props) $$invalidate(3, nav = $$new_props.nav);
    		if ("padded" in $$new_props) $$invalidate(4, padded = $$new_props.padded);
    		if ("inset" in $$new_props) $$invalidate(5, inset = $$new_props.inset);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		group,
    		nav,
    		padded,
    		inset,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("group" in $$props) $$invalidate(2, group = $$new_props.group);
    		if ("nav" in $$props) $$invalidate(3, nav = $$new_props.nav);
    		if ("padded" in $$props) $$invalidate(4, padded = $$new_props.padded);
    		if ("inset" in $$props) $$invalidate(5, inset = $$new_props.inset);
    		if ("props" in $$props) $$invalidate(6, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(6, props = exclude($$props, ["use", "class", "group", "nav", "padded", "inset"]));
    	};

    	$$props = exclude_internal_props($$props);
    	return [use, className, group, nav, padded, inset, props, forwardEvents];
    }

    class Separator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {
    			use: 0,
    			class: 1,
    			group: 2,
    			nav: 3,
    			padded: 4,
    			inset: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Separator",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get use() {
    		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get group() {
    		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set group(value) {
    		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nav() {
    		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nav(value) {
    		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padded() {
    		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padded(value) {
    		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inset() {
    		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inset(value) {
    		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }

    /* src/Paginas/Inicio.svelte generated by Svelte v3.31.0 */
    const file$g = "src/Paginas/Inicio.svelte";

    // (299:6) {:else}
    function create_else_block$4(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let venus_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	venus_1 = new Venus({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(venus_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 301, 8, 7886);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 305, 39, 7988);
    			attr_dev(a, "href", "/VenusPerfil");
    			add_location(a, file$g, 305, 6, 7955);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 304, 5, 7940);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 300, 7, 7822);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 299, 6, 7756);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(venus_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(venus_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(venus_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(venus_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(299:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (288:22) 
    function create_if_block_8(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let hades_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	hades_1 = new Pluton({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(hades_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 290, 8, 7548);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 294, 40, 7651);
    			attr_dev(a, "href", "/PlutonPerfil");
    			add_location(a, file$g, 294, 6, 7617);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 293, 5, 7602);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 289, 7, 7484);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 288, 6, 7418);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(hades_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hades_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hades_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(hades_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(288:22) ",
    		ctx
    	});

    	return block;
    }

    // (277:25) 
    function create_if_block_7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let mercurio_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	mercurio_1 = new Mercurio({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(mercurio_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 279, 8, 7196);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 283, 42, 7304);
    			attr_dev(a, "href", "/MercurioPerfil");
    			add_location(a, file$g, 283, 6, 7268);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 282, 5, 7253);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 278, 7, 7132);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 277, 6, 7066);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(mercurio_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mercurio_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mercurio_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(mercurio_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(277:25) ",
    		ctx
    	});

    	return block;
    }

    // (266:22) 
    function create_if_block_6(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let marte_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	marte_1 = new Marte({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(marte_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 268, 8, 6847);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 272, 39, 6949);
    			attr_dev(a, "href", "/MartePerfil");
    			add_location(a, file$g, 272, 6, 6916);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 271, 5, 6901);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 267, 7, 6783);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 266, 6, 6717);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(marte_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(marte_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(marte_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(marte_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(266:22) ",
    		ctx
    	});

    	return block;
    }

    // (255:24) 
    function create_if_block_5(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let vulcano_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	vulcano_1 = new Vulcano({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(vulcano_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 257, 8, 6497);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 261, 41, 6603);
    			attr_dev(a, "href", "/VulcanoPerfil");
    			add_location(a, file$g, 261, 6, 6568);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 260, 5, 6553);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 256, 7, 6433);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 255, 6, 6367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(vulcano_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(vulcano_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(vulcano_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(vulcano_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(255:24) ",
    		ctx
    	});

    	return block;
    }

    // (244:22) 
    function create_if_block_4(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let apolo_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	apolo_1 = new Apolo({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(apolo_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 246, 8, 6149);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 250, 39, 6251);
    			attr_dev(a, "href", "/ApoloPerfil");
    			add_location(a, file$g, 250, 6, 6218);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 249, 5, 6203);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 245, 7, 6085);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 244, 6, 6019);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(apolo_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(apolo_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(apolo_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(apolo_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(244:22) ",
    		ctx
    	});

    	return block;
    }

    // (233:22) 
    function create_if_block_3(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let venus_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	venus_1 = new Venus({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(venus_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 235, 8, 5803);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 239, 39, 5905);
    			attr_dev(a, "href", "/VenusPerfil");
    			add_location(a, file$g, 239, 6, 5872);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 238, 5, 5857);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 234, 7, 5739);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 233, 6, 5673);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(venus_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(venus_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(venus_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(venus_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(233:22) ",
    		ctx
    	});

    	return block;
    }

    // (222:20) 
    function create_if_block_2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let neptuno_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	neptuno_1 = new Neptuno({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(neptuno_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 224, 8, 5453);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 228, 41, 5559);
    			attr_dev(a, "href", "/NeptunoPerfil");
    			add_location(a, file$g, 228, 6, 5524);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 227, 5, 5509);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 223, 7, 5389);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 222, 6, 5323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(neptuno_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(neptuno_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(neptuno_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(neptuno_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(222:20) ",
    		ctx
    	});

    	return block;
    }

    // (211:17) 
    function create_if_block_1$1(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let juno_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	juno_1 = new Juno({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(juno_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 213, 8, 5119);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 217, 38, 5217);
    			attr_dev(a, "href", "/JunoPerfil");
    			add_location(a, file$g, 217, 6, 5185);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 216, 5, 5170);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 212, 7, 5055);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 211, 3, 4989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(juno_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(juno_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(juno_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(juno_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(211:17) ",
    		ctx
    	});

    	return block;
    }

    // (200:2) {#if jupiter}
    function create_if_block$4(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let jupiter_1;
    	let t0;
    	let button;
    	let a;
    	let h4;
    	let link_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	jupiter_1 = new Jupiter({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(jupiter_1.$$.fragment);
    			t0 = space();
    			button = element("button");
    			a = element("a");
    			h4 = element("h4");
    			h4.textContent = "SABER MÁS";
    			attr_dev(div0, "class", "col s12");
    			add_location(div0, file$g, 202, 5, 4782);
    			attr_dev(h4, "class", "txt_sabermas svelte-16uca4w");
    			add_location(h4, file$g, 206, 41, 4888);
    			attr_dev(a, "href", "/JupiterPerfil");
    			add_location(a, file$g, 206, 6, 4853);
    			attr_dev(button, "class", "svelte-16uca4w");
    			add_location(button, file$g, 205, 5, 4838);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-bottom", "0px", 1);
    			add_location(div1, file$g, 201, 4, 4721);
    			attr_dev(div2, "class", "dioses_card svelte-16uca4w");
    			add_location(div2, file$g, 200, 3, 4658);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(jupiter_1, div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, a);
    			append_dev(a, h4);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jupiter_1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jupiter_1.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, blur, { amount: 10 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(jupiter_1);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(200:2) {#if jupiter}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let header;
    	let t0;
    	let nav;
    	let div0;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div1;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let div2;
    	let button2;
    	let img2;
    	let img2_src_value;
    	let t3;
    	let div3;
    	let button3;
    	let img3;
    	let img3_src_value;
    	let t4;
    	let div4;
    	let button4;
    	let img4;
    	let img4_src_value;
    	let t5;
    	let div5;
    	let button5;
    	let img5;
    	let img5_src_value;
    	let t6;
    	let div6;
    	let button6;
    	let img6;
    	let img6_src_value;
    	let t7;
    	let div7;
    	let button7;
    	let img7;
    	let img7_src_value;
    	let t8;
    	let div8;
    	let button8;
    	let img8;
    	let img8_src_value;
    	let t9;
    	let section;
    	let div9;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	header = new Header({ $$inline: true });

    	const if_block_creators = [
    		create_if_block$4,
    		create_if_block_1$1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_if_block_8,
    		create_else_block$4
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*jupiter*/ ctx[0]) return 0;
    		if (/*juno*/ ctx[1]) return 1;
    		if (/*neptuno*/ ctx[2]) return 2;
    		if (/*venus*/ ctx[3]) return 3;
    		if (/*apolo*/ ctx[5]) return 4;
    		if (/*vulcano*/ ctx[6]) return 5;
    		if (/*marte*/ ctx[4]) return 6;
    		if (/*mercurio*/ ctx[8]) return 7;
    		if (/*hades*/ ctx[7]) return 8;
    		return 9;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			nav = element("nav");
    			div0 = element("div");
    			button0 = element("button");
    			img0 = element("img");
    			t1 = space();
    			div1 = element("div");
    			button1 = element("button");
    			img1 = element("img");
    			t2 = space();
    			div2 = element("div");
    			button2 = element("button");
    			img2 = element("img");
    			t3 = space();
    			div3 = element("div");
    			button3 = element("button");
    			img3 = element("img");
    			t4 = space();
    			div4 = element("div");
    			button4 = element("button");
    			img4 = element("img");
    			t5 = space();
    			div5 = element("div");
    			button5 = element("button");
    			img5 = element("img");
    			t6 = space();
    			div6 = element("div");
    			button6 = element("button");
    			img6 = element("img");
    			t7 = space();
    			div7 = element("div");
    			button7 = element("button");
    			img7 = element("img");
    			t8 = space();
    			div8 = element("div");
    			button8 = element("button");
    			img8 = element("img");
    			t9 = space();
    			section = element("section");
    			div9 = element("div");
    			if_block.c();
    			if (img0.src !== (img0_src_value = "../img/dioses romanos_btn/Jupiter_btn.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$g, 151, 4, 2738);
    			attr_dev(button0, "href", "javascript:void(0)");
    			attr_dev(button0, "id", "Jupiter_boton");
    			attr_dev(button0, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button0, file$g, 150, 2, 2621);
    			attr_dev(div0, "class", "btn_dioses svelte-16uca4w");
    			add_location(div0, file$g, 149, 1, 2594);
    			if (img1.src !== (img1_src_value = "../img/dioses romanos_btn/Juno_btn.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$g, 154, 110, 2952);
    			attr_dev(button1, "href", "javascript:void(0)");
    			attr_dev(button1, "id", "Juno_boton");
    			attr_dev(button1, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button1, file$g, 154, 2, 2844);
    			attr_dev(div1, "class", "btn_dioses svelte-16uca4w");
    			add_location(div1, file$g, 153, 1, 2817);
    			if (img2.src !== (img2_src_value = "../img/dioses romanos_btn/Neptuno_btn.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$g, 160, 4, 3177);
    			attr_dev(button2, "href", "javascript:void(0)");
    			attr_dev(button2, "id", "Neptuno_boton");
    			attr_dev(button2, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button2, file$g, 159, 2, 3060);
    			attr_dev(div2, "class", "btn_dioses svelte-16uca4w");
    			add_location(div2, file$g, 158, 1, 3033);
    			if (img3.src !== (img3_src_value = "../img/dioses romanos_btn/Venus_btn.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			add_location(img3, file$g, 165, 4, 3397);
    			attr_dev(button3, "href", "javascript:void(0)");
    			attr_dev(button3, "id", "Venus_boton");
    			attr_dev(button3, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button3, file$g, 164, 2, 3284);
    			attr_dev(div3, "class", "btn_dioses svelte-16uca4w");
    			add_location(div3, file$g, 163, 1, 3257);
    			if (img4.src !== (img4_src_value = "../img/dioses romanos_btn/Apolo_btn.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			add_location(img4, file$g, 170, 4, 3615);
    			attr_dev(button4, "href", "javascript:void(0)");
    			attr_dev(button4, "id", "Apolo_boton");
    			attr_dev(button4, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button4, file$g, 169, 2, 3502);
    			attr_dev(div4, "class", "btn_dioses svelte-16uca4w");
    			add_location(div4, file$g, 168, 1, 3475);
    			if (img5.src !== (img5_src_value = "../img/dioses romanos_btn/Vulcano_btn.svg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "");
    			add_location(img5, file$g, 175, 4, 3837);
    			attr_dev(button5, "href", "javascript:void(0)");
    			attr_dev(button5, "id", "Vulcano_boton");
    			attr_dev(button5, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button5, file$g, 174, 2, 3720);
    			attr_dev(div5, "class", "btn_dioses svelte-16uca4w");
    			add_location(div5, file$g, 173, 1, 3693);
    			if (img6.src !== (img6_src_value = "../img/dioses romanos_btn/Marte_btn.svg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "");
    			add_location(img6, file$g, 180, 4, 4057);
    			attr_dev(button6, "href", "javascript:void(0)");
    			attr_dev(button6, "id", "Marte_boton");
    			attr_dev(button6, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button6, file$g, 179, 2, 3944);
    			attr_dev(div6, "class", "btn_dioses svelte-16uca4w");
    			add_location(div6, file$g, 178, 1, 3917);
    			if (img7.src !== (img7_src_value = "../img/dioses romanos_btn/Mercurio_btn.svg")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "");
    			add_location(img7, file$g, 185, 10, 4281);
    			attr_dev(button7, "href", "javascript:void(0)");
    			attr_dev(button7, "id", "Mercurio_boton");
    			attr_dev(button7, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button7, file$g, 184, 2, 4162);
    			attr_dev(div7, "class", "btn_dioses svelte-16uca4w");
    			add_location(div7, file$g, 183, 1, 4135);
    			if (img8.src !== (img8_src_value = "../img/dioses romanos_btn/Hades_btn.svg")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "");
    			add_location(img8, file$g, 190, 4, 4502);
    			attr_dev(button8, "href", "javascript:void(0)");
    			attr_dev(button8, "id", "Hades_boton");
    			attr_dev(button8, "class", "btn-dios transparent svelte-16uca4w");
    			add_location(button8, file$g, 189, 2, 4389);
    			attr_dev(div8, "class", "btn_dioses svelte-16uca4w");
    			add_location(div8, file$g, 188, 1, 4362);
    			attr_dev(nav, "class", "botones_dioses svelte-16uca4w");
    			add_location(nav, file$g, 148, 0, 2564);
    			attr_dev(div9, "class", "container");
    			add_location(div9, file$g, 197, 1, 4614);
    			attr_dev(section, "class", "dioses svelte-16uca4w");
    			add_location(section, file$g, 196, 0, 4588);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, button0);
    			append_dev(button0, img0);
    			append_dev(nav, t1);
    			append_dev(nav, div1);
    			append_dev(div1, button1);
    			append_dev(button1, img1);
    			append_dev(nav, t2);
    			append_dev(nav, div2);
    			append_dev(div2, button2);
    			append_dev(button2, img2);
    			append_dev(nav, t3);
    			append_dev(nav, div3);
    			append_dev(div3, button3);
    			append_dev(button3, img3);
    			append_dev(nav, t4);
    			append_dev(nav, div4);
    			append_dev(div4, button4);
    			append_dev(button4, img4);
    			append_dev(nav, t5);
    			append_dev(nav, div5);
    			append_dev(div5, button5);
    			append_dev(button5, img5);
    			append_dev(nav, t6);
    			append_dev(nav, div6);
    			append_dev(div6, button6);
    			append_dev(button6, img6);
    			append_dev(nav, t7);
    			append_dev(nav, div7);
    			append_dev(div7, button7);
    			append_dev(button7, img7);
    			append_dev(nav, t8);
    			append_dev(nav, div8);
    			append_dev(div8, button8);
    			append_dev(button8, img8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div9);
    			if_blocks[current_block_type_index].m(div9, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[11], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[12], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[13], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[14], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[15], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[16], false, false, false),
    					listen_dev(button8, "click", /*click_handler_8*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div9, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(section);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Inicio", slots, []);
    	let jupiter = false;
    	let juno = false;
    	let neptuno = false;
    	let venus = false;
    	let marte = false;
    	let apolo = false;
    	let vulcano = false;
    	let hades = false;
    	let mercurio = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Inicio> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, jupiter = true);
    	const click_handler_1 = () => $$invalidate(1, juno = true);
    	const click_handler_2 = () => $$invalidate(2, neptuno = true);
    	const click_handler_3 = () => $$invalidate(3, venus = true);
    	const click_handler_4 = () => $$invalidate(5, apolo = true);
    	const click_handler_5 = () => $$invalidate(6, vulcano = true);
    	const click_handler_6 = () => $$invalidate(4, marte = true);
    	const click_handler_7 = () => $$invalidate(8, mercurio = true);
    	const click_handler_8 = () => $$invalidate(7, hades = true);

    	$$self.$capture_state = () => ({
    		Jupiter,
    		Juno,
    		Neptuno,
    		Venus,
    		Marte,
    		Apolo,
    		Vulcano,
    		Hades: Pluton,
    		Mercurio,
    		Header,
    		link,
    		List,
    		Item,
    		Text,
    		Graphic,
    		Separator,
    		Subheader,
    		blur,
    		jupiter,
    		juno,
    		neptuno,
    		venus,
    		marte,
    		apolo,
    		vulcano,
    		hades,
    		mercurio
    	});

    	$$self.$inject_state = $$props => {
    		if ("jupiter" in $$props) $$invalidate(0, jupiter = $$props.jupiter);
    		if ("juno" in $$props) $$invalidate(1, juno = $$props.juno);
    		if ("neptuno" in $$props) $$invalidate(2, neptuno = $$props.neptuno);
    		if ("venus" in $$props) $$invalidate(3, venus = $$props.venus);
    		if ("marte" in $$props) $$invalidate(4, marte = $$props.marte);
    		if ("apolo" in $$props) $$invalidate(5, apolo = $$props.apolo);
    		if ("vulcano" in $$props) $$invalidate(6, vulcano = $$props.vulcano);
    		if ("hades" in $$props) $$invalidate(7, hades = $$props.hades);
    		if ("mercurio" in $$props) $$invalidate(8, mercurio = $$props.mercurio);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*jupiter*/ 1) {
    			 if (jupiter) {
    				$$invalidate(0, jupiter = true);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = false);
    			}
    		}

    		if ($$self.$$.dirty & /*juno*/ 2) {
    			 if (juno) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = true);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = false);
    			}
    		}

    		if ($$self.$$.dirty & /*neptuno*/ 4) {
    			 if (neptuno) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = true);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = false);
    			}
    		}

    		if ($$self.$$.dirty & /*venus*/ 8) {
    			 if (venus) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = true);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = false);
    			}
    		}

    		if ($$self.$$.dirty & /*marte*/ 16) {
    			 if (marte) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = true);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = false);
    			}
    		}

    		if ($$self.$$.dirty & /*apolo*/ 32) {
    			 if (apolo) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = true);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = false);
    			}
    		}

    		if ($$self.$$.dirty & /*vulcano*/ 64) {
    			 if (vulcano) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = true);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = false);
    			}
    		}

    		if ($$self.$$.dirty & /*mercurio*/ 256) {
    			 if (mercurio) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = false);
    				$$invalidate(8, mercurio = true);
    			}
    		}

    		if ($$self.$$.dirty & /*hades*/ 128) {
    			 if (hades) {
    				$$invalidate(0, jupiter = false);
    				$$invalidate(1, juno = false);
    				$$invalidate(2, neptuno = false);
    				$$invalidate(3, venus = false);
    				$$invalidate(4, marte = false);
    				$$invalidate(5, apolo = false);
    				$$invalidate(6, vulcano = false);
    				$$invalidate(7, hades = true);
    				$$invalidate(8, mercurio = false);
    			}
    		}
    	};

    	return [
    		jupiter,
    		juno,
    		neptuno,
    		venus,
    		marte,
    		apolo,
    		vulcano,
    		hades,
    		mercurio,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class Inicio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Inicio",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src/Paginas/Ajustes.svelte generated by Svelte v3.31.0 */

    function create_fragment$j(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Ajustes", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Ajustes> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Ajustes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ajustes",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src/Componentes/Footer.svelte generated by Svelte v3.31.0 */

    const file$h = "src/Componentes/Footer.svelte";

    function create_fragment$k(ctx) {
    	let footer;
    	let hr;
    	let t;
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			hr = element("hr");
    			t = space();
    			a = element("a");
    			img = element("img");
    			set_style(hr, "border-top", "1px solid rgba(255, 255, 255, 0.5)");
    			set_style(hr, "border-bottom", "0px");
    			set_style(hr, "border-left", "0px");
    			set_style(hr, "border-right", "0px");
    			set_style(hr, "padding-bottom", "10px");
    			set_style(hr, "margin", "0px");
    			add_location(hr, file$h, 1, 4, 13);
    			if (img.src !== (img_src_value = "img/Ruben_Terre_Logo_blanco_131119.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "logo_rubenterre svelte-1xl4vz2");
    			attr_dev(img, "width", "20%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$h, 3, 41, 210);
    			attr_dev(a, "href", "https://www.rubenterre.com");
    			add_location(a, file$h, 3, 4, 173);
    			attr_dev(footer, "class", "svelte-1xl4vz2");
    			add_location(footer, file$h, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, hr);
    			append_dev(footer, t);
    			append_dev(footer, a);
    			append_dev(a, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src/Paginas/Informacion.svelte generated by Svelte v3.31.0 */
    const file$i = "src/Paginas/Informacion.svelte";

    function create_fragment$l(ctx) {
    	let div16;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let link_action;
    	let t0;
    	let div1;
    	let p0;
    	let t2;
    	let div6;
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let t3;
    	let div7;
    	let t4;
    	let div8;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let section;
    	let div15;
    	let div14;
    	let div13;
    	let h40;
    	let t7;
    	let p1;
    	let t9;
    	let p2;
    	let t11;
    	let p3;
    	let t13;
    	let img2;
    	let img2_src_value;
    	let t14;
    	let p4;
    	let t15;
    	let a1;
    	let t17;
    	let t18;
    	let div12;
    	let div9;
    	let a2;
    	let img3;
    	let img3_src_value;
    	let t19;
    	let div10;
    	let a3;
    	let img4;
    	let img4_src_value;
    	let t20;
    	let div11;
    	let a4;
    	let img5;
    	let img5_src_value;
    	let t21;
    	let p5;
    	let strong;
    	let t23;
    	let ul;
    	let li0;
    	let t25;
    	let li1;
    	let t27;
    	let li2;
    	let t29;
    	let br;
    	let t30;
    	let h41;
    	let t32;
    	let p6;
    	let t34;
    	let p7;
    	let t36;
    	let p8;
    	let t38;
    	let p9;
    	let t40;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div16 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "INFORMACIÓN";
    			t2 = space();
    			div6 = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t3 = space();
    			div7 = element("div");
    			t4 = space();
    			div8 = element("div");
    			img1 = element("img");
    			t5 = space();
    			section = element("section");
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Dioses de Roma";
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "Versión 4.0.0.";
    			t9 = space();
    			p2 = element("p");
    			p2.textContent = "La app para aprender los dioses de la mitología clásica.";
    			t11 = space();
    			p3 = element("p");
    			p3.textContent = "Desarrollado por Rubén Terré.";
    			t13 = space();
    			img2 = element("img");
    			t14 = space();
    			p4 = element("p");
    			t15 = text("Para máis información sobre os meus traballos visita a miña web en ");
    			a1 = element("a");
    			a1.textContent = "www.rubenterre.com";
    			t17 = text(" ou a través dos seguintes\n                        canais:");
    			t18 = space();
    			div12 = element("div");
    			div9 = element("div");
    			a2 = element("a");
    			img3 = element("img");
    			t19 = space();
    			div10 = element("div");
    			a3 = element("a");
    			img4 = element("img");
    			t20 = space();
    			div11 = element("div");
    			a4 = element("a");
    			img5 = element("img");
    			t21 = space();
    			p5 = element("p");
    			strong = element("strong");
    			strong.textContent = "Actualizacións nas que estamos\n                            a traballar";
    			t23 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "1- Añadir más dioses";
    			t25 = space();
    			li1 = element("li");
    			li1.textContent = "2- Añadir buscador";
    			t27 = space();
    			li2 = element("li");
    			li2.textContent = "3- Mejoras generales en el diseño";
    			t29 = space();
    			br = element("br");
    			t30 = space();
    			h41 = element("h4");
    			h41.textContent = "MIT License";
    			t32 = space();
    			p6 = element("p");
    			p6.textContent = "Copyright (c) 2020 Rubén Terré - Diseño & Desarrollo web";
    			t34 = space();
    			p7 = element("p");
    			p7.textContent = "Permission is hereby granted, free of charge, to any person obtaining a copy\n                        of this software and associated documentation files (the \"Software\"), to deal\n                        in the Software without restriction, including without limitation the rights\n                        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n                        copies of the Software, and to permit persons to whom the Software is\n                        furnished to do so, subject to the following conditions:";
    			t36 = space();
    			p8 = element("p");
    			p8.textContent = "The above copyright notice and this permission notice shall be included in\n                        all\n                        copies or substantial portions of the Software.";
    			t38 = space();
    			p9 = element("p");
    			p9.textContent = "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n                        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n                        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n                        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n                        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n                        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n                        SOFTWARE.";
    			t40 = space();
    			create_component(footer.$$.fragment);
    			if (img0.src !== (img0_src_value = "img/prev.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "50%");
    			attr_dev(img0, "class", "prev svelte-1lzw5cu");
    			add_location(img0, file$i, 13, 58, 408);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "left");
    			add_location(a0, file$i, 13, 24, 374);
    			attr_dev(div0, "class", "col s6 content-left svelte-1lzw5cu");
    			add_location(div0, file$i, 12, 20, 316);
    			attr_dev(p0, "class", "white-text axustes svelte-1lzw5cu");
    			add_location(p0, file$i, 17, 24, 607);
    			attr_dev(div1, "class", "col s6 content-right svelte-1lzw5cu");
    			add_location(div1, file$i, 16, 20, 548);
    			attr_dev(div2, "class", "col s12");
    			add_location(div2, file$i, 11, 16, 274);
    			attr_dev(div3, "class", "row svelte-1lzw5cu");
    			add_location(div3, file$i, 10, 12, 240);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$i, 9, 8, 204);
    			attr_dev(div5, "class", "navbar svelte-1lzw5cu");
    			add_location(div5, file$i, 8, 4, 175);
    			attr_dev(path0, "class", "elementor-shape-fill");
    			attr_dev(path0, "opacity", "0.33");
    			attr_dev(path0, "d", "M473,67.3c-203.9,88.3-263.1-34-320.3,0C66,119.1,0,59.7,0,59.7V0h1000v59.7 c0,0-62.1,26.1-94.9,29.3c-32.8,3.3-62.8-12.3-75.8-22.1C806,49.6,745.3,8.7,694.9,4.7S492.4,59,473,67.3z");
    			add_location(path0, file$i, 26, 12, 948);
    			attr_dev(path1, "class", "elementor-shape-fill");
    			attr_dev(path1, "opacity", "0.66");
    			attr_dev(path1, "d", "M734,67.3c-45.5,0-77.2-23.2-129.1-39.1c-28.6-8.7-150.3-10.1-254,39.1 s-91.7-34.4-149.2,0C115.7,118.3,0,39.8,0,39.8V0h1000v36.5c0,0-28.2-18.5-92.1-18.5C810.2,18.1,775.7,67.3,734,67.3z");
    			add_location(path1, file$i, 29, 12, 1228);
    			attr_dev(path2, "class", "elementor-shape-fill");
    			attr_dev(path2, "d", "M766.1,28.9c-200-57.5-266,65.5-395.1,19.5C242,1.8,242,5.4,184.8,20.6C128,35.8,132.3,44.9,89.9,52.5C28.6,63.7,0,0,0,0 h1000c0,0-9.9,40.9-83.6,48.1S829.6,47,766.1,28.9z");
    			add_location(path2, file$i, 32, 12, 1514);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1000 100");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "shape-fill svelte-1lzw5cu");
    			add_location(svg, file$i, 25, 8, 826);
    			attr_dev(div6, "class", "shape svelte-1lzw5cu");
    			attr_dev(div6, "data-negative", "false");
    			add_location(div6, file$i, 24, 4, 776);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$i, 38, 4, 1788);
    			attr_dev(img1, "class", "center svelte-1lzw5cu");
    			if (img1.src !== (img1_src_value = "/img/diosesderoma.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "logo Dioses de Roma");
    			add_location(img1, file$i, 42, 8, 1857);
    			attr_dev(div8, "class", "banner svelte-1lzw5cu");
    			add_location(div8, file$i, 41, 4, 1828);
    			attr_dev(h40, "class", "about-tit svelte-1lzw5cu");
    			add_location(h40, file$i, 49, 20, 2091);
    			attr_dev(p1, "class", "about-version svelte-1lzw5cu");
    			add_location(p1, file$i, 50, 20, 2153);
    			attr_dev(p2, "class", "about-txt svelte-1lzw5cu");
    			add_location(p2, file$i, 51, 20, 2217);
    			attr_dev(p3, "class", "about-txt svelte-1lzw5cu");
    			add_location(p3, file$i, 53, 20, 2320);
    			attr_dev(img2, "class", "center logo_RT svelte-1lzw5cu");
    			if (img2.src !== (img2_src_value = "/img/Ruben_Terre_Logo_blanco_131119.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "logo Rubén Terré");
    			attr_dev(img2, "width", "40%");
    			add_location(img2, file$i, 56, 20, 2441);
    			attr_dev(a1, "href", "https://www.rubenterre.com");
    			add_location(a1, file$i, 58, 91, 2684);
    			attr_dev(p4, "class", "about-txt svelte-1lzw5cu");
    			add_location(p4, file$i, 57, 20, 2571);
    			if (img3.src !== (img3_src_value = "/img/behance-square-brands_white.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Benhance link");
    			attr_dev(img3, "width", "40%");
    			add_location(img3, file$i, 65, 73, 3029);
    			attr_dev(a2, "href", "https://www.behance.net/rubenterre");
    			add_location(a2, file$i, 65, 28, 2984);
    			attr_dev(div9, "class", "col s4");
    			add_location(div9, file$i, 64, 24, 2935);
    			if (img4.src !== (img4_src_value = "/img/github-square-brands_white.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "Github link");
    			attr_dev(img4, "width", "40%");
    			add_location(img4, file$i, 69, 68, 3294);
    			attr_dev(a3, "href", "https://github.com/rubenterre");
    			add_location(a3, file$i, 69, 28, 3254);
    			attr_dev(div10, "class", "col s4");
    			add_location(div10, file$i, 68, 24, 3205);
    			if (img5.src !== (img5_src_value = "/img/linkedin-brands_white.svg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "Linkedin link");
    			attr_dev(img5, "width", "40%");
    			add_location(img5, file$i, 73, 84, 3572);
    			attr_dev(a4, "href", "https://www.linkedin.com/in/rubenterrelameiro");
    			add_location(a4, file$i, 73, 28, 3516);
    			attr_dev(div11, "class", "col s4");
    			add_location(div11, file$i, 72, 24, 3467);
    			attr_dev(div12, "class", "col s12 icon_contact svelte-1lzw5cu");
    			add_location(div12, file$i, 63, 20, 2876);
    			attr_dev(strong, "class", "white-text");
    			add_location(strong, file$i, 79, 46, 3793);
    			attr_dev(p5, "class", "about-textoDos svelte-1lzw5cu");
    			add_location(p5, file$i, 79, 20, 3767);
    			add_location(li0, file$i, 82, 24, 3983);
    			add_location(li1, file$i, 83, 24, 4038);
    			add_location(li2, file$i, 84, 24, 4091);
    			attr_dev(ul, "class", "white-text left-align");
    			add_location(ul, file$i, 81, 20, 3924);
    			add_location(br, file$i, 86, 20, 4181);
    			attr_dev(h41, "class", "about-tit svelte-1lzw5cu");
    			add_location(h41, file$i, 88, 20, 4207);
    			attr_dev(p6, "class", "about-version svelte-1lzw5cu");
    			add_location(p6, file$i, 90, 20, 4267);
    			attr_dev(p7, "class", "licencia-txt svelte-1lzw5cu");
    			add_location(p7, file$i, 92, 20, 4374);
    			attr_dev(p8, "class", "licencia-txt svelte-1lzw5cu");
    			add_location(p8, file$i, 99, 20, 4976);
    			attr_dev(p9, "class", "licencia-txt svelte-1lzw5cu");
    			add_location(p9, file$i, 103, 20, 5200);
    			attr_dev(div13, "class", "col s12 center-align");
    			add_location(div13, file$i, 48, 16, 2036);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$i, 47, 12, 2002);
    			attr_dev(div15, "class", "container");
    			add_location(div15, file$i, 46, 8, 1966);
    			add_location(section, file$i, 45, 4, 1948);
    			attr_dev(div16, "class", "fondo svelte-1lzw5cu");
    			add_location(div16, file$i, 6, 0, 131);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div16, t2);
    			append_dev(div16, div6);
    			append_dev(div6, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(div16, t3);
    			append_dev(div16, div7);
    			append_dev(div16, t4);
    			append_dev(div16, div8);
    			append_dev(div8, img1);
    			append_dev(div16, t5);
    			append_dev(div16, section);
    			append_dev(section, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, h40);
    			append_dev(div13, t7);
    			append_dev(div13, p1);
    			append_dev(div13, t9);
    			append_dev(div13, p2);
    			append_dev(div13, t11);
    			append_dev(div13, p3);
    			append_dev(div13, t13);
    			append_dev(div13, img2);
    			append_dev(div13, t14);
    			append_dev(div13, p4);
    			append_dev(p4, t15);
    			append_dev(p4, a1);
    			append_dev(p4, t17);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			append_dev(div12, div9);
    			append_dev(div9, a2);
    			append_dev(a2, img3);
    			append_dev(div12, t19);
    			append_dev(div12, div10);
    			append_dev(div10, a3);
    			append_dev(a3, img4);
    			append_dev(div12, t20);
    			append_dev(div12, div11);
    			append_dev(div11, a4);
    			append_dev(a4, img5);
    			append_dev(div13, t21);
    			append_dev(div13, p5);
    			append_dev(p5, strong);
    			append_dev(div13, t23);
    			append_dev(div13, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t25);
    			append_dev(ul, li1);
    			append_dev(ul, t27);
    			append_dev(ul, li2);
    			append_dev(div13, t29);
    			append_dev(div13, br);
    			append_dev(div13, t30);
    			append_dev(div13, h41);
    			append_dev(div13, t32);
    			append_dev(div13, p6);
    			append_dev(div13, t34);
    			append_dev(div13, p7);
    			append_dev(div13, t36);
    			append_dev(div13, p8);
    			append_dev(div13, t38);
    			append_dev(div13, p9);
    			insert_dev(target, t40, anchor);
    			mount_component(footer, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a0));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div16);
    			if (detaching) detach_dev(t40);
    			destroy_component(footer, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Informacion", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Informacion> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Footer, link });
    	return [];
    }

    class Informacion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Informacion",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src/Paginas/ApoloPerfil.svelte generated by Svelte v3.31.0 */
    const file$j = "src/Paginas/ApoloPerfil.svelte";

    function create_fragment$m(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Segunda generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "APOLO";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Apolo (en griego: Ἀπόλλων, transl. Apóllōn, o Ἀπέλλων, transl. Apellōn) es una de las deidades principales de la mitología griega, y uno de los dioses olímpicos más significativos, motivo por el cual le dedicaron una gran cantidad de templos. Hijo de Zeus y Leto, y gemelo de Artemisa, poseía muchos atributos y funciones, y posiblemente después de Zeus fue el dios más influyente y venerado de todos los de la Antigüedad clásica. Es descrito como el dios de las artes, del arco y la flecha, que amenazaba o protegía desde lo alto de los cielos, siendo identificado con la luz de la verdad. Era temido por los otros dioses y solamente su padre y su madre podían contenerlo. Es el dios de la muerte súbita, de las plagas y enfermedades, pero también el dios de la curación y de la protección contra las fuerzas malignas. Además, es el dios de la belleza, de la perfección, de la armonía, del equilibrio y de la razón, el iniciador de los jóvenes en el mundo de los adultos, estaba conectado a la naturaleza, a las hierbas y a los rebaños, y es protector de los pastores, marineros y arqueros.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/ApoloCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$j, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$j, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$j, 14, 24, 426);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$j, 15, 24, 496);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$j, 13, 20, 356);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Apolo.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$j, 18, 24, 659);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$j, 17, 20, 576);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$j, 12, 16, 300);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$j, 11, 12, 266);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$j, 22, 8, 812);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$j, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ApoloPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ApoloPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class ApoloPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ApoloPerfil",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src/Paginas/JupiterPerfil.svelte generated by Svelte v3.31.0 */
    const file$k = "src/Paginas/JupiterPerfil.svelte";

    function create_fragment$n(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Primera generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "JUPITER";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Rey de los dioses y gobernante del monte Olimpo; dios del cielo y el trueno. Hijo menor de los titanes Crono y Rea. Los símbolos incluyen el rayo, el águila, el roble, el cetro y la balanza. Hermano y marido de Hera, aunque tuvo muchas amantes, tanto diosas como mortales.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/JupiterCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$k, 9, 8, 143);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$k, 8, 4, 110);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$k, 14, 20, 372);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$k, 15, 20, 439);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$k, 13, 16, 306);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Zeus.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$k, 18, 20, 592);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$k, 17, 16, 513);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$k, 12, 12, 254);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$k, 11, 8, 224);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$k, 22, 4, 726);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$k, 7, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("JupiterPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<JupiterPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class JupiterPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "JupiterPerfil",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src/Paginas/JunoPerfil.svelte generated by Svelte v3.31.0 */
    const file$l = "src/Paginas/JunoPerfil.svelte";

    function create_fragment$o(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Primera generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "JUNO";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Reina de los dioses y diosa del matrimonio y la familia. Hija menor de Crono y Rea. Esposa y hermana de Zeus. Los símbolos incluyen el pavo real, la granada, la corona, el cuco, el león y la vaca. Siendo la diosa del matrimonio, con frecuencia trata de vengarse de los amantes de Zeus y sus hijos.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/JunoCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$l, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$l, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$l, 14, 24, 425);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$l, 15, 24, 495);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$l, 13, 20, 355);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Hera.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$l, 18, 24, 657);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$l, 17, 20, 574);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$l, 12, 16, 299);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$l, 11, 12, 265);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$l, 22, 8, 809);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$l, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("JunoPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<JunoPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class JunoPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "JunoPerfil",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src/Paginas/MartePerfil.svelte generated by Svelte v3.31.0 */
    const file$m = "src/Paginas/MartePerfil.svelte";

    function create_fragment$p(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Segunda generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "MARTE";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Dios de la guerra, la fuerza, la virilidad masculina, y el derramamiento de sangre. Protector del olimpo y de los ejércitos. Los símbolos son la lanza y el escudo. También los son la antorcha, el jabalí, la serpiente, el perro, el buitre. Hijo de Zeus y Hera, amante preferido de Afrodita, su aliada en la guerra y sanadora. Su nombre romano Marte, nos dio la palabra marcial, martes (día de la semana) y el mes de marzo.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/MarteCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$m, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$m, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$m, 14, 24, 426);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$m, 15, 24, 496);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$m, 13, 20, 356);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Ares.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$m, 18, 24, 659);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$m, 17, 20, 576);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$m, 12, 16, 300);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$m, 11, 12, 266);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$m, 22, 8, 811);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$m, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MartePerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MartePerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class MartePerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MartePerfil",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src/Paginas/MercurioPerfil.svelte generated by Svelte v3.31.0 */
    const file$n = "src/Paginas/MercurioPerfil.svelte";

    function create_fragment$q(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Segunda generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "MERCURIO";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Mensajero de los dioses; dios del comercio y la retórica. Los símbolos incluyen el caduceo (vara entrelazada con dos serpientes), las sandalias y el casco alados, la cigüeña y la tortuga (cuyo caparazón usó para inventar la lira). Hijo de Zeus y la ninfa Maia. El segundo olímpico más joven, apenas mayor que Dioniso. Se casó con Dríope, hija del rey Dríope, y su hijo Pan se convirtió en el dios de la naturaleza, el señor de los sátiros, el inventor de la flauta y el compañero de Dioniso.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/MercurioCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$n, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$n, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$n, 14, 24, 429);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$n, 15, 24, 499);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$n, 13, 20, 359);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Hermes.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$n, 18, 24, 665);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$n, 17, 20, 582);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$n, 12, 16, 303);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$n, 11, 12, 269);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$n, 22, 8, 819);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$n, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MercurioPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MercurioPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class MercurioPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MercurioPerfil",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src/Paginas/NeptunoPerfil.svelte generated by Svelte v3.31.0 */
    const file$o = "src/Paginas/NeptunoPerfil.svelte";

    function create_fragment$r(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Primera generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "NEPTUNO";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Señor de los mares, los terremotos y los caballos. Los símbolos incluyen el caballo, el toro, el delfín y el tridente. Medio hijo de Crono y Rea. Hermano de Zeus y Hades. Casado con la nereida Anfítrite, aunque, como la mayor parte de dioses masculinos griegos, tuvo muchas amantes.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/NeptunoCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$o, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$o, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$o, 14, 24, 428);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$o, 15, 24, 498);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$o, 13, 20, 358);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Poseidon.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$o, 18, 24, 663);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$o, 17, 20, 580);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$o, 12, 16, 302);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$o, 11, 12, 268);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$o, 22, 8, 818);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$o, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NeptunoPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NeptunoPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class NeptunoPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NeptunoPerfil",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src/Paginas/PlutonPerfil.svelte generated by Svelte v3.31.0 */
    const file$p = "src/Paginas/PlutonPerfil.svelte";

    function create_fragment$s(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Primera generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "PLUTÓN";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Dios del inframundo, de los muertos y las riquezas de la tierra («Pluto» se traduce como «el rico»), nació en la primera generación olímpica, pero debido a que vive en el inframundo en vez de en el monte Olimpo, suele no ser incluido entre los doce olímpicos. Robó a Perséfone de la Tierra y la convirtió en su esposa en el inframundo, de donde la dejaba salir cada seis meses para reunirse con su madre.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/PlutonCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$p, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$p, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$p, 14, 24, 427);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$p, 15, 24, 497);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$p, 13, 20, 357);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Hades.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$p, 18, 24, 661);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$p, 17, 20, 578);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$p, 12, 16, 301);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$p, 11, 12, 267);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$p, 22, 8, 814);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$p, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PlutonPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlutonPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class PlutonPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlutonPerfil",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    /* src/Paginas/VenusPerfil.svelte generated by Svelte v3.31.0 */
    const file$q = "src/Paginas/VenusPerfil.svelte";

    function create_fragment$t(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Segunda generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "VENUS";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Diosa del amor, la belleza y el deseo. Los símbolos incluyen la paloma, el pájaro, la manzana, la abeja, el cisne, el mirto y la rosa. Su nombre proviene del griego αφρο 'afro', surgida de la espuma del mar después de que la sangre de Urano goteara sobre la tierra y el mar tras ser castrado por su hijo Crono. En otros mitos se la señala como hija de Zeus y de la oceánide Dione. Casada con Hefesto, aunque tuvo muchas relaciones adúlteras, en especial con Ares (de quien tuvo ocho hijos, entre ellos Eros). Su nombre nos dio la palabra \"afrodisíaco\".nota 2​, y de su equivalente en romano antiguo (Venere), provienen venerar y venérea.";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/VenusCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$q, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$q, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$q, 14, 24, 426);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$q, 15, 24, 496);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$q, 13, 20, 356);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Afrodita.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$q, 18, 24, 659);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$q, 17, 20, 576);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$q, 12, 16, 300);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$q, 11, 12, 266);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$q, 22, 8, 815);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$q, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VenusPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VenusPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class VenusPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VenusPerfil",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src/Paginas/VulcanoPerfil.svelte generated by Svelte v3.31.0 */
    const file$r = "src/Paginas/VulcanoPerfil.svelte";

    function create_fragment$u(ctx) {
    	let header;
    	let t0;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let em;
    	let t3;
    	let h1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			em = element("em");
    			em.textContent = "Segunda generación";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "VULCANO";
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Maestro herrero y artesano de los dioses; dios del fuego y la forja. Los símbolos incluyen el fuego, el yunque, el hacha, el burro, el martillo, las tenazas y la codorniz. Hijo de Hera, con Zeus o sin él. Después de que él naciera, sus padres le arrojaron fuera del monte Olimpo, aterrizando en la isla de Lemnos. Casado con Afrodita, aunque a diferencia de la mayoría de los maridos divinos, raramente fue licencioso. Su nombre latino, Vulcano, nos dio la palabra \"volcán\".";
    			if (img0.src !== (img0_src_value = "/img/tarjetas/VulcanoCard.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "width", "100%");
    			add_location(img0, file$r, 9, 12, 179);
    			attr_dev(div0, "class", "cardDioses");
    			add_location(div0, file$r, 8, 8, 142);
    			attr_dev(em, "class", "txtDioses");
    			add_location(em, file$r, 14, 24, 428);
    			attr_dev(h1, "class", "titDioses");
    			add_location(h1, file$r, 15, 24, 498);
    			attr_dev(div1, "class", "col s6");
    			set_style(div1, "padding-left", "0px");
    			add_location(div1, file$r, 13, 20, 358);
    			set_style(img1, "padding-top", "15px");
    			if (img1.src !== (img1_src_value = "./img/nombre_griego/Hefesto.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$r, 18, 24, 663);
    			attr_dev(div2, "class", "col s6 right-align");
    			set_style(div2, "padding-right", "0px");
    			add_location(div2, file$r, 17, 20, 580);
    			attr_dev(div3, "class", "col s12 TitularDioses");
    			add_location(div3, file$r, 12, 16, 302);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$r, 11, 12, 268);
    			attr_dev(p, "class", "txtDioses");
    			add_location(p, file$r, 22, 8, 818);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$r, 7, 4, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, em);
    			append_dev(div1, t3);
    			append_dev(div1, h1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VulcanoPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VulcanoPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header });
    	return [];
    }

    class VulcanoPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VulcanoPerfil",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    /* src/Paginas/NotFound.svelte generated by Svelte v3.31.0 */

    const file$s = "src/Paginas/NotFound.svelte";

    function create_fragment$v(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "ERROR 404";
    			add_location(h1, file$s, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NotFound", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    const routes = {
        '/': Inicio,
        '/ajustes': Ajustes,
        '/informacion': Informacion,
        '/ApoloPerfil': ApoloPerfil,
        '/JupiterPerfil': JupiterPerfil,
        '/JunoPerfil': JunoPerfil,
        '/MartePerfil': MartePerfil,
        '/MercurioPerfil': MercurioPerfil,
        '/NeptunoPerfil': NeptunoPerfil,
        '/PlutonPerfil': PlutonPerfil,
        '/VenusPerfil': VenusPerfil,
        '/VulcanoPerfil': VulcanoPerfil,

        // Catch-all route last
        '*': NotFound
    };

    /* src/App.svelte generated by Svelte v3.31.0 */
    const file$t = "src/App.svelte";

    function create_fragment$w(ctx) {
    	let main;
    	let nav;
    	let div;
    	let a0;
    	let img;
    	let img_src_value;
    	let link_action;
    	let t0;
    	let ul0;
    	let li0;
    	let a1;
    	let i0;
    	let link_action_1;
    	let t2;
    	let ul1;
    	let li1;
    	let a2;
    	let i1;
    	let t4;
    	let router;
    	let current;
    	let mounted;
    	let dispose;
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			nav = element("nav");
    			div = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			i0 = element("i");
    			i0.textContent = "info_outline";
    			t2 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a2 = element("a");
    			i1 = element("i");
    			i1.textContent = "share";
    			t4 = space();
    			create_component(router.$$.fragment);
    			if (img.src !== (img_src_value = "img/Icon_menu/inicio.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "inicio");
    			attr_dev(img, "width", "80%");
    			add_location(img, file$t, 16, 57, 350);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "brand-logo center");
    			add_location(a0, file$t, 16, 10, 303);
    			attr_dev(i0, "class", "material-icons brown-text darken-2-text");
    			add_location(i0, file$t, 19, 51, 514);
    			attr_dev(a1, "href", "/Informacion");
    			add_location(a1, file$t, 19, 18, 481);
    			add_location(li0, file$t, 19, 14, 477);
    			attr_dev(ul0, "id", "nav-mobile left");
    			add_location(ul0, file$t, 18, 10, 437);
    			attr_dev(i1, "class", "material-icons brown-text darken-2-text");
    			add_location(i1, file$t, 23, 47, 695);
    			add_location(a2, file$t, 23, 18, 666);
    			add_location(li1, file$t, 23, 14, 662);
    			attr_dev(ul1, "class", "nav-mobile right");
    			add_location(ul1, file$t, 22, 10, 618);
    			attr_dev(div, "class", "nav-fixed");
    			add_location(div, file$t, 15, 6, 269);
    			attr_dev(nav, "class", "navbarbaja svelte-1h8dx1g");
    			add_location(nav, file$t, 14, 4, 238);
    			add_location(main, file$t, 11, 0, 199);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, nav);
    			append_dev(nav, div);
    			append_dev(div, a0);
    			append_dev(a0, img);
    			append_dev(div, t0);
    			append_dev(div, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a1);
    			append_dev(a1, i0);
    			append_dev(div, t2);
    			append_dev(div, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a2);
    			append_dev(a2, i1);
    			append_dev(main, t4);
    			mount_component(router, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a1)),
    					listen_dev(a2, "click", /*click_handler*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function share() {
    	Website2APK.shareIntent();
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => share();
    	$$self.$capture_state = () => ({ Router, link, routes, share });
    	return [click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$w.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var materialize = createCommonjsModule(function (module, exports) {
    /*!
     * Materialize v1.0.0 (http://materializecss.com)
     * Copyright 2014-2017 Materialize
     * MIT License (https://raw.githubusercontent.com/Dogfalo/materialize/master/LICENSE)
     */
    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    /*! cash-dom 1.3.5, https://github.com/kenwheeler/cash @license MIT */
    (function (factory) {
      window.cash = factory();
    })(function () {
      var doc = document,
          win = window,
          ArrayProto = Array.prototype,
          slice = ArrayProto.slice,
          filter = ArrayProto.filter,
          push = ArrayProto.push;

      var noop = function () {},
          isFunction = function (item) {
        // @see https://crbug.com/568448
        return typeof item === typeof noop && item.call;
      },
          isString = function (item) {
        return typeof item === typeof "";
      };

      var idMatch = /^#[\w-]*$/,
          classMatch = /^\.[\w-]*$/,
          htmlMatch = /<.+>/,
          singlet = /^\w+$/;

      function find(selector, context) {
        context = context || doc;
        var elems = classMatch.test(selector) ? context.getElementsByClassName(selector.slice(1)) : singlet.test(selector) ? context.getElementsByTagName(selector) : context.querySelectorAll(selector);
        return elems;
      }

      var frag;
      function parseHTML(str) {
        if (!frag) {
          frag = doc.implementation.createHTMLDocument(null);
          var base = frag.createElement("base");
          base.href = doc.location.href;
          frag.head.appendChild(base);
        }

        frag.body.innerHTML = str;

        return frag.body.childNodes;
      }

      function onReady(fn) {
        if (doc.readyState !== "loading") {
          fn();
        } else {
          doc.addEventListener("DOMContentLoaded", fn);
        }
      }

      function Init(selector, context) {
        if (!selector) {
          return this;
        }

        // If already a cash collection, don't do any further processing
        if (selector.cash && selector !== win) {
          return selector;
        }

        var elems = selector,
            i = 0,
            length;

        if (isString(selector)) {
          elems = idMatch.test(selector) ?
          // If an ID use the faster getElementById check
          doc.getElementById(selector.slice(1)) : htmlMatch.test(selector) ?
          // If HTML, parse it into real elements
          parseHTML(selector) :
          // else use `find`
          find(selector, context);

          // If function, use as shortcut for DOM ready
        } else if (isFunction(selector)) {
          onReady(selector);return this;
        }

        if (!elems) {
          return this;
        }

        // If a single DOM element is passed in or received via ID, return the single element
        if (elems.nodeType || elems === win) {
          this[0] = elems;
          this.length = 1;
        } else {
          // Treat like an array and loop through each item.
          length = this.length = elems.length;
          for (; i < length; i++) {
            this[i] = elems[i];
          }
        }

        return this;
      }

      function cash(selector, context) {
        return new Init(selector, context);
      }

      var fn = cash.fn = cash.prototype = Init.prototype = { // jshint ignore:line
        cash: true,
        length: 0,
        push: push,
        splice: ArrayProto.splice,
        map: ArrayProto.map,
        init: Init
      };

      Object.defineProperty(fn, "constructor", { value: cash });

      cash.parseHTML = parseHTML;
      cash.noop = noop;
      cash.isFunction = isFunction;
      cash.isString = isString;

      cash.extend = fn.extend = function (target) {
        target = target || {};

        var args = slice.call(arguments),
            length = args.length,
            i = 1;

        if (args.length === 1) {
          target = this;
          i = 0;
        }

        for (; i < length; i++) {
          if (!args[i]) {
            continue;
          }
          for (var key in args[i]) {
            if (args[i].hasOwnProperty(key)) {
              target[key] = args[i][key];
            }
          }
        }

        return target;
      };

      function each(collection, callback) {
        var l = collection.length,
            i = 0;

        for (; i < l; i++) {
          if (callback.call(collection[i], collection[i], i, collection) === false) {
            break;
          }
        }
      }

      function matches(el, selector) {
        var m = el && (el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector);
        return !!m && m.call(el, selector);
      }

      function getCompareFunction(selector) {
        return (
          /* Use browser's `matches` function if string */
          isString(selector) ? matches :
          /* Match a cash element */
          selector.cash ? function (el) {
            return selector.is(el);
          } :
          /* Direct comparison */
          function (el, selector) {
            return el === selector;
          }
        );
      }

      function unique(collection) {
        return cash(slice.call(collection).filter(function (item, index, self) {
          return self.indexOf(item) === index;
        }));
      }

      cash.extend({
        merge: function (first, second) {
          var len = +second.length,
              i = first.length,
              j = 0;

          for (; j < len; i++, j++) {
            first[i] = second[j];
          }

          first.length = i;
          return first;
        },

        each: each,
        matches: matches,
        unique: unique,
        isArray: Array.isArray,
        isNumeric: function (n) {
          return !isNaN(parseFloat(n)) && isFinite(n);
        }

      });

      var uid = cash.uid = "_cash" + Date.now();

      function getDataCache(node) {
        return node[uid] = node[uid] || {};
      }

      function setData(node, key, value) {
        return getDataCache(node)[key] = value;
      }

      function getData(node, key) {
        var c = getDataCache(node);
        if (c[key] === undefined) {
          c[key] = node.dataset ? node.dataset[key] : cash(node).attr("data-" + key);
        }
        return c[key];
      }

      function removeData(node, key) {
        var c = getDataCache(node);
        if (c) {
          delete c[key];
        } else if (node.dataset) {
          delete node.dataset[key];
        } else {
          cash(node).removeAttr("data-" + name);
        }
      }

      fn.extend({
        data: function (name, value) {
          if (isString(name)) {
            return value === undefined ? getData(this[0], name) : this.each(function (v) {
              return setData(v, name, value);
            });
          }

          for (var key in name) {
            this.data(key, name[key]);
          }

          return this;
        },

        removeData: function (key) {
          return this.each(function (v) {
            return removeData(v, key);
          });
        }

      });

      var notWhiteMatch = /\S+/g;

      function getClasses(c) {
        return isString(c) && c.match(notWhiteMatch);
      }

      function hasClass(v, c) {
        return v.classList ? v.classList.contains(c) : new RegExp("(^| )" + c + "( |$)", "gi").test(v.className);
      }

      function addClass(v, c, spacedName) {
        if (v.classList) {
          v.classList.add(c);
        } else if (spacedName.indexOf(" " + c + " ")) {
          v.className += " " + c;
        }
      }

      function removeClass(v, c) {
        if (v.classList) {
          v.classList.remove(c);
        } else {
          v.className = v.className.replace(c, "");
        }
      }

      fn.extend({
        addClass: function (c) {
          var classes = getClasses(c);

          return classes ? this.each(function (v) {
            var spacedName = " " + v.className + " ";
            each(classes, function (c) {
              addClass(v, c, spacedName);
            });
          }) : this;
        },

        attr: function (name, value) {
          if (!name) {
            return undefined;
          }

          if (isString(name)) {
            if (value === undefined) {
              return this[0] ? this[0].getAttribute ? this[0].getAttribute(name) : this[0][name] : undefined;
            }

            return this.each(function (v) {
              if (v.setAttribute) {
                v.setAttribute(name, value);
              } else {
                v[name] = value;
              }
            });
          }

          for (var key in name) {
            this.attr(key, name[key]);
          }

          return this;
        },

        hasClass: function (c) {
          var check = false,
              classes = getClasses(c);
          if (classes && classes.length) {
            this.each(function (v) {
              check = hasClass(v, classes[0]);
              return !check;
            });
          }
          return check;
        },

        prop: function (name, value) {
          if (isString(name)) {
            return value === undefined ? this[0][name] : this.each(function (v) {
              v[name] = value;
            });
          }

          for (var key in name) {
            this.prop(key, name[key]);
          }

          return this;
        },

        removeAttr: function (name) {
          return this.each(function (v) {
            if (v.removeAttribute) {
              v.removeAttribute(name);
            } else {
              delete v[name];
            }
          });
        },

        removeClass: function (c) {
          if (!arguments.length) {
            return this.attr("class", "");
          }
          var classes = getClasses(c);
          return classes ? this.each(function (v) {
            each(classes, function (c) {
              removeClass(v, c);
            });
          }) : this;
        },

        removeProp: function (name) {
          return this.each(function (v) {
            delete v[name];
          });
        },

        toggleClass: function (c, state) {
          if (state !== undefined) {
            return this[state ? "addClass" : "removeClass"](c);
          }
          var classes = getClasses(c);
          return classes ? this.each(function (v) {
            var spacedName = " " + v.className + " ";
            each(classes, function (c) {
              if (hasClass(v, c)) {
                removeClass(v, c);
              } else {
                addClass(v, c, spacedName);
              }
            });
          }) : this;
        } });

      fn.extend({
        add: function (selector, context) {
          return unique(cash.merge(this, cash(selector, context)));
        },

        each: function (callback) {
          each(this, callback);
          return this;
        },

        eq: function (index) {
          return cash(this.get(index));
        },

        filter: function (selector) {
          if (!selector) {
            return this;
          }

          var comparator = isFunction(selector) ? selector : getCompareFunction(selector);

          return cash(filter.call(this, function (e) {
            return comparator(e, selector);
          }));
        },

        first: function () {
          return this.eq(0);
        },

        get: function (index) {
          if (index === undefined) {
            return slice.call(this);
          }
          return index < 0 ? this[index + this.length] : this[index];
        },

        index: function (elem) {
          var child = elem ? cash(elem)[0] : this[0],
              collection = elem ? this : cash(child).parent().children();
          return slice.call(collection).indexOf(child);
        },

        last: function () {
          return this.eq(-1);
        }

      });

      var camelCase = function () {
        var camelRegex = /(?:^\w|[A-Z]|\b\w)/g,
            whiteSpace = /[\s-_]+/g;
        return function (str) {
          return str.replace(camelRegex, function (letter, index) {
            return letter[index === 0 ? "toLowerCase" : "toUpperCase"]();
          }).replace(whiteSpace, "");
        };
      }();

      var getPrefixedProp = function () {
        var cache = {},
            doc = document,
            div = doc.createElement("div"),
            style = div.style;

        return function (prop) {
          prop = camelCase(prop);
          if (cache[prop]) {
            return cache[prop];
          }

          var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
              prefixes = ["webkit", "moz", "ms", "o"],
              props = (prop + " " + prefixes.join(ucProp + " ") + ucProp).split(" ");

          each(props, function (p) {
            if (p in style) {
              cache[p] = prop = cache[prop] = p;
              return false;
            }
          });

          return cache[prop];
        };
      }();

      cash.prefixedProp = getPrefixedProp;
      cash.camelCase = camelCase;

      fn.extend({
        css: function (prop, value) {
          if (isString(prop)) {
            prop = getPrefixedProp(prop);
            return arguments.length > 1 ? this.each(function (v) {
              return v.style[prop] = value;
            }) : win.getComputedStyle(this[0])[prop];
          }

          for (var key in prop) {
            this.css(key, prop[key]);
          }

          return this;
        }

      });

      function compute(el, prop) {
        return parseInt(win.getComputedStyle(el[0], null)[prop], 10) || 0;
      }

      each(["Width", "Height"], function (v) {
        var lower = v.toLowerCase();

        fn[lower] = function () {
          return this[0].getBoundingClientRect()[lower];
        };

        fn["inner" + v] = function () {
          return this[0]["client" + v];
        };

        fn["outer" + v] = function (margins) {
          return this[0]["offset" + v] + (margins ? compute(this, "margin" + (v === "Width" ? "Left" : "Top")) + compute(this, "margin" + (v === "Width" ? "Right" : "Bottom")) : 0);
        };
      });

      function registerEvent(node, eventName, callback) {
        var eventCache = getData(node, "_cashEvents") || setData(node, "_cashEvents", {});
        eventCache[eventName] = eventCache[eventName] || [];
        eventCache[eventName].push(callback);
        node.addEventListener(eventName, callback);
      }

      function removeEvent(node, eventName, callback) {
        var events = getData(node, "_cashEvents"),
            eventCache = events && events[eventName],
            index;

        if (!eventCache) {
          return;
        }

        if (callback) {
          node.removeEventListener(eventName, callback);
          index = eventCache.indexOf(callback);
          if (index >= 0) {
            eventCache.splice(index, 1);
          }
        } else {
          each(eventCache, function (event) {
            node.removeEventListener(eventName, event);
          });
          eventCache = [];
        }
      }

      fn.extend({
        off: function (eventName, callback) {
          return this.each(function (v) {
            return removeEvent(v, eventName, callback);
          });
        },

        on: function (eventName, delegate, callback, runOnce) {
          // jshint ignore:line
          var originalCallback;
          if (!isString(eventName)) {
            for (var key in eventName) {
              this.on(key, delegate, eventName[key]);
            }
            return this;
          }

          if (isFunction(delegate)) {
            callback = delegate;
            delegate = null;
          }

          if (eventName === "ready") {
            onReady(callback);
            return this;
          }

          if (delegate) {
            originalCallback = callback;
            callback = function (e) {
              var t = e.target;
              while (!matches(t, delegate)) {
                if (t === this || t === null) {
                  return t = false;
                }

                t = t.parentNode;
              }

              if (t) {
                originalCallback.call(t, e);
              }
            };
          }

          return this.each(function (v) {
            var finalCallback = callback;
            if (runOnce) {
              finalCallback = function () {
                callback.apply(this, arguments);
                removeEvent(v, eventName, finalCallback);
              };
            }
            registerEvent(v, eventName, finalCallback);
          });
        },

        one: function (eventName, delegate, callback) {
          return this.on(eventName, delegate, callback, true);
        },

        ready: onReady,

        /**
         * Modified
         * Triggers browser event
         * @param String eventName
         * @param Object data - Add properties to event object
         */
        trigger: function (eventName, data) {
          if (document.createEvent) {
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent(eventName, true, false);
            evt = this.extend(evt, data);
            return this.each(function (v) {
              return v.dispatchEvent(evt);
            });
          }
        }

      });

      function encode(name, value) {
        return "&" + encodeURIComponent(name) + "=" + encodeURIComponent(value).replace(/%20/g, "+");
      }

      function getSelectMultiple_(el) {
        var values = [];
        each(el.options, function (o) {
          if (o.selected) {
            values.push(o.value);
          }
        });
        return values.length ? values : null;
      }

      function getSelectSingle_(el) {
        var selectedIndex = el.selectedIndex;
        return selectedIndex >= 0 ? el.options[selectedIndex].value : null;
      }

      function getValue(el) {
        var type = el.type;
        if (!type) {
          return null;
        }
        switch (type.toLowerCase()) {
          case "select-one":
            return getSelectSingle_(el);
          case "select-multiple":
            return getSelectMultiple_(el);
          case "radio":
            return el.checked ? el.value : null;
          case "checkbox":
            return el.checked ? el.value : null;
          default:
            return el.value ? el.value : null;
        }
      }

      fn.extend({
        serialize: function () {
          var query = "";

          each(this[0].elements || this, function (el) {
            if (el.disabled || el.tagName === "FIELDSET") {
              return;
            }
            var name = el.name;
            switch (el.type.toLowerCase()) {
              case "file":
              case "reset":
              case "submit":
              case "button":
                break;
              case "select-multiple":
                var values = getValue(el);
                if (values !== null) {
                  each(values, function (value) {
                    query += encode(name, value);
                  });
                }
                break;
              default:
                var value = getValue(el);
                if (value !== null) {
                  query += encode(name, value);
                }
            }
          });

          return query.substr(1);
        },

        val: function (value) {
          if (value === undefined) {
            return getValue(this[0]);
          }

          return this.each(function (v) {
            return v.value = value;
          });
        }

      });

      function insertElement(el, child, prepend) {
        if (prepend) {
          var first = el.childNodes[0];
          el.insertBefore(child, first);
        } else {
          el.appendChild(child);
        }
      }

      function insertContent(parent, child, prepend) {
        var str = isString(child);

        if (!str && child.length) {
          each(child, function (v) {
            return insertContent(parent, v, prepend);
          });
          return;
        }

        each(parent, str ? function (v) {
          return v.insertAdjacentHTML(prepend ? "afterbegin" : "beforeend", child);
        } : function (v, i) {
          return insertElement(v, i === 0 ? child : child.cloneNode(true), prepend);
        });
      }

      fn.extend({
        after: function (selector) {
          cash(selector).insertAfter(this);
          return this;
        },

        append: function (content) {
          insertContent(this, content);
          return this;
        },

        appendTo: function (parent) {
          insertContent(cash(parent), this);
          return this;
        },

        before: function (selector) {
          cash(selector).insertBefore(this);
          return this;
        },

        clone: function () {
          return cash(this.map(function (v) {
            return v.cloneNode(true);
          }));
        },

        empty: function () {
          this.html("");
          return this;
        },

        html: function (content) {
          if (content === undefined) {
            return this[0].innerHTML;
          }
          var source = content.nodeType ? content[0].outerHTML : content;
          return this.each(function (v) {
            return v.innerHTML = source;
          });
        },

        insertAfter: function (selector) {
          var _this = this;

          cash(selector).each(function (el, i) {
            var parent = el.parentNode,
                sibling = el.nextSibling;
            _this.each(function (v) {
              parent.insertBefore(i === 0 ? v : v.cloneNode(true), sibling);
            });
          });

          return this;
        },

        insertBefore: function (selector) {
          var _this2 = this;
          cash(selector).each(function (el, i) {
            var parent = el.parentNode;
            _this2.each(function (v) {
              parent.insertBefore(i === 0 ? v : v.cloneNode(true), el);
            });
          });
          return this;
        },

        prepend: function (content) {
          insertContent(this, content, true);
          return this;
        },

        prependTo: function (parent) {
          insertContent(cash(parent), this, true);
          return this;
        },

        remove: function () {
          return this.each(function (v) {
            if (!!v.parentNode) {
              return v.parentNode.removeChild(v);
            }
          });
        },

        text: function (content) {
          if (content === undefined) {
            return this[0].textContent;
          }
          return this.each(function (v) {
            return v.textContent = content;
          });
        }

      });

      var docEl = doc.documentElement;

      fn.extend({
        position: function () {
          var el = this[0];
          return {
            left: el.offsetLeft,
            top: el.offsetTop
          };
        },

        offset: function () {
          var rect = this[0].getBoundingClientRect();
          return {
            top: rect.top + win.pageYOffset - docEl.clientTop,
            left: rect.left + win.pageXOffset - docEl.clientLeft
          };
        },

        offsetParent: function () {
          return cash(this[0].offsetParent);
        }

      });

      fn.extend({
        children: function (selector) {
          var elems = [];
          this.each(function (el) {
            push.apply(elems, el.children);
          });
          elems = unique(elems);

          return !selector ? elems : elems.filter(function (v) {
            return matches(v, selector);
          });
        },

        closest: function (selector) {
          if (!selector || this.length < 1) {
            return cash();
          }
          if (this.is(selector)) {
            return this.filter(selector);
          }
          return this.parent().closest(selector);
        },

        is: function (selector) {
          if (!selector) {
            return false;
          }

          var match = false,
              comparator = getCompareFunction(selector);

          this.each(function (el) {
            match = comparator(el, selector);
            return !match;
          });

          return match;
        },

        find: function (selector) {
          if (!selector || selector.nodeType) {
            return cash(selector && this.has(selector).length ? selector : null);
          }

          var elems = [];
          this.each(function (el) {
            push.apply(elems, find(selector, el));
          });

          return unique(elems);
        },

        has: function (selector) {
          var comparator = isString(selector) ? function (el) {
            return find(selector, el).length !== 0;
          } : function (el) {
            return el.contains(selector);
          };

          return this.filter(comparator);
        },

        next: function () {
          return cash(this[0].nextElementSibling);
        },

        not: function (selector) {
          if (!selector) {
            return this;
          }

          var comparator = getCompareFunction(selector);

          return this.filter(function (el) {
            return !comparator(el, selector);
          });
        },

        parent: function () {
          var result = [];

          this.each(function (item) {
            if (item && item.parentNode) {
              result.push(item.parentNode);
            }
          });

          return unique(result);
        },

        parents: function (selector) {
          var last,
              result = [];

          this.each(function (item) {
            last = item;

            while (last && last.parentNode && last !== doc.body.parentNode) {
              last = last.parentNode;

              if (!selector || selector && matches(last, selector)) {
                result.push(last);
              }
            }
          });

          return unique(result);
        },

        prev: function () {
          return cash(this[0].previousElementSibling);
        },

        siblings: function (selector) {
          var collection = this.parent().children(selector),
              el = this[0];

          return collection.filter(function (i) {
            return i !== el;
          });
        }

      });

      return cash;
    });
    var Component = function () {
      /**
       * Generic constructor for all components
       * @constructor
       * @param {Element} el
       * @param {Object} options
       */
      function Component(classDef, el, options) {
        _classCallCheck(this, Component);

        // Display error if el is valid HTML Element
        if (!(el instanceof Element)) {
          console.error(Error(el + ' is not an HTML Element'));
        }

        // If exists, destroy and reinitialize in child
        var ins = classDef.getInstance(el);
        if (!!ins) {
          ins.destroy();
        }

        this.el = el;
        this.$el = cash(el);
      }

      /**
       * Initializes components
       * @param {class} classDef
       * @param {Element | NodeList | jQuery} els
       * @param {Object} options
       */


      _createClass(Component, null, [{
        key: "init",
        value: function init(classDef, els, options) {
          var instances = null;
          if (els instanceof Element) {
            instances = new classDef(els, options);
          } else if (!!els && (els.jquery || els.cash || els instanceof NodeList)) {
            var instancesArr = [];
            for (var i = 0; i < els.length; i++) {
              instancesArr.push(new classDef(els[i], options));
            }
            instances = instancesArr;
          }

          return instances;
        }
      }]);

      return Component;
    }();
    (function (window) {
      if (window.Package) {
        M = {};
      } else {
        window.M = {};
      }

      // Check for jQuery
      M.jQueryLoaded = !!window.jQuery;
    })(window);

    // AMD
    if ( !exports.nodeType) {
      if ( !module.nodeType && module.exports) {
        exports = module.exports = M;
      }
      exports.default = M;
    }

    M.version = '1.0.0';

    M.keys = {
      TAB: 9,
      ENTER: 13,
      ESC: 27,
      ARROW_UP: 38,
      ARROW_DOWN: 40
    };

    /**
     * TabPress Keydown handler
     */
    M.tabPressed = false;
    M.keyDown = false;
    var docHandleKeydown = function (e) {
      M.keyDown = true;
      if (e.which === M.keys.TAB || e.which === M.keys.ARROW_DOWN || e.which === M.keys.ARROW_UP) {
        M.tabPressed = true;
      }
    };
    var docHandleKeyup = function (e) {
      M.keyDown = false;
      if (e.which === M.keys.TAB || e.which === M.keys.ARROW_DOWN || e.which === M.keys.ARROW_UP) {
        M.tabPressed = false;
      }
    };
    var docHandleFocus = function (e) {
      if (M.keyDown) {
        document.body.classList.add('keyboard-focused');
      }
    };
    var docHandleBlur = function (e) {
      document.body.classList.remove('keyboard-focused');
    };
    document.addEventListener('keydown', docHandleKeydown, true);
    document.addEventListener('keyup', docHandleKeyup, true);
    document.addEventListener('focus', docHandleFocus, true);
    document.addEventListener('blur', docHandleBlur, true);

    /**
     * Initialize jQuery wrapper for plugin
     * @param {Class} plugin  javascript class
     * @param {string} pluginName  jQuery plugin name
     * @param {string} classRef  Class reference name
     */
    M.initializeJqueryWrapper = function (plugin, pluginName, classRef) {
      jQuery.fn[pluginName] = function (methodOrOptions) {
        // Call plugin method if valid method name is passed in
        if (plugin.prototype[methodOrOptions]) {
          var params = Array.prototype.slice.call(arguments, 1);

          // Getter methods
          if (methodOrOptions.slice(0, 3) === 'get') {
            var instance = this.first()[0][classRef];
            return instance[methodOrOptions].apply(instance, params);
          }

          // Void methods
          return this.each(function () {
            var instance = this[classRef];
            instance[methodOrOptions].apply(instance, params);
          });

          // Initialize plugin if options or no argument is passed in
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
          plugin.init(this, arguments[0]);
          return this;
        }

        // Return error if an unrecognized  method name is passed in
        jQuery.error("Method " + methodOrOptions + " does not exist on jQuery." + pluginName);
      };
    };

    /**
     * Automatically initialize components
     * @param {Element} context  DOM Element to search within for components
     */
    M.AutoInit = function (context) {
      // Use document.body if no context is given
      var root = !!context ? context : document.body;

      var registry = {
        Autocomplete: root.querySelectorAll('.autocomplete:not(.no-autoinit)'),
        Carousel: root.querySelectorAll('.carousel:not(.no-autoinit)'),
        Chips: root.querySelectorAll('.chips:not(.no-autoinit)'),
        Collapsible: root.querySelectorAll('.collapsible:not(.no-autoinit)'),
        Datepicker: root.querySelectorAll('.datepicker:not(.no-autoinit)'),
        Dropdown: root.querySelectorAll('.dropdown-trigger:not(.no-autoinit)'),
        Materialbox: root.querySelectorAll('.materialboxed:not(.no-autoinit)'),
        Modal: root.querySelectorAll('.modal:not(.no-autoinit)'),
        Parallax: root.querySelectorAll('.parallax:not(.no-autoinit)'),
        Pushpin: root.querySelectorAll('.pushpin:not(.no-autoinit)'),
        ScrollSpy: root.querySelectorAll('.scrollspy:not(.no-autoinit)'),
        FormSelect: root.querySelectorAll('select:not(.no-autoinit)'),
        Sidenav: root.querySelectorAll('.sidenav:not(.no-autoinit)'),
        Tabs: root.querySelectorAll('.tabs:not(.no-autoinit)'),
        TapTarget: root.querySelectorAll('.tap-target:not(.no-autoinit)'),
        Timepicker: root.querySelectorAll('.timepicker:not(.no-autoinit)'),
        Tooltip: root.querySelectorAll('.tooltipped:not(.no-autoinit)'),
        FloatingActionButton: root.querySelectorAll('.fixed-action-btn:not(.no-autoinit)')
      };

      for (var pluginName in registry) {
        var plugin = M[pluginName];
        plugin.init(registry[pluginName]);
      }
    };

    /**
     * Generate approximated selector string for a jQuery object
     * @param {jQuery} obj  jQuery object to be parsed
     * @returns {string}
     */
    M.objectSelectorString = function (obj) {
      var tagStr = obj.prop('tagName') || '';
      var idStr = obj.attr('id') || '';
      var classStr = obj.attr('class') || '';
      return (tagStr + idStr + classStr).replace(/\s/g, '');
    };

    // Unique Random ID
    M.guid = function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      };
    }();

    /**
     * Escapes hash from special characters
     * @param {string} hash  String returned from this.hash
     * @returns {string}
     */
    M.escapeHash = function (hash) {
      return hash.replace(/(:|\.|\[|\]|,|=|\/)/g, '\\$1');
    };

    M.elementOrParentIsFixed = function (element) {
      var $element = $(element);
      var $checkElements = $element.add($element.parents());
      var isFixed = false;
      $checkElements.each(function () {
        if ($(this).css('position') === 'fixed') {
          isFixed = true;
          return false;
        }
      });
      return isFixed;
    };

    /**
     * @typedef {Object} Edges
     * @property {Boolean} top  If the top edge was exceeded
     * @property {Boolean} right  If the right edge was exceeded
     * @property {Boolean} bottom  If the bottom edge was exceeded
     * @property {Boolean} left  If the left edge was exceeded
     */

    /**
     * @typedef {Object} Bounding
     * @property {Number} left  left offset coordinate
     * @property {Number} top  top offset coordinate
     * @property {Number} width
     * @property {Number} height
     */

    /**
     * Escapes hash from special characters
     * @param {Element} container  Container element that acts as the boundary
     * @param {Bounding} bounding  element bounding that is being checked
     * @param {Number} offset  offset from edge that counts as exceeding
     * @returns {Edges}
     */
    M.checkWithinContainer = function (container, bounding, offset) {
      var edges = {
        top: false,
        right: false,
        bottom: false,
        left: false
      };

      var containerRect = container.getBoundingClientRect();
      // If body element is smaller than viewport, use viewport height instead.
      var containerBottom = container === document.body ? Math.max(containerRect.bottom, window.innerHeight) : containerRect.bottom;

      var scrollLeft = container.scrollLeft;
      var scrollTop = container.scrollTop;

      var scrolledX = bounding.left - scrollLeft;
      var scrolledY = bounding.top - scrollTop;

      // Check for container and viewport for each edge
      if (scrolledX < containerRect.left + offset || scrolledX < offset) {
        edges.left = true;
      }

      if (scrolledX + bounding.width > containerRect.right - offset || scrolledX + bounding.width > window.innerWidth - offset) {
        edges.right = true;
      }

      if (scrolledY < containerRect.top + offset || scrolledY < offset) {
        edges.top = true;
      }

      if (scrolledY + bounding.height > containerBottom - offset || scrolledY + bounding.height > window.innerHeight - offset) {
        edges.bottom = true;
      }

      return edges;
    };

    M.checkPossibleAlignments = function (el, container, bounding, offset) {
      var canAlign = {
        top: true,
        right: true,
        bottom: true,
        left: true,
        spaceOnTop: null,
        spaceOnRight: null,
        spaceOnBottom: null,
        spaceOnLeft: null
      };

      var containerAllowsOverflow = getComputedStyle(container).overflow === 'visible';
      var containerRect = container.getBoundingClientRect();
      var containerHeight = Math.min(containerRect.height, window.innerHeight);
      var containerWidth = Math.min(containerRect.width, window.innerWidth);
      var elOffsetRect = el.getBoundingClientRect();

      var scrollLeft = container.scrollLeft;
      var scrollTop = container.scrollTop;

      var scrolledX = bounding.left - scrollLeft;
      var scrolledYTopEdge = bounding.top - scrollTop;
      var scrolledYBottomEdge = bounding.top + elOffsetRect.height - scrollTop;

      // Check for container and viewport for left
      canAlign.spaceOnRight = !containerAllowsOverflow ? containerWidth - (scrolledX + bounding.width) : window.innerWidth - (elOffsetRect.left + bounding.width);
      if (canAlign.spaceOnRight < 0) {
        canAlign.left = false;
      }

      // Check for container and viewport for Right
      canAlign.spaceOnLeft = !containerAllowsOverflow ? scrolledX - bounding.width + elOffsetRect.width : elOffsetRect.right - bounding.width;
      if (canAlign.spaceOnLeft < 0) {
        canAlign.right = false;
      }

      // Check for container and viewport for Top
      canAlign.spaceOnBottom = !containerAllowsOverflow ? containerHeight - (scrolledYTopEdge + bounding.height + offset) : window.innerHeight - (elOffsetRect.top + bounding.height + offset);
      if (canAlign.spaceOnBottom < 0) {
        canAlign.top = false;
      }

      // Check for container and viewport for Bottom
      canAlign.spaceOnTop = !containerAllowsOverflow ? scrolledYBottomEdge - (bounding.height - offset) : elOffsetRect.bottom - (bounding.height + offset);
      if (canAlign.spaceOnTop < 0) {
        canAlign.bottom = false;
      }

      return canAlign;
    };

    M.getOverflowParent = function (element) {
      if (element == null) {
        return null;
      }

      if (element === document.body || getComputedStyle(element).overflow !== 'visible') {
        return element;
      }

      return M.getOverflowParent(element.parentElement);
    };

    /**
     * Gets id of component from a trigger
     * @param {Element} trigger  trigger
     * @returns {string}
     */
    M.getIdFromTrigger = function (trigger) {
      var id = trigger.getAttribute('data-target');
      if (!id) {
        id = trigger.getAttribute('href');
        if (id) {
          id = id.slice(1);
        } else {
          id = '';
        }
      }
      return id;
    };

    /**
     * Multi browser support for document scroll top
     * @returns {Number}
     */
    M.getDocumentScrollTop = function () {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    };

    /**
     * Multi browser support for document scroll left
     * @returns {Number}
     */
    M.getDocumentScrollLeft = function () {
      return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    };

    /**
     * @typedef {Object} Edges
     * @property {Boolean} top  If the top edge was exceeded
     * @property {Boolean} right  If the right edge was exceeded
     * @property {Boolean} bottom  If the bottom edge was exceeded
     * @property {Boolean} left  If the left edge was exceeded
     */

    /**
     * @typedef {Object} Bounding
     * @property {Number} left  left offset coordinate
     * @property {Number} top  top offset coordinate
     * @property {Number} width
     * @property {Number} height
     */

    /**
     * Get time in ms
     * @license https://raw.github.com/jashkenas/underscore/master/LICENSE
     * @type {function}
     * @return {number}
     */
    var getTime = Date.now || function () {
      return new Date().getTime();
    };

    /**
     * Returns a function, that, when invoked, will only be triggered at most once
     * during a given window of time. Normally, the throttled function will run
     * as much as it can, without ever going more than once per `wait` duration;
     * but if you'd like to disable the execution on the leading edge, pass
     * `{leading: false}`. To disable execution on the trailing edge, ditto.
     * @license https://raw.github.com/jashkenas/underscore/master/LICENSE
     * @param {function} func
     * @param {number} wait
     * @param {Object=} options
     * @returns {Function}
     */
    M.throttle = function (func, wait, options) {
      var context = void 0,
          args = void 0,
          result = void 0;
      var timeout = null;
      var previous = 0;
      options || (options = {});
      var later = function () {
        previous = options.leading === false ? 0 : getTime();
        timeout = null;
        result = func.apply(context, args);
        context = args = null;
      };
      return function () {
        var now = getTime();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
          context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    };
    var $jscomp = { scope: {} };$jscomp.defineProperty = "function" == typeof Object.defineProperties ? Object.defineProperty : function (e, r, p) {
      if (p.get || p.set) throw new TypeError("ES3 does not support getters and setters.");e != Array.prototype && e != Object.prototype && (e[r] = p.value);
    };$jscomp.getGlobal = function (e) {
      return "undefined" != typeof window && window === e ? e : "undefined" != typeof commonjsGlobal && null != commonjsGlobal ? commonjsGlobal : e;
    };$jscomp.global = $jscomp.getGlobal(commonjsGlobal);$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";
    $jscomp.initSymbol = function () {
      $jscomp.initSymbol = function () {};$jscomp.global.Symbol || ($jscomp.global.Symbol = $jscomp.Symbol);
    };$jscomp.symbolCounter_ = 0;$jscomp.Symbol = function (e) {
      return $jscomp.SYMBOL_PREFIX + (e || "") + $jscomp.symbolCounter_++;
    };
    $jscomp.initSymbolIterator = function () {
      $jscomp.initSymbol();var e = $jscomp.global.Symbol.iterator;e || (e = $jscomp.global.Symbol.iterator = $jscomp.global.Symbol("iterator"));"function" != typeof Array.prototype[e] && $jscomp.defineProperty(Array.prototype, e, { configurable: !0, writable: !0, value: function () {
          return $jscomp.arrayIterator(this);
        } });$jscomp.initSymbolIterator = function () {};
    };$jscomp.arrayIterator = function (e) {
      var r = 0;return $jscomp.iteratorPrototype(function () {
        return r < e.length ? { done: !1, value: e[r++] } : { done: !0 };
      });
    };
    $jscomp.iteratorPrototype = function (e) {
      $jscomp.initSymbolIterator();e = { next: e };e[$jscomp.global.Symbol.iterator] = function () {
        return this;
      };return e;
    };$jscomp.array = $jscomp.array || {};$jscomp.iteratorFromArray = function (e, r) {
      $jscomp.initSymbolIterator();e instanceof String && (e += "");var p = 0,
          m = { next: function () {
          if (p < e.length) {
            var u = p++;return { value: r(u, e[u]), done: !1 };
          }m.next = function () {
            return { done: !0, value: void 0 };
          };return m.next();
        } };m[Symbol.iterator] = function () {
        return m;
      };return m;
    };
    $jscomp.polyfill = function (e, r, p, m) {
      if (r) {
        p = $jscomp.global;e = e.split(".");for (m = 0; m < e.length - 1; m++) {
          var u = e[m];u in p || (p[u] = {});p = p[u];
        }e = e[e.length - 1];m = p[e];r = r(m);r != m && null != r && $jscomp.defineProperty(p, e, { configurable: !0, writable: !0, value: r });
      }
    };$jscomp.polyfill("Array.prototype.keys", function (e) {
      return e ? e : function () {
        return $jscomp.iteratorFromArray(this, function (e) {
          return e;
        });
      };
    }, "es6-impl", "es3");var $jscomp$this = commonjsGlobal;
    (function (r) {
      M.anime = r();
    })(function () {
      function e(a) {
        if (!h.col(a)) try {
          return document.querySelectorAll(a);
        } catch (c) {}
      }function r(a, c) {
        for (var d = a.length, b = 2 <= arguments.length ? arguments[1] : void 0, f = [], n = 0; n < d; n++) {
          if (n in a) {
            var k = a[n];c.call(b, k, n, a) && f.push(k);
          }
        }return f;
      }function p(a) {
        return a.reduce(function (a, d) {
          return a.concat(h.arr(d) ? p(d) : d);
        }, []);
      }function m(a) {
        if (h.arr(a)) return a;
        h.str(a) && (a = e(a) || a);return a instanceof NodeList || a instanceof HTMLCollection ? [].slice.call(a) : [a];
      }function u(a, c) {
        return a.some(function (a) {
          return a === c;
        });
      }function C(a) {
        var c = {},
            d;for (d in a) {
          c[d] = a[d];
        }return c;
      }function D(a, c) {
        var d = C(a),
            b;for (b in a) {
          d[b] = c.hasOwnProperty(b) ? c[b] : a[b];
        }return d;
      }function z(a, c) {
        var d = C(a),
            b;for (b in c) {
          d[b] = h.und(a[b]) ? c[b] : a[b];
        }return d;
      }function T(a) {
        a = a.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function (a, c, d, k) {
          return c + c + d + d + k + k;
        });var c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);
        a = parseInt(c[1], 16);var d = parseInt(c[2], 16),
            c = parseInt(c[3], 16);return "rgba(" + a + "," + d + "," + c + ",1)";
      }function U(a) {
        function c(a, c, b) {
          0 > b && (b += 1);1 < b && --b;return b < 1 / 6 ? a + 6 * (c - a) * b : .5 > b ? c : b < 2 / 3 ? a + (c - a) * (2 / 3 - b) * 6 : a;
        }var d = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(a) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(a);a = parseInt(d[1]) / 360;var b = parseInt(d[2]) / 100,
            f = parseInt(d[3]) / 100,
            d = d[4] || 1;if (0 == b) f = b = a = f;else {
          var n = .5 > f ? f * (1 + b) : f + b - f * b,
              k = 2 * f - n,
              f = c(k, n, a + 1 / 3),
              b = c(k, n, a);a = c(k, n, a - 1 / 3);
        }return "rgba(" + 255 * f + "," + 255 * b + "," + 255 * a + "," + d + ")";
      }function y(a) {
        if (a = /([\+\-]?[0-9#\.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(a)) return a[2];
      }function V(a) {
        if (-1 < a.indexOf("translate") || "perspective" === a) return "px";if (-1 < a.indexOf("rotate") || -1 < a.indexOf("skew")) return "deg";
      }function I(a, c) {
        return h.fnc(a) ? a(c.target, c.id, c.total) : a;
      }function E(a, c) {
        if (c in a.style) return getComputedStyle(a).getPropertyValue(c.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()) || "0";
      }function J(a, c) {
        if (h.dom(a) && u(W, c)) return "transform";if (h.dom(a) && (a.getAttribute(c) || h.svg(a) && a[c])) return "attribute";if (h.dom(a) && "transform" !== c && E(a, c)) return "css";if (null != a[c]) return "object";
      }function X(a, c) {
        var d = V(c),
            d = -1 < c.indexOf("scale") ? 1 : 0 + d;a = a.style.transform;if (!a) return d;for (var b = [], f = [], n = [], k = /(\w+)\((.+?)\)/g; b = k.exec(a);) {
          f.push(b[1]), n.push(b[2]);
        }a = r(n, function (a, b) {
          return f[b] === c;
        });return a.length ? a[0] : d;
      }function K(a, c) {
        switch (J(a, c)) {case "transform":
            return X(a, c);case "css":
            return E(a, c);case "attribute":
            return a.getAttribute(c);}return a[c] || 0;
      }function L(a, c) {
        var d = /^(\*=|\+=|-=)/.exec(a);if (!d) return a;var b = y(a) || 0;c = parseFloat(c);a = parseFloat(a.replace(d[0], ""));switch (d[0][0]) {case "+":
            return c + a + b;case "-":
            return c - a + b;case "*":
            return c * a + b;}
      }function F(a, c) {
        return Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));
      }function M(a) {
        a = a.points;for (var c = 0, d, b = 0; b < a.numberOfItems; b++) {
          var f = a.getItem(b);0 < b && (c += F(d, f));d = f;
        }return c;
      }function N(a) {
        if (a.getTotalLength) return a.getTotalLength();switch (a.tagName.toLowerCase()) {case "circle":
            return 2 * Math.PI * a.getAttribute("r");case "rect":
            return 2 * a.getAttribute("width") + 2 * a.getAttribute("height");case "line":
            return F({ x: a.getAttribute("x1"), y: a.getAttribute("y1") }, { x: a.getAttribute("x2"), y: a.getAttribute("y2") });case "polyline":
            return M(a);case "polygon":
            var c = a.points;return M(a) + F(c.getItem(c.numberOfItems - 1), c.getItem(0));}
      }function Y(a, c) {
        function d(b) {
          b = void 0 === b ? 0 : b;return a.el.getPointAtLength(1 <= c + b ? c + b : 0);
        }var b = d(),
            f = d(-1),
            n = d(1);switch (a.property) {case "x":
            return b.x;case "y":
            return b.y;
          case "angle":
            return 180 * Math.atan2(n.y - f.y, n.x - f.x) / Math.PI;}
      }function O(a, c) {
        var d = /-?\d*\.?\d+/g,
            b;b = h.pth(a) ? a.totalLength : a;if (h.col(b)) {
          if (h.rgb(b)) {
            var f = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(b);b = f ? "rgba(" + f[1] + ",1)" : b;
          } else b = h.hex(b) ? T(b) : h.hsl(b) ? U(b) : void 0;
        } else f = (f = y(b)) ? b.substr(0, b.length - f.length) : b, b = c && !/\s/g.test(b) ? f + c : f;b += "";return { original: b, numbers: b.match(d) ? b.match(d).map(Number) : [0], strings: h.str(a) || c ? b.split(d) : [] };
      }function P(a) {
        a = a ? p(h.arr(a) ? a.map(m) : m(a)) : [];return r(a, function (a, d, b) {
          return b.indexOf(a) === d;
        });
      }function Z(a) {
        var c = P(a);return c.map(function (a, b) {
          return { target: a, id: b, total: c.length };
        });
      }function aa(a, c) {
        var d = C(c);if (h.arr(a)) {
          var b = a.length;2 !== b || h.obj(a[0]) ? h.fnc(c.duration) || (d.duration = c.duration / b) : a = { value: a };
        }return m(a).map(function (a, b) {
          b = b ? 0 : c.delay;a = h.obj(a) && !h.pth(a) ? a : { value: a };h.und(a.delay) && (a.delay = b);return a;
        }).map(function (a) {
          return z(a, d);
        });
      }function ba(a, c) {
        var d = {},
            b;for (b in a) {
          var f = I(a[b], c);h.arr(f) && (f = f.map(function (a) {
            return I(a, c);
          }), 1 === f.length && (f = f[0]));d[b] = f;
        }d.duration = parseFloat(d.duration);d.delay = parseFloat(d.delay);return d;
      }function ca(a) {
        return h.arr(a) ? A.apply(this, a) : Q[a];
      }function da(a, c) {
        var d;return a.tweens.map(function (b) {
          b = ba(b, c);var f = b.value,
              e = K(c.target, a.name),
              k = d ? d.to.original : e,
              k = h.arr(f) ? f[0] : k,
              w = L(h.arr(f) ? f[1] : f, k),
              e = y(w) || y(k) || y(e);b.from = O(k, e);b.to = O(w, e);b.start = d ? d.end : a.offset;b.end = b.start + b.delay + b.duration;b.easing = ca(b.easing);b.elasticity = (1E3 - Math.min(Math.max(b.elasticity, 1), 999)) / 1E3;b.isPath = h.pth(f);b.isColor = h.col(b.from.original);b.isColor && (b.round = 1);return d = b;
        });
      }function ea(a, c) {
        return r(p(a.map(function (a) {
          return c.map(function (b) {
            var c = J(a.target, b.name);if (c) {
              var d = da(b, a);b = { type: c, property: b.name, animatable: a, tweens: d, duration: d[d.length - 1].end, delay: d[0].delay };
            } else b = void 0;return b;
          });
        })), function (a) {
          return !h.und(a);
        });
      }function R(a, c, d, b) {
        var f = "delay" === a;return c.length ? (f ? Math.min : Math.max).apply(Math, c.map(function (b) {
          return b[a];
        })) : f ? b.delay : d.offset + b.delay + b.duration;
      }function fa(a) {
        var c = D(ga, a),
            d = D(S, a),
            b = Z(a.targets),
            f = [],
            e = z(c, d),
            k;for (k in a) {
          e.hasOwnProperty(k) || "targets" === k || f.push({ name: k, offset: e.offset, tweens: aa(a[k], d) });
        }a = ea(b, f);return z(c, { children: [], animatables: b, animations: a, duration: R("duration", a, c, d), delay: R("delay", a, c, d) });
      }function q(a) {
        function c() {
          return window.Promise && new Promise(function (a) {
            return p = a;
          });
        }function d(a) {
          return g.reversed ? g.duration - a : a;
        }function b(a) {
          for (var b = 0, c = {}, d = g.animations, f = d.length; b < f;) {
            var e = d[b],
                k = e.animatable,
                h = e.tweens,
                n = h.length - 1,
                l = h[n];n && (l = r(h, function (b) {
              return a < b.end;
            })[0] || l);for (var h = Math.min(Math.max(a - l.start - l.delay, 0), l.duration) / l.duration, w = isNaN(h) ? 1 : l.easing(h, l.elasticity), h = l.to.strings, p = l.round, n = [], m = void 0, m = l.to.numbers.length, t = 0; t < m; t++) {
              var x = void 0,
                  x = l.to.numbers[t],
                  q = l.from.numbers[t],
                  x = l.isPath ? Y(l.value, w * x) : q + w * (x - q);p && (l.isColor && 2 < t || (x = Math.round(x * p) / p));n.push(x);
            }if (l = h.length) for (m = h[0], w = 0; w < l; w++) {
              p = h[w + 1], t = n[w], isNaN(t) || (m = p ? m + (t + p) : m + (t + " "));
            } else m = n[0];ha[e.type](k.target, e.property, m, c, k.id);e.currentValue = m;b++;
          }if (b = Object.keys(c).length) for (d = 0; d < b; d++) {
            H || (H = E(document.body, "transform") ? "transform" : "-webkit-transform"), g.animatables[d].target.style[H] = c[d].join(" ");
          }g.currentTime = a;g.progress = a / g.duration * 100;
        }function f(a) {
          if (g[a]) g[a](g);
        }function e() {
          g.remaining && !0 !== g.remaining && g.remaining--;
        }function k(a) {
          var k = g.duration,
              n = g.offset,
              w = n + g.delay,
              r = g.currentTime,
              x = g.reversed,
              q = d(a);if (g.children.length) {
            var u = g.children,
                v = u.length;
            if (q >= g.currentTime) for (var G = 0; G < v; G++) {
              u[G].seek(q);
            } else for (; v--;) {
              u[v].seek(q);
            }
          }if (q >= w || !k) g.began || (g.began = !0, f("begin")), f("run");if (q > n && q < k) b(q);else if (q <= n && 0 !== r && (b(0), x && e()), q >= k && r !== k || !k) b(k), x || e();f("update");a >= k && (g.remaining ? (t = h, "alternate" === g.direction && (g.reversed = !g.reversed)) : (g.pause(), g.completed || (g.completed = !0, f("complete"), "Promise" in window && (p(), m = c()))), l = 0);
        }a = void 0 === a ? {} : a;var h,
            t,
            l = 0,
            p = null,
            m = c(),
            g = fa(a);g.reset = function () {
          var a = g.direction,
              c = g.loop;g.currentTime = 0;g.progress = 0;g.paused = !0;g.began = !1;g.completed = !1;g.reversed = "reverse" === a;g.remaining = "alternate" === a && 1 === c ? 2 : c;b(0);for (a = g.children.length; a--;) {
            g.children[a].reset();
          }
        };g.tick = function (a) {
          h = a;t || (t = h);k((l + h - t) * q.speed);
        };g.seek = function (a) {
          k(d(a));
        };g.pause = function () {
          var a = v.indexOf(g);-1 < a && v.splice(a, 1);g.paused = !0;
        };g.play = function () {
          g.paused && (g.paused = !1, t = 0, l = d(g.currentTime), v.push(g), B || ia());
        };g.reverse = function () {
          g.reversed = !g.reversed;t = 0;l = d(g.currentTime);
        };g.restart = function () {
          g.pause();
          g.reset();g.play();
        };g.finished = m;g.reset();g.autoplay && g.play();return g;
      }var ga = { update: void 0, begin: void 0, run: void 0, complete: void 0, loop: 1, direction: "normal", autoplay: !0, offset: 0 },
          S = { duration: 1E3, delay: 0, easing: "easeOutElastic", elasticity: 500, round: 0 },
          W = "translateX translateY translateZ rotate rotateX rotateY rotateZ scale scaleX scaleY scaleZ skewX skewY perspective".split(" "),
          H,
          h = { arr: function (a) {
          return Array.isArray(a);
        }, obj: function (a) {
          return -1 < Object.prototype.toString.call(a).indexOf("Object");
        },
        pth: function (a) {
          return h.obj(a) && a.hasOwnProperty("totalLength");
        }, svg: function (a) {
          return a instanceof SVGElement;
        }, dom: function (a) {
          return a.nodeType || h.svg(a);
        }, str: function (a) {
          return "string" === typeof a;
        }, fnc: function (a) {
          return "function" === typeof a;
        }, und: function (a) {
          return "undefined" === typeof a;
        }, hex: function (a) {
          return (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a)
          );
        }, rgb: function (a) {
          return (/^rgb/.test(a)
          );
        }, hsl: function (a) {
          return (/^hsl/.test(a)
          );
        }, col: function (a) {
          return h.hex(a) || h.rgb(a) || h.hsl(a);
        } },
          A = function () {
        function a(a, d, b) {
          return (((1 - 3 * b + 3 * d) * a + (3 * b - 6 * d)) * a + 3 * d) * a;
        }return function (c, d, b, f) {
          if (0 <= c && 1 >= c && 0 <= b && 1 >= b) {
            var e = new Float32Array(11);if (c !== d || b !== f) for (var k = 0; 11 > k; ++k) {
              e[k] = a(.1 * k, c, b);
            }return function (k) {
              if (c === d && b === f) return k;if (0 === k) return 0;if (1 === k) return 1;for (var h = 0, l = 1; 10 !== l && e[l] <= k; ++l) {
                h += .1;
              }--l;var l = h + (k - e[l]) / (e[l + 1] - e[l]) * .1,
                  n = 3 * (1 - 3 * b + 3 * c) * l * l + 2 * (3 * b - 6 * c) * l + 3 * c;if (.001 <= n) {
                for (h = 0; 4 > h; ++h) {
                  n = 3 * (1 - 3 * b + 3 * c) * l * l + 2 * (3 * b - 6 * c) * l + 3 * c;if (0 === n) break;var m = a(l, c, b) - k,
                      l = l - m / n;
                }k = l;
              } else if (0 === n) k = l;else {
                var l = h,
                    h = h + .1,
                    g = 0;do {
                  m = l + (h - l) / 2, n = a(m, c, b) - k, 0 < n ? h = m : l = m;
                } while (1e-7 < Math.abs(n) && 10 > ++g);k = m;
              }return a(k, d, f);
            };
          }
        };
      }(),
          Q = function () {
        function a(a, b) {
          return 0 === a || 1 === a ? a : -Math.pow(2, 10 * (a - 1)) * Math.sin(2 * (a - 1 - b / (2 * Math.PI) * Math.asin(1)) * Math.PI / b);
        }var c = "Quad Cubic Quart Quint Sine Expo Circ Back Elastic".split(" "),
            d = { In: [[.55, .085, .68, .53], [.55, .055, .675, .19], [.895, .03, .685, .22], [.755, .05, .855, .06], [.47, 0, .745, .715], [.95, .05, .795, .035], [.6, .04, .98, .335], [.6, -.28, .735, .045], a], Out: [[.25, .46, .45, .94], [.215, .61, .355, 1], [.165, .84, .44, 1], [.23, 1, .32, 1], [.39, .575, .565, 1], [.19, 1, .22, 1], [.075, .82, .165, 1], [.175, .885, .32, 1.275], function (b, c) {
            return 1 - a(1 - b, c);
          }], InOut: [[.455, .03, .515, .955], [.645, .045, .355, 1], [.77, 0, .175, 1], [.86, 0, .07, 1], [.445, .05, .55, .95], [1, 0, 0, 1], [.785, .135, .15, .86], [.68, -.55, .265, 1.55], function (b, c) {
            return .5 > b ? a(2 * b, c) / 2 : 1 - a(-2 * b + 2, c) / 2;
          }] },
            b = { linear: A(.25, .25, .75, .75) },
            f = {},
            e;for (e in d) {
          f.type = e, d[f.type].forEach(function (a) {
            return function (d, f) {
              b["ease" + a.type + c[f]] = h.fnc(d) ? d : A.apply($jscomp$this, d);
            };
          }(f)), f = { type: f.type };
        }return b;
      }(),
          ha = { css: function (a, c, d) {
          return a.style[c] = d;
        }, attribute: function (a, c, d) {
          return a.setAttribute(c, d);
        }, object: function (a, c, d) {
          return a[c] = d;
        }, transform: function (a, c, d, b, f) {
          b[f] || (b[f] = []);b[f].push(c + "(" + d + ")");
        } },
          v = [],
          B = 0,
          ia = function () {
        function a() {
          B = requestAnimationFrame(c);
        }function c(c) {
          var b = v.length;if (b) {
            for (var d = 0; d < b;) {
              v[d] && v[d].tick(c), d++;
            }a();
          } else cancelAnimationFrame(B), B = 0;
        }return a;
      }();q.version = "2.2.0";q.speed = 1;q.running = v;q.remove = function (a) {
        a = P(a);for (var c = v.length; c--;) {
          for (var d = v[c], b = d.animations, f = b.length; f--;) {
            u(a, b[f].animatable.target) && (b.splice(f, 1), b.length || d.pause());
          }
        }
      };q.getValue = K;q.path = function (a, c) {
        var d = h.str(a) ? e(a)[0] : a,
            b = c || 100;return function (a) {
          return { el: d, property: a, totalLength: N(d) * (b / 100) };
        };
      };q.setDashoffset = function (a) {
        var c = N(a);a.setAttribute("stroke-dasharray", c);return c;
      };q.bezier = A;q.easings = Q;q.timeline = function (a) {
        var c = q(a);c.pause();c.duration = 0;c.add = function (d) {
          c.children.forEach(function (a) {
            a.began = !0;a.completed = !0;
          });m(d).forEach(function (b) {
            var d = z(b, D(S, a || {}));d.targets = d.targets || a.targets;b = c.duration;var e = d.offset;d.autoplay = !1;d.direction = c.direction;d.offset = h.und(e) ? b : L(e, b);c.began = !0;c.completed = !0;c.seek(d.offset);d = q(d);d.began = !0;d.completed = !0;d.duration > b && (c.duration = d.duration);c.children.push(d);
          });c.seek(0);c.reset();c.autoplay && c.restart();return c;
        };return c;
      };q.random = function (a, c) {
        return Math.floor(Math.random() * (c - a + 1)) + a;
      };return q;
    });
    (function ($, anim) {

      var _defaults = {
        accordion: true,
        onOpenStart: undefined,
        onOpenEnd: undefined,
        onCloseStart: undefined,
        onCloseEnd: undefined,
        inDuration: 300,
        outDuration: 300
      };

      /**
       * @class
       *
       */

      var Collapsible = function (_Component) {
        _inherits(Collapsible, _Component);

        /**
         * Construct Collapsible instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Collapsible(el, options) {
          _classCallCheck(this, Collapsible);

          var _this3 = _possibleConstructorReturn(this, (Collapsible.__proto__ || Object.getPrototypeOf(Collapsible)).call(this, Collapsible, el, options));

          _this3.el.M_Collapsible = _this3;

          /**
           * Options for the collapsible
           * @member Collapsible#options
           * @prop {Boolean} [accordion=false] - Type of the collapsible
           * @prop {Function} onOpenStart - Callback function called before collapsible is opened
           * @prop {Function} onOpenEnd - Callback function called after collapsible is opened
           * @prop {Function} onCloseStart - Callback function called before collapsible is closed
           * @prop {Function} onCloseEnd - Callback function called after collapsible is closed
           * @prop {Number} inDuration - Transition in duration in milliseconds.
           * @prop {Number} outDuration - Transition duration in milliseconds.
           */
          _this3.options = $.extend({}, Collapsible.defaults, options);

          // Setup tab indices
          _this3.$headers = _this3.$el.children('li').children('.collapsible-header');
          _this3.$headers.attr('tabindex', 0);

          _this3._setupEventHandlers();

          // Open first active
          var $activeBodies = _this3.$el.children('li.active').children('.collapsible-body');
          if (_this3.options.accordion) {
            // Handle Accordion
            $activeBodies.first().css('display', 'block');
          } else {
            // Handle Expandables
            $activeBodies.css('display', 'block');
          }
          return _this3;
        }

        _createClass(Collapsible, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.el.M_Collapsible = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            var _this4 = this;

            this._handleCollapsibleClickBound = this._handleCollapsibleClick.bind(this);
            this._handleCollapsibleKeydownBound = this._handleCollapsibleKeydown.bind(this);
            this.el.addEventListener('click', this._handleCollapsibleClickBound);
            this.$headers.each(function (header) {
              header.addEventListener('keydown', _this4._handleCollapsibleKeydownBound);
            });
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            var _this5 = this;

            this.el.removeEventListener('click', this._handleCollapsibleClickBound);
            this.$headers.each(function (header) {
              header.removeEventListener('keydown', _this5._handleCollapsibleKeydownBound);
            });
          }

          /**
           * Handle Collapsible Click
           * @param {Event} e
           */

        }, {
          key: "_handleCollapsibleClick",
          value: function _handleCollapsibleClick(e) {
            var $header = $(e.target).closest('.collapsible-header');
            if (e.target && $header.length) {
              var $collapsible = $header.closest('.collapsible');
              if ($collapsible[0] === this.el) {
                var $collapsibleLi = $header.closest('li');
                var $collapsibleLis = $collapsible.children('li');
                var isActive = $collapsibleLi[0].classList.contains('active');
                var index = $collapsibleLis.index($collapsibleLi);

                if (isActive) {
                  this.close(index);
                } else {
                  this.open(index);
                }
              }
            }
          }

          /**
           * Handle Collapsible Keydown
           * @param {Event} e
           */

        }, {
          key: "_handleCollapsibleKeydown",
          value: function _handleCollapsibleKeydown(e) {
            if (e.keyCode === 13) {
              this._handleCollapsibleClickBound(e);
            }
          }

          /**
           * Animate in collapsible slide
           * @param {Number} index - 0th index of slide
           */

        }, {
          key: "_animateIn",
          value: function _animateIn(index) {
            var _this6 = this;

            var $collapsibleLi = this.$el.children('li').eq(index);
            if ($collapsibleLi.length) {
              var $body = $collapsibleLi.children('.collapsible-body');

              anim.remove($body[0]);
              $body.css({
                display: 'block',
                overflow: 'hidden',
                height: 0,
                paddingTop: '',
                paddingBottom: ''
              });

              var pTop = $body.css('padding-top');
              var pBottom = $body.css('padding-bottom');
              var finalHeight = $body[0].scrollHeight;
              $body.css({
                paddingTop: 0,
                paddingBottom: 0
              });

              anim({
                targets: $body[0],
                height: finalHeight,
                paddingTop: pTop,
                paddingBottom: pBottom,
                duration: this.options.inDuration,
                easing: 'easeInOutCubic',
                complete: function (anim) {
                  $body.css({
                    overflow: '',
                    paddingTop: '',
                    paddingBottom: '',
                    height: ''
                  });

                  // onOpenEnd callback
                  if (typeof _this6.options.onOpenEnd === 'function') {
                    _this6.options.onOpenEnd.call(_this6, $collapsibleLi[0]);
                  }
                }
              });
            }
          }

          /**
           * Animate out collapsible slide
           * @param {Number} index - 0th index of slide to open
           */

        }, {
          key: "_animateOut",
          value: function _animateOut(index) {
            var _this7 = this;

            var $collapsibleLi = this.$el.children('li').eq(index);
            if ($collapsibleLi.length) {
              var $body = $collapsibleLi.children('.collapsible-body');
              anim.remove($body[0]);
              $body.css('overflow', 'hidden');
              anim({
                targets: $body[0],
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                duration: this.options.outDuration,
                easing: 'easeInOutCubic',
                complete: function () {
                  $body.css({
                    height: '',
                    overflow: '',
                    padding: '',
                    display: ''
                  });

                  // onCloseEnd callback
                  if (typeof _this7.options.onCloseEnd === 'function') {
                    _this7.options.onCloseEnd.call(_this7, $collapsibleLi[0]);
                  }
                }
              });
            }
          }

          /**
           * Open Collapsible
           * @param {Number} index - 0th index of slide
           */

        }, {
          key: "open",
          value: function open(index) {
            var _this8 = this;

            var $collapsibleLi = this.$el.children('li').eq(index);
            if ($collapsibleLi.length && !$collapsibleLi[0].classList.contains('active')) {
              // onOpenStart callback
              if (typeof this.options.onOpenStart === 'function') {
                this.options.onOpenStart.call(this, $collapsibleLi[0]);
              }

              // Handle accordion behavior
              if (this.options.accordion) {
                var $collapsibleLis = this.$el.children('li');
                var $activeLis = this.$el.children('li.active');
                $activeLis.each(function (el) {
                  var index = $collapsibleLis.index($(el));
                  _this8.close(index);
                });
              }

              // Animate in
              $collapsibleLi[0].classList.add('active');
              this._animateIn(index);
            }
          }

          /**
           * Close Collapsible
           * @param {Number} index - 0th index of slide
           */

        }, {
          key: "close",
          value: function close(index) {
            var $collapsibleLi = this.$el.children('li').eq(index);
            if ($collapsibleLi.length && $collapsibleLi[0].classList.contains('active')) {
              // onCloseStart callback
              if (typeof this.options.onCloseStart === 'function') {
                this.options.onCloseStart.call(this, $collapsibleLi[0]);
              }

              // Animate out
              $collapsibleLi[0].classList.remove('active');
              this._animateOut(index);
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Collapsible.__proto__ || Object.getPrototypeOf(Collapsible), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Collapsible;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Collapsible;
      }(Component);

      M.Collapsible = Collapsible;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Collapsible, 'collapsible', 'M_Collapsible');
      }
    })(cash, M.anime);
    (function ($, anim) {

      var _defaults = {
        alignment: 'left',
        autoFocus: true,
        constrainWidth: true,
        container: null,
        coverTrigger: true,
        closeOnClick: true,
        hover: false,
        inDuration: 150,
        outDuration: 250,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onItemClick: null
      };

      /**
       * @class
       */

      var Dropdown = function (_Component2) {
        _inherits(Dropdown, _Component2);

        function Dropdown(el, options) {
          _classCallCheck(this, Dropdown);

          var _this9 = _possibleConstructorReturn(this, (Dropdown.__proto__ || Object.getPrototypeOf(Dropdown)).call(this, Dropdown, el, options));

          _this9.el.M_Dropdown = _this9;
          Dropdown._dropdowns.push(_this9);

          _this9.id = M.getIdFromTrigger(el);
          _this9.dropdownEl = document.getElementById(_this9.id);
          _this9.$dropdownEl = $(_this9.dropdownEl);

          /**
           * Options for the dropdown
           * @member Dropdown#options
           * @prop {String} [alignment='left'] - Edge which the dropdown is aligned to
           * @prop {Boolean} [autoFocus=true] - Automatically focus dropdown el for keyboard
           * @prop {Boolean} [constrainWidth=true] - Constrain width to width of the button
           * @prop {Element} container - Container element to attach dropdown to (optional)
           * @prop {Boolean} [coverTrigger=true] - Place dropdown over trigger
           * @prop {Boolean} [closeOnClick=true] - Close on click of dropdown item
           * @prop {Boolean} [hover=false] - Open dropdown on hover
           * @prop {Number} [inDuration=150] - Duration of open animation in ms
           * @prop {Number} [outDuration=250] - Duration of close animation in ms
           * @prop {Function} onOpenStart - Function called when dropdown starts opening
           * @prop {Function} onOpenEnd - Function called when dropdown finishes opening
           * @prop {Function} onCloseStart - Function called when dropdown starts closing
           * @prop {Function} onCloseEnd - Function called when dropdown finishes closing
           */
          _this9.options = $.extend({}, Dropdown.defaults, options);

          /**
           * Describes open/close state of dropdown
           * @type {Boolean}
           */
          _this9.isOpen = false;

          /**
           * Describes if dropdown content is scrollable
           * @type {Boolean}
           */
          _this9.isScrollable = false;

          /**
           * Describes if touch moving on dropdown content
           * @type {Boolean}
           */
          _this9.isTouchMoving = false;

          _this9.focusedIndex = -1;
          _this9.filterQuery = [];

          // Move dropdown-content after dropdown-trigger
          if (!!_this9.options.container) {
            $(_this9.options.container).append(_this9.dropdownEl);
          } else {
            _this9.$el.after(_this9.dropdownEl);
          }

          _this9._makeDropdownFocusable();
          _this9._resetFilterQueryBound = _this9._resetFilterQuery.bind(_this9);
          _this9._handleDocumentClickBound = _this9._handleDocumentClick.bind(_this9);
          _this9._handleDocumentTouchmoveBound = _this9._handleDocumentTouchmove.bind(_this9);
          _this9._handleDropdownClickBound = _this9._handleDropdownClick.bind(_this9);
          _this9._handleDropdownKeydownBound = _this9._handleDropdownKeydown.bind(_this9);
          _this9._handleTriggerKeydownBound = _this9._handleTriggerKeydown.bind(_this9);
          _this9._setupEventHandlers();
          return _this9;
        }

        _createClass(Dropdown, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._resetDropdownStyles();
            this._removeEventHandlers();
            Dropdown._dropdowns.splice(Dropdown._dropdowns.indexOf(this), 1);
            this.el.M_Dropdown = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            // Trigger keydown handler
            this.el.addEventListener('keydown', this._handleTriggerKeydownBound);

            // Item click handler
            this.dropdownEl.addEventListener('click', this._handleDropdownClickBound);

            // Hover event handlers
            if (this.options.hover) {
              this._handleMouseEnterBound = this._handleMouseEnter.bind(this);
              this.el.addEventListener('mouseenter', this._handleMouseEnterBound);
              this._handleMouseLeaveBound = this._handleMouseLeave.bind(this);
              this.el.addEventListener('mouseleave', this._handleMouseLeaveBound);
              this.dropdownEl.addEventListener('mouseleave', this._handleMouseLeaveBound);

              // Click event handlers
            } else {
              this._handleClickBound = this._handleClick.bind(this);
              this.el.addEventListener('click', this._handleClickBound);
            }
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('keydown', this._handleTriggerKeydownBound);
            this.dropdownEl.removeEventListener('click', this._handleDropdownClickBound);

            if (this.options.hover) {
              this.el.removeEventListener('mouseenter', this._handleMouseEnterBound);
              this.el.removeEventListener('mouseleave', this._handleMouseLeaveBound);
              this.dropdownEl.removeEventListener('mouseleave', this._handleMouseLeaveBound);
            } else {
              this.el.removeEventListener('click', this._handleClickBound);
            }
          }
        }, {
          key: "_setupTemporaryEventHandlers",
          value: function _setupTemporaryEventHandlers() {
            // Use capture phase event handler to prevent click
            document.body.addEventListener('click', this._handleDocumentClickBound, true);
            document.body.addEventListener('touchend', this._handleDocumentClickBound);
            document.body.addEventListener('touchmove', this._handleDocumentTouchmoveBound);
            this.dropdownEl.addEventListener('keydown', this._handleDropdownKeydownBound);
          }
        }, {
          key: "_removeTemporaryEventHandlers",
          value: function _removeTemporaryEventHandlers() {
            // Use capture phase event handler to prevent click
            document.body.removeEventListener('click', this._handleDocumentClickBound, true);
            document.body.removeEventListener('touchend', this._handleDocumentClickBound);
            document.body.removeEventListener('touchmove', this._handleDocumentTouchmoveBound);
            this.dropdownEl.removeEventListener('keydown', this._handleDropdownKeydownBound);
          }
        }, {
          key: "_handleClick",
          value: function _handleClick(e) {
            e.preventDefault();
            this.open();
          }
        }, {
          key: "_handleMouseEnter",
          value: function _handleMouseEnter() {
            this.open();
          }
        }, {
          key: "_handleMouseLeave",
          value: function _handleMouseLeave(e) {
            var toEl = e.toElement || e.relatedTarget;
            var leaveToDropdownContent = !!$(toEl).closest('.dropdown-content').length;
            var leaveToActiveDropdownTrigger = false;

            var $closestTrigger = $(toEl).closest('.dropdown-trigger');
            if ($closestTrigger.length && !!$closestTrigger[0].M_Dropdown && $closestTrigger[0].M_Dropdown.isOpen) {
              leaveToActiveDropdownTrigger = true;
            }

            // Close hover dropdown if mouse did not leave to either active dropdown-trigger or dropdown-content
            if (!leaveToActiveDropdownTrigger && !leaveToDropdownContent) {
              this.close();
            }
          }
        }, {
          key: "_handleDocumentClick",
          value: function _handleDocumentClick(e) {
            var _this10 = this;

            var $target = $(e.target);
            if (this.options.closeOnClick && $target.closest('.dropdown-content').length && !this.isTouchMoving) {
              // isTouchMoving to check if scrolling on mobile.
              setTimeout(function () {
                _this10.close();
              }, 0);
            } else if ($target.closest('.dropdown-trigger').length || !$target.closest('.dropdown-content').length) {
              setTimeout(function () {
                _this10.close();
              }, 0);
            }
            this.isTouchMoving = false;
          }
        }, {
          key: "_handleTriggerKeydown",
          value: function _handleTriggerKeydown(e) {
            // ARROW DOWN OR ENTER WHEN SELECT IS CLOSED - open Dropdown
            if ((e.which === M.keys.ARROW_DOWN || e.which === M.keys.ENTER) && !this.isOpen) {
              e.preventDefault();
              this.open();
            }
          }

          /**
           * Handle Document Touchmove
           * @param {Event} e
           */

        }, {
          key: "_handleDocumentTouchmove",
          value: function _handleDocumentTouchmove(e) {
            var $target = $(e.target);
            if ($target.closest('.dropdown-content').length) {
              this.isTouchMoving = true;
            }
          }

          /**
           * Handle Dropdown Click
           * @param {Event} e
           */

        }, {
          key: "_handleDropdownClick",
          value: function _handleDropdownClick(e) {
            // onItemClick callback
            if (typeof this.options.onItemClick === 'function') {
              var itemEl = $(e.target).closest('li')[0];
              this.options.onItemClick.call(this, itemEl);
            }
          }

          /**
           * Handle Dropdown Keydown
           * @param {Event} e
           */

        }, {
          key: "_handleDropdownKeydown",
          value: function _handleDropdownKeydown(e) {
            if (e.which === M.keys.TAB) {
              e.preventDefault();
              this.close();

              // Navigate down dropdown list
            } else if ((e.which === M.keys.ARROW_DOWN || e.which === M.keys.ARROW_UP) && this.isOpen) {
              e.preventDefault();
              var direction = e.which === M.keys.ARROW_DOWN ? 1 : -1;
              var newFocusedIndex = this.focusedIndex;
              var foundNewIndex = false;
              do {
                newFocusedIndex = newFocusedIndex + direction;

                if (!!this.dropdownEl.children[newFocusedIndex] && this.dropdownEl.children[newFocusedIndex].tabIndex !== -1) {
                  foundNewIndex = true;
                  break;
                }
              } while (newFocusedIndex < this.dropdownEl.children.length && newFocusedIndex >= 0);

              if (foundNewIndex) {
                this.focusedIndex = newFocusedIndex;
                this._focusFocusedItem();
              }

              // ENTER selects choice on focused item
            } else if (e.which === M.keys.ENTER && this.isOpen) {
              // Search for <a> and <button>
              var focusedElement = this.dropdownEl.children[this.focusedIndex];
              var $activatableElement = $(focusedElement).find('a, button').first();

              // Click a or button tag if exists, otherwise click li tag
              if (!!$activatableElement.length) {
                $activatableElement[0].click();
              } else if (!!focusedElement) {
                focusedElement.click();
              }

              // Close dropdown on ESC
            } else if (e.which === M.keys.ESC && this.isOpen) {
              e.preventDefault();
              this.close();
            }

            // CASE WHEN USER TYPE LETTERS
            var letter = String.fromCharCode(e.which).toLowerCase(),
                nonLetters = [9, 13, 27, 38, 40];
            if (letter && nonLetters.indexOf(e.which) === -1) {
              this.filterQuery.push(letter);

              var string = this.filterQuery.join(''),
                  newOptionEl = $(this.dropdownEl).find('li').filter(function (el) {
                return $(el).text().toLowerCase().indexOf(string) === 0;
              })[0];

              if (newOptionEl) {
                this.focusedIndex = $(newOptionEl).index();
                this._focusFocusedItem();
              }
            }

            this.filterTimeout = setTimeout(this._resetFilterQueryBound, 1000);
          }

          /**
           * Setup dropdown
           */

        }, {
          key: "_resetFilterQuery",
          value: function _resetFilterQuery() {
            this.filterQuery = [];
          }
        }, {
          key: "_resetDropdownStyles",
          value: function _resetDropdownStyles() {
            this.$dropdownEl.css({
              display: '',
              width: '',
              height: '',
              left: '',
              top: '',
              'transform-origin': '',
              transform: '',
              opacity: ''
            });
          }
        }, {
          key: "_makeDropdownFocusable",
          value: function _makeDropdownFocusable() {
            // Needed for arrow key navigation
            this.dropdownEl.tabIndex = 0;

            // Only set tabindex if it hasn't been set by user
            $(this.dropdownEl).children().each(function (el) {
              if (!el.getAttribute('tabindex')) {
                el.setAttribute('tabindex', 0);
              }
            });
          }
        }, {
          key: "_focusFocusedItem",
          value: function _focusFocusedItem() {
            if (this.focusedIndex >= 0 && this.focusedIndex < this.dropdownEl.children.length && this.options.autoFocus) {
              this.dropdownEl.children[this.focusedIndex].focus();
            }
          }
        }, {
          key: "_getDropdownPosition",
          value: function _getDropdownPosition() {
            var offsetParentBRect = this.el.offsetParent.getBoundingClientRect();
            var triggerBRect = this.el.getBoundingClientRect();
            var dropdownBRect = this.dropdownEl.getBoundingClientRect();

            var idealHeight = dropdownBRect.height;
            var idealWidth = dropdownBRect.width;
            var idealXPos = triggerBRect.left - dropdownBRect.left;
            var idealYPos = triggerBRect.top - dropdownBRect.top;

            var dropdownBounds = {
              left: idealXPos,
              top: idealYPos,
              height: idealHeight,
              width: idealWidth
            };

            // Countainer here will be closest ancestor with overflow: hidden
            var closestOverflowParent = !!this.dropdownEl.offsetParent ? this.dropdownEl.offsetParent : this.dropdownEl.parentNode;

            var alignments = M.checkPossibleAlignments(this.el, closestOverflowParent, dropdownBounds, this.options.coverTrigger ? 0 : triggerBRect.height);

            var verticalAlignment = 'top';
            var horizontalAlignment = this.options.alignment;
            idealYPos += this.options.coverTrigger ? 0 : triggerBRect.height;

            // Reset isScrollable
            this.isScrollable = false;

            if (!alignments.top) {
              if (alignments.bottom) {
                verticalAlignment = 'bottom';
              } else {
                this.isScrollable = true;

                // Determine which side has most space and cutoff at correct height
                if (alignments.spaceOnTop > alignments.spaceOnBottom) {
                  verticalAlignment = 'bottom';
                  idealHeight += alignments.spaceOnTop;
                  idealYPos -= alignments.spaceOnTop;
                } else {
                  idealHeight += alignments.spaceOnBottom;
                }
              }
            }

            // If preferred horizontal alignment is possible
            if (!alignments[horizontalAlignment]) {
              var oppositeAlignment = horizontalAlignment === 'left' ? 'right' : 'left';
              if (alignments[oppositeAlignment]) {
                horizontalAlignment = oppositeAlignment;
              } else {
                // Determine which side has most space and cutoff at correct height
                if (alignments.spaceOnLeft > alignments.spaceOnRight) {
                  horizontalAlignment = 'right';
                  idealWidth += alignments.spaceOnLeft;
                  idealXPos -= alignments.spaceOnLeft;
                } else {
                  horizontalAlignment = 'left';
                  idealWidth += alignments.spaceOnRight;
                }
              }
            }

            if (verticalAlignment === 'bottom') {
              idealYPos = idealYPos - dropdownBRect.height + (this.options.coverTrigger ? triggerBRect.height : 0);
            }
            if (horizontalAlignment === 'right') {
              idealXPos = idealXPos - dropdownBRect.width + triggerBRect.width;
            }
            return {
              x: idealXPos,
              y: idealYPos,
              verticalAlignment: verticalAlignment,
              horizontalAlignment: horizontalAlignment,
              height: idealHeight,
              width: idealWidth
            };
          }

          /**
           * Animate in dropdown
           */

        }, {
          key: "_animateIn",
          value: function _animateIn() {
            var _this11 = this;

            anim.remove(this.dropdownEl);
            anim({
              targets: this.dropdownEl,
              opacity: {
                value: [0, 1],
                easing: 'easeOutQuad'
              },
              scaleX: [0.3, 1],
              scaleY: [0.3, 1],
              duration: this.options.inDuration,
              easing: 'easeOutQuint',
              complete: function (anim) {
                if (_this11.options.autoFocus) {
                  _this11.dropdownEl.focus();
                }

                // onOpenEnd callback
                if (typeof _this11.options.onOpenEnd === 'function') {
                  _this11.options.onOpenEnd.call(_this11, _this11.el);
                }
              }
            });
          }

          /**
           * Animate out dropdown
           */

        }, {
          key: "_animateOut",
          value: function _animateOut() {
            var _this12 = this;

            anim.remove(this.dropdownEl);
            anim({
              targets: this.dropdownEl,
              opacity: {
                value: 0,
                easing: 'easeOutQuint'
              },
              scaleX: 0.3,
              scaleY: 0.3,
              duration: this.options.outDuration,
              easing: 'easeOutQuint',
              complete: function (anim) {
                _this12._resetDropdownStyles();

                // onCloseEnd callback
                if (typeof _this12.options.onCloseEnd === 'function') {
                  _this12.options.onCloseEnd.call(_this12, _this12.el);
                }
              }
            });
          }

          /**
           * Place dropdown
           */

        }, {
          key: "_placeDropdown",
          value: function _placeDropdown() {
            // Set width before calculating positionInfo
            var idealWidth = this.options.constrainWidth ? this.el.getBoundingClientRect().width : this.dropdownEl.getBoundingClientRect().width;
            this.dropdownEl.style.width = idealWidth + 'px';

            var positionInfo = this._getDropdownPosition();
            this.dropdownEl.style.left = positionInfo.x + 'px';
            this.dropdownEl.style.top = positionInfo.y + 'px';
            this.dropdownEl.style.height = positionInfo.height + 'px';
            this.dropdownEl.style.width = positionInfo.width + 'px';
            this.dropdownEl.style.transformOrigin = (positionInfo.horizontalAlignment === 'left' ? '0' : '100%') + " " + (positionInfo.verticalAlignment === 'top' ? '0' : '100%');
          }

          /**
           * Open Dropdown
           */

        }, {
          key: "open",
          value: function open() {
            if (this.isOpen) {
              return;
            }
            this.isOpen = true;

            // onOpenStart callback
            if (typeof this.options.onOpenStart === 'function') {
              this.options.onOpenStart.call(this, this.el);
            }

            // Reset styles
            this._resetDropdownStyles();
            this.dropdownEl.style.display = 'block';

            this._placeDropdown();
            this._animateIn();
            this._setupTemporaryEventHandlers();
          }

          /**
           * Close Dropdown
           */

        }, {
          key: "close",
          value: function close() {
            if (!this.isOpen) {
              return;
            }
            this.isOpen = false;
            this.focusedIndex = -1;

            // onCloseStart callback
            if (typeof this.options.onCloseStart === 'function') {
              this.options.onCloseStart.call(this, this.el);
            }

            this._animateOut();
            this._removeTemporaryEventHandlers();

            if (this.options.autoFocus) {
              this.el.focus();
            }
          }

          /**
           * Recalculate dimensions
           */

        }, {
          key: "recalculateDimensions",
          value: function recalculateDimensions() {
            if (this.isOpen) {
              this.$dropdownEl.css({
                width: '',
                height: '',
                left: '',
                top: '',
                'transform-origin': ''
              });
              this._placeDropdown();
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Dropdown.__proto__ || Object.getPrototypeOf(Dropdown), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Dropdown;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Dropdown;
      }(Component);

      /**
       * @static
       * @memberof Dropdown
       */


      Dropdown._dropdowns = [];

      M.Dropdown = Dropdown;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Dropdown, 'dropdown', 'M_Dropdown');
      }
    })(cash, M.anime);
    (function ($, anim) {

      var _defaults = {
        opacity: 0.5,
        inDuration: 250,
        outDuration: 250,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        preventScrolling: true,
        dismissible: true,
        startingTop: '4%',
        endingTop: '10%'
      };

      /**
       * @class
       *
       */

      var Modal = function (_Component3) {
        _inherits(Modal, _Component3);

        /**
         * Construct Modal instance and set up overlay
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Modal(el, options) {
          _classCallCheck(this, Modal);

          var _this13 = _possibleConstructorReturn(this, (Modal.__proto__ || Object.getPrototypeOf(Modal)).call(this, Modal, el, options));

          _this13.el.M_Modal = _this13;

          /**
           * Options for the modal
           * @member Modal#options
           * @prop {Number} [opacity=0.5] - Opacity of the modal overlay
           * @prop {Number} [inDuration=250] - Length in ms of enter transition
           * @prop {Number} [outDuration=250] - Length in ms of exit transition
           * @prop {Function} onOpenStart - Callback function called before modal is opened
           * @prop {Function} onOpenEnd - Callback function called after modal is opened
           * @prop {Function} onCloseStart - Callback function called before modal is closed
           * @prop {Function} onCloseEnd - Callback function called after modal is closed
           * @prop {Boolean} [dismissible=true] - Allow modal to be dismissed by keyboard or overlay click
           * @prop {String} [startingTop='4%'] - startingTop
           * @prop {String} [endingTop='10%'] - endingTop
           */
          _this13.options = $.extend({}, Modal.defaults, options);

          /**
           * Describes open/close state of modal
           * @type {Boolean}
           */
          _this13.isOpen = false;

          _this13.id = _this13.$el.attr('id');
          _this13._openingTrigger = undefined;
          _this13.$overlay = $('<div class="modal-overlay"></div>');
          _this13.el.tabIndex = 0;
          _this13._nthModalOpened = 0;

          Modal._count++;
          _this13._setupEventHandlers();
          return _this13;
        }

        _createClass(Modal, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            Modal._count--;
            this._removeEventHandlers();
            this.el.removeAttribute('style');
            this.$overlay.remove();
            this.el.M_Modal = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleOverlayClickBound = this._handleOverlayClick.bind(this);
            this._handleModalCloseClickBound = this._handleModalCloseClick.bind(this);

            if (Modal._count === 1) {
              document.body.addEventListener('click', this._handleTriggerClick);
            }
            this.$overlay[0].addEventListener('click', this._handleOverlayClickBound);
            this.el.addEventListener('click', this._handleModalCloseClickBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            if (Modal._count === 0) {
              document.body.removeEventListener('click', this._handleTriggerClick);
            }
            this.$overlay[0].removeEventListener('click', this._handleOverlayClickBound);
            this.el.removeEventListener('click', this._handleModalCloseClickBound);
          }

          /**
           * Handle Trigger Click
           * @param {Event} e
           */

        }, {
          key: "_handleTriggerClick",
          value: function _handleTriggerClick(e) {
            var $trigger = $(e.target).closest('.modal-trigger');
            if ($trigger.length) {
              var modalId = M.getIdFromTrigger($trigger[0]);
              var modalInstance = document.getElementById(modalId).M_Modal;
              if (modalInstance) {
                modalInstance.open($trigger);
              }
              e.preventDefault();
            }
          }

          /**
           * Handle Overlay Click
           */

        }, {
          key: "_handleOverlayClick",
          value: function _handleOverlayClick() {
            if (this.options.dismissible) {
              this.close();
            }
          }

          /**
           * Handle Modal Close Click
           * @param {Event} e
           */

        }, {
          key: "_handleModalCloseClick",
          value: function _handleModalCloseClick(e) {
            var $closeTrigger = $(e.target).closest('.modal-close');
            if ($closeTrigger.length) {
              this.close();
            }
          }

          /**
           * Handle Keydown
           * @param {Event} e
           */

        }, {
          key: "_handleKeydown",
          value: function _handleKeydown(e) {
            // ESC key
            if (e.keyCode === 27 && this.options.dismissible) {
              this.close();
            }
          }

          /**
           * Handle Focus
           * @param {Event} e
           */

        }, {
          key: "_handleFocus",
          value: function _handleFocus(e) {
            // Only trap focus if this modal is the last model opened (prevents loops in nested modals).
            if (!this.el.contains(e.target) && this._nthModalOpened === Modal._modalsOpen) {
              this.el.focus();
            }
          }

          /**
           * Animate in modal
           */

        }, {
          key: "_animateIn",
          value: function _animateIn() {
            var _this14 = this;

            // Set initial styles
            $.extend(this.el.style, {
              display: 'block',
              opacity: 0
            });
            $.extend(this.$overlay[0].style, {
              display: 'block',
              opacity: 0
            });

            // Animate overlay
            anim({
              targets: this.$overlay[0],
              opacity: this.options.opacity,
              duration: this.options.inDuration,
              easing: 'easeOutQuad'
            });

            // Define modal animation options
            var enterAnimOptions = {
              targets: this.el,
              duration: this.options.inDuration,
              easing: 'easeOutCubic',
              // Handle modal onOpenEnd callback
              complete: function () {
                if (typeof _this14.options.onOpenEnd === 'function') {
                  _this14.options.onOpenEnd.call(_this14, _this14.el, _this14._openingTrigger);
                }
              }
            };

            // Bottom sheet animation
            if (this.el.classList.contains('bottom-sheet')) {
              $.extend(enterAnimOptions, {
                bottom: 0,
                opacity: 1
              });
              anim(enterAnimOptions);

              // Normal modal animation
            } else {
              $.extend(enterAnimOptions, {
                top: [this.options.startingTop, this.options.endingTop],
                opacity: 1,
                scaleX: [0.8, 1],
                scaleY: [0.8, 1]
              });
              anim(enterAnimOptions);
            }
          }

          /**
           * Animate out modal
           */

        }, {
          key: "_animateOut",
          value: function _animateOut() {
            var _this15 = this;

            // Animate overlay
            anim({
              targets: this.$overlay[0],
              opacity: 0,
              duration: this.options.outDuration,
              easing: 'easeOutQuart'
            });

            // Define modal animation options
            var exitAnimOptions = {
              targets: this.el,
              duration: this.options.outDuration,
              easing: 'easeOutCubic',
              // Handle modal ready callback
              complete: function () {
                _this15.el.style.display = 'none';
                _this15.$overlay.remove();

                // Call onCloseEnd callback
                if (typeof _this15.options.onCloseEnd === 'function') {
                  _this15.options.onCloseEnd.call(_this15, _this15.el);
                }
              }
            };

            // Bottom sheet animation
            if (this.el.classList.contains('bottom-sheet')) {
              $.extend(exitAnimOptions, {
                bottom: '-100%',
                opacity: 0
              });
              anim(exitAnimOptions);

              // Normal modal animation
            } else {
              $.extend(exitAnimOptions, {
                top: [this.options.endingTop, this.options.startingTop],
                opacity: 0,
                scaleX: 0.8,
                scaleY: 0.8
              });
              anim(exitAnimOptions);
            }
          }

          /**
           * Open Modal
           * @param {cash} [$trigger]
           */

        }, {
          key: "open",
          value: function open($trigger) {
            if (this.isOpen) {
              return;
            }

            this.isOpen = true;
            Modal._modalsOpen++;
            this._nthModalOpened = Modal._modalsOpen;

            // Set Z-Index based on number of currently open modals
            this.$overlay[0].style.zIndex = 1000 + Modal._modalsOpen * 2;
            this.el.style.zIndex = 1000 + Modal._modalsOpen * 2 + 1;

            // Set opening trigger, undefined indicates modal was opened by javascript
            this._openingTrigger = !!$trigger ? $trigger[0] : undefined;

            // onOpenStart callback
            if (typeof this.options.onOpenStart === 'function') {
              this.options.onOpenStart.call(this, this.el, this._openingTrigger);
            }

            if (this.options.preventScrolling) {
              document.body.style.overflow = 'hidden';
            }

            this.el.classList.add('open');
            this.el.insertAdjacentElement('afterend', this.$overlay[0]);

            if (this.options.dismissible) {
              this._handleKeydownBound = this._handleKeydown.bind(this);
              this._handleFocusBound = this._handleFocus.bind(this);
              document.addEventListener('keydown', this._handleKeydownBound);
              document.addEventListener('focus', this._handleFocusBound, true);
            }

            anim.remove(this.el);
            anim.remove(this.$overlay[0]);
            this._animateIn();

            // Focus modal
            this.el.focus();

            return this;
          }

          /**
           * Close Modal
           */

        }, {
          key: "close",
          value: function close() {
            if (!this.isOpen) {
              return;
            }

            this.isOpen = false;
            Modal._modalsOpen--;
            this._nthModalOpened = 0;

            // Call onCloseStart callback
            if (typeof this.options.onCloseStart === 'function') {
              this.options.onCloseStart.call(this, this.el);
            }

            this.el.classList.remove('open');

            // Enable body scrolling only if there are no more modals open.
            if (Modal._modalsOpen === 0) {
              document.body.style.overflow = '';
            }

            if (this.options.dismissible) {
              document.removeEventListener('keydown', this._handleKeydownBound);
              document.removeEventListener('focus', this._handleFocusBound, true);
            }

            anim.remove(this.el);
            anim.remove(this.$overlay[0]);
            this._animateOut();
            return this;
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Modal.__proto__ || Object.getPrototypeOf(Modal), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Modal;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Modal;
      }(Component);

      /**
       * @static
       * @memberof Modal
       */


      Modal._modalsOpen = 0;

      /**
       * @static
       * @memberof Modal
       */
      Modal._count = 0;

      M.Modal = Modal;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Modal, 'modal', 'M_Modal');
      }
    })(cash, M.anime);
    (function ($, anim) {

      var _defaults = {
        inDuration: 275,
        outDuration: 200,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null
      };

      /**
       * @class
       *
       */

      var Materialbox = function (_Component4) {
        _inherits(Materialbox, _Component4);

        /**
         * Construct Materialbox instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Materialbox(el, options) {
          _classCallCheck(this, Materialbox);

          var _this16 = _possibleConstructorReturn(this, (Materialbox.__proto__ || Object.getPrototypeOf(Materialbox)).call(this, Materialbox, el, options));

          _this16.el.M_Materialbox = _this16;

          /**
           * Options for the modal
           * @member Materialbox#options
           * @prop {Number} [inDuration=275] - Length in ms of enter transition
           * @prop {Number} [outDuration=200] - Length in ms of exit transition
           * @prop {Function} onOpenStart - Callback function called before materialbox is opened
           * @prop {Function} onOpenEnd - Callback function called after materialbox is opened
           * @prop {Function} onCloseStart - Callback function called before materialbox is closed
           * @prop {Function} onCloseEnd - Callback function called after materialbox is closed
           */
          _this16.options = $.extend({}, Materialbox.defaults, options);

          _this16.overlayActive = false;
          _this16.doneAnimating = true;
          _this16.placeholder = $('<div></div>').addClass('material-placeholder');
          _this16.originalWidth = 0;
          _this16.originalHeight = 0;
          _this16.originInlineStyles = _this16.$el.attr('style');
          _this16.caption = _this16.el.getAttribute('data-caption') || '';

          // Wrap
          _this16.$el.before(_this16.placeholder);
          _this16.placeholder.append(_this16.$el);

          _this16._setupEventHandlers();
          return _this16;
        }

        _createClass(Materialbox, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.el.M_Materialbox = undefined;

            // Unwrap image
            $(this.placeholder).after(this.el).remove();

            this.$el.removeAttr('style');
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleMaterialboxClickBound = this._handleMaterialboxClick.bind(this);
            this.el.addEventListener('click', this._handleMaterialboxClickBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('click', this._handleMaterialboxClickBound);
          }

          /**
           * Handle Materialbox Click
           * @param {Event} e
           */

        }, {
          key: "_handleMaterialboxClick",
          value: function _handleMaterialboxClick(e) {
            // If already modal, return to original
            if (this.doneAnimating === false || this.overlayActive && this.doneAnimating) {
              this.close();
            } else {
              this.open();
            }
          }

          /**
           * Handle Window Scroll
           */

        }, {
          key: "_handleWindowScroll",
          value: function _handleWindowScroll() {
            if (this.overlayActive) {
              this.close();
            }
          }

          /**
           * Handle Window Resize
           */

        }, {
          key: "_handleWindowResize",
          value: function _handleWindowResize() {
            if (this.overlayActive) {
              this.close();
            }
          }

          /**
           * Handle Window Resize
           * @param {Event} e
           */

        }, {
          key: "_handleWindowEscape",
          value: function _handleWindowEscape(e) {
            // ESC key
            if (e.keyCode === 27 && this.doneAnimating && this.overlayActive) {
              this.close();
            }
          }

          /**
           * Find ancestors with overflow: hidden; and make visible
           */

        }, {
          key: "_makeAncestorsOverflowVisible",
          value: function _makeAncestorsOverflowVisible() {
            this.ancestorsChanged = $();
            var ancestor = this.placeholder[0].parentNode;
            while (ancestor !== null && !$(ancestor).is(document)) {
              var curr = $(ancestor);
              if (curr.css('overflow') !== 'visible') {
                curr.css('overflow', 'visible');
                if (this.ancestorsChanged === undefined) {
                  this.ancestorsChanged = curr;
                } else {
                  this.ancestorsChanged = this.ancestorsChanged.add(curr);
                }
              }
              ancestor = ancestor.parentNode;
            }
          }

          /**
           * Animate image in
           */

        }, {
          key: "_animateImageIn",
          value: function _animateImageIn() {
            var _this17 = this;

            var animOptions = {
              targets: this.el,
              height: [this.originalHeight, this.newHeight],
              width: [this.originalWidth, this.newWidth],
              left: M.getDocumentScrollLeft() + this.windowWidth / 2 - this.placeholder.offset().left - this.newWidth / 2,
              top: M.getDocumentScrollTop() + this.windowHeight / 2 - this.placeholder.offset().top - this.newHeight / 2,
              duration: this.options.inDuration,
              easing: 'easeOutQuad',
              complete: function () {
                _this17.doneAnimating = true;

                // onOpenEnd callback
                if (typeof _this17.options.onOpenEnd === 'function') {
                  _this17.options.onOpenEnd.call(_this17, _this17.el);
                }
              }
            };

            // Override max-width or max-height if needed
            this.maxWidth = this.$el.css('max-width');
            this.maxHeight = this.$el.css('max-height');
            if (this.maxWidth !== 'none') {
              animOptions.maxWidth = this.newWidth;
            }
            if (this.maxHeight !== 'none') {
              animOptions.maxHeight = this.newHeight;
            }

            anim(animOptions);
          }

          /**
           * Animate image out
           */

        }, {
          key: "_animateImageOut",
          value: function _animateImageOut() {
            var _this18 = this;

            var animOptions = {
              targets: this.el,
              width: this.originalWidth,
              height: this.originalHeight,
              left: 0,
              top: 0,
              duration: this.options.outDuration,
              easing: 'easeOutQuad',
              complete: function () {
                _this18.placeholder.css({
                  height: '',
                  width: '',
                  position: '',
                  top: '',
                  left: ''
                });

                // Revert to width or height attribute
                if (_this18.attrWidth) {
                  _this18.$el.attr('width', _this18.attrWidth);
                }
                if (_this18.attrHeight) {
                  _this18.$el.attr('height', _this18.attrHeight);
                }

                _this18.$el.removeAttr('style');
                _this18.originInlineStyles && _this18.$el.attr('style', _this18.originInlineStyles);

                // Remove class
                _this18.$el.removeClass('active');
                _this18.doneAnimating = true;

                // Remove overflow overrides on ancestors
                if (_this18.ancestorsChanged.length) {
                  _this18.ancestorsChanged.css('overflow', '');
                }

                // onCloseEnd callback
                if (typeof _this18.options.onCloseEnd === 'function') {
                  _this18.options.onCloseEnd.call(_this18, _this18.el);
                }
              }
            };

            anim(animOptions);
          }

          /**
           * Update open and close vars
           */

        }, {
          key: "_updateVars",
          value: function _updateVars() {
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;
            this.caption = this.el.getAttribute('data-caption') || '';
          }

          /**
           * Open Materialbox
           */

        }, {
          key: "open",
          value: function open() {
            var _this19 = this;

            this._updateVars();
            this.originalWidth = this.el.getBoundingClientRect().width;
            this.originalHeight = this.el.getBoundingClientRect().height;

            // Set states
            this.doneAnimating = false;
            this.$el.addClass('active');
            this.overlayActive = true;

            // onOpenStart callback
            if (typeof this.options.onOpenStart === 'function') {
              this.options.onOpenStart.call(this, this.el);
            }

            // Set positioning for placeholder
            this.placeholder.css({
              width: this.placeholder[0].getBoundingClientRect().width + 'px',
              height: this.placeholder[0].getBoundingClientRect().height + 'px',
              position: 'relative',
              top: 0,
              left: 0
            });

            this._makeAncestorsOverflowVisible();

            // Set css on origin
            this.$el.css({
              position: 'absolute',
              'z-index': 1000,
              'will-change': 'left, top, width, height'
            });

            // Change from width or height attribute to css
            this.attrWidth = this.$el.attr('width');
            this.attrHeight = this.$el.attr('height');
            if (this.attrWidth) {
              this.$el.css('width', this.attrWidth + 'px');
              this.$el.removeAttr('width');
            }
            if (this.attrHeight) {
              this.$el.css('width', this.attrHeight + 'px');
              this.$el.removeAttr('height');
            }

            // Add overlay
            this.$overlay = $('<div id="materialbox-overlay"></div>').css({
              opacity: 0
            }).one('click', function () {
              if (_this19.doneAnimating) {
                _this19.close();
              }
            });

            // Put before in origin image to preserve z-index layering.
            this.$el.before(this.$overlay);

            // Set dimensions if needed
            var overlayOffset = this.$overlay[0].getBoundingClientRect();
            this.$overlay.css({
              width: this.windowWidth + 'px',
              height: this.windowHeight + 'px',
              left: -1 * overlayOffset.left + 'px',
              top: -1 * overlayOffset.top + 'px'
            });

            anim.remove(this.el);
            anim.remove(this.$overlay[0]);

            // Animate Overlay
            anim({
              targets: this.$overlay[0],
              opacity: 1,
              duration: this.options.inDuration,
              easing: 'easeOutQuad'
            });

            // Add and animate caption if it exists
            if (this.caption !== '') {
              if (this.$photocaption) {
                anim.remove(this.$photoCaption[0]);
              }
              this.$photoCaption = $('<div class="materialbox-caption"></div>');
              this.$photoCaption.text(this.caption);
              $('body').append(this.$photoCaption);
              this.$photoCaption.css({ display: 'inline' });

              anim({
                targets: this.$photoCaption[0],
                opacity: 1,
                duration: this.options.inDuration,
                easing: 'easeOutQuad'
              });
            }

            // Resize Image
            var ratio = 0;
            var widthPercent = this.originalWidth / this.windowWidth;
            var heightPercent = this.originalHeight / this.windowHeight;
            this.newWidth = 0;
            this.newHeight = 0;

            if (widthPercent > heightPercent) {
              ratio = this.originalHeight / this.originalWidth;
              this.newWidth = this.windowWidth * 0.9;
              this.newHeight = this.windowWidth * 0.9 * ratio;
            } else {
              ratio = this.originalWidth / this.originalHeight;
              this.newWidth = this.windowHeight * 0.9 * ratio;
              this.newHeight = this.windowHeight * 0.9;
            }

            this._animateImageIn();

            // Handle Exit triggers
            this._handleWindowScrollBound = this._handleWindowScroll.bind(this);
            this._handleWindowResizeBound = this._handleWindowResize.bind(this);
            this._handleWindowEscapeBound = this._handleWindowEscape.bind(this);

            window.addEventListener('scroll', this._handleWindowScrollBound);
            window.addEventListener('resize', this._handleWindowResizeBound);
            window.addEventListener('keyup', this._handleWindowEscapeBound);
          }

          /**
           * Close Materialbox
           */

        }, {
          key: "close",
          value: function close() {
            var _this20 = this;

            this._updateVars();
            this.doneAnimating = false;

            // onCloseStart callback
            if (typeof this.options.onCloseStart === 'function') {
              this.options.onCloseStart.call(this, this.el);
            }

            anim.remove(this.el);
            anim.remove(this.$overlay[0]);

            if (this.caption !== '') {
              anim.remove(this.$photoCaption[0]);
            }

            // disable exit handlers
            window.removeEventListener('scroll', this._handleWindowScrollBound);
            window.removeEventListener('resize', this._handleWindowResizeBound);
            window.removeEventListener('keyup', this._handleWindowEscapeBound);

            anim({
              targets: this.$overlay[0],
              opacity: 0,
              duration: this.options.outDuration,
              easing: 'easeOutQuad',
              complete: function () {
                _this20.overlayActive = false;
                _this20.$overlay.remove();
              }
            });

            this._animateImageOut();

            // Remove Caption + reset css settings on image
            if (this.caption !== '') {
              anim({
                targets: this.$photoCaption[0],
                opacity: 0,
                duration: this.options.outDuration,
                easing: 'easeOutQuad',
                complete: function () {
                  _this20.$photoCaption.remove();
                }
              });
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Materialbox.__proto__ || Object.getPrototypeOf(Materialbox), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Materialbox;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Materialbox;
      }(Component);

      M.Materialbox = Materialbox;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Materialbox, 'materialbox', 'M_Materialbox');
      }
    })(cash, M.anime);
    (function ($) {

      var _defaults = {
        responsiveThreshold: 0 // breakpoint for swipeable
      };

      var Parallax = function (_Component5) {
        _inherits(Parallax, _Component5);

        function Parallax(el, options) {
          _classCallCheck(this, Parallax);

          var _this21 = _possibleConstructorReturn(this, (Parallax.__proto__ || Object.getPrototypeOf(Parallax)).call(this, Parallax, el, options));

          _this21.el.M_Parallax = _this21;

          /**
           * Options for the Parallax
           * @member Parallax#options
           * @prop {Number} responsiveThreshold
           */
          _this21.options = $.extend({}, Parallax.defaults, options);
          _this21._enabled = window.innerWidth > _this21.options.responsiveThreshold;

          _this21.$img = _this21.$el.find('img').first();
          _this21.$img.each(function () {
            var el = this;
            if (el.complete) $(el).trigger('load');
          });

          _this21._updateParallax();
          _this21._setupEventHandlers();
          _this21._setupStyles();

          Parallax._parallaxes.push(_this21);
          return _this21;
        }

        _createClass(Parallax, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            Parallax._parallaxes.splice(Parallax._parallaxes.indexOf(this), 1);
            this.$img[0].style.transform = '';
            this._removeEventHandlers();

            this.$el[0].M_Parallax = undefined;
          }
        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleImageLoadBound = this._handleImageLoad.bind(this);
            this.$img[0].addEventListener('load', this._handleImageLoadBound);

            if (Parallax._parallaxes.length === 0) {
              Parallax._handleScrollThrottled = M.throttle(Parallax._handleScroll, 5);
              window.addEventListener('scroll', Parallax._handleScrollThrottled);

              Parallax._handleWindowResizeThrottled = M.throttle(Parallax._handleWindowResize, 5);
              window.addEventListener('resize', Parallax._handleWindowResizeThrottled);
            }
          }
        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.$img[0].removeEventListener('load', this._handleImageLoadBound);

            if (Parallax._parallaxes.length === 0) {
              window.removeEventListener('scroll', Parallax._handleScrollThrottled);
              window.removeEventListener('resize', Parallax._handleWindowResizeThrottled);
            }
          }
        }, {
          key: "_setupStyles",
          value: function _setupStyles() {
            this.$img[0].style.opacity = 1;
          }
        }, {
          key: "_handleImageLoad",
          value: function _handleImageLoad() {
            this._updateParallax();
          }
        }, {
          key: "_updateParallax",
          value: function _updateParallax() {
            var containerHeight = this.$el.height() > 0 ? this.el.parentNode.offsetHeight : 500;
            var imgHeight = this.$img[0].offsetHeight;
            var parallaxDist = imgHeight - containerHeight;
            var bottom = this.$el.offset().top + containerHeight;
            var top = this.$el.offset().top;
            var scrollTop = M.getDocumentScrollTop();
            var windowHeight = window.innerHeight;
            var windowBottom = scrollTop + windowHeight;
            var percentScrolled = (windowBottom - top) / (containerHeight + windowHeight);
            var parallax = parallaxDist * percentScrolled;

            if (!this._enabled) {
              this.$img[0].style.transform = '';
            } else if (bottom > scrollTop && top < scrollTop + windowHeight) {
              this.$img[0].style.transform = "translate3D(-50%, " + parallax + "px, 0)";
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Parallax.__proto__ || Object.getPrototypeOf(Parallax), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Parallax;
          }
        }, {
          key: "_handleScroll",
          value: function _handleScroll() {
            for (var i = 0; i < Parallax._parallaxes.length; i++) {
              var parallaxInstance = Parallax._parallaxes[i];
              parallaxInstance._updateParallax.call(parallaxInstance);
            }
          }
        }, {
          key: "_handleWindowResize",
          value: function _handleWindowResize() {
            for (var i = 0; i < Parallax._parallaxes.length; i++) {
              var parallaxInstance = Parallax._parallaxes[i];
              parallaxInstance._enabled = window.innerWidth > parallaxInstance.options.responsiveThreshold;
            }
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Parallax;
      }(Component);

      /**
       * @static
       * @memberof Parallax
       */


      Parallax._parallaxes = [];

      M.Parallax = Parallax;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Parallax, 'parallax', 'M_Parallax');
      }
    })(cash);
    (function ($, anim) {

      var _defaults = {
        duration: 300,
        onShow: null,
        swipeable: false,
        responsiveThreshold: Infinity // breakpoint for swipeable
      };

      /**
       * @class
       *
       */

      var Tabs = function (_Component6) {
        _inherits(Tabs, _Component6);

        /**
         * Construct Tabs instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Tabs(el, options) {
          _classCallCheck(this, Tabs);

          var _this22 = _possibleConstructorReturn(this, (Tabs.__proto__ || Object.getPrototypeOf(Tabs)).call(this, Tabs, el, options));

          _this22.el.M_Tabs = _this22;

          /**
           * Options for the Tabs
           * @member Tabs#options
           * @prop {Number} duration
           * @prop {Function} onShow
           * @prop {Boolean} swipeable
           * @prop {Number} responsiveThreshold
           */
          _this22.options = $.extend({}, Tabs.defaults, options);

          // Setup
          _this22.$tabLinks = _this22.$el.children('li.tab').children('a');
          _this22.index = 0;
          _this22._setupActiveTabLink();

          // Setup tabs content
          if (_this22.options.swipeable) {
            _this22._setupSwipeableTabs();
          } else {
            _this22._setupNormalTabs();
          }

          // Setup tabs indicator after content to ensure accurate widths
          _this22._setTabsAndTabWidth();
          _this22._createIndicator();

          _this22._setupEventHandlers();
          return _this22;
        }

        _createClass(Tabs, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this._indicator.parentNode.removeChild(this._indicator);

            if (this.options.swipeable) {
              this._teardownSwipeableTabs();
            } else {
              this._teardownNormalTabs();
            }

            this.$el[0].M_Tabs = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleWindowResizeBound = this._handleWindowResize.bind(this);
            window.addEventListener('resize', this._handleWindowResizeBound);

            this._handleTabClickBound = this._handleTabClick.bind(this);
            this.el.addEventListener('click', this._handleTabClickBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            window.removeEventListener('resize', this._handleWindowResizeBound);
            this.el.removeEventListener('click', this._handleTabClickBound);
          }

          /**
           * Handle window Resize
           */

        }, {
          key: "_handleWindowResize",
          value: function _handleWindowResize() {
            this._setTabsAndTabWidth();

            if (this.tabWidth !== 0 && this.tabsWidth !== 0) {
              this._indicator.style.left = this._calcLeftPos(this.$activeTabLink) + 'px';
              this._indicator.style.right = this._calcRightPos(this.$activeTabLink) + 'px';
            }
          }

          /**
           * Handle tab click
           * @param {Event} e
           */

        }, {
          key: "_handleTabClick",
          value: function _handleTabClick(e) {
            var _this23 = this;

            var tab = $(e.target).closest('li.tab');
            var tabLink = $(e.target).closest('a');

            // Handle click on tab link only
            if (!tabLink.length || !tabLink.parent().hasClass('tab')) {
              return;
            }

            if (tab.hasClass('disabled')) {
              e.preventDefault();
              return;
            }

            // Act as regular link if target attribute is specified.
            if (!!tabLink.attr('target')) {
              return;
            }

            // Make the old tab inactive.
            this.$activeTabLink.removeClass('active');
            var $oldContent = this.$content;

            // Update the variables with the new link and content
            this.$activeTabLink = tabLink;
            this.$content = $(M.escapeHash(tabLink[0].hash));
            this.$tabLinks = this.$el.children('li.tab').children('a');

            // Make the tab active.
            this.$activeTabLink.addClass('active');
            var prevIndex = this.index;
            this.index = Math.max(this.$tabLinks.index(tabLink), 0);

            // Swap content
            if (this.options.swipeable) {
              if (this._tabsCarousel) {
                this._tabsCarousel.set(this.index, function () {
                  if (typeof _this23.options.onShow === 'function') {
                    _this23.options.onShow.call(_this23, _this23.$content[0]);
                  }
                });
              }
            } else {
              if (this.$content.length) {
                this.$content[0].style.display = 'block';
                this.$content.addClass('active');
                if (typeof this.options.onShow === 'function') {
                  this.options.onShow.call(this, this.$content[0]);
                }

                if ($oldContent.length && !$oldContent.is(this.$content)) {
                  $oldContent[0].style.display = 'none';
                  $oldContent.removeClass('active');
                }
              }
            }

            // Update widths after content is swapped (scrollbar bugfix)
            this._setTabsAndTabWidth();

            // Update indicator
            this._animateIndicator(prevIndex);

            // Prevent the anchor's default click action
            e.preventDefault();
          }

          /**
           * Generate elements for tab indicator.
           */

        }, {
          key: "_createIndicator",
          value: function _createIndicator() {
            var _this24 = this;

            var indicator = document.createElement('li');
            indicator.classList.add('indicator');

            this.el.appendChild(indicator);
            this._indicator = indicator;

            setTimeout(function () {
              _this24._indicator.style.left = _this24._calcLeftPos(_this24.$activeTabLink) + 'px';
              _this24._indicator.style.right = _this24._calcRightPos(_this24.$activeTabLink) + 'px';
            }, 0);
          }

          /**
           * Setup first active tab link.
           */

        }, {
          key: "_setupActiveTabLink",
          value: function _setupActiveTabLink() {
            // If the location.hash matches one of the links, use that as the active tab.
            this.$activeTabLink = $(this.$tabLinks.filter('[href="' + location.hash + '"]'));

            // If no match is found, use the first link or any with class 'active' as the initial active tab.
            if (this.$activeTabLink.length === 0) {
              this.$activeTabLink = this.$el.children('li.tab').children('a.active').first();
            }
            if (this.$activeTabLink.length === 0) {
              this.$activeTabLink = this.$el.children('li.tab').children('a').first();
            }

            this.$tabLinks.removeClass('active');
            this.$activeTabLink[0].classList.add('active');

            this.index = Math.max(this.$tabLinks.index(this.$activeTabLink), 0);

            if (this.$activeTabLink.length) {
              this.$content = $(M.escapeHash(this.$activeTabLink[0].hash));
              this.$content.addClass('active');
            }
          }

          /**
           * Setup swipeable tabs
           */

        }, {
          key: "_setupSwipeableTabs",
          value: function _setupSwipeableTabs() {
            var _this25 = this;

            // Change swipeable according to responsive threshold
            if (window.innerWidth > this.options.responsiveThreshold) {
              this.options.swipeable = false;
            }

            var $tabsContent = $();
            this.$tabLinks.each(function (link) {
              var $currContent = $(M.escapeHash(link.hash));
              $currContent.addClass('carousel-item');
              $tabsContent = $tabsContent.add($currContent);
            });

            var $tabsWrapper = $('<div class="tabs-content carousel carousel-slider"></div>');
            $tabsContent.first().before($tabsWrapper);
            $tabsWrapper.append($tabsContent);
            $tabsContent[0].style.display = '';

            // Keep active tab index to set initial carousel slide
            var activeTabIndex = this.$activeTabLink.closest('.tab').index();

            this._tabsCarousel = M.Carousel.init($tabsWrapper[0], {
              fullWidth: true,
              noWrap: true,
              onCycleTo: function (item) {
                var prevIndex = _this25.index;
                _this25.index = $(item).index();
                _this25.$activeTabLink.removeClass('active');
                _this25.$activeTabLink = _this25.$tabLinks.eq(_this25.index);
                _this25.$activeTabLink.addClass('active');
                _this25._animateIndicator(prevIndex);
                if (typeof _this25.options.onShow === 'function') {
                  _this25.options.onShow.call(_this25, _this25.$content[0]);
                }
              }
            });

            // Set initial carousel slide to active tab
            this._tabsCarousel.set(activeTabIndex);
          }

          /**
           * Teardown normal tabs.
           */

        }, {
          key: "_teardownSwipeableTabs",
          value: function _teardownSwipeableTabs() {
            var $tabsWrapper = this._tabsCarousel.$el;
            this._tabsCarousel.destroy();

            // Unwrap
            $tabsWrapper.after($tabsWrapper.children());
            $tabsWrapper.remove();
          }

          /**
           * Setup normal tabs.
           */

        }, {
          key: "_setupNormalTabs",
          value: function _setupNormalTabs() {
            // Hide Tabs Content
            this.$tabLinks.not(this.$activeTabLink).each(function (link) {
              if (!!link.hash) {
                var $currContent = $(M.escapeHash(link.hash));
                if ($currContent.length) {
                  $currContent[0].style.display = 'none';
                }
              }
            });
          }

          /**
           * Teardown normal tabs.
           */

        }, {
          key: "_teardownNormalTabs",
          value: function _teardownNormalTabs() {
            // show Tabs Content
            this.$tabLinks.each(function (link) {
              if (!!link.hash) {
                var $currContent = $(M.escapeHash(link.hash));
                if ($currContent.length) {
                  $currContent[0].style.display = '';
                }
              }
            });
          }

          /**
           * set tabs and tab width
           */

        }, {
          key: "_setTabsAndTabWidth",
          value: function _setTabsAndTabWidth() {
            this.tabsWidth = this.$el.width();
            this.tabWidth = Math.max(this.tabsWidth, this.el.scrollWidth) / this.$tabLinks.length;
          }

          /**
           * Finds right attribute for indicator based on active tab.
           * @param {cash} el
           */

        }, {
          key: "_calcRightPos",
          value: function _calcRightPos(el) {
            return Math.ceil(this.tabsWidth - el.position().left - el[0].getBoundingClientRect().width);
          }

          /**
           * Finds left attribute for indicator based on active tab.
           * @param {cash} el
           */

        }, {
          key: "_calcLeftPos",
          value: function _calcLeftPos(el) {
            return Math.floor(el.position().left);
          }
        }, {
          key: "updateTabIndicator",
          value: function updateTabIndicator() {
            this._setTabsAndTabWidth();
            this._animateIndicator(this.index);
          }

          /**
           * Animates Indicator to active tab.
           * @param {Number} prevIndex
           */

        }, {
          key: "_animateIndicator",
          value: function _animateIndicator(prevIndex) {
            var leftDelay = 0,
                rightDelay = 0;

            if (this.index - prevIndex >= 0) {
              leftDelay = 90;
            } else {
              rightDelay = 90;
            }

            // Animate
            var animOptions = {
              targets: this._indicator,
              left: {
                value: this._calcLeftPos(this.$activeTabLink),
                delay: leftDelay
              },
              right: {
                value: this._calcRightPos(this.$activeTabLink),
                delay: rightDelay
              },
              duration: this.options.duration,
              easing: 'easeOutQuad'
            };
            anim.remove(this._indicator);
            anim(animOptions);
          }

          /**
           * Select tab.
           * @param {String} tabId
           */

        }, {
          key: "select",
          value: function select(tabId) {
            var tab = this.$tabLinks.filter('[href="#' + tabId + '"]');
            if (tab.length) {
              tab.trigger('click');
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Tabs.__proto__ || Object.getPrototypeOf(Tabs), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Tabs;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Tabs;
      }(Component);

      M.Tabs = Tabs;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Tabs, 'tabs', 'M_Tabs');
      }
    })(cash, M.anime);
    (function ($, anim) {

      var _defaults = {
        exitDelay: 200,
        enterDelay: 0,
        html: null,
        margin: 5,
        inDuration: 250,
        outDuration: 200,
        position: 'bottom',
        transitionMovement: 10
      };

      /**
       * @class
       *
       */

      var Tooltip = function (_Component7) {
        _inherits(Tooltip, _Component7);

        /**
         * Construct Tooltip instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Tooltip(el, options) {
          _classCallCheck(this, Tooltip);

          var _this26 = _possibleConstructorReturn(this, (Tooltip.__proto__ || Object.getPrototypeOf(Tooltip)).call(this, Tooltip, el, options));

          _this26.el.M_Tooltip = _this26;
          _this26.options = $.extend({}, Tooltip.defaults, options);

          _this26.isOpen = false;
          _this26.isHovered = false;
          _this26.isFocused = false;
          _this26._appendTooltipEl();
          _this26._setupEventHandlers();
          return _this26;
        }

        _createClass(Tooltip, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            $(this.tooltipEl).remove();
            this._removeEventHandlers();
            this.el.M_Tooltip = undefined;
          }
        }, {
          key: "_appendTooltipEl",
          value: function _appendTooltipEl() {
            var tooltipEl = document.createElement('div');
            tooltipEl.classList.add('material-tooltip');
            this.tooltipEl = tooltipEl;

            var tooltipContentEl = document.createElement('div');
            tooltipContentEl.classList.add('tooltip-content');
            tooltipContentEl.innerHTML = this.options.html;
            tooltipEl.appendChild(tooltipContentEl);
            document.body.appendChild(tooltipEl);
          }
        }, {
          key: "_updateTooltipContent",
          value: function _updateTooltipContent() {
            this.tooltipEl.querySelector('.tooltip-content').innerHTML = this.options.html;
          }
        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleMouseEnterBound = this._handleMouseEnter.bind(this);
            this._handleMouseLeaveBound = this._handleMouseLeave.bind(this);
            this._handleFocusBound = this._handleFocus.bind(this);
            this._handleBlurBound = this._handleBlur.bind(this);
            this.el.addEventListener('mouseenter', this._handleMouseEnterBound);
            this.el.addEventListener('mouseleave', this._handleMouseLeaveBound);
            this.el.addEventListener('focus', this._handleFocusBound, true);
            this.el.addEventListener('blur', this._handleBlurBound, true);
          }
        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('mouseenter', this._handleMouseEnterBound);
            this.el.removeEventListener('mouseleave', this._handleMouseLeaveBound);
            this.el.removeEventListener('focus', this._handleFocusBound, true);
            this.el.removeEventListener('blur', this._handleBlurBound, true);
          }
        }, {
          key: "open",
          value: function open(isManual) {
            if (this.isOpen) {
              return;
            }
            isManual = isManual === undefined ? true : undefined; // Default value true
            this.isOpen = true;
            // Update tooltip content with HTML attribute options
            this.options = $.extend({}, this.options, this._getAttributeOptions());
            this._updateTooltipContent();
            this._setEnterDelayTimeout(isManual);
          }
        }, {
          key: "close",
          value: function close() {
            if (!this.isOpen) {
              return;
            }

            this.isHovered = false;
            this.isFocused = false;
            this.isOpen = false;
            this._setExitDelayTimeout();
          }

          /**
           * Create timeout which delays when the tooltip closes
           */

        }, {
          key: "_setExitDelayTimeout",
          value: function _setExitDelayTimeout() {
            var _this27 = this;

            clearTimeout(this._exitDelayTimeout);

            this._exitDelayTimeout = setTimeout(function () {
              if (_this27.isHovered || _this27.isFocused) {
                return;
              }

              _this27._animateOut();
            }, this.options.exitDelay);
          }

          /**
           * Create timeout which delays when the toast closes
           */

        }, {
          key: "_setEnterDelayTimeout",
          value: function _setEnterDelayTimeout(isManual) {
            var _this28 = this;

            clearTimeout(this._enterDelayTimeout);

            this._enterDelayTimeout = setTimeout(function () {
              if (!_this28.isHovered && !_this28.isFocused && !isManual) {
                return;
              }

              _this28._animateIn();
            }, this.options.enterDelay);
          }
        }, {
          key: "_positionTooltip",
          value: function _positionTooltip() {
            var origin = this.el,
                tooltip = this.tooltipEl,
                originHeight = origin.offsetHeight,
                originWidth = origin.offsetWidth,
                tooltipHeight = tooltip.offsetHeight,
                tooltipWidth = tooltip.offsetWidth,
                newCoordinates = void 0,
                margin = this.options.margin,
                targetTop = void 0,
                targetLeft = void 0;

            this.xMovement = 0, this.yMovement = 0;

            targetTop = origin.getBoundingClientRect().top + M.getDocumentScrollTop();
            targetLeft = origin.getBoundingClientRect().left + M.getDocumentScrollLeft();

            if (this.options.position === 'top') {
              targetTop += -tooltipHeight - margin;
              targetLeft += originWidth / 2 - tooltipWidth / 2;
              this.yMovement = -this.options.transitionMovement;
            } else if (this.options.position === 'right') {
              targetTop += originHeight / 2 - tooltipHeight / 2;
              targetLeft += originWidth + margin;
              this.xMovement = this.options.transitionMovement;
            } else if (this.options.position === 'left') {
              targetTop += originHeight / 2 - tooltipHeight / 2;
              targetLeft += -tooltipWidth - margin;
              this.xMovement = -this.options.transitionMovement;
            } else {
              targetTop += originHeight + margin;
              targetLeft += originWidth / 2 - tooltipWidth / 2;
              this.yMovement = this.options.transitionMovement;
            }

            newCoordinates = this._repositionWithinScreen(targetLeft, targetTop, tooltipWidth, tooltipHeight);
            $(tooltip).css({
              top: newCoordinates.y + 'px',
              left: newCoordinates.x + 'px'
            });
          }
        }, {
          key: "_repositionWithinScreen",
          value: function _repositionWithinScreen(x, y, width, height) {
            var scrollLeft = M.getDocumentScrollLeft();
            var scrollTop = M.getDocumentScrollTop();
            var newX = x - scrollLeft;
            var newY = y - scrollTop;

            var bounding = {
              left: newX,
              top: newY,
              width: width,
              height: height
            };

            var offset = this.options.margin + this.options.transitionMovement;
            var edges = M.checkWithinContainer(document.body, bounding, offset);

            if (edges.left) {
              newX = offset;
            } else if (edges.right) {
              newX -= newX + width - window.innerWidth;
            }

            if (edges.top) {
              newY = offset;
            } else if (edges.bottom) {
              newY -= newY + height - window.innerHeight;
            }

            return {
              x: newX + scrollLeft,
              y: newY + scrollTop
            };
          }
        }, {
          key: "_animateIn",
          value: function _animateIn() {
            this._positionTooltip();
            this.tooltipEl.style.visibility = 'visible';
            anim.remove(this.tooltipEl);
            anim({
              targets: this.tooltipEl,
              opacity: 1,
              translateX: this.xMovement,
              translateY: this.yMovement,
              duration: this.options.inDuration,
              easing: 'easeOutCubic'
            });
          }
        }, {
          key: "_animateOut",
          value: function _animateOut() {
            anim.remove(this.tooltipEl);
            anim({
              targets: this.tooltipEl,
              opacity: 0,
              translateX: 0,
              translateY: 0,
              duration: this.options.outDuration,
              easing: 'easeOutCubic'
            });
          }
        }, {
          key: "_handleMouseEnter",
          value: function _handleMouseEnter() {
            this.isHovered = true;
            this.isFocused = false; // Allows close of tooltip when opened by focus.
            this.open(false);
          }
        }, {
          key: "_handleMouseLeave",
          value: function _handleMouseLeave() {
            this.isHovered = false;
            this.isFocused = false; // Allows close of tooltip when opened by focus.
            this.close();
          }
        }, {
          key: "_handleFocus",
          value: function _handleFocus() {
            if (M.tabPressed) {
              this.isFocused = true;
              this.open(false);
            }
          }
        }, {
          key: "_handleBlur",
          value: function _handleBlur() {
            this.isFocused = false;
            this.close();
          }
        }, {
          key: "_getAttributeOptions",
          value: function _getAttributeOptions() {
            var attributeOptions = {};
            var tooltipTextOption = this.el.getAttribute('data-tooltip');
            var positionOption = this.el.getAttribute('data-position');

            if (tooltipTextOption) {
              attributeOptions.html = tooltipTextOption;
            }

            if (positionOption) {
              attributeOptions.position = positionOption;
            }
            return attributeOptions;
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Tooltip.__proto__ || Object.getPrototypeOf(Tooltip), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Tooltip;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Tooltip;
      }(Component);

      M.Tooltip = Tooltip;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Tooltip, 'tooltip', 'M_Tooltip');
      }
    })(cash, M.anime);
    (function (window) {

      var Waves = Waves || {};
      var $$ = document.querySelectorAll.bind(document);

      // Find exact position of element
      function isWindow(obj) {
        return obj !== null && obj === obj.window;
      }

      function getWindow(elem) {
        return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
      }

      function offset(elem) {
        var docElem,
            win,
            box = { top: 0, left: 0 },
            doc = elem && elem.ownerDocument;

        docElem = doc.documentElement;

        if (typeof elem.getBoundingClientRect !== typeof undefined) {
          box = elem.getBoundingClientRect();
        }
        win = getWindow(doc);
        return {
          top: box.top + win.pageYOffset - docElem.clientTop,
          left: box.left + win.pageXOffset - docElem.clientLeft
        };
      }

      function convertStyle(obj) {
        var style = '';

        for (var a in obj) {
          if (obj.hasOwnProperty(a)) {
            style += a + ':' + obj[a] + ';';
          }
        }

        return style;
      }

      var Effect = {

        // Effect delay
        duration: 750,

        show: function (e, element) {

          // Disable right click
          if (e.button === 2) {
            return false;
          }

          var el = element || this;

          // Create ripple
          var ripple = document.createElement('div');
          ripple.className = 'waves-ripple';
          el.appendChild(ripple);

          // Get click coordinate and element witdh
          var pos = offset(el);
          var relativeY = e.pageY - pos.top;
          var relativeX = e.pageX - pos.left;
          var scale = 'scale(' + el.clientWidth / 100 * 10 + ')';

          // Support for touch devices
          if ('touches' in e) {
            relativeY = e.touches[0].pageY - pos.top;
            relativeX = e.touches[0].pageX - pos.left;
          }

          // Attach data to element
          ripple.setAttribute('data-hold', Date.now());
          ripple.setAttribute('data-scale', scale);
          ripple.setAttribute('data-x', relativeX);
          ripple.setAttribute('data-y', relativeY);

          // Set ripple position
          var rippleStyle = {
            'top': relativeY + 'px',
            'left': relativeX + 'px'
          };

          ripple.className = ripple.className + ' waves-notransition';
          ripple.setAttribute('style', convertStyle(rippleStyle));
          ripple.className = ripple.className.replace('waves-notransition', '');

          // Scale the ripple
          rippleStyle['-webkit-transform'] = scale;
          rippleStyle['-moz-transform'] = scale;
          rippleStyle['-ms-transform'] = scale;
          rippleStyle['-o-transform'] = scale;
          rippleStyle.transform = scale;
          rippleStyle.opacity = '1';

          rippleStyle['-webkit-transition-duration'] = Effect.duration + 'ms';
          rippleStyle['-moz-transition-duration'] = Effect.duration + 'ms';
          rippleStyle['-o-transition-duration'] = Effect.duration + 'ms';
          rippleStyle['transition-duration'] = Effect.duration + 'ms';

          rippleStyle['-webkit-transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
          rippleStyle['-moz-transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
          rippleStyle['-o-transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
          rippleStyle['transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';

          ripple.setAttribute('style', convertStyle(rippleStyle));
        },

        hide: function (e) {
          TouchHandler.touchup(e);

          var el = this;
          var width = el.clientWidth * 1.4;

          // Get first ripple
          var ripple = null;
          var ripples = el.getElementsByClassName('waves-ripple');
          if (ripples.length > 0) {
            ripple = ripples[ripples.length - 1];
          } else {
            return false;
          }

          var relativeX = ripple.getAttribute('data-x');
          var relativeY = ripple.getAttribute('data-y');
          var scale = ripple.getAttribute('data-scale');

          // Get delay beetween mousedown and mouse leave
          var diff = Date.now() - Number(ripple.getAttribute('data-hold'));
          var delay = 350 - diff;

          if (delay < 0) {
            delay = 0;
          }

          // Fade out ripple after delay
          setTimeout(function () {
            var style = {
              'top': relativeY + 'px',
              'left': relativeX + 'px',
              'opacity': '0',

              // Duration
              '-webkit-transition-duration': Effect.duration + 'ms',
              '-moz-transition-duration': Effect.duration + 'ms',
              '-o-transition-duration': Effect.duration + 'ms',
              'transition-duration': Effect.duration + 'ms',
              '-webkit-transform': scale,
              '-moz-transform': scale,
              '-ms-transform': scale,
              '-o-transform': scale,
              'transform': scale
            };

            ripple.setAttribute('style', convertStyle(style));

            setTimeout(function () {
              try {
                el.removeChild(ripple);
              } catch (e) {
                return false;
              }
            }, Effect.duration);
          }, delay);
        },

        // Little hack to make <input> can perform waves effect
        wrapInput: function (elements) {
          for (var a = 0; a < elements.length; a++) {
            var el = elements[a];

            if (el.tagName.toLowerCase() === 'input') {
              var parent = el.parentNode;

              // If input already have parent just pass through
              if (parent.tagName.toLowerCase() === 'i' && parent.className.indexOf('waves-effect') !== -1) {
                continue;
              }

              // Put element class and style to the specified parent
              var wrapper = document.createElement('i');
              wrapper.className = el.className + ' waves-input-wrapper';

              var elementStyle = el.getAttribute('style');

              if (!elementStyle) {
                elementStyle = '';
              }

              wrapper.setAttribute('style', elementStyle);

              el.className = 'waves-button-input';
              el.removeAttribute('style');

              // Put element as child
              parent.replaceChild(wrapper, el);
              wrapper.appendChild(el);
            }
          }
        }
      };

      /**
       * Disable mousedown event for 500ms during and after touch
       */
      var TouchHandler = {
        /* uses an integer rather than bool so there's no issues with
         * needing to clear timeouts if another touch event occurred
         * within the 500ms. Cannot mouseup between touchstart and
         * touchend, nor in the 500ms after touchend. */
        touches: 0,
        allowEvent: function (e) {
          var allow = true;

          if (e.type === 'touchstart') {
            TouchHandler.touches += 1; //push
          } else if (e.type === 'touchend' || e.type === 'touchcancel') {
            setTimeout(function () {
              if (TouchHandler.touches > 0) {
                TouchHandler.touches -= 1; //pop after 500ms
              }
            }, 500);
          } else if (e.type === 'mousedown' && TouchHandler.touches > 0) {
            allow = false;
          }

          return allow;
        },
        touchup: function (e) {
          TouchHandler.allowEvent(e);
        }
      };

      /**
       * Delegated click handler for .waves-effect element.
       * returns null when .waves-effect element not in "click tree"
       */
      function getWavesEffectElement(e) {
        if (TouchHandler.allowEvent(e) === false) {
          return null;
        }

        var element = null;
        var target = e.target || e.srcElement;

        while (target.parentNode !== null) {
          if (!(target instanceof SVGElement) && target.className.indexOf('waves-effect') !== -1) {
            element = target;
            break;
          }
          target = target.parentNode;
        }
        return element;
      }

      /**
       * Bubble the click and show effect if .waves-effect elem was found
       */
      function showEffect(e) {
        var element = getWavesEffectElement(e);

        if (element !== null) {
          Effect.show(e, element);

          if ('ontouchstart' in window) {
            element.addEventListener('touchend', Effect.hide, false);
            element.addEventListener('touchcancel', Effect.hide, false);
          }

          element.addEventListener('mouseup', Effect.hide, false);
          element.addEventListener('mouseleave', Effect.hide, false);
          element.addEventListener('dragend', Effect.hide, false);
        }
      }

      Waves.displayEffect = function (options) {
        options = options || {};

        if ('duration' in options) {
          Effect.duration = options.duration;
        }

        //Wrap input inside <i> tag
        Effect.wrapInput($$('.waves-effect'));

        if ('ontouchstart' in window) {
          document.body.addEventListener('touchstart', showEffect, false);
        }

        document.body.addEventListener('mousedown', showEffect, false);
      };

      /**
       * Attach Waves to an input element (or any element which doesn't
       * bubble mouseup/mousedown events).
       *   Intended to be used with dynamically loaded forms/inputs, or
       * where the user doesn't want a delegated click handler.
       */
      Waves.attach = function (element) {
        //FUTURE: automatically add waves classes and allow users
        // to specify them with an options param? Eg. light/classic/button
        if (element.tagName.toLowerCase() === 'input') {
          Effect.wrapInput([element]);
          element = element.parentNode;
        }

        if ('ontouchstart' in window) {
          element.addEventListener('touchstart', showEffect, false);
        }

        element.addEventListener('mousedown', showEffect, false);
      };

      window.Waves = Waves;

      document.addEventListener('DOMContentLoaded', function () {
        Waves.displayEffect();
      }, false);
    })(window);
    (function ($, anim) {

      var _defaults = {
        html: '',
        displayLength: 4000,
        inDuration: 300,
        outDuration: 375,
        classes: '',
        completeCallback: null,
        activationPercent: 0.8
      };

      var Toast = function () {
        function Toast(options) {
          _classCallCheck(this, Toast);

          /**
           * Options for the toast
           * @member Toast#options
           */
          this.options = $.extend({}, Toast.defaults, options);
          this.message = this.options.html;

          /**
           * Describes current pan state toast
           * @type {Boolean}
           */
          this.panning = false;

          /**
           * Time remaining until toast is removed
           */
          this.timeRemaining = this.options.displayLength;

          if (Toast._toasts.length === 0) {
            Toast._createContainer();
          }

          // Create new toast
          Toast._toasts.push(this);
          var toastElement = this._createToast();
          toastElement.M_Toast = this;
          this.el = toastElement;
          this.$el = $(toastElement);
          this._animateIn();
          this._setTimer();
        }

        _createClass(Toast, [{
          key: "_createToast",


          /**
           * Create toast and append it to toast container
           */
          value: function _createToast() {
            var toast = document.createElement('div');
            toast.classList.add('toast');

            // Add custom classes onto toast
            if (!!this.options.classes.length) {
              $(toast).addClass(this.options.classes);
            }

            // Set content
            if (typeof HTMLElement === 'object' ? this.message instanceof HTMLElement : this.message && typeof this.message === 'object' && this.message !== null && this.message.nodeType === 1 && typeof this.message.nodeName === 'string') {
              toast.appendChild(this.message);

              // Check if it is jQuery object
            } else if (!!this.message.jquery) {
              $(toast).append(this.message[0]);

              // Insert as html;
            } else {
              toast.innerHTML = this.message;
            }

            // Append toasft
            Toast._container.appendChild(toast);
            return toast;
          }

          /**
           * Animate in toast
           */

        }, {
          key: "_animateIn",
          value: function _animateIn() {
            // Animate toast in
            anim({
              targets: this.el,
              top: 0,
              opacity: 1,
              duration: this.options.inDuration,
              easing: 'easeOutCubic'
            });
          }

          /**
           * Create setInterval which automatically removes toast when timeRemaining >= 0
           * has been reached
           */

        }, {
          key: "_setTimer",
          value: function _setTimer() {
            var _this29 = this;

            if (this.timeRemaining !== Infinity) {
              this.counterInterval = setInterval(function () {
                // If toast is not being dragged, decrease its time remaining
                if (!_this29.panning) {
                  _this29.timeRemaining -= 20;
                }

                // Animate toast out
                if (_this29.timeRemaining <= 0) {
                  _this29.dismiss();
                }
              }, 20);
            }
          }

          /**
           * Dismiss toast with animation
           */

        }, {
          key: "dismiss",
          value: function dismiss() {
            var _this30 = this;

            window.clearInterval(this.counterInterval);
            var activationDistance = this.el.offsetWidth * this.options.activationPercent;

            if (this.wasSwiped) {
              this.el.style.transition = 'transform .05s, opacity .05s';
              this.el.style.transform = "translateX(" + activationDistance + "px)";
              this.el.style.opacity = 0;
            }

            anim({
              targets: this.el,
              opacity: 0,
              marginTop: -40,
              duration: this.options.outDuration,
              easing: 'easeOutExpo',
              complete: function () {
                // Call the optional callback
                if (typeof _this30.options.completeCallback === 'function') {
                  _this30.options.completeCallback();
                }
                // Remove toast from DOM
                _this30.$el.remove();
                Toast._toasts.splice(Toast._toasts.indexOf(_this30), 1);
                if (Toast._toasts.length === 0) {
                  Toast._removeContainer();
                }
              }
            });
          }
        }], [{
          key: "getInstance",


          /**
           * Get Instance
           */
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Toast;
          }

          /**
           * Append toast container and add event handlers
           */

        }, {
          key: "_createContainer",
          value: function _createContainer() {
            var container = document.createElement('div');
            container.setAttribute('id', 'toast-container');

            // Add event handler
            container.addEventListener('touchstart', Toast._onDragStart);
            container.addEventListener('touchmove', Toast._onDragMove);
            container.addEventListener('touchend', Toast._onDragEnd);

            container.addEventListener('mousedown', Toast._onDragStart);
            document.addEventListener('mousemove', Toast._onDragMove);
            document.addEventListener('mouseup', Toast._onDragEnd);

            document.body.appendChild(container);
            Toast._container = container;
          }

          /**
           * Remove toast container and event handlers
           */

        }, {
          key: "_removeContainer",
          value: function _removeContainer() {
            // Add event handler
            document.removeEventListener('mousemove', Toast._onDragMove);
            document.removeEventListener('mouseup', Toast._onDragEnd);

            $(Toast._container).remove();
            Toast._container = null;
          }

          /**
           * Begin drag handler
           * @param {Event} e
           */

        }, {
          key: "_onDragStart",
          value: function _onDragStart(e) {
            if (e.target && $(e.target).closest('.toast').length) {
              var $toast = $(e.target).closest('.toast');
              var toast = $toast[0].M_Toast;
              toast.panning = true;
              Toast._draggedToast = toast;
              toast.el.classList.add('panning');
              toast.el.style.transition = '';
              toast.startingXPos = Toast._xPos(e);
              toast.time = Date.now();
              toast.xPos = Toast._xPos(e);
            }
          }

          /**
           * Drag move handler
           * @param {Event} e
           */

        }, {
          key: "_onDragMove",
          value: function _onDragMove(e) {
            if (!!Toast._draggedToast) {
              e.preventDefault();
              var toast = Toast._draggedToast;
              toast.deltaX = Math.abs(toast.xPos - Toast._xPos(e));
              toast.xPos = Toast._xPos(e);
              toast.velocityX = toast.deltaX / (Date.now() - toast.time);
              toast.time = Date.now();

              var totalDeltaX = toast.xPos - toast.startingXPos;
              var activationDistance = toast.el.offsetWidth * toast.options.activationPercent;
              toast.el.style.transform = "translateX(" + totalDeltaX + "px)";
              toast.el.style.opacity = 1 - Math.abs(totalDeltaX / activationDistance);
            }
          }

          /**
           * End drag handler
           */

        }, {
          key: "_onDragEnd",
          value: function _onDragEnd() {
            if (!!Toast._draggedToast) {
              var toast = Toast._draggedToast;
              toast.panning = false;
              toast.el.classList.remove('panning');

              var totalDeltaX = toast.xPos - toast.startingXPos;
              var activationDistance = toast.el.offsetWidth * toast.options.activationPercent;
              var shouldBeDismissed = Math.abs(totalDeltaX) > activationDistance || toast.velocityX > 1;

              // Remove toast
              if (shouldBeDismissed) {
                toast.wasSwiped = true;
                toast.dismiss();

                // Animate toast back to original position
              } else {
                toast.el.style.transition = 'transform .2s, opacity .2s';
                toast.el.style.transform = '';
                toast.el.style.opacity = '';
              }
              Toast._draggedToast = null;
            }
          }

          /**
           * Get x position of mouse or touch event
           * @param {Event} e
           */

        }, {
          key: "_xPos",
          value: function _xPos(e) {
            if (e.targetTouches && e.targetTouches.length >= 1) {
              return e.targetTouches[0].clientX;
            }
            // mouse event
            return e.clientX;
          }

          /**
           * Remove all toasts
           */

        }, {
          key: "dismissAll",
          value: function dismissAll() {
            for (var toastIndex in Toast._toasts) {
              Toast._toasts[toastIndex].dismiss();
            }
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Toast;
      }();

      /**
       * @static
       * @memberof Toast
       * @type {Array.<Toast>}
       */


      Toast._toasts = [];

      /**
       * @static
       * @memberof Toast
       */
      Toast._container = null;

      /**
       * @static
       * @memberof Toast
       * @type {Toast}
       */
      Toast._draggedToast = null;

      M.Toast = Toast;
      M.toast = function (options) {
        return new Toast(options);
      };
    })(cash, M.anime);
    (function ($, anim) {

      var _defaults = {
        edge: 'left',
        draggable: true,
        inDuration: 250,
        outDuration: 200,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        preventScrolling: true
      };

      /**
       * @class
       */

      var Sidenav = function (_Component8) {
        _inherits(Sidenav, _Component8);

        /**
         * Construct Sidenav instance and set up overlay
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Sidenav(el, options) {
          _classCallCheck(this, Sidenav);

          var _this31 = _possibleConstructorReturn(this, (Sidenav.__proto__ || Object.getPrototypeOf(Sidenav)).call(this, Sidenav, el, options));

          _this31.el.M_Sidenav = _this31;
          _this31.id = _this31.$el.attr('id');

          /**
           * Options for the Sidenav
           * @member Sidenav#options
           * @prop {String} [edge='left'] - Side of screen on which Sidenav appears
           * @prop {Boolean} [draggable=true] - Allow swipe gestures to open/close Sidenav
           * @prop {Number} [inDuration=250] - Length in ms of enter transition
           * @prop {Number} [outDuration=200] - Length in ms of exit transition
           * @prop {Function} onOpenStart - Function called when sidenav starts entering
           * @prop {Function} onOpenEnd - Function called when sidenav finishes entering
           * @prop {Function} onCloseStart - Function called when sidenav starts exiting
           * @prop {Function} onCloseEnd - Function called when sidenav finishes exiting
           */
          _this31.options = $.extend({}, Sidenav.defaults, options);

          /**
           * Describes open/close state of Sidenav
           * @type {Boolean}
           */
          _this31.isOpen = false;

          /**
           * Describes if Sidenav is fixed
           * @type {Boolean}
           */
          _this31.isFixed = _this31.el.classList.contains('sidenav-fixed');

          /**
           * Describes if Sidenav is being draggeed
           * @type {Boolean}
           */
          _this31.isDragged = false;

          // Window size variables for window resize checks
          _this31.lastWindowWidth = window.innerWidth;
          _this31.lastWindowHeight = window.innerHeight;

          _this31._createOverlay();
          _this31._createDragTarget();
          _this31._setupEventHandlers();
          _this31._setupClasses();
          _this31._setupFixed();

          Sidenav._sidenavs.push(_this31);
          return _this31;
        }

        _createClass(Sidenav, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this._enableBodyScrolling();
            this._overlay.parentNode.removeChild(this._overlay);
            this.dragTarget.parentNode.removeChild(this.dragTarget);
            this.el.M_Sidenav = undefined;
            this.el.style.transform = '';

            var index = Sidenav._sidenavs.indexOf(this);
            if (index >= 0) {
              Sidenav._sidenavs.splice(index, 1);
            }
          }
        }, {
          key: "_createOverlay",
          value: function _createOverlay() {
            var overlay = document.createElement('div');
            this._closeBound = this.close.bind(this);
            overlay.classList.add('sidenav-overlay');

            overlay.addEventListener('click', this._closeBound);

            document.body.appendChild(overlay);
            this._overlay = overlay;
          }
        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            if (Sidenav._sidenavs.length === 0) {
              document.body.addEventListener('click', this._handleTriggerClick);
            }

            this._handleDragTargetDragBound = this._handleDragTargetDrag.bind(this);
            this._handleDragTargetReleaseBound = this._handleDragTargetRelease.bind(this);
            this._handleCloseDragBound = this._handleCloseDrag.bind(this);
            this._handleCloseReleaseBound = this._handleCloseRelease.bind(this);
            this._handleCloseTriggerClickBound = this._handleCloseTriggerClick.bind(this);

            this.dragTarget.addEventListener('touchmove', this._handleDragTargetDragBound);
            this.dragTarget.addEventListener('touchend', this._handleDragTargetReleaseBound);
            this._overlay.addEventListener('touchmove', this._handleCloseDragBound);
            this._overlay.addEventListener('touchend', this._handleCloseReleaseBound);
            this.el.addEventListener('touchmove', this._handleCloseDragBound);
            this.el.addEventListener('touchend', this._handleCloseReleaseBound);
            this.el.addEventListener('click', this._handleCloseTriggerClickBound);

            // Add resize for side nav fixed
            if (this.isFixed) {
              this._handleWindowResizeBound = this._handleWindowResize.bind(this);
              window.addEventListener('resize', this._handleWindowResizeBound);
            }
          }
        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            if (Sidenav._sidenavs.length === 1) {
              document.body.removeEventListener('click', this._handleTriggerClick);
            }

            this.dragTarget.removeEventListener('touchmove', this._handleDragTargetDragBound);
            this.dragTarget.removeEventListener('touchend', this._handleDragTargetReleaseBound);
            this._overlay.removeEventListener('touchmove', this._handleCloseDragBound);
            this._overlay.removeEventListener('touchend', this._handleCloseReleaseBound);
            this.el.removeEventListener('touchmove', this._handleCloseDragBound);
            this.el.removeEventListener('touchend', this._handleCloseReleaseBound);
            this.el.removeEventListener('click', this._handleCloseTriggerClickBound);

            // Remove resize for side nav fixed
            if (this.isFixed) {
              window.removeEventListener('resize', this._handleWindowResizeBound);
            }
          }

          /**
           * Handle Trigger Click
           * @param {Event} e
           */

        }, {
          key: "_handleTriggerClick",
          value: function _handleTriggerClick(e) {
            var $trigger = $(e.target).closest('.sidenav-trigger');
            if (e.target && $trigger.length) {
              var sidenavId = M.getIdFromTrigger($trigger[0]);

              var sidenavInstance = document.getElementById(sidenavId).M_Sidenav;
              if (sidenavInstance) {
                sidenavInstance.open($trigger);
              }
              e.preventDefault();
            }
          }

          /**
           * Set variables needed at the beggining of drag
           * and stop any current transition.
           * @param {Event} e
           */

        }, {
          key: "_startDrag",
          value: function _startDrag(e) {
            var clientX = e.targetTouches[0].clientX;
            this.isDragged = true;
            this._startingXpos = clientX;
            this._xPos = this._startingXpos;
            this._time = Date.now();
            this._width = this.el.getBoundingClientRect().width;
            this._overlay.style.display = 'block';
            this._initialScrollTop = this.isOpen ? this.el.scrollTop : M.getDocumentScrollTop();
            this._verticallyScrolling = false;
            anim.remove(this.el);
            anim.remove(this._overlay);
          }

          /**
           * Set variables needed at each drag move update tick
           * @param {Event} e
           */

        }, {
          key: "_dragMoveUpdate",
          value: function _dragMoveUpdate(e) {
            var clientX = e.targetTouches[0].clientX;
            var currentScrollTop = this.isOpen ? this.el.scrollTop : M.getDocumentScrollTop();
            this.deltaX = Math.abs(this._xPos - clientX);
            this._xPos = clientX;
            this.velocityX = this.deltaX / (Date.now() - this._time);
            this._time = Date.now();
            if (this._initialScrollTop !== currentScrollTop) {
              this._verticallyScrolling = true;
            }
          }

          /**
           * Handles Dragging of Sidenav
           * @param {Event} e
           */

        }, {
          key: "_handleDragTargetDrag",
          value: function _handleDragTargetDrag(e) {
            // Check if draggable
            if (!this.options.draggable || this._isCurrentlyFixed() || this._verticallyScrolling) {
              return;
            }

            // If not being dragged, set initial drag start variables
            if (!this.isDragged) {
              this._startDrag(e);
            }

            // Run touchmove updates
            this._dragMoveUpdate(e);

            // Calculate raw deltaX
            var totalDeltaX = this._xPos - this._startingXpos;

            // dragDirection is the attempted user drag direction
            var dragDirection = totalDeltaX > 0 ? 'right' : 'left';

            // Don't allow totalDeltaX to exceed Sidenav width or be dragged in the opposite direction
            totalDeltaX = Math.min(this._width, Math.abs(totalDeltaX));
            if (this.options.edge === dragDirection) {
              totalDeltaX = 0;
            }

            /**
             * transformX is the drag displacement
             * transformPrefix is the initial transform placement
             * Invert values if Sidenav is right edge
             */
            var transformX = totalDeltaX;
            var transformPrefix = 'translateX(-100%)';
            if (this.options.edge === 'right') {
              transformPrefix = 'translateX(100%)';
              transformX = -transformX;
            }

            // Calculate open/close percentage of sidenav, with open = 1 and close = 0
            this.percentOpen = Math.min(1, totalDeltaX / this._width);

            // Set transform and opacity styles
            this.el.style.transform = transformPrefix + " translateX(" + transformX + "px)";
            this._overlay.style.opacity = this.percentOpen;
          }

          /**
           * Handle Drag Target Release
           */

        }, {
          key: "_handleDragTargetRelease",
          value: function _handleDragTargetRelease() {
            if (this.isDragged) {
              if (this.percentOpen > 0.2) {
                this.open();
              } else {
                this._animateOut();
              }

              this.isDragged = false;
              this._verticallyScrolling = false;
            }
          }

          /**
           * Handle Close Drag
           * @param {Event} e
           */

        }, {
          key: "_handleCloseDrag",
          value: function _handleCloseDrag(e) {
            if (this.isOpen) {
              // Check if draggable
              if (!this.options.draggable || this._isCurrentlyFixed() || this._verticallyScrolling) {
                return;
              }

              // If not being dragged, set initial drag start variables
              if (!this.isDragged) {
                this._startDrag(e);
              }

              // Run touchmove updates
              this._dragMoveUpdate(e);

              // Calculate raw deltaX
              var totalDeltaX = this._xPos - this._startingXpos;

              // dragDirection is the attempted user drag direction
              var dragDirection = totalDeltaX > 0 ? 'right' : 'left';

              // Don't allow totalDeltaX to exceed Sidenav width or be dragged in the opposite direction
              totalDeltaX = Math.min(this._width, Math.abs(totalDeltaX));
              if (this.options.edge !== dragDirection) {
                totalDeltaX = 0;
              }

              var transformX = -totalDeltaX;
              if (this.options.edge === 'right') {
                transformX = -transformX;
              }

              // Calculate open/close percentage of sidenav, with open = 1 and close = 0
              this.percentOpen = Math.min(1, 1 - totalDeltaX / this._width);

              // Set transform and opacity styles
              this.el.style.transform = "translateX(" + transformX + "px)";
              this._overlay.style.opacity = this.percentOpen;
            }
          }

          /**
           * Handle Close Release
           */

        }, {
          key: "_handleCloseRelease",
          value: function _handleCloseRelease() {
            if (this.isOpen && this.isDragged) {
              if (this.percentOpen > 0.8) {
                this._animateIn();
              } else {
                this.close();
              }

              this.isDragged = false;
              this._verticallyScrolling = false;
            }
          }

          /**
           * Handles closing of Sidenav when element with class .sidenav-close
           */

        }, {
          key: "_handleCloseTriggerClick",
          value: function _handleCloseTriggerClick(e) {
            var $closeTrigger = $(e.target).closest('.sidenav-close');
            if ($closeTrigger.length && !this._isCurrentlyFixed()) {
              this.close();
            }
          }

          /**
           * Handle Window Resize
           */

        }, {
          key: "_handleWindowResize",
          value: function _handleWindowResize() {
            // Only handle horizontal resizes
            if (this.lastWindowWidth !== window.innerWidth) {
              if (window.innerWidth > 992) {
                this.open();
              } else {
                this.close();
              }
            }

            this.lastWindowWidth = window.innerWidth;
            this.lastWindowHeight = window.innerHeight;
          }
        }, {
          key: "_setupClasses",
          value: function _setupClasses() {
            if (this.options.edge === 'right') {
              this.el.classList.add('right-aligned');
              this.dragTarget.classList.add('right-aligned');
            }
          }
        }, {
          key: "_removeClasses",
          value: function _removeClasses() {
            this.el.classList.remove('right-aligned');
            this.dragTarget.classList.remove('right-aligned');
          }
        }, {
          key: "_setupFixed",
          value: function _setupFixed() {
            if (this._isCurrentlyFixed()) {
              this.open();
            }
          }
        }, {
          key: "_isCurrentlyFixed",
          value: function _isCurrentlyFixed() {
            return this.isFixed && window.innerWidth > 992;
          }
        }, {
          key: "_createDragTarget",
          value: function _createDragTarget() {
            var dragTarget = document.createElement('div');
            dragTarget.classList.add('drag-target');
            document.body.appendChild(dragTarget);
            this.dragTarget = dragTarget;
          }
        }, {
          key: "_preventBodyScrolling",
          value: function _preventBodyScrolling() {
            var body = document.body;
            body.style.overflow = 'hidden';
          }
        }, {
          key: "_enableBodyScrolling",
          value: function _enableBodyScrolling() {
            var body = document.body;
            body.style.overflow = '';
          }
        }, {
          key: "open",
          value: function open() {
            if (this.isOpen === true) {
              return;
            }

            this.isOpen = true;

            // Run onOpenStart callback
            if (typeof this.options.onOpenStart === 'function') {
              this.options.onOpenStart.call(this, this.el);
            }

            // Handle fixed Sidenav
            if (this._isCurrentlyFixed()) {
              anim.remove(this.el);
              anim({
                targets: this.el,
                translateX: 0,
                duration: 0,
                easing: 'easeOutQuad'
              });
              this._enableBodyScrolling();
              this._overlay.style.display = 'none';

              // Handle non-fixed Sidenav
            } else {
              if (this.options.preventScrolling) {
                this._preventBodyScrolling();
              }

              if (!this.isDragged || this.percentOpen != 1) {
                this._animateIn();
              }
            }
          }
        }, {
          key: "close",
          value: function close() {
            if (this.isOpen === false) {
              return;
            }

            this.isOpen = false;

            // Run onCloseStart callback
            if (typeof this.options.onCloseStart === 'function') {
              this.options.onCloseStart.call(this, this.el);
            }

            // Handle fixed Sidenav
            if (this._isCurrentlyFixed()) {
              var transformX = this.options.edge === 'left' ? '-105%' : '105%';
              this.el.style.transform = "translateX(" + transformX + ")";

              // Handle non-fixed Sidenav
            } else {
              this._enableBodyScrolling();

              if (!this.isDragged || this.percentOpen != 0) {
                this._animateOut();
              } else {
                this._overlay.style.display = 'none';
              }
            }
          }
        }, {
          key: "_animateIn",
          value: function _animateIn() {
            this._animateSidenavIn();
            this._animateOverlayIn();
          }
        }, {
          key: "_animateSidenavIn",
          value: function _animateSidenavIn() {
            var _this32 = this;

            var slideOutPercent = this.options.edge === 'left' ? -1 : 1;
            if (this.isDragged) {
              slideOutPercent = this.options.edge === 'left' ? slideOutPercent + this.percentOpen : slideOutPercent - this.percentOpen;
            }

            anim.remove(this.el);
            anim({
              targets: this.el,
              translateX: [slideOutPercent * 100 + "%", 0],
              duration: this.options.inDuration,
              easing: 'easeOutQuad',
              complete: function () {
                // Run onOpenEnd callback
                if (typeof _this32.options.onOpenEnd === 'function') {
                  _this32.options.onOpenEnd.call(_this32, _this32.el);
                }
              }
            });
          }
        }, {
          key: "_animateOverlayIn",
          value: function _animateOverlayIn() {
            var start = 0;
            if (this.isDragged) {
              start = this.percentOpen;
            } else {
              $(this._overlay).css({
                display: 'block'
              });
            }

            anim.remove(this._overlay);
            anim({
              targets: this._overlay,
              opacity: [start, 1],
              duration: this.options.inDuration,
              easing: 'easeOutQuad'
            });
          }
        }, {
          key: "_animateOut",
          value: function _animateOut() {
            this._animateSidenavOut();
            this._animateOverlayOut();
          }
        }, {
          key: "_animateSidenavOut",
          value: function _animateSidenavOut() {
            var _this33 = this;

            var endPercent = this.options.edge === 'left' ? -1 : 1;
            var slideOutPercent = 0;
            if (this.isDragged) {
              slideOutPercent = this.options.edge === 'left' ? endPercent + this.percentOpen : endPercent - this.percentOpen;
            }

            anim.remove(this.el);
            anim({
              targets: this.el,
              translateX: [slideOutPercent * 100 + "%", endPercent * 105 + "%"],
              duration: this.options.outDuration,
              easing: 'easeOutQuad',
              complete: function () {
                // Run onOpenEnd callback
                if (typeof _this33.options.onCloseEnd === 'function') {
                  _this33.options.onCloseEnd.call(_this33, _this33.el);
                }
              }
            });
          }
        }, {
          key: "_animateOverlayOut",
          value: function _animateOverlayOut() {
            var _this34 = this;

            anim.remove(this._overlay);
            anim({
              targets: this._overlay,
              opacity: 0,
              duration: this.options.outDuration,
              easing: 'easeOutQuad',
              complete: function () {
                $(_this34._overlay).css('display', 'none');
              }
            });
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Sidenav.__proto__ || Object.getPrototypeOf(Sidenav), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Sidenav;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Sidenav;
      }(Component);

      /**
       * @static
       * @memberof Sidenav
       * @type {Array.<Sidenav>}
       */


      Sidenav._sidenavs = [];

      M.Sidenav = Sidenav;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Sidenav, 'sidenav', 'M_Sidenav');
      }
    })(cash, M.anime);
    (function ($, anim) {

      var _defaults = {
        throttle: 100,
        scrollOffset: 200, // offset - 200 allows elements near bottom of page to scroll
        activeClass: 'active',
        getActiveElement: function (id) {
          return 'a[href="#' + id + '"]';
        }
      };

      /**
       * @class
       *
       */

      var ScrollSpy = function (_Component9) {
        _inherits(ScrollSpy, _Component9);

        /**
         * Construct ScrollSpy instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function ScrollSpy(el, options) {
          _classCallCheck(this, ScrollSpy);

          var _this35 = _possibleConstructorReturn(this, (ScrollSpy.__proto__ || Object.getPrototypeOf(ScrollSpy)).call(this, ScrollSpy, el, options));

          _this35.el.M_ScrollSpy = _this35;

          /**
           * Options for the modal
           * @member Modal#options
           * @prop {Number} [throttle=100] - Throttle of scroll handler
           * @prop {Number} [scrollOffset=200] - Offset for centering element when scrolled to
           * @prop {String} [activeClass='active'] - Class applied to active elements
           * @prop {Function} [getActiveElement] - Used to find active element
           */
          _this35.options = $.extend({}, ScrollSpy.defaults, options);

          // setup
          ScrollSpy._elements.push(_this35);
          ScrollSpy._count++;
          ScrollSpy._increment++;
          _this35.tickId = -1;
          _this35.id = ScrollSpy._increment;
          _this35._setupEventHandlers();
          _this35._handleWindowScroll();
          return _this35;
        }

        _createClass(ScrollSpy, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            ScrollSpy._elements.splice(ScrollSpy._elements.indexOf(this), 1);
            ScrollSpy._elementsInView.splice(ScrollSpy._elementsInView.indexOf(this), 1);
            ScrollSpy._visibleElements.splice(ScrollSpy._visibleElements.indexOf(this.$el), 1);
            ScrollSpy._count--;
            this._removeEventHandlers();
            $(this.options.getActiveElement(this.$el.attr('id'))).removeClass(this.options.activeClass);
            this.el.M_ScrollSpy = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            var throttledResize = M.throttle(this._handleWindowScroll, 200);
            this._handleThrottledResizeBound = throttledResize.bind(this);
            this._handleWindowScrollBound = this._handleWindowScroll.bind(this);
            if (ScrollSpy._count === 1) {
              window.addEventListener('scroll', this._handleWindowScrollBound);
              window.addEventListener('resize', this._handleThrottledResizeBound);
              document.body.addEventListener('click', this._handleTriggerClick);
            }
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            if (ScrollSpy._count === 0) {
              window.removeEventListener('scroll', this._handleWindowScrollBound);
              window.removeEventListener('resize', this._handleThrottledResizeBound);
              document.body.removeEventListener('click', this._handleTriggerClick);
            }
          }

          /**
           * Handle Trigger Click
           * @param {Event} e
           */

        }, {
          key: "_handleTriggerClick",
          value: function _handleTriggerClick(e) {
            var $trigger = $(e.target);
            for (var i = ScrollSpy._elements.length - 1; i >= 0; i--) {
              var scrollspy = ScrollSpy._elements[i];
              if ($trigger.is('a[href="#' + scrollspy.$el.attr('id') + '"]')) {
                e.preventDefault();
                var offset = scrollspy.$el.offset().top + 1;

                anim({
                  targets: [document.documentElement, document.body],
                  scrollTop: offset - scrollspy.options.scrollOffset,
                  duration: 400,
                  easing: 'easeOutCubic'
                });
                break;
              }
            }
          }

          /**
           * Handle Window Scroll
           */

        }, {
          key: "_handleWindowScroll",
          value: function _handleWindowScroll() {
            // unique tick id
            ScrollSpy._ticks++;

            // viewport rectangle
            var top = M.getDocumentScrollTop(),
                left = M.getDocumentScrollLeft(),
                right = left + window.innerWidth,
                bottom = top + window.innerHeight;

            // determine which elements are in view
            var intersections = ScrollSpy._findElements(top, right, bottom, left);
            for (var i = 0; i < intersections.length; i++) {
              var scrollspy = intersections[i];
              var lastTick = scrollspy.tickId;
              if (lastTick < 0) {
                // entered into view
                scrollspy._enter();
              }

              // update tick id
              scrollspy.tickId = ScrollSpy._ticks;
            }

            for (var _i = 0; _i < ScrollSpy._elementsInView.length; _i++) {
              var _scrollspy = ScrollSpy._elementsInView[_i];
              var _lastTick = _scrollspy.tickId;
              if (_lastTick >= 0 && _lastTick !== ScrollSpy._ticks) {
                // exited from view
                _scrollspy._exit();
                _scrollspy.tickId = -1;
              }
            }

            // remember elements in view for next tick
            ScrollSpy._elementsInView = intersections;
          }

          /**
           * Find elements that are within the boundary
           * @param {number} top
           * @param {number} right
           * @param {number} bottom
           * @param {number} left
           * @return {Array.<ScrollSpy>}   A collection of elements
           */

        }, {
          key: "_enter",
          value: function _enter() {
            ScrollSpy._visibleElements = ScrollSpy._visibleElements.filter(function (value) {
              return value.height() != 0;
            });

            if (ScrollSpy._visibleElements[0]) {
              $(this.options.getActiveElement(ScrollSpy._visibleElements[0].attr('id'))).removeClass(this.options.activeClass);
              if (ScrollSpy._visibleElements[0][0].M_ScrollSpy && this.id < ScrollSpy._visibleElements[0][0].M_ScrollSpy.id) {
                ScrollSpy._visibleElements.unshift(this.$el);
              } else {
                ScrollSpy._visibleElements.push(this.$el);
              }
            } else {
              ScrollSpy._visibleElements.push(this.$el);
            }

            $(this.options.getActiveElement(ScrollSpy._visibleElements[0].attr('id'))).addClass(this.options.activeClass);
          }
        }, {
          key: "_exit",
          value: function _exit() {
            var _this36 = this;

            ScrollSpy._visibleElements = ScrollSpy._visibleElements.filter(function (value) {
              return value.height() != 0;
            });

            if (ScrollSpy._visibleElements[0]) {
              $(this.options.getActiveElement(ScrollSpy._visibleElements[0].attr('id'))).removeClass(this.options.activeClass);

              ScrollSpy._visibleElements = ScrollSpy._visibleElements.filter(function (el) {
                return el.attr('id') != _this36.$el.attr('id');
              });
              if (ScrollSpy._visibleElements[0]) {
                // Check if empty
                $(this.options.getActiveElement(ScrollSpy._visibleElements[0].attr('id'))).addClass(this.options.activeClass);
              }
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(ScrollSpy.__proto__ || Object.getPrototypeOf(ScrollSpy), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_ScrollSpy;
          }
        }, {
          key: "_findElements",
          value: function _findElements(top, right, bottom, left) {
            var hits = [];
            for (var i = 0; i < ScrollSpy._elements.length; i++) {
              var scrollspy = ScrollSpy._elements[i];
              var currTop = top + scrollspy.options.scrollOffset || 200;

              if (scrollspy.$el.height() > 0) {
                var elTop = scrollspy.$el.offset().top,
                    elLeft = scrollspy.$el.offset().left,
                    elRight = elLeft + scrollspy.$el.width(),
                    elBottom = elTop + scrollspy.$el.height();

                var isIntersect = !(elLeft > right || elRight < left || elTop > bottom || elBottom < currTop);

                if (isIntersect) {
                  hits.push(scrollspy);
                }
              }
            }
            return hits;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return ScrollSpy;
      }(Component);

      /**
       * @static
       * @memberof ScrollSpy
       * @type {Array.<ScrollSpy>}
       */


      ScrollSpy._elements = [];

      /**
       * @static
       * @memberof ScrollSpy
       * @type {Array.<ScrollSpy>}
       */
      ScrollSpy._elementsInView = [];

      /**
       * @static
       * @memberof ScrollSpy
       * @type {Array.<cash>}
       */
      ScrollSpy._visibleElements = [];

      /**
       * @static
       * @memberof ScrollSpy
       */
      ScrollSpy._count = 0;

      /**
       * @static
       * @memberof ScrollSpy
       */
      ScrollSpy._increment = 0;

      /**
       * @static
       * @memberof ScrollSpy
       */
      ScrollSpy._ticks = 0;

      M.ScrollSpy = ScrollSpy;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(ScrollSpy, 'scrollSpy', 'M_ScrollSpy');
      }
    })(cash, M.anime);
    (function ($) {

      var _defaults = {
        data: {}, // Autocomplete data set
        limit: Infinity, // Limit of results the autocomplete shows
        onAutocomplete: null, // Callback for when autocompleted
        minLength: 1, // Min characters before autocomplete starts
        sortFunction: function (a, b, inputString) {
          // Sort function for sorting autocomplete results
          return a.indexOf(inputString) - b.indexOf(inputString);
        }
      };

      /**
       * @class
       *
       */

      var Autocomplete = function (_Component10) {
        _inherits(Autocomplete, _Component10);

        /**
         * Construct Autocomplete instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Autocomplete(el, options) {
          _classCallCheck(this, Autocomplete);

          var _this37 = _possibleConstructorReturn(this, (Autocomplete.__proto__ || Object.getPrototypeOf(Autocomplete)).call(this, Autocomplete, el, options));

          _this37.el.M_Autocomplete = _this37;

          /**
           * Options for the autocomplete
           * @member Autocomplete#options
           * @prop {Number} duration
           * @prop {Number} dist
           * @prop {number} shift
           * @prop {number} padding
           * @prop {Boolean} fullWidth
           * @prop {Boolean} indicators
           * @prop {Boolean} noWrap
           * @prop {Function} onCycleTo
           */
          _this37.options = $.extend({}, Autocomplete.defaults, options);

          // Setup
          _this37.isOpen = false;
          _this37.count = 0;
          _this37.activeIndex = -1;
          _this37.oldVal;
          _this37.$inputField = _this37.$el.closest('.input-field');
          _this37.$active = $();
          _this37._mousedown = false;
          _this37._setupDropdown();

          _this37._setupEventHandlers();
          return _this37;
        }

        _createClass(Autocomplete, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this._removeDropdown();
            this.el.M_Autocomplete = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleInputBlurBound = this._handleInputBlur.bind(this);
            this._handleInputKeyupAndFocusBound = this._handleInputKeyupAndFocus.bind(this);
            this._handleInputKeydownBound = this._handleInputKeydown.bind(this);
            this._handleInputClickBound = this._handleInputClick.bind(this);
            this._handleContainerMousedownAndTouchstartBound = this._handleContainerMousedownAndTouchstart.bind(this);
            this._handleContainerMouseupAndTouchendBound = this._handleContainerMouseupAndTouchend.bind(this);

            this.el.addEventListener('blur', this._handleInputBlurBound);
            this.el.addEventListener('keyup', this._handleInputKeyupAndFocusBound);
            this.el.addEventListener('focus', this._handleInputKeyupAndFocusBound);
            this.el.addEventListener('keydown', this._handleInputKeydownBound);
            this.el.addEventListener('click', this._handleInputClickBound);
            this.container.addEventListener('mousedown', this._handleContainerMousedownAndTouchstartBound);
            this.container.addEventListener('mouseup', this._handleContainerMouseupAndTouchendBound);

            if (typeof window.ontouchstart !== 'undefined') {
              this.container.addEventListener('touchstart', this._handleContainerMousedownAndTouchstartBound);
              this.container.addEventListener('touchend', this._handleContainerMouseupAndTouchendBound);
            }
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('blur', this._handleInputBlurBound);
            this.el.removeEventListener('keyup', this._handleInputKeyupAndFocusBound);
            this.el.removeEventListener('focus', this._handleInputKeyupAndFocusBound);
            this.el.removeEventListener('keydown', this._handleInputKeydownBound);
            this.el.removeEventListener('click', this._handleInputClickBound);
            this.container.removeEventListener('mousedown', this._handleContainerMousedownAndTouchstartBound);
            this.container.removeEventListener('mouseup', this._handleContainerMouseupAndTouchendBound);

            if (typeof window.ontouchstart !== 'undefined') {
              this.container.removeEventListener('touchstart', this._handleContainerMousedownAndTouchstartBound);
              this.container.removeEventListener('touchend', this._handleContainerMouseupAndTouchendBound);
            }
          }

          /**
           * Setup dropdown
           */

        }, {
          key: "_setupDropdown",
          value: function _setupDropdown() {
            var _this38 = this;

            this.container = document.createElement('ul');
            this.container.id = "autocomplete-options-" + M.guid();
            $(this.container).addClass('autocomplete-content dropdown-content');
            this.$inputField.append(this.container);
            this.el.setAttribute('data-target', this.container.id);

            this.dropdown = M.Dropdown.init(this.el, {
              autoFocus: false,
              closeOnClick: false,
              coverTrigger: false,
              onItemClick: function (itemEl) {
                _this38.selectOption($(itemEl));
              }
            });

            // Sketchy removal of dropdown click handler
            this.el.removeEventListener('click', this.dropdown._handleClickBound);
          }

          /**
           * Remove dropdown
           */

        }, {
          key: "_removeDropdown",
          value: function _removeDropdown() {
            this.container.parentNode.removeChild(this.container);
          }

          /**
           * Handle Input Blur
           */

        }, {
          key: "_handleInputBlur",
          value: function _handleInputBlur() {
            if (!this._mousedown) {
              this.close();
              this._resetAutocomplete();
            }
          }

          /**
           * Handle Input Keyup and Focus
           * @param {Event} e
           */

        }, {
          key: "_handleInputKeyupAndFocus",
          value: function _handleInputKeyupAndFocus(e) {
            if (e.type === 'keyup') {
              Autocomplete._keydown = false;
            }

            this.count = 0;
            var val = this.el.value.toLowerCase();

            // Don't capture enter or arrow key usage.
            if (e.keyCode === 13 || e.keyCode === 38 || e.keyCode === 40) {
              return;
            }

            // Check if the input isn't empty
            // Check if focus triggered by tab
            if (this.oldVal !== val && (M.tabPressed || e.type !== 'focus')) {
              this.open();
            }

            // Update oldVal
            this.oldVal = val;
          }

          /**
           * Handle Input Keydown
           * @param {Event} e
           */

        }, {
          key: "_handleInputKeydown",
          value: function _handleInputKeydown(e) {
            Autocomplete._keydown = true;

            // Arrow keys and enter key usage
            var keyCode = e.keyCode,
                liElement = void 0,
                numItems = $(this.container).children('li').length;

            // select element on Enter
            if (keyCode === M.keys.ENTER && this.activeIndex >= 0) {
              liElement = $(this.container).children('li').eq(this.activeIndex);
              if (liElement.length) {
                this.selectOption(liElement);
                e.preventDefault();
              }
              return;
            }

            // Capture up and down key
            if (keyCode === M.keys.ARROW_UP || keyCode === M.keys.ARROW_DOWN) {
              e.preventDefault();

              if (keyCode === M.keys.ARROW_UP && this.activeIndex > 0) {
                this.activeIndex--;
              }

              if (keyCode === M.keys.ARROW_DOWN && this.activeIndex < numItems - 1) {
                this.activeIndex++;
              }

              this.$active.removeClass('active');
              if (this.activeIndex >= 0) {
                this.$active = $(this.container).children('li').eq(this.activeIndex);
                this.$active.addClass('active');
              }
            }
          }

          /**
           * Handle Input Click
           * @param {Event} e
           */

        }, {
          key: "_handleInputClick",
          value: function _handleInputClick(e) {
            this.open();
          }

          /**
           * Handle Container Mousedown and Touchstart
           * @param {Event} e
           */

        }, {
          key: "_handleContainerMousedownAndTouchstart",
          value: function _handleContainerMousedownAndTouchstart(e) {
            this._mousedown = true;
          }

          /**
           * Handle Container Mouseup and Touchend
           * @param {Event} e
           */

        }, {
          key: "_handleContainerMouseupAndTouchend",
          value: function _handleContainerMouseupAndTouchend(e) {
            this._mousedown = false;
          }

          /**
           * Highlight partial match
           */

        }, {
          key: "_highlight",
          value: function _highlight(string, $el) {
            var img = $el.find('img');
            var matchStart = $el.text().toLowerCase().indexOf('' + string.toLowerCase() + ''),
                matchEnd = matchStart + string.length - 1,
                beforeMatch = $el.text().slice(0, matchStart),
                matchText = $el.text().slice(matchStart, matchEnd + 1),
                afterMatch = $el.text().slice(matchEnd + 1);
            $el.html("<span>" + beforeMatch + "<span class='highlight'>" + matchText + "</span>" + afterMatch + "</span>");
            if (img.length) {
              $el.prepend(img);
            }
          }

          /**
           * Reset current element position
           */

        }, {
          key: "_resetCurrentElement",
          value: function _resetCurrentElement() {
            this.activeIndex = -1;
            this.$active.removeClass('active');
          }

          /**
           * Reset autocomplete elements
           */

        }, {
          key: "_resetAutocomplete",
          value: function _resetAutocomplete() {
            $(this.container).empty();
            this._resetCurrentElement();
            this.oldVal = null;
            this.isOpen = false;
            this._mousedown = false;
          }

          /**
           * Select autocomplete option
           * @param {Element} el  Autocomplete option list item element
           */

        }, {
          key: "selectOption",
          value: function selectOption(el) {
            var text = el.text().trim();
            this.el.value = text;
            this.$el.trigger('change');
            this._resetAutocomplete();
            this.close();

            // Handle onAutocomplete callback.
            if (typeof this.options.onAutocomplete === 'function') {
              this.options.onAutocomplete.call(this, text);
            }
          }

          /**
           * Render dropdown content
           * @param {Object} data  data set
           * @param {String} val  current input value
           */

        }, {
          key: "_renderDropdown",
          value: function _renderDropdown(data, val) {
            var _this39 = this;

            this._resetAutocomplete();

            var matchingData = [];

            // Gather all matching data
            for (var key in data) {
              if (data.hasOwnProperty(key) && key.toLowerCase().indexOf(val) !== -1) {
                // Break if past limit
                if (this.count >= this.options.limit) {
                  break;
                }

                var entry = {
                  data: data[key],
                  key: key
                };
                matchingData.push(entry);

                this.count++;
              }
            }

            // Sort
            if (this.options.sortFunction) {
              var sortFunctionBound = function (a, b) {
                return _this39.options.sortFunction(a.key.toLowerCase(), b.key.toLowerCase(), val.toLowerCase());
              };
              matchingData.sort(sortFunctionBound);
            }

            // Render
            for (var i = 0; i < matchingData.length; i++) {
              var _entry = matchingData[i];
              var $autocompleteOption = $('<li></li>');
              if (!!_entry.data) {
                $autocompleteOption.append("<img src=\"" + _entry.data + "\" class=\"right circle\"><span>" + _entry.key + "</span>");
              } else {
                $autocompleteOption.append('<span>' + _entry.key + '</span>');
              }

              $(this.container).append($autocompleteOption);
              this._highlight(val, $autocompleteOption);
            }
          }

          /**
           * Open Autocomplete Dropdown
           */

        }, {
          key: "open",
          value: function open() {
            var val = this.el.value.toLowerCase();

            this._resetAutocomplete();

            if (val.length >= this.options.minLength) {
              this.isOpen = true;
              this._renderDropdown(this.options.data, val);
            }

            // Open dropdown
            if (!this.dropdown.isOpen) {
              this.dropdown.open();
            } else {
              // Recalculate dropdown when its already open
              this.dropdown.recalculateDimensions();
            }
          }

          /**
           * Close Autocomplete Dropdown
           */

        }, {
          key: "close",
          value: function close() {
            this.dropdown.close();
          }

          /**
           * Update Data
           * @param {Object} data
           */

        }, {
          key: "updateData",
          value: function updateData(data) {
            var val = this.el.value.toLowerCase();
            this.options.data = data;

            if (this.isOpen) {
              this._renderDropdown(data, val);
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Autocomplete.__proto__ || Object.getPrototypeOf(Autocomplete), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Autocomplete;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Autocomplete;
      }(Component);

      /**
       * @static
       * @memberof Autocomplete
       */


      Autocomplete._keydown = false;

      M.Autocomplete = Autocomplete;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Autocomplete, 'autocomplete', 'M_Autocomplete');
      }
    })(cash);
    (function ($) {
      // Function to update labels of text fields
      M.updateTextFields = function () {
        var input_selector = 'input[type=text], input[type=password], input[type=email], input[type=url], input[type=tel], input[type=number], input[type=search], input[type=date], input[type=time], textarea';
        $(input_selector).each(function (element, index) {
          var $this = $(this);
          if (element.value.length > 0 || $(element).is(':focus') || element.autofocus || $this.attr('placeholder') !== null) {
            $this.siblings('label').addClass('active');
          } else if (element.validity) {
            $this.siblings('label').toggleClass('active', element.validity.badInput === true);
          } else {
            $this.siblings('label').removeClass('active');
          }
        });
      };

      M.validate_field = function (object) {
        var hasLength = object.attr('data-length') !== null;
        var lenAttr = parseInt(object.attr('data-length'));
        var len = object[0].value.length;

        if (len === 0 && object[0].validity.badInput === false && !object.is(':required')) {
          if (object.hasClass('validate')) {
            object.removeClass('valid');
            object.removeClass('invalid');
          }
        } else {
          if (object.hasClass('validate')) {
            // Check for character counter attributes
            if (object.is(':valid') && hasLength && len <= lenAttr || object.is(':valid') && !hasLength) {
              object.removeClass('invalid');
              object.addClass('valid');
            } else {
              object.removeClass('valid');
              object.addClass('invalid');
            }
          }
        }
      };

      M.textareaAutoResize = function ($textarea) {
        // Wrap if native element
        if ($textarea instanceof Element) {
          $textarea = $($textarea);
        }

        if (!$textarea.length) {
          console.error('No textarea element found');
          return;
        }

        // Textarea Auto Resize
        var hiddenDiv = $('.hiddendiv').first();
        if (!hiddenDiv.length) {
          hiddenDiv = $('<div class="hiddendiv common"></div>');
          $('body').append(hiddenDiv);
        }

        // Set font properties of hiddenDiv
        var fontFamily = $textarea.css('font-family');
        var fontSize = $textarea.css('font-size');
        var lineHeight = $textarea.css('line-height');

        // Firefox can't handle padding shorthand.
        var paddingTop = $textarea.css('padding-top');
        var paddingRight = $textarea.css('padding-right');
        var paddingBottom = $textarea.css('padding-bottom');
        var paddingLeft = $textarea.css('padding-left');

        if (fontSize) {
          hiddenDiv.css('font-size', fontSize);
        }
        if (fontFamily) {
          hiddenDiv.css('font-family', fontFamily);
        }
        if (lineHeight) {
          hiddenDiv.css('line-height', lineHeight);
        }
        if (paddingTop) {
          hiddenDiv.css('padding-top', paddingTop);
        }
        if (paddingRight) {
          hiddenDiv.css('padding-right', paddingRight);
        }
        if (paddingBottom) {
          hiddenDiv.css('padding-bottom', paddingBottom);
        }
        if (paddingLeft) {
          hiddenDiv.css('padding-left', paddingLeft);
        }

        // Set original-height, if none
        if (!$textarea.data('original-height')) {
          $textarea.data('original-height', $textarea.height());
        }

        if ($textarea.attr('wrap') === 'off') {
          hiddenDiv.css('overflow-wrap', 'normal').css('white-space', 'pre');
        }

        hiddenDiv.text($textarea[0].value + '\n');
        var content = hiddenDiv.html().replace(/\n/g, '<br>');
        hiddenDiv.html(content);

        // When textarea is hidden, width goes crazy.
        // Approximate with half of window size

        if ($textarea[0].offsetWidth > 0 && $textarea[0].offsetHeight > 0) {
          hiddenDiv.css('width', $textarea.width() + 'px');
        } else {
          hiddenDiv.css('width', window.innerWidth / 2 + 'px');
        }

        /**
         * Resize if the new height is greater than the
         * original height of the textarea
         */
        if ($textarea.data('original-height') <= hiddenDiv.innerHeight()) {
          $textarea.css('height', hiddenDiv.innerHeight() + 'px');
        } else if ($textarea[0].value.length < $textarea.data('previous-length')) {
          /**
           * In case the new height is less than original height, it
           * means the textarea has less text than before
           * So we set the height to the original one
           */
          $textarea.css('height', $textarea.data('original-height') + 'px');
        }
        $textarea.data('previous-length', $textarea[0].value.length);
      };

      $(document).ready(function () {
        // Text based inputs
        var input_selector = 'input[type=text], input[type=password], input[type=email], input[type=url], input[type=tel], input[type=number], input[type=search], input[type=date], input[type=time], textarea';

        // Add active if form auto complete
        $(document).on('change', input_selector, function () {
          if (this.value.length !== 0 || $(this).attr('placeholder') !== null) {
            $(this).siblings('label').addClass('active');
          }
          M.validate_field($(this));
        });

        // Add active if input element has been pre-populated on document ready
        $(document).ready(function () {
          M.updateTextFields();
        });

        // HTML DOM FORM RESET handling
        $(document).on('reset', function (e) {
          var formReset = $(e.target);
          if (formReset.is('form')) {
            formReset.find(input_selector).removeClass('valid').removeClass('invalid');
            formReset.find(input_selector).each(function (e) {
              if (this.value.length) {
                $(this).siblings('label').removeClass('active');
              }
            });

            // Reset select (after native reset)
            setTimeout(function () {
              formReset.find('select').each(function () {
                // check if initialized
                if (this.M_FormSelect) {
                  $(this).trigger('change');
                }
              });
            }, 0);
          }
        });

        /**
         * Add active when element has focus
         * @param {Event} e
         */
        document.addEventListener('focus', function (e) {
          if ($(e.target).is(input_selector)) {
            $(e.target).siblings('label, .prefix').addClass('active');
          }
        }, true);

        /**
         * Remove active when element is blurred
         * @param {Event} e
         */
        document.addEventListener('blur', function (e) {
          var $inputElement = $(e.target);
          if ($inputElement.is(input_selector)) {
            var selector = '.prefix';

            if ($inputElement[0].value.length === 0 && $inputElement[0].validity.badInput !== true && $inputElement.attr('placeholder') === null) {
              selector += ', label';
            }
            $inputElement.siblings(selector).removeClass('active');
            M.validate_field($inputElement);
          }
        }, true);

        // Radio and Checkbox focus class
        var radio_checkbox = 'input[type=radio], input[type=checkbox]';
        $(document).on('keyup', radio_checkbox, function (e) {
          // TAB, check if tabbing to radio or checkbox.
          if (e.which === M.keys.TAB) {
            $(this).addClass('tabbed');
            var $this = $(this);
            $this.one('blur', function (e) {
              $(this).removeClass('tabbed');
            });
            return;
          }
        });

        var text_area_selector = '.materialize-textarea';
        $(text_area_selector).each(function () {
          var $textarea = $(this);
          /**
           * Resize textarea on document load after storing
           * the original height and the original length
           */
          $textarea.data('original-height', $textarea.height());
          $textarea.data('previous-length', this.value.length);
          M.textareaAutoResize($textarea);
        });

        $(document).on('keyup', text_area_selector, function () {
          M.textareaAutoResize($(this));
        });
        $(document).on('keydown', text_area_selector, function () {
          M.textareaAutoResize($(this));
        });

        // File Input Path
        $(document).on('change', '.file-field input[type="file"]', function () {
          var file_field = $(this).closest('.file-field');
          var path_input = file_field.find('input.file-path');
          var files = $(this)[0].files;
          var file_names = [];
          for (var i = 0; i < files.length; i++) {
            file_names.push(files[i].name);
          }
          path_input[0].value = file_names.join(', ');
          path_input.trigger('change');
        });
      }); // End of $(document).ready
    })(cash);
    (function ($, anim) {

      var _defaults = {
        indicators: true,
        height: 400,
        duration: 500,
        interval: 6000
      };

      /**
       * @class
       *
       */

      var Slider = function (_Component11) {
        _inherits(Slider, _Component11);

        /**
         * Construct Slider instance and set up overlay
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Slider(el, options) {
          _classCallCheck(this, Slider);

          var _this40 = _possibleConstructorReturn(this, (Slider.__proto__ || Object.getPrototypeOf(Slider)).call(this, Slider, el, options));

          _this40.el.M_Slider = _this40;

          /**
           * Options for the modal
           * @member Slider#options
           * @prop {Boolean} [indicators=true] - Show indicators
           * @prop {Number} [height=400] - height of slider
           * @prop {Number} [duration=500] - Length in ms of slide transition
           * @prop {Number} [interval=6000] - Length in ms of slide interval
           */
          _this40.options = $.extend({}, Slider.defaults, options);

          // setup
          _this40.$slider = _this40.$el.find('.slides');
          _this40.$slides = _this40.$slider.children('li');
          _this40.activeIndex = _this40.$slides.filter(function (item) {
            return $(item).hasClass('active');
          }).first().index();
          if (_this40.activeIndex != -1) {
            _this40.$active = _this40.$slides.eq(_this40.activeIndex);
          }

          _this40._setSliderHeight();

          // Set initial positions of captions
          _this40.$slides.find('.caption').each(function (el) {
            _this40._animateCaptionIn(el, 0);
          });

          // Move img src into background-image
          _this40.$slides.find('img').each(function (el) {
            var placeholderBase64 = 'data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            if ($(el).attr('src') !== placeholderBase64) {
              $(el).css('background-image', 'url("' + $(el).attr('src') + '")');
              $(el).attr('src', placeholderBase64);
            }
          });

          _this40._setupIndicators();

          // Show active slide
          if (_this40.$active) {
            _this40.$active.css('display', 'block');
          } else {
            _this40.$slides.first().addClass('active');
            anim({
              targets: _this40.$slides.first()[0],
              opacity: 1,
              duration: _this40.options.duration,
              easing: 'easeOutQuad'
            });

            _this40.activeIndex = 0;
            _this40.$active = _this40.$slides.eq(_this40.activeIndex);

            // Update indicators
            if (_this40.options.indicators) {
              _this40.$indicators.eq(_this40.activeIndex).addClass('active');
            }
          }

          // Adjust height to current slide
          _this40.$active.find('img').each(function (el) {
            anim({
              targets: _this40.$active.find('.caption')[0],
              opacity: 1,
              translateX: 0,
              translateY: 0,
              duration: _this40.options.duration,
              easing: 'easeOutQuad'
            });
          });

          _this40._setupEventHandlers();

          // auto scroll
          _this40.start();
          return _this40;
        }

        _createClass(Slider, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this.pause();
            this._removeIndicators();
            this._removeEventHandlers();
            this.el.M_Slider = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            var _this41 = this;

            this._handleIntervalBound = this._handleInterval.bind(this);
            this._handleIndicatorClickBound = this._handleIndicatorClick.bind(this);

            if (this.options.indicators) {
              this.$indicators.each(function (el) {
                el.addEventListener('click', _this41._handleIndicatorClickBound);
              });
            }
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            var _this42 = this;

            if (this.options.indicators) {
              this.$indicators.each(function (el) {
                el.removeEventListener('click', _this42._handleIndicatorClickBound);
              });
            }
          }

          /**
           * Handle indicator click
           * @param {Event} e
           */

        }, {
          key: "_handleIndicatorClick",
          value: function _handleIndicatorClick(e) {
            var currIndex = $(e.target).index();
            this.set(currIndex);
          }

          /**
           * Handle Interval
           */

        }, {
          key: "_handleInterval",
          value: function _handleInterval() {
            var newActiveIndex = this.$slider.find('.active').index();
            if (this.$slides.length === newActiveIndex + 1) newActiveIndex = 0;
            // loop to start
            else newActiveIndex += 1;

            this.set(newActiveIndex);
          }

          /**
           * Animate in caption
           * @param {Element} caption
           * @param {Number} duration
           */

        }, {
          key: "_animateCaptionIn",
          value: function _animateCaptionIn(caption, duration) {
            var animOptions = {
              targets: caption,
              opacity: 0,
              duration: duration,
              easing: 'easeOutQuad'
            };

            if ($(caption).hasClass('center-align')) {
              animOptions.translateY = -100;
            } else if ($(caption).hasClass('right-align')) {
              animOptions.translateX = 100;
            } else if ($(caption).hasClass('left-align')) {
              animOptions.translateX = -100;
            }

            anim(animOptions);
          }

          /**
           * Set height of slider
           */

        }, {
          key: "_setSliderHeight",
          value: function _setSliderHeight() {
            // If fullscreen, do nothing
            if (!this.$el.hasClass('fullscreen')) {
              if (this.options.indicators) {
                // Add height if indicators are present
                this.$el.css('height', this.options.height + 40 + 'px');
              } else {
                this.$el.css('height', this.options.height + 'px');
              }
              this.$slider.css('height', this.options.height + 'px');
            }
          }

          /**
           * Setup indicators
           */

        }, {
          key: "_setupIndicators",
          value: function _setupIndicators() {
            var _this43 = this;

            if (this.options.indicators) {
              this.$indicators = $('<ul class="indicators"></ul>');
              this.$slides.each(function (el, index) {
                var $indicator = $('<li class="indicator-item"></li>');
                _this43.$indicators.append($indicator[0]);
              });
              this.$el.append(this.$indicators[0]);
              this.$indicators = this.$indicators.children('li.indicator-item');
            }
          }

          /**
           * Remove indicators
           */

        }, {
          key: "_removeIndicators",
          value: function _removeIndicators() {
            this.$el.find('ul.indicators').remove();
          }

          /**
           * Cycle to nth item
           * @param {Number} index
           */

        }, {
          key: "set",
          value: function set(index) {
            var _this44 = this;

            // Wrap around indices.
            if (index >= this.$slides.length) index = 0;else if (index < 0) index = this.$slides.length - 1;

            // Only do if index changes
            if (this.activeIndex != index) {
              this.$active = this.$slides.eq(this.activeIndex);
              var $caption = this.$active.find('.caption');
              this.$active.removeClass('active');

              anim({
                targets: this.$active[0],
                opacity: 0,
                duration: this.options.duration,
                easing: 'easeOutQuad',
                complete: function () {
                  _this44.$slides.not('.active').each(function (el) {
                    anim({
                      targets: el,
                      opacity: 0,
                      translateX: 0,
                      translateY: 0,
                      duration: 0,
                      easing: 'easeOutQuad'
                    });
                  });
                }
              });

              this._animateCaptionIn($caption[0], this.options.duration);

              // Update indicators
              if (this.options.indicators) {
                this.$indicators.eq(this.activeIndex).removeClass('active');
                this.$indicators.eq(index).addClass('active');
              }

              anim({
                targets: this.$slides.eq(index)[0],
                opacity: 1,
                duration: this.options.duration,
                easing: 'easeOutQuad'
              });

              anim({
                targets: this.$slides.eq(index).find('.caption')[0],
                opacity: 1,
                translateX: 0,
                translateY: 0,
                duration: this.options.duration,
                delay: this.options.duration,
                easing: 'easeOutQuad'
              });

              this.$slides.eq(index).addClass('active');
              this.activeIndex = index;

              // Reset interval
              this.start();
            }
          }

          /**
           * Pause slider interval
           */

        }, {
          key: "pause",
          value: function pause() {
            clearInterval(this.interval);
          }

          /**
           * Start slider interval
           */

        }, {
          key: "start",
          value: function start() {
            clearInterval(this.interval);
            this.interval = setInterval(this._handleIntervalBound, this.options.duration + this.options.interval);
          }

          /**
           * Move to next slide
           */

        }, {
          key: "next",
          value: function next() {
            var newIndex = this.activeIndex + 1;

            // Wrap around indices.
            if (newIndex >= this.$slides.length) newIndex = 0;else if (newIndex < 0) newIndex = this.$slides.length - 1;

            this.set(newIndex);
          }

          /**
           * Move to previous slide
           */

        }, {
          key: "prev",
          value: function prev() {
            var newIndex = this.activeIndex - 1;

            // Wrap around indices.
            if (newIndex >= this.$slides.length) newIndex = 0;else if (newIndex < 0) newIndex = this.$slides.length - 1;

            this.set(newIndex);
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Slider.__proto__ || Object.getPrototypeOf(Slider), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Slider;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Slider;
      }(Component);

      M.Slider = Slider;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Slider, 'slider', 'M_Slider');
      }
    })(cash, M.anime);
    (function ($, anim) {
      $(document).on('click', '.card', function (e) {
        if ($(this).children('.card-reveal').length) {
          var $card = $(e.target).closest('.card');
          if ($card.data('initialOverflow') === undefined) {
            $card.data('initialOverflow', $card.css('overflow') === undefined ? '' : $card.css('overflow'));
          }
          var $cardReveal = $(this).find('.card-reveal');
          if ($(e.target).is($('.card-reveal .card-title')) || $(e.target).is($('.card-reveal .card-title i'))) {
            // Make Reveal animate down and display none
            anim({
              targets: $cardReveal[0],
              translateY: 0,
              duration: 225,
              easing: 'easeInOutQuad',
              complete: function (anim) {
                var el = anim.animatables[0].target;
                $(el).css({ display: 'none' });
                $card.css('overflow', $card.data('initialOverflow'));
              }
            });
          } else if ($(e.target).is($('.card .activator')) || $(e.target).is($('.card .activator i'))) {
            $card.css('overflow', 'hidden');
            $cardReveal.css({ display: 'block' });
            anim({
              targets: $cardReveal[0],
              translateY: '-100%',
              duration: 300,
              easing: 'easeInOutQuad'
            });
          }
        }
      });
    })(cash, M.anime);
    (function ($) {

      var _defaults = {
        data: [],
        placeholder: '',
        secondaryPlaceholder: '',
        autocompleteOptions: {},
        limit: Infinity,
        onChipAdd: null,
        onChipSelect: null,
        onChipDelete: null
      };

      /**
       * @typedef {Object} chip
       * @property {String} tag  chip tag string
       * @property {String} [image]  chip avatar image string
       */

      /**
       * @class
       *
       */

      var Chips = function (_Component12) {
        _inherits(Chips, _Component12);

        /**
         * Construct Chips instance and set up overlay
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Chips(el, options) {
          _classCallCheck(this, Chips);

          var _this45 = _possibleConstructorReturn(this, (Chips.__proto__ || Object.getPrototypeOf(Chips)).call(this, Chips, el, options));

          _this45.el.M_Chips = _this45;

          /**
           * Options for the modal
           * @member Chips#options
           * @prop {Array} data
           * @prop {String} placeholder
           * @prop {String} secondaryPlaceholder
           * @prop {Object} autocompleteOptions
           */
          _this45.options = $.extend({}, Chips.defaults, options);

          _this45.$el.addClass('chips input-field');
          _this45.chipsData = [];
          _this45.$chips = $();
          _this45._setupInput();
          _this45.hasAutocomplete = Object.keys(_this45.options.autocompleteOptions).length > 0;

          // Set input id
          if (!_this45.$input.attr('id')) {
            _this45.$input.attr('id', M.guid());
          }

          // Render initial chips
          if (_this45.options.data.length) {
            _this45.chipsData = _this45.options.data;
            _this45._renderChips(_this45.chipsData);
          }

          // Setup autocomplete if needed
          if (_this45.hasAutocomplete) {
            _this45._setupAutocomplete();
          }

          _this45._setPlaceholder();
          _this45._setupLabel();
          _this45._setupEventHandlers();
          return _this45;
        }

        _createClass(Chips, [{
          key: "getData",


          /**
           * Get Chips Data
           */
          value: function getData() {
            return this.chipsData;
          }

          /**
           * Teardown component
           */

        }, {
          key: "destroy",
          value: function destroy() {
            this._removeEventHandlers();
            this.$chips.remove();
            this.el.M_Chips = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleChipClickBound = this._handleChipClick.bind(this);
            this._handleInputKeydownBound = this._handleInputKeydown.bind(this);
            this._handleInputFocusBound = this._handleInputFocus.bind(this);
            this._handleInputBlurBound = this._handleInputBlur.bind(this);

            this.el.addEventListener('click', this._handleChipClickBound);
            document.addEventListener('keydown', Chips._handleChipsKeydown);
            document.addEventListener('keyup', Chips._handleChipsKeyup);
            this.el.addEventListener('blur', Chips._handleChipsBlur, true);
            this.$input[0].addEventListener('focus', this._handleInputFocusBound);
            this.$input[0].addEventListener('blur', this._handleInputBlurBound);
            this.$input[0].addEventListener('keydown', this._handleInputKeydownBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('click', this._handleChipClickBound);
            document.removeEventListener('keydown', Chips._handleChipsKeydown);
            document.removeEventListener('keyup', Chips._handleChipsKeyup);
            this.el.removeEventListener('blur', Chips._handleChipsBlur, true);
            this.$input[0].removeEventListener('focus', this._handleInputFocusBound);
            this.$input[0].removeEventListener('blur', this._handleInputBlurBound);
            this.$input[0].removeEventListener('keydown', this._handleInputKeydownBound);
          }

          /**
           * Handle Chip Click
           * @param {Event} e
           */

        }, {
          key: "_handleChipClick",
          value: function _handleChipClick(e) {
            var $chip = $(e.target).closest('.chip');
            var clickedClose = $(e.target).is('.close');
            if ($chip.length) {
              var index = $chip.index();
              if (clickedClose) {
                // delete chip
                this.deleteChip(index);
                this.$input[0].focus();
              } else {
                // select chip
                this.selectChip(index);
              }

              // Default handle click to focus on input
            } else {
              this.$input[0].focus();
            }
          }

          /**
           * Handle Chips Keydown
           * @param {Event} e
           */

        }, {
          key: "_handleInputFocus",


          /**
           * Handle Input Focus
           */
          value: function _handleInputFocus() {
            this.$el.addClass('focus');
          }

          /**
           * Handle Input Blur
           */

        }, {
          key: "_handleInputBlur",
          value: function _handleInputBlur() {
            this.$el.removeClass('focus');
          }

          /**
           * Handle Input Keydown
           * @param {Event} e
           */

        }, {
          key: "_handleInputKeydown",
          value: function _handleInputKeydown(e) {
            Chips._keydown = true;

            // enter
            if (e.keyCode === 13) {
              // Override enter if autocompleting.
              if (this.hasAutocomplete && this.autocomplete && this.autocomplete.isOpen) {
                return;
              }

              e.preventDefault();
              this.addChip({
                tag: this.$input[0].value
              });
              this.$input[0].value = '';

              // delete or left
            } else if ((e.keyCode === 8 || e.keyCode === 37) && this.$input[0].value === '' && this.chipsData.length) {
              e.preventDefault();
              this.selectChip(this.chipsData.length - 1);
            }
          }

          /**
           * Render Chip
           * @param {chip} chip
           * @return {Element}
           */

        }, {
          key: "_renderChip",
          value: function _renderChip(chip) {
            if (!chip.tag) {
              return;
            }

            var renderedChip = document.createElement('div');
            var closeIcon = document.createElement('i');
            renderedChip.classList.add('chip');
            renderedChip.textContent = chip.tag;
            renderedChip.setAttribute('tabindex', 0);
            $(closeIcon).addClass('material-icons close');
            closeIcon.textContent = 'close';

            // attach image if needed
            if (chip.image) {
              var img = document.createElement('img');
              img.setAttribute('src', chip.image);
              renderedChip.insertBefore(img, renderedChip.firstChild);
            }

            renderedChip.appendChild(closeIcon);
            return renderedChip;
          }

          /**
           * Render Chips
           */

        }, {
          key: "_renderChips",
          value: function _renderChips() {
            this.$chips.remove();
            for (var i = 0; i < this.chipsData.length; i++) {
              var chipEl = this._renderChip(this.chipsData[i]);
              this.$el.append(chipEl);
              this.$chips.add(chipEl);
            }

            // move input to end
            this.$el.append(this.$input[0]);
          }

          /**
           * Setup Autocomplete
           */

        }, {
          key: "_setupAutocomplete",
          value: function _setupAutocomplete() {
            var _this46 = this;

            this.options.autocompleteOptions.onAutocomplete = function (val) {
              _this46.addChip({
                tag: val
              });
              _this46.$input[0].value = '';
              _this46.$input[0].focus();
            };

            this.autocomplete = M.Autocomplete.init(this.$input[0], this.options.autocompleteOptions);
          }

          /**
           * Setup Input
           */

        }, {
          key: "_setupInput",
          value: function _setupInput() {
            this.$input = this.$el.find('input');
            if (!this.$input.length) {
              this.$input = $('<input></input>');
              this.$el.append(this.$input);
            }

            this.$input.addClass('input');
          }

          /**
           * Setup Label
           */

        }, {
          key: "_setupLabel",
          value: function _setupLabel() {
            this.$label = this.$el.find('label');
            if (this.$label.length) {
              this.$label.setAttribute('for', this.$input.attr('id'));
            }
          }

          /**
           * Set placeholder
           */

        }, {
          key: "_setPlaceholder",
          value: function _setPlaceholder() {
            if (this.chipsData !== undefined && !this.chipsData.length && this.options.placeholder) {
              $(this.$input).prop('placeholder', this.options.placeholder);
            } else if ((this.chipsData === undefined || !!this.chipsData.length) && this.options.secondaryPlaceholder) {
              $(this.$input).prop('placeholder', this.options.secondaryPlaceholder);
            }
          }

          /**
           * Check if chip is valid
           * @param {chip} chip
           */

        }, {
          key: "_isValid",
          value: function _isValid(chip) {
            if (chip.hasOwnProperty('tag') && chip.tag !== '') {
              var exists = false;
              for (var i = 0; i < this.chipsData.length; i++) {
                if (this.chipsData[i].tag === chip.tag) {
                  exists = true;
                  break;
                }
              }
              return !exists;
            }

            return false;
          }

          /**
           * Add chip
           * @param {chip} chip
           */

        }, {
          key: "addChip",
          value: function addChip(chip) {
            if (!this._isValid(chip) || this.chipsData.length >= this.options.limit) {
              return;
            }

            var renderedChip = this._renderChip(chip);
            this.$chips.add(renderedChip);
            this.chipsData.push(chip);
            $(this.$input).before(renderedChip);
            this._setPlaceholder();

            // fire chipAdd callback
            if (typeof this.options.onChipAdd === 'function') {
              this.options.onChipAdd.call(this, this.$el, renderedChip);
            }
          }

          /**
           * Delete chip
           * @param {Number} chip
           */

        }, {
          key: "deleteChip",
          value: function deleteChip(chipIndex) {
            var $chip = this.$chips.eq(chipIndex);
            this.$chips.eq(chipIndex).remove();
            this.$chips = this.$chips.filter(function (el) {
              return $(el).index() >= 0;
            });
            this.chipsData.splice(chipIndex, 1);
            this._setPlaceholder();

            // fire chipDelete callback
            if (typeof this.options.onChipDelete === 'function') {
              this.options.onChipDelete.call(this, this.$el, $chip[0]);
            }
          }

          /**
           * Select chip
           * @param {Number} chip
           */

        }, {
          key: "selectChip",
          value: function selectChip(chipIndex) {
            var $chip = this.$chips.eq(chipIndex);
            this._selectedChip = $chip;
            $chip[0].focus();

            // fire chipSelect callback
            if (typeof this.options.onChipSelect === 'function') {
              this.options.onChipSelect.call(this, this.$el, $chip[0]);
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Chips.__proto__ || Object.getPrototypeOf(Chips), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Chips;
          }
        }, {
          key: "_handleChipsKeydown",
          value: function _handleChipsKeydown(e) {
            Chips._keydown = true;

            var $chips = $(e.target).closest('.chips');
            var chipsKeydown = e.target && $chips.length;

            // Don't handle keydown inputs on input and textarea
            if ($(e.target).is('input, textarea') || !chipsKeydown) {
              return;
            }

            var currChips = $chips[0].M_Chips;

            // backspace and delete
            if (e.keyCode === 8 || e.keyCode === 46) {
              e.preventDefault();

              var selectIndex = currChips.chipsData.length;
              if (currChips._selectedChip) {
                var index = currChips._selectedChip.index();
                currChips.deleteChip(index);
                currChips._selectedChip = null;

                // Make sure selectIndex doesn't go negative
                selectIndex = Math.max(index - 1, 0);
              }

              if (currChips.chipsData.length) {
                currChips.selectChip(selectIndex);
              }

              // left arrow key
            } else if (e.keyCode === 37) {
              if (currChips._selectedChip) {
                var _selectIndex = currChips._selectedChip.index() - 1;
                if (_selectIndex < 0) {
                  return;
                }
                currChips.selectChip(_selectIndex);
              }

              // right arrow key
            } else if (e.keyCode === 39) {
              if (currChips._selectedChip) {
                var _selectIndex2 = currChips._selectedChip.index() + 1;

                if (_selectIndex2 >= currChips.chipsData.length) {
                  currChips.$input[0].focus();
                } else {
                  currChips.selectChip(_selectIndex2);
                }
              }
            }
          }

          /**
           * Handle Chips Keyup
           * @param {Event} e
           */

        }, {
          key: "_handleChipsKeyup",
          value: function _handleChipsKeyup(e) {
            Chips._keydown = false;
          }

          /**
           * Handle Chips Blur
           * @param {Event} e
           */

        }, {
          key: "_handleChipsBlur",
          value: function _handleChipsBlur(e) {
            if (!Chips._keydown) {
              var $chips = $(e.target).closest('.chips');
              var currChips = $chips[0].M_Chips;

              currChips._selectedChip = null;
            }
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Chips;
      }(Component);

      /**
       * @static
       * @memberof Chips
       */


      Chips._keydown = false;

      M.Chips = Chips;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Chips, 'chips', 'M_Chips');
      }

      $(document).ready(function () {
        // Handle removal of static chips.
        $(document.body).on('click', '.chip .close', function () {
          var $chips = $(this).closest('.chips');
          if ($chips.length && $chips[0].M_Chips) {
            return;
          }
          $(this).closest('.chip').remove();
        });
      });
    })(cash);
    (function ($) {

      var _defaults = {
        top: 0,
        bottom: Infinity,
        offset: 0,
        onPositionChange: null
      };

      /**
       * @class
       *
       */

      var Pushpin = function (_Component13) {
        _inherits(Pushpin, _Component13);

        /**
         * Construct Pushpin instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Pushpin(el, options) {
          _classCallCheck(this, Pushpin);

          var _this47 = _possibleConstructorReturn(this, (Pushpin.__proto__ || Object.getPrototypeOf(Pushpin)).call(this, Pushpin, el, options));

          _this47.el.M_Pushpin = _this47;

          /**
           * Options for the modal
           * @member Pushpin#options
           */
          _this47.options = $.extend({}, Pushpin.defaults, options);

          _this47.originalOffset = _this47.el.offsetTop;
          Pushpin._pushpins.push(_this47);
          _this47._setupEventHandlers();
          _this47._updatePosition();
          return _this47;
        }

        _createClass(Pushpin, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this.el.style.top = null;
            this._removePinClasses();
            this._removeEventHandlers();

            // Remove pushpin Inst
            var index = Pushpin._pushpins.indexOf(this);
            Pushpin._pushpins.splice(index, 1);
          }
        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            document.addEventListener('scroll', Pushpin._updateElements);
          }
        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            document.removeEventListener('scroll', Pushpin._updateElements);
          }
        }, {
          key: "_updatePosition",
          value: function _updatePosition() {
            var scrolled = M.getDocumentScrollTop() + this.options.offset;

            if (this.options.top <= scrolled && this.options.bottom >= scrolled && !this.el.classList.contains('pinned')) {
              this._removePinClasses();
              this.el.style.top = this.options.offset + "px";
              this.el.classList.add('pinned');

              // onPositionChange callback
              if (typeof this.options.onPositionChange === 'function') {
                this.options.onPositionChange.call(this, 'pinned');
              }
            }

            // Add pin-top (when scrolled position is above top)
            if (scrolled < this.options.top && !this.el.classList.contains('pin-top')) {
              this._removePinClasses();
              this.el.style.top = 0;
              this.el.classList.add('pin-top');

              // onPositionChange callback
              if (typeof this.options.onPositionChange === 'function') {
                this.options.onPositionChange.call(this, 'pin-top');
              }
            }

            // Add pin-bottom (when scrolled position is below bottom)
            if (scrolled > this.options.bottom && !this.el.classList.contains('pin-bottom')) {
              this._removePinClasses();
              this.el.classList.add('pin-bottom');
              this.el.style.top = this.options.bottom - this.originalOffset + "px";

              // onPositionChange callback
              if (typeof this.options.onPositionChange === 'function') {
                this.options.onPositionChange.call(this, 'pin-bottom');
              }
            }
          }
        }, {
          key: "_removePinClasses",
          value: function _removePinClasses() {
            // IE 11 bug (can't remove multiple classes in one line)
            this.el.classList.remove('pin-top');
            this.el.classList.remove('pinned');
            this.el.classList.remove('pin-bottom');
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Pushpin.__proto__ || Object.getPrototypeOf(Pushpin), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Pushpin;
          }
        }, {
          key: "_updateElements",
          value: function _updateElements() {
            for (var elIndex in Pushpin._pushpins) {
              var pInstance = Pushpin._pushpins[elIndex];
              pInstance._updatePosition();
            }
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Pushpin;
      }(Component);

      /**
       * @static
       * @memberof Pushpin
       */


      Pushpin._pushpins = [];

      M.Pushpin = Pushpin;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Pushpin, 'pushpin', 'M_Pushpin');
      }
    })(cash);
    (function ($, anim) {

      var _defaults = {
        direction: 'top',
        hoverEnabled: true,
        toolbarEnabled: false
      };

      $.fn.reverse = [].reverse;

      /**
       * @class
       *
       */

      var FloatingActionButton = function (_Component14) {
        _inherits(FloatingActionButton, _Component14);

        /**
         * Construct FloatingActionButton instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function FloatingActionButton(el, options) {
          _classCallCheck(this, FloatingActionButton);

          var _this48 = _possibleConstructorReturn(this, (FloatingActionButton.__proto__ || Object.getPrototypeOf(FloatingActionButton)).call(this, FloatingActionButton, el, options));

          _this48.el.M_FloatingActionButton = _this48;

          /**
           * Options for the fab
           * @member FloatingActionButton#options
           * @prop {Boolean} [direction] - Direction fab menu opens
           * @prop {Boolean} [hoverEnabled=true] - Enable hover vs click
           * @prop {Boolean} [toolbarEnabled=false] - Enable toolbar transition
           */
          _this48.options = $.extend({}, FloatingActionButton.defaults, options);

          _this48.isOpen = false;
          _this48.$anchor = _this48.$el.children('a').first();
          _this48.$menu = _this48.$el.children('ul').first();
          _this48.$floatingBtns = _this48.$el.find('ul .btn-floating');
          _this48.$floatingBtnsReverse = _this48.$el.find('ul .btn-floating').reverse();
          _this48.offsetY = 0;
          _this48.offsetX = 0;

          _this48.$el.addClass("direction-" + _this48.options.direction);
          if (_this48.options.direction === 'top') {
            _this48.offsetY = 40;
          } else if (_this48.options.direction === 'right') {
            _this48.offsetX = -40;
          } else if (_this48.options.direction === 'bottom') {
            _this48.offsetY = -40;
          } else {
            _this48.offsetX = 40;
          }
          _this48._setupEventHandlers();
          return _this48;
        }

        _createClass(FloatingActionButton, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.el.M_FloatingActionButton = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleFABClickBound = this._handleFABClick.bind(this);
            this._handleOpenBound = this.open.bind(this);
            this._handleCloseBound = this.close.bind(this);

            if (this.options.hoverEnabled && !this.options.toolbarEnabled) {
              this.el.addEventListener('mouseenter', this._handleOpenBound);
              this.el.addEventListener('mouseleave', this._handleCloseBound);
            } else {
              this.el.addEventListener('click', this._handleFABClickBound);
            }
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            if (this.options.hoverEnabled && !this.options.toolbarEnabled) {
              this.el.removeEventListener('mouseenter', this._handleOpenBound);
              this.el.removeEventListener('mouseleave', this._handleCloseBound);
            } else {
              this.el.removeEventListener('click', this._handleFABClickBound);
            }
          }

          /**
           * Handle FAB Click
           */

        }, {
          key: "_handleFABClick",
          value: function _handleFABClick() {
            if (this.isOpen) {
              this.close();
            } else {
              this.open();
            }
          }

          /**
           * Handle Document Click
           * @param {Event} e
           */

        }, {
          key: "_handleDocumentClick",
          value: function _handleDocumentClick(e) {
            if (!$(e.target).closest(this.$menu).length) {
              this.close();
            }
          }

          /**
           * Open FAB
           */

        }, {
          key: "open",
          value: function open() {
            if (this.isOpen) {
              return;
            }

            if (this.options.toolbarEnabled) {
              this._animateInToolbar();
            } else {
              this._animateInFAB();
            }
            this.isOpen = true;
          }

          /**
           * Close FAB
           */

        }, {
          key: "close",
          value: function close() {
            if (!this.isOpen) {
              return;
            }

            if (this.options.toolbarEnabled) {
              window.removeEventListener('scroll', this._handleCloseBound, true);
              document.body.removeEventListener('click', this._handleDocumentClickBound, true);
              this._animateOutToolbar();
            } else {
              this._animateOutFAB();
            }
            this.isOpen = false;
          }

          /**
           * Classic FAB Menu open
           */

        }, {
          key: "_animateInFAB",
          value: function _animateInFAB() {
            var _this49 = this;

            this.$el.addClass('active');

            var time = 0;
            this.$floatingBtnsReverse.each(function (el) {
              anim({
                targets: el,
                opacity: 1,
                scale: [0.4, 1],
                translateY: [_this49.offsetY, 0],
                translateX: [_this49.offsetX, 0],
                duration: 275,
                delay: time,
                easing: 'easeInOutQuad'
              });
              time += 40;
            });
          }

          /**
           * Classic FAB Menu close
           */

        }, {
          key: "_animateOutFAB",
          value: function _animateOutFAB() {
            var _this50 = this;

            this.$floatingBtnsReverse.each(function (el) {
              anim.remove(el);
              anim({
                targets: el,
                opacity: 0,
                scale: 0.4,
                translateY: _this50.offsetY,
                translateX: _this50.offsetX,
                duration: 175,
                easing: 'easeOutQuad',
                complete: function () {
                  _this50.$el.removeClass('active');
                }
              });
            });
          }

          /**
           * Toolbar transition Menu open
           */

        }, {
          key: "_animateInToolbar",
          value: function _animateInToolbar() {
            var _this51 = this;

            var scaleFactor = void 0;
            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;
            var btnRect = this.el.getBoundingClientRect();
            var backdrop = $('<div class="fab-backdrop"></div>');
            var fabColor = this.$anchor.css('background-color');
            this.$anchor.append(backdrop);

            this.offsetX = btnRect.left - windowWidth / 2 + btnRect.width / 2;
            this.offsetY = windowHeight - btnRect.bottom;
            scaleFactor = windowWidth / backdrop[0].clientWidth;
            this.btnBottom = btnRect.bottom;
            this.btnLeft = btnRect.left;
            this.btnWidth = btnRect.width;

            // Set initial state
            this.$el.addClass('active');
            this.$el.css({
              'text-align': 'center',
              width: '100%',
              bottom: 0,
              left: 0,
              transform: 'translateX(' + this.offsetX + 'px)',
              transition: 'none'
            });
            this.$anchor.css({
              transform: 'translateY(' + -this.offsetY + 'px)',
              transition: 'none'
            });
            backdrop.css({
              'background-color': fabColor
            });

            setTimeout(function () {
              _this51.$el.css({
                transform: '',
                transition: 'transform .2s cubic-bezier(0.550, 0.085, 0.680, 0.530), background-color 0s linear .2s'
              });
              _this51.$anchor.css({
                overflow: 'visible',
                transform: '',
                transition: 'transform .2s'
              });

              setTimeout(function () {
                _this51.$el.css({
                  overflow: 'hidden',
                  'background-color': fabColor
                });
                backdrop.css({
                  transform: 'scale(' + scaleFactor + ')',
                  transition: 'transform .2s cubic-bezier(0.550, 0.055, 0.675, 0.190)'
                });
                _this51.$menu.children('li').children('a').css({
                  opacity: 1
                });

                // Scroll to close.
                _this51._handleDocumentClickBound = _this51._handleDocumentClick.bind(_this51);
                window.addEventListener('scroll', _this51._handleCloseBound, true);
                document.body.addEventListener('click', _this51._handleDocumentClickBound, true);
              }, 100);
            }, 0);
          }

          /**
           * Toolbar transition Menu close
           */

        }, {
          key: "_animateOutToolbar",
          value: function _animateOutToolbar() {
            var _this52 = this;

            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;
            var backdrop = this.$el.find('.fab-backdrop');
            var fabColor = this.$anchor.css('background-color');

            this.offsetX = this.btnLeft - windowWidth / 2 + this.btnWidth / 2;
            this.offsetY = windowHeight - this.btnBottom;

            // Hide backdrop
            this.$el.removeClass('active');
            this.$el.css({
              'background-color': 'transparent',
              transition: 'none'
            });
            this.$anchor.css({
              transition: 'none'
            });
            backdrop.css({
              transform: 'scale(0)',
              'background-color': fabColor
            });
            this.$menu.children('li').children('a').css({
              opacity: ''
            });

            setTimeout(function () {
              backdrop.remove();

              // Set initial state.
              _this52.$el.css({
                'text-align': '',
                width: '',
                bottom: '',
                left: '',
                overflow: '',
                'background-color': '',
                transform: 'translate3d(' + -_this52.offsetX + 'px,0,0)'
              });
              _this52.$anchor.css({
                overflow: '',
                transform: 'translate3d(0,' + _this52.offsetY + 'px,0)'
              });

              setTimeout(function () {
                _this52.$el.css({
                  transform: 'translate3d(0,0,0)',
                  transition: 'transform .2s'
                });
                _this52.$anchor.css({
                  transform: 'translate3d(0,0,0)',
                  transition: 'transform .2s cubic-bezier(0.550, 0.055, 0.675, 0.190)'
                });
              }, 20);
            }, 200);
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(FloatingActionButton.__proto__ || Object.getPrototypeOf(FloatingActionButton), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_FloatingActionButton;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return FloatingActionButton;
      }(Component);

      M.FloatingActionButton = FloatingActionButton;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(FloatingActionButton, 'floatingActionButton', 'M_FloatingActionButton');
      }
    })(cash, M.anime);
    (function ($) {

      var _defaults = {
        // Close when date is selected
        autoClose: false,

        // the default output format for the input field value
        format: 'mmm dd, yyyy',

        // Used to create date object from current input string
        parse: null,

        // The initial date to view when first opened
        defaultDate: null,

        // Make the `defaultDate` the initial selected value
        setDefaultDate: false,

        disableWeekends: false,

        disableDayFn: null,

        // First day of week (0: Sunday, 1: Monday etc)
        firstDay: 0,

        // The earliest date that can be selected
        minDate: null,
        // Thelatest date that can be selected
        maxDate: null,

        // Number of years either side, or array of upper/lower range
        yearRange: 10,

        // used internally (don't config outside)
        minYear: 0,
        maxYear: 9999,
        minMonth: undefined,
        maxMonth: undefined,

        startRange: null,
        endRange: null,

        isRTL: false,

        // Render the month after year in the calendar title
        showMonthAfterYear: false,

        // Render days of the calendar grid that fall in the next or previous month
        showDaysInNextAndPreviousMonths: false,

        // Specify a DOM element to render the calendar in
        container: null,

        // Show clear button
        showClearBtn: false,

        // internationalization
        i18n: {
          cancel: 'Cancel',
          clear: 'Clear',
          done: 'Ok',
          previousMonth: '‹',
          nextMonth: '›',
          months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          weekdaysAbbrev: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        },

        // events array
        events: [],

        // callback function
        onSelect: null,
        onOpen: null,
        onClose: null,
        onDraw: null
      };

      /**
       * @class
       *
       */

      var Datepicker = function (_Component15) {
        _inherits(Datepicker, _Component15);

        /**
         * Construct Datepicker instance and set up overlay
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Datepicker(el, options) {
          _classCallCheck(this, Datepicker);

          var _this53 = _possibleConstructorReturn(this, (Datepicker.__proto__ || Object.getPrototypeOf(Datepicker)).call(this, Datepicker, el, options));

          _this53.el.M_Datepicker = _this53;

          _this53.options = $.extend({}, Datepicker.defaults, options);

          // make sure i18n defaults are not lost when only few i18n option properties are passed
          if (!!options && options.hasOwnProperty('i18n') && typeof options.i18n === 'object') {
            _this53.options.i18n = $.extend({}, Datepicker.defaults.i18n, options.i18n);
          }

          // Remove time component from minDate and maxDate options
          if (_this53.options.minDate) _this53.options.minDate.setHours(0, 0, 0, 0);
          if (_this53.options.maxDate) _this53.options.maxDate.setHours(0, 0, 0, 0);

          _this53.id = M.guid();

          _this53._setupVariables();
          _this53._insertHTMLIntoDOM();
          _this53._setupModal();

          _this53._setupEventHandlers();

          if (!_this53.options.defaultDate) {
            _this53.options.defaultDate = new Date(Date.parse(_this53.el.value));
          }

          var defDate = _this53.options.defaultDate;
          if (Datepicker._isDate(defDate)) {
            if (_this53.options.setDefaultDate) {
              _this53.setDate(defDate, true);
              _this53.setInputValue();
            } else {
              _this53.gotoDate(defDate);
            }
          } else {
            _this53.gotoDate(new Date());
          }

          /**
           * Describes open/close state of datepicker
           * @type {Boolean}
           */
          _this53.isOpen = false;
          return _this53;
        }

        _createClass(Datepicker, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.modal.destroy();
            $(this.modalEl).remove();
            this.destroySelects();
            this.el.M_Datepicker = undefined;
          }
        }, {
          key: "destroySelects",
          value: function destroySelects() {
            var oldYearSelect = this.calendarEl.querySelector('.orig-select-year');
            if (oldYearSelect) {
              M.FormSelect.getInstance(oldYearSelect).destroy();
            }
            var oldMonthSelect = this.calendarEl.querySelector('.orig-select-month');
            if (oldMonthSelect) {
              M.FormSelect.getInstance(oldMonthSelect).destroy();
            }
          }
        }, {
          key: "_insertHTMLIntoDOM",
          value: function _insertHTMLIntoDOM() {
            if (this.options.showClearBtn) {
              $(this.clearBtn).css({ visibility: '' });
              this.clearBtn.innerHTML = this.options.i18n.clear;
            }

            this.doneBtn.innerHTML = this.options.i18n.done;
            this.cancelBtn.innerHTML = this.options.i18n.cancel;

            if (this.options.container) {
              this.$modalEl.appendTo(this.options.container);
            } else {
              this.$modalEl.insertBefore(this.el);
            }
          }
        }, {
          key: "_setupModal",
          value: function _setupModal() {
            var _this54 = this;

            this.modalEl.id = 'modal-' + this.id;
            this.modal = M.Modal.init(this.modalEl, {
              onCloseEnd: function () {
                _this54.isOpen = false;
              }
            });
          }
        }, {
          key: "toString",
          value: function toString(format) {
            var _this55 = this;

            format = format || this.options.format;
            if (!Datepicker._isDate(this.date)) {
              return '';
            }

            var formatArray = format.split(/(d{1,4}|m{1,4}|y{4}|yy|!.)/g);
            var formattedDate = formatArray.map(function (label) {
              if (_this55.formats[label]) {
                return _this55.formats[label]();
              }

              return label;
            }).join('');
            return formattedDate;
          }
        }, {
          key: "setDate",
          value: function setDate(date, preventOnSelect) {
            if (!date) {
              this.date = null;
              this._renderDateDisplay();
              return this.draw();
            }
            if (typeof date === 'string') {
              date = new Date(Date.parse(date));
            }
            if (!Datepicker._isDate(date)) {
              return;
            }

            var min = this.options.minDate,
                max = this.options.maxDate;

            if (Datepicker._isDate(min) && date < min) {
              date = min;
            } else if (Datepicker._isDate(max) && date > max) {
              date = max;
            }

            this.date = new Date(date.getTime());

            this._renderDateDisplay();

            Datepicker._setToStartOfDay(this.date);
            this.gotoDate(this.date);

            if (!preventOnSelect && typeof this.options.onSelect === 'function') {
              this.options.onSelect.call(this, this.date);
            }
          }
        }, {
          key: "setInputValue",
          value: function setInputValue() {
            this.el.value = this.toString();
            this.$el.trigger('change', { firedBy: this });
          }
        }, {
          key: "_renderDateDisplay",
          value: function _renderDateDisplay() {
            var displayDate = Datepicker._isDate(this.date) ? this.date : new Date();
            var i18n = this.options.i18n;
            var day = i18n.weekdaysShort[displayDate.getDay()];
            var month = i18n.monthsShort[displayDate.getMonth()];
            var date = displayDate.getDate();
            this.yearTextEl.innerHTML = displayDate.getFullYear();
            this.dateTextEl.innerHTML = day + ", " + month + " " + date;
          }

          /**
           * change view to a specific date
           */

        }, {
          key: "gotoDate",
          value: function gotoDate(date) {
            var newCalendar = true;

            if (!Datepicker._isDate(date)) {
              return;
            }

            if (this.calendars) {
              var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
                  lastVisibleDate = new Date(this.calendars[this.calendars.length - 1].year, this.calendars[this.calendars.length - 1].month, 1),
                  visibleDate = date.getTime();
              // get the end of the month
              lastVisibleDate.setMonth(lastVisibleDate.getMonth() + 1);
              lastVisibleDate.setDate(lastVisibleDate.getDate() - 1);
              newCalendar = visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate;
            }

            if (newCalendar) {
              this.calendars = [{
                month: date.getMonth(),
                year: date.getFullYear()
              }];
            }

            this.adjustCalendars();
          }
        }, {
          key: "adjustCalendars",
          value: function adjustCalendars() {
            this.calendars[0] = this.adjustCalendar(this.calendars[0]);
            this.draw();
          }
        }, {
          key: "adjustCalendar",
          value: function adjustCalendar(calendar) {
            if (calendar.month < 0) {
              calendar.year -= Math.ceil(Math.abs(calendar.month) / 12);
              calendar.month += 12;
            }
            if (calendar.month > 11) {
              calendar.year += Math.floor(Math.abs(calendar.month) / 12);
              calendar.month -= 12;
            }
            return calendar;
          }
        }, {
          key: "nextMonth",
          value: function nextMonth() {
            this.calendars[0].month++;
            this.adjustCalendars();
          }
        }, {
          key: "prevMonth",
          value: function prevMonth() {
            this.calendars[0].month--;
            this.adjustCalendars();
          }
        }, {
          key: "render",
          value: function render(year, month, randId) {
            var opts = this.options,
                now = new Date(),
                days = Datepicker._getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data = [],
                row = [];
            Datepicker._setToStartOfDay(now);
            if (opts.firstDay > 0) {
              before -= opts.firstDay;
              if (before < 0) {
                before += 7;
              }
            }
            var previousMonth = month === 0 ? 11 : month - 1,
                nextMonth = month === 11 ? 0 : month + 1,
                yearOfPreviousMonth = month === 0 ? year - 1 : year,
                yearOfNextMonth = month === 11 ? year + 1 : year,
                daysInPreviousMonth = Datepicker._getDaysInMonth(yearOfPreviousMonth, previousMonth);
            var cells = days + before,
                after = cells;
            while (after > 7) {
              after -= 7;
            }
            cells += 7 - after;
            var isWeekSelected = false;
            for (var i = 0, r = 0; i < cells; i++) {
              var day = new Date(year, month, 1 + (i - before)),
                  isSelected = Datepicker._isDate(this.date) ? Datepicker._compareDates(day, this.date) : false,
                  isToday = Datepicker._compareDates(day, now),
                  hasEvent = opts.events.indexOf(day.toDateString()) !== -1 ? true : false,
                  isEmpty = i < before || i >= days + before,
                  dayNumber = 1 + (i - before),
                  monthNumber = month,
                  yearNumber = year,
                  isStartRange = opts.startRange && Datepicker._compareDates(opts.startRange, day),
                  isEndRange = opts.endRange && Datepicker._compareDates(opts.endRange, day),
                  isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
                  isDisabled = opts.minDate && day < opts.minDate || opts.maxDate && day > opts.maxDate || opts.disableWeekends && Datepicker._isWeekend(day) || opts.disableDayFn && opts.disableDayFn(day);

              if (isEmpty) {
                if (i < before) {
                  dayNumber = daysInPreviousMonth + dayNumber;
                  monthNumber = previousMonth;
                  yearNumber = yearOfPreviousMonth;
                } else {
                  dayNumber = dayNumber - days;
                  monthNumber = nextMonth;
                  yearNumber = yearOfNextMonth;
                }
              }

              var dayConfig = {
                day: dayNumber,
                month: monthNumber,
                year: yearNumber,
                hasEvent: hasEvent,
                isSelected: isSelected,
                isToday: isToday,
                isDisabled: isDisabled,
                isEmpty: isEmpty,
                isStartRange: isStartRange,
                isEndRange: isEndRange,
                isInRange: isInRange,
                showDaysInNextAndPreviousMonths: opts.showDaysInNextAndPreviousMonths
              };

              row.push(this.renderDay(dayConfig));

              if (++r === 7) {
                data.push(this.renderRow(row, opts.isRTL, isWeekSelected));
                row = [];
                r = 0;
                isWeekSelected = false;
              }
            }
            return this.renderTable(opts, data, randId);
          }
        }, {
          key: "renderDay",
          value: function renderDay(opts) {
            var arr = [];
            var ariaSelected = 'false';
            if (opts.isEmpty) {
              if (opts.showDaysInNextAndPreviousMonths) {
                arr.push('is-outside-current-month');
                arr.push('is-selection-disabled');
              } else {
                return '<td class="is-empty"></td>';
              }
            }
            if (opts.isDisabled) {
              arr.push('is-disabled');
            }

            if (opts.isToday) {
              arr.push('is-today');
            }
            if (opts.isSelected) {
              arr.push('is-selected');
              ariaSelected = 'true';
            }
            if (opts.hasEvent) {
              arr.push('has-event');
            }
            if (opts.isInRange) {
              arr.push('is-inrange');
            }
            if (opts.isStartRange) {
              arr.push('is-startrange');
            }
            if (opts.isEndRange) {
              arr.push('is-endrange');
            }
            return "<td data-day=\"" + opts.day + "\" class=\"" + arr.join(' ') + "\" aria-selected=\"" + ariaSelected + "\">" + ("<button class=\"datepicker-day-button\" type=\"button\" data-year=\"" + opts.year + "\" data-month=\"" + opts.month + "\" data-day=\"" + opts.day + "\">" + opts.day + "</button>") + '</td>';
          }
        }, {
          key: "renderRow",
          value: function renderRow(days, isRTL, isRowSelected) {
            return '<tr class="datepicker-row' + (isRowSelected ? ' is-selected' : '') + '">' + (isRTL ? days.reverse() : days).join('') + '</tr>';
          }
        }, {
          key: "renderTable",
          value: function renderTable(opts, data, randId) {
            return '<div class="datepicker-table-wrapper"><table cellpadding="0" cellspacing="0" class="datepicker-table" role="grid" aria-labelledby="' + randId + '">' + this.renderHead(opts) + this.renderBody(data) + '</table></div>';
          }
        }, {
          key: "renderHead",
          value: function renderHead(opts) {
            var i = void 0,
                arr = [];
            for (i = 0; i < 7; i++) {
              arr.push("<th scope=\"col\"><abbr title=\"" + this.renderDayName(opts, i) + "\">" + this.renderDayName(opts, i, true) + "</abbr></th>");
            }
            return '<thead><tr>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tr></thead>';
          }
        }, {
          key: "renderBody",
          value: function renderBody(rows) {
            return '<tbody>' + rows.join('') + '</tbody>';
          }
        }, {
          key: "renderTitle",
          value: function renderTitle(instance, c, year, month, refYear, randId) {
            var i = void 0,
                j = void 0,
                arr = void 0,
                opts = this.options,
                isMinYear = year === opts.minYear,
                isMaxYear = year === opts.maxYear,
                html = '<div id="' + randId + '" class="datepicker-controls" role="heading" aria-live="assertive">',
                monthHtml = void 0,
                yearHtml = void 0,
                prev = true,
                next = true;

            for (arr = [], i = 0; i < 12; i++) {
              arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' + (i === month ? ' selected="selected"' : '') + (isMinYear && i < opts.minMonth || isMaxYear && i > opts.maxMonth ? 'disabled="disabled"' : '') + '>' + opts.i18n.months[i] + '</option>');
            }

            monthHtml = '<select class="datepicker-select orig-select-month" tabindex="-1">' + arr.join('') + '</select>';

            if ($.isArray(opts.yearRange)) {
              i = opts.yearRange[0];
              j = opts.yearRange[1] + 1;
            } else {
              i = year - opts.yearRange;
              j = 1 + year + opts.yearRange;
            }

            for (arr = []; i < j && i <= opts.maxYear; i++) {
              if (i >= opts.minYear) {
                arr.push("<option value=\"" + i + "\" " + (i === year ? 'selected="selected"' : '') + ">" + i + "</option>");
              }
            }

            yearHtml = "<select class=\"datepicker-select orig-select-year\" tabindex=\"-1\">" + arr.join('') + "</select>";

            var leftArrow = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"/><path d="M0-.5h24v24H0z" fill="none"/></svg>';
            html += "<button class=\"month-prev" + (prev ? '' : ' is-disabled') + "\" type=\"button\">" + leftArrow + "</button>";

            html += '<div class="selects-container">';
            if (opts.showMonthAfterYear) {
              html += yearHtml + monthHtml;
            } else {
              html += monthHtml + yearHtml;
            }
            html += '</div>';

            if (isMinYear && (month === 0 || opts.minMonth >= month)) {
              prev = false;
            }

            if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
              next = false;
            }

            var rightArrow = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/><path d="M0-.25h24v24H0z" fill="none"/></svg>';
            html += "<button class=\"month-next" + (next ? '' : ' is-disabled') + "\" type=\"button\">" + rightArrow + "</button>";

            return html += '</div>';
          }

          /**
           * refresh the HTML
           */

        }, {
          key: "draw",
          value: function draw(force) {
            if (!this.isOpen && !force) {
              return;
            }
            var opts = this.options,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth,
                html = '',
                randId = void 0;

            if (this._y <= minYear) {
              this._y = minYear;
              if (!isNaN(minMonth) && this._m < minMonth) {
                this._m = minMonth;
              }
            }
            if (this._y >= maxYear) {
              this._y = maxYear;
              if (!isNaN(maxMonth) && this._m > maxMonth) {
                this._m = maxMonth;
              }
            }

            randId = 'datepicker-title-' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 2);

            for (var c = 0; c < 1; c++) {
              this._renderDateDisplay();
              html += this.renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year, randId) + this.render(this.calendars[c].year, this.calendars[c].month, randId);
            }

            this.destroySelects();

            this.calendarEl.innerHTML = html;

            // Init Materialize Select
            var yearSelect = this.calendarEl.querySelector('.orig-select-year');
            var monthSelect = this.calendarEl.querySelector('.orig-select-month');
            M.FormSelect.init(yearSelect, {
              classes: 'select-year',
              dropdownOptions: { container: document.body, constrainWidth: false }
            });
            M.FormSelect.init(monthSelect, {
              classes: 'select-month',
              dropdownOptions: { container: document.body, constrainWidth: false }
            });

            // Add change handlers for select
            yearSelect.addEventListener('change', this._handleYearChange.bind(this));
            monthSelect.addEventListener('change', this._handleMonthChange.bind(this));

            if (typeof this.options.onDraw === 'function') {
              this.options.onDraw(this);
            }
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleInputKeydownBound = this._handleInputKeydown.bind(this);
            this._handleInputClickBound = this._handleInputClick.bind(this);
            this._handleInputChangeBound = this._handleInputChange.bind(this);
            this._handleCalendarClickBound = this._handleCalendarClick.bind(this);
            this._finishSelectionBound = this._finishSelection.bind(this);
            this._handleMonthChange = this._handleMonthChange.bind(this);
            this._closeBound = this.close.bind(this);

            this.el.addEventListener('click', this._handleInputClickBound);
            this.el.addEventListener('keydown', this._handleInputKeydownBound);
            this.el.addEventListener('change', this._handleInputChangeBound);
            this.calendarEl.addEventListener('click', this._handleCalendarClickBound);
            this.doneBtn.addEventListener('click', this._finishSelectionBound);
            this.cancelBtn.addEventListener('click', this._closeBound);

            if (this.options.showClearBtn) {
              this._handleClearClickBound = this._handleClearClick.bind(this);
              this.clearBtn.addEventListener('click', this._handleClearClickBound);
            }
          }
        }, {
          key: "_setupVariables",
          value: function _setupVariables() {
            var _this56 = this;

            this.$modalEl = $(Datepicker._template);
            this.modalEl = this.$modalEl[0];

            this.calendarEl = this.modalEl.querySelector('.datepicker-calendar');

            this.yearTextEl = this.modalEl.querySelector('.year-text');
            this.dateTextEl = this.modalEl.querySelector('.date-text');
            if (this.options.showClearBtn) {
              this.clearBtn = this.modalEl.querySelector('.datepicker-clear');
            }
            this.doneBtn = this.modalEl.querySelector('.datepicker-done');
            this.cancelBtn = this.modalEl.querySelector('.datepicker-cancel');

            this.formats = {
              d: function () {
                return _this56.date.getDate();
              },
              dd: function () {
                var d = _this56.date.getDate();
                return (d < 10 ? '0' : '') + d;
              },
              ddd: function () {
                return _this56.options.i18n.weekdaysShort[_this56.date.getDay()];
              },
              dddd: function () {
                return _this56.options.i18n.weekdays[_this56.date.getDay()];
              },
              m: function () {
                return _this56.date.getMonth() + 1;
              },
              mm: function () {
                var m = _this56.date.getMonth() + 1;
                return (m < 10 ? '0' : '') + m;
              },
              mmm: function () {
                return _this56.options.i18n.monthsShort[_this56.date.getMonth()];
              },
              mmmm: function () {
                return _this56.options.i18n.months[_this56.date.getMonth()];
              },
              yy: function () {
                return ('' + _this56.date.getFullYear()).slice(2);
              },
              yyyy: function () {
                return _this56.date.getFullYear();
              }
            };
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('click', this._handleInputClickBound);
            this.el.removeEventListener('keydown', this._handleInputKeydownBound);
            this.el.removeEventListener('change', this._handleInputChangeBound);
            this.calendarEl.removeEventListener('click', this._handleCalendarClickBound);
          }
        }, {
          key: "_handleInputClick",
          value: function _handleInputClick() {
            this.open();
          }
        }, {
          key: "_handleInputKeydown",
          value: function _handleInputKeydown(e) {
            if (e.which === M.keys.ENTER) {
              e.preventDefault();
              this.open();
            }
          }
        }, {
          key: "_handleCalendarClick",
          value: function _handleCalendarClick(e) {
            if (!this.isOpen) {
              return;
            }

            var $target = $(e.target);
            if (!$target.hasClass('is-disabled')) {
              if ($target.hasClass('datepicker-day-button') && !$target.hasClass('is-empty') && !$target.parent().hasClass('is-disabled')) {
                this.setDate(new Date(e.target.getAttribute('data-year'), e.target.getAttribute('data-month'), e.target.getAttribute('data-day')));
                if (this.options.autoClose) {
                  this._finishSelection();
                }
              } else if ($target.closest('.month-prev').length) {
                this.prevMonth();
              } else if ($target.closest('.month-next').length) {
                this.nextMonth();
              }
            }
          }
        }, {
          key: "_handleClearClick",
          value: function _handleClearClick() {
            this.date = null;
            this.setInputValue();
            this.close();
          }
        }, {
          key: "_handleMonthChange",
          value: function _handleMonthChange(e) {
            this.gotoMonth(e.target.value);
          }
        }, {
          key: "_handleYearChange",
          value: function _handleYearChange(e) {
            this.gotoYear(e.target.value);
          }

          /**
           * change view to a specific month (zero-index, e.g. 0: January)
           */

        }, {
          key: "gotoMonth",
          value: function gotoMonth(month) {
            if (!isNaN(month)) {
              this.calendars[0].month = parseInt(month, 10);
              this.adjustCalendars();
            }
          }

          /**
           * change view to a specific full year (e.g. "2012")
           */

        }, {
          key: "gotoYear",
          value: function gotoYear(year) {
            if (!isNaN(year)) {
              this.calendars[0].year = parseInt(year, 10);
              this.adjustCalendars();
            }
          }
        }, {
          key: "_handleInputChange",
          value: function _handleInputChange(e) {
            var date = void 0;

            // Prevent change event from being fired when triggered by the plugin
            if (e.firedBy === this) {
              return;
            }
            if (this.options.parse) {
              date = this.options.parse(this.el.value, this.options.format);
            } else {
              date = new Date(Date.parse(this.el.value));
            }

            if (Datepicker._isDate(date)) {
              this.setDate(date);
            }
          }
        }, {
          key: "renderDayName",
          value: function renderDayName(opts, day, abbr) {
            day += opts.firstDay;
            while (day >= 7) {
              day -= 7;
            }
            return abbr ? opts.i18n.weekdaysAbbrev[day] : opts.i18n.weekdays[day];
          }

          /**
           * Set input value to the selected date and close Datepicker
           */

        }, {
          key: "_finishSelection",
          value: function _finishSelection() {
            this.setInputValue();
            this.close();
          }

          /**
           * Open Datepicker
           */

        }, {
          key: "open",
          value: function open() {
            if (this.isOpen) {
              return;
            }

            this.isOpen = true;
            if (typeof this.options.onOpen === 'function') {
              this.options.onOpen.call(this);
            }
            this.draw();
            this.modal.open();
            return this;
          }

          /**
           * Close Datepicker
           */

        }, {
          key: "close",
          value: function close() {
            if (!this.isOpen) {
              return;
            }

            this.isOpen = false;
            if (typeof this.options.onClose === 'function') {
              this.options.onClose.call(this);
            }
            this.modal.close();
            return this;
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Datepicker.__proto__ || Object.getPrototypeOf(Datepicker), "init", this).call(this, this, els, options);
          }
        }, {
          key: "_isDate",
          value: function _isDate(obj) {
            return (/Date/.test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime())
            );
          }
        }, {
          key: "_isWeekend",
          value: function _isWeekend(date) {
            var day = date.getDay();
            return day === 0 || day === 6;
          }
        }, {
          key: "_setToStartOfDay",
          value: function _setToStartOfDay(date) {
            if (Datepicker._isDate(date)) date.setHours(0, 0, 0, 0);
          }
        }, {
          key: "_getDaysInMonth",
          value: function _getDaysInMonth(year, month) {
            return [31, Datepicker._isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
          }
        }, {
          key: "_isLeapYear",
          value: function _isLeapYear(year) {
            // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
            return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
          }
        }, {
          key: "_compareDates",
          value: function _compareDates(a, b) {
            // weak date comparison (use setToStartOfDay(date) to ensure correct result)
            return a.getTime() === b.getTime();
          }
        }, {
          key: "_setToStartOfDay",
          value: function _setToStartOfDay(date) {
            if (Datepicker._isDate(date)) date.setHours(0, 0, 0, 0);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Datepicker;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Datepicker;
      }(Component);

      Datepicker._template = ['<div class= "modal datepicker-modal">', '<div class="modal-content datepicker-container">', '<div class="datepicker-date-display">', '<span class="year-text"></span>', '<span class="date-text"></span>', '</div>', '<div class="datepicker-calendar-container">', '<div class="datepicker-calendar"></div>', '<div class="datepicker-footer">', '<button class="btn-flat datepicker-clear waves-effect" style="visibility: hidden;" type="button"></button>', '<div class="confirmation-btns">', '<button class="btn-flat datepicker-cancel waves-effect" type="button"></button>', '<button class="btn-flat datepicker-done waves-effect" type="button"></button>', '</div>', '</div>', '</div>', '</div>', '</div>'].join('');

      M.Datepicker = Datepicker;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Datepicker, 'datepicker', 'M_Datepicker');
      }
    })(cash);
    (function ($) {

      var _defaults = {
        dialRadius: 135,
        outerRadius: 105,
        innerRadius: 70,
        tickRadius: 20,
        duration: 350,
        container: null,
        defaultTime: 'now', // default time, 'now' or '13:14' e.g.
        fromNow: 0, // Millisecond offset from the defaultTime
        showClearBtn: false,

        // internationalization
        i18n: {
          cancel: 'Cancel',
          clear: 'Clear',
          done: 'Ok'
        },

        autoClose: false, // auto close when minute is selected
        twelveHour: true, // change to 12 hour AM/PM clock from 24 hour
        vibrate: true, // vibrate the device when dragging clock hand

        // Callbacks
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onSelect: null
      };

      /**
       * @class
       *
       */

      var Timepicker = function (_Component16) {
        _inherits(Timepicker, _Component16);

        function Timepicker(el, options) {
          _classCallCheck(this, Timepicker);

          var _this57 = _possibleConstructorReturn(this, (Timepicker.__proto__ || Object.getPrototypeOf(Timepicker)).call(this, Timepicker, el, options));

          _this57.el.M_Timepicker = _this57;

          _this57.options = $.extend({}, Timepicker.defaults, options);

          _this57.id = M.guid();
          _this57._insertHTMLIntoDOM();
          _this57._setupModal();
          _this57._setupVariables();
          _this57._setupEventHandlers();

          _this57._clockSetup();
          _this57._pickerSetup();
          return _this57;
        }

        _createClass(Timepicker, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.modal.destroy();
            $(this.modalEl).remove();
            this.el.M_Timepicker = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleInputKeydownBound = this._handleInputKeydown.bind(this);
            this._handleInputClickBound = this._handleInputClick.bind(this);
            this._handleClockClickStartBound = this._handleClockClickStart.bind(this);
            this._handleDocumentClickMoveBound = this._handleDocumentClickMove.bind(this);
            this._handleDocumentClickEndBound = this._handleDocumentClickEnd.bind(this);

            this.el.addEventListener('click', this._handleInputClickBound);
            this.el.addEventListener('keydown', this._handleInputKeydownBound);
            this.plate.addEventListener('mousedown', this._handleClockClickStartBound);
            this.plate.addEventListener('touchstart', this._handleClockClickStartBound);

            $(this.spanHours).on('click', this.showView.bind(this, 'hours'));
            $(this.spanMinutes).on('click', this.showView.bind(this, 'minutes'));
          }
        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('click', this._handleInputClickBound);
            this.el.removeEventListener('keydown', this._handleInputKeydownBound);
          }
        }, {
          key: "_handleInputClick",
          value: function _handleInputClick() {
            this.open();
          }
        }, {
          key: "_handleInputKeydown",
          value: function _handleInputKeydown(e) {
            if (e.which === M.keys.ENTER) {
              e.preventDefault();
              this.open();
            }
          }
        }, {
          key: "_handleClockClickStart",
          value: function _handleClockClickStart(e) {
            e.preventDefault();
            var clockPlateBR = this.plate.getBoundingClientRect();
            var offset = { x: clockPlateBR.left, y: clockPlateBR.top };

            this.x0 = offset.x + this.options.dialRadius;
            this.y0 = offset.y + this.options.dialRadius;
            this.moved = false;
            var clickPos = Timepicker._Pos(e);
            this.dx = clickPos.x - this.x0;
            this.dy = clickPos.y - this.y0;

            // Set clock hands
            this.setHand(this.dx, this.dy, false);

            // Mousemove on document
            document.addEventListener('mousemove', this._handleDocumentClickMoveBound);
            document.addEventListener('touchmove', this._handleDocumentClickMoveBound);

            // Mouseup on document
            document.addEventListener('mouseup', this._handleDocumentClickEndBound);
            document.addEventListener('touchend', this._handleDocumentClickEndBound);
          }
        }, {
          key: "_handleDocumentClickMove",
          value: function _handleDocumentClickMove(e) {
            e.preventDefault();
            var clickPos = Timepicker._Pos(e);
            var x = clickPos.x - this.x0;
            var y = clickPos.y - this.y0;
            this.moved = true;
            this.setHand(x, y, false, true);
          }
        }, {
          key: "_handleDocumentClickEnd",
          value: function _handleDocumentClickEnd(e) {
            var _this58 = this;

            e.preventDefault();
            document.removeEventListener('mouseup', this._handleDocumentClickEndBound);
            document.removeEventListener('touchend', this._handleDocumentClickEndBound);
            var clickPos = Timepicker._Pos(e);
            var x = clickPos.x - this.x0;
            var y = clickPos.y - this.y0;
            if (this.moved && x === this.dx && y === this.dy) {
              this.setHand(x, y);
            }

            if (this.currentView === 'hours') {
              this.showView('minutes', this.options.duration / 2);
            } else if (this.options.autoClose) {
              $(this.minutesView).addClass('timepicker-dial-out');
              setTimeout(function () {
                _this58.done();
              }, this.options.duration / 2);
            }

            if (typeof this.options.onSelect === 'function') {
              this.options.onSelect.call(this, this.hours, this.minutes);
            }

            // Unbind mousemove event
            document.removeEventListener('mousemove', this._handleDocumentClickMoveBound);
            document.removeEventListener('touchmove', this._handleDocumentClickMoveBound);
          }
        }, {
          key: "_insertHTMLIntoDOM",
          value: function _insertHTMLIntoDOM() {
            this.$modalEl = $(Timepicker._template);
            this.modalEl = this.$modalEl[0];
            this.modalEl.id = 'modal-' + this.id;

            // Append popover to input by default
            var containerEl = document.querySelector(this.options.container);
            if (this.options.container && !!containerEl) {
              this.$modalEl.appendTo(containerEl);
            } else {
              this.$modalEl.insertBefore(this.el);
            }
          }
        }, {
          key: "_setupModal",
          value: function _setupModal() {
            var _this59 = this;

            this.modal = M.Modal.init(this.modalEl, {
              onOpenStart: this.options.onOpenStart,
              onOpenEnd: this.options.onOpenEnd,
              onCloseStart: this.options.onCloseStart,
              onCloseEnd: function () {
                if (typeof _this59.options.onCloseEnd === 'function') {
                  _this59.options.onCloseEnd.call(_this59);
                }
                _this59.isOpen = false;
              }
            });
          }
        }, {
          key: "_setupVariables",
          value: function _setupVariables() {
            this.currentView = 'hours';
            this.vibrate = navigator.vibrate ? 'vibrate' : navigator.webkitVibrate ? 'webkitVibrate' : null;

            this._canvas = this.modalEl.querySelector('.timepicker-canvas');
            this.plate = this.modalEl.querySelector('.timepicker-plate');

            this.hoursView = this.modalEl.querySelector('.timepicker-hours');
            this.minutesView = this.modalEl.querySelector('.timepicker-minutes');
            this.spanHours = this.modalEl.querySelector('.timepicker-span-hours');
            this.spanMinutes = this.modalEl.querySelector('.timepicker-span-minutes');
            this.spanAmPm = this.modalEl.querySelector('.timepicker-span-am-pm');
            this.footer = this.modalEl.querySelector('.timepicker-footer');
            this.amOrPm = 'PM';
          }
        }, {
          key: "_pickerSetup",
          value: function _pickerSetup() {
            var $clearBtn = $("<button class=\"btn-flat timepicker-clear waves-effect\" style=\"visibility: hidden;\" type=\"button\" tabindex=\"" + (this.options.twelveHour ? '3' : '1') + "\">" + this.options.i18n.clear + "</button>").appendTo(this.footer).on('click', this.clear.bind(this));
            if (this.options.showClearBtn) {
              $clearBtn.css({ visibility: '' });
            }

            var confirmationBtnsContainer = $('<div class="confirmation-btns"></div>');
            $('<button class="btn-flat timepicker-close waves-effect" type="button" tabindex="' + (this.options.twelveHour ? '3' : '1') + '">' + this.options.i18n.cancel + '</button>').appendTo(confirmationBtnsContainer).on('click', this.close.bind(this));
            $('<button class="btn-flat timepicker-close waves-effect" type="button" tabindex="' + (this.options.twelveHour ? '3' : '1') + '">' + this.options.i18n.done + '</button>').appendTo(confirmationBtnsContainer).on('click', this.done.bind(this));
            confirmationBtnsContainer.appendTo(this.footer);
          }
        }, {
          key: "_clockSetup",
          value: function _clockSetup() {
            if (this.options.twelveHour) {
              this.$amBtn = $('<div class="am-btn">AM</div>');
              this.$pmBtn = $('<div class="pm-btn">PM</div>');
              this.$amBtn.on('click', this._handleAmPmClick.bind(this)).appendTo(this.spanAmPm);
              this.$pmBtn.on('click', this._handleAmPmClick.bind(this)).appendTo(this.spanAmPm);
            }

            this._buildHoursView();
            this._buildMinutesView();
            this._buildSVGClock();
          }
        }, {
          key: "_buildSVGClock",
          value: function _buildSVGClock() {
            // Draw clock hands and others
            var dialRadius = this.options.dialRadius;
            var tickRadius = this.options.tickRadius;
            var diameter = dialRadius * 2;

            var svg = Timepicker._createSVGEl('svg');
            svg.setAttribute('class', 'timepicker-svg');
            svg.setAttribute('width', diameter);
            svg.setAttribute('height', diameter);
            var g = Timepicker._createSVGEl('g');
            g.setAttribute('transform', 'translate(' + dialRadius + ',' + dialRadius + ')');
            var bearing = Timepicker._createSVGEl('circle');
            bearing.setAttribute('class', 'timepicker-canvas-bearing');
            bearing.setAttribute('cx', 0);
            bearing.setAttribute('cy', 0);
            bearing.setAttribute('r', 4);
            var hand = Timepicker._createSVGEl('line');
            hand.setAttribute('x1', 0);
            hand.setAttribute('y1', 0);
            var bg = Timepicker._createSVGEl('circle');
            bg.setAttribute('class', 'timepicker-canvas-bg');
            bg.setAttribute('r', tickRadius);
            g.appendChild(hand);
            g.appendChild(bg);
            g.appendChild(bearing);
            svg.appendChild(g);
            this._canvas.appendChild(svg);

            this.hand = hand;
            this.bg = bg;
            this.bearing = bearing;
            this.g = g;
          }
        }, {
          key: "_buildHoursView",
          value: function _buildHoursView() {
            var $tick = $('<div class="timepicker-tick"></div>');
            // Hours view
            if (this.options.twelveHour) {
              for (var i = 1; i < 13; i += 1) {
                var tick = $tick.clone();
                var radian = i / 6 * Math.PI;
                var radius = this.options.outerRadius;
                tick.css({
                  left: this.options.dialRadius + Math.sin(radian) * radius - this.options.tickRadius + 'px',
                  top: this.options.dialRadius - Math.cos(radian) * radius - this.options.tickRadius + 'px'
                });
                tick.html(i === 0 ? '00' : i);
                this.hoursView.appendChild(tick[0]);
                // tick.on(mousedownEvent, mousedown);
              }
            } else {
              for (var _i2 = 0; _i2 < 24; _i2 += 1) {
                var _tick = $tick.clone();
                var _radian = _i2 / 6 * Math.PI;
                var inner = _i2 > 0 && _i2 < 13;
                var _radius = inner ? this.options.innerRadius : this.options.outerRadius;
                _tick.css({
                  left: this.options.dialRadius + Math.sin(_radian) * _radius - this.options.tickRadius + 'px',
                  top: this.options.dialRadius - Math.cos(_radian) * _radius - this.options.tickRadius + 'px'
                });
                _tick.html(_i2 === 0 ? '00' : _i2);
                this.hoursView.appendChild(_tick[0]);
                // tick.on(mousedownEvent, mousedown);
              }
            }
          }
        }, {
          key: "_buildMinutesView",
          value: function _buildMinutesView() {
            var $tick = $('<div class="timepicker-tick"></div>');
            // Minutes view
            for (var i = 0; i < 60; i += 5) {
              var tick = $tick.clone();
              var radian = i / 30 * Math.PI;
              tick.css({
                left: this.options.dialRadius + Math.sin(radian) * this.options.outerRadius - this.options.tickRadius + 'px',
                top: this.options.dialRadius - Math.cos(radian) * this.options.outerRadius - this.options.tickRadius + 'px'
              });
              tick.html(Timepicker._addLeadingZero(i));
              this.minutesView.appendChild(tick[0]);
            }
          }
        }, {
          key: "_handleAmPmClick",
          value: function _handleAmPmClick(e) {
            var $btnClicked = $(e.target);
            this.amOrPm = $btnClicked.hasClass('am-btn') ? 'AM' : 'PM';
            this._updateAmPmView();
          }
        }, {
          key: "_updateAmPmView",
          value: function _updateAmPmView() {
            if (this.options.twelveHour) {
              this.$amBtn.toggleClass('text-primary', this.amOrPm === 'AM');
              this.$pmBtn.toggleClass('text-primary', this.amOrPm === 'PM');
            }
          }
        }, {
          key: "_updateTimeFromInput",
          value: function _updateTimeFromInput() {
            // Get the time
            var value = ((this.el.value || this.options.defaultTime || '') + '').split(':');
            if (this.options.twelveHour && !(typeof value[1] === 'undefined')) {
              if (value[1].toUpperCase().indexOf('AM') > 0) {
                this.amOrPm = 'AM';
              } else {
                this.amOrPm = 'PM';
              }
              value[1] = value[1].replace('AM', '').replace('PM', '');
            }
            if (value[0] === 'now') {
              var now = new Date(+new Date() + this.options.fromNow);
              value = [now.getHours(), now.getMinutes()];
              if (this.options.twelveHour) {
                this.amOrPm = value[0] >= 12 && value[0] < 24 ? 'PM' : 'AM';
              }
            }
            this.hours = +value[0] || 0;
            this.minutes = +value[1] || 0;
            this.spanHours.innerHTML = this.hours;
            this.spanMinutes.innerHTML = Timepicker._addLeadingZero(this.minutes);

            this._updateAmPmView();
          }
        }, {
          key: "showView",
          value: function showView(view, delay) {
            if (view === 'minutes' && $(this.hoursView).css('visibility') === 'visible') ;
            var isHours = view === 'hours',
                nextView = isHours ? this.hoursView : this.minutesView,
                hideView = isHours ? this.minutesView : this.hoursView;
            this.currentView = view;

            $(this.spanHours).toggleClass('text-primary', isHours);
            $(this.spanMinutes).toggleClass('text-primary', !isHours);

            // Transition view
            hideView.classList.add('timepicker-dial-out');
            $(nextView).css('visibility', 'visible').removeClass('timepicker-dial-out');

            // Reset clock hand
            this.resetClock(delay);

            // After transitions ended
            clearTimeout(this.toggleViewTimer);
            this.toggleViewTimer = setTimeout(function () {
              $(hideView).css('visibility', 'hidden');
            }, this.options.duration);
          }
        }, {
          key: "resetClock",
          value: function resetClock(delay) {
            var view = this.currentView,
                value = this[view],
                isHours = view === 'hours',
                unit = Math.PI / (isHours ? 6 : 30),
                radian = value * unit,
                radius = isHours && value > 0 && value < 13 ? this.options.innerRadius : this.options.outerRadius,
                x = Math.sin(radian) * radius,
                y = -Math.cos(radian) * radius,
                self = this;

            if (delay) {
              $(this.canvas).addClass('timepicker-canvas-out');
              setTimeout(function () {
                $(self.canvas).removeClass('timepicker-canvas-out');
                self.setHand(x, y);
              }, delay);
            } else {
              this.setHand(x, y);
            }
          }
        }, {
          key: "setHand",
          value: function setHand(x, y, roundBy5) {
            var _this60 = this;

            var radian = Math.atan2(x, -y),
                isHours = this.currentView === 'hours',
                unit = Math.PI / (isHours || roundBy5 ? 6 : 30),
                z = Math.sqrt(x * x + y * y),
                inner = isHours && z < (this.options.outerRadius + this.options.innerRadius) / 2,
                radius = inner ? this.options.innerRadius : this.options.outerRadius;

            if (this.options.twelveHour) {
              radius = this.options.outerRadius;
            }

            // Radian should in range [0, 2PI]
            if (radian < 0) {
              radian = Math.PI * 2 + radian;
            }

            // Get the round value
            var value = Math.round(radian / unit);

            // Get the round radian
            radian = value * unit;

            // Correct the hours or minutes
            if (this.options.twelveHour) {
              if (isHours) {
                if (value === 0) value = 12;
              } else {
                if (roundBy5) value *= 5;
                if (value === 60) value = 0;
              }
            } else {
              if (isHours) {
                if (value === 12) {
                  value = 0;
                }
                value = inner ? value === 0 ? 12 : value : value === 0 ? 0 : value + 12;
              } else {
                if (roundBy5) {
                  value *= 5;
                }
                if (value === 60) {
                  value = 0;
                }
              }
            }

            // Once hours or minutes changed, vibrate the device
            if (this[this.currentView] !== value) {
              if (this.vibrate && this.options.vibrate) {
                // Do not vibrate too frequently
                if (!this.vibrateTimer) {
                  navigator[this.vibrate](10);
                  this.vibrateTimer = setTimeout(function () {
                    _this60.vibrateTimer = null;
                  }, 100);
                }
              }
            }

            this[this.currentView] = value;
            if (isHours) {
              this['spanHours'].innerHTML = value;
            } else {
              this['spanMinutes'].innerHTML = Timepicker._addLeadingZero(value);
            }

            // Set clock hand and others' position
            var cx1 = Math.sin(radian) * (radius - this.options.tickRadius),
                cy1 = -Math.cos(radian) * (radius - this.options.tickRadius),
                cx2 = Math.sin(radian) * radius,
                cy2 = -Math.cos(radian) * radius;
            this.hand.setAttribute('x2', cx1);
            this.hand.setAttribute('y2', cy1);
            this.bg.setAttribute('cx', cx2);
            this.bg.setAttribute('cy', cy2);
          }
        }, {
          key: "open",
          value: function open() {
            if (this.isOpen) {
              return;
            }

            this.isOpen = true;
            this._updateTimeFromInput();
            this.showView('hours');

            this.modal.open();
          }
        }, {
          key: "close",
          value: function close() {
            if (!this.isOpen) {
              return;
            }

            this.isOpen = false;
            this.modal.close();
          }

          /**
           * Finish timepicker selection.
           */

        }, {
          key: "done",
          value: function done(e, clearValue) {
            // Set input value
            var last = this.el.value;
            var value = clearValue ? '' : Timepicker._addLeadingZero(this.hours) + ':' + Timepicker._addLeadingZero(this.minutes);
            this.time = value;
            if (!clearValue && this.options.twelveHour) {
              value = value + " " + this.amOrPm;
            }
            this.el.value = value;

            // Trigger change event
            if (value !== last) {
              this.$el.trigger('change');
            }

            this.close();
            this.el.focus();
          }
        }, {
          key: "clear",
          value: function clear() {
            this.done(null, true);
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Timepicker.__proto__ || Object.getPrototypeOf(Timepicker), "init", this).call(this, this, els, options);
          }
        }, {
          key: "_addLeadingZero",
          value: function _addLeadingZero(num) {
            return (num < 10 ? '0' : '') + num;
          }
        }, {
          key: "_createSVGEl",
          value: function _createSVGEl(name) {
            var svgNS = 'http://www.w3.org/2000/svg';
            return document.createElementNS(svgNS, name);
          }

          /**
           * @typedef {Object} Point
           * @property {number} x The X Coordinate
           * @property {number} y The Y Coordinate
           */

          /**
           * Get x position of mouse or touch event
           * @param {Event} e
           * @return {Point} x and y location
           */

        }, {
          key: "_Pos",
          value: function _Pos(e) {
            if (e.targetTouches && e.targetTouches.length >= 1) {
              return { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
            }
            // mouse event
            return { x: e.clientX, y: e.clientY };
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Timepicker;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Timepicker;
      }(Component);

      Timepicker._template = ['<div class= "modal timepicker-modal">', '<div class="modal-content timepicker-container">', '<div class="timepicker-digital-display">', '<div class="timepicker-text-container">', '<div class="timepicker-display-column">', '<span class="timepicker-span-hours text-primary"></span>', ':', '<span class="timepicker-span-minutes"></span>', '</div>', '<div class="timepicker-display-column timepicker-display-am-pm">', '<div class="timepicker-span-am-pm"></div>', '</div>', '</div>', '</div>', '<div class="timepicker-analog-display">', '<div class="timepicker-plate">', '<div class="timepicker-canvas"></div>', '<div class="timepicker-dial timepicker-hours"></div>', '<div class="timepicker-dial timepicker-minutes timepicker-dial-out"></div>', '</div>', '<div class="timepicker-footer"></div>', '</div>', '</div>', '</div>'].join('');

      M.Timepicker = Timepicker;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Timepicker, 'timepicker', 'M_Timepicker');
      }
    })(cash);
    (function ($) {

      var _defaults = {};

      /**
       * @class
       *
       */

      var CharacterCounter = function (_Component17) {
        _inherits(CharacterCounter, _Component17);

        /**
         * Construct CharacterCounter instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function CharacterCounter(el, options) {
          _classCallCheck(this, CharacterCounter);

          var _this61 = _possibleConstructorReturn(this, (CharacterCounter.__proto__ || Object.getPrototypeOf(CharacterCounter)).call(this, CharacterCounter, el, options));

          _this61.el.M_CharacterCounter = _this61;

          /**
           * Options for the character counter
           */
          _this61.options = $.extend({}, CharacterCounter.defaults, options);

          _this61.isInvalid = false;
          _this61.isValidLength = false;
          _this61._setupCounter();
          _this61._setupEventHandlers();
          return _this61;
        }

        _createClass(CharacterCounter, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.el.CharacterCounter = undefined;
            this._removeCounter();
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleUpdateCounterBound = this.updateCounter.bind(this);

            this.el.addEventListener('focus', this._handleUpdateCounterBound, true);
            this.el.addEventListener('input', this._handleUpdateCounterBound, true);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('focus', this._handleUpdateCounterBound, true);
            this.el.removeEventListener('input', this._handleUpdateCounterBound, true);
          }

          /**
           * Setup counter element
           */

        }, {
          key: "_setupCounter",
          value: function _setupCounter() {
            this.counterEl = document.createElement('span');
            $(this.counterEl).addClass('character-counter').css({
              float: 'right',
              'font-size': '12px',
              height: 1
            });

            this.$el.parent().append(this.counterEl);
          }

          /**
           * Remove counter element
           */

        }, {
          key: "_removeCounter",
          value: function _removeCounter() {
            $(this.counterEl).remove();
          }

          /**
           * Update counter
           */

        }, {
          key: "updateCounter",
          value: function updateCounter() {
            var maxLength = +this.$el.attr('data-length'),
                actualLength = this.el.value.length;
            this.isValidLength = actualLength <= maxLength;
            var counterString = actualLength;

            if (maxLength) {
              counterString += '/' + maxLength;
              this._validateInput();
            }

            $(this.counterEl).html(counterString);
          }

          /**
           * Add validation classes
           */

        }, {
          key: "_validateInput",
          value: function _validateInput() {
            if (this.isValidLength && this.isInvalid) {
              this.isInvalid = false;
              this.$el.removeClass('invalid');
            } else if (!this.isValidLength && !this.isInvalid) {
              this.isInvalid = true;
              this.$el.removeClass('valid');
              this.$el.addClass('invalid');
            }
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(CharacterCounter.__proto__ || Object.getPrototypeOf(CharacterCounter), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_CharacterCounter;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return CharacterCounter;
      }(Component);

      M.CharacterCounter = CharacterCounter;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(CharacterCounter, 'characterCounter', 'M_CharacterCounter');
      }
    })(cash);
    (function ($) {

      var _defaults = {
        duration: 200, // ms
        dist: -100, // zoom scale TODO: make this more intuitive as an option
        shift: 0, // spacing for center image
        padding: 0, // Padding between non center items
        numVisible: 5, // Number of visible items in carousel
        fullWidth: false, // Change to full width styles
        indicators: false, // Toggle indicators
        noWrap: false, // Don't wrap around and cycle through items.
        onCycleTo: null // Callback for when a new slide is cycled to.
      };

      /**
       * @class
       *
       */

      var Carousel = function (_Component18) {
        _inherits(Carousel, _Component18);

        /**
         * Construct Carousel instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Carousel(el, options) {
          _classCallCheck(this, Carousel);

          var _this62 = _possibleConstructorReturn(this, (Carousel.__proto__ || Object.getPrototypeOf(Carousel)).call(this, Carousel, el, options));

          _this62.el.M_Carousel = _this62;

          /**
           * Options for the carousel
           * @member Carousel#options
           * @prop {Number} duration
           * @prop {Number} dist
           * @prop {Number} shift
           * @prop {Number} padding
           * @prop {Number} numVisible
           * @prop {Boolean} fullWidth
           * @prop {Boolean} indicators
           * @prop {Boolean} noWrap
           * @prop {Function} onCycleTo
           */
          _this62.options = $.extend({}, Carousel.defaults, options);

          // Setup
          _this62.hasMultipleSlides = _this62.$el.find('.carousel-item').length > 1;
          _this62.showIndicators = _this62.options.indicators && _this62.hasMultipleSlides;
          _this62.noWrap = _this62.options.noWrap || !_this62.hasMultipleSlides;
          _this62.pressed = false;
          _this62.dragged = false;
          _this62.offset = _this62.target = 0;
          _this62.images = [];
          _this62.itemWidth = _this62.$el.find('.carousel-item').first().innerWidth();
          _this62.itemHeight = _this62.$el.find('.carousel-item').first().innerHeight();
          _this62.dim = _this62.itemWidth * 2 + _this62.options.padding || 1; // Make sure dim is non zero for divisions.
          _this62._autoScrollBound = _this62._autoScroll.bind(_this62);
          _this62._trackBound = _this62._track.bind(_this62);

          // Full Width carousel setup
          if (_this62.options.fullWidth) {
            _this62.options.dist = 0;
            _this62._setCarouselHeight();

            // Offset fixed items when indicators.
            if (_this62.showIndicators) {
              _this62.$el.find('.carousel-fixed-item').addClass('with-indicators');
            }
          }

          // Iterate through slides
          _this62.$indicators = $('<ul class="indicators"></ul>');
          _this62.$el.find('.carousel-item').each(function (el, i) {
            _this62.images.push(el);
            if (_this62.showIndicators) {
              var $indicator = $('<li class="indicator-item"></li>');

              // Add active to first by default.
              if (i === 0) {
                $indicator[0].classList.add('active');
              }

              _this62.$indicators.append($indicator);
            }
          });
          if (_this62.showIndicators) {
            _this62.$el.append(_this62.$indicators);
          }
          _this62.count = _this62.images.length;

          // Cap numVisible at count
          _this62.options.numVisible = Math.min(_this62.count, _this62.options.numVisible);

          // Setup cross browser string
          _this62.xform = 'transform';
          ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
            var e = prefix + 'Transform';
            if (typeof document.body.style[e] !== 'undefined') {
              _this62.xform = e;
              return false;
            }
            return true;
          });

          _this62._setupEventHandlers();
          _this62._scroll(_this62.offset);
          return _this62;
        }

        _createClass(Carousel, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.el.M_Carousel = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            var _this63 = this;

            this._handleCarouselTapBound = this._handleCarouselTap.bind(this);
            this._handleCarouselDragBound = this._handleCarouselDrag.bind(this);
            this._handleCarouselReleaseBound = this._handleCarouselRelease.bind(this);
            this._handleCarouselClickBound = this._handleCarouselClick.bind(this);

            if (typeof window.ontouchstart !== 'undefined') {
              this.el.addEventListener('touchstart', this._handleCarouselTapBound);
              this.el.addEventListener('touchmove', this._handleCarouselDragBound);
              this.el.addEventListener('touchend', this._handleCarouselReleaseBound);
            }

            this.el.addEventListener('mousedown', this._handleCarouselTapBound);
            this.el.addEventListener('mousemove', this._handleCarouselDragBound);
            this.el.addEventListener('mouseup', this._handleCarouselReleaseBound);
            this.el.addEventListener('mouseleave', this._handleCarouselReleaseBound);
            this.el.addEventListener('click', this._handleCarouselClickBound);

            if (this.showIndicators && this.$indicators) {
              this._handleIndicatorClickBound = this._handleIndicatorClick.bind(this);
              this.$indicators.find('.indicator-item').each(function (el, i) {
                el.addEventListener('click', _this63._handleIndicatorClickBound);
              });
            }

            // Resize
            var throttledResize = M.throttle(this._handleResize, 200);
            this._handleThrottledResizeBound = throttledResize.bind(this);

            window.addEventListener('resize', this._handleThrottledResizeBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            var _this64 = this;

            if (typeof window.ontouchstart !== 'undefined') {
              this.el.removeEventListener('touchstart', this._handleCarouselTapBound);
              this.el.removeEventListener('touchmove', this._handleCarouselDragBound);
              this.el.removeEventListener('touchend', this._handleCarouselReleaseBound);
            }
            this.el.removeEventListener('mousedown', this._handleCarouselTapBound);
            this.el.removeEventListener('mousemove', this._handleCarouselDragBound);
            this.el.removeEventListener('mouseup', this._handleCarouselReleaseBound);
            this.el.removeEventListener('mouseleave', this._handleCarouselReleaseBound);
            this.el.removeEventListener('click', this._handleCarouselClickBound);

            if (this.showIndicators && this.$indicators) {
              this.$indicators.find('.indicator-item').each(function (el, i) {
                el.removeEventListener('click', _this64._handleIndicatorClickBound);
              });
            }

            window.removeEventListener('resize', this._handleThrottledResizeBound);
          }

          /**
           * Handle Carousel Tap
           * @param {Event} e
           */

        }, {
          key: "_handleCarouselTap",
          value: function _handleCarouselTap(e) {
            // Fixes firefox draggable image bug
            if (e.type === 'mousedown' && $(e.target).is('img')) {
              e.preventDefault();
            }
            this.pressed = true;
            this.dragged = false;
            this.verticalDragged = false;
            this.reference = this._xpos(e);
            this.referenceY = this._ypos(e);

            this.velocity = this.amplitude = 0;
            this.frame = this.offset;
            this.timestamp = Date.now();
            clearInterval(this.ticker);
            this.ticker = setInterval(this._trackBound, 100);
          }

          /**
           * Handle Carousel Drag
           * @param {Event} e
           */

        }, {
          key: "_handleCarouselDrag",
          value: function _handleCarouselDrag(e) {
            var x = void 0,
                y = void 0,
                delta = void 0,
                deltaY = void 0;
            if (this.pressed) {
              x = this._xpos(e);
              y = this._ypos(e);
              delta = this.reference - x;
              deltaY = Math.abs(this.referenceY - y);
              if (deltaY < 30 && !this.verticalDragged) {
                // If vertical scrolling don't allow dragging.
                if (delta > 2 || delta < -2) {
                  this.dragged = true;
                  this.reference = x;
                  this._scroll(this.offset + delta);
                }
              } else if (this.dragged) {
                // If dragging don't allow vertical scroll.
                e.preventDefault();
                e.stopPropagation();
                return false;
              } else {
                // Vertical scrolling.
                this.verticalDragged = true;
              }
            }

            if (this.dragged) {
              // If dragging don't allow vertical scroll.
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }

          /**
           * Handle Carousel Release
           * @param {Event} e
           */

        }, {
          key: "_handleCarouselRelease",
          value: function _handleCarouselRelease(e) {
            if (this.pressed) {
              this.pressed = false;
            } else {
              return;
            }

            clearInterval(this.ticker);
            this.target = this.offset;
            if (this.velocity > 10 || this.velocity < -10) {
              this.amplitude = 0.9 * this.velocity;
              this.target = this.offset + this.amplitude;
            }
            this.target = Math.round(this.target / this.dim) * this.dim;

            // No wrap of items.
            if (this.noWrap) {
              if (this.target >= this.dim * (this.count - 1)) {
                this.target = this.dim * (this.count - 1);
              } else if (this.target < 0) {
                this.target = 0;
              }
            }
            this.amplitude = this.target - this.offset;
            this.timestamp = Date.now();
            requestAnimationFrame(this._autoScrollBound);

            if (this.dragged) {
              e.preventDefault();
              e.stopPropagation();
            }
            return false;
          }

          /**
           * Handle Carousel CLick
           * @param {Event} e
           */

        }, {
          key: "_handleCarouselClick",
          value: function _handleCarouselClick(e) {
            // Disable clicks if carousel was dragged.
            if (this.dragged) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            } else if (!this.options.fullWidth) {
              var clickedIndex = $(e.target).closest('.carousel-item').index();
              var diff = this._wrap(this.center) - clickedIndex;

              // Disable clicks if carousel was shifted by click
              if (diff !== 0) {
                e.preventDefault();
                e.stopPropagation();
              }
              this._cycleTo(clickedIndex);
            }
          }

          /**
           * Handle Indicator CLick
           * @param {Event} e
           */

        }, {
          key: "_handleIndicatorClick",
          value: function _handleIndicatorClick(e) {
            e.stopPropagation();

            var indicator = $(e.target).closest('.indicator-item');
            if (indicator.length) {
              this._cycleTo(indicator.index());
            }
          }

          /**
           * Handle Throttle Resize
           * @param {Event} e
           */

        }, {
          key: "_handleResize",
          value: function _handleResize(e) {
            if (this.options.fullWidth) {
              this.itemWidth = this.$el.find('.carousel-item').first().innerWidth();
              this.imageHeight = this.$el.find('.carousel-item.active').height();
              this.dim = this.itemWidth * 2 + this.options.padding;
              this.offset = this.center * 2 * this.itemWidth;
              this.target = this.offset;
              this._setCarouselHeight(true);
            } else {
              this._scroll();
            }
          }

          /**
           * Set carousel height based on first slide
           * @param {Booleam} imageOnly - true for image slides
           */

        }, {
          key: "_setCarouselHeight",
          value: function _setCarouselHeight(imageOnly) {
            var _this65 = this;

            var firstSlide = this.$el.find('.carousel-item.active').length ? this.$el.find('.carousel-item.active').first() : this.$el.find('.carousel-item').first();
            var firstImage = firstSlide.find('img').first();
            if (firstImage.length) {
              if (firstImage[0].complete) {
                // If image won't trigger the load event
                var imageHeight = firstImage.height();
                if (imageHeight > 0) {
                  this.$el.css('height', imageHeight + 'px');
                } else {
                  // If image still has no height, use the natural dimensions to calculate
                  var naturalWidth = firstImage[0].naturalWidth;
                  var naturalHeight = firstImage[0].naturalHeight;
                  var adjustedHeight = this.$el.width() / naturalWidth * naturalHeight;
                  this.$el.css('height', adjustedHeight + 'px');
                }
              } else {
                // Get height when image is loaded normally
                firstImage.one('load', function (el, i) {
                  _this65.$el.css('height', el.offsetHeight + 'px');
                });
              }
            } else if (!imageOnly) {
              var slideHeight = firstSlide.height();
              this.$el.css('height', slideHeight + 'px');
            }
          }

          /**
           * Get x position from event
           * @param {Event} e
           */

        }, {
          key: "_xpos",
          value: function _xpos(e) {
            // touch event
            if (e.targetTouches && e.targetTouches.length >= 1) {
              return e.targetTouches[0].clientX;
            }

            // mouse event
            return e.clientX;
          }

          /**
           * Get y position from event
           * @param {Event} e
           */

        }, {
          key: "_ypos",
          value: function _ypos(e) {
            // touch event
            if (e.targetTouches && e.targetTouches.length >= 1) {
              return e.targetTouches[0].clientY;
            }

            // mouse event
            return e.clientY;
          }

          /**
           * Wrap index
           * @param {Number} x
           */

        }, {
          key: "_wrap",
          value: function _wrap(x) {
            return x >= this.count ? x % this.count : x < 0 ? this._wrap(this.count + x % this.count) : x;
          }

          /**
           * Tracks scrolling information
           */

        }, {
          key: "_track",
          value: function _track() {
            var now = void 0,
                elapsed = void 0,
                delta = void 0,
                v = void 0;

            now = Date.now();
            elapsed = now - this.timestamp;
            this.timestamp = now;
            delta = this.offset - this.frame;
            this.frame = this.offset;

            v = 1000 * delta / (1 + elapsed);
            this.velocity = 0.8 * v + 0.2 * this.velocity;
          }

          /**
           * Auto scrolls to nearest carousel item.
           */

        }, {
          key: "_autoScroll",
          value: function _autoScroll() {
            var elapsed = void 0,
                delta = void 0;

            if (this.amplitude) {
              elapsed = Date.now() - this.timestamp;
              delta = this.amplitude * Math.exp(-elapsed / this.options.duration);
              if (delta > 2 || delta < -2) {
                this._scroll(this.target - delta);
                requestAnimationFrame(this._autoScrollBound);
              } else {
                this._scroll(this.target);
              }
            }
          }

          /**
           * Scroll to target
           * @param {Number} x
           */

        }, {
          key: "_scroll",
          value: function _scroll(x) {
            var _this66 = this;

            // Track scrolling state
            if (!this.$el.hasClass('scrolling')) {
              this.el.classList.add('scrolling');
            }
            if (this.scrollingTimeout != null) {
              window.clearTimeout(this.scrollingTimeout);
            }
            this.scrollingTimeout = window.setTimeout(function () {
              _this66.$el.removeClass('scrolling');
            }, this.options.duration);

            // Start actual scroll
            var i = void 0,
                half = void 0,
                delta = void 0,
                dir = void 0,
                tween = void 0,
                el = void 0,
                alignment = void 0,
                zTranslation = void 0,
                tweenedOpacity = void 0,
                centerTweenedOpacity = void 0;
            var lastCenter = this.center;
            var numVisibleOffset = 1 / this.options.numVisible;

            this.offset = typeof x === 'number' ? x : this.offset;
            this.center = Math.floor((this.offset + this.dim / 2) / this.dim);
            delta = this.offset - this.center * this.dim;
            dir = delta < 0 ? 1 : -1;
            tween = -dir * delta * 2 / this.dim;
            half = this.count >> 1;

            if (this.options.fullWidth) {
              alignment = 'translateX(0)';
              centerTweenedOpacity = 1;
            } else {
              alignment = 'translateX(' + (this.el.clientWidth - this.itemWidth) / 2 + 'px) ';
              alignment += 'translateY(' + (this.el.clientHeight - this.itemHeight) / 2 + 'px)';
              centerTweenedOpacity = 1 - numVisibleOffset * tween;
            }

            // Set indicator active
            if (this.showIndicators) {
              var diff = this.center % this.count;
              var activeIndicator = this.$indicators.find('.indicator-item.active');
              if (activeIndicator.index() !== diff) {
                activeIndicator.removeClass('active');
                this.$indicators.find('.indicator-item').eq(diff)[0].classList.add('active');
              }
            }

            // center
            // Don't show wrapped items.
            if (!this.noWrap || this.center >= 0 && this.center < this.count) {
              el = this.images[this._wrap(this.center)];

              // Add active class to center item.
              if (!$(el).hasClass('active')) {
                this.$el.find('.carousel-item').removeClass('active');
                el.classList.add('active');
              }
              var transformString = alignment + " translateX(" + -delta / 2 + "px) translateX(" + dir * this.options.shift * tween * i + "px) translateZ(" + this.options.dist * tween + "px)";
              this._updateItemStyle(el, centerTweenedOpacity, 0, transformString);
            }

            for (i = 1; i <= half; ++i) {
              // right side
              if (this.options.fullWidth) {
                zTranslation = this.options.dist;
                tweenedOpacity = i === half && delta < 0 ? 1 - tween : 1;
              } else {
                zTranslation = this.options.dist * (i * 2 + tween * dir);
                tweenedOpacity = 1 - numVisibleOffset * (i * 2 + tween * dir);
              }
              // Don't show wrapped items.
              if (!this.noWrap || this.center + i < this.count) {
                el = this.images[this._wrap(this.center + i)];
                var _transformString = alignment + " translateX(" + (this.options.shift + (this.dim * i - delta) / 2) + "px) translateZ(" + zTranslation + "px)";
                this._updateItemStyle(el, tweenedOpacity, -i, _transformString);
              }

              // left side
              if (this.options.fullWidth) {
                zTranslation = this.options.dist;
                tweenedOpacity = i === half && delta > 0 ? 1 - tween : 1;
              } else {
                zTranslation = this.options.dist * (i * 2 - tween * dir);
                tweenedOpacity = 1 - numVisibleOffset * (i * 2 - tween * dir);
              }
              // Don't show wrapped items.
              if (!this.noWrap || this.center - i >= 0) {
                el = this.images[this._wrap(this.center - i)];
                var _transformString2 = alignment + " translateX(" + (-this.options.shift + (-this.dim * i - delta) / 2) + "px) translateZ(" + zTranslation + "px)";
                this._updateItemStyle(el, tweenedOpacity, -i, _transformString2);
              }
            }

            // center
            // Don't show wrapped items.
            if (!this.noWrap || this.center >= 0 && this.center < this.count) {
              el = this.images[this._wrap(this.center)];
              var _transformString3 = alignment + " translateX(" + -delta / 2 + "px) translateX(" + dir * this.options.shift * tween + "px) translateZ(" + this.options.dist * tween + "px)";
              this._updateItemStyle(el, centerTweenedOpacity, 0, _transformString3);
            }

            // onCycleTo callback
            var $currItem = this.$el.find('.carousel-item').eq(this._wrap(this.center));
            if (lastCenter !== this.center && typeof this.options.onCycleTo === 'function') {
              this.options.onCycleTo.call(this, $currItem[0], this.dragged);
            }

            // One time callback
            if (typeof this.oneTimeCallback === 'function') {
              this.oneTimeCallback.call(this, $currItem[0], this.dragged);
              this.oneTimeCallback = null;
            }
          }

          /**
           * Cycle to target
           * @param {Element} el
           * @param {Number} opacity
           * @param {Number} zIndex
           * @param {String} transform
           */

        }, {
          key: "_updateItemStyle",
          value: function _updateItemStyle(el, opacity, zIndex, transform) {
            el.style[this.xform] = transform;
            el.style.zIndex = zIndex;
            el.style.opacity = opacity;
            el.style.visibility = 'visible';
          }

          /**
           * Cycle to target
           * @param {Number} n
           * @param {Function} callback
           */

        }, {
          key: "_cycleTo",
          value: function _cycleTo(n, callback) {
            var diff = this.center % this.count - n;

            // Account for wraparound.
            if (!this.noWrap) {
              if (diff < 0) {
                if (Math.abs(diff + this.count) < Math.abs(diff)) {
                  diff += this.count;
                }
              } else if (diff > 0) {
                if (Math.abs(diff - this.count) < diff) {
                  diff -= this.count;
                }
              }
            }

            this.target = this.dim * Math.round(this.offset / this.dim);
            // Next
            if (diff < 0) {
              this.target += this.dim * Math.abs(diff);

              // Prev
            } else if (diff > 0) {
              this.target -= this.dim * diff;
            }

            // Set one time callback
            if (typeof callback === 'function') {
              this.oneTimeCallback = callback;
            }

            // Scroll
            if (this.offset !== this.target) {
              this.amplitude = this.target - this.offset;
              this.timestamp = Date.now();
              requestAnimationFrame(this._autoScrollBound);
            }
          }

          /**
           * Cycle to next item
           * @param {Number} [n]
           */

        }, {
          key: "next",
          value: function next(n) {
            if (n === undefined || isNaN(n)) {
              n = 1;
            }

            var index = this.center + n;
            if (index >= this.count || index < 0) {
              if (this.noWrap) {
                return;
              }

              index = this._wrap(index);
            }
            this._cycleTo(index);
          }

          /**
           * Cycle to previous item
           * @param {Number} [n]
           */

        }, {
          key: "prev",
          value: function prev(n) {
            if (n === undefined || isNaN(n)) {
              n = 1;
            }

            var index = this.center - n;
            if (index >= this.count || index < 0) {
              if (this.noWrap) {
                return;
              }

              index = this._wrap(index);
            }

            this._cycleTo(index);
          }

          /**
           * Cycle to nth item
           * @param {Number} [n]
           * @param {Function} callback
           */

        }, {
          key: "set",
          value: function set(n, callback) {
            if (n === undefined || isNaN(n)) {
              n = 0;
            }

            if (n > this.count || n < 0) {
              if (this.noWrap) {
                return;
              }

              n = this._wrap(n);
            }

            this._cycleTo(n, callback);
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Carousel.__proto__ || Object.getPrototypeOf(Carousel), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Carousel;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Carousel;
      }(Component);

      M.Carousel = Carousel;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Carousel, 'carousel', 'M_Carousel');
      }
    })(cash);
    (function ($) {

      var _defaults = {
        onOpen: undefined,
        onClose: undefined
      };

      /**
       * @class
       *
       */

      var TapTarget = function (_Component19) {
        _inherits(TapTarget, _Component19);

        /**
         * Construct TapTarget instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function TapTarget(el, options) {
          _classCallCheck(this, TapTarget);

          var _this67 = _possibleConstructorReturn(this, (TapTarget.__proto__ || Object.getPrototypeOf(TapTarget)).call(this, TapTarget, el, options));

          _this67.el.M_TapTarget = _this67;

          /**
           * Options for the select
           * @member TapTarget#options
           * @prop {Function} onOpen - Callback function called when feature discovery is opened
           * @prop {Function} onClose - Callback function called when feature discovery is closed
           */
          _this67.options = $.extend({}, TapTarget.defaults, options);

          _this67.isOpen = false;

          // setup
          _this67.$origin = $('#' + _this67.$el.attr('data-target'));
          _this67._setup();

          _this67._calculatePositioning();
          _this67._setupEventHandlers();
          return _this67;
        }

        _createClass(TapTarget, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this.el.TapTarget = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleDocumentClickBound = this._handleDocumentClick.bind(this);
            this._handleTargetClickBound = this._handleTargetClick.bind(this);
            this._handleOriginClickBound = this._handleOriginClick.bind(this);

            this.el.addEventListener('click', this._handleTargetClickBound);
            this.originEl.addEventListener('click', this._handleOriginClickBound);

            // Resize
            var throttledResize = M.throttle(this._handleResize, 200);
            this._handleThrottledResizeBound = throttledResize.bind(this);

            window.addEventListener('resize', this._handleThrottledResizeBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('click', this._handleTargetClickBound);
            this.originEl.removeEventListener('click', this._handleOriginClickBound);
            window.removeEventListener('resize', this._handleThrottledResizeBound);
          }

          /**
           * Handle Target Click
           * @param {Event} e
           */

        }, {
          key: "_handleTargetClick",
          value: function _handleTargetClick(e) {
            this.open();
          }

          /**
           * Handle Origin Click
           * @param {Event} e
           */

        }, {
          key: "_handleOriginClick",
          value: function _handleOriginClick(e) {
            this.close();
          }

          /**
           * Handle Resize
           * @param {Event} e
           */

        }, {
          key: "_handleResize",
          value: function _handleResize(e) {
            this._calculatePositioning();
          }

          /**
           * Handle Resize
           * @param {Event} e
           */

        }, {
          key: "_handleDocumentClick",
          value: function _handleDocumentClick(e) {
            if (!$(e.target).closest('.tap-target-wrapper').length) {
              this.close();
              e.preventDefault();
              e.stopPropagation();
            }
          }

          /**
           * Setup Tap Target
           */

        }, {
          key: "_setup",
          value: function _setup() {
            // Creating tap target
            this.wrapper = this.$el.parent()[0];
            this.waveEl = $(this.wrapper).find('.tap-target-wave')[0];
            this.originEl = $(this.wrapper).find('.tap-target-origin')[0];
            this.contentEl = this.$el.find('.tap-target-content')[0];

            // Creating wrapper
            if (!$(this.wrapper).hasClass('.tap-target-wrapper')) {
              this.wrapper = document.createElement('div');
              this.wrapper.classList.add('tap-target-wrapper');
              this.$el.before($(this.wrapper));
              this.wrapper.append(this.el);
            }

            // Creating content
            if (!this.contentEl) {
              this.contentEl = document.createElement('div');
              this.contentEl.classList.add('tap-target-content');
              this.$el.append(this.contentEl);
            }

            // Creating foreground wave
            if (!this.waveEl) {
              this.waveEl = document.createElement('div');
              this.waveEl.classList.add('tap-target-wave');

              // Creating origin
              if (!this.originEl) {
                this.originEl = this.$origin.clone(true, true);
                this.originEl.addClass('tap-target-origin');
                this.originEl.removeAttr('id');
                this.originEl.removeAttr('style');
                this.originEl = this.originEl[0];
                this.waveEl.append(this.originEl);
              }

              this.wrapper.append(this.waveEl);
            }
          }

          /**
           * Calculate positioning
           */

        }, {
          key: "_calculatePositioning",
          value: function _calculatePositioning() {
            // Element or parent is fixed position?
            var isFixed = this.$origin.css('position') === 'fixed';
            if (!isFixed) {
              var parents = this.$origin.parents();
              for (var i = 0; i < parents.length; i++) {
                isFixed = $(parents[i]).css('position') == 'fixed';
                if (isFixed) {
                  break;
                }
              }
            }

            // Calculating origin
            var originWidth = this.$origin.outerWidth();
            var originHeight = this.$origin.outerHeight();
            var originTop = isFixed ? this.$origin.offset().top - M.getDocumentScrollTop() : this.$origin.offset().top;
            var originLeft = isFixed ? this.$origin.offset().left - M.getDocumentScrollLeft() : this.$origin.offset().left;

            // Calculating screen
            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;
            var centerX = windowWidth / 2;
            var centerY = windowHeight / 2;
            var isLeft = originLeft <= centerX;
            var isRight = originLeft > centerX;
            var isTop = originTop <= centerY;
            var isBottom = originTop > centerY;
            var isCenterX = originLeft >= windowWidth * 0.25 && originLeft <= windowWidth * 0.75;

            // Calculating tap target
            var tapTargetWidth = this.$el.outerWidth();
            var tapTargetHeight = this.$el.outerHeight();
            var tapTargetTop = originTop + originHeight / 2 - tapTargetHeight / 2;
            var tapTargetLeft = originLeft + originWidth / 2 - tapTargetWidth / 2;
            var tapTargetPosition = isFixed ? 'fixed' : 'absolute';

            // Calculating content
            var tapTargetTextWidth = isCenterX ? tapTargetWidth : tapTargetWidth / 2 + originWidth;
            var tapTargetTextHeight = tapTargetHeight / 2;
            var tapTargetTextTop = isTop ? tapTargetHeight / 2 : 0;
            var tapTargetTextBottom = 0;
            var tapTargetTextLeft = isLeft && !isCenterX ? tapTargetWidth / 2 - originWidth : 0;
            var tapTargetTextRight = 0;
            var tapTargetTextPadding = originWidth;
            var tapTargetTextAlign = isBottom ? 'bottom' : 'top';

            // Calculating wave
            var tapTargetWaveWidth = originWidth > originHeight ? originWidth * 2 : originWidth * 2;
            var tapTargetWaveHeight = tapTargetWaveWidth;
            var tapTargetWaveTop = tapTargetHeight / 2 - tapTargetWaveHeight / 2;
            var tapTargetWaveLeft = tapTargetWidth / 2 - tapTargetWaveWidth / 2;

            // Setting tap target
            var tapTargetWrapperCssObj = {};
            tapTargetWrapperCssObj.top = isTop ? tapTargetTop + 'px' : '';
            tapTargetWrapperCssObj.right = isRight ? windowWidth - tapTargetLeft - tapTargetWidth + 'px' : '';
            tapTargetWrapperCssObj.bottom = isBottom ? windowHeight - tapTargetTop - tapTargetHeight + 'px' : '';
            tapTargetWrapperCssObj.left = isLeft ? tapTargetLeft + 'px' : '';
            tapTargetWrapperCssObj.position = tapTargetPosition;
            $(this.wrapper).css(tapTargetWrapperCssObj);

            // Setting content
            $(this.contentEl).css({
              width: tapTargetTextWidth + 'px',
              height: tapTargetTextHeight + 'px',
              top: tapTargetTextTop + 'px',
              right: tapTargetTextRight + 'px',
              bottom: tapTargetTextBottom + 'px',
              left: tapTargetTextLeft + 'px',
              padding: tapTargetTextPadding + 'px',
              verticalAlign: tapTargetTextAlign
            });

            // Setting wave
            $(this.waveEl).css({
              top: tapTargetWaveTop + 'px',
              left: tapTargetWaveLeft + 'px',
              width: tapTargetWaveWidth + 'px',
              height: tapTargetWaveHeight + 'px'
            });
          }

          /**
           * Open TapTarget
           */

        }, {
          key: "open",
          value: function open() {
            if (this.isOpen) {
              return;
            }

            // onOpen callback
            if (typeof this.options.onOpen === 'function') {
              this.options.onOpen.call(this, this.$origin[0]);
            }

            this.isOpen = true;
            this.wrapper.classList.add('open');

            document.body.addEventListener('click', this._handleDocumentClickBound, true);
            document.body.addEventListener('touchend', this._handleDocumentClickBound);
          }

          /**
           * Close Tap Target
           */

        }, {
          key: "close",
          value: function close() {
            if (!this.isOpen) {
              return;
            }

            // onClose callback
            if (typeof this.options.onClose === 'function') {
              this.options.onClose.call(this, this.$origin[0]);
            }

            this.isOpen = false;
            this.wrapper.classList.remove('open');

            document.body.removeEventListener('click', this._handleDocumentClickBound, true);
            document.body.removeEventListener('touchend', this._handleDocumentClickBound);
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(TapTarget.__proto__ || Object.getPrototypeOf(TapTarget), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_TapTarget;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return TapTarget;
      }(Component);

      M.TapTarget = TapTarget;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(TapTarget, 'tapTarget', 'M_TapTarget');
      }
    })(cash);
    (function ($) {

      var _defaults = {
        classes: '',
        dropdownOptions: {}
      };

      /**
       * @class
       *
       */

      var FormSelect = function (_Component20) {
        _inherits(FormSelect, _Component20);

        /**
         * Construct FormSelect instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function FormSelect(el, options) {
          _classCallCheck(this, FormSelect);

          // Don't init if browser default version
          var _this68 = _possibleConstructorReturn(this, (FormSelect.__proto__ || Object.getPrototypeOf(FormSelect)).call(this, FormSelect, el, options));

          if (_this68.$el.hasClass('browser-default')) {
            return _possibleConstructorReturn(_this68);
          }

          _this68.el.M_FormSelect = _this68;

          /**
           * Options for the select
           * @member FormSelect#options
           */
          _this68.options = $.extend({}, FormSelect.defaults, options);

          _this68.isMultiple = _this68.$el.prop('multiple');

          // Setup
          _this68.el.tabIndex = -1;
          _this68._keysSelected = {};
          _this68._valueDict = {}; // Maps key to original and generated option element.
          _this68._setupDropdown();

          _this68._setupEventHandlers();
          return _this68;
        }

        _createClass(FormSelect, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this._removeDropdown();
            this.el.M_FormSelect = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            var _this69 = this;

            this._handleSelectChangeBound = this._handleSelectChange.bind(this);
            this._handleOptionClickBound = this._handleOptionClick.bind(this);
            this._handleInputClickBound = this._handleInputClick.bind(this);

            $(this.dropdownOptions).find('li:not(.optgroup)').each(function (el) {
              el.addEventListener('click', _this69._handleOptionClickBound);
            });
            this.el.addEventListener('change', this._handleSelectChangeBound);
            this.input.addEventListener('click', this._handleInputClickBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            var _this70 = this;

            $(this.dropdownOptions).find('li:not(.optgroup)').each(function (el) {
              el.removeEventListener('click', _this70._handleOptionClickBound);
            });
            this.el.removeEventListener('change', this._handleSelectChangeBound);
            this.input.removeEventListener('click', this._handleInputClickBound);
          }

          /**
           * Handle Select Change
           * @param {Event} e
           */

        }, {
          key: "_handleSelectChange",
          value: function _handleSelectChange(e) {
            this._setValueToInput();
          }

          /**
           * Handle Option Click
           * @param {Event} e
           */

        }, {
          key: "_handleOptionClick",
          value: function _handleOptionClick(e) {
            e.preventDefault();
            var option = $(e.target).closest('li')[0];
            var key = option.id;
            if (!$(option).hasClass('disabled') && !$(option).hasClass('optgroup') && key.length) {
              var selected = true;

              if (this.isMultiple) {
                // Deselect placeholder option if still selected.
                var placeholderOption = $(this.dropdownOptions).find('li.disabled.selected');
                if (placeholderOption.length) {
                  placeholderOption.removeClass('selected');
                  placeholderOption.find('input[type="checkbox"]').prop('checked', false);
                  this._toggleEntryFromArray(placeholderOption[0].id);
                }
                selected = this._toggleEntryFromArray(key);
              } else {
                $(this.dropdownOptions).find('li').removeClass('selected');
                $(option).toggleClass('selected', selected);
              }

              // Set selected on original select option
              // Only trigger if selected state changed
              var prevSelected = $(this._valueDict[key].el).prop('selected');
              if (prevSelected !== selected) {
                $(this._valueDict[key].el).prop('selected', selected);
                this.$el.trigger('change');
              }
            }

            e.stopPropagation();
          }

          /**
           * Handle Input Click
           */

        }, {
          key: "_handleInputClick",
          value: function _handleInputClick() {
            if (this.dropdown && this.dropdown.isOpen) {
              this._setValueToInput();
              this._setSelectedStates();
            }
          }

          /**
           * Setup dropdown
           */

        }, {
          key: "_setupDropdown",
          value: function _setupDropdown() {
            var _this71 = this;

            this.wrapper = document.createElement('div');
            $(this.wrapper).addClass('select-wrapper ' + this.options.classes);
            this.$el.before($(this.wrapper));
            this.wrapper.appendChild(this.el);

            if (this.el.disabled) {
              this.wrapper.classList.add('disabled');
            }

            // Create dropdown
            this.$selectOptions = this.$el.children('option, optgroup');
            this.dropdownOptions = document.createElement('ul');
            this.dropdownOptions.id = "select-options-" + M.guid();
            $(this.dropdownOptions).addClass('dropdown-content select-dropdown ' + (this.isMultiple ? 'multiple-select-dropdown' : ''));

            // Create dropdown structure.
            if (this.$selectOptions.length) {
              this.$selectOptions.each(function (el) {
                if ($(el).is('option')) {
                  // Direct descendant option.
                  var optionEl = void 0;
                  if (_this71.isMultiple) {
                    optionEl = _this71._appendOptionWithIcon(_this71.$el, el, 'multiple');
                  } else {
                    optionEl = _this71._appendOptionWithIcon(_this71.$el, el);
                  }

                  _this71._addOptionToValueDict(el, optionEl);
                } else if ($(el).is('optgroup')) {
                  // Optgroup.
                  var selectOptions = $(el).children('option');
                  $(_this71.dropdownOptions).append($('<li class="optgroup"><span>' + el.getAttribute('label') + '</span></li>')[0]);

                  selectOptions.each(function (el) {
                    var optionEl = _this71._appendOptionWithIcon(_this71.$el, el, 'optgroup-option');
                    _this71._addOptionToValueDict(el, optionEl);
                  });
                }
              });
            }

            this.$el.after(this.dropdownOptions);

            // Add input dropdown
            this.input = document.createElement('input');
            $(this.input).addClass('select-dropdown dropdown-trigger');
            this.input.setAttribute('type', 'text');
            this.input.setAttribute('readonly', 'true');
            this.input.setAttribute('data-target', this.dropdownOptions.id);
            if (this.el.disabled) {
              $(this.input).prop('disabled', 'true');
            }

            this.$el.before(this.input);
            this._setValueToInput();

            // Add caret
            var dropdownIcon = $('<svg class="caret" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
            this.$el.before(dropdownIcon[0]);

            // Initialize dropdown
            if (!this.el.disabled) {
              var dropdownOptions = $.extend({}, this.options.dropdownOptions);

              // Add callback for centering selected option when dropdown content is scrollable
              dropdownOptions.onOpenEnd = function (el) {
                var selectedOption = $(_this71.dropdownOptions).find('.selected').first();

                if (selectedOption.length) {
                  // Focus selected option in dropdown
                  M.keyDown = true;
                  _this71.dropdown.focusedIndex = selectedOption.index();
                  _this71.dropdown._focusFocusedItem();
                  M.keyDown = false;

                  // Handle scrolling to selected option
                  if (_this71.dropdown.isScrollable) {
                    var scrollOffset = selectedOption[0].getBoundingClientRect().top - _this71.dropdownOptions.getBoundingClientRect().top; // scroll to selected option
                    scrollOffset -= _this71.dropdownOptions.clientHeight / 2; // center in dropdown
                    _this71.dropdownOptions.scrollTop = scrollOffset;
                  }
                }
              };

              if (this.isMultiple) {
                dropdownOptions.closeOnClick = false;
              }
              this.dropdown = M.Dropdown.init(this.input, dropdownOptions);
            }

            // Add initial selections
            this._setSelectedStates();
          }

          /**
           * Add option to value dict
           * @param {Element} el  original option element
           * @param {Element} optionEl  generated option element
           */

        }, {
          key: "_addOptionToValueDict",
          value: function _addOptionToValueDict(el, optionEl) {
            var index = Object.keys(this._valueDict).length;
            var key = this.dropdownOptions.id + index;
            var obj = {};
            optionEl.id = key;

            obj.el = el;
            obj.optionEl = optionEl;
            this._valueDict[key] = obj;
          }

          /**
           * Remove dropdown
           */

        }, {
          key: "_removeDropdown",
          value: function _removeDropdown() {
            $(this.wrapper).find('.caret').remove();
            $(this.input).remove();
            $(this.dropdownOptions).remove();
            $(this.wrapper).before(this.$el);
            $(this.wrapper).remove();
          }

          /**
           * Setup dropdown
           * @param {Element} select  select element
           * @param {Element} option  option element from select
           * @param {String} type
           * @return {Element}  option element added
           */

        }, {
          key: "_appendOptionWithIcon",
          value: function _appendOptionWithIcon(select, option, type) {
            // Add disabled attr if disabled
            var disabledClass = option.disabled ? 'disabled ' : '';
            var optgroupClass = type === 'optgroup-option' ? 'optgroup-option ' : '';
            var multipleCheckbox = this.isMultiple ? "<label><input type=\"checkbox\"" + disabledClass + "\"/><span>" + option.innerHTML + "</span></label>" : option.innerHTML;
            var liEl = $('<li></li>');
            var spanEl = $('<span></span>');
            spanEl.html(multipleCheckbox);
            liEl.addClass(disabledClass + " " + optgroupClass);
            liEl.append(spanEl);

            // add icons
            var iconUrl = option.getAttribute('data-icon');
            if (!!iconUrl) {
              var imgEl = $("<img alt=\"\" src=\"" + iconUrl + "\">");
              liEl.prepend(imgEl);
            }

            // Check for multiple type.
            $(this.dropdownOptions).append(liEl[0]);
            return liEl[0];
          }

          /**
           * Toggle entry from option
           * @param {String} key  Option key
           * @return {Boolean}  if entry was added or removed
           */

        }, {
          key: "_toggleEntryFromArray",
          value: function _toggleEntryFromArray(key) {
            var notAdded = !this._keysSelected.hasOwnProperty(key);
            var $optionLi = $(this._valueDict[key].optionEl);

            if (notAdded) {
              this._keysSelected[key] = true;
            } else {
              delete this._keysSelected[key];
            }

            $optionLi.toggleClass('selected', notAdded);

            // Set checkbox checked value
            $optionLi.find('input[type="checkbox"]').prop('checked', notAdded);

            // use notAdded instead of true (to detect if the option is selected or not)
            $optionLi.prop('selected', notAdded);

            return notAdded;
          }

          /**
           * Set text value to input
           */

        }, {
          key: "_setValueToInput",
          value: function _setValueToInput() {
            var values = [];
            var options = this.$el.find('option');

            options.each(function (el) {
              if ($(el).prop('selected')) {
                var text = $(el).text();
                values.push(text);
              }
            });

            if (!values.length) {
              var firstDisabled = this.$el.find('option:disabled').eq(0);
              if (firstDisabled.length && firstDisabled[0].value === '') {
                values.push(firstDisabled.text());
              }
            }

            this.input.value = values.join(', ');
          }

          /**
           * Set selected state of dropdown to match actual select element
           */

        }, {
          key: "_setSelectedStates",
          value: function _setSelectedStates() {
            this._keysSelected = {};

            for (var key in this._valueDict) {
              var option = this._valueDict[key];
              var optionIsSelected = $(option.el).prop('selected');
              $(option.optionEl).find('input[type="checkbox"]').prop('checked', optionIsSelected);
              if (optionIsSelected) {
                this._activateOption($(this.dropdownOptions), $(option.optionEl));
                this._keysSelected[key] = true;
              } else {
                $(option.optionEl).removeClass('selected');
              }
            }
          }

          /**
           * Make option as selected and scroll to selected position
           * @param {jQuery} collection  Select options jQuery element
           * @param {Element} newOption  element of the new option
           */

        }, {
          key: "_activateOption",
          value: function _activateOption(collection, newOption) {
            if (newOption) {
              if (!this.isMultiple) {
                collection.find('li.selected').removeClass('selected');
              }
              var option = $(newOption);
              option.addClass('selected');
            }
          }

          /**
           * Get Selected Values
           * @return {Array}  Array of selected values
           */

        }, {
          key: "getSelectedValues",
          value: function getSelectedValues() {
            var selectedValues = [];
            for (var key in this._keysSelected) {
              selectedValues.push(this._valueDict[key].el.value);
            }
            return selectedValues;
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(FormSelect.__proto__ || Object.getPrototypeOf(FormSelect), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_FormSelect;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return FormSelect;
      }(Component);

      M.FormSelect = FormSelect;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(FormSelect, 'formSelect', 'M_FormSelect');
      }
    })(cash);
    (function ($, anim) {

      var _defaults = {};

      /**
       * @class
       *
       */

      var Range = function (_Component21) {
        _inherits(Range, _Component21);

        /**
         * Construct Range instance
         * @constructor
         * @param {Element} el
         * @param {Object} options
         */
        function Range(el, options) {
          _classCallCheck(this, Range);

          var _this72 = _possibleConstructorReturn(this, (Range.__proto__ || Object.getPrototypeOf(Range)).call(this, Range, el, options));

          _this72.el.M_Range = _this72;

          /**
           * Options for the range
           * @member Range#options
           */
          _this72.options = $.extend({}, Range.defaults, options);

          _this72._mousedown = false;

          // Setup
          _this72._setupThumb();

          _this72._setupEventHandlers();
          return _this72;
        }

        _createClass(Range, [{
          key: "destroy",


          /**
           * Teardown component
           */
          value: function destroy() {
            this._removeEventHandlers();
            this._removeThumb();
            this.el.M_Range = undefined;
          }

          /**
           * Setup Event Handlers
           */

        }, {
          key: "_setupEventHandlers",
          value: function _setupEventHandlers() {
            this._handleRangeChangeBound = this._handleRangeChange.bind(this);
            this._handleRangeMousedownTouchstartBound = this._handleRangeMousedownTouchstart.bind(this);
            this._handleRangeInputMousemoveTouchmoveBound = this._handleRangeInputMousemoveTouchmove.bind(this);
            this._handleRangeMouseupTouchendBound = this._handleRangeMouseupTouchend.bind(this);
            this._handleRangeBlurMouseoutTouchleaveBound = this._handleRangeBlurMouseoutTouchleave.bind(this);

            this.el.addEventListener('change', this._handleRangeChangeBound);

            this.el.addEventListener('mousedown', this._handleRangeMousedownTouchstartBound);
            this.el.addEventListener('touchstart', this._handleRangeMousedownTouchstartBound);

            this.el.addEventListener('input', this._handleRangeInputMousemoveTouchmoveBound);
            this.el.addEventListener('mousemove', this._handleRangeInputMousemoveTouchmoveBound);
            this.el.addEventListener('touchmove', this._handleRangeInputMousemoveTouchmoveBound);

            this.el.addEventListener('mouseup', this._handleRangeMouseupTouchendBound);
            this.el.addEventListener('touchend', this._handleRangeMouseupTouchendBound);

            this.el.addEventListener('blur', this._handleRangeBlurMouseoutTouchleaveBound);
            this.el.addEventListener('mouseout', this._handleRangeBlurMouseoutTouchleaveBound);
            this.el.addEventListener('touchleave', this._handleRangeBlurMouseoutTouchleaveBound);
          }

          /**
           * Remove Event Handlers
           */

        }, {
          key: "_removeEventHandlers",
          value: function _removeEventHandlers() {
            this.el.removeEventListener('change', this._handleRangeChangeBound);

            this.el.removeEventListener('mousedown', this._handleRangeMousedownTouchstartBound);
            this.el.removeEventListener('touchstart', this._handleRangeMousedownTouchstartBound);

            this.el.removeEventListener('input', this._handleRangeInputMousemoveTouchmoveBound);
            this.el.removeEventListener('mousemove', this._handleRangeInputMousemoveTouchmoveBound);
            this.el.removeEventListener('touchmove', this._handleRangeInputMousemoveTouchmoveBound);

            this.el.removeEventListener('mouseup', this._handleRangeMouseupTouchendBound);
            this.el.removeEventListener('touchend', this._handleRangeMouseupTouchendBound);

            this.el.removeEventListener('blur', this._handleRangeBlurMouseoutTouchleaveBound);
            this.el.removeEventListener('mouseout', this._handleRangeBlurMouseoutTouchleaveBound);
            this.el.removeEventListener('touchleave', this._handleRangeBlurMouseoutTouchleaveBound);
          }

          /**
           * Handle Range Change
           * @param {Event} e
           */

        }, {
          key: "_handleRangeChange",
          value: function _handleRangeChange() {
            $(this.value).html(this.$el.val());

            if (!$(this.thumb).hasClass('active')) {
              this._showRangeBubble();
            }

            var offsetLeft = this._calcRangeOffset();
            $(this.thumb).addClass('active').css('left', offsetLeft + 'px');
          }

          /**
           * Handle Range Mousedown and Touchstart
           * @param {Event} e
           */

        }, {
          key: "_handleRangeMousedownTouchstart",
          value: function _handleRangeMousedownTouchstart(e) {
            // Set indicator value
            $(this.value).html(this.$el.val());

            this._mousedown = true;
            this.$el.addClass('active');

            if (!$(this.thumb).hasClass('active')) {
              this._showRangeBubble();
            }

            if (e.type !== 'input') {
              var offsetLeft = this._calcRangeOffset();
              $(this.thumb).addClass('active').css('left', offsetLeft + 'px');
            }
          }

          /**
           * Handle Range Input, Mousemove and Touchmove
           */

        }, {
          key: "_handleRangeInputMousemoveTouchmove",
          value: function _handleRangeInputMousemoveTouchmove() {
            if (this._mousedown) {
              if (!$(this.thumb).hasClass('active')) {
                this._showRangeBubble();
              }

              var offsetLeft = this._calcRangeOffset();
              $(this.thumb).addClass('active').css('left', offsetLeft + 'px');
              $(this.value).html(this.$el.val());
            }
          }

          /**
           * Handle Range Mouseup and Touchend
           */

        }, {
          key: "_handleRangeMouseupTouchend",
          value: function _handleRangeMouseupTouchend() {
            this._mousedown = false;
            this.$el.removeClass('active');
          }

          /**
           * Handle Range Blur, Mouseout and Touchleave
           */

        }, {
          key: "_handleRangeBlurMouseoutTouchleave",
          value: function _handleRangeBlurMouseoutTouchleave() {
            if (!this._mousedown) {
              var paddingLeft = parseInt(this.$el.css('padding-left'));
              var marginLeft = 7 + paddingLeft + 'px';

              if ($(this.thumb).hasClass('active')) {
                anim.remove(this.thumb);
                anim({
                  targets: this.thumb,
                  height: 0,
                  width: 0,
                  top: 10,
                  easing: 'easeOutQuad',
                  marginLeft: marginLeft,
                  duration: 100
                });
              }
              $(this.thumb).removeClass('active');
            }
          }

          /**
           * Setup dropdown
           */

        }, {
          key: "_setupThumb",
          value: function _setupThumb() {
            this.thumb = document.createElement('span');
            this.value = document.createElement('span');
            $(this.thumb).addClass('thumb');
            $(this.value).addClass('value');
            $(this.thumb).append(this.value);
            this.$el.after(this.thumb);
          }

          /**
           * Remove dropdown
           */

        }, {
          key: "_removeThumb",
          value: function _removeThumb() {
            $(this.thumb).remove();
          }

          /**
           * morph thumb into bubble
           */

        }, {
          key: "_showRangeBubble",
          value: function _showRangeBubble() {
            var paddingLeft = parseInt($(this.thumb).parent().css('padding-left'));
            var marginLeft = -7 + paddingLeft + 'px'; // TODO: fix magic number?
            anim.remove(this.thumb);
            anim({
              targets: this.thumb,
              height: 30,
              width: 30,
              top: -30,
              marginLeft: marginLeft,
              duration: 300,
              easing: 'easeOutQuint'
            });
          }

          /**
           * Calculate the offset of the thumb
           * @return {Number}  offset in pixels
           */

        }, {
          key: "_calcRangeOffset",
          value: function _calcRangeOffset() {
            var width = this.$el.width() - 15;
            var max = parseFloat(this.$el.attr('max')) || 100; // Range default max
            var min = parseFloat(this.$el.attr('min')) || 0; // Range default min
            var percent = (parseFloat(this.$el.val()) - min) / (max - min);
            return percent * width;
          }
        }], [{
          key: "init",
          value: function init(els, options) {
            return _get(Range.__proto__ || Object.getPrototypeOf(Range), "init", this).call(this, this, els, options);
          }

          /**
           * Get Instance
           */

        }, {
          key: "getInstance",
          value: function getInstance(el) {
            var domElem = !!el.jquery ? el[0] : el;
            return domElem.M_Range;
          }
        }, {
          key: "defaults",
          get: function () {
            return _defaults;
          }
        }]);

        return Range;
      }(Component);

      M.Range = Range;

      if (M.jQueryLoaded) {
        M.initializeJqueryWrapper(Range, 'range', 'M_Range');
      }

      Range.init($('input[type=range]'));
    })(cash, M.anime);
    });

    const app = new App({
    	target: document.body

    });

    M.AutoInit();

    return app;

}());
//# sourceMappingURL=bundle.js.map
