export function mapState(stateArr) {
    const obj = {};
    for (let i = 0; i < stateArr.length; i++) {
        const stateName = stateArr[i];
        obj[stateName] = function () {
            return this.$store.state[stateName];
        }
    }
    return obj;
}

export function mapGetters(getterArr) {
    const obj = {};
    for (let i = 0; i < getterArr.length; i++) {
        const getterName = getterArr[i];
        obj[getterName] = function () {
            return this.$store.getters[getterName];
        }
    }
    return obj;
}