import { r as reactive, c as computed, w as watch, o as openBlock, a as createBlock, T as Transition, b as withCtx, d as createElementBlock, n as normalizeStyle, e as normalizeClass, f as createBaseVNode, g as renderSlot, h as createTextVNode, t as toDisplayString, i as createCommentVNode, j as withModifiers, k as createVNode, l as ref, m as nextTick, p as onMounted, q as onUnmounted, F as Fragment, s as renderList, u as Teleport, v as withDirectives, x as vModelText } from './index-91-WX5-W.js';

function useForm(initialValues = {}, options = {}) {
  const form = reactive({ ...initialValues });
  const errors = reactive({});
  const shaking = reactive({});
  const timeouts = {};

  const { autoClear = 2000 } = options;

  const clearError = (field) => {
    if (field) {
      errors[field] = null;
      shaking[field] = false;
      if (timeouts[field]) {
        clearTimeout(timeouts[field]);
        delete timeouts[field];
      }
    } else {
      Object.keys(errors).forEach((key) => {
        errors[key] = null;
        shaking[key] = false;
      });
      Object.keys(timeouts).forEach((key) => {
        clearTimeout(timeouts[key]);
        delete timeouts[key];
      });
    }
  };

  /**
   * Triggers the shake animation and schedules automatic clearing of errors
   */
  const triggerFeedback = (field) => {
    // 1. Shake animation
    shaking[field] = false;
    setTimeout(() => {
      shaking[field] = true;
      setTimeout(() => {
        shaking[field] = false;
      }, 400);
    }, 10);

    // 2. Schedule error clearing
    if (autoClear > 0) {
      if (timeouts[field]) clearTimeout(timeouts[field]);
      timeouts[field] = setTimeout(() => {
        errors[field] = null;
        delete timeouts[field];
      }, autoClear);
    }
  };

  /**
   * Resets the entire form and validation state
   */
  const resetForm = (newValues = initialValues) => {
    clearError();
    Object.keys(form).forEach((key) => {
      form[key] = newValues[key] !== undefined ? newValues[key] : initialValues[key];
    });
  };

  /**
   * Universal Validate Function
   */
  const validate = (options = {}) => {
    let isValid = true;
    const { required = [], custom = {} } = options;

    required.forEach((field) => {
      const val = form[field];
      if (
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0)
      ) {
        errors[field] = 'This field is required';
        triggerFeedback(field);
        isValid = false;
      }
    });

    Object.entries(custom).forEach(([field, validator]) => {
      const result = validator(form[field]);
      // If result is a string, it's an error message
      if (typeof result === 'string') {
        errors[field] = result;
        triggerFeedback(field);
        isValid = false;
      }
    });

    return isValid
  };

  return {
    form,
    errors,
    shaking,
    validate,
    clearError,
    triggerShake: triggerFeedback, // maintain backward compatibility but rename internally
    resetForm,
  }
}

/**
 * A generic composable for managing Action Modal state, synchronization, and validation
 * @param {Object} props - Modal component props (requires isOpen)
 * @param {Function} emit - Modal component emit function
 * @param {Object} options - Configuration options
 * @param {Function} options.getInitialData - Returns empty state template
 * @param {Function} options.mapSourceToForm - Maps props source to form data
 * @param {String} options.sourceKey - The prop name to watch for internal changes (e.g. 'enrollment')
 * @param {Object} options.validationRules - Custom validation rules for useForm
 * @param {Number} options.autoClear - Override default error clearing timeout
 */
function useActionModal(props, emit, options = {}) {
  const getInitial = () => (options.getInitialData ? options.getInitialData() : {});

  // Initialize unified form and validation state
  // We use the useForm composable to handle errors, shaking, and automated cleanup
  const {
    form: localData,
    errors,
    shaking,
    validate,
    clearError,
    triggerShake,
    resetForm,
  } = useForm(getInitial(), {
    autoClear: options.autoClear || 2000,
  });

  // We maintain originalData to detect dirty state (unsaved changes)
  const { form: originalData, resetForm: resetOriginal } = useForm(getInitial());

  // Detect unsaved changes for UI feedback (simple JSON comparison for flat-ish objects)
  const isDirty = computed(() => {
    return JSON.stringify(localData) !== JSON.stringify(originalData)
  });

  // Deep clone utility to prevent reference mutations
  const clone = (data) => (data ? JSON.parse(JSON.stringify(data)) : getInitial());

  const sync = () => {
    const data = options.mapSourceToForm ? options.mapSourceToForm() : getInitial();
    Object.assign(localData, clone(data));
    Object.assign(originalData, clone(data));
  };

  // Handle Modal Open/Close lifecycle
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        sync();
      } else {
        resetForm();
        resetOriginal();
      }
    },
    { immediate: true },
  );

  // Optional: Watch for source changes if the source prop is provided
  if (options.sourceKey) {
    watch(
      () => props[options.sourceKey],
      (newSource) => {
        if (props.isOpen && newSource) {
          sync();
        }
      },
      { deep: true },
    );
  }

  /**
   * Enhanced submit that performs validation before emitting
   * @param {Object} validationOptions - Validation rules { required: [], custom: {} }
   */
  const executeSubmit = (validationOptions = null) => {
    if (validationOptions) {
      if (!validate(validationOptions)) return false
    }
    emit('submit', clone(localData));
    return true
  };

  return {
    localData,
    originalData,
    isDirty,
    errors,
    shaking,
    validate,
    clearError,
    triggerShake,
    resetForm,
    submitForm: executeSubmit,
    sync,
  }
}

const back = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='currentColor'%20stroke-width='2.5'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cline%20x1='19'%20y1='12'%20x2='5'%20y2='12'%3e%3c/line%3e%3cpolyline%20points='12%2019%205%2012%2012%205'%3e%3c/polyline%3e%3c/svg%3e";

const __vite_glob_0_0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: back
}, Symbol.toStringTag, { value: 'Module' }));

const bellSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M9.00195%2017H5.60636C4.34793%2017%203.71872%2017%203.58633%2016.9023C3.4376%2016.7925%203.40126%2016.7277%203.38515%2016.5436C3.37082%2016.3797%203.75646%2015.7486%204.52776%2014.4866C5.32411%2013.1835%206.00031%2011.2862%206.00031%208.6C6.00031%207.11479%206.63245%205.69041%207.75766%204.6402C8.88288%203.59%2010.409%203%2012.0003%203C13.5916%203%2015.1177%203.59%2016.2429%204.6402C17.3682%205.69041%2018.0003%207.11479%2018.0003%208.6C18.0003%2011.2862%2018.6765%2013.1835%2019.4729%2014.4866C20.2441%2015.7486%2020.6298%2016.3797%2020.6155%2016.5436C20.5994%2016.7277%2020.563%2016.7925%2020.4143%2016.9023C20.2819%2017%2019.6527%2017%2018.3943%2017H15.0003M9.00195%2017L9.00031%2018C9.00031%2019.6569%2010.3435%2021%2012.0003%2021C13.6572%2021%2015.0003%2019.6569%2015.0003%2018V17M9.00195%2017H15.0003'%20stroke='%23000000'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e";

const __vite_glob_0_1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: bellSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const cancel = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20viewBox='0%200%20600%20600'%20version='1.1'%20id='svg9724'%20sodipodi:docname='cancel-circle.svg'%20inkscape:version='1.2.2%20(1:1.2.2+202212051550+b0a8486541)'%20width='600'%20height='600'%20xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape'%20xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:svg='http://www.w3.org/2000/svg'%3e%3cdefs%20id='defs9728'%20/%3e%3csodipodi:namedview%20id='namedview9726'%20pagecolor='%23ffffff'%20bordercolor='%23666666'%20borderopacity='1.0'%20inkscape:showpageshadow='2'%20inkscape:pageopacity='0.0'%20inkscape:pagecheckerboard='0'%20inkscape:deskcolor='%23d1d1d1'%20showgrid='true'%20inkscape:zoom='0.42059315'%20inkscape:cx='139.08928'%20inkscape:cy='495.72847'%20inkscape:window-width='1920'%20inkscape:window-height='1009'%20inkscape:window-x='0'%20inkscape:window-y='1080'%20inkscape:window-maximized='1'%20inkscape:current-layer='g10449'%20showguides='true'%3e%3cinkscape:grid%20type='xygrid'%20id='grid9972'%20originx='0'%20originy='0'%20/%3e%3c/sodipodi:namedview%3e%3cg%20id='g10449'%20transform='matrix(0.95173205,0,0,0.95115787,13.901174,12.168794)'%20style='stroke-width:1.05103'%3e%3cg%20id='path10026'%20inkscape:transform-center-x='-0.59233046'%20inkscape:transform-center-y='-20.347403'%20transform='matrix(1.3807551,0,0,1.2700888,273.60014,263.99768)'%20/%3e%3cg%20id='g11314'%20transform='matrix(1.5092301,0,0,1.3955555,36.774048,-9.4503933)'%20style='stroke-width:50.6951'%20/%3e%3cpath%20style='color:%23000000;fill:%23000000;stroke-linecap:round;stroke-linejoin:round;-inkscape-stroke:none;paint-order:stroke%20fill%20markers'%20d='m%20300.60937,-12.792969%20c%20-173.60599,0%20-315.214839,141.724839%20-315.214839,315.404299%200,173.67945%20141.608849,315.40429%20315.214839,315.40429%20173.606,0%20315.21485,-141.72484%20315.21485,-315.40429%200,-173.67946%20-141.60885,-315.404299%20-315.21485,-315.404299%20z%20m%200,84.082031%20c%20128.13278,10e-7%20231.13086,103.052738%20231.13086,231.322268%200,128.26952%20-102.99808,231.32226%20-231.13086,231.32226%20C%20172.4766,533.93359%2069.476562,430.88085%2069.476562,302.61133%2069.476563,174.3418%20172.4766,71.289062%20300.60937,71.289062%20Z'%20id='path390'%20/%3e%3cpath%20style='color:%23000000;fill:%23000000;stroke-linecap:round;stroke-linejoin:round;-inkscape-stroke:none'%20d='M%20416.16211,144.93164%20A%2042.041401,42.041401%200%200%200%20386.4375,157.25391%20L%20155.30469,388.53125%20a%2042.041401,42.041401%200%200%200%200.0195,59.45703%2042.041401,42.041401%200%200%200%2059.45508,-0.0195%20L%20445.91211,216.69141%20a%2042.041401,42.041401%200%200%200%20-0.0195,-59.45704%2042.041401,42.041401%200%200%200%20-29.73047,-12.30273%20z'%20id='path446'%20/%3e%3cpath%20style='color:%23000000;fill:%23000000;stroke-linecap:round;stroke-linejoin:round;-inkscape-stroke:none'%20d='m%20185.05664,144.93164%20a%2042.041401,42.041401%200%200%200%20-29.73242,12.30273%2042.041401,42.041401%200%200%200%20-0.0195,59.45704%20L%20386.4375,447.96875%20a%2042.041401,42.041401%200%200%200%2059.45508,0.0195%2042.041401,42.041401%200%200%200%200.0195,-59.45703%20L%20214.7793,157.25391%20a%2042.041401,42.041401%200%200%200%20-29.72266,-12.32227%20z'%20id='path446-3'%20/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cancel
}, Symbol.toStringTag, { value: 'Module' }));

const cash = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='iso-8859-1'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3csvg%20fill='%23000000'%20height='800px'%20width='800px'%20version='1.1'%20id='Capa_1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='0%200%20429.334%20429.334'%20xml:space='preserve'%3e%3cg%3e%3cpath%20d='M226.378,241.468c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5c0-12.123-8.122-22.379-19.209-25.629v-2.479%20c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5v2.479c-11.087,3.25-19.209,13.506-19.209,25.629c0,12.124,8.122,22.38,19.209,25.63%20v21.768c-2.57-2.149-4.209-5.376-4.209-8.98c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5c0,12.123,8.122,22.379,19.209,25.629%20v2.479c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5v-2.479c11.087-3.25,19.209-13.506,19.209-25.629s-8.122-22.379-19.209-25.629%20v-21.769C224.739,234.637,226.378,237.863,226.378,241.468z%20M202.96,241.468c0-3.604,1.639-6.831,4.209-8.98v17.961%20C204.599,248.299,202.96,245.072,202.96,241.468z%20M226.378,279.885c0,3.604-1.639,6.831-4.209,8.98v-17.96%20C224.739,273.054,226.378,276.281,226.378,279.885z'/%3e%3cpath%20d='M429.329,62.028c0-8.284-6.716-15-15-15H15c-8.284,0-15,6.716-15,15l0.004,305.279c0,8.284,6.716,15,15,15h399.33%20c8.284,0,15-6.716,15-15L429.329,62.028z%20M349.461,352.306H79.877c-5.709-24.695-25.179-44.165-49.873-49.874V218.92%20c24.694-5.709,44.164-25.179,49.873-49.874h269.584c5.708,24.693,25.176,44.162,49.868,49.872v56.369v27.147%20C374.637,308.144,355.169,327.614,349.461,352.306z%20M59.11,169.046c-4.653,13.644-15.462,24.454-29.106,29.107v-29.107H59.11z%20M73.966,139.046c2.625-5.01,4.615-10.349,5.903-15.889h269.6c1.288,5.539,3.278,10.879,5.904,15.889H73.966z%20M399.329,169.046%20v29.105c-13.642-4.654-24.449-15.463-29.102-29.105H399.329z%20M399.329,139.046H379.49c-4.107-4.642-7.24-10.052-9.234-15.889%20h29.073V139.046z%20M73.838,93.157c2.688-5.08,4.722-10.501,6.031-16.13h269.6c1.309,5.629,3.343,11.05,6.031,16.13H73.838z%20M59.083,123.157c-1.994,5.837-5.127,11.246-9.234,15.889H30v-15.889H59.083z%20M399.329,93.157H379.71%20c-4.213-4.696-7.424-10.191-9.453-16.13h29.073V93.157z%20M59.082,77.028c-2.029,5.939-5.24,11.434-9.452,16.13H30v-16.13H59.082z%20M30.004,323.199c13.644,4.653,24.453,15.463,29.106,29.107H30.004V323.199z%20M370.228,352.306%20c4.653-13.644,15.462-24.454,29.106-29.107v29.107H370.228z'/%3e%3cpath%20d='M214.669,177.417c-45.909,0-83.259,37.35-83.259,83.259s37.35,83.259,83.259,83.259s83.259-37.35,83.259-83.259%20S260.578,177.417,214.669,177.417z%20M214.669,323.935c-34.881,0-63.259-28.378-63.259-63.259c0-34.881,28.378-63.259,63.259-63.259%20s63.259,28.378,63.259,63.259C277.928,295.557,249.55,323.935,214.669,323.935z'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cash
}, Symbol.toStringTag, { value: 'Module' }));

const close = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M5.29289%205.29289C5.68342%204.90237%206.31658%204.90237%206.70711%205.29289L12%2010.5858L17.2929%205.29289C17.6834%204.90237%2018.3166%204.90237%2018.7071%205.29289C19.0976%205.68342%2019.0976%206.31658%2018.7071%206.70711L13.4142%2012L18.7071%2017.2929C19.0976%2017.6834%2019.0976%2018.3166%2018.7071%2018.7071C18.3166%2019.0976%2017.6834%2019.0976%2017.2929%2018.7071L12%2013.4142L6.70711%2018.7071C6.31658%2019.0976%205.68342%2019.0976%205.29289%2018.7071C4.90237%2018.3166%204.90237%2017.6834%205.29289%2017.2929L10.5858%2012L5.29289%206.70711C4.90237%206.31658%204.90237%205.68342%205.29289%205.29289Z'%20fill='%230F1729'/%3e%3c/svg%3e";

const __vite_glob_0_4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: close
}, Symbol.toStringTag, { value: 'Module' }));

const cloudUpload = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M21.96%2013.4199C21.8233%2012.3214%2021.326%2011.2993%2020.546%2010.5139C19.766%209.72844%2018.7474%209.22406%2017.65%209.07977C17.1768%207.75468%2016.2529%206.63824%2015.0399%205.92523C13.8269%205.21223%2012.4019%204.94801%2011.0139%205.17914C9.62597%205.41026%208.36341%206.12202%207.4469%207.18964C6.53039%208.25726%206.01826%209.61302%206%2011.02C4.93913%2011.02%203.92172%2011.4412%203.17157%2012.1913C2.42142%2012.9415%202%2013.9591%202%2015.02C2%2016.0808%202.42142%2017.0982%203.17157%2017.8483C3.92172%2018.5985%204.93913%2019.02%206%2019.02H12'%20stroke='%23000000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M18.7793%2023V15'%20stroke='%23000000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M15.5801%2018.2L18.7801%2015L21.98%2018.2'%20stroke='%23000000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e";

const __vite_glob_0_5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cloudUpload
}, Symbol.toStringTag, { value: 'Module' }));

const deactivateSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3ccircle%20cx='12'%20cy='12'%20r='9'%20stroke='%2333363F'%20stroke-width='2'/%3e%3cpath%20d='M18%2018L6%206'%20stroke='%2333363F'%20stroke-width='2'/%3e%3c/svg%3e";

const __vite_glob_0_6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: deactivateSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const _delete = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M5.755,20.283,4,8H20L18.245,20.283A2,2,0,0,1,16.265,22H7.735A2,2,0,0,1,5.755,20.283ZM21,4H16V3a1,1,0,0,0-1-1H9A1,1,0,0,0,8,3V4H3A1,1,0,0,0,3,6H21a1,1,0,0,0,0-2Z'/%3e%3c/svg%3e";

const __vite_glob_0_7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _delete
}, Symbol.toStringTag, { value: 'Module' }));

const download = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='0%200%2032%2032'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3edownload-cloud%3c/title%3e%3cpath%20d='M0%2016q0%202.912%201.824%205.088t4.576%202.752q0.032%200%200.032-0.032v-0.064t0.032-0.032q0.544-1.344%201.344-2.176t2.208-1.184v-2.336q0-2.496%201.728-4.256t4.256-1.76%204.256%201.76%201.76%204.256v2.336q1.376%200.384%202.176%201.216t1.344%202.144l0.096%200.288h0.384q2.464%200%204.224-1.76t1.76-4.224v-2.016q0-2.464-1.76-4.224t-4.224-1.76q-0.096%200-0.32%200.032%200.32-1.152%200.32-2.048%200-3.296-2.368-5.632t-5.632-2.368q-2.88%200-5.056%201.824t-2.784%204.544q-1.152-0.352-2.176-0.352-3.296%200-5.664%202.336t-2.336%205.664v1.984zM10.016%2025.824q-0.096%200.928%200.576%201.6l4%204q0.576%200.576%201.408%200.576t1.408-0.576l4-4q0.672-0.672%200.608-1.6-0.064-0.32-0.16-0.576-0.224-0.576-0.736-0.896t-1.12-0.352h-1.984v-5.984q0-0.832-0.608-1.408t-1.408-0.608-1.408%200.608-0.576%201.408v5.984h-2.016q-0.608%200-1.12%200.352t-0.736%200.896q-0.096%200.288-0.128%200.576z'%3e%3c/path%3e%3c/svg%3e";

const __vite_glob_0_8 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: download
}, Symbol.toStringTag, { value: 'Module' }));

const edit = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='iso-8859-1'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3csvg%20fill='%23000000'%20version='1.1'%20id='Capa_1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20width='800px'%20height='800px'%20viewBox='0%200%20860.632%20860.632'%20xml:space='preserve'%3e%3cg%3e%3cg%3e%3cpath%20d='M515.582,157.916l-439.199,439.2l4.6,10.1l27.1,58.8l41.6,22c9.8,5.2,17.7,13.101,22.9,22.9l22,41.6l58.8,27.101%20l10.101,4.6l439.2-439.2L515.582,157.916z'/%3e%3cpath%20d='M853.282,159.216l-151.8-151.8c-4.9-4.9-11.3-7.3-17.7-7.3s-12.8,2.4-17.7,7.3l-129.3,129.3l187.2,187.2l129.3-129.3%20C863.082,184.816,863.082,169.016,853.282,159.216z'/%3e%3cpath%20d='M46.083,650.016l-4.3,16.9l-41,162.5c-4.1,16.2,8.5,31.1,24.1,31.1c2,0,4.1-0.3,6.2-0.8l162.5-41l16.9-4.3l16.9-4.3%20l13.3-3.4l-30.9-14.2l-29.5-13.5c-5-2.3-9.1-6.199-11.7-11l-18.6-35.1l-4.3-8c-2.3-4.4-6-8.1-10.4-10.4l-8-4.3l-35.1-18.6%20c-4.9-2.601-8.7-6.7-11-11.7l-13.5-29.5l-14.2-30.9l-3.4,13.301L46.083,650.016z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: edit
}, Symbol.toStringTag, { value: 'Module' }));

const email = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20height='800px'%20width='800px'%20version='1.1'%20id='_x32_'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='0%200%20512%20512'%20xml:space='preserve'%3e%3cstyle%20type='text/css'%3e%20.st0{fill:%23000000;}%20%3c/style%3e%3cg%3e%3cpath%20class='st0'%20d='M440.917,67.925H71.083C31.827,67.925,0,99.752,0,139.008v233.984c0,39.256,31.827,71.083,71.083,71.083%20h369.834c39.255,0,71.083-31.827,71.083-71.083V139.008C512,99.752,480.172,67.925,440.917,67.925z%20M178.166,321.72l-99.54,84.92%20c-7.021,5.992-17.576,5.159-23.567-1.869c-5.992-7.021-5.159-17.576,1.87-23.567l99.54-84.92c7.02-5.992,17.574-5.159,23.566,1.87%20C186.027,305.174,185.194,315.729,178.166,321.72z%20M256,289.436c-13.314-0.033-26.22-4.457-36.31-13.183l0.008,0.008l-0.032-0.024%20c0.008,0.008,0.017,0.008,0.024,0.016L66.962,143.694c-6.98-6.058-7.723-16.612-1.674-23.583c6.057-6.98,16.612-7.723,23.582-1.674%20l152.771,132.592c3.265,2.906,8.645,5.004,14.359,4.971c5.706,0.017,10.995-2.024,14.44-5.028l0.074-0.065l152.615-132.469%20c6.971-6.049,17.526-5.306,23.583,1.674c6.048,6.97,5.306,17.525-1.674,23.583l-152.77,132.599%20C282.211,284.929,269.322,289.419,256,289.436z%20M456.948,404.771c-5.992,7.028-16.547,7.861-23.566,1.869l-99.54-84.92%20c-7.028-5.992-7.861-16.546-1.869-23.566c5.991-7.029,16.546-7.861,23.566-1.87l99.54,84.92%20C462.107,387.195,462.94,397.75,456.948,404.771z'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_10 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: email
}, Symbol.toStringTag, { value: 'Module' }));

const eyeClose = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M2.68936%206.70456C2.52619%206.32384%202.08528%206.14747%201.70456%206.31064C1.32384%206.47381%201.14747%206.91472%201.31064%207.29544L2.68936%206.70456ZM15.5872%2013.3287L15.3125%2012.6308L15.5872%2013.3287ZM9.04145%2013.7377C9.26736%2013.3906%209.16904%2012.926%208.82185%2012.7001C8.47466%2012.4742%208.01008%2012.5725%207.78417%2012.9197L9.04145%2013.7377ZM6.37136%2015.091C6.14545%2015.4381%206.24377%2015.9027%206.59096%2016.1286C6.93815%2016.3545%207.40273%2016.2562%207.62864%2015.909L6.37136%2015.091ZM22.6894%207.29544C22.8525%206.91472%2022.6762%206.47381%2022.2954%206.31064C21.9147%206.14747%2021.4738%206.32384%2021.3106%206.70456L22.6894%207.29544ZM19%2011.1288L18.4867%2010.582V10.582L19%2011.1288ZM19.9697%2013.1592C20.2626%2013.4521%2020.7374%2013.4521%2021.0303%2013.1592C21.3232%2012.8663%2021.3232%2012.3914%2021.0303%2012.0985L19.9697%2013.1592ZM11.25%2016.5C11.25%2016.9142%2011.5858%2017.25%2012%2017.25C12.4142%2017.25%2012.75%2016.9142%2012.75%2016.5H11.25ZM16.3714%2015.909C16.5973%2016.2562%2017.0619%2016.3545%2017.409%2016.1286C17.7562%2015.9027%2017.8545%2015.4381%2017.6286%2015.091L16.3714%2015.909ZM5.53033%2011.6592C5.82322%2011.3663%205.82322%2010.8914%205.53033%2010.5985C5.23744%2010.3056%204.76256%2010.3056%204.46967%2010.5985L5.53033%2011.6592ZM2.96967%2012.0985C2.67678%2012.3914%202.67678%2012.8663%202.96967%2013.1592C3.26256%2013.4521%203.73744%2013.4521%204.03033%2013.1592L2.96967%2012.0985ZM12%2013.25C8.77611%2013.25%206.46133%2011.6446%204.9246%209.98966C4.15645%209.16243%203.59325%208.33284%203.22259%207.71014C3.03769%207.3995%202.90187%207.14232%202.8134%206.96537C2.76919%206.87696%202.73689%206.80875%202.71627%206.76411C2.70597%206.7418%202.69859%206.7254%202.69411%206.71533C2.69187%206.7103%202.69036%206.70684%202.68957%206.70503C2.68917%206.70413%202.68896%206.70363%202.68892%206.70355C2.68891%206.70351%202.68893%206.70357%202.68901%206.70374C2.68904%206.70382%202.68913%206.70403%202.68915%206.70407C2.68925%206.7043%202.68936%206.70456%202%207C1.31064%207.29544%201.31077%207.29575%201.31092%207.29609C1.31098%207.29624%201.31114%207.2966%201.31127%207.2969C1.31152%207.29749%201.31183%207.2982%201.31218%207.299C1.31287%207.30062%201.31376%207.30266%201.31483%207.30512C1.31698%207.31003%201.31988%207.31662%201.32353%207.32483C1.33083%207.34125%201.34115%207.36415%201.35453%207.39311C1.38127%207.45102%201.42026%207.5332%201.47176%207.63619C1.57469%207.84206%201.72794%208.13175%201.93366%208.47736C2.34425%209.16716%202.96855%2010.0876%203.8254%2011.0103C5.53867%2012.8554%208.22389%2014.75%2012%2014.75V13.25ZM15.3125%2012.6308C14.3421%2013.0128%2013.2417%2013.25%2012%2013.25V14.75C13.4382%2014.75%2014.7246%2014.4742%2015.8619%2014.0266L15.3125%2012.6308ZM7.78417%2012.9197L6.37136%2015.091L7.62864%2015.909L9.04145%2013.7377L7.78417%2012.9197ZM22%207C21.3106%206.70456%2021.3107%206.70441%2021.3108%206.70427C21.3108%206.70423%2021.3108%206.7041%2021.3109%206.70402C21.3109%206.70388%2021.311%206.70376%2021.311%206.70368C21.3111%206.70352%2021.3111%206.70349%2021.3111%206.7036C21.311%206.7038%2021.3107%206.70452%2021.3101%206.70576C21.309%206.70823%2021.307%206.71275%2021.3041%206.71924C21.2983%206.73223%2021.2889%206.75309%2021.2758%206.78125C21.2495%206.83757%2021.2086%206.92295%2021.1526%207.03267C21.0406%207.25227%2020.869%207.56831%2020.6354%207.9432C20.1669%208.69516%2019.4563%209.67197%2018.4867%2010.582L19.5133%2011.6757C20.6023%2010.6535%2021.3917%209.56587%2021.9085%208.73646C22.1676%208.32068%2022.36%207.9668%2022.4889%207.71415C22.5533%207.58775%2022.602%207.48643%2022.6353%207.41507C22.6519%207.37939%2022.6647%207.35118%2022.6737%207.33104C22.6782%207.32097%2022.6818%207.31292%2022.6844%207.30696C22.6857%207.30398%2022.6867%207.30153%2022.6876%207.2996C22.688%207.29864%2022.6883%207.29781%2022.6886%207.29712C22.6888%207.29677%2022.6889%207.29646%2022.689%207.29618C22.6891%207.29604%2022.6892%207.29585%2022.6892%207.29578C22.6893%207.29561%2022.6894%207.29544%2022%207ZM18.4867%2010.582C17.6277%2011.3882%2016.5739%2012.1343%2015.3125%2012.6308L15.8619%2014.0266C17.3355%2013.4466%2018.5466%2012.583%2019.5133%2011.6757L18.4867%2010.582ZM18.4697%2011.6592L19.9697%2013.1592L21.0303%2012.0985L19.5303%2010.5985L18.4697%2011.6592ZM11.25%2014V16.5H12.75V14H11.25ZM14.9586%2013.7377L16.3714%2015.909L17.6286%2015.091L16.2158%2012.9197L14.9586%2013.7377ZM4.46967%2010.5985L2.96967%2012.0985L4.03033%2013.1592L5.53033%2011.6592L4.46967%2010.5985Z'%20fill='%231C274C'/%3e%3c/svg%3e";

const __vite_glob_0_11 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: eyeClose
}, Symbol.toStringTag, { value: 'Module' }));

const eyeOpen = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M12%208.25C9.92893%208.25%208.25%209.92893%208.25%2012C8.25%2014.0711%209.92893%2015.75%2012%2015.75C14.0711%2015.75%2015.75%2014.0711%2015.75%2012C15.75%209.92893%2014.0711%208.25%2012%208.25ZM9.75%2012C9.75%2010.7574%2010.7574%209.75%2012%209.75C13.2426%209.75%2014.25%2010.7574%2014.25%2012C14.25%2013.2426%2013.2426%2014.25%2012%2014.25C10.7574%2014.25%209.75%2013.2426%209.75%2012Z'%20fill='%231C274C'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M12%203.25C7.48587%203.25%204.44529%205.9542%202.68057%208.24686L2.64874%208.2882C2.24964%208.80653%201.88206%209.28392%201.63269%209.8484C1.36564%2010.4529%201.25%2011.1117%201.25%2012C1.25%2012.8883%201.36564%2013.5471%201.63269%2014.1516C1.88206%2014.7161%202.24964%2015.1935%202.64875%2015.7118L2.68057%2015.7531C4.44529%2018.0458%207.48587%2020.75%2012%2020.75C16.5141%2020.75%2019.5547%2018.0458%2021.3194%2015.7531L21.3512%2015.7118C21.7504%2015.1935%2022.1179%2014.7161%2022.3673%2014.1516C22.6344%2013.5471%2022.75%2012.8883%2022.75%2012C22.75%2011.1117%2022.6344%2010.4529%2022.3673%209.8484C22.1179%209.28391%2021.7504%208.80652%2021.3512%208.28818L21.3194%208.24686C19.5547%205.9542%2016.5141%203.25%2012%203.25ZM3.86922%209.1618C5.49864%207.04492%208.15036%204.75%2012%204.75C15.8496%204.75%2018.5014%207.04492%2020.1308%209.1618C20.5694%209.73159%2020.8263%2010.0721%2020.9952%2010.4545C21.1532%2010.812%2021.25%2011.2489%2021.25%2012C21.25%2012.7511%2021.1532%2013.188%2020.9952%2013.5455C20.8263%2013.9279%2020.5694%2014.2684%2020.1308%2014.8382C18.5014%2016.9551%2015.8496%2019.25%2012%2019.25C8.15036%2019.25%205.49864%2016.9551%203.86922%2014.8382C3.43064%2014.2684%203.17374%2013.9279%203.00476%2013.5455C2.84684%2013.188%202.75%2012.7511%202.75%2012C2.75%2011.2489%202.84684%2010.812%203.00476%2010.4545C3.17374%2010.0721%203.43063%209.73159%203.86922%209.1618Z'%20fill='%231C274C'/%3e%3c/svg%3e";

const __vite_glob_0_12 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: eyeOpen
}, Symbol.toStringTag, { value: 'Module' }));

const eyeView = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='0%200%2032%2032'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3eeye%3c/title%3e%3cpath%20d='M0%2016q0.064%200.128%200.16%200.352t0.48%200.928%200.832%201.344%201.248%201.536%201.664%201.696%202.144%201.568%202.624%201.344%203.136%200.896%203.712%200.352%203.712-0.352%203.168-0.928%202.592-1.312%202.144-1.6%201.664-1.632%201.248-1.6%200.832-1.312%200.48-0.928l0.16-0.352q-0.032-0.128-0.16-0.352t-0.48-0.896-0.832-1.344-1.248-1.568-1.664-1.664-2.144-1.568-2.624-1.344-3.136-0.896-3.712-0.352-3.712%200.352-3.168%200.896-2.592%201.344-2.144%201.568-1.664%201.664-1.248%201.568-0.832%201.344-0.48%200.928zM10.016%2016q0-2.464%201.728-4.224t4.256-1.76%204.256%201.76%201.76%204.224-1.76%204.256-4.256%201.76-4.256-1.76-1.728-4.256zM12%2016q0%201.664%201.184%202.848t2.816%201.152%202.816-1.152%201.184-2.848-1.184-2.816-2.816-1.184-2.816%201.184l2.816%202.816h-4z'%3e%3c/path%3e%3c/svg%3e";

const __vite_glob_0_13 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: eyeView
}, Symbol.toStringTag, { value: 'Module' }));

const filter = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M0%203H16V1H0V3Z'%20fill='%23000000'/%3e%3cpath%20d='M2%207H14V5H2V7Z'%20fill='%23000000'/%3e%3cpath%20d='M4%2011H12V9H4V11Z'%20fill='%23000000'/%3e%3cpath%20d='M10%2015H6V13H10V15Z'%20fill='%23000000'/%3e%3c/svg%3e";

const __vite_glob_0_14 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: filter
}, Symbol.toStringTag, { value: 'Module' }));

const pay = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3ctitle%3eic_fluent_payment_24_filled%3c/title%3e%3cdesc%3eCreated%20with%20Sketch.%3c/desc%3e%3cg%20id='🔍-Product-Icons'%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%3e%3cg%20id='ic_fluent_payment_24_filled'%20fill='%23212121'%20fill-rule='nonzero'%3e%3cpath%20d='M21.9883291,10.9947074%20L21.9888849,16.275793%20C21.9888849,17.7383249%2020.8471803,18.9341973%2019.4064072,19.0207742%20L19.2388849,19.025793%20L4.76104885,19.025793%20C3.29851702,19.025793%202.10264457,17.8840884%202.01606765,16.4433154%20L2.01104885,16.275793%20L2.01032912,10.9947074%20L21.9883291,10.9947074%20Z%20M18.2529045,14.5%20L15.7529045,14.5%20L15.6511339,14.5068466%20C15.2850584,14.556509%2015.0029045,14.8703042%2015.0029045,15.25%20C15.0029045,15.6296958%2015.2850584,15.943491%2015.6511339,15.9931534%20L15.7529045,16%20L18.2529045,16%20L18.3546751,15.9931534%20C18.7207506,15.943491%2019.0029045,15.6296958%2019.0029045,15.25%20C19.0029045,14.8703042%2018.7207506,14.556509%2018.3546751,14.5068466%20L18.2529045,14.5%20Z%20M19.2388849,5.0207074%20C20.7014167,5.0207074%2021.8972891,6.162412%2021.9838661,7.60318507%20L21.9888849,7.7707074%20L21.9883291,9.4947074%20L2.01032912,9.4947074%20L2.01104885,7.7707074%20C2.01104885,6.30817556%203.15275345,5.11230312%204.59352652,5.02572619%20L4.76104885,5.0207074%20L19.2388849,5.0207074%20Z'%20id='🎨-Color'%3e%3c/path%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_15 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: pay
}, Symbol.toStringTag, { value: 'Module' }));

const plusCircle = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='-2%20-2%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%20preserveAspectRatio='xMinYMin'%20class='jam%20jam-plus-circle-f'%3e%3cpath%20d='M11%2011h4a1%201%200%200%200%200-2h-4V5a1%201%200%200%200-2%200v4H5a1%201%200%201%200%200%202h4v4a1%201%200%200%200%202%200v-4zm-1%209C4.477%2020%200%2015.523%200%2010S4.477%200%2010%200s10%204.477%2010%2010-4.477%2010-10%2010z'%20/%3e%3c/svg%3e";

const __vite_glob_0_16 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: plusCircle
}, Symbol.toStringTag, { value: 'Module' }));

const quickAction = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M5%202H7V3.07645C3.88491%203.55745%201.5%206.25021%201.5%209.5C1.5%2013.0899%204.41015%2016%208%2016C11.5899%2016%2014.5%2013.0899%2014.5%209.5C14.5%208.0659%2014.0356%206.74027%2013.2489%205.66531L14.7071%204.20711L13.2929%202.79289L11.8347%204.2511C11.0146%203.65097%2010.0487%203.23838%209%203.07645V2H11V0H5V2ZM7%206V10H9V6H7Z'%20fill='%23000000'/%3e%3c/svg%3e";

const __vite_glob_0_17 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: quickAction
}, Symbol.toStringTag, { value: 'Module' }));

const reactivate = "data:image/svg+xml,%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Transformed%20by:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20id='SVGRepo_bgCarrier'%20stroke-width='0'/%3e%3cg%20id='SVGRepo_tracerCarrier'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cg%20id='SVGRepo_iconCarrier'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M12%2022C17.5228%2022%2022%2017.5228%2022%2012C22%206.47715%2017.5228%202%2012%202C6.47715%202%202%206.47715%202%2012C2%2017.5228%206.47715%2022%2012%2022ZM15.9346%205.59158C16.217%205.70662%2016.4017%205.98121%2016.4017%206.28616V9.00067C16.4017%209.41489%2016.0659%209.75067%2015.6517%209.75067H13C12.6983%209.75067%2012.4259%209.56984%2012.3088%209.29174C12.1917%209.01364%2012.2527%208.69245%2012.4635%208.47659L13.225%207.69705C11.7795%207.25143%2010.1467%207.61303%209.00097%208.78596C7.33301%2010.4935%207.33301%2013.269%209.00097%2014.9765C10.6593%2016.6742%2013.3407%2016.6742%2014.999%2014.9765C15.6769%2014.2826%2016.0805%2013.4112%2016.2069%2012.5045C16.2651%2012.0865%2016.5972%2011.7349%2017.0192%2011.7349C17.4246%2011.7349%2017.7609%2012.0595%2017.7217%2012.463C17.5957%2013.7606%2017.0471%2015.0265%2016.072%2016.0247C13.8252%2018.3248%2010.1748%2018.3248%207.92796%2016.0247C5.69068%2013.7344%205.69068%2010.0281%207.92796%207.7378C9.66551%205.95905%2012.244%205.55465%2014.3647%206.53037L15.1152%205.76208C15.3283%205.54393%2015.6522%205.47653%2015.9346%205.59158Z'%20fill='%23000000'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_18 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: reactivate
}, Symbol.toStringTag, { value: 'Module' }));

const recent = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M22%2012c0%205.523-4.477%2010-10%2010S2%2017.523%202%2012%206.477%202%2012%202s10%204.477%2010%2010zm-4.581%203.324a1%201%200%200%200-.525-1.313L13%2012.341V6.5a1%201%200%200%200-2%200v6.17c0%20.6.357%201.143.909%201.379l4.197%201.8a1%201%200%200%200%201.313-.525z'%20fill='%23000000'/%3e%3c/svg%3e";

const __vite_glob_0_19 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: recent
}, Symbol.toStringTag, { value: 'Module' }));

const resetPassword = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20xmlns='http://www.w3.org/2000/svg'%20width='800px'%20height='800px'%20viewBox='0%200%2052%2052'%20enable-background='new%200%200%2052%2052'%20xml:space='preserve'%3e%3cg%3e%3cpath%20d='M42,23H10c-2.2,0-4,1.8-4,4v19c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V27C46,24.8,44.2,23,42,23z%20M31,44.5%20c-1.5,1-3.2,1.5-5,1.5c-0.6,0-1.2-0.1-1.8-0.2c-2.4-0.5-4.4-1.8-5.7-3.8l3.3-2.2c0.7,1.1,1.9,1.9,3.2,2.1c1.3,0.3,2.6,0,3.8-0.8%20c2.3-1.5,2.9-4.7,1.4-6.9c-0.7-1.1-1.9-1.9-3.2-2.1c-1.3-0.3-2.6,0-3.8,0.8c-0.3,0.2-0.5,0.4-0.7,0.6L26,37h-9v-9l2.6,2.6%20c0.4-0.4,0.9-0.8,1.3-1.1c2-1.3,4.4-1.8,6.8-1.4c2.4,0.5,4.4,1.8,5.7,3.8C36.2,36.1,35.1,41.7,31,44.5z'/%3e%3cpath%20d='M10,18.1v0.4C10,18.4,10,18.3,10,18.1C10,18.1,10,18.1,10,18.1z'/%3e%3cpath%20d='M11,19h4c0.6,0,1-0.3,1-0.9V18c0-5.7,4.9-10.4,10.7-10C32,8.4,36,13,36,18.4v-0.3c0,0.6,0.4,0.9,1,0.9h4%20c0.6,0,1-0.3,1-0.9V18c0-9.1-7.6-16.4-16.8-16c-8.5,0.4-15,7.6-15.2,16.1C10.1,18.6,10.5,19,11,19z'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_20 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: resetPassword
}, Symbol.toStringTag, { value: 'Module' }));

const search = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%20512%20512'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3eionicons-v5-f%3c/title%3e%3cpath%20d='M221.09,64A157.09,157.09,0,1,0,378.18,221.09,157.1,157.1,0,0,0,221.09,64Z'%20style='fill:none;stroke:%23000000;stroke-miterlimit:10;stroke-width:32px'/%3e%3cline%20x1='338.29'%20y1='338.29'%20x2='448'%20y2='448'%20style='fill:none;stroke:%23000000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px'/%3e%3c/svg%3e";

const __vite_glob_0_21 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: search
}, Symbol.toStringTag, { value: 'Module' }));

const stopSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='0%200%2016%2016'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M3%207.38h10v1.25H3z'/%3e%3cpath%20d='M8%20.5A7.76%207.76%200%200%200%200%208a7.76%207.76%200%200%200%208%207.5A7.76%207.76%200%200%200%2016%208%207.76%207.76%200%200%200%208%20.5zm0%2013.75A6.52%206.52%200%200%201%201.25%208%206.52%206.52%200%200%201%208%201.75%206.52%206.52%200%200%201%2014.75%208%206.52%206.52%200%200%201%208%2014.25z'/%3e%3c/svg%3e";

const __vite_glob_0_22 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: stopSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const active = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2016%2016'%20xmlns='http://www.w3.org/2000/svg'%20fill='%23000000'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M7.71%203h6.79l.51.5v4.507A4.997%204.997%200%200%200%2014%207.416V5.99H7.69l-.86.86-.35.15H1.99v6H7.1c.07.348.177.682.316%201H1.51l-.5-.5v-11l.5-.5h5l.35.15.85.85zm-.22%202h6.5l.01-.99H7.5l-.36-.15-.85-.85H2v3h4.28l.86-.86.35-.15z'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M9.778%208.674a4%204%200%201%201%204.444%206.652%204%204%200%200%201-4.444-6.652zm2.13%204.99l2.387-3.182-.8-.6-2.077%202.769-1.301-1.041-.625.78%201.704%201.364.713-.09z'/%3e%3c/svg%3e";

const __vite_glob_0_23 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: active
}, Symbol.toStringTag, { value: 'Module' }));

const archived = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='0%200%20512%20512'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3eionicons-v5-a%3c/title%3e%3cpath%20d='M64,164V408a56,56,0,0,0,56,56H392a56,56,0,0,0,56-56V164a4,4,0,0,0-4-4H68A4,4,0,0,0,64,164ZM331,315.63l-63.69,63.68a16,16,0,0,1-22.62,0L181,315.63c-6.09-6.09-6.65-16-.85-22.38a16,16,0,0,1,23.16-.56L240,329.37V224.45c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,272,224V329.37l36.69-36.68a16,16,0,0,1,23.16.56C337.65,299.62,337.09,309.54,331,315.63Z'/%3e%3crect%20x='32'%20y='48'%20width='448'%20height='80'%20rx='32'%20ry='32'/%3e%3c/svg%3e";

const __vite_glob_0_24 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: archived
}, Symbol.toStringTag, { value: 'Module' }));

const available = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2048%2048'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3ecalendar-event-available-solid%3c/title%3e%3cg%20id='Layer_2'%20data-name='Layer%202'%3e%3cg%20id='invisible_box'%20data-name='invisible%20box'%3e%3crect%20width='48'%20height='48'%20fill='none'/%3e%3c/g%3e%3cg%20id='icons_Q2'%20data-name='icons%20Q2'%3e%3cpath%20d='M44,8H35V4.1A2.1,2.1,0,0,0,33.3,2,2,2,0,0,0,31,4V8H17V4.1A2.1,2.1,0,0,0,15.3,2,2,2,0,0,0,13,4V8H4a2,2,0,0,0-2,2v6H46V10A2,2,0,0,0,44,8ZM2,20V42a2,2,0,0,0,2,2H44a2,2,0,0,0,2-2V20Zm30.4,6.4-10,10a1.9,1.9,0,0,1-2.8,0l-4.9-4.9a2.2,2.2,0,0,1-.4-2.7,2,2,0,0,1,3.1-.2L21,32.2l8.6-8.6a2,2,0,0,1,2.8,2.8Z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_25 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: available
}, Symbol.toStringTag, { value: 'Module' }));

const full = "data:image/svg+xml,%3c?xml%20version='1.0'%20?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2064%2064'%20data-name='Full%20Mug'%20id='Full_Mug'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20fill='none'%20height='64'%20id='rect2317-4'%20transform='translate(0%200)'%20width='64'/%3e%3cg%20id='g2108'%20transform='translate(8.695%2014.171)'%3e%3cpath%20d='M1.661,1.66S1.518,21.514,6.456,30.766c3.823,7.164,6.2,7.972,10.557,7.972,1.27,0,2.708-.069,4.4-.069s3.131.069,4.4.069c4.367,0,6.773-.809,10.606-7.972C41.374,21.514,41.218,1.66,41.218,1.66H1.661m0-2.257H41.218a2.257,2.257,0,0,1,2.256,2.239c.007.834.1,20.54-5.062,30.189-2.081,3.888-3.824,6.124-5.83,7.478A11.255,11.255,0,0,1,25.817,41c-.618,0-1.262-.015-1.944-.031-.777-.018-1.581-.037-2.46-.037s-1.683.019-2.46.037c-.68.016-1.323.031-1.939.031a11.174,11.174,0,0,1-6.746-1.689c-1.991-1.352-3.727-3.588-5.8-7.477C-.684,22.182-.6,2.478-.6,1.644A2.257,2.257,0,0,1,1.661-.6Z'%20id='path2110'%20transform='translate(0.596%200.596)'/%3e%3c/g%3e%3cg%20id='g2112'%20transform='translate(48.722%2022.068)'%3e%3cpath%20d='M58.174,21.831s8.973-2.243,8.32,8.32S54.9,41.742,54.9,41.742'%20fill='none'%20id='path2114'%20stroke='%23000000'%20stroke-width='2'%20transform='translate(-54.903%20-21.632)'/%3e%3c/g%3e%3cg%20id='g2116'%20transform='translate(12.859%2019.408)'%3e%3cpath%20d='M9.728.238c5.531,0,9.728,2.469,15.349,3.354S35.264,1.857,35.17,2.81c-.4,5.448-1.566,17.747-4.068,22.423-4.405,8.232-6.69,7.032-13.356,7.032s-8.914,1.2-13.307-7.032C2.1,20.845.449,10.487-.057,4.493-.228,2.28,4.2.238,9.728.238Z'%20id='path2118'%20transform='translate(0.062%20-0.238)'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_26 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: full
}, Symbol.toStringTag, { value: 'Module' }));

const ongoing = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='0%200%2032%2032'%20id='icon'%20xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cstyle%3e.cls-1{fill:none;}%3c/style%3e%3c/defs%3e%3ctitle%3ein-progress%3c/title%3e%3cpath%20d='M16,2A14,14,0,1,0,30,16,14.0158,14.0158,0,0,0,16,2Zm0,26A12,12,0,0,1,16,4V16l8.4812,8.4814A11.9625,11.9625,0,0,1,16,28Z'/%3e%3crect%20id='_Transparent_Rectangle_'%20data-name='&lt;Transparent%20Rectangle&gt;'%20class='cls-1'%20width='32'%20height='32'/%3e%3c/svg%3e";

const __vite_glob_0_27 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: ongoing
}, Symbol.toStringTag, { value: 'Module' }));

const upcoming = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%3e%3cpath%20fill='none'%20d='M0%200h24v24H0z'/%3e%3cpath%20d='M17%203h4a1%201%200%200%201%201%201v16a1%201%200%200%201-1%201H3a1%201%200%200%201-1-1V4a1%201%200%200%201%201-1h4V1h2v2h6V1h2v2zm3%206V5h-3v2h-2V5H9v2H7V5H4v4h16zm0%202H4v8h16v-8zM6%2013h5v4H6v-4z'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_28 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: upcoming
}, Symbol.toStringTag, { value: 'Module' }));

const branch$1 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2048%2048'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3ebranch-solid%3c/title%3e%3cg%20id='Layer_2'%20data-name='Layer%202'%3e%3cg%20id='invisible_box'%20data-name='invisible%20box'%3e%3crect%20width='48'%20height='48'%20fill='none'/%3e%3c/g%3e%3cg%20id='icons_Q2'%20data-name='icons%20Q2'%3e%3cpath%20d='M44,9a7,7,0,1,0-9,6.7V16a6,6,0,0,1-6,6H21a10.3,10.3,0,0,0-6,2V15.7a7,7,0,1,0-4,0V32.3a7,7,0,1,0,4,0V32a6,6,0,0,1,6-6h8A10,10,0,0,0,39,16v-.3A7,7,0,0,0,44,9Z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_29 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: branch$1
}, Symbol.toStringTag, { value: 'Module' }));

const _class = "/assets/class-Byt3kBdq.svg";

const __vite_glob_0_30 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _class
}, Symbol.toStringTag, { value: 'Module' }));

const dashboard = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%20-0.5%2025%2025'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M9.918%2010.0005H7.082C6.66587%209.99708%206.26541%2010.1591%205.96873%2010.4509C5.67204%2010.7427%205.50343%2011.1404%205.5%2011.5565V17.4455C5.5077%2018.3117%206.21584%2019.0078%207.082%2019.0005H9.918C10.3341%2019.004%2010.7346%2018.842%2011.0313%2018.5502C11.328%2018.2584%2011.4966%2017.8607%2011.5%2017.4445V11.5565C11.4966%2011.1404%2011.328%2010.7427%2011.0313%2010.4509C10.7346%2010.1591%2010.3341%209.99708%209.918%2010.0005Z'%20stroke='%23000000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M9.918%204.0006H7.082C6.23326%203.97706%205.52559%204.64492%205.5%205.4936V6.5076C5.52559%207.35629%206.23326%208.02415%207.082%208.0006H9.918C10.7667%208.02415%2011.4744%207.35629%2011.5%206.5076V5.4936C11.4744%204.64492%2010.7667%203.97706%209.918%204.0006Z'%20stroke='%23000000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M15.082%2013.0007H17.917C18.3333%2013.0044%2018.734%2012.8425%2019.0309%2012.5507C19.3278%2012.2588%2019.4966%2011.861%2019.5%2011.4447V5.55666C19.4966%205.14054%2019.328%204.74282%2019.0313%204.45101C18.7346%204.1592%2018.3341%203.9972%2017.918%204.00066H15.082C14.6659%203.9972%2014.2654%204.1592%2013.9687%204.45101C13.672%204.74282%2013.5034%205.14054%2013.5%205.55666V11.4447C13.5034%2011.8608%2013.672%2012.2585%2013.9687%2012.5503C14.2654%2012.8421%2014.6659%2013.0041%2015.082%2013.0007Z'%20stroke='%23000000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M15.082%2019.0006H17.917C18.7661%2019.0247%2019.4744%2018.3567%2019.5%2017.5076V16.4936C19.4744%2015.6449%2018.7667%2014.9771%2017.918%2015.0006H15.082C14.2333%2014.9771%2013.5256%2015.6449%2013.5%2016.4936V17.5066C13.525%2018.3557%2014.2329%2019.0241%2015.082%2019.0006Z'%20stroke='%23000000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e";

const __vite_glob_0_31 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: dashboard
}, Symbol.toStringTag, { value: 'Module' }));

const dollar = "data:image/svg+xml,%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Transformed%20by:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20id='SVGRepo_bgCarrier'%20stroke-width='0'/%3e%3cg%20id='SVGRepo_tracerCarrier'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cg%20id='SVGRepo_iconCarrier'%3e%3cpath%20d='M12.75%2015.9203H13.4C14.05%2015.9203%2014.59%2015.3403%2014.59%2014.6403C14.59%2013.7703%2014.28%2013.6003%2013.77%2013.4203L12.76%2013.0703V15.9203H12.75Z'%20fill='%23000000'/%3e%3cpath%20d='M11.9701%201.89845C6.45007%201.91845%201.98007%206.40845%202.00007%2011.9285C2.02007%2017.4485%206.51007%2021.9185%2012.0301%2021.8985C17.5501%2021.8785%2022.0201%2017.3885%2022.0001%2011.8685C21.9801%206.34845%2017.4901%201.88845%2011.9701%201.89845ZM14.2601%2011.9985C15.0401%2012.2685%2016.0901%2012.8485%2016.0901%2014.6385C16.0901%2016.1785%2014.8801%2017.4185%2013.4001%2017.4185H12.7501V17.9985C12.7501%2018.4085%2012.4101%2018.7485%2012.0001%2018.7485C11.5901%2018.7485%2011.2501%2018.4085%2011.2501%2017.9985V17.4185H10.8901C9.25007%2017.4185%207.92007%2016.0385%207.92007%2014.3385C7.92007%2013.9285%208.26007%2013.5885%208.67007%2013.5885C9.08007%2013.5885%209.42007%2013.9285%209.42007%2014.3385C9.42007%2015.2085%2010.0801%2015.9185%2010.8901%2015.9185H11.2501V12.5385L9.74007%2011.9985C8.96007%2011.7285%207.91007%2011.1485%207.91007%209.35845C7.91007%207.81845%209.12007%206.57845%2010.6001%206.57845H11.2501V5.99845C11.2501%205.58845%2011.5901%205.24845%2012.0001%205.24845C12.4101%205.24845%2012.7501%205.58845%2012.7501%205.99845V6.57845H13.1101C14.7501%206.57845%2016.0801%207.95845%2016.0801%209.65845C16.0801%2010.0685%2015.7401%2010.4085%2015.3301%2010.4085C14.9201%2010.4085%2014.5801%2010.0685%2014.5801%209.65845C14.5801%208.78845%2013.9201%208.07845%2013.1101%208.07845H12.7501V11.4585L14.2601%2011.9985Z'%20fill='%23000000'/%3e%3cpath%20d='M9.42188%209.36812C9.42188%2010.2381%209.73187%2010.4081%2010.2419%2010.5881L11.2519%2010.9381V8.07812H10.6019C9.95188%208.07812%209.42188%208.65812%209.42188%209.36812Z'%20fill='%23000000'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_32 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: dollar
}, Symbol.toStringTag, { value: 'Module' }));

const enrollment$1 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20height='800px'%20width='800px'%20version='1.2'%20baseProfile='tiny'%20id='Layer_1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='-351%20153%20256%20256'%20xml:space='preserve'%3e%3cpath%20d='M-246.9,179.2c0-12.3,10.1-22.4,22.4-22.4s22.4,10.1,22.4,22.4c0,12.3-10.1,22.4-22.4,22.4S-246.9,191.5-246.9,179.2z%20M-260.6,266.3h-19.7v-31.7c0-15.4,12.4-27.8,27.8-27.8h55.8c15.3,0,27.8,12.5,27.8,27.8v31.7h-19.3v-26.1c0-1.7-1.2-2.9-2.9-2.9%20c-1.7,0-2.9,1.2-2.9,2.9h0.2v26.2h-61.3v-26.2c0-1.7-1.2-2.9-2.9-2.9c-1.7,0-2.9,1.2-2.9,2.9L-260.6,266.3z%20M-106,272.3v27.5h-24.4%20V409h-186.1V299.7H-340v-27.5L-106,272.3L-106,272.3z'/%3e%3c/svg%3e";

const __vite_glob_0_33 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: enrollment$1
}, Symbol.toStringTag, { value: 'Module' }));

const next = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M7.82054%2020.7313C8.21107%2021.1218%208.84423%2021.1218%209.23476%2020.7313L15.8792%2014.0868C17.0505%2012.9155%2017.0508%2011.0167%2015.88%209.84497L9.3097%203.26958C8.91918%202.87905%208.28601%202.87905%207.89549%203.26958C7.50497%203.6601%207.50497%204.29327%207.89549%204.68379L14.4675%2011.2558C14.8581%2011.6464%2014.8581%2012.2795%2014.4675%2012.67L7.82054%2019.317C7.43002%2019.7076%207.43002%2020.3407%207.82054%2020.7313Z'%20fill='%230F0F0F'/%3e%3c/svg%3e";

const __vite_glob_0_34 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: next
}, Symbol.toStringTag, { value: 'Module' }));

const parent = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20height='800px'%20width='800px'%20version='1.1'%20id='_x32_'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='0%200%20512%20512'%20xml:space='preserve'%3e%3cstyle%20type='text/css'%3e%20.st0{fill:%23000000;}%20%3c/style%3e%3cg%3e%3cpath%20class='st0'%20d='M165.865,85.55c23.636,0,42.779-19.159,42.779-42.77C208.644,19.142,189.501,0,165.865,0%20c-23.636,0-42.779,19.142-42.779,42.779C123.086,66.391,142.229,85.55,165.865,85.55z'/%3e%3cpath%20class='st0'%20d='M222.061,97.624H109.669c-20.726,0-43.274,22.548-43.274,43.282v143.768c0,10.363,8.396,18.767,18.758,18.767%20c10.363,0,18.775-8.404,18.775-18.767V166.469h8.651v320.88c0,13.616,11.035,24.651,24.644,24.651%20c13.625,0,24.66-11.035,24.66-24.651V301.138h7.964v186.211c0,13.616,11.035,24.651,24.66,24.651%20c13.609,0,24.644-11.035,24.644-24.651v-320.88h8.668v118.204c0,10.363,8.396,18.767,18.758,18.767%20c10.379,0,18.759-8.404,18.759-18.767V140.906C265.335,120.172,242.787,97.624,222.061,97.624z'/%3e%3cpath%20class='st0'%20d='M373.041,256.72c19.206,0,34.758-15.568,34.758-34.751c0-19.206-15.552-34.759-34.758-34.759%20c-19.206,0-34.758,15.552-34.758,34.759C338.283,241.152,353.835,256.72,373.041,256.72z'/%3e%3cpath%20class='st0'%20d='M412.989,278.117h-84.718c-15.616,0-32.616,16.992-32.616,32.624v75.482c0,7.812,6.333,14.145,14.137,14.145%20c7.812,0,14.153-6.333,14.153-14.145v-56.212h6.525v163.407c0,10.267,8.316,18.582,18.566,18.582%20c10.275,0,18.592-8.316,18.592-18.582v-94.785h6.005v94.785c0,10.267,8.316,18.582,18.582,18.582%20c10.259,0,18.582-8.316,18.582-18.582V330.011h6.525v56.212c0,7.812,6.332,14.145,14.137,14.145%20c7.828,0,14.144-6.333,14.144-14.145v-75.482C445.605,295.108,428.614,278.117,412.989,278.117z'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_35 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: parent
}, Symbol.toStringTag, { value: 'Module' }));

const prev = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M16.1795%203.26875C15.7889%202.87823%2015.1558%202.87823%2014.7652%203.26875L8.12078%209.91322C6.94952%2011.0845%206.94916%2012.9833%208.11996%2014.155L14.6903%2020.7304C15.0808%2021.121%2015.714%2021.121%2016.1045%2020.7304C16.495%2020.3399%2016.495%2019.7067%2016.1045%2019.3162L9.53246%2012.7442C9.14194%2012.3536%209.14194%2011.7205%209.53246%2011.33L16.1795%204.68297C16.57%204.29244%2016.57%203.65928%2016.1795%203.26875Z'%20fill='%230F0F0F'/%3e%3c/svg%3e";

const __vite_glob_0_36 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: prev
}, Symbol.toStringTag, { value: 'Module' }));

const program$1 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M22,6H19V3a1,1,0,0,0-1-1H14a1,1,0,0,0-1,1V6H11V3a1,1,0,0,0-1-1H6A1,1,0,0,0,5,3V6H2A1,1,0,0,0,1,7V21a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V7A1,1,0,0,0,22,6ZM15,4h2v7H15ZM7,4H9v7H7ZM21,20H17V15a1,1,0,0,0-2,0v5H9V15a1,1,0,0,0-2,0v5H3V8H5v4a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V8h2v4a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V8h2Z'/%3e%3c/svg%3e";

const __vite_glob_0_37 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: program$1
}, Symbol.toStringTag, { value: 'Module' }));

const setting = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%201024%201024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill='%23000000'%20d='M600.704%2064a32%2032%200%200%201%2030.464%2022.208l35.2%20109.376c14.784%207.232%2028.928%2015.36%2042.432%2024.512l112.384-24.192a32%2032%200%200%201%2034.432%2015.36L944.32%20364.8a32%2032%200%200%201-4.032%2037.504l-77.12%2085.12a357.12%20357.12%200%200%201%200%2049.024l77.12%2085.248a32%2032%200%200%201%204.032%2037.504l-88.704%20153.6a32%2032%200%200%201-34.432%2015.296L708.8%20803.904c-13.44%209.088-27.648%2017.28-42.368%2024.512l-35.264%20109.376A32%2032%200%200%201%20600.704%20960H423.296a32%2032%200%200%201-30.464-22.208L357.696%20828.48a351.616%20351.616%200%200%201-42.56-24.64l-112.32%2024.256a32%2032%200%200%201-34.432-15.36L79.68%20659.2a32%2032%200%200%201%204.032-37.504l77.12-85.248a357.12%20357.12%200%200%201%200-48.896l-77.12-85.248A32%2032%200%200%201%2079.68%20364.8l88.704-153.6a32%2032%200%200%201%2034.432-15.296l112.32%2024.256c13.568-9.152%2027.776-17.408%2042.56-24.64l35.2-109.312A32%2032%200%200%201%20423.232%2064H600.64zm-23.424%2064H446.72l-36.352%20113.088-24.512%2011.968a294.113%20294.113%200%200%200-34.816%2020.096l-22.656%2015.36-116.224-25.088-65.28%20113.152%2079.68%2088.192-1.92%2027.136a293.12%20293.12%200%200%200%200%2040.192l1.92%2027.136-79.808%2088.192%2065.344%20113.152%20116.224-25.024%2022.656%2015.296a294.113%20294.113%200%200%200%2034.816%2020.096l24.512%2011.968L446.72%20896h130.688l36.48-113.152%2024.448-11.904a288.282%20288.282%200%200%200%2034.752-20.096l22.592-15.296%20116.288%2025.024%2065.28-113.152-79.744-88.192%201.92-27.136a293.12%20293.12%200%200%200%200-40.256l-1.92-27.136%2079.808-88.128-65.344-113.152-116.288%2024.96-22.592-15.232a287.616%20287.616%200%200%200-34.752-20.096l-24.448-11.904L577.344%20128zM512%20320a192%20192%200%201%201%200%20384%20192%20192%200%200%201%200-384zm0%2064a128%20128%200%201%200%200%20256%20128%20128%200%200%200%200-256z'/%3e%3c/svg%3e";

const __vite_glob_0_38 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: setting
}, Symbol.toStringTag, { value: 'Module' }));

const student = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='iso-8859-1'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20height='800px'%20width='800px'%20version='1.1'%20id='Layer_1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='0%200%20512.001%20512.001'%20xml:space='preserve'%3e%3cg%3e%3cg%3e%3cpath%20d='M166.393,65.905h-0.022H69.519c-1.113,27.752,21.072,50.462,48.437,50.462C145.32,116.367,167.506,93.655,166.393,65.905z%20'/%3e%3c/g%3e%3c/g%3e%3cg%3e%3cg%3e%3cpath%20d='M211.727,176.884c-0.121-24.113-19.87-43.789-44.009-43.789H67.883c-24.144,0-43.888,19.643-44.009,43.788%20c-0.026,5.065-0.66,131.377-0.687,136.622c-0.052,10.27,8.232,18.638,18.503,18.689c0.032,0,0.064,0,0.096,0%20c10.226,0,18.542-8.265,18.594-18.503c0.028-5.451,0.662-131.824,0.687-136.622c0-0.013,0-0.028,0-0.041%20c0.022-1.975,1.636-3.562,3.611-3.551c1.975,0.011,3.57,1.616,3.57,3.591c0.001,46.478,0.009,312.615,0.009,312.615%20c0,12.324,9.992,22.316,22.316,22.316c12.324,0,22.316-9.992,22.316-22.316V311.311h9.635v178.373%20c0,12.324,9.992,22.316,22.316,22.316s22.316-9.992,22.316-22.316c0-306.176-0.405-115.615-0.405-312.756%20c0-2.149,1.742-3.892,3.892-3.892c2.149,0,3.892,1.742,3.893,3.891c0,0.048,0,0.095-0.001,0.144c0,0,0.613,121.932,0.687,136.622%20c0.051,10.239,8.367,18.503,18.594,18.503c0.031,0,0.065,0,0.096,0c10.27-0.051,18.555-8.419,18.503-18.689%20C212.387,308.26,211.752,181.946,211.727,176.884z'/%3e%3c/g%3e%3c/g%3e%3cg%3e%3cg%3e%3cpath%20d='M194.35,36.855c-6.049,0-24.572,0-31.259,0c-6.128-15.801-20.28-27.593-37.463-30.368C125.226,2.839,122.136,0,118.38,0%20c-3.698,0-6.746,2.755-7.223,6.323c-23.647,3.254-41.864,23.53-41.864,48.07c0,0,110.688-0.308,125.057-0.308%20c4.758,0,8.615-3.856,8.615-8.615C202.966,40.712,199.109,36.855,194.35,36.855z'/%3e%3c/g%3e%3c/g%3e%3cg%3e%3cg%3e%3cpath%20d='M487.666,291.373c-8.02-21.948-30.132-85.363-45.465-129.371c-6.861-19.694-25.444-32.917-46.299-32.925%20c-19.028-0.007-37.952-0.012-56.732-0.012c-20.767,0-39.27,13.076-46.221,32.644c-19.033,53.578-39.727,111.405-46.401,129.665%20c-3.565,9.751,1.449,20.547,11.201,24.113c9.742,3.563,20.544-1.444,24.112-11.201c8.944-24.458,28.874-79.962,37.361-103.648%20c-5.962,33.322-19.283,101.691-26.702,139.995c-1.253,6.466,3.733,12.441,10.252,12.441c4.045,0,8.915,0,14.346,0v136.367%20c0,12.459,10.1,22.56,22.559,22.56c12.459,0,22.559-10.1,22.559-22.56V353.073c3.243,0,6.498,0,9.741,0v136.368%20c0,12.459,10.1,22.56,22.559,22.56c12.459,0,22.559-10.1,22.559-22.56V353.073c5.431,0,10.303,0,14.346,0%20c6.555,0,11.504-5.983,10.253-12.441c-22.159-114.305-25.714-131.918-26.702-139.995c15.056,42.624,37.099,102.931,37.361,103.648%20c3.564,9.749,14.356,14.766,24.112,11.201C486.216,311.92,491.232,301.125,487.666,291.373z'/%3e%3c/g%3e%3c/g%3e%3cg%3e%3cg%3e%3cpath%20d='M472.369,113.917c-10.683-21.963-23.203-29.881-30.799-33.675c-5.761-2.878-11.906-3.293-17.358,0.294l0.765-1.795%20c1.246-2.924-0.116-6.305-3.04-7.551c-2.504-1.067-5.335-0.21-6.881,1.892c3.248-29.021-19.466-53.937-48.174-53.937%20c-28.76,0-51.416,24.969-48.175,53.936c-1.546-2.102-4.374-2.957-6.88-1.891c-2.924,1.246-4.285,4.626-3.04,7.551l0.765,1.795%20c-5.45-3.588-11.595-3.173-17.357-0.295c-7.595,3.795-20.117,11.712-30.799,33.675c-1.17,2.41,1.135,5.047,3.675,4.213%20c18.894-6.198,38.022-0.707,45.476-4.43c4.121-2.059,7.31-5.716,8.674-10.46c0.712,1.672,1.819,5.471,6.137,5.471%20c4.105,0,6.912-4.21,5.293-8.012l-0.717-1.683c8.894,10.462,22.142,17.107,36.95,17.107s28.056-6.646,36.95-17.108l-0.717,1.683%20c-1.619,3.802,1.185,8.012,5.293,8.012c4.31,0,5.429-3.809,6.137-5.47c1.361,4.727,4.539,8.393,8.674,10.459%20c7.454,3.724,26.581-1.768,45.476,4.43C471.235,118.962,473.54,116.325,472.369,113.917z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_39 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: student
}, Symbol.toStringTag, { value: 'Module' }));

const trial$1 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20opacity='0.1'%20d='M4%2012.5V16C4%2017.8856%204%2018.8284%204.58579%2019.4142C5.17157%2020%206.11438%2020%208%2020H9H15H16C17.8856%2020%2018.8284%2020%2019.4142%2019.4142C20%2018.8284%2020%2017.8856%2020%2016V12.5C20%2012.2239%2019.7761%2012%2019.5%2012H4.5C4.22386%2012%204%2012.2239%204%2012.5Z'%20fill='%23000000'/%3e%3cpath%20d='M3%209.5C3%209.03534%203%208.80302%203.03843%208.60982C3.19624%207.81644%203.81644%207.19624%204.60982%207.03843C4.80302%207%205.03534%207%205.5%207H12H18.5C18.9647%207%2019.197%207%2019.3902%207.03843C20.1836%207.19624%2020.8038%207.81644%2020.9616%208.60982C21%208.80302%2021%209.03534%2021%209.5V9.5V9.5C21%209.96466%2021%2010.197%2020.9616%2010.3902C20.8038%2011.1836%2020.1836%2011.8038%2019.3902%2011.9616C19.197%2012%2018.9647%2012%2018.5%2012H12H5.5C5.03534%2012%204.80302%2012%204.60982%2011.9616C3.81644%2011.8038%203.19624%2011.1836%203.03843%2010.3902C3%2010.197%203%209.96466%203%209.5V9.5V9.5Z'%20stroke='%23000000'%20stroke-width='2'%20stroke-linejoin='round'/%3e%3cpath%20d='M4%2012V16C4%2017.8856%204%2018.8284%204.58579%2019.4142C5.17157%2020%206.11438%2020%208%2020H9H15H16C17.8856%2020%2018.8284%2020%2019.4142%2019.4142C20%2018.8284%2020%2017.8856%2020%2016V12'%20stroke='%23000000'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M12%207V20'%20stroke='%23000000'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M11.3753%206.21913L9.3959%203.74487C8.65125%202.81406%207.26102%202.73898%206.41813%203.58187C5.1582%204.8418%206.04662%207%207.82843%207L11%207C11.403%207%2011.6271%206.53383%2011.3753%206.21913Z'%20stroke='%23000000'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M12.6247%206.21913L14.6041%203.74487C15.3488%202.81406%2016.739%202.73898%2017.5819%203.58187C18.8418%204.8418%2017.9534%207%2016.1716%207L13%207C12.597%207%2012.3729%206.53383%2012.6247%206.21913Z'%20stroke='%23000000'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e";

const __vite_glob_0_40 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: trial$1
}, Symbol.toStringTag, { value: 'Module' }));

const googleLogo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='-3%200%20262%20262'%20xmlns='http://www.w3.org/2000/svg'%20preserveAspectRatio='xMidYMid'%3e%3cpath%20d='M255.878%20133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45%2012.04-9.283%2030.172-26.69%2042.356l-.244%201.622%2038.755%2030.023%202.685.268c24.659-22.774%2038.875-56.282%2038.875-96.027'%20fill='%234285F4'/%3e%3cpath%20d='M130.55%20261.1c35.248%200%2064.839-11.605%2086.453-31.622l-41.196-31.913c-11.024%207.688-25.82%2013.055-45.257%2013.055-34.523%200-63.824-22.773-74.269-54.25l-1.531.13-40.298%2031.187-.527%201.465C35.393%20231.798%2079.49%20261.1%20130.55%20261.1'%20fill='%2334A853'/%3e%3cpath%20d='M56.281%20156.37c-2.756-8.123-4.351-16.827-4.351-25.82%200-8.994%201.595-17.697%204.206-25.82l-.073-1.73L15.26%2071.312l-1.335.635C5.077%2089.644%200%20109.517%200%20130.55s5.077%2040.905%2013.925%2058.602l42.356-32.782'%20fill='%23FBBC05'/%3e%3cpath%20d='M130.55%2050.479c24.514%200%2041.05%2010.589%2050.479%2019.438l36.844-35.974C195.245%2012.91%20165.798%200%20130.55%200%2079.49%200%2035.393%2029.301%2013.925%2071.947l42.211%2032.783c10.59-31.477%2039.891-54.251%2074.414-54.251'%20fill='%23EB4335'/%3e%3c/svg%3e";

const __vite_glob_0_41 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: googleLogo
}, Symbol.toStringTag, { value: 'Module' }));

const absent = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%20id='present-close'%20class='icon%20glyph'%3e%3cpath%20d='M21,3H3A1,1,0,0,0,3,5V16a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2V5a1,1,0,0,0,0-2Zm-5.79,9.29a1,1,0,0,1,0,1.42,1,1,0,0,1-1.42,0L12,11.92l-1.79,1.79a1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.42l1.79-1.79L8.79,8.71a1,1,0,1,1,1.42-1.42L12,9.08l1.79-1.79a1,1,0,1,1,1.42,1.42L13.42,10.5ZM10.08,19l-1.3,1.62A1,1,0,0,1,8,21a1,1,0,0,1-.62-.22,1,1,0,0,1-.16-1.4l.3-.38Zm6.54,1.78A1,1,0,0,1,16,21a1,1,0,0,1-.78-.38L13.92,19h2.56l.3.38A1,1,0,0,1,16.62,20.78Z'%20style='fill:%23231f20'%3e%3c/path%3e%3c/svg%3e";

const __vite_glob_0_42 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: absent
}, Symbol.toStringTag, { value: 'Module' }));

const arrowCircleDownSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M9%2013L12%2016M12%2016L15%2013M12%2016V8M21%2012C21%2016.9706%2016.9706%2021%2012%2021C7.02944%2021%203%2016.9706%203%2012C3%207.02944%207.02944%203%2012%203C16.9706%203%2021%207.02944%2021%2012Z'%20stroke='%23000000'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e";

const __vite_glob_0_43 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: arrowCircleDownSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const arrowCircleUpSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M15%2011L12%208M12%208L9%2011M12%208V16M21%2012C21%2016.9706%2016.9706%2021%2012%2021C7.02944%2021%203%2016.9706%203%2012C3%207.02944%207.02944%203%2012%203C16.9706%203%2021%207.02944%2021%2012Z'%20stroke='%23000000'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e";

const __vite_glob_0_44 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: arrowCircleUpSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const attendanceSvgrepo = "/assets/attendance-svgrepo-B7Ms0UzN.svg";

const __vite_glob_0_45 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: attendanceSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const calendarEventUpcoming = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2048%2048'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3ecalendar-event-busy-solid%3c/title%3e%3cg%20id='Layer_2'%20data-name='Layer%202'%3e%3cg%20id='invisible_box'%20data-name='invisible%20box'%3e%3crect%20width='48'%20height='48'%20fill='none'/%3e%3c/g%3e%3cg%20id='icons_Q2'%20data-name='icons%20Q2'%3e%3cpath%20d='M44,8H35V4.1A2.1,2.1,0,0,0,33.3,2,2,2,0,0,0,31,4V8H17V4.1A2.1,2.1,0,0,0,15.3,2,2,2,0,0,0,13,4V8H4a2,2,0,0,0-2,2v6H46V10A2,2,0,0,0,44,8ZM2,20V42a2,2,0,0,0,2,2H44a2,2,0,0,0,2-2V20ZM30.4,33.6a1.9,1.9,0,0,1,0,2.8,1.9,1.9,0,0,1-2.8,0L24,32.8l-3.6,3.6a1.9,1.9,0,0,1-2.8,0,1.9,1.9,0,0,1,0-2.8L21.2,30l-3.6-3.6a2,2,0,0,1,2.8-2.8L24,27.2l3.6-3.6a2,2,0,0,1,2.8,2.8L26.8,30Z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_46 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: calendarEventUpcoming
}, Symbol.toStringTag, { value: 'Module' }));

const presentSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%20id='present-check'%20class='icon%20glyph'%3e%3cpath%20d='M21,3H3A1,1,0,0,0,3,5V16a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2V5a1,1,0,0,0,0-2ZM15.71,9.71l-4,4a1,1,0,0,1-1.42,0l-2-2a1,1,0,0,1,1.42-1.42L11,11.59l3.29-3.3a1,1,0,0,1,1.42,1.42ZM10.08,19l-1.3,1.62A1,1,0,0,1,8,21a1,1,0,0,1-.62-.22,1,1,0,0,1-.16-1.4l.3-.38Zm6.54,1.78A1,1,0,0,1,16,21a1,1,0,0,1-.78-.38L13.92,19h2.56l.3.38A1,1,0,0,1,16.62,20.78Z'%20style='fill:%23231f20'%3e%3c/path%3e%3c/svg%3e";

const __vite_glob_0_47 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: presentSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const familySvgrepo = "/assets/family-svgrepo-CVUGJQrp.svg";

const __vite_glob_0_48 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: familySvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const profileSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M12.12%2012.78C12.05%2012.77%2011.96%2012.77%2011.88%2012.78C10.12%2012.72%208.71997%2011.28%208.71997%209.50998C8.71997%207.69998%2010.18%206.22998%2012%206.22998C13.81%206.22998%2015.28%207.69998%2015.28%209.50998C15.27%2011.28%2013.88%2012.72%2012.12%2012.78Z'%20stroke='%23292D32'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M18.74%2019.3801C16.96%2021.0101%2014.6%2022.0001%2012%2022.0001C9.40001%2022.0001%207.04001%2021.0101%205.26001%2019.3801C5.36001%2018.4401%205.96001%2017.5201%207.03001%2016.8001C9.77001%2014.9801%2014.25%2014.9801%2016.97%2016.8001C18.04%2017.5201%2018.64%2018.4401%2018.74%2019.3801Z'%20stroke='%23292D32'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M12%2022C17.5228%2022%2022%2017.5228%2022%2012C22%206.47715%2017.5228%202%2012%202C6.47715%202%202%206.47715%202%2012C2%2017.5228%206.47715%2022%2012%2022Z'%20stroke='%23292D32'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e";

const __vite_glob_0_49 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: profileSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const userSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20height='800px'%20width='800px'%20version='1.1'%20id='_x32_'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='0%200%20512%20512'%20xml:space='preserve'%3e%3cstyle%20type='text/css'%3e%20.st0{fill:%23000000;}%20%3c/style%3e%3cg%3e%3cpath%20class='st0'%20d='M344.367,379.396c-16.358-6.115-21.008-15.644-21.008-27.966c0-8.164,0-18.352,0-32.336%20c2.42-5.007,12.244-28.845,17.487-58.563c12.238-4.37,19.233-11.358,27.965-41.949c4.856-17.009,0.82-24.794-4.142-28.39%20c1.252-1.699,2.322-3.497,3.066-5.462c10.485-27.966,22.199-155.896-77.44-162.535c-28.231-26.577-59.785-29.9-99.639-6.646%20c-39.854,23.254-49.217,66.424-53.138,96.316c-4.105,31.235,6.464,79.86,6.464,79.86l0.971,0.136%20c-3.953,4.173-6.434,11.972-2.223,26.721c8.732,30.59,15.72,37.579,27.958,41.949c5.243,29.718,15.25,50.058,17.488,58.563%20c0,13.984,0,24.172,0,32.336c0,12.321-6.123,22.723-21.001,27.966C138.556,389.487,37.179,419.06,44.941,512h422.121%20C474.824,419.06,372.787,390.033,344.367,379.396z'/%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_50 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: userSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const usergrpSvgrepo = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='iso-8859-1'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%23000000'%20height='800px'%20width='800px'%20version='1.1'%20id='Capa_1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='0%200%20611.998%20611.998'%20xml:space='preserve'%3e%3cg%3e%3cg%3e%3cpath%20d='M382.167,150.945c9.702,10.875,16.557,24.306,20.381,39.921c3.629,14.822,4.44,31.308,2.414,49.006%20c-0.751,6.546-1.861,13.96-3.479,21.802c12.532,12.135,28.95,19.839,50.296,19.838c59.22-0.005,80.529-59.3,86.105-108.006%20c6.872-60.004-21.498-105.163-86.105-105.163c-50.698,0-79.079,27.82-85.628,68.798%20C372.076,141.062,377.449,145.655,382.167,150.945z'/%3e%3cpath%20d='M611.973,422.704c-0.645-18.899-2.861-37.887-6.161-56.495c-3.992-22.539-9.08-55.585-28.759-70.275%20c-11.38-8.491-26.117-11.278-39.143-16.398c-6.343-2.492-12.024-4.967-17.354-7.784c-17.995,19.734-41.459,30.055-68.782,30.057%20c-21.261,0-40.172-6.281-56.001-18.358c-3.644,11.272-8.522,22.623-15.044,32.994c5.728,3.449,11.923,6.204,19.451,9.162%20c3.332,1.31,6.99,2.506,10.864,3.771c10.472,3.422,22.339,7.301,32.994,15.255c25.329,18.907,31.564,54.336,36.117,80.207%20l0.49,2.792c2.355,13.266,4.084,26.299,5.197,38.961c20.215-2.071,40.327-5.61,60.047-9.774%20c15.941-3.365,31.774-7.471,47.109-13.003C605.247,439.397,612.476,437.343,611.973,422.704z'/%3e%3cpath%20d='M160.216,281.511c21.345,0.002,37.762-7.703,50.295-19.838c-1.618-7.841-2.728-15.256-3.479-21.802%20c-2.026-17.697-1.214-34.184,2.414-49.006c3.823-15.614,10.679-29.046,20.381-39.921c4.718-5.291,10.09-9.884,16.014-13.805%20c-6.549-40.978-34.93-68.798-85.628-68.798c-64.606,0-92.977,45.16-86.106,105.163%20C79.687,222.212,100.996,281.507,160.216,281.511z'/%3e%3cpath%20d='M167.957,344.634c10.655-7.954,22.524-11.833,32.994-15.255c3.875-1.265,7.531-2.461,10.864-3.771%20c7.528-2.957,13.725-5.711,19.451-9.162c-6.52-10.369-11.4-21.722-15.043-32.994c-15.829,12.077-34.741,18.358-56.001,18.358%20c-27.322-0.001-50.788-10.324-68.782-30.057c-5.329,2.817-11.012,5.291-17.354,7.784c-13.026,5.12-27.763,7.907-39.143,16.398%20c-19.678,14.691-24.767,47.735-28.759,70.275c-3.3,18.607-5.516,37.595-6.161,56.495c-0.502,14.64,6.726,16.693,18.974,21.112%20c15.334,5.531,31.17,9.637,47.109,13.003c19.72,4.165,39.833,7.704,60.047,9.774c1.112-12.662,2.841-25.693,5.197-38.961%20l0.49-2.792C136.394,398.971,142.628,363.541,167.957,344.634z'/%3e%3cpath%20d='M470.351,429.405l-0.493-2.805c-4.258-24.197-10.091-57.334-32.191-73.832c-9.321-6.957-19.872-10.404-30.078-13.74%20c-4.019-1.313-7.812-2.554-11.427-3.974c-5.269-2.07-10.016-4.097-14.464-6.338c-18.684,24.932-44.58,38.059-75.383,38.062%20c-30.795,0-56.687-13.128-75.371-38.062c-4.449,2.243-9.196,4.269-14.467,6.34c-3.61,1.418-7.406,2.659-11.424,3.972%20c-10.207,3.335-20.761,6.784-30.079,13.74c-22.107,16.5-27.936,49.645-32.193,73.846l-0.493,2.795%20c-3.557,20.086-5.68,39.572-6.308,57.914c-0.737,21.519,12.62,26.316,24.403,30.55l1.269,0.457%20c14.17,5.112,30.021,9.492,48.457,13.388c37.646,7.946,68.197,11.74,96.138,11.938h0.072h0.072%20c27.946-0.199,58.495-3.992,96.135-11.938c18.439-3.894,34.289-8.274,48.453-13.387l1.268-0.456%20c11.786-4.233,25.147-9.029,24.41-30.553C476.03,468.931,473.906,449.447,470.351,429.405z'/%3e%3cpath%20d='M221.005,243.009c5.577,48.709,26.883,108.009,86.103,108.006s80.529-59.297,86.106-108.006%20c6.871-60.002-21.503-105.16-86.106-105.16C242.515,137.847,214.123,183.002,221.005,243.009z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const __vite_glob_0_51 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: usergrpSvgrepo
}, Symbol.toStringTag, { value: 'Module' }));

const blueBgSchool = "/assets/blue-bg-school-CIWIplX2.jpg";

const __vite_glob_0_52 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: blueBgSchool
}, Symbol.toStringTag, { value: 'Module' }));

const cardBallet = "/assets/card-ballet-BspnGvqN.png";

const __vite_glob_0_53 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardBallet
}, Symbol.toStringTag, { value: 'Module' }));

const cardModel = "/assets/card-model-B7L0hm27.png";

const __vite_glob_0_54 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardModel
}, Symbol.toStringTag, { value: 'Module' }));

const cardPiano = "/assets/card-piano-BMQVLM5S.png";

const __vite_glob_0_55 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardPiano
}, Symbol.toStringTag, { value: 'Module' }));

const cardRobamKhmer = "/assets/card-robamKhmer-BMBzkN4N.png";

const __vite_glob_0_56 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardRobamKhmer
}, Symbol.toStringTag, { value: 'Module' }));

const cardRobotic = "/assets/card-robotic-CaXR-k33.png";

const __vite_glob_0_57 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardRobotic
}, Symbol.toStringTag, { value: 'Module' }));

const cardTaekwondo = "/assets/card-taekwondo-QeTC2BVZ.png";

const __vite_glob_0_58 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardTaekwondo
}, Symbol.toStringTag, { value: 'Module' }));

const logoMain = "/assets/logo-main-DNwu7uAH.png";

const __vite_glob_0_59 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: logoMain
}, Symbol.toStringTag, { value: 'Module' }));

const branch = "/assets/branch-Cjjv2Nyt.png";

const __vite_glob_0_60 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: branch
}, Symbol.toStringTag, { value: 'Module' }));

const cardAvailableProgram = "/assets/card-available-program-wGVHSw6k.png";

const __vite_glob_0_61 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardAvailableProgram
}, Symbol.toStringTag, { value: 'Module' }));

const cardBranch = "/assets/card-branch-VaT6yS1Z.png";

const __vite_glob_0_62 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardBranch
}, Symbol.toStringTag, { value: 'Module' }));

const cardFullProgram = "/assets/card-full-program-B9huZEb-.png";

const __vite_glob_0_63 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardFullProgram
}, Symbol.toStringTag, { value: 'Module' }));

const cardGuardian = "/assets/card-guardian-Dxo2td0k.png";

const __vite_glob_0_64 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardGuardian
}, Symbol.toStringTag, { value: 'Module' }));

const cardNearlyfullProgram = "/assets/card-nearlyfull-program-kiFuWPmY.png";

const __vite_glob_0_65 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardNearlyfullProgram
}, Symbol.toStringTag, { value: 'Module' }));

const cardParent = "/assets/card-parent-GGl16zoX.png";

const __vite_glob_0_66 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardParent
}, Symbol.toStringTag, { value: 'Module' }));

const cardRevenue = "/assets/card-revenue-CqScW-CH.png";

const __vite_glob_0_67 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardRevenue
}, Symbol.toStringTag, { value: 'Module' }));

const cardStudent = "/assets/card-student-NZrdmENT.png";

const __vite_glob_0_68 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardStudent
}, Symbol.toStringTag, { value: 'Module' }));

const cardTopProgram = "/assets/card-top-program-DMAB7-97.png";

const __vite_glob_0_69 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardTopProgram
}, Symbol.toStringTag, { value: 'Module' }));

const cardTrial = "/assets/card-trial-_dVjKx4f.png";

const __vite_glob_0_70 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cardTrial
}, Symbol.toStringTag, { value: 'Module' }));

const enrollment = "/assets/enrollment-CqXO0bbg.png";

const __vite_glob_0_71 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: enrollment
}, Symbol.toStringTag, { value: 'Module' }));

const highPayment = "/assets/high-payment-Cc8ZmDgH.png";

const __vite_glob_0_72 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: highPayment
}, Symbol.toStringTag, { value: 'Module' }));

const onTime = "/assets/on-time-BfCK4qr0.png";

const __vite_glob_0_73 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: onTime
}, Symbol.toStringTag, { value: 'Module' }));

const payment = "/assets/payment-Dp6jwoRU.png";

const __vite_glob_0_74 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: payment
}, Symbol.toStringTag, { value: 'Module' }));

const pending_payment = "/assets/pending_payment-B9GFjOLq.png";

const __vite_glob_0_75 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: pending_payment
}, Symbol.toStringTag, { value: 'Module' }));

const refund = "/assets/refund-ByoIYxb7.png";

const __vite_glob_0_76 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: refund
}, Symbol.toStringTag, { value: 'Module' }));

const registration = "/assets/registration-BZYC3MZZ.png";

const __vite_glob_0_77 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: registration
}, Symbol.toStringTag, { value: 'Module' }));

const transaction = "/assets/transaction-DMQxPGPg.png";

const __vite_glob_0_78 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: transaction
}, Symbol.toStringTag, { value: 'Module' }));

const trial = "/assets/trial-DD_HgNRR.png";

const __vite_glob_0_79 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: trial
}, Symbol.toStringTag, { value: 'Module' }));

const academicHistory = "/assets/academic-history-DbLu320d.png";

const __vite_glob_0_80 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: academicHistory
}, Symbol.toStringTag, { value: 'Module' }));

const attendance = "/assets/attendance-BHDW_xMs.png";

const __vite_glob_0_81 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: attendance
}, Symbol.toStringTag, { value: 'Module' }));

const behavior = "/assets/behavior-BnvbB2A2.png";

const __vite_glob_0_82 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: behavior
}, Symbol.toStringTag, { value: 'Module' }));

const enrollmentCapacity = "/assets/enrollment-capacity-HYAwkwxP.png";

const __vite_glob_0_83 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: enrollmentCapacity
}, Symbol.toStringTag, { value: 'Module' }));

const exam = "/assets/exam-DOI8XiDS.png";

const __vite_glob_0_84 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: exam
}, Symbol.toStringTag, { value: 'Module' }));

const programRevenue = "/assets/program-revenue-grete3uB.png";

const __vite_glob_0_85 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: programRevenue
}, Symbol.toStringTag, { value: 'Module' }));

const remainingSessions = "/assets/remaining-sessions-B4CXCc4M.png";

const __vite_glob_0_86 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: remainingSessions
}, Symbol.toStringTag, { value: 'Module' }));

const totalEnrolled = "/assets/total-enrolled-Kg63-kn7.png";

const __vite_glob_0_87 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalEnrolled
}, Symbol.toStringTag, { value: 'Module' }));

const todayEnrollment = "/assets/today-enrollment-Be82jJhv.png";

const __vite_glob_0_88 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: todayEnrollment
}, Symbol.toStringTag, { value: 'Module' }));

const totalCanceledEnrollment = "/assets/total-canceled-enrollment-gfPPfein.png";

const __vite_glob_0_89 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalCanceledEnrollment
}, Symbol.toStringTag, { value: 'Module' }));

const totalEnrollment = "/assets/total-enrollment-DedOo5Q8.png";

const __vite_glob_0_90 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalEnrollment
}, Symbol.toStringTag, { value: 'Module' }));

const totalPaidEnrollment = "/assets/total-paid-enrollment-D1CkgGeK.png";

const __vite_glob_0_91 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalPaidEnrollment
}, Symbol.toStringTag, { value: 'Module' }));

const totalUnpaidEnrollment = "/assets/total-unpaid-enrollment-BPeadEMN.png";

const __vite_glob_0_92 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalUnpaidEnrollment
}, Symbol.toStringTag, { value: 'Module' }));

const activeNow = "/assets/active-now-DJS7_Vs7.png";

const __vite_glob_0_93 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: activeNow
}, Symbol.toStringTag, { value: 'Module' }));

const paidToday = "/assets/paid-today-BYqkAt9-.png";

const __vite_glob_0_94 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: paidToday
}, Symbol.toStringTag, { value: 'Module' }));

const recentlyRegister = "/assets/recently-register-CfoIwkfS.png";

const __vite_glob_0_95 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: recentlyRegister
}, Symbol.toStringTag, { value: 'Module' }));

const totalGuardian = "/assets/total-guardian-BC5ml-Ev.png";

const __vite_glob_0_96 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalGuardian
}, Symbol.toStringTag, { value: 'Module' }));

const totalParent = "/assets/total-parent-BmCUf565.png";

const __vite_glob_0_97 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalParent
}, Symbol.toStringTag, { value: 'Module' }));

const totalUsers = "/assets/total-users-C0OVS6K9.png";

const __vite_glob_0_98 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalUsers
}, Symbol.toStringTag, { value: 'Module' }));

const refundPayment = "/assets/refund-payment-BoOejzpD.png";

const __vite_glob_0_99 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: refundPayment
}, Symbol.toStringTag, { value: 'Module' }));

const totalRevenue = "/assets/total-revenue-BNbtIEkf.png";

const __vite_glob_0_100 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalRevenue
}, Symbol.toStringTag, { value: 'Module' }));

const totalTransaction = "/assets/total-transaction-BWPz2Mo1.png";

const __vite_glob_0_101 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalTransaction
}, Symbol.toStringTag, { value: 'Module' }));

const unpaidPayment = "/assets/unpaid-payment-BpXmAHhk.png";

const __vite_glob_0_102 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: unpaidPayment
}, Symbol.toStringTag, { value: 'Module' }));

const avatarAdmin = "/assets/avatar-admin-Brg7CEJ8.png";

const __vite_glob_0_103 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarAdmin
}, Symbol.toStringTag, { value: 'Module' }));

const avatarBoy = "/assets/avatar-boy-CdKPCnAK.png";

const __vite_glob_0_104 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarBoy
}, Symbol.toStringTag, { value: 'Module' }));

const avatarGirl = "/assets/avatar-girl-FdDh15ky.png";

const __vite_glob_0_105 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarGirl
}, Symbol.toStringTag, { value: 'Module' }));

const avatarGuest = "/assets/avatar-guest-B5hLpn8m.png";

const __vite_glob_0_106 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarGuest
}, Symbol.toStringTag, { value: 'Module' }));

const avatarMan = "/assets/avatar-man-XXUiA_2A.png";

const __vite_glob_0_107 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarMan
}, Symbol.toStringTag, { value: 'Module' }));

const avatarTeacherMan = "/assets/avatar-teacher-man-DI31d6vC.png";

const __vite_glob_0_108 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarTeacherMan
}, Symbol.toStringTag, { value: 'Module' }));

const avatarTeacherWoman = "/assets/avatar-teacher-woman-BiRjXE-f.png";

const __vite_glob_0_109 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarTeacherWoman
}, Symbol.toStringTag, { value: 'Module' }));

const avatarWoman = "/assets/avatar-woman-yXdaJUF7.png";

const __vite_glob_0_110 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: avatarWoman
}, Symbol.toStringTag, { value: 'Module' }));

const activeProgram = "/assets/active-program-w-aFjwbV.png";

const __vite_glob_0_111 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: activeProgram
}, Symbol.toStringTag, { value: 'Module' }));

const archivedProgram = "/assets/archived-program-De6FCaHD.png";

const __vite_glob_0_112 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: archivedProgram
}, Symbol.toStringTag, { value: 'Module' }));

const inProgressProgram = "/assets/in-progress-program-DD_Ui6mW.png";

const __vite_glob_0_113 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: inProgressProgram
}, Symbol.toStringTag, { value: 'Module' }));

const program = "/assets/program-D2R9klaI.png";

const __vite_glob_0_114 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: program
}, Symbol.toStringTag, { value: 'Module' }));

const totalProgram = "/assets/total-program-hgA5VGuY.png";

const __vite_glob_0_115 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalProgram
}, Symbol.toStringTag, { value: 'Module' }));

const upcomingProgram = "/assets/upcoming-program-Dd-tZvqW.png";

const __vite_glob_0_116 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: upcomingProgram
}, Symbol.toStringTag, { value: 'Module' }));

const currentlyEnrolled = "/assets/currently-enrolled-p2WjDS1K.png";

const __vite_glob_0_117 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: currentlyEnrolled
}, Symbol.toStringTag, { value: 'Module' }));

const currentlyNotEnrolled = "/assets/currently-not-enrolled-CRw697ZB.png";

const __vite_glob_0_118 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: currentlyNotEnrolled
}, Symbol.toStringTag, { value: 'Module' }));

const graduated = "/assets/graduated-D5G4vZ14.png";

const __vite_glob_0_119 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: graduated
}, Symbol.toStringTag, { value: 'Module' }));

const newlyEnrolled = "/assets/newly-enrolled-BUMuwPsr.png";

const __vite_glob_0_120 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: newlyEnrolled
}, Symbol.toStringTag, { value: 'Module' }));

const stoppedEnrolled = "/assets/stopped-enrolled-CDJkLXFg.png";

const __vite_glob_0_121 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: stoppedEnrolled
}, Symbol.toStringTag, { value: 'Module' }));

const totalStudent = "/assets/total-student-CLrotDDS.png";

const __vite_glob_0_122 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalStudent
}, Symbol.toStringTag, { value: 'Module' }));

const totalTeacher = "/assets/total-teacher-phId3c8Q.png";

const __vite_glob_0_123 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: totalTeacher
}, Symbol.toStringTag, { value: 'Module' }));

const ASSETS = /* #__PURE__ */ Object.assign({"../assets/icons/action/back.svg": __vite_glob_0_0,"../assets/icons/action/bell-svgrepo.svg": __vite_glob_0_1,"../assets/icons/action/cancel.svg": __vite_glob_0_2,"../assets/icons/action/cash.svg": __vite_glob_0_3,"../assets/icons/action/close.svg": __vite_glob_0_4,"../assets/icons/action/cloud-upload.svg": __vite_glob_0_5,"../assets/icons/action/deactivate-svgrepo.svg": __vite_glob_0_6,"../assets/icons/action/delete.svg": __vite_glob_0_7,"../assets/icons/action/download.svg": __vite_glob_0_8,"../assets/icons/action/edit.svg": __vite_glob_0_9,"../assets/icons/action/email.svg": __vite_glob_0_10,"../assets/icons/action/eye-close.svg": __vite_glob_0_11,"../assets/icons/action/eye-open.svg": __vite_glob_0_12,"../assets/icons/action/eye-view.svg": __vite_glob_0_13,"../assets/icons/action/filter.svg": __vite_glob_0_14,"../assets/icons/action/pay.svg": __vite_glob_0_15,"../assets/icons/action/plus-circle.svg": __vite_glob_0_16,"../assets/icons/action/quick-action.svg": __vite_glob_0_17,"../assets/icons/action/reactivate.svg": __vite_glob_0_18,"../assets/icons/action/recent.svg": __vite_glob_0_19,"../assets/icons/action/reset-password.svg": __vite_glob_0_20,"../assets/icons/action/search.svg": __vite_glob_0_21,"../assets/icons/action/stop-svgrepo.svg": __vite_glob_0_22,"../assets/icons/filter/active.svg": __vite_glob_0_23,"../assets/icons/filter/archived.svg": __vite_glob_0_24,"../assets/icons/filter/available.svg": __vite_glob_0_25,"../assets/icons/filter/full.svg": __vite_glob_0_26,"../assets/icons/filter/ongoing.svg": __vite_glob_0_27,"../assets/icons/filter/upcoming.svg": __vite_glob_0_28,"../assets/icons/navigation/branch.svg": __vite_glob_0_29,"../assets/icons/navigation/class.svg": __vite_glob_0_30,"../assets/icons/navigation/dashboard.svg": __vite_glob_0_31,"../assets/icons/navigation/dollar.svg": __vite_glob_0_32,"../assets/icons/navigation/enrollment.svg": __vite_glob_0_33,"../assets/icons/navigation/next.svg": __vite_glob_0_34,"../assets/icons/navigation/parent.svg": __vite_glob_0_35,"../assets/icons/navigation/prev.svg": __vite_glob_0_36,"../assets/icons/navigation/program.svg": __vite_glob_0_37,"../assets/icons/navigation/setting.svg": __vite_glob_0_38,"../assets/icons/navigation/student.svg": __vite_glob_0_39,"../assets/icons/navigation/trial.svg": __vite_glob_0_40,"../assets/icons/other/google-logo.svg": __vite_glob_0_41,"../assets/icons/status/absent.svg": __vite_glob_0_42,"../assets/icons/status/arrow-circle-down-svgrepo.svg": __vite_glob_0_43,"../assets/icons/status/arrow-circle-up-svgrepo.svg": __vite_glob_0_44,"../assets/icons/status/attendance-svgrepo.svg": __vite_glob_0_45,"../assets/icons/status/calendar-event-upcoming.svg": __vite_glob_0_46,"../assets/icons/status/present-svgrepo.svg": __vite_glob_0_47,"../assets/icons/user/family-svgrepo.svg": __vite_glob_0_48,"../assets/icons/user/profile-svgrepo.svg": __vite_glob_0_49,"../assets/icons/user/user-svgrepo.svg": __vite_glob_0_50,"../assets/icons/user/usergrp-svgrepo.svg": __vite_glob_0_51,"../assets/images/backgrounds/blue-bg-school.jpg": __vite_glob_0_52,"../assets/images/classes/card-ballet.png": __vite_glob_0_53,"../assets/images/classes/card-model.png": __vite_glob_0_54,"../assets/images/classes/card-piano.png": __vite_glob_0_55,"../assets/images/classes/card-robamKhmer.png": __vite_glob_0_56,"../assets/images/classes/card-robotic.png": __vite_glob_0_57,"../assets/images/classes/card-taekwondo.png": __vite_glob_0_58,"../assets/images/common/logo-main.png": __vite_glob_0_59,"../assets/images/dashboard/branch.png": __vite_glob_0_60,"../assets/images/dashboard/card-available-program.png": __vite_glob_0_61,"../assets/images/dashboard/card-branch.png": __vite_glob_0_62,"../assets/images/dashboard/card-full-program.png": __vite_glob_0_63,"../assets/images/dashboard/card-guardian.png": __vite_glob_0_64,"../assets/images/dashboard/card-nearlyfull-program.png": __vite_glob_0_65,"../assets/images/dashboard/card-parent.png": __vite_glob_0_66,"../assets/images/dashboard/card-revenue.png": __vite_glob_0_67,"../assets/images/dashboard/card-student.png": __vite_glob_0_68,"../assets/images/dashboard/card-top-program.png": __vite_glob_0_69,"../assets/images/dashboard/card-trial.png": __vite_glob_0_70,"../assets/images/dashboard/enrollment.png": __vite_glob_0_71,"../assets/images/dashboard/high-payment.png": __vite_glob_0_72,"../assets/images/dashboard/on-time.png": __vite_glob_0_73,"../assets/images/dashboard/payment.png": __vite_glob_0_74,"../assets/images/dashboard/pending_payment.png": __vite_glob_0_75,"../assets/images/dashboard/refund.png": __vite_glob_0_76,"../assets/images/dashboard/registration.png": __vite_glob_0_77,"../assets/images/dashboard/transaction.png": __vite_glob_0_78,"../assets/images/dashboard/trial.png": __vite_glob_0_79,"../assets/images/data-metric-card/academic-history.png": __vite_glob_0_80,"../assets/images/data-metric-card/attendance.png": __vite_glob_0_81,"../assets/images/data-metric-card/behavior.png": __vite_glob_0_82,"../assets/images/data-metric-card/enrollment-capacity.png": __vite_glob_0_83,"../assets/images/data-metric-card/exam.png": __vite_glob_0_84,"../assets/images/data-metric-card/program-revenue.png": __vite_glob_0_85,"../assets/images/data-metric-card/remaining-sessions.png": __vite_glob_0_86,"../assets/images/data-metric-card/total-enrolled.png": __vite_glob_0_87,"../assets/images/enrollment/today-enrollment.png": __vite_glob_0_88,"../assets/images/enrollment/total-canceled-enrollment.png": __vite_glob_0_89,"../assets/images/enrollment/total-enrollment.png": __vite_glob_0_90,"../assets/images/enrollment/total-paid-enrollment.png": __vite_glob_0_91,"../assets/images/enrollment/total-unpaid-enrollment.png": __vite_glob_0_92,"../assets/images/parent/active-now.png": __vite_glob_0_93,"../assets/images/parent/paid-today.png": __vite_glob_0_94,"../assets/images/parent/recently-register.png": __vite_glob_0_95,"../assets/images/parent/total-guardian.png": __vite_glob_0_96,"../assets/images/parent/total-parent.png": __vite_glob_0_97,"../assets/images/parent/total-users.png": __vite_glob_0_98,"../assets/images/payment/refund-payment.png": __vite_glob_0_99,"../assets/images/payment/total-revenue.png": __vite_glob_0_100,"../assets/images/payment/total-transaction.png": __vite_glob_0_101,"../assets/images/payment/unpaid-payment.png": __vite_glob_0_102,"../assets/images/profiles/avatar-admin.png": __vite_glob_0_103,"../assets/images/profiles/avatar-boy.png": __vite_glob_0_104,"../assets/images/profiles/avatar-girl.png": __vite_glob_0_105,"../assets/images/profiles/avatar-guest.png": __vite_glob_0_106,"../assets/images/profiles/avatar-man.png": __vite_glob_0_107,"../assets/images/profiles/avatar-teacher-man.png": __vite_glob_0_108,"../assets/images/profiles/avatar-teacher-woman.png": __vite_glob_0_109,"../assets/images/profiles/avatar-woman.png": __vite_glob_0_110,"../assets/images/programs/active-program.png": __vite_glob_0_111,"../assets/images/programs/archived-program.png": __vite_glob_0_112,"../assets/images/programs/in-progress-program.png": __vite_glob_0_113,"../assets/images/programs/program.png": __vite_glob_0_114,"../assets/images/programs/total-program.png": __vite_glob_0_115,"../assets/images/programs/upcoming-program.png": __vite_glob_0_116,"../assets/images/student/currently-enrolled.png": __vite_glob_0_117,"../assets/images/student/currently-not-enrolled.png": __vite_glob_0_118,"../assets/images/student/graduated.png": __vite_glob_0_119,"../assets/images/student/newly-enrolled.png": __vite_glob_0_120,"../assets/images/student/stopped-enrolled.png": __vite_glob_0_121,"../assets/images/student/total-student.png": __vite_glob_0_122,"../assets/images/teacher/total-teacher.png": __vite_glob_0_123});

const normalize = (val) =>
  val
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') || '';

const resolveAsset = (category, path) => {
  if (
    !path ||
    path.startsWith('http') ||
    path.startsWith('/') ||
    path.startsWith('data:') ||
    path.includes('firebasestorage')
  ) {
    return path
  }

  const normPath = normalize(path);
  const extensions = ['', '.png', '.svg', '.jpg', '.webp', '.jpeg'];

  for (const ext of extensions) {
    const key = `../assets/${category}/${normPath}${ext}`;
    if (ASSETS[key]) return ASSETS[key].default || ASSETS[key]
  }

  return ''
};

const getImage = (p1, p2) => resolveAsset('images', p2 ? `${p1}/${p2}` : p1);
const getIcon = (p1, p2) => resolveAsset('icons', p2 ? `${p1}/${p2}` : p1);
const getImageUrl = getImage;
const getIconUrl = getIcon;

const getProgramProfileURL = (progUrl, catName, catUrl) => {
  if (progUrl) return resolveAsset('images', progUrl)
  if (catUrl) return resolveAsset('images', catUrl)
  if (catName) {
    const categoryAsset = resolveAsset('images', `categories/${normalize(catName)}`);
    if (categoryAsset) return categoryAsset
  }
  return resolveAsset('images', 'common/logo-main')
};
const getParentProfileURL = (url) =>
  resolveAsset('images', url) || resolveAsset('images', 'profiles/avatar-man');
const getStudentProfileURL = (url) =>
  resolveAsset('images', url) || resolveAsset('images', 'profiles/avatar-boy');
const getTeacherProfileURL = (url) =>
  resolveAsset('images', url) || resolveAsset('images', 'profiles/avatar-teacher-man');

const ACTION_ICONS = {
  edit: 'action/edit',
  pay: 'action/pay',
  cancel: 'action/cancel',
  delete: 'action/delete',
  view: 'action/eye-view',
  search: 'action/search',
  filter: 'action/filter',
  plus: 'action/plus-circle',
  download: 'action/download',
  upload: 'action/cloud-upload',
  save: 'action/cloud-upload',
  back: 'action/back',
  close: 'action/close',
  'eye-open': 'action/eye-open',
  'eye-close': 'action/eye-close',
  'reset-password': 'action/reset-password',
  reactivate: 'action/reactivate',
  deactivate: 'action/deactivate',
  email: 'action/email',
  cash: 'action/cash',
  branch: 'navigation/branch',
};

const getActionIcon = (name) => getIcon(ACTION_ICONS[normalize(name)] || name);

const getProfile = (name) => getImage('profiles', `avatar-${name}`);
const ALL_BUILTIN_AVATARS = [
  'boy',
  'girl',
  'man',
  'woman',
  'teacher-man',
  'teacher-woman',
].map(getProfile);

const isSameProfileAsset = (a, b) => {
  if (!a || !b) return a === b
  const core = (v) =>
    v
      .split('?')[0]
      .split('/')
      .pop()
      .split('.')[0]
      .replace(/^avatar-/, '')
      .toLowerCase()
      .trim();
  return core(a) === core(b)
};

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const _sfc_main$7 = {
  __name: 'AppAlert',
  props: {
  show: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: 'info',
    validator: (val) => ['success', 'warning', 'error', 'info'].includes(val),
  },
  message: {
    type: String,
    default: '',
  },
  closable: {
    type: Boolean,
    default: false,
  },
  customStyle: {
    type: Object,
    default: () => ({}),
  },
},
  emits: ['close'],
  setup(__props, { expose: __expose }) {
  __expose();



const variantClasses = {
  success: 'bg-success-soft border-success text-success-deep',
  error: 'bg-error-soft border-error text-error-deep',
  warning: 'bg-warning-soft border-warning text-warning-deep',
  info: 'bg-info-soft border-info text-info-deep',
};



const __returned__ = { variantClasses };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

const _hoisted_1$6 = { class: "flex-1 text-sm font-semibold leading-relaxed" };

function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createBlock(Transition, {
    "enter-active-class": "transition duration-300 ease-out",
    "enter-from-class": "opacity-0 -translate-y-2",
    "enter-to-class": "opacity-100 translate-y-0",
    "leave-active-class": "transition duration-200 ease-in",
    "leave-from-class": "opacity-100 translate-y-0",
    "leave-to-class": "opacity-0 -translate-y-2"
  }, {
    default: withCtx(() => [
      ($props.show)
        ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: normalizeClass(["flex items-start gap-md p-md rounded-sm border-l-4 shadow-sm relative transition-all", $setup.variantClasses[$props.type] || $setup.variantClasses.info]),
            style: normalizeStyle($props.customStyle)
          }, [
            createBaseVNode("div", _hoisted_1$6, [
              renderSlot(_ctx.$slots, "default", {}, () => [
                createTextVNode(toDisplayString($props.message), 1 /* TEXT */)
              ])
            ]),
            ($props.closable)
              ? (openBlock(), createElementBlock("button", {
                  key: 0,
                  class: "flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors cursor-pointer",
                  onClick: _cache[0] || (_cache[0] = $event => (_ctx.$emit('close')))
                }, [...(_cache[1] || (_cache[1] = [
                  createBaseVNode("span", { class: "text-lg leading-none" }, "×", -1 /* CACHED */)
                ]))]))
              : createCommentVNode("v-if", true)
          ], 6 /* CLASS, STYLE */))
        : createCommentVNode("v-if", true)
    ]),
    _: 3 /* FORWARDED */
  }))
}
const AppAlert = /*#__PURE__*/_export_sfc(_sfc_main$7, [['render',_sfc_render$7],['__file',"AppAlert.vue"]]);

const _sfc_main$6 = {
  __name: 'AppModal',
  props: {
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  success: {
    type: String,
    default: '',
  },
},
  emits: ['close'],
  setup(__props, { expose: __expose }) {
  __expose();





const __returned__ = { get getActionIcon() { return getActionIcon }, AppAlert };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

const _hoisted_1$5 = { class: "px-md sm:px-2xl py-md sm:py-xl border-b border-surface-light flex justify-between items-center bg-white" };
const _hoisted_2$5 = { class: "flex items-center gap-sm" };
const _hoisted_3$5 = ["src"];
const _hoisted_4$5 = { class: "m-0 text-lg sm:text-xl font-bold text-content-dark tracking-tight" };
const _hoisted_5$5 = ["src"];
const _hoisted_6$5 = { class: "p-md sm:p-xl flex-1 overflow-y-auto bg-white scrollable-v" };
const _hoisted_7$5 = {
  key: 0,
  class: "px-md sm:px-xl py-4 bg-white border-t border-surface-light shrink-0"
};
const _hoisted_8$4 = {
  key: 1,
  class: "px-md sm:px-xl py-md sm:py-lg bg-surface-subtle border-t border-surface-light flex flex-col sm:flex-row justify-end gap-sm sm:gap-md"
};

function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createBlock(Transition, {
    "enter-active-class": "transition duration-300 ease-out",
    "enter-from-class": "opacity-0",
    "enter-to-class": "opacity-100",
    "leave-active-class": "transition duration-200 ease-in",
    "leave-from-class": "opacity-100",
    "leave-to-class": "opacity-0"
  }, {
    default: withCtx(() => [
      ($props.show)
        ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "fixed inset-0 w-full h-screen bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-modal p-4 sm:p-md",
            onClick: _cache[3] || (_cache[3] = withModifiers($event => (_ctx.$emit('close')), ["self"]))
          }, [
            createVNode(Transition, {
              "enter-active-class": "transition duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)",
              "enter-from-class": "opacity-0 scale-90 translate-y-8",
              "enter-to-class": "opacity-100 scale-100 translate-y-0",
              "leave-active-class": "transition duration-250 ease-in",
              "leave-from-class": "opacity-100 scale-100 translate-y-0",
              "leave-to-class": "opacity-0 scale-95 translate-y-4",
              appear: ""
            }, {
              default: withCtx(() => [
                ($props.show)
                  ? (openBlock(), createElementBlock("div", {
                      key: 0,
                      class: normalizeClass(["bg-white rounded-std overflow-hidden shadow-2xl flex flex-col relative border border-white/30 w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]", [
            $props.variant === 'action' ? 'max-w-[95%] sm:max-w-xl' : 'max-w-full lg:max-w-5xl',
            $props.variant,
          ]]),
                      style: normalizeStyle($props.maxWidth ? { maxWidth: $props.maxWidth } : {})
                    }, [
                      createCommentVNode(" Header "),
                      createBaseVNode("div", _hoisted_1$5, [
                        renderSlot(_ctx.$slots, "header", {}, () => [
                          createBaseVNode("div", _hoisted_2$5, [
                            ($props.icon)
                              ? (openBlock(), createElementBlock("img", {
                                  key: 0,
                                  src: $props.icon,
                                  class: "w-6 h-6 object-contain opacity-80"
                                }, null, 8 /* PROPS */, _hoisted_3$5))
                              : createCommentVNode("v-if", true),
                            createBaseVNode("h3", _hoisted_4$5, toDisplayString($props.title), 1 /* TEXT */)
                          ])
                        ]),
                        createBaseVNode("button", {
                          class: "bg-surface-light w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-content-muted cursor-pointer transition-all duration-300 hover:bg-border hover:text-content-dark hover:rotate-90 group",
                          onClick: _cache[0] || (_cache[0] = $event => (_ctx.$emit('close')))
                        }, [
                          createBaseVNode("img", {
                            src: $setup.getActionIcon('close'),
                            class: "w-3 h-3 sm:w-4 sm:h-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                          }, null, 8 /* PROPS */, _hoisted_5$5)
                        ])
                      ]),
                      createCommentVNode(" Content Area "),
                      createBaseVNode("div", _hoisted_6$5, [
                        renderSlot(_ctx.$slots, "default")
                      ]),
                      createCommentVNode(" Sticky Alerts "),
                      ($props.error || $props.success)
                        ? (openBlock(), createElementBlock("div", _hoisted_7$5, [
                            ($props.error)
                              ? (openBlock(), createBlock($setup["AppAlert"], {
                                  key: 0,
                                  type: "error",
                                  message: $props.error,
                                  class: "mb-2 last:mb-0",
                                  closable: "",
                                  onClose: _cache[1] || (_cache[1] = $event => (_ctx.$emit('clear-error')))
                                }, null, 8 /* PROPS */, ["message"]))
                              : createCommentVNode("v-if", true),
                            ($props.success)
                              ? (openBlock(), createBlock($setup["AppAlert"], {
                                  key: 1,
                                  type: "success",
                                  message: $props.success,
                                  class: "mb-2 last:mb-0",
                                  closable: "",
                                  onClose: _cache[2] || (_cache[2] = $event => (_ctx.$emit('clear-success')))
                                }, null, 8 /* PROPS */, ["message"]))
                              : createCommentVNode("v-if", true)
                          ]))
                        : createCommentVNode("v-if", true),
                      createCommentVNode(" Footer "),
                      (_ctx.$slots.footer)
                        ? (openBlock(), createElementBlock("div", _hoisted_8$4, [
                            renderSlot(_ctx.$slots, "footer")
                          ]))
                        : createCommentVNode("v-if", true)
                    ], 6 /* CLASS, STYLE */))
                  : createCommentVNode("v-if", true)
              ]),
              _: 3 /* FORWARDED */
            })
          ]))
        : createCommentVNode("v-if", true)
    ]),
    _: 3 /* FORWARDED */
  }))
}
const AppModal = /*#__PURE__*/_export_sfc(_sfc_main$6, [['render',_sfc_render$6],['__file',"AppModal.vue"]]);

const COMMON_STATUSES = {
  active: 'green',
  upcoming: 'blue',
  archived: 'magenta',
  inactive: 'red',
  failed: 'red',
  success: 'green',
};

const REGISTRIES = {
  finance: {
    ...COMMON_STATUSES,
    paid: 'green',
    confirmed: 'green',
    unpaid: 'yellow',
    pending: 'yellow',
    partial: 'purple',
    cancelled: 'red',
    canceled: 'red',
    refunded: 'orange',
    'parent paid': 'green',
    sponsored: 'blue',
    full: 'magenta',
  },
  payment: {
    cash: 'green',
    aba: 'blue',
    acleda: 'blue',
    sathapana: 'blue',
    wing: 'yellow',
    aeon: 'purple',
  },
  academic: {
    ...COMMON_STATUSES,
    studying: 'green',
    graduated: 'blue',
    suspended: 'yellow',
    stopped: 'red',
    trial: 'purple',
    ongoing: 'green',
    passed: 'green',
    prospect: 'purple',
    intermediate: 'purple',
    'in progress': 'purple',
  },
  account: {
    ...COMMON_STATUSES,
    hold: 'orange',
  },
  gender: {
    female: 'pink',
    male: 'blue',
  },
  attendance: {
    present: 'green',
    'on-time': 'green',
    absent: 'red',
    late: 'blue',
  },
  role: {
    admin: 'red',
    teacher: 'purple',
    parent: 'magenta',
    student: 'blue',
  },
  tag: {
    online: 'blue',
    transfer: 'blue',
    'joined-today': 'magenta',
    'paid-today': 'green',
    'trial-today': 'purple',
    new: 'green',
    full: 'magenta',
    all: 'blue',
    group: 'purple',
    private: 'pink',
    hidden: 'blue',
  },
  trial: {
    booked: 'purple',
    'walk-in': 'magenta',
    successful: 'green',
  },
};

const THEMES = {
  green: { backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success-deep)' },
  yellow: { backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning-deep)' },
  orange: { backgroundColor: 'var(--color-orange-soft)', color: 'var(--color-orange-deep)' },
  red: { backgroundColor: 'var(--color-error-soft)', color: 'var(--color-error-deep)' },
  blue: { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary-deep)' },
  purple: { backgroundColor: 'var(--color-purple-soft)', color: 'var(--color-purple-deep)' },
  magenta: { backgroundColor: 'var(--color-magenta-soft)', color: 'var(--color-magenta-deep)' },
  pink: { backgroundColor: 'var(--color-pink-soft)', color: 'var(--color-pink-deep)' },
  gray: { backgroundColor: 'var(--color-gray-soft)', color: 'var(--color-gray-deep)' },
};

const THEME_FILTERS = {
  green: 'invert(15%) sepia(87%) saturate(1450%) hue-rotate(136deg) brightness(92%) contrast(101%)',
  yellow: 'invert(18%) sepia(91%) saturate(2464%) hue-rotate(24deg) brightness(91%) contrast(101%)',
  orange: 'invert(15%) sepia(99%) saturate(4138%) hue-rotate(10deg) brightness(96%) contrast(112%)',
  red: 'invert(13%) sepia(94%) saturate(5411%) hue-rotate(358deg) brightness(94%) contrast(110%)',
  blue: 'invert(36%) sepia(96%) saturate(1636%) hue-rotate(176deg) brightness(95%) contrast(105%)',
  purple:
    'invert(13%) sepia(77%) saturate(5603%) hue-rotate(272deg) brightness(85%) contrast(106%)',
  magenta:
    'invert(14%) sepia(85%) saturate(3174%) hue-rotate(318deg) brightness(94%) contrast(106%)',
  pink: 'invert(14%) sepia(85%) saturate(3174%) hue-rotate(318deg) brightness(94%) contrast(106%)',
  gray: 'invert(34%) sepia(12%) saturate(1001%) hue-rotate(175deg) brightness(97%) contrast(90%)',
};

const resolveColor = (value, module = null) => {
  if (module && THEMES[module.toLowerCase()]) return module.toLowerCase()
  if (!value) return 'gray'

  const key = String(value).toLowerCase().trim();

  // Module-specific lookup
  if (module && REGISTRIES[module]) return REGISTRIES[module][key] ?? 'gray'

  // Global lookup across all registries
  for (const group of Object.values(REGISTRIES)) {
    if (group[key]) return group[key]
  }

  return 'gray'
};

const getStatusUI = (value, module = null) => {
  const color = resolveColor(value, module);
  return {
    color,
    theme: THEMES[color] || THEMES.gray,
    filter: THEME_FILTERS[color] || 'none',
  }
};

const getStatusTheme = (value, module = null) => getStatusUI(value, module).theme;
const getStatusFilter = (value, module = null) => getStatusUI(value, module).filter;

const _sfc_main$5 = {
  __name: 'AppButton',
  props: {
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  icon: { type: String, default: '' },
  iconOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
},
  emits: ['click'],
  setup(__props, { expose: __expose }) {
  __expose();

const props = __props;

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-md',
  secondary:
    'bg-primary-light text-content-deep border border-primary-light/50 hover:bg-primary-light',
  danger: 'bg-error text-white hover:bg-error-deep',
  success: 'bg-success text-white hover:bg-success-deep',
  cancel: 'bg-surface-light text-content-muted hover:bg-surface-subtle hover:text-content-dark',
  ghost: 'bg-transparent text-content-muted hover:bg-surface-subtle hover:text-content-deep',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary-soft',
  light: 'bg-primary-soft text-primary hover:bg-primary-light',
  logout: 'bg-error text-white hover:bg-error-deep hover:scale-95 active:scale-90 shadow-md',
};

const sizeClasses = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

const buttonStyle = computed(() => {
  if (props.disabled || props.loading) return {}

  const ui = getStatusUI(props.variant);

  if (ui.color !== 'gray' || props.variant === 'gray') {
    return {
      backgroundColor: ui.theme.backgroundColor,
      color: ui.theme.color,
      borderColor: 'transparent',
    }
  }

  return {}
});

const isSemantic = computed(() => {
  if (variantClasses[props.variant]) return false
  const ui = getStatusUI(props.variant);
  return ui.color !== 'gray' || props.variant === 'gray'
});



const __returned__ = { props, variantClasses, sizeClasses, buttonStyle, isSemantic, computed, get getStatusUI() { return getStatusUI } };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

const _hoisted_1$4 = ["type", "disabled"];
const _hoisted_2$4 = {
  key: 0,
  class: "w-4 h-4 border-2 border-white/40 border-t-current rounded-full animate-spin mr-[-4px]"
};
const _hoisted_3$4 = {
  key: 1,
  class: "flex items-center justify-center"
};
const _hoisted_4$4 = {
  key: 2,
  class: "flex items-center justify-center text-[1.25em] translate-y-[0.5px]"
};
const _hoisted_5$4 = ["src"];
const _hoisted_6$4 = { key: 1 };
const _hoisted_7$4 = {
  key: 4,
  class: "flex items-center justify-center"
};

function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createElementBlock("button", {
    class: normalizeClass(["flex items-center justify-center gap-xs font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 active:scale-[0.98] select-none", [
      !$setup.isSemantic
        ? $setup.variantClasses[$props.variant] || $setup.variantClasses.primary
        : 'border border-transparent hover:brightness-95',
      $setup.sizeClasses[$props.size] || $setup.sizeClasses.md,
      {
        'opacity-60 cursor-not-allowed pointer-events-none grayscale-[0.2]': $props.disabled || $props.loading,
        'p-xs rounded-full': $props.iconOnly,
        'rounded-std': !$props.iconOnly,
        'shadow-sm': !$setup.isSemantic && !['ghost', 'cancel'].includes($props.variant) && !$props.disabled,
      },
    ]]),
    style: normalizeStyle($setup.buttonStyle),
    type: $props.type,
    disabled: $props.disabled || $props.loading,
    onClick: _cache[0] || (_cache[0] = $event => (_ctx.$emit('click', $event)))
  }, [
    ($props.loading)
      ? (openBlock(), createElementBlock("span", _hoisted_2$4))
      : createCommentVNode("v-if", true),
    (_ctx.$slots['icon-left'] && !$props.loading)
      ? (openBlock(), createElementBlock("span", _hoisted_3$4, [
          renderSlot(_ctx.$slots, "icon-left", {}, undefined, true)
        ]))
      : createCommentVNode("v-if", true),
    ($props.icon && !$props.loading)
      ? (openBlock(), createElementBlock("span", _hoisted_4$4, [
          ($props.icon.includes('/'))
            ? (openBlock(), createElementBlock("img", {
                key: 0,
                src: $props.icon,
                class: "w-[1em] h-[1em] object-contain"
              }, null, 8 /* PROPS */, _hoisted_5$4))
            : (openBlock(), createElementBlock("span", _hoisted_6$4, toDisplayString($props.icon), 1 /* TEXT */))
        ]))
      : createCommentVNode("v-if", true),
    (!$props.iconOnly && _ctx.$slots.default)
      ? (openBlock(), createElementBlock("span", {
          key: 3,
          class: normalizeClass(["w-full flex items-center justify-center gap-xs transition-opacity duration-200", { 'opacity-30': $props.loading }])
        }, [
          renderSlot(_ctx.$slots, "default", {}, undefined, true)
        ], 2 /* CLASS */))
      : createCommentVNode("v-if", true),
    (_ctx.$slots['icon-right'] && !$props.loading)
      ? (openBlock(), createElementBlock("span", _hoisted_7$4, [
          renderSlot(_ctx.$slots, "icon-right", {}, undefined, true)
        ]))
      : createCommentVNode("v-if", true)
  ], 14 /* CLASS, STYLE, PROPS */, _hoisted_1$4))
}
const AppButton = /*#__PURE__*/_export_sfc(_sfc_main$5, [['render',_sfc_render$5],['__scopeId',"data-v-8aecc2a0"],['__file',"AppButton.vue"]]);

const _sfc_main$4 = {
  __name: 'AppSelect',
  props: {
  modelValue: [String, Number, Array],
  items: {
    type: Array,
    default: () => [],
  },
  label: String,
  placeholder: {
    type: String,
    default: '-- Select --',
  },
  required: Boolean,
  disabled: Boolean,
  error: String,
  shake: Boolean,
  searchable: {
    type: Boolean,
    default: true,
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...',
  },
  multiple: Boolean,
  loading: Boolean,
},
  emits: ['update:modelValue', 'change', 'click-disabled'],
  setup(__props, { expose: __expose, emit: __emit }) {
  __expose();

const props = __props;

const emit = __emit;

const isOpen = ref(false);
const searchQuery = ref('');
const triggerRef = ref(null);
const dropdownMenuRef = ref(null);
const searchInput = ref(null);

const dropdownStyle = ref({});

const computeDropdownPosition = async () => {
  await nextTick();
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const dropdownMaxHeight = 280; // Max height based on 220px list + search + padding

  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  let top, bottom, transformOrigin;
  // If there's enough space below, or more space below than above
  if (spaceBelow >= dropdownMaxHeight || spaceBelow > spaceAbove) {
    top = `${rect.bottom + 2}px`;
    bottom = 'auto';
    transformOrigin = 'top center';
  } else {
    top = 'auto';
    bottom = `${viewportHeight - rect.top + 2}px`;
    transformOrigin = 'bottom center';
  }

  dropdownStyle.value = {
    top,
    bottom,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 9999,
    transformOrigin,
  };
};

const selectedItem = computed(() => {
  if (props.multiple) return null
  return props.items.find((item) => item.id == props.modelValue)
});

const selectedItems = computed(() => {
  if (!props.multiple || !Array.isArray(props.modelValue)) return []
  return props.items.filter((item) => props.modelValue.includes(item.id))
});

const filteredItems = computed(() => {
  let items = props.items;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(q));
  }
  return items
});

const toggleDropdown = () => {
  if (props.disabled) {
    emit('click-disabled');
    return
  }
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    computeDropdownPosition();
    setTimeout(() => {
      if (searchInput.value) searchInput.value.focus();
    }, 100);
  }
};

const selectItem = (item) => {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = current.indexOf(item.id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(item.id);
    }
    emit('update:modelValue', current);
    emit('change', current);
    // Re-calculate position as the height might have changed due to new tags
    computeDropdownPosition();
  } else {
    emit('update:modelValue', item.id);
    emit('change', item.id);
    isOpen.value = false;
  }
};

const handleClickOutside = (event) => {
  const clickedTrigger = triggerRef.value && triggerRef.value.contains(event.target);
  const clickedMenu = dropdownMenuRef.value && dropdownMenuRef.value.contains(event.target);
  if (!clickedTrigger && !clickedMenu) {
    isOpen.value = false;
  }
};

const handleScrollOrResize = () => {
  if (isOpen.value) {
    computeDropdownPosition();
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('scroll', handleScrollOrResize, true);
  window.addEventListener('resize', handleScrollOrResize);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('scroll', handleScrollOrResize, true);
  window.removeEventListener('resize', handleScrollOrResize);
});

const __returned__ = { props, emit, isOpen, searchQuery, triggerRef, dropdownMenuRef, searchInput, dropdownStyle, computeDropdownPosition, selectedItem, selectedItems, filteredItems, toggleDropdown, selectItem, handleClickOutside, handleScrollOrResize, ref, computed, watch, onMounted, onUnmounted, nextTick, get getActionIcon() { return getActionIcon } };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

const _hoisted_1$3 = {
  key: 0,
  class: "text-sm font-semibold text-content-muted flex items-center gap-1"
};
const _hoisted_2$3 = {
  key: 0,
  class: "text-error font-bold leading-none"
};
const _hoisted_3$3 = {
  class: "relative w-full",
  ref: "triggerRef"
};
const _hoisted_4$3 = { class: "flex items-center justify-between w-full px-4 py-2" };
const _hoisted_5$3 = {
  key: 0,
  class: "flex flex-wrap gap-2 flex-1 overflow-hidden"
};
const _hoisted_6$3 = { class: "w-10 h-10 rounded-full overflow-hidden border border-primary/30 bg-white shrink-0 shadow-sm" };
const _hoisted_7$3 = ["src"];
const _hoisted_8$3 = { class: "text-sm font-bold text-primary truncate max-w-40" };
const _hoisted_9$2 = ["onClick"];
const _hoisted_10$2 = {
  key: 0,
  class: "text-content-light text-sm italic opacity-70"
};
const _hoisted_11$2 = { class: "flex items-center gap-2 flex-1 overflow-hidden" };
const _hoisted_12$1 = { class: "w-7 h-7 rounded-full border border-outline-std overflow-hidden bg-white shrink-0" };
const _hoisted_13$1 = ["src"];
const _hoisted_14$1 = { class: "text-sm font-semibold text-content-dark truncate flex-1" };
const _hoisted_15$1 = {
  key: 2,
  class: "text-content-light text-sm italic opacity-70"
};
const _hoisted_16$1 = {
  key: 0,
  class: "p-2 border-b border-surface-light relative flex items-center bg-surface-subtle"
};
const _hoisted_17$1 = ["src"];
const _hoisted_18$1 = ["placeholder"];
const _hoisted_19$1 = {
  class: "list-none p-0 m-0 overflow-y-auto scrollable-v",
  style: {"max-height":"220px"}
};
const _hoisted_20$1 = ["onClick"];
const _hoisted_21$1 = { class: "flex items-center gap-3 w-full" };
const _hoisted_22$1 = { class: "w-8 h-8 rounded-md border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm group-hover/item:scale-105 transition-transform" };
const _hoisted_23$1 = ["src"];
const _hoisted_24$1 = { class: "text-sm group-hover/item:translate-x-1 transition-transform duration-200 font-semibold text-content-dark flex-1" };
const _hoisted_25$1 = {
  key: 0,
  class: "p-md text-center text-content-light text-sm italic flex items-center justify-center gap-2"
};
const _hoisted_26$1 = {
  key: 1,
  class: "p-md text-center text-content-light text-sm italic"
};
const _hoisted_27$1 = {
  key: 0,
  class: "text-sm font-semibold text-error pl-1 mt-0.5"
};

function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createElementBlock("div", {
    class: normalizeClass(["flex flex-col gap-xs text-left w-full", { 'animate-shake': $props.shake }])
  }, [
    ($props.label)
      ? (openBlock(), createElementBlock("label", _hoisted_1$3, [
          createTextVNode(toDisplayString($props.label) + " ", 1 /* TEXT */),
          ($props.required)
            ? (openBlock(), createElementBlock("span", _hoisted_2$3, "*"))
            : createCommentVNode("v-if", true)
        ]))
      : createCommentVNode("v-if", true),
    createBaseVNode("div", _hoisted_3$3, [
      createBaseVNode("div", {
        class: normalizeClass(["relative border-2 border-outline-std rounded-sm bg-surface-subtle cursor-pointer transition-all min-h-11 flex items-center group", {
          'border-primary bg-white ring-4 ring-primary/5': $setup.isOpen,
          'ui-input-invalid': $props.error,
          'opacity-60 cursor-not-allowed': $props.disabled,
        }]),
        onClick: $setup.toggleDropdown
      }, [
        createBaseVNode("div", _hoisted_4$3, [
          renderSlot(_ctx.$slots, "selected", {
            item: $setup.selectedItem,
            items: $setup.selectedItems
          }, () => [
            createCommentVNode(" Multiple Selection View "),
            ($props.multiple)
              ? (openBlock(), createElementBlock("div", _hoisted_5$3, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList($setup.selectedItems, (item) => {
                    return (openBlock(), createElementBlock("div", {
                      key: item.id,
                      class: "flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-sm pl-1.5 pr-2 py-1.5 group/tag animate-in zoom-in-95 duration-200"
                    }, [
                      createBaseVNode("div", _hoisted_6$3, [
                        createBaseVNode("img", {
                          src: item.profileURL || $setup.getActionIcon('edit'),
                          class: "w-full h-full object-cover"
                        }, null, 8 /* PROPS */, _hoisted_7$3)
                      ]),
                      createBaseVNode("span", _hoisted_8$3, toDisplayString(item.name), 1 /* TEXT */),
                      createBaseVNode("button", {
                        type: "button",
                        onClick: withModifiers($event => ($setup.selectItem(item)), ["stop"]),
                        class: "ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary/20 text-primary/40 hover:text-primary transition-colors"
                      }, [...(_cache[3] || (_cache[3] = [
                        createBaseVNode("svg", {
                          class: "w-3.5 h-3.5",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createBaseVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "3",
                            d: "M6 18L18 6M6 6l12 12"
                          })
                        ], -1 /* CACHED */)
                      ]))], 8 /* PROPS */, _hoisted_9$2)
                    ]))
                  }), 128 /* KEYED_FRAGMENT */)),
                  ($setup.selectedItems.length === 0)
                    ? (openBlock(), createElementBlock("span", _hoisted_10$2, toDisplayString($props.placeholder), 1 /* TEXT */))
                    : createCommentVNode("v-if", true)
                ]))
              : ($setup.selectedItem)
                ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                    createCommentVNode(" Single Selection View "),
                    createBaseVNode("div", _hoisted_11$2, [
                      createBaseVNode("div", _hoisted_12$1, [
                        createBaseVNode("img", {
                          src: $setup.selectedItem.profileURL || $setup.getActionIcon('edit'),
                          class: "w-full h-full object-cover"
                        }, null, 8 /* PROPS */, _hoisted_13$1)
                      ]),
                      createBaseVNode("span", _hoisted_14$1, toDisplayString($setup.selectedItem.name), 1 /* TEXT */),
                      renderSlot(_ctx.$slots, "selected-badge", { item: $setup.selectedItem })
                    ])
                  ], 2112 /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */))
                : (openBlock(), createElementBlock("span", _hoisted_15$1, toDisplayString($props.placeholder), 1 /* TEXT */))
          ]),
          createBaseVNode("span", {
            class: normalizeClass(["w-2.5 h-2.5 border-r-2 border-b-2 transform transition-transform duration-300 mr-0.5", $setup.isOpen ? 'rotate-[-135deg]' : 'rotate-45'])
          }, null, 2 /* CLASS */)
        ])
      ], 2 /* CLASS */)
    ], 512 /* NEED_PATCH */),
    (openBlock(), createBlock(Teleport, { to: "body" }, [
      createVNode(Transition, {
        "enter-active-class": "transition duration-200 ease-out",
        "enter-from-class": "opacity-0 scale-95 -translate-y-2",
        "enter-to-class": "opacity-100 scale-100 translate-y-0",
        "leave-active-class": "transition duration-150 ease-in",
        "leave-from-class": "opacity-100 scale-100 translate-y-0",
        "leave-to-class": "opacity-0 scale-95 -translate-y-2"
      }, {
        default: withCtx(() => [
          ($setup.isOpen)
            ? (openBlock(), createElementBlock("div", {
                key: 0,
                class: "fixed bg-white border-2 border-primary rounded-sm shadow-2xl overflow-hidden",
                style: normalizeStyle($setup.dropdownStyle),
                ref: "dropdownMenuRef",
                onClick: _cache[2] || (_cache[2] = withModifiers(() => {}, ["stop"]))
              }, [
                ($props.searchable)
                  ? (openBlock(), createElementBlock("div", _hoisted_16$1, [
                      createBaseVNode("img", {
                        src: $setup.getActionIcon('search'),
                        class: "absolute left-4 w-4 h-4 opacity-40 pointer-events-none"
                      }, null, 8 /* PROPS */, _hoisted_17$1),
                      withDirectives(createBaseVNode("input", {
                        type: "text",
                        "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => (($setup.searchQuery) = $event)),
                        placeholder: $props.searchPlaceholder,
                        class: "w-full py-2.5 pl-10 pr-4 border-2 border-outline-std rounded-sm text-sm outline-none focus:border-primary transition-all font-semibold",
                        onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"])),
                        ref: "searchInput"
                      }, null, 8 /* PROPS */, _hoisted_18$1), [
                        [vModelText, $setup.searchQuery]
                      ])
                    ]))
                  : createCommentVNode("v-if", true),
                createBaseVNode("ul", _hoisted_19$1, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList($setup.filteredItems, (item) => {
                    return (openBlock(), createElementBlock("li", {
                      key: item.id,
                      class: normalizeClass(["px-md py-sm flex items-center gap-sm cursor-pointer transition-colors hover:bg-surface-light group/item", {
                'bg-primary-light text-primary font-bold': $props.multiple
                  ? Array.isArray($props.modelValue) && $props.modelValue.includes(item.id)
                  : $props.modelValue == item.id,
              }]),
                      onClick: $event => ($setup.selectItem(item))
                    }, [
                      renderSlot(_ctx.$slots, "item", { item: item }, () => [
                        createBaseVNode("div", _hoisted_21$1, [
                          createBaseVNode("div", _hoisted_22$1, [
                            createBaseVNode("img", {
                              src: item.profileURL || $setup.getActionIcon('edit'),
                              class: "w-full h-full object-cover"
                            }, null, 8 /* PROPS */, _hoisted_23$1)
                          ]),
                          createBaseVNode("span", _hoisted_24$1, toDisplayString(item.name), 1 /* TEXT */),
                          renderSlot(_ctx.$slots, "item-badge", { item: item })
                        ])
                      ])
                    ], 10 /* CLASS, PROPS */, _hoisted_20$1))
                  }), 128 /* KEYED_FRAGMENT */)),
                  ($props.loading)
                    ? (openBlock(), createElementBlock("li", _hoisted_25$1, [...(_cache[4] || (_cache[4] = [
                        createBaseVNode("div", { class: "w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" }, null, -1 /* CACHED */),
                        createTextVNode(" Loading... ", -1 /* CACHED */)
                      ]))]))
                    : ($setup.filteredItems.length === 0)
                      ? (openBlock(), createElementBlock("li", _hoisted_26$1, " No matches found. "))
                      : createCommentVNode("v-if", true)
                ])
              ], 4 /* STYLE */))
            : createCommentVNode("v-if", true)
        ]),
        _: 3 /* FORWARDED */
      })
    ])),
    createVNode(Transition, {
      "enter-active-class": "transition duration-200 ease-out",
      "enter-from-class": "opacity-0 -translate-y-1",
      "enter-to-class": "opacity-100 translate-y-0",
      "leave-active-class": "transition duration-150 ease-in",
      "leave-from-class": "opacity-100 translate-y-0",
      "leave-to-class": "opacity-0 -translate-y-1"
    }, {
      default: withCtx(() => [
        ($props.error)
          ? (openBlock(), createElementBlock("p", _hoisted_27$1, toDisplayString($props.error), 1 /* TEXT */))
          : createCommentVNode("v-if", true)
      ]),
      _: 1 /* STABLE */
    })
  ], 2 /* CLASS */))
}
const AppSelect = /*#__PURE__*/_export_sfc(_sfc_main$4, [['render',_sfc_render$4],['__file',"AppSelect.vue"]]);

const _sfc_main$3 = {
  __name: 'AppInput',
  props: {
  modelValue: [String, Number],
  label: String,
  type: {
    type: String,
    default: 'text',
  },
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
  shake: Boolean,
  inputClass: String,
},
  emits: ['update:modelValue', 'click-disabled'],
  setup(__props, { expose: __expose }) {
  __expose();

const props = __props;



const isPasswordVisible = ref(false);

const inputType = computed(() => {
  if (props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password'
  }
  return props.type
});

const togglePassword = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};

const __returned__ = { props, isPasswordVisible, inputType, togglePassword, ref, computed, get getActionIcon() { return getActionIcon } };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

const _hoisted_1$2 = {
  key: 0,
  class: "text-sm font-semibold text-content-muted flex items-center gap-1"
};
const _hoisted_2$2 = {
  key: 0,
  class: "text-error font-bold leading-none"
};
const _hoisted_3$2 = { class: "relative group" };
const _hoisted_4$2 = ["value", "placeholder", "required", "disabled"];
const _hoisted_5$2 = ["value", "type", "placeholder", "required", "disabled"];
const _hoisted_6$2 = ["src"];
const _hoisted_7$2 = {
  key: 3,
  class: "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
};
const _hoisted_8$2 = {
  key: 0,
  class: "text-sm font-semibold text-error pl-1 mt-0.5"
};

function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createElementBlock("div", {
    class: normalizeClass(["flex flex-col gap-xs text-left w-full", { 'animate-shake': $props.shake }])
  }, [
    ($props.label)
      ? (openBlock(), createElementBlock("label", _hoisted_1$2, [
          createTextVNode(toDisplayString($props.label) + " ", 1 /* TEXT */),
          ($props.required)
            ? (openBlock(), createElementBlock("span", _hoisted_2$2, "*"))
            : createCommentVNode("v-if", true)
        ]))
      : createCommentVNode("v-if", true),
    createBaseVNode("div", _hoisted_3$2, [
      ($props.type === 'textarea')
        ? (openBlock(), createElementBlock("textarea", {
            key: 0,
            value: $props.modelValue,
            placeholder: $props.placeholder,
            required: $props.required,
            disabled: $props.disabled,
            onInput: _cache[0] || (_cache[0] = $event => (_ctx.$emit('update:modelValue', $event.target.value))),
            class: normalizeClass(["w-full px-4 py-3 border-2 border-outline-std rounded-sm bg-white text-base outline-none transition-all placeholder:text-content-light/50 placeholder:italic min-h-24 resize-none", [
          $props.error ? 'ui-input-invalid' : 'focus:border-primary focus:ring-[3px] focus:ring-info-soft',
          $props.disabled ? 'bg-surface-subtle opacity-60 cursor-not-allowed' : 'hover:border-primary/50',
          $props.inputClass,
        ]])
          }, null, 42 /* CLASS, PROPS, NEED_HYDRATION */, _hoisted_4$2))
        : (openBlock(), createElementBlock("input", {
            key: 1,
            value: $props.modelValue,
            type: $setup.inputType,
            placeholder: $props.placeholder,
            required: $props.required,
            disabled: $props.disabled,
            onInput: _cache[1] || (_cache[1] = $event => (_ctx.$emit('update:modelValue', $event.target.value))),
            class: normalizeClass(["w-full px-4 py-3 border-2 border-outline-std rounded-sm bg-white text-base outline-none transition-all placeholder:text-content-light/50 placeholder:italic", [
          $props.error ? 'ui-input-invalid' : 'focus:border-primary focus:ring-[3px] focus:ring-info-soft',
          $props.disabled ? 'bg-surface-subtle opacity-60 cursor-not-allowed' : 'hover:border-primary/50',
          $props.inputClass,
        ]])
          }, null, 42 /* CLASS, PROPS, NEED_HYDRATION */, _hoisted_5$2)),
      createCommentVNode(" Password Toggle "),
      ($props.type === 'password')
        ? (openBlock(), createElementBlock("button", {
            key: 2,
            type: "button",
            onClick: $setup.togglePassword,
            class: "absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-0 flex items-center opacity-40 hover:opacity-80 transition-opacity"
          }, [
            createBaseVNode("img", {
              src: $setup.isPasswordVisible ? $setup.getActionIcon('eye-close') : $setup.getActionIcon('eye-open'),
              alt: "Toggle visibility",
              class: "w-5 h-5"
            }, null, 8 /* PROPS */, _hoisted_6$2)
          ]))
        : createCommentVNode("v-if", true),
      createCommentVNode(" Unit/Icon Suffix (Optional) "),
      (_ctx.$slots.suffix)
        ? (openBlock(), createElementBlock("div", _hoisted_7$2, [
            renderSlot(_ctx.$slots, "suffix")
          ]))
        : createCommentVNode("v-if", true),
      ($props.disabled)
        ? (openBlock(), createElementBlock("div", {
            key: 4,
            class: "absolute inset-0 z-10 cursor-not-allowed",
            onClick: _cache[2] || (_cache[2] = withModifiers($event => (_ctx.$emit('click-disabled')), ["stop"]))
          }))
        : createCommentVNode("v-if", true)
    ]),
    createCommentVNode(" Error Message "),
    createVNode(Transition, {
      "enter-active-class": "transition duration-200 ease-out",
      "enter-from-class": "opacity-0 -translate-y-1",
      "enter-to-class": "opacity-100 translate-y-0",
      "leave-active-class": "transition duration-150 ease-in",
      "leave-from-class": "opacity-100 translate-y-0",
      "leave-to-class": "opacity-0 -translate-y-1"
    }, {
      default: withCtx(() => [
        ($props.error)
          ? (openBlock(), createElementBlock("p", _hoisted_8$2, toDisplayString($props.error), 1 /* TEXT */))
          : createCommentVNode("v-if", true)
      ]),
      _: 1 /* STABLE */
    })
  ], 2 /* CLASS */))
}
const AppInput = /*#__PURE__*/_export_sfc(_sfc_main$3, [['render',_sfc_render$3],['__file',"AppInput.vue"]]);

const _sfc_main$2 = {
  __name: 'AppBadge',
  props: {
  value: { type: [String, Number], default: '' },
  status: { type: [String, Number], default: '' },
  type: { type: String, default: '' },
  colorValue: { type: [String, Number], default: '' },
},
  setup(__props, { expose: __expose }) {
  __expose();

const props = __props;

const badgeValue = computed(() => props.value || props.status);
const badgeStyle = computed(() => getStatusTheme(props.colorValue || badgeValue.value, props.type));

const displayLabel = computed(() => {
  if (badgeValue.value === null || badgeValue.value === undefined || badgeValue.value === '')
    return ''

  const val = String(badgeValue.value);

  // Don't capitalize if it's a price or already has multiple caps
  if (val.startsWith('$') || /^[A-Z]{2,}/.test(val)) return val

  // Capitalize first letter of each word
  return val
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
});

const __returned__ = { props, badgeValue, badgeStyle, displayLabel, computed, get getStatusTheme() { return getStatusTheme } };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createElementBlock("span", {
    class: "inline-flex items-center justify-center w-fit px-3.5 py-1 rounded-full text-sm font-bold leading-none whitespace-nowrap text-center transition-all",
    style: normalizeStyle($setup.badgeStyle)
  }, [
    renderSlot(_ctx.$slots, "default", {}, () => [
      createTextVNode(toDisplayString($setup.displayLabel), 1 /* TEXT */)
    ])
  ], 4 /* STYLE */))
}
const AppBadge = /*#__PURE__*/_export_sfc(_sfc_main$2, [['render',_sfc_render$2],['__file',"AppBadge.vue"]]);

/**
 * Utility functions for data formatting, date parsing, and time calculations.
 * Part of the "Universal Perfect State" data layer.
 */

/** Global Constants */
const DEFAULT_CAPACITY = 5;

/** Date Formatting Utils */

/**
 * 1. Date & Age Logic
 */

/**
 * Parses various date formats into a standard JS Date object.
 * Supports ISO strings, timestamps, and Firestore Timestamp objects.
 *
 * @param {any} val - Raw date value
 * @returns {Date} Parsed date object
 */
const parseDate = (val) => {
  if (!val) return new Date(0)
  if (typeof val === 'object') {
    if ('seconds' in val) return new Date(val.seconds * 1000)
    if ('_seconds' in val) return new Date(val._seconds * 1000)
    if (typeof val.toDate === 'function') return val.toDate()
  }
  return new Date(val)
};

/**
 * Formats a date into a human-readable string (e.g., "17 April 2026 at 09:12 PM").
 */
const formatDate = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val);
  if (isNaN(date.getTime())) return 'N/A'

  const d = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${d} at ${t}`
};

/**
 * Formats a date into a long-date string without time (e.g., "17 April 2026").
 */
const formatDateOnly = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val);
  return isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
};

/**
 * Formats a date into a short string (e.g., "17 Apr 26").
 */
const formatShortDate = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val);
  if (isNaN(date.getTime())) return 'N/A'
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`
};

/**
 * Calculates current age based on a birth date.
 *
 * @param {any} val - Birth date
 * @returns {number|string} Calculated age or "N/A"
 */
const calculateAge = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val);
  if (isNaN(date.getTime())) return 'N/A'
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  )
    age--;
  return age
};

/**
 * 2. Time & Duration Logic
 */

/**
 * Converts a 24h time string (HH:mm) into total minutes from midnight.
 */
const timeToMinutes = (t) => {
  if (!t || !t.includes(':')) return 0
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0)
};

/**
 * Converts total minutes into a 24h time string (HH:mm).
 */
const minutesToTime = (m) => {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
};

/**
 * Calculates end time based on start time and duration in minutes.
 */
const calculateEndTime = (start, duration) =>
  minutesToTime(timeToMinutes(start) + parseInt(duration || 0));

/**
 * Calculates the difference in minutes between two time strings.
 */
const calculateDuration = (start, end) => {
  let s = timeToMinutes(start),
    e = timeToMinutes(end);
  if (e < s) e += 1440;
  return e - s
};

/**
 * 3. Financial & Currency Logic
 */

/**
 * Formats a numeric value into a clean price string.
 */
const formatPrice = (val) => {
  const num = Number(val);
  if (isNaN(num) || val === '' || val === null) return '0'
  return Number(num.toFixed(2)).toString()
};
/**
 * 4. Academic Progress Logic
 */

/**
 * Calculates class progress and dynamic status based on term dates and timeslots.
 *
 * @param {string} startDate - Term start date
 * @param {string} endDate - Term end date
 * @param {string} day - Class day (optional)
 * @param {string} time - Class timeslot (optional, e.g. "09:00 AM - 10:30 AM")
 * @param {number} currentCount - Current student count
 * @param {number} capacity - Max capacity
 * @returns {object} Progress stats { week, status, percentage, totalWeeks, isOngoing, isArchived }
 */
const calculateClassProgress = (startDate, endDate, day = null, time = null) => {
  if (!startDate || !endDate)
    return {
      status: 'N/A',
      week: 0,
      percentage: 0,
      totalWeeks: 0,
      isArchived: false,
      isOngoing: false,
    }

  // Normalize all dates to Local Midnight for consistent comparison
  const normalizeLocal = (d) => {
    const date = parseDate(d);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  };

  const todayDate = normalizeLocal(new Date());
  const startDateOnly = normalizeLocal(startDate);
  const endDateOnly = normalizeLocal(endDate);

  // Total weeks in term (Day-inclusive calculation)
  const diffDays = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000)) + 1;
  const totalWeeks = Math.ceil(diffDays / 7);

  // Calculate academic progress
  const elapsedMs = todayDate - startDateOnly;

  let currentWeek = 0;
  let sessionHasPassed = false;

  if (elapsedMs >= 0) {
    currentWeek = Math.min(totalWeeks, Math.floor(elapsedMs / (7 * 24 * 60 * 60 * 1000)) + 1);

    // Check if the session for the current week has likely passed
    // (Simple logic: if today is past the start of the week.
    // In a future update, this could be refined with the actual 'day' parameter)
    const currentWeekStartDate = new Date(startDateOnly);
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() + (currentWeek - 1) * 7);
    sessionHasPassed = todayDate > currentWeekStartDate;
  }

  const remainingSessions = Math.max(0, totalWeeks - currentWeek + (sessionHasPassed ? 0 : 1));
  const percentage =
    currentWeek === 0 ? 0 : Math.min(100, Math.round((currentWeek / totalWeeks) * 100));

  // ── Status Priority Logic ──

  // 1. Check for Ongoing status (Dynamic temporary override)
  let isOngoing = false;
  if (
    todayDate.getTime() >= startDateOnly.getTime() &&
    todayDate.getTime() <= endDateOnly.getTime() &&
    day &&
    time
  ) {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = dayNames[today.getDay()];

    if (day === todayDayName) {
      const [startStr, endStr] = time.split(' - ');
      if (startStr && endStr) {
        const parseTime = (str) => {
          const [time, period] = str.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (period === 'PM' && h < 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          return h * 60 + m
        };
        const currentMins = today.getHours() * 60 + today.getMinutes();
        if (currentMins >= parseTime(startStr) && currentMins <= parseTime(endStr)) {
          isOngoing = true;
        }
      }
    }
  }

  let status = 'active';
  if (todayDate > endDateOnly) {
    status = 'archived';
  } else if (isOngoing) {
    status = 'ongoing';
  } else if (todayDate < startDateOnly) {
    status = 'upcoming';
  }

  return {
    status,
    weekInfo:
      currentWeek === 0
        ? `Starts in ${Math.round(Math.abs(elapsedMs) / (24 * 60 * 60 * 1000))} days`
        : `Week ${currentWeek}/${totalWeeks}`,
    week: currentWeek,
    remainingSessions: status === 'upcoming' ? totalWeeks : remainingSessions,
    percentage,
    totalWeeks,
    isOngoing,
    isArchived: status === 'archived',
  }
};

/**
 * Generates a list of all scheduled session dates for a class based on term and schedule.
 *
 * @param {string} startDate
 * @param {string} dayOfWeek - e.g. "Monday"
 * @param {number} totalSessions - Total number of sessions to generate
 * @param {string} endDate - Optional end date to stop generation
 * @param {Array} excludeDates - Optional list of ISO date strings to skip (holidays, etc.)
 * @returns {Array} List of { id, label, date } objects
 */
const generateClassSessions = (
  startDate,
  dayOfWeek,
  totalSessions = 12,
  endDate = null,
  excludeDates = [],
) => {
  if (!startDate || !dayOfWeek) return []
  const normalize = (d) => {
    const date = parseDate(d);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  };

  const start = normalize(startDate);
  const end = endDate ? normalize(endDate) : null;
  const total = parseInt(totalSessions) || 12;
  const skippedSet = new Set(
    (excludeDates || []).map((d) => normalize(d).toISOString().split('T')[0]),
  );

  const dates = [];
  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = dayMap[dayOfWeek];
  if (targetDay === undefined) return []

  let current = new Date(start);
  // Find first occurrence of the target day
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1);
  }

  let sessionsFound = 0;
  let safetyCounter = 0;
  while (sessionsFound < total && safetyCounter < 365) {
    if (end && current > end) break

    const dateStr = current.toISOString().split('T')[0];
    if (!skippedSet.has(dateStr)) {
      dates.push({
        id: sessionsFound + 1,
        label: `Session ${sessionsFound + 1}`,
        date: new Date(current),
      });
      sessionsFound++;
    }
    current.setDate(current.getDate() + 7);
    safetyCounter++;
  }
  return dates
};

const _sfc_main$1 = {
  __name: 'AppConfirmOverlay',
  props: {
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: undefined },
  totalLabel: { type: String, default: 'Total' },
  confirmLabel: { type: String, default: 'Confirm & Submit' },
  loading: { type: Boolean, default: false },
},
  emits: ['confirm', 'back'],
  setup(__props, { expose: __expose }) {
  __expose();





const __returned__ = { AppButton, AppBadge, get formatPrice() { return formatPrice } };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

const _hoisted_1$1 = { class: "app-confirm-card" };
const _hoisted_2$1 = { class: "app-confirm-header" };
const _hoisted_3$1 = ["src"];
const _hoisted_4$1 = { class: "app-confirm-title" };
const _hoisted_5$1 = { class: "app-confirm-sub" };
const _hoisted_6$1 = { class: "app-confirm-body" };
const _hoisted_7$1 = { class: "app-confirm-key" };
const _hoisted_8$1 = {
  key: 0,
  class: "app-confirm-row app-confirm-row--total"
};
const _hoisted_9$1 = { class: "app-confirm-key" };
const _hoisted_10$1 = { class: "app-confirm-total" };
const _hoisted_11$1 = { class: "app-confirm-actions" };

function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createBlock(Transition, {
    "enter-active-class": "transition duration-200 ease-out",
    "enter-from-class": "opacity-0 scale-95",
    "enter-to-class": "opacity-100 scale-100",
    "leave-active-class": "transition duration-150 ease-in",
    "leave-from-class": "opacity-100",
    "leave-to-class": "opacity-0"
  }, {
    default: withCtx(() => [
      ($props.show)
        ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "app-confirm-overlay",
            onClick: _cache[2] || (_cache[2] = withModifiers($event => (_ctx.$emit('back')), ["self"]))
          }, [
            createBaseVNode("div", _hoisted_1$1, [
              createBaseVNode("div", _hoisted_2$1, [
                ($props.icon)
                  ? (openBlock(), createElementBlock("img", {
                      key: 0,
                      src: $props.icon,
                      class: "app-confirm-icon",
                      alt: ""
                    }, null, 8 /* PROPS */, _hoisted_3$1))
                  : createCommentVNode("v-if", true),
                createBaseVNode("h3", _hoisted_4$1, toDisplayString($props.title || 'Confirm Details'), 1 /* TEXT */),
                createBaseVNode("p", _hoisted_5$1, toDisplayString($props.subtitle || 'Please review carefully before submitting.'), 1 /* TEXT */)
              ]),
              createBaseVNode("div", _hoisted_6$1, [
                (openBlock(true), createElementBlock(Fragment, null, renderList($props.rows, (row) => {
                  return (openBlock(), createElementBlock("div", {
                    key: row.key,
                    class: normalizeClass(["app-confirm-row", row.class])
                  }, [
                    createBaseVNode("span", _hoisted_7$1, toDisplayString(row.key), 1 /* TEXT */),
                    createCommentVNode(" Slot-based custom rendering per row "),
                    renderSlot(_ctx.$slots, `row-${row.key}`, { row: row }, () => [
                      (row.badge)
                        ? (openBlock(), createBlock($setup["AppBadge"], {
                            key: 0,
                            status: row.value,
                            type: row.type
                          }, null, 8 /* PROPS */, ["status", "type"]))
                        : (openBlock(), createElementBlock("span", {
                            key: 1,
                            class: normalizeClass(["app-confirm-val", row.valueClass])
                          }, toDisplayString(row.value ?? '—'), 3 /* TEXT, CLASS */))
                    ], true)
                  ], 2 /* CLASS */))
                }), 128 /* KEYED_FRAGMENT */)),
                createCommentVNode(" Total Amount Row (Optional) "),
                ($props.totalAmount !== undefined)
                  ? (openBlock(), createElementBlock("div", _hoisted_8$1, [
                      createBaseVNode("span", _hoisted_9$1, toDisplayString($props.totalLabel || 'Total'), 1 /* TEXT */),
                      createBaseVNode("span", _hoisted_10$1, "$" + toDisplayString($setup.formatPrice($props.totalAmount)), 1 /* TEXT */)
                    ]))
                  : createCommentVNode("v-if", true)
              ]),
              createBaseVNode("div", _hoisted_11$1, [
                createBaseVNode("button", {
                  type: "button",
                  class: "ui-btn-cancel",
                  onClick: _cache[0] || (_cache[0] = $event => (_ctx.$emit('back')))
                }, "Go back"),
                createVNode($setup["AppButton"], {
                  type: "button",
                  variant: "primary",
                  loading: $props.loading,
                  onClick: _cache[1] || (_cache[1] = $event => (_ctx.$emit('confirm')))
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString($props.confirmLabel || 'Confirm & Submit'), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["loading"])
              ])
            ])
          ]))
        : createCommentVNode("v-if", true)
    ]),
    _: 3 /* FORWARDED */
  }))
}
const AppConfirmOverlay = /*#__PURE__*/_export_sfc(_sfc_main$1, [['render',_sfc_render$1],['__scopeId',"data-v-e9074537"],['__file',"AppConfirmOverlay.vue"]]);

/**
 * Utility for parsing and formatting session schedule strings or objects.
 * This helper ensures that varied schedule inputs (legacy strings or new objects)
 * are processed into a predictable format for the UI.
 */

/**
 * Mapping of day abbreviations to full day names for consistent title-cased output.
 */
const DAY_MAP = {
  mon: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/**
 * Extracts and formats the day of the week from a schedule source.
 * Supports legacy formats (e.g., "Day: Mon") and standardized objects.
 *
 * @param {string|Object} schedule - Schedule data (string or { day: string })
 * @param {boolean} full - If true, returns full name (e.g. "Monday"), otherwise "MON"
 * @returns {string} The formatted day name or "N/A" if invalid
 */
const getSessionDay = (schedule, full = false) => {
  if (!schedule) return 'N/A'

  const rawDay = (typeof schedule === 'object' ? schedule.day : String(schedule))
    ?.replace(/Day:/i, '')
    .trim()
    .split(/[\s,:(]/)[0];

  if (!rawDay || rawDay.toLowerCase() === 'n/a') return 'N/A'

  if (full) {
    const key = rawDay.toLowerCase();
    return DAY_MAP[key] || rawDay.charAt(0) + rawDay.slice(1).toLowerCase()
  }

  return rawDay.substring(0, 3)
};

/**
 * Extracts the time slot (e.g., "09:00 - 10:30") from a schedule source.
 * Cleans prefix labels like "Timeslot:" or "Time:" and extracts bracketed content.
 *
 * @param {string|Object} schedule - Schedule data (string or { timeslot: string })
 * @returns {string} The formatted time slot or "TBD" if not found
 */
const getSessionTime = (schedule) => {
  if (!schedule) return ''
  if (typeof schedule === 'object') {
    return schedule.time || 'TBD'
  }

  const rawStr = String(schedule)
    .replace(/Timeslot:|Time:|Day:/gi, '')
    .trim();

  const match = rawStr.match(/\((.*?)\)/);
  if (match) return match[1]

  const firstWord = rawStr.split(/[\s,:]/)[0];
  if (!firstWord) return rawStr

  return rawStr
    .substring(firstWord.length)
    .replace(/^[\s,:(]+/, '')
    .replace(/\)$/, '')
    .trim()
};

const _sfc_main = {
  __name: 'EnrollmentActionModal',
  props: {
  isOpen: Boolean,
  type: String,
  enrollment: Object,
  resolvedSummary: Object,
  loading: Boolean,
  error: String,
  success: String,
},
  emits: ['close', 'submit', 'update:error'],
  setup(__props, { expose: __expose, emit: __emit }) {
  __expose();

const props = __props;

const emit = __emit;

const cancelPresets = ['Schedule Conflict', 'Relocation', 'Financial Issue', 'Duplicated'];
const activePreset = ref('');

const getInitialData = () => ({
  proof: '',
  bankName: '',
  remark: '',
  reason: '',
  deleteConfirm: '',
  paymentMethod: 'online',
  paymentStatus: 'paid',
});

const { localData, isDirty, errors, shaking, clearError, validate } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    sourceKey: 'enrollment',
    autoClear: 3000,
  },
);

const selectPreset = (preset) => {
  if (activePreset.value === preset) {
    activePreset.value = '';
    localData.reason = '';
  } else {
    activePreset.value = preset;
    localData.reason = preset;
  }
};

const showConfirm = ref(false);

const getValidationRules = () => {
  const rules = { required: [], custom: {} };
  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm';
  } else if (props.type === 'cancel') {
    rules.required = ['reason'];
  } else if (props.type === 'pay') {
    if (localData.paymentMethod === 'online') rules.required.push('bankName');
    rules.required.push('proof');
  }
  return rules
};

const requestConfirm = () => {
  const rules = getValidationRules();
  const requiresValidation = rules.required.length > 0 || Object.keys(rules.custom).length > 0;
  if (requiresValidation && !validate(rules)) return
  showConfirm.value = true;
};

const handleActionSubmit = () => {
  showConfirm.value = false;
  emit('submit', { ...localData });
};

const confirmOverlayTitle = computed(() => {
  const titles = {
    pay: 'Confirm Payment',
    cancel: 'Confirm Cancellation',
    delete: 'Confirm Deletion',
  };
  return titles[props.type] || 'Confirm Action'
});

const confirmOverlaySubtitle = computed(() => {
  if (props.type === 'delete')
    return 'This action is irreversible. All data will be permanently erased.'
  if (props.type === 'cancel')
    return 'This seat will be permanently released from the session schedule.'
  return 'Please verify the details before completing this action.'
});

const displaySummary = computed(() => {
  if (props.resolvedSummary) return props.resolvedSummary
  const e = props.enrollment;
  if (!e) return null

  const classObj = e.class || {};
  const branchObj = classObj.branch || e.branch || {};
  const scheduleSource = classObj.schedule || e.classSchedule;

  return {
    studentName: e.student?.name,
    programName: e.program?.name,
    amount: e.finalPrice || e.totalPrice || e.amount || 0,
    status: e.status || 'Pending',
    studentAvatar: e.student?.profileURL || null,
    parentAvatar: e.parent?.profileURL || null,
    programAvatar: e.program?.profileURL || null,
    parentName: e.parent?.name || 'Parent',
    className: classObj.name || 'N/A',
    scheduleDay: getSessionDay(scheduleSource),
    scheduleTime: getSessionTime(scheduleSource),
    branchName: branchObj.name || branchObj.abbr || 'HQ',
    branchAbbr: branchObj.abbr || 'HQ',
    branchColor: branchObj.color || 'blue',
    classAvatar: getActionIcon('calendar'),
  }
});

const confirmOverlayIcon = computed(() => {
  if (props.type === 'pay') return getImageUrl('enrollment/total-paid-enrollment')
  if (props.type === 'cancel') return getImageUrl('enrollment/total-canceled-enrollment')
  return getActionIcon('delete')
});

const confirmRows = computed(() => {
  const summary = displaySummary.value;
  const base = [
    { key: 'Student', value: summary?.studentName },
    { key: 'Program', value: summary?.programName },
    { key: 'Amount', value: `$${formatPrice(summary?.amount || 0)}` },
  ];
  if (props.type === 'pay') {
    return [
      ...base,
      {
        key: 'Payment Channel',
        value: localData.paymentMethod === 'online' ? 'Online / Bank' : 'Cash',
      },
      ...(localData.bankName ? [{ key: 'Bank', value: localData.bankName }] : []),
      { key: 'Reference', value: localData.proof },
      ...(localData.remark
        ? [{ key: 'Remark', value: localData.remark, valueClass: 'italic' }]
        : []),
    ]
  }
  if (props.type === 'cancel') {
    return [...base, { key: 'Reason', value: localData.reason, valueClass: 'italic' }]
  }
  if (props.type === 'delete') {
    return [
      ...base,
      { key: 'Status', value: summary?.status },
      { key: 'Authorization', value: localData.deleteConfirm },
    ]
  }
  return base
});

// ── Labels / Titles ──
const modalTitle = computed(() => {
  const titles = {
    pay: 'Pay Enrollment',
    cancel: 'Cancel Enrollment',
    delete: 'Delete Enrollment',
    edit: 'Edit Enrollment',
  };
  return titles[props.type] || 'Enrollment Action'
});

const submitLabel = computed(() => {
  if (props.type === 'pay') return 'Pay'
  if (props.type === 'cancel') return 'Cancel'
  if (props.type === 'delete') return 'Delete'
  return 'Edit'
});

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  if (props.type === 'pay') return getActionIcon('pay')
  return getActionIcon('edit')
});

const __returned__ = { props, emit, cancelPresets, activePreset, getInitialData, localData, isDirty, errors, shaking, clearError, validate, selectPreset, showConfirm, getValidationRules, requestConfirm, handleActionSubmit, confirmOverlayTitle, confirmOverlaySubtitle, displaySummary, confirmOverlayIcon, confirmRows, modalTitle, submitLabel, modalIcon, ref, computed, get useActionModal() { return useActionModal }, AppModal, AppAlert, AppButton, AppSelect, AppInput, AppBadge, AppConfirmOverlay, get formatPrice() { return formatPrice }, get getActionIcon() { return getActionIcon }, get getImageUrl() { return getImageUrl }, get getSessionDay() { return getSessionDay }, get getSessionTime() { return getSessionTime } };
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true });
return __returned__
}

};

const _hoisted_1 = {
  key: 0,
  class: "flex flex-col gap-lg"
};
const _hoisted_2 = {
  key: 0,
  class: "bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
};
const _hoisted_3 = { class: "grid grid-cols-2 gap-x-lg gap-y-md" };
const _hoisted_4 = { class: "flex flex-col gap-xs" };
const _hoisted_5 = { class: "enroll-identity-row bg-primary-soft/40 border-primary/10" };
const _hoisted_6 = ["src"];
const _hoisted_7 = { class: "text-sm font-bold text-content-dark tracking-tight" };
const _hoisted_8 = { class: "flex flex-col gap-xs" };
const _hoisted_9 = { class: "enroll-identity-row bg-primary-soft/40 border-primary/10" };
const _hoisted_10 = ["src"];
const _hoisted_11 = { class: "text-sm font-bold text-content-dark tracking-tight" };
const _hoisted_12 = { class: "flex flex-col gap-xs" };
const _hoisted_13 = { class: "enroll-identity-row bg-surface-subtle/30 border-outline-std/20" };
const _hoisted_14 = ["src"];
const _hoisted_15 = { class: "text-sm font-semibold text-content-dark tracking-tighter" };
const _hoisted_16 = { class: "flex flex-col gap-xs" };
const _hoisted_17 = { class: "enroll-identity-row bg-surface-subtle/30 border-outline-std/20 flex-col !items-start gap-1 p-3" };
const _hoisted_18 = { class: "flex items-center justify-between w-full" };
const _hoisted_19 = { class: "text-xs font-semibold" };
const _hoisted_20 = { class: "flex items-center justify-between bg-gradient-to-br from-primary to-primary-dark p-xl rounded-std shadow-xl shadow-primary/20 mt-lg border border-primary-dark/30" };
const _hoisted_21 = { class: "flex flex-col gap-1" };
const _hoisted_22 = { class: "flex gap-xs" };
const _hoisted_23 = { class: "text-white text-right" };
const _hoisted_24 = { class: "text-3xl font-black tracking-tighter" };
const _hoisted_25 = { class: "flex flex-col gap-xs mt-lg" };
const _hoisted_26 = { class: "grid grid-cols-2 gap-sm mt-1" };
const _hoisted_27 = { class: "grid grid-cols-2 gap-lg mt-md" };
const _hoisted_28 = {
  key: 1,
  class: "flex flex-col gap-lg"
};
const _hoisted_29 = { class: "flex flex-col gap-xs" };
const _hoisted_30 = { class: "flex flex-wrap gap-xs mb-sm mt-1" };
const _hoisted_31 = ["onClick"];
const _hoisted_32 = {
  key: 2,
  class: "flex flex-col gap-lg"
};
const _hoisted_33 = {
  key: 0,
  class: "bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
};
const _hoisted_34 = { class: "grid grid-cols-2 gap-x-lg gap-y-md" };
const _hoisted_35 = { class: "flex flex-col gap-xs" };
const _hoisted_36 = { class: "enroll-identity-row" };
const _hoisted_37 = ["src"];
const _hoisted_38 = { class: "text-sm font-semibold text-content-dark tracking-tight" };
const _hoisted_39 = { class: "flex flex-col gap-xs" };
const _hoisted_40 = { class: "enroll-identity-row" };
const _hoisted_41 = ["src"];
const _hoisted_42 = { class: "text-sm font-semibold text-content-dark tracking-tight" };
const _hoisted_43 = { class: "flex flex-col gap-xs" };
const _hoisted_44 = { class: "enroll-identity-row bg-surface-subtle/30 border-outline-std/20" };
const _hoisted_45 = ["src"];
const _hoisted_46 = { class: "text-sm font-semibold text-content-dark tracking-tighter" };
const _hoisted_47 = { class: "flex flex-col gap-xs" };
const _hoisted_48 = { class: "enroll-identity-row bg-surface-subtle/30 border-outline-std/20 flex-col !items-start gap-1 p-3" };
const _hoisted_49 = { class: "flex items-center justify-between w-full" };
const _hoisted_50 = { class: "text-sm font-bold text-content-dark" };
const _hoisted_51 = { class: "flex items-center justify-between w-full opacity-70" };
const _hoisted_52 = { class: "text-xs font-semibold" };
const _hoisted_53 = { class: "flex flex-col justify-end w-full gap-md" };
const _hoisted_54 = { class: "flex items-center justify-end w-full gap-md" };

function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createBlock($setup["AppModal"], {
    show: $props.isOpen,
    title: $setup.modalTitle,
    variant: "action",
    onClose: _cache[15] || (_cache[15] = $event => (_ctx.$emit('close'))),
    icon: $setup.modalIcon,
    error: $props.error,
    success: $props.success
  }, {
    footer: withCtx(() => [
      createBaseVNode("div", _hoisted_53, [
        ($props.error)
          ? (openBlock(), createBlock($setup["AppAlert"], {
              key: 0,
              type: "error",
              closable: "",
              onClose: _cache[13] || (_cache[13] = $event => (_ctx.$emit('update:error', ''))),
              class: "w-full"
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString($props.error), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }))
          : createCommentVNode("v-if", true),
        ($props.type === 'edit' && !$setup.isDirty)
          ? (openBlock(), createBlock($setup["AppAlert"], {
              key: 1,
              type: "info",
              class: "w-full"
            }, {
              default: withCtx(() => [...(_cache[32] || (_cache[32] = [
                createTextVNode(" No modifications detected. Please update at least one field to enable saving. ", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }))
          : createCommentVNode("v-if", true),
        createBaseVNode("div", _hoisted_54, [
          createVNode($setup["AppButton"], {
            variant: "cancel",
            onClick: _cache[14] || (_cache[14] = $event => (_ctx.$emit('close')))
          }, {
            default: withCtx(() => [...(_cache[33] || (_cache[33] = [
              createTextVNode("Cancel", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          createVNode($setup["AppButton"], {
            variant: $props.type === 'delete' ? 'danger' : 'primary',
            type: "button",
            onClick: $setup.requestConfirm,
            loading: $props.loading,
            disabled: $props.loading || ($props.type === 'edit' && !$setup.isDirty),
            class: normalizeClass({ 'button-disabled-visual': $props.type === 'edit' && !$setup.isDirty })
          }, {
            default: withCtx(() => [
              createTextVNode(toDisplayString($setup.submitLabel), 1 /* TEXT */)
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["variant", "loading", "disabled", "class"])
        ])
      ])
    ]),
    default: withCtx(() => [
      createBaseVNode("form", {
        id: "enrollmentActionForm",
        onSubmit: withModifiers($setup.requestConfirm, ["prevent"]),
        novalidate: ""
      }, [
        createCommentVNode(" Content for Pay Action "),
        ($props.type === 'pay')
          ? (openBlock(), createElementBlock("div", _hoisted_1, [
              ($setup.displaySummary)
                ? (openBlock(), createElementBlock("div", _hoisted_2, [
                    createBaseVNode("div", _hoisted_3, [
                      createCommentVNode(" Parent "),
                      createBaseVNode("div", _hoisted_4, [
                        _cache[16] || (_cache[16] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Parent Registry", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_5, [
                          createBaseVNode("img", {
                            src: $setup.displaySummary.parentAvatar,
                            class: "w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          }, null, 8 /* PROPS */, _hoisted_6),
                          createBaseVNode("span", _hoisted_7, toDisplayString($setup.displaySummary.parentName), 1 /* TEXT */)
                        ])
                      ]),
                      createCommentVNode(" Student "),
                      createBaseVNode("div", _hoisted_8, [
                        _cache[17] || (_cache[17] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Student Name", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_9, [
                          createBaseVNode("img", {
                            src: $setup.displaySummary.studentAvatar,
                            class: "w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          }, null, 8 /* PROPS */, _hoisted_10),
                          createBaseVNode("span", _hoisted_11, toDisplayString($setup.displaySummary.studentName), 1 /* TEXT */)
                        ])
                      ]),
                      createCommentVNode(" Program "),
                      createBaseVNode("div", _hoisted_12, [
                        _cache[18] || (_cache[18] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Program Selection", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_13, [
                          createBaseVNode("img", {
                            src: $setup.displaySummary.programAvatar,
                            class: "w-8 h-8 rounded-full text-content-dark border-2 border-white shadow-sm"
                          }, null, 8 /* PROPS */, _hoisted_14),
                          createBaseVNode("span", _hoisted_15, toDisplayString($setup.displaySummary.programName), 1 /* TEXT */)
                        ])
                      ]),
                      createCommentVNode(" Class & Branch "),
                      createBaseVNode("div", _hoisted_16, [
                        _cache[19] || (_cache[19] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Class and Branch", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_17, [
                          createBaseVNode("div", _hoisted_18, [
                            createBaseVNode("span", _hoisted_19, toDisplayString($setup.displaySummary.scheduleDay) + " (" + toDisplayString($setup.displaySummary.scheduleTime) + ")", 1 /* TEXT */),
                            createVNode($setup["AppBadge"], {
                              status: $setup.displaySummary.branchAbbr,
                              type: $setup.displaySummary.branchColor
                            }, null, 8 /* PROPS */, ["status", "type"])
                          ])
                        ])
                      ])
                    ]),
                    createBaseVNode("div", _hoisted_20, [
                      createBaseVNode("div", _hoisted_21, [
                        _cache[20] || (_cache[20] = createBaseVNode("span", { class: "text-xs font-bold text-white/70 uppercase tracking-widest" }, "Calculated Tuition Fee", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_22, [
                          createVNode($setup["AppBadge"], {
                            status: $setup.displaySummary.mode || $setup.displaySummary.status,
                            class: "bg-white/20 text-white border-none"
                          }, null, 8 /* PROPS */, ["status"])
                        ])
                      ]),
                      createBaseVNode("div", _hoisted_23, [
                        createBaseVNode("span", _hoisted_24, "$" + toDisplayString($setup.formatPrice($setup.displaySummary.amount)), 1 /* TEXT */)
                      ])
                    ])
                  ]))
                : createCommentVNode("v-if", true),
              createVNode($setup["AppAlert"], {
                type: "warning",
                class: "mt-md"
              }, {
                default: withCtx(() => [...(_cache[21] || (_cache[21] = [
                  createBaseVNode("div", { class: "flex flex-col gap-0.5" }, [
                    createBaseVNode("strong", { class: "text-sm font-semibold tracking-tight" }, "Final Verification Required"),
                    createBaseVNode("span", { class: "text-xs opacity-90 font-medium" }, "By confirming, you verify that the payment proof matches the tuition amount. This action is irreversible.")
                  ], -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              createBaseVNode("div", _hoisted_25, [
                _cache[24] || (_cache[24] = createBaseVNode("label", { class: "text-xs font-semibold text-content-muted" }, "Payment Channel Selection", -1 /* CACHED */)),
                createBaseVNode("div", _hoisted_26, [
                  createBaseVNode("button", {
                    type: "button",
                    class: normalizeClass(["enroll-channel-btn", 
                $setup.localData.paymentMethod === 'online'
                  ? 'enroll-channel-btn--online'
                  : 'enroll-channel-btn--inactive'
              ]),
                    onClick: _cache[0] || (_cache[0] = $event => ($setup.localData.paymentMethod = 'online'))
                  }, [...(_cache[22] || (_cache[22] = [
                    createBaseVNode("span", { class: "text-xl" }, "💳", -1 /* CACHED */),
                    createBaseVNode("span", null, "Online / Bank", -1 /* CACHED */)
                  ]))], 2 /* CLASS */),
                  createBaseVNode("button", {
                    type: "button",
                    class: normalizeClass(["enroll-channel-btn", 
                $setup.localData.paymentMethod === 'cash'
                  ? 'enroll-channel-btn--cash'
                  : 'enroll-channel-btn--inactive'
              ]),
                    onClick: _cache[1] || (_cache[1] = $event => ($setup.localData.paymentMethod = 'cash'))
                  }, [...(_cache[23] || (_cache[23] = [
                    createBaseVNode("span", { class: "text-xl" }, "💵", -1 /* CACHED */),
                    createBaseVNode("span", null, "Cash Payment", -1 /* CACHED */)
                  ]))], 2 /* CLASS */)
                ])
              ]),
              createBaseVNode("div", _hoisted_27, [
                ($setup.localData.paymentMethod === 'online')
                  ? (openBlock(), createBlock($setup["AppSelect"], {
                      key: 0,
                      modelValue: $setup.localData.bankName,
                      "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => (($setup.localData.bankName) = $event)),
                      items: 
              ['ABA', 'Wing', 'ACLEDA', 'Canadia', 'Sathapana', 'Other'].map((b) => ({
                id: b,
                name: b,
              }))
            ,
                      label: "Issuing Bank",
                      placeholder: "Select Bank...",
                      required: "",
                      error: $setup.errors.bankName,
                      shake: $setup.shaking.bankName,
                      searchable: false,
                      onChange: _cache[3] || (_cache[3] = $event => ($setup.clearError('bankName')))
                    }, null, 8 /* PROPS */, ["modelValue", "items", "error", "shake"]))
                  : createCommentVNode("v-if", true),
                createVNode($setup["AppInput"], {
                  modelValue: $setup.localData.proof,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => (($setup.localData.proof) = $event)),
                  label: $setup.localData.paymentMethod === 'online' ? 'Transaction Code' : 'Receipt ID',
                  placeholder: $setup.localData.paymentMethod === 'online' ? 'e.g. 123456' : 'e.g. REC-001',
                  required: "",
                  error: $setup.errors.proof,
                  shake: $setup.shaking.proof,
                  class: "col-span-2",
                  onInput: _cache[5] || (_cache[5] = $event => ($setup.clearError('proof')))
                }, null, 8 /* PROPS */, ["modelValue", "label", "placeholder", "error", "shake"])
              ]),
              createVNode($setup["AppInput"], {
                modelValue: $setup.localData.remark,
                "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => (($setup.localData.remark) = $event)),
                type: "textarea",
                label: "Internal Processing Remarks",
                placeholder: "Add any specific notes for audit trailing...",
                error: $setup.errors.remark,
                shake: $setup.shaking.remark,
                onInput: _cache[7] || (_cache[7] = $event => ($setup.clearError('remark')))
              }, null, 8 /* PROPS */, ["modelValue", "error", "shake"])
            ]))
          : createCommentVNode("v-if", true),
        createCommentVNode(" Content for Cancel Action "),
        ($props.type === 'cancel')
          ? (openBlock(), createElementBlock("div", _hoisted_28, [
              createVNode($setup["AppAlert"], { type: "warning" }, {
                default: withCtx(() => [...(_cache[25] || (_cache[25] = [
                  createBaseVNode("div", { class: "flex flex-col gap-0.5" }, [
                    createBaseVNode("strong", { class: "text-sm font-semibold tracking-tight" }, "Program Termination Warning"),
                    createBaseVNode("span", { class: "text-xs opacity-90 font-medium" }, "Marking this enrollment as cancelled will permanently release the reserved seat in the session schedule.")
                  ], -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              createBaseVNode("div", _hoisted_29, [
                createBaseVNode("div", _hoisted_30, [
                  (openBlock(), createElementBlock(Fragment, null, renderList($setup.cancelPresets, (preset) => {
                    return createBaseVNode("button", {
                      key: preset,
                      type: "button",
                      class: normalizeClass(["px-md py-1.5 border-2 rounded-sm text-2xs cursor-pointer font-semibold transition-all", 
                $setup.activePreset === preset
                  ? 'bg-primary text-white border-primary shadow-md scale-105'
                  : 'bg-surface-light border-outline-std/50 hover:bg-primary-soft hover:text-primary hover:border-primary/20'
              ]),
                      onClick: $event => ($setup.selectPreset(preset))
                    }, toDisplayString(preset), 11 /* TEXT, CLASS, PROPS */, _hoisted_31)
                  }), 64 /* STABLE_FRAGMENT */))
                ]),
                createVNode($setup["AppInput"], {
                  modelValue: $setup.localData.reason,
                  "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => (($setup.localData.reason) = $event)),
                  type: "textarea",
                  label: "Cancellation Logic / Reason",
                  required: "",
                  error: $setup.errors.reason,
                  shake: $setup.shaking.reason,
                  placeholder: "Provide a detailed cancel reason...",
                  onInput: _cache[9] || (_cache[9] = $event => {
              $setup.activePreset = '';
              $setup.clearError('reason');
            })
                }, null, 8 /* PROPS */, ["modelValue", "error", "shake"])
              ])
            ]))
          : createCommentVNode("v-if", true),
        createCommentVNode(" Content for Delete Action "),
        ($props.type === 'delete')
          ? (openBlock(), createElementBlock("div", _hoisted_32, [
              createCommentVNode(" Identity Summary (consistent with pay modal) "),
              ($setup.displaySummary)
                ? (openBlock(), createElementBlock("div", _hoisted_33, [
                    createBaseVNode("div", _hoisted_34, [
                      createCommentVNode(" Parent "),
                      createBaseVNode("div", _hoisted_35, [
                        _cache[26] || (_cache[26] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Parent Name", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_36, [
                          createBaseVNode("img", {
                            src: $setup.displaySummary.parentAvatar,
                            class: "w-8 h-8 rounded-full border border-white shadow-sm"
                          }, null, 8 /* PROPS */, _hoisted_37),
                          createBaseVNode("span", _hoisted_38, toDisplayString($setup.displaySummary.parentName), 1 /* TEXT */)
                        ])
                      ]),
                      createCommentVNode(" Student "),
                      createBaseVNode("div", _hoisted_39, [
                        _cache[27] || (_cache[27] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Student Name", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_40, [
                          createBaseVNode("img", {
                            src: $setup.displaySummary.studentAvatar,
                            class: "w-8 h-8 rounded-full border border-white shadow-sm"
                          }, null, 8 /* PROPS */, _hoisted_41),
                          createBaseVNode("span", _hoisted_42, toDisplayString($setup.displaySummary.studentName), 1 /* TEXT */)
                        ])
                      ]),
                      createCommentVNode(" Program "),
                      createBaseVNode("div", _hoisted_43, [
                        _cache[28] || (_cache[28] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Program", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_44, [
                          createBaseVNode("img", {
                            src: $setup.displaySummary.programAvatar,
                            class: "w-8 h-8 rounded-full text-content-dark border-2 border-white shadow-sm"
                          }, null, 8 /* PROPS */, _hoisted_45),
                          createBaseVNode("span", _hoisted_46, toDisplayString($setup.displaySummary.programName), 1 /* TEXT */)
                        ])
                      ]),
                      createCommentVNode(" Class & Branch "),
                      createBaseVNode("div", _hoisted_47, [
                        _cache[29] || (_cache[29] = createBaseVNode("span", { class: "text-2xs font-semibold text-content-muted tracking-wider opacity-60" }, "Class and Branch", -1 /* CACHED */)),
                        createBaseVNode("div", _hoisted_48, [
                          createBaseVNode("div", _hoisted_49, [
                            createBaseVNode("span", _hoisted_50, toDisplayString($setup.displaySummary.className), 1 /* TEXT */),
                            createVNode($setup["AppBadge"], {
                              status: $setup.displaySummary.branchAbbr,
                              type: $setup.displaySummary.branchColor
                            }, null, 8 /* PROPS */, ["status", "type"])
                          ]),
                          createBaseVNode("div", _hoisted_51, [
                            createBaseVNode("span", _hoisted_52, toDisplayString($setup.displaySummary.scheduleDay) + " (" + toDisplayString($setup.displaySummary.scheduleTime) + ")", 1 /* TEXT */)
                          ])
                        ])
                      ])
                    ])
                  ]))
                : createCommentVNode("v-if", true),
              createVNode($setup["AppAlert"], { type: "error" }, {
                default: withCtx(() => [...(_cache[30] || (_cache[30] = [
                  createBaseVNode("div", { class: "flex flex-col gap-0.5" }, [
                    createBaseVNode("strong", { class: "text-sm font-semibold tracking-tight" }, "⚠ Permanent Data Deletion"),
                    createBaseVNode("span", { class: "text-xs opacity-90 font-medium" }, "This will erase all linked financial logs and attendance records. This action is irreversible and cannot be undone.")
                  ], -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              createVNode($setup["AppInput"], {
                modelValue: $setup.localData.deleteConfirm,
                "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => (($setup.localData.deleteConfirm) = $event)),
                label: "Authorization Confirmation",
                placeholder: "Type \"DELETE\" to confirm",
                required: "",
                error: $setup.errors.deleteConfirm,
                shake: $setup.shaking.deleteConfirm,
                onInput: _cache[11] || (_cache[11] = $event => ($setup.clearError('deleteConfirm')))
              }, {
                "label-extra": withCtx(() => [...(_cache[31] || (_cache[31] = [
                  createBaseVNode("span", { class: "block text-2xs font-semibold mt-0.5" }, [
                    createTextVNode(" Type "),
                    createBaseVNode("span", { class: "text-error px-1 font-semibold" }, "DELETE"),
                    createTextVNode(" to authorize this permanent action ")
                  ], -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["modelValue", "error", "shake"])
            ]))
          : createCommentVNode("v-if", true),
        createCommentVNode(" ── Reusable Confirmation Overlay ── "),
        createVNode($setup["AppConfirmOverlay"], {
          show: $setup.showConfirm,
          title: $setup.confirmOverlayTitle,
          subtitle: $setup.confirmOverlaySubtitle,
          icon: $setup.confirmOverlayIcon,
          rows: $setup.confirmRows,
          confirmLabel: $setup.submitLabel,
          loading: $props.loading,
          onBack: _cache[12] || (_cache[12] = $event => ($setup.showConfirm = false)),
          onConfirm: $setup.handleActionSubmit
        }, null, 8 /* PROPS */, ["show", "title", "subtitle", "icon", "rows", "confirmLabel", "loading"])
      ], 32 /* NEED_HYDRATION */)
    ]),
    _: 1 /* STABLE */
  }, 8 /* PROPS */, ["show", "title", "icon", "error", "success"]))
}
const EnrollmentActionModal = /*#__PURE__*/_export_sfc(_sfc_main, [['render',_sfc_render],['__scopeId',"data-v-eb35863c"],['__file',"EnrollmentActionModal.vue"]]);

export { EnrollmentActionModal as default };
//# sourceMappingURL=EnrollmentActionModal-C0RtPN3-.js.map
