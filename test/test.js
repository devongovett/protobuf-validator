var assert = require('assert');
var validate = require('../')(__dirname + '/test.proto');

describe('protobuf-validator', function() {
  it('should throw when required properties are not given', function() {
    assert.throws(function() {
      validate('Basic', {});
    }, /Basic.foo is required/);
  });
  
  it('should throw when properties have invalid values', function() {
    assert.throws(function() {
      validate('Basic', {
        foo: 2
      });
    }, /Basic.foo must be a valid string value/);
    
    assert.throws(function() {
      validate('Basic', {
        foo: 'hi',
        bar: 'foo'
      });
    }, /Basic.bar must be a valid int32 value/);
  });
  
  it('should not throw for valid values', function() {
    validate('Basic', {
      foo: 'hi'
    });
    
    validate('Basic', {
      foo: 'hi',
      bar: 2
    });
  });
  
  it('should throw when a primitive value is used instead of an object for nested messages', function() {
    assert.throws(function() {
      validate('Parent', {
        id: 123,
        child: 456
      });
    }, /Parent.child must be a valid Parent.Child message/);
  });
  
  it('should validate child messages', function() {
    assert.throws(function() {
      validate('Parent', {
        id: 123,
        child: {
          foo: 1
        }
      });
    }, /Parent.Child.foo must be a valid string value/);
    
    validate('Parent', {
      id: 123,
      child: {
        foo: 'hi'
      }
    });
  });
  
  it('should throw when it cannot resolve a message', function() {
    assert.throws(function() {
      validate('Parent', {
        id: 123,
        bad: {
          test: 'hi'
        }
      });
    }, /Could not resolve Bad/);
  });
  
  it('should validate enum values', function() {
    assert.throws(function() {
      validate('Enum', {
        type: 'SEVEN'
      });
    }, /Enum.type must be one of \("ONE", "TWO", "THREE"\)/);
    
    validate('Enum', {
      type: 'ONE'
    });
  });
  
  it('should validate repeated values', function() {
    assert.throws(function() {
      validate('Array', {
        values: 'hi'
      });
    }, /Array.values must be an array/);
    
    validate('Array', {
      values: []
    });
    
    validate('Array', {
      values: ['hi']
    });
    
    assert.throws(function() {
      validate('Array', {
        values: [1]
      });
    }, /Array.values\[0\] must be a valid string value/);
  });
  
  it('should validate string keyed maps', function() {
    assert.throws(function() {
      validate('Map', {
        foo: 'hi'
      });
    }, /Map.foo must be a Map or plain JavaScript object/);
    
    validate('Map', {
      foo: {}
    });
    
    validate('Map', {
      foo: {
        test: 'hi'
      }
    });
    
    assert.throws(function() {
      validate('Map', {
        foo: {
          test: 1
        }
      });
    }, /Map.foo.value must be a valid string value/);
  });
  
  it('should validate complex maps', function() {
    // ignore in non ES6 environments
    if (typeof Map === 'undefined') return;
    
    assert.throws(function() {
      validate('Map', {
        bar: {
          test: 'hi'
        }
      });
    }, /Map.bar can only be a plain JavaScript object for string keys. Use a Map object instead/);
    
    assert.throws(function() {
      validate('Map', {
        bar: new Map([
          ['key', 'value']
        ])
      });
    }, /Map.bar.key must be a valid Map.Key message/);
    
    assert.throws(function() {
      validate('Map', {
        bar: new Map([
          [{ key: 'hi' }, 'value']
        ])
      });
    }, /Map.bar.value must be a valid Map.Value message/);
    
    validate('Map', {
      bar: new Map([
        [{ key: 'hi' }, { val: 2 }]
      ])
    });
  });
  
  it('validates oneof fields', function() {
    assert.throws(function() {
      validate('OneOf', {
        foo: 'test',
        bar: 2
      });
    }, /Only one of the properties defined in oneof test can be set/);
    
    validate('OneOf', {
      foo: 'test'
    });
    
    validate('OneOf', {
      bar: 2
    });
  });
  
  describe('options', function() {
    it('should validate length of strings', function() {
      assert.throws(function() {
        validate('Options', {
          test1: 'hi'
        });
      }, /Options.test1 must have length = 5/);
      
      validate('Options', {
        test1: '12345'
      });
    });
    
    it('should validate min and max length of strings', function() {
      assert.throws(function() {
        validate('Options', {
          test2: '1'
        });
      }, /Options.test2 must have length >= 2/);
      
      assert.throws(function() {
        validate('Options', {
          test2: '123456'
        });
      }, /Options.test2 must have length <= 5/);
      
      validate('Options', {
        test2: '1234'
      });
    });
    
    it('should validate min and max of numbers', function() {
      assert.throws(function() {
        validate('Options', {
          test3: 1
        });
      }, /Options.test3 must be >= 2/);
      
      assert.throws(function() {
        validate('Options', {
          test3: 10
        });
      }, /Options.test3 must be <= 5/);
      
      validate('Options', {
        test3: 3
      });
    });
    
    it('should validate the length of arrays, and strings inside', function() {
      assert.throws(function() {
        validate('Options', {
          test4: ['test']
        });
      }, /Options.test4 must have length = 2/);
      
      assert.throws(function() {
        validate('Options', {
          test4: ['test', 'test2']
        });
      }, /Options.test4\[0\] must have length = 2/);
      
      validate('Options', {
        test4: ['ab', 'cd']
      });
    });
    
    it('should validate the length of arrays, and numbers inside', function() {
      assert.throws(function() {
        validate('Options', {
          test5: [3]
        });
      }, /Options.test5 must have length >= 2/);
      
      assert.throws(function() {
        validate('Options', {
          test5: [1, 2, 3, 4, 5, 6]
        });
      }, /Options.test5 must have length <= 5/);
      
      assert.throws(function() {
        validate('Options', {
          test5: [1, 10]
        });
      }, /Options.test5\[0\] must be >= 2/);
      
      assert.throws(function() {
        validate('Options', {
          test5: [3, 10]
        });
      }, /Options.test5\[1\] must be <= 5/);
      
      validate('Options', {
        test5: [3, 4]
      });
    });
  });
});
