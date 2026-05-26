const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/EnrollmentActionModal-C0RtPN3-.js","assets/EnrollmentActionModal-xp9GVQ1_.css"])))=>i.map(i=>d[i]);
true              &&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

const scriptRel = 'modulepreload';const assetsURL = function(dep) { return "/"+dep };const seen$2 = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (true               && deps && deps.length > 0) {
    let allSettled2 = function(promises) {
      return Promise.all(
        promises.map(
          (p) => Promise.resolve(p).then(
            (value) => ({ status: "fulfilled", value }),
            (reason) => ({ status: "rejected", reason })
          )
        )
      );
    };
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled2(
      deps.map((dep) => {
        dep = assetsURL(dep, importerUrl);
        if (dep in seen$2) return;
        seen$2[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        const isBaseRelative = !!importerUrl;
        if (isBaseRelative) {
          for (let i = links.length - 1; i >= 0; i--) {
            const link2 = links[i];
            if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
              return;
            }
          }
        } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};

/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const __pw_hooks_before_mount = [];
const __pw_hooks_after_mount = [];

window.__pw_hooks_before_mount = __pw_hooks_before_mount;
window.__pw_hooks_after_mount = __pw_hooks_after_mount;

const beforeMount = callback => {
  __pw_hooks_before_mount.push(callback);
};

const afterMount = callback => {
  __pw_hooks_after_mount.push(callback);
};

/**
* @vue/shared v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const key of str.split(",")) map[key] = 1;
  return (val) => val in map;
}
const EMPTY_OBJ = false ? Object.freeze({}) : {};
const EMPTY_ARR = false ? Object.freeze([]) : [];
const NOOP$1 = () => {
};
const NO = () => false;
const isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
(key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
const isArray$2 = Array.isArray;
const isMap$2 = (val) => toTypeString(val) === "[object Map]";
const isSet$2 = (val) => toTypeString(val) === "[object Set]";
const isDate$1 = (val) => toTypeString(val) === "[object Date]";
const isRegExp$1 = (val) => toTypeString(val) === "[object RegExp]";
const isFunction = (val) => typeof val === "function";
const isString$1 = (val) => typeof val === "string";
const isSymbol$1 = (val) => typeof val === "symbol";
const isObject$2 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return (isObject$2(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject$2 = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString$1(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
);
const isBuiltInDirective = /* @__PURE__ */ makeMap(
  "bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo"
);
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return ((str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  });
};
const camelizeRE$1 = /-\w/g;
const camelize$1 = cacheStringFunction(
  (str) => {
    return str.replace(camelizeRE$1, (c) => c.slice(1).toUpperCase());
  }
);
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
);
const capitalize = cacheStringFunction((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});
const toHandlerKey = cacheStringFunction(
  (str) => {
    const s = str ? `on${capitalize(str)}` : ``;
    return s;
  }
);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, ...arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](...arg);
  }
};
const def = (obj, key, value, writable = false) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value
  });
};
const looseToNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
const toNumber = (val) => {
  const n = isString$1(val) ? Number(val) : NaN;
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
const identRE = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;
function genPropsAccessExp(name) {
  return identRE.test(name) ? `__props.${name}` : `__props[${JSON.stringify(name)}]`;
}
function genCacheKey(source, options) {
  return source + JSON.stringify(
    options,
    (_, val) => typeof val === "function" ? val.toString() : val
  );
}
const PatchFlags = {
  "TEXT": 1,
  "1": "TEXT",
  "CLASS": 2,
  "2": "CLASS",
  "STYLE": 4,
  "4": "STYLE",
  "PROPS": 8,
  "8": "PROPS",
  "FULL_PROPS": 16,
  "16": "FULL_PROPS",
  "NEED_HYDRATION": 32,
  "32": "NEED_HYDRATION",
  "STABLE_FRAGMENT": 64,
  "64": "STABLE_FRAGMENT",
  "KEYED_FRAGMENT": 128,
  "128": "KEYED_FRAGMENT",
  "UNKEYED_FRAGMENT": 256,
  "256": "UNKEYED_FRAGMENT",
  "NEED_PATCH": 512,
  "512": "NEED_PATCH",
  "DYNAMIC_SLOTS": 1024,
  "1024": "DYNAMIC_SLOTS",
  "DEV_ROOT_FRAGMENT": 2048,
  "2048": "DEV_ROOT_FRAGMENT",
  "CACHED": -1,
  "-1": "CACHED",
  "BAIL": -2,
  "-2": "BAIL"
};
const PatchFlagNames = {
  [1]: `TEXT`,
  [2]: `CLASS`,
  [4]: `STYLE`,
  [8]: `PROPS`,
  [16]: `FULL_PROPS`,
  [32]: `NEED_HYDRATION`,
  [64]: `STABLE_FRAGMENT`,
  [128]: `KEYED_FRAGMENT`,
  [256]: `UNKEYED_FRAGMENT`,
  [512]: `NEED_PATCH`,
  [1024]: `DYNAMIC_SLOTS`,
  [2048]: `DEV_ROOT_FRAGMENT`,
  [-1]: `CACHED`,
  [-2]: `BAIL`
};
const ShapeFlags = {
  "ELEMENT": 1,
  "1": "ELEMENT",
  "FUNCTIONAL_COMPONENT": 2,
  "2": "FUNCTIONAL_COMPONENT",
  "STATEFUL_COMPONENT": 4,
  "4": "STATEFUL_COMPONENT",
  "TEXT_CHILDREN": 8,
  "8": "TEXT_CHILDREN",
  "ARRAY_CHILDREN": 16,
  "16": "ARRAY_CHILDREN",
  "SLOTS_CHILDREN": 32,
  "32": "SLOTS_CHILDREN",
  "TELEPORT": 64,
  "64": "TELEPORT",
  "SUSPENSE": 128,
  "128": "SUSPENSE",
  "COMPONENT_SHOULD_KEEP_ALIVE": 256,
  "256": "COMPONENT_SHOULD_KEEP_ALIVE",
  "COMPONENT_KEPT_ALIVE": 512,
  "512": "COMPONENT_KEPT_ALIVE",
  "COMPONENT": 6,
  "6": "COMPONENT"
};
const SlotFlags = {
  "STABLE": 1,
  "1": "STABLE",
  "DYNAMIC": 2,
  "2": "DYNAMIC",
  "FORWARDED": 3,
  "3": "FORWARDED"
};
const slotFlagsText = {
  [1]: "STABLE",
  [2]: "DYNAMIC",
  [3]: "FORWARDED"
};
const GLOBALS_ALLOWED = "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,console,Error,Symbol";
const isGloballyAllowed = /* @__PURE__ */ makeMap(GLOBALS_ALLOWED);
const isGloballyWhitelisted = isGloballyAllowed;
const range$1 = 2;
function generateCodeFrame(source, start = 0, end = source.length) {
  start = Math.max(0, Math.min(start, source.length));
  end = Math.max(0, Math.min(end, source.length));
  if (start > end) return "";
  let lines = source.split(/(\r?\n)/);
  const newlineSequences = lines.filter((_, idx) => idx % 2 === 1);
  lines = lines.filter((_, idx) => idx % 2 === 0);
  let count = 0;
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + (newlineSequences[i] && newlineSequences[i].length || 0);
    if (count >= start) {
      for (let j = i - range$1; j <= i + range$1 || end > count; j++) {
        if (j < 0 || j >= lines.length) continue;
        const line = j + 1;
        res.push(
          `${line}${" ".repeat(Math.max(3 - String(line).length, 0))}|  ${lines[j]}`
        );
        const lineLength = lines[j].length;
        const newLineSeqLength = newlineSequences[j] && newlineSequences[j].length || 0;
        if (j === i) {
          const pad = start - (count - (lineLength + newLineSeqLength));
          const length = Math.max(
            1,
            end > count ? lineLength - pad : end - start
          );
          res.push(`   |  ` + " ".repeat(pad) + "^".repeat(length));
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1);
            res.push(`   |  ` + "^".repeat(length));
          }
          count += lineLength + newLineSeqLength;
        }
      }
      break;
    }
  }
  return res.join("\n");
}
function normalizeStyle(value) {
  if (isArray$2(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString$1(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString$1(value) || isObject$2(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:([^]+)/;
const styleCommentRE = /\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function stringifyStyle(styles) {
  if (!styles) return "";
  if (isString$1(styles)) return styles;
  let ret = "";
  for (const key in styles) {
    const value = styles[key];
    if (isString$1(value) || typeof value === "number") {
      const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key);
      ret += `${normalizedKey}:${value};`;
    }
  }
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString$1(value)) {
    res = value;
  } else if (isArray$2(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject$2(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
function normalizeProps(props) {
  if (!props) return null;
  let { class: klass, style } = props;
  if (klass && !isString$1(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}
const HTML_TAGS = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot";
const SVG_TAGS = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view";
const MATH_TAGS = "annotation,annotation-xml,maction,maligngroup,malignmark,math,menclose,merror,mfenced,mfrac,mfraction,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mprescripts,mroot,mrow,ms,mscarries,mscarry,msgroup,msline,mspace,msqrt,msrow,mstack,mstyle,msub,msubsup,msup,mtable,mtd,mtext,mtr,munder,munderover,none,semantics";
const VOID_TAGS = "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";
const isHTMLTag = /* @__PURE__ */ makeMap(HTML_TAGS);
const isSVGTag = /* @__PURE__ */ makeMap(SVG_TAGS);
const isMathMLTag = /* @__PURE__ */ makeMap(MATH_TAGS);
const isVoidTag = /* @__PURE__ */ makeMap(VOID_TAGS);
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
const isBooleanAttr = /* @__PURE__ */ makeMap(
  specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,inert,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`
);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
const unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/;
const attrValidationCache = {};
function isSSRSafeAttrName(name) {
  if (attrValidationCache.hasOwnProperty(name)) {
    return attrValidationCache[name];
  }
  const isUnsafe = unsafeAttrCharRE.test(name);
  if (isUnsafe) {
    console.error(`unsafe attribute name: ${name}`);
  }
  return attrValidationCache[name] = !isUnsafe;
}
const propsToAttrMap = {
  acceptCharset: "accept-charset",
  className: "class",
  htmlFor: "for",
  httpEquiv: "http-equiv"
};
const isKnownHtmlAttr = /* @__PURE__ */ makeMap(
  `accept,accept-charset,accesskey,action,align,allow,alt,async,autocapitalize,autocomplete,autofocus,autoplay,background,bgcolor,border,buffered,capture,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,crossorigin,csp,data,datetime,decoding,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,enterkeyhint,for,form,formaction,formenctype,formmethod,formnovalidate,formtarget,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,importance,inert,integrity,ismap,itemprop,keytype,kind,label,lang,language,loading,list,loop,low,manifest,max,maxlength,minlength,media,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,referrerpolicy,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,selected,shape,size,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,translate,type,usemap,value,width,wrap`
);
const isKnownSvgAttr = /* @__PURE__ */ makeMap(
  `xmlns,accent-height,accumulate,additive,alignment-baseline,alphabetic,amplitude,arabic-form,ascent,attributeName,attributeType,azimuth,baseFrequency,baseline-shift,baseProfile,bbox,begin,bias,by,calcMode,cap-height,class,clip,clipPathUnits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,contentScriptType,contentStyleType,crossorigin,cursor,cx,cy,d,decelerate,descent,diffuseConstant,direction,display,divisor,dominant-baseline,dur,dx,dy,edgeMode,elevation,enable-background,end,exponent,fill,fill-opacity,fill-rule,filter,filterRes,filterUnits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,format,from,fr,fx,fy,g1,g2,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,glyphRef,gradientTransform,gradientUnits,hanging,height,href,hreflang,horiz-adv-x,horiz-origin-x,id,ideographic,image-rendering,in,in2,intercept,k,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,kerning,keyPoints,keySplines,keyTimes,lang,lengthAdjust,letter-spacing,lighting-color,limitingConeAngle,local,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mask,maskContentUnits,maskUnits,mathematical,max,media,method,min,mode,name,numOctaves,offset,opacity,operator,order,orient,orientation,origin,overflow,overline-position,overline-thickness,panose-1,paint-order,path,pathLength,patternContentUnits,patternTransform,patternUnits,ping,pointer-events,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,r,radius,referrerPolicy,refX,refY,rel,rendering-intent,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,rotate,rx,ry,scale,seed,shape-rendering,slope,spacing,specularConstant,specularExponent,speed,spreadMethod,startOffset,stdDeviation,stemh,stemv,stitchTiles,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,string,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,style,surfaceScale,systemLanguage,tabindex,tableValues,target,targetX,targetY,text-anchor,text-decoration,text-rendering,textLength,to,transform,transform-origin,type,u1,u2,underline-position,underline-thickness,unicode,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,values,vector-effect,version,vert-adv-y,vert-origin-x,vert-origin-y,viewBox,viewTarget,visibility,width,widths,word-spacing,writing-mode,x,x-height,x1,x2,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xmlns:xlink,xml:base,xml:lang,xml:space,y,y1,y2,yChannelSelector,z,zoomAndPan`
);
const isKnownMathMLAttr = /* @__PURE__ */ makeMap(
  `accent,accentunder,actiontype,align,alignmentscope,altimg,altimg-height,altimg-valign,altimg-width,alttext,bevelled,close,columnsalign,columnlines,columnspan,denomalign,depth,dir,display,displaystyle,encoding,equalcolumns,equalrows,fence,fontstyle,fontweight,form,frame,framespacing,groupalign,height,href,id,indentalign,indentalignfirst,indentalignlast,indentshift,indentshiftfirst,indentshiftlast,indextype,justify,largetop,largeop,lquote,lspace,mathbackground,mathcolor,mathsize,mathvariant,maxsize,minlabelspacing,mode,other,overflow,position,rowalign,rowlines,rowspan,rquote,rspace,scriptlevel,scriptminsize,scriptsizemultiplier,selection,separator,separators,shift,side,src,stackalign,stretchy,subscriptshift,superscriptshift,symmetric,voffset,width,widths,xlink:href,xlink:show,xlink:type,xmlns`
);
function isRenderableAttrValue(value) {
  if (value == null) {
    return false;
  }
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean";
}
const escapeRE = /["'&<>]/;
function escapeHtml(string) {
  const str = "" + string;
  const match = escapeRE.exec(str);
  if (!match) {
    return str;
  }
  let html = "";
  let escaped;
  let index;
  let lastIndex = 0;
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escaped = "&quot;";
        break;
      case 38:
        escaped = "&amp;";
        break;
      case 39:
        escaped = "&#39;";
        break;
      case 60:
        escaped = "&lt;";
        break;
      case 62:
        escaped = "&gt;";
        break;
      default:
        continue;
    }
    if (lastIndex !== index) {
      html += str.slice(lastIndex, index);
    }
    lastIndex = index + 1;
    html += escaped;
  }
  return lastIndex !== index ? html + str.slice(lastIndex, index) : html;
}
const commentStripRE = /^-?>|<!--|-->|--!>|<!-$/g;
function escapeHtmlComment(src) {
  return src.replace(commentStripRE, "");
}
const cssVarNameEscapeSymbolsRE = /[ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g;
function getEscapedCssVarName(key, doubleEscape) {
  return key.replace(
    cssVarNameEscapeSymbolsRE,
    (s) => doubleEscape ? s === '"' ? '\\\\\\"' : `\\\\${s}` : `\\${s}`
  );
}
function looseCompareArrays(a, b) {
  if (a.length !== b.length) return false;
  let equal = true;
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i]);
  }
  return equal;
}
function looseEqual(a, b) {
  if (a === b) return true;
  let aValidType = isDate$1(a);
  let bValidType = isDate$1(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol$1(a);
  bValidType = isSymbol$1(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray$2(a);
  bValidType = isArray$2(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false;
  }
  aValidType = isObject$2(a);
  bValidType = isObject$2(b);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    const aKeysCount = Object.keys(a).length;
    const bKeysCount = Object.keys(b).length;
    if (aKeysCount !== bKeysCount) {
      return false;
    }
    for (const key in a) {
      const aHasKey = a.hasOwnProperty(key);
      const bHasKey = b.hasOwnProperty(key);
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
        return false;
      }
    }
  }
  return String(a) === String(b);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}
const isRef$2 = (val) => {
  return !!(val && val["__v_isRef"] === true);
};
const toDisplayString = (val) => {
  return isString$1(val) ? val : val == null ? "" : isArray$2(val) || isObject$2(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef$2(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (isRef$2(val)) {
    return replacer(_key, val.value);
  } else if (isMap$2(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce(
        (entries, [key, val2], i) => {
          entries[stringifySymbol(key, i) + " =>"] = val2;
          return entries;
        },
        {}
      )
    };
  } else if (isSet$2(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v))
    };
  } else if (isSymbol$1(val)) {
    return stringifySymbol(val);
  } else if (isObject$2(val) && !isArray$2(val) && !isPlainObject$2(val)) {
    return String(val);
  }
  return val;
};
const stringifySymbol = (v, i = "") => {
  var _a;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    isSymbol$1(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v
  );
};
function normalizeCssVarValue(value) {
  if (value == null) {
    return "initial";
  }
  if (typeof value === "string") {
    return value === "" ? " " : value;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    if (false) {
      console.warn(
        "[Vue warn] Invalid value used for CSS binding. Expected a string or a finite number but received:",
        value
      );
    }
  }
  return String(value);
}

/**
* @vue/reactivity v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function warn$2(msg, ...args) {
  console.warn(`[Vue warn] ${msg}`, ...args);
}
let activeEffectScope;
class EffectScope {
  // TODO isolatedDeclarations "__v_skip"
  constructor(detached = false) {
    this.detached = detached;
    this._active = true;
    this._on = 0;
    this.effects = [];
    this.cleanups = [];
    this._isPaused = false;
    this.__v_skip = true;
    this.parent = activeEffectScope;
    if (!detached && activeEffectScope) {
      this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
        this
      ) - 1;
    }
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = true;
      let i, l;
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause();
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause();
      }
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active) {
      if (this._isPaused) {
        this._isPaused = false;
        let i, l;
        if (this.scopes) {
          for (i = 0, l = this.scopes.length; i < l; i++) {
            this.scopes[i].resume();
          }
        }
        for (i = 0, l = this.effects.length; i < l; i++) {
          this.effects[i].resume();
        }
      }
    }
  }
  run(fn) {
    if (this._active) {
      const currentEffectScope = activeEffectScope;
      try {
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = currentEffectScope;
      }
    } else if (false) {
      warn$2(`cannot run an inactive effect scope.`);
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    if (++this._on === 1) {
      this.prevScope = activeEffectScope;
      activeEffectScope = this;
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      activeEffectScope = this.prevScope;
      this.prevScope = void 0;
    }
  }
  stop(fromParent) {
    if (this._active) {
      this._active = false;
      let i, l;
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop();
      }
      this.effects.length = 0;
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]();
      }
      this.cleanups.length = 0;
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true);
        }
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes.pop();
        if (last && last !== this) {
          this.parent.scopes[this.index] = last;
          last.index = this.index;
        }
      }
      this.parent = void 0;
    }
  }
}
function effectScope(detached) {
  return new EffectScope(detached);
}
function getCurrentScope() {
  return activeEffectScope;
}
function onScopeDispose(fn, failSilently = false) {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn);
  } else if (false) {
    warn$2(
      `onScopeDispose() is called when there is no active effect scope to be associated with.`
    );
  }
}
let activeSub;
const EffectFlags = {
  "ACTIVE": 1,
  "1": "ACTIVE",
  "RUNNING": 2,
  "2": "RUNNING",
  "TRACKING": 4,
  "4": "TRACKING",
  "NOTIFIED": 8,
  "8": "NOTIFIED",
  "DIRTY": 16,
  "16": "DIRTY",
  "ALLOW_RECURSE": 32,
  "32": "ALLOW_RECURSE",
  "PAUSED": 64,
  "64": "PAUSED",
  "EVALUATED": 128,
  "128": "EVALUATED"
};
const pausedQueueEffects = /* @__PURE__ */ new WeakSet();
class ReactiveEffect {
  constructor(fn) {
    this.fn = fn;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 1 | 4;
    this.next = void 0;
    this.cleanup = void 0;
    this.scheduler = void 0;
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(this);
    }
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    if (this.flags & 64) {
      this.flags &= -65;
      if (pausedQueueEffects.has(this)) {
        pausedQueueEffects.delete(this);
        this.trigger();
      }
    }
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags & 2 && !(this.flags & 32)) {
      return;
    }
    if (!(this.flags & 8)) {
      batch(this);
    }
  }
  run() {
    if (!(this.flags & 1)) {
      return this.fn();
    }
    this.flags |= 2;
    cleanupEffect(this);
    prepareDeps(this);
    const prevEffect = activeSub;
    const prevShouldTrack = shouldTrack;
    activeSub = this;
    shouldTrack = true;
    try {
      return this.fn();
    } finally {
      if (false) {
        warn$2(
          "Active effect was not restored correctly - this is likely a Vue internal bug."
        );
      }
      cleanupDeps(this);
      activeSub = prevEffect;
      shouldTrack = prevShouldTrack;
      this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let link = this.deps; link; link = link.nextDep) {
        removeSub(link);
      }
      this.deps = this.depsTail = void 0;
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.flags &= -2;
    }
  }
  trigger() {
    if (this.flags & 64) {
      pausedQueueEffects.add(this);
    } else if (this.scheduler) {
      this.scheduler();
    } else {
      this.runIfDirty();
    }
  }
  /**
   * @internal
   */
  runIfDirty() {
    if (isDirty(this)) {
      this.run();
    }
  }
  get dirty() {
    return isDirty(this);
  }
}
let batchDepth = 0;
let batchedSub;
let batchedComputed;
function batch(sub, isComputed = false) {
  sub.flags |= 8;
  if (isComputed) {
    sub.next = batchedComputed;
    batchedComputed = sub;
    return;
  }
  sub.next = batchedSub;
  batchedSub = sub;
}
function startBatch() {
  batchDepth++;
}
function endBatch() {
  if (--batchDepth > 0) {
    return;
  }
  if (batchedComputed) {
    let e = batchedComputed;
    batchedComputed = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      e = next;
    }
  }
  let error;
  while (batchedSub) {
    let e = batchedSub;
    batchedSub = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      if (e.flags & 1) {
        try {
          ;
          e.trigger();
        } catch (err) {
          if (!error) error = err;
        }
      }
      e = next;
    }
  }
  if (error) throw error;
}
function prepareDeps(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    link.version = -1;
    link.prevActiveLink = link.dep.activeLink;
    link.dep.activeLink = link;
  }
}
function cleanupDeps(sub) {
  let head;
  let tail = sub.depsTail;
  let link = tail;
  while (link) {
    const prev = link.prevDep;
    if (link.version === -1) {
      if (link === tail) tail = prev;
      removeSub(link);
      removeDep(link);
    } else {
      head = link;
    }
    link.dep.activeLink = link.prevActiveLink;
    link.prevActiveLink = void 0;
    link = prev;
  }
  sub.deps = head;
  sub.depsTail = tail;
}
function isDirty(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) {
      return true;
    }
  }
  if (sub._dirty) {
    return true;
  }
  return false;
}
function refreshComputed(computed2) {
  if (computed2.flags & 4 && !(computed2.flags & 16)) {
    return;
  }
  computed2.flags &= -17;
  if (computed2.globalVersion === globalVersion) {
    return;
  }
  computed2.globalVersion = globalVersion;
  if (!computed2.isSSR && computed2.flags & 128 && (!computed2.deps && !computed2._dirty || !isDirty(computed2))) {
    return;
  }
  computed2.flags |= 2;
  const dep = computed2.dep;
  const prevSub = activeSub;
  const prevShouldTrack = shouldTrack;
  activeSub = computed2;
  shouldTrack = true;
  try {
    prepareDeps(computed2);
    const value = computed2.fn(computed2._value);
    if (dep.version === 0 || hasChanged(value, computed2._value)) {
      computed2.flags |= 128;
      computed2._value = value;
      dep.version++;
    }
  } catch (err) {
    dep.version++;
    throw err;
  } finally {
    activeSub = prevSub;
    shouldTrack = prevShouldTrack;
    cleanupDeps(computed2);
    computed2.flags &= -3;
  }
}
function removeSub(link, soft = false) {
  const { dep, prevSub, nextSub } = link;
  if (prevSub) {
    prevSub.nextSub = nextSub;
    link.prevSub = void 0;
  }
  if (nextSub) {
    nextSub.prevSub = prevSub;
    link.nextSub = void 0;
  }
  if (false) {
    dep.subsHead = nextSub;
  }
  if (dep.subs === link) {
    dep.subs = prevSub;
    if (!prevSub && dep.computed) {
      dep.computed.flags &= -5;
      for (let l = dep.computed.deps; l; l = l.nextDep) {
        removeSub(l, true);
      }
    }
  }
  if (!soft && !--dep.sc && dep.map) {
    dep.map.delete(dep.key);
  }
}
function removeDep(link) {
  const { prevDep, nextDep } = link;
  if (prevDep) {
    prevDep.nextDep = nextDep;
    link.prevDep = void 0;
  }
  if (nextDep) {
    nextDep.prevDep = prevDep;
    link.nextDep = void 0;
  }
}
function effect(fn, options) {
  if (fn.effect instanceof ReactiveEffect) {
    fn = fn.effect.fn;
  }
  const e = new ReactiveEffect(fn);
  if (options) {
    extend(e, options);
  }
  try {
    e.run();
  } catch (err) {
    e.stop();
    throw err;
  }
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}
function stop(runner) {
  runner.effect.stop();
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function enableTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = true;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function onEffectCleanup(fn, failSilently = false) {
  if (activeSub instanceof ReactiveEffect) {
    activeSub.cleanup = fn;
  } else if (false) {
    warn$2(
      `onEffectCleanup() was called when there was no active effect to associate with.`
    );
  }
}
function cleanupEffect(e) {
  const { cleanup } = e;
  e.cleanup = void 0;
  if (cleanup) {
    const prevSub = activeSub;
    activeSub = void 0;
    try {
      cleanup();
    } finally {
      activeSub = prevSub;
    }
  }
}
let globalVersion = 0;
class Link {
  constructor(sub, dep) {
    this.sub = sub;
    this.dep = dep;
    this.version = dep.version;
    this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Dep {
  // TODO isolatedDeclarations "__v_skip"
  constructor(computed2) {
    this.computed = computed2;
    this.version = 0;
    this.activeLink = void 0;
    this.subs = void 0;
    this.map = void 0;
    this.key = void 0;
    this.sc = 0;
    this.__v_skip = true;
    if (false) {
      this.subsHead = void 0;
    }
  }
  track(debugInfo) {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return;
    }
    let link = this.activeLink;
    if (link === void 0 || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub, this);
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link;
      } else {
        link.prevDep = activeSub.depsTail;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
      }
      addSub(link);
    } else if (link.version === -1) {
      link.version = this.version;
      if (link.nextDep) {
        const next = link.nextDep;
        next.prevDep = link.prevDep;
        if (link.prevDep) {
          link.prevDep.nextDep = next;
        }
        link.prevDep = activeSub.depsTail;
        link.nextDep = void 0;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
        if (activeSub.deps === link) {
          activeSub.deps = next;
        }
      }
    }
    if (false) {
      activeSub.onTrack(
        extend(
          {
            effect: activeSub
          },
          debugInfo
        )
      );
    }
    return link;
  }
  trigger(debugInfo) {
    this.version++;
    globalVersion++;
    this.notify(debugInfo);
  }
  notify(debugInfo) {
    startBatch();
    try {
      if (false) {
        for (let head = this.subsHead; head; head = head.nextSub) {
          if (head.sub.onTrigger && !(head.sub.flags & 8)) {
            head.sub.onTrigger(
              extend(
                {
                  effect: head.sub
                },
                debugInfo
              )
            );
          }
        }
      }
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          ;
          link.sub.dep.notify();
        }
      }
    } finally {
      endBatch();
    }
  }
}
function addSub(link) {
  link.dep.sc++;
  if (link.sub.flags & 4) {
    const computed2 = link.dep.computed;
    if (computed2 && !link.dep.subs) {
      computed2.flags |= 4 | 16;
      for (let l = computed2.deps; l; l = l.nextDep) {
        addSub(l);
      }
    }
    const currentTail = link.dep.subs;
    if (currentTail !== link) {
      link.prevSub = currentTail;
      if (currentTail) currentTail.nextSub = link;
    }
    if (false) {
      link.dep.subsHead = link;
    }
    link.dep.subs = link;
  }
}
const targetMap = /* @__PURE__ */ new WeakMap();
const ITERATE_KEY = /* @__PURE__ */ Symbol(
  false ? "Object iterate" : ""
);
const MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  false ? "Map keys iterate" : ""
);
const ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  false ? "Array iterate" : ""
);
function track(target, type, key) {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Dep());
      dep.map = depsMap;
      dep.key = key;
    }
    if (false) {
      dep.track({
        target,
        type,
        key
      });
    } else {
      dep.track();
    }
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    globalVersion++;
    return;
  }
  const run = (dep) => {
    if (dep) {
      if (false) {
        dep.trigger({
          target,
          type,
          key,
          newValue,
          oldValue,
          oldTarget
        });
      } else {
        dep.trigger();
      }
    }
  };
  startBatch();
  if (type === "clear") {
    depsMap.forEach(run);
  } else {
    const targetIsArray = isArray$2(target);
    const isArrayIndex = targetIsArray && isIntegerKey(key);
    if (targetIsArray && key === "length") {
      const newLength = Number(newValue);
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol$1(key2) && key2 >= newLength) {
          run(dep);
        }
      });
    } else {
      if (key !== void 0 || depsMap.has(void 0)) {
        run(depsMap.get(key));
      }
      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY));
      }
      switch (type) {
        case "add":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap$2(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isArrayIndex) {
            run(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap$2(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap$2(target)) {
            run(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
  }
  endBatch();
}
function getDepFromReactive(object, key) {
  const depMap = targetMap.get(object);
  return depMap && depMap.get(key);
}
function reactiveReadArray(array) {
  const raw = /* @__PURE__ */ toRaw$1(array);
  if (raw === array) return raw;
  track(raw, "iterate", ARRAY_ITERATE_KEY);
  return /* @__PURE__ */ isShallow(array) ? raw : raw.map(toReactive);
}
function shallowReadArray(arr) {
  track(arr = /* @__PURE__ */ toRaw$1(arr), "iterate", ARRAY_ITERATE_KEY);
  return arr;
}
function toWrapped(target, item) {
  if (/* @__PURE__ */ isReadonly$1(target)) {
    return /* @__PURE__ */ isReactive$1(target) ? toReadonly(toReactive(item)) : toReadonly(item);
  }
  return toReactive(item);
}
const arrayInstrumentations = {
  __proto__: null,
  [Symbol.iterator]() {
    return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
  },
  concat(...args) {
    return reactiveReadArray(this).concat(
      ...args.map((x) => isArray$2(x) ? reactiveReadArray(x) : x)
    );
  },
  entries() {
    return iterator(this, "entries", (value) => {
      value[1] = toWrapped(this, value[1]);
      return value;
    });
  },
  every(fn, thisArg) {
    return apply(this, "every", fn, thisArg, void 0, arguments);
  },
  filter(fn, thisArg) {
    return apply(
      this,
      "filter",
      fn,
      thisArg,
      (v) => v.map((item) => toWrapped(this, item)),
      arguments
    );
  },
  find(fn, thisArg) {
    return apply(
      this,
      "find",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findIndex(fn, thisArg) {
    return apply(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  findLast(fn, thisArg) {
    return apply(
      this,
      "findLast",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findLastIndex(fn, thisArg) {
    return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(fn, thisArg) {
    return apply(this, "forEach", fn, thisArg, void 0, arguments);
  },
  includes(...args) {
    return searchProxy(this, "includes", args);
  },
  indexOf(...args) {
    return searchProxy(this, "indexOf", args);
  },
  join(separator) {
    return reactiveReadArray(this).join(separator);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...args) {
    return searchProxy(this, "lastIndexOf", args);
  },
  map(fn, thisArg) {
    return apply(this, "map", fn, thisArg, void 0, arguments);
  },
  pop() {
    return noTracking(this, "pop");
  },
  push(...args) {
    return noTracking(this, "push", args);
  },
  reduce(fn, ...args) {
    return reduce(this, "reduce", fn, args);
  },
  reduceRight(fn, ...args) {
    return reduce(this, "reduceRight", fn, args);
  },
  shift() {
    return noTracking(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(fn, thisArg) {
    return apply(this, "some", fn, thisArg, void 0, arguments);
  },
  splice(...args) {
    return noTracking(this, "splice", args);
  },
  toReversed() {
    return reactiveReadArray(this).toReversed();
  },
  toSorted(comparer) {
    return reactiveReadArray(this).toSorted(comparer);
  },
  toSpliced(...args) {
    return reactiveReadArray(this).toSpliced(...args);
  },
  unshift(...args) {
    return noTracking(this, "unshift", args);
  },
  values() {
    return iterator(this, "values", (item) => toWrapped(this, item));
  }
};
function iterator(self, method, wrapValue) {
  const arr = shallowReadArray(self);
  const iter = arr[method]();
  if (arr !== self && !/* @__PURE__ */ isShallow(self)) {
    iter._next = iter.next;
    iter.next = () => {
      const result = iter._next();
      if (!result.done) {
        result.value = wrapValue(result.value);
      }
      return result;
    };
  }
  return iter;
}
const arrayProto = Array.prototype;
function apply(self, method, fn, thisArg, wrappedRetFn, args) {
  const arr = shallowReadArray(self);
  const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
  const methodFn = arr[method];
  if (methodFn !== arrayProto[method]) {
    const result2 = methodFn.apply(self, args);
    return needsWrap ? toReactive(result2) : result2;
  }
  let wrappedFn = fn;
  if (arr !== self) {
    if (needsWrap) {
      wrappedFn = function(item, index) {
        return fn.call(this, toWrapped(self, item), index, self);
      };
    } else if (fn.length > 2) {
      wrappedFn = function(item, index) {
        return fn.call(this, item, index, self);
      };
    }
  }
  const result = methodFn.call(arr, wrappedFn, thisArg);
  return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self, method, fn, args) {
  const arr = shallowReadArray(self);
  const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
  let wrappedFn = fn;
  let wrapInitialAccumulator = false;
  if (arr !== self) {
    if (needsWrap) {
      wrapInitialAccumulator = args.length === 0;
      wrappedFn = function(acc, item, index) {
        if (wrapInitialAccumulator) {
          wrapInitialAccumulator = false;
          acc = toWrapped(self, acc);
        }
        return fn.call(this, acc, toWrapped(self, item), index, self);
      };
    } else if (fn.length > 3) {
      wrappedFn = function(acc, item, index) {
        return fn.call(this, acc, item, index, self);
      };
    }
  }
  const result = arr[method](wrappedFn, ...args);
  return wrapInitialAccumulator ? toWrapped(self, result) : result;
}
function searchProxy(self, method, args) {
  const arr = /* @__PURE__ */ toRaw$1(self);
  track(arr, "iterate", ARRAY_ITERATE_KEY);
  const res = arr[method](...args);
  if ((res === -1 || res === false) && /* @__PURE__ */ isProxy(args[0])) {
    args[0] = /* @__PURE__ */ toRaw$1(args[0]);
    return arr[method](...args);
  }
  return res;
}
function noTracking(self, method, args = []) {
  pauseTracking();
  startBatch();
  const res = (/* @__PURE__ */ toRaw$1(self))[method].apply(self, args);
  endBatch();
  resetTracking();
  return res;
}
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol$1)
);
function hasOwnProperty(key) {
  if (!isSymbol$1(key)) key = String(key);
  const obj = /* @__PURE__ */ toRaw$1(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}
class BaseReactiveHandler {
  constructor(_isReadonly = false, _isShallow = false) {
    this._isReadonly = _isReadonly;
    this._isShallow = _isShallow;
  }
  get(target, key, receiver) {
    if (key === "__v_skip") return target["__v_skip"];
    const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_isShallow") {
      return isShallow2;
    } else if (key === "__v_raw") {
      if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
        return target;
      }
      return;
    }
    const targetIsArray = isArray$2(target);
    if (!isReadonly2) {
      let fn;
      if (targetIsArray && (fn = arrayInstrumentations[key])) {
        return fn;
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty;
      }
    }
    const res = Reflect.get(
      target,
      key,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ isRef$1(target) ? target : receiver
    );
    if (isSymbol$1(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (isShallow2) {
      return res;
    }
    if (/* @__PURE__ */ isRef$1(res)) {
      const value = targetIsArray && isIntegerKey(key) ? res : res.value;
      return isReadonly2 && isObject$2(value) ? /* @__PURE__ */ readonly(value) : value;
    }
    if (isObject$2(res)) {
      return isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res);
    }
    return res;
  }
}
class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(false, isShallow2);
  }
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const isArrayWithIntegerKey = isArray$2(target) && isIntegerKey(key);
    if (!this._isShallow) {
      const isOldValueReadonly = /* @__PURE__ */ isReadonly$1(oldValue);
      if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly$1(value)) {
        oldValue = /* @__PURE__ */ toRaw$1(oldValue);
        value = /* @__PURE__ */ toRaw$1(value);
      }
      if (!isArrayWithIntegerKey && /* @__PURE__ */ isRef$1(oldValue) && !/* @__PURE__ */ isRef$1(value)) {
        if (isOldValueReadonly) {
          if (false) {
            warn$2(
              `Set operation on key "${String(key)}" failed: target is readonly.`,
              target[key]
            );
          }
          return true;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(
      target,
      key,
      value,
      /* @__PURE__ */ isRef$1(target) ? target : receiver
    );
    if (target === /* @__PURE__ */ toRaw$1(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value, oldValue);
      }
    }
    return result;
  }
  deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol$1(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  ownKeys(target) {
    track(
      target,
      "iterate",
      isArray$2(target) ? "length" : ITERATE_KEY
    );
    return Reflect.ownKeys(target);
  }
}
class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(true, isShallow2);
  }
  set(target, key) {
    if (false) {
      warn$2(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target
      );
    }
    return true;
  }
  deleteProperty(target, key) {
    if (false) {
      warn$2(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      );
    }
    return true;
  }
}
const mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
const shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
const shallowReadonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler(true);
const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = /* @__PURE__ */ toRaw$1(target);
    const targetIsMap = isMap$2(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    !isReadonly2 && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return extend(
      // inheriting all iterator properties
      Object.create(innerIterator),
      {
        // iterator protocol
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        }
      }
    );
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    if (false) {
      const key = args[0] ? `on key "${args[0]}" ` : ``;
      warn$2(
        `${capitalize(type)} operation ${key}failed: target is readonly.`,
        /* @__PURE__ */ toRaw$1(this)
      );
    }
    return type === "delete" ? false : type === "clear" ? void 0 : this;
  };
}
function createInstrumentations(readonly2, shallow) {
  const instrumentations = {
    get(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw$1(target);
      const rawKey = /* @__PURE__ */ toRaw$1(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "get", key);
        }
        track(rawTarget, "get", rawKey);
      }
      const { has } = getProto(rawTarget);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
      } else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
      } else if (target !== rawTarget) {
        target.get(key);
      }
    },
    get size() {
      const target = this["__v_raw"];
      !readonly2 && track(/* @__PURE__ */ toRaw$1(target), "iterate", ITERATE_KEY);
      return target.size;
    },
    has(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw$1(target);
      const rawKey = /* @__PURE__ */ toRaw$1(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "has", key);
        }
        track(rawTarget, "has", rawKey);
      }
      return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    },
    forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw$1(target);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      !readonly2 && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    }
  };
  extend(
    instrumentations,
    readonly2 ? {
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear")
    } : {
      add(value) {
        const target = /* @__PURE__ */ toRaw$1(this);
        const proto = getProto(target);
        const rawValue = /* @__PURE__ */ toRaw$1(value);
        const valueToAdd = !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly$1(value) ? rawValue : value;
        const hadKey = proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue);
        if (!hadKey) {
          target.add(valueToAdd);
          trigger(target, "add", valueToAdd, valueToAdd);
        }
        return this;
      },
      set(key, value) {
        if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly$1(value)) {
          value = /* @__PURE__ */ toRaw$1(value);
        }
        const target = /* @__PURE__ */ toRaw$1(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw$1(key);
          hadKey = has.call(target, key);
        } else if (false) {
          checkIdentityKeys(target, has, key);
        }
        const oldValue = get.call(target, key);
        target.set(key, value);
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
        return this;
      },
      delete(key) {
        const target = /* @__PURE__ */ toRaw$1(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw$1(key);
          hadKey = has.call(target, key);
        } else if (false) {
          checkIdentityKeys(target, has, key);
        }
        const oldValue = get ? get.call(target, key) : void 0;
        const result = target.delete(key);
        if (hadKey) {
          trigger(target, "delete", key, void 0, oldValue);
        }
        return result;
      },
      clear() {
        const target = /* @__PURE__ */ toRaw$1(this);
        const hadItems = target.size !== 0;
        const oldTarget = false ? isMap$2(target) ? new Map(target) : new Set(target) : void 0;
        const result = target.clear();
        if (hadItems) {
          trigger(
            target,
            "clear",
            void 0,
            void 0,
            oldTarget
          );
        }
        return result;
      }
    }
  );
  const iteratorMethods = [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ];
  iteratorMethods.forEach((method) => {
    instrumentations[method] = createIterableMethod(method, readonly2, shallow);
  });
  return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
  const instrumentations = createInstrumentations(isReadonly2, shallow);
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const shallowReadonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, true)
};
function checkIdentityKeys(target, has, key) {
  const rawKey = /* @__PURE__ */ toRaw$1(key);
  if (rawKey !== key && has.call(target, rawKey)) {
    const type = toRawType(target);
    warn$2(
      `Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
    );
  }
}
const reactiveMap = /* @__PURE__ */ new WeakMap();
const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
const readonlyMap = /* @__PURE__ */ new WeakMap();
const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
  if (/* @__PURE__ */ isReadonly$1(target)) {
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowCollectionHandlers,
    shallowReactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyCollectionHandlers,
    shallowReadonlyMap
  );
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject$2(target)) {
    if (false) {
      warn$2(
        `value cannot be made ${isReadonly2 ? "readonly" : "reactive"}: ${String(
          target
        )}`
      );
    }
    return target;
  }
  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
    return target;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive$1(value) {
  if (/* @__PURE__ */ isReadonly$1(value)) {
    return /* @__PURE__ */ isReactive$1(value["__v_raw"]);
  }
  return !!(value && value["__v_isReactive"]);
}
// @__NO_SIDE_EFFECTS__
function isReadonly$1(value) {
  return !!(value && value["__v_isReadonly"]);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
  return !!(value && value["__v_isShallow"]);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
  return value ? !!value["__v_raw"] : false;
}
// @__NO_SIDE_EFFECTS__
function toRaw$1(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? /* @__PURE__ */ toRaw$1(raw) : observed;
}
function markRaw(value) {
  if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) {
    def(value, "__v_skip", true);
  }
  return value;
}
const toReactive = (value) => isObject$2(value) ? /* @__PURE__ */ reactive(value) : value;
const toReadonly = (value) => isObject$2(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef$1(r) {
  return r ? r["__v_isRef"] === true : false;
}
// @__NO_SIDE_EFFECTS__
function ref(value) {
  return createRef(value, false);
}
// @__NO_SIDE_EFFECTS__
function shallowRef(value) {
  return createRef(value, true);
}
function createRef(rawValue, shallow) {
  if (/* @__PURE__ */ isRef$1(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}
class RefImpl {
  constructor(value, isShallow2) {
    this.dep = new Dep();
    this["__v_isRef"] = true;
    this["__v_isShallow"] = false;
    this._rawValue = isShallow2 ? value : /* @__PURE__ */ toRaw$1(value);
    this._value = isShallow2 ? value : toReactive(value);
    this["__v_isShallow"] = isShallow2;
  }
  get value() {
    if (false) {
      this.dep.track({
        target: this,
        type: "get",
        key: "value"
      });
    } else {
      this.dep.track();
    }
    return this._value;
  }
  set value(newValue) {
    const oldValue = this._rawValue;
    const useDirectValue = this["__v_isShallow"] || /* @__PURE__ */ isShallow(newValue) || /* @__PURE__ */ isReadonly$1(newValue);
    newValue = useDirectValue ? newValue : /* @__PURE__ */ toRaw$1(newValue);
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue;
      this._value = useDirectValue ? newValue : toReactive(newValue);
      if (false) {
        this.dep.trigger({
          target: this,
          type: "set",
          key: "value",
          newValue,
          oldValue
        });
      } else {
        this.dep.trigger();
      }
    }
  }
}
function triggerRef(ref2) {
  if (ref2.dep) {
    if (false) {
      ref2.dep.trigger({
        target: ref2,
        type: "set",
        key: "value",
        newValue: ref2._value
      });
    } else {
      ref2.dep.trigger();
    }
  }
}
function unref(ref2) {
  return /* @__PURE__ */ isRef$1(ref2) ? ref2.value : ref2;
}
function toValue(source) {
  return isFunction(source) ? source() : unref(source);
}
const shallowUnwrapHandlers = {
  get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (/* @__PURE__ */ isRef$1(oldValue) && !/* @__PURE__ */ isRef$1(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};
function proxyRefs(objectWithRefs) {
  return /* @__PURE__ */ isReactive$1(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
class CustomRefImpl {
  constructor(factory) {
    this["__v_isRef"] = true;
    this._value = void 0;
    const dep = this.dep = new Dep();
    const { get, set } = factory(dep.track.bind(dep), dep.trigger.bind(dep));
    this._get = get;
    this._set = set;
  }
  get value() {
    return this._value = this._get();
  }
  set value(newVal) {
    this._set(newVal);
  }
}
function customRef(factory) {
  return new CustomRefImpl(factory);
}
// @__NO_SIDE_EFFECTS__
function toRefs(object) {
  if (false) {
    warn$2(`toRefs() expects a reactive object but received a plain one.`);
  }
  const ret = isArray$2(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = propertyToRef(object, key);
  }
  return ret;
}
class ObjectRefImpl {
  constructor(_object, key, _defaultValue) {
    this._object = _object;
    this._defaultValue = _defaultValue;
    this["__v_isRef"] = true;
    this._value = void 0;
    this._key = isSymbol$1(key) ? key : String(key);
    this._raw = /* @__PURE__ */ toRaw$1(_object);
    let shallow = true;
    let obj = _object;
    if (!isArray$2(_object) || isSymbol$1(this._key) || !isIntegerKey(this._key)) {
      do {
        shallow = !/* @__PURE__ */ isProxy(obj) || /* @__PURE__ */ isShallow(obj);
      } while (shallow && (obj = obj["__v_raw"]));
    }
    this._shallow = shallow;
  }
  get value() {
    let val = this._object[this._key];
    if (this._shallow) {
      val = unref(val);
    }
    return this._value = val === void 0 ? this._defaultValue : val;
  }
  set value(newVal) {
    if (this._shallow && /* @__PURE__ */ isRef$1(this._raw[this._key])) {
      const nestedRef = this._object[this._key];
      if (/* @__PURE__ */ isRef$1(nestedRef)) {
        nestedRef.value = newVal;
        return;
      }
    }
    this._object[this._key] = newVal;
  }
  get dep() {
    return getDepFromReactive(this._raw, this._key);
  }
}
class GetterRefImpl {
  constructor(_getter) {
    this._getter = _getter;
    this["__v_isRef"] = true;
    this["__v_isReadonly"] = true;
    this._value = void 0;
  }
  get value() {
    return this._value = this._getter();
  }
}
// @__NO_SIDE_EFFECTS__
function toRef(source, key, defaultValue) {
  if (/* @__PURE__ */ isRef$1(source)) {
    return source;
  } else if (isFunction(source)) {
    return new GetterRefImpl(source);
  } else if (isObject$2(source) && arguments.length > 1) {
    return propertyToRef(source, key, defaultValue);
  } else {
    return /* @__PURE__ */ ref(source);
  }
}
function propertyToRef(source, key, defaultValue) {
  return new ObjectRefImpl(source, key, defaultValue);
}
class ComputedRefImpl {
  constructor(fn, setter, isSSR) {
    this.fn = fn;
    this.setter = setter;
    this._value = void 0;
    this.dep = new Dep(this);
    this.__v_isRef = true;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 16;
    this.globalVersion = globalVersion - 1;
    this.next = void 0;
    this.effect = this;
    this["__v_isReadonly"] = !setter;
    this.isSSR = isSSR;
  }
  /**
   * @internal
   */
  notify() {
    this.flags |= 16;
    if (!(this.flags & 8) && // avoid infinite self recursion
    activeSub !== this) {
      batch(this, true);
      return true;
    } else if (false) ;
  }
  get value() {
    const link = false ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track();
    refreshComputed(this);
    if (link) {
      link.version = this.dep.version;
    }
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    } else if (false) {
      warn$2("Write operation failed: computed value is readonly");
    }
  }
}
// @__NO_SIDE_EFFECTS__
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, isSSR);
  if (false) {
    cRef.onTrack = debugOptions.onTrack;
    cRef.onTrigger = debugOptions.onTrigger;
  }
  return cRef;
}
const TrackOpTypes = {
  "GET": "get",
  "HAS": "has",
  "ITERATE": "iterate"
};
const TriggerOpTypes = {
  "SET": "set",
  "ADD": "add",
  "DELETE": "delete",
  "CLEAR": "clear"
};
const ReactiveFlags = {
  "SKIP": "__v_skip",
  "IS_REACTIVE": "__v_isReactive",
  "IS_READONLY": "__v_isReadonly",
  "IS_SHALLOW": "__v_isShallow",
  "RAW": "__v_raw",
  "IS_REF": "__v_isRef"
};
const WatchErrorCodes = {
  "WATCH_GETTER": 2,
  "2": "WATCH_GETTER",
  "WATCH_CALLBACK": 3,
  "3": "WATCH_CALLBACK",
  "WATCH_CLEANUP": 4,
  "4": "WATCH_CLEANUP"
};
const INITIAL_WATCHER_VALUE = {};
const cleanupMap = /* @__PURE__ */ new WeakMap();
let activeWatcher = void 0;
function getCurrentWatcher() {
  return activeWatcher;
}
function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
  if (owner) {
    let cleanups = cleanupMap.get(owner);
    if (!cleanups) cleanupMap.set(owner, cleanups = []);
    cleanups.push(cleanupFn);
  } else if (false) {
    warn$2(
      `onWatcherCleanup() was called when there was no active watcher to associate with.`
    );
  }
}
function watch$1(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, once, scheduler, augmentJob, call } = options;
  const warnInvalidSource = (s) => {
    (options.onWarn || warn$2)(
      `Invalid watch source: `,
      s,
      `A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.`
    );
  };
  const reactiveGetter = (source2) => {
    if (deep) return source2;
    if (/* @__PURE__ */ isShallow(source2) || deep === false || deep === 0)
      return traverse$1(source2, 1);
    return traverse$1(source2);
  };
  let effect2;
  let getter;
  let cleanup;
  let boundCleanup;
  let forceTrigger = false;
  let isMultiSource = false;
  if (/* @__PURE__ */ isRef$1(source)) {
    getter = () => source.value;
    forceTrigger = /* @__PURE__ */ isShallow(source);
  } else if (/* @__PURE__ */ isReactive$1(source)) {
    getter = () => reactiveGetter(source);
    forceTrigger = true;
  } else if (isArray$2(source)) {
    isMultiSource = true;
    forceTrigger = source.some((s) => /* @__PURE__ */ isReactive$1(s) || /* @__PURE__ */ isShallow(s));
    getter = () => source.map((s) => {
      if (/* @__PURE__ */ isRef$1(s)) {
        return s.value;
      } else if (/* @__PURE__ */ isReactive$1(s)) {
        return reactiveGetter(s);
      } else if (isFunction(s)) {
        return call ? call(s, 2) : s();
      } else {
      }
    });
  } else if (isFunction(source)) {
    if (cb) {
      getter = call ? () => call(source, 2) : source;
    } else {
      getter = () => {
        if (cleanup) {
          pauseTracking();
          try {
            cleanup();
          } finally {
            resetTracking();
          }
        }
        const currentEffect = activeWatcher;
        activeWatcher = effect2;
        try {
          return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
        } finally {
          activeWatcher = currentEffect;
        }
      };
    }
  } else {
    getter = NOOP$1;
  }
  if (cb && deep) {
    const baseGetter = getter;
    const depth = deep === true ? Infinity : deep;
    getter = () => traverse$1(baseGetter(), depth);
  }
  const scope = getCurrentScope();
  const watchHandle = () => {
    effect2.stop();
    if (scope && scope.active) {
      remove(scope.effects, effect2);
    }
  };
  if (once && cb) {
    const _cb = cb;
    cb = (...args) => {
      _cb(...args);
      watchHandle();
    };
  }
  let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
  const job = (immediateFirstRun) => {
    if (!(effect2.flags & 1) || !effect2.dirty && !immediateFirstRun) {
      return;
    }
    if (cb) {
      const newValue = effect2.run();
      if (deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
        if (cleanup) {
          cleanup();
        }
        const currentWatcher = activeWatcher;
        activeWatcher = effect2;
        try {
          const args = [
            newValue,
            // pass undefined as the old value when it's changed for the first time
            oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
            boundCleanup
          ];
          oldValue = newValue;
          call ? call(cb, 3, args) : (
            // @ts-expect-error
            cb(...args)
          );
        } finally {
          activeWatcher = currentWatcher;
        }
      }
    } else {
      effect2.run();
    }
  };
  if (augmentJob) {
    augmentJob(job);
  }
  effect2 = new ReactiveEffect(getter);
  effect2.scheduler = scheduler ? () => scheduler(job, false) : job;
  boundCleanup = (fn) => onWatcherCleanup(fn, false, effect2);
  cleanup = effect2.onStop = () => {
    const cleanups = cleanupMap.get(effect2);
    if (cleanups) {
      if (call) {
        call(cleanups, 4);
      } else {
        for (const cleanup2 of cleanups) cleanup2();
      }
      cleanupMap.delete(effect2);
    }
  };
  if (false) {
    effect2.onTrack = options.onTrack;
    effect2.onTrigger = options.onTrigger;
  }
  if (cb) {
    if (immediate) {
      job(true);
    } else {
      oldValue = effect2.run();
    }
  } else if (scheduler) {
    scheduler(job.bind(null, true), true);
  } else {
    effect2.run();
  }
  watchHandle.pause = effect2.pause.bind(effect2);
  watchHandle.resume = effect2.resume.bind(effect2);
  watchHandle.stop = watchHandle;
  return watchHandle;
}
function traverse$1(value, depth = Infinity, seen) {
  if (depth <= 0 || !isObject$2(value) || value["__v_skip"]) {
    return value;
  }
  seen = seen || /* @__PURE__ */ new Map();
  if ((seen.get(value) || 0) >= depth) {
    return value;
  }
  seen.set(value, depth);
  depth--;
  if (/* @__PURE__ */ isRef$1(value)) {
    traverse$1(value.value, depth, seen);
  } else if (isArray$2(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse$1(value[i], depth, seen);
    }
  } else if (isSet$2(value) || isMap$2(value)) {
    value.forEach((v) => {
      traverse$1(v, depth, seen);
    });
  } else if (isPlainObject$2(value)) {
    for (const key in value) {
      traverse$1(value[key], depth, seen);
    }
    for (const key of Object.getOwnPropertySymbols(value)) {
      if (Object.prototype.propertyIsEnumerable.call(value, key)) {
        traverse$1(value[key], depth, seen);
      }
    }
  }
  return value;
}

/**
* @vue/runtime-core v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const stack$1 = [];
function pushWarningContext(vnode) {
  stack$1.push(vnode);
}
function popWarningContext() {
  stack$1.pop();
}
let isWarning = false;
function warn$1(msg, ...args) {
  if (isWarning) return;
  isWarning = true;
  pauseTracking();
  const instance = stack$1.length ? stack$1[stack$1.length - 1].component : null;
  const appWarnHandler = instance && instance.appContext.config.warnHandler;
  const trace = getComponentTrace();
  if (appWarnHandler) {
    callWithErrorHandling(
      appWarnHandler,
      instance,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        msg + args.map((a) => {
          var _a, _b;
          return (_b = (_a = a.toString) == null ? void 0 : _a.call(a)) != null ? _b : JSON.stringify(a);
        }).join(""),
        instance && instance.proxy,
        trace.map(
          ({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`
        ).join("\n"),
        trace
      ]
    );
  } else {
    const warnArgs = [`[Vue warn]: ${msg}`, ...args];
    if (trace.length && // avoid spamming console during tests
    true) {
      warnArgs.push(`
`, ...formatTrace(trace));
    }
    console.warn(...warnArgs);
  }
  resetTracking();
  isWarning = false;
}
function getComponentTrace() {
  let currentVNode = stack$1[stack$1.length - 1];
  if (!currentVNode) {
    return [];
  }
  const normalizedStack = [];
  while (currentVNode) {
    const last = normalizedStack[0];
    if (last && last.vnode === currentVNode) {
      last.recurseCount++;
    } else {
      normalizedStack.push({
        vnode: currentVNode,
        recurseCount: 0
      });
    }
    const parentInstance = currentVNode.component && currentVNode.component.parent;
    currentVNode = parentInstance && parentInstance.vnode;
  }
  return normalizedStack;
}
function formatTrace(trace) {
  const logs = [];
  trace.forEach((entry, i) => {
    logs.push(...i === 0 ? [] : [`
`], ...formatTraceEntry(entry));
  });
  return logs;
}
function formatTraceEntry({ vnode, recurseCount }) {
  const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
  const isRoot = vnode.component ? vnode.component.parent == null : false;
  const open = ` at <${formatComponentName(
    vnode.component,
    vnode.type,
    isRoot
  )}`;
  const close = `>` + postfix;
  return vnode.props ? [open, ...formatProps(vnode.props), close] : [open + close];
}
function formatProps(props) {
  const res = [];
  const keys = Object.keys(props);
  keys.slice(0, 3).forEach((key) => {
    res.push(...formatProp(key, props[key]));
  });
  if (keys.length > 3) {
    res.push(` ...`);
  }
  return res;
}
function formatProp(key, value, raw) {
  if (isString$1(value)) {
    value = JSON.stringify(value);
    return raw ? value : [`${key}=${value}`];
  } else if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return raw ? value : [`${key}=${value}`];
  } else if (isRef$1(value)) {
    value = formatProp(key, toRaw$1(value.value), true);
    return raw ? value : [`${key}=Ref<`, value, `>`];
  } else if (isFunction(value)) {
    return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
  } else {
    value = toRaw$1(value);
    return raw ? value : [`${key}=`, value];
  }
}
function assertNumber(val, type) {
  if (true) return;
  if (val === void 0) {
    return;
  } else if (typeof val !== "number") {
    warn$1(`${type} is not a valid number - got ${JSON.stringify(val)}.`);
  } else if (isNaN(val)) {
    warn$1(`${type} is NaN - the duration expression might be incorrect.`);
  }
}
const ErrorCodes$1 = {
  "SETUP_FUNCTION": 0,
  "0": "SETUP_FUNCTION",
  "RENDER_FUNCTION": 1,
  "1": "RENDER_FUNCTION",
  "NATIVE_EVENT_HANDLER": 5,
  "5": "NATIVE_EVENT_HANDLER",
  "COMPONENT_EVENT_HANDLER": 6,
  "6": "COMPONENT_EVENT_HANDLER",
  "VNODE_HOOK": 7,
  "7": "VNODE_HOOK",
  "DIRECTIVE_HOOK": 8,
  "8": "DIRECTIVE_HOOK",
  "TRANSITION_HOOK": 9,
  "9": "TRANSITION_HOOK",
  "APP_ERROR_HANDLER": 10,
  "10": "APP_ERROR_HANDLER",
  "APP_WARN_HANDLER": 11,
  "11": "APP_WARN_HANDLER",
  "FUNCTION_REF": 12,
  "12": "FUNCTION_REF",
  "ASYNC_COMPONENT_LOADER": 13,
  "13": "ASYNC_COMPONENT_LOADER",
  "SCHEDULER": 14,
  "14": "SCHEDULER",
  "COMPONENT_UPDATE": 15,
  "15": "COMPONENT_UPDATE",
  "APP_UNMOUNT_CLEANUP": 16,
  "16": "APP_UNMOUNT_CLEANUP"
};
const ErrorTypeStrings$1 = {
  ["sp"]: "serverPrefetch hook",
  ["bc"]: "beforeCreate hook",
  ["c"]: "created hook",
  ["bm"]: "beforeMount hook",
  ["m"]: "mounted hook",
  ["bu"]: "beforeUpdate hook",
  ["u"]: "updated",
  ["bum"]: "beforeUnmount hook",
  ["um"]: "unmounted hook",
  ["a"]: "activated hook",
  ["da"]: "deactivated hook",
  ["ec"]: "errorCaptured hook",
  ["rtc"]: "renderTracked hook",
  ["rtg"]: "renderTriggered hook",
  [0]: "setup function",
  [1]: "render function",
  [2]: "watcher getter",
  [3]: "watcher callback",
  [4]: "watcher cleanup function",
  [5]: "native event handler",
  [6]: "component event handler",
  [7]: "vnode hook",
  [8]: "directive hook",
  [9]: "transition hook",
  [10]: "app errorHandler",
  [11]: "app warnHandler",
  [12]: "ref function",
  [13]: "async component loader",
  [14]: "scheduler flush",
  [15]: "component update",
  [16]: "app unmount cleanup function"
};
function callWithErrorHandling(fn, instance, type, args) {
  try {
    return args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance, type);
  }
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args);
    if (res && isPromise(res)) {
      res.catch((err) => {
        handleError(err, instance, type);
      });
    }
    return res;
  }
  if (isArray$2(fn)) {
    const values = [];
    for (let i = 0; i < fn.length; i++) {
      values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
    }
    return values;
  } else if (false) {
    warn$1(
      `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof fn}`
    );
  }
}
function handleError(err, instance, type, throwInDev = true) {
  const contextVNode = instance ? instance.vnode : null;
  const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
  if (instance) {
    let cur = instance.parent;
    const exposedInstance = instance.proxy;
    const errorInfo = false ? ErrorTypeStrings$1[type] : `https://vuejs.org/error-reference/#runtime-${type}`;
    while (cur) {
      const errorCapturedHooks = cur.ec;
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++) {
          if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
            return;
          }
        }
      }
      cur = cur.parent;
    }
    if (errorHandler) {
      pauseTracking();
      callWithErrorHandling(errorHandler, null, 10, [
        err,
        exposedInstance,
        errorInfo
      ]);
      resetTracking();
      return;
    }
  }
  logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
  if (false) {
    const info = ErrorTypeStrings$1[type];
    if (contextVNode) {
      pushWarningContext(contextVNode);
    }
    warn$1(`Unhandled error${info ? ` during execution of ${info}` : ``}`);
    if (contextVNode) {
      popWarningContext();
    }
    if (throwInDev) {
      throw err;
    } else {
      console.error(err);
    }
  } else if (throwInProd) {
    throw err;
  } else {
    console.error(err);
  }
}
const queue = [];
let flushIndex = -1;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = /* @__PURE__ */ Promise.resolve();
let currentFlushPromise = null;
const RECURSION_LIMIT = 100;
function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(this ? fn.bind(this) : fn) : p;
}
function findInsertionIndex(id) {
  let start = flushIndex + 1;
  let end = queue.length;
  while (start < end) {
    const middle = start + end >>> 1;
    const middleJob = queue[middle];
    const middleJobId = getId(middleJob);
    if (middleJobId < id || middleJobId === id && middleJob.flags & 2) {
      start = middle + 1;
    } else {
      end = middle;
    }
  }
  return start;
}
function queueJob(job) {
  if (!(job.flags & 1)) {
    const jobId = getId(job);
    const lastJob = queue[queue.length - 1];
    if (!lastJob || // fast path when the job id is larger than the tail
    !(job.flags & 2) && jobId >= getId(lastJob)) {
      queue.push(job);
    } else {
      queue.splice(findInsertionIndex(jobId), 0, job);
    }
    job.flags |= 1;
    queueFlush();
  }
}
function queueFlush() {
  if (!currentFlushPromise) {
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
function queuePostFlushCb(cb) {
  if (!isArray$2(cb)) {
    if (activePostFlushCbs && cb.id === -1) {
      activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
    } else if (!(cb.flags & 1)) {
      pendingPostFlushCbs.push(cb);
      cb.flags |= 1;
    }
  } else {
    pendingPostFlushCbs.push(...cb);
  }
  queueFlush();
}
function flushPreFlushCbs(instance, seen, i = flushIndex + 1) {
  if (false) {
    seen = seen || /* @__PURE__ */ new Map();
  }
  for (; i < queue.length; i++) {
    const cb = queue[i];
    if (cb && cb.flags & 2) {
      if (instance && cb.id !== instance.uid) {
        continue;
      }
      if (false) {
        continue;
      }
      queue.splice(i, 1);
      i--;
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      cb();
      if (!(cb.flags & 4)) {
        cb.flags &= -2;
      }
    }
  }
}
function flushPostFlushCbs(seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)].sort(
      (a, b) => getId(a) - getId(b)
    );
    pendingPostFlushCbs.length = 0;
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped);
      return;
    }
    activePostFlushCbs = deduped;
    if (false) {
      seen = seen || /* @__PURE__ */ new Map();
    }
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      const cb = activePostFlushCbs[postFlushIndex];
      if (false) {
        continue;
      }
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      if (!(cb.flags & 8)) cb();
      cb.flags &= -2;
    }
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}
const getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
function flushJobs(seen) {
  if (false) {
    seen = seen || /* @__PURE__ */ new Map();
  }
  const check = false ? (job) => checkRecursiveUpdates(seen, job) : NOOP$1;
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job && !(job.flags & 8)) {
        if (false) {
          continue;
        }
        if (job.flags & 4) {
          job.flags &= ~1;
        }
        callWithErrorHandling(
          job,
          job.i,
          job.i ? 15 : 14
        );
        if (!(job.flags & 4)) {
          job.flags &= ~1;
        }
      }
    }
  } finally {
    for (; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job) {
        job.flags &= -2;
      }
    }
    flushIndex = -1;
    queue.length = 0;
    flushPostFlushCbs(seen);
    currentFlushPromise = null;
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen);
    }
  }
}
function checkRecursiveUpdates(seen, fn) {
  const count = seen.get(fn) || 0;
  if (count > RECURSION_LIMIT) {
    const instance = fn.i;
    const componentName = instance && getComponentName$1(instance.type);
    handleError(
      `Maximum recursive updates exceeded${componentName ? ` in component <${componentName}>` : ``}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
      null,
      10
    );
    return true;
  }
  seen.set(fn, count + 1);
  return false;
}
let isHmrUpdating = false;
const setHmrUpdating = (v) => {
  try {
    return isHmrUpdating;
  } finally {
    isHmrUpdating = v;
  }
};
const hmrDirtyComponents = /* @__PURE__ */ new Map();
if (false) {
  getGlobalThis().__VUE_HMR_RUNTIME__ = {
    createRecord: tryWrap(createRecord),
    rerender: tryWrap(rerender),
    reload: tryWrap(reload)
  };
}
const map = /* @__PURE__ */ new Map();
function registerHMR(instance) {
  const id = instance.type.__hmrId;
  let record = map.get(id);
  if (!record) {
    createRecord(id, instance.type);
    record = map.get(id);
  }
  record.instances.add(instance);
}
function unregisterHMR(instance) {
  map.get(instance.type.__hmrId).instances.delete(instance);
}
function createRecord(id, initialDef) {
  if (map.has(id)) {
    return false;
  }
  map.set(id, {
    initialDef: normalizeClassComponent(initialDef),
    instances: /* @__PURE__ */ new Set()
  });
  return true;
}
function normalizeClassComponent(component) {
  return isClassComponent(component) ? component.__vccOpts : component;
}
function rerender(id, newRender) {
  const record = map.get(id);
  if (!record) {
    return;
  }
  record.initialDef.render = newRender;
  [...record.instances].forEach((instance) => {
    if (newRender) {
      instance.render = newRender;
      normalizeClassComponent(instance.type).render = newRender;
    }
    instance.renderCache = [];
    isHmrUpdating = true;
    if (!(instance.job.flags & 8)) {
      instance.update();
    }
    isHmrUpdating = false;
  });
}
function reload(id, newComp) {
  const record = map.get(id);
  if (!record) return;
  newComp = normalizeClassComponent(newComp);
  updateComponentDef(record.initialDef, newComp);
  const instances = [...record.instances];
  for (let i = 0; i < instances.length; i++) {
    const instance = instances[i];
    const oldComp = normalizeClassComponent(instance.type);
    let dirtyInstances = hmrDirtyComponents.get(oldComp);
    if (!dirtyInstances) {
      if (oldComp !== record.initialDef) {
        updateComponentDef(oldComp, newComp);
      }
      hmrDirtyComponents.set(oldComp, dirtyInstances = /* @__PURE__ */ new Set());
    }
    dirtyInstances.add(instance);
    instance.appContext.propsCache.delete(instance.type);
    instance.appContext.emitsCache.delete(instance.type);
    instance.appContext.optionsCache.delete(instance.type);
    if (instance.ceReload) {
      dirtyInstances.add(instance);
      instance.ceReload(newComp.styles);
      dirtyInstances.delete(instance);
    } else if (instance.parent) {
      queueJob(() => {
        if (!(instance.job.flags & 8)) {
          isHmrUpdating = true;
          instance.parent.update();
          isHmrUpdating = false;
          dirtyInstances.delete(instance);
        }
      });
    } else if (instance.appContext.reload) {
      instance.appContext.reload();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      console.warn(
        "[HMR] Root or manually mounted instance modified. Full reload required."
      );
    }
    if (instance.root.ce && instance !== instance.root) {
      instance.root.ce._removeChildStyle(oldComp);
    }
  }
  queuePostFlushCb(() => {
    hmrDirtyComponents.clear();
  });
}
function updateComponentDef(oldComp, newComp) {
  extend(oldComp, newComp);
  for (const key in oldComp) {
    if (key !== "__file" && !(key in newComp)) {
      delete oldComp[key];
    }
  }
}
function tryWrap(fn) {
  return (id, arg) => {
    try {
      return fn(id, arg);
    } catch (e) {
      console.error(e);
      console.warn(
        `[HMR] Something went wrong during Vue component hot-reload. Full reload required.`
      );
    }
  };
}
let devtools$1;
let buffer = [];
let devtoolsNotInstalled = false;
function emit$1(event, ...args) {
  if (devtools$1) {
    devtools$1.emit(event, ...args);
  } else if (!devtoolsNotInstalled) {
    buffer.push({ event, args });
  }
}
function setDevtoolsHook$1(hook, target) {
  var _a, _b;
  devtools$1 = hook;
  if (devtools$1) {
    devtools$1.enabled = true;
    buffer.forEach(({ event, args }) => devtools$1.emit(event, ...args));
    buffer = [];
  } else if (
    // handle late devtools injection - only do this if we are in an actual
    // browser environment to avoid the timer handle stalling test runner exit
    // (#4815)
    typeof window !== "undefined" && // some envs mock window but not fully
    window.HTMLElement && // also exclude jsdom
    // eslint-disable-next-line no-restricted-syntax
    !((_b = (_a = window.navigator) == null ? void 0 : _a.userAgent) == null ? void 0 : _b.includes("jsdom"))
  ) {
    const replay = target.__VUE_DEVTOOLS_HOOK_REPLAY__ = target.__VUE_DEVTOOLS_HOOK_REPLAY__ || [];
    replay.push((newHook) => {
      setDevtoolsHook$1(newHook, target);
    });
    setTimeout(() => {
      if (!devtools$1) {
        target.__VUE_DEVTOOLS_HOOK_REPLAY__ = null;
        devtoolsNotInstalled = true;
        buffer = [];
      }
    }, 3e3);
  } else {
    devtoolsNotInstalled = true;
    buffer = [];
  }
}
function devtoolsInitApp(app, version2) {
  emit$1("app:init", app, version2, {
    Fragment: Fragment$1,
    Text,
    Comment,
    Static
  });
}
function devtoolsUnmountApp(app) {
  emit$1("app:unmount", app);
}
const devtoolsComponentAdded = /* @__PURE__ */ createDevtoolsComponentHook(
  "component:added"
  /* COMPONENT_ADDED */
);
const devtoolsComponentUpdated = /* @__PURE__ */ createDevtoolsComponentHook(
  "component:updated"
  /* COMPONENT_UPDATED */
);
const _devtoolsComponentRemoved = /* @__PURE__ */ createDevtoolsComponentHook(
  "component:removed"
  /* COMPONENT_REMOVED */
);
const devtoolsComponentRemoved = (component) => {
  if (devtools$1 && typeof devtools$1.cleanupBuffer === "function" && // remove the component if it wasn't buffered
  !devtools$1.cleanupBuffer(component)) {
    _devtoolsComponentRemoved(component);
  }
};
// @__NO_SIDE_EFFECTS__
function createDevtoolsComponentHook(hook) {
  return (component) => {
    emit$1(
      hook,
      component.appContext.app,
      component.uid,
      component.parent ? component.parent.uid : void 0,
      component
    );
  };
}
const devtoolsPerfStart = /* @__PURE__ */ createDevtoolsPerformanceHook(
  "perf:start"
  /* PERFORMANCE_START */
);
const devtoolsPerfEnd = /* @__PURE__ */ createDevtoolsPerformanceHook(
  "perf:end"
  /* PERFORMANCE_END */
);
function createDevtoolsPerformanceHook(hook) {
  return (component, type, time) => {
    emit$1(hook, component.appContext.app, component.uid, component, type, time);
  };
}
function devtoolsComponentEmit(component, event, params) {
  emit$1(
    "component:emit",
    component.appContext.app,
    component,
    event,
    params
  );
}
let currentRenderingInstance = null;
let currentScopeId = null;
function setCurrentRenderingInstance(instance) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  currentScopeId = instance && instance.type.__scopeId || null;
  return prev;
}
function pushScopeId(id) {
  currentScopeId = id;
}
function popScopeId() {
  currentScopeId = null;
}
const withScopeId = (_id) => withCtx;
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
  if (!ctx) return fn;
  if (fn._n) {
    return fn;
  }
  const renderFnWithContext = (...args) => {
    if (renderFnWithContext._d) {
      setBlockTracking(-1);
    }
    const prevInstance = setCurrentRenderingInstance(ctx);
    let res;
    try {
      res = fn(...args);
    } finally {
      setCurrentRenderingInstance(prevInstance);
      if (renderFnWithContext._d) {
        setBlockTracking(1);
      }
    }
    if (true) {
      devtoolsComponentUpdated(ctx);
    }
    return res;
  };
  renderFnWithContext._n = true;
  renderFnWithContext._c = true;
  renderFnWithContext._d = true;
  return renderFnWithContext;
}
function validateDirectiveName(name) {
  if (isBuiltInDirective(name)) {
    warn$1("Do not use built-in directive ids as custom directive id: " + name);
  }
}
function withDirectives(vnode, directives) {
  if (currentRenderingInstance === null) {
    return vnode;
  }
  const instance = getComponentPublicInstance(currentRenderingInstance);
  const bindings = vnode.dirs || (vnode.dirs = []);
  for (let i = 0; i < directives.length; i++) {
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
    if (dir) {
      if (isFunction(dir)) {
        dir = {
          mounted: dir,
          updated: dir
        };
      }
      if (dir.deep) {
        traverse$1(value);
      }
      bindings.push({
        dir,
        instance,
        value,
        oldValue: void 0,
        arg,
        modifiers
      });
    }
  }
  return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
  const bindings = vnode.dirs;
  const oldBindings = prevVNode && prevVNode.dirs;
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value;
    }
    let hook = binding.dir[name];
    if (hook) {
      pauseTracking();
      callWithAsyncErrorHandling(hook, instance, 8, [
        vnode.el,
        binding,
        vnode,
        prevVNode
      ]);
      resetTracking();
    }
  }
}
function provide(key, value) {
  if (false) {
    if (!currentInstance || currentInstance.isMounted) {
      warn$1(`provide() can only be used inside setup().`);
    }
  }
  if (currentInstance) {
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = getCurrentInstance();
  if (instance || currentApp) {
    let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
    } else if (false) {
      warn$1(`injection "${String(key)}" not found.`);
    }
  } else if (false) {
    warn$1(`inject() can only be used inside setup() or functional components.`);
  }
}
function hasInjectionContext() {
  return !!(getCurrentInstance() || currentApp);
}
const ssrContextKey = /* @__PURE__ */ Symbol.for("v-scx");
const useSSRContext = () => {
  {
    const ctx = inject(ssrContextKey);
    if (!ctx) {
    }
    return ctx;
  }
};
function watchEffect(effect2, options) {
  return doWatch(effect2, null, options);
}
function watchPostEffect(effect2, options) {
  return doWatch(
    effect2,
    null,
    false ? extend({}, options, { flush: "post" }) : { flush: "post" }
  );
}
function watchSyncEffect(effect2, options) {
  return doWatch(
    effect2,
    null,
    false ? extend({}, options, { flush: "sync" }) : { flush: "sync" }
  );
}
function watch(source, cb, options) {
  if (false) {
    warn$1(
      `\`watch(fn, options?)\` signature has been moved to a separate API. Use \`watchEffect(fn, options?)\` instead. \`watch\` now only supports \`watch(source, cb, options?) signature.`
    );
  }
  return doWatch(source, cb, options);
}
function doWatch(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, flush, once } = options;
  if (false) {
    if (immediate !== void 0) {
      warn$1(
        `watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.`
      );
    }
    if (deep !== void 0) {
      warn$1(
        `watch() "deep" option is only respected when using the watch(source, callback, options?) signature.`
      );
    }
    if (once !== void 0) {
      warn$1(
        `watch() "once" option is only respected when using the watch(source, callback, options?) signature.`
      );
    }
  }
  const baseWatchOptions = extend({}, options);
  if (false) baseWatchOptions.onWarn = warn$1;
  const runsImmediately = cb && immediate || !cb && flush !== "post";
  let ssrCleanup;
  if (isInSSRComponentSetup) {
    if (flush === "sync") {
      const ctx = useSSRContext();
      ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
    } else if (!runsImmediately) {
      const watchStopHandle = () => {
      };
      watchStopHandle.stop = NOOP$1;
      watchStopHandle.resume = NOOP$1;
      watchStopHandle.pause = NOOP$1;
      return watchStopHandle;
    }
  }
  const instance = currentInstance;
  baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
  let isPre = false;
  if (flush === "post") {
    baseWatchOptions.scheduler = (job) => {
      queuePostRenderEffect(job, instance && instance.suspense);
    };
  } else if (flush !== "sync") {
    isPre = true;
    baseWatchOptions.scheduler = (job, isFirstRun) => {
      if (isFirstRun) {
        job();
      } else {
        queueJob(job);
      }
    };
  }
  baseWatchOptions.augmentJob = (job) => {
    if (cb) {
      job.flags |= 4;
    }
    if (isPre) {
      job.flags |= 2;
      if (instance) {
        job.id = instance.uid;
        job.i = instance;
      }
    }
  };
  const watchHandle = watch$1(source, cb, baseWatchOptions);
  if (isInSSRComponentSetup) {
    if (ssrCleanup) {
      ssrCleanup.push(watchHandle);
    } else if (runsImmediately) {
      watchHandle();
    }
  }
  return watchHandle;
}
function instanceWatch(source, value, options) {
  const publicThis = this.proxy;
  const getter = isString$1(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
  let cb;
  if (isFunction(value)) {
    cb = value;
  } else {
    cb = value.handler;
    options = value;
  }
  const reset = setCurrentInstance(this);
  const res = doWatch(getter, cb.bind(publicThis), options);
  reset();
  return res;
}
function createPathGetter(ctx, path) {
  const segments = path.split(".");
  return () => {
    let cur = ctx;
    for (let i = 0; i < segments.length && cur; i++) {
      cur = cur[segments[i]];
    }
    return cur;
  };
}
const pendingMounts = /* @__PURE__ */ new WeakMap();
const TeleportEndKey = /* @__PURE__ */ Symbol("_vte");
const isTeleport = (type) => type.__isTeleport;
const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === "");
const isTeleportDeferred = (props) => props && (props.defer || props.defer === "");
const isTargetSVG = (target) => typeof SVGElement !== "undefined" && target instanceof SVGElement;
const isTargetMathML = (target) => typeof MathMLElement === "function" && target instanceof MathMLElement;
const resolveTarget = (props, select) => {
  const targetSelector = props && props.to;
  if (isString$1(targetSelector)) {
    if (!select) {
      return null;
    } else {
      const target = select(targetSelector);
      if (false) {
        warn$1(
          `Failed to locate Teleport target with selector "${targetSelector}". Note the target element must exist before the component is mounted - i.e. the target cannot be rendered by the component itself, and ideally should be outside of the entire Vue component tree.`
        );
      }
      return target;
    }
  } else {
    if (false) {
      warn$1(`Invalid Teleport target: ${targetSelector}`);
    }
    return targetSelector;
  }
};
const TeleportImpl = {
  name: "Teleport",
  __isTeleport: true,
  process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals) {
    const {
      mc: mountChildren,
      pc: patchChildren,
      pbc: patchBlockChildren,
      o: { insert, querySelector, createText, createComment }
    } = internals;
    const disabled = isTeleportDisabled(n2.props);
    let { dynamicChildren } = n2;
    if (false) {
      optimized = false;
      dynamicChildren = null;
    }
    const mount = (vnode, container2, anchor2) => {
      if (vnode.shapeFlag & 16) {
        mountChildren(
          vnode.children,
          container2,
          anchor2,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    };
    const mountToTarget = (vnode = n2) => {
      const disabled2 = isTeleportDisabled(vnode.props);
      const target = vnode.target = resolveTarget(vnode.props, querySelector);
      const targetAnchor = prepareAnchor(target, vnode, createText, insert);
      if (target) {
        if (namespace !== "svg" && isTargetSVG(target)) {
          namespace = "svg";
        } else if (namespace !== "mathml" && isTargetMathML(target)) {
          namespace = "mathml";
        }
        if (parentComponent && parentComponent.isCE) {
          (parentComponent.ce._teleportTargets || (parentComponent.ce._teleportTargets = /* @__PURE__ */ new Set())).add(target);
        }
        if (!disabled2) {
          mount(vnode, target, targetAnchor);
          updateCssVars(vnode, false);
        }
      } else if (false) {
        warn$1("Invalid Teleport target on mount:", target, `(${typeof target})`);
      }
    };
    const queuePendingMount = (vnode) => {
      const mountJob = () => {
        if (pendingMounts.get(vnode) !== mountJob) return;
        pendingMounts.delete(vnode);
        if (isTeleportDisabled(vnode.props)) {
          mount(vnode, container, vnode.anchor);
          updateCssVars(vnode, true);
        }
        mountToTarget(vnode);
      };
      pendingMounts.set(vnode, mountJob);
      queuePostRenderEffect(mountJob, parentSuspense);
    };
    if (n1 == null) {
      const placeholder = n2.el = false ? createComment("teleport start") : createText("");
      const mainAnchor = n2.anchor = false ? createComment("teleport end") : createText("");
      insert(placeholder, container, anchor);
      insert(mainAnchor, container, anchor);
      if (isTeleportDeferred(n2.props) || parentSuspense && parentSuspense.pendingBranch) {
        queuePendingMount(n2);
        return;
      }
      if (disabled) {
        mount(n2, container, mainAnchor);
        updateCssVars(n2, true);
      }
      mountToTarget();
    } else {
      n2.el = n1.el;
      const mainAnchor = n2.anchor = n1.anchor;
      const pendingMount = pendingMounts.get(n1);
      if (pendingMount) {
        pendingMount.flags |= 8;
        pendingMounts.delete(n1);
        queuePendingMount(n2);
        return;
      }
      n2.targetStart = n1.targetStart;
      const target = n2.target = n1.target;
      const targetAnchor = n2.targetAnchor = n1.targetAnchor;
      const wasDisabled = isTeleportDisabled(n1.props);
      const currentContainer = wasDisabled ? container : target;
      const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
      if (namespace === "svg" || isTargetSVG(target)) {
        namespace = "svg";
      } else if (namespace === "mathml" || isTargetMathML(target)) {
        namespace = "mathml";
      }
      if (dynamicChildren) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          currentContainer,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds
        );
        traverseStaticChildren(n1, n2, true);
      } else if (!optimized) {
        patchChildren(
          n1,
          n2,
          currentContainer,
          currentAnchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          false
        );
      }
      if (disabled) {
        if (!wasDisabled) {
          moveTeleport(
            n2,
            container,
            mainAnchor,
            internals,
            1
          );
        } else {
          if (n2.props && n1.props && n2.props.to !== n1.props.to) {
            n2.props.to = n1.props.to;
          }
        }
      } else {
        if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
          const nextTarget = n2.target = resolveTarget(
            n2.props,
            querySelector
          );
          if (nextTarget) {
            moveTeleport(
              n2,
              nextTarget,
              null,
              internals,
              0
            );
          } else if (false) {
            warn$1(
              "Invalid Teleport target on update:",
              target,
              `(${typeof target})`
            );
          }
        } else if (wasDisabled) {
          moveTeleport(
            n2,
            target,
            targetAnchor,
            internals,
            1
          );
        }
      }
      updateCssVars(n2, disabled);
    }
  },
  remove(vnode, parentComponent, parentSuspense, { um: unmount, o: { remove: hostRemove } }, doRemove) {
    const {
      shapeFlag,
      children,
      anchor,
      targetStart,
      targetAnchor,
      target,
      props
    } = vnode;
    let shouldRemove = doRemove || !isTeleportDisabled(props);
    const pendingMount = pendingMounts.get(vnode);
    if (pendingMount) {
      pendingMount.flags |= 8;
      pendingMounts.delete(vnode);
      shouldRemove = false;
    }
    if (target) {
      hostRemove(targetStart);
      hostRemove(targetAnchor);
    }
    doRemove && hostRemove(anchor);
    if (shapeFlag & 16) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        unmount(
          child,
          parentComponent,
          parentSuspense,
          shouldRemove,
          !!child.dynamicChildren
        );
      }
    }
  },
  move: moveTeleport,
  hydrate: hydrateTeleport
};
function moveTeleport(vnode, container, parentAnchor, { o: { insert }, m: move }, moveType = 2) {
  if (moveType === 0) {
    insert(vnode.targetAnchor, container, parentAnchor);
  }
  const { el, anchor, shapeFlag, children, props } = vnode;
  const isReorder = moveType === 2;
  if (isReorder) {
    insert(el, container, parentAnchor);
  }
  if (!isReorder || isTeleportDisabled(props)) {
    if (shapeFlag & 16) {
      for (let i = 0; i < children.length; i++) {
        move(
          children[i],
          container,
          parentAnchor,
          2
        );
      }
    }
  }
  if (isReorder) {
    insert(anchor, container, parentAnchor);
  }
}
function hydrateTeleport(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, {
  o: { nextSibling, parentNode, querySelector, insert, createText }
}, hydrateChildren) {
  function hydrateAnchor(target2, targetNode) {
    let targetAnchor = targetNode;
    while (targetAnchor) {
      if (targetAnchor && targetAnchor.nodeType === 8) {
        if (targetAnchor.data === "teleport start anchor") {
          vnode.targetStart = targetAnchor;
        } else if (targetAnchor.data === "teleport anchor") {
          vnode.targetAnchor = targetAnchor;
          target2._lpa = vnode.targetAnchor && nextSibling(vnode.targetAnchor);
          break;
        }
      }
      targetAnchor = nextSibling(targetAnchor);
    }
  }
  function hydrateDisabledTeleport(node2, vnode2) {
    vnode2.anchor = hydrateChildren(
      nextSibling(node2),
      vnode2,
      parentNode(node2),
      parentComponent,
      parentSuspense,
      slotScopeIds,
      optimized
    );
  }
  const target = vnode.target = resolveTarget(
    vnode.props,
    querySelector
  );
  const disabled = isTeleportDisabled(vnode.props);
  if (target) {
    const targetNode = target._lpa || target.firstChild;
    if (vnode.shapeFlag & 16) {
      if (disabled) {
        hydrateDisabledTeleport(node, vnode);
        hydrateAnchor(target, targetNode);
        if (!vnode.targetAnchor) {
          prepareAnchor(
            target,
            vnode,
            createText,
            insert,
            // if target is the same as the main view, insert anchors before current node
            // to avoid hydrating mismatch
            parentNode(node) === target ? node : null
          );
        }
      } else {
        vnode.anchor = nextSibling(node);
        hydrateAnchor(target, targetNode);
        if (!vnode.targetAnchor) {
          prepareAnchor(target, vnode, createText, insert);
        }
        hydrateChildren(
          targetNode && nextSibling(targetNode),
          vnode,
          target,
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
      }
    }
    updateCssVars(vnode, disabled);
  } else if (disabled) {
    if (vnode.shapeFlag & 16) {
      hydrateDisabledTeleport(node, vnode);
      vnode.targetStart = node;
      vnode.targetAnchor = nextSibling(node);
    }
  }
  return vnode.anchor && nextSibling(vnode.anchor);
}
const Teleport = TeleportImpl;
function updateCssVars(vnode, isDisabled) {
  const ctx = vnode.ctx;
  if (ctx && ctx.ut) {
    let node, anchor;
    if (isDisabled) {
      node = vnode.el;
      anchor = vnode.anchor;
    } else {
      node = vnode.targetStart;
      anchor = vnode.targetAnchor;
    }
    while (node && node !== anchor) {
      if (node.nodeType === 1) node.setAttribute("data-v-owner", ctx.uid);
      node = node.nextSibling;
    }
    ctx.ut();
  }
}
function prepareAnchor(target, vnode, createText, insert, anchor = null) {
  const targetStart = vnode.targetStart = createText("");
  const targetAnchor = vnode.targetAnchor = createText("");
  targetStart[TeleportEndKey] = targetAnchor;
  if (target) {
    insert(targetStart, target, anchor);
    insert(targetAnchor, target, anchor);
  }
  return targetAnchor;
}
const leaveCbKey = /* @__PURE__ */ Symbol("_leaveCb");
const enterCbKey$1 = /* @__PURE__ */ Symbol("_enterCb");
function useTransitionState() {
  const state = {
    isMounted: false,
    isLeaving: false,
    isUnmounting: false,
    leavingVNodes: /* @__PURE__ */ new Map()
  };
  onMounted(() => {
    state.isMounted = true;
  });
  onBeforeUnmount(() => {
    state.isUnmounting = true;
  });
  return state;
}
const TransitionHookValidator = [Function, Array];
const BaseTransitionPropsValidators = {
  mode: String,
  appear: Boolean,
  persisted: Boolean,
  // enter
  onBeforeEnter: TransitionHookValidator,
  onEnter: TransitionHookValidator,
  onAfterEnter: TransitionHookValidator,
  onEnterCancelled: TransitionHookValidator,
  // leave
  onBeforeLeave: TransitionHookValidator,
  onLeave: TransitionHookValidator,
  onAfterLeave: TransitionHookValidator,
  onLeaveCancelled: TransitionHookValidator,
  // appear
  onBeforeAppear: TransitionHookValidator,
  onAppear: TransitionHookValidator,
  onAfterAppear: TransitionHookValidator,
  onAppearCancelled: TransitionHookValidator
};
const recursiveGetSubtree = (instance) => {
  const subTree = instance.subTree;
  return subTree.component ? recursiveGetSubtree(subTree.component) : subTree;
};
const BaseTransitionImpl = {
  name: `BaseTransition`,
  props: BaseTransitionPropsValidators,
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const state = useTransitionState();
    return () => {
      const children = slots.default && getTransitionRawChildren(slots.default(), true);
      if (!children || !children.length) {
        return;
      }
      const child = findNonCommentChild(children);
      const rawProps = toRaw$1(props);
      const { mode } = rawProps;
      if (false) {
        warn$1(`invalid <transition> mode: ${mode}`);
      }
      if (state.isLeaving) {
        return emptyPlaceholder(child);
      }
      const innerChild = getInnerChild$1(child);
      if (!innerChild) {
        return emptyPlaceholder(child);
      }
      let enterHooks = resolveTransitionHooks(
        innerChild,
        rawProps,
        state,
        instance,
        // #11061, ensure enterHooks is fresh after clone
        (hooks) => enterHooks = hooks
      );
      if (innerChild.type !== Comment) {
        setTransitionHooks(innerChild, enterHooks);
      }
      let oldInnerChild = instance.subTree && getInnerChild$1(instance.subTree);
      if (oldInnerChild && oldInnerChild.type !== Comment && !isSameVNodeType(oldInnerChild, innerChild) && recursiveGetSubtree(instance).type !== Comment) {
        let leavingHooks = resolveTransitionHooks(
          oldInnerChild,
          rawProps,
          state,
          instance
        );
        setTransitionHooks(oldInnerChild, leavingHooks);
        if (mode === "out-in" && innerChild.type !== Comment) {
          state.isLeaving = true;
          leavingHooks.afterLeave = () => {
            state.isLeaving = false;
            if (!(instance.job.flags & 8)) {
              instance.update();
            }
            delete leavingHooks.afterLeave;
            oldInnerChild = void 0;
          };
          return emptyPlaceholder(child);
        } else if (mode === "in-out" && innerChild.type !== Comment) {
          leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
            const leavingVNodesCache = getLeavingNodesForType(
              state,
              oldInnerChild
            );
            leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
            el[leaveCbKey] = () => {
              earlyRemove();
              el[leaveCbKey] = void 0;
              delete enterHooks.delayedLeave;
              oldInnerChild = void 0;
            };
            enterHooks.delayedLeave = () => {
              delayedLeave();
              delete enterHooks.delayedLeave;
              oldInnerChild = void 0;
            };
          };
        } else {
          oldInnerChild = void 0;
        }
      } else if (oldInnerChild) {
        oldInnerChild = void 0;
      }
      return child;
    };
  }
};
function findNonCommentChild(children) {
  let child = children[0];
  if (children.length > 1) {
    let hasFound = false;
    for (const c of children) {
      if (c.type !== Comment) {
        if (false) {
          warn$1(
            "<transition> can only be used on a single element or component. Use <transition-group> for lists."
          );
          break;
        }
        child = c;
        hasFound = true;
        if (true) break;
      }
    }
  }
  return child;
}
const BaseTransition = BaseTransitionImpl;
function getLeavingNodesForType(state, vnode) {
  const { leavingVNodes } = state;
  let leavingVNodesCache = leavingVNodes.get(vnode.type);
  if (!leavingVNodesCache) {
    leavingVNodesCache = /* @__PURE__ */ Object.create(null);
    leavingVNodes.set(vnode.type, leavingVNodesCache);
  }
  return leavingVNodesCache;
}
function resolveTransitionHooks(vnode, props, state, instance, postClone) {
  const {
    appear,
    mode,
    persisted = false,
    onBeforeEnter,
    onEnter,
    onAfterEnter,
    onEnterCancelled,
    onBeforeLeave,
    onLeave,
    onAfterLeave,
    onLeaveCancelled,
    onBeforeAppear,
    onAppear,
    onAfterAppear,
    onAppearCancelled
  } = props;
  const key = String(vnode.key);
  const leavingVNodesCache = getLeavingNodesForType(state, vnode);
  const callHook2 = (hook, args) => {
    hook && callWithAsyncErrorHandling(
      hook,
      instance,
      9,
      args
    );
  };
  const callAsyncHook = (hook, args) => {
    const done = args[1];
    callHook2(hook, args);
    if (isArray$2(hook)) {
      if (hook.every((hook2) => hook2.length <= 1)) done();
    } else if (hook.length <= 1) {
      done();
    }
  };
  const hooks = {
    mode,
    persisted,
    beforeEnter(el) {
      let hook = onBeforeEnter;
      if (!state.isMounted) {
        if (appear) {
          hook = onBeforeAppear || onBeforeEnter;
        } else {
          return;
        }
      }
      if (el[leaveCbKey]) {
        el[leaveCbKey](
          true
          /* cancelled */
        );
      }
      const leavingVNode = leavingVNodesCache[key];
      if (leavingVNode && isSameVNodeType(vnode, leavingVNode) && leavingVNode.el[leaveCbKey]) {
        leavingVNode.el[leaveCbKey]();
      }
      callHook2(hook, [el]);
    },
    enter(el) {
      if (!isHmrUpdating && leavingVNodesCache[key] === vnode) return;
      let hook = onEnter;
      let afterHook = onAfterEnter;
      let cancelHook = onEnterCancelled;
      if (!state.isMounted) {
        if (appear) {
          hook = onAppear || onEnter;
          afterHook = onAfterAppear || onAfterEnter;
          cancelHook = onAppearCancelled || onEnterCancelled;
        } else {
          return;
        }
      }
      let called = false;
      el[enterCbKey$1] = (cancelled) => {
        if (called) return;
        called = true;
        if (cancelled) {
          callHook2(cancelHook, [el]);
        } else {
          callHook2(afterHook, [el]);
        }
        if (hooks.delayedLeave) {
          hooks.delayedLeave();
        }
        el[enterCbKey$1] = void 0;
      };
      const done = el[enterCbKey$1].bind(null, false);
      if (hook) {
        callAsyncHook(hook, [el, done]);
      } else {
        done();
      }
    },
    leave(el, remove2) {
      const key2 = String(vnode.key);
      if (el[enterCbKey$1]) {
        el[enterCbKey$1](
          true
          /* cancelled */
        );
      }
      if (state.isUnmounting) {
        return remove2();
      }
      callHook2(onBeforeLeave, [el]);
      let called = false;
      el[leaveCbKey] = (cancelled) => {
        if (called) return;
        called = true;
        remove2();
        if (cancelled) {
          callHook2(onLeaveCancelled, [el]);
        } else {
          callHook2(onAfterLeave, [el]);
        }
        el[leaveCbKey] = void 0;
        if (leavingVNodesCache[key2] === vnode) {
          delete leavingVNodesCache[key2];
        }
      };
      const done = el[leaveCbKey].bind(null, false);
      leavingVNodesCache[key2] = vnode;
      if (onLeave) {
        callAsyncHook(onLeave, [el, done]);
      } else {
        done();
      }
    },
    clone(vnode2) {
      const hooks2 = resolveTransitionHooks(
        vnode2,
        props,
        state,
        instance,
        postClone
      );
      if (postClone) postClone(hooks2);
      return hooks2;
    }
  };
  return hooks;
}
function emptyPlaceholder(vnode) {
  if (isKeepAlive(vnode)) {
    vnode = cloneVNode(vnode);
    vnode.children = null;
    return vnode;
  }
}
function getInnerChild$1(vnode) {
  if (!isKeepAlive(vnode)) {
    if (isTeleport(vnode.type) && vnode.children) {
      return findNonCommentChild(vnode.children);
    }
    return vnode;
  }
  if (vnode.component) {
    return vnode.component.subTree;
  }
  const { shapeFlag, children } = vnode;
  if (children) {
    if (shapeFlag & 16) {
      return children[0];
    }
    if (shapeFlag & 32 && isFunction(children.default)) {
      return children.default();
    }
  }
}
function setTransitionHooks(vnode, hooks) {
  if (vnode.shapeFlag & 6 && vnode.component) {
    vnode.transition = hooks;
    setTransitionHooks(vnode.component.subTree, hooks);
  } else if (vnode.shapeFlag & 128) {
    vnode.ssContent.transition = hooks.clone(vnode.ssContent);
    vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
  } else {
    vnode.transition = hooks;
  }
}
function getTransitionRawChildren(children, keepComment = false, parentKey) {
  let ret = [];
  let keyedFragmentCount = 0;
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    const key = parentKey == null ? child.key : String(parentKey) + String(child.key != null ? child.key : i);
    if (child.type === Fragment$1) {
      if (child.patchFlag & 128) keyedFragmentCount++;
      ret = ret.concat(
        getTransitionRawChildren(child.children, keepComment, key)
      );
    } else if (keepComment || child.type !== Comment) {
      ret.push(key != null ? cloneVNode(child, { key }) : child);
    }
  }
  if (keyedFragmentCount > 1) {
    for (let i = 0; i < ret.length; i++) {
      ret[i].patchFlag = -2;
    }
  }
  return ret;
}
// @__NO_SIDE_EFFECTS__
function defineComponent(options, extraOptions) {
  return isFunction(options) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))()
  ) : options;
}
function useId() {
  const i = getCurrentInstance();
  if (i) {
    return (i.appContext.config.idPrefix || "v") + "-" + i.ids[0] + i.ids[1]++;
  } else if (false) {
    warn$1(
      `useId() is called when there is no active component instance to be associated with.`
    );
  }
  return "";
}
function markAsyncBoundary(instance) {
  instance.ids = [instance.ids[0] + instance.ids[2]++ + "-", 0, 0];
}
const knownTemplateRefs = /* @__PURE__ */ new WeakSet();
function useTemplateRef(key) {
  const i = getCurrentInstance();
  const r = shallowRef(null);
  if (i) {
    const refs = i.refs === EMPTY_OBJ ? i.refs = {} : i.refs;
    if (false) {
      warn$1(`useTemplateRef('${key}') already exists.`);
    } else {
      Object.defineProperty(refs, key, {
        enumerable: true,
        get: () => r.value,
        set: (val) => r.value = val
      });
    }
  } else if (false) {
    warn$1(
      `useTemplateRef() is called when there is no active component instance to be associated with.`
    );
  }
  const ret = false ? readonly(r) : r;
  if (false) {
    knownTemplateRefs.add(ret);
  }
  return ret;
}
function isTemplateRefKey(refs, key) {
  let desc;
  return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
}
const pendingSetRefMap = /* @__PURE__ */ new WeakMap();
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
  if (isArray$2(rawRef)) {
    rawRef.forEach(
      (r, i) => setRef(
        r,
        oldRawRef && (isArray$2(oldRawRef) ? oldRawRef[i] : oldRawRef),
        parentSuspense,
        vnode,
        isUnmount
      )
    );
    return;
  }
  if (isAsyncWrapper(vnode) && !isUnmount) {
    if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) {
      setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
    }
    return;
  }
  const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
  const value = isUnmount ? null : refValue;
  const { i: owner, r: ref3 } = rawRef;
  if (false) {
    warn$1(
      `Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function.`
    );
    return;
  }
  const oldRef = oldRawRef && oldRawRef.r;
  const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
  const setupState = owner.setupState;
  const rawSetupState = toRaw$1(setupState);
  const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
    if (false) {
      if (hasOwn(rawSetupState, key) && !isRef$1(rawSetupState[key])) {
        warn$1(
          `Template ref "${key}" used on a non-ref value. It will not work in the production build.`
        );
      }
      if (knownTemplateRefs.has(rawSetupState[key])) {
        return false;
      }
    }
    if (isTemplateRefKey(refs, key)) {
      return false;
    }
    return hasOwn(rawSetupState, key);
  };
  const canSetRef = (ref22, key) => {
    if (false) {
      return false;
    }
    if (key && isTemplateRefKey(refs, key)) {
      return false;
    }
    return true;
  };
  if (oldRef != null && oldRef !== ref3) {
    invalidatePendingSetRef(oldRawRef);
    if (isString$1(oldRef)) {
      refs[oldRef] = null;
      if (canSetSetupRef(oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (isRef$1(oldRef)) {
      const oldRawRefAtom = oldRawRef;
      if (canSetRef(oldRef, oldRawRefAtom.k)) {
        oldRef.value = null;
      }
      if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
    }
  }
  if (isFunction(ref3)) {
    callWithErrorHandling(ref3, owner, 12, [value, refs]);
  } else {
    const _isString = isString$1(ref3);
    const _isRef = isRef$1(ref3);
    if (_isString || _isRef) {
      const doSet = () => {
        if (rawRef.f) {
          const existing = _isString ? canSetSetupRef(ref3) ? setupState[ref3] : refs[ref3] : canSetRef(ref3) || !rawRef.k ? ref3.value : refs[rawRef.k];
          if (isUnmount) {
            isArray$2(existing) && remove(existing, refValue);
          } else {
            if (!isArray$2(existing)) {
              if (_isString) {
                refs[ref3] = [refValue];
                if (canSetSetupRef(ref3)) {
                  setupState[ref3] = refs[ref3];
                }
              } else {
                const newVal = [refValue];
                if (canSetRef(ref3, rawRef.k)) {
                  ref3.value = newVal;
                }
                if (rawRef.k) refs[rawRef.k] = newVal;
              }
            } else if (!existing.includes(refValue)) {
              existing.push(refValue);
            }
          }
        } else if (_isString) {
          refs[ref3] = value;
          if (canSetSetupRef(ref3)) {
            setupState[ref3] = value;
          }
        } else if (_isRef) {
          if (canSetRef(ref3, rawRef.k)) {
            ref3.value = value;
          }
          if (rawRef.k) refs[rawRef.k] = value;
        } else if (false) {
          warn$1("Invalid template ref type:", ref3, `(${typeof ref3})`);
        }
      };
      if (value) {
        const job = () => {
          doSet();
          pendingSetRefMap.delete(rawRef);
        };
        job.id = -1;
        pendingSetRefMap.set(rawRef, job);
        queuePostRenderEffect(job, parentSuspense);
      } else {
        invalidatePendingSetRef(rawRef);
        doSet();
      }
    } else if (false) {
      warn$1("Invalid template ref type:", ref3, `(${typeof ref3})`);
    }
  }
}
function invalidatePendingSetRef(rawRef) {
  const pendingSetRef = pendingSetRefMap.get(rawRef);
  if (pendingSetRef) {
    pendingSetRef.flags |= 8;
    pendingSetRefMap.delete(rawRef);
  }
}
let hasLoggedMismatchError = false;
const logMismatchError = () => {
  if (hasLoggedMismatchError) {
    return;
  }
  console.error("Hydration completed but contains mismatches.");
  hasLoggedMismatchError = true;
};
const isSVGContainer = (container) => container.namespaceURI.includes("svg") && container.tagName !== "foreignObject";
const isMathMLContainer = (container) => container.namespaceURI.includes("MathML");
const getContainerType = (container) => {
  if (container.nodeType !== 1) return void 0;
  if (isSVGContainer(container)) return "svg";
  if (isMathMLContainer(container)) return "mathml";
  return void 0;
};
const isComment = (node) => node.nodeType === 8;
function createHydrationFunctions(rendererInternals) {
  const {
    mt: mountComponent,
    p: patch,
    o: {
      patchProp,
      createText,
      nextSibling,
      parentNode,
      remove: remove2,
      insert,
      createComment
    }
  } = rendererInternals;
  const hydrate = (vnode, container) => {
    if (!container.hasChildNodes()) {
      patch(null, vnode, container);
      flushPostFlushCbs();
      container._vnode = vnode;
      return;
    }
    hydrateNode(container.firstChild, vnode, null, null, null);
    flushPostFlushCbs();
    container._vnode = vnode;
  };
  const hydrateNode = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized = false) => {
    optimized = optimized || !!vnode.dynamicChildren;
    const isFragmentStart = isComment(node) && node.data === "[";
    const onMismatch = () => handleMismatch(
      node,
      vnode,
      parentComponent,
      parentSuspense,
      slotScopeIds,
      isFragmentStart
    );
    const { type, ref: ref3, shapeFlag, patchFlag } = vnode;
    let domType = node.nodeType;
    vnode.el = node;
    if (true) {
      def(node, "__vnode", vnode, true);
      def(node, "__vueParentComponent", parentComponent, true);
    }
    if (patchFlag === -2) {
      optimized = false;
      vnode.dynamicChildren = null;
    }
    let nextNode = null;
    switch (type) {
      case Text:
        if (domType !== 3) {
          if (vnode.children === "") {
            insert(vnode.el = createText(""), parentNode(node), node);
            nextNode = node;
          } else {
            nextNode = onMismatch();
          }
        } else {
          if (node.data !== vnode.children) {
            logMismatchError();
            node.data = vnode.children;
          }
          nextNode = nextSibling(node);
        }
        break;
      case Comment:
        if (isTemplateNode(node)) {
          nextNode = nextSibling(node);
          replaceNode(
            vnode.el = node.content.firstChild,
            node,
            parentComponent
          );
        } else if (domType !== 8 || isFragmentStart) {
          nextNode = onMismatch();
        } else {
          nextNode = nextSibling(node);
        }
        break;
      case Static:
        if (isFragmentStart) {
          node = nextSibling(node);
          domType = node.nodeType;
        }
        if (domType === 1 || domType === 3) {
          nextNode = node;
          const needToAdoptContent = !vnode.children.length;
          for (let i = 0; i < vnode.staticCount; i++) {
            if (needToAdoptContent)
              vnode.children += nextNode.nodeType === 1 ? nextNode.outerHTML : nextNode.data;
            if (i === vnode.staticCount - 1) {
              vnode.anchor = nextNode;
            }
            nextNode = nextSibling(nextNode);
          }
          return isFragmentStart ? nextSibling(nextNode) : nextNode;
        } else {
          onMismatch();
        }
        break;
      case Fragment$1:
        if (!isFragmentStart) {
          nextNode = onMismatch();
        } else {
          nextNode = hydrateFragment(
            node,
            vnode,
            parentComponent,
            parentSuspense,
            slotScopeIds,
            optimized
          );
        }
        break;
      default:
        if (shapeFlag & 1) {
          if ((domType !== 1 || vnode.type.toLowerCase() !== node.tagName.toLowerCase()) && !isTemplateNode(node)) {
            nextNode = onMismatch();
          } else {
            nextNode = hydrateElement(
              node,
              vnode,
              parentComponent,
              parentSuspense,
              slotScopeIds,
              optimized
            );
          }
        } else if (shapeFlag & 6) {
          vnode.slotScopeIds = slotScopeIds;
          const container = parentNode(node);
          if (isFragmentStart) {
            nextNode = locateClosingAnchor(node);
          } else if (isComment(node) && node.data === "teleport start") {
            nextNode = locateClosingAnchor(node, node.data, "teleport end");
          } else {
            nextNode = nextSibling(node);
          }
          mountComponent(
            vnode,
            container,
            null,
            parentComponent,
            parentSuspense,
            getContainerType(container),
            optimized
          );
          if (isAsyncWrapper(vnode) && !vnode.type.__asyncResolved) {
            let subTree;
            if (isFragmentStart) {
              subTree = createVNode(Fragment$1);
              subTree.anchor = nextNode ? nextNode.previousSibling : container.lastChild;
            } else {
              subTree = node.nodeType === 3 ? createTextVNode("") : createVNode("div");
            }
            subTree.el = node;
            vnode.component.subTree = subTree;
          }
        } else if (shapeFlag & 64) {
          if (domType !== 8) {
            nextNode = onMismatch();
          } else {
            nextNode = vnode.type.hydrate(
              node,
              vnode,
              parentComponent,
              parentSuspense,
              slotScopeIds,
              optimized,
              rendererInternals,
              hydrateChildren
            );
          }
        } else if (shapeFlag & 128) {
          nextNode = vnode.type.hydrate(
            node,
            vnode,
            parentComponent,
            parentSuspense,
            getContainerType(parentNode(node)),
            slotScopeIds,
            optimized,
            rendererInternals,
            hydrateNode
          );
        } else if (false) {
          warn$1("Invalid HostVNode type:", type, `(${typeof type})`);
        }
    }
    if (ref3 != null) {
      setRef(ref3, null, parentSuspense, vnode);
    }
    return nextNode;
  };
  const hydrateElement = (el, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    optimized = optimized || !!vnode.dynamicChildren;
    const { type, props, patchFlag, shapeFlag, dirs, transition } = vnode;
    const forcePatch = type === "input" || type === "option";
    if (forcePatch || patchFlag !== -1) {
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "created");
      }
      let needCallTransitionHooks = false;
      if (isTemplateNode(el)) {
        needCallTransitionHooks = needTransition(
          null,
          // no need check parentSuspense in hydration
          transition
        ) && parentComponent && parentComponent.vnode.props && parentComponent.vnode.props.appear;
        const content = el.content.firstChild;
        if (needCallTransitionHooks) {
          const cls = content.getAttribute("class");
          if (cls) content.$cls = cls;
          transition.beforeEnter(content);
        }
        replaceNode(content, el, parentComponent);
        vnode.el = el = content;
      }
      if (shapeFlag & 16 && // skip if element has innerHTML / textContent
      !(props && (props.innerHTML || props.textContent))) {
        let next = hydrateChildren(
          el.firstChild,
          vnode,
          el,
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
        let hasWarned2 = false;
        while (next) {
          if (!isMismatchAllowed(
            el,
            1
            /* CHILDREN */
          )) {
            if (false) {
              warn$1(
                `Hydration children mismatch on`,
                el,
                `
Server rendered element contains more child nodes than client vdom.`
              );
              hasWarned2 = true;
            }
            logMismatchError();
          }
          const cur = next;
          next = next.nextSibling;
          remove2(cur);
        }
      } else if (shapeFlag & 8) {
        let clientText = vnode.children;
        if (clientText[0] === "\n" && (el.tagName === "PRE" || el.tagName === "TEXTAREA")) {
          clientText = clientText.slice(1);
        }
        const { textContent } = el;
        if (textContent !== clientText && // innerHTML normalize \r\n or \r into a single \n in the DOM
        textContent !== clientText.replace(/\r\n|\r/g, "\n")) {
          if (!isMismatchAllowed(
            el,
            0
            /* TEXT */
          )) {
            logMismatchError();
          }
          el.textContent = vnode.children;
        }
      }
      if (props) {
        if (forcePatch || !optimized || patchFlag & (16 | 32)) {
          const isCustomElement = el.tagName.includes("-");
          for (const key in props) {
            if (false) {
              logMismatchError();
            }
            if (forcePatch && (key.endsWith("value") || key === "indeterminate") || isOn(key) && !isReservedProp(key) || // force hydrate v-bind with .prop modifiers
            key[0] === "." || isCustomElement && !isReservedProp(key)) {
              patchProp(el, key, null, props[key], void 0, parentComponent);
            }
          }
        } else if (props.onClick) {
          patchProp(
            el,
            "onClick",
            null,
            props.onClick,
            void 0,
            parentComponent
          );
        } else if (patchFlag & 4 && isReactive$1(props.style)) {
          for (const key in props.style) props.style[key];
        }
      }
      let vnodeHooks;
      if (vnodeHooks = props && props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHooks, parentComponent, vnode);
      }
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
      }
      if ((vnodeHooks = props && props.onVnodeMounted) || dirs || needCallTransitionHooks) {
        queueEffectWithSuspense(() => {
          vnodeHooks && invokeVNodeHook(vnodeHooks, parentComponent, vnode);
          needCallTransitionHooks && transition.enter(el);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
        }, parentSuspense);
      }
    }
    return el.nextSibling;
  };
  const hydrateChildren = (node, parentVNode, container, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    optimized = optimized || !!parentVNode.dynamicChildren;
    const children = parentVNode.children;
    const l = children.length;
    let hasWarned2 = false;
    for (let i = 0; i < l; i++) {
      const vnode = optimized ? children[i] : children[i] = normalizeVNode(children[i]);
      const isText = vnode.type === Text;
      if (node) {
        if (isText && !optimized) {
          if (i + 1 < l && normalizeVNode(children[i + 1]).type === Text) {
            insert(
              createText(
                node.data.slice(vnode.children.length)
              ),
              container,
              nextSibling(node)
            );
            node.data = vnode.children;
          }
        }
        node = hydrateNode(
          node,
          vnode,
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
      } else if (isText && !vnode.children) {
        insert(vnode.el = createText(""), container);
      } else {
        if (!isMismatchAllowed(
          container,
          1
          /* CHILDREN */
        )) {
          if (false) {
            warn$1(
              `Hydration children mismatch on`,
              container,
              `
Server rendered element contains fewer child nodes than client vdom.`
            );
            hasWarned2 = true;
          }
          logMismatchError();
        }
        patch(
          null,
          vnode,
          container,
          null,
          parentComponent,
          parentSuspense,
          getContainerType(container),
          slotScopeIds
        );
      }
    }
    return node;
  };
  const hydrateFragment = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    const { slotScopeIds: fragmentSlotScopeIds } = vnode;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    const container = parentNode(node);
    const next = hydrateChildren(
      nextSibling(node),
      vnode,
      container,
      parentComponent,
      parentSuspense,
      slotScopeIds,
      optimized
    );
    if (next && isComment(next) && next.data === "]") {
      return nextSibling(vnode.anchor = next);
    } else {
      logMismatchError();
      insert(vnode.anchor = createComment(`]`), container, next);
      return next;
    }
  };
  const handleMismatch = (node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragment) => {
    if (!isMismatchAllowed(
      node.parentElement,
      1
      /* CHILDREN */
    )) {
      logMismatchError();
    }
    vnode.el = null;
    if (isFragment) {
      const end = locateClosingAnchor(node);
      while (true) {
        const next2 = nextSibling(node);
        if (next2 && next2 !== end) {
          remove2(next2);
        } else {
          break;
        }
      }
    }
    const next = nextSibling(node);
    const container = parentNode(node);
    remove2(node);
    patch(
      null,
      vnode,
      container,
      next,
      parentComponent,
      parentSuspense,
      getContainerType(container),
      slotScopeIds
    );
    if (parentComponent) {
      parentComponent.vnode.el = vnode.el;
      updateHOCHostEl(parentComponent, vnode.el);
    }
    return next;
  };
  const locateClosingAnchor = (node, open = "[", close = "]") => {
    let match = 0;
    while (node) {
      node = nextSibling(node);
      if (node && isComment(node)) {
        if (node.data === open) match++;
        if (node.data === close) {
          if (match === 0) {
            return nextSibling(node);
          } else {
            match--;
          }
        }
      }
    }
    return node;
  };
  const replaceNode = (newNode, oldNode, parentComponent) => {
    const parentNode2 = oldNode.parentNode;
    if (parentNode2) {
      parentNode2.replaceChild(newNode, oldNode);
    }
    let parent = parentComponent;
    while (parent) {
      if (parent.vnode.el === oldNode) {
        parent.vnode.el = parent.subTree.el = newNode;
      }
      parent = parent.parent;
    }
  };
  const isTemplateNode = (node) => {
    return node.nodeType === 1 && node.tagName === "TEMPLATE";
  };
  return [hydrate, hydrateNode];
}
function propHasMismatch(el, key, clientValue, vnode, instance) {
  let mismatchType;
  let mismatchKey;
  let actual;
  let expected;
  if (key === "class") {
    if (el.$cls) {
      actual = el.$cls;
      delete el.$cls;
    } else {
      actual = el.getAttribute("class");
    }
    expected = normalizeClass(clientValue);
    if (!isSetEqual(toClassSet(actual || ""), toClassSet(expected))) {
      mismatchType = 2;
      mismatchKey = `class`;
    }
  } else if (key === "style") {
    actual = el.getAttribute("style") || "";
    expected = isString$1(clientValue) ? clientValue : stringifyStyle(normalizeStyle(clientValue));
    const actualMap = toStyleMap(actual);
    const expectedMap = toStyleMap(expected);
    if (vnode.dirs) {
      for (const { dir, value } of vnode.dirs) {
        if (dir.name === "show" && !value) {
          expectedMap.set("display", "none");
        }
      }
    }
    if (instance) {
      resolveCssVars(instance, vnode, expectedMap);
    }
    if (!isMapEqual(actualMap, expectedMap)) {
      mismatchType = 3;
      mismatchKey = "style";
    }
  } else if (el instanceof SVGElement && isKnownSvgAttr(key) || el instanceof HTMLElement && (isBooleanAttr(key) || isKnownHtmlAttr(key))) {
    if (isBooleanAttr(key)) {
      actual = el.hasAttribute(key);
      expected = includeBooleanAttr(clientValue);
    } else if (clientValue == null) {
      actual = el.hasAttribute(key);
      expected = false;
    } else {
      if (el.hasAttribute(key)) {
        actual = el.getAttribute(key);
      } else if (key === "value" && el.tagName === "TEXTAREA") {
        actual = el.value;
      } else {
        actual = false;
      }
      expected = isRenderableAttrValue(clientValue) ? String(clientValue) : false;
    }
    if (actual !== expected) {
      mismatchType = 4;
      mismatchKey = key;
    }
  }
  if (mismatchType != null && !isMismatchAllowed(el, mismatchType)) {
    const format = (v) => v === false ? `(not rendered)` : `${mismatchKey}="${v}"`;
    const preSegment = `Hydration ${MismatchTypeString[mismatchType]} mismatch on`;
    const postSegment = `
  - rendered on server: ${format(actual)}
  - expected on client: ${format(expected)}
  Note: this mismatch is check-only. The DOM will not be rectified in production due to performance overhead.
  You should fix the source of the mismatch.`;
    {
      warn$1(preSegment, el, postSegment);
    }
    return true;
  }
  return false;
}
function toClassSet(str) {
  return new Set(str.trim().split(/\s+/));
}
function isSetEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const s of a) {
    if (!b.has(s)) {
      return false;
    }
  }
  return true;
}
function toStyleMap(str) {
  const styleMap = /* @__PURE__ */ new Map();
  for (const item of str.split(";")) {
    let [key, value] = item.split(":");
    key = key.trim();
    value = value && value.trim();
    if (key && value) {
      styleMap.set(key, value);
    }
  }
  return styleMap;
}
function isMapEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, value] of a) {
    if (value !== b.get(key)) {
      return false;
    }
  }
  return true;
}
function resolveCssVars(instance, vnode, expectedMap) {
  const root = instance.subTree;
  if (instance.getCssVars && (vnode === root || root && root.type === Fragment$1 && root.children.includes(vnode))) {
    const cssVars = instance.getCssVars();
    for (const key in cssVars) {
      const value = normalizeCssVarValue(cssVars[key]);
      expectedMap.set(`--${getEscapedCssVarName(key, false)}`, value);
    }
  }
  if (vnode === root && instance.parent) {
    resolveCssVars(instance.parent, instance.vnode, expectedMap);
  }
}
const allowMismatchAttr = "data-allow-mismatch";
const MismatchTypeString = {
  [
    0
    /* TEXT */
  ]: "text",
  [
    1
    /* CHILDREN */
  ]: "children",
  [
    2
    /* CLASS */
  ]: "class",
  [
    3
    /* STYLE */
  ]: "style",
  [
    4
    /* ATTRIBUTE */
  ]: "attribute"
};
function isMismatchAllowed(el, allowedType) {
  if (allowedType === 0 || allowedType === 1) {
    while (el && !el.hasAttribute(allowMismatchAttr)) {
      el = el.parentElement;
    }
  }
  const allowedAttr = el && el.getAttribute(allowMismatchAttr);
  if (allowedAttr == null) {
    return false;
  } else if (allowedAttr === "") {
    return true;
  } else {
    const list = allowedAttr.split(",");
    if (allowedType === 0 && list.includes("children")) {
      return true;
    }
    return list.includes(MismatchTypeString[allowedType]);
  }
}
const requestIdleCallback = getGlobalThis().requestIdleCallback || ((cb) => setTimeout(cb, 1));
const cancelIdleCallback = getGlobalThis().cancelIdleCallback || ((id) => clearTimeout(id));
const hydrateOnIdle = (timeout = 1e4) => (hydrate) => {
  const id = requestIdleCallback(hydrate, { timeout });
  return () => cancelIdleCallback(id);
};
function elementIsVisibleInViewport(el) {
  const { top, left, bottom, right } = el.getBoundingClientRect();
  const { innerHeight, innerWidth } = window;
  return (top > 0 && top < innerHeight || bottom > 0 && bottom < innerHeight) && (left > 0 && left < innerWidth || right > 0 && right < innerWidth);
}
const hydrateOnVisible = (opts) => (hydrate, forEach) => {
  const ob = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      ob.disconnect();
      hydrate();
      break;
    }
  }, opts);
  forEach((el) => {
    if (!(el instanceof Element)) return;
    if (elementIsVisibleInViewport(el)) {
      hydrate();
      ob.disconnect();
      return false;
    }
    ob.observe(el);
  });
  return () => ob.disconnect();
};
const hydrateOnMediaQuery = (query) => (hydrate) => {
  if (query) {
    const mql = matchMedia(query);
    if (mql.matches) {
      hydrate();
    } else {
      mql.addEventListener("change", hydrate, { once: true });
      return () => mql.removeEventListener("change", hydrate);
    }
  }
};
const hydrateOnInteraction = (interactions = []) => (hydrate, forEach) => {
  if (isString$1(interactions)) interactions = [interactions];
  let hasHydrated = false;
  const doHydrate = (e) => {
    if (!hasHydrated) {
      hasHydrated = true;
      teardown();
      hydrate();
      e.target.dispatchEvent(new e.constructor(e.type, e));
    }
  };
  const teardown = () => {
    forEach((el) => {
      for (const i of interactions) {
        el.removeEventListener(i, doHydrate);
      }
    });
  };
  forEach((el) => {
    for (const i of interactions) {
      el.addEventListener(i, doHydrate, { once: true });
    }
  });
  return teardown;
};
function forEachElement(node, cb) {
  if (isComment(node) && node.data === "[") {
    let depth = 1;
    let next = node.nextSibling;
    while (next) {
      if (next.nodeType === 1) {
        const result = cb(next);
        if (result === false) {
          break;
        }
      } else if (isComment(next)) {
        if (next.data === "]") {
          if (--depth === 0) break;
        } else if (next.data === "[") {
          depth++;
        }
      }
      next = next.nextSibling;
    }
  } else {
    cb(node);
  }
}
const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
// @__NO_SIDE_EFFECTS__
function defineAsyncComponent(source) {
  if (isFunction(source)) {
    source = { loader: source };
  }
  const {
    loader,
    loadingComponent,
    errorComponent,
    delay = 200,
    hydrate: hydrateStrategy,
    timeout,
    // undefined = never times out
    suspensible = true,
    onError: userOnError
  } = source;
  let pendingRequest = null;
  let resolvedComp;
  let retries = 0;
  const retry = () => {
    retries++;
    pendingRequest = null;
    return load();
  };
  const load = () => {
    let thisRequest;
    return pendingRequest || (thisRequest = pendingRequest = loader().catch((err) => {
      err = err instanceof Error ? err : new Error(String(err));
      if (userOnError) {
        return new Promise((resolve2, reject) => {
          const userRetry = () => resolve2(retry());
          const userFail = () => reject(err);
          userOnError(err, userRetry, userFail, retries + 1);
        });
      } else {
        throw err;
      }
    }).then((comp) => {
      if (thisRequest !== pendingRequest && pendingRequest) {
        return pendingRequest;
      }
      if (false) {
        warn$1(
          `Async component loader resolved to undefined. If you are using retry(), make sure to return its return value.`
        );
      }
      if (comp && (comp.__esModule || comp[Symbol.toStringTag] === "Module")) {
        comp = comp.default;
      }
      if (false) {
        throw new Error(`Invalid async component load result: ${comp}`);
      }
      resolvedComp = comp;
      return comp;
    }));
  };
  return /* @__PURE__ */ defineComponent({
    name: "AsyncComponentWrapper",
    __asyncLoader: load,
    __asyncHydrate(el, instance, hydrate) {
      let patched = false;
      (instance.bu || (instance.bu = [])).push(() => patched = true);
      const performHydrate = () => {
        if (patched) {
          if (false) {
            warn$1(
              `Skipping lazy hydration for component '${getComponentName$1(resolvedComp) || resolvedComp.__file}': it was updated before lazy hydration performed.`
            );
          }
          return;
        }
        hydrate();
      };
      const doHydrate = hydrateStrategy ? () => {
        const teardown = hydrateStrategy(
          performHydrate,
          (cb) => forEachElement(el, cb)
        );
        if (teardown) {
          (instance.bum || (instance.bum = [])).push(teardown);
        }
      } : performHydrate;
      if (resolvedComp) {
        doHydrate();
      } else {
        load().then(() => !instance.isUnmounted && doHydrate());
      }
    },
    get __asyncResolved() {
      return resolvedComp;
    },
    setup() {
      const instance = currentInstance;
      markAsyncBoundary(instance);
      if (resolvedComp) {
        return () => createInnerComp(resolvedComp, instance);
      }
      const onError = (err) => {
        pendingRequest = null;
        handleError(
          err,
          instance,
          13,
          !errorComponent
        );
      };
      if (suspensible && instance.suspense || isInSSRComponentSetup) {
        return load().then((comp) => {
          return () => createInnerComp(comp, instance);
        }).catch((err) => {
          onError(err);
          return () => errorComponent ? createVNode(errorComponent, {
            error: err
          }) : null;
        });
      }
      const loaded = ref(false);
      const error = ref();
      const delayed = ref(!!delay);
      if (delay) {
        setTimeout(() => {
          delayed.value = false;
        }, delay);
      }
      if (timeout != null) {
        setTimeout(() => {
          if (!loaded.value && !error.value) {
            const err = new Error(
              `Async component timed out after ${timeout}ms.`
            );
            onError(err);
            error.value = err;
          }
        }, timeout);
      }
      load().then(() => {
        loaded.value = true;
        if (instance.parent && isKeepAlive(instance.parent.vnode)) {
          instance.parent.update();
        }
      }).catch((err) => {
        onError(err);
        error.value = err;
      });
      return () => {
        if (loaded.value && resolvedComp) {
          return createInnerComp(resolvedComp, instance);
        } else if (error.value && errorComponent) {
          return createVNode(errorComponent, {
            error: error.value
          });
        } else if (loadingComponent && !delayed.value) {
          return createInnerComp(
            loadingComponent,
            instance
          );
        }
      };
    }
  });
}
function createInnerComp(comp, parent) {
  const { ref: ref22, props, children, ce } = parent.vnode;
  const vnode = createVNode(comp, props, children);
  vnode.ref = ref22;
  vnode.ce = ce;
  delete parent.vnode.ce;
  return vnode;
}
const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
const KeepAliveImpl = {
  name: `KeepAlive`,
  // Marker for special handling inside the renderer. We are not using a ===
  // check directly on KeepAlive in the renderer, because importing it directly
  // would prevent it from being tree-shaken.
  __isKeepAlive: true,
  props: {
    include: [String, RegExp, Array],
    exclude: [String, RegExp, Array],
    max: [String, Number]
  },
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const sharedContext = instance.ctx;
    if (!sharedContext.renderer) {
      return () => {
        const children = slots.default && slots.default();
        return children && children.length === 1 ? children[0] : children;
      };
    }
    const cache = /* @__PURE__ */ new Map();
    const keys = /* @__PURE__ */ new Set();
    let current = null;
    if (true) {
      instance.__v_cache = cache;
    }
    const parentSuspense = instance.suspense;
    const {
      renderer: {
        p: patch,
        m: move,
        um: _unmount,
        o: { createElement }
      }
    } = sharedContext;
    const storageContainer = createElement("div");
    sharedContext.activate = (vnode, container, anchor, namespace, optimized) => {
      const instance2 = vnode.component;
      move(vnode, container, anchor, 0, parentSuspense);
      patch(
        instance2.vnode,
        vnode,
        container,
        anchor,
        instance2,
        parentSuspense,
        namespace,
        vnode.slotScopeIds,
        optimized
      );
      queuePostRenderEffect(() => {
        instance2.isDeactivated = false;
        if (instance2.a) {
          invokeArrayFns(instance2.a);
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeMounted;
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance2.parent, vnode);
        }
      }, parentSuspense);
      if (true) {
        devtoolsComponentAdded(instance2);
      }
    };
    sharedContext.deactivate = (vnode) => {
      const instance2 = vnode.component;
      invalidateMount(instance2.m);
      invalidateMount(instance2.a);
      move(vnode, storageContainer, null, 1, parentSuspense);
      queuePostRenderEffect(() => {
        if (instance2.da) {
          invokeArrayFns(instance2.da);
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted;
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance2.parent, vnode);
        }
        instance2.isDeactivated = true;
      }, parentSuspense);
      if (true) {
        devtoolsComponentAdded(instance2);
      }
      if (false) {
        instance2.__keepAliveStorageContainer = storageContainer;
      }
    };
    function unmount(vnode) {
      resetShapeFlag(vnode);
      _unmount(vnode, instance, parentSuspense, true);
    }
    function pruneCache(filter) {
      cache.forEach((vnode, key) => {
        const name = getComponentName$1(
          isAsyncWrapper(vnode) ? vnode.type.__asyncResolved || {} : vnode.type
        );
        if (name && !filter(name)) {
          pruneCacheEntry(key);
        }
      });
    }
    function pruneCacheEntry(key) {
      const cached = cache.get(key);
      if (cached && (!current || !isSameVNodeType(cached, current))) {
        unmount(cached);
      } else if (current) {
        resetShapeFlag(current);
      }
      cache.delete(key);
      keys.delete(key);
    }
    watch(
      () => [props.include, props.exclude],
      ([include, exclude]) => {
        include && pruneCache((name) => matches(include, name));
        exclude && pruneCache((name) => !matches(exclude, name));
      },
      // prune post-render after `current` has been updated
      { flush: "post", deep: true }
    );
    let pendingCacheKey = null;
    const cacheSubtree = () => {
      if (pendingCacheKey != null) {
        if (isSuspense(instance.subTree.type)) {
          queuePostRenderEffect(() => {
            cache.set(pendingCacheKey, getInnerChild(instance.subTree));
          }, instance.subTree.suspense);
        } else {
          cache.set(pendingCacheKey, getInnerChild(instance.subTree));
        }
      }
    };
    onMounted(cacheSubtree);
    onUpdated(cacheSubtree);
    onBeforeUnmount(() => {
      cache.forEach((cached) => {
        const { subTree, suspense } = instance;
        const vnode = getInnerChild(subTree);
        if (cached.type === vnode.type && cached.key === vnode.key) {
          resetShapeFlag(vnode);
          const da = vnode.component.da;
          da && queuePostRenderEffect(da, suspense);
          return;
        }
        unmount(cached);
      });
    });
    return () => {
      pendingCacheKey = null;
      if (!slots.default) {
        return current = null;
      }
      const children = slots.default();
      const rawVNode = children[0];
      if (children.length > 1) {
        if (false) {
          warn$1(`KeepAlive should contain exactly one component child.`);
        }
        current = null;
        return children;
      } else if (!isVNode(rawVNode) || !(rawVNode.shapeFlag & 4) && !(rawVNode.shapeFlag & 128)) {
        current = null;
        return rawVNode;
      }
      let vnode = getInnerChild(rawVNode);
      if (vnode.type === Comment) {
        current = null;
        return vnode;
      }
      const comp = vnode.type;
      const name = getComponentName$1(
        isAsyncWrapper(vnode) ? vnode.type.__asyncResolved || {} : comp
      );
      const { include, exclude, max } = props;
      if (include && (!name || !matches(include, name)) || exclude && name && matches(exclude, name)) {
        vnode.shapeFlag &= -257;
        current = vnode;
        return rawVNode;
      }
      const key = vnode.key == null ? comp : vnode.key;
      const cachedVNode = cache.get(key);
      if (vnode.el) {
        vnode = cloneVNode(vnode);
        if (rawVNode.shapeFlag & 128) {
          rawVNode.ssContent = vnode;
        }
      }
      pendingCacheKey = key;
      if (cachedVNode) {
        vnode.el = cachedVNode.el;
        vnode.component = cachedVNode.component;
        if (vnode.transition) {
          setTransitionHooks(vnode, vnode.transition);
        }
        vnode.shapeFlag |= 512;
        keys.delete(key);
        keys.add(key);
      } else {
        keys.add(key);
        if (max && keys.size > parseInt(max, 10)) {
          pruneCacheEntry(keys.values().next().value);
        }
      }
      vnode.shapeFlag |= 256;
      current = vnode;
      return isSuspense(rawVNode.type) ? rawVNode : vnode;
    };
  }
};
const KeepAlive = KeepAliveImpl;
function matches(pattern, name) {
  if (isArray$2(pattern)) {
    return pattern.some((p) => matches(p, name));
  } else if (isString$1(pattern)) {
    return pattern.split(",").includes(name);
  } else if (isRegExp$1(pattern)) {
    pattern.lastIndex = 0;
    return pattern.test(name);
  }
  return false;
}
function onActivated(hook, target) {
  registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
  registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
  const wrappedHook = hook.__wdc || (hook.__wdc = () => {
    let current = target;
    while (current) {
      if (current.isDeactivated) {
        return;
      }
      current = current.parent;
    }
    return hook();
  });
  injectHook(type, wrappedHook, target);
  if (target) {
    let current = target.parent;
    while (current && current.parent) {
      if (isKeepAlive(current.parent.vnode)) {
        injectToKeepAliveRoot(wrappedHook, type, target, current);
      }
      current = current.parent;
    }
  }
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
  const injected = injectHook(
    type,
    hook,
    keepAliveRoot,
    true
    /* prepend */
  );
  onUnmounted(() => {
    remove(keepAliveRoot[type], injected);
  }, target);
}
function resetShapeFlag(vnode) {
  vnode.shapeFlag &= -257;
  vnode.shapeFlag &= -513;
}
function getInnerChild(vnode) {
  return vnode.shapeFlag & 128 ? vnode.ssContent : vnode;
}
function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
      pauseTracking();
      const reset = setCurrentInstance(target);
      const res = callWithAsyncErrorHandling(hook, target, type, args);
      reset();
      resetTracking();
      return res;
    });
    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }
    return wrappedHook;
  } else if (false) {
    const apiName = toHandlerKey(ErrorTypeStrings$1[type].replace(/ hook$/, ""));
    warn$1(
      `${apiName} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`
    );
  }
}
const createHook = (lifecycle) => (hook, target = currentInstance) => {
  if (!isInSSRComponentSetup || lifecycle === "sp") {
    injectHook(lifecycle, (...args) => hook(...args), target);
  }
};
const onBeforeMount = createHook("bm");
const onMounted = createHook("m");
const onBeforeUpdate = createHook(
  "bu"
);
const onUpdated = createHook("u");
const onBeforeUnmount = createHook(
  "bum"
);
const onUnmounted = createHook("um");
const onServerPrefetch = createHook(
  "sp"
);
const onRenderTriggered = createHook("rtg");
const onRenderTracked = createHook("rtc");
function onErrorCaptured(hook, target = currentInstance) {
  injectHook("ec", hook, target);
}
const COMPONENTS = "components";
const DIRECTIVES = "directives";
function resolveComponent(name, maybeSelfReference) {
  return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
}
const NULL_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol.for("v-ndc");
function resolveDynamicComponent(component) {
  if (isString$1(component)) {
    return resolveAsset(COMPONENTS, component, false) || component;
  } else {
    return component || NULL_DYNAMIC_COMPONENT;
  }
}
function resolveDirective(name) {
  return resolveAsset(DIRECTIVES, name);
}
function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
  const instance = currentRenderingInstance || currentInstance;
  if (instance) {
    const Component = instance.type;
    if (type === COMPONENTS) {
      const selfName = getComponentName$1(
        Component,
        false
      );
      if (selfName && (selfName === name || selfName === camelize$1(name) || selfName === capitalize(camelize$1(name)))) {
        return Component;
      }
    }
    const res = (
      // local registration
      // check instance[type] first which is resolved for options API
      resolve(instance[type] || Component[type], name) || // global registration
      resolve(instance.appContext[type], name)
    );
    if (!res && maybeSelfReference) {
      return Component;
    }
    if (false) {
      const extra = type === COMPONENTS ? `
If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.` : ``;
      warn$1(`Failed to resolve ${type.slice(0, -1)}: ${name}${extra}`);
    }
    return res;
  } else if (false) {
    warn$1(
      `resolve${capitalize(type.slice(0, -1))} can only be used in render() or setup().`
    );
  }
}
function resolve(registry, name) {
  return registry && (registry[name] || registry[camelize$1(name)] || registry[capitalize(camelize$1(name))]);
}
function renderList(source, renderItem, cache, index) {
  let ret;
  const cached = cache && cache[index];
  const sourceIsArray = isArray$2(source);
  if (sourceIsArray || isString$1(source)) {
    const sourceIsReactiveArray = sourceIsArray && isReactive$1(source);
    let needsWrap = false;
    let isReadonlySource = false;
    if (sourceIsReactiveArray) {
      needsWrap = !isShallow(source);
      isReadonlySource = isReadonly$1(source);
      source = shallowReadArray(source);
    }
    ret = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(
        needsWrap ? isReadonlySource ? toReadonly(toReactive(source[i])) : toReactive(source[i]) : source[i],
        i,
        void 0,
        cached && cached[i]
      );
    }
  } else if (typeof source === "number") {
    if (false) {
      warn$1(
        `The v-for range expects a positive integer value but got ${source}.`
      );
      ret = [];
    } else {
      ret = new Array(source);
      for (let i = 0; i < source; i++) {
        ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
      }
    }
  } else if (isObject$2(source)) {
    if (source[Symbol.iterator]) {
      ret = Array.from(
        source,
        (item, i) => renderItem(item, i, void 0, cached && cached[i])
      );
    } else {
      const keys = Object.keys(source);
      ret = new Array(keys.length);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        ret[i] = renderItem(source[key], key, i, cached && cached[i]);
      }
    }
  } else {
    ret = [];
  }
  if (cache) {
    cache[index] = ret;
  }
  return ret;
}
function createSlots(slots, dynamicSlots) {
  for (let i = 0; i < dynamicSlots.length; i++) {
    const slot = dynamicSlots[i];
    if (isArray$2(slot)) {
      for (let j = 0; j < slot.length; j++) {
        slots[slot[j].name] = slot[j].fn;
      }
    } else if (slot) {
      slots[slot.name] = slot.key ? (...args) => {
        const res = slot.fn(...args);
        if (res) res.key = slot.key;
        return res;
      } : slot.fn;
    }
  }
  return slots;
}
function renderSlot(slots, name, props = {}, fallback, noSlotted) {
  if (currentRenderingInstance.ce || currentRenderingInstance.parent && isAsyncWrapper(currentRenderingInstance.parent) && currentRenderingInstance.parent.ce) {
    const hasProps = Object.keys(props).length > 0;
    if (name !== "default") props.name = name;
    return openBlock(), createBlock(
      Fragment$1,
      null,
      [createVNode("slot", props, fallback && fallback())],
      hasProps ? -2 : 64
    );
  }
  let slot = slots[name];
  if (false) {
    warn$1(
      `SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template.`
    );
    slot = () => [];
  }
  if (slot && slot._c) {
    slot._d = false;
  }
  openBlock();
  const validSlotContent = slot && ensureValidVNode(slot(props));
  const slotKey = props.key || // slot content array of a dynamic conditional slot may have a branch
  // key attached in the `createSlots` helper, respect that
  validSlotContent && validSlotContent.key;
  const rendered = createBlock(
    Fragment$1,
    {
      key: (slotKey && !isSymbol$1(slotKey) ? slotKey : `_${name}`) + // #7256 force differentiate fallback content from actual content
      (!validSlotContent && fallback ? "_fb" : "")
    },
    validSlotContent || (fallback ? fallback() : []),
    validSlotContent && slots._ === 1 ? 64 : -2
  );
  if (!noSlotted && rendered.scopeId) {
    rendered.slotScopeIds = [rendered.scopeId + "-s"];
  }
  if (slot && slot._c) {
    slot._d = true;
  }
  return rendered;
}
function ensureValidVNode(vnodes) {
  return vnodes.some((child) => {
    if (!isVNode(child)) return true;
    if (child.type === Comment) return false;
    if (child.type === Fragment$1 && !ensureValidVNode(child.children))
      return false;
    return true;
  }) ? vnodes : null;
}
function toHandlers(obj, preserveCaseIfNecessary) {
  const ret = {};
  if (false) {
    warn$1(`v-on with no argument expects an object value.`);
    return ret;
  }
  for (const key in obj) {
    ret[preserveCaseIfNecessary && /[A-Z]/.test(key) ? `on:${key}` : toHandlerKey(key)] = obj[key];
  }
  return ret;
}
const getPublicInstance = (i) => {
  if (!i) return null;
  if (isStatefulComponent(i)) return getComponentPublicInstance(i);
  return getPublicInstance(i.parent);
};
const publicPropertiesMap = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ extend(/* @__PURE__ */ Object.create(null), {
    $: (i) => i,
    $el: (i) => i.vnode.el,
    $data: (i) => i.data,
    $props: (i) => false ? shallowReadonly(i.props) : i.props,
    $attrs: (i) => false ? shallowReadonly(i.attrs) : i.attrs,
    $slots: (i) => false ? shallowReadonly(i.slots) : i.slots,
    $refs: (i) => false ? shallowReadonly(i.refs) : i.refs,
    $parent: (i) => getPublicInstance(i.parent),
    $root: (i) => getPublicInstance(i.root),
    $host: (i) => i.ce,
    $emit: (i) => i.emit,
    $options: (i) => true ? resolveMergedOptions$1(i) : i.type,
    $forceUpdate: (i) => i.f || (i.f = () => {
      queueJob(i.update);
    }),
    $nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
    $watch: (i) => true ? instanceWatch.bind(i) : NOOP$1
  })
);
const isReservedPrefix = (key) => key === "_" || key === "$";
const hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    if (key === "__v_skip") {
      return true;
    }
    const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
    if (false) {
      return true;
    }
    if (key[0] !== "$") {
      const n = accessCache[key];
      if (n !== void 0) {
        switch (n) {
          case 1:
            return setupState[key];
          case 2:
            return data[key];
          case 4:
            return ctx[key];
          case 3:
            return props[key];
        }
      } else if (hasSetupBinding(setupState, key)) {
        accessCache[key] = 1;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = 2;
        return data[key];
      } else if (hasOwn(props, key)) {
        accessCache[key] = 3;
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = 4;
        return ctx[key];
      } else if (shouldCacheAccess) {
        accessCache[key] = 0;
      }
    }
    const publicGetter = publicPropertiesMap[key];
    let cssModule, globalProperties;
    if (publicGetter) {
      if (key === "$attrs") {
        track(instance.attrs, "get", "");
      } else if (false) {
        track(instance, "get", key);
      }
      return publicGetter(instance);
    } else if (
      // css module (injected by vue-loader)
      (cssModule = type.__cssModules) && (cssModule = cssModule[key])
    ) {
      return cssModule;
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      accessCache[key] = 4;
      return ctx[key];
    } else if (
      // global properties
      globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)
    ) {
      {
        return globalProperties[key];
      }
    } else if (false) {
      if (data !== EMPTY_OBJ && isReservedPrefix(key[0]) && hasOwn(data, key)) {
        warn$1(
          `Property ${JSON.stringify(
            key
          )} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`
        );
      } else if (instance === currentRenderingInstance) {
        warn$1(
          `Property ${JSON.stringify(key)} was accessed during render but is not defined on instance.`
        );
      }
    }
  },
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance;
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (false) {
      warn$1(`Cannot mutate <script setup> binding "${key}" from Options API.`);
      return false;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance.props, key)) {
      return false;
    }
    if (key[0] === "$" && key.slice(1) in instance) {
      return false;
    } else {
      if (false) {
        Object.defineProperty(ctx, key, {
          enumerable: true,
          configurable: true,
          value
        });
      } else {
        ctx[key] = value;
      }
    }
    return true;
  },
  has({
    _: { data, setupState, accessCache, ctx, appContext, props, type }
  }, key) {
    let cssModules;
    return !!(accessCache[key] || data !== EMPTY_OBJ && key[0] !== "$" && hasOwn(data, key) || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
  },
  defineProperty(target, key, descriptor) {
    if (descriptor.get != null) {
      target._.accessCache[key] = 0;
    } else if (hasOwn(descriptor, "value")) {
      this.set(target, key, descriptor.value, null);
    }
    return Reflect.defineProperty(target, key, descriptor);
  }
};
if (false) {
  PublicInstanceProxyHandlers.ownKeys = (target) => {
    warn$1(
      `Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead.`
    );
    return Reflect.ownKeys(target);
  };
}
const RuntimeCompiledPublicInstanceProxyHandlers = /* @__PURE__ */ extend({}, PublicInstanceProxyHandlers, {
  get(target, key) {
    if (key === Symbol.unscopables) {
      return;
    }
    return PublicInstanceProxyHandlers.get(target, key, target);
  },
  has(_, key) {
    const has = key[0] !== "_" && !isGloballyAllowed(key);
    if (false) {
      warn$1(
        `Property ${JSON.stringify(
          key
        )} should not start with _ which is a reserved prefix for Vue internals.`
      );
    }
    return has;
  }
});
function createDevRenderContext(instance) {
  const target = {};
  Object.defineProperty(target, `_`, {
    configurable: true,
    enumerable: false,
    get: () => instance
  });
  Object.keys(publicPropertiesMap).forEach((key) => {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      get: () => publicPropertiesMap[key](instance),
      // intercepted by the proxy so no need for implementation,
      // but needed to prevent set errors
      set: NOOP$1
    });
  });
  return target;
}
function exposePropsOnRenderContext(instance) {
  const {
    ctx,
    propsOptions: [propsOptions]
  } = instance;
  if (propsOptions) {
    Object.keys(propsOptions).forEach((key) => {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => instance.props[key],
        set: NOOP$1
      });
    });
  }
}
function exposeSetupStateOnRenderContext(instance) {
  const { ctx, setupState } = instance;
  Object.keys(toRaw$1(setupState)).forEach((key) => {
    if (!setupState.__isScriptSetup) {
      if (isReservedPrefix(key[0])) {
        warn$1(
          `setup() return property ${JSON.stringify(
            key
          )} should not start with "$" or "_" which are reserved prefixes for Vue internals.`
        );
        return;
      }
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => setupState[key],
        set: NOOP$1
      });
    }
  });
}
const warnRuntimeUsage = (method) => warn$1(
  `${method}() is a compiler-hint helper that is only usable inside <script setup> of a single file component. Its arguments should be compiled away and passing it at runtime has no effect.`
);
function defineProps() {
  if (false) {
    warnRuntimeUsage(`defineProps`);
  }
  return null;
}
function defineEmits() {
  if (false) {
    warnRuntimeUsage(`defineEmits`);
  }
  return null;
}
function defineExpose(exposed) {
  if (false) {
    warnRuntimeUsage(`defineExpose`);
  }
}
function defineOptions(options) {
  if (false) {
    warnRuntimeUsage(`defineOptions`);
  }
}
function defineSlots() {
  if (false) {
    warnRuntimeUsage(`defineSlots`);
  }
  return null;
}
function defineModel() {
  if (false) {
    warnRuntimeUsage("defineModel");
  }
}
function withDefaults(props, defaults) {
  if (false) {
    warnRuntimeUsage(`withDefaults`);
  }
  return null;
}
function useSlots() {
  return getContext("useSlots").slots;
}
function useAttrs() {
  return getContext("useAttrs").attrs;
}
function getContext(calledFunctionName) {
  const i = getCurrentInstance();
  if (false) {
    warn$1(`${calledFunctionName}() called without active instance.`);
  }
  return i.setupContext || (i.setupContext = createSetupContext(i));
}
function normalizePropsOrEmits(props) {
  return isArray$2(props) ? props.reduce(
    (normalized, p) => (normalized[p] = null, normalized),
    {}
  ) : props;
}
function mergeDefaults(raw, defaults) {
  const props = normalizePropsOrEmits(raw);
  for (const key in defaults) {
    if (key.startsWith("__skip")) continue;
    let opt = props[key];
    if (opt) {
      if (isArray$2(opt) || isFunction(opt)) {
        opt = props[key] = { type: opt, default: defaults[key] };
      } else {
        opt.default = defaults[key];
      }
    } else if (opt === null) {
      opt = props[key] = { default: defaults[key] };
    } else if (false) {
      warn$1(`props default key "${key}" has no corresponding declaration.`);
    }
    if (opt && defaults[`__skip_${key}`]) {
      opt.skipFactory = true;
    }
  }
  return props;
}
function mergeModels(a, b) {
  if (!a || !b) return a || b;
  if (isArray$2(a) && isArray$2(b)) return a.concat(b);
  return extend({}, normalizePropsOrEmits(a), normalizePropsOrEmits(b));
}
function createPropsRestProxy(props, excludedKeys) {
  const ret = {};
  for (const key in props) {
    if (!excludedKeys.includes(key)) {
      Object.defineProperty(ret, key, {
        enumerable: true,
        get: () => props[key]
      });
    }
  }
  return ret;
}
function withAsyncContext(getAwaitable) {
  const ctx = getCurrentInstance();
  const inSSRSetup = isInSSRComponentSetup;
  if (false) {
    warn$1(
      `withAsyncContext called without active current instance. This is likely a bug.`
    );
  }
  let awaitable = getAwaitable();
  unsetCurrentInstance();
  if (inSSRSetup) {
    setInSSRSetupState(false);
  }
  const restore = () => {
    setCurrentInstance(ctx);
    if (inSSRSetup) {
      setInSSRSetupState(true);
    }
  };
  const cleanup = () => {
    if (getCurrentInstance() !== ctx) ctx.scope.off();
    unsetCurrentInstance();
    if (inSSRSetup) {
      setInSSRSetupState(false);
    }
  };
  if (isPromise(awaitable)) {
    awaitable = awaitable.catch((e) => {
      restore();
      Promise.resolve().then(() => Promise.resolve().then(cleanup));
      throw e;
    });
  }
  return [
    awaitable,
    () => {
      restore();
      Promise.resolve().then(cleanup);
    }
  ];
}
function createDuplicateChecker() {
  const cache = /* @__PURE__ */ Object.create(null);
  return (type, key) => {
    if (cache[key]) {
      warn$1(`${type} property "${key}" is already defined in ${cache[key]}.`);
    } else {
      cache[key] = type;
    }
  };
}
let shouldCacheAccess = true;
function applyOptions(instance) {
  const options = resolveMergedOptions$1(instance);
  const publicThis = instance.proxy;
  const ctx = instance.ctx;
  shouldCacheAccess = false;
  if (options.beforeCreate) {
    callHook$1(options.beforeCreate, instance, "bc");
  }
  const {
    // state
    data: dataOptions,
    computed: computedOptions,
    methods,
    watch: watchOptions,
    provide: provideOptions,
    inject: injectOptions,
    // lifecycle
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    activated,
    deactivated,
    beforeDestroy,
    beforeUnmount,
    destroyed,
    unmounted,
    render,
    renderTracked,
    renderTriggered,
    errorCaptured,
    serverPrefetch,
    // public API
    expose,
    inheritAttrs,
    // assets
    components,
    directives,
    filters
  } = options;
  const checkDuplicateProperties = false ? createDuplicateChecker() : null;
  if (false) {
    const [propsOptions] = instance.propsOptions;
    if (propsOptions) {
      for (const key in propsOptions) {
        checkDuplicateProperties("Props", key);
      }
    }
  }
  if (injectOptions) {
    resolveInjections(injectOptions, ctx, checkDuplicateProperties);
  }
  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key];
      if (isFunction(methodHandler)) {
        if (false) {
          Object.defineProperty(ctx, key, {
            value: methodHandler.bind(publicThis),
            configurable: true,
            enumerable: true,
            writable: true
          });
        } else {
          ctx[key] = methodHandler.bind(publicThis);
        }
        if (false) {
          checkDuplicateProperties("Methods", key);
        }
      } else if (false) {
        warn$1(
          `Method "${key}" has type "${typeof methodHandler}" in the component definition. Did you reference the function correctly?`
        );
      }
    }
  }
  if (dataOptions) {
    if (false) {
      warn$1(
        `The data option must be a function. Plain object usage is no longer supported.`
      );
    }
    const data = dataOptions.call(publicThis, publicThis);
    if (false) {
      warn$1(
        `data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>.`
      );
    }
    if (!isObject$2(data)) {
    } else {
      instance.data = reactive(data);
      if (false) {
        for (const key in data) {
          checkDuplicateProperties("Data", key);
          if (!isReservedPrefix(key[0])) {
            Object.defineProperty(ctx, key, {
              configurable: true,
              enumerable: true,
              get: () => data[key],
              set: NOOP$1
            });
          }
        }
      }
    }
  }
  shouldCacheAccess = true;
  if (computedOptions) {
    for (const key in computedOptions) {
      const opt = computedOptions[key];
      const get = isFunction(opt) ? opt.bind(publicThis, publicThis) : isFunction(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP$1;
      if (false) {
        warn$1(`Computed property "${key}" has no getter.`);
      }
      const set = !isFunction(opt) && isFunction(opt.set) ? opt.set.bind(publicThis) : false ? () => {
        warn$1(
          `Write operation failed: computed property "${key}" is readonly.`
        );
      } : NOOP$1;
      const c = computed({
        get,
        set
      });
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => c.value,
        set: (v) => c.value = v
      });
      if (false) {
        checkDuplicateProperties("Computed", key);
      }
    }
  }
  if (watchOptions) {
    for (const key in watchOptions) {
      createWatcher(watchOptions[key], ctx, publicThis, key);
    }
  }
  if (provideOptions) {
    const provides = isFunction(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
    Reflect.ownKeys(provides).forEach((key) => {
      provide(key, provides[key]);
    });
  }
  if (created) {
    callHook$1(created, instance, "c");
  }
  function registerLifecycleHook(register, hook) {
    if (isArray$2(hook)) {
      hook.forEach((_hook) => register(_hook.bind(publicThis)));
    } else if (hook) {
      register(hook.bind(publicThis));
    }
  }
  registerLifecycleHook(onBeforeMount, beforeMount);
  registerLifecycleHook(onMounted, mounted);
  registerLifecycleHook(onBeforeUpdate, beforeUpdate);
  registerLifecycleHook(onUpdated, updated);
  registerLifecycleHook(onActivated, activated);
  registerLifecycleHook(onDeactivated, deactivated);
  registerLifecycleHook(onErrorCaptured, errorCaptured);
  registerLifecycleHook(onRenderTracked, renderTracked);
  registerLifecycleHook(onRenderTriggered, renderTriggered);
  registerLifecycleHook(onBeforeUnmount, beforeUnmount);
  registerLifecycleHook(onUnmounted, unmounted);
  registerLifecycleHook(onServerPrefetch, serverPrefetch);
  if (isArray$2(expose)) {
    if (expose.length) {
      const exposed = instance.exposed || (instance.exposed = {});
      expose.forEach((key) => {
        Object.defineProperty(exposed, key, {
          get: () => publicThis[key],
          set: (val) => publicThis[key] = val,
          enumerable: true
        });
      });
    } else if (!instance.exposed) {
      instance.exposed = {};
    }
  }
  if (render && instance.render === NOOP$1) {
    instance.render = render;
  }
  if (inheritAttrs != null) {
    instance.inheritAttrs = inheritAttrs;
  }
  if (components) instance.components = components;
  if (directives) instance.directives = directives;
  if (serverPrefetch) {
    markAsyncBoundary(instance);
  }
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP$1) {
  if (isArray$2(injectOptions)) {
    injectOptions = normalizeInject(injectOptions);
  }
  for (const key in injectOptions) {
    const opt = injectOptions[key];
    let injected;
    if (isObject$2(opt)) {
      if ("default" in opt) {
        injected = inject(
          opt.from || key,
          opt.default,
          true
        );
      } else {
        injected = inject(opt.from || key);
      }
    } else {
      injected = inject(opt);
    }
    if (isRef$1(injected)) {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => injected.value,
        set: (v) => injected.value = v
      });
    } else {
      ctx[key] = injected;
    }
    if (false) {
      checkDuplicateProperties("Inject", key);
    }
  }
}
function callHook$1(hook, instance, type) {
  callWithAsyncErrorHandling(
    isArray$2(hook) ? hook.map((h2) => h2.bind(instance.proxy)) : hook.bind(instance.proxy),
    instance,
    type
  );
}
function createWatcher(raw, ctx, publicThis, key) {
  let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
  if (isString$1(raw)) {
    const handler = ctx[raw];
    if (isFunction(handler)) {
      {
        watch(getter, handler);
      }
    } else if (false) {
      warn$1(`Invalid watch handler specified by key "${raw}"`, handler);
    }
  } else if (isFunction(raw)) {
    {
      watch(getter, raw.bind(publicThis));
    }
  } else if (isObject$2(raw)) {
    if (isArray$2(raw)) {
      raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
    } else {
      const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
      if (isFunction(handler)) {
        watch(getter, handler, raw);
      } else if (false) {
        warn$1(`Invalid watch handler specified by key "${raw.handler}"`, handler);
      }
    }
  } else if (false) {
    warn$1(`Invalid watch option: "${key}"`, raw);
  }
}
function resolveMergedOptions$1(instance) {
  const base = instance.type;
  const { mixins, extends: extendsOptions } = base;
  const {
    mixins: globalMixins,
    optionsCache: cache,
    config: { optionMergeStrategies }
  } = instance.appContext;
  const cached = cache.get(base);
  let resolved;
  if (cached) {
    resolved = cached;
  } else if (!globalMixins.length && !mixins && !extendsOptions) {
    {
      resolved = base;
    }
  } else {
    resolved = {};
    if (globalMixins.length) {
      globalMixins.forEach(
        (m) => mergeOptions$1(resolved, m, optionMergeStrategies, true)
      );
    }
    mergeOptions$1(resolved, base, optionMergeStrategies);
  }
  if (isObject$2(base)) {
    cache.set(base, resolved);
  }
  return resolved;
}
function mergeOptions$1(to, from, strats, asMixin = false) {
  const { mixins, extends: extendsOptions } = from;
  if (extendsOptions) {
    mergeOptions$1(to, extendsOptions, strats, true);
  }
  if (mixins) {
    mixins.forEach(
      (m) => mergeOptions$1(to, m, strats, true)
    );
  }
  for (const key in from) {
    if (asMixin && key === "expose") {
    } else {
      const strat = internalOptionMergeStrats[key] || strats && strats[key];
      to[key] = strat ? strat(to[key], from[key]) : from[key];
    }
  }
  return to;
}
const internalOptionMergeStrats = {
  data: mergeDataFn,
  props: mergeEmitsOrPropsOptions,
  emits: mergeEmitsOrPropsOptions,
  // objects
  methods: mergeObjectOptions,
  computed: mergeObjectOptions,
  // lifecycle
  beforeCreate: mergeAsArray$1,
  created: mergeAsArray$1,
  beforeMount: mergeAsArray$1,
  mounted: mergeAsArray$1,
  beforeUpdate: mergeAsArray$1,
  updated: mergeAsArray$1,
  beforeDestroy: mergeAsArray$1,
  beforeUnmount: mergeAsArray$1,
  destroyed: mergeAsArray$1,
  unmounted: mergeAsArray$1,
  activated: mergeAsArray$1,
  deactivated: mergeAsArray$1,
  errorCaptured: mergeAsArray$1,
  serverPrefetch: mergeAsArray$1,
  // assets
  components: mergeObjectOptions,
  directives: mergeObjectOptions,
  // watch
  watch: mergeWatchOptions,
  // provide / inject
  provide: mergeDataFn,
  inject: mergeInject
};
function mergeDataFn(to, from) {
  if (!from) {
    return to;
  }
  if (!to) {
    return from;
  }
  return function mergedDataFn() {
    return extend(
      isFunction(to) ? to.call(this, this) : to,
      isFunction(from) ? from.call(this, this) : from
    );
  };
}
function mergeInject(to, from) {
  return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
  if (isArray$2(raw)) {
    const res = {};
    for (let i = 0; i < raw.length; i++) {
      res[raw[i]] = raw[i];
    }
    return res;
  }
  return raw;
}
function mergeAsArray$1(to, from) {
  return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
  return to ? extend(/* @__PURE__ */ Object.create(null), to, from) : from;
}
function mergeEmitsOrPropsOptions(to, from) {
  if (to) {
    if (isArray$2(to) && isArray$2(from)) {
      return [.../* @__PURE__ */ new Set([...to, ...from])];
    }
    return extend(
      /* @__PURE__ */ Object.create(null),
      normalizePropsOrEmits(to),
      normalizePropsOrEmits(from != null ? from : {})
    );
  } else {
    return from;
  }
}
function mergeWatchOptions(to, from) {
  if (!to) return from;
  if (!from) return to;
  const merged = extend(/* @__PURE__ */ Object.create(null), to);
  for (const key in from) {
    merged[key] = mergeAsArray$1(to[key], from[key]);
  }
  return merged;
}
function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let uid$1 = 0;
function createAppAPI(render, hydrate) {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = extend({}, rootComponent);
    }
    if (rootProps != null && !isObject$2(rootProps)) {
      rootProps = null;
    }
    const context = createAppContext();
    const installedPlugins = /* @__PURE__ */ new WeakSet();
    const pluginCleanupFns = [];
    let isMounted = false;
    const app = context.app = {
      _uid: uid$1++,
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
      version,
      get config() {
        return context.config;
      },
      set config(v) {
        if (false) {
          warn$1(
            `app.config cannot be replaced. Modify individual options instead.`
          );
        }
      },
      use(plugin, ...options) {
        if (installedPlugins.has(plugin)) {
        } else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin);
          plugin.install(app, ...options);
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin);
          plugin(app, ...options);
        } else if (false) {
          warn$1(
            `A plugin must either be a function or an object with an "install" function.`
          );
        }
        return app;
      },
      mixin(mixin) {
        if (true) {
          if (!context.mixins.includes(mixin)) {
            context.mixins.push(mixin);
          } else if (false) {
            warn$1(
              "Mixin has already been applied to target app" + (mixin.name ? `: ${mixin.name}` : "")
            );
          }
        } else if (false) {
          warn$1("Mixins are only available in builds supporting Options API");
        }
        return app;
      },
      component(name, component) {
        if (false) {
          validateComponentName(name, context.config);
        }
        if (!component) {
          return context.components[name];
        }
        if (false) {
          warn$1(`Component "${name}" has already been registered in target app.`);
        }
        context.components[name] = component;
        return app;
      },
      directive(name, directive) {
        if (false) {
          validateDirectiveName(name);
        }
        if (!directive) {
          return context.directives[name];
        }
        if (false) {
          warn$1(`Directive "${name}" has already been registered in target app.`);
        }
        context.directives[name] = directive;
        return app;
      },
      mount(rootContainer, isHydrate, namespace) {
        if (!isMounted) {
          if (false) {
            warn$1(
              `There is already an app instance mounted on the host container.
 If you want to mount another app on the same host container, you need to unmount the previous app by calling \`app.unmount()\` first.`
            );
          }
          const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
          vnode.appContext = context;
          if (namespace === true) {
            namespace = "svg";
          } else if (namespace === false) {
            namespace = void 0;
          }
          if (false) {
            context.reload = () => {
              const cloned = cloneVNode(vnode);
              cloned.el = null;
              render(cloned, rootContainer, namespace);
            };
          }
          if (isHydrate && hydrate) {
            hydrate(vnode, rootContainer);
          } else {
            render(vnode, rootContainer, namespace);
          }
          isMounted = true;
          app._container = rootContainer;
          rootContainer.__vue_app__ = app;
          if (true) {
            app._instance = vnode.component;
            devtoolsInitApp(app, version);
          }
          return getComponentPublicInstance(vnode.component);
        } else if (false) {
          warn$1(
            `App has already been mounted.
If you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. \`const createMyApp = () => createApp(App)\``
          );
        }
      },
      onUnmount(cleanupFn) {
        if (false) {
          warn$1(
            `Expected function as first argument to app.onUnmount(), but got ${typeof cleanupFn}`
          );
        }
        pluginCleanupFns.push(cleanupFn);
      },
      unmount() {
        if (isMounted) {
          callWithAsyncErrorHandling(
            pluginCleanupFns,
            app._instance,
            16
          );
          render(null, app._container);
          if (true) {
            app._instance = null;
            devtoolsUnmountApp(app);
          }
          delete app._container.__vue_app__;
        } else if (false) {
          warn$1(`Cannot unmount an app that is not mounted.`);
        }
      },
      provide(key, value) {
        if (false) {
          if (hasOwn(context.provides, key)) {
            warn$1(
              `App already provides property with key "${String(key)}". It will be overwritten with the new value.`
            );
          } else {
            warn$1(
              `App already provides property with key "${String(key)}" inherited from its parent element. It will be overwritten with the new value.`
            );
          }
        }
        context.provides[key] = value;
        return app;
      },
      runWithContext(fn) {
        const lastApp = currentApp;
        currentApp = app;
        try {
          return fn();
        } finally {
          currentApp = lastApp;
        }
      }
    };
    return app;
  };
}
let currentApp = null;
function useModel(props, name, options = EMPTY_OBJ) {
  const i = getCurrentInstance();
  if (false) {
    warn$1(`useModel() called without active instance.`);
    return ref();
  }
  const camelizedName = camelize$1(name);
  if (false) {
    warn$1(`useModel() called with prop "${name}" which is not declared.`);
    return ref();
  }
  const hyphenatedName = hyphenate(name);
  const modifiers = getModelModifiers(props, camelizedName);
  const res = customRef((track2, trigger2) => {
    let localValue;
    let prevSetValue = EMPTY_OBJ;
    let prevEmittedValue;
    watchSyncEffect(() => {
      const propValue = props[camelizedName];
      if (hasChanged(localValue, propValue)) {
        localValue = propValue;
        trigger2();
      }
    });
    return {
      get() {
        track2();
        return options.get ? options.get(localValue) : localValue;
      },
      set(value) {
        const emittedValue = options.set ? options.set(value) : value;
        if (!hasChanged(emittedValue, localValue) && !(prevSetValue !== EMPTY_OBJ && hasChanged(value, prevSetValue))) {
          return;
        }
        const rawProps = i.vnode.props;
        if (!(rawProps && // check if parent has passed v-model
        (name in rawProps || camelizedName in rawProps || hyphenatedName in rawProps) && (`onUpdate:${name}` in rawProps || `onUpdate:${camelizedName}` in rawProps || `onUpdate:${hyphenatedName}` in rawProps))) {
          localValue = value;
          trigger2();
        }
        i.emit(`update:${name}`, emittedValue);
        if (hasChanged(value, emittedValue) && hasChanged(value, prevSetValue) && !hasChanged(emittedValue, prevEmittedValue)) {
          trigger2();
        }
        prevSetValue = value;
        prevEmittedValue = emittedValue;
      }
    };
  });
  res[Symbol.iterator] = () => {
    let i2 = 0;
    return {
      next() {
        if (i2 < 2) {
          return { value: i2++ ? modifiers || EMPTY_OBJ : res, done: false };
        } else {
          return { done: true };
        }
      }
    };
  };
  return res;
}
const getModelModifiers = (props, modelName) => {
  return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize$1(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
};
function emit(instance, event, ...rawArgs) {
  if (instance.isUnmounted) return;
  const props = instance.vnode.props || EMPTY_OBJ;
  if (false) {
    const {
      emitsOptions,
      propsOptions: [propsOptions]
    } = instance;
    if (emitsOptions) {
      if (!(event in emitsOptions) && true) {
        if (!propsOptions || !(toHandlerKey(camelize$1(event)) in propsOptions)) {
          warn$1(
            `Component emitted event "${event}" but it is neither declared in the emits option nor as an "${toHandlerKey(camelize$1(event))}" prop.`
          );
        }
      } else {
        const validator = emitsOptions[event];
        if (isFunction(validator)) {
          const isValid = validator(...rawArgs);
          if (!isValid) {
            warn$1(
              `Invalid event arguments: event validation failed for event "${event}".`
            );
          }
        }
      }
    }
  }
  let args = rawArgs;
  const isModelListener2 = event.startsWith("update:");
  const modifiers = isModelListener2 && getModelModifiers(props, event.slice(7));
  if (modifiers) {
    if (modifiers.trim) {
      args = rawArgs.map((a) => isString$1(a) ? a.trim() : a);
    }
    if (modifiers.number) {
      args = rawArgs.map(looseToNumber);
    }
  }
  if (true) {
    devtoolsComponentEmit(instance, event, args);
  }
  if (false) {
    const lowerCaseEvent = event.toLowerCase();
    if (lowerCaseEvent !== event && props[toHandlerKey(lowerCaseEvent)]) {
      warn$1(
        `Event "${lowerCaseEvent}" is emitted in component ${formatComponentName(
          instance,
          instance.type
        )} but the handler is registered for "${event}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${hyphenate(
          event
        )}" instead of "${event}".`
      );
    }
  }
  let handlerName;
  let handler = props[handlerName = toHandlerKey(event)] || // also try camelCase event handler (#2249)
  props[handlerName = toHandlerKey(camelize$1(event))];
  if (!handler && isModelListener2) {
    handler = props[handlerName = toHandlerKey(hyphenate(event))];
  }
  if (handler) {
    callWithAsyncErrorHandling(
      handler,
      instance,
      6,
      args
    );
  }
  const onceHandler = props[handlerName + `Once`];
  if (onceHandler) {
    if (!instance.emitted) {
      instance.emitted = {};
    } else if (instance.emitted[handlerName]) {
      return;
    }
    instance.emitted[handlerName] = true;
    callWithAsyncErrorHandling(
      onceHandler,
      instance,
      6,
      args
    );
  }
}
const mixinEmitsCache = /* @__PURE__ */ new WeakMap();
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
  const cache = asMixin ? mixinEmitsCache : appContext.emitsCache;
  const cached = cache.get(comp);
  if (cached !== void 0) {
    return cached;
  }
  const raw = comp.emits;
  let normalized = {};
  let hasExtends = false;
  if (!isFunction(comp)) {
    const extendEmits = (raw2) => {
      const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
      if (normalizedFromExtend) {
        hasExtends = true;
        extend(normalized, normalizedFromExtend);
      }
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendEmits);
    }
    if (comp.extends) {
      extendEmits(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendEmits);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject$2(comp)) {
      cache.set(comp, null);
    }
    return null;
  }
  if (isArray$2(raw)) {
    raw.forEach((key) => normalized[key] = null);
  } else {
    extend(normalized, raw);
  }
  if (isObject$2(comp)) {
    cache.set(comp, normalized);
  }
  return normalized;
}
function isEmitListener(options, key) {
  if (!options || !isOn(key)) {
    return false;
  }
  key = key.slice(2).replace(/Once$/, "");
  return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
let accessedAttrs = false;
function markAttrsAccessed() {
  accessedAttrs = true;
}
function renderComponentRoot(instance) {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    propsOptions: [propsOptions],
    slots,
    attrs,
    emit: emit2,
    render,
    renderCache,
    props,
    data,
    setupState,
    ctx,
    inheritAttrs
  } = instance;
  const prev = setCurrentRenderingInstance(instance);
  let result;
  let fallthroughAttrs;
  if (false) {
    accessedAttrs = false;
  }
  try {
    if (vnode.shapeFlag & 4) {
      const proxyToUse = withProxy || proxy;
      const thisProxy = false ? new Proxy(proxyToUse, {
        get(target, key, receiver) {
          warn$1(
            `Property '${String(
              key
            )}' was accessed via 'this'. Avoid using 'this' in templates.`
          );
          return Reflect.get(target, key, receiver);
        }
      }) : proxyToUse;
      result = normalizeVNode(
        render.call(
          thisProxy,
          proxyToUse,
          renderCache,
          false ? shallowReadonly(props) : props,
          setupState,
          data,
          ctx
        )
      );
      fallthroughAttrs = attrs;
    } else {
      const render2 = Component;
      if (false) {
        markAttrsAccessed();
      }
      result = normalizeVNode(
        render2.length > 1 ? render2(
          false ? shallowReadonly(props) : props,
          false ? {
            get attrs() {
              markAttrsAccessed();
              return shallowReadonly(attrs);
            },
            slots,
            emit: emit2
          } : { attrs, slots, emit: emit2 }
        ) : render2(
          false ? shallowReadonly(props) : props,
          null
        )
      );
      fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
    }
  } catch (err) {
    blockStack.length = 0;
    handleError(err, instance, 1);
    result = createVNode(Comment);
  }
  let root = result;
  let setRoot = void 0;
  if (false) {
    [root, setRoot] = getChildRoot(result);
  }
  if (fallthroughAttrs && inheritAttrs !== false) {
    const keys = Object.keys(fallthroughAttrs);
    const { shapeFlag } = root;
    if (keys.length) {
      if (shapeFlag & (1 | 6)) {
        if (propsOptions && keys.some(isModelListener)) {
          fallthroughAttrs = filterModelListeners(
            fallthroughAttrs,
            propsOptions
          );
        }
        root = cloneVNode(root, fallthroughAttrs, false, true);
      } else if (false) {
        const allAttrs = Object.keys(attrs);
        const eventAttrs = [];
        const extraAttrs = [];
        for (let i = 0, l = allAttrs.length; i < l; i++) {
          const key = allAttrs[i];
          if (isOn(key)) {
            if (!isModelListener(key)) {
              eventAttrs.push(key[2].toLowerCase() + key.slice(3));
            }
          } else {
            extraAttrs.push(key);
          }
        }
        if (extraAttrs.length) {
          warn$1(
            `Extraneous non-props attributes (${extraAttrs.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.`
          );
        }
        if (eventAttrs.length) {
          warn$1(
            `Extraneous non-emits event listeners (${eventAttrs.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`
          );
        }
      }
    }
  }
  if (vnode.dirs) {
    if (false) {
      warn$1(
        `Runtime directive used on component with non-element root node. The directives will not function as intended.`
      );
    }
    root = cloneVNode(root, null, false, true);
    root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
  }
  if (vnode.transition) {
    if (false) {
      warn$1(
        `Component inside <Transition> renders non-element root node that cannot be animated.`
      );
    }
    setTransitionHooks(root, vnode.transition);
  }
  if (false) {
    setRoot(root);
  } else {
    result = root;
  }
  setCurrentRenderingInstance(prev);
  return result;
}
const getChildRoot = (vnode) => {
  const rawChildren = vnode.children;
  const dynamicChildren = vnode.dynamicChildren;
  const childRoot = filterSingleRoot(rawChildren, false);
  if (!childRoot) {
    return [vnode, void 0];
  } else if (false) {
    return getChildRoot(childRoot);
  }
  const index = rawChildren.indexOf(childRoot);
  const dynamicIndex = dynamicChildren ? dynamicChildren.indexOf(childRoot) : -1;
  const setRoot = (updatedRoot) => {
    rawChildren[index] = updatedRoot;
    if (dynamicChildren) {
      if (dynamicIndex > -1) {
        dynamicChildren[dynamicIndex] = updatedRoot;
      } else if (updatedRoot.patchFlag > 0) {
        vnode.dynamicChildren = [...dynamicChildren, updatedRoot];
      }
    }
  };
  return [normalizeVNode(childRoot), setRoot];
};
function filterSingleRoot(children, recurse = true) {
  let singleRoot;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isVNode(child)) {
      if (child.type !== Comment || child.children === "v-if") {
        if (singleRoot) {
          return;
        } else {
          singleRoot = child;
          if (false) {
            return filterSingleRoot(singleRoot.children);
          }
        }
      }
    } else {
      return;
    }
  }
  return singleRoot;
}
const getFunctionalFallthrough = (attrs) => {
  let res;
  for (const key in attrs) {
    if (key === "class" || key === "style" || isOn(key)) {
      (res || (res = {}))[key] = attrs[key];
    }
  }
  return res;
};
const filterModelListeners = (attrs, props) => {
  const res = {};
  for (const key in attrs) {
    if (!isModelListener(key) || !(key.slice(9) in props)) {
      res[key] = attrs[key];
    }
  }
  return res;
};
const isElementRoot = (vnode) => {
  return vnode.shapeFlag & (6 | 1) || vnode.type === Comment;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
  const { props: prevProps, children: prevChildren, component } = prevVNode;
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
  const emits = component.emitsOptions;
  if (false) {
    return true;
  }
  if (nextVNode.dirs || nextVNode.transition) {
    return true;
  }
  if (optimized && patchFlag >= 0) {
    if (patchFlag & 1024) {
      return true;
    }
    if (patchFlag & 16) {
      if (!prevProps) {
        return !!nextProps;
      }
      return hasPropsChanged(prevProps, nextProps, emits);
    } else if (patchFlag & 8) {
      const dynamicProps = nextVNode.dynamicProps;
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i];
        if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) {
          return true;
        }
      }
    }
  } else {
    if (prevChildren || nextChildren) {
      if (!nextChildren || !nextChildren.$stable) {
        return true;
      }
    }
    if (prevProps === nextProps) {
      return false;
    }
    if (!prevProps) {
      return !!nextProps;
    }
    if (!nextProps) {
      return true;
    }
    return hasPropsChanged(prevProps, nextProps, emits);
  }
  return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) {
      return true;
    }
  }
  return false;
}
function hasPropValueChanged(nextProps, prevProps, key) {
  const nextProp = nextProps[key];
  const prevProp = prevProps[key];
  if (key === "style" && isObject$2(nextProp) && isObject$2(prevProp)) {
    return !looseEqual(nextProp, prevProp);
  }
  return nextProp !== prevProp;
}
function updateHOCHostEl({ vnode, parent, suspense }, el) {
  while (parent) {
    const root = parent.subTree;
    if (root.suspense && root.suspense.activeBranch === vnode) {
      root.suspense.vnode.el = root.el = el;
      vnode = root;
    }
    if (root === vnode) {
      (vnode = parent.vnode).el = el;
      parent = parent.parent;
    } else {
      break;
    }
  }
  if (suspense && suspense.activeBranch === vnode) {
    suspense.vnode.el = el;
  }
}
const internalObjectProto = {};
const createInternalObject = () => Object.create(internalObjectProto);
const isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
function initProps(instance, rawProps, isStateful, isSSR = false) {
  const props = {};
  const attrs = createInternalObject();
  instance.propsDefaults = /* @__PURE__ */ Object.create(null);
  setFullProps(instance, rawProps, props, attrs);
  for (const key in instance.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = void 0;
    }
  }
  if (false) {
    validateProps(rawProps || {}, props, instance);
  }
  if (isStateful) {
    instance.props = isSSR ? props : shallowReactive(props);
  } else {
    if (!instance.type.props) {
      instance.props = attrs;
    } else {
      instance.props = props;
    }
  }
  instance.attrs = attrs;
}
function isInHmrContext(instance) {
  while (instance) {
    if (instance.type.__hmrId) return true;
    instance = instance.parent;
  }
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
  const {
    props,
    attrs,
    vnode: { patchFlag }
  } = instance;
  const rawCurrentProps = toRaw$1(props);
  const [options] = instance.propsOptions;
  let hasAttrsChanged = false;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (optimized || patchFlag > 0) && !(patchFlag & 16)
  ) {
    if (patchFlag & 8) {
      const propsToUpdate = instance.vnode.dynamicProps;
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i];
        if (isEmitListener(instance.emitsOptions, key)) {
          continue;
        }
        const value = rawProps[key];
        if (options) {
          if (hasOwn(attrs, key)) {
            if (value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          } else {
            const camelizedKey = camelize$1(key);
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value,
              instance,
              false
            );
          }
        } else {
          if (value !== attrs[key]) {
            attrs[key] = value;
            hasAttrsChanged = true;
          }
        }
      }
    }
  } else {
    if (setFullProps(instance, rawProps, props, attrs)) {
      hasAttrsChanged = true;
    }
    let kebabKey;
    for (const key in rawCurrentProps) {
      if (!rawProps || // for camelCase
      !hasOwn(rawProps, key) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
        if (options) {
          if (rawPrevProps && // for camelCase
          (rawPrevProps[key] !== void 0 || // for kebab-case
          rawPrevProps[kebabKey] !== void 0)) {
            props[key] = resolvePropValue(
              options,
              rawCurrentProps,
              key,
              void 0,
              instance,
              true
            );
          }
        } else {
          delete props[key];
        }
      }
    }
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key) && true) {
          delete attrs[key];
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (hasAttrsChanged) {
    trigger(instance.attrs, "set", "");
  }
  if (false) {
    validateProps(rawProps || {}, props, instance);
  }
}
function setFullProps(instance, rawProps, props, attrs) {
  const [options, needCastKeys] = instance.propsOptions;
  let hasAttrsChanged = false;
  let rawCastValues;
  if (rawProps) {
    for (let key in rawProps) {
      if (isReservedProp(key)) {
        continue;
      }
      const value = rawProps[key];
      let camelKey;
      if (options && hasOwn(options, camelKey = camelize$1(key))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          props[camelKey] = value;
        } else {
          (rawCastValues || (rawCastValues = {}))[camelKey] = value;
        }
      } else if (!isEmitListener(instance.emitsOptions, key)) {
        if (!(key in attrs) || value !== attrs[key]) {
          attrs[key] = value;
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (needCastKeys) {
    const rawCurrentProps = toRaw$1(props);
    const castValues = rawCastValues || EMPTY_OBJ;
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i];
      props[key] = resolvePropValue(
        options,
        rawCurrentProps,
        key,
        castValues[key],
        instance,
        !hasOwn(castValues, key)
      );
    }
  }
  return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
  const opt = options[key];
  if (opt != null) {
    const hasDefault = hasOwn(opt, "default");
    if (hasDefault && value === void 0) {
      const defaultValue = opt.default;
      if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
        const { propsDefaults } = instance;
        if (key in propsDefaults) {
          value = propsDefaults[key];
        } else {
          const reset = setCurrentInstance(instance);
          value = propsDefaults[key] = defaultValue.call(
            null,
            props
          );
          reset();
        }
      } else {
        value = defaultValue;
      }
      if (instance.ce) {
        instance.ce._setProp(key, value);
      }
    }
    if (opt[
      0
      /* shouldCast */
    ]) {
      if (isAbsent && !hasDefault) {
        value = false;
      } else if (opt[
        1
        /* shouldCastTrue */
      ] && (value === "" || value === hyphenate(key))) {
        value = true;
      }
    }
  }
  return value;
}
const mixinPropsCache = /* @__PURE__ */ new WeakMap();
function normalizePropsOptions(comp, appContext, asMixin = false) {
  const cache = asMixin ? mixinPropsCache : appContext.propsCache;
  const cached = cache.get(comp);
  if (cached) {
    return cached;
  }
  const raw = comp.props;
  const normalized = {};
  const needCastKeys = [];
  let hasExtends = false;
  if (!isFunction(comp)) {
    const extendProps = (raw2) => {
      hasExtends = true;
      const [props, keys] = normalizePropsOptions(raw2, appContext, true);
      extend(normalized, props);
      if (keys) needCastKeys.push(...keys);
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendProps);
    }
    if (comp.extends) {
      extendProps(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendProps);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject$2(comp)) {
      cache.set(comp, EMPTY_ARR);
    }
    return EMPTY_ARR;
  }
  if (isArray$2(raw)) {
    for (let i = 0; i < raw.length; i++) {
      if (false) {
        warn$1(`props must be strings when using array syntax.`, raw[i]);
      }
      const normalizedKey = camelize$1(raw[i]);
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ;
      }
    }
  } else if (raw) {
    if (false) {
      warn$1(`invalid props options`, raw);
    }
    for (const key in raw) {
      const normalizedKey = camelize$1(key);
      if (validatePropName(normalizedKey)) {
        const opt = raw[key];
        const prop = normalized[normalizedKey] = isArray$2(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
        const propType = prop.type;
        let shouldCast = false;
        let shouldCastTrue = true;
        if (isArray$2(propType)) {
          for (let index = 0; index < propType.length; ++index) {
            const type = propType[index];
            const typeName = isFunction(type) && type.name;
            if (typeName === "Boolean") {
              shouldCast = true;
              break;
            } else if (typeName === "String") {
              shouldCastTrue = false;
            }
          }
        } else {
          shouldCast = isFunction(propType) && propType.name === "Boolean";
        }
        prop[
          0
          /* shouldCast */
        ] = shouldCast;
        prop[
          1
          /* shouldCastTrue */
        ] = shouldCastTrue;
        if (shouldCast || hasOwn(prop, "default")) {
          needCastKeys.push(normalizedKey);
        }
      }
    }
  }
  const res = [normalized, needCastKeys];
  if (isObject$2(comp)) {
    cache.set(comp, res);
  }
  return res;
}
function validatePropName(key) {
  if (key[0] !== "$" && !isReservedProp(key)) {
    return true;
  } else if (false) {
    warn$1(`Invalid prop name: "${key}" is a reserved property.`);
  }
  return false;
}
function getType$1(ctor) {
  if (ctor === null) {
    return "null";
  }
  if (typeof ctor === "function") {
    return ctor.name || "";
  } else if (typeof ctor === "object") {
    const name = ctor.constructor && ctor.constructor.name;
    return name || "";
  }
  return "";
}
function validateProps(rawProps, props, instance) {
  const resolvedValues = toRaw$1(props);
  const options = instance.propsOptions[0];
  const camelizePropsKey = Object.keys(rawProps).map((key) => camelize$1(key));
  for (const key in options) {
    let opt = options[key];
    if (opt == null) continue;
    validateProp(
      key,
      resolvedValues[key],
      opt,
      false ? shallowReadonly(resolvedValues) : resolvedValues,
      !camelizePropsKey.includes(key)
    );
  }
}
function validateProp(name, value, prop, props, isAbsent) {
  const { type, required, validator, skipCheck } = prop;
  if (required && isAbsent) {
    warn$1('Missing required prop: "' + name + '"');
    return;
  }
  if (value == null && !required) {
    return;
  }
  if (type != null && type !== true && !skipCheck) {
    let isValid = false;
    const types = isArray$2(type) ? type : [type];
    const expectedTypes = [];
    for (let i = 0; i < types.length && !isValid; i++) {
      const { valid, expectedType } = assertType(value, types[i]);
      expectedTypes.push(expectedType || "");
      isValid = valid;
    }
    if (!isValid) {
      warn$1(getInvalidTypeMessage(name, value, expectedTypes));
      return;
    }
  }
  if (validator && !validator(value, props)) {
    warn$1('Invalid prop: custom validator check failed for prop "' + name + '".');
  }
}
const isSimpleType = /* @__PURE__ */ makeMap(
  "String,Number,Boolean,Function,Symbol,BigInt"
);
function assertType(value, type) {
  let valid;
  const expectedType = getType$1(type);
  if (expectedType === "null") {
    valid = value === null;
  } else if (isSimpleType(expectedType)) {
    const t = typeof value;
    valid = t === expectedType.toLowerCase();
    if (!valid && t === "object") {
      valid = value instanceof type;
    }
  } else if (expectedType === "Object") {
    valid = isObject$2(value);
  } else if (expectedType === "Array") {
    valid = isArray$2(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid,
    expectedType
  };
}
function getInvalidTypeMessage(name, value, expectedTypes) {
  if (expectedTypes.length === 0) {
    return `Prop type [] for prop "${name}" won't match anything. Did you mean to use type Array instead?`;
  }
  let message = `Invalid prop: type check failed for prop "${name}". Expected ${expectedTypes.map(capitalize).join(" | ")}`;
  const expectedType = expectedTypes[0];
  const receivedType = toRawType(value);
  const expectedValue = styleValue(value, expectedType);
  const receivedValue = styleValue(value, receivedType);
  if (expectedTypes.length === 1 && isExplicable(expectedType) && !isBoolean$1(expectedType, receivedType)) {
    message += ` with value ${expectedValue}`;
  }
  message += `, got ${receivedType} `;
  if (isExplicable(receivedType)) {
    message += `with value ${receivedValue}.`;
  }
  return message;
}
function styleValue(value, type) {
  if (type === "String") {
    return `"${value}"`;
  } else if (type === "Number") {
    return `${Number(value)}`;
  } else {
    return `${value}`;
  }
}
function isExplicable(type) {
  const explicitTypes = ["string", "number", "boolean"];
  return explicitTypes.some((elem) => type.toLowerCase() === elem);
}
function isBoolean$1(...args) {
  return args.some((elem) => elem.toLowerCase() === "boolean");
}
const isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
const normalizeSlotValue = (value) => isArray$2(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
const normalizeSlot = (key, rawSlot, ctx) => {
  if (rawSlot._n) {
    return rawSlot;
  }
  const normalized = withCtx((...args) => {
    if (false) {
      warn$1(
        `Slot "${key}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`
      );
    }
    return normalizeSlotValue(rawSlot(...args));
  }, ctx);
  normalized._c = false;
  return normalized;
};
const normalizeObjectSlots = (rawSlots, slots, instance) => {
  const ctx = rawSlots._ctx;
  for (const key in rawSlots) {
    if (isInternalKey(key)) continue;
    const value = rawSlots[key];
    if (isFunction(value)) {
      slots[key] = normalizeSlot(key, value, ctx);
    } else if (value != null) {
      if (false) {
        warn$1(
          `Non-function value encountered for slot "${key}". Prefer function slots for better performance.`
        );
      }
      const normalized = normalizeSlotValue(value);
      slots[key] = () => normalized;
    }
  }
};
const normalizeVNodeSlots = (instance, children) => {
  if (false) {
    warn$1(
      `Non-function value encountered for default slot. Prefer function slots for better performance.`
    );
  }
  const normalized = normalizeSlotValue(children);
  instance.slots.default = () => normalized;
};
const assignSlots = (slots, children, optimized) => {
  for (const key in children) {
    if (optimized || !isInternalKey(key)) {
      slots[key] = children[key];
    }
  }
};
const initSlots = (instance, children, optimized) => {
  const slots = instance.slots = createInternalObject();
  if (instance.vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      assignSlots(slots, children, optimized);
      if (optimized) {
        def(slots, "_", type, true);
      }
    } else {
      normalizeObjectSlots(children, slots);
    }
  } else if (children) {
    normalizeVNodeSlots(instance, children);
  }
};
const updateSlots = (instance, children, optimized) => {
  const { vnode, slots } = instance;
  let needDeletionCheck = true;
  let deletionComparisonTarget = EMPTY_OBJ;
  if (vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      if (false) {
        assignSlots(slots, children, optimized);
        trigger(instance, "set", "$slots");
      } else if (optimized && type === 1) {
        needDeletionCheck = false;
      } else {
        assignSlots(slots, children, optimized);
      }
    } else {
      needDeletionCheck = !children.$stable;
      normalizeObjectSlots(children, slots);
    }
    deletionComparisonTarget = children;
  } else if (children) {
    normalizeVNodeSlots(instance, children);
    deletionComparisonTarget = { default: 1 };
  }
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!isInternalKey(key) && deletionComparisonTarget[key] == null) {
        delete slots[key];
      }
    }
  }
};
let supported;
let perf;
function startMeasure(instance, type) {
  if (instance.appContext.config.performance && isSupported()) {
    perf.mark(`vue-${type}-${instance.uid}`);
  }
  if (true) {
    devtoolsPerfStart(instance, type, isSupported() ? perf.now() : Date.now());
  }
}
function endMeasure(instance, type) {
  if (instance.appContext.config.performance && isSupported()) {
    const startTag = `vue-${type}-${instance.uid}`;
    const endTag = startTag + `:end`;
    const measureName = `<${formatComponentName(instance, instance.type)}> ${type}`;
    perf.mark(endTag);
    perf.measure(measureName, startTag, endTag);
    perf.clearMeasures(measureName);
    perf.clearMarks(startTag);
    perf.clearMarks(endTag);
  }
  if (true) {
    devtoolsPerfEnd(instance, type, isSupported() ? perf.now() : Date.now());
  }
}
function isSupported() {
  if (supported !== void 0) {
    return supported;
  }
  if (typeof window !== "undefined" && window.performance) {
    supported = true;
    perf = window.performance;
  } else {
    supported = false;
  }
  return supported;
}
function initFeatureFlags() {
  const needWarn = [];
  if (false) {
    getGlobalThis().__VUE_OPTIONS_API__ = true;
  }
  if (false) {
    getGlobalThis().__VUE_PROD_DEVTOOLS__ = false;
  }
  if (false) {
    getGlobalThis().__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
  }
  if (false) {
    const multi = needWarn.length > 1;
    console.warn(
      `Feature flag${multi ? `s` : ``} ${needWarn.join(", ")} ${multi ? `are` : `is`} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.

For more details, see https://link.vuejs.org/feature-flags.`
    );
  }
}
const queuePostRenderEffect = queueEffectWithSuspense;
function createRenderer(options) {
  return baseCreateRenderer(options);
}
function createHydrationRenderer(options) {
  return baseCreateRenderer(options, createHydrationFunctions);
}
function baseCreateRenderer(options, createHydrationFns) {
  {
    initFeatureFlags();
  }
  const target = getGlobalThis();
  target.__VUE__ = true;
  if (true) {
    setDevtoolsHook$1(target.__VUE_DEVTOOLS_GLOBAL_HOOK__, target);
  }
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = NOOP$1,
    insertStaticContent: hostInsertStaticContent
  } = options;
  const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = false ? false : !!n2.dynamicChildren) => {
    if (n1 === n2) {
      return;
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent, parentSuspense, true);
      n1 = null;
    }
    if (n2.patchFlag === -2) {
      optimized = false;
      n2.dynamicChildren = null;
    }
    const { type, ref: ref3, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        processCommentNode(n1, n2, container, anchor);
        break;
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, namespace);
        } else if (false) {
          patchStaticNode(n1, n2, container, namespace);
        }
        break;
      case Fragment$1:
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        break;
      default:
        if (shapeFlag & 1) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 6) {
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 64) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else if (shapeFlag & 128) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else if (false) {
          warn$1("Invalid VNode type:", type, `(${typeof type})`);
        }
    }
    if (ref3 != null && parentComponent) {
      setRef(ref3, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
    } else if (ref3 == null && n1 && n1.ref != null) {
      setRef(n1.ref, null, parentSuspense, n1, true);
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateText(n2.children),
        container,
        anchor
      );
    } else {
      const el = n2.el = n1.el;
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateComment(n2.children || ""),
        container,
        anchor
      );
    } else {
      n2.el = n1.el;
    }
  };
  const mountStaticNode = (n2, container, anchor, namespace) => {
    [n2.el, n2.anchor] = hostInsertStaticContent(
      n2.children,
      container,
      anchor,
      namespace,
      n2.el,
      n2.anchor
    );
  };
  const patchStaticNode = (n1, n2, container, namespace) => {
    if (n2.children !== n1.children) {
      const anchor = hostNextSibling(n1.anchor);
      removeStaticNode(n1);
      [n2.el, n2.anchor] = hostInsertStaticContent(
        n2.children,
        container,
        anchor,
        namespace
      );
    } else {
      n2.el = n1.el;
      n2.anchor = n1.anchor;
    }
  };
  const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostInsert(el, container, nextSibling);
      el = next;
    }
    hostInsert(anchor, container, nextSibling);
  };
  const removeStaticNode = ({ el, anchor }) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostRemove(el);
      el = next;
    }
    hostRemove(anchor);
  };
  const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    if (n2.type === "svg") {
      namespace = "svg";
    } else if (n2.type === "math") {
      namespace = "mathml";
    }
    if (n1 == null) {
      mountElement(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
      try {
        if (customElement) {
          customElement._beginPatch();
        }
        patchElement(
          n1,
          n2,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } finally {
        if (customElement) {
          customElement._endPatch();
        }
      }
    }
  };
  const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let el;
    let vnodeHook;
    const { props, shapeFlag, transition, dirs } = vnode;
    el = vnode.el = hostCreateElement(
      vnode.type,
      namespace,
      props && props.is,
      props
    );
    if (shapeFlag & 8) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & 16) {
      mountChildren(
        vnode.children,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(vnode, namespace),
        slotScopeIds,
        optimized
      );
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "created");
    }
    setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
    if (props) {
      for (const key in props) {
        if (key !== "value" && !isReservedProp(key)) {
          hostPatchProp(el, key, null, props[key], namespace, parentComponent);
        }
      }
      if ("value" in props) {
        hostPatchProp(el, "value", null, props.value, namespace);
      }
      if (vnodeHook = props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHook, parentComponent, vnode);
      }
    }
    if (true) {
      def(el, "__vnode", vnode, true);
      def(el, "__vueParentComponent", parentComponent, true);
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
    }
    const needCallTransitionHooks = needTransition(parentSuspense, transition);
    if (needCallTransitionHooks) {
      transition.beforeEnter(el);
    }
    hostInsert(el, container, anchor);
    if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
      const isHmr = false;
      queuePostRenderEffect(() => {
        let prev;
        if (false) prev = setHmrUpdating(isHmr);
        try {
          vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
          needCallTransitionHooks && transition.enter(el);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
        } finally {
          if (false) setHmrUpdating(prev);
        }
      }, parentSuspense);
    }
  };
  const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
    if (scopeId) {
      hostSetScopeId(el, scopeId);
    }
    if (slotScopeIds) {
      for (let i = 0; i < slotScopeIds.length; i++) {
        hostSetScopeId(el, slotScopeIds[i]);
      }
    }
    if (parentComponent) {
      let subTree = parentComponent.subTree;
      if (false) {
        subTree = filterSingleRoot(subTree.children) || subTree;
      }
      if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
        const parentVNode = parentComponent.vnode;
        setScopeId(
          el,
          parentVNode,
          parentVNode.scopeId,
          parentVNode.slotScopeIds,
          parentComponent.parent
        );
      }
    }
  };
  const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
      patch(
        null,
        child,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
  };
  const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const el = n2.el = n1.el;
    if (true) {
      el.__vnode = n2;
    }
    let { patchFlag, dynamicChildren, dirs } = n2;
    patchFlag |= n1.patchFlag & 16;
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    let vnodeHook;
    parentComponent && toggleRecurse(parentComponent, false);
    if (vnodeHook = newProps.onVnodeBeforeUpdate) {
      invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
    }
    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
    }
    parentComponent && toggleRecurse(parentComponent, true);
    if (false) {
      patchFlag = 0;
      optimized = false;
      dynamicChildren = null;
    }
    if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) {
      hostSetElementText(el, "");
    }
    if (dynamicChildren) {
      patchBlockChildren(
        n1.dynamicChildren,
        dynamicChildren,
        el,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds
      );
      if (false) {
        traverseStaticChildren(n1, n2);
      }
    } else if (!optimized) {
      patchChildren(
        n1,
        n2,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds,
        false
      );
    }
    if (patchFlag > 0) {
      if (patchFlag & 16) {
        patchProps(el, oldProps, newProps, parentComponent, namespace);
      } else {
        if (patchFlag & 2) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, "class", null, newProps.class, namespace);
          }
        }
        if (patchFlag & 4) {
          hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
        }
        if (patchFlag & 8) {
          const propsToUpdate = n2.dynamicProps;
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            const prev = oldProps[key];
            const next = newProps[key];
            if (next !== prev || key === "value") {
              hostPatchProp(el, key, prev, next, namespace, parentComponent);
            }
          }
        }
      }
      if (patchFlag & 1) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    } else if (!optimized && dynamicChildren == null) {
      patchProps(el, oldProps, newProps, parentComponent, namespace);
    }
    if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
      }, parentSuspense);
    }
  };
  const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const container = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        oldVNode.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (oldVNode.type === Fragment$1 || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !isSameVNodeType(oldVNode, newVNode) || // - In the case of a component, it could contain anything.
        oldVNode.shapeFlag & (6 | 64 | 128)) ? hostParentNode(oldVNode.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          fallbackContainer
        )
      );
      patch(
        oldVNode,
        newVNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        true
      );
    }
  };
  const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
    if (oldProps !== newProps) {
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!isReservedProp(key) && !(key in newProps)) {
            hostPatchProp(
              el,
              key,
              oldProps[key],
              null,
              namespace,
              parentComponent
            );
          }
        }
      }
      for (const key in newProps) {
        if (isReservedProp(key)) continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== "value") {
          hostPatchProp(el, key, prev, next, namespace, parentComponent);
        }
      }
      if ("value" in newProps) {
        hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
      }
    }
  };
  const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
    const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
    let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
    if (false) {
      patchFlag = 0;
      optimized = false;
      dynamicChildren = null;
    }
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(
        // #10007
        // such fragment like `<></>` will be compiled into
        // a fragment which doesn't have a children.
        // In this case fallback to an empty array
        n2.children || [],
        container,
        fragmentEndAnchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && // #2715 the previous fragment could've been a BAILed one as a result
      // of renderSlot() with no valid children
      n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          container,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds
        );
        if (false) {
          traverseStaticChildren(n1, n2);
        } else if (
          // #2080 if the stable fragment has a key, it's a <template v-for> that may
          //  get moved around. Make sure all root level vnodes inherit el.
          // #2134 or if it's a component root, it may also get moved around
          // as the component is being moved.
          n2.key != null || parentComponent && n2 === parentComponent.subTree
        ) {
          traverseStaticChildren(
            n1,
            n2,
            true
            /* shallow */
          );
        }
      } else {
        patchChildren(
          n1,
          n2,
          container,
          fragmentEndAnchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    }
  };
  const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    n2.slotScopeIds = slotScopeIds;
    if (n1 == null) {
      if (n2.shapeFlag & 512) {
        parentComponent.ctx.activate(
          n2,
          container,
          anchor,
          namespace,
          optimized
        );
      } else {
        mountComponent(
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          optimized
        );
      }
    } else {
      updateComponent(n1, n2, optimized);
    }
  };
  const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
    const instance = initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense
    );
    if (false) {
      registerHMR(instance);
    }
    if (false) {
      pushWarningContext(initialVNode);
      startMeasure(instance, `mount`);
    }
    if (isKeepAlive(initialVNode)) {
      instance.ctx.renderer = internals;
    }
    {
      if (false) {
        startMeasure(instance, `init`);
      }
      setupComponent(instance, false, optimized);
      if (false) {
        endMeasure(instance, `init`);
      }
    }
    if (false) initialVNode.el = null;
    if (instance.asyncDep) {
      parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized);
      if (!initialVNode.el) {
        const placeholder = instance.subTree = createVNode(Comment);
        processCommentNode(null, placeholder, container, anchor);
        initialVNode.placeholder = placeholder.el;
      }
    } else {
      setupRenderEffect(
        instance,
        initialVNode,
        container,
        anchor,
        parentSuspense,
        namespace,
        optimized
      );
    }
    if (false) {
      popWarningContext();
      endMeasure(instance, `mount`);
    }
  };
  const updateComponent = (n1, n2, optimized) => {
    const instance = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2, optimized)) {
      if (instance.asyncDep && !instance.asyncResolved) {
        if (false) {
          pushWarningContext(n2);
        }
        updateComponentPreRender(instance, n2, optimized);
        if (false) {
          popWarningContext();
        }
        return;
      } else {
        instance.next = n2;
        instance.update();
      }
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  };
  const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        let vnodeHook;
        const { el, props } = initialVNode;
        const { bm, m, parent, root, type } = instance;
        const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
        toggleRecurse(instance, false);
        if (bm) {
          invokeArrayFns(bm);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parent, initialVNode);
        }
        toggleRecurse(instance, true);
        if (el && hydrateNode) {
          const hydrateSubTree = () => {
            if (false) {
              startMeasure(instance, `render`);
            }
            instance.subTree = renderComponentRoot(instance);
            if (false) {
              endMeasure(instance, `render`);
            }
            if (false) {
              startMeasure(instance, `hydrate`);
            }
            hydrateNode(
              el,
              instance.subTree,
              instance,
              parentSuspense,
              null
            );
            if (false) {
              endMeasure(instance, `hydrate`);
            }
          };
          if (isAsyncWrapperVNode && type.__asyncHydrate) {
            type.__asyncHydrate(
              el,
              instance,
              hydrateSubTree
            );
          } else {
            hydrateSubTree();
          }
        } else {
          if (root.ce && root.ce._hasShadowRoot()) {
            root.ce._injectChildStyle(
              type,
              instance.parent ? instance.parent.type : void 0
            );
          }
          if (false) {
            startMeasure(instance, `render`);
          }
          const subTree = instance.subTree = renderComponentRoot(instance);
          if (false) {
            endMeasure(instance, `render`);
          }
          if (false) {
            startMeasure(instance, `patch`);
          }
          patch(
            null,
            subTree,
            container,
            anchor,
            instance,
            parentSuspense,
            namespace
          );
          if (false) {
            endMeasure(instance, `patch`);
          }
          initialVNode.el = subTree.el;
        }
        if (m) {
          queuePostRenderEffect(m, parentSuspense);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
          const scopedInitialVNode = initialVNode;
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode),
            parentSuspense
          );
        }
        if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) {
          instance.a && queuePostRenderEffect(instance.a, parentSuspense);
        }
        instance.isMounted = true;
        if (true) {
          devtoolsComponentAdded(instance);
        }
        initialVNode = container = anchor = null;
      } else {
        let { next, bu, u, parent, vnode } = instance;
        {
          const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
          if (nonHydratedAsyncRoot) {
            if (next) {
              next.el = vnode.el;
              updateComponentPreRender(instance, next, optimized);
            }
            nonHydratedAsyncRoot.asyncDep.then(() => {
              queuePostRenderEffect(() => {
                if (!instance.isUnmounted) update();
              }, parentSuspense);
            });
            return;
          }
        }
        let originNext = next;
        let vnodeHook;
        if (false) {
          pushWarningContext(next || instance.vnode);
        }
        toggleRecurse(instance, false);
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next, optimized);
        } else {
          next = vnode;
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
          invokeVNodeHook(vnodeHook, parent, next, vnode);
        }
        toggleRecurse(instance, true);
        if (false) {
          startMeasure(instance, `render`);
        }
        const nextTree = renderComponentRoot(instance);
        if (false) {
          endMeasure(instance, `render`);
        }
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        if (false) {
          startMeasure(instance, `patch`);
        }
        patch(
          prevTree,
          nextTree,
          // parent may have changed if it's in a teleport
          hostParentNode(prevTree.el),
          // anchor may have changed if it's in a fragment
          getNextHostNode(prevTree),
          instance,
          parentSuspense,
          namespace
        );
        if (false) {
          endMeasure(instance, `patch`);
        }
        next.el = nextTree.el;
        if (originNext === null) {
          updateHOCHostEl(instance, nextTree.el);
        }
        if (u) {
          queuePostRenderEffect(u, parentSuspense);
        }
        if (vnodeHook = next.props && next.props.onVnodeUpdated) {
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, next, vnode),
            parentSuspense
          );
        }
        if (true) {
          devtoolsComponentUpdated(instance);
        }
        if (false) {
          popWarningContext();
        }
      }
    };
    instance.scope.on();
    const effect2 = instance.effect = new ReactiveEffect(componentUpdateFn);
    instance.scope.off();
    const update = instance.update = effect2.run.bind(effect2);
    const job = instance.job = effect2.runIfDirty.bind(effect2);
    job.i = instance;
    job.id = instance.uid;
    effect2.scheduler = () => queueJob(job);
    toggleRecurse(instance, true);
    if (false) {
      effect2.onTrack = instance.rtc ? (e) => invokeArrayFns(instance.rtc, e) : void 0;
      effect2.onTrigger = instance.rtg ? (e) => invokeArrayFns(instance.rtg, e) : void 0;
    }
    update();
  };
  const updateComponentPreRender = (instance, nextVNode, optimized) => {
    nextVNode.component = instance;
    const prevProps = instance.vnode.props;
    instance.vnode = nextVNode;
    instance.next = null;
    updateProps(instance, nextVNode.props, prevProps, optimized);
    updateSlots(instance, nextVNode.children, optimized);
    pauseTracking();
    flushPreFlushCbs(instance);
    resetTracking();
  };
  const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { patchFlag, shapeFlag } = n2;
    if (patchFlag > 0) {
      if (patchFlag & 128) {
        patchKeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      } else if (patchFlag & 256) {
        patchUnkeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      }
    }
    if (shapeFlag & 8) {
      if (prevShapeFlag & 16) {
        unmountChildren(c1, parentComponent, parentSuspense);
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16) {
        if (shapeFlag & 16) {
          patchKeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else {
          unmountChildren(c1, parentComponent, parentSuspense, true);
        }
      } else {
        if (prevShapeFlag & 8) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16) {
          mountChildren(
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        }
      }
    }
  };
  const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    c1 = c1 || EMPTY_ARR;
    c2 = c2 || EMPTY_ARR;
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    let i;
    for (i = 0; i < commonLength; i++) {
      const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      patch(
        c1[i],
        nextChild,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
    if (oldLength > newLength) {
      unmountChildren(
        c1,
        parentComponent,
        parentSuspense,
        true,
        false,
        commonLength
      );
    } else {
      mountChildren(
        c2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
        commonLength
      );
    }
  };
  const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
        while (i <= e2) {
          patch(
            null,
            c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]),
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        if (nextChild.key != null) {
          if (false) {
            warn$1(
              `Duplicate keys found during update:`,
              JSON.stringify(nextChild.key),
              `Make sure keys are unique.`
            );
          }
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }
      let j;
      let patched = 0;
      const toBePatched = e2 - s2 + 1;
      let moved = false;
      let maxNewIndexSoFar = 0;
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          unmount(prevChild, parentComponent, parentSuspense, true);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (j = s2; j <= e2; j++) {
            if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === void 0) {
          unmount(prevChild, parentComponent, parentSuspense, true);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          patch(
            prevChild,
            c2[newIndex],
            container,
            null,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          patched++;
        }
      }
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
      j = increasingNewIndexSequence.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchorVNode = c2[nextIndex + 1];
        const anchor = nextIndex + 1 < l2 ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode)
        ) : parentAnchor;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(
            null,
            nextChild,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor, 2);
          } else {
            j--;
          }
        }
      }
    }
  };
  const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
    const { el, type, transition, children, shapeFlag } = vnode;
    if (shapeFlag & 6) {
      move(vnode.component.subTree, container, anchor, moveType);
      return;
    }
    if (shapeFlag & 128) {
      vnode.suspense.move(container, anchor, moveType);
      return;
    }
    if (shapeFlag & 64) {
      type.move(vnode, container, anchor, internals);
      return;
    }
    if (type === Fragment$1) {
      hostInsert(el, container, anchor);
      for (let i = 0; i < children.length; i++) {
        move(children[i], container, anchor, moveType);
      }
      hostInsert(vnode.anchor, container, anchor);
      return;
    }
    if (type === Static) {
      moveStaticNode(vnode, container, anchor);
      return;
    }
    const needTransition2 = moveType !== 2 && shapeFlag & 1 && transition;
    if (needTransition2) {
      if (moveType === 0) {
        transition.beforeEnter(el);
        hostInsert(el, container, anchor);
        queuePostRenderEffect(() => transition.enter(el), parentSuspense);
      } else {
        const { leave, delayLeave, afterLeave } = transition;
        const remove22 = () => {
          if (vnode.ctx.isUnmounted) {
            hostRemove(el);
          } else {
            hostInsert(el, container, anchor);
          }
        };
        const performLeave = () => {
          if (el._isLeaving) {
            el[leaveCbKey](
              true
              /* cancelled */
            );
          }
          leave(el, () => {
            remove22();
            afterLeave && afterLeave();
          });
        };
        if (delayLeave) {
          delayLeave(el, remove22, performLeave);
        } else {
          performLeave();
        }
      }
    } else {
      hostInsert(el, container, anchor);
    }
  };
  const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
    const {
      type,
      props,
      ref: ref3,
      children,
      dynamicChildren,
      shapeFlag,
      patchFlag,
      dirs,
      cacheIndex,
      memo
    } = vnode;
    if (patchFlag === -2) {
      optimized = false;
    }
    if (ref3 != null) {
      pauseTracking();
      setRef(ref3, null, parentSuspense, vnode, true);
      resetTracking();
    }
    if (cacheIndex != null) {
      parentComponent.renderCache[cacheIndex] = void 0;
    }
    if (shapeFlag & 256) {
      parentComponent.ctx.deactivate(vnode);
      return;
    }
    const shouldInvokeDirs = shapeFlag & 1 && dirs;
    const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
    let vnodeHook;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode);
    }
    if (shapeFlag & 6) {
      unmountComponent(vnode.component, parentSuspense, doRemove);
    } else {
      if (shapeFlag & 128) {
        vnode.suspense.unmount(parentSuspense, doRemove);
        return;
      }
      if (shouldInvokeDirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
      }
      if (shapeFlag & 64) {
        vnode.type.remove(
          vnode,
          parentComponent,
          parentSuspense,
          internals,
          doRemove
        );
      } else if (dynamicChildren && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !dynamicChildren.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (type !== Fragment$1 || patchFlag > 0 && patchFlag & 64)) {
        unmountChildren(
          dynamicChildren,
          parentComponent,
          parentSuspense,
          false,
          true
        );
      } else if (type === Fragment$1 && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
        unmountChildren(children, parentComponent, parentSuspense);
      }
      if (doRemove) {
        remove2(vnode);
      }
    }
    const shouldInvalidateMemo = memo != null && cacheIndex == null;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
        if (shouldInvalidateMemo) {
          vnode.el = null;
        }
      }, parentSuspense);
    }
  };
  const remove2 = (vnode) => {
    const { type, el, anchor, transition } = vnode;
    if (type === Fragment$1) {
      if (false) {
        vnode.children.forEach((child) => {
          if (child.type === Comment) {
            hostRemove(child.el);
          } else {
            remove2(child);
          }
        });
      } else {
        removeFragment(el, anchor);
      }
      return;
    }
    if (type === Static) {
      removeStaticNode(vnode);
      return;
    }
    const performRemove = () => {
      hostRemove(el);
      if (transition && !transition.persisted && transition.afterLeave) {
        transition.afterLeave();
      }
    };
    if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
      const { leave, delayLeave } = transition;
      const performLeave = () => leave(el, performRemove);
      if (delayLeave) {
        delayLeave(vnode.el, performRemove, performLeave);
      } else {
        performLeave();
      }
    } else {
      performRemove();
    }
  };
  const removeFragment = (cur, end) => {
    let next;
    while (cur !== end) {
      next = hostNextSibling(cur);
      hostRemove(cur);
      cur = next;
    }
    hostRemove(end);
  };
  const unmountComponent = (instance, parentSuspense, doRemove) => {
    if (false) {
      unregisterHMR(instance);
    }
    const { bum, scope, job, subTree, um, m, a } = instance;
    invalidateMount(m);
    invalidateMount(a);
    if (bum) {
      invokeArrayFns(bum);
    }
    scope.stop();
    if (job) {
      job.flags |= 8;
      unmount(subTree, instance, parentSuspense, doRemove);
    }
    if (um) {
      queuePostRenderEffect(um, parentSuspense);
    }
    queuePostRenderEffect(() => {
      instance.isUnmounted = true;
    }, parentSuspense);
    if (true) {
      devtoolsComponentRemoved(instance);
    }
  };
  const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
    }
  };
  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & 6) {
      return getNextHostNode(vnode.component.subTree);
    }
    if (vnode.shapeFlag & 128) {
      return vnode.suspense.next();
    }
    const el = hostNextSibling(vnode.anchor || vnode.el);
    const teleportEnd = el && el[TeleportEndKey];
    return teleportEnd ? hostNextSibling(teleportEnd) : el;
  };
  let isFlushing = false;
  const render = (vnode, container, namespace) => {
    let instance;
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
        instance = container._vnode.component;
      }
    } else {
      patch(
        container._vnode || null,
        vnode,
        container,
        null,
        null,
        null,
        namespace
      );
    }
    container._vnode = vnode;
    if (!isFlushing) {
      isFlushing = true;
      flushPreFlushCbs(instance);
      flushPostFlushCbs();
      isFlushing = false;
    }
  };
  const internals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove2,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options
  };
  let hydrate;
  let hydrateNode;
  if (createHydrationFns) {
    [hydrate, hydrateNode] = createHydrationFns(
      internals
    );
  }
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate)
  };
}
function resolveChildrenNamespace({ type, props }, currentNamespace) {
  return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
}
function toggleRecurse({ effect: effect2, job }, allowed) {
  if (allowed) {
    effect2.flags |= 32;
    job.flags |= 4;
  } else {
    effect2.flags &= -33;
    job.flags &= -5;
  }
}
function needTransition(parentSuspense, transition) {
  return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
}
function traverseStaticChildren(n1, n2, shallow = false) {
  const ch1 = n1.children;
  const ch2 = n2.children;
  if (isArray$2(ch1) && isArray$2(ch2)) {
    for (let i = 0; i < ch1.length; i++) {
      const c1 = ch1[i];
      let c2 = ch2[i];
      if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
        if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
          c2 = ch2[i] = cloneIfMounted(ch2[i]);
          c2.el = c1.el;
        }
        if (!shallow && c2.patchFlag !== -2)
          traverseStaticChildren(c1, c2);
      }
      if (c2.type === Text) {
        if (c2.patchFlag === -1) {
          c2 = ch2[i] = cloneIfMounted(c2);
        }
        c2.el = c1.el;
      }
      if (c2.type === Comment && !c2.el) {
        c2.el = c1.el;
      }
      if (false) {
        c2.el && (c2.el.__vnode = c2);
      }
    }
  }
}
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
function locateNonHydratedAsyncRoot(instance) {
  const subComponent = instance.subTree.component;
  if (subComponent) {
    if (subComponent.asyncDep && !subComponent.asyncResolved) {
      return subComponent;
    } else {
      return locateNonHydratedAsyncRoot(subComponent);
    }
  }
}
function invalidateMount(hooks) {
  if (hooks) {
    for (let i = 0; i < hooks.length; i++)
      hooks[i].flags |= 8;
  }
}
function resolveAsyncComponentPlaceholder(anchorVnode) {
  if (anchorVnode.placeholder) {
    return anchorVnode.placeholder;
  }
  const instance = anchorVnode.component;
  if (instance) {
    return resolveAsyncComponentPlaceholder(instance.subTree);
  }
  return null;
}
const isSuspense = (type) => type.__isSuspense;
let suspenseId = 0;
const SuspenseImpl = {
  name: "Suspense",
  // In order to make Suspense tree-shakable, we need to avoid importing it
  // directly in the renderer. The renderer checks for the __isSuspense flag
  // on a vnode's type and calls the `process` method, passing in renderer
  // internals.
  __isSuspense: true,
  process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, rendererInternals) {
    if (n1 == null) {
      mountSuspense(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
        rendererInternals
      );
    } else {
      if (parentSuspense && parentSuspense.deps > 0 && !n1.suspense.isInFallback) {
        n2.suspense = n1.suspense;
        n2.suspense.vnode = n2;
        n2.el = n1.el;
        return;
      }
      patchSuspense(
        n1,
        n2,
        container,
        anchor,
        parentComponent,
        namespace,
        slotScopeIds,
        optimized,
        rendererInternals
      );
    }
  },
  hydrate: hydrateSuspense,
  normalize: normalizeSuspenseChildren
};
const Suspense = SuspenseImpl;
function triggerEvent(vnode, name) {
  const eventListener = vnode.props && vnode.props[name];
  if (isFunction(eventListener)) {
    eventListener();
  }
}
function mountSuspense(vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, rendererInternals) {
  const {
    p: patch,
    o: { createElement }
  } = rendererInternals;
  const hiddenContainer = createElement("div");
  const suspense = vnode.suspense = createSuspenseBoundary(
    vnode,
    parentSuspense,
    parentComponent,
    container,
    hiddenContainer,
    anchor,
    namespace,
    slotScopeIds,
    optimized,
    rendererInternals
  );
  patch(
    null,
    suspense.pendingBranch = vnode.ssContent,
    hiddenContainer,
    null,
    parentComponent,
    suspense,
    namespace,
    slotScopeIds
  );
  if (suspense.deps > 0) {
    triggerEvent(vnode, "onPending");
    triggerEvent(vnode, "onFallback");
    patch(
      null,
      vnode.ssFallback,
      container,
      anchor,
      parentComponent,
      null,
      // fallback tree will not have suspense context
      namespace,
      slotScopeIds
    );
    setActiveBranch(suspense, vnode.ssFallback);
  } else {
    suspense.resolve(false, true);
  }
}
function patchSuspense(n1, n2, container, anchor, parentComponent, namespace, slotScopeIds, optimized, { p: patch, um: unmount, o: { createElement } }) {
  const suspense = n2.suspense = n1.suspense;
  suspense.vnode = n2;
  n2.el = n1.el;
  const newBranch = n2.ssContent;
  const newFallback = n2.ssFallback;
  const { activeBranch, pendingBranch, isInFallback, isHydrating } = suspense;
  if (pendingBranch) {
    suspense.pendingBranch = newBranch;
    if (isSameVNodeType(pendingBranch, newBranch)) {
      patch(
        pendingBranch,
        newBranch,
        suspense.hiddenContainer,
        null,
        parentComponent,
        suspense,
        namespace,
        slotScopeIds,
        optimized
      );
      if (suspense.deps <= 0) {
        suspense.resolve();
      } else if (isInFallback) {
        if (!isHydrating) {
          patch(
            activeBranch,
            newFallback,
            container,
            anchor,
            parentComponent,
            null,
            // fallback tree will not have suspense context
            namespace,
            slotScopeIds,
            optimized
          );
          setActiveBranch(suspense, newFallback);
        }
      }
    } else {
      suspense.pendingId = suspenseId++;
      if (isHydrating) {
        suspense.isHydrating = false;
        suspense.activeBranch = pendingBranch;
      } else {
        unmount(pendingBranch, parentComponent, suspense);
      }
      suspense.deps = 0;
      suspense.effects.length = 0;
      suspense.hiddenContainer = createElement("div");
      if (isInFallback) {
        patch(
          null,
          newBranch,
          suspense.hiddenContainer,
          null,
          parentComponent,
          suspense,
          namespace,
          slotScopeIds,
          optimized
        );
        if (suspense.deps <= 0) {
          suspense.resolve();
        } else {
          patch(
            activeBranch,
            newFallback,
            container,
            anchor,
            parentComponent,
            null,
            // fallback tree will not have suspense context
            namespace,
            slotScopeIds,
            optimized
          );
          setActiveBranch(suspense, newFallback);
        }
      } else if (activeBranch && isSameVNodeType(activeBranch, newBranch)) {
        patch(
          activeBranch,
          newBranch,
          container,
          anchor,
          parentComponent,
          suspense,
          namespace,
          slotScopeIds,
          optimized
        );
        suspense.resolve(true);
      } else {
        patch(
          null,
          newBranch,
          suspense.hiddenContainer,
          null,
          parentComponent,
          suspense,
          namespace,
          slotScopeIds,
          optimized
        );
        if (suspense.deps <= 0) {
          suspense.resolve();
        }
      }
    }
  } else {
    if (activeBranch && isSameVNodeType(activeBranch, newBranch)) {
      patch(
        activeBranch,
        newBranch,
        container,
        anchor,
        parentComponent,
        suspense,
        namespace,
        slotScopeIds,
        optimized
      );
      setActiveBranch(suspense, newBranch);
    } else {
      triggerEvent(n2, "onPending");
      suspense.pendingBranch = newBranch;
      if (newBranch.shapeFlag & 512) {
        suspense.pendingId = newBranch.component.suspenseId;
      } else {
        suspense.pendingId = suspenseId++;
      }
      patch(
        null,
        newBranch,
        suspense.hiddenContainer,
        null,
        parentComponent,
        suspense,
        namespace,
        slotScopeIds,
        optimized
      );
      if (suspense.deps <= 0) {
        suspense.resolve();
      } else {
        const { timeout, pendingId } = suspense;
        if (timeout > 0) {
          setTimeout(() => {
            if (suspense.pendingId === pendingId) {
              suspense.fallback(newFallback);
            }
          }, timeout);
        } else if (timeout === 0) {
          suspense.fallback(newFallback);
        }
      }
    }
  }
}
let hasWarned = false;
function createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, namespace, slotScopeIds, optimized, rendererInternals, isHydrating = false) {
  if (false) {
    hasWarned = true;
    console[console.info ? "info" : "log"](
      `<Suspense> is an experimental feature and its API will likely change.`
    );
  }
  const {
    p: patch,
    m: move,
    um: unmount,
    n: next,
    o: { parentNode, remove: remove2 }
  } = rendererInternals;
  let parentSuspenseId;
  const isSuspensible = isVNodeSuspensible(vnode);
  if (isSuspensible) {
    if (parentSuspense && parentSuspense.pendingBranch) {
      parentSuspenseId = parentSuspense.pendingId;
      parentSuspense.deps++;
    }
  }
  const timeout = vnode.props ? toNumber(vnode.props.timeout) : void 0;
  if (false) {
    assertNumber(timeout, `Suspense timeout`);
  }
  const initialAnchor = anchor;
  const suspense = {
    vnode,
    parent: parentSuspense,
    parentComponent,
    namespace,
    container,
    hiddenContainer,
    deps: 0,
    pendingId: suspenseId++,
    timeout: typeof timeout === "number" ? timeout : -1,
    activeBranch: null,
    isFallbackMountPending: false,
    pendingBranch: null,
    isInFallback: !isHydrating,
    isHydrating,
    isUnmounted: false,
    effects: [],
    resolve(resume = false, sync = false) {
      if (false) {
        if (!resume && !suspense.pendingBranch) {
          throw new Error(
            `suspense.resolve() is called without a pending branch.`
          );
        }
        if (suspense.isUnmounted) {
          throw new Error(
            `suspense.resolve() is called on an already unmounted suspense boundary.`
          );
        }
      }
      const {
        vnode: vnode2,
        activeBranch,
        pendingBranch,
        pendingId,
        effects,
        parentComponent: parentComponent2,
        container: container2,
        isInFallback
      } = suspense;
      let delayEnter = false;
      if (suspense.isHydrating) {
        suspense.isHydrating = false;
      } else if (!resume) {
        delayEnter = activeBranch && pendingBranch.transition && pendingBranch.transition.mode === "out-in";
        if (delayEnter) {
          activeBranch.transition.afterLeave = () => {
            if (pendingId === suspense.pendingId) {
              move(
                pendingBranch,
                container2,
                anchor === initialAnchor ? next(activeBranch) : anchor,
                0
              );
              queuePostFlushCb(effects);
              if (isInFallback && vnode2.ssFallback) {
                vnode2.ssFallback.el = null;
              }
            }
          };
        }
        if (activeBranch && !suspense.isFallbackMountPending) {
          if (parentNode(activeBranch.el) === container2) {
            anchor = next(activeBranch);
          }
          unmount(activeBranch, parentComponent2, suspense, true);
          if (!delayEnter && isInFallback && vnode2.ssFallback) {
            queuePostRenderEffect(() => vnode2.ssFallback.el = null, suspense);
          }
        }
        if (!delayEnter) {
          move(pendingBranch, container2, anchor, 0);
        }
      }
      suspense.isFallbackMountPending = false;
      setActiveBranch(suspense, pendingBranch);
      suspense.pendingBranch = null;
      suspense.isInFallback = false;
      let parent = suspense.parent;
      let hasUnresolvedAncestor = false;
      while (parent) {
        if (parent.pendingBranch) {
          parent.effects.push(...effects);
          hasUnresolvedAncestor = true;
          break;
        }
        parent = parent.parent;
      }
      if (!hasUnresolvedAncestor && !delayEnter) {
        queuePostFlushCb(effects);
      }
      suspense.effects = [];
      if (isSuspensible) {
        if (parentSuspense && parentSuspense.pendingBranch && parentSuspenseId === parentSuspense.pendingId) {
          parentSuspense.deps--;
          if (parentSuspense.deps === 0 && !sync) {
            parentSuspense.resolve();
          }
        }
      }
      triggerEvent(vnode2, "onResolve");
    },
    fallback(fallbackVNode) {
      if (!suspense.pendingBranch) {
        return;
      }
      const { vnode: vnode2, activeBranch, parentComponent: parentComponent2, container: container2, namespace: namespace2 } = suspense;
      triggerEvent(vnode2, "onFallback");
      const anchor2 = next(activeBranch);
      const mountFallback = () => {
        suspense.isFallbackMountPending = false;
        if (!suspense.isInFallback) {
          return;
        }
        patch(
          null,
          fallbackVNode,
          container2,
          anchor2,
          parentComponent2,
          null,
          // fallback tree will not have suspense context
          namespace2,
          slotScopeIds,
          optimized
        );
        setActiveBranch(suspense, fallbackVNode);
      };
      const delayEnter = fallbackVNode.transition && fallbackVNode.transition.mode === "out-in";
      if (delayEnter) {
        suspense.isFallbackMountPending = true;
        activeBranch.transition.afterLeave = mountFallback;
      }
      suspense.isInFallback = true;
      unmount(
        activeBranch,
        parentComponent2,
        null,
        // no suspense so unmount hooks fire now
        true
        // shouldRemove
      );
      if (!delayEnter) {
        mountFallback();
      }
    },
    move(container2, anchor2, type) {
      suspense.activeBranch && move(suspense.activeBranch, container2, anchor2, type);
      suspense.container = container2;
    },
    next() {
      return suspense.activeBranch && next(suspense.activeBranch);
    },
    registerDep(instance, setupRenderEffect, optimized2) {
      const isInPendingSuspense = !!suspense.pendingBranch;
      if (isInPendingSuspense) {
        suspense.deps++;
      }
      const hydratedEl = instance.vnode.el;
      instance.asyncDep.catch((err) => {
        handleError(err, instance, 0);
      }).then((asyncSetupResult) => {
        if (instance.isUnmounted || suspense.isUnmounted || suspense.pendingId !== instance.suspenseId) {
          return;
        }
        unsetCurrentInstance();
        instance.asyncResolved = true;
        const { vnode: vnode2 } = instance;
        if (false) {
          pushWarningContext(vnode2);
        }
        handleSetupResult(instance, asyncSetupResult, false);
        if (hydratedEl) {
          vnode2.el = hydratedEl;
        }
        const placeholder = !hydratedEl && instance.subTree.el;
        setupRenderEffect(
          instance,
          vnode2,
          // component may have been moved before resolve.
          // if this is not a hydration, instance.subTree will be the comment
          // placeholder.
          parentNode(hydratedEl || instance.subTree.el),
          // anchor will not be used if this is hydration, so only need to
          // consider the comment placeholder case.
          hydratedEl ? null : next(instance.subTree),
          suspense,
          namespace,
          optimized2
        );
        if (placeholder) {
          vnode2.placeholder = null;
          remove2(placeholder);
        }
        updateHOCHostEl(instance, vnode2.el);
        if (false) {
          popWarningContext();
        }
        if (isInPendingSuspense && --suspense.deps === 0) {
          suspense.resolve();
        }
      });
    },
    unmount(parentSuspense2, doRemove) {
      suspense.isUnmounted = true;
      if (suspense.activeBranch) {
        unmount(
          suspense.activeBranch,
          parentComponent,
          parentSuspense2,
          doRemove
        );
      }
      if (suspense.pendingBranch) {
        unmount(
          suspense.pendingBranch,
          parentComponent,
          parentSuspense2,
          doRemove
        );
      }
    }
  };
  return suspense;
}
function hydrateSuspense(node, vnode, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, rendererInternals, hydrateNode) {
  const suspense = vnode.suspense = createSuspenseBoundary(
    vnode,
    parentSuspense,
    parentComponent,
    node.parentNode,
    // eslint-disable-next-line no-restricted-globals
    document.createElement("div"),
    null,
    namespace,
    slotScopeIds,
    optimized,
    rendererInternals,
    true
  );
  const result = hydrateNode(
    node,
    suspense.pendingBranch = vnode.ssContent,
    parentComponent,
    suspense,
    slotScopeIds,
    optimized
  );
  if (suspense.deps === 0) {
    suspense.resolve(false, true);
  }
  return result;
}
function normalizeSuspenseChildren(vnode) {
  const { shapeFlag, children } = vnode;
  const isSlotChildren = shapeFlag & 32;
  vnode.ssContent = normalizeSuspenseSlot(
    isSlotChildren ? children.default : children
  );
  vnode.ssFallback = isSlotChildren ? normalizeSuspenseSlot(children.fallback) : createVNode(Comment);
}
function normalizeSuspenseSlot(s) {
  let block;
  if (isFunction(s)) {
    const trackBlock = isBlockTreeEnabled && s._c;
    if (trackBlock) {
      s._d = false;
      openBlock();
    }
    s = s();
    if (trackBlock) {
      s._d = true;
      block = currentBlock;
      closeBlock();
    }
  }
  if (isArray$2(s)) {
    const singleChild = filterSingleRoot(s);
    if (false) {
      warn$1(`<Suspense> slots expect a single root node.`);
    }
    s = singleChild;
  }
  s = normalizeVNode(s);
  if (block && !s.dynamicChildren) {
    s.dynamicChildren = block.filter((c) => c !== s);
  }
  return s;
}
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray$2(fn)) {
      suspense.effects.push(...fn);
    } else {
      suspense.effects.push(fn);
    }
  } else {
    queuePostFlushCb(fn);
  }
}
function setActiveBranch(suspense, branch) {
  suspense.activeBranch = branch;
  const { vnode, parentComponent } = suspense;
  let el = branch.el;
  while (!el && branch.component) {
    branch = branch.component.subTree;
    el = branch.el;
  }
  vnode.el = el;
  if (parentComponent && parentComponent.subTree === vnode) {
    parentComponent.vnode.el = el;
    updateHOCHostEl(parentComponent, el);
  }
}
function isVNodeSuspensible(vnode) {
  const suspensible = vnode.props && vnode.props.suspensible;
  return suspensible != null && suspensible !== false;
}
const Fragment$1 = /* @__PURE__ */ Symbol.for("v-fgt");
const Text = /* @__PURE__ */ Symbol.for("v-txt");
const Comment = /* @__PURE__ */ Symbol.for("v-cmt");
const Static = /* @__PURE__ */ Symbol.for("v-stc");
const blockStack = [];
let currentBlock = null;
function openBlock(disableTracking = false) {
  blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
let isBlockTreeEnabled = 1;
function setBlockTracking(value, inVOnce = false) {
  isBlockTreeEnabled += value;
  if (value < 0 && currentBlock && inVOnce) {
    currentBlock.hasOnce = true;
  }
}
function setupBlock(vnode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
  closeBlock();
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode);
  }
  return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
  return setupBlock(
    createBaseVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      true
    )
  );
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
  return setupBlock(
    createVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      true
    )
  );
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
  if (false) {
    const dirtyInstances = hmrDirtyComponents.get(n2.type);
    if (dirtyInstances && dirtyInstances.has(n1.component)) {
      n1.shapeFlag &= -257;
      n2.shapeFlag &= -513;
      return false;
    }
  }
  return n1.type === n2.type && n1.key === n2.key;
}
let vnodeArgsTransformer;
function transformVNodeArgs(transformer) {
  vnodeArgsTransformer = transformer;
}
const createVNodeWithArgsTransform = (...args) => {
  return _createVNode(
    ...vnodeArgsTransformer ? vnodeArgsTransformer(args, currentRenderingInstance) : args
  );
};
const normalizeKey = ({ key }) => key != null ? key : null;
const normalizeRef = ({
  ref: ref3,
  ref_key,
  ref_for
}) => {
  if (typeof ref3 === "number") {
    ref3 = "" + ref3;
  }
  return ref3 != null ? isString$1(ref3) || isRef$1(ref3) || isFunction(ref3) ? { i: currentRenderingInstance, r: ref3, k: ref_key, f: !!ref_for } : ref3 : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment$1 ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance
  };
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children);
    if (shapeFlag & 128) {
      type.normalize(vnode);
    }
  } else if (children) {
    vnode.shapeFlag |= isString$1(children) ? 8 : 16;
  }
  if (false) {
    warn$1(`VNode created with invalid key (NaN). VNode type:`, vnode.type);
  }
  if (isBlockTreeEnabled > 0 && // avoid a block node from tracking itself
  !isBlockNode && // has current parent block
  currentBlock && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  vnode.patchFlag !== 32) {
    currentBlock.push(vnode);
  }
  return vnode;
}
const createVNode = false ? createVNodeWithArgsTransform : _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    if (false) {
      warn$1(`Invalid vnode type when creating vnode: ${type}.`);
    }
    type = Comment;
  }
  if (isVNode(type)) {
    const cloned = cloneVNode(
      type,
      props,
      true
      /* mergeRef: true */
    );
    if (children) {
      normalizeChildren(cloned, children);
    }
    if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
      if (cloned.shapeFlag & 6) {
        currentBlock[currentBlock.indexOf(type)] = cloned;
      } else {
        currentBlock.push(cloned);
      }
    }
    cloned.patchFlag = -2;
    return cloned;
  }
  if (isClassComponent(type)) {
    type = type.__vccOpts;
  }
  if (props) {
    props = guardReactiveProps(props);
    let { class: klass, style } = props;
    if (klass && !isString$1(klass)) {
      props.class = normalizeClass(klass);
    }
    if (isObject$2(style)) {
      if (isProxy(style) && !isArray$2(style)) {
        style = extend({}, style);
      }
      props.style = normalizeStyle(style);
    }
  }
  const shapeFlag = isString$1(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject$2(type) ? 4 : isFunction(type) ? 2 : 0;
  if (false) {
    type = toRaw$1(type);
    warn$1(
      `Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with \`markRaw\` or using \`shallowRef\` instead of \`ref\`.`,
      `
Component that was made reactive: `,
      type
    );
  }
  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true
  );
}
function guardReactiveProps(props) {
  if (!props) return null;
  return isProxy(props) || isInternalObject(props) ? extend({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
  const { props, ref: ref3, patchFlag, children, transition } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloned = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    ref: extraProps && extraProps.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      mergeRef && ref3 ? isArray$2(ref3) ? ref3.concat(normalizeRef(extraProps)) : [ref3, normalizeRef(extraProps)] : normalizeRef(extraProps)
    ) : ref3,
    scopeId: vnode.scopeId,
    slotScopeIds: vnode.slotScopeIds,
    children: false ? children.map(deepCloneVNode) : children,
    target: vnode.target,
    targetStart: vnode.targetStart,
    targetAnchor: vnode.targetAnchor,
    staticCount: vnode.staticCount,
    shapeFlag: vnode.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: extraProps && vnode.type !== Fragment$1 ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
    dynamicProps: vnode.dynamicProps,
    dynamicChildren: vnode.dynamicChildren,
    appContext: vnode.appContext,
    dirs: vnode.dirs,
    transition,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: vnode.component,
    suspense: vnode.suspense,
    ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
    ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
    placeholder: vnode.placeholder,
    el: vnode.el,
    anchor: vnode.anchor,
    ctx: vnode.ctx,
    ce: vnode.ce
  };
  if (transition && cloneTransition) {
    setTransitionHooks(
      cloned,
      transition.clone(cloned)
    );
  }
  return cloned;
}
function deepCloneVNode(vnode) {
  const cloned = cloneVNode(vnode);
  if (isArray$2(vnode.children)) {
    cloned.children = vnode.children.map(deepCloneVNode);
  }
  return cloned;
}
function createTextVNode(text = " ", flag = 0) {
  return createVNode(Text, null, text, flag);
}
function createStaticVNode(content, numberOfNodes) {
  const vnode = createVNode(Static, null, content);
  vnode.staticCount = numberOfNodes;
  return vnode;
}
function createCommentVNode(text = "", asBlock = false) {
  return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
  if (child == null || typeof child === "boolean") {
    return createVNode(Comment);
  } else if (isArray$2(child)) {
    return createVNode(
      Fragment$1,
      null,
      // #3666, avoid reference pollution when reusing vnode
      child.slice()
    );
  } else if (isVNode(child)) {
    return cloneIfMounted(child);
  } else {
    return createVNode(Text, null, String(child));
  }
}
function cloneIfMounted(child) {
  return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray$2(children)) {
    type = 16;
  } else if (typeof children === "object") {
    if (shapeFlag & (1 | 64)) {
      const slot = children.default;
      if (slot) {
        slot._c && (slot._d = false);
        normalizeChildren(vnode, slot());
        slot._c && (slot._d = true);
      }
      return;
    } else {
      type = 32;
      const slotFlag = children._;
      if (!slotFlag && !isInternalObject(children)) {
        children._ctx = currentRenderingInstance;
      } else if (slotFlag === 3 && currentRenderingInstance) {
        if (currentRenderingInstance.slots._ === 1) {
          children._ = 1;
        } else {
          children._ = 2;
          vnode.patchFlag |= 1024;
        }
      }
    }
  } else if (isFunction(children)) {
    children = { default: children, _ctx: currentRenderingInstance };
    type = 32;
  } else {
    children = String(children);
    if (shapeFlag & 64) {
      type = 16;
      children = [createTextVNode(children)];
    } else {
      type = 8;
    }
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}
function mergeProps(...args) {
  const ret = {};
  for (let i = 0; i < args.length; i++) {
    const toMerge = args[i];
    for (const key in toMerge) {
      if (key === "class") {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === "style") {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (isOn(key)) {
        const existing = ret[key];
        const incoming = toMerge[key];
        if (incoming && existing !== incoming && !(isArray$2(existing) && existing.includes(incoming))) {
          ret[key] = existing ? [].concat(existing, incoming) : incoming;
        } else if (incoming == null && existing == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !isModelListener(key)) {
          ret[key] = incoming;
        }
      } else if (key !== "") {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance, 7, [
    vnode,
    prevVNode
  ]);
}
const emptyAppContext = createAppContext();
let uid = 0;
function createComponentInstance(vnode, parent, suspense) {
  const type = vnode.type;
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const instance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new EffectScope(
      true
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    ids: parent ? parent.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: EMPTY_OBJ,
    // inheritAttrs
    inheritAttrs: type.inheritAttrs,
    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    // suspense related
    suspense,
    suspenseId: suspense ? suspense.pendingId : 0,
    asyncDep: null,
    asyncResolved: false,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  if (false) {
    instance.ctx = createDevRenderContext(instance);
  } else {
    instance.ctx = { _: instance };
  }
  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance);
  if (vnode.ce) {
    vnode.ce(instance);
  }
  return instance;
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance || currentRenderingInstance;
let internalSetCurrentInstance;
let setInSSRSetupState;
{
  const g = getGlobalThis();
  const registerGlobalSetter = (key, setter) => {
    let setters;
    if (!(setters = g[key])) setters = g[key] = [];
    setters.push(setter);
    return (v) => {
      if (setters.length > 1) setters.forEach((set) => set(v));
      else setters[0](v);
    };
  };
  internalSetCurrentInstance = registerGlobalSetter(
    `__VUE_INSTANCE_SETTERS__`,
    (v) => currentInstance = v
  );
  setInSSRSetupState = registerGlobalSetter(
    `__VUE_SSR_SETTERS__`,
    (v) => isInSSRComponentSetup = v
  );
}
const setCurrentInstance = (instance) => {
  const prev = currentInstance;
  internalSetCurrentInstance(instance);
  instance.scope.on();
  return () => {
    instance.scope.off();
    internalSetCurrentInstance(prev);
  };
};
const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off();
  internalSetCurrentInstance(null);
};
const isBuiltInTag = /* @__PURE__ */ makeMap("slot,component");
function validateComponentName(name, { isNativeTag }) {
  if (isBuiltInTag(name) || isNativeTag(name)) {
    warn$1(
      "Do not use built-in or reserved HTML elements as component id: " + name
    );
  }
}
function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & 4;
}
let isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false, optimized = false) {
  isSSR && setInSSRSetupState(isSSR);
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  initProps(instance, props, isStateful, isSSR);
  initSlots(instance, children, optimized || isSSR);
  const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
  isSSR && setInSSRSetupState(false);
  return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
  const Component = instance.type;
  if (false) {
    if (Component.name) {
      validateComponentName(Component.name, instance.appContext.config);
    }
    if (Component.components) {
      const names = Object.keys(Component.components);
      for (let i = 0; i < names.length; i++) {
        validateComponentName(names[i], instance.appContext.config);
      }
    }
    if (Component.directives) {
      const names = Object.keys(Component.directives);
      for (let i = 0; i < names.length; i++) {
        validateDirectiveName(names[i]);
      }
    }
    if (Component.compilerOptions && isRuntimeOnly()) {
      warn$1(
        `"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.`
      );
    }
  }
  instance.accessCache = /* @__PURE__ */ Object.create(null);
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  if (false) {
    exposePropsOnRenderContext(instance);
  }
  const { setup } = Component;
  if (setup) {
    pauseTracking();
    const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
    const reset = setCurrentInstance(instance);
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      0,
      [
        false ? shallowReadonly(instance.props) : instance.props,
        setupContext
      ]
    );
    const isAsyncSetup = isPromise(setupResult);
    resetTracking();
    reset();
    if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) {
      markAsyncBoundary(instance);
    }
    if (isAsyncSetup) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
      if (isSSR) {
        return setupResult.then((resolvedResult) => {
          handleSetupResult(instance, resolvedResult, isSSR);
        }).catch((e) => {
          handleError(e, instance, 0);
        });
      } else {
        instance.asyncDep = setupResult;
        if (false) {
          const name = formatComponentName(instance, Component);
          warn$1(
            `Component <${name}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`
          );
        }
      }
    } else {
      handleSetupResult(instance, setupResult, isSSR);
    }
  } else {
    finishComponentSetup(instance, isSSR);
  }
}
function handleSetupResult(instance, setupResult, isSSR) {
  if (isFunction(setupResult)) {
    if (instance.type.__ssrInlineRender) {
      instance.ssrRender = setupResult;
    } else {
      instance.render = setupResult;
    }
  } else if (isObject$2(setupResult)) {
    if (false) {
      warn$1(
        `setup() should not return VNodes directly - return a render function instead.`
      );
    }
    if (true) {
      instance.devtoolsRawSetupState = setupResult;
    }
    instance.setupState = proxyRefs(setupResult);
    if (false) {
      exposeSetupStateOnRenderContext(instance);
    }
  } else if (false) {
    warn$1(
      `setup() should return an object. Received: ${setupResult === null ? "null" : typeof setupResult}`
    );
  }
  finishComponentSetup(instance, isSSR);
}
let compile$2;
let installWithProxy;
function registerRuntimeCompiler(_compile) {
  compile$2 = _compile;
  installWithProxy = (i) => {
    if (i.render._rc) {
      i.withProxy = new Proxy(i.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
    }
  };
}
const isRuntimeOnly = () => !compile$2;
function finishComponentSetup(instance, isSSR, skipOptions) {
  const Component = instance.type;
  if (!instance.render) {
    if (!isSSR && compile$2 && !Component.render) {
      const template = Component.template || resolveMergedOptions$1(instance).template;
      if (template) {
        if (false) {
          startMeasure(instance, `compile`);
        }
        const { isCustomElement, compilerOptions } = instance.appContext.config;
        const { delimiters, compilerOptions: componentCompilerOptions } = Component;
        const finalCompilerOptions = extend(
          extend(
            {
              isCustomElement,
              delimiters
            },
            compilerOptions
          ),
          componentCompilerOptions
        );
        Component.render = compile$2(template, finalCompilerOptions);
        if (false) {
          endMeasure(instance, `compile`);
        }
      }
    }
    instance.render = Component.render || NOOP$1;
    if (installWithProxy) {
      installWithProxy(instance);
    }
  }
  if (true) {
    const reset = setCurrentInstance(instance);
    pauseTracking();
    try {
      applyOptions(instance);
    } finally {
      resetTracking();
      reset();
    }
  }
  if (false) {
    if (!compile$2 && Component.template) {
      warn$1(
        `Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".`
      );
    } else {
      warn$1(`Component is missing template or render function: `, Component);
    }
  }
}
const attrsProxyHandlers = false ? {
  get(target, key) {
    markAttrsAccessed();
    track(target, "get", "");
    return target[key];
  },
  set() {
    warn$1(`setupContext.attrs is readonly.`);
    return false;
  },
  deleteProperty() {
    warn$1(`setupContext.attrs is readonly.`);
    return false;
  }
} : {
  get(target, key) {
    track(target, "get", "");
    return target[key];
  }
};
function getSlotsProxy(instance) {
  return new Proxy(instance.slots, {
    get(target, key) {
      track(instance, "get", "$slots");
      return target[key];
    }
  });
}
function createSetupContext(instance) {
  const expose = (exposed) => {
    if (false) {
      if (instance.exposed) {
        warn$1(`expose() should be called only once per setup().`);
      }
      if (exposed != null) {
        let exposedType = typeof exposed;
        if (exposedType === "object") {
          if (isArray$2(exposed)) {
            exposedType = "array";
          } else if (isRef$1(exposed)) {
            exposedType = "ref";
          }
        }
        if (exposedType !== "object") {
          warn$1(
            `expose() should be passed a plain object, received ${exposedType}.`
          );
        }
      }
    }
    instance.exposed = exposed || {};
  };
  if (false) {
    let attrsProxy;
    let slotsProxy;
    return Object.freeze({
      get attrs() {
        return attrsProxy || (attrsProxy = new Proxy(instance.attrs, attrsProxyHandlers));
      },
      get slots() {
        return slotsProxy || (slotsProxy = getSlotsProxy(instance));
      },
      get emit() {
        return (event, ...args) => instance.emit(event, ...args);
      },
      expose
    });
  } else {
    return {
      attrs: new Proxy(instance.attrs, attrsProxyHandlers),
      slots: instance.slots,
      emit: instance.emit,
      expose
    };
  }
}
function getComponentPublicInstance(instance) {
  if (instance.exposed) {
    return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
      get(target, key) {
        if (key in target) {
          return target[key];
        } else if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance);
        }
      },
      has(target, key) {
        return key in target || key in publicPropertiesMap;
      }
    }));
  } else {
    return instance.proxy;
  }
}
const classifyRE$1 = /(?:^|[-_])\w/g;
const classify$1 = (str) => str.replace(classifyRE$1, (c) => c.toUpperCase()).replace(/[-_]/g, "");
function getComponentName$1(Component, includeInferred = true) {
  return isFunction(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
}
function formatComponentName(instance, Component, isRoot = false) {
  let name = getComponentName$1(Component);
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.\w+$/);
    if (match) {
      name = match[1];
    }
  }
  if (!name && instance) {
    const inferFromRegistry = (registry) => {
      for (const key in registry) {
        if (registry[key] === Component) {
          return key;
        }
      }
    };
    name = inferFromRegistry(instance.components) || instance.parent && inferFromRegistry(
      instance.parent.type.components
    ) || inferFromRegistry(instance.appContext.components);
  }
  return name ? classify$1(name) : isRoot ? `App` : `Anonymous`;
}
function isClassComponent(value) {
  return isFunction(value) && "__vccOpts" in value;
}
const computed = (getterOrOptions, debugOptions) => {
  const c = computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
  if (false) {
    const i = getCurrentInstance();
    if (i && i.appContext.config.warnRecursiveComputed) {
      c._warnRecursive = true;
    }
  }
  return c;
};
function h(type, propsOrChildren, children) {
  try {
    setBlockTracking(-1);
    const l = arguments.length;
    if (l === 2) {
      if (isObject$2(propsOrChildren) && !isArray$2(propsOrChildren)) {
        if (isVNode(propsOrChildren)) {
          return createVNode(type, null, [propsOrChildren]);
        }
        return createVNode(type, propsOrChildren);
      } else {
        return createVNode(type, null, propsOrChildren);
      }
    } else {
      if (l > 3) {
        children = Array.prototype.slice.call(arguments, 2);
      } else if (l === 3 && isVNode(children)) {
        children = [children];
      }
      return createVNode(type, propsOrChildren, children);
    }
  } finally {
    setBlockTracking(1);
  }
}
function initCustomFormatter() {
  if (true) {
    return;
  }
  const vueStyle = { style: "color:#3ba776" };
  const numberStyle = { style: "color:#1677ff" };
  const stringStyle = { style: "color:#f5222d" };
  const keywordStyle = { style: "color:#eb2f96" };
  const formatter = {
    __vue_custom_formatter: true,
    header(obj) {
      if (!isObject$2(obj)) {
        return null;
      }
      if (obj.__isVue) {
        return ["div", vueStyle, `VueInstance`];
      } else if (isRef$1(obj)) {
        pauseTracking();
        const value = obj.value;
        resetTracking();
        return [
          "div",
          {},
          ["span", vueStyle, genRefFlag(obj)],
          "<",
          formatValue(value),
          `>`
        ];
      } else if (isReactive$1(obj)) {
        return [
          "div",
          {},
          ["span", vueStyle, isShallow(obj) ? "ShallowReactive" : "Reactive"],
          "<",
          formatValue(obj),
          `>${isReadonly$1(obj) ? ` (readonly)` : ``}`
        ];
      } else if (isReadonly$1(obj)) {
        return [
          "div",
          {},
          ["span", vueStyle, isShallow(obj) ? "ShallowReadonly" : "Readonly"],
          "<",
          formatValue(obj),
          ">"
        ];
      }
      return null;
    },
    hasBody(obj) {
      return obj && obj.__isVue;
    },
    body(obj) {
      if (obj && obj.__isVue) {
        return [
          "div",
          {},
          ...formatInstance(obj.$)
        ];
      }
    }
  };
  function formatInstance(instance) {
    const blocks = [];
    if (instance.type.props && instance.props) {
      blocks.push(createInstanceBlock("props", toRaw$1(instance.props)));
    }
    if (instance.setupState !== EMPTY_OBJ) {
      blocks.push(createInstanceBlock("setup", instance.setupState));
    }
    if (instance.data !== EMPTY_OBJ) {
      blocks.push(createInstanceBlock("data", toRaw$1(instance.data)));
    }
    const computed2 = extractKeys(instance, "computed");
    if (computed2) {
      blocks.push(createInstanceBlock("computed", computed2));
    }
    const injected = extractKeys(instance, "inject");
    if (injected) {
      blocks.push(createInstanceBlock("injected", injected));
    }
    blocks.push([
      "div",
      {},
      [
        "span",
        {
          style: keywordStyle.style + ";opacity:0.66"
        },
        "$ (internal): "
      ],
      ["object", { object: instance }]
    ]);
    return blocks;
  }
  function createInstanceBlock(type, target) {
    target = extend({}, target);
    if (!Object.keys(target).length) {
      return ["span", {}];
    }
    return [
      "div",
      { style: "line-height:1.25em;margin-bottom:0.6em" },
      [
        "div",
        {
          style: "color:#476582"
        },
        type
      ],
      [
        "div",
        {
          style: "padding-left:1.25em"
        },
        ...Object.keys(target).map((key) => {
          return [
            "div",
            {},
            ["span", keywordStyle, key + ": "],
            formatValue(target[key], false)
          ];
        })
      ]
    ];
  }
  function formatValue(v, asRaw = true) {
    if (typeof v === "number") {
      return ["span", numberStyle, v];
    } else if (typeof v === "string") {
      return ["span", stringStyle, JSON.stringify(v)];
    } else if (typeof v === "boolean") {
      return ["span", keywordStyle, v];
    } else if (isObject$2(v)) {
      return ["object", { object: asRaw ? toRaw$1(v) : v }];
    } else {
      return ["span", stringStyle, String(v)];
    }
  }
  function extractKeys(instance, type) {
    const Comp = instance.type;
    if (isFunction(Comp)) {
      return;
    }
    const extracted = {};
    for (const key in instance.ctx) {
      if (isKeyOfType(Comp, key, type)) {
        extracted[key] = instance.ctx[key];
      }
    }
    return extracted;
  }
  function isKeyOfType(Comp, key, type) {
    const opts = Comp[type];
    if (isArray$2(opts) && opts.includes(key) || isObject$2(opts) && key in opts) {
      return true;
    }
    if (Comp.extends && isKeyOfType(Comp.extends, key, type)) {
      return true;
    }
    if (Comp.mixins && Comp.mixins.some((m) => isKeyOfType(m, key, type))) {
      return true;
    }
  }
  function genRefFlag(v) {
    if (isShallow(v)) {
      return `ShallowRef`;
    }
    if (v.effect) {
      return `ComputedRef`;
    }
    return `Ref`;
  }
  if (window.devtoolsFormatters) {
    window.devtoolsFormatters.push(formatter);
  } else {
    window.devtoolsFormatters = [formatter];
  }
}
function withMemo(memo, render, cache, index) {
  const cached = cache[index];
  if (cached && isMemoSame(cached, memo)) {
    return cached;
  }
  const ret = render();
  ret.memo = memo.slice();
  ret.cacheIndex = index;
  return cache[index] = ret;
}
function isMemoSame(cached, memo) {
  const prev = cached.memo;
  if (prev.length != memo.length) {
    return false;
  }
  for (let i = 0; i < prev.length; i++) {
    if (hasChanged(prev[i], memo[i])) {
      return false;
    }
  }
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(cached);
  }
  return true;
}
const version = "3.5.32";
const warn = false ? warn$1 : NOOP$1;
const ErrorTypeStrings = ErrorTypeStrings$1;
const devtools$2 = true ? devtools$1 : void 0;
const setDevtoolsHook = true ? setDevtoolsHook$1 : NOOP$1;
const _ssrUtils = {
  createComponentInstance,
  setupComponent,
  renderComponentRoot,
  setCurrentRenderingInstance,
  isVNode,
  normalizeVNode,
  getComponentPublicInstance,
  ensureValidVNode,
  pushWarningContext,
  popWarningContext
};
const ssrUtils = _ssrUtils;
const resolveFilter = null;
const compatUtils = null;
const DeprecationTypes = null;

/**
* @vue/runtime-dom v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let policy = void 0;
const tt = typeof window !== "undefined" && window.trustedTypes;
if (tt) {
  try {
    policy = /* @__PURE__ */ tt.createPolicy("vue", {
      createHTML: (val) => val
    });
  } catch (e) {
  }
}
const unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
const svgNS = "http://www.w3.org/2000/svg";
const mathmlNS = "http://www.w3.org/1998/Math/MathML";
const doc = typeof document !== "undefined" ? document : null;
const templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag, namespace, is, props) => {
    const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, { is }) : doc.createElement(tag);
    if (tag === "select" && props && props.multiple != null) {
      el.setAttribute("multiple", props.multiple);
    }
    return el;
  },
  createText: (text) => doc.createTextNode(text),
  createComment: (text) => doc.createComment(text),
  setText: (node, text) => {
    node.nodeValue = text;
  },
  setElementText: (el, text) => {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
  querySelector: (selector) => doc.querySelector(selector),
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, namespace, start, end) {
    const before = anchor ? anchor.previousSibling : parent.lastChild;
    if (start && (start === end || start.nextSibling)) {
      while (true) {
        parent.insertBefore(start.cloneNode(true), anchor);
        if (start === end || !(start = start.nextSibling)) break;
      }
    } else {
      templateContainer.innerHTML = unsafeToTrustedHTML(
        namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content
      );
      const template = templateContainer.content;
      if (namespace === "svg" || namespace === "mathml") {
        const wrapper = template.firstChild;
        while (wrapper.firstChild) {
          template.appendChild(wrapper.firstChild);
        }
        template.removeChild(wrapper);
      }
      parent.insertBefore(template, anchor);
    }
    return [
      // first
      before ? before.nextSibling : parent.firstChild,
      // last
      anchor ? anchor.previousSibling : parent.lastChild
    ];
  }
};
const TRANSITION$1 = "transition";
const ANIMATION = "animation";
const vtcKey = /* @__PURE__ */ Symbol("_vtc");
const DOMTransitionPropsValidators = {
  name: String,
  type: String,
  css: {
    type: Boolean,
    default: true
  },
  duration: [String, Number, Object],
  enterFromClass: String,
  enterActiveClass: String,
  enterToClass: String,
  appearFromClass: String,
  appearActiveClass: String,
  appearToClass: String,
  leaveFromClass: String,
  leaveActiveClass: String,
  leaveToClass: String
};
const TransitionPropsValidators = /* @__PURE__ */ extend(
  {},
  BaseTransitionPropsValidators,
  DOMTransitionPropsValidators
);
const decorate$1 = (t) => {
  t.displayName = "Transition";
  t.props = TransitionPropsValidators;
  return t;
};
const Transition = /* @__PURE__ */ decorate$1(
  (props, { slots }) => h(BaseTransition, resolveTransitionProps(props), slots)
);
const callHook = (hook, args = []) => {
  if (isArray$2(hook)) {
    hook.forEach((h2) => h2(...args));
  } else if (hook) {
    hook(...args);
  }
};
const hasExplicitCallback = (hook) => {
  return hook ? isArray$2(hook) ? hook.some((h2) => h2.length > 1) : hook.length > 1 : false;
};
function resolveTransitionProps(rawProps) {
  const baseProps = {};
  for (const key in rawProps) {
    if (!(key in DOMTransitionPropsValidators)) {
      baseProps[key] = rawProps[key];
    }
  }
  if (rawProps.css === false) {
    return baseProps;
  }
  const {
    name = "v",
    type,
    duration,
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    appearFromClass = enterFromClass,
    appearActiveClass = enterActiveClass,
    appearToClass = enterToClass,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`
  } = rawProps;
  const durations = normalizeDuration(duration);
  const enterDuration = durations && durations[0];
  const leaveDuration = durations && durations[1];
  const {
    onBeforeEnter,
    onEnter,
    onEnterCancelled,
    onLeave,
    onLeaveCancelled,
    onBeforeAppear = onBeforeEnter,
    onAppear = onEnter,
    onAppearCancelled = onEnterCancelled
  } = baseProps;
  const finishEnter = (el, isAppear, done, isCancelled) => {
    el._enterCancelled = isCancelled;
    removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
    removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
    done && done();
  };
  const finishLeave = (el, done) => {
    el._isLeaving = false;
    removeTransitionClass(el, leaveFromClass);
    removeTransitionClass(el, leaveToClass);
    removeTransitionClass(el, leaveActiveClass);
    done && done();
  };
  const makeEnterHook = (isAppear) => {
    return (el, done) => {
      const hook = isAppear ? onAppear : onEnter;
      const resolve = () => finishEnter(el, isAppear, done);
      callHook(hook, [el, resolve]);
      nextFrame(() => {
        removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
        addTransitionClass(el, isAppear ? appearToClass : enterToClass);
        if (!hasExplicitCallback(hook)) {
          whenTransitionEnds(el, type, enterDuration, resolve);
        }
      });
    };
  };
  return extend(baseProps, {
    onBeforeEnter(el) {
      callHook(onBeforeEnter, [el]);
      addTransitionClass(el, enterFromClass);
      addTransitionClass(el, enterActiveClass);
    },
    onBeforeAppear(el) {
      callHook(onBeforeAppear, [el]);
      addTransitionClass(el, appearFromClass);
      addTransitionClass(el, appearActiveClass);
    },
    onEnter: makeEnterHook(false),
    onAppear: makeEnterHook(true),
    onLeave(el, done) {
      el._isLeaving = true;
      const resolve = () => finishLeave(el, done);
      addTransitionClass(el, leaveFromClass);
      if (!el._enterCancelled) {
        forceReflow(el);
        addTransitionClass(el, leaveActiveClass);
      } else {
        addTransitionClass(el, leaveActiveClass);
        forceReflow(el);
      }
      nextFrame(() => {
        if (!el._isLeaving) {
          return;
        }
        removeTransitionClass(el, leaveFromClass);
        addTransitionClass(el, leaveToClass);
        if (!hasExplicitCallback(onLeave)) {
          whenTransitionEnds(el, type, leaveDuration, resolve);
        }
      });
      callHook(onLeave, [el, resolve]);
    },
    onEnterCancelled(el) {
      finishEnter(el, false, void 0, true);
      callHook(onEnterCancelled, [el]);
    },
    onAppearCancelled(el) {
      finishEnter(el, true, void 0, true);
      callHook(onAppearCancelled, [el]);
    },
    onLeaveCancelled(el) {
      finishLeave(el);
      callHook(onLeaveCancelled, [el]);
    }
  });
}
function normalizeDuration(duration) {
  if (duration == null) {
    return null;
  } else if (isObject$2(duration)) {
    return [NumberOf(duration.enter), NumberOf(duration.leave)];
  } else {
    const n = NumberOf(duration);
    return [n, n];
  }
}
function NumberOf(val) {
  const res = toNumber(val);
  if (false) {
    assertNumber(res, "<transition> explicit duration");
  }
  return res;
}
function addTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.add(c));
  (el[vtcKey] || (el[vtcKey] = /* @__PURE__ */ new Set())).add(cls);
}
function removeTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.remove(c));
  const _vtc = el[vtcKey];
  if (_vtc) {
    _vtc.delete(cls);
    if (!_vtc.size) {
      el[vtcKey] = void 0;
    }
  }
}
function nextFrame(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}
let endId = 0;
function whenTransitionEnds(el, expectedType, explicitTimeout, resolve) {
  const id = el._endId = ++endId;
  const resolveIfNotStale = () => {
    if (id === el._endId) {
      resolve();
    }
  };
  if (explicitTimeout != null) {
    return setTimeout(resolveIfNotStale, explicitTimeout);
  }
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
  if (!type) {
    return resolve();
  }
  const endEvent = type + "end";
  let ended = 0;
  const end = () => {
    el.removeEventListener(endEvent, onEnd);
    resolveIfNotStale();
  };
  const onEnd = (e) => {
    if (e.target === el && ++ended >= propCount) {
      end();
    }
  };
  setTimeout(() => {
    if (ended < propCount) {
      end();
    }
  }, timeout + 1);
  el.addEventListener(endEvent, onEnd);
}
function getTransitionInfo(el, expectedType) {
  const styles = window.getComputedStyle(el);
  const getStyleProperties = (key) => (styles[key] || "").split(", ");
  const transitionDelays = getStyleProperties(`${TRANSITION$1}Delay`);
  const transitionDurations = getStyleProperties(`${TRANSITION$1}Duration`);
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = getStyleProperties(`${ANIMATION}Delay`);
  const animationDurations = getStyleProperties(`${ANIMATION}Duration`);
  const animationTimeout = getTimeout(animationDelays, animationDurations);
  let type = null;
  let timeout = 0;
  let propCount = 0;
  if (expectedType === TRANSITION$1) {
    if (transitionTimeout > 0) {
      type = TRANSITION$1;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0 ? transitionTimeout > animationTimeout ? TRANSITION$1 : ANIMATION : null;
    propCount = type ? type === TRANSITION$1 ? transitionDurations.length : animationDurations.length : 0;
  }
  const hasTransform = type === TRANSITION$1 && /\b(?:transform|all)(?:,|$)/.test(
    getStyleProperties(`${TRANSITION$1}Property`).toString()
  );
  return {
    type,
    timeout,
    propCount,
    hasTransform
  };
}
function getTimeout(delays, durations) {
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }
  return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
}
function toMs(s) {
  if (s === "auto") return 0;
  return Number(s.slice(0, -1).replace(",", ".")) * 1e3;
}
function forceReflow(el) {
  const targetDocument = el ? el.ownerDocument : document;
  return targetDocument.body.offsetHeight;
}
function patchClass(el, value, isSVG) {
  const transitionClasses = el[vtcKey];
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
  }
  if (value == null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
}
const vShowOriginalDisplay = /* @__PURE__ */ Symbol("_vod");
const vShowHidden = /* @__PURE__ */ Symbol("_vsh");
const vShow = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(el, { value }, { transition }) {
    el[vShowOriginalDisplay] = el.style.display === "none" ? "" : el.style.display;
    if (transition && value) {
      transition.beforeEnter(el);
    } else {
      setDisplay(el, value);
    }
  },
  mounted(el, { value }, { transition }) {
    if (transition && value) {
      transition.enter(el);
    }
  },
  updated(el, { value, oldValue }, { transition }) {
    if (!value === !oldValue) return;
    if (transition) {
      if (value) {
        transition.beforeEnter(el);
        setDisplay(el, true);
        transition.enter(el);
      } else {
        transition.leave(el, () => {
          setDisplay(el, false);
        });
      }
    } else {
      setDisplay(el, value);
    }
  },
  beforeUnmount(el, { value }) {
    setDisplay(el, value);
  }
};
function setDisplay(el, value) {
  el.style.display = value ? el[vShowOriginalDisplay] : "none";
  el[vShowHidden] = !value;
}
function initVShowForSSR() {
  vShow.getSSRProps = ({ value }) => {
    if (!value) {
      return { style: { display: "none" } };
    }
  };
}
const CSS_VAR_TEXT = /* @__PURE__ */ Symbol(false ? "CSS_VAR_TEXT" : "");
function useCssVars(getter) {
  const instance = getCurrentInstance();
  if (!instance) {
    return;
  }
  const updateTeleports = instance.ut = (vars = getter(instance.proxy)) => {
    Array.from(
      document.querySelectorAll(`[data-v-owner="${instance.uid}"]`)
    ).forEach((node) => setVarsOnNode(node, vars));
  };
  if (false) {
    instance.getCssVars = () => getter(instance.proxy);
  }
  const setVars = () => {
    const vars = getter(instance.proxy);
    if (instance.ce) {
      setVarsOnNode(instance.ce, vars);
    } else {
      setVarsOnVNode(instance.subTree, vars);
    }
    updateTeleports(vars);
  };
  onBeforeUpdate(() => {
    queuePostFlushCb(setVars);
  });
  onMounted(() => {
    watch(setVars, NOOP$1, { flush: "post" });
    const ob = new MutationObserver(setVars);
    ob.observe(instance.subTree.el.parentNode, { childList: true });
    onUnmounted(() => ob.disconnect());
  });
}
function setVarsOnVNode(vnode, vars) {
  if (vnode.shapeFlag & 128) {
    const suspense = vnode.suspense;
    vnode = suspense.activeBranch;
    if (suspense.pendingBranch && !suspense.isHydrating) {
      suspense.effects.push(() => {
        setVarsOnVNode(suspense.activeBranch, vars);
      });
    }
  }
  while (vnode.component) {
    vnode = vnode.component.subTree;
  }
  if (vnode.shapeFlag & 1 && vnode.el) {
    setVarsOnNode(vnode.el, vars);
  } else if (vnode.type === Fragment$1) {
    vnode.children.forEach((c) => setVarsOnVNode(c, vars));
  } else if (vnode.type === Static) {
    let { el, anchor } = vnode;
    while (el) {
      setVarsOnNode(el, vars);
      if (el === anchor) break;
      el = el.nextSibling;
    }
  }
}
function setVarsOnNode(el, vars) {
  if (el.nodeType === 1) {
    const style = el.style;
    let cssText = "";
    for (const key in vars) {
      const value = normalizeCssVarValue(vars[key]);
      style.setProperty(`--${key}`, value);
      cssText += `--${key}: ${value};`;
    }
    style[CSS_VAR_TEXT] = cssText;
  }
}
const displayRE = /(?:^|;)\s*display\s*:/;
function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString$1(next);
  let hasControlledDisplay = false;
  if (next && !isCssString) {
    if (prev) {
      if (!isString$1(prev)) {
        for (const key in prev) {
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      } else {
        for (const prevStyle of prev.split(";")) {
          const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      }
    }
    for (const key in next) {
      if (key === "display") {
        hasControlledDisplay = true;
      }
      setStyle(style, key, next[key]);
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
        const cssVarText = style[CSS_VAR_TEXT];
        if (cssVarText) {
          next += ";" + cssVarText;
        }
        style.cssText = next;
        hasControlledDisplay = displayRE.test(next);
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
  }
  if (vShowOriginalDisplay in el) {
    el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
    if (el[vShowHidden]) {
      style.display = "none";
    }
  }
}
const semicolonRE = /[^\\];\s*$/;
const importantRE = /\s*!important$/;
function setStyle(style, name, val) {
  if (isArray$2(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    if (val == null) val = "";
    if (false) {
      if (semicolonRE.test(val)) {
        warn(
          `Unexpected semicolon at the end of '${name}' style value: '${val}'`
        );
      }
    }
    if (name.startsWith("--")) {
      style.setProperty(name, val);
    } else {
      const prefixed = autoPrefix(style, name);
      if (importantRE.test(val)) {
        style.setProperty(
          hyphenate(prefixed),
          val.replace(importantRE, ""),
          "important"
        );
      } else {
        style[prefixed] = val;
      }
    }
  }
}
const prefixes = ["Webkit", "Moz", "ms"];
const prefixCache = {};
function autoPrefix(style, rawName) {
  const cached = prefixCache[rawName];
  if (cached) {
    return cached;
  }
  let name = camelize$1(rawName);
  if (name !== "filter" && name in style) {
    return prefixCache[rawName] = name;
  }
  name = capitalize(name);
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name;
    if (prefixed in style) {
      return prefixCache[rawName] = prefixed;
    }
  }
  return rawName;
}
const xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
  if (isSVG && key.startsWith("xlink:")) {
    if (value == null) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    if (value == null || isBoolean && !includeBooleanAttr(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(
        key,
        isBoolean ? "" : isSymbol$1(value) ? String(value) : value
      );
    }
  }
}
function patchDOMProp(el, key, value, parentComponent, attrName) {
  if (key === "innerHTML" || key === "textContent") {
    if (value != null) {
      el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
    }
    return;
  }
  const tag = el.tagName;
  if (key === "value" && tag !== "PROGRESS" && // custom elements may use _value internally
  !tag.includes("-")) {
    const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
    const newValue = value == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      el.type === "checkbox" ? "on" : ""
    ) : String(value);
    if (oldValue !== newValue || !("_value" in el)) {
      el.value = newValue;
    }
    if (value == null) {
      el.removeAttribute(key);
    }
    el._value = value;
    return;
  }
  let needRemove = false;
  if (value === "" || value == null) {
    const type = typeof el[key];
    if (type === "boolean") {
      value = includeBooleanAttr(value);
    } else if (value == null && type === "string") {
      value = "";
      needRemove = true;
    } else if (type === "number") {
      value = 0;
      needRemove = true;
    }
  }
  try {
    el[key] = value;
  } catch (e) {
    if (false) {
      warn(
        `Failed setting prop "${key}" on <${tag.toLowerCase()}>: value ${value} is invalid.`,
        e
      );
    }
  }
  needRemove && el.removeAttribute(attrName || key);
}
function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options);
}
const veiKey = /* @__PURE__ */ Symbol("_vei");
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
  const invokers = el[veiKey] || (el[veiKey] = {});
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {
    existingInvoker.value = false ? sanitizeEventValue(nextValue, rawName) : nextValue;
  } else {
    const [name, options] = parseName(rawName);
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(
        false ? sanitizeEventValue(nextValue, rawName) : nextValue,
        instance
      );
      addEventListener(el, name, invoker, options);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker, options);
      invokers[rawName] = void 0;
    }
  }
}
const optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
  let options;
  if (optionsModifierRE.test(name)) {
    options = {};
    let m;
    while (m = name.match(optionsModifierRE)) {
      name = name.slice(0, name.length - m[0].length);
      options[m[0].toLowerCase()] = true;
    }
  }
  const event = name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2));
  return [event, options];
}
let cachedNow = 0;
const p = /* @__PURE__ */ Promise.resolve();
const getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance) {
  const invoker = (e) => {
    if (!e._vts) {
      e._vts = Date.now();
    } else if (e._vts <= invoker.attached) {
      return;
    }
    callWithAsyncErrorHandling(
      patchStopImmediatePropagation(e, invoker.value),
      instance,
      5,
      [e]
    );
  };
  invoker.value = initialValue;
  invoker.attached = getNow();
  return invoker;
}
function sanitizeEventValue(value, propName) {
  if (isFunction(value) || isArray$2(value)) {
    return value;
  }
  warn(
    `Wrong type passed as event handler to ${propName} - did you forget @ or : in front of your prop?
Expected function or array of functions, received type ${typeof value}.`
  );
  return NOOP$1;
}
function patchStopImmediatePropagation(e, value) {
  if (isArray$2(value)) {
    const originalStop = e.stopImmediatePropagation;
    e.stopImmediatePropagation = () => {
      originalStop.call(e);
      e._stopped = true;
    };
    return value.map(
      (fn) => (e2) => !e2._stopped && fn && fn(e2)
    );
  } else {
    return value;
  }
}
const isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // lowercase letter
key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
const patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
  const isSVG = namespace === "svg";
  if (key === "class") {
    patchClass(el, nextValue, isSVG);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent);
    }
  } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
    patchDOMProp(el, key, nextValue);
    if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) {
      patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
    }
  } else if (
    // #11081 force set props for possible async custom element
    el._isVueCE && // #12408 check if it's declared prop or it's async custom element
    (shouldSetAsPropForVueCE(el, key) || // @ts-expect-error _def is private
    el._def.__asyncLoader && (/[A-Z]/.test(key) || !isString$1(nextValue)))
  ) {
    patchDOMProp(el, camelize$1(key), nextValue, parentComponent, key);
  } else {
    if (key === "true-value") {
      el._trueValue = nextValue;
    } else if (key === "false-value") {
      el._falseValue = nextValue;
    }
    patchAttr(el, key, nextValue, isSVG);
  }
};
function shouldSetAsProp(el, key, value, isSVG) {
  if (isSVG) {
    if (key === "innerHTML" || key === "textContent") {
      return true;
    }
    if (key in el && isNativeOn(key) && isFunction(value)) {
      return true;
    }
    return false;
  }
  if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") {
    return false;
  }
  if (key === "sandbox" && el.tagName === "IFRAME") {
    return false;
  }
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  if (key === "width" || key === "height") {
    const tag = el.tagName;
    if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") {
      return false;
    }
  }
  if (isNativeOn(key) && isString$1(value)) {
    return false;
  }
  return key in el;
}
function shouldSetAsPropForVueCE(el, key) {
  const props = (
    // @ts-expect-error _def is private
    el._def.props
  );
  if (!props) {
    return false;
  }
  const camelKey = camelize$1(key);
  return Array.isArray(props) ? props.some((prop) => camelize$1(prop) === camelKey) : Object.keys(props).some((prop) => camelize$1(prop) === camelKey);
}
const REMOVAL = {};
// @__NO_SIDE_EFFECTS__
function defineCustomElement(options, extraOptions, _createApp) {
  let Comp = defineComponent(options, extraOptions);
  if (isPlainObject$2(Comp)) Comp = extend({}, Comp, extraOptions);
  class VueCustomElement extends VueElement {
    constructor(initialProps) {
      super(Comp, initialProps, _createApp);
    }
  }
  VueCustomElement.def = Comp;
  return VueCustomElement;
}
const defineSSRCustomElement = (/* @__NO_SIDE_EFFECTS__ */ (options, extraOptions) => {
  return /* @__PURE__ */ defineCustomElement(options, extraOptions, createSSRApp);
});
const BaseClass = typeof HTMLElement !== "undefined" ? HTMLElement : class {
};
class VueElement extends BaseClass {
  constructor(_def, _props = {}, _createApp = createApp) {
    super();
    this._def = _def;
    this._props = _props;
    this._createApp = _createApp;
    this._isVueCE = true;
    this._instance = null;
    this._app = null;
    this._nonce = this._def.nonce;
    this._connected = false;
    this._resolved = false;
    this._patching = false;
    this._dirty = false;
    this._numberProps = null;
    this._styleChildren = /* @__PURE__ */ new WeakSet();
    this._styleAnchors = /* @__PURE__ */ new WeakMap();
    this._ob = null;
    if (this.shadowRoot && _createApp !== createApp) {
      this._root = this.shadowRoot;
    } else {
      if (false) {
        warn(
          `Custom element has pre-rendered declarative shadow root but is not defined as hydratable. Use \`defineSSRCustomElement\`.`
        );
      }
      if (_def.shadowRoot !== false) {
        this.attachShadow(
          extend({}, _def.shadowRootOptions, {
            mode: "open"
          })
        );
        this._root = this.shadowRoot;
      } else {
        this._root = this;
      }
    }
  }
  connectedCallback() {
    if (!this.isConnected) return;
    if (!this.shadowRoot && !this._resolved) {
      this._parseSlots();
    }
    this._connected = true;
    let parent = this;
    while (parent = parent && // #12479 should check assignedSlot first to get correct parent
    (parent.assignedSlot || parent.parentNode || parent.host)) {
      if (parent instanceof VueElement) {
        this._parent = parent;
        break;
      }
    }
    if (!this._instance) {
      if (this._resolved) {
        this._mount(this._def);
      } else {
        if (parent && parent._pendingResolve) {
          this._pendingResolve = parent._pendingResolve.then(() => {
            this._pendingResolve = void 0;
            this._resolveDef();
          });
        } else {
          this._resolveDef();
        }
      }
    }
  }
  _setParent(parent = this._parent) {
    if (parent) {
      this._instance.parent = parent._instance;
      this._inheritParentContext(parent);
    }
  }
  _inheritParentContext(parent = this._parent) {
    if (parent && this._app) {
      Object.setPrototypeOf(
        this._app._context.provides,
        parent._instance.provides
      );
    }
  }
  disconnectedCallback() {
    this._connected = false;
    nextTick(() => {
      if (!this._connected) {
        if (this._ob) {
          this._ob.disconnect();
          this._ob = null;
        }
        this._app && this._app.unmount();
        if (this._instance) this._instance.ce = void 0;
        this._app = this._instance = null;
        if (this._teleportTargets) {
          this._teleportTargets.clear();
          this._teleportTargets = void 0;
        }
      }
    });
  }
  _processMutations(mutations) {
    for (const m of mutations) {
      this._setAttr(m.attributeName);
    }
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve) {
      return;
    }
    for (let i = 0; i < this.attributes.length; i++) {
      this._setAttr(this.attributes[i].name);
    }
    this._ob = new MutationObserver(this._processMutations.bind(this));
    this._ob.observe(this, { attributes: true });
    const resolve = (def, isAsync = false) => {
      this._resolved = true;
      this._pendingResolve = void 0;
      const { props, styles } = def;
      let numberProps;
      if (props && !isArray$2(props)) {
        for (const key in props) {
          const opt = props[key];
          if (opt === Number || opt && opt.type === Number) {
            if (key in this._props) {
              this._props[key] = toNumber(this._props[key]);
            }
            (numberProps || (numberProps = /* @__PURE__ */ Object.create(null)))[camelize$1(key)] = true;
          }
        }
      }
      this._numberProps = numberProps;
      this._resolveProps(def);
      if (this.shadowRoot) {
        this._applyStyles(styles);
      } else if (false) {
        warn(
          "Custom element style injection is not supported when using shadowRoot: false"
        );
      }
      this._mount(def);
    };
    const asyncDef = this._def.__asyncLoader;
    if (asyncDef) {
      this._pendingResolve = asyncDef().then((def) => {
        def.configureApp = this._def.configureApp;
        resolve(this._def = def, true);
      });
    } else {
      resolve(this._def);
    }
  }
  _mount(def) {
    if (!def.name) {
      def.name = "VueElement";
    }
    this._app = this._createApp(def);
    this._inheritParentContext();
    if (def.configureApp) {
      def.configureApp(this._app);
    }
    this._app._ceVNode = this._createVNode();
    this._app.mount(this._root);
    const exposed = this._instance && this._instance.exposed;
    if (!exposed) return;
    for (const key in exposed) {
      if (!hasOwn(this, key)) {
        Object.defineProperty(this, key, {
          // unwrap ref to be consistent with public instance behavior
          get: () => unref(exposed[key])
        });
      } else if (false) {
        warn(`Exposed property "${key}" already exists on custom element.`);
      }
    }
  }
  _resolveProps(def) {
    const { props } = def;
    const declaredPropKeys = isArray$2(props) ? props : Object.keys(props || {});
    for (const key of Object.keys(this)) {
      if (key[0] !== "_" && declaredPropKeys.includes(key)) {
        this._setProp(key, this[key]);
      }
    }
    for (const key of declaredPropKeys.map(camelize$1)) {
      Object.defineProperty(this, key, {
        get() {
          return this._getProp(key);
        },
        set(val) {
          this._setProp(key, val, true, !this._patching);
        }
      });
    }
  }
  _setAttr(key) {
    if (key.startsWith("data-v-")) return;
    const has = this.hasAttribute(key);
    let value = has ? this.getAttribute(key) : REMOVAL;
    const camelKey = camelize$1(key);
    if (has && this._numberProps && this._numberProps[camelKey]) {
      value = toNumber(value);
    }
    this._setProp(camelKey, value, false, true);
  }
  /**
   * @internal
   */
  _getProp(key) {
    return this._props[key];
  }
  /**
   * @internal
   */
  _setProp(key, val, shouldReflect = true, shouldUpdate = false) {
    if (val !== this._props[key]) {
      this._dirty = true;
      if (val === REMOVAL) {
        delete this._props[key];
      } else {
        this._props[key] = val;
        if (key === "key" && this._app) {
          this._app._ceVNode.key = val;
        }
      }
      if (shouldUpdate && this._instance) {
        this._update();
      }
      if (shouldReflect) {
        const ob = this._ob;
        if (ob) {
          this._processMutations(ob.takeRecords());
          ob.disconnect();
        }
        if (val === true) {
          this.setAttribute(hyphenate(key), "");
        } else if (typeof val === "string" || typeof val === "number") {
          this.setAttribute(hyphenate(key), val + "");
        } else if (!val) {
          this.removeAttribute(hyphenate(key));
        }
        ob && ob.observe(this, { attributes: true });
      }
    }
  }
  _update() {
    const vnode = this._createVNode();
    if (this._app) vnode.appContext = this._app._context;
    render(vnode, this._root);
  }
  _createVNode() {
    const baseProps = {};
    if (!this.shadowRoot) {
      baseProps.onVnodeMounted = baseProps.onVnodeUpdated = this._renderSlots.bind(this);
    }
    const vnode = createVNode(this._def, extend(baseProps, this._props));
    if (!this._instance) {
      vnode.ce = (instance) => {
        this._instance = instance;
        instance.ce = this;
        instance.isCE = true;
        if (false) {
          instance.ceReload = (newStyles) => {
            if (this._styles) {
              this._styles.forEach((s) => this._root.removeChild(s));
              this._styles.length = 0;
            }
            this._styleAnchors.delete(this._def);
            this._applyStyles(newStyles);
            this._instance = null;
            this._update();
          };
        }
        const dispatch = (event, args) => {
          this.dispatchEvent(
            new CustomEvent(
              event,
              isPlainObject$2(args[0]) ? extend({ detail: args }, args[0]) : { detail: args }
            )
          );
        };
        instance.emit = (event, ...args) => {
          dispatch(event, args);
          if (hyphenate(event) !== event) {
            dispatch(hyphenate(event), args);
          }
        };
        this._setParent();
      };
    }
    return vnode;
  }
  _applyStyles(styles, owner, parentComp) {
    if (!styles) return;
    if (owner) {
      if (owner === this._def || this._styleChildren.has(owner)) {
        return;
      }
      this._styleChildren.add(owner);
    }
    const nonce = this._nonce;
    const root = this.shadowRoot;
    const insertionAnchor = parentComp ? this._getStyleAnchor(parentComp) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(root);
    let last = null;
    for (let i = styles.length - 1; i >= 0; i--) {
      const s = document.createElement("style");
      if (nonce) s.setAttribute("nonce", nonce);
      s.textContent = styles[i];
      root.insertBefore(s, last || insertionAnchor);
      last = s;
      if (i === 0) {
        if (!parentComp) this._styleAnchors.set(this._def, s);
        if (owner) this._styleAnchors.set(owner, s);
      }
      if (false) {
        if (owner) {
          if (owner.__hmrId) {
            if (!this._childStyles) this._childStyles = /* @__PURE__ */ new Map();
            let entry = this._childStyles.get(owner.__hmrId);
            if (!entry) {
              this._childStyles.set(owner.__hmrId, entry = []);
            }
            entry.push(s);
          }
        } else {
          (this._styles || (this._styles = [])).push(s);
        }
      }
    }
  }
  _getStyleAnchor(comp) {
    if (!comp) {
      return null;
    }
    const anchor = this._styleAnchors.get(comp);
    if (anchor && anchor.parentNode === this.shadowRoot) {
      return anchor;
    }
    if (anchor) {
      this._styleAnchors.delete(comp);
    }
    return null;
  }
  _getRootStyleInsertionAnchor(root) {
    for (let i = 0; i < root.childNodes.length; i++) {
      const node = root.childNodes[i];
      if (!(node instanceof HTMLStyleElement)) {
        return node;
      }
    }
    return null;
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const slots = this._slots = {};
    let n;
    while (n = this.firstChild) {
      const slotName = n.nodeType === 1 && n.getAttribute("slot") || "default";
      (slots[slotName] || (slots[slotName] = [])).push(n);
      this.removeChild(n);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const outlets = this._getSlots();
    const scopeId = this._instance.type.__scopeId;
    for (let i = 0; i < outlets.length; i++) {
      const o = outlets[i];
      const slotName = o.getAttribute("name") || "default";
      const content = this._slots[slotName];
      const parent = o.parentNode;
      if (content) {
        for (const n of content) {
          if (scopeId && n.nodeType === 1) {
            const id = scopeId + "-s";
            const walker = document.createTreeWalker(n, 1);
            n.setAttribute(id, "");
            let child;
            while (child = walker.nextNode()) {
              child.setAttribute(id, "");
            }
          }
          parent.insertBefore(n, o);
        }
      } else {
        while (o.firstChild) parent.insertBefore(o.firstChild, o);
      }
      parent.removeChild(o);
    }
  }
  /**
   * @internal
   */
  _getSlots() {
    const roots = [this];
    if (this._teleportTargets) {
      roots.push(...this._teleportTargets);
    }
    const slots = /* @__PURE__ */ new Set();
    for (const root of roots) {
      const found = root.querySelectorAll("slot");
      for (let i = 0; i < found.length; i++) {
        slots.add(found[i]);
      }
    }
    return Array.from(slots);
  }
  /**
   * @internal
   */
  _injectChildStyle(comp, parentComp) {
    this._applyStyles(comp.styles, comp, parentComp);
  }
  /**
   * @internal
   */
  _beginPatch() {
    this._patching = true;
    this._dirty = false;
  }
  /**
   * @internal
   */
  _endPatch() {
    this._patching = false;
    if (this._dirty && this._instance) {
      this._update();
    }
  }
  /**
   * @internal
   */
  _hasShadowRoot() {
    return this._def.shadowRoot !== false;
  }
  /**
   * @internal
   */
  _removeChildStyle(comp) {
    if (false) {
      this._styleChildren.delete(comp);
      this._styleAnchors.delete(comp);
      if (this._childStyles && comp.__hmrId) {
        const oldStyles = this._childStyles.get(comp.__hmrId);
        if (oldStyles) {
          oldStyles.forEach((s) => this._root.removeChild(s));
          oldStyles.length = 0;
        }
      }
    }
  }
}
function useHost(caller) {
  const instance = getCurrentInstance();
  const el = instance && instance.ce;
  if (el) {
    return el;
  } else if (false) {
    if (!instance) {
      warn(
        `${caller || "useHost"} called without an active component instance.`
      );
    } else {
      warn(
        `${caller || "useHost"} can only be used in components defined via defineCustomElement.`
      );
    }
  }
  return null;
}
function useShadowRoot() {
  const el = false ? useHost("useShadowRoot") : useHost();
  return el && el.shadowRoot;
}
function useCssModule(name = "$style") {
  {
    const instance = getCurrentInstance();
    if (!instance) {
      return EMPTY_OBJ;
    }
    const modules = instance.type.__cssModules;
    if (!modules) {
      return EMPTY_OBJ;
    }
    const mod = modules[name];
    if (!mod) {
      return EMPTY_OBJ;
    }
    return mod;
  }
}
const positionMap = /* @__PURE__ */ new WeakMap();
const newPositionMap = /* @__PURE__ */ new WeakMap();
const moveCbKey = /* @__PURE__ */ Symbol("_moveCb");
const enterCbKey = /* @__PURE__ */ Symbol("_enterCb");
const decorate = (t) => {
  delete t.props.mode;
  return t;
};
const TransitionGroupImpl = /* @__PURE__ */ decorate({
  name: "TransitionGroup",
  props: /* @__PURE__ */ extend({}, TransitionPropsValidators, {
    tag: String,
    moveClass: String
  }),
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const state = useTransitionState();
    let prevChildren;
    let children;
    onUpdated(() => {
      if (!prevChildren.length) {
        return;
      }
      const moveClass = props.moveClass || `${props.name || "v"}-move`;
      if (!hasCSSTransform(
        prevChildren[0].el,
        instance.vnode.el,
        moveClass
      )) {
        prevChildren = [];
        return;
      }
      prevChildren.forEach(callPendingCbs);
      prevChildren.forEach(recordPosition);
      const movedChildren = prevChildren.filter(applyTranslation);
      forceReflow(instance.vnode.el);
      movedChildren.forEach((c) => {
        const el = c.el;
        const style = el.style;
        addTransitionClass(el, moveClass);
        style.transform = style.webkitTransform = style.transitionDuration = "";
        const cb = el[moveCbKey] = (e) => {
          if (e && e.target !== el) {
            return;
          }
          if (!e || e.propertyName.endsWith("transform")) {
            el.removeEventListener("transitionend", cb);
            el[moveCbKey] = null;
            removeTransitionClass(el, moveClass);
          }
        };
        el.addEventListener("transitionend", cb);
      });
      prevChildren = [];
    });
    return () => {
      const rawProps = toRaw$1(props);
      const cssTransitionProps = resolveTransitionProps(rawProps);
      let tag = rawProps.tag || Fragment$1;
      prevChildren = [];
      if (children) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child.el && child.el instanceof Element) {
            prevChildren.push(child);
            setTransitionHooks(
              child,
              resolveTransitionHooks(
                child,
                cssTransitionProps,
                state,
                instance
              )
            );
            positionMap.set(child, getPosition(child.el));
          }
        }
      }
      children = slots.default ? getTransitionRawChildren(slots.default()) : [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.key != null) {
          setTransitionHooks(
            child,
            resolveTransitionHooks(child, cssTransitionProps, state, instance)
          );
        } else if (false) {
          warn(`<TransitionGroup> children must be keyed.`);
        }
      }
      return createVNode(tag, null, children);
    };
  }
});
const TransitionGroup = TransitionGroupImpl;
function callPendingCbs(c) {
  const el = c.el;
  if (el[moveCbKey]) {
    el[moveCbKey]();
  }
  if (el[enterCbKey]) {
    el[enterCbKey]();
  }
}
function recordPosition(c) {
  newPositionMap.set(c, getPosition(c.el));
}
function applyTranslation(c) {
  const oldPos = positionMap.get(c);
  const newPos = newPositionMap.get(c);
  const dx = oldPos.left - newPos.left;
  const dy = oldPos.top - newPos.top;
  if (dx || dy) {
    const el = c.el;
    const s = el.style;
    const rect = el.getBoundingClientRect();
    let scaleX = 1;
    let scaleY = 1;
    if (el.offsetWidth) scaleX = rect.width / el.offsetWidth;
    if (el.offsetHeight) scaleY = rect.height / el.offsetHeight;
    if (!Number.isFinite(scaleX) || scaleX === 0) scaleX = 1;
    if (!Number.isFinite(scaleY) || scaleY === 0) scaleY = 1;
    if (Math.abs(scaleX - 1) < 0.01) scaleX = 1;
    if (Math.abs(scaleY - 1) < 0.01) scaleY = 1;
    s.transform = s.webkitTransform = `translate(${dx / scaleX}px,${dy / scaleY}px)`;
    s.transitionDuration = "0s";
    return c;
  }
}
function getPosition(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top
  };
}
function hasCSSTransform(el, root, moveClass) {
  const clone = el.cloneNode();
  const _vtc = el[vtcKey];
  if (_vtc) {
    _vtc.forEach((cls) => {
      cls.split(/\s+/).forEach((c) => c && clone.classList.remove(c));
    });
  }
  moveClass.split(/\s+/).forEach((c) => c && clone.classList.add(c));
  clone.style.display = "none";
  const container = root.nodeType === 1 ? root : root.parentNode;
  container.appendChild(clone);
  const { hasTransform } = getTransitionInfo(clone);
  container.removeChild(clone);
  return hasTransform;
}
const getModelAssigner = (vnode) => {
  const fn = vnode.props["onUpdate:modelValue"] || false;
  return isArray$2(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
function onCompositionStart(e) {
  e.target.composing = true;
}
function onCompositionEnd(e) {
  const target = e.target;
  if (target.composing) {
    target.composing = false;
    target.dispatchEvent(new Event("input"));
  }
}
const assignKey = /* @__PURE__ */ Symbol("_assign");
function castValue(value, trim, number) {
  if (trim) value = value.trim();
  if (number) value = looseToNumber(value);
  return value;
}
const vModelText = {
  created(el, { modifiers: { lazy, trim, number } }, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    const castToNumber = number || vnode.props && vnode.props.type === "number";
    addEventListener(el, lazy ? "change" : "input", (e) => {
      if (e.target.composing) return;
      el[assignKey](castValue(el.value, trim, castToNumber));
    });
    if (trim || castToNumber) {
      addEventListener(el, "change", () => {
        el.value = castValue(el.value, trim, castToNumber);
      });
    }
    if (!lazy) {
      addEventListener(el, "compositionstart", onCompositionStart);
      addEventListener(el, "compositionend", onCompositionEnd);
      addEventListener(el, "change", onCompositionEnd);
    }
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(el, { value }) {
    el.value = value == null ? "" : value;
  },
  beforeUpdate(el, { value, oldValue, modifiers: { lazy, trim, number } }, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    if (el.composing) return;
    const elValue = (number || el.type === "number") && !/^0\d/.test(el.value) ? looseToNumber(el.value) : el.value;
    const newValue = value == null ? "" : value;
    if (elValue === newValue) {
      return;
    }
    const rootNode = el.getRootNode();
    if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement === el && el.type !== "range") {
      if (lazy && value === oldValue) {
        return;
      }
      if (trim && el.value.trim() === newValue) {
        return;
      }
    }
    el.value = newValue;
  }
};
const vModelCheckbox = {
  // #4096 array checkboxes need to be deep traversed
  deep: true,
  created(el, _, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    addEventListener(el, "change", () => {
      const modelValue = el._modelValue;
      const elementValue = getValue(el);
      const checked = el.checked;
      const assign = el[assignKey];
      if (isArray$2(modelValue)) {
        const index = looseIndexOf(modelValue, elementValue);
        const found = index !== -1;
        if (checked && !found) {
          assign(modelValue.concat(elementValue));
        } else if (!checked && found) {
          const filtered = [...modelValue];
          filtered.splice(index, 1);
          assign(filtered);
        }
      } else if (isSet$2(modelValue)) {
        const cloned = new Set(modelValue);
        if (checked) {
          cloned.add(elementValue);
        } else {
          cloned.delete(elementValue);
        }
        assign(cloned);
      } else {
        assign(getCheckboxValue(el, checked));
      }
    });
  },
  // set initial checked on mount to wait for true-value/false-value
  mounted: setChecked,
  beforeUpdate(el, binding, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    setChecked(el, binding, vnode);
  }
};
function setChecked(el, { value, oldValue }, vnode) {
  el._modelValue = value;
  let checked;
  if (isArray$2(value)) {
    checked = looseIndexOf(value, vnode.props.value) > -1;
  } else if (isSet$2(value)) {
    checked = value.has(vnode.props.value);
  } else {
    if (value === oldValue) return;
    checked = looseEqual(value, getCheckboxValue(el, true));
  }
  if (el.checked !== checked) {
    el.checked = checked;
  }
}
const vModelRadio = {
  created(el, { value }, vnode) {
    el.checked = looseEqual(value, vnode.props.value);
    el[assignKey] = getModelAssigner(vnode);
    addEventListener(el, "change", () => {
      el[assignKey](getValue(el));
    });
  },
  beforeUpdate(el, { value, oldValue }, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    if (value !== oldValue) {
      el.checked = looseEqual(value, vnode.props.value);
    }
  }
};
const vModelSelect = {
  // <select multiple> value need to be deep traversed
  deep: true,
  created(el, { value, modifiers: { number } }, vnode) {
    const isSetModel = isSet$2(value);
    addEventListener(el, "change", () => {
      const selectedVal = Array.prototype.filter.call(el.options, (o) => o.selected).map(
        (o) => number ? looseToNumber(getValue(o)) : getValue(o)
      );
      el[assignKey](
        el.multiple ? isSetModel ? new Set(selectedVal) : selectedVal : selectedVal[0]
      );
      el._assigning = true;
      nextTick(() => {
        el._assigning = false;
      });
    });
    el[assignKey] = getModelAssigner(vnode);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(el, { value }) {
    setSelected(el, value);
  },
  beforeUpdate(el, _binding, vnode) {
    el[assignKey] = getModelAssigner(vnode);
  },
  updated(el, { value }) {
    if (!el._assigning) {
      setSelected(el, value);
    }
  }
};
function setSelected(el, value) {
  const isMultiple = el.multiple;
  const isArrayValue = isArray$2(value);
  if (isMultiple && !isArrayValue && !isSet$2(value)) {
    return;
  }
  for (let i = 0, l = el.options.length; i < l; i++) {
    const option = el.options[i];
    const optionValue = getValue(option);
    if (isMultiple) {
      if (isArrayValue) {
        const optionType = typeof optionValue;
        if (optionType === "string" || optionType === "number") {
          option.selected = value.some((v) => String(v) === String(optionValue));
        } else {
          option.selected = looseIndexOf(value, optionValue) > -1;
        }
      } else {
        option.selected = value.has(optionValue);
      }
    } else if (looseEqual(getValue(option), value)) {
      if (el.selectedIndex !== i) el.selectedIndex = i;
      return;
    }
  }
  if (!isMultiple && el.selectedIndex !== -1) {
    el.selectedIndex = -1;
  }
}
function getValue(el) {
  return "_value" in el ? el._value : el.value;
}
function getCheckboxValue(el, checked) {
  const key = checked ? "_trueValue" : "_falseValue";
  return key in el ? el[key] : checked;
}
const vModelDynamic = {
  created(el, binding, vnode) {
    callModelHook(el, binding, vnode, null, "created");
  },
  mounted(el, binding, vnode) {
    callModelHook(el, binding, vnode, null, "mounted");
  },
  beforeUpdate(el, binding, vnode, prevVNode) {
    callModelHook(el, binding, vnode, prevVNode, "beforeUpdate");
  },
  updated(el, binding, vnode, prevVNode) {
    callModelHook(el, binding, vnode, prevVNode, "updated");
  }
};
function resolveDynamicModel(tagName, type) {
  switch (tagName) {
    case "SELECT":
      return vModelSelect;
    case "TEXTAREA":
      return vModelText;
    default:
      switch (type) {
        case "checkbox":
          return vModelCheckbox;
        case "radio":
          return vModelRadio;
        default:
          return vModelText;
      }
  }
}
function callModelHook(el, binding, vnode, prevVNode, hook) {
  const modelToUse = resolveDynamicModel(
    el.tagName,
    vnode.props && vnode.props.type
  );
  const fn = modelToUse[hook];
  fn && fn(el, binding, vnode, prevVNode);
}
function initVModelForSSR() {
  vModelText.getSSRProps = ({ value }) => ({ value });
  vModelRadio.getSSRProps = ({ value }, vnode) => {
    if (vnode.props && looseEqual(vnode.props.value, value)) {
      return { checked: true };
    }
  };
  vModelCheckbox.getSSRProps = ({ value }, vnode) => {
    if (isArray$2(value)) {
      if (vnode.props && looseIndexOf(value, vnode.props.value) > -1) {
        return { checked: true };
      }
    } else if (isSet$2(value)) {
      if (vnode.props && value.has(vnode.props.value)) {
        return { checked: true };
      }
    } else if (value) {
      return { checked: true };
    }
  };
  vModelDynamic.getSSRProps = (binding, vnode) => {
    if (typeof vnode.type !== "string") {
      return;
    }
    const modelToUse = resolveDynamicModel(
      // resolveDynamicModel expects an uppercase tag name, but vnode.type is lowercase
      vnode.type.toUpperCase(),
      vnode.props && vnode.props.type
    );
    if (modelToUse.getSSRProps) {
      return modelToUse.getSSRProps(binding, vnode);
    }
  };
}
const systemModifiers = ["ctrl", "shift", "alt", "meta"];
const modifierGuards = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
};
const withModifiers = (fn, modifiers) => {
  if (!fn) return fn;
  const cache = fn._withMods || (fn._withMods = {});
  const cacheKey = modifiers.join(".");
  return cache[cacheKey] || (cache[cacheKey] = ((event, ...args) => {
    for (let i = 0; i < modifiers.length; i++) {
      const guard = modifierGuards[modifiers[i]];
      if (guard && guard(event, modifiers)) return;
    }
    return fn(event, ...args);
  }));
};
const keyNames = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
};
const withKeys = (fn, modifiers) => {
  const cache = fn._withKeys || (fn._withKeys = {});
  const cacheKey = modifiers.join(".");
  return cache[cacheKey] || (cache[cacheKey] = ((event) => {
    if (!("key" in event)) {
      return;
    }
    const eventKey = hyphenate(event.key);
    if (modifiers.some(
      (k) => k === eventKey || keyNames[k] === eventKey
    )) {
      return fn(event);
    }
  }));
};
const rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
let renderer;
let enabledHydration = false;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
function ensureHydrationRenderer() {
  renderer = enabledHydration ? renderer : createHydrationRenderer(rendererOptions);
  enabledHydration = true;
  return renderer;
}
const render = ((...args) => {
  ensureRenderer().render(...args);
});
const hydrate = ((...args) => {
  ensureHydrationRenderer().hydrate(...args);
});
const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args);
  if (false) {
    injectNativeTagCheck(app);
    injectCompilerOptionsCheck(app);
  }
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;
    const component = app._component;
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML;
    }
    if (container.nodeType === 1) {
      container.textContent = "";
    }
    const proxy = mount(container, false, resolveRootNamespace(container));
    if (container instanceof Element) {
      container.removeAttribute("v-cloak");
      container.setAttribute("data-v-app", "");
    }
    return proxy;
  };
  return app;
});
const createSSRApp = ((...args) => {
  const app = ensureHydrationRenderer().createApp(...args);
  if (false) {
    injectNativeTagCheck(app);
    injectCompilerOptionsCheck(app);
  }
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (container) {
      return mount(container, true, resolveRootNamespace(container));
    }
  };
  return app;
});
function resolveRootNamespace(container) {
  if (container instanceof SVGElement) {
    return "svg";
  }
  if (typeof MathMLElement === "function" && container instanceof MathMLElement) {
    return "mathml";
  }
}
function injectNativeTagCheck(app) {
  Object.defineProperty(app.config, "isNativeTag", {
    value: (tag) => isHTMLTag(tag) || isSVGTag(tag) || isMathMLTag(tag),
    writable: false
  });
}
function injectCompilerOptionsCheck(app) {
  if (isRuntimeOnly()) {
    const isCustomElement = app.config.isCustomElement;
    Object.defineProperty(app.config, "isCustomElement", {
      get() {
        return isCustomElement;
      },
      set() {
        warn(
          `The \`isCustomElement\` config option is deprecated. Use \`compilerOptions.isCustomElement\` instead.`
        );
      }
    });
    const compilerOptions = app.config.compilerOptions;
    const msg = `The \`compilerOptions\` config option is only respected when using a build of Vue.js that includes the runtime compiler (aka "full build"). Since you are using the runtime-only build, \`compilerOptions\` must be passed to \`@vue/compiler-dom\` in the build setup instead.
- For vue-loader: pass it via vue-loader's \`compilerOptions\` loader option.
- For vue-cli: see https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-loader
- For vite: pass it via @vitejs/plugin-vue options. See https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue#example-for-passing-options-to-vuecompiler-sfc`;
    Object.defineProperty(app.config, "compilerOptions", {
      get() {
        warn(msg);
        return compilerOptions;
      },
      set() {
        warn(msg);
      }
    });
  }
}
function normalizeContainer(container) {
  if (isString$1(container)) {
    const res = document.querySelector(container);
    if (false) {
      warn(
        `Failed to mount app: mount target selector "${container}" returned null.`
      );
    }
    return res;
  }
  if (false) {
    warn(
      `mounting on a ShadowRoot with \`{mode: "closed"}\` may lead to unpredictable bugs`
    );
  }
  return container;
}
let ssrDirectiveInitialized = false;
const initDirectivesForSSR = () => {
  if (!ssrDirectiveInitialized) {
    ssrDirectiveInitialized = true;
    initVModelForSSR();
    initVShowForSSR();
  }
};

/**
* vue v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function initDev() {
  {
    initCustomFormatter();
  }
}
if (false) {
  initDev();
}
const compile$1 = () => {
  if (false) {
    warn(
      `Runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".`
    );
  }
};

const __pwVue = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  BaseTransition,
  BaseTransitionPropsValidators,
  Comment,
  DeprecationTypes,
  EffectScope,
  ErrorCodes: ErrorCodes$1,
  ErrorTypeStrings,
  Fragment: Fragment$1,
  KeepAlive,
  ReactiveEffect,
  Static,
  Suspense,
  Teleport,
  Text,
  TrackOpTypes,
  Transition,
  TransitionGroup,
  TriggerOpTypes,
  VueElement,
  assertNumber,
  callWithAsyncErrorHandling,
  callWithErrorHandling,
  camelize: camelize$1,
  capitalize,
  cloneVNode,
  compatUtils,
  compile: compile$1,
  computed,
  createApp,
  createBlock,
  createCommentVNode,
  createElementBlock,
  createElementVNode: createBaseVNode,
  createHydrationRenderer,
  createPropsRestProxy,
  createRenderer,
  createSSRApp,
  createSlots,
  createStaticVNode,
  createTextVNode,
  createVNode,
  customRef,
  defineAsyncComponent,
  defineComponent,
  defineCustomElement,
  defineEmits,
  defineExpose,
  defineModel,
  defineOptions,
  defineProps,
  defineSSRCustomElement,
  defineSlots,
  devtools: devtools$2,
  effect,
  effectScope,
  getCurrentInstance,
  getCurrentScope,
  getCurrentWatcher,
  getTransitionRawChildren,
  guardReactiveProps,
  h,
  handleError,
  hasInjectionContext,
  hydrate,
  hydrateOnIdle,
  hydrateOnInteraction,
  hydrateOnMediaQuery,
  hydrateOnVisible,
  initCustomFormatter,
  initDirectivesForSSR,
  inject,
  isMemoSame,
  isProxy,
  isReactive: isReactive$1,
  isReadonly: isReadonly$1,
  isRef: isRef$1,
  isRuntimeOnly,
  isShallow,
  isVNode,
  markRaw,
  mergeDefaults,
  mergeModels,
  mergeProps,
  nextTick,
  nodeOps,
  normalizeClass,
  normalizeProps,
  normalizeStyle,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onScopeDispose,
  onServerPrefetch,
  onUnmounted,
  onUpdated,
  onWatcherCleanup,
  openBlock,
  patchProp,
  popScopeId,
  provide,
  proxyRefs,
  pushScopeId,
  queuePostFlushCb,
  reactive,
  readonly,
  ref,
  registerRuntimeCompiler,
  render,
  renderList,
  renderSlot,
  resolveComponent,
  resolveDirective,
  resolveDynamicComponent,
  resolveFilter,
  resolveTransitionHooks,
  setBlockTracking,
  setDevtoolsHook,
  setTransitionHooks,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  ssrContextKey,
  ssrUtils,
  stop,
  toDisplayString,
  toHandlerKey,
  toHandlers,
  toRaw: toRaw$1,
  toRef,
  toRefs,
  toValue,
  transformVNodeArgs,
  triggerRef,
  unref,
  useAttrs,
  useCssModule,
  useCssVars,
  useHost,
  useId,
  useModel,
  useSSRContext,
  useShadowRoot,
  useSlots,
  useTemplateRef,
  useTransitionState,
  vModelCheckbox,
  vModelDynamic,
  vModelRadio,
  vModelSelect,
  vModelText,
  vShow,
  version,
  warn,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  withAsyncContext,
  withCtx,
  withDefaults,
  withDirectives,
  withKeys,
  withMemo,
  withModifiers,
  withScopeId
}, Symbol.toStringTag, { value: 'Module' }));

var __create$1 = Object.create;
var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames$1 = Object.getOwnPropertyNames;
var __getProtoOf$1 = Object.getPrototypeOf;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __esm$1 = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames$1(fn)[0]])(fn = 0)), res;
};
var __commonJS$1 = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames$1(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps$1 = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames$1(from))
      if (!__hasOwnProp$1.call(to, key) && key !== except)
        __defProp$1(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc$1(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM$1 = (mod, isNodeMode, target2) => (target2 = mod != null ? __create$1(__getProtoOf$1(mod)) : {}, __copyProps$1(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp$1(target2, "default", { value: mod, enumerable: true }) : target2,
  mod
));

// ../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js
var init_esm_shims$1 = __esm$1({
  "../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/rfdc@1.4.1/node_modules/rfdc/index.js
var require_rfdc = __commonJS$1({
  "../../node_modules/.pnpm/rfdc@1.4.1/node_modules/rfdc/index.js"(exports$1, module) {
    "use strict";
    init_esm_shims$1();
    module.exports = rfdc2;
    function copyBuffer(cur) {
      if (cur instanceof Buffer) {
        return Buffer.from(cur);
      }
      return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length);
    }
    function rfdc2(opts) {
      opts = opts || {};
      if (opts.circles) return rfdcCircles(opts);
      const constructorHandlers = /* @__PURE__ */ new Map();
      constructorHandlers.set(Date, (o) => new Date(o));
      constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)));
      constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)));
      if (opts.constructorHandlers) {
        for (const handler2 of opts.constructorHandlers) {
          constructorHandlers.set(handler2[0], handler2[1]);
        }
      }
      let handler = null;
      return opts.proto ? cloneProto : clone;
      function cloneArray(a, fn) {
        const keys = Object.keys(a);
        const a2 = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const cur = a[k];
          if (typeof cur !== "object" || cur === null) {
            a2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            a2[k] = handler(cur, fn);
          } else if (ArrayBuffer.isView(cur)) {
            a2[k] = copyBuffer(cur);
          } else {
            a2[k] = fn(cur);
          }
        }
        return a2;
      }
      function clone(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, clone);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, clone);
        }
        const o2 = {};
        for (const k in o) {
          if (Object.hasOwnProperty.call(o, k) === false) continue;
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, clone);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            o2[k] = clone(cur);
          }
        }
        return o2;
      }
      function cloneProto(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, cloneProto);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, cloneProto);
        }
        const o2 = {};
        for (const k in o) {
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, cloneProto);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            o2[k] = cloneProto(cur);
          }
        }
        return o2;
      }
    }
    function rfdcCircles(opts) {
      const refs = [];
      const refsNew = [];
      const constructorHandlers = /* @__PURE__ */ new Map();
      constructorHandlers.set(Date, (o) => new Date(o));
      constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)));
      constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)));
      if (opts.constructorHandlers) {
        for (const handler2 of opts.constructorHandlers) {
          constructorHandlers.set(handler2[0], handler2[1]);
        }
      }
      let handler = null;
      return opts.proto ? cloneProto : clone;
      function cloneArray(a, fn) {
        const keys = Object.keys(a);
        const a2 = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const cur = a[k];
          if (typeof cur !== "object" || cur === null) {
            a2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            a2[k] = handler(cur, fn);
          } else if (ArrayBuffer.isView(cur)) {
            a2[k] = copyBuffer(cur);
          } else {
            const index = refs.indexOf(cur);
            if (index !== -1) {
              a2[k] = refsNew[index];
            } else {
              a2[k] = fn(cur);
            }
          }
        }
        return a2;
      }
      function clone(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, clone);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, clone);
        }
        const o2 = {};
        refs.push(o);
        refsNew.push(o2);
        for (const k in o) {
          if (Object.hasOwnProperty.call(o, k) === false) continue;
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, clone);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            const i = refs.indexOf(cur);
            if (i !== -1) {
              o2[k] = refsNew[i];
            } else {
              o2[k] = clone(cur);
            }
          }
        }
        refs.pop();
        refsNew.pop();
        return o2;
      }
      function cloneProto(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, cloneProto);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, cloneProto);
        }
        const o2 = {};
        refs.push(o);
        refsNew.push(o2);
        for (const k in o) {
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, cloneProto);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            const i = refs.indexOf(cur);
            if (i !== -1) {
              o2[k] = refsNew[i];
            } else {
              o2[k] = cloneProto(cur);
            }
          }
        }
        refs.pop();
        refsNew.pop();
        return o2;
      }
    }
  }
});

// src/index.ts
init_esm_shims$1();

// src/constants.ts
init_esm_shims$1();
var VIEW_MODE_STORAGE_KEY = "__vue-devtools-view-mode__";
var VITE_PLUGIN_DETECTED_STORAGE_KEY = "__vue-devtools-vite-plugin-detected__";
var VITE_PLUGIN_CLIENT_URL_STORAGE_KEY = "__vue-devtools-vite-plugin-client-url__";
var BROADCAST_CHANNEL_NAME$1 = "__vue-devtools-broadcast-channel__";

// src/env.ts
init_esm_shims$1();
var isBrowser$1 = typeof navigator !== "undefined";
var target = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : {};
var isInChromePanel = typeof target.chrome !== "undefined" && !!target.chrome.devtools;
var isInIframe = isBrowser$1 && target.self !== target.top;
var _a$1;
var isInElectron = typeof navigator !== "undefined" && ((_a$1 = navigator.userAgent) == null ? void 0 : _a$1.toLowerCase().includes("electron"));
var isNuxtApp = typeof window !== "undefined" && !!window.__NUXT__;
var isInSeparateWindow = !isInIframe && !isInChromePanel && !isInElectron;

// src/general.ts
init_esm_shims$1();
var import_rfdc = __toESM$1(require_rfdc(), 1);
function NOOP() {
}
var isNumeric = (str) => `${+str}` === str;
var isMacOS = () => (navigator == null ? void 0 : navigator.platform) ? navigator == null ? void 0 : navigator.platform.toLowerCase().includes("mac") : /Macintosh/.test(navigator.userAgent);
var classifyRE = /(?:^|[-_/])(\w)/g;
var camelizeRE = /-(\w)/g;
var kebabizeRE = /([a-z0-9])([A-Z])/g;
function toUpper(_, c) {
  return c ? c.toUpperCase() : "";
}
function classify(str) {
  return str && `${str}`.replace(classifyRE, toUpper);
}
function camelize(str) {
  return str && str.replace(camelizeRE, toUpper);
}
function kebabize(str) {
  return str && str.replace(kebabizeRE, (_, lowerCaseCharacter, upperCaseLetter) => {
    return `${lowerCaseCharacter}-${upperCaseLetter}`;
  }).toLowerCase();
}
function basename(filename, ext) {
  let normalizedFilename = filename.replace(/^[a-z]:/i, "").replace(/\\/g, "/");
  if (normalizedFilename.endsWith(`index${ext}`)) {
    normalizedFilename = normalizedFilename.replace(`/index${ext}`, ext);
  }
  const lastSlashIndex = normalizedFilename.lastIndexOf("/");
  const baseNameWithExt = normalizedFilename.substring(lastSlashIndex + 1);
  if (ext) {
    const extIndex = baseNameWithExt.lastIndexOf(ext);
    return baseNameWithExt.substring(0, extIndex);
  }
  return "";
}
function sortByKey(state) {
  return state && state.slice().sort((a, b) => {
    if (a.key < b.key)
      return -1;
    if (a.key > b.key)
      return 1;
    return 0;
  });
}
var HTTP_URL_RE = /^https?:\/\//;
function isUrlString(str) {
  return str.startsWith("/") || HTTP_URL_RE.test(str);
}
var deepClone = (0, import_rfdc.default)({ circles: true });
function randomStr() {
  return Math.random().toString(36).slice(2);
}
function isObject$1(value) {
  return typeof value === "object" && !Array.isArray(value) && value !== null;
}
function isArray$1(value) {
  return Array.isArray(value);
}
function isSet$1(value) {
  return value instanceof Set;
}
function isMap$1(value) {
  return value instanceof Map;
}

const DEBOUNCE_DEFAULTS = {
  trailing: true
};
function debounce(fn, wait = 25, options = {}) {
  options = { ...DEBOUNCE_DEFAULTS, ...options };
  if (!Number.isFinite(wait)) {
    throw new TypeError("Expected `wait` to be a finite number");
  }
  let leadingValue;
  let timeout;
  let resolveList = [];
  let currentPromise;
  let trailingArgs;
  const applyFn = (_this, args) => {
    currentPromise = _applyPromised(fn, _this, args);
    currentPromise.finally(() => {
      currentPromise = null;
      if (options.trailing && trailingArgs && !timeout) {
        const promise = applyFn(_this, trailingArgs);
        trailingArgs = null;
        return promise;
      }
    });
    return currentPromise;
  };
  return function(...args) {
    if (currentPromise) {
      if (options.trailing) {
        trailingArgs = args;
      }
      return currentPromise;
    }
    return new Promise((resolve) => {
      const shouldCallNow = !timeout && options.leading;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        const promise = options.leading ? leadingValue : applyFn(this, args);
        for (const _resolve of resolveList) {
          _resolve(promise);
        }
        resolveList = [];
      }, wait);
      if (shouldCallNow) {
        leadingValue = applyFn(this, args);
        resolve(leadingValue);
      } else {
        resolveList.push(resolve);
      }
    });
  };
}
async function _applyPromised(fn, _this, args) {
  return await fn.apply(_this, args);
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
function mergeHooks(...hooks) {
  const finalHooks = {};
  for (const hook of hooks) {
    const flatenHook = flatHooks(hook);
    for (const key in flatenHook) {
      if (finalHooks[key]) {
        finalHooks[key].push(flatenHook[key]);
      } else {
        finalHooks[key] = [flatenHook[key]];
      }
    }
  }
  for (const key in finalHooks) {
    if (finalHooks[key].length > 1) {
      const array = finalHooks[key];
      finalHooks[key] = (...arguments_) => serial(array, (function_) => function_(...arguments_));
    } else {
      finalHooks[key] = finalHooks[key][0];
    }
  }
  return finalHooks;
}
function serial(tasks, function_) {
  return tasks.reduce(
    (promise, task) => promise.then(() => function_(task)),
    Promise.resolve()
  );
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function serialCaller(hooks, arguments_) {
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => hookFunction(...arguments_ || [])),
    Promise.resolve()
  );
}
function parallelCaller(hooks, args) {
  return Promise.all(hooks.map((hook) => hook(...args || [])));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const isBrowser = typeof window !== "undefined";
function createDebugger(hooks, _options = {}) {
  const options = {
    inspect: isBrowser,
    group: isBrowser,
    filter: () => true,
    ..._options
  };
  const _filter = options.filter;
  const filter = typeof _filter === "string" ? (name) => name.startsWith(_filter) : _filter;
  const _tag = options.tag ? `[${options.tag}] ` : "";
  const logPrefix = (event) => _tag + event.name + "".padEnd(event._id, "\0");
  const _idCtr = {};
  const unsubscribeBefore = hooks.beforeEach((event) => {
    if (filter !== void 0 && !filter(event.name)) {
      return;
    }
    _idCtr[event.name] = _idCtr[event.name] || 0;
    event._id = _idCtr[event.name]++;
    console.time(logPrefix(event));
  });
  const unsubscribeAfter = hooks.afterEach((event) => {
    if (filter !== void 0 && !filter(event.name)) {
      return;
    }
    if (options.group) {
      console.groupCollapsed(event.name);
    }
    if (options.inspect) {
      console.timeLog(logPrefix(event), event.args);
    } else {
      console.timeEnd(logPrefix(event));
    }
    if (options.group) {
      console.groupEnd();
    }
    _idCtr[event.name]--;
  });
  return {
    /** Stop debugging and remove listeners */
    close: () => {
      unsubscribeBefore();
      unsubscribeAfter();
    }
  };
}

const TYPE_REQUEST = "q";
const TYPE_RESPONSE = "s";
const DEFAULT_TIMEOUT = 6e4;
function defaultSerialize(i) {
  return i;
}
const defaultDeserialize = defaultSerialize;
const { clearTimeout: clearTimeout$1, setTimeout: setTimeout$1 } = globalThis;
const random = Math.random.bind(Math);
function createBirpc($functions, options) {
  const {
    post,
    on,
    off = () => {
    },
    eventNames = [],
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    resolver,
    bind = "rpc",
    timeout = DEFAULT_TIMEOUT
  } = options;
  let $closed = false;
  const _rpcPromiseMap = /* @__PURE__ */ new Map();
  let _promiseInit;
  let rpc;
  async function _call(method, args, event, optional) {
    if ($closed)
      throw new Error(`[birpc] rpc is closed, cannot call "${method}"`);
    const req = { m: method, a: args, t: TYPE_REQUEST };
    if (optional)
      req.o = true;
    const send = async (_req) => post(serialize(_req));
    if (event) {
      await send(req);
      return;
    }
    if (_promiseInit) {
      try {
        await _promiseInit;
      } finally {
        _promiseInit = void 0;
      }
    }
    let { promise, resolve, reject } = createPromiseWithResolvers();
    const id = nanoid();
    req.i = id;
    let timeoutId;
    async function handler(newReq = req) {
      if (timeout >= 0) {
        timeoutId = setTimeout$1(() => {
          try {
            const handleResult = options.onTimeoutError?.call(rpc, method, args);
            if (handleResult !== true)
              throw new Error(`[birpc] timeout on calling "${method}"`);
          } catch (e) {
            reject(e);
          }
          _rpcPromiseMap.delete(id);
        }, timeout);
        if (typeof timeoutId === "object")
          timeoutId = timeoutId.unref?.();
      }
      _rpcPromiseMap.set(id, { resolve, reject, timeoutId, method });
      await send(newReq);
      return promise;
    }
    try {
      if (options.onRequest)
        await options.onRequest.call(rpc, req, handler, resolve);
      else
        await handler();
    } catch (e) {
      if (options.onGeneralError?.call(rpc, e) !== true)
        throw e;
      return;
    } finally {
      clearTimeout$1(timeoutId);
      _rpcPromiseMap.delete(id);
    }
    return promise;
  }
  const $call = (method, ...args) => _call(method, args, false);
  const $callOptional = (method, ...args) => _call(method, args, false, true);
  const $callEvent = (method, ...args) => _call(method, args, true);
  const $callRaw = (options2) => _call(options2.method, options2.args, options2.event, options2.optional);
  const builtinMethods = {
    $call,
    $callOptional,
    $callEvent,
    $callRaw,
    $rejectPendingCalls,
    get $closed() {
      return $closed;
    },
    get $meta() {
      return options.meta;
    },
    $close,
    $functions
  };
  rpc = new Proxy({}, {
    get(_, method) {
      if (Object.prototype.hasOwnProperty.call(builtinMethods, method))
        return builtinMethods[method];
      if (method === "then" && !eventNames.includes("then") && !("then" in $functions))
        return void 0;
      const sendEvent = (...args) => _call(method, args, true);
      if (eventNames.includes(method)) {
        sendEvent.asEvent = sendEvent;
        return sendEvent;
      }
      const sendCall = (...args) => _call(method, args, false);
      sendCall.asEvent = sendEvent;
      return sendCall;
    }
  });
  function $close(customError) {
    $closed = true;
    _rpcPromiseMap.forEach(({ reject, method }) => {
      const error = new Error(`[birpc] rpc is closed, cannot call "${method}"`);
      if (customError) {
        customError.cause ??= error;
        return reject(customError);
      }
      reject(error);
    });
    _rpcPromiseMap.clear();
    off(onMessage);
  }
  function $rejectPendingCalls(handler) {
    const entries = Array.from(_rpcPromiseMap.values());
    const handlerResults = entries.map(({ method, reject }) => {
      if (!handler) {
        return reject(new Error(`[birpc]: rejected pending call "${method}".`));
      }
      return handler({ method, reject });
    });
    _rpcPromiseMap.clear();
    return handlerResults;
  }
  async function onMessage(data, ...extra) {
    let msg;
    try {
      msg = deserialize(data);
    } catch (e) {
      if (options.onGeneralError?.call(rpc, e) !== true)
        throw e;
      return;
    }
    if (msg.t === TYPE_REQUEST) {
      const { m: method, a: args, o: optional } = msg;
      let result, error;
      let fn = await (resolver ? resolver.call(rpc, method, $functions[method]) : $functions[method]);
      if (optional)
        fn ||= () => void 0;
      if (!fn) {
        error = new Error(`[birpc] function "${method}" not found`);
      } else {
        try {
          result = await fn.apply(bind === "rpc" ? rpc : $functions, args);
        } catch (e) {
          error = e;
        }
      }
      if (msg.i) {
        if (error && options.onError)
          options.onError.call(rpc, error, method, args);
        if (error && options.onFunctionError) {
          if (options.onFunctionError.call(rpc, error, method, args) === true)
            return;
        }
        if (!error) {
          try {
            await post(serialize({ t: TYPE_RESPONSE, i: msg.i, r: result }), ...extra);
            return;
          } catch (e) {
            error = e;
            if (options.onGeneralError?.call(rpc, e, method, args) !== true)
              throw e;
          }
        }
        try {
          await post(serialize({ t: TYPE_RESPONSE, i: msg.i, e: error }), ...extra);
        } catch (e) {
          if (options.onGeneralError?.call(rpc, e, method, args) !== true)
            throw e;
        }
      }
    } else {
      const { i: ack, r: result, e: error } = msg;
      const promise = _rpcPromiseMap.get(ack);
      if (promise) {
        clearTimeout$1(promise.timeoutId);
        if (error)
          promise.reject(error);
        else
          promise.resolve(result);
      }
      _rpcPromiseMap.delete(ack);
    }
  }
  _promiseInit = on(onMessage);
  return rpc;
}
const cacheMap = /* @__PURE__ */ new WeakMap();
function cachedMap(items, fn) {
  return items.map((i) => {
    let r = cacheMap.get(i);
    if (!r) {
      r = fn(i);
      cacheMap.set(i, r);
    }
    return r;
  });
}
function createBirpcGroup(functions, channels, options = {}) {
  const getChannels = () => typeof channels === "function" ? channels() : channels;
  const getClients = (channels2 = getChannels()) => cachedMap(channels2, (s) => createBirpc(functions, { ...options, ...s }));
  function _boardcast(method, args, event, optional) {
    const clients = getClients();
    return Promise.all(clients.map((c) => c.$callRaw({ method, args, event, optional })));
  }
  function $call(method, ...args) {
    return _boardcast(method, args, false);
  }
  function $callOptional(method, ...args) {
    return _boardcast(method, args, false, true);
  }
  function $callEvent(method, ...args) {
    return _boardcast(method, args, true);
  }
  const broadcastBuiltin = {
    $call,
    $callOptional,
    $callEvent
  };
  const broadcastProxy = new Proxy({}, {
    get(_, method) {
      if (Object.prototype.hasOwnProperty.call(broadcastBuiltin, method))
        return broadcastBuiltin[method];
      const client = getClients();
      const callbacks = client.map((c) => c[method]);
      const sendCall = (...args) => {
        return Promise.all(callbacks.map((i) => i(...args)));
      };
      sendCall.asEvent = async (...args) => {
        await Promise.all(callbacks.map((i) => i.asEvent(...args)));
      };
      return sendCall;
    }
  });
  function updateChannels(fn) {
    const channels2 = getChannels();
    fn?.(channels2);
    return getClients(channels2);
  }
  getClients();
  return {
    get clients() {
      return getClients();
    },
    functions,
    updateChannels,
    broadcast: broadcastProxy,
    /**
     * @deprecated use `broadcast`
     */
    // @ts-expect-error deprecated
    boardcast: broadcastProxy
  };
}
function createPromiseWithResolvers() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
function nanoid(size = 21) {
  let id = "";
  let i = size;
  while (i--)
    id += urlAlphabet[random() * 64 | 0];
  return id;
}

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target22) => (target22 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target22, "default", { value: mod, enumerable: true }) : target22,
  mod
));

// ../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js
var init_esm_shims = __esm({
  "../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/lib/speakingurl.js
var require_speakingurl = __commonJS({
  "../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/lib/speakingurl.js"(exports$1, module) {
    "use strict";
    init_esm_shims();
    (function(root) {
      "use strict";
      var charMap = {
        // latin
        "\xC0": "A",
        "\xC1": "A",
        "\xC2": "A",
        "\xC3": "A",
        "\xC4": "Ae",
        "\xC5": "A",
        "\xC6": "AE",
        "\xC7": "C",
        "\xC8": "E",
        "\xC9": "E",
        "\xCA": "E",
        "\xCB": "E",
        "\xCC": "I",
        "\xCD": "I",
        "\xCE": "I",
        "\xCF": "I",
        "\xD0": "D",
        "\xD1": "N",
        "\xD2": "O",
        "\xD3": "O",
        "\xD4": "O",
        "\xD5": "O",
        "\xD6": "Oe",
        "\u0150": "O",
        "\xD8": "O",
        "\xD9": "U",
        "\xDA": "U",
        "\xDB": "U",
        "\xDC": "Ue",
        "\u0170": "U",
        "\xDD": "Y",
        "\xDE": "TH",
        "\xDF": "ss",
        "\xE0": "a",
        "\xE1": "a",
        "\xE2": "a",
        "\xE3": "a",
        "\xE4": "ae",
        "\xE5": "a",
        "\xE6": "ae",
        "\xE7": "c",
        "\xE8": "e",
        "\xE9": "e",
        "\xEA": "e",
        "\xEB": "e",
        "\xEC": "i",
        "\xED": "i",
        "\xEE": "i",
        "\xEF": "i",
        "\xF0": "d",
        "\xF1": "n",
        "\xF2": "o",
        "\xF3": "o",
        "\xF4": "o",
        "\xF5": "o",
        "\xF6": "oe",
        "\u0151": "o",
        "\xF8": "o",
        "\xF9": "u",
        "\xFA": "u",
        "\xFB": "u",
        "\xFC": "ue",
        "\u0171": "u",
        "\xFD": "y",
        "\xFE": "th",
        "\xFF": "y",
        "\u1E9E": "SS",
        // language specific
        // Arabic
        "\u0627": "a",
        "\u0623": "a",
        "\u0625": "i",
        "\u0622": "aa",
        "\u0624": "u",
        "\u0626": "e",
        "\u0621": "a",
        "\u0628": "b",
        "\u062A": "t",
        "\u062B": "th",
        "\u062C": "j",
        "\u062D": "h",
        "\u062E": "kh",
        "\u062F": "d",
        "\u0630": "th",
        "\u0631": "r",
        "\u0632": "z",
        "\u0633": "s",
        "\u0634": "sh",
        "\u0635": "s",
        "\u0636": "dh",
        "\u0637": "t",
        "\u0638": "z",
        "\u0639": "a",
        "\u063A": "gh",
        "\u0641": "f",
        "\u0642": "q",
        "\u0643": "k",
        "\u0644": "l",
        "\u0645": "m",
        "\u0646": "n",
        "\u0647": "h",
        "\u0648": "w",
        "\u064A": "y",
        "\u0649": "a",
        "\u0629": "h",
        "\uFEFB": "la",
        "\uFEF7": "laa",
        "\uFEF9": "lai",
        "\uFEF5": "laa",
        // Persian additional characters than Arabic
        "\u06AF": "g",
        "\u0686": "ch",
        "\u067E": "p",
        "\u0698": "zh",
        "\u06A9": "k",
        "\u06CC": "y",
        // Arabic diactrics
        "\u064E": "a",
        "\u064B": "an",
        "\u0650": "e",
        "\u064D": "en",
        "\u064F": "u",
        "\u064C": "on",
        "\u0652": "",
        // Arabic numbers
        "\u0660": "0",
        "\u0661": "1",
        "\u0662": "2",
        "\u0663": "3",
        "\u0664": "4",
        "\u0665": "5",
        "\u0666": "6",
        "\u0667": "7",
        "\u0668": "8",
        "\u0669": "9",
        // Persian numbers
        "\u06F0": "0",
        "\u06F1": "1",
        "\u06F2": "2",
        "\u06F3": "3",
        "\u06F4": "4",
        "\u06F5": "5",
        "\u06F6": "6",
        "\u06F7": "7",
        "\u06F8": "8",
        "\u06F9": "9",
        // Burmese consonants
        "\u1000": "k",
        "\u1001": "kh",
        "\u1002": "g",
        "\u1003": "ga",
        "\u1004": "ng",
        "\u1005": "s",
        "\u1006": "sa",
        "\u1007": "z",
        "\u1005\u103B": "za",
        "\u100A": "ny",
        "\u100B": "t",
        "\u100C": "ta",
        "\u100D": "d",
        "\u100E": "da",
        "\u100F": "na",
        "\u1010": "t",
        "\u1011": "ta",
        "\u1012": "d",
        "\u1013": "da",
        "\u1014": "n",
        "\u1015": "p",
        "\u1016": "pa",
        "\u1017": "b",
        "\u1018": "ba",
        "\u1019": "m",
        "\u101A": "y",
        "\u101B": "ya",
        "\u101C": "l",
        "\u101D": "w",
        "\u101E": "th",
        "\u101F": "h",
        "\u1020": "la",
        "\u1021": "a",
        // consonant character combos
        "\u103C": "y",
        "\u103B": "ya",
        "\u103D": "w",
        "\u103C\u103D": "yw",
        "\u103B\u103D": "ywa",
        "\u103E": "h",
        // independent vowels
        "\u1027": "e",
        "\u104F": "-e",
        "\u1023": "i",
        "\u1024": "-i",
        "\u1009": "u",
        "\u1026": "-u",
        "\u1029": "aw",
        "\u101E\u103C\u1031\u102C": "aw",
        "\u102A": "aw",
        // numbers
        "\u1040": "0",
        "\u1041": "1",
        "\u1042": "2",
        "\u1043": "3",
        "\u1044": "4",
        "\u1045": "5",
        "\u1046": "6",
        "\u1047": "7",
        "\u1048": "8",
        "\u1049": "9",
        // virama and tone marks which are silent in transliteration
        "\u1039": "",
        "\u1037": "",
        "\u1038": "",
        // Czech
        "\u010D": "c",
        "\u010F": "d",
        "\u011B": "e",
        "\u0148": "n",
        "\u0159": "r",
        "\u0161": "s",
        "\u0165": "t",
        "\u016F": "u",
        "\u017E": "z",
        "\u010C": "C",
        "\u010E": "D",
        "\u011A": "E",
        "\u0147": "N",
        "\u0158": "R",
        "\u0160": "S",
        "\u0164": "T",
        "\u016E": "U",
        "\u017D": "Z",
        // Dhivehi
        "\u0780": "h",
        "\u0781": "sh",
        "\u0782": "n",
        "\u0783": "r",
        "\u0784": "b",
        "\u0785": "lh",
        "\u0786": "k",
        "\u0787": "a",
        "\u0788": "v",
        "\u0789": "m",
        "\u078A": "f",
        "\u078B": "dh",
        "\u078C": "th",
        "\u078D": "l",
        "\u078E": "g",
        "\u078F": "gn",
        "\u0790": "s",
        "\u0791": "d",
        "\u0792": "z",
        "\u0793": "t",
        "\u0794": "y",
        "\u0795": "p",
        "\u0796": "j",
        "\u0797": "ch",
        "\u0798": "tt",
        "\u0799": "hh",
        "\u079A": "kh",
        "\u079B": "th",
        "\u079C": "z",
        "\u079D": "sh",
        "\u079E": "s",
        "\u079F": "d",
        "\u07A0": "t",
        "\u07A1": "z",
        "\u07A2": "a",
        "\u07A3": "gh",
        "\u07A4": "q",
        "\u07A5": "w",
        "\u07A6": "a",
        "\u07A7": "aa",
        "\u07A8": "i",
        "\u07A9": "ee",
        "\u07AA": "u",
        "\u07AB": "oo",
        "\u07AC": "e",
        "\u07AD": "ey",
        "\u07AE": "o",
        "\u07AF": "oa",
        "\u07B0": "",
        // Georgian https://en.wikipedia.org/wiki/Romanization_of_Georgian
        // National system (2002)
        "\u10D0": "a",
        "\u10D1": "b",
        "\u10D2": "g",
        "\u10D3": "d",
        "\u10D4": "e",
        "\u10D5": "v",
        "\u10D6": "z",
        "\u10D7": "t",
        "\u10D8": "i",
        "\u10D9": "k",
        "\u10DA": "l",
        "\u10DB": "m",
        "\u10DC": "n",
        "\u10DD": "o",
        "\u10DE": "p",
        "\u10DF": "zh",
        "\u10E0": "r",
        "\u10E1": "s",
        "\u10E2": "t",
        "\u10E3": "u",
        "\u10E4": "p",
        "\u10E5": "k",
        "\u10E6": "gh",
        "\u10E7": "q",
        "\u10E8": "sh",
        "\u10E9": "ch",
        "\u10EA": "ts",
        "\u10EB": "dz",
        "\u10EC": "ts",
        "\u10ED": "ch",
        "\u10EE": "kh",
        "\u10EF": "j",
        "\u10F0": "h",
        // Greek
        "\u03B1": "a",
        "\u03B2": "v",
        "\u03B3": "g",
        "\u03B4": "d",
        "\u03B5": "e",
        "\u03B6": "z",
        "\u03B7": "i",
        "\u03B8": "th",
        "\u03B9": "i",
        "\u03BA": "k",
        "\u03BB": "l",
        "\u03BC": "m",
        "\u03BD": "n",
        "\u03BE": "ks",
        "\u03BF": "o",
        "\u03C0": "p",
        "\u03C1": "r",
        "\u03C3": "s",
        "\u03C4": "t",
        "\u03C5": "y",
        "\u03C6": "f",
        "\u03C7": "x",
        "\u03C8": "ps",
        "\u03C9": "o",
        "\u03AC": "a",
        "\u03AD": "e",
        "\u03AF": "i",
        "\u03CC": "o",
        "\u03CD": "y",
        "\u03AE": "i",
        "\u03CE": "o",
        "\u03C2": "s",
        "\u03CA": "i",
        "\u03B0": "y",
        "\u03CB": "y",
        "\u0390": "i",
        "\u0391": "A",
        "\u0392": "B",
        "\u0393": "G",
        "\u0394": "D",
        "\u0395": "E",
        "\u0396": "Z",
        "\u0397": "I",
        "\u0398": "TH",
        "\u0399": "I",
        "\u039A": "K",
        "\u039B": "L",
        "\u039C": "M",
        "\u039D": "N",
        "\u039E": "KS",
        "\u039F": "O",
        "\u03A0": "P",
        "\u03A1": "R",
        "\u03A3": "S",
        "\u03A4": "T",
        "\u03A5": "Y",
        "\u03A6": "F",
        "\u03A7": "X",
        "\u03A8": "PS",
        "\u03A9": "O",
        "\u0386": "A",
        "\u0388": "E",
        "\u038A": "I",
        "\u038C": "O",
        "\u038E": "Y",
        "\u0389": "I",
        "\u038F": "O",
        "\u03AA": "I",
        "\u03AB": "Y",
        // Latvian
        "\u0101": "a",
        // 'č': 'c', // duplicate
        "\u0113": "e",
        "\u0123": "g",
        "\u012B": "i",
        "\u0137": "k",
        "\u013C": "l",
        "\u0146": "n",
        // 'š': 's', // duplicate
        "\u016B": "u",
        // 'ž': 'z', // duplicate
        "\u0100": "A",
        // 'Č': 'C', // duplicate
        "\u0112": "E",
        "\u0122": "G",
        "\u012A": "I",
        "\u0136": "k",
        "\u013B": "L",
        "\u0145": "N",
        // 'Š': 'S', // duplicate
        "\u016A": "U",
        // 'Ž': 'Z', // duplicate
        // Macedonian
        "\u040C": "Kj",
        "\u045C": "kj",
        "\u0409": "Lj",
        "\u0459": "lj",
        "\u040A": "Nj",
        "\u045A": "nj",
        "\u0422\u0441": "Ts",
        "\u0442\u0441": "ts",
        // Polish
        "\u0105": "a",
        "\u0107": "c",
        "\u0119": "e",
        "\u0142": "l",
        "\u0144": "n",
        // 'ó': 'o', // duplicate
        "\u015B": "s",
        "\u017A": "z",
        "\u017C": "z",
        "\u0104": "A",
        "\u0106": "C",
        "\u0118": "E",
        "\u0141": "L",
        "\u0143": "N",
        "\u015A": "S",
        "\u0179": "Z",
        "\u017B": "Z",
        // Ukranian
        "\u0404": "Ye",
        "\u0406": "I",
        "\u0407": "Yi",
        "\u0490": "G",
        "\u0454": "ye",
        "\u0456": "i",
        "\u0457": "yi",
        "\u0491": "g",
        // Romanian
        "\u0103": "a",
        "\u0102": "A",
        "\u0219": "s",
        "\u0218": "S",
        // 'ş': 's', // duplicate
        // 'Ş': 'S', // duplicate
        "\u021B": "t",
        "\u021A": "T",
        "\u0163": "t",
        "\u0162": "T",
        // Russian https://en.wikipedia.org/wiki/Romanization_of_Russian
        // ICAO
        "\u0430": "a",
        "\u0431": "b",
        "\u0432": "v",
        "\u0433": "g",
        "\u0434": "d",
        "\u0435": "e",
        "\u0451": "yo",
        "\u0436": "zh",
        "\u0437": "z",
        "\u0438": "i",
        "\u0439": "i",
        "\u043A": "k",
        "\u043B": "l",
        "\u043C": "m",
        "\u043D": "n",
        "\u043E": "o",
        "\u043F": "p",
        "\u0440": "r",
        "\u0441": "s",
        "\u0442": "t",
        "\u0443": "u",
        "\u0444": "f",
        "\u0445": "kh",
        "\u0446": "c",
        "\u0447": "ch",
        "\u0448": "sh",
        "\u0449": "sh",
        "\u044A": "",
        "\u044B": "y",
        "\u044C": "",
        "\u044D": "e",
        "\u044E": "yu",
        "\u044F": "ya",
        "\u0410": "A",
        "\u0411": "B",
        "\u0412": "V",
        "\u0413": "G",
        "\u0414": "D",
        "\u0415": "E",
        "\u0401": "Yo",
        "\u0416": "Zh",
        "\u0417": "Z",
        "\u0418": "I",
        "\u0419": "I",
        "\u041A": "K",
        "\u041B": "L",
        "\u041C": "M",
        "\u041D": "N",
        "\u041E": "O",
        "\u041F": "P",
        "\u0420": "R",
        "\u0421": "S",
        "\u0422": "T",
        "\u0423": "U",
        "\u0424": "F",
        "\u0425": "Kh",
        "\u0426": "C",
        "\u0427": "Ch",
        "\u0428": "Sh",
        "\u0429": "Sh",
        "\u042A": "",
        "\u042B": "Y",
        "\u042C": "",
        "\u042D": "E",
        "\u042E": "Yu",
        "\u042F": "Ya",
        // Serbian
        "\u0452": "dj",
        "\u0458": "j",
        // 'љ': 'lj',  // duplicate
        // 'њ': 'nj', // duplicate
        "\u045B": "c",
        "\u045F": "dz",
        "\u0402": "Dj",
        "\u0408": "j",
        // 'Љ': 'Lj', // duplicate
        // 'Њ': 'Nj', // duplicate
        "\u040B": "C",
        "\u040F": "Dz",
        // Slovak
        "\u013E": "l",
        "\u013A": "l",
        "\u0155": "r",
        "\u013D": "L",
        "\u0139": "L",
        "\u0154": "R",
        // Turkish
        "\u015F": "s",
        "\u015E": "S",
        "\u0131": "i",
        "\u0130": "I",
        // 'ç': 'c', // duplicate
        // 'Ç': 'C', // duplicate
        // 'ü': 'u', // duplicate, see langCharMap
        // 'Ü': 'U', // duplicate, see langCharMap
        // 'ö': 'o', // duplicate, see langCharMap
        // 'Ö': 'O', // duplicate, see langCharMap
        "\u011F": "g",
        "\u011E": "G",
        // Vietnamese
        "\u1EA3": "a",
        "\u1EA2": "A",
        "\u1EB3": "a",
        "\u1EB2": "A",
        "\u1EA9": "a",
        "\u1EA8": "A",
        "\u0111": "d",
        "\u0110": "D",
        "\u1EB9": "e",
        "\u1EB8": "E",
        "\u1EBD": "e",
        "\u1EBC": "E",
        "\u1EBB": "e",
        "\u1EBA": "E",
        "\u1EBF": "e",
        "\u1EBE": "E",
        "\u1EC1": "e",
        "\u1EC0": "E",
        "\u1EC7": "e",
        "\u1EC6": "E",
        "\u1EC5": "e",
        "\u1EC4": "E",
        "\u1EC3": "e",
        "\u1EC2": "E",
        "\u1ECF": "o",
        "\u1ECD": "o",
        "\u1ECC": "o",
        "\u1ED1": "o",
        "\u1ED0": "O",
        "\u1ED3": "o",
        "\u1ED2": "O",
        "\u1ED5": "o",
        "\u1ED4": "O",
        "\u1ED9": "o",
        "\u1ED8": "O",
        "\u1ED7": "o",
        "\u1ED6": "O",
        "\u01A1": "o",
        "\u01A0": "O",
        "\u1EDB": "o",
        "\u1EDA": "O",
        "\u1EDD": "o",
        "\u1EDC": "O",
        "\u1EE3": "o",
        "\u1EE2": "O",
        "\u1EE1": "o",
        "\u1EE0": "O",
        "\u1EDE": "o",
        "\u1EDF": "o",
        "\u1ECB": "i",
        "\u1ECA": "I",
        "\u0129": "i",
        "\u0128": "I",
        "\u1EC9": "i",
        "\u1EC8": "i",
        "\u1EE7": "u",
        "\u1EE6": "U",
        "\u1EE5": "u",
        "\u1EE4": "U",
        "\u0169": "u",
        "\u0168": "U",
        "\u01B0": "u",
        "\u01AF": "U",
        "\u1EE9": "u",
        "\u1EE8": "U",
        "\u1EEB": "u",
        "\u1EEA": "U",
        "\u1EF1": "u",
        "\u1EF0": "U",
        "\u1EEF": "u",
        "\u1EEE": "U",
        "\u1EED": "u",
        "\u1EEC": "\u01B0",
        "\u1EF7": "y",
        "\u1EF6": "y",
        "\u1EF3": "y",
        "\u1EF2": "Y",
        "\u1EF5": "y",
        "\u1EF4": "Y",
        "\u1EF9": "y",
        "\u1EF8": "Y",
        "\u1EA1": "a",
        "\u1EA0": "A",
        "\u1EA5": "a",
        "\u1EA4": "A",
        "\u1EA7": "a",
        "\u1EA6": "A",
        "\u1EAD": "a",
        "\u1EAC": "A",
        "\u1EAB": "a",
        "\u1EAA": "A",
        // 'ă': 'a', // duplicate
        // 'Ă': 'A', // duplicate
        "\u1EAF": "a",
        "\u1EAE": "A",
        "\u1EB1": "a",
        "\u1EB0": "A",
        "\u1EB7": "a",
        "\u1EB6": "A",
        "\u1EB5": "a",
        "\u1EB4": "A",
        "\u24EA": "0",
        "\u2460": "1",
        "\u2461": "2",
        "\u2462": "3",
        "\u2463": "4",
        "\u2464": "5",
        "\u2465": "6",
        "\u2466": "7",
        "\u2467": "8",
        "\u2468": "9",
        "\u2469": "10",
        "\u246A": "11",
        "\u246B": "12",
        "\u246C": "13",
        "\u246D": "14",
        "\u246E": "15",
        "\u246F": "16",
        "\u2470": "17",
        "\u2471": "18",
        "\u2472": "18",
        "\u2473": "18",
        "\u24F5": "1",
        "\u24F6": "2",
        "\u24F7": "3",
        "\u24F8": "4",
        "\u24F9": "5",
        "\u24FA": "6",
        "\u24FB": "7",
        "\u24FC": "8",
        "\u24FD": "9",
        "\u24FE": "10",
        "\u24FF": "0",
        "\u24EB": "11",
        "\u24EC": "12",
        "\u24ED": "13",
        "\u24EE": "14",
        "\u24EF": "15",
        "\u24F0": "16",
        "\u24F1": "17",
        "\u24F2": "18",
        "\u24F3": "19",
        "\u24F4": "20",
        "\u24B6": "A",
        "\u24B7": "B",
        "\u24B8": "C",
        "\u24B9": "D",
        "\u24BA": "E",
        "\u24BB": "F",
        "\u24BC": "G",
        "\u24BD": "H",
        "\u24BE": "I",
        "\u24BF": "J",
        "\u24C0": "K",
        "\u24C1": "L",
        "\u24C2": "M",
        "\u24C3": "N",
        "\u24C4": "O",
        "\u24C5": "P",
        "\u24C6": "Q",
        "\u24C7": "R",
        "\u24C8": "S",
        "\u24C9": "T",
        "\u24CA": "U",
        "\u24CB": "V",
        "\u24CC": "W",
        "\u24CD": "X",
        "\u24CE": "Y",
        "\u24CF": "Z",
        "\u24D0": "a",
        "\u24D1": "b",
        "\u24D2": "c",
        "\u24D3": "d",
        "\u24D4": "e",
        "\u24D5": "f",
        "\u24D6": "g",
        "\u24D7": "h",
        "\u24D8": "i",
        "\u24D9": "j",
        "\u24DA": "k",
        "\u24DB": "l",
        "\u24DC": "m",
        "\u24DD": "n",
        "\u24DE": "o",
        "\u24DF": "p",
        "\u24E0": "q",
        "\u24E1": "r",
        "\u24E2": "s",
        "\u24E3": "t",
        "\u24E4": "u",
        "\u24E6": "v",
        "\u24E5": "w",
        "\u24E7": "x",
        "\u24E8": "y",
        "\u24E9": "z",
        // symbols
        "\u201C": '"',
        "\u201D": '"',
        "\u2018": "'",
        "\u2019": "'",
        "\u2202": "d",
        "\u0192": "f",
        "\u2122": "(TM)",
        "\xA9": "(C)",
        "\u0153": "oe",
        "\u0152": "OE",
        "\xAE": "(R)",
        "\u2020": "+",
        "\u2120": "(SM)",
        "\u2026": "...",
        "\u02DA": "o",
        "\xBA": "o",
        "\xAA": "a",
        "\u2022": "*",
        "\u104A": ",",
        "\u104B": ".",
        // currency
        "$": "USD",
        "\u20AC": "EUR",
        "\u20A2": "BRN",
        "\u20A3": "FRF",
        "\xA3": "GBP",
        "\u20A4": "ITL",
        "\u20A6": "NGN",
        "\u20A7": "ESP",
        "\u20A9": "KRW",
        "\u20AA": "ILS",
        "\u20AB": "VND",
        "\u20AD": "LAK",
        "\u20AE": "MNT",
        "\u20AF": "GRD",
        "\u20B1": "ARS",
        "\u20B2": "PYG",
        "\u20B3": "ARA",
        "\u20B4": "UAH",
        "\u20B5": "GHS",
        "\xA2": "cent",
        "\xA5": "CNY",
        "\u5143": "CNY",
        "\u5186": "YEN",
        "\uFDFC": "IRR",
        "\u20A0": "EWE",
        "\u0E3F": "THB",
        "\u20A8": "INR",
        "\u20B9": "INR",
        "\u20B0": "PF",
        "\u20BA": "TRY",
        "\u060B": "AFN",
        "\u20BC": "AZN",
        "\u043B\u0432": "BGN",
        "\u17DB": "KHR",
        "\u20A1": "CRC",
        "\u20B8": "KZT",
        "\u0434\u0435\u043D": "MKD",
        "z\u0142": "PLN",
        "\u20BD": "RUB",
        "\u20BE": "GEL"
      };
      var lookAheadCharArray = [
        // burmese
        "\u103A",
        // Dhivehi
        "\u07B0"
      ];
      var diatricMap = {
        // Burmese
        // dependent vowels
        "\u102C": "a",
        "\u102B": "a",
        "\u1031": "e",
        "\u1032": "e",
        "\u102D": "i",
        "\u102E": "i",
        "\u102D\u102F": "o",
        "\u102F": "u",
        "\u1030": "u",
        "\u1031\u102B\u1004\u103A": "aung",
        "\u1031\u102C": "aw",
        "\u1031\u102C\u103A": "aw",
        "\u1031\u102B": "aw",
        "\u1031\u102B\u103A": "aw",
        "\u103A": "\u103A",
        // this is special case but the character will be converted to latin in the code
        "\u1000\u103A": "et",
        "\u102D\u102F\u1000\u103A": "aik",
        "\u1031\u102C\u1000\u103A": "auk",
        "\u1004\u103A": "in",
        "\u102D\u102F\u1004\u103A": "aing",
        "\u1031\u102C\u1004\u103A": "aung",
        "\u1005\u103A": "it",
        "\u100A\u103A": "i",
        "\u1010\u103A": "at",
        "\u102D\u1010\u103A": "eik",
        "\u102F\u1010\u103A": "ok",
        "\u103D\u1010\u103A": "ut",
        "\u1031\u1010\u103A": "it",
        "\u1012\u103A": "d",
        "\u102D\u102F\u1012\u103A": "ok",
        "\u102F\u1012\u103A": "ait",
        "\u1014\u103A": "an",
        "\u102C\u1014\u103A": "an",
        "\u102D\u1014\u103A": "ein",
        "\u102F\u1014\u103A": "on",
        "\u103D\u1014\u103A": "un",
        "\u1015\u103A": "at",
        "\u102D\u1015\u103A": "eik",
        "\u102F\u1015\u103A": "ok",
        "\u103D\u1015\u103A": "ut",
        "\u1014\u103A\u102F\u1015\u103A": "nub",
        "\u1019\u103A": "an",
        "\u102D\u1019\u103A": "ein",
        "\u102F\u1019\u103A": "on",
        "\u103D\u1019\u103A": "un",
        "\u101A\u103A": "e",
        "\u102D\u102F\u101C\u103A": "ol",
        "\u1009\u103A": "in",
        "\u1036": "an",
        "\u102D\u1036": "ein",
        "\u102F\u1036": "on",
        // Dhivehi
        "\u07A6\u0787\u07B0": "ah",
        "\u07A6\u0781\u07B0": "ah"
      };
      var langCharMap = {
        "en": {},
        // default language
        "az": {
          // Azerbaijani
          "\xE7": "c",
          "\u0259": "e",
          "\u011F": "g",
          "\u0131": "i",
          "\xF6": "o",
          "\u015F": "s",
          "\xFC": "u",
          "\xC7": "C",
          "\u018F": "E",
          "\u011E": "G",
          "\u0130": "I",
          "\xD6": "O",
          "\u015E": "S",
          "\xDC": "U"
        },
        "cs": {
          // Czech
          "\u010D": "c",
          "\u010F": "d",
          "\u011B": "e",
          "\u0148": "n",
          "\u0159": "r",
          "\u0161": "s",
          "\u0165": "t",
          "\u016F": "u",
          "\u017E": "z",
          "\u010C": "C",
          "\u010E": "D",
          "\u011A": "E",
          "\u0147": "N",
          "\u0158": "R",
          "\u0160": "S",
          "\u0164": "T",
          "\u016E": "U",
          "\u017D": "Z"
        },
        "fi": {
          // Finnish
          // 'å': 'a', duplicate see charMap/latin
          // 'Å': 'A', duplicate see charMap/latin
          "\xE4": "a",
          // ok
          "\xC4": "A",
          // ok
          "\xF6": "o",
          // ok
          "\xD6": "O"
          // ok
        },
        "hu": {
          // Hungarian
          "\xE4": "a",
          // ok
          "\xC4": "A",
          // ok
          // 'á': 'a', duplicate see charMap/latin
          // 'Á': 'A', duplicate see charMap/latin
          "\xF6": "o",
          // ok
          "\xD6": "O",
          // ok
          // 'ő': 'o', duplicate see charMap/latin
          // 'Ő': 'O', duplicate see charMap/latin
          "\xFC": "u",
          "\xDC": "U",
          "\u0171": "u",
          "\u0170": "U"
        },
        "lt": {
          // Lithuanian
          "\u0105": "a",
          "\u010D": "c",
          "\u0119": "e",
          "\u0117": "e",
          "\u012F": "i",
          "\u0161": "s",
          "\u0173": "u",
          "\u016B": "u",
          "\u017E": "z",
          "\u0104": "A",
          "\u010C": "C",
          "\u0118": "E",
          "\u0116": "E",
          "\u012E": "I",
          "\u0160": "S",
          "\u0172": "U",
          "\u016A": "U"
        },
        "lv": {
          // Latvian
          "\u0101": "a",
          "\u010D": "c",
          "\u0113": "e",
          "\u0123": "g",
          "\u012B": "i",
          "\u0137": "k",
          "\u013C": "l",
          "\u0146": "n",
          "\u0161": "s",
          "\u016B": "u",
          "\u017E": "z",
          "\u0100": "A",
          "\u010C": "C",
          "\u0112": "E",
          "\u0122": "G",
          "\u012A": "i",
          "\u0136": "k",
          "\u013B": "L",
          "\u0145": "N",
          "\u0160": "S",
          "\u016A": "u",
          "\u017D": "Z"
        },
        "pl": {
          // Polish
          "\u0105": "a",
          "\u0107": "c",
          "\u0119": "e",
          "\u0142": "l",
          "\u0144": "n",
          "\xF3": "o",
          "\u015B": "s",
          "\u017A": "z",
          "\u017C": "z",
          "\u0104": "A",
          "\u0106": "C",
          "\u0118": "e",
          "\u0141": "L",
          "\u0143": "N",
          "\xD3": "O",
          "\u015A": "S",
          "\u0179": "Z",
          "\u017B": "Z"
        },
        "sv": {
          // Swedish
          // 'å': 'a', duplicate see charMap/latin
          // 'Å': 'A', duplicate see charMap/latin
          "\xE4": "a",
          // ok
          "\xC4": "A",
          // ok
          "\xF6": "o",
          // ok
          "\xD6": "O"
          // ok
        },
        "sk": {
          // Slovak
          "\xE4": "a",
          "\xC4": "A"
        },
        "sr": {
          // Serbian
          "\u0459": "lj",
          "\u045A": "nj",
          "\u0409": "Lj",
          "\u040A": "Nj",
          "\u0111": "dj",
          "\u0110": "Dj"
        },
        "tr": {
          // Turkish
          "\xDC": "U",
          "\xD6": "O",
          "\xFC": "u",
          "\xF6": "o"
        }
      };
      var symbolMap = {
        "ar": {
          "\u2206": "delta",
          "\u221E": "la-nihaya",
          "\u2665": "hob",
          "&": "wa",
          "|": "aw",
          "<": "aqal-men",
          ">": "akbar-men",
          "\u2211": "majmou",
          "\xA4": "omla"
        },
        "az": {},
        "ca": {
          "\u2206": "delta",
          "\u221E": "infinit",
          "\u2665": "amor",
          "&": "i",
          "|": "o",
          "<": "menys que",
          ">": "mes que",
          "\u2211": "suma dels",
          "\xA4": "moneda"
        },
        "cs": {
          "\u2206": "delta",
          "\u221E": "nekonecno",
          "\u2665": "laska",
          "&": "a",
          "|": "nebo",
          "<": "mensi nez",
          ">": "vetsi nez",
          "\u2211": "soucet",
          "\xA4": "mena"
        },
        "de": {
          "\u2206": "delta",
          "\u221E": "unendlich",
          "\u2665": "Liebe",
          "&": "und",
          "|": "oder",
          "<": "kleiner als",
          ">": "groesser als",
          "\u2211": "Summe von",
          "\xA4": "Waehrung"
        },
        "dv": {
          "\u2206": "delta",
          "\u221E": "kolunulaa",
          "\u2665": "loabi",
          "&": "aai",
          "|": "noonee",
          "<": "ah vure kuda",
          ">": "ah vure bodu",
          "\u2211": "jumula",
          "\xA4": "faisaa"
        },
        "en": {
          "\u2206": "delta",
          "\u221E": "infinity",
          "\u2665": "love",
          "&": "and",
          "|": "or",
          "<": "less than",
          ">": "greater than",
          "\u2211": "sum",
          "\xA4": "currency"
        },
        "es": {
          "\u2206": "delta",
          "\u221E": "infinito",
          "\u2665": "amor",
          "&": "y",
          "|": "u",
          "<": "menos que",
          ">": "mas que",
          "\u2211": "suma de los",
          "\xA4": "moneda"
        },
        "fa": {
          "\u2206": "delta",
          "\u221E": "bi-nahayat",
          "\u2665": "eshgh",
          "&": "va",
          "|": "ya",
          "<": "kamtar-az",
          ">": "bishtar-az",
          "\u2211": "majmooe",
          "\xA4": "vahed"
        },
        "fi": {
          "\u2206": "delta",
          "\u221E": "aarettomyys",
          "\u2665": "rakkaus",
          "&": "ja",
          "|": "tai",
          "<": "pienempi kuin",
          ">": "suurempi kuin",
          "\u2211": "summa",
          "\xA4": "valuutta"
        },
        "fr": {
          "\u2206": "delta",
          "\u221E": "infiniment",
          "\u2665": "Amour",
          "&": "et",
          "|": "ou",
          "<": "moins que",
          ">": "superieure a",
          "\u2211": "somme des",
          "\xA4": "monnaie"
        },
        "ge": {
          "\u2206": "delta",
          "\u221E": "usasruloba",
          "\u2665": "siqvaruli",
          "&": "da",
          "|": "an",
          "<": "naklebi",
          ">": "meti",
          "\u2211": "jami",
          "\xA4": "valuta"
        },
        "gr": {},
        "hu": {
          "\u2206": "delta",
          "\u221E": "vegtelen",
          "\u2665": "szerelem",
          "&": "es",
          "|": "vagy",
          "<": "kisebb mint",
          ">": "nagyobb mint",
          "\u2211": "szumma",
          "\xA4": "penznem"
        },
        "it": {
          "\u2206": "delta",
          "\u221E": "infinito",
          "\u2665": "amore",
          "&": "e",
          "|": "o",
          "<": "minore di",
          ">": "maggiore di",
          "\u2211": "somma",
          "\xA4": "moneta"
        },
        "lt": {
          "\u2206": "delta",
          "\u221E": "begalybe",
          "\u2665": "meile",
          "&": "ir",
          "|": "ar",
          "<": "maziau nei",
          ">": "daugiau nei",
          "\u2211": "suma",
          "\xA4": "valiuta"
        },
        "lv": {
          "\u2206": "delta",
          "\u221E": "bezgaliba",
          "\u2665": "milestiba",
          "&": "un",
          "|": "vai",
          "<": "mazak neka",
          ">": "lielaks neka",
          "\u2211": "summa",
          "\xA4": "valuta"
        },
        "my": {
          "\u2206": "kwahkhyaet",
          "\u221E": "asaonasme",
          "\u2665": "akhyait",
          "&": "nhin",
          "|": "tho",
          "<": "ngethaw",
          ">": "kyithaw",
          "\u2211": "paungld",
          "\xA4": "ngwekye"
        },
        "mk": {},
        "nl": {
          "\u2206": "delta",
          "\u221E": "oneindig",
          "\u2665": "liefde",
          "&": "en",
          "|": "of",
          "<": "kleiner dan",
          ">": "groter dan",
          "\u2211": "som",
          "\xA4": "valuta"
        },
        "pl": {
          "\u2206": "delta",
          "\u221E": "nieskonczonosc",
          "\u2665": "milosc",
          "&": "i",
          "|": "lub",
          "<": "mniejsze niz",
          ">": "wieksze niz",
          "\u2211": "suma",
          "\xA4": "waluta"
        },
        "pt": {
          "\u2206": "delta",
          "\u221E": "infinito",
          "\u2665": "amor",
          "&": "e",
          "|": "ou",
          "<": "menor que",
          ">": "maior que",
          "\u2211": "soma",
          "\xA4": "moeda"
        },
        "ro": {
          "\u2206": "delta",
          "\u221E": "infinit",
          "\u2665": "dragoste",
          "&": "si",
          "|": "sau",
          "<": "mai mic ca",
          ">": "mai mare ca",
          "\u2211": "suma",
          "\xA4": "valuta"
        },
        "ru": {
          "\u2206": "delta",
          "\u221E": "beskonechno",
          "\u2665": "lubov",
          "&": "i",
          "|": "ili",
          "<": "menshe",
          ">": "bolshe",
          "\u2211": "summa",
          "\xA4": "valjuta"
        },
        "sk": {
          "\u2206": "delta",
          "\u221E": "nekonecno",
          "\u2665": "laska",
          "&": "a",
          "|": "alebo",
          "<": "menej ako",
          ">": "viac ako",
          "\u2211": "sucet",
          "\xA4": "mena"
        },
        "sr": {},
        "tr": {
          "\u2206": "delta",
          "\u221E": "sonsuzluk",
          "\u2665": "ask",
          "&": "ve",
          "|": "veya",
          "<": "kucuktur",
          ">": "buyuktur",
          "\u2211": "toplam",
          "\xA4": "para birimi"
        },
        "uk": {
          "\u2206": "delta",
          "\u221E": "bezkinechnist",
          "\u2665": "lubov",
          "&": "i",
          "|": "abo",
          "<": "menshe",
          ">": "bilshe",
          "\u2211": "suma",
          "\xA4": "valjuta"
        },
        "vn": {
          "\u2206": "delta",
          "\u221E": "vo cuc",
          "\u2665": "yeu",
          "&": "va",
          "|": "hoac",
          "<": "nho hon",
          ">": "lon hon",
          "\u2211": "tong",
          "\xA4": "tien te"
        }
      };
      var uricChars = [";", "?", ":", "@", "&", "=", "+", "$", ",", "/"].join("");
      var uricNoSlashChars = [";", "?", ":", "@", "&", "=", "+", "$", ","].join("");
      var markChars = [".", "!", "~", "*", "'", "(", ")"].join("");
      var getSlug = function getSlug2(input, opts) {
        var separator = "-";
        var result = "";
        var diatricString = "";
        var convertSymbols = true;
        var customReplacements = {};
        var maintainCase;
        var titleCase;
        var truncate;
        var uricFlag;
        var uricNoSlashFlag;
        var markFlag;
        var symbol;
        var langChar;
        var lucky;
        var i;
        var ch;
        var l;
        var lastCharWasSymbol;
        var lastCharWasDiatric;
        var allowedChars = "";
        if (typeof input !== "string") {
          return "";
        }
        if (typeof opts === "string") {
          separator = opts;
        }
        symbol = symbolMap.en;
        langChar = langCharMap.en;
        if (typeof opts === "object") {
          maintainCase = opts.maintainCase || false;
          customReplacements = opts.custom && typeof opts.custom === "object" ? opts.custom : customReplacements;
          truncate = +opts.truncate > 1 && opts.truncate || false;
          uricFlag = opts.uric || false;
          uricNoSlashFlag = opts.uricNoSlash || false;
          markFlag = opts.mark || false;
          convertSymbols = opts.symbols === false || opts.lang === false ? false : true;
          separator = opts.separator || separator;
          if (uricFlag) {
            allowedChars += uricChars;
          }
          if (uricNoSlashFlag) {
            allowedChars += uricNoSlashChars;
          }
          if (markFlag) {
            allowedChars += markChars;
          }
          symbol = opts.lang && symbolMap[opts.lang] && convertSymbols ? symbolMap[opts.lang] : convertSymbols ? symbolMap.en : {};
          langChar = opts.lang && langCharMap[opts.lang] ? langCharMap[opts.lang] : opts.lang === false || opts.lang === true ? {} : langCharMap.en;
          if (opts.titleCase && typeof opts.titleCase.length === "number" && Array.prototype.toString.call(opts.titleCase)) {
            opts.titleCase.forEach(function(v) {
              customReplacements[v + ""] = v + "";
            });
            titleCase = true;
          } else {
            titleCase = !!opts.titleCase;
          }
          if (opts.custom && typeof opts.custom.length === "number" && Array.prototype.toString.call(opts.custom)) {
            opts.custom.forEach(function(v) {
              customReplacements[v + ""] = v + "";
            });
          }
          Object.keys(customReplacements).forEach(function(v) {
            var r;
            if (v.length > 1) {
              r = new RegExp("\\b" + escapeChars(v) + "\\b", "gi");
            } else {
              r = new RegExp(escapeChars(v), "gi");
            }
            input = input.replace(r, customReplacements[v]);
          });
          for (ch in customReplacements) {
            allowedChars += ch;
          }
        }
        allowedChars += separator;
        allowedChars = escapeChars(allowedChars);
        input = input.replace(/(^\s+|\s+$)/g, "");
        lastCharWasSymbol = false;
        lastCharWasDiatric = false;
        for (i = 0, l = input.length; i < l; i++) {
          ch = input[i];
          if (isReplacedCustomChar(ch, customReplacements)) {
            lastCharWasSymbol = false;
          } else if (langChar[ch]) {
            ch = lastCharWasSymbol && langChar[ch].match(/[A-Za-z0-9]/) ? " " + langChar[ch] : langChar[ch];
            lastCharWasSymbol = false;
          } else if (ch in charMap) {
            if (i + 1 < l && lookAheadCharArray.indexOf(input[i + 1]) >= 0) {
              diatricString += ch;
              ch = "";
            } else if (lastCharWasDiatric === true) {
              ch = diatricMap[diatricString] + charMap[ch];
              diatricString = "";
            } else {
              ch = lastCharWasSymbol && charMap[ch].match(/[A-Za-z0-9]/) ? " " + charMap[ch] : charMap[ch];
            }
            lastCharWasSymbol = false;
            lastCharWasDiatric = false;
          } else if (ch in diatricMap) {
            diatricString += ch;
            ch = "";
            if (i === l - 1) {
              ch = diatricMap[diatricString];
            }
            lastCharWasDiatric = true;
          } else if (
            // process symbol chars
            symbol[ch] && !(uricFlag && uricChars.indexOf(ch) !== -1) && !(uricNoSlashFlag && uricNoSlashChars.indexOf(ch) !== -1)
          ) {
            ch = lastCharWasSymbol || result.substr(-1).match(/[A-Za-z0-9]/) ? separator + symbol[ch] : symbol[ch];
            ch += input[i + 1] !== void 0 && input[i + 1].match(/[A-Za-z0-9]/) ? separator : "";
            lastCharWasSymbol = true;
          } else {
            if (lastCharWasDiatric === true) {
              ch = diatricMap[diatricString] + ch;
              diatricString = "";
              lastCharWasDiatric = false;
            } else if (lastCharWasSymbol && (/[A-Za-z0-9]/.test(ch) || result.substr(-1).match(/A-Za-z0-9]/))) {
              ch = " " + ch;
            }
            lastCharWasSymbol = false;
          }
          result += ch.replace(new RegExp("[^\\w\\s" + allowedChars + "_-]", "g"), separator);
        }
        if (titleCase) {
          result = result.replace(/(\w)(\S*)/g, function(_, i2, r) {
            var j = i2.toUpperCase() + (r !== null ? r : "");
            return Object.keys(customReplacements).indexOf(j.toLowerCase()) < 0 ? j : j.toLowerCase();
          });
        }
        result = result.replace(/\s+/g, separator).replace(new RegExp("\\" + separator + "+", "g"), separator).replace(new RegExp("(^\\" + separator + "+|\\" + separator + "+$)", "g"), "");
        if (truncate && result.length > truncate) {
          lucky = result.charAt(truncate) === separator;
          result = result.slice(0, truncate);
          if (!lucky) {
            result = result.slice(0, result.lastIndexOf(separator));
          }
        }
        if (!maintainCase && !titleCase) {
          result = result.toLowerCase();
        }
        return result;
      };
      var createSlug = function createSlug2(opts) {
        return function getSlugWithConfig(input) {
          return getSlug(input, opts);
        };
      };
      var escapeChars = function escapeChars2(input) {
        return input.replace(/[-\\^$*+?.()|[\]{}\/]/g, "\\$&");
      };
      var isReplacedCustomChar = function(ch, customReplacements) {
        for (var c in customReplacements) {
          if (customReplacements[c] === ch) {
            return true;
          }
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = getSlug;
        module.exports.createSlug = createSlug;
      } else if (typeof define !== "undefined" && define.amd) {
        define([], function() {
          return getSlug;
        });
      } else {
        try {
          if (root.getSlug || root.createSlug) {
            throw "speakingurl: globals exists /(getSlug|createSlug)/";
          } else {
            root.getSlug = getSlug;
            root.createSlug = createSlug;
          }
        } catch (e) {
        }
      }
    })(exports$1);
  }
});

// ../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/index.js
var require_speakingurl2 = __commonJS({
  "../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/index.js"(exports$1, module) {
    "use strict";
    init_esm_shims();
    module.exports = require_speakingurl();
  }
});

// src/index.ts
init_esm_shims();

// src/core/index.ts
init_esm_shims();

// src/compat/index.ts
init_esm_shims();
function onLegacyDevToolsPluginApiAvailable(cb) {
  if (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__) {
    cb();
    return;
  }
  Object.defineProperty(target, "__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__", {
    set(value) {
      if (value)
        cb();
    },
    configurable: true
  });
}

// src/ctx/index.ts
init_esm_shims();

// src/ctx/api.ts
init_esm_shims();

// src/core/component-highlighter/index.ts
init_esm_shims();

// src/core/component/state/bounding-rect.ts
init_esm_shims();

// src/core/component/utils/index.ts
init_esm_shims();
function getComponentTypeName(options) {
  var _a25;
  const name = options.name || options._componentTag || options.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ || options.__name;
  if (name === "index" && ((_a25 = options.__file) == null ? void 0 : _a25.endsWith("index.vue"))) {
    return "";
  }
  return name;
}
function getComponentFileName(options) {
  const file = options.__file;
  if (file)
    return classify(basename(file, ".vue"));
}
function getComponentName(options) {
  const name = options.displayName || options.name || options._componentTag;
  if (name)
    return name;
  return getComponentFileName(options);
}
function saveComponentGussedName(instance, name) {
  instance.type.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ = name;
  return name;
}
function getAppRecord(instance) {
  if (instance.__VUE_DEVTOOLS_NEXT_APP_RECORD__)
    return instance.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
  else if (instance.root)
    return instance.appContext.app.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
}
async function getComponentId(options) {
  const { app, uid, instance } = options;
  try {
    if (instance.__VUE_DEVTOOLS_NEXT_UID__)
      return instance.__VUE_DEVTOOLS_NEXT_UID__;
    const appRecord = await getAppRecord(app);
    if (!appRecord)
      return null;
    const isRoot = appRecord.rootInstance === instance;
    return `${appRecord.id}:${isRoot ? "root" : uid}`;
  } catch (e) {
  }
}
function isFragment(instance) {
  var _a25, _b25;
  const subTreeType = (_a25 = instance.subTree) == null ? void 0 : _a25.type;
  const appRecord = getAppRecord(instance);
  if (appRecord) {
    return ((_b25 = appRecord == null ? void 0 : appRecord.types) == null ? void 0 : _b25.Fragment) === subTreeType;
  }
  return false;
}
function isBeingDestroyed(instance) {
  return instance._isBeingDestroyed || instance.isUnmounted;
}
function getInstanceName(instance) {
  var _a25, _b25, _c;
  const name = getComponentTypeName((instance == null ? void 0 : instance.type) || {});
  if (name)
    return name;
  if ((instance == null ? void 0 : instance.root) === instance)
    return "Root";
  for (const key in (_b25 = (_a25 = instance.parent) == null ? void 0 : _a25.type) == null ? void 0 : _b25.components) {
    if (instance.parent.type.components[key] === (instance == null ? void 0 : instance.type))
      return saveComponentGussedName(instance, key);
  }
  for (const key in (_c = instance.appContext) == null ? void 0 : _c.components) {
    if (instance.appContext.components[key] === (instance == null ? void 0 : instance.type))
      return saveComponentGussedName(instance, key);
  }
  const fileName = getComponentFileName((instance == null ? void 0 : instance.type) || {});
  if (fileName)
    return fileName;
  return "Anonymous Component";
}
function getUniqueComponentId(instance) {
  var _a25, _b25, _c;
  const appId = (_c = (_b25 = (_a25 = instance == null ? void 0 : instance.appContext) == null ? void 0 : _a25.app) == null ? void 0 : _b25.__VUE_DEVTOOLS_NEXT_APP_RECORD_ID__) != null ? _c : 0;
  const instanceId = instance === (instance == null ? void 0 : instance.root) ? "root" : instance.uid;
  return `${appId}:${instanceId}`;
}
function getRenderKey(value) {
  if (value == null)
    return "";
  if (typeof value === "number")
    return value;
  else if (typeof value === "string")
    return `'${value}'`;
  else if (Array.isArray(value))
    return "Array";
  else
    return "Object";
}
function returnError(cb) {
  try {
    return cb();
  } catch (e) {
    return e;
  }
}
function getComponentInstance(appRecord, instanceId) {
  instanceId = instanceId || `${appRecord.id}:root`;
  const instance = appRecord.instanceMap.get(instanceId);
  return instance || appRecord.instanceMap.get(":root");
}
function ensurePropertyExists(obj, key, skipObjCheck = false) {
  return skipObjCheck ? key in obj : typeof obj === "object" && obj !== null ? key in obj : false;
}

// src/core/component/state/bounding-rect.ts
function createRect() {
  const rect = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    get width() {
      return rect.right - rect.left;
    },
    get height() {
      return rect.bottom - rect.top;
    }
  };
  return rect;
}
var range;
function getTextRect(node) {
  if (!range)
    range = document.createRange();
  range.selectNode(node);
  return range.getBoundingClientRect();
}
function getFragmentRect(vnode) {
  const rect = createRect();
  if (!vnode.children)
    return rect;
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    const childVnode = vnode.children[i];
    let childRect;
    if (childVnode.component) {
      childRect = getComponentBoundingRect(childVnode.component);
    } else if (childVnode.el) {
      const el = childVnode.el;
      if (el.nodeType === 1 || el.getBoundingClientRect)
        childRect = el.getBoundingClientRect();
      else if (el.nodeType === 3 && el.data.trim())
        childRect = getTextRect(el);
    }
    if (childRect)
      mergeRects(rect, childRect);
  }
  return rect;
}
function mergeRects(a, b) {
  if (!a.top || b.top < a.top)
    a.top = b.top;
  if (!a.bottom || b.bottom > a.bottom)
    a.bottom = b.bottom;
  if (!a.left || b.left < a.left)
    a.left = b.left;
  if (!a.right || b.right > a.right)
    a.right = b.right;
  return a;
}
var DEFAULT_RECT = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0
};
function getComponentBoundingRect(instance) {
  const el = instance.subTree.el;
  if (typeof window === "undefined") {
    return DEFAULT_RECT;
  }
  if (isFragment(instance))
    return getFragmentRect(instance.subTree);
  else if ((el == null ? void 0 : el.nodeType) === 1)
    return el == null ? void 0 : el.getBoundingClientRect();
  else if (instance.subTree.component)
    return getComponentBoundingRect(instance.subTree.component);
  else
    return DEFAULT_RECT;
}

// src/core/component/tree/el.ts
init_esm_shims();
function getRootElementsFromComponentInstance(instance) {
  if (isFragment(instance))
    return getFragmentRootElements(instance.subTree);
  if (!instance.subTree)
    return [];
  return [instance.subTree.el];
}
function getFragmentRootElements(vnode) {
  if (!vnode.children)
    return [];
  const list = [];
  vnode.children.forEach((childVnode) => {
    if (childVnode.component)
      list.push(...getRootElementsFromComponentInstance(childVnode.component));
    else if (childVnode == null ? void 0 : childVnode.el)
      list.push(childVnode.el);
  });
  return list;
}

// src/core/component-highlighter/index.ts
var CONTAINER_ELEMENT_ID = "__vue-devtools-component-inspector__";
var CARD_ELEMENT_ID = "__vue-devtools-component-inspector__card__";
var COMPONENT_NAME_ELEMENT_ID = "__vue-devtools-component-inspector__name__";
var INDICATOR_ELEMENT_ID = "__vue-devtools-component-inspector__indicator__";
var containerStyles = {
  display: "block",
  zIndex: 2147483640,
  position: "fixed",
  backgroundColor: "#42b88325",
  border: "1px solid #42b88350",
  borderRadius: "5px",
  transition: "all 0.1s ease-in",
  pointerEvents: "none"
};
var cardStyles = {
  fontFamily: "Arial, Helvetica, sans-serif",
  padding: "5px 8px",
  borderRadius: "4px",
  textAlign: "left",
  position: "absolute",
  left: 0,
  color: "#e9e9e9",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "24px",
  backgroundColor: "#42b883",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
};
var indicatorStyles = {
  display: "inline-block",
  fontWeight: 400,
  fontStyle: "normal",
  fontSize: "12px",
  opacity: 0.7
};
function getContainerElement() {
  return document.getElementById(CONTAINER_ELEMENT_ID);
}
function getCardElement() {
  return document.getElementById(CARD_ELEMENT_ID);
}
function getIndicatorElement() {
  return document.getElementById(INDICATOR_ELEMENT_ID);
}
function getNameElement() {
  return document.getElementById(COMPONENT_NAME_ELEMENT_ID);
}
function getStyles(bounds) {
  return {
    left: `${Math.round(bounds.left * 100) / 100}px`,
    top: `${Math.round(bounds.top * 100) / 100}px`,
    width: `${Math.round(bounds.width * 100) / 100}px`,
    height: `${Math.round(bounds.height * 100) / 100}px`
  };
}
function create(options) {
  var _a25;
  const containerEl = document.createElement("div");
  containerEl.id = (_a25 = options.elementId) != null ? _a25 : CONTAINER_ELEMENT_ID;
  Object.assign(containerEl.style, {
    ...containerStyles,
    ...getStyles(options.bounds),
    ...options.style
  });
  const cardEl = document.createElement("span");
  cardEl.id = CARD_ELEMENT_ID;
  Object.assign(cardEl.style, {
    ...cardStyles,
    top: options.bounds.top < 35 ? 0 : "-35px"
  });
  const nameEl = document.createElement("span");
  nameEl.id = COMPONENT_NAME_ELEMENT_ID;
  nameEl.innerHTML = `&lt;${options.name}&gt;&nbsp;&nbsp;`;
  const indicatorEl = document.createElement("i");
  indicatorEl.id = INDICATOR_ELEMENT_ID;
  indicatorEl.innerHTML = `${Math.round(options.bounds.width * 100) / 100} x ${Math.round(options.bounds.height * 100) / 100}`;
  Object.assign(indicatorEl.style, indicatorStyles);
  cardEl.appendChild(nameEl);
  cardEl.appendChild(indicatorEl);
  containerEl.appendChild(cardEl);
  document.body.appendChild(containerEl);
  return containerEl;
}
function update(options) {
  const containerEl = getContainerElement();
  const cardEl = getCardElement();
  const nameEl = getNameElement();
  const indicatorEl = getIndicatorElement();
  if (containerEl) {
    Object.assign(containerEl.style, {
      ...containerStyles,
      ...getStyles(options.bounds)
    });
    Object.assign(cardEl.style, {
      top: options.bounds.top < 35 ? 0 : "-35px"
    });
    nameEl.innerHTML = `&lt;${options.name}&gt;&nbsp;&nbsp;`;
    indicatorEl.innerHTML = `${Math.round(options.bounds.width * 100) / 100} x ${Math.round(options.bounds.height * 100) / 100}`;
  }
}
function highlight(instance) {
  const bounds = getComponentBoundingRect(instance);
  if (!bounds.width && !bounds.height)
    return;
  const name = getInstanceName(instance);
  const container = getContainerElement();
  container ? update({ bounds, name }) : create({ bounds, name });
}
function unhighlight() {
  const el = getContainerElement();
  if (el)
    el.style.display = "none";
}
var inspectInstance = null;
function inspectFn(e) {
  const target22 = e.target;
  if (target22) {
    const instance = target22.__vueParentComponent;
    if (instance) {
      inspectInstance = instance;
      const el = instance.vnode.el;
      if (el) {
        const bounds = getComponentBoundingRect(instance);
        const name = getInstanceName(instance);
        const container = getContainerElement();
        container ? update({ bounds, name }) : create({ bounds, name });
      }
    }
  }
}
function selectComponentFn(e, cb) {
  e.preventDefault();
  e.stopPropagation();
  if (inspectInstance) {
    const uniqueComponentId = getUniqueComponentId(inspectInstance);
    cb(uniqueComponentId);
  }
}
var inspectComponentHighLighterSelectFn = null;
function cancelInspectComponentHighLighter() {
  unhighlight();
  window.removeEventListener("mouseover", inspectFn);
  window.removeEventListener("click", inspectComponentHighLighterSelectFn, true);
  inspectComponentHighLighterSelectFn = null;
}
function inspectComponentHighLighter() {
  window.addEventListener("mouseover", inspectFn);
  return new Promise((resolve) => {
    function onSelect(e) {
      e.preventDefault();
      e.stopPropagation();
      selectComponentFn(e, (id) => {
        window.removeEventListener("click", onSelect, true);
        inspectComponentHighLighterSelectFn = null;
        window.removeEventListener("mouseover", inspectFn);
        const el = getContainerElement();
        if (el)
          el.style.display = "none";
        resolve(JSON.stringify({ id }));
      });
    }
    inspectComponentHighLighterSelectFn = onSelect;
    window.addEventListener("click", onSelect, true);
  });
}
function scrollToComponent(options) {
  const instance = getComponentInstance(activeAppRecord.value, options.id);
  if (instance) {
    const [el] = getRootElementsFromComponentInstance(instance);
    if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({
        behavior: "smooth"
      });
    } else {
      const bounds = getComponentBoundingRect(instance);
      const scrollTarget = document.createElement("div");
      const styles = {
        ...getStyles(bounds),
        position: "absolute"
      };
      Object.assign(scrollTarget.style, styles);
      document.body.appendChild(scrollTarget);
      scrollTarget.scrollIntoView({
        behavior: "smooth"
      });
      setTimeout(() => {
        document.body.removeChild(scrollTarget);
      }, 2e3);
    }
    setTimeout(() => {
      const bounds = getComponentBoundingRect(instance);
      if (bounds.width || bounds.height) {
        const name = getInstanceName(instance);
        const el2 = getContainerElement();
        el2 ? update({ ...options, name, bounds }) : create({ ...options, name, bounds });
        setTimeout(() => {
          if (el2)
            el2.style.display = "none";
        }, 1500);
      }
    }, 1200);
  }
}

// src/core/component-inspector/index.ts
init_esm_shims();
var _a, _b;
(_b = (_a = target).__VUE_DEVTOOLS_COMPONENT_INSPECTOR_ENABLED__) != null ? _b : _a.__VUE_DEVTOOLS_COMPONENT_INSPECTOR_ENABLED__ = true;
function toggleComponentInspectorEnabled(enabled) {
  target.__VUE_DEVTOOLS_COMPONENT_INSPECTOR_ENABLED__ = enabled;
}
function waitForInspectorInit(cb) {
  let total = 0;
  const timer = setInterval(() => {
    if (target.__VUE_INSPECTOR__) {
      clearInterval(timer);
      total += 30;
      cb();
    }
    if (total >= /* 5s */
    5e3)
      clearInterval(timer);
  }, 30);
}
function setupInspector() {
  const inspector = target.__VUE_INSPECTOR__;
  const _openInEditor = inspector.openInEditor;
  inspector.openInEditor = async (...params) => {
    inspector.disable();
    _openInEditor(...params);
  };
}
function getComponentInspector() {
  return new Promise((resolve) => {
    function setup() {
      setupInspector();
      resolve(target.__VUE_INSPECTOR__);
    }
    if (!target.__VUE_INSPECTOR__) {
      waitForInspectorInit(() => {
        setup();
      });
    } else {
      setup();
    }
  });
}

// src/core/component/state/editor.ts
init_esm_shims();

// src/shared/stub-vue.ts
init_esm_shims();
function isReadonly(value) {
  return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
}
function isReactive(value) {
  if (isReadonly(value)) {
    return isReactive(value["__v_raw" /* RAW */]);
  }
  return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}
function isRef(r) {
  return !!(r && r.__v_isRef === true);
}
function toRaw(observed) {
  const raw = observed && observed["__v_raw" /* RAW */];
  return raw ? toRaw(raw) : observed;
}
var Fragment = Symbol.for("v-fgt");

// src/core/component/state/editor.ts
var StateEditor = class {
  constructor() {
    this.refEditor = new RefStateEditor();
  }
  set(object, path, value, cb) {
    const sections = Array.isArray(path) ? path : path.split(".");
    const markRef = false;
    while (sections.length > 1) {
      const section = sections.shift();
      if (object instanceof Map)
        object = object.get(section);
      else if (object instanceof Set)
        object = Array.from(object.values())[section];
      else object = object[section];
      if (this.refEditor.isRef(object))
        object = this.refEditor.get(object);
    }
    const field = sections[0];
    const item = this.refEditor.get(object)[field];
    if (cb) {
      cb(object, field, value);
    } else {
      if (this.refEditor.isRef(item))
        this.refEditor.set(item, value);
      else if (markRef)
        object[field] = value;
      else
        object[field] = value;
    }
  }
  get(object, path) {
    const sections = Array.isArray(path) ? path : path.split(".");
    for (let i = 0; i < sections.length; i++) {
      if (object instanceof Map)
        object = object.get(sections[i]);
      else
        object = object[sections[i]];
      if (this.refEditor.isRef(object))
        object = this.refEditor.get(object);
      if (!object)
        return void 0;
    }
    return object;
  }
  has(object, path, parent = false) {
    if (typeof object === "undefined")
      return false;
    const sections = Array.isArray(path) ? path.slice() : path.split(".");
    const size = !parent ? 1 : 2;
    while (object && sections.length > size) {
      const section = sections.shift();
      object = object[section];
      if (this.refEditor.isRef(object))
        object = this.refEditor.get(object);
    }
    return object != null && Object.prototype.hasOwnProperty.call(object, sections[0]);
  }
  createDefaultSetCallback(state) {
    return (object, field, value) => {
      if (state.remove || state.newKey) {
        if (Array.isArray(object))
          object.splice(field, 1);
        else if (toRaw(object) instanceof Map)
          object.delete(field);
        else if (toRaw(object) instanceof Set)
          object.delete(Array.from(object.values())[field]);
        else Reflect.deleteProperty(object, field);
      }
      if (!state.remove) {
        const target22 = object[state.newKey || field];
        if (this.refEditor.isRef(target22))
          this.refEditor.set(target22, value);
        else if (toRaw(object) instanceof Map)
          object.set(state.newKey || field, value);
        else if (toRaw(object) instanceof Set)
          object.add(value);
        else
          object[state.newKey || field] = value;
      }
    };
  }
};
var RefStateEditor = class {
  set(ref, value) {
    if (isRef(ref)) {
      ref.value = value;
    } else {
      if (ref instanceof Set && Array.isArray(value)) {
        ref.clear();
        value.forEach((v) => ref.add(v));
        return;
      }
      const currentKeys = Object.keys(value);
      if (ref instanceof Map) {
        const previousKeysSet2 = new Set(ref.keys());
        currentKeys.forEach((key) => {
          ref.set(key, Reflect.get(value, key));
          previousKeysSet2.delete(key);
        });
        previousKeysSet2.forEach((key) => ref.delete(key));
        return;
      }
      const previousKeysSet = new Set(Object.keys(ref));
      currentKeys.forEach((key) => {
        Reflect.set(ref, key, Reflect.get(value, key));
        previousKeysSet.delete(key);
      });
      previousKeysSet.forEach((key) => Reflect.deleteProperty(ref, key));
    }
  }
  get(ref) {
    return isRef(ref) ? ref.value : ref;
  }
  isRef(ref) {
    return isRef(ref) || isReactive(ref);
  }
};
async function editComponentState(payload, stateEditor2) {
  const { path, nodeId, state, type } = payload;
  const instance = getComponentInstance(activeAppRecord.value, nodeId);
  if (!instance)
    return;
  const targetPath = path.slice();
  let target22;
  if (Object.keys(instance.props).includes(path[0])) {
    target22 = instance.props;
  } else if (instance.devtoolsRawSetupState && Object.keys(instance.devtoolsRawSetupState).includes(path[0])) {
    target22 = instance.devtoolsRawSetupState;
  } else if (instance.data && Object.keys(instance.data).includes(path[0])) {
    target22 = instance.data;
  } else {
    target22 = instance.proxy;
  }
  if (target22 && targetPath) {
    if (state.type === "object" && type === "reactive") {
    }
    stateEditor2.set(target22, targetPath, state.value, stateEditor2.createDefaultSetCallback(state));
  }
}
var stateEditor = new StateEditor();
async function editState(payload) {
  editComponentState(payload, stateEditor);
}

// src/core/open-in-editor/index.ts
init_esm_shims();

// src/ctx/state.ts
init_esm_shims();

// src/core/timeline/storage.ts
init_esm_shims();
var TIMELINE_LAYERS_STATE_STORAGE_ID = "__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS_STATE__";
function addTimelineLayersStateToStorage(state) {
  if (!isBrowser$1 || typeof localStorage === "undefined" || localStorage === null) {
    return;
  }
  localStorage.setItem(TIMELINE_LAYERS_STATE_STORAGE_ID, JSON.stringify(state));
}
function getTimelineLayersStateFromStorage() {
  if (typeof window === "undefined" || !isBrowser$1 || typeof localStorage === "undefined" || localStorage === null) {
    return {
      recordingState: false,
      mouseEventEnabled: false,
      keyboardEventEnabled: false,
      componentEventEnabled: false,
      performanceEventEnabled: false,
      selected: ""
    };
  }
  const state = typeof localStorage.getItem !== "undefined" ? localStorage.getItem(TIMELINE_LAYERS_STATE_STORAGE_ID) : null;
  return state ? JSON.parse(state) : {
    recordingState: false,
    mouseEventEnabled: false,
    keyboardEventEnabled: false,
    componentEventEnabled: false,
    performanceEventEnabled: false,
    selected: ""
  };
}

// src/ctx/hook.ts
init_esm_shims();

// src/ctx/inspector.ts
init_esm_shims();

// src/ctx/timeline.ts
init_esm_shims();
var _a2, _b2;
(_b2 = (_a2 = target).__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS) != null ? _b2 : _a2.__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS = [];
var devtoolsTimelineLayers = new Proxy(target.__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS, {
  get(target22, prop, receiver) {
    return Reflect.get(target22, prop, receiver);
  }
});
function addTimelineLayer(options, descriptor) {
  devtoolsState.timelineLayersState[descriptor.id] = false;
  devtoolsTimelineLayers.push({
    ...options,
    descriptorId: descriptor.id,
    appRecord: getAppRecord(descriptor.app)
  });
}
function updateTimelineLayersState(state) {
  const updatedState = {
    ...devtoolsState.timelineLayersState,
    ...state
  };
  addTimelineLayersStateToStorage(updatedState);
  updateDevToolsState({
    timelineLayersState: updatedState
  });
}

// src/ctx/inspector.ts
var _a3, _b3;
(_b3 = (_a3 = target).__VUE_DEVTOOLS_KIT_INSPECTOR__) != null ? _b3 : _a3.__VUE_DEVTOOLS_KIT_INSPECTOR__ = [];
var devtoolsInspector = new Proxy(target.__VUE_DEVTOOLS_KIT_INSPECTOR__, {
  get(target22, prop, receiver) {
    return Reflect.get(target22, prop, receiver);
  }
});
var callInspectorUpdatedHook = debounce(() => {
  devtoolsContext.hooks.callHook("sendInspectorToClient" /* SEND_INSPECTOR_TO_CLIENT */, getActiveInspectors());
});
function addInspector(inspector, descriptor) {
  var _a25, _b25;
  devtoolsInspector.push({
    options: inspector,
    descriptor,
    treeFilterPlaceholder: (_a25 = inspector.treeFilterPlaceholder) != null ? _a25 : "Search tree...",
    stateFilterPlaceholder: (_b25 = inspector.stateFilterPlaceholder) != null ? _b25 : "Search state...",
    treeFilter: "",
    selectedNodeId: "",
    appRecord: getAppRecord(descriptor.app)
  });
  callInspectorUpdatedHook();
}
function getActiveInspectors() {
  return devtoolsInspector.filter((inspector) => inspector.descriptor.app === activeAppRecord.value.app).filter((inspector) => inspector.descriptor.id !== "components").map((inspector) => {
    var _a25;
    const descriptor = inspector.descriptor;
    const options = inspector.options;
    return {
      id: options.id,
      label: options.label,
      logo: descriptor.logo,
      icon: `custom-ic-baseline-${(_a25 = options == null ? void 0 : options.icon) == null ? void 0 : _a25.replace(/_/g, "-")}`,
      packageName: descriptor.packageName,
      homepage: descriptor.homepage,
      pluginId: descriptor.id
    };
  });
}
function getInspectorInfo(id) {
  const inspector = getInspector(id, activeAppRecord.value.app);
  if (!inspector)
    return;
  const descriptor = inspector.descriptor;
  const options = inspector.options;
  const timelineLayers = devtoolsTimelineLayers.filter((layer) => layer.descriptorId === descriptor.id).map((item) => ({
    id: item.id,
    label: item.label,
    color: item.color
  }));
  return {
    id: options.id,
    label: options.label,
    logo: descriptor.logo,
    packageName: descriptor.packageName,
    homepage: descriptor.homepage,
    timelineLayers,
    treeFilterPlaceholder: inspector.treeFilterPlaceholder,
    stateFilterPlaceholder: inspector.stateFilterPlaceholder
  };
}
function getInspector(id, app) {
  return devtoolsInspector.find((inspector) => inspector.options.id === id && (app ? inspector.descriptor.app === app : true));
}
function getInspectorActions(id) {
  const inspector = getInspector(id);
  return inspector == null ? void 0 : inspector.options.actions;
}
function getInspectorNodeActions(id) {
  const inspector = getInspector(id);
  return inspector == null ? void 0 : inspector.options.nodeActions;
}

// src/ctx/hook.ts
var DevToolsV6PluginAPIHookKeys = /* @__PURE__ */ ((DevToolsV6PluginAPIHookKeys2) => {
  DevToolsV6PluginAPIHookKeys2["VISIT_COMPONENT_TREE"] = "visitComponentTree";
  DevToolsV6PluginAPIHookKeys2["INSPECT_COMPONENT"] = "inspectComponent";
  DevToolsV6PluginAPIHookKeys2["EDIT_COMPONENT_STATE"] = "editComponentState";
  DevToolsV6PluginAPIHookKeys2["GET_INSPECTOR_TREE"] = "getInspectorTree";
  DevToolsV6PluginAPIHookKeys2["GET_INSPECTOR_STATE"] = "getInspectorState";
  DevToolsV6PluginAPIHookKeys2["EDIT_INSPECTOR_STATE"] = "editInspectorState";
  DevToolsV6PluginAPIHookKeys2["INSPECT_TIMELINE_EVENT"] = "inspectTimelineEvent";
  DevToolsV6PluginAPIHookKeys2["TIMELINE_CLEARED"] = "timelineCleared";
  DevToolsV6PluginAPIHookKeys2["SET_PLUGIN_SETTINGS"] = "setPluginSettings";
  return DevToolsV6PluginAPIHookKeys2;
})(DevToolsV6PluginAPIHookKeys || {});
var DevToolsContextHookKeys = /* @__PURE__ */ ((DevToolsContextHookKeys2) => {
  DevToolsContextHookKeys2["ADD_INSPECTOR"] = "addInspector";
  DevToolsContextHookKeys2["SEND_INSPECTOR_TREE"] = "sendInspectorTree";
  DevToolsContextHookKeys2["SEND_INSPECTOR_STATE"] = "sendInspectorState";
  DevToolsContextHookKeys2["CUSTOM_INSPECTOR_SELECT_NODE"] = "customInspectorSelectNode";
  DevToolsContextHookKeys2["TIMELINE_LAYER_ADDED"] = "timelineLayerAdded";
  DevToolsContextHookKeys2["TIMELINE_EVENT_ADDED"] = "timelineEventAdded";
  DevToolsContextHookKeys2["GET_COMPONENT_INSTANCES"] = "getComponentInstances";
  DevToolsContextHookKeys2["GET_COMPONENT_BOUNDS"] = "getComponentBounds";
  DevToolsContextHookKeys2["GET_COMPONENT_NAME"] = "getComponentName";
  DevToolsContextHookKeys2["COMPONENT_HIGHLIGHT"] = "componentHighlight";
  DevToolsContextHookKeys2["COMPONENT_UNHIGHLIGHT"] = "componentUnhighlight";
  return DevToolsContextHookKeys2;
})(DevToolsContextHookKeys || {});
var DevToolsMessagingHookKeys = /* @__PURE__ */ ((DevToolsMessagingHookKeys2) => {
  DevToolsMessagingHookKeys2["SEND_INSPECTOR_TREE_TO_CLIENT"] = "sendInspectorTreeToClient";
  DevToolsMessagingHookKeys2["SEND_INSPECTOR_STATE_TO_CLIENT"] = "sendInspectorStateToClient";
  DevToolsMessagingHookKeys2["SEND_TIMELINE_EVENT_TO_CLIENT"] = "sendTimelineEventToClient";
  DevToolsMessagingHookKeys2["SEND_INSPECTOR_TO_CLIENT"] = "sendInspectorToClient";
  DevToolsMessagingHookKeys2["SEND_ACTIVE_APP_UNMOUNTED_TO_CLIENT"] = "sendActiveAppUpdatedToClient";
  DevToolsMessagingHookKeys2["DEVTOOLS_STATE_UPDATED"] = "devtoolsStateUpdated";
  DevToolsMessagingHookKeys2["DEVTOOLS_CONNECTED_UPDATED"] = "devtoolsConnectedUpdated";
  DevToolsMessagingHookKeys2["ROUTER_INFO_UPDATED"] = "routerInfoUpdated";
  return DevToolsMessagingHookKeys2;
})(DevToolsMessagingHookKeys || {});
function createDevToolsCtxHooks() {
  const hooks2 = createHooks();
  hooks2.hook("addInspector" /* ADD_INSPECTOR */, ({ inspector, plugin }) => {
    addInspector(inspector, plugin.descriptor);
  });
  const debounceSendInspectorTree = debounce(async ({ inspectorId, plugin }) => {
    var _a25;
    if (!inspectorId || !((_a25 = plugin == null ? void 0 : plugin.descriptor) == null ? void 0 : _a25.app) || devtoolsState.highPerfModeEnabled)
      return;
    const inspector = getInspector(inspectorId, plugin.descriptor.app);
    const _payload = {
      app: plugin.descriptor.app,
      inspectorId,
      filter: (inspector == null ? void 0 : inspector.treeFilter) || "",
      rootNodes: []
    };
    await new Promise((resolve) => {
      hooks2.callHookWith(async (callbacks) => {
        await Promise.all(callbacks.map((cb) => cb(_payload)));
        resolve();
      }, "getInspectorTree" /* GET_INSPECTOR_TREE */);
    });
    hooks2.callHookWith(async (callbacks) => {
      await Promise.all(callbacks.map((cb) => cb({
        inspectorId,
        rootNodes: _payload.rootNodes
      })));
    }, "sendInspectorTreeToClient" /* SEND_INSPECTOR_TREE_TO_CLIENT */);
  }, 120);
  hooks2.hook("sendInspectorTree" /* SEND_INSPECTOR_TREE */, debounceSendInspectorTree);
  const debounceSendInspectorState = debounce(async ({ inspectorId, plugin }) => {
    var _a25;
    if (!inspectorId || !((_a25 = plugin == null ? void 0 : plugin.descriptor) == null ? void 0 : _a25.app) || devtoolsState.highPerfModeEnabled)
      return;
    const inspector = getInspector(inspectorId, plugin.descriptor.app);
    const _payload = {
      app: plugin.descriptor.app,
      inspectorId,
      nodeId: (inspector == null ? void 0 : inspector.selectedNodeId) || "",
      state: null
    };
    const ctx = {
      currentTab: `custom-inspector:${inspectorId}`
    };
    if (_payload.nodeId) {
      await new Promise((resolve) => {
        hooks2.callHookWith(async (callbacks) => {
          await Promise.all(callbacks.map((cb) => cb(_payload, ctx)));
          resolve();
        }, "getInspectorState" /* GET_INSPECTOR_STATE */);
      });
    }
    hooks2.callHookWith(async (callbacks) => {
      await Promise.all(callbacks.map((cb) => cb({
        inspectorId,
        nodeId: _payload.nodeId,
        state: _payload.state
      })));
    }, "sendInspectorStateToClient" /* SEND_INSPECTOR_STATE_TO_CLIENT */);
  }, 120);
  hooks2.hook("sendInspectorState" /* SEND_INSPECTOR_STATE */, debounceSendInspectorState);
  hooks2.hook("customInspectorSelectNode" /* CUSTOM_INSPECTOR_SELECT_NODE */, ({ inspectorId, nodeId, plugin }) => {
    const inspector = getInspector(inspectorId, plugin.descriptor.app);
    if (!inspector)
      return;
    inspector.selectedNodeId = nodeId;
  });
  hooks2.hook("timelineLayerAdded" /* TIMELINE_LAYER_ADDED */, ({ options, plugin }) => {
    addTimelineLayer(options, plugin.descriptor);
  });
  hooks2.hook("timelineEventAdded" /* TIMELINE_EVENT_ADDED */, ({ options, plugin }) => {
    var _a25;
    const internalLayerIds = ["performance", "component-event", "keyboard", "mouse"];
    if (devtoolsState.highPerfModeEnabled || !((_a25 = devtoolsState.timelineLayersState) == null ? void 0 : _a25[plugin.descriptor.id]) && !internalLayerIds.includes(options.layerId))
      return;
    hooks2.callHookWith(async (callbacks) => {
      await Promise.all(callbacks.map((cb) => cb(options)));
    }, "sendTimelineEventToClient" /* SEND_TIMELINE_EVENT_TO_CLIENT */);
  });
  hooks2.hook("getComponentInstances" /* GET_COMPONENT_INSTANCES */, async ({ app }) => {
    const appRecord = app.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
    if (!appRecord)
      return null;
    const appId = appRecord.id.toString();
    const instances = [...appRecord.instanceMap].filter(([key]) => key.split(":")[0] === appId).map(([, instance]) => instance);
    return instances;
  });
  hooks2.hook("getComponentBounds" /* GET_COMPONENT_BOUNDS */, async ({ instance }) => {
    const bounds = getComponentBoundingRect(instance);
    return bounds;
  });
  hooks2.hook("getComponentName" /* GET_COMPONENT_NAME */, ({ instance }) => {
    const name = getInstanceName(instance);
    return name;
  });
  hooks2.hook("componentHighlight" /* COMPONENT_HIGHLIGHT */, ({ uid }) => {
    const instance = activeAppRecord.value.instanceMap.get(uid);
    if (instance) {
      highlight(instance);
    }
  });
  hooks2.hook("componentUnhighlight" /* COMPONENT_UNHIGHLIGHT */, () => {
    unhighlight();
  });
  return hooks2;
}

// src/ctx/state.ts
var _a4, _b4;
(_b4 = (_a4 = target).__VUE_DEVTOOLS_KIT_APP_RECORDS__) != null ? _b4 : _a4.__VUE_DEVTOOLS_KIT_APP_RECORDS__ = [];
var _a5, _b5;
(_b5 = (_a5 = target).__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__) != null ? _b5 : _a5.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ = {};
var _a6, _b6;
(_b6 = (_a6 = target).__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__) != null ? _b6 : _a6.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ = "";
var _a7, _b7;
(_b7 = (_a7 = target).__VUE_DEVTOOLS_KIT_CUSTOM_TABS__) != null ? _b7 : _a7.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__ = [];
var _a8, _b8;
(_b8 = (_a8 = target).__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__) != null ? _b8 : _a8.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__ = [];
var STATE_KEY = "__VUE_DEVTOOLS_KIT_GLOBAL_STATE__";
function initStateFactory() {
  return {
    connected: false,
    clientConnected: false,
    vitePluginDetected: true,
    appRecords: [],
    activeAppRecordId: "",
    tabs: [],
    commands: [],
    highPerfModeEnabled: true,
    devtoolsClientDetected: {},
    perfUniqueGroupId: 0,
    timelineLayersState: getTimelineLayersStateFromStorage()
  };
}
var _a9, _b9;
(_b9 = (_a9 = target)[STATE_KEY]) != null ? _b9 : _a9[STATE_KEY] = initStateFactory();
var callStateUpdatedHook = debounce((state) => {
  devtoolsContext.hooks.callHook("devtoolsStateUpdated" /* DEVTOOLS_STATE_UPDATED */, { state });
});
var callConnectedUpdatedHook = debounce((state, oldState) => {
  devtoolsContext.hooks.callHook("devtoolsConnectedUpdated" /* DEVTOOLS_CONNECTED_UPDATED */, { state, oldState });
});
var devtoolsAppRecords = new Proxy(target.__VUE_DEVTOOLS_KIT_APP_RECORDS__, {
  get(_target, prop, receiver) {
    if (prop === "value")
      return target.__VUE_DEVTOOLS_KIT_APP_RECORDS__;
    return target.__VUE_DEVTOOLS_KIT_APP_RECORDS__[prop];
  }
});
var addDevToolsAppRecord = (app) => {
  target.__VUE_DEVTOOLS_KIT_APP_RECORDS__ = [
    ...target.__VUE_DEVTOOLS_KIT_APP_RECORDS__,
    app
  ];
};
var removeDevToolsAppRecord = (app) => {
  target.__VUE_DEVTOOLS_KIT_APP_RECORDS__ = devtoolsAppRecords.value.filter((record) => record.app !== app);
};
var activeAppRecord = new Proxy(target.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__, {
  get(_target, prop, receiver) {
    if (prop === "value")
      return target.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__;
    else if (prop === "id")
      return target.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__;
    return target.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__[prop];
  }
});
function updateAllStates() {
  callStateUpdatedHook({
    ...target[STATE_KEY],
    appRecords: devtoolsAppRecords.value,
    activeAppRecordId: activeAppRecord.id,
    tabs: target.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__,
    commands: target.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__
  });
}
function setActiveAppRecord(app) {
  target.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ = app;
  updateAllStates();
}
function setActiveAppRecordId(id) {
  target.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ = id;
  updateAllStates();
}
var devtoolsState = new Proxy(target[STATE_KEY], {
  get(target22, property) {
    if (property === "appRecords") {
      return devtoolsAppRecords;
    } else if (property === "activeAppRecordId") {
      return activeAppRecord.id;
    } else if (property === "tabs") {
      return target.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__;
    } else if (property === "commands") {
      return target.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__;
    }
    return target[STATE_KEY][property];
  },
  deleteProperty(target22, property) {
    delete target22[property];
    return true;
  },
  set(target22, property, value) {
    const oldState = { ...target[STATE_KEY] };
    target22[property] = value;
    target[STATE_KEY][property] = value;
    return true;
  }
});
function resetDevToolsState() {
  Object.assign(target[STATE_KEY], initStateFactory());
}
function updateDevToolsState(state) {
  const oldState = {
    ...target[STATE_KEY],
    appRecords: devtoolsAppRecords.value,
    activeAppRecordId: activeAppRecord.id
  };
  if (oldState.connected !== state.connected && state.connected || oldState.clientConnected !== state.clientConnected && state.clientConnected) {
    callConnectedUpdatedHook(target[STATE_KEY], oldState);
  }
  Object.assign(target[STATE_KEY], state);
  updateAllStates();
}
function onDevToolsConnected(fn) {
  return new Promise((resolve) => {
    if (devtoolsState.connected) {
      fn();
      resolve();
    }
    devtoolsContext.hooks.hook("devtoolsConnectedUpdated" /* DEVTOOLS_CONNECTED_UPDATED */, ({ state }) => {
      if (state.connected) {
        fn();
        resolve();
      }
    });
  });
}
var resolveIcon = (icon) => {
  if (!icon)
    return;
  if (icon.startsWith("baseline-")) {
    return `custom-ic-${icon}`;
  }
  if (icon.startsWith("i-") || isUrlString(icon))
    return icon;
  return `custom-ic-baseline-${icon}`;
};
function addCustomTab(tab) {
  const tabs = target.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__;
  if (tabs.some((t) => t.name === tab.name))
    return;
  tabs.push({
    ...tab,
    icon: resolveIcon(tab.icon)
  });
  updateAllStates();
}
function addCustomCommand(action) {
  const commands = target.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__;
  if (commands.some((t) => t.id === action.id))
    return;
  commands.push({
    ...action,
    icon: resolveIcon(action.icon),
    children: action.children ? action.children.map((child) => ({
      ...child,
      icon: resolveIcon(child.icon)
    })) : void 0
  });
  updateAllStates();
}
function removeCustomCommand(actionId) {
  const commands = target.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__;
  const index = commands.findIndex((t) => t.id === actionId);
  if (index === -1)
    return;
  commands.splice(index, 1);
  updateAllStates();
}
function toggleClientConnected(state) {
  updateDevToolsState({ clientConnected: state });
}

// src/core/open-in-editor/index.ts
function setOpenInEditorBaseUrl(url) {
  target.__VUE_DEVTOOLS_OPEN_IN_EDITOR_BASE_URL__ = url;
}
function openInEditor(options = {}) {
  var _a25, _b25, _c;
  const { file, host, baseUrl = window.location.origin, line = 0, column = 0 } = options;
  if (file) {
    if (host === "chrome-extension") {
      const fileName = file.replace(/\\/g, "\\\\");
      const _baseUrl = (_b25 = (_a25 = window.VUE_DEVTOOLS_CONFIG) == null ? void 0 : _a25.openInEditorHost) != null ? _b25 : "/";
      fetch(`${_baseUrl}__open-in-editor?file=${encodeURI(file)}`).then((response) => {
        if (!response.ok) {
          const msg = `Opening component ${fileName} failed`;
          console.log(`%c${msg}`, "color:red");
        }
      });
    } else if (devtoolsState.vitePluginDetected) {
      const _baseUrl = (_c = target.__VUE_DEVTOOLS_OPEN_IN_EDITOR_BASE_URL__) != null ? _c : baseUrl;
      target.__VUE_INSPECTOR__.openInEditor(_baseUrl, file, line, column);
    }
  }
}

// src/core/plugin/index.ts
init_esm_shims();

// src/api/index.ts
init_esm_shims();

// src/api/v6/index.ts
init_esm_shims();

// src/core/plugin/plugin-settings.ts
init_esm_shims();

// src/ctx/plugin.ts
init_esm_shims();
var _a10, _b10;
(_b10 = (_a10 = target).__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__) != null ? _b10 : _a10.__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__ = [];
var devtoolsPluginBuffer = new Proxy(target.__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__, {
  get(target22, prop, receiver) {
    return Reflect.get(target22, prop, receiver);
  }
});
function addDevToolsPluginToBuffer(pluginDescriptor, setupFn) {
  devtoolsPluginBuffer.push([pluginDescriptor, setupFn]);
}

// src/core/plugin/plugin-settings.ts
function _getSettings(settings) {
  const _settings = {};
  Object.keys(settings).forEach((key) => {
    _settings[key] = settings[key].defaultValue;
  });
  return _settings;
}
function getPluginLocalKey(pluginId) {
  return `__VUE_DEVTOOLS_NEXT_PLUGIN_SETTINGS__${pluginId}__`;
}
function getPluginSettingsOptions(pluginId) {
  var _a25, _b25, _c;
  const item = (_b25 = (_a25 = devtoolsPluginBuffer.find((item2) => {
    var _a26;
    return item2[0].id === pluginId && !!((_a26 = item2[0]) == null ? void 0 : _a26.settings);
  })) == null ? void 0 : _a25[0]) != null ? _b25 : null;
  return (_c = item == null ? void 0 : item.settings) != null ? _c : null;
}
function getPluginSettings(pluginId, fallbackValue) {
  var _a25, _b25, _c;
  const localKey = getPluginLocalKey(pluginId);
  if (localKey) {
    const localSettings = localStorage.getItem(localKey);
    if (localSettings) {
      return JSON.parse(localSettings);
    }
  }
  if (pluginId) {
    const item = (_b25 = (_a25 = devtoolsPluginBuffer.find((item2) => item2[0].id === pluginId)) == null ? void 0 : _a25[0]) != null ? _b25 : null;
    return _getSettings((_c = item == null ? void 0 : item.settings) != null ? _c : {});
  }
  return _getSettings(fallbackValue);
}
function initPluginSettings(pluginId, settings) {
  const localKey = getPluginLocalKey(pluginId);
  const localSettings = localStorage.getItem(localKey);
  if (!localSettings) {
    localStorage.setItem(localKey, JSON.stringify(_getSettings(settings)));
  }
}
function setPluginSettings(pluginId, key, value) {
  const localKey = getPluginLocalKey(pluginId);
  const localSettings = localStorage.getItem(localKey);
  const parsedLocalSettings = JSON.parse(localSettings || "{}");
  const updated = {
    ...parsedLocalSettings,
    [key]: value
  };
  localStorage.setItem(localKey, JSON.stringify(updated));
  devtoolsContext.hooks.callHookWith((callbacks) => {
    callbacks.forEach((cb) => cb({
      pluginId,
      key,
      oldValue: parsedLocalSettings[key],
      newValue: value,
      settings: updated
    }));
  }, "setPluginSettings" /* SET_PLUGIN_SETTINGS */);
}

// src/hook/index.ts
init_esm_shims();

// src/types/index.ts
init_esm_shims();

// src/types/app.ts
init_esm_shims();

// src/types/command.ts
init_esm_shims();

// src/types/component.ts
init_esm_shims();

// src/types/hook.ts
init_esm_shims();

// src/types/inspector.ts
init_esm_shims();

// src/types/plugin.ts
init_esm_shims();

// src/types/router.ts
init_esm_shims();

// src/types/tab.ts
init_esm_shims();

// src/types/timeline.ts
init_esm_shims();

// src/hook/index.ts
var _a11, _b11;
var devtoolsHooks = (_b11 = (_a11 = target).__VUE_DEVTOOLS_HOOK) != null ? _b11 : _a11.__VUE_DEVTOOLS_HOOK = createHooks();
var on = {
  vueAppInit(fn) {
    devtoolsHooks.hook("app:init" /* APP_INIT */, fn);
  },
  vueAppUnmount(fn) {
    devtoolsHooks.hook("app:unmount" /* APP_UNMOUNT */, fn);
  },
  vueAppConnected(fn) {
    devtoolsHooks.hook("app:connected" /* APP_CONNECTED */, fn);
  },
  componentAdded(fn) {
    return devtoolsHooks.hook("component:added" /* COMPONENT_ADDED */, fn);
  },
  componentEmit(fn) {
    return devtoolsHooks.hook("component:emit" /* COMPONENT_EMIT */, fn);
  },
  componentUpdated(fn) {
    return devtoolsHooks.hook("component:updated" /* COMPONENT_UPDATED */, fn);
  },
  componentRemoved(fn) {
    return devtoolsHooks.hook("component:removed" /* COMPONENT_REMOVED */, fn);
  },
  setupDevtoolsPlugin(fn) {
    devtoolsHooks.hook("devtools-plugin:setup" /* SETUP_DEVTOOLS_PLUGIN */, fn);
  },
  perfStart(fn) {
    return devtoolsHooks.hook("perf:start" /* PERFORMANCE_START */, fn);
  },
  perfEnd(fn) {
    return devtoolsHooks.hook("perf:end" /* PERFORMANCE_END */, fn);
  }
};
function createDevToolsHook() {
  return {
    id: "vue-devtools-next",
    devtoolsVersion: "7.0",
    enabled: false,
    appRecords: [],
    apps: [],
    events: /* @__PURE__ */ new Map(),
    on(event, fn) {
      var _a25;
      if (!this.events.has(event))
        this.events.set(event, []);
      (_a25 = this.events.get(event)) == null ? void 0 : _a25.push(fn);
      return () => this.off(event, fn);
    },
    once(event, fn) {
      const onceFn = (...args) => {
        this.off(event, onceFn);
        fn(...args);
      };
      this.on(event, onceFn);
      return [event, onceFn];
    },
    off(event, fn) {
      if (this.events.has(event)) {
        const eventCallbacks = this.events.get(event);
        const index = eventCallbacks.indexOf(fn);
        if (index !== -1)
          eventCallbacks.splice(index, 1);
      }
    },
    emit(event, ...payload) {
      if (this.events.has(event))
        this.events.get(event).forEach((fn) => fn(...payload));
    }
  };
}
function subscribeDevToolsHook(hook2) {
  hook2.on("app:init" /* APP_INIT */, (app, version, types) => {
    var _a25, _b25, _c;
    if ((_c = (_b25 = (_a25 = app == null ? void 0 : app._instance) == null ? void 0 : _a25.type) == null ? void 0 : _b25.devtools) == null ? void 0 : _c.hide)
      return;
    devtoolsHooks.callHook("app:init" /* APP_INIT */, app, version, types);
  });
  hook2.on("app:unmount" /* APP_UNMOUNT */, (app) => {
    devtoolsHooks.callHook("app:unmount" /* APP_UNMOUNT */, app);
  });
  hook2.on("component:added" /* COMPONENT_ADDED */, async (app, uid, parentUid, component) => {
    var _a25, _b25, _c;
    if (((_c = (_b25 = (_a25 = app == null ? void 0 : app._instance) == null ? void 0 : _a25.type) == null ? void 0 : _b25.devtools) == null ? void 0 : _c.hide) || devtoolsState.highPerfModeEnabled)
      return;
    if (!app || typeof uid !== "number" && !uid || !component)
      return;
    devtoolsHooks.callHook("component:added" /* COMPONENT_ADDED */, app, uid, parentUid, component);
  });
  hook2.on("component:updated" /* COMPONENT_UPDATED */, (app, uid, parentUid, component) => {
    if (!app || typeof uid !== "number" && !uid || !component || devtoolsState.highPerfModeEnabled)
      return;
    devtoolsHooks.callHook("component:updated" /* COMPONENT_UPDATED */, app, uid, parentUid, component);
  });
  hook2.on("component:removed" /* COMPONENT_REMOVED */, async (app, uid, parentUid, component) => {
    if (!app || typeof uid !== "number" && !uid || !component || devtoolsState.highPerfModeEnabled)
      return;
    devtoolsHooks.callHook("component:removed" /* COMPONENT_REMOVED */, app, uid, parentUid, component);
  });
  hook2.on("component:emit" /* COMPONENT_EMIT */, async (app, instance, event, params) => {
    if (!app || !instance || devtoolsState.highPerfModeEnabled)
      return;
    devtoolsHooks.callHook("component:emit" /* COMPONENT_EMIT */, app, instance, event, params);
  });
  hook2.on("perf:start" /* PERFORMANCE_START */, (app, uid, vm, type, time) => {
    if (!app || devtoolsState.highPerfModeEnabled)
      return;
    devtoolsHooks.callHook("perf:start" /* PERFORMANCE_START */, app, uid, vm, type, time);
  });
  hook2.on("perf:end" /* PERFORMANCE_END */, (app, uid, vm, type, time) => {
    if (!app || devtoolsState.highPerfModeEnabled)
      return;
    devtoolsHooks.callHook("perf:end" /* PERFORMANCE_END */, app, uid, vm, type, time);
  });
  hook2.on("devtools-plugin:setup" /* SETUP_DEVTOOLS_PLUGIN */, (pluginDescriptor, setupFn, options) => {
    if ((options == null ? void 0 : options.target) === "legacy")
      return;
    devtoolsHooks.callHook("devtools-plugin:setup" /* SETUP_DEVTOOLS_PLUGIN */, pluginDescriptor, setupFn);
  });
}
var hook = {
  on,
  setupDevToolsPlugin(pluginDescriptor, setupFn) {
    return devtoolsHooks.callHook("devtools-plugin:setup" /* SETUP_DEVTOOLS_PLUGIN */, pluginDescriptor, setupFn);
  }
};

// src/api/v6/index.ts
var DevToolsV6PluginAPI = class {
  constructor({ plugin, ctx }) {
    this.hooks = ctx.hooks;
    this.plugin = plugin;
  }
  get on() {
    return {
      // component inspector
      visitComponentTree: (handler) => {
        this.hooks.hook("visitComponentTree" /* VISIT_COMPONENT_TREE */, handler);
      },
      inspectComponent: (handler) => {
        this.hooks.hook("inspectComponent" /* INSPECT_COMPONENT */, handler);
      },
      editComponentState: (handler) => {
        this.hooks.hook("editComponentState" /* EDIT_COMPONENT_STATE */, handler);
      },
      // custom inspector
      getInspectorTree: (handler) => {
        this.hooks.hook("getInspectorTree" /* GET_INSPECTOR_TREE */, handler);
      },
      getInspectorState: (handler) => {
        this.hooks.hook("getInspectorState" /* GET_INSPECTOR_STATE */, handler);
      },
      editInspectorState: (handler) => {
        this.hooks.hook("editInspectorState" /* EDIT_INSPECTOR_STATE */, handler);
      },
      // timeline
      inspectTimelineEvent: (handler) => {
        this.hooks.hook("inspectTimelineEvent" /* INSPECT_TIMELINE_EVENT */, handler);
      },
      timelineCleared: (handler) => {
        this.hooks.hook("timelineCleared" /* TIMELINE_CLEARED */, handler);
      },
      // settings
      setPluginSettings: (handler) => {
        this.hooks.hook("setPluginSettings" /* SET_PLUGIN_SETTINGS */, handler);
      }
    };
  }
  // component inspector
  notifyComponentUpdate(instance) {
    var _a25;
    if (devtoolsState.highPerfModeEnabled) {
      return;
    }
    const inspector = getActiveInspectors().find((i) => i.packageName === this.plugin.descriptor.packageName);
    if (inspector == null ? void 0 : inspector.id) {
      if (instance) {
        const args = [
          instance.appContext.app,
          instance.uid,
          (_a25 = instance.parent) == null ? void 0 : _a25.uid,
          instance
        ];
        devtoolsHooks.callHook("component:updated" /* COMPONENT_UPDATED */, ...args);
      } else {
        devtoolsHooks.callHook("component:updated" /* COMPONENT_UPDATED */);
      }
      this.hooks.callHook("sendInspectorState" /* SEND_INSPECTOR_STATE */, { inspectorId: inspector.id, plugin: this.plugin });
    }
  }
  // custom inspector
  addInspector(options) {
    this.hooks.callHook("addInspector" /* ADD_INSPECTOR */, { inspector: options, plugin: this.plugin });
    if (this.plugin.descriptor.settings) {
      initPluginSettings(options.id, this.plugin.descriptor.settings);
    }
  }
  sendInspectorTree(inspectorId) {
    if (devtoolsState.highPerfModeEnabled) {
      return;
    }
    this.hooks.callHook("sendInspectorTree" /* SEND_INSPECTOR_TREE */, { inspectorId, plugin: this.plugin });
  }
  sendInspectorState(inspectorId) {
    if (devtoolsState.highPerfModeEnabled) {
      return;
    }
    this.hooks.callHook("sendInspectorState" /* SEND_INSPECTOR_STATE */, { inspectorId, plugin: this.plugin });
  }
  selectInspectorNode(inspectorId, nodeId) {
    this.hooks.callHook("customInspectorSelectNode" /* CUSTOM_INSPECTOR_SELECT_NODE */, { inspectorId, nodeId, plugin: this.plugin });
  }
  visitComponentTree(payload) {
    return this.hooks.callHook("visitComponentTree" /* VISIT_COMPONENT_TREE */, payload);
  }
  // timeline
  now() {
    if (devtoolsState.highPerfModeEnabled) {
      return 0;
    }
    return Date.now();
  }
  addTimelineLayer(options) {
    this.hooks.callHook("timelineLayerAdded" /* TIMELINE_LAYER_ADDED */, { options, plugin: this.plugin });
  }
  addTimelineEvent(options) {
    if (devtoolsState.highPerfModeEnabled) {
      return;
    }
    this.hooks.callHook("timelineEventAdded" /* TIMELINE_EVENT_ADDED */, { options, plugin: this.plugin });
  }
  // settings
  getSettings(pluginId) {
    return getPluginSettings(pluginId != null ? pluginId : this.plugin.descriptor.id, this.plugin.descriptor.settings);
  }
  // utilities
  getComponentInstances(app) {
    return this.hooks.callHook("getComponentInstances" /* GET_COMPONENT_INSTANCES */, { app });
  }
  getComponentBounds(instance) {
    return this.hooks.callHook("getComponentBounds" /* GET_COMPONENT_BOUNDS */, { instance });
  }
  getComponentName(instance) {
    return this.hooks.callHook("getComponentName" /* GET_COMPONENT_NAME */, { instance });
  }
  highlightElement(instance) {
    const uid = instance.__VUE_DEVTOOLS_NEXT_UID__;
    return this.hooks.callHook("componentHighlight" /* COMPONENT_HIGHLIGHT */, { uid });
  }
  unhighlightElement() {
    return this.hooks.callHook("componentUnhighlight" /* COMPONENT_UNHIGHLIGHT */);
  }
};

// src/api/index.ts
var DevToolsPluginAPI = DevToolsV6PluginAPI;

// src/core/plugin/components.ts
init_esm_shims();

// src/core/component/state/index.ts
init_esm_shims();

// src/core/component/state/process.ts
init_esm_shims();

// src/core/component/state/constants.ts
init_esm_shims();
var vueBuiltins = /* @__PURE__ */ new Set([
  "nextTick",
  "defineComponent",
  "defineAsyncComponent",
  "defineCustomElement",
  "ref",
  "computed",
  "reactive",
  "readonly",
  "watchEffect",
  "watchPostEffect",
  "watchSyncEffect",
  "watch",
  "isRef",
  "unref",
  "toRef",
  "toRefs",
  "isProxy",
  "isReactive",
  "isReadonly",
  "shallowRef",
  "triggerRef",
  "customRef",
  "shallowReactive",
  "shallowReadonly",
  "toRaw",
  "markRaw",
  "effectScope",
  "getCurrentScope",
  "onScopeDispose",
  "onMounted",
  "onUpdated",
  "onUnmounted",
  "onBeforeMount",
  "onBeforeUpdate",
  "onBeforeUnmount",
  "onErrorCaptured",
  "onRenderTracked",
  "onRenderTriggered",
  "onActivated",
  "onDeactivated",
  "onServerPrefetch",
  "provide",
  "inject",
  "h",
  "mergeProps",
  "cloneVNode",
  "isVNode",
  "resolveComponent",
  "resolveDirective",
  "withDirectives",
  "withModifiers"
]);
var symbolRE = /^\[native Symbol Symbol\((.*)\)\]$/;
var rawTypeRE = /^\[object (\w+)\]$/;
var specialTypeRE = /^\[native (\w+) (.*?)(<>(([\s\S])*))?\]$/;
var fnTypeRE = /^(?:function|class) (\w+)/;
var MAX_STRING_SIZE = 1e4;
var MAX_ARRAY_SIZE = 5e3;
var UNDEFINED = "__vue_devtool_undefined__";
var INFINITY = "__vue_devtool_infinity__";
var NEGATIVE_INFINITY = "__vue_devtool_negative_infinity__";
var NAN = "__vue_devtool_nan__";
var ESC = {
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "&": "&amp;"
};

// src/core/component/state/util.ts
init_esm_shims();

// src/core/component/state/is.ts
init_esm_shims();
function isVueInstance(value) {
  if (!ensurePropertyExists(value, "_")) {
    return false;
  }
  if (!isPlainObject$1(value._)) {
    return false;
  }
  return Object.keys(value._).includes("vnode");
}
function isPlainObject$1(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isPrimitive(data) {
  if (data == null)
    return true;
  const type = typeof data;
  return type === "string" || type === "number" || type === "boolean";
}
function isRef2(raw) {
  return !!raw.__v_isRef;
}
function isComputed$1(raw) {
  return isRef2(raw) && !!raw.effect;
}
function isReactive2(raw) {
  return !!raw.__v_isReactive;
}
function isReadOnly(raw) {
  return !!raw.__v_isReadonly;
}

// src/core/component/state/util.ts
var tokenMap = {
  [UNDEFINED]: "undefined",
  [NAN]: "NaN",
  [INFINITY]: "Infinity",
  [NEGATIVE_INFINITY]: "-Infinity"
};
var reversedTokenMap = Object.entries(tokenMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});
function internalStateTokenToString(value) {
  if (value === null)
    return "null";
  return typeof value === "string" && tokenMap[value] || false;
}
function replaceTokenToString(value) {
  const replaceRegex = new RegExp(`"(${Object.keys(tokenMap).join("|")})"`, "g");
  return value.replace(replaceRegex, (_, g1) => tokenMap[g1]);
}
function replaceStringToToken(value) {
  const literalValue = reversedTokenMap[value.trim()];
  if (literalValue)
    return `"${literalValue}"`;
  const replaceRegex = new RegExp(`:\\s*(${Object.keys(reversedTokenMap).join("|")})`, "g");
  return value.replace(replaceRegex, (_, g1) => `:"${reversedTokenMap[g1]}"`);
}
function getPropType(type) {
  if (Array.isArray(type))
    return type.map((t) => getPropType(t)).join(" or ");
  if (type == null)
    return "null";
  const match = type.toString().match(fnTypeRE);
  return typeof type === "function" ? match && match[1] || "any" : "any";
}
function sanitize(data) {
  if (!isPrimitive(data) && !Array.isArray(data) && !isPlainObject$1(data)) {
    return Object.prototype.toString.call(data);
  } else {
    return data;
  }
}
function getSetupStateType(raw) {
  try {
    return {
      ref: isRef2(raw),
      computed: isComputed$1(raw),
      reactive: isReactive2(raw),
      readonly: isReadOnly(raw)
    };
  } catch (e) {
    return {
      ref: false,
      computed: false,
      reactive: false,
      readonly: false
    };
  }
}
function toRaw2(value) {
  if (value == null ? void 0 : value.__v_raw)
    return value.__v_raw;
  return value;
}
function escape(s) {
  return s.replace(/[<>"&]/g, (s2) => {
    return ESC[s2] || s2;
  });
}

// src/core/component/state/process.ts
function mergeOptions(to, from, instance) {
  if (typeof from === "function")
    from = from.options;
  if (!from)
    return to;
  const { mixins, extends: extendsOptions } = from;
  extendsOptions && mergeOptions(to, extendsOptions, instance);
  mixins && mixins.forEach(
    (m) => mergeOptions(to, m, instance)
  );
  for (const key of ["computed", "inject"]) {
    if (Object.prototype.hasOwnProperty.call(from, key)) {
      if (!to[key])
        to[key] = from[key];
      else
        Object.assign(to[key], from[key]);
    }
  }
  return to;
}
function resolveMergedOptions(instance) {
  const raw = instance == null ? void 0 : instance.type;
  if (!raw)
    return {};
  const { mixins, extends: extendsOptions } = raw;
  const globalMixins = instance.appContext.mixins;
  if (!globalMixins.length && !mixins && !extendsOptions)
    return raw;
  const options = {};
  globalMixins.forEach((m) => mergeOptions(options, m, instance));
  mergeOptions(options, raw, instance);
  return options;
}
function processProps(instance) {
  var _a25;
  const props = [];
  const propDefinitions = (_a25 = instance == null ? void 0 : instance.type) == null ? void 0 : _a25.props;
  for (const key in instance == null ? void 0 : instance.props) {
    const propDefinition = propDefinitions ? propDefinitions[key] : null;
    const camelizeKey = camelize(key);
    props.push({
      type: "props",
      key: camelizeKey,
      value: returnError(() => instance.props[key]),
      editable: true,
      meta: propDefinition ? {
        type: propDefinition.type ? getPropType(propDefinition.type) : "any",
        required: !!propDefinition.required,
        ...propDefinition.default ? {
          default: propDefinition.default.toString()
        } : {}
      } : { type: "invalid" }
    });
  }
  return props;
}
function processState(instance) {
  const type = instance.type;
  const props = type == null ? void 0 : type.props;
  const getters = type.vuex && type.vuex.getters;
  const computedDefs = type.computed;
  const data = {
    ...instance.data,
    ...instance.renderContext
  };
  return Object.keys(data).filter((key) => !(props && key in props) && !(getters && key in getters) && !(computedDefs && key in computedDefs)).map((key) => ({
    key,
    type: "data",
    value: returnError(() => data[key]),
    editable: true
  }));
}
function getStateTypeAndName(info) {
  const stateType = info.computed ? "computed" : info.ref ? "ref" : info.reactive ? "reactive" : null;
  const stateTypeName = stateType ? `${stateType.charAt(0).toUpperCase()}${stateType.slice(1)}` : null;
  return {
    stateType,
    stateTypeName
  };
}
function processSetupState(instance) {
  const raw = instance.devtoolsRawSetupState || {};
  return Object.keys(instance.setupState).filter((key) => !vueBuiltins.has(key) && key.split(/(?=[A-Z])/)[0] !== "use").map((key) => {
    var _a25, _b25, _c, _d;
    const value = returnError(() => toRaw2(instance.setupState[key]));
    const accessError = value instanceof Error;
    const rawData = raw[key];
    let result;
    let isOtherType = accessError || typeof value === "function" || ensurePropertyExists(value, "render") && typeof value.render === "function" || ensurePropertyExists(value, "__asyncLoader") && typeof value.__asyncLoader === "function" || typeof value === "object" && value && ("setup" in value || "props" in value) || /^v[A-Z]/.test(key);
    if (rawData && !accessError) {
      const info = getSetupStateType(rawData);
      const { stateType, stateTypeName } = getStateTypeAndName(info);
      const isState = info.ref || info.computed || info.reactive;
      const raw2 = ensurePropertyExists(rawData, "effect") ? ((_b25 = (_a25 = rawData.effect) == null ? void 0 : _a25.raw) == null ? void 0 : _b25.toString()) || ((_d = (_c = rawData.effect) == null ? void 0 : _c.fn) == null ? void 0 : _d.toString()) : null;
      if (stateType)
        isOtherType = false;
      result = {
        ...stateType ? { stateType, stateTypeName } : {},
        ...raw2 ? { raw: raw2 } : {},
        editable: isState && !info.readonly
      };
    }
    const type = isOtherType ? "setup (other)" : "setup";
    return {
      key,
      value,
      type,
      // @ts-expect-error ignore
      ...result
    };
  });
}
function processComputed(instance, mergedType) {
  const type = mergedType;
  const computed = [];
  const defs = type.computed || {};
  for (const key in defs) {
    const def = defs[key];
    const type2 = typeof def === "function" && def.vuex ? "vuex bindings" : "computed";
    computed.push({
      type: type2,
      key,
      value: returnError(() => {
        var _a25;
        return (_a25 = instance == null ? void 0 : instance.proxy) == null ? void 0 : _a25[key];
      }),
      editable: typeof def.set === "function"
    });
  }
  return computed;
}
function processAttrs(instance) {
  return Object.keys(instance.attrs).map((key) => ({
    type: "attrs",
    key,
    value: returnError(() => instance.attrs[key])
  }));
}
function processProvide(instance) {
  return Reflect.ownKeys(instance.provides).map((key) => ({
    type: "provided",
    key: key.toString(),
    value: returnError(() => instance.provides[key])
  }));
}
function processInject(instance, mergedType) {
  if (!(mergedType == null ? void 0 : mergedType.inject))
    return [];
  let keys = [];
  let defaultValue;
  if (Array.isArray(mergedType.inject)) {
    keys = mergedType.inject.map((key) => ({
      key,
      originalKey: key
    }));
  } else {
    keys = Reflect.ownKeys(mergedType.inject).map((key) => {
      const value = mergedType.inject[key];
      let originalKey;
      if (typeof value === "string" || typeof value === "symbol") {
        originalKey = value;
      } else {
        originalKey = value.from;
        defaultValue = value.default;
      }
      return {
        key,
        originalKey
      };
    });
  }
  return keys.map(({ key, originalKey }) => ({
    type: "injected",
    key: originalKey && key !== originalKey ? `${originalKey.toString()} \u279E ${key.toString()}` : key.toString(),
    // eslint-disable-next-line no-prototype-builtins
    value: returnError(() => instance.ctx.hasOwnProperty(key) ? instance.ctx[key] : instance.provides.hasOwnProperty(originalKey) ? instance.provides[originalKey] : defaultValue)
  }));
}
function processRefs(instance) {
  return Object.keys(instance.refs).map((key) => ({
    type: "template refs",
    key,
    value: returnError(() => instance.refs[key])
  }));
}
function processEventListeners(instance) {
  var _a25, _b25;
  const emitsDefinition = instance.type.emits;
  const declaredEmits = Array.isArray(emitsDefinition) ? emitsDefinition : Object.keys(emitsDefinition != null ? emitsDefinition : {});
  const keys = Object.keys((_b25 = (_a25 = instance == null ? void 0 : instance.vnode) == null ? void 0 : _a25.props) != null ? _b25 : {});
  const result = [];
  for (const key of keys) {
    const [prefix, ...eventNameParts] = key.split(/(?=[A-Z])/);
    if (prefix === "on") {
      const eventName = eventNameParts.join("-").toLowerCase();
      const isDeclared = declaredEmits.includes(eventName);
      result.push({
        type: "event listeners",
        key: eventName,
        value: {
          _custom: {
            displayText: isDeclared ? "\u2705 Declared" : "\u26A0\uFE0F Not declared",
            key: isDeclared ? "\u2705 Declared" : "\u26A0\uFE0F Not declared",
            value: isDeclared ? "\u2705 Declared" : "\u26A0\uFE0F Not declared",
            tooltipText: !isDeclared ? `The event <code>${eventName}</code> is not declared in the <code>emits</code> option. It will leak into the component's attributes (<code>$attrs</code>).` : null
          }
        }
      });
    }
  }
  return result;
}
function processInstanceState(instance) {
  const mergedType = resolveMergedOptions(instance);
  return processProps(instance).concat(
    processState(instance),
    processSetupState(instance),
    processComputed(instance, mergedType),
    processAttrs(instance),
    processProvide(instance),
    processInject(instance, mergedType),
    processRefs(instance),
    processEventListeners(instance)
  );
}

// src/core/component/state/index.ts
function getInstanceState(params) {
  var _a25;
  const instance = getComponentInstance(activeAppRecord.value, params.instanceId);
  const id = getUniqueComponentId(instance);
  const name = getInstanceName(instance);
  const file = (_a25 = instance == null ? void 0 : instance.type) == null ? void 0 : _a25.__file;
  const state = processInstanceState(instance);
  return {
    id,
    name,
    file,
    state,
    instance
  };
}

// src/core/component/tree/walker.ts
init_esm_shims();

// src/core/component/tree/filter.ts
init_esm_shims();
var ComponentFilter = class {
  constructor(filter) {
    this.filter = filter || "";
  }
  /**
   * Check if an instance is qualified.
   *
   * @param {Vue|Vnode} instance
   * @return {boolean}
   */
  isQualified(instance) {
    const name = getInstanceName(instance);
    return classify(name).toLowerCase().includes(this.filter) || kebabize(name).toLowerCase().includes(this.filter);
  }
};
function createComponentFilter(filterText) {
  return new ComponentFilter(filterText);
}

// src/core/component/tree/walker.ts
var ComponentWalker = class {
  constructor(options) {
    // Dedupe instances (Some instances may be both on a component and on a child abstract/functional component)
    this.captureIds = /* @__PURE__ */ new Map();
    const { filterText = "", maxDepth, recursively, api } = options;
    this.componentFilter = createComponentFilter(filterText);
    this.maxDepth = maxDepth;
    this.recursively = recursively;
    this.api = api;
  }
  getComponentTree(instance) {
    this.captureIds = /* @__PURE__ */ new Map();
    return this.findQualifiedChildren(instance, 0);
  }
  getComponentParents(instance) {
    this.captureIds = /* @__PURE__ */ new Map();
    const parents = [];
    this.captureId(instance);
    let parent = instance;
    while (parent = parent.parent) {
      this.captureId(parent);
      parents.push(parent);
    }
    return parents;
  }
  captureId(instance) {
    if (!instance)
      return null;
    const id = instance.__VUE_DEVTOOLS_NEXT_UID__ != null ? instance.__VUE_DEVTOOLS_NEXT_UID__ : getUniqueComponentId(instance);
    instance.__VUE_DEVTOOLS_NEXT_UID__ = id;
    if (this.captureIds.has(id))
      return null;
    else
      this.captureIds.set(id, void 0);
    this.mark(instance);
    return id;
  }
  /**
   * Capture the meta information of an instance. (recursive)
   *
   * @param {Vue} instance
   * @return {object}
   */
  async capture(instance, depth) {
    var _a25;
    if (!instance)
      return null;
    const id = this.captureId(instance);
    const name = getInstanceName(instance);
    const children = this.getInternalInstanceChildren(instance.subTree).filter((child) => !isBeingDestroyed(child));
    const parents = this.getComponentParents(instance) || [];
    const inactive = !!instance.isDeactivated || parents.some((parent) => parent.isDeactivated);
    const treeNode = {
      uid: instance.uid,
      id,
      name,
      renderKey: getRenderKey(instance.vnode ? instance.vnode.key : null),
      inactive,
      children: [],
      isFragment: isFragment(instance),
      tags: typeof instance.type !== "function" ? [] : [
        {
          label: "functional",
          textColor: 5592405,
          backgroundColor: 15658734
        }
      ],
      autoOpen: this.recursively,
      file: instance.type.__file || ""
    };
    if (depth < this.maxDepth || instance.type.__isKeepAlive || parents.some((parent) => parent.type.__isKeepAlive)) {
      treeNode.children = await Promise.all(children.map((child) => this.capture(child, depth + 1)).filter(Boolean));
    }
    if (this.isKeepAlive(instance)) {
      const cachedComponents = this.getKeepAliveCachedInstances(instance);
      const childrenIds = children.map((child) => child.__VUE_DEVTOOLS_NEXT_UID__);
      for (const cachedChild of cachedComponents) {
        if (!childrenIds.includes(cachedChild.__VUE_DEVTOOLS_NEXT_UID__)) {
          const node = await this.capture({ ...cachedChild, isDeactivated: true }, depth + 1);
          if (node)
            treeNode.children.push(node);
        }
      }
    }
    const rootElements = getRootElementsFromComponentInstance(instance);
    const firstElement = rootElements[0];
    if (firstElement == null ? void 0 : firstElement.parentElement) {
      const parentInstance = instance.parent;
      const parentRootElements = parentInstance ? getRootElementsFromComponentInstance(parentInstance) : [];
      let el = firstElement;
      const indexList = [];
      do {
        indexList.push(Array.from(el.parentElement.childNodes).indexOf(el));
        el = el.parentElement;
      } while (el.parentElement && parentRootElements.length && !parentRootElements.includes(el));
      treeNode.domOrder = indexList.reverse();
    } else {
      treeNode.domOrder = [-1];
    }
    if ((_a25 = instance.suspense) == null ? void 0 : _a25.suspenseKey) {
      treeNode.tags.push({
        label: instance.suspense.suspenseKey,
        backgroundColor: 14979812,
        textColor: 16777215
      });
      this.mark(instance, true);
    }
    this.api.visitComponentTree({
      treeNode,
      componentInstance: instance,
      app: instance.appContext.app,
      filter: this.componentFilter.filter
    });
    return treeNode;
  }
  /**
   * Find qualified children from a single instance.
   * If the instance itself is qualified, just return itself.
   * This is ok because [].concat works in both cases.
   *
   * @param {Vue|Vnode} instance
   * @return {Vue|Array}
   */
  async findQualifiedChildren(instance, depth) {
    var _a25;
    if (this.componentFilter.isQualified(instance) && !((_a25 = instance.type.devtools) == null ? void 0 : _a25.hide)) {
      return [await this.capture(instance, depth)];
    } else if (instance.subTree) {
      const list = this.isKeepAlive(instance) ? this.getKeepAliveCachedInstances(instance) : this.getInternalInstanceChildren(instance.subTree);
      return this.findQualifiedChildrenFromList(list, depth);
    } else {
      return [];
    }
  }
  /**
   * Iterate through an array of instances and flatten it into
   * an array of qualified instances. This is a depth-first
   * traversal - e.g. if an instance is not matched, we will
   * recursively go deeper until a qualified child is found.
   *
   * @param {Array} instances
   * @return {Array}
   */
  async findQualifiedChildrenFromList(instances, depth) {
    instances = instances.filter((child) => {
      var _a25;
      return !isBeingDestroyed(child) && !((_a25 = child.type.devtools) == null ? void 0 : _a25.hide);
    });
    if (!this.componentFilter.filter)
      return Promise.all(instances.map((child) => this.capture(child, depth)));
    else
      return Array.prototype.concat.apply([], await Promise.all(instances.map((i) => this.findQualifiedChildren(i, depth))));
  }
  /**
   * Get children from a component instance.
   */
  getInternalInstanceChildren(subTree, suspense = null) {
    const list = [];
    if (subTree) {
      if (subTree.component) {
        !suspense ? list.push(subTree.component) : list.push({ ...subTree.component, suspense });
      } else if (subTree.suspense) {
        const suspenseKey = !subTree.suspense.isInFallback ? "suspense default" : "suspense fallback";
        list.push(...this.getInternalInstanceChildren(subTree.suspense.activeBranch, { ...subTree.suspense, suspenseKey }));
      } else if (Array.isArray(subTree.children)) {
        subTree.children.forEach((childSubTree) => {
          if (childSubTree.component)
            !suspense ? list.push(childSubTree.component) : list.push({ ...childSubTree.component, suspense });
          else
            list.push(...this.getInternalInstanceChildren(childSubTree, suspense));
        });
      }
    }
    return list.filter((child) => {
      var _a25;
      return !isBeingDestroyed(child) && !((_a25 = child.type.devtools) == null ? void 0 : _a25.hide);
    });
  }
  /**
   * Mark an instance as captured and store it in the instance map.
   *
   * @param {Vue} instance
   */
  mark(instance, force = false) {
    const instanceMap = getAppRecord(instance).instanceMap;
    if (force || !instanceMap.has(instance.__VUE_DEVTOOLS_NEXT_UID__)) {
      instanceMap.set(instance.__VUE_DEVTOOLS_NEXT_UID__, instance);
      activeAppRecord.value.instanceMap = instanceMap;
    }
  }
  isKeepAlive(instance) {
    return instance.type.__isKeepAlive && instance.__v_cache;
  }
  getKeepAliveCachedInstances(instance) {
    return Array.from(instance.__v_cache.values()).map((vnode) => vnode.component).filter(Boolean);
  }
};

// src/core/timeline/index.ts
init_esm_shims();

// src/core/timeline/perf.ts
init_esm_shims();
var markEndQueue = /* @__PURE__ */ new Map();
var PERFORMANCE_EVENT_LAYER_ID = "performance";
async function performanceMarkStart(api, app, uid, vm, type, time) {
  const appRecord = await getAppRecord(app);
  if (!appRecord) {
    return;
  }
  const componentName = getInstanceName(vm) || "Unknown Component";
  const groupId = devtoolsState.perfUniqueGroupId++;
  const groupKey = `${uid}-${type}`;
  appRecord.perfGroupIds.set(groupKey, { groupId, time });
  await api.addTimelineEvent({
    layerId: PERFORMANCE_EVENT_LAYER_ID,
    event: {
      time: Date.now(),
      data: {
        component: componentName,
        type,
        measure: "start"
      },
      title: componentName,
      subtitle: type,
      groupId
    }
  });
  if (markEndQueue.has(groupKey)) {
    const {
      app: app2,
      uid: uid2,
      instance,
      type: type2,
      time: time2
    } = markEndQueue.get(groupKey);
    markEndQueue.delete(groupKey);
    await performanceMarkEnd(
      api,
      app2,
      uid2,
      instance,
      type2,
      time2
    );
  }
}
function performanceMarkEnd(api, app, uid, vm, type, time) {
  const appRecord = getAppRecord(app);
  if (!appRecord)
    return;
  const componentName = getInstanceName(vm) || "Unknown Component";
  const groupKey = `${uid}-${type}`;
  const groupInfo = appRecord.perfGroupIds.get(groupKey);
  if (groupInfo) {
    const groupId = groupInfo.groupId;
    const startTime = groupInfo.time;
    const duration = time - startTime;
    api.addTimelineEvent({
      layerId: PERFORMANCE_EVENT_LAYER_ID,
      event: {
        time: Date.now(),
        data: {
          component: componentName,
          type,
          measure: "end",
          duration: {
            _custom: {
              type: "Duration",
              value: duration,
              display: `${duration} ms`
            }
          }
        },
        title: componentName,
        subtitle: type,
        groupId
      }
    });
  } else {
    markEndQueue.set(groupKey, { app, uid, instance: vm, type, time });
  }
}

// src/core/timeline/index.ts
var COMPONENT_EVENT_LAYER_ID = "component-event";
function setupBuiltinTimelineLayers(api) {
  if (!isBrowser$1)
    return;
  api.addTimelineLayer({
    id: "mouse",
    label: "Mouse",
    color: 10768815
  });
  ["mousedown", "mouseup", "click", "dblclick"].forEach((eventType) => {
    if (!devtoolsState.timelineLayersState.recordingState || !devtoolsState.timelineLayersState.mouseEventEnabled)
      return;
    window.addEventListener(eventType, async (event) => {
      await api.addTimelineEvent({
        layerId: "mouse",
        event: {
          time: Date.now(),
          data: {
            type: eventType,
            x: event.clientX,
            y: event.clientY
          },
          title: eventType
        }
      });
    }, {
      capture: true,
      passive: true
    });
  });
  api.addTimelineLayer({
    id: "keyboard",
    label: "Keyboard",
    color: 8475055
  });
  ["keyup", "keydown", "keypress"].forEach((eventType) => {
    window.addEventListener(eventType, async (event) => {
      if (!devtoolsState.timelineLayersState.recordingState || !devtoolsState.timelineLayersState.keyboardEventEnabled)
        return;
      await api.addTimelineEvent({
        layerId: "keyboard",
        event: {
          time: Date.now(),
          data: {
            type: eventType,
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey
          },
          title: event.key
        }
      });
    }, {
      capture: true,
      passive: true
    });
  });
  api.addTimelineLayer({
    id: COMPONENT_EVENT_LAYER_ID,
    label: "Component events",
    color: 5226637
  });
  hook.on.componentEmit(async (app, instance, event, params) => {
    if (!devtoolsState.timelineLayersState.recordingState || !devtoolsState.timelineLayersState.componentEventEnabled)
      return;
    const appRecord = await getAppRecord(app);
    if (!appRecord)
      return;
    const componentId = `${appRecord.id}:${instance.uid}`;
    const componentName = getInstanceName(instance) || "Unknown Component";
    api.addTimelineEvent({
      layerId: COMPONENT_EVENT_LAYER_ID,
      event: {
        time: Date.now(),
        data: {
          component: {
            _custom: {
              type: "component-definition",
              display: componentName
            }
          },
          event,
          params
        },
        title: event,
        subtitle: `by ${componentName}`,
        meta: {
          componentId
        }
      }
    });
  });
  api.addTimelineLayer({
    id: "performance",
    label: PERFORMANCE_EVENT_LAYER_ID,
    color: 4307050
  });
  hook.on.perfStart((app, uid, vm, type, time) => {
    if (!devtoolsState.timelineLayersState.recordingState || !devtoolsState.timelineLayersState.performanceEventEnabled)
      return;
    performanceMarkStart(api, app, uid, vm, type, time);
  });
  hook.on.perfEnd((app, uid, vm, type, time) => {
    if (!devtoolsState.timelineLayersState.recordingState || !devtoolsState.timelineLayersState.performanceEventEnabled)
      return;
    performanceMarkEnd(api, app, uid, vm, type, time);
  });
}

// src/core/vm/index.ts
init_esm_shims();
var MAX_$VM = 10;
var $vmQueue = [];
function exposeInstanceToWindow(componentInstance) {
  if (typeof window === "undefined")
    return;
  const win = window;
  if (!componentInstance)
    return;
  win.$vm = componentInstance;
  if ($vmQueue[0] !== componentInstance) {
    if ($vmQueue.length >= MAX_$VM) {
      $vmQueue.pop();
    }
    for (let i = $vmQueue.length; i > 0; i--) {
      win[`$vm${i}`] = $vmQueue[i] = $vmQueue[i - 1];
    }
    win.$vm0 = $vmQueue[0] = componentInstance;
  }
}

// src/core/plugin/components.ts
var INSPECTOR_ID$1 = "components";
function createComponentsDevToolsPlugin(app) {
  const descriptor = {
    id: INSPECTOR_ID$1,
    label: "Components",
    app
  };
  const setupFn = (api) => {
    api.addInspector({
      id: INSPECTOR_ID$1,
      label: "Components",
      treeFilterPlaceholder: "Search components"
    });
    setupBuiltinTimelineLayers(api);
    api.on.getInspectorTree(async (payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID$1) {
        const instance = getComponentInstance(activeAppRecord.value, payload.instanceId);
        if (instance) {
          const walker2 = new ComponentWalker({
            filterText: payload.filter,
            // @TODO: should make this configurable?
            maxDepth: 100,
            recursively: false,
            api
          });
          payload.rootNodes = await walker2.getComponentTree(instance);
        }
      }
    });
    api.on.getInspectorState(async (payload) => {
      var _a25;
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID$1) {
        const result = getInstanceState({
          instanceId: payload.nodeId
        });
        const componentInstance = result.instance;
        const app2 = (_a25 = result.instance) == null ? void 0 : _a25.appContext.app;
        const _payload = {
          componentInstance,
          app: app2,
          instanceData: result
        };
        devtoolsContext.hooks.callHookWith((callbacks) => {
          callbacks.forEach((cb) => cb(_payload));
        }, "inspectComponent" /* INSPECT_COMPONENT */);
        payload.state = result;
        exposeInstanceToWindow(componentInstance);
      }
    });
    api.on.editInspectorState(async (payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID$1) {
        editState(payload);
        await api.sendInspectorState("components");
      }
    });
    const debounceSendInspectorTree = debounce(() => {
      api.sendInspectorTree(INSPECTOR_ID$1);
    }, 120);
    const debounceSendInspectorState = debounce(() => {
      api.sendInspectorState(INSPECTOR_ID$1);
    }, 120);
    const componentAddedCleanup = hook.on.componentAdded(async (app2, uid, parentUid, component) => {
      var _a25, _b25, _c;
      if (devtoolsState.highPerfModeEnabled)
        return;
      if ((_c = (_b25 = (_a25 = app2 == null ? void 0 : app2._instance) == null ? void 0 : _a25.type) == null ? void 0 : _b25.devtools) == null ? void 0 : _c.hide)
        return;
      if (!app2 || typeof uid !== "number" && !uid || !component)
        return;
      const id = await getComponentId({
        app: app2,
        uid,
        instance: component
      });
      const appRecord = await getAppRecord(app2);
      if (component) {
        if (component.__VUE_DEVTOOLS_NEXT_UID__ == null)
          component.__VUE_DEVTOOLS_NEXT_UID__ = id;
        if (!(appRecord == null ? void 0 : appRecord.instanceMap.has(id))) {
          appRecord == null ? void 0 : appRecord.instanceMap.set(id, component);
          if (activeAppRecord.value.id === (appRecord == null ? void 0 : appRecord.id))
            activeAppRecord.value.instanceMap = appRecord.instanceMap;
        }
      }
      if (!appRecord)
        return;
      debounceSendInspectorTree();
    });
    const componentUpdatedCleanup = hook.on.componentUpdated(async (app2, uid, parentUid, component) => {
      var _a25, _b25, _c;
      if (devtoolsState.highPerfModeEnabled)
        return;
      if ((_c = (_b25 = (_a25 = app2 == null ? void 0 : app2._instance) == null ? void 0 : _a25.type) == null ? void 0 : _b25.devtools) == null ? void 0 : _c.hide)
        return;
      if (!app2 || typeof uid !== "number" && !uid || !component)
        return;
      const id = await getComponentId({
        app: app2,
        uid,
        instance: component
      });
      const appRecord = await getAppRecord(app2);
      if (component) {
        if (component.__VUE_DEVTOOLS_NEXT_UID__ == null)
          component.__VUE_DEVTOOLS_NEXT_UID__ = id;
        if (!(appRecord == null ? void 0 : appRecord.instanceMap.has(id))) {
          appRecord == null ? void 0 : appRecord.instanceMap.set(id, component);
          if (activeAppRecord.value.id === (appRecord == null ? void 0 : appRecord.id))
            activeAppRecord.value.instanceMap = appRecord.instanceMap;
        }
      }
      if (!appRecord)
        return;
      debounceSendInspectorTree();
      debounceSendInspectorState();
    });
    const componentRemovedCleanup = hook.on.componentRemoved(async (app2, uid, parentUid, component) => {
      var _a25, _b25, _c;
      if (devtoolsState.highPerfModeEnabled)
        return;
      if ((_c = (_b25 = (_a25 = app2 == null ? void 0 : app2._instance) == null ? void 0 : _a25.type) == null ? void 0 : _b25.devtools) == null ? void 0 : _c.hide)
        return;
      if (!app2 || typeof uid !== "number" && !uid || !component)
        return;
      const appRecord = await getAppRecord(app2);
      if (!appRecord)
        return;
      const id = await getComponentId({
        app: app2,
        uid,
        instance: component
      });
      appRecord == null ? void 0 : appRecord.instanceMap.delete(id);
      if (activeAppRecord.value.id === (appRecord == null ? void 0 : appRecord.id))
        activeAppRecord.value.instanceMap = appRecord.instanceMap;
      debounceSendInspectorTree();
    });
  };
  return [descriptor, setupFn];
}

// src/core/plugin/index.ts
var _a12, _b12;
(_b12 = (_a12 = target).__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__) != null ? _b12 : _a12.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__ = /* @__PURE__ */ new Set();
function setupDevToolsPlugin(pluginDescriptor, setupFn) {
  return hook.setupDevToolsPlugin(pluginDescriptor, setupFn);
}
function callDevToolsPluginSetupFn(plugin, app) {
  const [pluginDescriptor, setupFn] = plugin;
  if (pluginDescriptor.app !== app)
    return;
  const api = new DevToolsPluginAPI({
    plugin: {
      setupFn,
      descriptor: pluginDescriptor
    },
    ctx: devtoolsContext
  });
  if (pluginDescriptor.packageName === "vuex") {
    api.on.editInspectorState((payload) => {
      api.sendInspectorState(payload.inspectorId);
    });
  }
  setupFn(api);
}
function removeRegisteredPluginApp(app) {
  target.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__.delete(app);
}
function registerDevToolsPlugin(app, options) {
  if (target.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__.has(app)) {
    return;
  }
  if (devtoolsState.highPerfModeEnabled && !(options == null ? void 0 : options.inspectingComponent)) {
    return;
  }
  target.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__.add(app);
  devtoolsPluginBuffer.forEach((plugin) => {
    callDevToolsPluginSetupFn(plugin, app);
  });
}

// src/core/router/index.ts
init_esm_shims();

// src/ctx/router.ts
init_esm_shims();
var ROUTER_KEY = "__VUE_DEVTOOLS_ROUTER__";
var ROUTER_INFO_KEY = "__VUE_DEVTOOLS_ROUTER_INFO__";
var _a13, _b13;
(_b13 = (_a13 = target)[ROUTER_INFO_KEY]) != null ? _b13 : _a13[ROUTER_INFO_KEY] = {
  currentRoute: null,
  routes: []
};
var _a14, _b14;
(_b14 = (_a14 = target)[ROUTER_KEY]) != null ? _b14 : _a14[ROUTER_KEY] = {};
var devtoolsRouterInfo = new Proxy(target[ROUTER_INFO_KEY], {
  get(target22, property) {
    return target[ROUTER_INFO_KEY][property];
  }
});
var devtoolsRouter = new Proxy(target[ROUTER_KEY], {
  get(target22, property) {
    if (property === "value") {
      return target[ROUTER_KEY];
    }
  }
});

// src/core/router/index.ts
function getRoutes(router) {
  const routesMap = /* @__PURE__ */ new Map();
  return ((router == null ? void 0 : router.getRoutes()) || []).filter((i) => !routesMap.has(i.path) && routesMap.set(i.path, 1));
}
function filterRoutes(routes) {
  return routes.map((item) => {
    let { path, name, children, meta } = item;
    if (children == null ? void 0 : children.length)
      children = filterRoutes(children);
    return {
      path,
      name,
      children,
      meta
    };
  });
}
function filterCurrentRoute(route) {
  if (route) {
    const { fullPath, hash, href, path, name, matched, params, query } = route;
    return {
      fullPath,
      hash,
      href,
      path,
      name,
      params,
      query,
      matched: filterRoutes(matched)
    };
  }
  return route;
}
function normalizeRouterInfo(appRecord, activeAppRecord2) {
  function init() {
    var _a25;
    const router = (_a25 = appRecord.app) == null ? void 0 : _a25.config.globalProperties.$router;
    const currentRoute = filterCurrentRoute(router == null ? void 0 : router.currentRoute.value);
    const routes = filterRoutes(getRoutes(router));
    const c = console.warn;
    console.warn = () => {
    };
    target[ROUTER_INFO_KEY] = {
      currentRoute: currentRoute ? deepClone(currentRoute) : {},
      routes: deepClone(routes)
    };
    target[ROUTER_KEY] = router;
    console.warn = c;
  }
  init();
  hook.on.componentUpdated(debounce(() => {
    var _a25;
    if (((_a25 = activeAppRecord2.value) == null ? void 0 : _a25.app) !== appRecord.app)
      return;
    init();
    if (devtoolsState.highPerfModeEnabled)
      return;
    devtoolsContext.hooks.callHook("routerInfoUpdated" /* ROUTER_INFO_UPDATED */, { state: target[ROUTER_INFO_KEY] });
  }, 200));
}

// src/ctx/api.ts
function createDevToolsApi(hooks2) {
  return {
    // get inspector tree
    async getInspectorTree(payload) {
      const _payload = {
        ...payload,
        app: activeAppRecord.value.app,
        rootNodes: []
      };
      await new Promise((resolve) => {
        hooks2.callHookWith(async (callbacks) => {
          await Promise.all(callbacks.map((cb) => cb(_payload)));
          resolve();
        }, "getInspectorTree" /* GET_INSPECTOR_TREE */);
      });
      return _payload.rootNodes;
    },
    // get inspector state
    async getInspectorState(payload) {
      const _payload = {
        ...payload,
        app: activeAppRecord.value.app,
        state: null
      };
      const ctx = {
        currentTab: `custom-inspector:${payload.inspectorId}`
      };
      await new Promise((resolve) => {
        hooks2.callHookWith(async (callbacks) => {
          await Promise.all(callbacks.map((cb) => cb(_payload, ctx)));
          resolve();
        }, "getInspectorState" /* GET_INSPECTOR_STATE */);
      });
      return _payload.state;
    },
    // edit inspector state
    editInspectorState(payload) {
      const stateEditor2 = new StateEditor();
      const _payload = {
        ...payload,
        app: activeAppRecord.value.app,
        set: (obj, path = payload.path, value = payload.state.value, cb) => {
          stateEditor2.set(obj, path, value, cb || stateEditor2.createDefaultSetCallback(payload.state));
        }
      };
      hooks2.callHookWith((callbacks) => {
        callbacks.forEach((cb) => cb(_payload));
      }, "editInspectorState" /* EDIT_INSPECTOR_STATE */);
    },
    // send inspector state
    sendInspectorState(inspectorId) {
      const inspector = getInspector(inspectorId);
      hooks2.callHook("sendInspectorState" /* SEND_INSPECTOR_STATE */, { inspectorId, plugin: {
        descriptor: inspector.descriptor,
        setupFn: () => ({})
      } });
    },
    // inspect component inspector
    inspectComponentInspector() {
      return inspectComponentHighLighter();
    },
    // cancel inspect component inspector
    cancelInspectComponentInspector() {
      return cancelInspectComponentHighLighter();
    },
    // get component render code
    getComponentRenderCode(id) {
      const instance = getComponentInstance(activeAppRecord.value, id);
      if (instance)
        return !(typeof (instance == null ? void 0 : instance.type) === "function") ? instance.render.toString() : instance.type.toString();
    },
    // scroll to component
    scrollToComponent(id) {
      return scrollToComponent({ id });
    },
    // open in editor
    openInEditor,
    // get vue inspector
    getVueInspector: getComponentInspector,
    // toggle app
    toggleApp(id, options) {
      const appRecord = devtoolsAppRecords.value.find((record) => record.id === id);
      if (appRecord) {
        setActiveAppRecordId(id);
        setActiveAppRecord(appRecord);
        normalizeRouterInfo(appRecord, activeAppRecord);
        callInspectorUpdatedHook();
        registerDevToolsPlugin(appRecord.app, options);
      }
    },
    // inspect dom
    inspectDOM(instanceId) {
      const instance = getComponentInstance(activeAppRecord.value, instanceId);
      if (instance) {
        const [el] = getRootElementsFromComponentInstance(instance);
        if (el) {
          target.__VUE_DEVTOOLS_INSPECT_DOM_TARGET__ = el;
        }
      }
    },
    updatePluginSettings(pluginId, key, value) {
      setPluginSettings(pluginId, key, value);
    },
    getPluginSettings(pluginId) {
      return {
        options: getPluginSettingsOptions(pluginId),
        values: getPluginSettings(pluginId)
      };
    }
  };
}

// src/ctx/env.ts
init_esm_shims();
var _a15, _b15;
(_b15 = (_a15 = target).__VUE_DEVTOOLS_ENV__) != null ? _b15 : _a15.__VUE_DEVTOOLS_ENV__ = {
  vitePluginDetected: false
};
function getDevToolsEnv() {
  return target.__VUE_DEVTOOLS_ENV__;
}
function setDevToolsEnv(env) {
  target.__VUE_DEVTOOLS_ENV__ = {
    ...target.__VUE_DEVTOOLS_ENV__,
    ...env
  };
}

// src/ctx/index.ts
var hooks = createDevToolsCtxHooks();
var _a16, _b16;
(_b16 = (_a16 = target).__VUE_DEVTOOLS_KIT_CONTEXT__) != null ? _b16 : _a16.__VUE_DEVTOOLS_KIT_CONTEXT__ = {
  hooks,
  get state() {
    return {
      ...devtoolsState,
      activeAppRecordId: activeAppRecord.id,
      activeAppRecord: activeAppRecord.value,
      appRecords: devtoolsAppRecords.value
    };
  },
  api: createDevToolsApi(hooks)
};
var devtoolsContext = target.__VUE_DEVTOOLS_KIT_CONTEXT__;

// src/core/app/index.ts
init_esm_shims();
var import_speakingurl = __toESM(require_speakingurl2(), 1);
var _a17, _b17;
var appRecordInfo = (_b17 = (_a17 = target).__VUE_DEVTOOLS_NEXT_APP_RECORD_INFO__) != null ? _b17 : _a17.__VUE_DEVTOOLS_NEXT_APP_RECORD_INFO__ = {
  id: 0,
  appIds: /* @__PURE__ */ new Set()
};
function getAppRecordName(app, fallbackName) {
  var _a25;
  return ((_a25 = app == null ? void 0 : app._component) == null ? void 0 : _a25.name) || `App ${fallbackName}`;
}
function getAppRootInstance(app) {
  var _a25, _b25, _c, _d;
  if (app._instance)
    return app._instance;
  else if ((_b25 = (_a25 = app._container) == null ? void 0 : _a25._vnode) == null ? void 0 : _b25.component)
    return (_d = (_c = app._container) == null ? void 0 : _c._vnode) == null ? void 0 : _d.component;
}
function removeAppRecordId(app) {
  const id = app.__VUE_DEVTOOLS_NEXT_APP_RECORD_ID__;
  if (id != null) {
    appRecordInfo.appIds.delete(id);
    appRecordInfo.id--;
  }
}
function getAppRecordId(app, defaultId) {
  if (app.__VUE_DEVTOOLS_NEXT_APP_RECORD_ID__ != null)
    return app.__VUE_DEVTOOLS_NEXT_APP_RECORD_ID__;
  let id = defaultId != null ? defaultId : (appRecordInfo.id++).toString();
  if (defaultId && appRecordInfo.appIds.has(id)) {
    let count = 1;
    while (appRecordInfo.appIds.has(`${defaultId}_${count}`))
      count++;
    id = `${defaultId}_${count}`;
  }
  appRecordInfo.appIds.add(id);
  app.__VUE_DEVTOOLS_NEXT_APP_RECORD_ID__ = id;
  return id;
}
function createAppRecord(app, types) {
  var _a25, _b25;
  const rootInstance = getAppRootInstance(app);
  if (rootInstance) {
    appRecordInfo.id++;
    const name = getAppRecordName(app, appRecordInfo.id.toString());
    const id = getAppRecordId(app, (0, import_speakingurl.default)(name));
    const [el] = getRootElementsFromComponentInstance(rootInstance);
    const record = {
      id,
      name,
      types,
      instanceMap: /* @__PURE__ */ new Map(),
      perfGroupIds: /* @__PURE__ */ new Map(),
      rootInstance,
      iframe: isBrowser$1 && document !== (el == null ? void 0 : el.ownerDocument) ? (_b25 = (_a25 = el == null ? void 0 : el.ownerDocument) == null ? void 0 : _a25.location) == null ? void 0 : _b25.pathname : void 0
    };
    app.__VUE_DEVTOOLS_NEXT_APP_RECORD__ = record;
    const rootId = `${record.id}:root`;
    record.instanceMap.set(rootId, record.rootInstance);
    record.rootInstance.__VUE_DEVTOOLS_NEXT_UID__ = rootId;
    return record;
  } else {
    return {};
  }
}

// src/core/iframe/index.ts
init_esm_shims();
function detectIframeApp(target22, inIframe = false) {
  if (inIframe) {
    let sendEventToParent2 = function(cb) {
      try {
        const hook3 = window.parent.__VUE_DEVTOOLS_GLOBAL_HOOK__;
        if (hook3) {
          cb(hook3);
        }
      } catch (e) {
      }
    };
    var sendEventToParent = sendEventToParent2;
    const hook2 = {
      id: "vue-devtools-next",
      devtoolsVersion: "7.0",
      on: (event, cb) => {
        sendEventToParent2((hook3) => {
          hook3.on(event, cb);
        });
      },
      once: (event, cb) => {
        sendEventToParent2((hook3) => {
          hook3.once(event, cb);
        });
      },
      off: (event, cb) => {
        sendEventToParent2((hook3) => {
          hook3.off(event, cb);
        });
      },
      emit: (event, ...payload) => {
        sendEventToParent2((hook3) => {
          hook3.emit(event, ...payload);
        });
      }
    };
    Object.defineProperty(target22, "__VUE_DEVTOOLS_GLOBAL_HOOK__", {
      get() {
        return hook2;
      },
      configurable: true
    });
  }
  function injectVueHookToIframe(iframe) {
    if (iframe.__vdevtools__injected) {
      return;
    }
    try {
      iframe.__vdevtools__injected = true;
      const inject = () => {
        try {
          iframe.contentWindow.__VUE_DEVTOOLS_IFRAME__ = iframe;
          const script = iframe.contentDocument.createElement("script");
          script.textContent = `;(${detectIframeApp.toString()})(window, true)`;
          iframe.contentDocument.documentElement.appendChild(script);
          script.parentNode.removeChild(script);
        } catch (e) {
        }
      };
      inject();
      iframe.addEventListener("load", () => inject());
    } catch (e) {
    }
  }
  function injectVueHookToIframes() {
    if (typeof window === "undefined") {
      return;
    }
    const iframes = Array.from(document.querySelectorAll("iframe:not([data-vue-devtools-ignore])"));
    for (const iframe of iframes) {
      injectVueHookToIframe(iframe);
    }
  }
  injectVueHookToIframes();
  let iframeAppChecks = 0;
  const iframeAppCheckTimer = setInterval(() => {
    injectVueHookToIframes();
    iframeAppChecks++;
    if (iframeAppChecks >= 5) {
      clearInterval(iframeAppCheckTimer);
    }
  }, 1e3);
}

// src/core/index.ts
function initDevTools() {
  var _a25;
  detectIframeApp(target);
  updateDevToolsState({
    vitePluginDetected: getDevToolsEnv().vitePluginDetected
  });
  const isDevToolsNext = ((_a25 = target.__VUE_DEVTOOLS_GLOBAL_HOOK__) == null ? void 0 : _a25.id) === "vue-devtools-next";
  if (target.__VUE_DEVTOOLS_GLOBAL_HOOK__ && isDevToolsNext)
    return;
  const _devtoolsHook = createDevToolsHook();
  if (target.__VUE_DEVTOOLS_HOOK_REPLAY__) {
    try {
      target.__VUE_DEVTOOLS_HOOK_REPLAY__.forEach((cb) => cb(_devtoolsHook));
      target.__VUE_DEVTOOLS_HOOK_REPLAY__ = [];
    } catch (e) {
      console.error("[vue-devtools] Error during hook replay", e);
    }
  }
  _devtoolsHook.once("init", (Vue) => {
    target.__VUE_DEVTOOLS_VUE2_APP_DETECTED__ = true;
    console.log("%c[_____Vue DevTools v7 log_____]", "color: red; font-bold: 600; font-size: 16px;");
    console.log("%cVue DevTools v7 detected in your Vue2 project. v7 only supports Vue3 and will not work.", "font-bold: 500; font-size: 14px;");
    const legacyChromeUrl = "https://chromewebstore.google.com/detail/vuejs-devtools/iaajmlceplecbljialhhkmedjlpdblhp";
    const legacyFirefoxUrl = "https://addons.mozilla.org/firefox/addon/vue-js-devtools-v6-legacy";
    console.log(`%cThe legacy version of chrome extension that supports both Vue 2 and Vue 3 has been moved to %c ${legacyChromeUrl}`, "font-size: 14px;", "text-decoration: underline; cursor: pointer;font-size: 14px;");
    console.log(`%cThe legacy version of firefox extension that supports both Vue 2 and Vue 3 has been moved to %c ${legacyFirefoxUrl}`, "font-size: 14px;", "text-decoration: underline; cursor: pointer;font-size: 14px;");
    console.log("%cPlease install and enable only the legacy version for your Vue2 app.", "font-bold: 500; font-size: 14px;");
    console.log("%c[_____Vue DevTools v7 log_____]", "color: red; font-bold: 600; font-size: 16px;");
  });
  hook.on.setupDevtoolsPlugin((pluginDescriptor, setupFn) => {
    var _a26;
    addDevToolsPluginToBuffer(pluginDescriptor, setupFn);
    const { app } = (_a26 = activeAppRecord) != null ? _a26 : {};
    if (pluginDescriptor.settings) {
      initPluginSettings(pluginDescriptor.id, pluginDescriptor.settings);
    }
    if (!app)
      return;
    callDevToolsPluginSetupFn([pluginDescriptor, setupFn], app);
  });
  onLegacyDevToolsPluginApiAvailable(() => {
    const normalizedPluginBuffer = devtoolsPluginBuffer.filter(([item]) => item.id !== "components");
    normalizedPluginBuffer.forEach(([pluginDescriptor, setupFn]) => {
      _devtoolsHook.emit("devtools-plugin:setup" /* SETUP_DEVTOOLS_PLUGIN */, pluginDescriptor, setupFn, { target: "legacy" });
    });
  });
  hook.on.vueAppInit(async (app, version, types) => {
    const appRecord = createAppRecord(app, types);
    const normalizedAppRecord = {
      ...appRecord,
      app,
      version
    };
    addDevToolsAppRecord(normalizedAppRecord);
    if (devtoolsAppRecords.value.length === 1) {
      setActiveAppRecord(normalizedAppRecord);
      setActiveAppRecordId(normalizedAppRecord.id);
      normalizeRouterInfo(normalizedAppRecord, activeAppRecord);
      registerDevToolsPlugin(normalizedAppRecord.app);
    }
    setupDevToolsPlugin(...createComponentsDevToolsPlugin(normalizedAppRecord.app));
    updateDevToolsState({
      connected: true
    });
    _devtoolsHook.apps.push(app);
  });
  hook.on.vueAppUnmount(async (app) => {
    const activeRecords = devtoolsAppRecords.value.filter((appRecord) => appRecord.app !== app);
    if (activeRecords.length === 0) {
      updateDevToolsState({
        connected: false
      });
    }
    removeDevToolsAppRecord(app);
    removeAppRecordId(app);
    if (activeAppRecord.value.app === app) {
      setActiveAppRecord(activeRecords[0]);
      devtoolsContext.hooks.callHook("sendActiveAppUpdatedToClient" /* SEND_ACTIVE_APP_UNMOUNTED_TO_CLIENT */);
    }
    target.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps.splice(target.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps.indexOf(app), 1);
    removeRegisteredPluginApp(app);
  });
  subscribeDevToolsHook(_devtoolsHook);
  if (!target.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    Object.defineProperty(target, "__VUE_DEVTOOLS_GLOBAL_HOOK__", {
      get() {
        return _devtoolsHook;
      },
      configurable: true
    });
  } else {
    if (!isNuxtApp) {
      Object.assign(__VUE_DEVTOOLS_GLOBAL_HOOK__, _devtoolsHook);
    }
  }
}
function onDevToolsClientConnected(fn) {
  return new Promise((resolve) => {
    if (devtoolsState.connected && devtoolsState.clientConnected) {
      fn();
      resolve();
      return;
    }
    devtoolsContext.hooks.hook("devtoolsConnectedUpdated" /* DEVTOOLS_CONNECTED_UPDATED */, ({ state }) => {
      if (state.connected && state.clientConnected) {
        fn();
        resolve();
      }
    });
  });
}

// src/core/high-perf-mode/index.ts
init_esm_shims();
function toggleHighPerfMode(state) {
  devtoolsState.highPerfModeEnabled = state != null ? state : !devtoolsState.highPerfModeEnabled;
  if (!state && activeAppRecord.value) {
    registerDevToolsPlugin(activeAppRecord.value.app);
  }
}

// src/core/component/state/format.ts
init_esm_shims();

// src/core/component/state/reviver.ts
init_esm_shims();
function reviveSet(val) {
  const result = /* @__PURE__ */ new Set();
  const list = val._custom.value;
  for (let i = 0; i < list.length; i++) {
    const value = list[i];
    result.add(revive(value));
  }
  return result;
}
function reviveMap(val) {
  const result = /* @__PURE__ */ new Map();
  const list = val._custom.value;
  for (let i = 0; i < list.length; i++) {
    const { key, value } = list[i];
    result.set(key, revive(value));
  }
  return result;
}
function revive(val) {
  if (val === UNDEFINED) {
    return void 0;
  } else if (val === INFINITY) {
    return Number.POSITIVE_INFINITY;
  } else if (val === NEGATIVE_INFINITY) {
    return Number.NEGATIVE_INFINITY;
  } else if (val === NAN) {
    return Number.NaN;
  } else if (val && val._custom) {
    const { _custom: custom } = val;
    if (custom.type === "component")
      return activeAppRecord.value.instanceMap.get(custom.id);
    else if (custom.type === "map")
      return reviveMap(val);
    else if (custom.type === "set")
      return reviveSet(val);
    else if (custom.type === "bigint")
      return BigInt(custom.value);
    else
      return revive(custom.value);
  } else if (symbolRE.test(val)) {
    const [, string] = symbolRE.exec(val);
    return Symbol.for(string);
  } else if (specialTypeRE.test(val)) {
    const [, type, string, , details] = specialTypeRE.exec(val);
    const result = new target[type](string);
    if (type === "Error" && details)
      result.stack = details;
    return result;
  } else {
    return val;
  }
}
function reviver(key, value) {
  return revive(value);
}

// src/core/component/state/format.ts
function getInspectorStateValueType(value, raw = true) {
  const type = typeof value;
  if (value == null || value === UNDEFINED || value === "undefined") {
    return "null";
  } else if (type === "boolean" || type === "number" || value === INFINITY || value === NEGATIVE_INFINITY || value === NAN) {
    return "literal";
  } else if (value == null ? void 0 : value._custom) {
    if (raw || value._custom.display != null || value._custom.displayText != null)
      return "custom";
    else
      return getInspectorStateValueType(value._custom.value);
  } else if (typeof value === "string") {
    const typeMatch = specialTypeRE.exec(value);
    if (typeMatch) {
      const [, type2] = typeMatch;
      return `native ${type2}`;
    } else {
      return "string";
    }
  } else if (Array.isArray(value) || (value == null ? void 0 : value._isArray)) {
    return "array";
  } else if (isPlainObject$1(value)) {
    return "plain-object";
  } else {
    return "unknown";
  }
}
function formatInspectorStateValue(value, quotes = false, options) {
  var _a25, _b25, _c;
  const { customClass } = options != null ? options : {};
  let result;
  const type = getInspectorStateValueType(value, false);
  if (type !== "custom" && (value == null ? void 0 : value._custom))
    value = value._custom.value;
  if (result = internalStateTokenToString(value)) {
    return result;
  } else if (type === "custom") {
    const nestedName = ((_a25 = value._custom.value) == null ? void 0 : _a25._custom) && formatInspectorStateValue(value._custom.value, quotes, options);
    return nestedName || value._custom.displayText || value._custom.display;
  } else if (type === "array") {
    return `Array[${value.length}]`;
  } else if (type === "plain-object") {
    return `Object${Object.keys(value).length ? "" : " (empty)"}`;
  } else if (type == null ? void 0 : type.includes("native")) {
    return escape((_b25 = specialTypeRE.exec(value)) == null ? void 0 : _b25[2]);
  } else if (typeof value === "string") {
    const typeMatch = value.match(rawTypeRE);
    if (typeMatch) {
      value = escapeString(typeMatch[1]);
    } else if (quotes) {
      value = `<span>"</span>${(customClass == null ? void 0 : customClass.string) ? `<span class=${customClass.string}>${escapeString(value)}</span>` : escapeString(value)}<span>"</span>`;
    } else {
      value = (customClass == null ? void 0 : customClass.string) ? `<span class="${(_c = customClass == null ? void 0 : customClass.string) != null ? _c : ""}">${escapeString(value)}</span>` : escapeString(value);
    }
  }
  return value;
}
function escapeString(value) {
  return escape(value).replace(/ /g, "&nbsp;").replace(/\n/g, "<span>\\n</span>");
}
function getRaw(value) {
  var _a25, _b25, _c;
  let customType;
  const isCustom = getInspectorStateValueType(value) === "custom";
  let inherit = {};
  if (isCustom) {
    const data = value;
    const customValue = (_a25 = data._custom) == null ? void 0 : _a25.value;
    const currentCustomType = (_b25 = data._custom) == null ? void 0 : _b25.type;
    const nestedCustom = typeof customValue === "object" && customValue !== null && "_custom" in customValue ? getRaw(customValue) : { inherit: void 0, value: void 0, customType: void 0 };
    inherit = nestedCustom.inherit || ((_c = data._custom) == null ? void 0 : _c.fields) || {};
    value = nestedCustom.value || customValue;
    customType = nestedCustom.customType || currentCustomType;
  }
  if (value && value._isArray)
    value = value.items;
  return { value, inherit, customType };
}
function toEdit(value, customType) {
  if (customType === "bigint")
    return value;
  if (customType === "date")
    return value;
  return replaceTokenToString(JSON.stringify(value));
}
function toSubmit(value, customType) {
  if (customType === "bigint")
    return BigInt(value);
  if (customType === "date")
    return new Date(value);
  return JSON.parse(replaceStringToToken(value), reviver);
}

// src/core/devtools-client/detected.ts
init_esm_shims();
function updateDevToolsClientDetected(params) {
  devtoolsState.devtoolsClientDetected = {
    ...devtoolsState.devtoolsClientDetected,
    ...params
  };
  const devtoolsClientVisible = Object.values(devtoolsState.devtoolsClientDetected).some(Boolean);
  toggleHighPerfMode(!devtoolsClientVisible);
}
var _a18, _b18;
(_b18 = (_a18 = target).__VUE_DEVTOOLS_UPDATE_CLIENT_DETECTED__) != null ? _b18 : _a18.__VUE_DEVTOOLS_UPDATE_CLIENT_DETECTED__ = updateDevToolsClientDetected;

// src/messaging/index.ts
init_esm_shims();

// src/messaging/presets/index.ts
init_esm_shims();

// src/messaging/presets/broadcast-channel/index.ts
init_esm_shims();

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/index.js
init_esm_shims();

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/class-registry.js
init_esm_shims();

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/registry.js
init_esm_shims();

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/double-indexed-kv.js
init_esm_shims();
var DoubleIndexedKV = class {
  constructor() {
    this.keyToValue = /* @__PURE__ */ new Map();
    this.valueToKey = /* @__PURE__ */ new Map();
  }
  set(key, value) {
    this.keyToValue.set(key, value);
    this.valueToKey.set(value, key);
  }
  getByKey(key) {
    return this.keyToValue.get(key);
  }
  getByValue(value) {
    return this.valueToKey.get(value);
  }
  clear() {
    this.keyToValue.clear();
    this.valueToKey.clear();
  }
};

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/registry.js
var Registry = class {
  constructor(generateIdentifier) {
    this.generateIdentifier = generateIdentifier;
    this.kv = new DoubleIndexedKV();
  }
  register(value, identifier) {
    if (this.kv.getByValue(value)) {
      return;
    }
    if (!identifier) {
      identifier = this.generateIdentifier(value);
    }
    this.kv.set(identifier, value);
  }
  clear() {
    this.kv.clear();
  }
  getIdentifier(value) {
    return this.kv.getByValue(value);
  }
  getValue(identifier) {
    return this.kv.getByKey(identifier);
  }
};

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/class-registry.js
var ClassRegistry = class extends Registry {
  constructor() {
    super((c) => c.name);
    this.classToAllowedProps = /* @__PURE__ */ new Map();
  }
  register(value, options) {
    if (typeof options === "object") {
      if (options.allowProps) {
        this.classToAllowedProps.set(value, options.allowProps);
      }
      super.register(value, options.identifier);
    } else {
      super.register(value, options);
    }
  }
  getAllowedProps(value) {
    return this.classToAllowedProps.get(value);
  }
};

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/custom-transformer-registry.js
init_esm_shims();

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/util.js
init_esm_shims();
function valuesOfObj(record) {
  if ("values" in Object) {
    return Object.values(record);
  }
  const values = [];
  for (const key in record) {
    if (record.hasOwnProperty(key)) {
      values.push(record[key]);
    }
  }
  return values;
}
function find(record, predicate) {
  const values = valuesOfObj(record);
  if ("find" in values) {
    return values.find(predicate);
  }
  const valuesNotNever = values;
  for (let i = 0; i < valuesNotNever.length; i++) {
    const value = valuesNotNever[i];
    if (predicate(value)) {
      return value;
    }
  }
  return void 0;
}
function forEach(record, run) {
  Object.entries(record).forEach(([key, value]) => run(value, key));
}
function includes(arr, value) {
  return arr.indexOf(value) !== -1;
}
function findArr(record, predicate) {
  for (let i = 0; i < record.length; i++) {
    const value = record[i];
    if (predicate(value)) {
      return value;
    }
  }
  return void 0;
}

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/custom-transformer-registry.js
var CustomTransformerRegistry = class {
  constructor() {
    this.transfomers = {};
  }
  register(transformer) {
    this.transfomers[transformer.name] = transformer;
  }
  findApplicable(v) {
    return find(this.transfomers, (transformer) => transformer.isApplicable(v));
  }
  findByName(name) {
    return this.transfomers[name];
  }
};

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/plainer.js
init_esm_shims();

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/is.js
init_esm_shims();
var getType = (payload) => Object.prototype.toString.call(payload).slice(8, -1);
var isUndefined = (payload) => typeof payload === "undefined";
var isNull = (payload) => payload === null;
var isPlainObject2 = (payload) => {
  if (typeof payload !== "object" || payload === null)
    return false;
  if (payload === Object.prototype)
    return false;
  if (Object.getPrototypeOf(payload) === null)
    return true;
  return Object.getPrototypeOf(payload) === Object.prototype;
};
var isEmptyObject = (payload) => isPlainObject2(payload) && Object.keys(payload).length === 0;
var isArray = (payload) => Array.isArray(payload);
var isString = (payload) => typeof payload === "string";
var isNumber = (payload) => typeof payload === "number" && !isNaN(payload);
var isBoolean = (payload) => typeof payload === "boolean";
var isRegExp = (payload) => payload instanceof RegExp;
var isMap = (payload) => payload instanceof Map;
var isSet = (payload) => payload instanceof Set;
var isSymbol = (payload) => getType(payload) === "Symbol";
var isDate = (payload) => payload instanceof Date && !isNaN(payload.valueOf());
var isError = (payload) => payload instanceof Error;
var isNaNValue = (payload) => typeof payload === "number" && isNaN(payload);
var isPrimitive2 = (payload) => isBoolean(payload) || isNull(payload) || isUndefined(payload) || isNumber(payload) || isString(payload) || isSymbol(payload);
var isBigint = (payload) => typeof payload === "bigint";
var isInfinite = (payload) => payload === Infinity || payload === -Infinity;
var isTypedArray = (payload) => ArrayBuffer.isView(payload) && !(payload instanceof DataView);
var isURL = (payload) => payload instanceof URL;

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/pathstringifier.js
init_esm_shims();
var escapeKey = (key) => key.replace(/\./g, "\\.");
var stringifyPath = (path) => path.map(String).map(escapeKey).join(".");
var parsePath = (string) => {
  const result = [];
  let segment = "";
  for (let i = 0; i < string.length; i++) {
    let char = string.charAt(i);
    const isEscapedDot = char === "\\" && string.charAt(i + 1) === ".";
    if (isEscapedDot) {
      segment += ".";
      i++;
      continue;
    }
    const isEndOfSegment = char === ".";
    if (isEndOfSegment) {
      result.push(segment);
      segment = "";
      continue;
    }
    segment += char;
  }
  const lastSegment = segment;
  result.push(lastSegment);
  return result;
};

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/transformer.js
init_esm_shims();
function simpleTransformation(isApplicable, annotation, transform, untransform) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform
  };
}
var simpleRules = [
  simpleTransformation(isUndefined, "undefined", () => null, () => void 0),
  simpleTransformation(isBigint, "bigint", (v) => v.toString(), (v) => {
    if (typeof BigInt !== "undefined") {
      return BigInt(v);
    }
    console.error("Please add a BigInt polyfill.");
    return v;
  }),
  simpleTransformation(isDate, "Date", (v) => v.toISOString(), (v) => new Date(v)),
  simpleTransformation(isError, "Error", (v, superJson) => {
    const baseError = {
      name: v.name,
      message: v.message
    };
    superJson.allowedErrorProps.forEach((prop) => {
      baseError[prop] = v[prop];
    });
    return baseError;
  }, (v, superJson) => {
    const e = new Error(v.message);
    e.name = v.name;
    e.stack = v.stack;
    superJson.allowedErrorProps.forEach((prop) => {
      e[prop] = v[prop];
    });
    return e;
  }),
  simpleTransformation(isRegExp, "regexp", (v) => "" + v, (regex) => {
    const body = regex.slice(1, regex.lastIndexOf("/"));
    const flags = regex.slice(regex.lastIndexOf("/") + 1);
    return new RegExp(body, flags);
  }),
  simpleTransformation(
    isSet,
    "set",
    // (sets only exist in es6+)
    // eslint-disable-next-line es5/no-es6-methods
    (v) => [...v.values()],
    (v) => new Set(v)
  ),
  simpleTransformation(isMap, "map", (v) => [...v.entries()], (v) => new Map(v)),
  simpleTransformation((v) => isNaNValue(v) || isInfinite(v), "number", (v) => {
    if (isNaNValue(v)) {
      return "NaN";
    }
    if (v > 0) {
      return "Infinity";
    } else {
      return "-Infinity";
    }
  }, Number),
  simpleTransformation((v) => v === 0 && 1 / v === -Infinity, "number", () => {
    return "-0";
  }, Number),
  simpleTransformation(isURL, "URL", (v) => v.toString(), (v) => new URL(v))
];
function compositeTransformation(isApplicable, annotation, transform, untransform) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform
  };
}
var symbolRule = compositeTransformation((s, superJson) => {
  if (isSymbol(s)) {
    const isRegistered = !!superJson.symbolRegistry.getIdentifier(s);
    return isRegistered;
  }
  return false;
}, (s, superJson) => {
  const identifier = superJson.symbolRegistry.getIdentifier(s);
  return ["symbol", identifier];
}, (v) => v.description, (_, a, superJson) => {
  const value = superJson.symbolRegistry.getValue(a[1]);
  if (!value) {
    throw new Error("Trying to deserialize unknown symbol");
  }
  return value;
});
var constructorToName = [
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  Uint8ClampedArray
].reduce((obj, ctor) => {
  obj[ctor.name] = ctor;
  return obj;
}, {});
var typedArrayRule = compositeTransformation(isTypedArray, (v) => ["typed-array", v.constructor.name], (v) => [...v], (v, a) => {
  const ctor = constructorToName[a[1]];
  if (!ctor) {
    throw new Error("Trying to deserialize unknown typed array");
  }
  return new ctor(v);
});
function isInstanceOfRegisteredClass(potentialClass, superJson) {
  if (potentialClass == null ? void 0 : potentialClass.constructor) {
    const isRegistered = !!superJson.classRegistry.getIdentifier(potentialClass.constructor);
    return isRegistered;
  }
  return false;
}
var classRule = compositeTransformation(isInstanceOfRegisteredClass, (clazz, superJson) => {
  const identifier = superJson.classRegistry.getIdentifier(clazz.constructor);
  return ["class", identifier];
}, (clazz, superJson) => {
  const allowedProps = superJson.classRegistry.getAllowedProps(clazz.constructor);
  if (!allowedProps) {
    return { ...clazz };
  }
  const result = {};
  allowedProps.forEach((prop) => {
    result[prop] = clazz[prop];
  });
  return result;
}, (v, a, superJson) => {
  const clazz = superJson.classRegistry.getValue(a[1]);
  if (!clazz) {
    throw new Error(`Trying to deserialize unknown class '${a[1]}' - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564`);
  }
  return Object.assign(Object.create(clazz.prototype), v);
});
var customRule = compositeTransformation((value, superJson) => {
  return !!superJson.customTransformerRegistry.findApplicable(value);
}, (value, superJson) => {
  const transformer = superJson.customTransformerRegistry.findApplicable(value);
  return ["custom", transformer.name];
}, (value, superJson) => {
  const transformer = superJson.customTransformerRegistry.findApplicable(value);
  return transformer.serialize(value);
}, (v, a, superJson) => {
  const transformer = superJson.customTransformerRegistry.findByName(a[1]);
  if (!transformer) {
    throw new Error("Trying to deserialize unknown custom value");
  }
  return transformer.deserialize(v);
});
var compositeRules = [classRule, symbolRule, customRule, typedArrayRule];
var transformValue = (value, superJson) => {
  const applicableCompositeRule = findArr(compositeRules, (rule) => rule.isApplicable(value, superJson));
  if (applicableCompositeRule) {
    return {
      value: applicableCompositeRule.transform(value, superJson),
      type: applicableCompositeRule.annotation(value, superJson)
    };
  }
  const applicableSimpleRule = findArr(simpleRules, (rule) => rule.isApplicable(value, superJson));
  if (applicableSimpleRule) {
    return {
      value: applicableSimpleRule.transform(value, superJson),
      type: applicableSimpleRule.annotation
    };
  }
  return void 0;
};
var simpleRulesByAnnotation = {};
simpleRules.forEach((rule) => {
  simpleRulesByAnnotation[rule.annotation] = rule;
});
var untransformValue = (json, type, superJson) => {
  if (isArray(type)) {
    switch (type[0]) {
      case "symbol":
        return symbolRule.untransform(json, type, superJson);
      case "class":
        return classRule.untransform(json, type, superJson);
      case "custom":
        return customRule.untransform(json, type, superJson);
      case "typed-array":
        return typedArrayRule.untransform(json, type, superJson);
      default:
        throw new Error("Unknown transformation: " + type);
    }
  } else {
    const transformation = simpleRulesByAnnotation[type];
    if (!transformation) {
      throw new Error("Unknown transformation: " + type);
    }
    return transformation.untransform(json, superJson);
  }
};

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/accessDeep.js
init_esm_shims();
var getNthKey = (value, n) => {
  if (n > value.size)
    throw new Error("index out of bounds");
  const keys = value.keys();
  while (n > 0) {
    keys.next();
    n--;
  }
  return keys.next().value;
};
function validatePath(path) {
  if (includes(path, "__proto__")) {
    throw new Error("__proto__ is not allowed as a property");
  }
  if (includes(path, "prototype")) {
    throw new Error("prototype is not allowed as a property");
  }
  if (includes(path, "constructor")) {
    throw new Error("constructor is not allowed as a property");
  }
}
var getDeep = (object, path) => {
  validatePath(path);
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (isSet(object)) {
      object = getNthKey(object, +key);
    } else if (isMap(object)) {
      const row = +key;
      const type = +path[++i] === 0 ? "key" : "value";
      const keyOfRow = getNthKey(object, row);
      switch (type) {
        case "key":
          object = keyOfRow;
          break;
        case "value":
          object = object.get(keyOfRow);
          break;
      }
    } else {
      object = object[key];
    }
  }
  return object;
};
var setDeep = (object, path, mapper) => {
  validatePath(path);
  if (path.length === 0) {
    return mapper(object);
  }
  let parent = object;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (isArray(parent)) {
      const index = +key;
      parent = parent[index];
    } else if (isPlainObject2(parent)) {
      parent = parent[key];
    } else if (isSet(parent)) {
      const row = +key;
      parent = getNthKey(parent, row);
    } else if (isMap(parent)) {
      const isEnd = i === path.length - 2;
      if (isEnd) {
        break;
      }
      const row = +key;
      const type = +path[++i] === 0 ? "key" : "value";
      const keyOfRow = getNthKey(parent, row);
      switch (type) {
        case "key":
          parent = keyOfRow;
          break;
        case "value":
          parent = parent.get(keyOfRow);
          break;
      }
    }
  }
  const lastKey = path[path.length - 1];
  if (isArray(parent)) {
    parent[+lastKey] = mapper(parent[+lastKey]);
  } else if (isPlainObject2(parent)) {
    parent[lastKey] = mapper(parent[lastKey]);
  }
  if (isSet(parent)) {
    const oldValue = getNthKey(parent, +lastKey);
    const newValue = mapper(oldValue);
    if (oldValue !== newValue) {
      parent.delete(oldValue);
      parent.add(newValue);
    }
  }
  if (isMap(parent)) {
    const row = +path[path.length - 2];
    const keyToRow = getNthKey(parent, row);
    const type = +lastKey === 0 ? "key" : "value";
    switch (type) {
      case "key": {
        const newKey = mapper(keyToRow);
        parent.set(newKey, parent.get(keyToRow));
        if (newKey !== keyToRow) {
          parent.delete(keyToRow);
        }
        break;
      }
      case "value": {
        parent.set(keyToRow, mapper(parent.get(keyToRow)));
        break;
      }
    }
  }
  return object;
};

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/plainer.js
function traverse(tree, walker2, origin = []) {
  if (!tree) {
    return;
  }
  if (!isArray(tree)) {
    forEach(tree, (subtree, key) => traverse(subtree, walker2, [...origin, ...parsePath(key)]));
    return;
  }
  const [nodeValue, children] = tree;
  if (children) {
    forEach(children, (child, key) => {
      traverse(child, walker2, [...origin, ...parsePath(key)]);
    });
  }
  walker2(nodeValue, origin);
}
function applyValueAnnotations(plain, annotations, superJson) {
  traverse(annotations, (type, path) => {
    plain = setDeep(plain, path, (v) => untransformValue(v, type, superJson));
  });
  return plain;
}
function applyReferentialEqualityAnnotations(plain, annotations) {
  function apply(identicalPaths, path) {
    const object = getDeep(plain, parsePath(path));
    identicalPaths.map(parsePath).forEach((identicalObjectPath) => {
      plain = setDeep(plain, identicalObjectPath, () => object);
    });
  }
  if (isArray(annotations)) {
    const [root, other] = annotations;
    root.forEach((identicalPath) => {
      plain = setDeep(plain, parsePath(identicalPath), () => plain);
    });
    if (other) {
      forEach(other, apply);
    }
  } else {
    forEach(annotations, apply);
  }
  return plain;
}
var isDeep = (object, superJson) => isPlainObject2(object) || isArray(object) || isMap(object) || isSet(object) || isInstanceOfRegisteredClass(object, superJson);
function addIdentity(object, path, identities) {
  const existingSet = identities.get(object);
  if (existingSet) {
    existingSet.push(path);
  } else {
    identities.set(object, [path]);
  }
}
function generateReferentialEqualityAnnotations(identitites, dedupe) {
  const result = {};
  let rootEqualityPaths = void 0;
  identitites.forEach((paths) => {
    if (paths.length <= 1) {
      return;
    }
    if (!dedupe) {
      paths = paths.map((path) => path.map(String)).sort((a, b) => a.length - b.length);
    }
    const [representativePath, ...identicalPaths] = paths;
    if (representativePath.length === 0) {
      rootEqualityPaths = identicalPaths.map(stringifyPath);
    } else {
      result[stringifyPath(representativePath)] = identicalPaths.map(stringifyPath);
    }
  });
  if (rootEqualityPaths) {
    if (isEmptyObject(result)) {
      return [rootEqualityPaths];
    } else {
      return [rootEqualityPaths, result];
    }
  } else {
    return isEmptyObject(result) ? void 0 : result;
  }
}
var walker = (object, identities, superJson, dedupe, path = [], objectsInThisPath = [], seenObjects = /* @__PURE__ */ new Map()) => {
  var _a25;
  const primitive = isPrimitive2(object);
  if (!primitive) {
    addIdentity(object, path, identities);
    const seen = seenObjects.get(object);
    if (seen) {
      return dedupe ? {
        transformedValue: null
      } : seen;
    }
  }
  if (!isDeep(object, superJson)) {
    const transformed2 = transformValue(object, superJson);
    const result2 = transformed2 ? {
      transformedValue: transformed2.value,
      annotations: [transformed2.type]
    } : {
      transformedValue: object
    };
    if (!primitive) {
      seenObjects.set(object, result2);
    }
    return result2;
  }
  if (includes(objectsInThisPath, object)) {
    return {
      transformedValue: null
    };
  }
  const transformationResult = transformValue(object, superJson);
  const transformed = (_a25 = transformationResult == null ? void 0 : transformationResult.value) != null ? _a25 : object;
  const transformedValue = isArray(transformed) ? [] : {};
  const innerAnnotations = {};
  forEach(transformed, (value, index) => {
    if (index === "__proto__" || index === "constructor" || index === "prototype") {
      throw new Error(`Detected property ${index}. This is a prototype pollution risk, please remove it from your object.`);
    }
    const recursiveResult = walker(value, identities, superJson, dedupe, [...path, index], [...objectsInThisPath, object], seenObjects);
    transformedValue[index] = recursiveResult.transformedValue;
    if (isArray(recursiveResult.annotations)) {
      innerAnnotations[index] = recursiveResult.annotations;
    } else if (isPlainObject2(recursiveResult.annotations)) {
      forEach(recursiveResult.annotations, (tree, key) => {
        innerAnnotations[escapeKey(index) + "." + key] = tree;
      });
    }
  });
  const result = isEmptyObject(innerAnnotations) ? {
    transformedValue,
    annotations: !!transformationResult ? [transformationResult.type] : void 0
  } : {
    transformedValue,
    annotations: !!transformationResult ? [transformationResult.type, innerAnnotations] : innerAnnotations
  };
  if (!primitive) {
    seenObjects.set(object, result);
  }
  return result;
};

// ../../node_modules/.pnpm/copy-anything@3.0.5/node_modules/copy-anything/dist/index.js
init_esm_shims();

// ../../node_modules/.pnpm/is-what@4.1.16/node_modules/is-what/dist/index.js
init_esm_shims();
function getType2(payload) {
  return Object.prototype.toString.call(payload).slice(8, -1);
}
function isArray2(payload) {
  return getType2(payload) === "Array";
}
function isPlainObject3(payload) {
  if (getType2(payload) !== "Object")
    return false;
  const prototype = Object.getPrototypeOf(payload);
  return !!prototype && prototype.constructor === Object && prototype === Object.prototype;
}
function isNull2(payload) {
  return getType2(payload) === "Null";
}
function isOneOf(a, b, c, d, e) {
  return (value) => a(value) || b(value) || !!c && c(value) || !!d && d(value) || !!e && e(value);
}
function isUndefined2(payload) {
  return getType2(payload) === "Undefined";
}
var isNullOrUndefined = isOneOf(isNull2, isUndefined2);

// ../../node_modules/.pnpm/copy-anything@3.0.5/node_modules/copy-anything/dist/index.js
function assignProp(carry, key, newVal, originalObject, includeNonenumerable) {
  const propType = {}.propertyIsEnumerable.call(originalObject, key) ? "enumerable" : "nonenumerable";
  if (propType === "enumerable")
    carry[key] = newVal;
  if (includeNonenumerable && propType === "nonenumerable") {
    Object.defineProperty(carry, key, {
      value: newVal,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
}
function copy(target22, options = {}) {
  if (isArray2(target22)) {
    return target22.map((item) => copy(item, options));
  }
  if (!isPlainObject3(target22)) {
    return target22;
  }
  const props = Object.getOwnPropertyNames(target22);
  const symbols = Object.getOwnPropertySymbols(target22);
  return [...props, ...symbols].reduce((carry, key) => {
    if (isArray2(options.props) && !options.props.includes(key)) {
      return carry;
    }
    const val = target22[key];
    const newVal = copy(val, options);
    assignProp(carry, key, newVal, target22, options.nonenumerable);
    return carry;
  }, {});
}

// ../../node_modules/.pnpm/superjson@2.2.2/node_modules/superjson/dist/index.js
var SuperJSON = class {
  /**
   * @param dedupeReferentialEqualities  If true, SuperJSON will make sure only one instance of referentially equal objects are serialized and the rest are replaced with `null`.
   */
  constructor({ dedupe = false } = {}) {
    this.classRegistry = new ClassRegistry();
    this.symbolRegistry = new Registry((s) => {
      var _a25;
      return (_a25 = s.description) != null ? _a25 : "";
    });
    this.customTransformerRegistry = new CustomTransformerRegistry();
    this.allowedErrorProps = [];
    this.dedupe = dedupe;
  }
  serialize(object) {
    const identities = /* @__PURE__ */ new Map();
    const output = walker(object, identities, this, this.dedupe);
    const res = {
      json: output.transformedValue
    };
    if (output.annotations) {
      res.meta = {
        ...res.meta,
        values: output.annotations
      };
    }
    const equalityAnnotations = generateReferentialEqualityAnnotations(identities, this.dedupe);
    if (equalityAnnotations) {
      res.meta = {
        ...res.meta,
        referentialEqualities: equalityAnnotations
      };
    }
    return res;
  }
  deserialize(payload) {
    const { json, meta } = payload;
    let result = copy(json);
    if (meta == null ? void 0 : meta.values) {
      result = applyValueAnnotations(result, meta.values, this);
    }
    if (meta == null ? void 0 : meta.referentialEqualities) {
      result = applyReferentialEqualityAnnotations(result, meta.referentialEqualities);
    }
    return result;
  }
  stringify(object) {
    return JSON.stringify(this.serialize(object));
  }
  parse(string) {
    return this.deserialize(JSON.parse(string));
  }
  registerClass(v, options) {
    this.classRegistry.register(v, options);
  }
  registerSymbol(v, identifier) {
    this.symbolRegistry.register(v, identifier);
  }
  registerCustom(transformer, name) {
    this.customTransformerRegistry.register({
      name,
      ...transformer
    });
  }
  allowErrorProps(...props) {
    this.allowedErrorProps.push(...props);
  }
};
SuperJSON.defaultInstance = new SuperJSON();
SuperJSON.serialize = SuperJSON.defaultInstance.serialize.bind(SuperJSON.defaultInstance);
SuperJSON.deserialize = SuperJSON.defaultInstance.deserialize.bind(SuperJSON.defaultInstance);
SuperJSON.stringify = SuperJSON.defaultInstance.stringify.bind(SuperJSON.defaultInstance);
SuperJSON.parse = SuperJSON.defaultInstance.parse.bind(SuperJSON.defaultInstance);
SuperJSON.registerClass = SuperJSON.defaultInstance.registerClass.bind(SuperJSON.defaultInstance);
SuperJSON.registerSymbol = SuperJSON.defaultInstance.registerSymbol.bind(SuperJSON.defaultInstance);
SuperJSON.registerCustom = SuperJSON.defaultInstance.registerCustom.bind(SuperJSON.defaultInstance);
SuperJSON.allowErrorProps = SuperJSON.defaultInstance.allowErrorProps.bind(SuperJSON.defaultInstance);
var serialize = SuperJSON.serialize;
var deserialize = SuperJSON.deserialize;
var stringify = SuperJSON.stringify;
var parse$1 = SuperJSON.parse;
var registerClass = SuperJSON.registerClass;
var registerCustom = SuperJSON.registerCustom;
var registerSymbol = SuperJSON.registerSymbol;
var allowErrorProps = SuperJSON.allowErrorProps;

// src/messaging/presets/broadcast-channel/context.ts
init_esm_shims();
var __DEVTOOLS_KIT_BROADCAST_MESSAGING_EVENT_KEY = "__devtools-kit-broadcast-messaging-event-key__";

// src/messaging/presets/broadcast-channel/index.ts
var BROADCAST_CHANNEL_NAME = "__devtools-kit:broadcast-channel__";
function createBroadcastChannel() {
  const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  return {
    post: (data) => {
      channel.postMessage(SuperJSON.stringify({
        event: __DEVTOOLS_KIT_BROADCAST_MESSAGING_EVENT_KEY,
        data
      }));
    },
    on: (handler) => {
      channel.onmessage = (event) => {
        const parsed = SuperJSON.parse(event.data);
        if (parsed.event === __DEVTOOLS_KIT_BROADCAST_MESSAGING_EVENT_KEY) {
          handler(parsed.data);
        }
      };
    }
  };
}

// src/messaging/presets/electron/index.ts
init_esm_shims();

// src/messaging/presets/electron/client.ts
init_esm_shims();

// src/messaging/presets/electron/context.ts
init_esm_shims();
var __ELECTRON_CLIENT_CONTEXT__ = "electron:client-context";
var __ELECTRON_RPOXY_CONTEXT__ = "electron:proxy-context";
var __ELECTRON_SERVER_CONTEXT__ = "electron:server-context";
var __DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__ = {
  // client
  CLIENT_TO_PROXY: "client->proxy",
  // on: proxy->client
  // proxy
  PROXY_TO_CLIENT: "proxy->client",
  // on: server->proxy
  PROXY_TO_SERVER: "proxy->server",
  // on: client->proxy
  // server
  SERVER_TO_PROXY: "server->proxy"
  // on: proxy->server
};
function getElectronClientContext() {
  return target[__ELECTRON_CLIENT_CONTEXT__];
}
function setElectronClientContext(context) {
  target[__ELECTRON_CLIENT_CONTEXT__] = context;
}
function getElectronProxyContext() {
  return target[__ELECTRON_RPOXY_CONTEXT__];
}
function setElectronProxyContext(context) {
  target[__ELECTRON_RPOXY_CONTEXT__] = context;
}
function getElectronServerContext() {
  return target[__ELECTRON_SERVER_CONTEXT__];
}
function setElectronServerContext(context) {
  target[__ELECTRON_SERVER_CONTEXT__] = context;
}

// src/messaging/presets/electron/client.ts
function createElectronClientChannel() {
  const socket = getElectronClientContext();
  return {
    post: (data) => {
      socket.emit(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.CLIENT_TO_PROXY, SuperJSON.stringify(data));
    },
    on: (handler) => {
      socket.on(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.PROXY_TO_CLIENT, (e) => {
        handler(SuperJSON.parse(e));
      });
    }
  };
}

// src/messaging/presets/electron/proxy.ts
init_esm_shims();
function createElectronProxyChannel() {
  const socket = getElectronProxyContext();
  return {
    post: (data) => {
    },
    on: (handler) => {
      socket.on(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.SERVER_TO_PROXY, (data) => {
        socket.broadcast.emit(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.PROXY_TO_CLIENT, data);
      });
      socket.on(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.CLIENT_TO_PROXY, (data) => {
        socket.broadcast.emit(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.PROXY_TO_SERVER, data);
      });
    }
  };
}

// src/messaging/presets/electron/server.ts
init_esm_shims();
function createElectronServerChannel() {
  const socket = getElectronServerContext();
  return {
    post: (data) => {
      socket.emit(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.SERVER_TO_PROXY, SuperJSON.stringify(data));
    },
    on: (handler) => {
      socket.on(__DEVTOOLS_KIT_ELECTRON_MESSAGING_EVENT_KEY__.PROXY_TO_SERVER, (data) => {
        handler(SuperJSON.parse(data));
      });
    }
  };
}

// src/messaging/presets/extension/index.ts
init_esm_shims();

// src/messaging/presets/extension/client.ts
init_esm_shims();

// src/messaging/presets/extension/context.ts
init_esm_shims();
var __EXTENSION_CLIENT_CONTEXT__ = "electron:client-context";
var __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__ = {
  // client
  CLIENT_TO_PROXY: "client->proxy",
  // on: proxy->client
  // proxy
  PROXY_TO_CLIENT: "proxy->client",
  // on: server->proxy
  PROXY_TO_SERVER: "proxy->server",
  // on: client->proxy
  // server
  SERVER_TO_PROXY: "server->proxy"
  // on: proxy->server
};
function getExtensionClientContext() {
  return target[__EXTENSION_CLIENT_CONTEXT__];
}
function setExtensionClientContext(context) {
  target[__EXTENSION_CLIENT_CONTEXT__] = context;
}

// src/messaging/presets/extension/client.ts
function createExtensionClientChannel() {
  let disconnected = false;
  let port = null;
  let reconnectTimer = null;
  let onMessageHandler = null;
  function connect() {
    try {
      clearTimeout(reconnectTimer);
      port = chrome.runtime.connect({
        name: `${chrome.devtools.inspectedWindow.tabId}`
      });
      setExtensionClientContext(port);
      disconnected = false;
      port == null ? void 0 : port.onMessage.addListener(onMessageHandler);
      port.onDisconnect.addListener(() => {
        disconnected = true;
        port == null ? void 0 : port.onMessage.removeListener(onMessageHandler);
        reconnectTimer = setTimeout(connect, 1e3);
      });
    } catch (e) {
      disconnected = true;
    }
  }
  connect();
  return {
    post: (data) => {
      if (disconnected) {
        return;
      }
      port == null ? void 0 : port.postMessage(SuperJSON.stringify(data));
    },
    on: (handler) => {
      onMessageHandler = (data) => {
        if (disconnected) {
          return;
        }
        handler(SuperJSON.parse(data));
      };
      port == null ? void 0 : port.onMessage.addListener(onMessageHandler);
    }
  };
}

// src/messaging/presets/extension/proxy.ts
init_esm_shims();
function createExtensionProxyChannel() {
  const port = chrome.runtime.connect({
    name: "content-script"
  });
  function sendMessageToUserApp(payload) {
    window.postMessage({
      source: __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__.PROXY_TO_SERVER,
      payload
    }, "*");
  }
  function sendMessageToDevToolsClient(e) {
    if (e.data && e.data.source === __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__.SERVER_TO_PROXY) {
      try {
        port.postMessage(e.data.payload);
      } catch (e2) {
      }
    }
  }
  port.onMessage.addListener(sendMessageToUserApp);
  window.addEventListener("message", sendMessageToDevToolsClient);
  port.onDisconnect.addListener(() => {
    window.removeEventListener("message", sendMessageToDevToolsClient);
    sendMessageToUserApp(SuperJSON.stringify({
      event: "shutdown"
    }));
  });
  sendMessageToUserApp(SuperJSON.stringify({
    event: "init"
  }));
  return {
    post: (data) => {
    },
    on: (handler) => {
    }
  };
}

// src/messaging/presets/extension/server.ts
init_esm_shims();
function createExtensionServerChannel() {
  return {
    post: (data) => {
      window.postMessage({
        source: __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__.SERVER_TO_PROXY,
        payload: SuperJSON.stringify(data)
      }, "*");
    },
    on: (handler) => {
      const listener = (event) => {
        if (event.data.source === __DEVTOOLS_KIT_EXTENSION_MESSAGING_EVENT_KEY__.PROXY_TO_SERVER && event.data.payload) {
          handler(SuperJSON.parse(event.data.payload));
        }
      };
      window.addEventListener("message", listener);
      return () => {
        window.removeEventListener("message", listener);
      };
    }
  };
}

// src/messaging/presets/iframe/index.ts
init_esm_shims();

// src/messaging/presets/iframe/client.ts
init_esm_shims();

// src/messaging/presets/iframe/context.ts
init_esm_shims();
var __DEVTOOLS_KIT_IFRAME_MESSAGING_EVENT_KEY = "__devtools-kit-iframe-messaging-event-key__";
var __IFRAME_SERVER_CONTEXT__ = "iframe:server-context";
function getIframeServerContext() {
  return target[__IFRAME_SERVER_CONTEXT__];
}
function setIframeServerContext(context) {
  target[__IFRAME_SERVER_CONTEXT__] = context;
}

// src/messaging/presets/iframe/client.ts
function createIframeClientChannel() {
  if (!isBrowser$1) {
    return {
      post: (data) => {
      },
      on: (handler) => {
      }
    };
  }
  return {
    post: (data) => window.parent.postMessage(SuperJSON.stringify({
      event: __DEVTOOLS_KIT_IFRAME_MESSAGING_EVENT_KEY,
      data
    }), "*"),
    on: (handler) => window.addEventListener("message", (event) => {
      try {
        const parsed = SuperJSON.parse(event.data);
        if (event.source === window.parent && parsed.event === __DEVTOOLS_KIT_IFRAME_MESSAGING_EVENT_KEY) {
          handler(parsed.data);
        }
      } catch (e) {
      }
    })
  };
}

// src/messaging/presets/iframe/server.ts
init_esm_shims();
function createIframeServerChannel() {
  if (!isBrowser$1) {
    return {
      post: (data) => {
      },
      on: (handler) => {
      }
    };
  }
  return {
    post: (data) => {
      var _a25;
      const iframe = getIframeServerContext();
      (_a25 = iframe == null ? void 0 : iframe.contentWindow) == null ? void 0 : _a25.postMessage(SuperJSON.stringify({
        event: __DEVTOOLS_KIT_IFRAME_MESSAGING_EVENT_KEY,
        data
      }), "*");
    },
    on: (handler) => {
      window.addEventListener("message", (event) => {
        const iframe = getIframeServerContext();
        try {
          const parsed = SuperJSON.parse(event.data);
          if (event.source === (iframe == null ? void 0 : iframe.contentWindow) && parsed.event === __DEVTOOLS_KIT_IFRAME_MESSAGING_EVENT_KEY) {
            handler(parsed.data);
          }
        } catch (e) {
        }
      });
    }
  };
}

// src/messaging/presets/vite/index.ts
init_esm_shims();

// src/messaging/presets/vite/client.ts
init_esm_shims();

// src/messaging/presets/vite/context.ts
init_esm_shims();
var __DEVTOOLS_KIT_VITE_MESSAGING_EVENT_KEY = "__devtools-kit-vite-messaging-event-key__";
var __VITE_CLIENT_CONTEXT__ = "vite:client-context";
var __VITE_SERVER_CONTEXT__ = "vite:server-context";
function getViteClientContext() {
  return target[__VITE_CLIENT_CONTEXT__];
}
function setViteClientContext(context) {
  target[__VITE_CLIENT_CONTEXT__] = context;
}
function getViteServerContext() {
  return target[__VITE_SERVER_CONTEXT__];
}
function setViteServerContext(context) {
  target[__VITE_SERVER_CONTEXT__] = context;
}

// src/messaging/presets/vite/client.ts
function createViteClientChannel() {
  const client = getViteClientContext();
  return {
    post: (data) => {
      client == null ? void 0 : client.send(__DEVTOOLS_KIT_VITE_MESSAGING_EVENT_KEY, SuperJSON.stringify(data));
    },
    on: (handler) => {
      client == null ? void 0 : client.on(__DEVTOOLS_KIT_VITE_MESSAGING_EVENT_KEY, (event) => {
        handler(SuperJSON.parse(event));
      });
    }
  };
}

// src/messaging/presets/vite/server.ts
init_esm_shims();
function createViteServerChannel() {
  var _a25;
  const viteServer = getViteServerContext();
  const ws = (_a25 = viteServer.hot) != null ? _a25 : viteServer.ws;
  return {
    post: (data) => ws == null ? void 0 : ws.send(__DEVTOOLS_KIT_VITE_MESSAGING_EVENT_KEY, SuperJSON.stringify(data)),
    on: (handler) => ws == null ? void 0 : ws.on(__DEVTOOLS_KIT_VITE_MESSAGING_EVENT_KEY, (event) => {
      handler(SuperJSON.parse(event));
    })
  };
}

// src/messaging/presets/ws/index.ts
init_esm_shims();

// src/messaging/presets/ws/client.ts
init_esm_shims();

// src/messaging/presets/ws/context.ts
init_esm_shims();

// src/messaging/presets/ws/server.ts
init_esm_shims();

// src/messaging/index.ts
var _a19, _b19;
(_b19 = (_a19 = target).__VUE_DEVTOOLS_KIT_MESSAGE_CHANNELS__) != null ? _b19 : _a19.__VUE_DEVTOOLS_KIT_MESSAGE_CHANNELS__ = [];
var _a20, _b20;
(_b20 = (_a20 = target).__VUE_DEVTOOLS_KIT_RPC_CLIENT__) != null ? _b20 : _a20.__VUE_DEVTOOLS_KIT_RPC_CLIENT__ = null;
var _a21, _b21;
(_b21 = (_a21 = target).__VUE_DEVTOOLS_KIT_RPC_SERVER__) != null ? _b21 : _a21.__VUE_DEVTOOLS_KIT_RPC_SERVER__ = null;
var _a22, _b22;
(_b22 = (_a22 = target).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__) != null ? _b22 : _a22.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__ = null;
var _a23, _b23;
(_b23 = (_a23 = target).__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__) != null ? _b23 : _a23.__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__ = null;
var _a24, _b24;
(_b24 = (_a24 = target).__VUE_DEVTOOLS_KIT_BROADCAST_RPC_SERVER__) != null ? _b24 : _a24.__VUE_DEVTOOLS_KIT_BROADCAST_RPC_SERVER__ = null;
function setRpcClientToGlobal(rpc) {
  target.__VUE_DEVTOOLS_KIT_RPC_CLIENT__ = rpc;
}
function setRpcServerToGlobal(rpc) {
  target.__VUE_DEVTOOLS_KIT_RPC_SERVER__ = rpc;
}
function getRpcClient() {
  return target.__VUE_DEVTOOLS_KIT_RPC_CLIENT__;
}
function getRpcServer() {
  return target.__VUE_DEVTOOLS_KIT_RPC_SERVER__;
}
function setViteRpcClientToGlobal(rpc) {
  target.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__ = rpc;
}
function setViteRpcServerToGlobal(rpc) {
  target.__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__ = rpc;
}
function getViteRpcClient() {
  return target.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__;
}
function getViteRpcServer() {
  return target.__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__;
}
function getChannel(preset, host = "client") {
  const channel = {
    iframe: {
      client: createIframeClientChannel,
      server: createIframeServerChannel
    }[host],
    electron: {
      client: createElectronClientChannel,
      proxy: createElectronProxyChannel,
      server: createElectronServerChannel
    }[host],
    vite: {
      client: createViteClientChannel,
      server: createViteServerChannel
    }[host],
    broadcast: {
      client: createBroadcastChannel,
      server: createBroadcastChannel
    }[host],
    extension: {
      client: createExtensionClientChannel,
      proxy: createExtensionProxyChannel,
      server: createExtensionServerChannel
    }[host]
  }[preset];
  return channel();
}
function createRpcClient(functions, options = {}) {
  const { channel: _channel, options: _options, preset } = options;
  const channel = preset ? getChannel(preset) : _channel;
  const rpc = createBirpc(functions, {
    ..._options,
    ...channel,
    timeout: -1
  });
  if (preset === "vite") {
    setViteRpcClientToGlobal(rpc);
    return;
  }
  setRpcClientToGlobal(rpc);
  return rpc;
}
function createRpcServer(functions, options = {}) {
  const { channel: _channel, options: _options, preset } = options;
  const channel = preset ? getChannel(preset, "server") : _channel;
  const rpcServer = getRpcServer();
  if (!rpcServer) {
    const group = createBirpcGroup(functions, [channel], {
      ..._options,
      timeout: -1
    });
    if (preset === "vite") {
      setViteRpcServerToGlobal(group);
      return;
    }
    setRpcServerToGlobal(group);
  } else {
    rpcServer.updateChannels((channels) => {
      channels.push(channel);
    });
  }
}
function createRpcProxy(options = {}) {
  const { channel: _channel, options: _options, preset } = options;
  const channel = preset ? getChannel(preset, "proxy") : _channel;
  return createBirpc({}, {
    ..._options,
    ...channel,
    timeout: -1
  });
}

// src/shared/index.ts
init_esm_shims();

// src/shared/env.ts
init_esm_shims();

// src/shared/time.ts
init_esm_shims();

// src/shared/util.ts
init_esm_shims();

// src/core/component/state/replacer.ts
init_esm_shims();

// src/core/component/state/custom.ts
init_esm_shims();
function getFunctionDetails(func) {
  let string = "";
  let matches = null;
  try {
    string = Function.prototype.toString.call(func);
    matches = String.prototype.match.call(string, /\([\s\S]*?\)/);
  } catch (e) {
  }
  const match = matches && matches[0];
  const args = typeof match === "string" ? match : "(?)";
  const name = typeof func.name === "string" ? func.name : "";
  return {
    _custom: {
      type: "function",
      displayText: `<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">${escape(name)}${args}</span>`,
      tooltipText: string.trim() ? `<pre>${string}</pre>` : null
    }
  };
}
function getBigIntDetails(val) {
  const stringifiedBigInt = BigInt.prototype.toString.call(val);
  return {
    _custom: {
      type: "bigint",
      displayText: `BigInt(${stringifiedBigInt})`,
      value: stringifiedBigInt
    }
  };
}
function getDateDetails(val) {
  const date = new Date(val.getTime());
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return {
    _custom: {
      type: "date",
      displayText: Date.prototype.toString.call(val),
      value: date.toISOString().slice(0, -1)
    }
  };
}
function getMapDetails(val) {
  const list = Object.fromEntries(val);
  return {
    _custom: {
      type: "map",
      displayText: "Map",
      value: list,
      readOnly: true,
      fields: {
        abstract: true
      }
    }
  };
}
function getSetDetails(val) {
  const list = Array.from(val);
  return {
    _custom: {
      type: "set",
      displayText: `Set[${list.length}]`,
      value: list,
      readOnly: true
    }
  };
}
function getCaughtGetters(store) {
  const getters = {};
  const origGetters = store.getters || {};
  const keys = Object.keys(origGetters);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    Object.defineProperty(getters, key, {
      enumerable: true,
      get: () => {
        try {
          return origGetters[key];
        } catch (e) {
          return e;
        }
      }
    });
  }
  return getters;
}
function reduceStateList(list) {
  if (!list.length)
    return void 0;
  return list.reduce((map, item) => {
    const key = item.type || "data";
    const obj = map[key] = map[key] || {};
    obj[item.key] = item.value;
    return map;
  }, {});
}
function namedNodeMapToObject(map) {
  const result = {};
  const l = map.length;
  for (let i = 0; i < l; i++) {
    const node = map.item(i);
    result[node.name] = node.value;
  }
  return result;
}
function getStoreDetails(store) {
  return {
    _custom: {
      type: "store",
      displayText: "Store",
      value: {
        state: store.state,
        getters: getCaughtGetters(store)
      },
      fields: {
        abstract: true
      }
    }
  };
}
function getRouterDetails(router) {
  return {
    _custom: {
      type: "router",
      displayText: "VueRouter",
      value: {
        options: router.options,
        currentRoute: router.currentRoute
      },
      fields: {
        abstract: true
      }
    }
  };
}
function getInstanceDetails(instance) {
  if (instance._)
    instance = instance._;
  const state = processInstanceState(instance);
  return {
    _custom: {
      type: "component",
      id: instance.__VUE_DEVTOOLS_NEXT_UID__,
      displayText: getInstanceName(instance),
      tooltipText: "Component instance",
      value: reduceStateList(state),
      fields: {
        abstract: true
      }
    }
  };
}
function getComponentDefinitionDetails(definition) {
  let display = getComponentName(definition);
  if (display) {
    if (definition.name && definition.__file)
      display += ` <span>(${definition.__file})</span>`;
  } else {
    display = "<i>Unknown Component</i>";
  }
  return {
    _custom: {
      type: "component-definition",
      displayText: display,
      tooltipText: "Component definition",
      ...definition.__file ? {
        file: definition.__file
      } : {}
    }
  };
}
function getHTMLElementDetails(value) {
  try {
    return {
      _custom: {
        type: "HTMLElement",
        displayText: `<span class="opacity-30">&lt;</span><span class="text-blue-500">${value.tagName.toLowerCase()}</span><span class="opacity-30">&gt;</span>`,
        value: namedNodeMapToObject(value.attributes)
      }
    };
  } catch (e) {
    return {
      _custom: {
        type: "HTMLElement",
        displayText: `<span class="text-blue-500">${String(value)}</span>`
      }
    };
  }
}
function tryGetRefValue(ref) {
  if (ensurePropertyExists(ref, "_value", true)) {
    return ref._value;
  }
  if (ensurePropertyExists(ref, "value", true)) {
    return ref.value;
  }
}
function getObjectDetails(object) {
  var _a25, _b25, _c, _d;
  const info = getSetupStateType(object);
  const isState = info.ref || info.computed || info.reactive;
  if (isState) {
    const stateTypeName = info.computed ? "Computed" : info.ref ? "Ref" : info.reactive ? "Reactive" : null;
    const value = toRaw2(info.reactive ? object : tryGetRefValue(object));
    const raw = ensurePropertyExists(object, "effect") ? ((_b25 = (_a25 = object.effect) == null ? void 0 : _a25.raw) == null ? void 0 : _b25.toString()) || ((_d = (_c = object.effect) == null ? void 0 : _c.fn) == null ? void 0 : _d.toString()) : null;
    return {
      _custom: {
        type: stateTypeName == null ? void 0 : stateTypeName.toLowerCase(),
        stateTypeName,
        value,
        ...raw ? { tooltipText: `<span class="font-mono">${raw}</span>` } : {}
      }
    };
  }
  if (ensurePropertyExists(object, "__asyncLoader") && typeof object.__asyncLoader === "function") {
    return {
      _custom: {
        type: "component-definition",
        display: "Async component definition"
      }
    };
  }
}

// src/core/component/state/replacer.ts
function stringifyReplacer(key, _value, depth, seenInstance) {
  var _a25;
  if (key === "compilerOptions")
    return;
  const val = this[key];
  const type = typeof val;
  if (Array.isArray(val)) {
    const l = val.length;
    if (l > MAX_ARRAY_SIZE) {
      return {
        _isArray: true,
        length: l,
        items: val.slice(0, MAX_ARRAY_SIZE)
      };
    }
    return val;
  } else if (typeof val === "string") {
    if (val.length > MAX_STRING_SIZE)
      return `${val.substring(0, MAX_STRING_SIZE)}... (${val.length} total length)`;
    else
      return val;
  } else if (type === "undefined") {
    return UNDEFINED;
  } else if (val === Number.POSITIVE_INFINITY) {
    return INFINITY;
  } else if (val === Number.NEGATIVE_INFINITY) {
    return NEGATIVE_INFINITY;
  } else if (typeof val === "function") {
    return getFunctionDetails(val);
  } else if (type === "symbol") {
    return `[native Symbol ${Symbol.prototype.toString.call(val)}]`;
  } else if (typeof val === "bigint") {
    return getBigIntDetails(val);
  } else if (val !== null && typeof val === "object") {
    const proto = Object.prototype.toString.call(val);
    if (proto === "[object Map]") {
      return getMapDetails(val);
    } else if (proto === "[object Set]") {
      return getSetDetails(val);
    } else if (proto === "[object RegExp]") {
      return `[native RegExp ${RegExp.prototype.toString.call(val)}]`;
    } else if (proto === "[object Date]") {
      return getDateDetails(val);
    } else if (proto === "[object Error]") {
      return `[native Error ${val.message}<>${val.stack}]`;
    } else if (ensurePropertyExists(val, "state", true) && ensurePropertyExists(val, "_vm", true)) {
      return getStoreDetails(val);
    } else if (val.constructor && val.constructor.name === "VueRouter") {
      return getRouterDetails(val);
    } else if (isVueInstance(val)) {
      const componentVal = getInstanceDetails(val);
      const parentInstanceDepth = seenInstance == null ? void 0 : seenInstance.get(val);
      if (parentInstanceDepth && parentInstanceDepth < depth) {
        return `[[CircularRef]] <${componentVal._custom.displayText}>`;
      }
      seenInstance == null ? void 0 : seenInstance.set(val, depth);
      return componentVal;
    } else if (ensurePropertyExists(val, "render", true) && typeof val.render === "function") {
      return getComponentDefinitionDetails(val);
    } else if (val.constructor && val.constructor.name === "VNode") {
      return `[native VNode <${val.tag}>]`;
    } else if (typeof HTMLElement !== "undefined" && val instanceof HTMLElement) {
      return getHTMLElementDetails(val);
    } else if (((_a25 = val.constructor) == null ? void 0 : _a25.name) === "Store" && "_wrappedGetters" in val) {
      return "[object Store]";
    } else if (ensurePropertyExists(val, "currentRoute", true)) {
      return "[object Router]";
    }
    const customDetails = getObjectDetails(val);
    if (customDetails != null)
      return customDetails;
  } else if (Number.isNaN(val)) {
    return NAN;
  }
  return sanitize(val);
}

// src/shared/transfer.ts
init_esm_shims();
var MAX_SERIALIZED_SIZE = 2 * 1024 * 1024;
function isObject(_data, proto) {
  return proto === "[object Object]";
}
function isArray3(_data, proto) {
  return proto === "[object Array]";
}
function isVueReactiveLinkNode(node) {
  var _a25;
  const constructorName = (_a25 = node == null ? void 0 : node.constructor) == null ? void 0 : _a25.name;
  return constructorName === "Dep" && "activeLink" in node || constructorName === "Link" && "dep" in node;
}
function encode(data, replacer, list, seen, depth = 0, seenVueInstance = /* @__PURE__ */ new Map()) {
  let stored;
  let key;
  let value;
  let i;
  let l;
  const seenIndex = seen.get(data);
  if (seenIndex != null)
    return seenIndex;
  const index = list.length;
  const proto = Object.prototype.toString.call(data);
  if (isObject(data, proto)) {
    if (isVueReactiveLinkNode(data)) {
      return index;
    }
    stored = {};
    seen.set(data, index);
    list.push(stored);
    const keys = Object.keys(data);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      if (key === "compilerOptions")
        return index;
      value = data[key];
      const isVm = value != null && isObject(value, Object.prototype.toString.call(data)) && isVueInstance(value);
      try {
        if (replacer) {
          value = replacer.call(data, key, value, depth, seenVueInstance);
        }
      } catch (e) {
        value = e;
      }
      stored[key] = encode(value, replacer, list, seen, depth + 1, seenVueInstance);
      if (isVm) {
        seenVueInstance.delete(value);
      }
    }
  } else if (isArray3(data, proto)) {
    stored = [];
    seen.set(data, index);
    list.push(stored);
    for (i = 0, l = data.length; i < l; i++) {
      try {
        value = data[i];
        if (replacer)
          value = replacer.call(data, i, value, depth, seenVueInstance);
      } catch (e) {
        value = e;
      }
      stored[i] = encode(value, replacer, list, seen, depth + 1, seenVueInstance);
    }
  } else {
    list.push(data);
  }
  return index;
}
function decode(list, reviver2 = null) {
  let i = list.length;
  let j, k, data, key, value, proto;
  while (i--) {
    data = list[i];
    proto = Object.prototype.toString.call(data);
    if (proto === "[object Object]") {
      const keys = Object.keys(data);
      for (j = 0, k = keys.length; j < k; j++) {
        key = keys[j];
        value = list[data[key]];
        if (reviver2)
          value = reviver2.call(data, key, value);
        data[key] = value;
      }
    } else if (proto === "[object Array]") {
      for (j = 0, k = data.length; j < k; j++) {
        value = list[data[j]];
        if (reviver2)
          value = reviver2.call(data, j, value);
        data[j] = value;
      }
    }
  }
}
function stringifyCircularAutoChunks(data, replacer = null, space = null) {
  let result;
  try {
    result = arguments.length === 1 ? JSON.stringify(data) : JSON.stringify(data, (k, v) => {
      var _a25;
      return (_a25 = replacer == null ? void 0 : replacer(k, v)) == null ? void 0 : _a25.call(this);
    }, space);
  } catch (e) {
    result = stringifyStrictCircularAutoChunks(data, replacer, space);
  }
  if (result.length > MAX_SERIALIZED_SIZE) {
    const chunkCount = Math.ceil(result.length / MAX_SERIALIZED_SIZE);
    const chunks = [];
    for (let i = 0; i < chunkCount; i++)
      chunks.push(result.slice(i * MAX_SERIALIZED_SIZE, (i + 1) * MAX_SERIALIZED_SIZE));
    return chunks;
  }
  return result;
}
function stringifyStrictCircularAutoChunks(data, replacer = null, space = null) {
  const list = [];
  encode(data, replacer, list, /* @__PURE__ */ new Map());
  return space ? ` ${JSON.stringify(list, null, space)}` : ` ${JSON.stringify(list)}`;
}
function parseCircularAutoChunks(data, reviver2 = null) {
  if (Array.isArray(data))
    data = data.join("");
  const hasCircular = /^\s/.test(data);
  if (!hasCircular) {
    return arguments.length === 1 ? JSON.parse(data) : JSON.parse(data, reviver2);
  } else {
    const list = JSON.parse(data);
    decode(list, reviver2);
    return list[0];
  }
}

// src/shared/util.ts
function stringify2(data) {
  return stringifyCircularAutoChunks(data, stringifyReplacer);
}
function parse2(data, revive2 = false) {
  if (data == void 0)
    return {};
  return revive2 ? parseCircularAutoChunks(data, reviver) : parseCircularAutoChunks(data);
}

// src/index.ts
var devtools = {
  hook,
  init: () => {
    initDevTools();
  },
  get ctx() {
    return devtoolsContext;
  },
  get api() {
    return devtoolsContext.api;
  }
};

// src/index.ts

/*!
 * pinia v3.0.4
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
const IS_CLIENT = typeof window !== "undefined";
let activePinia;
const setActivePinia = (pinia) => activePinia = pinia;
const getActivePinia = false ? () => {
  const pinia = hasInjectionContext() && inject(piniaSymbol);
  if (!pinia && !IS_CLIENT) {
    console.error(`[🍍]: Pinia instance not found in context. This falls back to the global activePinia which exposes you to cross-request pollution on the server. Most of the time, it means you are calling "useStore()" in the wrong place.
Read https://vuejs.org/guide/reusability/composables.html to learn more`);
  }
  return pinia || activePinia;
} : () => hasInjectionContext() && inject(piniaSymbol) || activePinia;
const piniaSymbol = false ? Symbol("pinia") : (
  /* istanbul ignore next */
  Symbol()
);
function isPlainObject(o) {
  return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
}
var MutationType;
(function(MutationType2) {
  MutationType2["direct"] = "direct";
  MutationType2["patchObject"] = "patch object";
  MutationType2["patchFunction"] = "patch function";
})(MutationType || (MutationType = {}));
const _global = /* @__PURE__ */ (() => typeof window === "object" && window.window === window ? window : typeof self === "object" && self.self === self ? self : typeof global === "object" && global.global === global ? global : typeof globalThis === "object" ? globalThis : { HTMLElement: null })();
function bom(blob, { autoBom = false } = {}) {
  if (autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
    return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
  }
  return blob;
}
function download(url, name, opts) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.responseType = "blob";
  xhr.onload = function() {
    saveAs(xhr.response, name, opts);
  };
  xhr.onerror = function() {
    console.error("could not download file");
  };
  xhr.send();
}
function corsEnabled(url) {
  const xhr = new XMLHttpRequest();
  xhr.open("HEAD", url, false);
  try {
    xhr.send();
  } catch (e) {
  }
  return xhr.status >= 200 && xhr.status <= 299;
}
function click(node) {
  try {
    node.dispatchEvent(new MouseEvent("click"));
  } catch (e) {
    const evt = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 0,
      screenX: 80,
      screenY: 20,
      clientX: 80,
      clientY: 20,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: null
    });
    node.dispatchEvent(evt);
  }
}
const _navigator = typeof navigator === "object" ? navigator : { userAgent: "" };
const isMacOSWebView = /* @__PURE__ */ (() => /Macintosh/.test(_navigator.userAgent) && /AppleWebKit/.test(_navigator.userAgent) && !/Safari/.test(_navigator.userAgent))();
const saveAs = !IS_CLIENT ? () => {
} : (
  // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView or mini program
  typeof HTMLAnchorElement !== "undefined" && "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? downloadSaveAs : (
    // Use msSaveOrOpenBlob as a second approach
    "msSaveOrOpenBlob" in _navigator ? msSaveAs : (
      // Fallback to using FileReader and a popup
      fileSaverSaveAs
    )
  )
);
function downloadSaveAs(blob, name = "download", opts) {
  const a = document.createElement("a");
  a.download = name;
  a.rel = "noopener";
  if (typeof blob === "string") {
    a.href = blob;
    if (a.origin !== location.origin) {
      if (corsEnabled(a.href)) {
        download(blob, name, opts);
      } else {
        a.target = "_blank";
        click(a);
      }
    } else {
      click(a);
    }
  } else {
    a.href = URL.createObjectURL(blob);
    setTimeout(function() {
      URL.revokeObjectURL(a.href);
    }, 4e4);
    setTimeout(function() {
      click(a);
    }, 0);
  }
}
function msSaveAs(blob, name = "download", opts) {
  if (typeof blob === "string") {
    if (corsEnabled(blob)) {
      download(blob, name, opts);
    } else {
      const a = document.createElement("a");
      a.href = blob;
      a.target = "_blank";
      setTimeout(function() {
        click(a);
      });
    }
  } else {
    navigator.msSaveOrOpenBlob(bom(blob, opts), name);
  }
}
function fileSaverSaveAs(blob, name, opts, popup) {
  popup = popup || open("", "_blank");
  if (popup) {
    popup.document.title = popup.document.body.innerText = "downloading...";
  }
  if (typeof blob === "string")
    return download(blob, name, opts);
  const force = blob.type === "application/octet-stream";
  const isSafari = /constructor/i.test(String(_global.HTMLElement)) || "safari" in _global;
  const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);
  if ((isChromeIOS || force && isSafari || isMacOSWebView) && typeof FileReader !== "undefined") {
    const reader = new FileReader();
    reader.onloadend = function() {
      let url = reader.result;
      if (typeof url !== "string") {
        popup = null;
        throw new Error("Wrong reader.result type");
      }
      url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, "data:attachment/file;");
      if (popup) {
        popup.location.href = url;
      } else {
        location.assign(url);
      }
      popup = null;
    };
    reader.readAsDataURL(blob);
  } else {
    const url = URL.createObjectURL(blob);
    if (popup)
      popup.location.assign(url);
    else
      location.href = url;
    popup = null;
    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 4e4);
  }
}
function toastMessage(message, type) {
  const piniaMessage = "🍍 " + message;
  if (typeof __VUE_DEVTOOLS_TOAST__ === "function") {
    __VUE_DEVTOOLS_TOAST__(piniaMessage, type);
  } else if (type === "error") {
    console.error(piniaMessage);
  } else if (type === "warn") {
    console.warn(piniaMessage);
  } else {
    console.log(piniaMessage);
  }
}
function isPinia(o) {
  return "_a" in o && "install" in o;
}
function checkClipboardAccess() {
  if (!("clipboard" in navigator)) {
    toastMessage(`Your browser doesn't support the Clipboard API`, "error");
    return true;
  }
}
function checkNotFocusedError(error) {
  if (error instanceof Error && error.message.toLowerCase().includes("document is not focused")) {
    toastMessage('You need to activate the "Emulate a focused page" setting in the "Rendering" panel of devtools.', "warn");
    return true;
  }
  return false;
}
async function actionGlobalCopyState(pinia) {
  if (checkClipboardAccess())
    return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(pinia.state.value));
    toastMessage("Global state copied to clipboard.");
  } catch (error) {
    if (checkNotFocusedError(error))
      return;
    toastMessage(`Failed to serialize the state. Check the console for more details.`, "error");
    console.error(error);
  }
}
async function actionGlobalPasteState(pinia) {
  if (checkClipboardAccess())
    return;
  try {
    loadStoresState(pinia, JSON.parse(await navigator.clipboard.readText()));
    toastMessage("Global state pasted from clipboard.");
  } catch (error) {
    if (checkNotFocusedError(error))
      return;
    toastMessage(`Failed to deserialize the state from clipboard. Check the console for more details.`, "error");
    console.error(error);
  }
}
async function actionGlobalSaveState(pinia) {
  try {
    saveAs(new Blob([JSON.stringify(pinia.state.value)], {
      type: "text/plain;charset=utf-8"
    }), "pinia-state.json");
  } catch (error) {
    toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
    console.error(error);
  }
}
let fileInput;
function getFileOpener() {
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
  }
  function openFile() {
    return new Promise((resolve, reject) => {
      fileInput.onchange = async () => {
        const files = fileInput.files;
        if (!files)
          return resolve(null);
        const file = files.item(0);
        if (!file)
          return resolve(null);
        return resolve({ text: await file.text(), file });
      };
      fileInput.oncancel = () => resolve(null);
      fileInput.onerror = reject;
      fileInput.click();
    });
  }
  return openFile;
}
async function actionGlobalOpenStateFile(pinia) {
  try {
    const open2 = getFileOpener();
    const result = await open2();
    if (!result)
      return;
    const { text, file } = result;
    loadStoresState(pinia, JSON.parse(text));
    toastMessage(`Global state imported from "${file.name}".`);
  } catch (error) {
    toastMessage(`Failed to import the state from JSON. Check the console for more details.`, "error");
    console.error(error);
  }
}
function loadStoresState(pinia, state) {
  for (const key in state) {
    const storeState = pinia.state.value[key];
    if (storeState) {
      Object.assign(storeState, state[key]);
    } else {
      pinia.state.value[key] = state[key];
    }
  }
}
function formatDisplay(display) {
  return {
    _custom: {
      display
    }
  };
}
const PINIA_ROOT_LABEL = "🍍 Pinia (root)";
const PINIA_ROOT_ID = "_root";
function formatStoreForInspectorTree(store) {
  return isPinia(store) ? {
    id: PINIA_ROOT_ID,
    label: PINIA_ROOT_LABEL
  } : {
    id: store.$id,
    label: store.$id
  };
}
function formatStoreForInspectorState(store) {
  if (isPinia(store)) {
    const storeNames = Array.from(store._s.keys());
    const storeMap = store._s;
    const state2 = {
      state: storeNames.map((storeId) => ({
        editable: true,
        key: storeId,
        value: store.state.value[storeId]
      })),
      getters: storeNames.filter((id) => storeMap.get(id)._getters).map((id) => {
        const store2 = storeMap.get(id);
        return {
          editable: false,
          key: id,
          value: store2._getters.reduce((getters, key) => {
            getters[key] = store2[key];
            return getters;
          }, {})
        };
      })
    };
    return state2;
  }
  const state = {
    state: Object.keys(store.$state).map((key) => ({
      editable: true,
      key,
      value: store.$state[key]
    }))
  };
  if (store._getters && store._getters.length) {
    state.getters = store._getters.map((getterName) => ({
      editable: false,
      key: getterName,
      value: store[getterName]
    }));
  }
  if (store._customProperties.size) {
    state.customProperties = Array.from(store._customProperties).map((key) => ({
      editable: true,
      key,
      value: store[key]
    }));
  }
  return state;
}
function formatEventData(events) {
  if (!events)
    return {};
  if (Array.isArray(events)) {
    return events.reduce((data, event) => {
      data.keys.push(event.key);
      data.operations.push(event.type);
      data.oldValue[event.key] = event.oldValue;
      data.newValue[event.key] = event.newValue;
      return data;
    }, {
      oldValue: {},
      keys: [],
      operations: [],
      newValue: {}
    });
  } else {
    return {
      operation: formatDisplay(events.type),
      key: formatDisplay(events.key),
      oldValue: events.oldValue,
      newValue: events.newValue
    };
  }
}
function formatMutationType(type) {
  switch (type) {
    case MutationType.direct:
      return "mutation";
    case MutationType.patchFunction:
      return "$patch";
    case MutationType.patchObject:
      return "$patch";
    default:
      return "unknown";
  }
}
let isTimelineActive = true;
const componentStateTypes = [];
const MUTATIONS_LAYER_ID = "pinia:mutations";
const INSPECTOR_ID = "pinia";
const { assign: assign$1 } = Object;
const getStoreType = (id) => "🍍 " + id;
function registerPiniaDevtools(app, pinia) {
  setupDevToolsPlugin({
    id: "dev.esm.pinia",
    label: "Pinia 🍍",
    logo: "https://pinia.vuejs.org/logo.svg",
    packageName: "pinia",
    homepage: "https://pinia.vuejs.org",
    componentStateTypes,
    app
  }, (api) => {
    if (typeof api.now !== "function") {
      toastMessage("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
    }
    api.addTimelineLayer({
      id: MUTATIONS_LAYER_ID,
      label: `Pinia 🍍`,
      color: 15064968
    });
    api.addInspector({
      id: INSPECTOR_ID,
      label: "Pinia 🍍",
      icon: "storage",
      treeFilterPlaceholder: "Search stores",
      actions: [
        {
          icon: "content_copy",
          action: () => {
            actionGlobalCopyState(pinia);
          },
          tooltip: "Serialize and copy the state"
        },
        {
          icon: "content_paste",
          action: async () => {
            await actionGlobalPasteState(pinia);
            api.sendInspectorTree(INSPECTOR_ID);
            api.sendInspectorState(INSPECTOR_ID);
          },
          tooltip: "Replace the state with the content of your clipboard"
        },
        {
          icon: "save",
          action: () => {
            actionGlobalSaveState(pinia);
          },
          tooltip: "Save the state as a JSON file"
        },
        {
          icon: "folder_open",
          action: async () => {
            await actionGlobalOpenStateFile(pinia);
            api.sendInspectorTree(INSPECTOR_ID);
            api.sendInspectorState(INSPECTOR_ID);
          },
          tooltip: "Import the state from a JSON file"
        }
      ],
      nodeActions: [
        {
          icon: "restore",
          tooltip: 'Reset the state (with "$reset")',
          action: (nodeId) => {
            const store = pinia._s.get(nodeId);
            if (!store) {
              toastMessage(`Cannot reset "${nodeId}" store because it wasn't found.`, "warn");
            } else if (typeof store.$reset !== "function") {
              toastMessage(`Cannot reset "${nodeId}" store because it doesn't have a "$reset" method implemented.`, "warn");
            } else {
              store.$reset();
              toastMessage(`Store "${nodeId}" reset.`);
            }
          }
        }
      ]
    });
    api.on.inspectComponent((payload) => {
      const proxy = payload.componentInstance && payload.componentInstance.proxy;
      if (proxy && proxy._pStores) {
        const piniaStores = payload.componentInstance.proxy._pStores;
        Object.values(piniaStores).forEach((store) => {
          payload.instanceData.state.push({
            type: getStoreType(store.$id),
            key: "state",
            editable: true,
            value: store._isOptionsAPI ? {
              _custom: {
                value: toRaw$1(store.$state),
                actions: [
                  {
                    icon: "restore",
                    tooltip: "Reset the state of this store",
                    action: () => store.$reset()
                  }
                ]
              }
            } : (
              // NOTE: workaround to unwrap transferred refs
              Object.keys(store.$state).reduce((state, key) => {
                state[key] = store.$state[key];
                return state;
              }, {})
            )
          });
          if (store._getters && store._getters.length) {
            payload.instanceData.state.push({
              type: getStoreType(store.$id),
              key: "getters",
              editable: false,
              value: store._getters.reduce((getters, key) => {
                try {
                  getters[key] = store[key];
                } catch (error) {
                  getters[key] = error;
                }
                return getters;
              }, {})
            });
          }
        });
      }
    });
    api.on.getInspectorTree((payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
        let stores = [pinia];
        stores = stores.concat(Array.from(pinia._s.values()));
        payload.rootNodes = (payload.filter ? stores.filter((store) => "$id" in store ? store.$id.toLowerCase().includes(payload.filter.toLowerCase()) : PINIA_ROOT_LABEL.toLowerCase().includes(payload.filter.toLowerCase())) : stores).map(formatStoreForInspectorTree);
      }
    });
    globalThis.$pinia = pinia;
    api.on.getInspectorState((payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
        const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
        if (!inspectedStore) {
          return;
        }
        if (inspectedStore) {
          if (payload.nodeId !== PINIA_ROOT_ID)
            globalThis.$store = toRaw$1(inspectedStore);
          payload.state = formatStoreForInspectorState(inspectedStore);
        }
      }
    });
    api.on.editInspectorState((payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
        const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
        if (!inspectedStore) {
          return toastMessage(`store "${payload.nodeId}" not found`, "error");
        }
        const { path } = payload;
        if (!isPinia(inspectedStore)) {
          if (path.length !== 1 || !inspectedStore._customProperties.has(path[0]) || path[0] in inspectedStore.$state) {
            path.unshift("$state");
          }
        } else {
          path.unshift("state");
        }
        isTimelineActive = false;
        payload.set(inspectedStore, path, payload.state.value);
        isTimelineActive = true;
      }
    });
    api.on.editComponentState((payload) => {
      if (payload.type.startsWith("🍍")) {
        const storeId = payload.type.replace(/^🍍\s*/, "");
        const store = pinia._s.get(storeId);
        if (!store) {
          return toastMessage(`store "${storeId}" not found`, "error");
        }
        const { path } = payload;
        if (path[0] !== "state") {
          return toastMessage(`Invalid path for store "${storeId}":
${path}
Only state can be modified.`);
        }
        path[0] = "$state";
        isTimelineActive = false;
        payload.set(store, path, payload.state.value);
        isTimelineActive = true;
      }
    });
  });
}
function addStoreToDevtools(app, store) {
  if (!componentStateTypes.includes(getStoreType(store.$id))) {
    componentStateTypes.push(getStoreType(store.$id));
  }
  setupDevToolsPlugin({
    id: "dev.esm.pinia",
    label: "Pinia 🍍",
    logo: "https://pinia.vuejs.org/logo.svg",
    packageName: "pinia",
    homepage: "https://pinia.vuejs.org",
    componentStateTypes,
    app,
    settings: {
      logStoreChanges: {
        label: "Notify about new/deleted stores",
        type: "boolean",
        defaultValue: true
      }
      // useEmojis: {
      //   label: 'Use emojis in messages ⚡️',
      //   type: 'boolean',
      //   defaultValue: true,
      // },
    }
  }, (api) => {
    const now = typeof api.now === "function" ? api.now.bind(api) : Date.now;
    store.$onAction(({ after, onError, name, args }) => {
      const groupId = runningActionId++;
      api.addTimelineEvent({
        layerId: MUTATIONS_LAYER_ID,
        event: {
          time: now(),
          title: "🛫 " + name,
          subtitle: "start",
          data: {
            store: formatDisplay(store.$id),
            action: formatDisplay(name),
            args
          },
          groupId
        }
      });
      after((result) => {
        activeAction = void 0;
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now(),
            title: "🛬 " + name,
            subtitle: "end",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args,
              result
            },
            groupId
          }
        });
      });
      onError((error) => {
        activeAction = void 0;
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now(),
            logType: "error",
            title: "💥 " + name,
            subtitle: "end",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args,
              error
            },
            groupId
          }
        });
      });
    }, true);
    store._customProperties.forEach((name) => {
      watch(() => unref(store[name]), (newValue, oldValue) => {
        api.notifyComponentUpdate();
        api.sendInspectorState(INSPECTOR_ID);
        if (isTimelineActive) {
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now(),
              title: "Change",
              subtitle: name,
              data: {
                newValue,
                oldValue
              },
              groupId: activeAction
            }
          });
        }
      }, { deep: true });
    });
    store.$subscribe(({ events, type }, state) => {
      api.notifyComponentUpdate();
      api.sendInspectorState(INSPECTOR_ID);
      if (!isTimelineActive)
        return;
      const eventData = {
        time: now(),
        title: formatMutationType(type),
        data: assign$1({ store: formatDisplay(store.$id) }, formatEventData(events)),
        groupId: activeAction
      };
      if (type === MutationType.patchFunction) {
        eventData.subtitle = "⤵️";
      } else if (type === MutationType.patchObject) {
        eventData.subtitle = "🧩";
      } else if (events && !Array.isArray(events)) {
        eventData.subtitle = events.type;
      }
      if (events) {
        eventData.data["rawEvent(s)"] = {
          _custom: {
            display: "DebuggerEvent",
            type: "object",
            tooltip: "raw DebuggerEvent[]",
            value: events
          }
        };
      }
      api.addTimelineEvent({
        layerId: MUTATIONS_LAYER_ID,
        event: eventData
      });
    }, { detached: true, flush: "sync" });
    const hotUpdate = store._hotUpdate;
    store._hotUpdate = markRaw((newStore) => {
      hotUpdate(newStore);
      api.addTimelineEvent({
        layerId: MUTATIONS_LAYER_ID,
        event: {
          time: now(),
          title: "🔥 " + store.$id,
          subtitle: "HMR update",
          data: {
            store: formatDisplay(store.$id),
            info: formatDisplay(`HMR update`)
          }
        }
      });
      api.notifyComponentUpdate();
      api.sendInspectorTree(INSPECTOR_ID);
      api.sendInspectorState(INSPECTOR_ID);
    });
    const { $dispose } = store;
    store.$dispose = () => {
      $dispose();
      api.notifyComponentUpdate();
      api.sendInspectorTree(INSPECTOR_ID);
      api.sendInspectorState(INSPECTOR_ID);
      api.getSettings().logStoreChanges && toastMessage(`Disposed "${store.$id}" store 🗑`);
    };
    api.notifyComponentUpdate();
    api.sendInspectorTree(INSPECTOR_ID);
    api.sendInspectorState(INSPECTOR_ID);
    api.getSettings().logStoreChanges && toastMessage(`"${store.$id}" store installed 🆕`);
  });
}
let runningActionId = 0;
let activeAction;
function patchActionForGrouping(store, actionNames, wrapWithProxy) {
  const actions = actionNames.reduce((storeActions, actionName) => {
    storeActions[actionName] = toRaw$1(store)[actionName];
    return storeActions;
  }, {});
  for (const actionName in actions) {
    store[actionName] = function() {
      const _actionId = runningActionId;
      const trackedStore = wrapWithProxy ? new Proxy(store, {
        get(...args) {
          activeAction = _actionId;
          return Reflect.get(...args);
        },
        set(...args) {
          activeAction = _actionId;
          return Reflect.set(...args);
        }
      }) : store;
      activeAction = _actionId;
      const retValue = actions[actionName].apply(trackedStore, arguments);
      activeAction = void 0;
      return retValue;
    };
  }
}
function devtoolsPlugin({ app, store, options }) {
  if (store.$id.startsWith("__hot:")) {
    return;
  }
  store._isOptionsAPI = !!options.state;
  if (!store._p._testing) {
    patchActionForGrouping(store, Object.keys(options.actions), store._isOptionsAPI);
    const originalHotUpdate = store._hotUpdate;
    toRaw$1(store)._hotUpdate = function(newStore) {
      originalHotUpdate.apply(this, arguments);
      patchActionForGrouping(store, Object.keys(newStore._hmrPayload.actions), !!store._isOptionsAPI);
    };
  }
  addStoreToDevtools(
    app,
    // FIXME: is there a way to allow the assignment from Store<Id, S, G, A> to StoreGeneric?
    store
  );
}
function createPinia() {
  const scope = effectScope(true);
  const state = scope.run(() => ref({}));
  let _p = [];
  let toBeInstalled = [];
  const pinia = markRaw({
    install(app) {
      setActivePinia(pinia);
      pinia._a = app;
      app.provide(piniaSymbol, pinia);
      app.config.globalProperties.$pinia = pinia;
      if (IS_CLIENT) {
        registerPiniaDevtools(app, pinia);
      }
      toBeInstalled.forEach((plugin) => _p.push(plugin));
      toBeInstalled = [];
    },
    use(plugin) {
      if (!this._a) {
        toBeInstalled.push(plugin);
      } else {
        _p.push(plugin);
      }
      return this;
    },
    _p,
    // it's actually undefined here
    // @ts-expect-error
    _a: null,
    _e: scope,
    _s: /* @__PURE__ */ new Map(),
    state
  });
  if (IS_CLIENT && typeof Proxy !== "undefined") {
    pinia.use(devtoolsPlugin);
  }
  return pinia;
}
function disposePinia(pinia) {
  pinia._e.stop();
  pinia._s.clear();
  pinia._p.splice(0);
  pinia.state.value = {};
  pinia._a = null;
}
const isUseStore = (fn) => {
  return typeof fn === "function" && typeof fn.$id === "string";
};
function patchObject(newState, oldState) {
  for (const key in oldState) {
    const subPatch = oldState[key];
    if (!(key in newState)) {
      continue;
    }
    const targetValue = newState[key];
    if (isPlainObject(targetValue) && isPlainObject(subPatch) && !isRef$1(subPatch) && !isReactive$1(subPatch)) {
      newState[key] = patchObject(targetValue, subPatch);
    } else {
      newState[key] = subPatch;
    }
  }
  return newState;
}
function acceptHMRUpdate(initialUseStore, hot) {
  if (true) {
    return () => {
    };
  }
  return (newModule) => {
    const pinia = hot.data.pinia || initialUseStore._pinia;
    if (!pinia) {
      return;
    }
    hot.data.pinia = pinia;
    for (const exportName in newModule) {
      const useStore = newModule[exportName];
      if (isUseStore(useStore) && pinia._s.has(useStore.$id)) {
        const id = useStore.$id;
        if (id !== initialUseStore.$id) {
          console.warn(`The id of the store changed from "${initialUseStore.$id}" to "${id}". Reloading.`);
          return hot.invalidate();
        }
        const existingStore = pinia._s.get(id);
        if (!existingStore) {
          console.log(`[Pinia]: skipping hmr because store doesn't exist yet`);
          return;
        }
        useStore(pinia, existingStore);
      }
    }
  };
}
const noop = () => {
};
function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
  subscriptions.add(callback);
  const removeSubscription = () => {
    const isDel = subscriptions.delete(callback);
    isDel && onCleanup();
  };
  if (!detached && getCurrentScope()) {
    onScopeDispose(removeSubscription);
  }
  return removeSubscription;
}
function triggerSubscriptions(subscriptions, ...args) {
  subscriptions.forEach((callback) => {
    callback(...args);
  });
}
const fallbackRunWithContext = (fn) => fn();
const ACTION_MARKER = Symbol();
const ACTION_NAME = Symbol();
function mergeReactiveObjects(target, patchToApply) {
  if (target instanceof Map && patchToApply instanceof Map) {
    patchToApply.forEach((value, key) => target.set(key, value));
  } else if (target instanceof Set && patchToApply instanceof Set) {
    patchToApply.forEach(target.add, target);
  }
  for (const key in patchToApply) {
    if (!patchToApply.hasOwnProperty(key))
      continue;
    const subPatch = patchToApply[key];
    const targetValue = target[key];
    if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !isRef$1(subPatch) && !isReactive$1(subPatch)) {
      target[key] = mergeReactiveObjects(targetValue, subPatch);
    } else {
      target[key] = subPatch;
    }
  }
  return target;
}
const skipHydrateSymbol = false ? Symbol("pinia:skipHydration") : (
  /* istanbul ignore next */
  Symbol()
);
function skipHydrate(obj) {
  return Object.defineProperty(obj, skipHydrateSymbol, {});
}
function shouldHydrate(obj) {
  return !isPlainObject(obj) || !Object.prototype.hasOwnProperty.call(obj, skipHydrateSymbol);
}
const { assign } = Object;
function isComputed(o) {
  return !!(isRef$1(o) && o.effect);
}
function createOptionsStore(id, options, pinia, hot) {
  const { state, actions, getters } = options;
  const initialState = pinia.state.value[id];
  let store;
  function setup() {
    if (!initialState && true) {
      pinia.state.value[id] = state ? state() : {};
    }
    const localState = false ? (
      // use ref() to unwrap refs inside state TODO: check if this is still necessary
      toRefs(ref(state ? state() : {}).value)
    ) : toRefs(pinia.state.value[id]);
    return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
      if (false) {
        console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`);
      }
      computedGetters[name] = markRaw(computed(() => {
        setActivePinia(pinia);
        const store2 = pinia._s.get(id);
        return getters[name].call(store2, store2);
      }));
      return computedGetters;
    }, {}));
  }
  store = createSetupStore(id, setup, options, pinia, hot, true);
  return store;
}
function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
  let scope;
  const optionsForPlugin = assign({ actions: {} }, options);
  if (false) {
    throw new Error("Pinia destroyed");
  }
  const $subscribeOptions = { deep: true };
  if (false) {
    $subscribeOptions.onTrigger = (event) => {
      if (isListening) {
        debuggerEvents = event;
      } else if (isListening == false && !store._hotUpdating) {
        if (Array.isArray(debuggerEvents)) {
          debuggerEvents.push(event);
        } else {
          console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.");
        }
      }
    };
  }
  let isListening;
  let isSyncListening;
  let subscriptions = /* @__PURE__ */ new Set();
  let actionSubscriptions = /* @__PURE__ */ new Set();
  let debuggerEvents;
  const initialState = pinia.state.value[$id];
  if (!isOptionsStore && !initialState && true) {
    pinia.state.value[$id] = {};
  }
  const hotState = ref({});
  let activeListener;
  function $patch(partialStateOrMutator) {
    let subscriptionMutation;
    isListening = isSyncListening = false;
    if (false) {
      debuggerEvents = [];
    }
    if (typeof partialStateOrMutator === "function") {
      partialStateOrMutator(pinia.state.value[$id]);
      subscriptionMutation = {
        type: MutationType.patchFunction,
        storeId: $id,
        events: debuggerEvents
      };
    } else {
      mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
      subscriptionMutation = {
        type: MutationType.patchObject,
        payload: partialStateOrMutator,
        storeId: $id,
        events: debuggerEvents
      };
    }
    const myListenerId = activeListener = Symbol();
    nextTick().then(() => {
      if (activeListener === myListenerId) {
        isListening = true;
      }
    });
    isSyncListening = true;
    triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
  }
  const $reset = isOptionsStore ? function $reset2() {
    const { state } = options;
    const newState = state ? state() : {};
    this.$patch(($state) => {
      assign($state, newState);
    });
  } : (
    /* istanbul ignore next */
    false ? () => {
      throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
    } : noop
  );
  function $dispose() {
    scope.stop();
    subscriptions.clear();
    actionSubscriptions.clear();
    pinia._s.delete($id);
  }
  const action = (fn, name = "") => {
    if (ACTION_MARKER in fn) {
      fn[ACTION_NAME] = name;
      return fn;
    }
    const wrappedAction = function() {
      setActivePinia(pinia);
      const args = Array.from(arguments);
      const afterCallbackSet = /* @__PURE__ */ new Set();
      const onErrorCallbackSet = /* @__PURE__ */ new Set();
      function after(callback) {
        afterCallbackSet.add(callback);
      }
      function onError(callback) {
        onErrorCallbackSet.add(callback);
      }
      triggerSubscriptions(actionSubscriptions, {
        args,
        name: wrappedAction[ACTION_NAME],
        store,
        after,
        onError
      });
      let ret;
      try {
        ret = fn.apply(this && this.$id === $id ? this : store, args);
      } catch (error) {
        triggerSubscriptions(onErrorCallbackSet, error);
        throw error;
      }
      if (ret instanceof Promise) {
        return ret.then((value) => {
          triggerSubscriptions(afterCallbackSet, value);
          return value;
        }).catch((error) => {
          triggerSubscriptions(onErrorCallbackSet, error);
          return Promise.reject(error);
        });
      }
      triggerSubscriptions(afterCallbackSet, ret);
      return ret;
    };
    wrappedAction[ACTION_MARKER] = true;
    wrappedAction[ACTION_NAME] = name;
    return wrappedAction;
  };
  const _hmrPayload = /* @__PURE__ */ markRaw({
    actions: {},
    getters: {},
    state: [],
    hotState
  });
  const partialStore = {
    _p: pinia,
    // _s: scope,
    $id,
    $onAction: addSubscription.bind(null, actionSubscriptions),
    $patch,
    $reset,
    $subscribe(callback, options2 = {}) {
      const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
      const stopWatcher = scope.run(() => watch(() => pinia.state.value[$id], (state) => {
        if (options2.flush === "sync" ? isSyncListening : isListening) {
          callback({
            storeId: $id,
            type: MutationType.direct,
            events: debuggerEvents
          }, state);
        }
      }, assign({}, $subscribeOptions, options2)));
      return removeSubscription;
    },
    $dispose
  };
  const store = reactive(IS_CLIENT ? assign(
    {
      _hmrPayload,
      _customProperties: markRaw(/* @__PURE__ */ new Set())
      // devtools custom properties
    },
    partialStore
    // must be added later
    // setupStore
  ) : partialStore);
  pinia._s.set($id, store);
  const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
  const setupStore = runWithContext(() => pinia._e.run(() => (scope = effectScope()).run(() => setup({ action }))));
  for (const key in setupStore) {
    const prop = setupStore[key];
    if (isRef$1(prop) && !isComputed(prop) || isReactive$1(prop)) {
      if (false) {
        hotState.value[key] = toRef(setupStore, key);
      } else if (!isOptionsStore) {
        if (initialState && shouldHydrate(prop)) {
          if (isRef$1(prop)) {
            prop.value = initialState[key];
          } else {
            mergeReactiveObjects(prop, initialState[key]);
          }
        }
        pinia.state.value[$id][key] = prop;
      }
      if (false) {
        _hmrPayload.state.push(key);
      }
    } else if (typeof prop === "function") {
      const actionValue = false ? prop : action(prop, key);
      setupStore[key] = actionValue;
      if (false) {
        _hmrPayload.actions[key] = prop;
      }
      optionsForPlugin.actions[key] = prop;
    } else if (false) {
      if (isComputed(prop)) {
        _hmrPayload.getters[key] = isOptionsStore ? (
          // @ts-expect-error
          options.getters[key]
        ) : prop;
        if (IS_CLIENT) {
          const getters = setupStore._getters || // @ts-expect-error: same
          (setupStore._getters = markRaw([]));
          getters.push(key);
        }
      }
    }
  }
  assign(store, setupStore);
  assign(toRaw$1(store), setupStore);
  Object.defineProperty(store, "$state", {
    get: () => false ? hotState.value : pinia.state.value[$id],
    set: (state) => {
      if (false) {
        throw new Error("cannot set hotState");
      }
      $patch(($state) => {
        assign($state, state);
      });
    }
  });
  if (false) {
    store._hotUpdate = markRaw((newStore) => {
      store._hotUpdating = true;
      newStore._hmrPayload.state.forEach((stateKey) => {
        if (stateKey in store.$state) {
          const newStateTarget = newStore.$state[stateKey];
          const oldStateSource = store.$state[stateKey];
          if (typeof newStateTarget === "object" && isPlainObject(newStateTarget) && isPlainObject(oldStateSource)) {
            patchObject(newStateTarget, oldStateSource);
          } else {
            newStore.$state[stateKey] = oldStateSource;
          }
        }
        store[stateKey] = toRef(newStore.$state, stateKey);
      });
      Object.keys(store.$state).forEach((stateKey) => {
        if (!(stateKey in newStore.$state)) {
          delete store[stateKey];
        }
      });
      isListening = false;
      isSyncListening = false;
      pinia.state.value[$id] = toRef(newStore._hmrPayload, "hotState");
      isSyncListening = true;
      nextTick().then(() => {
        isListening = true;
      });
      for (const actionName in newStore._hmrPayload.actions) {
        const actionFn = newStore[actionName];
        store[actionName] = //
        action(actionFn, actionName);
      }
      for (const getterName in newStore._hmrPayload.getters) {
        const getter = newStore._hmrPayload.getters[getterName];
        const getterValue = isOptionsStore ? (
          // special handling of options api
          computed(() => {
            setActivePinia(pinia);
            return getter.call(store, store);
          })
        ) : getter;
        store[getterName] = //
        getterValue;
      }
      Object.keys(store._hmrPayload.getters).forEach((key) => {
        if (!(key in newStore._hmrPayload.getters)) {
          delete store[key];
        }
      });
      Object.keys(store._hmrPayload.actions).forEach((key) => {
        if (!(key in newStore._hmrPayload.actions)) {
          delete store[key];
        }
      });
      store._hmrPayload = newStore._hmrPayload;
      store._getters = newStore._getters;
      store._hotUpdating = false;
    });
  }
  if (IS_CLIENT) {
    const nonEnumerable = {
      writable: true,
      configurable: true,
      // avoid warning on devtools trying to display this property
      enumerable: false
    };
    ["_p", "_hmrPayload", "_getters", "_customProperties"].forEach((p) => {
      Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
    });
  }
  pinia._p.forEach((extender) => {
    if (IS_CLIENT) {
      const extensions = scope.run(() => extender({
        store,
        app: pinia._a,
        pinia,
        options: optionsForPlugin
      }));
      Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
      assign(store, extensions);
    } else {
      assign(store, scope.run(() => extender({
        store,
        app: pinia._a,
        pinia,
        options: optionsForPlugin
      })));
    }
  });
  if (false) {
    console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${store.$id}".`);
  }
  if (initialState && isOptionsStore && options.hydrate) {
    options.hydrate(store.$state, initialState);
  }
  isListening = true;
  isSyncListening = true;
  return store;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineStore(id, setup, setupOptions) {
  let options;
  const isSetupStore = typeof setup === "function";
  options = isSetupStore ? setupOptions : setup;
  function useStore(pinia, hot) {
    const hasContext = hasInjectionContext();
    pinia = // in test mode, ignore the argument provided as we can always retrieve a
    // pinia instance with getActivePinia()
    (false ? null : pinia) || (hasContext ? inject(piniaSymbol, null) : null);
    if (pinia)
      setActivePinia(pinia);
    if (false) {
      throw new Error(`[🍍]: "getActivePinia()" was called but there was no active Pinia. Are you trying to use a store before calling "app.use(pinia)"?
See https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.
This will fail in production.`);
    }
    pinia = activePinia;
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, options, pinia);
      } else {
        createOptionsStore(id, options, pinia);
      }
      if (false) {
        useStore._pinia = pinia;
      }
    }
    const store = pinia._s.get(id);
    if (false) {
      const hotId = "__hot:" + id;
      const newStore = isSetupStore ? createSetupStore(hotId, setup, options, pinia, true) : createOptionsStore(hotId, assign({}, options), pinia, true);
      hot._hotUpdate(newStore);
      delete pinia.state.value[hotId];
      pinia._s.delete(hotId);
    }
    if (false) {
      const currentInstance = getCurrentInstance();
      if (currentInstance && currentInstance.proxy && // avoid adding stores that are just built for hot module replacement
      !hot) {
        const vm = currentInstance.proxy;
        const cache = "_pStores" in vm ? vm._pStores : vm._pStores = {};
        cache[id] = store;
      }
    }
    return store;
  }
  useStore.$id = id;
  return useStore;
}
let mapStoreSuffix = "Store";
function setMapStoreSuffix(suffix) {
  mapStoreSuffix = suffix;
}
function mapStores(...stores) {
  if (false) {
    console.warn(`[🍍]: Directly pass all stores to "mapStores()" without putting them in an array:
Replace
	mapStores([useAuthStore, useCartStore])
with
	mapStores(useAuthStore, useCartStore)
This will fail in production if not fixed.`);
    stores = stores[0];
  }
  return stores.reduce((reduced, useStore) => {
    reduced[useStore.$id + mapStoreSuffix] = function() {
      return useStore(this.$pinia);
    };
    return reduced;
  }, {});
}
function mapState(useStore, keysOrMapper) {
  return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
    reduced[key] = function() {
      return useStore(this.$pinia)[key];
    };
    return reduced;
  }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
    reduced[key] = function() {
      const store = useStore(this.$pinia);
      const storeKey = keysOrMapper[key];
      return typeof storeKey === "function" ? storeKey.call(this, store) : (
        // @ts-expect-error: FIXME: should work?
        store[storeKey]
      );
    };
    return reduced;
  }, {});
}
const mapGetters = mapState;
function mapActions(useStore, keysOrMapper) {
  return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
    reduced[key] = function(...args) {
      return useStore(this.$pinia)[key](...args);
    };
    return reduced;
  }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
    reduced[key] = function(...args) {
      return useStore(this.$pinia)[keysOrMapper[key]](...args);
    };
    return reduced;
  }, {});
}
function mapWritableState(useStore, keysOrMapper) {
  return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
    reduced[key] = {
      get() {
        return useStore(this.$pinia)[key];
      },
      set(value) {
        return useStore(this.$pinia)[key] = value;
      }
    };
    return reduced;
  }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
    reduced[key] = {
      get() {
        return useStore(this.$pinia)[keysOrMapper[key]];
      },
      set(value) {
        return useStore(this.$pinia)[keysOrMapper[key]] = value;
      }
    };
    return reduced;
  }, {});
}
function storeToRefs(store) {
  const rawStore = toRaw$1(store);
  const refs = {};
  for (const key in rawStore) {
    const value = rawStore[key];
    if (value.effect) {
      refs[key] = // ...
      computed({
        get: () => store[key],
        set(value2) {
          store[key] = value2;
        }
      });
    } else if (isRef$1(value) || isReactive$1(value)) {
      refs[key] = // ---
      toRef(store, key);
    }
  }
  return refs;
}

/**
* @vue/compiler-core v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const FRAGMENT = /* @__PURE__ */ Symbol(false ? `Fragment` : ``);
const TELEPORT = /* @__PURE__ */ Symbol(false ? `Teleport` : ``);
const SUSPENSE = /* @__PURE__ */ Symbol(false ? `Suspense` : ``);
const KEEP_ALIVE = /* @__PURE__ */ Symbol(false ? `KeepAlive` : ``);
const BASE_TRANSITION = /* @__PURE__ */ Symbol(
  false ? `BaseTransition` : ``
);
const OPEN_BLOCK = /* @__PURE__ */ Symbol(false ? `openBlock` : ``);
const CREATE_BLOCK = /* @__PURE__ */ Symbol(false ? `createBlock` : ``);
const CREATE_ELEMENT_BLOCK = /* @__PURE__ */ Symbol(
  false ? `createElementBlock` : ``
);
const CREATE_VNODE = /* @__PURE__ */ Symbol(false ? `createVNode` : ``);
const CREATE_ELEMENT_VNODE = /* @__PURE__ */ Symbol(
  false ? `createElementVNode` : ``
);
const CREATE_COMMENT = /* @__PURE__ */ Symbol(
  false ? `createCommentVNode` : ``
);
const CREATE_TEXT = /* @__PURE__ */ Symbol(
  false ? `createTextVNode` : ``
);
const CREATE_STATIC = /* @__PURE__ */ Symbol(
  false ? `createStaticVNode` : ``
);
const RESOLVE_COMPONENT = /* @__PURE__ */ Symbol(
  false ? `resolveComponent` : ``
);
const RESOLVE_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol(
  false ? `resolveDynamicComponent` : ``
);
const RESOLVE_DIRECTIVE = /* @__PURE__ */ Symbol(
  false ? `resolveDirective` : ``
);
const RESOLVE_FILTER = /* @__PURE__ */ Symbol(
  false ? `resolveFilter` : ``
);
const WITH_DIRECTIVES = /* @__PURE__ */ Symbol(
  false ? `withDirectives` : ``
);
const RENDER_LIST = /* @__PURE__ */ Symbol(false ? `renderList` : ``);
const RENDER_SLOT = /* @__PURE__ */ Symbol(false ? `renderSlot` : ``);
const CREATE_SLOTS = /* @__PURE__ */ Symbol(false ? `createSlots` : ``);
const TO_DISPLAY_STRING = /* @__PURE__ */ Symbol(
  false ? `toDisplayString` : ``
);
const MERGE_PROPS = /* @__PURE__ */ Symbol(false ? `mergeProps` : ``);
const NORMALIZE_CLASS = /* @__PURE__ */ Symbol(
  false ? `normalizeClass` : ``
);
const NORMALIZE_STYLE = /* @__PURE__ */ Symbol(
  false ? `normalizeStyle` : ``
);
const NORMALIZE_PROPS = /* @__PURE__ */ Symbol(
  false ? `normalizeProps` : ``
);
const GUARD_REACTIVE_PROPS = /* @__PURE__ */ Symbol(
  false ? `guardReactiveProps` : ``
);
const TO_HANDLERS = /* @__PURE__ */ Symbol(false ? `toHandlers` : ``);
const CAMELIZE = /* @__PURE__ */ Symbol(false ? `camelize` : ``);
const CAPITALIZE = /* @__PURE__ */ Symbol(false ? `capitalize` : ``);
const TO_HANDLER_KEY = /* @__PURE__ */ Symbol(
  false ? `toHandlerKey` : ``
);
const SET_BLOCK_TRACKING = /* @__PURE__ */ Symbol(
  false ? `setBlockTracking` : ``
);
const PUSH_SCOPE_ID = /* @__PURE__ */ Symbol(false ? `pushScopeId` : ``);
const POP_SCOPE_ID = /* @__PURE__ */ Symbol(false ? `popScopeId` : ``);
const WITH_CTX = /* @__PURE__ */ Symbol(false ? `withCtx` : ``);
const UNREF = /* @__PURE__ */ Symbol(false ? `unref` : ``);
const IS_REF = /* @__PURE__ */ Symbol(false ? `isRef` : ``);
const WITH_MEMO = /* @__PURE__ */ Symbol(false ? `withMemo` : ``);
const IS_MEMO_SAME = /* @__PURE__ */ Symbol(false ? `isMemoSame` : ``);
const helperNameMap = {
  [FRAGMENT]: `Fragment`,
  [TELEPORT]: `Teleport`,
  [SUSPENSE]: `Suspense`,
  [KEEP_ALIVE]: `KeepAlive`,
  [BASE_TRANSITION]: `BaseTransition`,
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_BLOCK]: `createBlock`,
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`,
  [CREATE_VNODE]: `createVNode`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
  [CREATE_COMMENT]: `createCommentVNode`,
  [CREATE_TEXT]: `createTextVNode`,
  [CREATE_STATIC]: `createStaticVNode`,
  [RESOLVE_COMPONENT]: `resolveComponent`,
  [RESOLVE_DYNAMIC_COMPONENT]: `resolveDynamicComponent`,
  [RESOLVE_DIRECTIVE]: `resolveDirective`,
  [RESOLVE_FILTER]: `resolveFilter`,
  [WITH_DIRECTIVES]: `withDirectives`,
  [RENDER_LIST]: `renderList`,
  [RENDER_SLOT]: `renderSlot`,
  [CREATE_SLOTS]: `createSlots`,
  [TO_DISPLAY_STRING]: `toDisplayString`,
  [MERGE_PROPS]: `mergeProps`,
  [NORMALIZE_CLASS]: `normalizeClass`,
  [NORMALIZE_STYLE]: `normalizeStyle`,
  [NORMALIZE_PROPS]: `normalizeProps`,
  [GUARD_REACTIVE_PROPS]: `guardReactiveProps`,
  [TO_HANDLERS]: `toHandlers`,
  [CAMELIZE]: `camelize`,
  [CAPITALIZE]: `capitalize`,
  [TO_HANDLER_KEY]: `toHandlerKey`,
  [SET_BLOCK_TRACKING]: `setBlockTracking`,
  [PUSH_SCOPE_ID]: `pushScopeId`,
  [POP_SCOPE_ID]: `popScopeId`,
  [WITH_CTX]: `withCtx`,
  [UNREF]: `unref`,
  [IS_REF]: `isRef`,
  [WITH_MEMO]: `withMemo`,
  [IS_MEMO_SAME]: `isMemoSame`
};
function registerRuntimeHelpers(helpers) {
  Object.getOwnPropertySymbols(helpers).forEach((s) => {
    helperNameMap[s] = helpers[s];
  });
}
const Namespaces = {
  "HTML": 0,
  "0": "HTML",
  "SVG": 1,
  "1": "SVG",
  "MATH_ML": 2,
  "2": "MATH_ML"
};
const NodeTypes = {
  "ROOT": 0,
  "0": "ROOT",
  "ELEMENT": 1,
  "1": "ELEMENT",
  "TEXT": 2,
  "2": "TEXT",
  "COMMENT": 3,
  "3": "COMMENT",
  "SIMPLE_EXPRESSION": 4,
  "4": "SIMPLE_EXPRESSION",
  "INTERPOLATION": 5,
  "5": "INTERPOLATION",
  "ATTRIBUTE": 6,
  "6": "ATTRIBUTE",
  "DIRECTIVE": 7,
  "7": "DIRECTIVE",
  "COMPOUND_EXPRESSION": 8,
  "8": "COMPOUND_EXPRESSION",
  "IF": 9,
  "9": "IF",
  "IF_BRANCH": 10,
  "10": "IF_BRANCH",
  "FOR": 11,
  "11": "FOR",
  "TEXT_CALL": 12,
  "12": "TEXT_CALL",
  "VNODE_CALL": 13,
  "13": "VNODE_CALL",
  "JS_CALL_EXPRESSION": 14,
  "14": "JS_CALL_EXPRESSION",
  "JS_OBJECT_EXPRESSION": 15,
  "15": "JS_OBJECT_EXPRESSION",
  "JS_PROPERTY": 16,
  "16": "JS_PROPERTY",
  "JS_ARRAY_EXPRESSION": 17,
  "17": "JS_ARRAY_EXPRESSION",
  "JS_FUNCTION_EXPRESSION": 18,
  "18": "JS_FUNCTION_EXPRESSION",
  "JS_CONDITIONAL_EXPRESSION": 19,
  "19": "JS_CONDITIONAL_EXPRESSION",
  "JS_CACHE_EXPRESSION": 20,
  "20": "JS_CACHE_EXPRESSION",
  "JS_BLOCK_STATEMENT": 21,
  "21": "JS_BLOCK_STATEMENT",
  "JS_TEMPLATE_LITERAL": 22,
  "22": "JS_TEMPLATE_LITERAL",
  "JS_IF_STATEMENT": 23,
  "23": "JS_IF_STATEMENT",
  "JS_ASSIGNMENT_EXPRESSION": 24,
  "24": "JS_ASSIGNMENT_EXPRESSION",
  "JS_SEQUENCE_EXPRESSION": 25,
  "25": "JS_SEQUENCE_EXPRESSION",
  "JS_RETURN_STATEMENT": 26,
  "26": "JS_RETURN_STATEMENT"
};
const ElementTypes = {
  "ELEMENT": 0,
  "0": "ELEMENT",
  "COMPONENT": 1,
  "1": "COMPONENT",
  "SLOT": 2,
  "2": "SLOT",
  "TEMPLATE": 3,
  "3": "TEMPLATE"
};
const ConstantTypes = {
  "NOT_CONSTANT": 0,
  "0": "NOT_CONSTANT",
  "CAN_SKIP_PATCH": 1,
  "1": "CAN_SKIP_PATCH",
  "CAN_CACHE": 2,
  "2": "CAN_CACHE",
  "CAN_STRINGIFY": 3,
  "3": "CAN_STRINGIFY"
};
const locStub = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
  source: ""
};
function createRoot(children, source = "") {
  return {
    type: 0,
    source,
    children,
    helpers: /* @__PURE__ */ new Set(),
    components: [],
    directives: [],
    hoists: [],
    imports: [],
    cached: [],
    temps: 0,
    codegenNode: void 0,
    loc: locStub
  };
}
function createVNodeCall(context, tag, props, children, patchFlag, dynamicProps, directives, isBlock = false, disableTracking = false, isComponent2 = false, loc = locStub) {
  if (context) {
    if (isBlock) {
      context.helper(OPEN_BLOCK);
      context.helper(getVNodeBlockHelper(context.inSSR, isComponent2));
    } else {
      context.helper(getVNodeHelper(context.inSSR, isComponent2));
    }
    if (directives) {
      context.helper(WITH_DIRECTIVES);
    }
  }
  return {
    type: 13,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent: isComponent2,
    loc
  };
}
function createArrayExpression(elements, loc = locStub) {
  return {
    type: 17,
    loc,
    elements
  };
}
function createObjectExpression(properties, loc = locStub) {
  return {
    type: 15,
    loc,
    properties
  };
}
function createObjectProperty(key, value) {
  return {
    type: 16,
    loc: locStub,
    key: isString$1(key) ? createSimpleExpression(key, true) : key,
    value
  };
}
function createSimpleExpression(content, isStatic = false, loc = locStub, constType = 0) {
  return {
    type: 4,
    loc,
    content,
    isStatic,
    constType: isStatic ? 3 : constType
  };
}
function createInterpolation(content, loc) {
  return {
    type: 5,
    loc,
    content: isString$1(content) ? createSimpleExpression(content, false, loc) : content
  };
}
function createCompoundExpression(children, loc = locStub) {
  return {
    type: 8,
    loc,
    children
  };
}
function createCallExpression(callee, args = [], loc = locStub) {
  return {
    type: 14,
    loc,
    callee,
    arguments: args
  };
}
function createFunctionExpression(params, returns = void 0, newline = false, isSlot = false, loc = locStub) {
  return {
    type: 18,
    params,
    returns,
    newline,
    isSlot,
    loc
  };
}
function createConditionalExpression(test, consequent, alternate, newline = true) {
  return {
    type: 19,
    test,
    consequent,
    alternate,
    newline,
    loc: locStub
  };
}
function createCacheExpression(index, value, needPauseTracking = false, inVOnce = false) {
  return {
    type: 20,
    index,
    value,
    needPauseTracking,
    inVOnce,
    needArraySpread: false,
    loc: locStub
  };
}
function createBlockStatement(body) {
  return {
    type: 21,
    body,
    loc: locStub
  };
}
function createTemplateLiteral(elements) {
  return {
    type: 22,
    elements,
    loc: locStub
  };
}
function createIfStatement(test, consequent, alternate) {
  return {
    type: 23,
    test,
    consequent,
    alternate,
    loc: locStub
  };
}
function createAssignmentExpression(left, right) {
  return {
    type: 24,
    left,
    right,
    loc: locStub
  };
}
function createSequenceExpression(expressions) {
  return {
    type: 25,
    expressions,
    loc: locStub
  };
}
function createReturnStatement(returns) {
  return {
    type: 26,
    returns,
    loc: locStub
  };
}
function getVNodeHelper(ssr, isComponent2) {
  return ssr || isComponent2 ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
}
function getVNodeBlockHelper(ssr, isComponent2) {
  return ssr || isComponent2 ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK;
}
function convertToBlock(node, { helper, removeHelper, inSSR }) {
  if (!node.isBlock) {
    node.isBlock = true;
    removeHelper(getVNodeHelper(inSSR, node.isComponent));
    helper(OPEN_BLOCK);
    helper(getVNodeBlockHelper(inSSR, node.isComponent));
  }
}
const defaultDelimitersOpen = new Uint8Array([123, 123]);
const defaultDelimitersClose = new Uint8Array([125, 125]);
function isTagStartChar(c) {
  return c >= 97 && c <= 122 || c >= 65 && c <= 90;
}
function isWhitespace(c) {
  return c === 32 || c === 10 || c === 9 || c === 12 || c === 13;
}
function isEndOfTagSection(c) {
  return c === 47 || c === 62 || isWhitespace(c);
}
function toCharCodes(str) {
  const ret = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    ret[i] = str.charCodeAt(i);
  }
  return ret;
}
const Sequences = {
  Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
  // CDATA[
  CdataEnd: new Uint8Array([93, 93, 62]),
  // ]]>
  CommentEnd: new Uint8Array([45, 45, 62]),
  // `-->`
  ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
  // `<\/script`
  StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
  // `</style`
  TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101]),
  // `</title`
  TextareaEnd: new Uint8Array([
    60,
    47,
    116,
    101,
    120,
    116,
    97,
    114,
    101,
    97
  ])
  // `</textarea
};
class Tokenizer {
  constructor(stack2, cbs) {
    this.stack = stack2;
    this.cbs = cbs;
    this.state = 1;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.entityStart = 0;
    this.baseState = 1;
    this.inRCDATA = false;
    this.inXML = false;
    this.inVPre = false;
    this.newlines = [];
    this.mode = 0;
    this.delimiterOpen = defaultDelimitersOpen;
    this.delimiterClose = defaultDelimitersClose;
    this.delimiterIndex = -1;
    this.currentSequence = void 0;
    this.sequenceIndex = 0;
  }
  get inSFCRoot() {
    return this.mode === 2 && this.stack.length === 0;
  }
  reset() {
    this.state = 1;
    this.mode = 0;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.baseState = 1;
    this.inRCDATA = false;
    this.currentSequence = void 0;
    this.newlines.length = 0;
    this.delimiterOpen = defaultDelimitersOpen;
    this.delimiterClose = defaultDelimitersClose;
  }
  /**
   * Generate Position object with line / column information using recorded
   * newline positions. We know the index is always going to be an already
   * processed index, so all the newlines up to this index should have been
   * recorded.
   */
  getPos(index) {
    let line = 1;
    let column = index + 1;
    const length = this.newlines.length;
    let j = -1;
    if (length > 100) {
      let l = -1;
      let r = length;
      while (l + 1 < r) {
        const m = l + r >>> 1;
        this.newlines[m] < index ? l = m : r = m;
      }
      j = l;
    } else {
      for (let i = length - 1; i >= 0; i--) {
        if (index > this.newlines[i]) {
          j = i;
          break;
        }
      }
    }
    if (j >= 0) {
      line = j + 2;
      column = index - this.newlines[j];
    }
    return {
      column,
      line,
      offset: index
    };
  }
  peek() {
    return this.buffer.charCodeAt(this.index + 1);
  }
  stateText(c) {
    if (c === 60) {
      if (this.index > this.sectionStart) {
        this.cbs.ontext(this.sectionStart, this.index);
      }
      this.state = 5;
      this.sectionStart = this.index;
    } else if (!this.inVPre && c === this.delimiterOpen[0]) {
      this.state = 2;
      this.delimiterIndex = 0;
      this.stateInterpolationOpen(c);
    }
  }
  stateInterpolationOpen(c) {
    if (c === this.delimiterOpen[this.delimiterIndex]) {
      if (this.delimiterIndex === this.delimiterOpen.length - 1) {
        const start = this.index + 1 - this.delimiterOpen.length;
        if (start > this.sectionStart) {
          this.cbs.ontext(this.sectionStart, start);
        }
        this.state = 3;
        this.sectionStart = start;
      } else {
        this.delimiterIndex++;
      }
    } else if (this.inRCDATA) {
      this.state = 32;
      this.stateInRCDATA(c);
    } else {
      this.state = 1;
      this.stateText(c);
    }
  }
  stateInterpolation(c) {
    if (c === this.delimiterClose[0]) {
      this.state = 4;
      this.delimiterIndex = 0;
      this.stateInterpolationClose(c);
    }
  }
  stateInterpolationClose(c) {
    if (c === this.delimiterClose[this.delimiterIndex]) {
      if (this.delimiterIndex === this.delimiterClose.length - 1) {
        this.cbs.oninterpolation(this.sectionStart, this.index + 1);
        if (this.inRCDATA) {
          this.state = 32;
        } else {
          this.state = 1;
        }
        this.sectionStart = this.index + 1;
      } else {
        this.delimiterIndex++;
      }
    } else {
      this.state = 3;
      this.stateInterpolation(c);
    }
  }
  stateSpecialStartSequence(c) {
    const isEnd = this.sequenceIndex === this.currentSequence.length;
    const isMatch = isEnd ? (
      // If we are at the end of the sequence, make sure the tag name has ended
      isEndOfTagSection(c)
    ) : (
      // Otherwise, do a case-insensitive comparison
      (c | 32) === this.currentSequence[this.sequenceIndex]
    );
    if (!isMatch) {
      this.inRCDATA = false;
    } else if (!isEnd) {
      this.sequenceIndex++;
      return;
    }
    this.sequenceIndex = 0;
    this.state = 6;
    this.stateInTagName(c);
  }
  /** Look for an end tag. For <title> and <textarea>, also decode entities. */
  stateInRCDATA(c) {
    if (this.sequenceIndex === this.currentSequence.length) {
      if (c === 62 || isWhitespace(c)) {
        const endOfText = this.index - this.currentSequence.length;
        if (this.sectionStart < endOfText) {
          const actualIndex = this.index;
          this.index = endOfText;
          this.cbs.ontext(this.sectionStart, endOfText);
          this.index = actualIndex;
        }
        this.sectionStart = endOfText + 2;
        this.stateInClosingTagName(c);
        this.inRCDATA = false;
        return;
      }
      this.sequenceIndex = 0;
    }
    if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
      this.sequenceIndex += 1;
    } else if (this.sequenceIndex === 0) {
      if (this.currentSequence === Sequences.TitleEnd || this.currentSequence === Sequences.TextareaEnd && !this.inSFCRoot) {
        if (!this.inVPre && c === this.delimiterOpen[0]) {
          this.state = 2;
          this.delimiterIndex = 0;
          this.stateInterpolationOpen(c);
        }
      } else if (this.fastForwardTo(60)) {
        this.sequenceIndex = 1;
      }
    } else {
      this.sequenceIndex = Number(c === 60);
    }
  }
  stateCDATASequence(c) {
    if (c === Sequences.Cdata[this.sequenceIndex]) {
      if (++this.sequenceIndex === Sequences.Cdata.length) {
        this.state = 28;
        this.currentSequence = Sequences.CdataEnd;
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
      }
    } else {
      this.sequenceIndex = 0;
      this.state = 23;
      this.stateInDeclaration(c);
    }
  }
  /**
   * When we wait for one specific character, we can speed things up
   * by skipping through the buffer until we find it.
   *
   * @returns Whether the character was found.
   */
  fastForwardTo(c) {
    while (++this.index < this.buffer.length) {
      const cc = this.buffer.charCodeAt(this.index);
      if (cc === 10) {
        this.newlines.push(this.index);
      }
      if (cc === c) {
        return true;
      }
    }
    this.index = this.buffer.length - 1;
    return false;
  }
  /**
   * Comments and CDATA end with `-->` and `]]>`.
   *
   * Their common qualities are:
   * - Their end sequences have a distinct character they start with.
   * - That character is then repeated, so we have to check multiple repeats.
   * - All characters but the start character of the sequence can be skipped.
   */
  stateInCommentLike(c) {
    if (c === this.currentSequence[this.sequenceIndex]) {
      if (++this.sequenceIndex === this.currentSequence.length) {
        if (this.currentSequence === Sequences.CdataEnd) {
          this.cbs.oncdata(this.sectionStart, this.index - 2);
        } else {
          this.cbs.oncomment(this.sectionStart, this.index - 2);
        }
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
        this.state = 1;
      }
    } else if (this.sequenceIndex === 0) {
      if (this.fastForwardTo(this.currentSequence[0])) {
        this.sequenceIndex = 1;
      }
    } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
      this.sequenceIndex = 0;
    }
  }
  startSpecial(sequence, offset) {
    this.enterRCDATA(sequence, offset);
    this.state = 31;
  }
  enterRCDATA(sequence, offset) {
    this.inRCDATA = true;
    this.currentSequence = sequence;
    this.sequenceIndex = offset;
  }
  stateBeforeTagName(c) {
    if (c === 33) {
      this.state = 22;
      this.sectionStart = this.index + 1;
    } else if (c === 63) {
      this.state = 24;
      this.sectionStart = this.index + 1;
    } else if (isTagStartChar(c)) {
      this.sectionStart = this.index;
      if (this.mode === 0) {
        this.state = 6;
      } else if (this.inSFCRoot) {
        this.state = 34;
      } else if (!this.inXML) {
        if (c === 116) {
          this.state = 30;
        } else {
          this.state = c === 115 ? 29 : 6;
        }
      } else {
        this.state = 6;
      }
    } else if (c === 47) {
      this.state = 8;
    } else {
      this.state = 1;
      this.stateText(c);
    }
  }
  stateInTagName(c) {
    if (isEndOfTagSection(c)) {
      this.handleTagName(c);
    }
  }
  stateInSFCRootTagName(c) {
    if (isEndOfTagSection(c)) {
      const tag = this.buffer.slice(this.sectionStart, this.index);
      if (tag !== "template") {
        this.enterRCDATA(toCharCodes(`</` + tag), 0);
      }
      this.handleTagName(c);
    }
  }
  handleTagName(c) {
    this.cbs.onopentagname(this.sectionStart, this.index);
    this.sectionStart = -1;
    this.state = 11;
    this.stateBeforeAttrName(c);
  }
  stateBeforeClosingTagName(c) {
    if (isWhitespace(c)) ;
    else if (c === 62) {
      if (false) {
        this.cbs.onerr(14, this.index);
      }
      this.state = 1;
      this.sectionStart = this.index + 1;
    } else {
      this.state = isTagStartChar(c) ? 9 : 27;
      this.sectionStart = this.index;
    }
  }
  stateInClosingTagName(c) {
    if (c === 62 || isWhitespace(c)) {
      this.cbs.onclosetag(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = 10;
      this.stateAfterClosingTagName(c);
    }
  }
  stateAfterClosingTagName(c) {
    if (c === 62) {
      this.state = 1;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeAttrName(c) {
    if (c === 62) {
      this.cbs.onopentagend(this.index);
      if (this.inRCDATA) {
        this.state = 32;
      } else {
        this.state = 1;
      }
      this.sectionStart = this.index + 1;
    } else if (c === 47) {
      this.state = 7;
      if (false) {
        this.cbs.onerr(22, this.index);
      }
    } else if (c === 60 && this.peek() === 47) {
      this.cbs.onopentagend(this.index);
      this.state = 5;
      this.sectionStart = this.index;
    } else if (!isWhitespace(c)) {
      if (false) {
        this.cbs.onerr(
          19,
          this.index
        );
      }
      this.handleAttrStart(c);
    }
  }
  handleAttrStart(c) {
    if (c === 118 && this.peek() === 45) {
      this.state = 13;
      this.sectionStart = this.index;
    } else if (c === 46 || c === 58 || c === 64 || c === 35) {
      this.cbs.ondirname(this.index, this.index + 1);
      this.state = 14;
      this.sectionStart = this.index + 1;
    } else {
      this.state = 12;
      this.sectionStart = this.index;
    }
  }
  stateInSelfClosingTag(c) {
    if (c === 62) {
      this.cbs.onselfclosingtag(this.index);
      this.state = 1;
      this.sectionStart = this.index + 1;
      this.inRCDATA = false;
    } else if (!isWhitespace(c)) {
      this.state = 11;
      this.stateBeforeAttrName(c);
    }
  }
  stateInAttrName(c) {
    if (c === 61 || isEndOfTagSection(c)) {
      this.cbs.onattribname(this.sectionStart, this.index);
      this.handleAttrNameEnd(c);
    } else if (false) {
      this.cbs.onerr(
        17,
        this.index
      );
    }
  }
  stateInDirName(c) {
    if (c === 61 || isEndOfTagSection(c)) {
      this.cbs.ondirname(this.sectionStart, this.index);
      this.handleAttrNameEnd(c);
    } else if (c === 58) {
      this.cbs.ondirname(this.sectionStart, this.index);
      this.state = 14;
      this.sectionStart = this.index + 1;
    } else if (c === 46) {
      this.cbs.ondirname(this.sectionStart, this.index);
      this.state = 16;
      this.sectionStart = this.index + 1;
    }
  }
  stateInDirArg(c) {
    if (c === 61 || isEndOfTagSection(c)) {
      this.cbs.ondirarg(this.sectionStart, this.index);
      this.handleAttrNameEnd(c);
    } else if (c === 91) {
      this.state = 15;
    } else if (c === 46) {
      this.cbs.ondirarg(this.sectionStart, this.index);
      this.state = 16;
      this.sectionStart = this.index + 1;
    }
  }
  stateInDynamicDirArg(c) {
    if (c === 93) {
      this.state = 14;
    } else if (c === 61 || isEndOfTagSection(c)) {
      this.cbs.ondirarg(this.sectionStart, this.index + 1);
      this.handleAttrNameEnd(c);
      if (false) {
        this.cbs.onerr(
          27,
          this.index
        );
      }
    }
  }
  stateInDirModifier(c) {
    if (c === 61 || isEndOfTagSection(c)) {
      this.cbs.ondirmodifier(this.sectionStart, this.index);
      this.handleAttrNameEnd(c);
    } else if (c === 46) {
      this.cbs.ondirmodifier(this.sectionStart, this.index);
      this.sectionStart = this.index + 1;
    }
  }
  handleAttrNameEnd(c) {
    this.sectionStart = this.index;
    this.state = 17;
    this.cbs.onattribnameend(this.index);
    this.stateAfterAttrName(c);
  }
  stateAfterAttrName(c) {
    if (c === 61) {
      this.state = 18;
    } else if (c === 47 || c === 62) {
      this.cbs.onattribend(0, this.sectionStart);
      this.sectionStart = -1;
      this.state = 11;
      this.stateBeforeAttrName(c);
    } else if (!isWhitespace(c)) {
      this.cbs.onattribend(0, this.sectionStart);
      this.handleAttrStart(c);
    }
  }
  stateBeforeAttrValue(c) {
    if (c === 34) {
      this.state = 19;
      this.sectionStart = this.index + 1;
    } else if (c === 39) {
      this.state = 20;
      this.sectionStart = this.index + 1;
    } else if (!isWhitespace(c)) {
      this.sectionStart = this.index;
      this.state = 21;
      this.stateInAttrValueNoQuotes(c);
    }
  }
  handleInAttrValue(c, quote) {
    if (c === quote || this.fastForwardTo(quote)) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(
        quote === 34 ? 3 : 2,
        this.index + 1
      );
      this.state = 11;
    }
  }
  stateInAttrValueDoubleQuotes(c) {
    this.handleInAttrValue(c, 34);
  }
  stateInAttrValueSingleQuotes(c) {
    this.handleInAttrValue(c, 39);
  }
  stateInAttrValueNoQuotes(c) {
    if (isWhitespace(c) || c === 62) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(1, this.index);
      this.state = 11;
      this.stateBeforeAttrName(c);
    } else if (c === 39 || c === 60 || c === 61 || c === 96) {
      this.cbs.onerr(
        18,
        this.index
      );
    } else ;
  }
  stateBeforeDeclaration(c) {
    if (c === 91) {
      this.state = 26;
      this.sequenceIndex = 0;
    } else {
      this.state = c === 45 ? 25 : 23;
    }
  }
  stateInDeclaration(c) {
    if (c === 62 || this.fastForwardTo(62)) {
      this.state = 1;
      this.sectionStart = this.index + 1;
    }
  }
  stateInProcessingInstruction(c) {
    if (c === 62 || this.fastForwardTo(62)) {
      this.cbs.onprocessinginstruction(this.sectionStart, this.index);
      this.state = 1;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeComment(c) {
    if (c === 45) {
      this.state = 28;
      this.currentSequence = Sequences.CommentEnd;
      this.sequenceIndex = 2;
      this.sectionStart = this.index + 1;
    } else {
      this.state = 23;
    }
  }
  stateInSpecialComment(c) {
    if (c === 62 || this.fastForwardTo(62)) {
      this.cbs.oncomment(this.sectionStart, this.index);
      this.state = 1;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeSpecialS(c) {
    if (c === Sequences.ScriptEnd[3]) {
      this.startSpecial(Sequences.ScriptEnd, 4);
    } else if (c === Sequences.StyleEnd[3]) {
      this.startSpecial(Sequences.StyleEnd, 4);
    } else {
      this.state = 6;
      this.stateInTagName(c);
    }
  }
  stateBeforeSpecialT(c) {
    if (c === Sequences.TitleEnd[3]) {
      this.startSpecial(Sequences.TitleEnd, 4);
    } else if (c === Sequences.TextareaEnd[3]) {
      this.startSpecial(Sequences.TextareaEnd, 4);
    } else {
      this.state = 6;
      this.stateInTagName(c);
    }
  }
  startEntity() {
  }
  stateInEntity() {
  }
  /**
   * Iterates through the buffer, calling the function corresponding to the current state.
   *
   * States that are more likely to be hit are higher up, as a performance improvement.
   */
  parse(input) {
    this.buffer = input;
    while (this.index < this.buffer.length) {
      const c = this.buffer.charCodeAt(this.index);
      if (c === 10 && this.state !== 33) {
        this.newlines.push(this.index);
      }
      switch (this.state) {
        case 1: {
          this.stateText(c);
          break;
        }
        case 2: {
          this.stateInterpolationOpen(c);
          break;
        }
        case 3: {
          this.stateInterpolation(c);
          break;
        }
        case 4: {
          this.stateInterpolationClose(c);
          break;
        }
        case 31: {
          this.stateSpecialStartSequence(c);
          break;
        }
        case 32: {
          this.stateInRCDATA(c);
          break;
        }
        case 26: {
          this.stateCDATASequence(c);
          break;
        }
        case 19: {
          this.stateInAttrValueDoubleQuotes(c);
          break;
        }
        case 12: {
          this.stateInAttrName(c);
          break;
        }
        case 13: {
          this.stateInDirName(c);
          break;
        }
        case 14: {
          this.stateInDirArg(c);
          break;
        }
        case 15: {
          this.stateInDynamicDirArg(c);
          break;
        }
        case 16: {
          this.stateInDirModifier(c);
          break;
        }
        case 28: {
          this.stateInCommentLike(c);
          break;
        }
        case 27: {
          this.stateInSpecialComment(c);
          break;
        }
        case 11: {
          this.stateBeforeAttrName(c);
          break;
        }
        case 6: {
          this.stateInTagName(c);
          break;
        }
        case 34: {
          this.stateInSFCRootTagName(c);
          break;
        }
        case 9: {
          this.stateInClosingTagName(c);
          break;
        }
        case 5: {
          this.stateBeforeTagName(c);
          break;
        }
        case 17: {
          this.stateAfterAttrName(c);
          break;
        }
        case 20: {
          this.stateInAttrValueSingleQuotes(c);
          break;
        }
        case 18: {
          this.stateBeforeAttrValue(c);
          break;
        }
        case 8: {
          this.stateBeforeClosingTagName(c);
          break;
        }
        case 10: {
          this.stateAfterClosingTagName(c);
          break;
        }
        case 29: {
          this.stateBeforeSpecialS(c);
          break;
        }
        case 30: {
          this.stateBeforeSpecialT(c);
          break;
        }
        case 21: {
          this.stateInAttrValueNoQuotes(c);
          break;
        }
        case 7: {
          this.stateInSelfClosingTag(c);
          break;
        }
        case 23: {
          this.stateInDeclaration(c);
          break;
        }
        case 22: {
          this.stateBeforeDeclaration(c);
          break;
        }
        case 25: {
          this.stateBeforeComment(c);
          break;
        }
        case 24: {
          this.stateInProcessingInstruction(c);
          break;
        }
        case 33: {
          this.stateInEntity();
          break;
        }
      }
      this.index++;
    }
    this.cleanup();
    this.finish();
  }
  /**
   * Remove data that has already been consumed from the buffer.
   */
  cleanup() {
    if (this.sectionStart !== this.index) {
      if (this.state === 1 || this.state === 32 && this.sequenceIndex === 0) {
        this.cbs.ontext(this.sectionStart, this.index);
        this.sectionStart = this.index;
      } else if (this.state === 19 || this.state === 20 || this.state === 21) {
        this.cbs.onattribdata(this.sectionStart, this.index);
        this.sectionStart = this.index;
      }
    }
  }
  finish() {
    this.handleTrailingData();
    this.cbs.onend();
  }
  /** Handle any trailing data. */
  handleTrailingData() {
    const endIndex = this.buffer.length;
    if (this.sectionStart >= endIndex) {
      return;
    }
    if (this.state === 28) {
      if (this.currentSequence === Sequences.CdataEnd) {
        this.cbs.oncdata(this.sectionStart, endIndex);
      } else {
        this.cbs.oncomment(this.sectionStart, endIndex);
      }
    } else if (this.state === 6 || this.state === 11 || this.state === 18 || this.state === 17 || this.state === 12 || this.state === 13 || this.state === 14 || this.state === 15 || this.state === 16 || this.state === 20 || this.state === 19 || this.state === 21 || this.state === 9) ;
    else {
      this.cbs.ontext(this.sectionStart, endIndex);
    }
  }
  emitCodePoint(cp, consumed) {
  }
}
const CompilerDeprecationTypes = {
  "COMPILER_IS_ON_ELEMENT": "COMPILER_IS_ON_ELEMENT",
  "COMPILER_V_BIND_SYNC": "COMPILER_V_BIND_SYNC",
  "COMPILER_V_BIND_OBJECT_ORDER": "COMPILER_V_BIND_OBJECT_ORDER",
  "COMPILER_V_ON_NATIVE": "COMPILER_V_ON_NATIVE",
  "COMPILER_V_IF_V_FOR_PRECEDENCE": "COMPILER_V_IF_V_FOR_PRECEDENCE",
  "COMPILER_NATIVE_TEMPLATE": "COMPILER_NATIVE_TEMPLATE",
  "COMPILER_INLINE_TEMPLATE": "COMPILER_INLINE_TEMPLATE",
  "COMPILER_FILTERS": "COMPILER_FILTERS"
};
const deprecationData = {
  ["COMPILER_IS_ON_ELEMENT"]: {
    message: `Platform-native elements with "is" prop will no longer be treated as components in Vue 3 unless the "is" value is explicitly prefixed with "vue:".`,
    link: `https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html`
  },
  ["COMPILER_V_BIND_SYNC"]: {
    message: (key) => `.sync modifier for v-bind has been removed. Use v-model with argument instead. \`v-bind:${key}.sync\` should be changed to \`v-model:${key}\`.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-model.html`
  },
  ["COMPILER_V_BIND_OBJECT_ORDER"]: {
    message: `v-bind="obj" usage is now order sensitive and behaves like JavaScript object spread: it will now overwrite an existing non-mergeable attribute that appears before v-bind in the case of conflict. To retain 2.x behavior, move v-bind to make it the first attribute. You can also suppress this warning if the usage is intended.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-bind.html`
  },
  ["COMPILER_V_ON_NATIVE"]: {
    message: `.native modifier for v-on has been removed as is no longer necessary.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-on-native-modifier-removed.html`
  },
  ["COMPILER_V_IF_V_FOR_PRECEDENCE"]: {
    message: `v-if / v-for precedence when used on the same element has changed in Vue 3: v-if now takes higher precedence and will no longer have access to v-for scope variables. It is best to avoid the ambiguity with <template> tags or use a computed property that filters v-for data source.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-if-v-for.html`
  },
  ["COMPILER_NATIVE_TEMPLATE"]: {
    message: `<template> with no special directives will render as a native template element instead of its inner content in Vue 3.`
  },
  ["COMPILER_INLINE_TEMPLATE"]: {
    message: `"inline-template" has been removed in Vue 3.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/inline-template-attribute.html`
  },
  ["COMPILER_FILTERS"]: {
    message: `filters have been removed in Vue 3. The "|" symbol will be treated as native JavaScript bitwise OR operator. Use method calls or computed properties instead.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/filters.html`
  }
};
function getCompatValue(key, { compatConfig }) {
  const value = compatConfig && compatConfig[key];
  if (key === "MODE") {
    return value || 3;
  } else {
    return value;
  }
}
function isCompatEnabled(key, context) {
  const mode = getCompatValue("MODE", context);
  const value = getCompatValue(key, context);
  return mode === 3 ? value === true : value !== false;
}
function checkCompatEnabled(key, context, loc, ...args) {
  const enabled = isCompatEnabled(key, context);
  if (false) {
    warnDeprecation(key, context, loc, ...args);
  }
  return enabled;
}
function warnDeprecation(key, context, loc, ...args) {
  const val = getCompatValue(key, context);
  if (val === "suppress-warning") {
    return;
  }
  const { message, link } = deprecationData[key];
  const msg = `(deprecation ${key}) ${typeof message === "function" ? message(...args) : message}${link ? `
  Details: ${link}` : ``}`;
  const err = new SyntaxError(msg);
  err.code = key;
  if (loc) err.loc = loc;
  context.onWarn(err);
}
function defaultOnError(error) {
  throw error;
}
function defaultOnWarn(msg) {
}
function createCompilerError(code, loc, messages, additionalMessage) {
  const msg = false ? (messages || errorMessages)[code] + (additionalMessage || ``) : `https://vuejs.org/error-reference/#compiler-${code}`;
  const error = new SyntaxError(String(msg));
  error.code = code;
  error.loc = loc;
  return error;
}
const ErrorCodes = {
  "ABRUPT_CLOSING_OF_EMPTY_COMMENT": 0,
  "0": "ABRUPT_CLOSING_OF_EMPTY_COMMENT",
  "CDATA_IN_HTML_CONTENT": 1,
  "1": "CDATA_IN_HTML_CONTENT",
  "DUPLICATE_ATTRIBUTE": 2,
  "2": "DUPLICATE_ATTRIBUTE",
  "END_TAG_WITH_ATTRIBUTES": 3,
  "3": "END_TAG_WITH_ATTRIBUTES",
  "END_TAG_WITH_TRAILING_SOLIDUS": 4,
  "4": "END_TAG_WITH_TRAILING_SOLIDUS",
  "EOF_BEFORE_TAG_NAME": 5,
  "5": "EOF_BEFORE_TAG_NAME",
  "EOF_IN_CDATA": 6,
  "6": "EOF_IN_CDATA",
  "EOF_IN_COMMENT": 7,
  "7": "EOF_IN_COMMENT",
  "EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT": 8,
  "8": "EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT",
  "EOF_IN_TAG": 9,
  "9": "EOF_IN_TAG",
  "INCORRECTLY_CLOSED_COMMENT": 10,
  "10": "INCORRECTLY_CLOSED_COMMENT",
  "INCORRECTLY_OPENED_COMMENT": 11,
  "11": "INCORRECTLY_OPENED_COMMENT",
  "INVALID_FIRST_CHARACTER_OF_TAG_NAME": 12,
  "12": "INVALID_FIRST_CHARACTER_OF_TAG_NAME",
  "MISSING_ATTRIBUTE_VALUE": 13,
  "13": "MISSING_ATTRIBUTE_VALUE",
  "MISSING_END_TAG_NAME": 14,
  "14": "MISSING_END_TAG_NAME",
  "MISSING_WHITESPACE_BETWEEN_ATTRIBUTES": 15,
  "15": "MISSING_WHITESPACE_BETWEEN_ATTRIBUTES",
  "NESTED_COMMENT": 16,
  "16": "NESTED_COMMENT",
  "UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME": 17,
  "17": "UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME",
  "UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE": 18,
  "18": "UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE",
  "UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME": 19,
  "19": "UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME",
  "UNEXPECTED_NULL_CHARACTER": 20,
  "20": "UNEXPECTED_NULL_CHARACTER",
  "UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME": 21,
  "21": "UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME",
  "UNEXPECTED_SOLIDUS_IN_TAG": 22,
  "22": "UNEXPECTED_SOLIDUS_IN_TAG",
  "X_INVALID_END_TAG": 23,
  "23": "X_INVALID_END_TAG",
  "X_MISSING_END_TAG": 24,
  "24": "X_MISSING_END_TAG",
  "X_MISSING_INTERPOLATION_END": 25,
  "25": "X_MISSING_INTERPOLATION_END",
  "X_MISSING_DIRECTIVE_NAME": 26,
  "26": "X_MISSING_DIRECTIVE_NAME",
  "X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END": 27,
  "27": "X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END",
  "X_V_IF_NO_EXPRESSION": 28,
  "28": "X_V_IF_NO_EXPRESSION",
  "X_V_IF_SAME_KEY": 29,
  "29": "X_V_IF_SAME_KEY",
  "X_V_ELSE_NO_ADJACENT_IF": 30,
  "30": "X_V_ELSE_NO_ADJACENT_IF",
  "X_V_FOR_NO_EXPRESSION": 31,
  "31": "X_V_FOR_NO_EXPRESSION",
  "X_V_FOR_MALFORMED_EXPRESSION": 32,
  "32": "X_V_FOR_MALFORMED_EXPRESSION",
  "X_V_FOR_TEMPLATE_KEY_PLACEMENT": 33,
  "33": "X_V_FOR_TEMPLATE_KEY_PLACEMENT",
  "X_V_BIND_NO_EXPRESSION": 34,
  "34": "X_V_BIND_NO_EXPRESSION",
  "X_V_ON_NO_EXPRESSION": 35,
  "35": "X_V_ON_NO_EXPRESSION",
  "X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET": 36,
  "36": "X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET",
  "X_V_SLOT_MIXED_SLOT_USAGE": 37,
  "37": "X_V_SLOT_MIXED_SLOT_USAGE",
  "X_V_SLOT_DUPLICATE_SLOT_NAMES": 38,
  "38": "X_V_SLOT_DUPLICATE_SLOT_NAMES",
  "X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN": 39,
  "39": "X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN",
  "X_V_SLOT_MISPLACED": 40,
  "40": "X_V_SLOT_MISPLACED",
  "X_V_MODEL_NO_EXPRESSION": 41,
  "41": "X_V_MODEL_NO_EXPRESSION",
  "X_V_MODEL_MALFORMED_EXPRESSION": 42,
  "42": "X_V_MODEL_MALFORMED_EXPRESSION",
  "X_V_MODEL_ON_SCOPE_VARIABLE": 43,
  "43": "X_V_MODEL_ON_SCOPE_VARIABLE",
  "X_V_MODEL_ON_PROPS": 44,
  "44": "X_V_MODEL_ON_PROPS",
  "X_V_MODEL_ON_CONST": 45,
  "45": "X_V_MODEL_ON_CONST",
  "X_INVALID_EXPRESSION": 46,
  "46": "X_INVALID_EXPRESSION",
  "X_KEEP_ALIVE_INVALID_CHILDREN": 47,
  "47": "X_KEEP_ALIVE_INVALID_CHILDREN",
  "X_PREFIX_ID_NOT_SUPPORTED": 48,
  "48": "X_PREFIX_ID_NOT_SUPPORTED",
  "X_MODULE_MODE_NOT_SUPPORTED": 49,
  "49": "X_MODULE_MODE_NOT_SUPPORTED",
  "X_CACHE_HANDLER_NOT_SUPPORTED": 50,
  "50": "X_CACHE_HANDLER_NOT_SUPPORTED",
  "X_SCOPE_ID_NOT_SUPPORTED": 51,
  "51": "X_SCOPE_ID_NOT_SUPPORTED",
  "X_VNODE_HOOKS": 52,
  "52": "X_VNODE_HOOKS",
  "X_V_BIND_INVALID_SAME_NAME_ARGUMENT": 53,
  "53": "X_V_BIND_INVALID_SAME_NAME_ARGUMENT",
  "__EXTEND_POINT__": 54,
  "54": "__EXTEND_POINT__"
};
const errorMessages = {
  // parse errors
  [0]: "Illegal comment.",
  [1]: "CDATA section is allowed only in XML context.",
  [2]: "Duplicate attribute.",
  [3]: "End tag cannot have attributes.",
  [4]: "Illegal '/' in tags.",
  [5]: "Unexpected EOF in tag.",
  [6]: "Unexpected EOF in CDATA section.",
  [7]: "Unexpected EOF in comment.",
  [8]: "Unexpected EOF in script.",
  [9]: "Unexpected EOF in tag.",
  [10]: "Incorrectly closed comment.",
  [11]: "Incorrectly opened comment.",
  [12]: "Illegal tag name. Use '&lt;' to print '<'.",
  [13]: "Attribute value was expected.",
  [14]: "End tag name was expected.",
  [15]: "Whitespace was expected.",
  [16]: "Unexpected '<!--' in comment.",
  [17]: `Attribute name cannot contain U+0022 ("), U+0027 ('), and U+003C (<).`,
  [18]: "Unquoted attribute value cannot contain U+0022 (\"), U+0027 ('), U+003C (<), U+003D (=), and U+0060 (`).",
  [19]: "Attribute name cannot start with '='.",
  [21]: "'<?' is allowed only in XML context.",
  [20]: `Unexpected null character.`,
  [22]: "Illegal '/' in tags.",
  // Vue-specific parse errors
  [23]: "Invalid end tag.",
  [24]: "Element is missing end tag.",
  [25]: "Interpolation end sign was not found.",
  [27]: "End bracket for dynamic directive argument was not found. Note that dynamic directive argument cannot contain spaces.",
  [26]: "Legal directive name was expected.",
  // transform errors
  [28]: `v-if/v-else-if is missing expression.`,
  [29]: `v-if/else branches must use unique keys.`,
  [30]: `v-else/v-else-if has no adjacent v-if or v-else-if.`,
  [31]: `v-for is missing expression.`,
  [32]: `v-for has invalid expression.`,
  [33]: `<template v-for> key should be placed on the <template> tag.`,
  [34]: `v-bind is missing expression.`,
  [53]: `v-bind with same-name shorthand only allows static argument.`,
  [35]: `v-on is missing expression.`,
  [36]: `Unexpected custom directive on <slot> outlet.`,
  [37]: `Mixed v-slot usage on both the component and nested <template>. When there are multiple named slots, all slots should use <template> syntax to avoid scope ambiguity.`,
  [38]: `Duplicate slot names found. `,
  [39]: `Extraneous children found when component already has explicitly named default slot. These children will be ignored.`,
  [40]: `v-slot can only be used on components or <template> tags.`,
  [41]: `v-model is missing expression.`,
  [42]: `v-model value must be a valid JavaScript member expression.`,
  [43]: `v-model cannot be used on v-for or v-slot scope variables because they are not writable.`,
  [44]: `v-model cannot be used on a prop, because local prop bindings are not writable.
Use a v-bind binding combined with a v-on listener that emits update:x event instead.`,
  [45]: `v-model cannot be used on a const binding because it is not writable.`,
  [46]: `Error parsing JavaScript expression: `,
  [47]: `<KeepAlive> expects exactly one child component.`,
  [52]: `@vnode-* hooks in templates are no longer supported. Use the vue: prefix instead. For example, @vnode-mounted should be changed to @vue:mounted. @vnode-* hooks support has been removed in 3.4.`,
  // generic errors
  [48]: `"prefixIdentifiers" option is not supported in this build of compiler.`,
  [49]: `ES module mode is not supported in this build of compiler.`,
  [50]: `"cacheHandlers" option is only supported when the "prefixIdentifiers" option is enabled.`,
  [51]: `"scopeId" option is only supported in module mode.`,
  // just to fulfill types
  [54]: ``
};
function walkIdentifiers(root, onIdentifier, includeAll = false, parentStack = [], knownIds = /* @__PURE__ */ Object.create(null)) {
  {
    return;
  }
}
function isReferencedIdentifier(id, parent, parentStack) {
  {
    return false;
  }
}
function isInDestructureAssignment(parent, parentStack) {
  if (parent && (parent.type === "ObjectProperty" || parent.type === "ArrayPattern")) {
    let i = parentStack.length;
    while (i--) {
      const p = parentStack[i];
      if (p.type === "AssignmentExpression") {
        return true;
      } else if (p.type !== "ObjectProperty" && !p.type.endsWith("Pattern")) {
        break;
      }
    }
  }
  return false;
}
function isInNewExpression(parentStack) {
  let i = parentStack.length;
  while (i--) {
    const p = parentStack[i];
    if (p.type === "NewExpression") {
      return true;
    } else if (p.type !== "MemberExpression") {
      break;
    }
  }
  return false;
}
function walkFunctionParams(node, onIdent) {
  for (const p of node.params) {
    for (const id of extractIdentifiers(p)) {
      onIdent(id);
    }
  }
}
function walkBlockDeclarations(block, onIdent) {
  const body = block.type === "SwitchCase" ? block.consequent : block.body;
  for (const stmt of body) {
    if (stmt.type === "VariableDeclaration") {
      if (stmt.declare) continue;
      for (const decl of stmt.declarations) {
        for (const id of extractIdentifiers(decl.id)) {
          onIdent(id);
        }
      }
    } else if (stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") {
      if (stmt.declare || !stmt.id) continue;
      onIdent(stmt.id);
    } else if (isForStatement(stmt)) {
      walkForStatement(stmt, true, onIdent);
    } else if (stmt.type === "SwitchStatement") {
      walkSwitchStatement(stmt, true, onIdent);
    }
  }
}
function isForStatement(stmt) {
  return stmt.type === "ForOfStatement" || stmt.type === "ForInStatement" || stmt.type === "ForStatement";
}
function walkForStatement(stmt, isVar, onIdent) {
  const variable = stmt.type === "ForStatement" ? stmt.init : stmt.left;
  if (variable && variable.type === "VariableDeclaration" && (variable.kind === "var" ? isVar : !isVar)) {
    for (const decl of variable.declarations) {
      for (const id of extractIdentifiers(decl.id)) {
        onIdent(id);
      }
    }
  }
}
function walkSwitchStatement(stmt, isVar, onIdent) {
  for (const cs of stmt.cases) {
    for (const stmt2 of cs.consequent) {
      if (stmt2.type === "VariableDeclaration" && (stmt2.kind === "var" ? isVar : !isVar)) {
        for (const decl of stmt2.declarations) {
          for (const id of extractIdentifiers(decl.id)) {
            onIdent(id);
          }
        }
      }
    }
    walkBlockDeclarations(cs, onIdent);
  }
}
function extractIdentifiers(param, nodes = []) {
  switch (param.type) {
    case "Identifier":
      nodes.push(param);
      break;
    case "MemberExpression":
      let object = param;
      while (object.type === "MemberExpression") {
        object = object.object;
      }
      nodes.push(object);
      break;
    case "ObjectPattern":
      for (const prop of param.properties) {
        if (prop.type === "RestElement") {
          extractIdentifiers(prop.argument, nodes);
        } else {
          extractIdentifiers(prop.value, nodes);
        }
      }
      break;
    case "ArrayPattern":
      param.elements.forEach((element) => {
        if (element) extractIdentifiers(element, nodes);
      });
      break;
    case "RestElement":
      extractIdentifiers(param.argument, nodes);
      break;
    case "AssignmentPattern":
      extractIdentifiers(param.left, nodes);
      break;
  }
  return nodes;
}
const isFunctionType = (node) => {
  return /Function(?:Expression|Declaration)$|Method$/.test(node.type);
};
const isStaticProperty = (node) => node && (node.type === "ObjectProperty" || node.type === "ObjectMethod") && !node.computed;
const isStaticPropertyKey = (node, parent) => isStaticProperty(parent) && parent.key === node;
const TS_NODE_TYPES = [
  "TSAsExpression",
  // foo as number
  "TSTypeAssertion",
  // (<number>foo)
  "TSNonNullExpression",
  // foo!
  "TSInstantiationExpression",
  // foo<string>
  "TSSatisfiesExpression"
  // foo satisfies T
];
function unwrapTSNode(node) {
  if (TS_NODE_TYPES.includes(node.type)) {
    return unwrapTSNode(node.expression);
  } else {
    return node;
  }
}
const isStaticExp = (p) => p.type === 4 && p.isStatic;
function isCoreComponent(tag) {
  switch (tag) {
    case "Teleport":
    case "teleport":
      return TELEPORT;
    case "Suspense":
    case "suspense":
      return SUSPENSE;
    case "KeepAlive":
    case "keep-alive":
      return KEEP_ALIVE;
    case "BaseTransition":
    case "base-transition":
      return BASE_TRANSITION;
  }
}
const nonIdentifierRE = /^$|^\d|[^\$\w\xA0-\uFFFF]/;
const isSimpleIdentifier = (name) => !nonIdentifierRE.test(name);
const validFirstIdentCharRE = /[A-Za-z_$\xA0-\uFFFF]/;
const validIdentCharRE = /[\.\?\w$\xA0-\uFFFF]/;
const whitespaceRE = /\s+[.[]\s*|\s*[.[]\s+/g;
const getExpSource = (exp) => exp.type === 4 ? exp.content : exp.loc.source;
const isMemberExpressionBrowser = (exp) => {
  const path = getExpSource(exp).trim().replace(whitespaceRE, (s) => s.trim());
  let state = 0;
  let stateStack = [];
  let currentOpenBracketCount = 0;
  let currentOpenParensCount = 0;
  let currentStringType = null;
  for (let i = 0; i < path.length; i++) {
    const char = path.charAt(i);
    switch (state) {
      case 0:
        if (char === "[") {
          stateStack.push(state);
          state = 1;
          currentOpenBracketCount++;
        } else if (char === "(") {
          stateStack.push(state);
          state = 2;
          currentOpenParensCount++;
        } else if (!(i === 0 ? validFirstIdentCharRE : validIdentCharRE).test(char)) {
          return false;
        }
        break;
      case 1:
        if (char === `'` || char === `"` || char === "`") {
          stateStack.push(state);
          state = 3;
          currentStringType = char;
        } else if (char === `[`) {
          currentOpenBracketCount++;
        } else if (char === `]`) {
          if (!--currentOpenBracketCount) {
            state = stateStack.pop();
          }
        }
        break;
      case 2:
        if (char === `'` || char === `"` || char === "`") {
          stateStack.push(state);
          state = 3;
          currentStringType = char;
        } else if (char === `(`) {
          currentOpenParensCount++;
        } else if (char === `)`) {
          if (i === path.length - 1) {
            return false;
          }
          if (!--currentOpenParensCount) {
            state = stateStack.pop();
          }
        }
        break;
      case 3:
        if (char === currentStringType) {
          state = stateStack.pop();
          currentStringType = null;
        }
        break;
    }
  }
  return !currentOpenBracketCount && !currentOpenParensCount;
};
const isMemberExpressionNode = NOOP$1;
const isMemberExpression = isMemberExpressionBrowser;
const fnExpRE = /^\s*(?:async\s*)?(?:\([^)]*?\)|[\w$_]+)\s*(?::[^=]+)?=>|^\s*(?:async\s+)?function(?:\s+[\w$]+)?\s*\(/;
const isFnExpressionBrowser = (exp) => fnExpRE.test(getExpSource(exp));
const isFnExpressionNode = NOOP$1;
const isFnExpression = isFnExpressionBrowser;
function advancePositionWithClone(pos, source, numberOfCharacters = source.length) {
  return advancePositionWithMutation(
    {
      offset: pos.offset,
      line: pos.line,
      column: pos.column
    },
    source,
    numberOfCharacters
  );
}
function advancePositionWithMutation(pos, source, numberOfCharacters = source.length) {
  let linesCount = 0;
  let lastNewLinePos = -1;
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10) {
      linesCount++;
      lastNewLinePos = i;
    }
  }
  pos.offset += numberOfCharacters;
  pos.line += linesCount;
  pos.column = lastNewLinePos === -1 ? pos.column + numberOfCharacters : numberOfCharacters - lastNewLinePos;
  return pos;
}
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg || `unexpected compiler condition`);
  }
}
function findDir(node, name, allowEmpty = false) {
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === 7 && (allowEmpty || p.exp) && (isString$1(name) ? p.name === name : name.test(p.name))) {
      return p;
    }
  }
}
function findProp(node, name, dynamicOnly = false, allowEmpty = false) {
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === 6) {
      if (dynamicOnly) continue;
      if (p.name === name && (p.value || allowEmpty)) {
        return p;
      }
    } else if (p.name === "bind" && (p.exp || allowEmpty) && isStaticArgOf(p.arg, name)) {
      return p;
    }
  }
}
function isStaticArgOf(arg, name) {
  return !!(arg && isStaticExp(arg) && arg.content === name);
}
function hasDynamicKeyVBind(node) {
  return node.props.some(
    (p) => p.type === 7 && p.name === "bind" && (!p.arg || // v-bind="obj"
    p.arg.type !== 4 || // v-bind:[_ctx.foo]
    !p.arg.isStatic)
    // v-bind:[foo]
  );
}
function isText$1(node) {
  return node.type === 5 || node.type === 2;
}
function isVPre(p) {
  return p.type === 7 && p.name === "pre";
}
function isVSlot(p) {
  return p.type === 7 && p.name === "slot";
}
function isTemplateNode(node) {
  return node.type === 1 && node.tagType === 3;
}
function isSlotOutlet(node) {
  return node.type === 1 && node.tagType === 2;
}
const propsHelperSet = /* @__PURE__ */ new Set([NORMALIZE_PROPS, GUARD_REACTIVE_PROPS]);
function getUnnormalizedProps(props, callPath = []) {
  if (props && !isString$1(props) && props.type === 14) {
    const callee = props.callee;
    if (!isString$1(callee) && propsHelperSet.has(callee)) {
      return getUnnormalizedProps(
        props.arguments[0],
        callPath.concat(props)
      );
    }
  }
  return [props, callPath];
}
function injectProp(node, prop, context) {
  let propsWithInjection;
  let props = node.type === 13 ? node.props : node.arguments[2];
  let callPath = [];
  let parentCall;
  if (props && !isString$1(props) && props.type === 14) {
    const ret = getUnnormalizedProps(props);
    props = ret[0];
    callPath = ret[1];
    parentCall = callPath[callPath.length - 1];
  }
  if (props == null || isString$1(props)) {
    propsWithInjection = createObjectExpression([prop]);
  } else if (props.type === 14) {
    const first = props.arguments[0];
    if (!isString$1(first) && first.type === 15) {
      if (!hasProp(prop, first)) {
        first.properties.unshift(prop);
      }
    } else {
      if (props.callee === TO_HANDLERS) {
        propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
          createObjectExpression([prop]),
          props
        ]);
      } else {
        props.arguments.unshift(createObjectExpression([prop]));
      }
    }
    !propsWithInjection && (propsWithInjection = props);
  } else if (props.type === 15) {
    if (!hasProp(prop, props)) {
      props.properties.unshift(prop);
    }
    propsWithInjection = props;
  } else {
    propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
      createObjectExpression([prop]),
      props
    ]);
    if (parentCall && parentCall.callee === GUARD_REACTIVE_PROPS) {
      parentCall = callPath[callPath.length - 2];
    }
  }
  if (node.type === 13) {
    if (parentCall) {
      parentCall.arguments[0] = propsWithInjection;
    } else {
      node.props = propsWithInjection;
    }
  } else {
    if (parentCall) {
      parentCall.arguments[0] = propsWithInjection;
    } else {
      node.arguments[2] = propsWithInjection;
    }
  }
}
function hasProp(prop, props) {
  let result = false;
  if (prop.key.type === 4) {
    const propKeyName = prop.key.content;
    result = props.properties.some(
      (p) => p.key.type === 4 && p.key.content === propKeyName
    );
  }
  return result;
}
function toValidAssetId(name, type) {
  return `_${type}_${name.replace(/[^\w]/g, (searchValue, replaceValue) => {
    return searchValue === "-" ? "_" : name.charCodeAt(replaceValue).toString();
  })}`;
}
function hasScopeRef(node, ids) {
  if (!node || Object.keys(ids).length === 0) {
    return false;
  }
  switch (node.type) {
    case 1:
      for (let i = 0; i < node.props.length; i++) {
        const p = node.props[i];
        if (p.type === 7 && (hasScopeRef(p.arg, ids) || hasScopeRef(p.exp, ids))) {
          return true;
        }
      }
      return node.children.some((c) => hasScopeRef(c, ids));
    case 11:
      if (hasScopeRef(node.source, ids)) {
        return true;
      }
      return node.children.some((c) => hasScopeRef(c, ids));
    case 9:
      return node.branches.some((b) => hasScopeRef(b, ids));
    case 10:
      if (hasScopeRef(node.condition, ids)) {
        return true;
      }
      return node.children.some((c) => hasScopeRef(c, ids));
    case 4:
      return !node.isStatic && isSimpleIdentifier(node.content) && !!ids[node.content];
    case 8:
      return node.children.some((c) => isObject$2(c) && hasScopeRef(c, ids));
    case 5:
    case 12:
      return hasScopeRef(node.content, ids);
    case 2:
    case 3:
    case 20:
      return false;
    default:
      if (false) ;
      return false;
  }
}
function getMemoedVNodeCall(node) {
  if (node.type === 14 && node.callee === WITH_MEMO) {
    return node.arguments[1].returns;
  } else {
    return node;
  }
}
const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+(\S[\s\S]*)/;
function isAllWhitespace(str) {
  for (let i = 0; i < str.length; i++) {
    if (!isWhitespace(str.charCodeAt(i))) {
      return false;
    }
  }
  return true;
}
function isWhitespaceText(node) {
  return node.type === 2 && isAllWhitespace(node.content) || node.type === 12 && isWhitespaceText(node.content);
}
function isCommentOrWhitespace(node) {
  return node.type === 3 || isWhitespaceText(node);
}
const defaultParserOptions = {
  parseMode: "base",
  ns: 0,
  delimiters: [`{{`, `}}`],
  getNamespace: () => 0,
  isVoidTag: NO,
  isPreTag: NO,
  isIgnoreNewlineTag: NO,
  isCustomElement: NO,
  onError: defaultOnError,
  onWarn: defaultOnWarn,
  comments: false,
  prefixIdentifiers: false
};
let currentOptions = defaultParserOptions;
let currentRoot = null;
let currentInput = "";
let currentOpenTag = null;
let currentProp = null;
let currentAttrValue = "";
let currentAttrStartIndex = -1;
let currentAttrEndIndex = -1;
let inPre = 0;
let inVPre = false;
let currentVPreBoundary = null;
const stack = [];
const tokenizer = new Tokenizer(stack, {
  onerr: emitError,
  ontext(start, end) {
    onText(getSlice(start, end), start, end);
  },
  ontextentity(char, start, end) {
    onText(char, start, end);
  },
  oninterpolation(start, end) {
    if (inVPre) {
      return onText(getSlice(start, end), start, end);
    }
    let innerStart = start + tokenizer.delimiterOpen.length;
    let innerEnd = end - tokenizer.delimiterClose.length;
    while (isWhitespace(currentInput.charCodeAt(innerStart))) {
      innerStart++;
    }
    while (isWhitespace(currentInput.charCodeAt(innerEnd - 1))) {
      innerEnd--;
    }
    let exp = getSlice(innerStart, innerEnd);
    if (exp.includes("&")) {
      {
        exp = currentOptions.decodeEntities(exp, false);
      }
    }
    addNode({
      type: 5,
      content: createExp(exp, false, getLoc(innerStart, innerEnd)),
      loc: getLoc(start, end)
    });
  },
  onopentagname(start, end) {
    const name = getSlice(start, end);
    currentOpenTag = {
      type: 1,
      tag: name,
      ns: currentOptions.getNamespace(name, stack[0], currentOptions.ns),
      tagType: 0,
      // will be refined on tag close
      props: [],
      children: [],
      loc: getLoc(start - 1, end),
      codegenNode: void 0
    };
  },
  onopentagend(end) {
    endOpenTag(end);
  },
  onclosetag(start, end) {
    const name = getSlice(start, end);
    if (!currentOptions.isVoidTag(name)) {
      let found = false;
      for (let i = 0; i < stack.length; i++) {
        const e = stack[i];
        if (e.tag.toLowerCase() === name.toLowerCase()) {
          found = true;
          if (i > 0) {
            emitError(24, stack[0].loc.start.offset);
          }
          for (let j = 0; j <= i; j++) {
            const el = stack.shift();
            onCloseTag(el, end, j < i);
          }
          break;
        }
      }
      if (!found) {
        emitError(23, backTrack(start, 60));
      }
    }
  },
  onselfclosingtag(end) {
    const name = currentOpenTag.tag;
    currentOpenTag.isSelfClosing = true;
    endOpenTag(end);
    if (stack[0] && stack[0].tag === name) {
      onCloseTag(stack.shift(), end);
    }
  },
  onattribname(start, end) {
    currentProp = {
      type: 6,
      name: getSlice(start, end),
      nameLoc: getLoc(start, end),
      value: void 0,
      loc: getLoc(start)
    };
  },
  ondirname(start, end) {
    const raw = getSlice(start, end);
    const name = raw === "." || raw === ":" ? "bind" : raw === "@" ? "on" : raw === "#" ? "slot" : raw.slice(2);
    if (!inVPre && name === "") {
      emitError(26, start);
    }
    if (inVPre || name === "") {
      currentProp = {
        type: 6,
        name: raw,
        nameLoc: getLoc(start, end),
        value: void 0,
        loc: getLoc(start)
      };
    } else {
      currentProp = {
        type: 7,
        name,
        rawName: raw,
        exp: void 0,
        arg: void 0,
        modifiers: raw === "." ? [createSimpleExpression("prop")] : [],
        loc: getLoc(start)
      };
      if (name === "pre") {
        inVPre = tokenizer.inVPre = true;
        currentVPreBoundary = currentOpenTag;
        const props = currentOpenTag.props;
        for (let i = 0; i < props.length; i++) {
          if (props[i].type === 7) {
            props[i] = dirToAttr(props[i]);
          }
        }
      }
    }
  },
  ondirarg(start, end) {
    if (start === end) return;
    const arg = getSlice(start, end);
    if (inVPre && !isVPre(currentProp)) {
      currentProp.name += arg;
      setLocEnd(currentProp.nameLoc, end);
    } else {
      const isStatic = arg[0] !== `[`;
      currentProp.arg = createExp(
        isStatic ? arg : arg.slice(1, -1),
        isStatic,
        getLoc(start, end),
        isStatic ? 3 : 0
      );
    }
  },
  ondirmodifier(start, end) {
    const mod = getSlice(start, end);
    if (inVPre && !isVPre(currentProp)) {
      currentProp.name += "." + mod;
      setLocEnd(currentProp.nameLoc, end);
    } else if (currentProp.name === "slot") {
      const arg = currentProp.arg;
      if (arg) {
        arg.content += "." + mod;
        setLocEnd(arg.loc, end);
      }
    } else {
      const exp = createSimpleExpression(mod, true, getLoc(start, end));
      currentProp.modifiers.push(exp);
    }
  },
  onattribdata(start, end) {
    currentAttrValue += getSlice(start, end);
    if (currentAttrStartIndex < 0) currentAttrStartIndex = start;
    currentAttrEndIndex = end;
  },
  onattribentity(char, start, end) {
    currentAttrValue += char;
    if (currentAttrStartIndex < 0) currentAttrStartIndex = start;
    currentAttrEndIndex = end;
  },
  onattribnameend(end) {
    const start = currentProp.loc.start.offset;
    const name = getSlice(start, end);
    if (currentProp.type === 7) {
      currentProp.rawName = name;
    }
    if (currentOpenTag.props.some(
      (p) => (p.type === 7 ? p.rawName : p.name) === name
    )) {
      emitError(2, start);
    }
  },
  onattribend(quote, end) {
    if (currentOpenTag && currentProp) {
      setLocEnd(currentProp.loc, end);
      if (quote !== 0) {
        if (currentAttrValue.includes("&")) {
          currentAttrValue = currentOptions.decodeEntities(
            currentAttrValue,
            true
          );
        }
        if (currentProp.type === 6) {
          if (currentProp.name === "class") {
            currentAttrValue = condense(currentAttrValue).trim();
          }
          if (quote === 1 && !currentAttrValue) {
            emitError(13, end);
          }
          currentProp.value = {
            type: 2,
            content: currentAttrValue,
            loc: quote === 1 ? getLoc(currentAttrStartIndex, currentAttrEndIndex) : getLoc(currentAttrStartIndex - 1, currentAttrEndIndex + 1)
          };
          if (tokenizer.inSFCRoot && currentOpenTag.tag === "template" && currentProp.name === "lang" && currentAttrValue && currentAttrValue !== "html") {
            tokenizer.enterRCDATA(toCharCodes(`</template`), 0);
          }
        } else {
          let expParseMode = 0;
          currentProp.exp = createExp(
            currentAttrValue,
            false,
            getLoc(currentAttrStartIndex, currentAttrEndIndex),
            0,
            expParseMode
          );
          if (currentProp.name === "for") {
            currentProp.forParseResult = parseForExpression(currentProp.exp);
          }
          let syncIndex = -1;
          if (currentProp.name === "bind" && (syncIndex = currentProp.modifiers.findIndex(
            (mod) => mod.content === "sync"
          )) > -1 && checkCompatEnabled(
            "COMPILER_V_BIND_SYNC",
            currentOptions,
            currentProp.loc,
            currentProp.arg.loc.source
          )) {
            currentProp.name = "model";
            currentProp.modifiers.splice(syncIndex, 1);
          }
        }
      }
      if (currentProp.type !== 7 || currentProp.name !== "pre") {
        currentOpenTag.props.push(currentProp);
      }
    }
    currentAttrValue = "";
    currentAttrStartIndex = currentAttrEndIndex = -1;
  },
  oncomment(start, end) {
    if (currentOptions.comments) {
      addNode({
        type: 3,
        content: getSlice(start, end),
        loc: getLoc(start - 4, end + 3)
      });
    }
  },
  onend() {
    const end = currentInput.length;
    if (false) {
      switch (tokenizer.state) {
        case 5:
        case 8:
          emitError(5, end);
          break;
        case 3:
        case 4:
          emitError(
            25,
            tokenizer.sectionStart
          );
          break;
        case 28:
          if (tokenizer.currentSequence === Sequences.CdataEnd) {
            emitError(6, end);
          } else {
            emitError(7, end);
          }
          break;
        case 6:
        case 7:
        case 9:
        case 11:
        case 12:
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 18:
        case 19:
        // "
        case 20:
        // '
        case 21:
          emitError(9, end);
          break;
      }
    }
    for (let index = 0; index < stack.length; index++) {
      onCloseTag(stack[index], end - 1);
      emitError(24, stack[index].loc.start.offset);
    }
  },
  oncdata(start, end) {
    if (stack[0].ns !== 0) {
      onText(getSlice(start, end), start, end);
    } else {
      emitError(1, start - 9);
    }
  },
  onprocessinginstruction(start) {
    if ((stack[0] ? stack[0].ns : currentOptions.ns) === 0) {
      emitError(
        21,
        start - 1
      );
    }
  }
});
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
const stripParensRE = /^\(|\)$/g;
function parseForExpression(input) {
  const loc = input.loc;
  const exp = input.content;
  const inMatch = exp.match(forAliasRE);
  if (!inMatch) return;
  const [, LHS, RHS] = inMatch;
  const createAliasExpression = (content, offset, asParam = false) => {
    const start = loc.start.offset + offset;
    const end = start + content.length;
    return createExp(
      content,
      false,
      getLoc(start, end),
      0,
      asParam ? 1 : 0
      /* Normal */
    );
  };
  const result = {
    source: createAliasExpression(RHS.trim(), exp.indexOf(RHS, LHS.length)),
    value: void 0,
    key: void 0,
    index: void 0,
    finalized: false
  };
  let valueContent = LHS.trim().replace(stripParensRE, "").trim();
  const trimmedOffset = LHS.indexOf(valueContent);
  const iteratorMatch = valueContent.match(forIteratorRE);
  if (iteratorMatch) {
    valueContent = valueContent.replace(forIteratorRE, "").trim();
    const keyContent = iteratorMatch[1].trim();
    let keyOffset;
    if (keyContent) {
      keyOffset = exp.indexOf(keyContent, trimmedOffset + valueContent.length);
      result.key = createAliasExpression(keyContent, keyOffset, true);
    }
    if (iteratorMatch[2]) {
      const indexContent = iteratorMatch[2].trim();
      if (indexContent) {
        result.index = createAliasExpression(
          indexContent,
          exp.indexOf(
            indexContent,
            result.key ? keyOffset + keyContent.length : trimmedOffset + valueContent.length
          ),
          true
        );
      }
    }
  }
  if (valueContent) {
    result.value = createAliasExpression(valueContent, trimmedOffset, true);
  }
  return result;
}
function getSlice(start, end) {
  return currentInput.slice(start, end);
}
function endOpenTag(end) {
  if (tokenizer.inSFCRoot) {
    currentOpenTag.innerLoc = getLoc(end + 1, end + 1);
  }
  addNode(currentOpenTag);
  const { tag, ns } = currentOpenTag;
  if (ns === 0 && currentOptions.isPreTag(tag)) {
    inPre++;
  }
  if (currentOptions.isVoidTag(tag)) {
    onCloseTag(currentOpenTag, end);
  } else {
    stack.unshift(currentOpenTag);
    if (ns === 1 || ns === 2) {
      tokenizer.inXML = true;
    }
  }
  currentOpenTag = null;
}
function onText(content, start, end) {
  {
    const tag = stack[0] && stack[0].tag;
    if (tag !== "script" && tag !== "style" && content.includes("&")) {
      content = currentOptions.decodeEntities(content, false);
    }
  }
  const parent = stack[0] || currentRoot;
  const lastNode = parent.children[parent.children.length - 1];
  if (lastNode && lastNode.type === 2) {
    lastNode.content += content;
    setLocEnd(lastNode.loc, end);
  } else {
    parent.children.push({
      type: 2,
      content,
      loc: getLoc(start, end)
    });
  }
}
function onCloseTag(el, end, isImplied = false) {
  if (isImplied) {
    setLocEnd(el.loc, backTrack(end, 60));
  } else {
    setLocEnd(el.loc, lookAhead(end, 62) + 1);
  }
  if (tokenizer.inSFCRoot) {
    if (el.children.length) {
      el.innerLoc.end = extend({}, el.children[el.children.length - 1].loc.end);
    } else {
      el.innerLoc.end = extend({}, el.innerLoc.start);
    }
    el.innerLoc.source = getSlice(
      el.innerLoc.start.offset,
      el.innerLoc.end.offset
    );
  }
  const { tag, ns, children } = el;
  if (!inVPre) {
    if (tag === "slot") {
      el.tagType = 2;
    } else if (isFragmentTemplate(el)) {
      el.tagType = 3;
    } else if (isComponent(el)) {
      el.tagType = 1;
    }
  }
  if (!tokenizer.inRCDATA) {
    el.children = condenseWhitespace(children);
  }
  if (ns === 0 && currentOptions.isIgnoreNewlineTag(tag)) {
    const first = children[0];
    if (first && first.type === 2) {
      first.content = first.content.replace(/^\r?\n/, "");
    }
  }
  if (ns === 0 && currentOptions.isPreTag(tag)) {
    inPre--;
  }
  if (currentVPreBoundary === el) {
    inVPre = tokenizer.inVPre = false;
    currentVPreBoundary = null;
  }
  if (tokenizer.inXML && (stack[0] ? stack[0].ns : currentOptions.ns) === 0) {
    tokenizer.inXML = false;
  }
  {
    const props = el.props;
    if (false) {
      let hasIf = false;
      let hasFor = false;
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        if (p.type === 7) {
          if (p.name === "if") {
            hasIf = true;
          } else if (p.name === "for") {
            hasFor = true;
          }
        }
        if (hasIf && hasFor) {
          warnDeprecation(
            "COMPILER_V_IF_V_FOR_PRECEDENCE",
            currentOptions,
            el.loc
          );
          break;
        }
      }
    }
    if (!tokenizer.inSFCRoot && isCompatEnabled(
      "COMPILER_NATIVE_TEMPLATE",
      currentOptions
    ) && el.tag === "template" && !isFragmentTemplate(el)) {
      const parent = stack[0] || currentRoot;
      const index = parent.children.indexOf(el);
      parent.children.splice(index, 1, ...el.children);
    }
    const inlineTemplateProp = props.find(
      (p) => p.type === 6 && p.name === "inline-template"
    );
    if (inlineTemplateProp && checkCompatEnabled(
      "COMPILER_INLINE_TEMPLATE",
      currentOptions,
      inlineTemplateProp.loc
    ) && el.children.length) {
      inlineTemplateProp.value = {
        type: 2,
        content: getSlice(
          el.children[0].loc.start.offset,
          el.children[el.children.length - 1].loc.end.offset
        ),
        loc: inlineTemplateProp.loc
      };
    }
  }
}
function lookAhead(index, c) {
  let i = index;
  while (currentInput.charCodeAt(i) !== c && i < currentInput.length - 1) i++;
  return i;
}
function backTrack(index, c) {
  let i = index;
  while (currentInput.charCodeAt(i) !== c && i >= 0) i--;
  return i;
}
const specialTemplateDir = /* @__PURE__ */ new Set(["if", "else", "else-if", "for", "slot"]);
function isFragmentTemplate({ tag, props }) {
  if (tag === "template") {
    for (let i = 0; i < props.length; i++) {
      if (props[i].type === 7 && specialTemplateDir.has(props[i].name)) {
        return true;
      }
    }
  }
  return false;
}
function isComponent({ tag, props }) {
  if (currentOptions.isCustomElement(tag)) {
    return false;
  }
  if (tag === "component" || isUpperCase(tag.charCodeAt(0)) || isCoreComponent(tag) || currentOptions.isBuiltInComponent && currentOptions.isBuiltInComponent(tag) || currentOptions.isNativeTag && !currentOptions.isNativeTag(tag)) {
    return true;
  }
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    if (p.type === 6) {
      if (p.name === "is" && p.value) {
        if (p.value.content.startsWith("vue:")) {
          return true;
        } else if (checkCompatEnabled(
          "COMPILER_IS_ON_ELEMENT",
          currentOptions,
          p.loc
        )) {
          return true;
        }
      }
    } else if (
      // :is on plain element - only treat as component in compat mode
      p.name === "bind" && isStaticArgOf(p.arg, "is") && checkCompatEnabled(
        "COMPILER_IS_ON_ELEMENT",
        currentOptions,
        p.loc
      )
    ) {
      return true;
    }
  }
  return false;
}
function isUpperCase(c) {
  return c > 64 && c < 91;
}
const windowsNewlineRE = /\r\n/g;
function condenseWhitespace(nodes) {
  const shouldCondense = currentOptions.whitespace !== "preserve";
  let removedWhitespace = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === 2) {
      if (!inPre) {
        if (isAllWhitespace(node.content)) {
          const prev = nodes[i - 1] && nodes[i - 1].type;
          const next = nodes[i + 1] && nodes[i + 1].type;
          if (!prev || !next || shouldCondense && (prev === 3 && (next === 3 || next === 1) || prev === 1 && (next === 3 || next === 1 && hasNewlineChar(node.content)))) {
            removedWhitespace = true;
            nodes[i] = null;
          } else {
            node.content = " ";
          }
        } else if (shouldCondense) {
          node.content = condense(node.content);
        }
      } else {
        node.content = node.content.replace(windowsNewlineRE, "\n");
      }
    }
  }
  return removedWhitespace ? nodes.filter(Boolean) : nodes;
}
function hasNewlineChar(str) {
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c === 10 || c === 13) {
      return true;
    }
  }
  return false;
}
function condense(str) {
  let ret = "";
  let prevCharIsWhitespace = false;
  for (let i = 0; i < str.length; i++) {
    if (isWhitespace(str.charCodeAt(i))) {
      if (!prevCharIsWhitespace) {
        ret += " ";
        prevCharIsWhitespace = true;
      }
    } else {
      ret += str[i];
      prevCharIsWhitespace = false;
    }
  }
  return ret;
}
function addNode(node) {
  (stack[0] || currentRoot).children.push(node);
}
function getLoc(start, end) {
  return {
    start: tokenizer.getPos(start),
    // @ts-expect-error allow late attachment
    end: end == null ? end : tokenizer.getPos(end),
    // @ts-expect-error allow late attachment
    source: end == null ? end : getSlice(start, end)
  };
}
function cloneLoc(loc) {
  return getLoc(loc.start.offset, loc.end.offset);
}
function setLocEnd(loc, end) {
  loc.end = tokenizer.getPos(end);
  loc.source = getSlice(loc.start.offset, end);
}
function dirToAttr(dir) {
  const attr = {
    type: 6,
    name: dir.rawName,
    nameLoc: getLoc(
      dir.loc.start.offset,
      dir.loc.start.offset + dir.rawName.length
    ),
    value: void 0,
    loc: dir.loc
  };
  if (dir.exp) {
    const loc = dir.exp.loc;
    if (loc.end.offset < dir.loc.end.offset) {
      loc.start.offset--;
      loc.start.column--;
      loc.end.offset++;
      loc.end.column++;
    }
    attr.value = {
      type: 2,
      content: dir.exp.content,
      loc
    };
  }
  return attr;
}
function createExp(content, isStatic = false, loc, constType = 0, parseMode = 0) {
  const exp = createSimpleExpression(content, isStatic, loc, constType);
  return exp;
}
function emitError(code, index, message) {
  currentOptions.onError(
    createCompilerError(code, getLoc(index, index), void 0, message)
  );
}
function reset() {
  tokenizer.reset();
  currentOpenTag = null;
  currentProp = null;
  currentAttrValue = "";
  currentAttrStartIndex = -1;
  currentAttrEndIndex = -1;
  stack.length = 0;
}
function baseParse(input, options) {
  reset();
  currentInput = input;
  currentOptions = extend({}, defaultParserOptions);
  if (options) {
    let key;
    for (key in options) {
      if (options[key] != null) {
        currentOptions[key] = options[key];
      }
    }
  }
  if (false) {
    if (!currentOptions.decodeEntities) {
      throw new Error(
        `[@vue/compiler-core] decodeEntities option is required in browser builds.`
      );
    }
  }
  tokenizer.mode = currentOptions.parseMode === "html" ? 1 : currentOptions.parseMode === "sfc" ? 2 : 0;
  tokenizer.inXML = currentOptions.ns === 1 || currentOptions.ns === 2;
  const delimiters = options && options.delimiters;
  if (delimiters) {
    tokenizer.delimiterOpen = toCharCodes(delimiters[0]);
    tokenizer.delimiterClose = toCharCodes(delimiters[1]);
  }
  const root = currentRoot = createRoot([], input);
  tokenizer.parse(currentInput);
  root.loc = getLoc(0, input.length);
  root.children = condenseWhitespace(root.children);
  currentRoot = null;
  return root;
}
function cacheStatic(root, context) {
  walk(
    root,
    void 0,
    context,
    // Root node is unfortunately non-hoistable due to potential parent
    // fallthrough attributes.
    !!getSingleElementRoot(root)
  );
}
function getSingleElementRoot(root) {
  const children = root.children.filter((x) => x.type !== 3);
  return children.length === 1 && children[0].type === 1 && !isSlotOutlet(children[0]) ? children[0] : null;
}
function walk(node, parent, context, doNotHoistNode = false, inFor = false) {
  const { children } = node;
  const toCache = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 1 && child.tagType === 0) {
      const constantType = doNotHoistNode ? 0 : getConstantType(child, context);
      if (constantType > 0) {
        if (constantType >= 2) {
          child.codegenNode.patchFlag = -1;
          toCache.push(child);
          continue;
        }
      } else {
        const codegenNode = child.codegenNode;
        if (codegenNode.type === 13) {
          const flag = codegenNode.patchFlag;
          if ((flag === void 0 || flag === 512 || flag === 1) && getGeneratedPropsConstantType(child, context) >= 2) {
            const props = getNodeProps(child);
            if (props) {
              codegenNode.props = context.hoist(props);
            }
          }
          if (codegenNode.dynamicProps) {
            codegenNode.dynamicProps = context.hoist(codegenNode.dynamicProps);
          }
        }
      }
    } else if (child.type === 12) {
      const constantType = doNotHoistNode ? 0 : getConstantType(child, context);
      if (constantType >= 2) {
        if (child.codegenNode.type === 14 && child.codegenNode.arguments.length > 0) {
          child.codegenNode.arguments.push(
            -1 + (false ? ` /* ${PatchFlagNames[-1]} */` : ``)
          );
        }
        toCache.push(child);
        continue;
      }
    }
    if (child.type === 1) {
      const isComponent2 = child.tagType === 1;
      if (isComponent2) {
        context.scopes.vSlot++;
      }
      walk(child, node, context, false, inFor);
      if (isComponent2) {
        context.scopes.vSlot--;
      }
    } else if (child.type === 11) {
      walk(child, node, context, child.children.length === 1, true);
    } else if (child.type === 9) {
      for (let i2 = 0; i2 < child.branches.length; i2++) {
        walk(
          child.branches[i2],
          node,
          context,
          child.branches[i2].children.length === 1,
          inFor
        );
      }
    }
  }
  let cachedAsArray = false;
  if (toCache.length === children.length && node.type === 1) {
    if (node.tagType === 0 && node.codegenNode && node.codegenNode.type === 13 && isArray$2(node.codegenNode.children)) {
      node.codegenNode.children = getCacheExpression(
        createArrayExpression(node.codegenNode.children)
      );
      cachedAsArray = true;
    } else if (node.tagType === 1 && node.codegenNode && node.codegenNode.type === 13 && node.codegenNode.children && !isArray$2(node.codegenNode.children) && node.codegenNode.children.type === 15) {
      const slot = getSlotNode(node.codegenNode, "default");
      if (slot) {
        slot.returns = getCacheExpression(
          createArrayExpression(slot.returns)
        );
        cachedAsArray = true;
      }
    } else if (node.tagType === 3 && parent && parent.type === 1 && parent.tagType === 1 && parent.codegenNode && parent.codegenNode.type === 13 && parent.codegenNode.children && !isArray$2(parent.codegenNode.children) && parent.codegenNode.children.type === 15) {
      const slotName = findDir(node, "slot", true);
      const slot = slotName && slotName.arg && getSlotNode(parent.codegenNode, slotName.arg);
      if (slot) {
        slot.returns = getCacheExpression(
          createArrayExpression(slot.returns)
        );
        cachedAsArray = true;
      }
    }
  }
  if (!cachedAsArray) {
    for (const child of toCache) {
      child.codegenNode = context.cache(child.codegenNode);
    }
  }
  function getCacheExpression(value) {
    const exp = context.cache(value);
    exp.needArraySpread = true;
    return exp;
  }
  function getSlotNode(node2, name) {
    if (node2.children && !isArray$2(node2.children) && node2.children.type === 15) {
      const slot = node2.children.properties.find(
        (p) => p.key === name || p.key.content === name
      );
      return slot && slot.value;
    }
  }
  if (toCache.length && context.transformHoist) {
    context.transformHoist(children, context, node);
  }
}
function getConstantType(node, context) {
  const { constantCache } = context;
  switch (node.type) {
    case 1:
      if (node.tagType !== 0) {
        return 0;
      }
      const cached = constantCache.get(node);
      if (cached !== void 0) {
        return cached;
      }
      const codegenNode = node.codegenNode;
      if (codegenNode.type !== 13) {
        return 0;
      }
      if (codegenNode.isBlock && node.tag !== "svg" && node.tag !== "foreignObject" && node.tag !== "math") {
        return 0;
      }
      if (codegenNode.patchFlag === void 0) {
        let returnType2 = 3;
        const generatedPropsType = getGeneratedPropsConstantType(node, context);
        if (generatedPropsType === 0) {
          constantCache.set(node, 0);
          return 0;
        }
        if (generatedPropsType < returnType2) {
          returnType2 = generatedPropsType;
        }
        for (let i = 0; i < node.children.length; i++) {
          const childType = getConstantType(node.children[i], context);
          if (childType === 0) {
            constantCache.set(node, 0);
            return 0;
          }
          if (childType < returnType2) {
            returnType2 = childType;
          }
        }
        if (returnType2 > 1) {
          for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === 7 && p.name === "bind" && p.exp) {
              const expType = getConstantType(p.exp, context);
              if (expType === 0) {
                constantCache.set(node, 0);
                return 0;
              }
              if (expType < returnType2) {
                returnType2 = expType;
              }
            }
          }
        }
        if (codegenNode.isBlock) {
          for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === 7) {
              constantCache.set(node, 0);
              return 0;
            }
          }
          context.removeHelper(OPEN_BLOCK);
          context.removeHelper(
            getVNodeBlockHelper(context.inSSR, codegenNode.isComponent)
          );
          codegenNode.isBlock = false;
          context.helper(getVNodeHelper(context.inSSR, codegenNode.isComponent));
        }
        constantCache.set(node, returnType2);
        return returnType2;
      } else {
        constantCache.set(node, 0);
        return 0;
      }
    case 2:
    case 3:
      return 3;
    case 9:
    case 11:
    case 10:
      return 0;
    case 5:
    case 12:
      return getConstantType(node.content, context);
    case 4:
      return node.constType;
    case 8:
      let returnType = 3;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isString$1(child) || isSymbol$1(child)) {
          continue;
        }
        const childType = getConstantType(child, context);
        if (childType === 0) {
          return 0;
        } else if (childType < returnType) {
          returnType = childType;
        }
      }
      return returnType;
    case 20:
      return 2;
    default:
      if (false) ;
      return 0;
  }
}
const allowHoistedHelperSet = /* @__PURE__ */ new Set([
  NORMALIZE_CLASS,
  NORMALIZE_STYLE,
  NORMALIZE_PROPS,
  GUARD_REACTIVE_PROPS
]);
function getConstantTypeOfHelperCall(value, context) {
  if (value.type === 14 && !isString$1(value.callee) && allowHoistedHelperSet.has(value.callee)) {
    const arg = value.arguments[0];
    if (arg.type === 4) {
      return getConstantType(arg, context);
    } else if (arg.type === 14) {
      return getConstantTypeOfHelperCall(arg, context);
    }
  }
  return 0;
}
function getGeneratedPropsConstantType(node, context) {
  let returnType = 3;
  const props = getNodeProps(node);
  if (props && props.type === 15) {
    const { properties } = props;
    for (let i = 0; i < properties.length; i++) {
      const { key, value } = properties[i];
      const keyType = getConstantType(key, context);
      if (keyType === 0) {
        return keyType;
      }
      if (keyType < returnType) {
        returnType = keyType;
      }
      let valueType;
      if (value.type === 4) {
        valueType = getConstantType(value, context);
      } else if (value.type === 14) {
        valueType = getConstantTypeOfHelperCall(value, context);
      } else {
        valueType = 0;
      }
      if (valueType === 0) {
        return valueType;
      }
      if (valueType < returnType) {
        returnType = valueType;
      }
    }
  }
  return returnType;
}
function getNodeProps(node) {
  const codegenNode = node.codegenNode;
  if (codegenNode.type === 13) {
    return codegenNode.props;
  }
}
function createTransformContext(root, {
  filename = "",
  prefixIdentifiers = false,
  hoistStatic = false,
  hmr = false,
  cacheHandlers = false,
  nodeTransforms = [],
  directiveTransforms = {},
  transformHoist = null,
  isBuiltInComponent = NOOP$1,
  isCustomElement = NOOP$1,
  expressionPlugins = [],
  scopeId = null,
  slotted = true,
  ssr = false,
  inSSR = false,
  ssrCssVars = ``,
  bindingMetadata = EMPTY_OBJ,
  inline = false,
  isTS = false,
  onError = defaultOnError,
  onWarn = defaultOnWarn,
  compatConfig
}) {
  const nameMatch = filename.replace(/\?.*$/, "").match(/([^/\\]+)\.\w+$/);
  const context = {
    // options
    filename,
    selfName: nameMatch && capitalize(camelize$1(nameMatch[1])),
    prefixIdentifiers,
    hoistStatic,
    hmr,
    cacheHandlers,
    nodeTransforms,
    directiveTransforms,
    transformHoist,
    isBuiltInComponent,
    isCustomElement,
    expressionPlugins,
    scopeId,
    slotted,
    ssr,
    inSSR,
    ssrCssVars,
    bindingMetadata,
    inline,
    isTS,
    onError,
    onWarn,
    compatConfig,
    // state
    root,
    helpers: /* @__PURE__ */ new Map(),
    components: /* @__PURE__ */ new Set(),
    directives: /* @__PURE__ */ new Set(),
    hoists: [],
    imports: [],
    cached: [],
    constantCache: /* @__PURE__ */ new WeakMap(),
    temps: 0,
    identifiers: /* @__PURE__ */ Object.create(null),
    scopes: {
      vFor: 0,
      vSlot: 0,
      vPre: 0,
      vOnce: 0
    },
    parent: null,
    grandParent: null,
    currentNode: root,
    childIndex: 0,
    inVOnce: false,
    // methods
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        const currentCount = count - 1;
        if (!currentCount) {
          context.helpers.delete(name);
        } else {
          context.helpers.set(name, currentCount);
        }
      }
    },
    helperString(name) {
      return `_${helperNameMap[context.helper(name)]}`;
    },
    replaceNode(node) {
      if (false) {
        if (!context.currentNode) {
          throw new Error(`Node being replaced is already removed.`);
        }
        if (!context.parent) {
          throw new Error(`Cannot replace root node.`);
        }
      }
      context.parent.children[context.childIndex] = context.currentNode = node;
    },
    removeNode(node) {
      if (false) {
        throw new Error(`Cannot remove root node.`);
      }
      const list = context.parent.children;
      const removalIndex = node ? list.indexOf(node) : context.currentNode ? context.childIndex : -1;
      if (false) {
        throw new Error(`node being removed is not a child of current parent`);
      }
      if (!node || node === context.currentNode) {
        context.currentNode = null;
        context.onNodeRemoved();
      } else {
        if (context.childIndex > removalIndex) {
          context.childIndex--;
          context.onNodeRemoved();
        }
      }
      context.parent.children.splice(removalIndex, 1);
    },
    onNodeRemoved: NOOP$1,
    addIdentifiers(exp) {
    },
    removeIdentifiers(exp) {
    },
    hoist(exp) {
      if (isString$1(exp)) exp = createSimpleExpression(exp);
      context.hoists.push(exp);
      const identifier = createSimpleExpression(
        `_hoisted_${context.hoists.length}`,
        false,
        exp.loc,
        2
      );
      identifier.hoisted = exp;
      return identifier;
    },
    cache(exp, isVNode = false, inVOnce = false) {
      const cacheExp = createCacheExpression(
        context.cached.length,
        exp,
        isVNode,
        inVOnce
      );
      context.cached.push(cacheExp);
      return cacheExp;
    }
  };
  {
    context.filters = /* @__PURE__ */ new Set();
  }
  return context;
}
function transform(root, options) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  if (options.hoistStatic) {
    cacheStatic(root, context);
  }
  if (!options.ssr) {
    createRootCodegen(root, context);
  }
  root.helpers = /* @__PURE__ */ new Set([...context.helpers.keys()]);
  root.components = [...context.components];
  root.directives = [...context.directives];
  root.imports = context.imports;
  root.hoists = context.hoists;
  root.temps = context.temps;
  root.cached = context.cached;
  root.transformed = true;
  {
    root.filters = [...context.filters];
  }
}
function createRootCodegen(root, context) {
  const { helper } = context;
  const { children } = root;
  if (children.length === 1) {
    const singleElementRootChild = getSingleElementRoot(root);
    if (singleElementRootChild && singleElementRootChild.codegenNode) {
      const codegenNode = singleElementRootChild.codegenNode;
      if (codegenNode.type === 13) {
        convertToBlock(codegenNode, context);
      }
      root.codegenNode = codegenNode;
    } else {
      root.codegenNode = children[0];
    }
  } else if (children.length > 1) {
    let patchFlag = 64;
    if (false) {
      patchFlag |= 2048;
    }
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      void 0,
      root.children,
      patchFlag,
      void 0,
      void 0,
      true,
      void 0,
      false
    );
  } else ;
}
function traverseChildren(parent, context) {
  let i = 0;
  const nodeRemoved = () => {
    i--;
  };
  for (; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (isString$1(child)) continue;
    context.grandParent = context.parent;
    context.parent = parent;
    context.childIndex = i;
    context.onNodeRemoved = nodeRemoved;
    traverseNode(child, context);
  }
}
function traverseNode(node, context) {
  context.currentNode = node;
  const { nodeTransforms } = context;
  const exitFns = [];
  for (let i2 = 0; i2 < nodeTransforms.length; i2++) {
    const onExit = nodeTransforms[i2](node, context);
    if (onExit) {
      if (isArray$2(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }
    if (!context.currentNode) {
      return;
    } else {
      node = context.currentNode;
    }
  }
  switch (node.type) {
    case 3:
      if (!context.ssr) {
        context.helper(CREATE_COMMENT);
      }
      break;
    case 5:
      if (!context.ssr) {
        context.helper(TO_DISPLAY_STRING);
      }
      break;
    // for container types, further traverse downwards
    case 9:
      for (let i2 = 0; i2 < node.branches.length; i2++) {
        traverseNode(node.branches[i2], context);
      }
      break;
    case 10:
    case 11:
    case 1:
    case 0:
      traverseChildren(node, context);
      break;
  }
  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
function createStructuralDirectiveTransform(name, fn) {
  const matches = isString$1(name) ? (n) => n === name : (n) => name.test(n);
  return (node, context) => {
    if (node.type === 1) {
      const { props } = node;
      if (node.tagType === 3 && props.some(isVSlot)) {
        return;
      }
      const exitFns = [];
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        if (prop.type === 7 && matches(prop.name)) {
          props.splice(i, 1);
          i--;
          const onExit = fn(node, prop, context);
          if (onExit) exitFns.push(onExit);
        }
      }
      return exitFns;
    }
  };
}
const PURE_ANNOTATION = `/*@__PURE__*/`;
const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;
function createCodegenContext(ast, {
  mode = "function",
  prefixIdentifiers = mode === "module",
  sourceMap = false,
  filename = `template.vue.html`,
  scopeId = null,
  optimizeImports = false,
  runtimeGlobalName = `Vue`,
  runtimeModuleName = `vue`,
  ssrRuntimeModuleName = "vue/server-renderer",
  ssr = false,
  isTS = false,
  inSSR = false
}) {
  const context = {
    mode,
    prefixIdentifiers,
    sourceMap,
    filename,
    scopeId,
    optimizeImports,
    runtimeGlobalName,
    runtimeModuleName,
    ssrRuntimeModuleName,
    ssr,
    isTS,
    inSSR,
    source: ast.source,
    code: ``,
    column: 1,
    line: 1,
    offset: 0,
    indentLevel: 0,
    pure: false,
    map: void 0,
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    push(code, newlineIndex = -2, node) {
      context.code += code;
    },
    indent() {
      newline(++context.indentLevel);
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel;
      } else {
        newline(--context.indentLevel);
      }
    },
    newline() {
      newline(context.indentLevel);
    }
  };
  function newline(n) {
    context.push(
      "\n" + `  `.repeat(n),
      0
      /* Start */
    );
  }
  return context;
}
function generate(ast, options = {}) {
  const context = createCodegenContext(ast, options);
  if (options.onContextCreated) options.onContextCreated(context);
  const {
    mode,
    push,
    prefixIdentifiers,
    indent,
    deindent,
    newline,
    scopeId,
    ssr
  } = context;
  const helpers = Array.from(ast.helpers);
  const hasHelpers = helpers.length > 0;
  const useWithBlock = !prefixIdentifiers && mode !== "module";
  const preambleContext = context;
  {
    genFunctionPreamble(ast, preambleContext);
  }
  const functionName = ssr ? `ssrRender` : `render`;
  const args = ssr ? ["_ctx", "_push", "_parent", "_attrs"] : ["_ctx", "_cache"];
  const signature = args.join(", ");
  {
    push(`function ${functionName}(${signature}) {`);
  }
  indent();
  if (useWithBlock) {
    push(`with (_ctx) {`);
    indent();
    if (hasHelpers) {
      push(
        `const { ${helpers.map(aliasHelper).join(", ")} } = _Vue
`,
        -1
        /* End */
      );
      newline();
    }
  }
  if (ast.components.length) {
    genAssets(ast.components, "component", context);
    if (ast.directives.length || ast.temps > 0) {
      newline();
    }
  }
  if (ast.directives.length) {
    genAssets(ast.directives, "directive", context);
    if (ast.temps > 0) {
      newline();
    }
  }
  if (ast.filters && ast.filters.length) {
    newline();
    genAssets(ast.filters, "filter", context);
    newline();
  }
  if (ast.temps > 0) {
    push(`let `);
    for (let i = 0; i < ast.temps; i++) {
      push(`${i > 0 ? `, ` : ``}_temp${i}`);
    }
  }
  if (ast.components.length || ast.directives.length || ast.temps) {
    push(
      `
`,
      0
      /* Start */
    );
    newline();
  }
  if (!ssr) {
    push(`return `);
  }
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    push(`null`);
  }
  if (useWithBlock) {
    deindent();
    push(`}`);
  }
  deindent();
  push(`}`);
  return {
    ast,
    code: context.code,
    preamble: ``,
    map: context.map ? context.map.toJSON() : void 0
  };
}
function genFunctionPreamble(ast, context) {
  const {
    ssr,
    prefixIdentifiers,
    push,
    newline,
    runtimeModuleName,
    runtimeGlobalName,
    ssrRuntimeModuleName
  } = context;
  const VueBinding = runtimeGlobalName;
  const helpers = Array.from(ast.helpers);
  if (helpers.length > 0) {
    {
      push(
        `const _Vue = ${VueBinding}
`,
        -1
        /* End */
      );
      if (ast.hoists.length) {
        const staticHelpers = [
          CREATE_VNODE,
          CREATE_ELEMENT_VNODE,
          CREATE_COMMENT,
          CREATE_TEXT,
          CREATE_STATIC
        ].filter((helper) => helpers.includes(helper)).map(aliasHelper).join(", ");
        push(
          `const { ${staticHelpers} } = _Vue
`,
          -1
          /* End */
        );
      }
    }
  }
  genHoists(ast.hoists, context);
  newline();
  push(`return `);
}
function genAssets(assets, type, { helper, push, newline, isTS }) {
  const resolver = helper(
    type === "filter" ? RESOLVE_FILTER : type === "component" ? RESOLVE_COMPONENT : RESOLVE_DIRECTIVE
  );
  for (let i = 0; i < assets.length; i++) {
    let id = assets[i];
    const maybeSelfReference = id.endsWith("__self");
    if (maybeSelfReference) {
      id = id.slice(0, -6);
    }
    push(
      `const ${toValidAssetId(id, type)} = ${resolver}(${JSON.stringify(id)}${maybeSelfReference ? `, true` : ``})${isTS ? `!` : ``}`
    );
    if (i < assets.length - 1) {
      newline();
    }
  }
}
function genHoists(hoists, context) {
  if (!hoists.length) {
    return;
  }
  context.pure = true;
  const { push, newline } = context;
  newline();
  for (let i = 0; i < hoists.length; i++) {
    const exp = hoists[i];
    if (exp) {
      push(`const _hoisted_${i + 1} = `);
      genNode(exp, context);
      newline();
    }
  }
  context.pure = false;
}
function isText(n) {
  return isString$1(n) || n.type === 4 || n.type === 2 || n.type === 5 || n.type === 8;
}
function genNodeListAsArray(nodes, context) {
  const multilines = nodes.length > 3 || false;
  context.push(`[`);
  multilines && context.indent();
  genNodeList(nodes, context, multilines);
  multilines && context.deindent();
  context.push(`]`);
}
function genNodeList(nodes, context, multilines = false, comma = true) {
  const { push, newline } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString$1(node)) {
      push(
        node,
        -3
        /* Unknown */
      );
    } else if (isArray$2(node)) {
      genNodeListAsArray(node, context);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      if (multilines) {
        comma && push(",");
        newline();
      } else {
        comma && push(", ");
      }
    }
  }
}
function genNode(node, context) {
  if (isString$1(node)) {
    context.push(
      node,
      -3
      /* Unknown */
    );
    return;
  }
  if (isSymbol$1(node)) {
    context.push(context.helper(node));
    return;
  }
  switch (node.type) {
    case 1:
    case 9:
    case 11:
      genNode(node.codegenNode, context);
      break;
    case 2:
      genText(node, context);
      break;
    case 4:
      genExpression(node, context);
      break;
    case 5:
      genInterpolation(node, context);
      break;
    case 12:
      genNode(node.codegenNode, context);
      break;
    case 8:
      genCompoundExpression(node, context);
      break;
    case 3:
      genComment(node, context);
      break;
    case 13:
      genVNodeCall(node, context);
      break;
    case 14:
      genCallExpression(node, context);
      break;
    case 15:
      genObjectExpression(node, context);
      break;
    case 17:
      genArrayExpression(node, context);
      break;
    case 18:
      genFunctionExpression(node, context);
      break;
    case 19:
      genConditionalExpression(node, context);
      break;
    case 20:
      genCacheExpression(node, context);
      break;
    case 21:
      genNodeList(node.body, context, true, false);
      break;
    // SSR only types
    case 22:
      break;
    case 23:
      break;
    case 24:
      break;
    case 25:
      break;
    case 26:
      break;
    /* v8 ignore start */
    case 10:
      break;
    default:
      if (false) {
        assert(false, `unhandled codegen node type: ${node.type}`);
        const exhaustiveCheck = node;
        return exhaustiveCheck;
      }
  }
}
function genText(node, context) {
  context.push(JSON.stringify(node.content), -3, node);
}
function genExpression(node, context) {
  const { content, isStatic } = node;
  context.push(
    isStatic ? JSON.stringify(content) : content,
    -3,
    node
  );
}
function genInterpolation(node, context) {
  const { push, helper, pure } = context;
  if (pure) push(PURE_ANNOTATION);
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}
function genCompoundExpression(node, context) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (isString$1(child)) {
      context.push(
        child,
        -3
        /* Unknown */
      );
    } else {
      genNode(child, context);
    }
  }
}
function genExpressionAsPropertyKey(node, context) {
  const { push } = context;
  if (node.type === 8) {
    push(`[`);
    genCompoundExpression(node, context);
    push(`]`);
  } else if (node.isStatic) {
    const text = isSimpleIdentifier(node.content) ? node.content : JSON.stringify(node.content);
    push(text, -2, node);
  } else {
    push(`[${node.content}]`, -3, node);
  }
}
function genComment(node, context) {
  const { push, helper, pure } = context;
  if (pure) {
    push(PURE_ANNOTATION);
  }
  push(
    `${helper(CREATE_COMMENT)}(${JSON.stringify(node.content)})`,
    -3,
    node
  );
}
function genVNodeCall(node, context) {
  const { push, helper, pure } = context;
  const {
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent: isComponent2
  } = node;
  let patchFlagString;
  if (patchFlag) {
    if (false) {
      if (patchFlag < 0) {
        patchFlagString = patchFlag + ` /* ${PatchFlagNames[patchFlag]} */`;
      } else {
        const flagNames = Object.keys(PatchFlagNames).map(Number).filter((n) => n > 0 && patchFlag & n).map((n) => PatchFlagNames[n]).join(`, `);
        patchFlagString = patchFlag + ` /* ${flagNames} */`;
      }
    } else {
      patchFlagString = String(patchFlag);
    }
  }
  if (directives) {
    push(helper(WITH_DIRECTIVES) + `(`);
  }
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? `true` : ``}), `);
  }
  if (pure) {
    push(PURE_ANNOTATION);
  }
  const callHelper = isBlock ? getVNodeBlockHelper(context.inSSR, isComponent2) : getVNodeHelper(context.inSSR, isComponent2);
  push(helper(callHelper) + `(`, -2, node);
  genNodeList(
    genNullableArgs([tag, props, children, patchFlagString, dynamicProps]),
    context
  );
  push(`)`);
  if (isBlock) {
    push(`)`);
  }
  if (directives) {
    push(`, `);
    genNode(directives, context);
    push(`)`);
  }
}
function genNullableArgs(args) {
  let i = args.length;
  while (i--) {
    if (args[i] != null) break;
  }
  return args.slice(0, i + 1).map((arg) => arg || `null`);
}
function genCallExpression(node, context) {
  const { push, helper, pure } = context;
  const callee = isString$1(node.callee) ? node.callee : helper(node.callee);
  if (pure) {
    push(PURE_ANNOTATION);
  }
  push(callee + `(`, -2, node);
  genNodeList(node.arguments, context);
  push(`)`);
}
function genObjectExpression(node, context) {
  const { push, indent, deindent, newline } = context;
  const { properties } = node;
  if (!properties.length) {
    push(`{}`, -2, node);
    return;
  }
  const multilines = properties.length > 1 || false;
  push(multilines ? `{` : `{ `);
  multilines && indent();
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i];
    genExpressionAsPropertyKey(key, context);
    push(`: `);
    genNode(value, context);
    if (i < properties.length - 1) {
      push(`,`);
      newline();
    }
  }
  multilines && deindent();
  push(multilines ? `}` : ` }`);
}
function genArrayExpression(node, context) {
  genNodeListAsArray(node.elements, context);
}
function genFunctionExpression(node, context) {
  const { push, indent, deindent } = context;
  const { params, returns, body, newline, isSlot } = node;
  if (isSlot) {
    push(`_${helperNameMap[WITH_CTX]}(`);
  }
  push(`(`, -2, node);
  if (isArray$2(params)) {
    genNodeList(params, context);
  } else if (params) {
    genNode(params, context);
  }
  push(`) => `);
  if (newline || body) {
    push(`{`);
    indent();
  }
  if (returns) {
    if (newline) {
      push(`return `);
    }
    if (isArray$2(returns)) {
      genNodeListAsArray(returns, context);
    } else {
      genNode(returns, context);
    }
  } else if (body) {
    genNode(body, context);
  }
  if (newline || body) {
    deindent();
    push(`}`);
  }
  if (isSlot) {
    if (node.isNonScopedSlot) {
      push(`, undefined, true`);
    }
    push(`)`);
  }
}
function genConditionalExpression(node, context) {
  const { test, consequent, alternate, newline: needNewline } = node;
  const { push, indent, deindent, newline } = context;
  if (test.type === 4) {
    const needsParens = !isSimpleIdentifier(test.content);
    needsParens && push(`(`);
    genExpression(test, context);
    needsParens && push(`)`);
  } else {
    push(`(`);
    genNode(test, context);
    push(`)`);
  }
  needNewline && indent();
  context.indentLevel++;
  needNewline || push(` `);
  push(`? `);
  genNode(consequent, context);
  context.indentLevel--;
  needNewline && newline();
  needNewline || push(` `);
  push(`: `);
  const isNested = alternate.type === 19;
  if (!isNested) {
    context.indentLevel++;
  }
  genNode(alternate, context);
  if (!isNested) {
    context.indentLevel--;
  }
  needNewline && deindent(
    true
    /* without newline */
  );
}
function genCacheExpression(node, context) {
  const { push, helper, indent, deindent, newline } = context;
  const { needPauseTracking, needArraySpread } = node;
  if (needArraySpread) {
    push(`[...(`);
  }
  push(`_cache[${node.index}] || (`);
  if (needPauseTracking) {
    indent();
    push(`${helper(SET_BLOCK_TRACKING)}(-1`);
    if (node.inVOnce) push(`, true`);
    push(`),`);
    newline();
    push(`(`);
  }
  push(`_cache[${node.index}] = `);
  genNode(node.value, context);
  if (needPauseTracking) {
    push(`).cacheIndex = ${node.index},`);
    newline();
    push(`${helper(SET_BLOCK_TRACKING)}(1),`);
    newline();
    push(`_cache[${node.index}]`);
    deindent();
  }
  push(`)`);
  if (needArraySpread) {
    push(`)]`);
  }
}
const prohibitedKeywordRE = new RegExp(
  "\\b" + "arguments,await,break,case,catch,class,const,continue,debugger,default,delete,do,else,export,extends,finally,for,function,if,import,let,new,return,super,switch,throw,try,var,void,while,with,yield".split(",").join("\\b|\\b") + "\\b"
);
const stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;
function validateBrowserExpression(node, context, asParams = false, asRawStatements = false) {
  const exp = node.content;
  if (!exp.trim()) {
    return;
  }
  try {
    new Function(
      asRawStatements ? ` ${exp} ` : `return ${asParams ? `(${exp}) => {}` : `(${exp})`}`
    );
  } catch (e) {
    let message = e.message;
    const keywordMatch = exp.replace(stripStringRE, "").match(prohibitedKeywordRE);
    if (keywordMatch) {
      message = `avoid using JavaScript keyword as property name: "${keywordMatch[0]}"`;
    }
    context.onError(
      createCompilerError(
        46,
        node.loc,
        void 0,
        message
      )
    );
  }
}
const transformExpression = (node, context) => {
  if (node.type === 5) {
    node.content = processExpression(
      node.content,
      context
    );
  } else if (node.type === 1) {
    const memo = findDir(node, "memo");
    for (let i = 0; i < node.props.length; i++) {
      const dir = node.props[i];
      if (dir.type === 7 && dir.name !== "for") {
        const exp = dir.exp;
        const arg = dir.arg;
        if (exp && exp.type === 4 && !(dir.name === "on" && arg) && // key has been processed in transformFor(vMemo + vFor)
        !(memo && arg && arg.type === 4 && arg.content === "key")) {
          dir.exp = processExpression(
            exp,
            context,
            // slot args must be processed as function params
            dir.name === "slot"
          );
        }
        if (arg && arg.type === 4 && !arg.isStatic) {
          dir.arg = processExpression(arg, context);
        }
      }
    }
  }
};
function processExpression(node, context, asParams = false, asRawStatements = false, localVars = Object.create(context.identifiers)) {
  {
    if (false) {
      validateBrowserExpression(node, context, asParams, asRawStatements);
    }
    return node;
  }
}
function stringifyExpression(exp) {
  if (isString$1(exp)) {
    return exp;
  } else if (exp.type === 4) {
    return exp.content;
  } else {
    return exp.children.map(stringifyExpression).join("");
  }
}
const transformIf = createStructuralDirectiveTransform(
  /^(?:if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      const siblings = context.parent.children;
      let i = siblings.indexOf(ifNode);
      let key = 0;
      while (i-- >= 0) {
        const sibling = siblings[i];
        if (sibling && sibling.type === 9) {
          key += sibling.branches.length;
        }
      }
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(
            branch,
            key,
            context
          );
        } else {
          const parentCondition = getParentCondition(ifNode.codegenNode);
          parentCondition.alternate = createCodegenNodeForBranch(
            branch,
            key + ifNode.branches.length - 1,
            context
          );
        }
      };
    });
  }
);
function processIf(node, dir, context, processCodegen) {
  if (dir.name !== "else" && (!dir.exp || !dir.exp.content.trim())) {
    const loc = dir.exp ? dir.exp.loc : node.loc;
    context.onError(
      createCompilerError(28, dir.loc)
    );
    dir.exp = createSimpleExpression(`true`, false, loc);
  }
  if (false) {
    validateBrowserExpression(dir.exp, context);
  }
  if (dir.name === "if") {
    const branch = createIfBranch(node, dir);
    const ifNode = {
      type: 9,
      loc: cloneLoc(node.loc),
      branches: [branch]
    };
    context.replaceNode(ifNode);
    if (processCodegen) {
      return processCodegen(ifNode, branch, true);
    }
  } else {
    const siblings = context.parent.children;
    const comments = [];
    let i = siblings.indexOf(node);
    while (i-- >= -1) {
      const sibling = siblings[i];
      if (sibling && isCommentOrWhitespace(sibling)) {
        context.removeNode(sibling);
        if (false) {
          comments.unshift(sibling);
        }
        continue;
      }
      if (sibling && sibling.type === 9) {
        if ((dir.name === "else-if" || dir.name === "else") && sibling.branches[sibling.branches.length - 1].condition === void 0) {
          context.onError(
            createCompilerError(30, node.loc)
          );
        }
        context.removeNode();
        const branch = createIfBranch(node, dir);
        if (false) {
          branch.children = [...comments, ...branch.children];
        }
        if (false) {
          const key = branch.userKey;
          if (key) {
            sibling.branches.forEach(({ userKey }) => {
              if (isSameKey(userKey, key)) {
                context.onError(
                  createCompilerError(
                    29,
                    branch.userKey.loc
                  )
                );
              }
            });
          }
        }
        sibling.branches.push(branch);
        const onExit = processCodegen && processCodegen(sibling, branch, false);
        traverseNode(branch, context);
        if (onExit) onExit();
        context.currentNode = null;
      } else {
        context.onError(
          createCompilerError(30, node.loc)
        );
      }
      break;
    }
  }
}
function createIfBranch(node, dir) {
  const isTemplateIf = node.tagType === 3;
  return {
    type: 10,
    loc: node.loc,
    condition: dir.name === "else" ? void 0 : dir.exp,
    children: isTemplateIf && !findDir(node, "for") ? node.children : [node],
    userKey: findProp(node, `key`),
    isTemplateIf
  };
}
function createCodegenNodeForBranch(branch, keyIndex, context) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex, context),
      // make sure to pass in asBlock: true so that the comment node call
      // closes the current block.
      createCallExpression(context.helper(CREATE_COMMENT), [
        false ? '"v-if"' : '""',
        "true"
      ])
    );
  } else {
    return createChildrenCodegenNode(branch, keyIndex, context);
  }
}
function createChildrenCodegenNode(branch, keyIndex, context) {
  const { helper } = context;
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(
      `${keyIndex}`,
      false,
      locStub,
      2
    )
  );
  const { children } = branch;
  const firstChild = children[0];
  const needFragmentWrapper = children.length !== 1 || firstChild.type !== 1;
  if (needFragmentWrapper) {
    if (children.length === 1 && firstChild.type === 11) {
      const vnodeCall = firstChild.codegenNode;
      injectProp(vnodeCall, keyProperty, context);
      return vnodeCall;
    } else {
      let patchFlag = 64;
      if (false) {
        patchFlag |= 2048;
      }
      return createVNodeCall(
        context,
        helper(FRAGMENT),
        createObjectExpression([keyProperty]),
        children,
        patchFlag,
        void 0,
        void 0,
        true,
        false,
        false,
        branch.loc
      );
    }
  } else {
    const ret = firstChild.codegenNode;
    const vnodeCall = getMemoedVNodeCall(ret);
    if (vnodeCall.type === 13) {
      convertToBlock(vnodeCall, context);
    }
    injectProp(vnodeCall, keyProperty, context);
    return ret;
  }
}
function isSameKey(a, b) {
  if (!a || a.type !== b.type) {
    return false;
  }
  if (a.type === 6) {
    if (a.value.content !== b.value.content) {
      return false;
    }
  } else {
    const exp = a.exp;
    const branchExp = b.exp;
    if (exp.type !== branchExp.type) {
      return false;
    }
    if (exp.type !== 4 || exp.isStatic !== branchExp.isStatic || exp.content !== branchExp.content) {
      return false;
    }
  }
  return true;
}
function getParentCondition(node) {
  while (true) {
    if (node.type === 19) {
      if (node.alternate.type === 19) {
        node = node.alternate;
      } else {
        return node;
      }
    } else if (node.type === 20) {
      node = node.value;
    }
  }
}
const transformFor = createStructuralDirectiveTransform(
  "for",
  (node, dir, context) => {
    const { helper, removeHelper } = context;
    return processFor(node, dir, context, (forNode) => {
      const renderExp = createCallExpression(helper(RENDER_LIST), [
        forNode.source
      ]);
      const isTemplate = isTemplateNode(node);
      const memo = findDir(node, "memo");
      const keyProp = findProp(node, `key`, false, true);
      keyProp && keyProp.type === 7;
      let keyExp = keyProp && (keyProp.type === 6 ? keyProp.value ? createSimpleExpression(keyProp.value.content, true) : void 0 : keyProp.exp);
      const keyProperty = keyProp && keyExp ? createObjectProperty(`key`, keyExp) : null;
      const isStableFragment = forNode.source.type === 4 && forNode.source.constType > 0;
      const fragmentFlag = isStableFragment ? 64 : keyProp ? 128 : 256;
      forNode.codegenNode = createVNodeCall(
        context,
        helper(FRAGMENT),
        void 0,
        renderExp,
        fragmentFlag,
        void 0,
        void 0,
        true,
        !isStableFragment,
        false,
        node.loc
      );
      return () => {
        let childBlock;
        const { children } = forNode;
        if (false) {
          node.children.some((c) => {
            if (c.type === 1) {
              const key = findProp(c, "key");
              if (key) {
                context.onError(
                  createCompilerError(
                    33,
                    key.loc
                  )
                );
                return true;
              }
            }
          });
        }
        const needFragmentWrapper = children.length !== 1 || children[0].type !== 1;
        const slotOutlet = isSlotOutlet(node) ? node : isTemplate && node.children.length === 1 && isSlotOutlet(node.children[0]) ? node.children[0] : null;
        if (slotOutlet) {
          childBlock = slotOutlet.codegenNode;
          if (isTemplate && keyProperty) {
            injectProp(childBlock, keyProperty, context);
          }
        } else if (needFragmentWrapper) {
          childBlock = createVNodeCall(
            context,
            helper(FRAGMENT),
            keyProperty ? createObjectExpression([keyProperty]) : void 0,
            node.children,
            64,
            void 0,
            void 0,
            true,
            void 0,
            false
          );
        } else {
          childBlock = children[0].codegenNode;
          if (isTemplate && keyProperty) {
            injectProp(childBlock, keyProperty, context);
          }
          if (childBlock.isBlock !== !isStableFragment) {
            if (childBlock.isBlock) {
              removeHelper(OPEN_BLOCK);
              removeHelper(
                getVNodeBlockHelper(context.inSSR, childBlock.isComponent)
              );
            } else {
              removeHelper(
                getVNodeHelper(context.inSSR, childBlock.isComponent)
              );
            }
          }
          childBlock.isBlock = !isStableFragment;
          if (childBlock.isBlock) {
            helper(OPEN_BLOCK);
            helper(getVNodeBlockHelper(context.inSSR, childBlock.isComponent));
          } else {
            helper(getVNodeHelper(context.inSSR, childBlock.isComponent));
          }
        }
        if (memo) {
          const loop = createFunctionExpression(
            createForLoopParams(forNode.parseResult, [
              createSimpleExpression(`_cached`)
            ])
          );
          loop.body = createBlockStatement([
            createCompoundExpression([`const _memo = (`, memo.exp, `)`]),
            createCompoundExpression([
              `if (_cached && _cached.el`,
              ...keyExp ? [` && _cached.key === `, keyExp] : [],
              ` && ${context.helperString(
                IS_MEMO_SAME
              )}(_cached, _memo)) return _cached`
            ]),
            createCompoundExpression([`const _item = `, childBlock]),
            createSimpleExpression(`_item.memo = _memo`),
            createSimpleExpression(`return _item`)
          ]);
          renderExp.arguments.push(
            loop,
            createSimpleExpression(`_cache`),
            createSimpleExpression(String(context.cached.length))
          );
          context.cached.push(null);
        } else {
          renderExp.arguments.push(
            createFunctionExpression(
              createForLoopParams(forNode.parseResult),
              childBlock,
              true
            )
          );
        }
      };
    });
  }
);
function processFor(node, dir, context, processCodegen) {
  if (!dir.exp) {
    context.onError(
      createCompilerError(31, dir.loc)
    );
    return;
  }
  const parseResult = dir.forParseResult;
  if (!parseResult) {
    context.onError(
      createCompilerError(32, dir.loc)
    );
    return;
  }
  finalizeForParseResult(parseResult, context);
  const { addIdentifiers, removeIdentifiers, scopes } = context;
  const { source, value, key, index } = parseResult;
  const forNode = {
    type: 11,
    loc: dir.loc,
    source,
    valueAlias: value,
    keyAlias: key,
    objectIndexAlias: index,
    parseResult,
    children: isTemplateNode(node) ? node.children : [node]
  };
  context.replaceNode(forNode);
  scopes.vFor++;
  const onExit = processCodegen && processCodegen(forNode);
  return () => {
    scopes.vFor--;
    if (onExit) onExit();
  };
}
function finalizeForParseResult(result, context) {
  if (result.finalized) return;
  if (false) {
    validateBrowserExpression(result.source, context);
    if (result.key) {
      validateBrowserExpression(
        result.key,
        context,
        true
      );
    }
    if (result.index) {
      validateBrowserExpression(
        result.index,
        context,
        true
      );
    }
    if (result.value) {
      validateBrowserExpression(
        result.value,
        context,
        true
      );
    }
  }
  result.finalized = true;
}
function createForLoopParams({ value, key, index }, memoArgs = []) {
  return createParamsList([value, key, index, ...memoArgs]);
}
function createParamsList(args) {
  let i = args.length;
  while (i--) {
    if (args[i]) break;
  }
  return args.slice(0, i + 1).map((arg, i2) => arg || createSimpleExpression(`_`.repeat(i2 + 1), false));
}
const defaultFallback = createSimpleExpression(`undefined`, false);
const trackSlotScopes = (node, context) => {
  if (node.type === 1 && (node.tagType === 1 || node.tagType === 3)) {
    const vSlot = findDir(node, "slot");
    if (vSlot) {
      vSlot.exp;
      context.scopes.vSlot++;
      return () => {
        context.scopes.vSlot--;
      };
    }
  }
};
const trackVForSlotScopes = (node, context) => {
  let vFor;
  if (isTemplateNode(node) && node.props.some(isVSlot) && (vFor = findDir(node, "for"))) {
    const result = vFor.forParseResult;
    if (result) {
      finalizeForParseResult(result, context);
      const { value, key, index } = result;
      const { addIdentifiers, removeIdentifiers } = context;
      value && addIdentifiers(value);
      key && addIdentifiers(key);
      index && addIdentifiers(index);
      return () => {
        value && removeIdentifiers(value);
        key && removeIdentifiers(key);
        index && removeIdentifiers(index);
      };
    }
  }
};
const buildClientSlotFn = (props, _vForExp, children, loc) => createFunctionExpression(
  props,
  children,
  false,
  true,
  children.length ? children[0].loc : loc
);
function buildSlots(node, context, buildSlotFn = buildClientSlotFn) {
  context.helper(WITH_CTX);
  const { children, loc } = node;
  const slotsProperties = [];
  const dynamicSlots = [];
  let hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0;
  const onComponentSlot = findDir(node, "slot", true);
  if (onComponentSlot) {
    const { arg, exp } = onComponentSlot;
    if (arg && !isStaticExp(arg)) {
      hasDynamicSlots = true;
    }
    slotsProperties.push(
      createObjectProperty(
        arg || createSimpleExpression("default", true),
        buildSlotFn(exp, void 0, children, loc)
      )
    );
  }
  let hasTemplateSlots = false;
  let hasNamedDefaultSlot = false;
  const implicitDefaultChildren = [];
  const seenSlotNames = /* @__PURE__ */ new Set();
  let conditionalBranchIndex = 0;
  for (let i = 0; i < children.length; i++) {
    const slotElement = children[i];
    let slotDir;
    if (!isTemplateNode(slotElement) || !(slotDir = findDir(slotElement, "slot", true))) {
      if (slotElement.type !== 3) {
        implicitDefaultChildren.push(slotElement);
      }
      continue;
    }
    if (onComponentSlot) {
      context.onError(
        createCompilerError(37, slotDir.loc)
      );
      break;
    }
    hasTemplateSlots = true;
    const { children: slotChildren, loc: slotLoc } = slotElement;
    const {
      arg: slotName = createSimpleExpression(`default`, true),
      exp: slotProps,
      loc: dirLoc
    } = slotDir;
    let staticSlotName;
    if (isStaticExp(slotName)) {
      staticSlotName = slotName ? slotName.content : `default`;
    } else {
      hasDynamicSlots = true;
    }
    const vFor = findDir(slotElement, "for");
    const slotFunction = buildSlotFn(slotProps, vFor, slotChildren, slotLoc);
    let vIf;
    let vElse;
    if (vIf = findDir(slotElement, "if")) {
      hasDynamicSlots = true;
      dynamicSlots.push(
        createConditionalExpression(
          vIf.exp,
          buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++),
          defaultFallback
        )
      );
    } else if (vElse = findDir(
      slotElement,
      /^else(?:-if)?$/,
      true
      /* allowEmpty */
    )) {
      let j = i;
      let prev;
      while (j--) {
        prev = children[j];
        if (!isCommentOrWhitespace(prev)) {
          break;
        }
      }
      if (prev && isTemplateNode(prev) && findDir(prev, /^(?:else-)?if$/)) {
        let conditional = dynamicSlots[dynamicSlots.length - 1];
        while (conditional.alternate.type === 19) {
          conditional = conditional.alternate;
        }
        conditional.alternate = vElse.exp ? createConditionalExpression(
          vElse.exp,
          buildDynamicSlot(
            slotName,
            slotFunction,
            conditionalBranchIndex++
          ),
          defaultFallback
        ) : buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++);
      } else {
        context.onError(
          createCompilerError(30, vElse.loc)
        );
      }
    } else if (vFor) {
      hasDynamicSlots = true;
      const parseResult = vFor.forParseResult;
      if (parseResult) {
        finalizeForParseResult(parseResult, context);
        dynamicSlots.push(
          createCallExpression(context.helper(RENDER_LIST), [
            parseResult.source,
            createFunctionExpression(
              createForLoopParams(parseResult),
              buildDynamicSlot(slotName, slotFunction),
              true
            )
          ])
        );
      } else {
        context.onError(
          createCompilerError(
            32,
            vFor.loc
          )
        );
      }
    } else {
      if (staticSlotName) {
        if (seenSlotNames.has(staticSlotName)) {
          context.onError(
            createCompilerError(
              38,
              dirLoc
            )
          );
          continue;
        }
        seenSlotNames.add(staticSlotName);
        if (staticSlotName === "default") {
          hasNamedDefaultSlot = true;
        }
      }
      slotsProperties.push(createObjectProperty(slotName, slotFunction));
    }
  }
  if (!onComponentSlot) {
    const buildDefaultSlotProperty = (props, children2) => {
      const fn = buildSlotFn(props, void 0, children2, loc);
      if (context.compatConfig) {
        fn.isNonScopedSlot = true;
      }
      return createObjectProperty(`default`, fn);
    };
    if (!hasTemplateSlots) {
      slotsProperties.push(buildDefaultSlotProperty(void 0, children));
    } else if (implicitDefaultChildren.length && // #3766
    // with whitespace: 'preserve', whitespaces between slots will end up in
    // implicitDefaultChildren. Ignore if all implicit children are whitespaces.
    !implicitDefaultChildren.every(isWhitespaceText)) {
      if (hasNamedDefaultSlot) {
        context.onError(
          createCompilerError(
            39,
            implicitDefaultChildren[0].loc
          )
        );
      } else {
        slotsProperties.push(
          buildDefaultSlotProperty(void 0, implicitDefaultChildren)
        );
      }
    }
  }
  const slotFlag = hasDynamicSlots ? 2 : hasForwardedSlots(node.children) ? 3 : 1;
  let slots = createObjectExpression(
    slotsProperties.concat(
      createObjectProperty(
        `_`,
        // 2 = compiled but dynamic = can skip normalization, but must run diff
        // 1 = compiled and static = can skip normalization AND diff as optimized
        createSimpleExpression(
          slotFlag + (false ? ` /* ${slotFlagsText[slotFlag]} */` : ``),
          false
        )
      )
    ),
    loc
  );
  if (dynamicSlots.length) {
    slots = createCallExpression(context.helper(CREATE_SLOTS), [
      slots,
      createArrayExpression(dynamicSlots)
    ]);
  }
  return {
    slots,
    hasDynamicSlots
  };
}
function buildDynamicSlot(name, fn, index) {
  const props = [
    createObjectProperty(`name`, name),
    createObjectProperty(`fn`, fn)
  ];
  if (index != null) {
    props.push(
      createObjectProperty(`key`, createSimpleExpression(String(index), true))
    );
  }
  return createObjectExpression(props);
}
function hasForwardedSlots(children) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    switch (child.type) {
      case 1:
        if (child.tagType === 2 || hasForwardedSlots(child.children)) {
          return true;
        }
        break;
      case 9:
        if (hasForwardedSlots(child.branches)) return true;
        break;
      case 10:
      case 11:
        if (hasForwardedSlots(child.children)) return true;
        break;
    }
  }
  return false;
}
const directiveImportMap = /* @__PURE__ */ new WeakMap();
const transformElement = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode;
    if (!(node.type === 1 && (node.tagType === 0 || node.tagType === 1))) {
      return;
    }
    const { tag, props } = node;
    const isComponent2 = node.tagType === 1;
    let vnodeTag = isComponent2 ? resolveComponentType(node, context) : `"${tag}"`;
    const isDynamicComponent = isObject$2(vnodeTag) && vnodeTag.callee === RESOLVE_DYNAMIC_COMPONENT;
    let vnodeProps;
    let vnodeChildren;
    let patchFlag = 0;
    let vnodeDynamicProps;
    let dynamicPropNames;
    let vnodeDirectives;
    let shouldUseBlock = (
      // dynamic component may resolve to plain elements
      isDynamicComponent || vnodeTag === TELEPORT || vnodeTag === SUSPENSE || !isComponent2 && // <svg> and <foreignObject> must be forced into blocks so that block
      // updates inside get proper isSVG flag at runtime. (#639, #643)
      // This is technically web-specific, but splitting the logic out of core
      // leads to too much unnecessary complexity.
      (tag === "svg" || tag === "foreignObject" || tag === "math")
    );
    if (props.length > 0) {
      const propsBuildResult = buildProps(
        node,
        context,
        void 0,
        isComponent2,
        isDynamicComponent
      );
      vnodeProps = propsBuildResult.props;
      patchFlag = propsBuildResult.patchFlag;
      dynamicPropNames = propsBuildResult.dynamicPropNames;
      const directives = propsBuildResult.directives;
      vnodeDirectives = directives && directives.length ? createArrayExpression(
        directives.map((dir) => buildDirectiveArgs(dir, context))
      ) : void 0;
      if (propsBuildResult.shouldUseBlock) {
        shouldUseBlock = true;
      }
    }
    if (node.children.length > 0) {
      if (vnodeTag === KEEP_ALIVE) {
        shouldUseBlock = true;
        patchFlag |= 1024;
        if (false) {
          context.onError(
            createCompilerError(47, {
              start: node.children[0].loc.start,
              end: node.children[node.children.length - 1].loc.end,
              source: ""
            })
          );
        }
      }
      const shouldBuildAsSlots = isComponent2 && // Teleport is not a real component and has dedicated runtime handling
      vnodeTag !== TELEPORT && // explained above.
      vnodeTag !== KEEP_ALIVE;
      if (shouldBuildAsSlots) {
        const { slots, hasDynamicSlots } = buildSlots(node, context);
        vnodeChildren = slots;
        if (hasDynamicSlots) {
          patchFlag |= 1024;
        }
      } else if (node.children.length === 1 && vnodeTag !== TELEPORT) {
        const child = node.children[0];
        const type = child.type;
        const hasDynamicTextChild = type === 5 || type === 8;
        if (hasDynamicTextChild && getConstantType(child, context) === 0) {
          patchFlag |= 1;
        }
        if (hasDynamicTextChild || type === 2) {
          vnodeChildren = child;
        } else {
          vnodeChildren = node.children;
        }
      } else {
        vnodeChildren = node.children;
      }
    }
    if (dynamicPropNames && dynamicPropNames.length) {
      vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames);
    }
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      patchFlag === 0 ? void 0 : patchFlag,
      vnodeDynamicProps,
      vnodeDirectives,
      !!shouldUseBlock,
      false,
      isComponent2,
      node.loc
    );
  };
};
function resolveComponentType(node, context, ssr = false) {
  let { tag } = node;
  const isExplicitDynamic = isComponentTag(tag);
  const isProp = findProp(
    node,
    "is",
    false,
    true
    /* allow empty */
  );
  if (isProp) {
    if (isExplicitDynamic || isCompatEnabled(
      "COMPILER_IS_ON_ELEMENT",
      context
    )) {
      let exp;
      if (isProp.type === 6) {
        exp = isProp.value && createSimpleExpression(isProp.value.content, true);
      } else {
        exp = isProp.exp;
        if (!exp) {
          exp = createSimpleExpression(`is`, false, isProp.arg.loc);
        }
      }
      if (exp) {
        return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [
          exp
        ]);
      }
    } else if (isProp.type === 6 && isProp.value.content.startsWith("vue:")) {
      tag = isProp.value.content.slice(4);
    }
  }
  const builtIn = isCoreComponent(tag) || context.isBuiltInComponent(tag);
  if (builtIn) {
    if (!ssr) context.helper(builtIn);
    return builtIn;
  }
  context.helper(RESOLVE_COMPONENT);
  context.components.add(tag);
  return toValidAssetId(tag, `component`);
}
function buildProps(node, context, props = node.props, isComponent2, isDynamicComponent, ssr = false) {
  const { tag, loc: elementLoc, children } = node;
  let properties = [];
  const mergeArgs = [];
  const runtimeDirectives = [];
  const hasChildren = children.length > 0;
  let shouldUseBlock = false;
  let patchFlag = 0;
  let hasRef = false;
  let hasClassBinding = false;
  let hasStyleBinding = false;
  let hasHydrationEventBinding = false;
  let hasDynamicKeys = false;
  let hasVnodeHook = false;
  const dynamicPropNames = [];
  const pushMergeArg = (arg) => {
    if (properties.length) {
      mergeArgs.push(
        createObjectExpression(dedupeProperties(properties), elementLoc)
      );
      properties = [];
    }
    if (arg) mergeArgs.push(arg);
  };
  const pushRefVForMarker = () => {
    if (context.scopes.vFor > 0) {
      properties.push(
        createObjectProperty(
          createSimpleExpression("ref_for", true),
          createSimpleExpression("true")
        )
      );
    }
  };
  const analyzePatchFlag = ({ key, value }) => {
    if (isStaticExp(key)) {
      const name = key.content;
      const isEventHandler = isOn(name);
      if (isEventHandler && (!isComponent2 || isDynamicComponent) && // omit the flag for click handlers because hydration gives click
      // dedicated fast path.
      name.toLowerCase() !== "onclick" && // omit v-model handlers
      name !== "onUpdate:modelValue" && // omit onVnodeXXX hooks
      !isReservedProp(name)) {
        hasHydrationEventBinding = true;
      }
      if (isEventHandler && isReservedProp(name)) {
        hasVnodeHook = true;
      }
      if (isEventHandler && value.type === 14) {
        value = value.arguments[0];
      }
      if (value.type === 20 || (value.type === 4 || value.type === 8) && getConstantType(value, context) > 0) {
        return;
      }
      if (name === "ref") {
        hasRef = true;
      } else if (name === "class") {
        hasClassBinding = true;
      } else if (name === "style") {
        hasStyleBinding = true;
      } else if (name !== "key" && !dynamicPropNames.includes(name)) {
        dynamicPropNames.push(name);
      }
      if (isComponent2 && (name === "class" || name === "style") && !dynamicPropNames.includes(name)) {
        dynamicPropNames.push(name);
      }
    } else {
      hasDynamicKeys = true;
    }
  };
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (prop.type === 6) {
      const { loc, name, nameLoc, value } = prop;
      let isStatic = true;
      if (name === "ref") {
        hasRef = true;
        pushRefVForMarker();
      }
      if (name === "is" && (isComponentTag(tag) || value && value.content.startsWith("vue:") || isCompatEnabled(
        "COMPILER_IS_ON_ELEMENT",
        context
      ))) {
        continue;
      }
      properties.push(
        createObjectProperty(
          createSimpleExpression(name, true, nameLoc),
          createSimpleExpression(
            value ? value.content : "",
            isStatic,
            value ? value.loc : loc
          )
        )
      );
    } else {
      const { name, arg, exp, loc, modifiers } = prop;
      const isVBind = name === "bind";
      const isVOn = name === "on";
      if (name === "slot") {
        if (!isComponent2) {
          context.onError(
            createCompilerError(40, loc)
          );
        }
        continue;
      }
      if (name === "once" || name === "memo") {
        continue;
      }
      if (name === "is" || isVBind && isStaticArgOf(arg, "is") && (isComponentTag(tag) || isCompatEnabled(
        "COMPILER_IS_ON_ELEMENT",
        context
      ))) {
        continue;
      }
      if (isVOn && ssr) {
        continue;
      }
      if (
        // #938: elements with dynamic keys should be forced into blocks
        isVBind && isStaticArgOf(arg, "key") || // inline before-update hooks need to force block so that it is invoked
        // before children
        isVOn && hasChildren && isStaticArgOf(arg, "vue:before-update")
      ) {
        shouldUseBlock = true;
      }
      if (isVBind && isStaticArgOf(arg, "ref")) {
        pushRefVForMarker();
      }
      if (!arg && (isVBind || isVOn)) {
        hasDynamicKeys = true;
        if (exp) {
          if (isVBind) {
            {
              pushMergeArg();
              if (false) {
                const hasOverridableKeys = mergeArgs.some((arg2) => {
                  if (arg2.type === 15) {
                    return arg2.properties.some(({ key }) => {
                      if (key.type !== 4 || !key.isStatic) {
                        return true;
                      }
                      return key.content !== "class" && key.content !== "style" && !isOn(key.content);
                    });
                  } else {
                    return true;
                  }
                });
                if (hasOverridableKeys) {
                  checkCompatEnabled(
                    "COMPILER_V_BIND_OBJECT_ORDER",
                    context,
                    loc
                  );
                }
              }
              if (isCompatEnabled(
                "COMPILER_V_BIND_OBJECT_ORDER",
                context
              )) {
                mergeArgs.unshift(exp);
                continue;
              }
            }
            pushRefVForMarker();
            pushMergeArg();
            mergeArgs.push(exp);
          } else {
            pushMergeArg({
              type: 14,
              loc,
              callee: context.helper(TO_HANDLERS),
              arguments: isComponent2 ? [exp] : [exp, `true`]
            });
          }
        } else {
          context.onError(
            createCompilerError(
              isVBind ? 34 : 35,
              loc
            )
          );
        }
        continue;
      }
      if (isVBind && modifiers.some((mod) => mod.content === "prop")) {
        patchFlag |= 32;
      }
      const directiveTransform = context.directiveTransforms[name];
      if (directiveTransform) {
        const { props: props2, needRuntime } = directiveTransform(prop, node, context);
        !ssr && props2.forEach(analyzePatchFlag);
        if (isVOn && arg && !isStaticExp(arg)) {
          pushMergeArg(createObjectExpression(props2, elementLoc));
        } else {
          properties.push(...props2);
        }
        if (needRuntime) {
          runtimeDirectives.push(prop);
          if (isSymbol$1(needRuntime)) {
            directiveImportMap.set(prop, needRuntime);
          }
        }
      } else if (!isBuiltInDirective(name)) {
        runtimeDirectives.push(prop);
        if (hasChildren) {
          shouldUseBlock = true;
        }
      }
    }
  }
  let propsExpression = void 0;
  if (mergeArgs.length) {
    pushMergeArg();
    if (mergeArgs.length > 1) {
      propsExpression = createCallExpression(
        context.helper(MERGE_PROPS),
        mergeArgs,
        elementLoc
      );
    } else {
      propsExpression = mergeArgs[0];
    }
  } else if (properties.length) {
    propsExpression = createObjectExpression(
      dedupeProperties(properties),
      elementLoc
    );
  }
  if (hasDynamicKeys) {
    patchFlag |= 16;
  } else {
    if (hasClassBinding && !isComponent2) {
      patchFlag |= 2;
    }
    if (hasStyleBinding && !isComponent2) {
      patchFlag |= 4;
    }
    if (dynamicPropNames.length) {
      patchFlag |= 8;
    }
    if (hasHydrationEventBinding) {
      patchFlag |= 32;
    }
  }
  if (!shouldUseBlock && (patchFlag === 0 || patchFlag === 32) && (hasRef || hasVnodeHook || runtimeDirectives.length > 0)) {
    patchFlag |= 512;
  }
  if (!context.inSSR && propsExpression) {
    switch (propsExpression.type) {
      case 15:
        let classKeyIndex = -1;
        let styleKeyIndex = -1;
        let hasDynamicKey = false;
        for (let i = 0; i < propsExpression.properties.length; i++) {
          const key = propsExpression.properties[i].key;
          if (isStaticExp(key)) {
            if (key.content === "class") {
              classKeyIndex = i;
            } else if (key.content === "style") {
              styleKeyIndex = i;
            }
          } else if (!key.isHandlerKey) {
            hasDynamicKey = true;
          }
        }
        const classProp = propsExpression.properties[classKeyIndex];
        const styleProp = propsExpression.properties[styleKeyIndex];
        if (!hasDynamicKey) {
          if (classProp && !isStaticExp(classProp.value)) {
            classProp.value = createCallExpression(
              context.helper(NORMALIZE_CLASS),
              [classProp.value]
            );
          }
          if (styleProp && // the static style is compiled into an object,
          // so use `hasStyleBinding` to ensure that it is a dynamic style binding
          (hasStyleBinding || styleProp.value.type === 4 && styleProp.value.content.trim()[0] === `[` || // v-bind:style and style both exist,
          // v-bind:style with static literal object
          styleProp.value.type === 17)) {
            styleProp.value = createCallExpression(
              context.helper(NORMALIZE_STYLE),
              [styleProp.value]
            );
          }
        } else {
          propsExpression = createCallExpression(
            context.helper(NORMALIZE_PROPS),
            [propsExpression]
          );
        }
        break;
      case 14:
        break;
      default:
        propsExpression = createCallExpression(
          context.helper(NORMALIZE_PROPS),
          [
            createCallExpression(context.helper(GUARD_REACTIVE_PROPS), [
              propsExpression
            ])
          ]
        );
        break;
    }
  }
  return {
    props: propsExpression,
    directives: runtimeDirectives,
    patchFlag,
    dynamicPropNames,
    shouldUseBlock
  };
}
function dedupeProperties(properties) {
  const knownProps = /* @__PURE__ */ new Map();
  const deduped = [];
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    if (prop.key.type === 8 || !prop.key.isStatic) {
      deduped.push(prop);
      continue;
    }
    const name = prop.key.content;
    const existing = knownProps.get(name);
    if (existing) {
      if (name === "style" || name === "class" || isOn(name)) {
        mergeAsArray(existing, prop);
      }
    } else {
      knownProps.set(name, prop);
      deduped.push(prop);
    }
  }
  return deduped;
}
function mergeAsArray(existing, incoming) {
  if (existing.value.type === 17) {
    existing.value.elements.push(incoming.value);
  } else {
    existing.value = createArrayExpression(
      [existing.value, incoming.value],
      existing.loc
    );
  }
}
function buildDirectiveArgs(dir, context) {
  const dirArgs = [];
  const runtime = directiveImportMap.get(dir);
  if (runtime) {
    dirArgs.push(context.helperString(runtime));
  } else {
    {
      context.helper(RESOLVE_DIRECTIVE);
      context.directives.add(dir.name);
      dirArgs.push(toValidAssetId(dir.name, `directive`));
    }
  }
  const { loc } = dir;
  if (dir.exp) dirArgs.push(dir.exp);
  if (dir.arg) {
    if (!dir.exp) {
      dirArgs.push(`void 0`);
    }
    dirArgs.push(dir.arg);
  }
  if (Object.keys(dir.modifiers).length) {
    if (!dir.arg) {
      if (!dir.exp) {
        dirArgs.push(`void 0`);
      }
      dirArgs.push(`void 0`);
    }
    const trueExpression = createSimpleExpression(`true`, false, loc);
    dirArgs.push(
      createObjectExpression(
        dir.modifiers.map(
          (modifier) => createObjectProperty(modifier, trueExpression)
        ),
        loc
      )
    );
  }
  return createArrayExpression(dirArgs, dir.loc);
}
function stringifyDynamicPropNames(props) {
  let propsNamesString = `[`;
  for (let i = 0, l = props.length; i < l; i++) {
    propsNamesString += JSON.stringify(props[i]);
    if (i < l - 1) propsNamesString += ", ";
  }
  return propsNamesString + `]`;
}
function isComponentTag(tag) {
  return tag === "component" || tag === "Component";
}
const transformSlotOutlet = (node, context) => {
  if (isSlotOutlet(node)) {
    const { children, loc } = node;
    const { slotName, slotProps } = processSlotOutlet(node, context);
    const slotArgs = [
      context.prefixIdentifiers ? `_ctx.$slots` : `$slots`,
      slotName,
      "{}",
      "undefined",
      "true"
    ];
    let expectedLen = 2;
    if (slotProps) {
      slotArgs[2] = slotProps;
      expectedLen = 3;
    }
    if (children.length) {
      slotArgs[3] = createFunctionExpression([], children, false, false, loc);
      expectedLen = 4;
    }
    if (context.scopeId && !context.slotted) {
      expectedLen = 5;
    }
    slotArgs.splice(expectedLen);
    node.codegenNode = createCallExpression(
      context.helper(RENDER_SLOT),
      slotArgs,
      loc
    );
  }
};
function processSlotOutlet(node, context) {
  let slotName = `"default"`;
  let slotProps = void 0;
  const nonNameProps = [];
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === 6) {
      if (p.value) {
        if (p.name === "name") {
          slotName = JSON.stringify(p.value.content);
        } else {
          p.name = camelize$1(p.name);
          nonNameProps.push(p);
        }
      }
    } else {
      if (p.name === "bind" && isStaticArgOf(p.arg, "name")) {
        if (p.exp) {
          slotName = p.exp;
        } else if (p.arg && p.arg.type === 4) {
          const name = camelize$1(p.arg.content);
          slotName = p.exp = createSimpleExpression(name, false, p.arg.loc);
        }
      } else {
        if (p.name === "bind" && p.arg && isStaticExp(p.arg)) {
          p.arg.content = camelize$1(p.arg.content);
        }
        nonNameProps.push(p);
      }
    }
  }
  if (nonNameProps.length > 0) {
    const { props, directives } = buildProps(
      node,
      context,
      nonNameProps,
      false,
      false
    );
    slotProps = props;
    if (directives.length) {
      context.onError(
        createCompilerError(
          36,
          directives[0].loc
        )
      );
    }
  }
  return {
    slotName,
    slotProps
  };
}
const transformOn$1 = (dir, node, context, augmentor) => {
  const { loc, modifiers, arg } = dir;
  if (!dir.exp && !modifiers.length) {
    context.onError(createCompilerError(35, loc));
  }
  let eventName;
  if (arg.type === 4) {
    if (arg.isStatic) {
      let rawName = arg.content;
      if (false) {
        context.onError(createCompilerError(52, arg.loc));
      }
      if (rawName.startsWith("vue:")) {
        rawName = `vnode-${rawName.slice(4)}`;
      }
      const eventString = node.tagType !== 0 || rawName.startsWith("vnode") || !/[A-Z]/.test(rawName) ? (
        // for non-element and vnode lifecycle event listeners, auto convert
        // it to camelCase. See issue #2249
        toHandlerKey(camelize$1(rawName))
      ) : (
        // preserve case for plain element listeners that have uppercase
        // letters, as these may be custom elements' custom events
        `on:${rawName}`
      );
      eventName = createSimpleExpression(eventString, true, arg.loc);
    } else {
      eventName = createCompoundExpression([
        `${context.helperString(TO_HANDLER_KEY)}(`,
        arg,
        `)`
      ]);
    }
  } else {
    eventName = arg;
    eventName.children.unshift(`${context.helperString(TO_HANDLER_KEY)}(`);
    eventName.children.push(`)`);
  }
  let exp = dir.exp;
  if (exp && !exp.content.trim()) {
    exp = void 0;
  }
  let shouldCache = context.cacheHandlers && !exp && !context.inVOnce;
  if (exp) {
    const isMemberExp = isMemberExpression(exp);
    const isInlineStatement = !(isMemberExp || isFnExpression(exp));
    const hasMultipleStatements = exp.content.includes(`;`);
    if (false) {
      validateBrowserExpression(
        exp,
        context,
        false,
        hasMultipleStatements
      );
    }
    if (isInlineStatement || shouldCache && isMemberExp) {
      exp = createCompoundExpression([
        `${isInlineStatement ? `$event` : `${``}(...args)`} => ${hasMultipleStatements ? `{` : `(`}`,
        exp,
        hasMultipleStatements ? `}` : `)`
      ]);
    }
  }
  let ret = {
    props: [
      createObjectProperty(
        eventName,
        exp || createSimpleExpression(`() => {}`, false, loc)
      )
    ]
  };
  if (augmentor) {
    ret = augmentor(ret);
  }
  if (shouldCache) {
    ret.props[0].value = context.cache(ret.props[0].value);
  }
  ret.props.forEach((p) => p.key.isHandlerKey = true);
  return ret;
};
const transformBind = (dir, _node, context) => {
  const { modifiers, loc } = dir;
  const arg = dir.arg;
  let { exp } = dir;
  if (exp && exp.type === 4 && !exp.content.trim()) {
    {
      exp = void 0;
    }
  }
  if (arg.type !== 4) {
    arg.children.unshift(`(`);
    arg.children.push(`) || ""`);
  } else if (!arg.isStatic) {
    arg.content = arg.content ? `${arg.content} || ""` : `""`;
  }
  if (modifiers.some((mod) => mod.content === "camel")) {
    if (arg.type === 4) {
      if (arg.isStatic) {
        arg.content = camelize$1(arg.content);
      } else {
        arg.content = `${context.helperString(CAMELIZE)}(${arg.content})`;
      }
    } else {
      arg.children.unshift(`${context.helperString(CAMELIZE)}(`);
      arg.children.push(`)`);
    }
  }
  if (!context.inSSR) {
    if (modifiers.some((mod) => mod.content === "prop")) {
      injectPrefix(arg, ".");
    }
    if (modifiers.some((mod) => mod.content === "attr")) {
      injectPrefix(arg, "^");
    }
  }
  return {
    props: [createObjectProperty(arg, exp)]
  };
};
const injectPrefix = (arg, prefix) => {
  if (arg.type === 4) {
    if (arg.isStatic) {
      arg.content = prefix + arg.content;
    } else {
      arg.content = `\`${prefix}\${${arg.content}}\``;
    }
  } else {
    arg.children.unshift(`'${prefix}' + (`);
    arg.children.push(`)`);
  }
};
const transformText = (node, context) => {
  if (node.type === 0 || node.type === 1 || node.type === 11 || node.type === 10) {
    return () => {
      const children = node.children;
      let currentContainer = void 0;
      let hasText = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText$1(child)) {
          hasText = true;
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText$1(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression(
                  [child],
                  child.loc
                );
              }
              currentContainer.children.push(` + `, next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = void 0;
              break;
            }
          }
        }
      }
      if (!hasText || // if this is a plain element with a single text child, leave it
      // as-is since the runtime has dedicated fast path for this by directly
      // setting textContent of the element.
      // for component root it's always normalized anyway.
      children.length === 1 && (node.type === 0 || node.type === 1 && node.tagType === 0 && // #3756
      // custom directives can potentially add DOM elements arbitrarily,
      // we need to avoid setting textContent of the element at runtime
      // to avoid accidentally overwriting the DOM elements added
      // by the user through custom directives.
      !node.props.find(
        (p) => p.type === 7 && !context.directiveTransforms[p.name]
      ) && // in compat mode, <template> tags with no special directives
      // will be rendered as a fragment so its children must be
      // converted into vnodes.
      !(node.tag === "template"))) {
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText$1(child) || child.type === 8) {
          const callArgs = [];
          if (child.type !== 2 || child.content !== " ") {
            callArgs.push(child);
          }
          if (!context.ssr && getConstantType(child, context) === 0) {
            callArgs.push(
              1 + (false ? ` /* ${PatchFlagNames[1]} */` : ``)
            );
          }
          children[i] = {
            type: 12,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(
              context.helper(CREATE_TEXT),
              callArgs
            )
          };
        }
      }
    };
  }
};
const seen$1 = /* @__PURE__ */ new WeakSet();
const transformOnce = (node, context) => {
  if (node.type === 1 && findDir(node, "once", true)) {
    if (seen$1.has(node) || context.inVOnce || context.inSSR) {
      return;
    }
    seen$1.add(node);
    context.inVOnce = true;
    context.helper(SET_BLOCK_TRACKING);
    return () => {
      context.inVOnce = false;
      const cur = context.currentNode;
      if (cur.codegenNode) {
        cur.codegenNode = context.cache(
          cur.codegenNode,
          true,
          true
        );
      }
    };
  }
};
const transformModel$1 = (dir, node, context) => {
  const { exp, arg } = dir;
  if (!exp) {
    context.onError(
      createCompilerError(41, dir.loc)
    );
    return createTransformProps();
  }
  const rawExp = exp.loc.source.trim();
  const expString = exp.type === 4 ? exp.content : rawExp;
  const bindingType = context.bindingMetadata[rawExp];
  if (bindingType === "props" || bindingType === "props-aliased") {
    context.onError(createCompilerError(44, exp.loc));
    return createTransformProps();
  }
  if (bindingType === "literal-const" || bindingType === "setup-const") {
    context.onError(createCompilerError(45, exp.loc));
    return createTransformProps();
  }
  if (!expString.trim() || !isMemberExpression(exp) && true) {
    context.onError(
      createCompilerError(42, exp.loc)
    );
    return createTransformProps();
  }
  const propName = arg ? arg : createSimpleExpression("modelValue", true);
  const eventName = arg ? isStaticExp(arg) ? `onUpdate:${camelize$1(arg.content)}` : createCompoundExpression(['"onUpdate:" + ', arg]) : `onUpdate:modelValue`;
  let assignmentExp;
  const eventArg = context.isTS ? `($event: any)` : `$event`;
  {
    assignmentExp = createCompoundExpression([
      `${eventArg} => ((`,
      exp,
      `) = $event)`
    ]);
  }
  const props = [
    // modelValue: foo
    createObjectProperty(propName, dir.exp),
    // "onUpdate:modelValue": $event => (foo = $event)
    createObjectProperty(eventName, assignmentExp)
  ];
  if (dir.modifiers.length && node.tagType === 1) {
    const modifiers = dir.modifiers.map((m) => m.content).map((m) => (isSimpleIdentifier(m) ? m : JSON.stringify(m)) + `: true`).join(`, `);
    const modifiersKey = arg ? isStaticExp(arg) ? `${arg.content}Modifiers` : createCompoundExpression([arg, ' + "Modifiers"']) : `modelModifiers`;
    props.push(
      createObjectProperty(
        modifiersKey,
        createSimpleExpression(
          `{ ${modifiers} }`,
          false,
          dir.loc,
          2
        )
      )
    );
  }
  return createTransformProps(props);
};
function createTransformProps(props = []) {
  return { props };
}
const validDivisionCharRE = /[\w).+\-_$\]]/;
const transformFilter = (node, context) => {
  if (!isCompatEnabled("COMPILER_FILTERS", context)) {
    return;
  }
  if (node.type === 5) {
    rewriteFilter(node.content, context);
  } else if (node.type === 1) {
    node.props.forEach((prop) => {
      if (prop.type === 7 && prop.name !== "for" && prop.exp) {
        rewriteFilter(prop.exp, context);
      }
    });
  }
};
function rewriteFilter(node, context) {
  if (node.type === 4) {
    parseFilter(node, context);
  } else {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (typeof child !== "object") continue;
      if (child.type === 4) {
        parseFilter(child, context);
      } else if (child.type === 8) {
        rewriteFilter(node, context);
      } else if (child.type === 5) {
        rewriteFilter(child.content, context);
      }
    }
  }
}
function parseFilter(node, context) {
  const exp = node.content;
  let inSingle = false;
  let inDouble = false;
  let inTemplateString = false;
  let inRegex = false;
  let curly = 0;
  let square = 0;
  let paren = 0;
  let lastFilterIndex = 0;
  let c, prev, i, expression, filters = [];
  for (i = 0; i < exp.length; i++) {
    prev = c;
    c = exp.charCodeAt(i);
    if (inSingle) {
      if (c === 39 && prev !== 92) inSingle = false;
    } else if (inDouble) {
      if (c === 34 && prev !== 92) inDouble = false;
    } else if (inTemplateString) {
      if (c === 96 && prev !== 92) inTemplateString = false;
    } else if (inRegex) {
      if (c === 47 && prev !== 92) inRegex = false;
    } else if (c === 124 && // pipe
    exp.charCodeAt(i + 1) !== 124 && exp.charCodeAt(i - 1) !== 124 && !curly && !square && !paren) {
      if (expression === void 0) {
        lastFilterIndex = i + 1;
        expression = exp.slice(0, i).trim();
      } else {
        pushFilter();
      }
    } else {
      switch (c) {
        case 34:
          inDouble = true;
          break;
        // "
        case 39:
          inSingle = true;
          break;
        // '
        case 96:
          inTemplateString = true;
          break;
        // `
        case 40:
          paren++;
          break;
        // (
        case 41:
          paren--;
          break;
        // )
        case 91:
          square++;
          break;
        // [
        case 93:
          square--;
          break;
        // ]
        case 123:
          curly++;
          break;
        // {
        case 125:
          curly--;
          break;
      }
      if (c === 47) {
        let j = i - 1;
        let p;
        for (; j >= 0; j--) {
          p = exp.charAt(j);
          if (p !== " ") break;
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true;
        }
      }
    }
  }
  if (expression === void 0) {
    expression = exp.slice(0, i).trim();
  } else if (lastFilterIndex !== 0) {
    pushFilter();
  }
  function pushFilter() {
    filters.push(exp.slice(lastFilterIndex, i).trim());
    lastFilterIndex = i + 1;
  }
  if (filters.length) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i], context);
    }
    node.content = expression;
    node.ast = void 0;
  }
}
function wrapFilter(exp, filter, context) {
  context.helper(RESOLVE_FILTER);
  const i = filter.indexOf("(");
  if (i < 0) {
    context.filters.add(filter);
    return `${toValidAssetId(filter, "filter")}(${exp})`;
  } else {
    const name = filter.slice(0, i);
    const args = filter.slice(i + 1);
    context.filters.add(name);
    return `${toValidAssetId(name, "filter")}(${exp}${args !== ")" ? "," + args : args}`;
  }
}
const seen = /* @__PURE__ */ new WeakSet();
const transformMemo = (node, context) => {
  if (node.type === 1) {
    const dir = findDir(node, "memo");
    if (!dir || seen.has(node) || context.inSSR) {
      return;
    }
    seen.add(node);
    return () => {
      const codegenNode = node.codegenNode || context.currentNode.codegenNode;
      if (codegenNode && codegenNode.type === 13) {
        if (node.tagType !== 1) {
          convertToBlock(codegenNode, context);
        }
        node.codegenNode = createCallExpression(context.helper(WITH_MEMO), [
          dir.exp,
          createFunctionExpression(void 0, codegenNode),
          `_cache`,
          String(context.cached.length)
        ]);
        context.cached.push(null);
      }
    };
  }
};
const transformVBindShorthand = (node, context) => {
  if (node.type === 1) {
    for (const prop of node.props) {
      if (prop.type === 7 && prop.name === "bind" && (!prop.exp || // #13930 :foo in in-DOM templates will be parsed into :foo="" by browser
      prop.exp.type === 4 && !prop.exp.content.trim()) && prop.arg) {
        const arg = prop.arg;
        if (arg.type !== 4 || !arg.isStatic) {
          context.onError(
            createCompilerError(
              53,
              arg.loc
            )
          );
          prop.exp = createSimpleExpression("", true, arg.loc);
        } else {
          const propName = camelize$1(arg.content);
          if (validFirstIdentCharRE.test(propName[0]) || // allow hyphen first char for https://github.com/vuejs/language-tools/pull/3424
          propName[0] === "-") {
            prop.exp = createSimpleExpression(propName, false, arg.loc);
          }
        }
      }
    }
  }
};
function getBaseTransformPreset(prefixIdentifiers) {
  return [
    [
      transformVBindShorthand,
      transformOnce,
      transformIf,
      transformMemo,
      transformFor,
      ...[transformFilter],
      ...false ? [transformExpression] : [],
      transformSlotOutlet,
      transformElement,
      trackSlotScopes,
      transformText
    ],
    {
      on: transformOn$1,
      bind: transformBind,
      model: transformModel$1
    }
  ];
}
function baseCompile(source, options = {}) {
  const onError = options.onError || defaultOnError;
  const isModuleMode = options.mode === "module";
  {
    if (options.prefixIdentifiers === true) {
      onError(createCompilerError(48));
    } else if (isModuleMode) {
      onError(createCompilerError(49));
    }
  }
  const prefixIdentifiers = false;
  if (options.cacheHandlers) {
    onError(createCompilerError(50));
  }
  if (options.scopeId && !isModuleMode) {
    onError(createCompilerError(51));
  }
  const resolvedOptions = extend({}, options, {
    prefixIdentifiers
  });
  const ast = isString$1(source) ? baseParse(source, resolvedOptions) : source;
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
  transform(
    ast,
    extend({}, resolvedOptions, {
      nodeTransforms: [
        ...nodeTransforms,
        ...options.nodeTransforms || []
        // user transforms
      ],
      directiveTransforms: extend(
        {},
        directiveTransforms,
        options.directiveTransforms || {}
        // user transforms
      )
    })
  );
  return generate(ast, resolvedOptions);
}
const BindingTypes = {
  "DATA": "data",
  "PROPS": "props",
  "PROPS_ALIASED": "props-aliased",
  "SETUP_LET": "setup-let",
  "SETUP_CONST": "setup-const",
  "SETUP_REACTIVE_CONST": "setup-reactive-const",
  "SETUP_MAYBE_REF": "setup-maybe-ref",
  "SETUP_REF": "setup-ref",
  "OPTIONS": "options",
  "LITERAL_CONST": "literal-const"
};
const noopDirectiveTransform = () => ({ props: [] });

/**
* @vue/compiler-dom v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const V_MODEL_RADIO = /* @__PURE__ */ Symbol(false ? `vModelRadio` : ``);
const V_MODEL_CHECKBOX = /* @__PURE__ */ Symbol(
  false ? `vModelCheckbox` : ``
);
const V_MODEL_TEXT = /* @__PURE__ */ Symbol(false ? `vModelText` : ``);
const V_MODEL_SELECT = /* @__PURE__ */ Symbol(
  false ? `vModelSelect` : ``
);
const V_MODEL_DYNAMIC = /* @__PURE__ */ Symbol(
  false ? `vModelDynamic` : ``
);
const V_ON_WITH_MODIFIERS = /* @__PURE__ */ Symbol(
  false ? `vOnModifiersGuard` : ``
);
const V_ON_WITH_KEYS = /* @__PURE__ */ Symbol(
  false ? `vOnKeysGuard` : ``
);
const V_SHOW = /* @__PURE__ */ Symbol(false ? `vShow` : ``);
const TRANSITION = /* @__PURE__ */ Symbol(false ? `Transition` : ``);
const TRANSITION_GROUP = /* @__PURE__ */ Symbol(
  false ? `TransitionGroup` : ``
);
registerRuntimeHelpers({
  [V_MODEL_RADIO]: `vModelRadio`,
  [V_MODEL_CHECKBOX]: `vModelCheckbox`,
  [V_MODEL_TEXT]: `vModelText`,
  [V_MODEL_SELECT]: `vModelSelect`,
  [V_MODEL_DYNAMIC]: `vModelDynamic`,
  [V_ON_WITH_MODIFIERS]: `withModifiers`,
  [V_ON_WITH_KEYS]: `withKeys`,
  [V_SHOW]: `vShow`,
  [TRANSITION]: `Transition`,
  [TRANSITION_GROUP]: `TransitionGroup`
});
let decoder;
function decodeHtmlBrowser(raw, asAttr = false) {
  if (!decoder) {
    decoder = document.createElement("div");
  }
  if (asAttr) {
    decoder.innerHTML = `<div foo="${raw.replace(/"/g, "&quot;")}">`;
    return decoder.children[0].getAttribute("foo");
  } else {
    decoder.innerHTML = raw;
    return decoder.textContent;
  }
}
const parserOptions = {
  parseMode: "html",
  isVoidTag,
  isNativeTag: (tag) => isHTMLTag(tag) || isSVGTag(tag) || isMathMLTag(tag),
  isPreTag: (tag) => tag === "pre",
  isIgnoreNewlineTag: (tag) => tag === "pre" || tag === "textarea",
  decodeEntities: decodeHtmlBrowser,
  isBuiltInComponent: (tag) => {
    if (tag === "Transition" || tag === "transition") {
      return TRANSITION;
    } else if (tag === "TransitionGroup" || tag === "transition-group") {
      return TRANSITION_GROUP;
    }
  },
  // https://html.spec.whatwg.org/multipage/parsing.html#tree-construction-dispatcher
  getNamespace(tag, parent, rootNamespace) {
    let ns = parent ? parent.ns : rootNamespace;
    if (parent && ns === 2) {
      if (parent.tag === "annotation-xml") {
        if (tag === "svg") {
          return 1;
        }
        if (parent.props.some(
          (a) => a.type === 6 && a.name === "encoding" && a.value != null && (a.value.content === "text/html" || a.value.content === "application/xhtml+xml")
        )) {
          ns = 0;
        }
      } else if (/^m(?:[ions]|text)$/.test(parent.tag) && tag !== "mglyph" && tag !== "malignmark") {
        ns = 0;
      }
    } else if (parent && ns === 1) {
      if (parent.tag === "foreignObject" || parent.tag === "desc" || parent.tag === "title") {
        ns = 0;
      }
    }
    if (ns === 0) {
      if (tag === "svg") {
        return 1;
      }
      if (tag === "math") {
        return 2;
      }
    }
    return ns;
  }
};
const transformStyle = (node) => {
  if (node.type === 1) {
    node.props.forEach((p, i) => {
      if (p.type === 6 && p.name === "style" && p.value) {
        node.props[i] = {
          type: 7,
          name: `bind`,
          arg: createSimpleExpression(`style`, true, p.loc),
          exp: parseInlineCSS(p.value.content, p.loc),
          modifiers: [],
          loc: p.loc
        };
      }
    });
  }
};
const parseInlineCSS = (cssText, loc) => {
  const normalized = parseStringStyle(cssText);
  return createSimpleExpression(
    JSON.stringify(normalized),
    false,
    loc,
    3
  );
};
function createDOMCompilerError(code, loc) {
  return createCompilerError(
    code,
    loc,
    false ? DOMErrorMessages : void 0
  );
}
const DOMErrorCodes = {
  "X_V_HTML_NO_EXPRESSION": 54,
  "54": "X_V_HTML_NO_EXPRESSION",
  "X_V_HTML_WITH_CHILDREN": 55,
  "55": "X_V_HTML_WITH_CHILDREN",
  "X_V_TEXT_NO_EXPRESSION": 56,
  "56": "X_V_TEXT_NO_EXPRESSION",
  "X_V_TEXT_WITH_CHILDREN": 57,
  "57": "X_V_TEXT_WITH_CHILDREN",
  "X_V_MODEL_ON_INVALID_ELEMENT": 58,
  "58": "X_V_MODEL_ON_INVALID_ELEMENT",
  "X_V_MODEL_ARG_ON_ELEMENT": 59,
  "59": "X_V_MODEL_ARG_ON_ELEMENT",
  "X_V_MODEL_ON_FILE_INPUT_ELEMENT": 60,
  "60": "X_V_MODEL_ON_FILE_INPUT_ELEMENT",
  "X_V_MODEL_UNNECESSARY_VALUE": 61,
  "61": "X_V_MODEL_UNNECESSARY_VALUE",
  "X_V_SHOW_NO_EXPRESSION": 62,
  "62": "X_V_SHOW_NO_EXPRESSION",
  "X_TRANSITION_INVALID_CHILDREN": 63,
  "63": "X_TRANSITION_INVALID_CHILDREN",
  "X_IGNORED_SIDE_EFFECT_TAG": 64,
  "64": "X_IGNORED_SIDE_EFFECT_TAG",
  "__EXTEND_POINT__": 65,
  "65": "__EXTEND_POINT__"
};
const DOMErrorMessages = {
  [54]: `v-html is missing expression.`,
  [55]: `v-html will override element children.`,
  [56]: `v-text is missing expression.`,
  [57]: `v-text will override element children.`,
  [58]: `v-model can only be used on <input>, <textarea> and <select> elements.`,
  [59]: `v-model argument is not supported on plain elements.`,
  [60]: `v-model cannot be used on file inputs since they are read-only. Use a v-on:change listener instead.`,
  [61]: `Unnecessary value binding used alongside v-model. It will interfere with v-model's behavior.`,
  [62]: `v-show is missing expression.`,
  [63]: `<Transition> expects exactly one child element or component.`,
  [64]: `Tags with side effect (<script> and <style>) are ignored in client component templates.`
};
const transformVHtml = (dir, node, context) => {
  const { exp, loc } = dir;
  if (!exp) {
    context.onError(
      createDOMCompilerError(54, loc)
    );
  }
  if (node.children.length) {
    context.onError(
      createDOMCompilerError(55, loc)
    );
    node.children.length = 0;
  }
  return {
    props: [
      createObjectProperty(
        createSimpleExpression(`innerHTML`, true, loc),
        exp || createSimpleExpression("", true)
      )
    ]
  };
};
const transformVText = (dir, node, context) => {
  const { exp, loc } = dir;
  if (!exp) {
    context.onError(
      createDOMCompilerError(56, loc)
    );
  }
  if (node.children.length) {
    context.onError(
      createDOMCompilerError(57, loc)
    );
    node.children.length = 0;
  }
  return {
    props: [
      createObjectProperty(
        createSimpleExpression(`textContent`, true),
        exp ? getConstantType(exp, context) > 0 ? exp : createCallExpression(
          context.helperString(TO_DISPLAY_STRING),
          [exp],
          loc
        ) : createSimpleExpression("", true)
      )
    ]
  };
};
const transformModel = (dir, node, context) => {
  const baseResult = transformModel$1(dir, node, context);
  if (!baseResult.props.length || node.tagType === 1) {
    return baseResult;
  }
  if (dir.arg) {
    context.onError(
      createDOMCompilerError(
        59,
        dir.arg.loc
      )
    );
  }
  function checkDuplicatedValue() {
    const value = findDir(node, "bind");
    if (value && isStaticArgOf(value.arg, "value")) {
      context.onError(
        createDOMCompilerError(
          61,
          value.loc
        )
      );
    }
  }
  const { tag } = node;
  const isCustomElement = context.isCustomElement(tag);
  if (tag === "input" || tag === "textarea" || tag === "select" || isCustomElement) {
    let directiveToUse = V_MODEL_TEXT;
    let isInvalidType = false;
    if (tag === "input" || isCustomElement) {
      const type = findProp(node, `type`);
      if (type) {
        if (type.type === 7) {
          directiveToUse = V_MODEL_DYNAMIC;
        } else if (type.value) {
          switch (type.value.content) {
            case "radio":
              directiveToUse = V_MODEL_RADIO;
              break;
            case "checkbox":
              directiveToUse = V_MODEL_CHECKBOX;
              break;
            case "file":
              isInvalidType = true;
              context.onError(
                createDOMCompilerError(
                  60,
                  dir.loc
                )
              );
              break;
            default:
              break;
          }
        }
      } else if (hasDynamicKeyVBind(node)) {
        directiveToUse = V_MODEL_DYNAMIC;
      } else {
      }
    } else if (tag === "select") {
      directiveToUse = V_MODEL_SELECT;
    } else {
    }
    if (!isInvalidType) {
      baseResult.needRuntime = context.helper(directiveToUse);
    }
  } else {
    context.onError(
      createDOMCompilerError(
        58,
        dir.loc
      )
    );
  }
  baseResult.props = baseResult.props.filter(
    (p) => !(p.key.type === 4 && p.key.content === "modelValue")
  );
  return baseResult;
};
const isEventOptionModifier = /* @__PURE__ */ makeMap(`passive,once,capture`);
const isNonKeyModifier = /* @__PURE__ */ makeMap(
  // event propagation management
  `stop,prevent,self,ctrl,shift,alt,meta,exact,middle`
);
const maybeKeyModifier = /* @__PURE__ */ makeMap("left,right");
const isKeyboardEvent = /* @__PURE__ */ makeMap(`onkeyup,onkeydown,onkeypress`);
const resolveModifiers = (key, modifiers, context, loc) => {
  const keyModifiers = [];
  const nonKeyModifiers = [];
  const eventOptionModifiers = [];
  for (let i = 0; i < modifiers.length; i++) {
    const modifier = modifiers[i].content;
    if (modifier === "native" && checkCompatEnabled(
      "COMPILER_V_ON_NATIVE",
      context,
      loc
    )) {
      eventOptionModifiers.push(modifier);
    } else if (isEventOptionModifier(modifier)) {
      eventOptionModifiers.push(modifier);
    } else {
      if (maybeKeyModifier(modifier)) {
        if (isStaticExp(key)) {
          if (isKeyboardEvent(key.content.toLowerCase())) {
            keyModifiers.push(modifier);
          } else {
            nonKeyModifiers.push(modifier);
          }
        } else {
          keyModifiers.push(modifier);
          nonKeyModifiers.push(modifier);
        }
      } else {
        if (isNonKeyModifier(modifier)) {
          nonKeyModifiers.push(modifier);
        } else {
          keyModifiers.push(modifier);
        }
      }
    }
  }
  return {
    keyModifiers,
    nonKeyModifiers,
    eventOptionModifiers
  };
};
const transformClick = (key, event) => {
  const isStaticClick = isStaticExp(key) && key.content.toLowerCase() === "onclick";
  return isStaticClick ? createSimpleExpression(event, true) : key.type !== 4 ? createCompoundExpression([
    `(`,
    key,
    `) === "onClick" ? "${event}" : (`,
    key,
    `)`
  ]) : key;
};
const transformOn = (dir, node, context) => {
  return transformOn$1(dir, node, context, (baseResult) => {
    const { modifiers } = dir;
    if (!modifiers.length) return baseResult;
    let { key, value: handlerExp } = baseResult.props[0];
    const { keyModifiers, nonKeyModifiers, eventOptionModifiers } = resolveModifiers(key, modifiers, context, dir.loc);
    if (nonKeyModifiers.includes("right")) {
      key = transformClick(key, `onContextmenu`);
    }
    if (nonKeyModifiers.includes("middle")) {
      key = transformClick(key, `onMouseup`);
    }
    if (nonKeyModifiers.length) {
      handlerExp = createCallExpression(context.helper(V_ON_WITH_MODIFIERS), [
        handlerExp,
        JSON.stringify(nonKeyModifiers)
      ]);
    }
    if (keyModifiers.length && // if event name is dynamic, always wrap with keys guard
    (!isStaticExp(key) || isKeyboardEvent(key.content.toLowerCase()))) {
      handlerExp = createCallExpression(context.helper(V_ON_WITH_KEYS), [
        handlerExp,
        JSON.stringify(keyModifiers)
      ]);
    }
    if (eventOptionModifiers.length) {
      const modifierPostfix = eventOptionModifiers.map(capitalize).join("");
      key = isStaticExp(key) ? createSimpleExpression(`${key.content}${modifierPostfix}`, true) : createCompoundExpression([`(`, key, `) + "${modifierPostfix}"`]);
    }
    return {
      props: [createObjectProperty(key, handlerExp)]
    };
  });
};
const transformShow = (dir, node, context) => {
  const { exp, loc } = dir;
  if (!exp) {
    context.onError(
      createDOMCompilerError(62, loc)
    );
  }
  return {
    props: [],
    needRuntime: context.helper(V_SHOW)
  };
};
const transformTransition = (node, context) => {
  if (node.type === 1 && node.tagType === 1) {
    const component = context.isBuiltInComponent(node.tag);
    if (component === TRANSITION) {
      return () => {
        if (!node.children.length) {
          return;
        }
        if (hasMultipleChildren(node)) {
          context.onError(
            createDOMCompilerError(
              63,
              {
                start: node.children[0].loc.start,
                end: node.children[node.children.length - 1].loc.end,
                source: ""
              }
            )
          );
        }
        const child = node.children[0];
        if (child.type === 1) {
          for (const p of child.props) {
            if (p.type === 7 && p.name === "show") {
              node.props.push({
                type: 6,
                name: "persisted",
                nameLoc: node.loc,
                value: void 0,
                loc: node.loc
              });
            }
          }
        }
      };
    }
  }
};
function hasMultipleChildren(node) {
  const children = node.children = node.children.filter(
    (c) => !isCommentOrWhitespace(c)
  );
  const child = children[0];
  return children.length !== 1 || child.type === 11 || child.type === 9 && child.branches.some(hasMultipleChildren);
}
const ignoreSideEffectTags = (node, context) => {
  if (node.type === 1 && node.tagType === 0 && (node.tag === "script" || node.tag === "style")) {
    context.removeNode();
  }
};
function isValidHTMLNesting(parent, child) {
  if (parent === "template") {
    return true;
  }
  if (parent in onlyValidChildren) {
    return onlyValidChildren[parent].has(child);
  }
  if (child in onlyValidParents) {
    return onlyValidParents[child].has(parent);
  }
  if (parent in knownInvalidChildren) {
    if (knownInvalidChildren[parent].has(child)) return false;
  }
  if (child in knownInvalidParents) {
    if (knownInvalidParents[child].has(parent)) return false;
  }
  return true;
}
const headings = /* @__PURE__ */ new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const emptySet = /* @__PURE__ */ new Set([]);
const onlyValidChildren = {
  head: /* @__PURE__ */ new Set([
    "base",
    "basefront",
    "bgsound",
    "link",
    "meta",
    "title",
    "noscript",
    "noframes",
    "style",
    "script",
    "template"
  ]),
  optgroup: /* @__PURE__ */ new Set(["option"]),
  select: /* @__PURE__ */ new Set(["optgroup", "option", "hr"]),
  // table
  table: /* @__PURE__ */ new Set(["caption", "colgroup", "tbody", "tfoot", "thead"]),
  tr: /* @__PURE__ */ new Set(["td", "th"]),
  colgroup: /* @__PURE__ */ new Set(["col"]),
  tbody: /* @__PURE__ */ new Set(["tr"]),
  thead: /* @__PURE__ */ new Set(["tr"]),
  tfoot: /* @__PURE__ */ new Set(["tr"]),
  // these elements can not have any children elements
  script: emptySet,
  iframe: emptySet,
  option: emptySet,
  textarea: emptySet,
  style: emptySet,
  title: emptySet
};
const onlyValidParents = {
  // sections
  html: emptySet,
  body: /* @__PURE__ */ new Set(["html"]),
  head: /* @__PURE__ */ new Set(["html"]),
  // table
  td: /* @__PURE__ */ new Set(["tr"]),
  colgroup: /* @__PURE__ */ new Set(["table"]),
  caption: /* @__PURE__ */ new Set(["table"]),
  tbody: /* @__PURE__ */ new Set(["table"]),
  tfoot: /* @__PURE__ */ new Set(["table"]),
  col: /* @__PURE__ */ new Set(["colgroup"]),
  th: /* @__PURE__ */ new Set(["tr"]),
  thead: /* @__PURE__ */ new Set(["table"]),
  tr: /* @__PURE__ */ new Set(["tbody", "thead", "tfoot"]),
  // data list
  dd: /* @__PURE__ */ new Set(["dl", "div"]),
  dt: /* @__PURE__ */ new Set(["dl", "div"]),
  // other
  figcaption: /* @__PURE__ */ new Set(["figure"]),
  // li: new Set(["ul", "ol"]),
  summary: /* @__PURE__ */ new Set(["details"]),
  area: /* @__PURE__ */ new Set(["map"])
};
const knownInvalidChildren = {
  p: /* @__PURE__ */ new Set([
    "address",
    "article",
    "aside",
    "blockquote",
    "center",
    "details",
    "dialog",
    "dir",
    "div",
    "dl",
    "fieldset",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "hr",
    "li",
    "main",
    "nav",
    "menu",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "ul"
  ]),
  svg: /* @__PURE__ */ new Set([
    "b",
    "blockquote",
    "br",
    "code",
    "dd",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "menu",
    "meta",
    "ol",
    "p",
    "pre",
    "ruby",
    "s",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "u",
    "ul",
    "var"
  ])
};
const knownInvalidParents = {
  a: /* @__PURE__ */ new Set(["a"]),
  button: /* @__PURE__ */ new Set(["button"]),
  dd: /* @__PURE__ */ new Set(["dd", "dt"]),
  dt: /* @__PURE__ */ new Set(["dd", "dt"]),
  form: /* @__PURE__ */ new Set(["form"]),
  li: /* @__PURE__ */ new Set(["li"]),
  h1: headings,
  h2: headings,
  h3: headings,
  h4: headings,
  h5: headings,
  h6: headings
};
const validateHtmlNesting = (node, context) => {
  if (node.type === 1 && node.tagType === 0 && context.parent && context.parent.type === 1 && context.parent.tagType === 0 && !isValidHTMLNesting(context.parent.tag, node.tag)) {
    const error = new SyntaxError(
      `<${node.tag}> cannot be child of <${context.parent.tag}>, according to HTML specifications. This can cause hydration errors or potentially disrupt future functionality.`
    );
    error.loc = node.loc;
    context.onWarn(error);
  }
};
const DOMNodeTransforms = [
  transformStyle,
  ...false ? [transformTransition, validateHtmlNesting] : []
];
const DOMDirectiveTransforms = {
  cloak: noopDirectiveTransform,
  html: transformVHtml,
  text: transformVText,
  model: transformModel,
  // override compiler-core
  on: transformOn,
  // override compiler-core
  show: transformShow
};
function compile(src, options = {}) {
  return baseCompile(
    src,
    extend({}, parserOptions, options, {
      nodeTransforms: [
        // ignore <script> and <tag>
        // this is not put inside DOMNodeTransforms because that list is used
        // by compiler-ssr to generate vnode fallback branches
        ignoreSideEffectTags,
        ...DOMNodeTransforms,
        ...options.nodeTransforms || []
      ],
      directiveTransforms: extend(
        {},
        DOMDirectiveTransforms,
        options.directiveTransforms || {}
      ),
      transformHoist: null
    })
  );
}
function parse(template, options = {}) {
  return baseParse(template, extend({}, parserOptions, options));
}

beforeMount(async ({ app }) => {
  const pinia = createPinia();
  app.use(pinia);
});


"use strict";

// packages/playwright-ct-core/src/injected/importRegistry.ts
function isImportRef(value) {
  return typeof value === "object" && value && value.__pw_type === "importRef";
}
var ImportRegistry = class {
  constructor() {
    this._registry = /* @__PURE__ */ new Map();
  }
  initialize(components) {
    for (const [name, value] of Object.entries(components))
      this._registry.set(name, value);
  }
  async resolveImportRef(importRef) {
    const importFunction = this._registry.get(importRef.id);
    if (!importFunction)
      throw new Error(`Unregistered component: ${importRef.id}. Following components are registered: ${[...this._registry.keys()]}`);
    let importedObject = await importFunction();
    if (!importedObject)
      throw new Error(`Could not resolve component: ${importRef.id}.`);
    if (importRef.property) {
      importedObject = importedObject[importRef.property];
      if (!importedObject)
        throw new Error(`Could not instantiate component: ${importRef.id}.${importRef.property}.`);
    }
    return importedObject;
  }
};

// packages/playwright-ct-core/src/injected/serializers.ts
function isFunctionRef(value) {
  return value && typeof value === "object" && value.__pw_type === "function";
}
async function unwrapObject(value) {
  return transformObjectAsync(value, async (v) => {
    if (isFunctionRef(v)) {
      const result = (...args) => {
        window.__ctDispatchFunction(v.ordinal, args);
      };
      return { result };
    }
    if (isImportRef(v))
      return { result: await window.__pwRegistry.resolveImportRef(v) };
  });
}
function transformObject(value, mapping) {
  const result = mapping(value);
  if (result)
    return result.result;
  if (value === null || typeof value !== "object")
    return value;
  if (value instanceof Date || value instanceof RegExp || value instanceof URL)
    return value;
  if (Array.isArray(value)) {
    const result3 = [];
    for (const item of value)
      result3.push(transformObject(item, mapping));
    return result3;
  }
  if ((value == null ? void 0 : value.__pw_type) === "jsx" && typeof value.type === "function") {
    throw new Error([
      `Component "${value.type.name}" cannot be mounted.`,
      `Most likely, this component is defined in the test file. Create a test story instead.`,
      `For more information, see https://playwright.dev/docs/test-components#test-stories.`
    ].join("\n"));
  }
  const result2 = {};
  for (const [key, prop] of Object.entries(value))
    result2[key] = transformObject(prop, mapping);
  return result2;
}
async function transformObjectAsync(value, mapping) {
  const result = await mapping(value);
  if (result)
    return result.result;
  if (value === null || typeof value !== "object")
    return value;
  if (value instanceof Date || value instanceof RegExp || value instanceof URL)
    return value;
  if (Array.isArray(value)) {
    const result3 = [];
    for (const item of value)
      result3.push(await transformObjectAsync(item, mapping));
    return result3;
  }
  const result2 = {};
  for (const [key, prop] of Object.entries(value))
    result2[key] = await transformObjectAsync(prop, mapping);
  return result2;
}

// packages/playwright-ct-core/src/injected/index.ts
window.__pwRegistry = new ImportRegistry();
window.__pwUnwrapObject = unwrapObject;
window.__pwTransformObject = transformObject;

/** @typedef {import('../playwright-ct-core/types/component').Component} Component */
/** @typedef {import('../playwright-ct-core/types/component').JsxComponent} JsxComponent */
/** @typedef {import('../playwright-ct-core/types/component').ObjectComponent} ObjectComponent */
/** @typedef {import('vue').Component} FrameworkComponent */

const __pwAllListeners = new Map();

/**
 * @param {any} component
 * @returns {component is ObjectComponent}
 */
function isObjectComponent(component) {
  return typeof component === 'object' && component && component.__pw_type === 'object-component';
}

/**
 * @param {any} component
 * @returns {component is JsxComponent}
 */
function isJsxComponent(component) {
  return typeof component === 'object' && component && component.__pw_type === 'jsx';
}

/**
 * @param {any} child
 */
function __pwCreateChild(child) {
  if (Array.isArray(child))
    return child.map(grandChild => __pwCreateChild(grandChild));
  if (isJsxComponent(child) || isObjectComponent(child))
    return __pwCreateWrapper(child);
  return child;
}

/**
 * Copied from: https://github.com/vuejs/test-utils/blob/main/src/utils/compileSlots.ts
 * Vue does not provide an easy way to compile template in "slot" mode
 * Since we do not want to rely on compiler internals and specify
 * transforms manually we create fake component invocation with the slot we
 * need and pick slots param from render function later. Fake component will
 * never be instantiated but it requires to be a component so compile
 * properly generate invocation. Since we do not want to monkey-patch
 * `resolveComponent` function we are just using one of built-in components.
 *
 * @param {string} html
 */
function __pwCreateSlot(html) {
  let template = html.trim();
  const hasWrappingTemplate = template && template.startsWith('<template');

  // allow content without `template` tag, for easier testing
  if (!hasWrappingTemplate)
    template = `<template #default="params">${template}</template>`;

  const { code } = compile(`<transition>${template}</transition>`, {
    mode: 'function',
    prefixIdentifiers: false
  });
  const createRenderFunction = new Function('Vue', code);
  const renderFn = createRenderFunction(__pwVue);
  return (ctx = {}) => {
    const result = renderFn(ctx);
    const slotName = Object.keys(result.children)[0];
    return result.children[slotName](ctx);
  };
}

/**
 * @param {string | string[]} slot
 */
function __pwSlotToFunction(slot) {
  if (typeof slot === 'string')
    return __pwCreateSlot(slot)();

  if (Array.isArray(slot))
    return slot.map(slot => __pwCreateSlot(slot)());

  throw Error(`Invalid slot received.`);
}

/**
 * @param {JsxComponent} component
 * @returns {any[] | undefined}
 */
function __pwJsxChildArray(component) {
  if (!component.props.children)
    return;
  if (Array.isArray(component.props.children))
    return component.props.children;
  return [component.props.children];
}

/**
 * @param {Component} component
 */
function __pwCreateComponent(component) {
  const isVueComponent = typeof component.type !== 'string';

  /**
   * @type {(import('vue').VNode | string)[]}
   */
  const children = [];
  /** @type {{[key: string]: any}} */
  const slots = {};
  const listeners = {};
  /** @type {{[key: string]: any}} */
  let props = {};

  if (component.__pw_type === 'jsx') {
    for (const child of __pwJsxChildArray(component) || []) {
      if (isJsxComponent(child) && child.type === 'template') {
        const slotProperty = Object.keys(child.props).find(k => k.startsWith('v-slot:'));
        const slot = slotProperty ? slotProperty.substring('v-slot:'.length) : 'default';
        slots[slot] = __pwJsxChildArray(child)?.map(__pwCreateChild);
      } else {
        children.push(__pwCreateChild(child));
      }
    }

    for (const [key, value] of Object.entries(component.props)) {
      if (key.startsWith('v-on:')) {
        const event = key.substring('v-on:'.length);
        if (isVueComponent)
          listeners[event] = value;
        else
          props[`on${event[0].toUpperCase()}${event.substring(1)}`] = value;
      } else {
        props[key] = value;
      }
    }
  }

  if (component.__pw_type === 'object-component') {
    // Vue test util syntax.
    for (const [key, value] of Object.entries(component.slots || {})) {
      if (key === 'default')
        children.push(__pwSlotToFunction(value));
      else
        slots[key] = __pwSlotToFunction(value);
    }
    props = component.props || {};
    for (const [key, value] of Object.entries(component.on || {}))
      listeners[key] = value;
  }

  let lastArg;
  if (Object.entries(slots).length) {
    lastArg = slots;
    if (children.length)
      slots.default = children;
  } else if (children.length) {
    lastArg = children;
  }

  return { Component: component.type, props, slots: lastArg, listeners };
}

/**
 * @param {any} slots
 */
function __pwWrapFunctions(slots) {
  /** @type {import('vue').ComponentInternalInstance['slots']} */
  const slotsWithRenderFunctions = {};
  if (!Array.isArray(slots)) {
    for (const [key, value] of Object.entries(slots || {}))
      slotsWithRenderFunctions[key] = () => [value];
  } else if (slots?.length) {
    slotsWithRenderFunctions['default'] = () => slots;
  }
  return slotsWithRenderFunctions;
}

/**
 * @param {Component} component
 * @returns {import('vue').VNode | string}
 */
function __pwCreateWrapper(component) {
  const { Component, props, slots, listeners } = __pwCreateComponent(component);
  // @ts-ignore
  const wrapper = h(Component, { ...props, ...listeners }, slots);
  __pwAllListeners.set(wrapper, listeners);
  return wrapper;
}

function __pwSetDevTools() {
  setDevtoolsHook({
    emit(eventType, ...payload) {
      if (eventType !== 'component:emit')
        return;

      const [, componentVM, event, eventArgs] = payload;
      for (const [wrapper, listeners] of __pwAllListeners) {
        if (wrapper.component !== componentVM)
          continue;
        const listener = listeners[event];
        if (!listener)
          return;
        listener(...eventArgs);
      }
    },
    on() {},
    off() {},
    once() {},
    appRecords: []
  }, {});
}

const __pwAppKey = Symbol('appKey');
const __pwWrapperKey = Symbol('wrapperKey');

window.playwrightMount = async (component, rootElement, hooksConfig) => {
  const app = createApp({
    render: () => {
      const wrapper = __pwCreateWrapper(component);
      rootElement[__pwWrapperKey] = wrapper;
      return wrapper;
    }
  });
  __pwSetDevTools();

  for (const hook of window.__pw_hooks_before_mount || [])
    await hook({ app, hooksConfig });
  const instance = app.mount(rootElement);
  rootElement[__pwAppKey] = app;

  for (const hook of window.__pw_hooks_after_mount || [])
    await hook({ app, hooksConfig, instance });
};

window.playwrightUnmount = async rootElement => {
  /** @type {import('vue').App<Element> | undefined} */
  const app = rootElement[__pwAppKey];
  if (!app)
    throw new Error('Component was not mounted');
  app.unmount();
  delete rootElement[__pwAppKey];
};

window.playwrightUpdate = async (rootElement, component) => {
  /** @type {import('vue').VNode | undefined} */
  const wrapper = rootElement[__pwWrapperKey];
  if (!wrapper)
    throw new Error('Component was not mounted');

  if (!wrapper.component)
    throw new Error('Updating a native HTML element is not supported');

  const { slots, listeners, props } = __pwCreateComponent(component);

  wrapper.component.slots = __pwWrapFunctions(slots);
  __pwAllListeners.set(wrapper, listeners);

  if (typeof slots !== 'undefined')
    wrapper.component.effect.run();

  for (const [key, value] of Object.entries(props))
    wrapper.component.props[key] = value;

  if (!Object.keys(props).length)
    wrapper.component.update();
};

const _home_sonavin_Code_AAA_Online_Enrollment_System_frontend_src_components_enrollments_EnrollmentActionModal_vue = () => __vitePreload(() => import('./EnrollmentActionModal-C0RtPN3-.js'),true              ?__vite__mapDeps([0,1]):void 0).then((mod) => mod.default);
__pwRegistry.initialize({ _home_sonavin_Code_AAA_Online_Enrollment_System_frontend_src_components_enrollments_EnrollmentActionModal_vue });

export { Fragment$1 as F, Transition as T, createBlock as a, withCtx as b, computed as c, createElementBlock as d, normalizeClass as e, createBaseVNode as f, renderSlot as g, createTextVNode as h, createCommentVNode as i, withModifiers as j, createVNode as k, ref as l, nextTick as m, normalizeStyle as n, openBlock as o, onMounted as p, onUnmounted as q, reactive as r, renderList as s, toDisplayString as t, Teleport as u, withDirectives as v, watch as w, vModelText as x };
//# sourceMappingURL=index-91-WX5-W.js.map
