const images = import.meta.glob('../assets/images/**/*.{png,jpg,jpeg,svg,webp}', { eager: true });
console.log('GLOB KEYS:', Object.keys(images));
