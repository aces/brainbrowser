# 🚀 Quick Start Guide

## ⚠️ IMPORTANT: Must Use HTTP Server

**DO NOT** open HTML files directly (by double-clicking). Browsers block local file access for security.

**Instead, run a local web server:**

---

## **Step 1: Clone or Download**

```bash
git clone https://github.com/ckadipas/brainbrowser.git
cd brainbrowser
```

---

## **Step 2: Start Web Server**

Choose **one** of these options:

### **Option A: Python (Mac/Linux - Usually Pre-installed)**
```bash
python3 -m http.server 8000
```

### **Option B: Python 2 (Older Systems)**
```bash
python -m SimpleHTTPServer 8000
```

### **Option C: Node.js (If Installed)**
```bash
npx http-server -p 8000
```

### **Option D: PHP (If Installed)**
```bash
php -S localhost:8000
```

---

## **Step 3: Open in Browser**

### **Simple Demo (Recommended for Testing)**
```
http://localhost:8000/examples/simple-demo.html
```

### **Full-Featured Demo**
```
http://localhost:8000/examples/advanced-visualization-demo.html
```

---

## **Step 4: Load Surface Files**

1. Click **"Choose .asc File"** button
2. Select your FreeSurfer ASCII (.asc) surface file
3. The 3D surface will appear in the viewer

**Test with sample data:**
- Download FreeSurfer sample surfaces
- Or use your own .asc files

---

## **Step 5: Try Features**

### **Clipping Planes**
- Click "Add Clip Plane"
- Click "Enable Clipping"
- Watch the surface get clipped!

### **Electrodes**
- Click "Add Electrode" to add one
- Click "Add 8 Random" for multiple
- See intensity projection on surface

### **View Controls**
- **Left mouse**: Rotate
- **Right mouse**: Pan
- **Scroll wheel**: Zoom
- **Reset View** button: Return to start

---

## **Troubleshooting**

### **Problem: "BrainBrowser is not defined"**

**Cause:** Opening file directly (`file://` protocol)

**Solution:** Must run HTTP server (see Step 2)

---

### **Problem: "Cannot load workers"**

**Cause:** Worker directory not configured

**Solution:** Already configured in demos. If using custom code:
```javascript
BrainBrowser.config.set('worker_dir', 'build/brainbrowser-2.5.5/workers');
```

---

### **Problem: Surface loads but appears black**

**Cause:** No intensity data loaded yet

**Solution:** Normal! Surface is gray by default. Add electrodes or load intensity data to see colors.

---

### **Problem: Nothing happens when clicking buttons**

**Cause:** No surface loaded yet

**Solution:** Load a surface file first, then try other features

---

## **File Locations**

```
brainbrowser/
├── examples/
│   ├── simple-demo.html              ← Start here!
│   └── advanced-visualization-demo.html
├── build/brainbrowser-2.5.5/
│   ├── brainbrowser.surface-viewer.min.js
│   └── workers/                       ← Required!
└── ADVANCED_FEATURES.md              ← Full documentation
```

---

## **Next Steps**

1. ✅ Run simple-demo.html to verify setup
2. 📖 Read ADVANCED_FEATURES.md for API details
3. 🧪 Try advanced-visualization-demo.html for all features
4. 💻 Build your own app using the examples

---

## **Common Use Cases**

### **View a Brain Surface**
```bash
# 1. Start server
python3 -m http.server 8000

# 2. Open browser
open http://localhost:8000/examples/simple-demo.html

# 3. Upload your .asc file
# Click "Choose .asc File" and select surface
```

### **Project Electrode Data**
```javascript
// Add electrode
var electrode = viewer.addElectrode({
  position: [10, 20, 30],
  radius: 3.0,
  decay_function: 'exponential'
});

// Project intensity
viewer.projectElectrodeData(electrode, 0.75);
```

### **Add Clipping Planes**
```javascript
// Add plane
var plane = viewer.addClipPlane({
  normal: [0, 1, 0],
  distance: 0
});

// Enable clipping
viewer.enableClipping(true);
```

---

## **Performance Tips**

- **Large surfaces (200k+ vertices)?** Use LOD optimization
- **Many surfaces (50+)?** Enable hierarchy management
- **Time series data?** Enable IndexedDB caching
- **Slow rendering?** Reduce number of visible surfaces

See **ADVANCED_FEATURES.md** for detailed optimization guide.

---

## **Need Help?**

1. Check **ADVANCED_FEATURES.md** (780 lines of documentation)
2. Look at example code in demos
3. Open browser console (F12) to see errors
4. Verify HTTP server is running (not `file://`)

---

**Ready to visualize! 🧠✨**
