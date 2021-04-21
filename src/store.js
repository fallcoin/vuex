import applyMixin from "./mixin";
import ModuleCollection from "./module/module-collection";
import { forEachValue } from "./util"

export let Vue;

function getState(store, path) {    // 获取最新的状态
    return path.reduce((newState, current) => {
        return newState[current];
    }, store.state);
}

const installModule = (store, rootState, path, module) => {
    const namespace = store._modules.getNamespaced(path);

    // 将所有的子模块的状态安装到父模块的状态上
    if (path.length > 0) {
        const parent = path.slice(0, -1).reduce((memo, current) => {
            return memo[current];
        }, rootState);
        /**
         * 将状态变为响应式
         */
        Vue.set(parent, path[path.length - 1], module.state);
    }

    // 处理mutations
    module.forEachMutation((mutation, key) => {
        if (store._mutations[namespace + key]) {
            store._mutations = [];
        }
        store._mutations[namespace + key].push(payload => {
            mutation.call(store, getState(store, path), payload);
            store._subscribes.forEach(fn => {
                fn(mutation, store.state);
            })
        })
    })
    // 处理actions
    module.forEachAction((action, key) => {
        if (store._actions[namespace + key]) {
            store._actions = [];
        }
        store._actions[namespace + key].push(payload => {
            action.call(store, store, payload);
        })
    })
    // 处理getters
    module.forEachGetter((getter, key) => {
        store._wrappedGetters[namespace + key] = function () {
            return getter(getState(store, path));
        }
    })
    // 安装子模块的属性
    module.forChild((child, key) => {
        installModule(store, rootState, path.concat(key), child);
    })
}

function ressetStoreVM(store, state) {
    const computed = {};
    store.getters = {};

    forEachValue(store._wrappedGetters, (fn, key) => {
        computed[key] = () => fn();

        Object.defineProperty(store.getters, key, {
            get: () => store._vm[key]   // 去计算属性中取值
        })
    })

    store._vm = new Vue({
        data: {
            $$state: state
        },
        computed    // 借助vue的computed实现缓存效果
    })
}

export class Store {
    constructor(options) {
        this._actions = {};
        this._mutations = {};
        this._wrappedGetters = {};
        this._subscribes = [];

        const state = options.state;
        // 构造ast树
        this._modules = new ModuleCollection(options);
        // 遍历所有子模块，将getters，mutations，actions合并到根模块
        installModule(this, state, [], this._modules.root);
        // 将状态挂载到vm上
        ressetStoreVM(this, state);
        // 让插件依次执行
        options.plugins.forEach(plugin => plugin(this));
    }

    replaceState(state) {
        this._vm.data.$$state = state;
    }

    subscribe(fn) {
        this._subscribes.push(fn);
    }

    commit = (type, payload) => {    // 使用箭头函数能保证this的指向，因为用户可能把commit解构出来
        this._mutations[type].forEach(mutation => mutation.call(this, payload));
    }

    dispatch = (type, payload) => {
        this._actions[type].forEach(action => action.call(this, payload));
    }

    get state() {
        return this._vm._data.$$state;
    }
}

export function install(_Vue) {
    Vue = _Vue;
    applyMixin(Vue);
}