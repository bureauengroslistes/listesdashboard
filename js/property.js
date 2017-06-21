///////////////////////////
// Property
// Defines a basic getter/setter

// Misc : Escape RegEx Special Characters: /[$-\/?[-^{|}]/g

/**
 * Create a getter-setter property
 * Usage: let myprop = Property('Initial Value');
 * Set / Change Value: myprop('New Value');
 * Get Value: console.log(myprop()); // Returns 'New Value'
 * If defined, callback will be called when the value is changed with the params (newValue, oldValue) return false to cancel the value change.
 * @constructor
 * @param {*} defaultProp - Default value for the property. Mandatory.
 * @param {function} callback - Callback to be called if the property is changed.
 */
var Property = function (defaultProp, callback) {
    var curValue = defaultProp
    return function (propValue) {
        if (propValue !== undefined) {
            var oldValue = curValue
            if (typeof callback === 'function') {
                if (callback(propValue, oldValue) === false) {
                    return curValue
                }
            }
            curValue = propValue
        }
        return curValue
    }
}

window.Property = Property