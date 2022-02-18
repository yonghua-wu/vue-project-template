/**
 * 解码VBPG
 * @param buf ArrayBuffer
 * @returns 返回VBPG信息和图片
 */
export function decodeVBPG(buf: ArrayBuffer) {
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const headerLength = new DataView(buf, 0, 4).getInt32(0, false); // 从前4个字节获取头信息长度
  const packageInfoStrArr = new Uint8Array(buf, 4, headerLength - 4); // 从第4个字节开始，获取头信息长度-4的信息
  const packageInfoStr = new TextDecoder().decode(packageInfoStrArr); // 转字符串
  const packageInfo: any = JSON.parse(packageInfoStr); // 字符串转json
  const res: any[] = packageInfo.resources; // resources 保存了图片信息
  const imgUrls = [];
  for (const i in res) {
    const imgInfo: any = res[i];
    // 图片信息中的起始下标加头信息长度就是图片在buf中的下标，结束下标同理
    const imgBlob = blob.slice(imgInfo.fromPos + headerLength, imgInfo.toPos + headerLength, imgInfo.type + "/" + imgInfo.fileType);
    // 创建 blob url 用于页面访问
    imgUrls.push(URL.createObjectURL(imgBlob));
  }
  // console.log(imgUrls);
  return {
    packageInfo,
    imgUrls,
  };
}

type MateType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "undefined"
  | "symbol"
  | "bigInt"
  | "object"
  | "function"
  | "array"
  | "date"
  | "regExp"
  | "error";

/**
 * 判断类型
 * @param obj 待判断的变量
 * @returns 类型名
 */
export function metaType(obj: any): MateType {
  const MAP = {
    "[object String]": "string",
    "[object Number]": "number",
    "[object Boolean]": "boolean",
    "[object Null]": "null",
    "[object Undefined]": "undefined",
    "[object Symbol]": "symbol",
    "[object BigInt]": "bigInt",
    "[object Object]": "object",
    "[object Function]": "function",
    "[object Array]": "array",
    "[object Date]": "date",
    "[object RegExp]": "regExp",
    "[object Error]": "error",
  };
  const type = Object.prototype.toString.call(obj);
  return (MAP as any)[type];
}

/**
 * 对象深拷贝
 * @param data .
 * @returns .
 */
export function deepClone(data: any): any {
  const type = metaType(data);
  let obj: any = null;
  if (type === "array") {
    obj = [];
    for (let i = 0; i < data.length; i++) {
      obj.push(deepClone(data[i]));
    }
  } else if (type === "object") {
    obj = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        obj[key] = deepClone(data[key]);
      }
    }
  } else {
    return data;
  }
  return obj;
}

/**
 * 判断空对象或空数组
 * @param obj .
 * @returns true / false
 */
export function isEmpty(obj: any) {
  for (const _ in obj) {
    return false;
  }
  return true;
}

/**
 * 寻找列表对象中的值
 * @param list list
 * @param key 寻找的值的键名
 * @param value 寻找的值
 * @returns 返回寻找到的对象，没找到返回 null
 */
export function findObject(list: any[], key: string, value: any) {
  for (const index in list) {
    if (list[index][key] === value) {
      return list[index];
    }
  }
  return null;
}

/**
 * 寻找树中节点中的值
 * @param tree 树
 * @param key 寻找的值的键名
 * @param value 寻找的值
 * @param childrenName 子节点键名
 * @returns 返回寻找到的节点，没找到返回 null
 */
export function findTreeObject(tree: any[], key: string, value: any, childrenName = "children"): any {
  for (const index in tree) {
    if (tree[index][key] === value) {
      return tree[index];
    }
    if (tree[index][childrenName]?.length > 0) {
      const res = findTreeObject(tree[index][childrenName], key, value, childrenName);
      if (res !== null) {
        return res;
      }
    }
  }
  return null;
}

/**
 * 列表结构转树形结构
 * @param list list
 * @param parentIdKey list 中父节点唯一ID的键名
 * @param rowIdKey list 中节点唯一ID的键名
 * @param childrenKey 设置的子节点的键名
 * @returns 返回构建好的树
 */
export function listToTree(list: any[], parentIdKey = "parentId", rowIdKey = "id", childrenKey = "children") {
  const map: any = {};
  let node: any;
  const roots: any[] = [];
  let i;
  for (i = 0; i < list.length; i += 1) {
    map[list[i][rowIdKey]] = i;
    list[i][childrenKey] = [];
  }
  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node[parentIdKey] !== "0" && node[parentIdKey] !== null) {
      list[map[node[parentIdKey]]] && list[map[node[parentIdKey]]][childrenKey].push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * 防抖
 * @returns 函数闭包
 */
export function debounce() {
  let timeout: number;
  return function (func: () => {}, wait: number) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(func, wait);
  };
}
