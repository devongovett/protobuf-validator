# protobuf-validator

Validates objects against protocol buffer schemas

## Motivation

Even if you don't use the binary serialization format,
[Protocol Buffer IDL](https://developers.google.com/protocol-buffers/docs/proto3) is still a nice 
data modeling language, allowing you to define messages with typed fields, required/optional constraints, etc.
This module allows you to validate JavaScript objects against protobuf schemas, which is useful if you
have a JSON API but need to validate user submitted objects, for example.

## Example

Assuming you have a file called `models.proto`:

```protobuf
message Person {
  required string name = 0;
  optional int32 age = 1;
}
```

```javascript
var validate = require('protobuf-validator')('models.proto');

// valid
validate('Person', {
  name: 'Devon'
});

// throws "Person.name must be a valid string value"
validate('Person', {
  name: 123
});
```

## License

MIT
