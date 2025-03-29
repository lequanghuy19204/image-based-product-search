import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Form, InputGroup, Button, Table, 
  Card, Dropdown, OverlayTrigger, Tooltip, Alert, ListGroup, Modal, Spinner
} from 'react-bootstrap';
import { 
  FaUser, FaPhone, FaMapMarkerAlt, FaHome, FaStickyNote, FaBox, FaSearch, FaTruck, FaCalendarAlt, FaPercent,
  FaTicketAlt, FaCreditCard, FaMoneyBillWave, FaExchangeAlt, FaQuestionCircle, FaChevronDown, FaSync, FaLink, FaKey, FaPaperPlane, FaCheck,
  FaWeight, FaRulerVertical, FaMars, FaVenus, FaStore, FaUpload, FaTrash, FaMinus, FaPlus
} from 'react-icons/fa';
import '../../styles/Orders.css';
import Sidebar from '../common/Sidebar';
import { getOrderSources, createOrderFromConversation, getLocations, searchProducts, getUsers, createOrder } from '../../services/nhanh.service';
import ImageUploading from 'react-images-uploading';
import { apiService } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const Orders = () => {
  // console.log('nhanhService methods:', Object.keys(nhanhService));
  const [validated, setValidated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [conversationLink, setConversationLink] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [orderSources, setOrderSources] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [targetProvince, setTargetProvince] = useState('');
  const [targetDistrict, setTargetDistrict] = useState('');
  const [targetWard, setTargetWard] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [selectedImageProduct, setSelectedImageProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState('');
  const [shippingFee, setShippingFee] = useState('');
  const [selfShipping, setSelfShipping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const COLORS = [
    'ĐEN', 'TRẮNG', 'XANH', 'XANH LÁ', 'XÁM TIÊU', 'HỒNG ĐẬM', 'HỒNG NHẠT',
    'XI NHẠT', 'XANH BÍCH', 'XANH CHUỐI', 'XANH BIỂN', 'XANH CỐM', 'XANH KÉT',
    'ĐỎ ĐÔ', 'ĐỎ TƯƠI', 'HỒNG DÂU', 'HỒNG PHẤN', 'HỒNG SEN', 'CỔ VỊT', 'THIÊN THANH'
  ];

  const SIZES = ['K1', 'K2', 'K3', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  useEffect(() => {
    loadOrderSources();
    loadCities();
    const fetchStaffList = async () => {
      setIsLoadingStaff(true);
      try {
        const response = await getUsers();
        if (response?.users) {
          const staffArray = Object.values(response.users);
          setStaffList(staffArray);
          
          // Lấy staff_code từ userDetails cache
          const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
          const staffCode = userDetails.staff_code;
          
          // Nếu có staff_code, tìm và tự động chọn nhân viên tương ứng
          if (staffCode) {
            const matchedStaff = staffArray.find(staff => staff.id === staffCode);
            if (matchedStaff) {
              setSelectedStaff(matchedStaff.id);
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffList();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrderSources = async () => {
    try {
      setIsLoadingSources(true);
      const sources = await getOrderSources();
      setOrderSources(sources);
    } catch (error) {
      console.error('Lỗi khi tải nguồn đơn hàng:', error);
    } finally {
      setIsLoadingSources(false);
    }
  };

  const loadCities = async () => {
    try {
      setIsLoadingLocations(true);
      const citiesData = await getLocations('CITY');
      if (citiesData && Array.isArray(citiesData)) {
        setCities(citiesData);
      } else {
        console.error('Dữ liệu thành phố không đúng định dạng:', citiesData);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách thành phố:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);
  };

  const handleCreateOrder = async () => {
    if (!conversationLink) {
      setApiError('Vui lòng nhập Link hội thoại');
      setTimeout(() => setApiError(''), 3000);
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiResponse(null);
    setSelectedOrderIndex(null);

    try {
      const response = await createOrderFromConversation(conversationLink);
      
      setApiResponse(response);
      // Nếu chỉ có một kết quả, tự động chọn
      if (Array.isArray(response) && response.length === 1) {
        setSelectedOrderIndex(0);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setApiError(error.response?.data?.detail || error.message || 'Có lỗi xảy ra khi gọi API');
      setTimeout(() => setApiError(''), 3000);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrder = (index) => {
    setSelectedOrderIndex(index);
  };

  const handleViewDetails = () => {
    setShowOrderDetails(true);
  };

  const handleCloseDetails = () => {
    setShowOrderDetails(false);
  };

  const compareAddress = (str1, str2) => {
    if (!str1 || !str2) return false;

    // Chuẩn hóa chuỗi
    const normalize = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/\s+/g, ' ')             // Chuẩn hóa khoảng trắng
        .replace(/tp\.|tp|thanh pho/g, '') // Bỏ tiền tố TP
        .replace(/q\.|quan/g, '')          // Bỏ tiền tố Quận
        .replace(/p\.|phuong/g, '')        // Bỏ tiền tố Phường
        .replace(/h\.|huyen/g, '')         // Bỏ tiền tố Huyện
        .replace(/t\.|thi|thi xa/g, '')    // Bỏ tiền tố Thị
        .replace(/xa/g, '')                // Bỏ tiền tố Xã
        .trim();
    };

    const s1 = normalize(str1);
    const s2 = normalize(str2);

    // Tính độ tương đồng bằng Levenshtein Distance
    const levenshteinDistance = (str1, str2) => {
      const m = str1.length;
      const n = str2.length;
      const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;

      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1];
          } else {
            dp[i][j] = 1 + Math.min(
              dp[i - 1][j],     // xóa
              dp[i][j - 1],     // thêm
              dp[i - 1][j - 1]  // thay thế
            );
          }
        }
      }
      return dp[m][n];
    };

    // Tính điểm tương đồng dựa trên nhiều tiêu chí
    const calculateSimilarity = (str1, str2) => {
      // 1. So sánh độ dài chuỗi
      const lengthDiff = Math.abs(str1.length - str2.length);
      if (lengthDiff > 5) return 0;

      // 2. Tính Levenshtein Distance và chuẩn hóa
      const maxLength = Math.max(str1.length, str2.length);
      const levenScore = maxLength > 0 ? 
        1 - (levenshteinDistance(str1, str2) / maxLength) : 0;

      // 3. So sánh từng từ
      const words1 = str1.split(' ');
      const words2 = str2.split(' ');
      const commonWords = words1.filter(word => 
        words2.some(w2 => w2 === word)  // Chỉ khớp chính xác
      );
      const wordScore = Math.min(words1.length, words2.length) > 0 ?
        commonWords.length / Math.min(words1.length, words2.length) : 0;

      // 4. Tính điểm tổng hợp (cho trọng số cao hơn cho việc khớp từ)
      const finalScore = (levenScore * 0.4) + (wordScore * 0.6);
      
      return finalScore;
    };

    const similarityScore = calculateSimilarity(s1, s2);
    return similarityScore > 0.7; // Tăng ngưỡng lên 70% để chặt chẽ hơn
  };

  const handleConfirmOrder = async () => {
    if (selectedOrderIndex !== null && apiResponse) {
      const orderData = apiResponse[selectedOrderIndex];
      
      try {
        // Điền thông tin cơ bản trước
        setCustomerPhone(orderData.phone_number || '');
        setCustomerName(orderData.name_customers || '');
        setCustomerAddress(orderData.full_address || '');
        
        // Thêm điền tiền đặt cọc vào ô chuyển khoản
        if (orderData.money_deposit) {
          setTransferAmount(orderData.money_deposit.toString());
        }

        // Thêm điền phí vận chuyển
        if (orderData.shipping_fee) {
          setShippingFee(orderData.shipping_fee.toString());
        }

        // Tạo ghi chú khách hàng với format: Giới tính - Chiều cao - Cân nặng
        const gender = orderData.gender === 'male' ? 'Nam' : 'Nữ';
        const note = `${gender} - ${orderData.height}cm:${orderData.weight}kg`;
        setCustomerNote(note);
        
        // Lưu thông tin địa chỉ cần tìm
        setTargetProvince(orderData.province || '');
        setTargetDistrict(orderData.district || '');
        setTargetWard(orderData.ward || '');

        // Tìm nguồn đơn hàng phù hợp dựa trên tên trang
        if (orderData.name_page && orderSources.length > 0) {
          const pageName = orderData.name_page.toLowerCase().trim();
          
          // Tìm nguồn đơn hàng có tên gần giống nhất
          const matchedSource = orderSources.find(source => {
            const sourceName = source.name.toLowerCase().trim();
            return sourceName.includes(pageName) || pageName.includes(sourceName);
          });

          if (matchedSource) {
            setSelectedSource(matchedSource.id);
          }
        }

        // Tự động chọn Tỉnh/Thành phố
        if (orderData.province && cities.length > 0) {
          const matchedCity = cities.find(city => 
            compareAddress(city.name, orderData.province)
          );
          
          if (matchedCity) {
            setSelectedCity(matchedCity.id);
            // Tải quận/huyện của thành phố này
            const districtsData = await getLocations('DISTRICT', parseInt(matchedCity.id));
            setDistricts(districtsData);

            // Tự động chọn Quận/Huyện
            if (orderData.district) {
              const matchedDistrict = districtsData.find(district =>
                compareAddress(district.name, orderData.district)
              );
              
              if (matchedDistrict) {
                setSelectedDistrict(matchedDistrict.id);
                // Tải phường/xã của quận/huyện này
                const wardsData = await getLocations('WARD', parseInt(matchedDistrict.id));
                setWards(wardsData);

                // Tự động chọn Phường/Xã
                if (orderData.ward) {
                  const matchedWard = wardsData.find(ward =>
                    compareAddress(ward.name, orderData.ward)
                  );
                  
                  if (matchedWard) {
                    setSelectedWard(matchedWard.id);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi điền thông tin đơn hàng:', error);
      }
      
      setShowOrderDetails(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);

    if (cityId) {
      try {
        setIsLoadingLocations(true);
        const districtsData = await getLocations('DISTRICT', parseInt(cityId));
        setDistricts(districtsData);
      } catch (error) {
        console.error('Lỗi khi tải danh sách quận/huyện:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    }
  };

  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedWard('');
    setWards([]);

    if (districtId) {
      try {
        setIsLoadingLocations(true);
        const wardsData = await getLocations('WARD', parseInt(districtId));
        setWards(wardsData);
      } catch (error) {
        console.error('Lỗi khi tải danh sách phường/xã:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    }
  };

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        const response = await searchProducts(searchTerm);
        
        if (response?.products) {
          const productsArray = Object.values(response.products);
          if (productsArray.length > 0) {
            setSearchResults(productsArray);
          } else {
            setSearchResults([]);
          }
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleProductSelect = (product) => {
    const newProduct = {
      id: product.idNhanh,
      name: product.name,
      quantity: 1, // Mặc định số lượng là 1
      price: parseFloat(product.price),
      total: parseFloat(product.price), // Tổng = giá * số lượng
    };

    setSelectedProducts(prevProducts => {
      // Kiểm tra xem sản phẩm đã tồn tại chưa
      const existingProductIndex = prevProducts.findIndex(p => p.id === product.idNhanh);
      
      if (existingProductIndex >= 0) {
        // Nếu sản phẩm đã tồn tại, tăng số lượng lên 1
        const updatedProducts = [...prevProducts];
        updatedProducts[existingProductIndex].quantity += 1;
        updatedProducts[existingProductIndex].total = 
          updatedProducts[existingProductIndex].quantity * updatedProducts[existingProductIndex].price;
        return updatedProducts;
      } else {
        // Nếu là sản phẩm mới, thêm vào danh sách
        return [...prevProducts, newProduct];
      }
    });

    setShowSearchResults(false);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    setSelectedProducts(prevProducts => 
      prevProducts.map(product => {
        if (product.id === productId) {
          const quantity = Math.max(1, parseInt(newQuantity) || 0); // Đảm bảo số lượng >= 1
          return {
            ...product,
            quantity: quantity,
            total: quantity * product.price
          };
        }
        return product;
      })
    );
  };

  // Thêm hàm xử lý thay đổi giá
  const handlePriceChange = (productId, newPrice) => {
    setSelectedProducts(prevProducts => 
      prevProducts.map(product => {
        if (product.id === productId) {
          const price = Math.max(0, parseFloat(newPrice) || 0); // Đảm bảo giá >= 0
          return {
            ...product,
            price: price,
            total: product.quantity * price
          };
        }
        return product;
      })
    );
  };

  const handleImageUrl = async (url) => {
    setImageUrl(url);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể tải ảnh');
      setPreviewUrl(url);
      setImages([]);
    } catch (error) {
      console.error('Lỗi:', error);
      setApiError('URL ảnh không hợp lệ');
      setTimeout(() => setApiError(''), 3000);
      setPreviewUrl('');
    }
  };

  const handleImageSearch = async () => {
    if ((!images.length && !previewUrl) || imageSearchLoading) return;
    
    setImageSearchLoading(true);
    try {
      const formData = new FormData();
      
      if (images.length > 0) {
        const imageFile = await fetch(images[0].data_url).then(r => r.blob());
        formData.append('file', imageFile, 'image.jpg');
      } else if (previewUrl) {
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error('Không thể tải ảnh từ URL');
        const blob = await response.blob();
        formData.append('file', blob, 'image.jpg');
      }

      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      formData.append('company_id', userDetails.company_id);
      formData.append('top_k', '8');

      const response = await apiService.postFormData('/api/images/search', formData);
      setImageSearchResults(response.results);
    } catch (error) {
      setApiError(error.message);
      setTimeout(() => setApiError(''), 3000);
    } finally {
      setImageSearchLoading(false);
    }
  };

  const handleProductImageHover = async (productId) => {
    try {
      setImageSearchLoading(true);
      const productDetails = await apiService.getProductDetails(productId);
      setSelectedImageProduct(productDetails);
      setShowImageSearchModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setImageSearchLoading(false);
    }
  };

  useEffect(() => {
    if (images.length > 0 || previewUrl) {
      handleImageSearch();
    }
  }, [images, previewUrl]);

  const handleConfirmProductSelection = async () => {
    const color = customColor || selectedColor;
    const size = customSize || selectedSize;
    
    if (selectedImageProduct) {
      try {
        const searchTerm = `${selectedImageProduct.product_name} - ${color} - ${size}`;
        const response = await searchProducts(searchTerm);
        
        if (response?.products) {
          const firstProduct = Object.values(response.products)[0];
          
          if (firstProduct) {
            const newProduct = {
              id: firstProduct.idNhanh,
              name: firstProduct.name,
              quantity: quantity,
              price: parseFloat(firstProduct.price),
              total: parseFloat(firstProduct.price) * quantity,
              color: color,
              size: size,
              inventory: firstProduct.inventory,
              code: firstProduct.code,
              createdDateTime: firstProduct.createdDateTime
            };
            
            setSelectedProducts(prev => [...prev, newProduct]);

            const productNote = `${selectedImageProduct.product_code || 'N/A'} - ${firstProduct.name} - SL:${quantity}`;
            setCustomerNote(prevNote => {
              if (prevNote) {
                return `${prevNote}\n${productNote}`;
              }
              return productNote;
            });

          } else {
            setApiError('Không tìm thấy sản phẩm phù hợp');
            setTimeout(() => setApiError(''), 3000);
          }
        } else {
          setApiError('Không tìm thấy sản phẩm phù hợp');
          setTimeout(() => setApiError(''), 3000);
        }
      } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        setApiError(error.message || 'Có lỗi xảy ra khi tìm kiếm sản phẩm');
        setTimeout(() => setApiError(''), 3000);
      }
      
      // Reset các state
      setShowImageSearchModal(false);
      setSelectedColor('');
      setSelectedSize('');
      setCustomColor('');
      setCustomSize('');
      setQuantity(1);
    }
  };

  // Thêm hàm xử lý xóa sản phẩm
  const handleDeleteProduct = (productId) => {
    setSelectedProducts(prevProducts => 
      prevProducts.filter(product => product.id !== productId)
    );
  };

  // Thêm useEffect để tự động chọn nhân viên khi danh sách được tải
  useEffect(() => {
    if (staffList.length > 0) {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const staffCode = userDetails.staff_code;
      if (staffCode) {
        const matchedStaff = staffList.find(staff => staff.id === staffCode);
        if (matchedStaff) {
          setSelectedStaff(matchedStaff.id);
        }
      }
    }
  }, [staffList]);

  // Tính tổng tiền từ các sản phẩm đã chọn
  const totalProductsAmount = selectedProducts.reduce((sum, product) => sum + product.total, 0);
  
  // Tính số tiền thu khách
  const calculateCollectAmount = () => {
    const shippingFeeNum = Number(shippingFee) || 0;
    const transferAmountNum = Number(transferAmount) || 0;
    const collectAmount = totalProductsAmount + shippingFeeNum - transferAmountNum;
    return collectAmount;
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      
      // Kiểm tra các trường bắt buộc
      if (!customerPhone || !customerName || !customerAddress || !selectedCity || !selectedDistrict || !selectedWard) {
        setApiError('Vui lòng điền đầy đủ thông tin khách hàng và địa chỉ');
        setTimeout(() => setApiError(''), 3000);
        return;
      }

      if (!selectedSource) {
        setApiError('Vui lòng chọn nguồn đơn hàng');
        setTimeout(() => setApiError(''), 3000);
        return;
      }

      if (selectedProducts.length === 0) {
        setApiError('Vui lòng chọn ít nhất một sản phẩm');
        setTimeout(() => setApiError(''), 3000);
        return;
      }

      // Tìm tên địa chỉ từ ID
      const findCityName = (cityId) => {
        const city = cities.find(c => c.id === Number(cityId));
        return city ? city.name : '';
      };

      const findDistrictName = (districtId) => {
        const district = districts.find(d => d.id === Number(districtId));
        return district ? district.name : '';
      };

      const findWardName = (wardId) => {
        const ward = wards.find(w => w.id === Number(wardId));
        return ward ? ward.name : '';
      };

      // Thêm hàm tìm tên nguồn đơn hàng
      const findSourceName = (sourceId) => {
        const source = orderSources.find(s => s.id === Number(sourceId));
        return source ? source.name : '';
      };

      // Lấy tên địa chỉ và nguồn đơn hàng
      const cityName = findCityName(selectedCity);
      const districtName = findDistrictName(selectedDistrict);
      const wardName = findWardName(selectedWard);
      const sourceName = findSourceName(selectedSource);

      const orderData = {
        customerName: customerName,
        customerMobile: customerPhone,
        customerAddress: customerAddress,
        cityName: cityName,
        districtName: districtName,
        wardName: wardName,
        trafficSource: sourceName, // Sử dụng tên nguồn thay vì ID
        moneyTransfer: Number(transferAmount) || 0,
        saleId: Number(selectedStaff) || null,
        selfShipping: selfShipping,
        shippingFee: Number(shippingFee) || 0,
        description: customerNote,
        products: selectedProducts.map(product => ({
          idNhanh: product.id,
          quantity: product.quantity,
          name: product.name,
          price: product.price
        }))
      };

      const response = await createOrder(orderData);

      // Kiểm tra response có orderId hay không
      if (response && response.orderId) {
        setApiError("Tạo đơn thành công");
        setTimeout(() => setApiError(''), 3000);
        
        // Đợi 1 giây trước khi reload trang
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        // Nếu không có orderId, xem như thất bại
        const errorMessage = response?.message || response?.error || 'Có lỗi xảy ra khi tạo đơn hàng';
        setApiError(errorMessage);
        setTimeout(() => setApiError(''), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo đơn hàng';
      setApiError(errorMessage);
      setTimeout(() => setApiError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="layout-container">
      <Sidebar open={sidebarOpen} onToggle={handleToggleSidebar} />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Container className="orders-container py-3">
          {/* API Integration Card */}
          <Card className="mb-3 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <FaLink className="me-2" /> Tạo đơn từ hội thoại
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={10}>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FaLink />
                    </InputGroup.Text>
                    <Form.Control 
                      placeholder="Link hội thoại" 
                      value={conversationLink}
                      onChange={(e) => setConversationLink(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="primary" 
                    className="w-100" 
                    onClick={handleCreateOrder}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" /> Gửi
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
              
              {apiError && (
                <Alert variant="danger" className="mt-3">
                  {apiError}
                </Alert>
              )}
              
              {apiResponse && Array.isArray(apiResponse) && apiResponse.length > 0 && (
                <div className="mt-3">
                  <h6>Kết quả phân tích ({apiResponse.length} đơn hàng):</h6>
                  
                  <ListGroup className="mt-3">
                    {apiResponse.map((order, index) => (
                      <ListGroup.Item 
                        key={index}
                        action
                        active={selectedOrderIndex === index}
                        onClick={() => handleSelectOrder(index)}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-bold">
                            <FaUser className="me-1" /> {order.name_customers} 
                            {order.gender && (
                              <span className="ms-2">
                                {order.gender === 'male' ? <FaMars className="text-primary" /> : <FaVenus className="text-danger" />}
                              </span>
                            )}
                          </div>
                          <div>
                            <FaPhone className="me-1" /> {order.phone_number}
                          </div>
                          <div>
                            <FaMapMarkerAlt className="me-1" /> {order.full_address}
                          </div>
                          <div>
                            <FaWeight className="me-1" /> Cân nặng: {order.weight} kg
                            <span className="ms-3"><FaRulerVertical className="me-1" /> Chiều cao: {order.height} cm</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <div>
                            <FaBox className="me-1" /> {order.quantity}x {order.size} 
                            {order.color && ` - ${order.color}`}
                          </div>
                          <div>
                            <FaStore className="me-1" /> {order.name_page}
                          </div>
                          <div className="fw-bold">
                            Giá: {formatCurrency(order.order_price)}
                          </div>
                          <div>
                            Ship: {formatCurrency(order.shipping_fee)}
                          </div>
                          
                          <div>
                            Đặt cọc: {formatCurrency(order.money_deposit)}
                          </div>
                          
                          <div className="fw-bold">
                            Tổng: {formatCurrency(parseInt(order.order_price) + parseInt(order.shipping_fee || 0))}
                          </div>
                        </div>
                        {selectedOrderIndex === index && (
                          <div className="ms-2 text-success">
                            <FaCheck />
                          </div>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  
                  {selectedOrderIndex !== null && (
                    <div className="d-flex justify-content-end mt-3 gap-2">
                      <Button 
                        variant="info" 
                        onClick={handleViewDetails}
                      >
                        <FaQuestionCircle className="me-2" /> Xem chi tiết
                      </Button>
                      <Button 
                        variant="success" 
                        onClick={handleConfirmOrder}
                      >
                        <FaCheck className="me-2" /> Xác nhận đơn hàng
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Thêm phần tìm kiếm ảnh sau phần API Integration Card */}
          <Card className="mb-3 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <FaSearch className="me-2" /> Tìm kiếm bằng hình ảnh
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Nhập URL ảnh..."
                    value={imageUrl}
                    onChange={(e) => handleImageUrl(e.target.value)}
                  />
                  <Button 
                    variant="outline-primary"
                    onClick={() => handleImageUrl(imageUrl)}
                    disabled={!imageUrl}
                  >
                    <FaSearch className="me-1" /> Xem trước
                  </Button>
                </InputGroup>
              </div>

              <ImageUploading
                multiple={false}
                value={images}
                onChange={(imageList) => {
                  setImages(imageList);
                  setPreviewUrl('');
                  setImageUrl('');
                }}
                maxNumber={1}
                dataURLKey="data_url"
                acceptType={['jpg', 'jpeg', 'png']}
              >
                {({
                  imageList,
                  onImageUpload,
                  onImageRemove,
                  isDragging,
                  dragProps
                }) => (
                  <div className="upload-area p-4 text-center">
                    {!imageList.length && !previewUrl ? (
                      <div 
                        className={`upload-placeholder border-2 border-dashed rounded p-5 
                          ${isDragging ? 'bg-light' : ''}`}
                        {...dragProps}
                      >
                        <Button
                          variant="outline-primary"
                          size="lg"
                          className="mb-3"
                          onClick={onImageUpload}
                        >
                          <FaUpload className="me-2" />
                          Tải ảnh lên
                        </Button>
                        <p className="text-muted mb-0">
                          Kéo thả hoặc nhấp để tải ảnh (JPG, JPEG, PNG)
                        </p>
                      </div>
                    ) : (
                      <div className="position-relative d-inline-block">
                        <img 
                          src={imageList[0]?.data_url || previewUrl}
                          alt="Preview" 
                          className="img-fluid rounded"
                          style={{ maxHeight: '150px' }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-2"
                          onClick={() => {
                            if (imageList.length) onImageRemove(0);
                            setPreviewUrl('');
                            setImageUrl('');
                          }}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </ImageUploading>

              {/* Thêm nút tìm kiếm */}
              <div className="text-center mt-3">
                <Button
                  variant="primary"
                  onClick={handleImageSearch}
                  disabled={imageSearchLoading || (!images.length && !previewUrl)}
                >
                  {imageSearchLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang tìm kiếm...
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-2" />
                      Tìm kiếm
                    </>
                  )}
                </Button>
              </div>

              {/* Hiển thị thông báo lỗi nếu có */}
              {apiError && (
                <div className="alert alert-danger mt-3">
                  {apiError}
                </div>
              )}

              {/* Kết quả tìm kiếm ảnh */}
              {imageSearchResults.length > 0 && (
                <div className="search-results mt-4">
                  <h6 className="mb-3">Kết quả tìm kiếm: {imageSearchResults.length} ảnh</h6>
                  <Row className="flex-nowrap overflow-auto g-2">
                    {imageSearchResults.map((item, index) => (
                      <Col key={index} style={{ minWidth: '12.5%', maxWidth: '12.5%' }}>
                        <Card className="h-100 product-card">
                          <div 
                            className="card-img-container cursor-pointer"
                            onClick={() => handleProductImageHover(item.product_id)}
                            style={{ 
                              height: '240px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              backgroundColor: '#f8f9fa'
                            }}
                          >
                            <Card.Img
                              variant="top"
                              src={item.image_url}
                              alt={item.product_name}
                              style={{ 
                                maxHeight: '100%',
                                width: 'auto',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                          <Card.Body className="p-2">
                            <Card.Title as="h6" className="text-truncate small mb-1" title={item.product_name}>
                              {item.product_name}
                            </Card.Title>
                            <Card.Text className="text-muted small mb-1 text-truncate" title={`Mã SP: ${item.product_code}`}>
                              Mã SP: {item.product_code}
                            </Card.Text>
                            <Card.Text className="text-primary fw-bold small mb-0">
                              {item.price ? `${item.price.toLocaleString()}đ` : '0đ'}
                            </Card.Text>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Modal hiển thị chi tiết đơn hàng */}
          {selectedOrderIndex !== null && apiResponse && (
            <Modal show={showOrderDetails} onHide={handleCloseDetails} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Chi tiết đơn hàng</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-0">
                <div className="table-responsive">
                  <Table bordered hover className="mb-0">
                    <tbody>
                      <tr>
                        <td className="fw-bold" width="30%">Tên khách hàng</td>
                        <td>{apiResponse[selectedOrderIndex].name_customers}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Giới tính</td>
                        <td>{apiResponse[selectedOrderIndex].gender === 'male' ? 'Nam' : 'Nữ'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Số điện thoại</td>
                        <td>{apiResponse[selectedOrderIndex].phone_number}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Địa chỉ đầy đủ</td>
                        <td style={{wordBreak: 'break-word'}}>{apiResponse[selectedOrderIndex].full_address}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tỉnh/Thành phố</td>
                        <td>{apiResponse[selectedOrderIndex].province}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Quận/Huyện</td>
                        <td>{apiResponse[selectedOrderIndex].district}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Phường/Xã</td>
                        <td>{apiResponse[selectedOrderIndex].ward}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Cân nặng</td>
                        <td>{apiResponse[selectedOrderIndex].weight} kg</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Chiều cao</td>
                        <td>{apiResponse[selectedOrderIndex].height} cm</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Số lượng</td>
                        <td>{apiResponse[selectedOrderIndex].quantity}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Kích thước</td>
                        <td>{apiResponse[selectedOrderIndex].size}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Màu sắc</td>
                        <td>{apiResponse[selectedOrderIndex].color || 'Không có'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Giá đơn hàng</td>
                        <td>{formatCurrency(apiResponse[selectedOrderIndex].order_price)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Phí vận chuyển</td>
                        <td>{formatCurrency(apiResponse[selectedOrderIndex].shipping_fee)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tiền đặt cọc</td>
                        <td>{formatCurrency(apiResponse[selectedOrderIndex].money_deposit || 0)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tổng cộng</td>
                        <td className="fw-bold">{formatCurrency(parseInt(apiResponse[selectedOrderIndex].order_price) + parseInt(apiResponse[selectedOrderIndex].shipping_fee))}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tên trang</td>
                        <td>{apiResponse[selectedOrderIndex].name_page}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseDetails}>
                  Đóng
                </Button>
                <Button variant="success" onClick={handleConfirmOrder}>
                  <FaCheck className="me-2" /> Xác nhận đơn hàng
                </Button>
              </Modal.Footer>
            </Modal>
          )}

          {/* Modal chi tiết sản phẩm */}
          <Modal 
            show={showImageSearchModal} 
            onHide={() => setShowImageSearchModal(false)}
            size="lg"
            className="product-detail-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>Chi tiết sản phẩm</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {imageSearchLoading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              ) : selectedImageProduct && (
                <Row>
                  {/* Cột trái - Ảnh sản phẩm */}
                  <Col md={7}>
                    <div className="product-images mb-3">
                      {/* Ảnh chính */}
                      <div 
                        className="main-image mb-2"
                        style={{ 
                          height: '400px',
                          backgroundColor: '#f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={selectedImageProduct.image_urls[0]} 
                          alt="Ảnh chính"
                          style={{ 
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                      
                      {/* Ảnh thumbnail */}
                      <div className="d-flex flex-nowrap overflow-auto gap-2 thumbnail-container">
                        {selectedImageProduct.image_urls.map((url, index) => (
                          <div 
                            key={index}
                            style={{ 
                              width: '80px',
                              height: '80px',
                              backgroundColor: '#f8f9fa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            <img 
                              src={url} 
                              alt={`Ảnh ${index + 1}`}
                              style={{ 
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Col>

                  {/* Cột phải - Thông tin sản phẩm */}
                  <Col md={5}>
                    <div className="product-info">
                      <h4 className="mb-2">{selectedImageProduct.product_name}</h4>
                      <p className="text-muted mb-2">Mã SP: {selectedImageProduct.product_code}</p>
                      <h3 className="text-primary mb-4">
                        {selectedImageProduct.price.toLocaleString()}đ
                      </h3>

                      {/* Chọn màu sắc */}
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Màu sắc</Form.Label>
                        <InputGroup>
                          <Form.Select 
                            value={selectedColor || 'custom'}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="border-end-0"
                          >
                            <option value="custom">Màu khác</option>
                            {COLORS.map(color => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </Form.Select>
                          {(selectedColor === 'custom' || !selectedColor) && (
                            <Form.Control
                              type="text"
                              placeholder="Nhập màu khác"
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                            />
                          )}
                        </InputGroup>
                      </Form.Group>

                      {/* Chọn kích thước */}
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Kích thước</Form.Label>
                        <InputGroup>
                          <Form.Select
                            value={selectedSize || 'custom'}
                            onChange={(e) => setSelectedSize(e.target.value)}
                            className="border-end-0"
                          >
                            <option value="custom">Size khác</option>
                            {SIZES.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </Form.Select>
                          {(selectedSize === 'custom' || !selectedSize) && (
                            <Form.Control
                              type="text"
                              placeholder="Nhập size khác"
                              value={customSize}
                              onChange={(e) => setCustomSize(e.target.value)}
                            />
                          )}
                        </InputGroup>
                      </Form.Group>

                      {/* Nhập số lượng */}
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Số lượng</Form.Label>
                        <InputGroup>
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          >
                            <FaMinus />
                          </Button>
                          <Form.Control
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ textAlign: 'center', maxWidth: '80px' }}
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => setQuantity(prev => prev + 1)}
                          >
                            <FaPlus />
                          </Button>
                        </InputGroup>
                      </Form.Group>

                      {/* Thông tin thêm */}
                      {selectedImageProduct.brand && (
                        <div className="mb-3">
                          <span className="fw-bold">Thương hiệu:</span> {selectedImageProduct.brand}
                        </div>
                      )}
                      
                      {selectedImageProduct.description && (
                        <div className="mb-3">
                          <span className="fw-bold">Mô tả:</span>
                          <p className="small mt-1">{selectedImageProduct.description}</p>
                        </div>
                      )}

                      <div className="text-muted small mb-4">
                        Ngày tạo: {selectedImageProduct.created_at}
                      </div>

                      {/* Nút xác nhận */}
                      <Button 
                        variant="primary"
                        size="lg"
                        className="w-100"
                        onClick={handleConfirmProductSelection}
                        disabled={(!selectedColor && !customColor)}
                      >
                        <FaCheck className="me-2" /> Xác nhận chọn sản phẩm
                      </Button>
                    </div>
                  </Col>
                </Row>
              )}
            </Modal.Body>
          </Modal>

          <Row>
            {/* Cột trái - 70% */}
            <Col lg={8}>
              {/* 1.1 Khối thông tin khách hàng */}
              <Card className="mb-3 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaUser className="me-2" /> Khách hàng
                  </div>
                  <div>
                    <Form.Select 
                      className="d-inline-block me-2 source-select"
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      disabled={isLoadingSources}
                    >
                      <option value="">- Nguồn đơn hàng -</option>
                      {isLoadingSources ? (
                        <option disabled>Đang tải...</option>
                      ) : (
                        orderSources.map(source => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))
                      )}
                    </Form.Select>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaPhone />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Điện thoại"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Tên khách"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaHome />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Địa chỉ"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaStickyNote />
                        </InputGroup.Text>
                        <Form.Control 
                          as="textarea" 
                          rows={4}
                          placeholder="Ghi chú khách hàng (Để in)" 
                          style={{ minHeight: '100px' }}
                          value={customerNote}
                          onChange={(e) => setCustomerNote(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    
                    <Col md={6}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select 
                          value={selectedCity}
                          onChange={handleCityChange}
                          disabled={isLoadingLocations}
                        >
                          <option value="">- Chọn thành phố -</option>
                          {isLoadingLocations ? (
                            <option value="" disabled>Đang tải...</option>
                          ) : (
                            cities && cities.map(city => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))
                          )}
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select
                          value={selectedDistrict}
                          onChange={handleDistrictChange}
                          disabled={!selectedCity || isLoadingLocations}
                        >
                          <option value="">- Quận huyện -</option>
                          {districts.map(district => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select
                          value={selectedWard}
                          onChange={(e) => setSelectedWard(e.target.value)}
                          disabled={!selectedDistrict || isLoadingLocations}
                        >
                          <option value="">- Phường xã -</option>
                          {wards.map(ward => (
                            <option key={ward.id} value={ward.id}>
                              {ward.name}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaStickyNote />
                        </InputGroup.Text>
                        <Form.Control 
                          as="textarea" 
                          rows={4}
                          placeholder="Ghi chú chăm sóc khách hàng (Nội bộ)" 
                          style={{ minHeight: '100px' }}
                        />
                      </InputGroup>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer className="text-center">
                  <Button variant="light" size="sm">
                    <FaChevronDown />
                  </Button>
                </Card.Footer>
              </Card>

              {/* 1.2 Khối sản phẩm */}
              <Card className="mb-3 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaBox className="me-2" /> Sản phẩm
                  </div>
                </Card.Header>
                <Card.Body>
                  <div ref={searchRef} className="position-relative" style={{ zIndex: 1050 }}>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="(F3) Tìm kiếm sản phẩm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearch}
                      />
                    </InputGroup>

                    {showSearchResults && (
                      <div className="position-fixed" 
                           style={{ 
                             zIndex: 1100,
                             left: searchRef.current?.getBoundingClientRect().left,
                             top: searchRef.current?.getBoundingClientRect().bottom,
                             width: searchRef.current?.offsetWidth,
                           }}>
                        <div className="shadow bg-white rounded border" 
                             style={{ 
                               maxHeight: '300px',
                               overflowY: 'auto',
                               overflowX: 'auto',
                               width: '100%'
                             }}>
                          {isSearching ? (
                            <div className="p-3 text-center">
                              Đang tìm kiếm...
                            </div>
                          ) : searchResults && searchResults.length > 0 ? (
                            <ListGroup variant="flush" style={{ maxHeight: '100%', minWidth: 'min-content' }}>
                              {searchResults.map((product) => (
                                <ListGroup.Item 
                                  key={product.idNhanh}
                                  action
                                  className="d-flex justify-content-between align-items-center py-2"
                                  onClick={() => handleProductSelect(product)}
                                  style={{ minWidth: 'max-content' }}
                                >
                                  <div className="d-flex flex-column" style={{ minWidth: '200px' }}>
                                    <div className="fw-medium text-nowrap">{product.name}</div>
                                    <div className="small text-muted text-nowrap">
                                      {product.code && <span className="me-2">Mã: {product.code}</span>}
                                      <span>Tồn: {product.inventory.available}</span>
                                    </div>
                                  </div>
                                  <div className="text-end ms-3" style={{ minWidth: '120px' }}>
                                    <div className="text-primary fw-medium text-nowrap">
                                      {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                      }).format(product.price)}
                                    </div>
                                    {product.wholesalePrice && product.wholesalePrice !== product.price && (
                                      <small className="text-success text-nowrap">
                                        Sỉ: {new Intl.NumberFormat('vi-VN', {
                                          style: 'currency',
                                          currency: 'VND'
                                        }).format(product.wholesalePrice)}
                                      </small>
                                    )}
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          ) : (
                            <div className="p-3 text-center text-muted">
                              Không tìm thấy sản phẩm
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="table-responsive">
                    <Table bordered hover className="product-table" style={{ minWidth: 'auto' }}>
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th style={{width: '60px'}}>SL</th>
                          <th style={{width: '120px'}}>Giá</th>
                          <th style={{width: '120px'}}>Tổng</th>
                          <th style={{width: '50px'}}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProducts.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-3">
                              Chưa có sản phẩm nào
                            </td>
                          </tr>
                        ) : (
                          selectedProducts.map(product => (
                            <tr key={product.id}>
                              <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.name}
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={product.quantity}
                                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                  style={{width: '50px', padding: '2px 5px'}}
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={product.price}
                                  onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      handlePriceChange(product.id, (product.price || 0) + 1000);
                                    } else if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      handlePriceChange(product.id, Math.max(0, (product.price || 0) - 1000));
                                    }
                                  }}
                                  style={{width: '100px', padding: '2px 5px'}}
                                  className="text-end"
                                />
                              </td>
                              <td className="text-end" style={{ padding: '0.5rem' }}>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(product.total)}
                              </td>
                              <td className="text-center">
                                <Button 
                                  variant="link" 
                                  className="text-danger p-0"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  title="Xóa sản phẩm"
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="fw-bold">Tổng</td>
                          <td>{selectedProducts.reduce((sum, product) => sum + product.quantity, 0)}</td>
                          <td></td>
                          <td className="text-end fw-bold">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(selectedProducts.reduce((sum, product) => sum + product.total, 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              {/* 1.3 Khối vận chuyển */}
              <Card className="mb-3 shadow-sm">
                <Card.Header>
                  <FaTruck className="me-2" /> Vận chuyển
                </Card.Header>
                <Card.Body>
                  <Row className="align-items-center mb-3">
                    <Col xs="auto">
                      <Form.Check 
                        type="checkbox" 
                        id="self-shipping"
                        label="Tự vận chuyển" 
                        checked={selfShipping}
                        onChange={(e) => setSelfShipping(e.target.checked)}
                      />
                    </Col>
                    <Col md={5}>
                      <Form.Select>
                        <option>Cho xem, không thử hàng</option>
                        <option>Cho xem, cho thử</option>
                        <option>Không cho xem hàng</option>
                      </Form.Select>
                    </Col>
                  
                  </Row>
                  
                  <Row className="mb-3 align-items-center">
                    <Col xs="auto">
                      <Form.Label>Phí ship bảo khách</Form.Label>
                    </Col>
                    <Col md={5}>
                      <Form.Control 
                        type="number"
                        placeholder="Phí ship báo khách" 
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                      />
                    </Col>
                  </Row>
                  
                </Card.Body>
              </Card>
            </Col>
            
            {/* Cột phải - 30% */}
            <Col lg={4}>
              {/* 2.2 Khối thanh toán */}
              <Card className="mb-3 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaExchangeAlt className="me-2" /> Chuyển khoản
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaExchangeAlt />
                    </Col>
                    <Col>
                      <Form.Control 
                        type="text" 
                        placeholder="Tiền chuyển khoản"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                      />
                    </Col>
                    <Col xs={1}>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Thông tin về chuyển khoản</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* 2.3 Khối tùy chọn giao hàng */}
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FaUser />
                    </InputGroup.Text>
                    <Form.Select 
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      disabled={isLoadingStaff}
                    >
                      <option value="">Chọn nhân viên tạo đơn hàng</option>
                      {isLoadingStaff ? (
                        <option disabled>Đang tải...</option>
                      ) : (
                        staffList.map(staff => (
                          <option 
                            key={staff.id} 
                            value={staff.id}
                          >
                            {staff.id} {staff.fullName || staff.username} {staff.roleName ? `(${staff.roleName})` : ''}
                          </option>
                        ))
                      )}
                    </Form.Select>
                  </InputGroup>
                  
                  <Row className="mb-3">
                    <Col>
                      <div className="text-success">
                        Thu khách: <strong>{formatCurrency(calculateCollectAmount())}</strong>
                      </div>
                    </Col>
                    {/* <Col>
                      <div className="text-primary">
                        Trả shop: <strong>{formatCurrency(totalProductsAmount)}</strong>
                      </div>
                    </Col> */}
                  </Row>
                </Card.Body>
              </Card>

              {/* 2.4 Khối nút tác vụ */}
              <div className="d-grid gap-2 mb-3">
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={handleSaveOrder}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FaBox className="me-2" /> (F9) Lưu
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default Orders; 