// Minimal WebXR emulation for Playwright: navigator.xr, XRSession, XRWebGLLayer (a real offscreen framebuffer, 2 eyes),
// viewer pose, two Touch controllers with xr-standard gamepads and haptics. Tests drive window.__xrMock.
module.exports = `(() => {
  const M = window.__xrMock = { frames: 0, haptics: [], rate: null, head: [0, 0, 0], headYaw: 0, sessions: 0, layer: null, EW: 480, EH: 480,
    ctl: { left: { m: null }, right: { m: null } } };
  const mkGamepad = (hand) => ({ id: 'mock-touch-' + hand, mapping: 'xr-standard', connected: true, axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 7 }, () => ({ pressed: false, touched: false, value: 0 })),
    hapticActuators: [{ type: 'vibration', pulse: (v, ms) => { M.haptics.push([hand, +v.toFixed(2), ms]); return Promise.resolve(true); } }] });
  const sources = ['left', 'right'].map((h) => ({ handedness: h, targetRayMode: 'tracked-pointer', profiles: ['oculus-touch-v3'], targetRaySpace: { hand: h, kind: 'ray' }, gripSpace: { hand: h, kind: 'grip' }, gamepad: mkGamepad(h), hand: null }));
  M.sources = sources;
  M.press = (hand, i, on, value) => { const b = sources.find((s) => s.handedness === hand).gamepad.buttons[i]; b.pressed = !!on; b.touched = !!on; b.value = value !== undefined ? value : on ? 1 : 0; };
  M.axis = (hand, x, y) => { const a = sources.find((s) => s.handedness === hand).gamepad.axes; a[2] = x; a[3] = y; };
  const rotY = (t, x, y, z) => { const c = Math.cos(t), s = Math.sin(t); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, x, y, z, 1]); };
  const persp = (near, far) => { const f = 1 / Math.tan(Math.PI / 4), nf = 1 / (near - far); return new Float32Array([f, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]); };
  class Layer {
    constructor(session, gl, init) {
      const W = M.EW * 2, H = M.EH; this.framebufferWidth = W; this.framebufferHeight = H; this.fixedFoveation = 0; this.antialias = false; this.ignoreDepthValues = false;
      const pf = gl.getParameter(gl.FRAMEBUFFER_BINDING), pt = gl.getParameter(gl.TEXTURE_BINDING_2D), pr = gl.getParameter(gl.RENDERBUFFER_BINDING);
      const fb = gl.createFramebuffer(), tex = gl.createTexture(), rb = gl.createRenderbuffer();
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rb);
      M.fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, pf); gl.bindTexture(gl.TEXTURE_2D, pt); gl.bindRenderbuffer(gl.RENDERBUFFER, pr);
      this.framebuffer = fb; this.gl = gl; M.layer = this;
    }
    getViewport(view) { return view.eye === 'left' ? { x: 0, y: 0, width: M.EW, height: M.EH } : { x: M.EW, y: 0, width: M.EW, height: M.EH }; }
  }
  window.XRWebGLLayer = Layer;
  for (const P of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (P) P.prototype.makeXRCompatible = function () { return Promise.resolve(); };
  class Session extends EventTarget {
    constructor(mode, init) { super(); this.mode = mode; this.init = init; this.renderState = { baseLayer: null, depthNear: 0.1, depthFar: 1000, inlineVerticalFieldOfView: null };
      this.inputSources = sources; this.supportedFrameRates = new Float32Array([72, 80, 90, 120]); this.frameRate = 72; this.visibilityState = 'visible'; this.enabledFeatures = ['local']; this._raf = new Map(); this._id = 0; this.ended = false; M.session = this; M.sessions++; }
    updateRenderState(s) { Object.assign(this.renderState, s); }
    requestReferenceSpace(t) { const r = new EventTarget(); r.kind = t; r.getOffsetReferenceSpace = () => r; return Promise.resolve(r); }
    updateTargetFrameRate(r) { this.frameRate = r; M.rate = r; return Promise.resolve(); }
    requestAnimationFrame(cb) { const id = ++this._id; const h = window.requestAnimationFrame((t) => { this._raf.delete(id); if (this.ended) return; M.frames++; cb(t, this._frame()); }); this._raf.set(id, h); return id; }
    cancelAnimationFrame(id) { const h = this._raf.get(id); if (h) window.cancelAnimationFrame(h); this._raf.delete(id); }
    _frame() { const s = this; const [hx, hy, hz] = M.head, yaw = M.headYaw;
      const eye = (dx) => rotY(yaw, hx + Math.cos(yaw) * dx, hy, hz - Math.sin(yaw) * dx);
      return { session: s,
        getViewerPose() { const P = persp(s.renderState.depthNear, s.renderState.depthFar); return { transform: { matrix: rotY(yaw, hx, hy, hz) }, views: [{ eye: 'left', projectionMatrix: P, transform: { matrix: eye(-0.032) } }, { eye: 'right', projectionMatrix: P, transform: { matrix: eye(0.032) } }] }; },
        getPose(space) { if (!space || !space.hand) return null; const c = M.ctl[space.hand]; const m = c.m || rotY(0, space.hand === 'left' ? -0.2 : 0.2, -0.35, -0.3); return { transform: { matrix: new Float32Array(m) } }; },
        getJointPose() { return null; } }; }
    end() { if (this.ended) return Promise.resolve(); this.ended = true; for (const h of this._raf.values()) window.cancelAnimationFrame(h); this._raf.clear(); this.dispatchEvent(new Event('end')); return Promise.resolve(); }
  }
  const xr = new EventTarget();
  xr.isSessionSupported = (m) => Promise.resolve(m === 'immersive-vr');
  xr.requestSession = (m, init) => Promise.resolve(new Session(m, init));
  Object.defineProperty(navigator, 'xr', { value: xr, configurable: true });
  // read back one eye (or both) of the headset framebuffer as a PNG data URL
  M.snap = (both) => { const L = M.layer; if (!L) return null; const gl = L.gl, W = both ? L.framebufferWidth : M.EW, H = M.EH;
    const pf = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, L.framebuffer); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); gl.bindFramebuffer(gl.FRAMEBUFFER, pf);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    g.putImageData(img, 0, 0); let sum = 0; for (let i = 0; i < px.length; i += 97) sum += px[i]; M.lastSnapMean = sum / (px.length / 97); return c.toDataURL('image/png'); };
})();`;
