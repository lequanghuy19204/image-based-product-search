import React, { useEffect, useRef } from 'react';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import '../../styles/ImageViewer.css';

const ImageViewer = ({ show, onClose, images, startIndex, productCode, productName }) => {
  const viewerContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    // Khởi tạo viewer khi component mount và show=true
    if (show && viewerContainerRef.current && images?.length > 0) {
      // Nếu viewerRef đã tồn tại, hủy nó trước khi tạo mới
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
      
      // Lưu lại phần tử đang focus trước khi mở viewer
      previousActiveElement.current = document.activeElement;
      
      // Khởi tạo ViewerJS với các tùy chọn phù hợp
      viewerRef.current = new Viewer(viewerContainerRef.current, {
        inline: false,
        navbar: images.length > 1, // Chỉ hiện navbar khi có nhiều ảnh
        title: true,
        toolbar: {
          zoomIn: true,
          zoomOut: true,
          oneToOne: true,
          reset: true,
          prev: images.length > 1,
          play: images.length > 1,
          next: images.length > 1,
          rotateLeft: true,
          rotateRight: true,
          flipHorizontal: true,
          flipVertical: true
        },
        tooltip: true,
        movable: true,
        zoomable: true,
        rotatable: true,
        scalable: true,
        keyboard: true,
        transition: true,
        fullscreen: true,
        initialViewIndex: startIndex || 0, // Đặt vị trí ảnh ban đầu
        hidden() {
          // Khi viewer đóng, trả focus về phần tử trước đó
          if (previousActiveElement.current) {
            previousActiveElement.current.focus();
          }
          // Thêm timeout nhỏ để đảm bảo modal đã đóng hoàn toàn trước khi gọi onClose
          setTimeout(() => {
            onClose();
          }, 50);
        }
      });

      // Mở viewer
      viewerRef.current.show();
      
      // Xử lý vấn đề accessibility bằng cách thêm sự kiện để bắt khi viewer đóng
      const handleViewerClose = () => {
        // Tìm các phần tử viewer trong DOM
        const viewerContainers = document.querySelectorAll('.viewer-container');
        viewerContainers.forEach(container => {
          // Kiểm tra nếu phần tử đang ẩn và có thuộc tính aria-hidden
          if (container.getAttribute('aria-hidden') === 'true') {
            // Đảm bảo không còn phần tử nào bên trong giữ focus
            const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusableElements.forEach(el => {
              el.setAttribute('tabindex', '-1');
            });
            
            // Trả focus về phần tử trước đó
            if (previousActiveElement.current) {
              previousActiveElement.current.focus();
            } else {
              document.body.focus();
            }
          }
        });
      };
      
      // Thêm sự kiện để theo dõi khi viewer đóng
      document.addEventListener('keydown', handleViewerClose);
      
      // Cleanup event listener khi unmount
      return () => {
        document.removeEventListener('keydown', handleViewerClose);
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }
      };
    }
    
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [show, images, startIndex, onClose]);

  // Không hiển thị nếu show=false
  if (!show || !images?.length) return null;

  return (
    <div className="image-viewer-container">
      <div ref={viewerContainerRef} className="images-container">
        {images.map((imageUrl, index) => (
          <img
            key={`image-${index}`}
            src={imageUrl}
            alt={`${productCode || 'Sản phẩm'} - Ảnh ${index + 1}`}
            data-product-code={productCode}
            data-product-name={productName}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageViewer;
