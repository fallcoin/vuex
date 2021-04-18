import applyMixin from "./mixin";
import ModuleCollection from "./module/module-collection";
import { forEachValue } from "./util"

export let Vue;

const installModule = (store, rootState, path, module) => {
    module.forEachMutation((mutation, key) => {
        if (store._mutations[key]) {
            store._mutations = [];
        }
        store._mutations[key].push(payload => {
            mutation.call(store, module.state, payload);
        })
    })
    module.forEachAction((action, key) => {
        if (store._actions[key]) {
            store._actions = [];
        }
        store._actions[key].push(payload => {
            mutation.call(store, store, payload);
        })
    })
    module.forEachGetter((getter, key) => {
        store._wrappedGetters[key] = function () {
            return getter(module.state);
        }
    })
    module.forChild((child, key) => {
        installModule(store, rootState, path.concat(key), child);
    })
}

export class Store {
    constructor(options) {
        this._actions = {};
        this._mutations = {};
        this._wrappedGetters = {};

        const state = options.state;
        // 构造ast树
        this._modules = new ModuleCollection(options);
        // 遍历所有子模块，将getters，mutations，actions合并到根模块
        installModule(this, state, [], this._modules.root);
        // 实现getters
        // const computed = {};    // 将值进行缓存
        // this.getters = {};
        // forEachValue(options.getters, (fn, key) => {
        //     computed[key] = () => {
        //         return fn(this.state);
        //     }
        //     Object.defineProperty(this.getters, key, {
        //         get: () => this._vm[key]
        //     })
        // });

        // // 将数据定义为响应式
        // this._vm = new Vue({
        //     data: {
        //         // $开头的属性不会挂载到vm上
        //         $$state: this.state,
        //         computed
        //     }
        // });

        // // 实现mutations
        // this.mutations = {};
        // forEachValue(options.mutations, (fn, key) => {
        //     this.mutations[key] = (payload) => fn(this.state, payload);
        // });

        // // 实现actions
        // this.actions = {};
        // forEachValue(options.actions, (fn, key) => {
        //     this.mutations[key] = (payload) => fn(this.state, payload);
        // })
    }

    commit = (type, payload) => {    // 使用箭头函数能保证this的指向，因为用户可能把commit解构出来
        this.mutations[type](payload);
    }

    dispatch = (type, payload) => {
        this.mutations[type](payload);
    }

    get state() {
        return this._vm._data.$$state;
    }
}

export function install(_Vue) {
    Vue = _Vue;
    applyMixin(Vue);
}