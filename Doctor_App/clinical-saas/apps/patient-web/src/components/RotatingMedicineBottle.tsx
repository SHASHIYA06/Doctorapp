/**
 * 3D Rotating Medicine Bottle Component
 * Uses Three.js for beautiful 3D medicine bottle visualization
 * Can be embedded in marketplace or product details
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface RotatingMedicineBottleProps {
  medicineColor?: string;
  medicineLabel?: string;
  speed?: number;
  size?: number;
  className?: string;
}

export const RotatingMedicineBottle: React.FC<RotatingMedicineBottleProps> = ({
  medicineColor = '#667eea',
  medicineLabel = 'Medicine',
  speed = 0.005,
  size = 300,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const bottleGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Bottle group for rotation
    const bottleGroup = new THREE.Group();
    bottleGroupRef.current = bottleGroup;
    scene.add(bottleGroup);

    // Create bottle body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: medicineColor,
      shininess: 100,
      emissive: 0x000000,
    });
    const bottleBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bottleBody.castShadow = true;
    bottleBody.receiveShadow = true;
    bottleGroup.add(bottleBody);

    // Create bottle cap (small cylinder)
    const capGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32);
    const capMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 80,
    });
    const bottleCap = new THREE.Mesh(capGeometry, capMaterial);
    bottleCap.position.y = 1;
    bottleCap.castShadow = true;
    bottleCap.receiveShadow = true;
    bottleGroup.add(bottleCap);

    // Create label (plane)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(medicineLabel, 128, 50);
      ctx.font = '14px Arial';
      ctx.fillText('Effective • Safe • Pure', 128, 90);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(0.8, 1.2);
    const labelMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.z = 0.51;
    bottleGroup.add(label);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x667eea, 0.5);
    pointLight.position.set(-3, 3, 3);
    scene.add(pointLight);

    // Create ground for shadow
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.position.y = -2;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Mouse tracking
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseX = (event.clientX - rect.left) / rect.width - 0.5;
      mouseY = (event.clientY - rect.top) / rect.height - 0.5;
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (bottleGroup) {
        // Constant rotation
        bottleGroup.rotation.y += speed;

        // Mouse-based tilt
        bottleGroup.rotation.x = mouseY * 0.5;
        bottleGroup.rotation.z = mouseX * 0.3;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [medicineColor, medicineLabel, speed, size]);

  return (
    <div
      ref={mountRef}
      className={`rotating-bottle-container ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        borderRadius: '15px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
      }}
    />
  );
};

export default RotatingMedicineBottle;
