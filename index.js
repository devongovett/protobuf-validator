var openProtobuf = require('resolve-protobuf-schema');
var primitive = require('./types');

function ProtobufValidator(path) {
  // If called as a function, return the validation function 
  // directly rather than returning an instance of this class.
  if (!(this instanceof ProtobufValidator)) {
    var validator = new ProtobufValidator(path);
    return validator.validate.bind(validator);
  }
  
  this.messages = {};
  this.enums = {};
  this.visit(openProtobuf.sync(path), '');
}

/**
 * Visits a schema in the tree, and assigns messages and enums to the lookup tables.
 */
ProtobufValidator.prototype.visit = function(schema, prefix) {
  if (schema.enums) {
    schema.enums.forEach(function(e) {
      e.id = prefix + (prefix ? '.' : '') + e.name;
      this.enums[e.id] = e;
      this.visit(e, e.id);
    }, this);
  }
  
  if (schema.messages) {
    schema.messages.forEach(function(m) {
      m.id = prefix + (prefix ? '.' : '') + m.name;
      this.messages[m.id] = m;
      this.visit(m, m.id);
    }, this);
  }
};

/**
 * Resolves a type name at the given path in the schema tree.
 */
ProtobufValidator.prototype.resolve = function(type, from) {
  if (primitive[type])
    return type;
  
  var lookup = from.split('.');
  for (var i = lookup.length; i >= 0; i--) {
    var id = lookup.slice(0, i).concat(type).join('.');
    var t = this.messages[id] || this.enums[id];
    if (t)
      return t;
  }
  
  throw new Error('Could not resolve ' + type);
};

/**
 * Checks whether the given value is valid for the provided type
 */
ProtobufValidator.prototype.check = function(path, type, value, options) {
  if (typeof type === 'string') {
    if (!primitive[type](value)) {
      throw new Error(path + ' must be a valid ' + type + ' value.');
    }
    
    this.checkOptions(options, value, path);
  } else if (this.enums[type.id]) {
    if (!type.values.hasOwnProperty(value)) {
      throw new Error(path + ' must be one of ("' + Object.keys(type.values).join('", "') + '").');
    }
  } else if (typeof value === 'object') {
    this.validate(type, value);
  } else {
    throw new Error(path + ' must be a valid ' + type.id + ' message.');
  }
};

function defined(val) {
  return val !== null && val !== undefined && (typeof val !== 'number' || !isNaN(val))
}

/**
 * Validates an object against a message schema
 */
ProtobufValidator.prototype.validate = function(message, obj) {
  // For convenience, allow specifying the message as a string type name
  if (typeof message === 'string')
    message = this.resolve(message, '');
  
  var oneofs = {};
  message.fields.forEach(function(field) {
    var value = obj[field.name];
    var path = message.id + '.' + field.name;
    
    if (defined(value)) {
      if (field.oneof) {
        if (oneofs[field.oneof])
          throw new Error('Only one of the properties defined in oneof ' + field.oneof + ' can be set.');
      
        oneofs[field.oneof] = true;
      }
      
      // Maps are handled specially
      if (field.map) {
        var keyType = this.resolve(field.map.from, message.id);
        var valType = this.resolve(field.map.to, message.id);
        
        // Check ES6 Map objects if available
        if (typeof Map !== 'undefined' && value instanceof Map) {
          value.forEach(function(val, key) {
            this.check(path + '.key', keyType, key);
            this.check(path + '.value', valType, val, field.options);
          }, this);
        } else if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
          if (field.map.from !== 'string')
            throw new Error(path + ' can only be a plain JavaScript object for string keys. Use a Map object instead.');
          
          for (var key in value) {
            this.check(path + '.key', keyType, key);
            this.check(path + '.value', valType, value[key], field.options);
          }
        } else {
          throw new Error(path + ' must be a Map or plain JavaScript object.');
        }
      } else {
        var type = this.resolve(field.type, message.id);
      
        if (field.repeated) {
          if (!Array.isArray(value)) {
            throw new Error(path + ' must be an array.');
          }
          
          this.checkOptions(field.options, value, path);
          
          var itemOptions = {};
          for (var key in field.options) {
            if (/^item[A-Z]/.test(key)) {
              itemOptions[key[4].toLowerCase() + key.slice(5)] = field.options[key];
            }
          }
        
          for (var i = 0; i < value.length; i++) {
            this.check(path + '[' + i + ']', type, value[i], itemOptions);
          }
        } else {
          this.check(path, type, value, field.options);
        }
      }
    } else if (field.required) {
      throw new Error(path + ' is required.');
    }
  }, this);
};

ProtobufValidator.prototype.checkOptions = function(options, value, path) {
  if (!options) return;
  
  if (options.length && value.length !== +options.length) {
    throw new Error(path + ' must have length = ' + options.length);
  }
  
  if (options.minLength && value.length < +options.minLength) {
    throw new Error(path + ' must have length >= ' + options.minLength);
  }
  
  if (options.maxLength && value.length > +options.maxLength) {
    throw new Error(path + ' must have length <= ' + options.maxLength);
  }
  
  if (options.min && value < +options.min) {
    throw new Error(path + ' must be >= ' + options.min);
  }
  
  if (options.max && value > +options.max) {
    throw new Error(path + ' must be <= ' + options.max);
  }
};

module.exports = ProtobufValidator;
