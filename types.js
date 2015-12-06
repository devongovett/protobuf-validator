function range(min, max) {
  return function(val) {
    return typeof val === 'number' && (val | 0 === val) && val <= max && val >= min;
  };
}

function typeOf(type) {
  return function(val) {
    return typeof val === type;
  }
}

const MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
const MIN_SAFE_INTEGER = -MAX_SAFE_INTEGER;

module.exports = {
  bytes: Buffer.isBuffer.bind(Buffer),
  string: typeOf('string'),
  bool: typeOf('boolean'),
  int32: range(-0x80000000, 0x7fffffff),
  sint32: range(-0x80000000, 0x7fffffff),
  uint32: range(0, 0xffffffff),
  int64: range(MIN_SAFE_INTEGER, MAX_SAFE_INTEGER),
  sint64: range(MIN_SAFE_INTEGER, MAX_SAFE_INTEGER),
  uint64: range(0, MAX_SAFE_INTEGER),
  fixed32: typeOf('number'),
  fixed64: typeOf('number'),
  sfixed32: typeOf('number'),
  sfixed64: typeOf('number'),
  float: typeOf('number'),
  double: typeOf('number')
};
