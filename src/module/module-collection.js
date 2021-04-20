import { forEachValue } from "../util";
import Module from "./module";

class ModuleCollection {
    constructor(options) {
        // 前序遍历
        this.register([], options);
    }
    getNamespaced(path) {
        let root = this.root;
        return path.reduce((str, key) => {
            root = root.getChild(key);
            return (str + root.namespaced ? key + '/' : '');
        }, '');
    }
    register(path, rootModule) {
        const newModule = new Module();
        if (path.length == 0) {
            // 根模块
            this.root = newModule;
        } else {
            // 构造父子关系
            const parent = path.slice(0, -1).reduce((memo, current) => memo.getChild(current), this.root);
            // 深度遍历，所以数组最后一个元素为前一个元素的儿子
            parent.addChild(path[path.length - 1], newModule);
        }

        if (rootModule.modules) {
            // 处理孩子节点
            forEachValue(rootModule.modules, (module, moduleName) => {
                this.register(path.concat(moduleName), module);
            })
        }
    }
}

export default ModuleCollection;