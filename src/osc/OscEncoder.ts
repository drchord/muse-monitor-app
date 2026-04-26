function pad4(len: number): number {
  return len + ((4 - (len % 4)) % 4);
}

function encodeString(s: string): Uint8Array {
  const bytes = new Uint8Array(pad4(s.length + 1));
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function encodeOscMessage(
  address: string,
  typeTags: string,
  args: (number | string)[]
): Uint8Array {
  const addrBytes = encodeString(address);
  const tagBytes  = encodeString(',' + typeTags);

  const argBuffers: Uint8Array[] = args.map((arg, i) => {
    const tag = typeTags[i];
    if (tag === 'f') {
      const buf = new ArrayBuffer(4);
      new DataView(buf).setFloat32(0, arg as number, false);
      return new Uint8Array(buf);
    } else if (tag === 'i') {
      const buf = new ArrayBuffer(4);
      new DataView(buf).setInt32(0, arg as number, false);
      return new Uint8Array(buf);
    } else if (tag === 's') {
      return encodeString(arg as string);
    }
    throw new Error(`Unknown type tag: ${tag}`);
  });

  const totalLen = addrBytes.length + tagBytes.length +
    argBuffers.reduce((s, b) => s + b.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;

  result.set(addrBytes, offset); offset += addrBytes.length;
  result.set(tagBytes,  offset); offset += tagBytes.length;
  for (const buf of argBuffers) { result.set(buf, offset); offset += buf.length; }

  return result;
}

export function encodeBandPower(address: string, values: number[]): Uint8Array {
  return encodeOscMessage(address, 'f'.repeat(values.length), values);
}
