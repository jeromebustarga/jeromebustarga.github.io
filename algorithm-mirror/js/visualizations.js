// visualizations.js - Complete file with abstract visualization features

class Visualizations {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
        this.p5Instance = null;
        this.pixelCanvas = null;
        this.pixelContext = null;
        this.currentView = 'particles';
        this.particles = [];
        this.pixelSize = 10;
        this.gridColumns = 0;
        this.gridRows = 0;
        
        // Abstract mode properties
        this.abstractMode = false;
        this.abstractType = 'flow';
        this.animationFrame = null;
        this.time = 0;
        this.pixelData = [];
        this.isAnimating = true;
        this.staticTime = Math.random() * Math.PI * 2;
    }

    // Initialize visualizations
    initialize() {
        this.initParticleVisualization();
        this.initPixelPortrait();
        this.setupAbstractControls();
    }

    // Initialize particle visualization with p5.js
    initParticleVisualization() {
        const self = this;
        
        const sketch = (p) => {
            let particles = [];
            let attractors = [];
            let mousePressed = false;
            
            p.setup = function() {
                const container = document.getElementById('particle-canvas');
                const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
                canvas.parent('particle-canvas');
                
                // Create particles from video data
                const videoData = self.dataProcessor.getFilteredData();
                const maxParticles = 500;
                const step = Math.max(1, Math.floor(videoData.length / maxParticles));
                
                for (let i = 0; i < videoData.length && particles.length < maxParticles; i += step) {
                    const video = videoData[i];
                    particles.push(new Particle(p, video, self.dataProcessor.categoryColors));
                }
                
                // Create attractors for top channels
                const processedData = self.dataProcessor.processedData;
                if (processedData && processedData.topChannels) {
                    processedData.topChannels.slice(0, 5).forEach((channel, index) => {
                        const angle = (index / 5) * p.TWO_PI;
                        const x = p.width / 2 + p.cos(angle) * 200;
                        const y = p.height / 2 + p.sin(angle) * 200;
                        attractors.push(new Attractor(p, x, y, channel[0], channel[1]));
                    });
                }
                
                console.log(`Created ${particles.length} particles and ${attractors.length} attractors`);
            };
            
            p.draw = function() {
                // Dark background with subtle gradient
                p.background(10, 10, 10, 25);
                
                // Draw connections between similar particles
                p.strokeWeight(0.5);
                particles.forEach((particle, i) => {
                    particles.slice(i + 1).forEach(other => {
                        const d = p.dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
                        if (d < 50 && particle.video.channel === other.video.channel) {
                            p.stroke(particle.color.levels[0], particle.color.levels[1], particle.color.levels[2], 20);
                            p.line(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
                        }
                    });
                });
                
                // Update and draw particles
                particles.forEach(particle => {
                    // Apply forces from attractors
                    attractors.forEach(attractor => {
                        if (particle.video.channel === attractor.channel) {
                            particle.attract(attractor.pos);
                        }
                    });
                    
                    // Mouse interaction
                    if (mousePressed) {
                        const mousePos = p.createVector(p.mouseX, p.mouseY);
                        particle.repel(mousePos);
                    }
                    
                    particle.update();
                    particle.display();
                });
                
                // Draw attractors (invisible but influential)
                if (p.frameCount % 60 === 0) {
                    attractors.forEach(attractor => {
                        attractor.pulse();
                    });
                }
            };
            
            p.mousePressed = function() {
                mousePressed = true;
            };
            
            p.mouseReleased = function() {
                mousePressed = false;
            };
            
            p.mouseMoved = function() {
                // Check for hover over particles
                let hovered = false;
                particles.forEach(particle => {
                    const d = p.dist(p.mouseX, p.mouseY, particle.pos.x, particle.pos.y);
                    if (d < particle.size) {
                        self.showHoverInfo(p.mouseX, p.mouseY, particle.video);
                        hovered = true;
                    }
                });
                
                if (!hovered) {
                    self.hideHoverInfo();
                }
            };
            
            p.windowResized = function() {
                const container = document.getElementById('particle-canvas');
                p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            };
            
            // Particle class
            class Particle {
                constructor(p, video, categoryColors) {
                    this.p = p;
                    this.video = video;
                    this.pos = p.createVector(p.random(p.width), p.random(p.height));
                    this.vel = p.createVector(p.random(-1, 1), p.random(-1, 1));
                    this.acc = p.createVector(0, 0);
                    this.size = p.map(Math.log(video.index + 1), 0, Math.log(500), 4, 12);
                    this.color = p.color(categoryColors[video.category] || '#666666');
                    this.maxSpeed = 2;
                    this.maxForce = 0.05;
                }
                
                attract(target) {
                    const force = p5.Vector.sub(target, this.pos);
                    const d = force.mag();
                    if (d > 0 && d < 200) {
                        force.setMag(this.maxSpeed);
                        force.sub(this.vel);
                        force.limit(this.maxForce);
                        this.acc.add(force);
                    }
                }
                
                repel(target) {
                    const force = p5.Vector.sub(this.pos, target);
                    const d = force.mag();
                    if (d > 0 && d < 100) {
                        force.setMag(this.maxSpeed * 2);
                        this.acc.add(force);
                    }
                }
                
                update() {
                    this.vel.add(this.acc);
                    this.vel.limit(this.maxSpeed);
                    this.pos.add(this.vel);
                    this.acc.mult(0);
                    
                    // Bounce off edges
                    if (this.pos.x < this.size || this.pos.x > this.p.width - this.size) {
                        this.vel.x *= -0.9;
                        this.pos.x = this.p.constrain(this.pos.x, this.size, this.p.width - this.size);
                    }
                    if (this.pos.y < this.size || this.pos.y > this.p.height - this.size) {
                        this.vel.y *= -0.9;
                        this.pos.y = this.p.constrain(this.pos.y, this.size, this.p.height - this.size);
                    }
                    
                    // Damping
                    this.vel.mult(0.98);
                }
                
                display() {
                    this.p.noStroke();
                    this.p.fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 150);
                    this.p.ellipse(this.pos.x, this.pos.y, this.size * 2);
                    
                    // Glow effect
                    this.p.fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 30);
                    this.p.ellipse(this.pos.x, this.pos.y, this.size * 3);
                }
            }
            
            // Attractor class (invisible force points)
            class Attractor {
                constructor(p, x, y, channel, strength) {
                    this.p = p;
                    this.pos = p.createVector(x, y);
                    this.channel = channel;
                    this.strength = strength;
                    this.pulseSize = 0;
                }
                
                pulse() {
                    this.pulseSize = 50;
                }
                
                display() {
                    if (this.pulseSize > 0) {
                        this.p.noFill();
                        this.p.stroke(255, 255, 255, this.pulseSize);
                        this.p.ellipse(this.pos.x, this.pos.y, 100 - this.pulseSize);
                        this.pulseSize -= 2;
                    }
                }
            }
        };
        
        // Remove existing instance if present
        if (this.p5Instance) {
            this.p5Instance.remove();
        }
        
        this.p5Instance = new p5(sketch);
    }

    // Initialize pixel portrait
    initPixelPortrait() {
        this.pixelCanvas = document.getElementById('pixel-canvas');
        this.pixelContext = this.pixelCanvas.getContext('2d');
        
        this.drawPixelPortrait();
        
        // Add mouse interaction
        this.pixelCanvas.addEventListener('mousemove', (e) => {
            this.handlePixelHover(e);
        });
        
        this.pixelCanvas.addEventListener('mouseleave', () => {
            this.hideHoverInfo();
        });
    }

    // Setup abstract mode controls
    setupAbstractControls() {
        // Create control panel HTML
        const controlsHTML = `
            <div id="abstract-controls-wrapper" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0,0,0,0.95);
                border: 1px solid rgba(102,126,234,0.5);
                border-radius: 8px;
                padding: 15px;
                display: none;
                z-index: 1000;
                min-width: 250px;
            ">
                <h4 style="margin: 0 0 10px 0; color: #667eea; font-size: 14px;">Abstract Mode Controls</h4>
                
                <div style="margin-bottom: 10px;">
                    <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">Pattern Type:</label>
                    <select id="abstract-type-select" style="
                        width: 100%;
                        padding: 8px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 4px;
                        color: white;
                        font-size: 12px;
                    ">
                        <option value="flow">Flow Field</option>
                        <option value="spiral">Spiral Vortex</option>
                        <option value="waves">Wave Interference</option>
                        <option value="organic">Organic Growth</option>
                        <option value="constellation">Constellation Map</option>
                        <option value="temporal">Time Flow</option>
                        <option value="fractal">Fractal Pattern</option>
                        <option value="network">Neural Network</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <button id="toggle-animation" style="
                        width: 100%;
                        padding: 8px;
                        background: linear-gradient(135deg, #10b981, #059669);
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        font-size: 12px;
                    ">Pause Animation</button>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <button id="randomize-pattern" style="
                        width: 100%;
                        padding: 8px;
                        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        font-size: 12px;
                    ">Randomize Position</button>
                </div>
                
                <div>
                    <button id="save-abstract" style="
                        width: 100%;
                        padding: 8px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        font-size: 12px;
                    ">Save as PNG</button>
                </div>
            </div>
        `;
        
        // Add controls to page if not already added
        if (!document.getElementById('abstract-controls-wrapper')) {
            document.body.insertAdjacentHTML('beforeend', controlsHTML);
        }
        
        // Add abstract mode button to view tabs if not already added
        if (!document.getElementById('toggle-abstract-btn')) {
            const viewTabs = document.querySelector('.view-tabs');
            if (viewTabs) {
                const abstractBtn = document.createElement('button');
                abstractBtn.id = 'toggle-abstract-btn';
                abstractBtn.className = 'tab-btn';
                abstractBtn.textContent = 'Abstract Mode';
                abstractBtn.onclick = () => this.toggleAbstractMode();
                viewTabs.appendChild(abstractBtn);
            }
        }
        
        // Setup event listeners
        const typeSelect = document.getElementById('abstract-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.abstractType = e.target.value;
                this.staticTime = Math.random() * Math.PI * 2;
                if (this.abstractMode) {
                    this.redrawAbstract();
                }
            });
        }
        
        const toggleAnimBtn = document.getElementById('toggle-animation');
        if (toggleAnimBtn) {
            toggleAnimBtn.addEventListener('click', () => this.toggleAnimation());
        }
        
        const randomizeBtn = document.getElementById('randomize-pattern');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                this.staticTime = Math.random() * Math.PI * 2;
                this.redrawAbstract();
            });
        }
        
        const saveBtn = document.getElementById('save-abstract');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAbstractImage());
        }
    }

    // Toggle abstract mode
    toggleAbstractMode() {
    this.abstractMode = !this.abstractMode;
    const btn = document.getElementById('toggle-abstract-btn');
    const controls = document.getElementById('abstract-controls-wrapper');
    
    if (this.abstractMode) {
        btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        controls.style.display = 'block';
        this.switchView('portrait'); // Make sure we're in portrait view
        this.drawPixelPortrait(); // Draw the portrait with abstract mode enabled
        
        if (this.isAnimating) {
            this.startAbstractAnimation();
        }
    } else {
        btn.style.background = '';
        controls.style.display = 'none';
        this.stopAbstractAnimation();
        this.drawPixelPortrait(); // Redraw normal grid
    }
}

    // Toggle animation
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('toggle-animation');
        
        if (this.isAnimating) {
            btn.textContent = 'Pause Animation';
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            this.startAbstractAnimation();
        } else {
            btn.textContent = 'Resume Animation';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            this.stopAbstractAnimation();
            this.redrawAbstract();
        }
    }

    // Draw pixel portrait
    drawPixelPortrait() {
    const videoData = this.dataProcessor.getFilteredData();
    if (!videoData || videoData.length === 0) return;
    
    // Calculate grid dimensions
    const total = videoData.length;
    this.gridColumns = Math.ceil(Math.sqrt(total * 0.8));
    this.gridRows = Math.ceil(total / this.gridColumns);
    
    // Calculate pixel size to fit canvas
    const maxWidth = 800;
    const maxHeight = 600;
    this.pixelSize = Math.min(
        Math.floor(maxWidth / this.gridColumns),
        Math.floor(maxHeight / this.gridRows),
        20
    );
    
    // Set canvas size
    this.pixelCanvas.width = this.gridColumns * this.pixelSize;
    this.pixelCanvas.height = this.gridRows * this.pixelSize;
    
    // Clear canvas
    this.pixelContext.fillStyle = '#0a0a0a';
    this.pixelContext.fillRect(0, 0, this.pixelCanvas.width, this.pixelCanvas.height);
    
    if (this.abstractMode) {
        // Prepare data for animation
        this.pixelData = videoData.map((video, index) => {
            const col = index % this.gridColumns;
            const row = Math.floor(index / this.gridColumns);
            return {
                originalX: col * this.pixelSize + this.pixelSize/2,
                originalY: row * this.pixelSize + this.pixelSize/2,
                color: this.dataProcessor.categoryColors[video.category] || '#666666',
                category: video.category,
                channel: video.channel,
                video: video,
                index: index
            };
        });
        
        // IMPORTANT: Draw initial frame immediately
        this.renderAbstractFrame(this.staticTime);
        
        // Then start animation if enabled
        if (this.isAnimating) {
            this.startAbstractAnimation();
        }
    } else {
        // Draw normal pixel grid
        videoData.forEach((video, index) => {
            const col = index % this.gridColumns;
            const row = Math.floor(index / this.gridColumns);
            const x = col * this.pixelSize;
            const y = row * this.pixelSize;
            
            const color = this.dataProcessor.categoryColors[video.category] || '#666666';
            
            this.pixelContext.fillStyle = color;
            this.pixelContext.fillRect(x + 1, y + 1, this.pixelSize - 2, this.pixelSize - 2);
        });
    }
    
    console.log(`Drew ${total} pixels in ${this.gridColumns}x${this.gridRows} grid`);
}

    // Redraw static abstract frame
    redrawAbstract() {
        if (!this.abstractMode || !this.pixelData) return;
        this.renderAbstractFrame(this.staticTime);
    }

    // Start abstract animation
    startAbstractAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.time = 0;
        this.animateAbstract();
    }

    // Stop abstract animation
    stopAbstractAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Animation loop
    animateAbstract() {
        if (!this.abstractMode || !this.pixelData || !this.isAnimating) return;
        
        this.time += 0.02;
        this.renderAbstractFrame(this.time);
        this.animationFrame = requestAnimationFrame(() => this.animateAbstract());
    }

    // Render abstract frame
    renderAbstractFrame(timeValue) {
        const canvas = this.pixelCanvas;
        const ctx = this.pixelContext;
        
        // Clear or fade
        if (this.isAnimating) {
            ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        } else {
            ctx.fillStyle = '#0a0a0a';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Apply transformation based on type
        this.pixelData.forEach((pixel, index) => {
            let x, y, size, alpha;
            
            switch(this.abstractType) {
                case 'flow':
                    const flowAngle = (pixel.originalX * 0.01 + pixel.originalY * 0.01 + timeValue) * Math.PI;
                    const flowRadius = Math.sin(index * 0.01 + timeValue) * 100;
                    x = pixel.originalX + Math.cos(flowAngle) * flowRadius;
                    y = pixel.originalY + Math.sin(flowAngle) * flowRadius;
                    size = this.pixelSize * (0.5 + Math.sin(timeValue + index * 0.01) * 0.5);
                    alpha = 0.6;
                    break;
                    
                case 'spiral':
                    const dx = pixel.originalX - centerX;
                    const dy = pixel.originalY - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const spiralAngle = Math.atan2(dy, dx) + timeValue + dist * 0.001;
                    const spiralR = dist * (1 + Math.sin(timeValue + dist * 0.01) * 0.3);
                    x = centerX + Math.cos(spiralAngle) * spiralR;
                    y = centerY + Math.sin(spiralAngle) * spiralR;
                    size = this.pixelSize * Math.max(0.1, 1 - dist / 500);
                    alpha = 0.7;
                    break;
                    
                case 'waves':
                    const waveX = Math.sin(pixel.originalY * 0.01 + timeValue * 2) * 50;
                    const waveY = Math.cos(pixel.originalX * 0.01 + timeValue * 2) * 50;
                    x = pixel.originalX + waveX;
                    y = pixel.originalY + waveY;
                    const interference = Math.sin(pixel.originalX * 0.01) * Math.cos(pixel.originalY * 0.01);
                    size = this.pixelSize * (0.8 + interference * 0.5);
                    alpha = 0.5 + interference * 0.3;
                    break;
                    
                case 'organic':
                    const growth = Math.sin(timeValue + index * 0.01);
                    const organicAngle = index * 0.1 + timeValue;
                    const branchX = Math.sin(organicAngle) * growth * 100;
                    const branchY = Math.cos(organicAngle * 0.7) * growth * 100;
                    x = pixel.originalX + branchX;
                    y = pixel.originalY + branchY;
                    size = this.pixelSize * Math.abs(growth);
                    alpha = 0.6;
                    break;
                    
                case 'constellation':
                    const jitter = Math.sin(timeValue + index) * 5;
                    x = pixel.originalX + jitter;
                    y = pixel.originalY + jitter;
                    size = this.pixelSize * 0.3;
                    alpha = 0.8;
                    
                    // Draw connections
                    ctx.strokeStyle = pixel.color + '30';
                    ctx.lineWidth = 0.5;
                    this.pixelData.forEach((other, otherIndex) => {
                        if (other.category === pixel.category && otherIndex !== index) {
                            const distance = Math.sqrt(
                                Math.pow(other.originalX - pixel.originalX, 2) + 
                                Math.pow(other.originalY - pixel.originalY, 2)
                            );
                            if (distance < 50 && distance > 0) {
                                ctx.beginPath();
                                ctx.moveTo(x, y);
                                const otherJitter = Math.sin(timeValue + otherIndex) * 5;
                                ctx.lineTo(
                                    other.originalX + otherJitter,
                                    other.originalY + otherJitter
                                );
                                ctx.stroke();
                            }
                        }
                    });
                    break;
                    
                case 'temporal':
                    const videoTime = pixel.video.time ? pixel.video.time.getTime() : Date.now();
                    const minTime = Math.min(...this.pixelData.map(p => 
                        p.video.time ? p.video.time.getTime() : Date.now()
                    ));
                    const maxTime = Math.max(...this.pixelData.map(p => 
                        p.video.time ? p.video.time.getTime() : Date.now()
                    ));
                    const timeProgress = (videoTime - minTime) / (maxTime - minTime || 1);
                    
                    const radius = 50 + timeProgress * 250;
                    const angle = (pixel.index / this.pixelData.length) * Math.PI * 2 + timeValue;
                    x = centerX + Math.cos(angle) * radius;
                    y = centerY + Math.sin(angle) * radius;
                    size = this.pixelSize * (1 - timeProgress * 0.5);
                    alpha = 0.6;
                    break;
                    
                case 'fractal':
                    const fractalLevel = Math.floor(index / 100);
                    const fractalAngle = (index % 100) * 0.0628 + timeValue;
                    const fractalRadius = 50 + fractalLevel * 30;
                    const fractalX = centerX + Math.cos(fractalAngle) * fractalRadius;
                    const fractalY = centerY + Math.sin(fractalAngle) * fractalRadius;
                    
                    const subAngle = fractalAngle * 3 + timeValue;
                    const subRadius = 20 * Math.sin(timeValue + fractalLevel);
                    x = fractalX + Math.cos(subAngle) * subRadius;
                    y = fractalY + Math.sin(subAngle) * subRadius;
                    size = this.pixelSize * (0.5 + 0.5 / (fractalLevel + 1));
                    alpha = 0.7;
                    break;
                    
                case 'network':
                    const layer = Math.floor(index / (this.pixelData.length / 5));
                    const nodeInLayer = index % Math.floor(this.pixelData.length / 5);
                    const layerX = 100 + layer * 150;
                    const layerSpread = 400;
                    const nodeY = centerY - layerSpread/2 + (nodeInLayer / (this.pixelData.length / 5)) * layerSpread;
                    
                    x = layerX + Math.sin(timeValue + index * 0.1) * 20;
                    y = nodeY + Math.cos(timeValue + index * 0.1) * 20;
                    size = this.pixelSize * 0.6;
                    alpha = 0.8;
                    
                    // Draw synapses
                    if (layer < 4) {
                        ctx.strokeStyle = pixel.color + '20';
                        ctx.lineWidth = 0.3;
                        for (let i = 0; i < 3; i++) {
                            const nextIndex = Math.min(
                                index + Math.floor(this.pixelData.length / 5) + i,
                                this.pixelData.length - 1
                            );
                            const nextPixel = this.pixelData[nextIndex];
                            if (nextPixel) {
                                ctx.beginPath();
                                ctx.moveTo(x, y);
                                ctx.lineTo(
                                    150 + layer * 150 + Math.sin(timeValue + nextIndex * 0.1) * 20,
                                    centerY - layerSpread/2 + (nextIndex % Math.floor(this.pixelData.length / 5)) / (this.pixelData.length / 5) * layerSpread
                                );
                                ctx.stroke();
                            }
                        }
                    }
                    break;
                    
                default:
                    x = pixel.originalX;
                    y = pixel.originalY;
                    size = this.pixelSize;
                    alpha = 1;
            }
            
            // Draw the pixel
            ctx.fillStyle = pixel.color;
            ctx.globalAlpha = alpha;
            
            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = pixel.color;
            
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }

    // Save abstract image
    saveAbstractImage() {
        const wasAnimating = this.isAnimating;
        if (wasAnimating) {
            this.isAnimating = false;
            this.stopAbstractAnimation();
        }
        
        // Clear and redraw for clean image
        this.pixelContext.fillStyle = '#0a0a0a';
        this.pixelContext.fillRect(0, 0, this.pixelCanvas.width, this.pixelCanvas.height);
        this.renderAbstractFrame(this.staticTime);
        
        // Save
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        link.download = `abstract-${this.abstractType}-${timestamp}.png`;
        link.href = this.pixelCanvas.toDataURL();
        link.click();
        
        // Resume animation if it was running
        if (wasAnimating) {
            this.isAnimating = true;
            this.startAbstractAnimation();
        }
    }

    // Handle hover on pixel portrait
    handlePixelHover(event) {
        const rect = this.pixelCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const col = Math.floor(x / this.pixelSize);
        const row = Math.floor(y / this.pixelSize);
        const index = row * this.gridColumns + col;
        
        const videoData = this.dataProcessor.getFilteredData();
        if (index < videoData.length) {
            this.showHoverInfo(event.clientX, event.clientY, videoData[index]);
        } else {
            this.hideHoverInfo();
        }
    }

    // Show hover information
    showHoverInfo(x, y, video) {
        const hoverInfo = document.getElementById('hover-info');
        hoverInfo.style.display = 'block';
        
        // Position hover info
        const maxX = window.innerWidth - 320;
        const maxY = window.innerHeight - 100;
        hoverInfo.style.left = Math.min(x + 10, maxX) + 'px';
        hoverInfo.style.top = Math.min(y + 10, maxY) + 'px';
        
        // Update content
        hoverInfo.querySelector('.hover-title').textContent = video.title;
        hoverInfo.querySelector('.hover-details').innerHTML = `
            <strong>${video.channel}</strong><br>
            Category: ${video.category}<br>
            Date: ${video.time.toLocaleDateString()}<br>
            Time: ${video.time.toLocaleTimeString()}
        `;
    }

    // Hide hover information
    hideHoverInfo() {
        const hoverInfo = document.getElementById('hover-info');
        hoverInfo.style.display = 'none';
    }

    // Switch between views
    switchView(view) {
        this.currentView = view;
        
        if (view === 'particles') {
            document.getElementById('particle-canvas').style.display = 'block';
            document.getElementById('pixel-portrait-container').style.display = 'none';
            this.stopAbstractAnimation();
        } else {
            document.getElementById('particle-canvas').style.display = 'none';
            document.getElementById('pixel-portrait-container').style.display = 'flex';
        }
    }

    // Update visualizations with new data
    update() {
        this.stopAbstractAnimation();
        if (this.p5Instance) {
            this.p5Instance.remove();
        }
        this.initParticleVisualization();
        this.drawPixelPortrait();
    }

    // Download current visualization
    download() {
        if (this.currentView === 'particles') {
            if (this.p5Instance) {
                const timestamp = new Date().getTime();
                this.p5Instance.saveCanvas(`youtube-particles-${timestamp}`, 'png');
            }
        } else {
            const link = document.createElement('a');
            const timestamp = new Date().getTime();
            link.download = `youtube-portrait-${timestamp}.png`;
            link.href = this.pixelCanvas.toDataURL();
            link.click();
        }
    }

    // Clean up
    destroy() {
        this.stopAbstractAnimation();
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }
    }
}

// Export for use in other modules
window.Visualizations = Visualizations;