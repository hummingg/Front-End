/**
 * Author: Hummingg
 * Hgg.js，简易MVVM框架，支持：
 * h-model
 * {{}}
 * h-for
 * h-on:click
 *
 */
class Hgg {
    constructor(options) {
        this.$el = document.querySelector(options.el);
        this.$data = options.data;
        this.$methods = options.methods;
        new Observer(this.$data, this); // 数据劫持
        new Compiler(this.$el, this); // 需要this里的methods
    }
}
class Observer {
    constructor(data, vm) {
        // this.data = data;
        this.$vm = vm;
        this.observe(data);
    }
    observe(data) {
        if (!data || typeof data != 'object') {
            return;
        }
        Object.keys(data).forEach(key => {
            this.defineReactive(data, key, data[key]);
            if (typeof data[key] === 'object') {
                this.observe(data[key]); // 递归，深度劫持
            }
        });
    }
    defineReactive(obj, key, value) {
        let that = this;
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                return value;
            },
            set(newValue) {
                console.log(`key: ${key}, old: ${value}, new: ${newValue}`);
                if (newValue != value) {
                    // 更新页面
                    that.observe(newValue);
                    value = newValue;
                    if (key == 'name' || key == 'age') {
                        document.getElementById(key).value = newValue;
                    }
                    else if (key == 'people') {
                        new Compiler(document.getElementById(key), that.$vm);
                    }
                }
            }
        });
    }
}
class Compiler {
    constructor(el, vm) {
        this.$el = el;
        this.$vm = vm;
        this.$data = vm.$data;
        this.$methods = vm.$methods;
        this.compile();
    }
    compile() {
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = this.$el.firstChild) {
            fragment.appendChild(firstChild);
        }
        const newDom = this.compileTemplate(fragment);
        this.$el.appendChild(newDom);
    }
    compileTemplate(el) {
        let children = Array.from(el.childNodes); // ES2016
        let fragment = document.createDocumentFragment();
        for (let child of children) {
            let root = document.createDocumentFragment();
            if (child.nodeType === 1) {
                if (child.getAttribute('h-model')) {
                    root = this.compileModel(child);
                }
                else if (child.getAttribute('h-for')) {
                    root = this.compileFor(child);
                }
                else if (child.getAttribute('h-on:click')) {
                    root = this.compileOnClick(child);
                }
                else {
                    root = this.compileNoDirective(child);
                }
            }
            else if (child.nodeType === 3) {
                root = this.compileText(child);
            }
            else {
                root.appendChild(child);
            }
            if (root != null) {
                fragment.appendChild(root);
            }
        }
        return fragment;
    }
    // a or a.b.c
    getValue(data, path) {
        const names = path.split('.');
        for (const name of names) {
            data = data[name];
        }
        return data;
    }
    compileModel(child) {
        let root = document.createDocumentFragment();
        let childInput = child;
        const attrValue = childInput.getAttribute('h-model');
        if (attrValue === null) {
            root.appendChild(child);
            return root;
        }
        childInput.value = this.$data[attrValue];
        childInput.oninput = () => {
            this.$data[attrValue] = childInput.value;
        };
        root.appendChild(childInput);
        return root;
    }
    compileFor(child) {
        // 根据隐藏的h-for重新渲染; 已渲染的h-for-ignored有数据，直接丢弃
        if (child.getAttribute('h-for-ignored')) {
            return null;
        }
        let root = document.createDocumentFragment();
        const attrValue = child.getAttribute('h-for');
        if (attrValue === null) {
            root.appendChild(child);
            return root;
        }
        let that = this;
        // 循环渲染
        const params = attrValue.trim().split(' '); // person in people
        const varName = params[0]; // person
        const iterName = params[2]; // people
        // 容纳隐藏的h-for、显示数据的h-for-ignored
        child.style.display = 'none'; // 没有对应data时默认显示{{}}，所以要在这里隐藏
        root.appendChild(child); // 放入隐藏的 h-for
        // 这是最初人工写好的h-for模板，根据模板渲染数据
        let template = child.cloneNode(true);
        for (let i = 0; i < this.$data[iterName].length; i++) {
            this.$data[varName] = this.$data[iterName][i]; // 暂存一下，但可能与用户的重名冲突
            let newNode = template.cloneNode(false);
            newNode.dataset.idx = i.toString();
            const attrValue = child.getAttribute('h-on:click');
            if (attrValue && attrValue in that.$methods) {
                newNode.onclick = (e) => {
                    that.$methods[attrValue].call(that.$vm, e, i); // 前面有个h-for占位
                };
            }
            newNode.setAttribute('h-for-ignored', 'true');
            if (newNode.tagName.toLocaleLowerCase() == 'tr') {
                newNode.style.display = 'table-row';
            }
            else {
                newNode.style.display = 'block';
            }
            let sonNodes = this.compileTemplate(template.cloneNode(true));
            newNode.appendChild(sonNodes);
            root.appendChild(newNode); // 放入显示数据的 h-for-ignored
        }
        return root;
    }
    compileOnClick(child) {
        let root = document.createDocumentFragment();
        const attrValue = child.getAttribute('h-on:click');
        if (attrValue === null) {
            root.appendChild(child);
            return root;
        }
        let that = this;
        if (attrValue in that.$methods) {
            child.addEventListener('click', function (e) { that.$methods[attrValue].call(that.$vm); });
        }
        root.appendChild(child);
        return root;
    }
    compileNoDirective(child) {
        let root = document.createDocumentFragment();
        root.appendChild(child.cloneNode(false)); // 不复制子节点
        root.firstChild.appendChild(this.compileTemplate(child));
        return root;
    }
    compileText(child) {
        let root = document.createDocumentFragment();
        if (child.textContent == null) {
            root.appendChild(child);
            return root;
        }
        // {{a}} or {{a}} {{b}} or {{a.b}}
        const reg = /\{\{([^}]+)\}\}/g;
        if (reg.test(child.textContent)) {
            child.textContent = child.textContent.replace(reg, (...args) => {
                return this.getValue(this.$data, args[1]);
            });
        }
        root.appendChild(child);
        return root;
    }
}
