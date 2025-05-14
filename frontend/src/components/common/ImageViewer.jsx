import React, { useEffect, useRef } from 'react';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import '../../styles/ImageViewer.css';

function ImageViewer({ show, onClose, images, startIndex, productCode, productName }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    // Chỉ tạo viewer khi component mount và show=true
    if (show && containerRef.current && images?.length > 0) {
      // Đảm bảo destroy viewer cũ nếu có
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
      
      // Tạo các phần tử ảnh
      containerRef.current.innerHTML = '';
      images.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.alt = `${productCode || ''} - ${index + 1}`;
        containerRef.current.appendChild(img);
      });
      
      // Khởi tạo viewer với cấu hình đơn giản
      const viewer = new Viewer(containerRef.current, {
        initialViewIndex: parseInt(startIndex) || 0,
        hidden() {
          onClose();
        }
      });
      
      // Lưu trữ tham chiếu
      viewerRef.current = viewer;
      
      // Hiển thị viewer
      viewer.show();
    }
    
    // Cleanup khi unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [show, images, startIndex, onClose]);

  // Đóng viewer khi show=false
  useEffect(() => {
    if (!show && viewerRef.current) {
      viewerRef.current.hide();
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="image-viewer-container">
      <div ref={containerRef} style={{ display: 'none' }}></div>
    </div>
  );
}

export default ImageViewer;