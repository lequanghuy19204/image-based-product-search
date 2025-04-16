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
  const [selfShipping, setSelfShipping] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [discount, setDiscount] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [isShippingGHTK, setIsShippingGHTK] = useState(false); 
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false); 

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
      // Lấy danh sách nguồn đơn hàng nếu chưa có
      let sources = orderSources;
      if (!sources || sources.length === 0) {
        sources = await getOrderSources();
        setOrderSources(sources);
      }
      
      // Chuyển đổi danh sách nguồn thành mảng tên
      const sourceNames = sources.map(source => source.name);
      
      // Gọi API với danh sách tên nguồn đơn hàng
      const response = await createOrderFromConversation(conversationLink, sourceNames);
      
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

  // Thay thế hàm compareAddress cũ bằng các hàm mới
  const calculateSimilarityScore = (str1, str2) => {
    if (!str1 || !str2) return 0;

    // Chuẩn hóa chuỗi giữ nguyên tiền tố
    const normalizeWithPrefix = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Chuẩn hóa chuỗi loại bỏ tiền tố
    const normalizeNoPrefix = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, ' ')
        .replace(/tp\.|tp|thanh pho/g, '')
        .replace(/q\.|quan/g, '')
        .replace(/p\.|phuong/g, '')
        .replace(/h\.|huyen/g, '')
        .replace(/t\.|thi|thi xa/g, '')
        .replace(/xa/g, '')
        .trim();
    };

    const s1WithPrefix = normalizeWithPrefix(str1);
    const s2WithPrefix = normalizeWithPrefix(str2);
    const s1NoPrefix = normalizeNoPrefix(str1);
    const s2NoPrefix = normalizeNoPrefix(str2);

    // Kiểm tra khớp chính xác
    if (s1WithPrefix === s2WithPrefix) return 1.0;
    if (s1NoPrefix === s2NoPrefix) return 0.95;

    // Tính Levenshtein Distance
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
              dp[i - 1][j],
              dp[i][j - 1],
              dp[i - 1][j - 1]
            );
          }
        }
      }
      return dp[m][n];
    };

    // Tính điểm từ Levenshtein Distance
    const maxLength = Math.max(s1NoPrefix.length, s2NoPrefix.length);
    const levenScore = maxLength > 0 ? 
      1 - (levenshteinDistance(s1NoPrefix, s2NoPrefix) / maxLength) : 0;

    // So sánh từng từ
    const words1 = s1NoPrefix.split(' ');
    const words2 = s2NoPrefix.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    const wordScore = Math.min(words1.length, words2.length) > 0 ?
      commonWords.length / Math.min(words1.length, words2.length) : 0;

    // Điểm đặc biệt cho trường hợp có chứa đầy đủ
    let containmentScore = 0;
    if (s1NoPrefix.includes(s2NoPrefix)) {
      containmentScore = s2NoPrefix.length / s1NoPrefix.length;
    } else if (s2NoPrefix.includes(s1NoPrefix)) {
      containmentScore = s1NoPrefix.length / s2NoPrefix.length;
    }

    // Tính điểm tổng hợp với trọng số
    const finalScore = (levenScore * 0.3) + (wordScore * 0.4) + (containmentScore * 0.3);
    
    return finalScore;
  };

  // Hàm tìm kiếm địa chỉ phù hợp nhất
  const findBestMatch = (items, searchTerm) => {
    if (!items || !items.length || !searchTerm) return null;

    let bestMatch = null;
    let bestScore = 0;

    items.forEach(item => {
      const score = calculateSimilarityScore(item.name, searchTerm);
      // console.log(`So sánh "${item.name}" với "${searchTerm}" - Điểm: ${score.toFixed(2)}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    // Chỉ trả về kết quả nếu đạt ngưỡng tối thiểu
    return bestScore > 0.6 ? { match: bestMatch, score: bestScore } : null;
  };

  // Giữ lại hàm compareAddress cũ để đảm bảo tương thích ngược (nếu có code khác đang sử dụng)
  const compareAddress = (str1, str2) => {
    const result = calculateSimilarityScore(str1, str2);
    return result > 0.7; // Giữ ngưỡng 0.7 để tương thích với code cũ
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
        
        // Thêm điền giảm giá nếu có
        if (orderData.money_discount) {
          setDiscount(orderData.money_discount.toString());
        }

        // Tạo ghi chú khách hàng với format: Giới tính - Chiều cao - Cân nặng
        // Chỉ thêm thông tin nếu không phải null
        let physicalInfo = '';

        // Thêm giới tính nếu có
        if (orderData.gender) {
          const gender = orderData.gender === 'male' ? 'Nam' : 'Nữ';
          physicalInfo += gender;
        }

        // Thêm chiều cao nếu có
        if (orderData.height) {
          // Nếu đã có giới tính, thêm dấu gạch nối
          if (physicalInfo) physicalInfo += ' - ';
          physicalInfo += `${orderData.height}cm`;
        }

        // Thêm cân nặng nếu có
        if (orderData.weight) {
          // Nếu đã có thông tin trước đó, thêm dấu hai chấm
          if (physicalInfo) {
            // Kiểm tra xem có chiều cao hay không để quyết định dùng dấu hai chấm hay gạch nối
            physicalInfo += orderData.height ? ':' : ' - ';
          }
          physicalInfo += `${orderData.weight}kg`;
        }

        // Thêm dấu chấm phẩy ở cuối nếu có thông tin
        if (physicalInfo) physicalInfo += '; ';

        // Thêm vào ghi chú hiện tại thay vì ghi đè
        if (physicalInfo) {
          setCustomerNote(prevNote => {
            if (prevNote) {
              return `${prevNote}\n${physicalInfo}`;
            }
            return physicalInfo;
          });
        }
        
        // Lưu thông tin địa chỉ cần tìm
        setTargetProvince(orderData.province || '');
        setTargetDistrict(orderData.district || '');
        setTargetWard(orderData.ward || '');

        // Tìm nguồn đơn hàng phù hợp dựa trên tên trang
        if (orderData.name_page && orderSources.length > 0) {
          const pageName = orderData.name_page.toLowerCase().trim();
          
          // Ưu tiên tìm theo source_order nếu có
          if (orderData.source_order && orderSources.length > 0) {
            const sourceName = orderData.source_order.toLowerCase().trim();
            const matchedSource = orderSources.find(source => {
              const sourceNameLower = source.name.toLowerCase().trim();
              return sourceNameLower.includes(sourceName) || sourceName.includes(sourceNameLower);
            });
            
            if (matchedSource) {
              setSelectedSource(matchedSource.id);
            } else {
              // Nếu không tìm thấy theo source_order, tìm theo name_page
              const fallbackSource = orderSources.find(source => {
                const sourceNameLower = source.name.toLowerCase().trim();
                return sourceNameLower.includes(pageName) || pageName.includes(sourceNameLower);
              });
              
              if (fallbackSource) {
                setSelectedSource(fallbackSource.id);
              }
            }
          } else {
            // Nếu không có source_order, tìm theo name_page
            const matchedSource = orderSources.find(source => {
              const sourceName = source.name.toLowerCase().trim();
              return sourceName.includes(pageName) || pageName.includes(sourceName);
            });

            if (matchedSource) {
              setSelectedSource(matchedSource.id);
            }
          }
        }

        // Tự động chọn Tỉnh/Thành phố bằng thuật toán mới
        if (orderData.province && cities.length > 0) {
          const bestCityMatch = findBestMatch(cities, orderData.province);
          
          if (bestCityMatch) {
            const matchedCity = bestCityMatch.match;
            console.log(`Đã tìm thấy thành phố phù hợp: ${matchedCity.name} (Độ chính xác: ${bestCityMatch.score.toFixed(2)})`);
            
            setSelectedCity(matchedCity.id);
            // Tải quận/huyện của thành phố này
            const districtsData = await getLocations('DISTRICT', parseInt(matchedCity.id));
            setDistricts(districtsData);

            // Tự động chọn Quận/Huyện bằng thuật toán mới
            if (orderData.district && districtsData.length > 0) {
              const bestDistrictMatch = findBestMatch(districtsData, orderData.district);
              
              if (bestDistrictMatch) {
                const matchedDistrict = bestDistrictMatch.match;
                console.log(`Đã tìm thấy quận/huyện phù hợp: ${matchedDistrict.name} (Độ chính xác: ${bestDistrictMatch.score.toFixed(2)})`);
                
                setSelectedDistrict(matchedDistrict.id);
                // Tải phường/xã của quận/huyện này
                const wardsData = await getLocations('WARD', parseInt(matchedDistrict.id));
                setWards(wardsData);

                // Tự động chọn Phường/Xã bằng thuật toán mới
                if (orderData.ward && wardsData.length > 0) {
                  const bestWardMatch = findBestMatch(wardsData, orderData.ward);
                  
                  if (bestWardMatch) {
                    const matchedWard = bestWardMatch.match;
                    console.log(`Đã tìm thấy phường/xã phù hợp: ${matchedWard.name} (Độ chính xác: ${bestWardMatch.score.toFixed(2)})`);
                    
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
          // Tìm sản phẩm khớp với tên chính xác (không phân biệt hoa thường)
          const searchTermNormalized = searchTerm.toLowerCase().trim();
          const matchedProduct = Object.values(response.products).find(product => {
            const productNameNormalized = product.name.toLowerCase().trim();
            return productNameNormalized === searchTermNormalized;
          });
          
          if (matchedProduct) {
            // Tạo object sản phẩm mới
            const newProduct = {
              id: matchedProduct.idNhanh,
              name: matchedProduct.name,
              quantity: quantity,
              price: parseFloat(matchedProduct.price),
              total: parseFloat(matchedProduct.price) * quantity,
              color: color,
              size: size,
              inventory: matchedProduct.inventory,
              code: matchedProduct.code,
              createdDateTime: matchedProduct.createdDateTime
            };
            
            // Kiểm tra xem sản phẩm đã tồn tại trong danh sách chưa
            setSelectedProducts(prevProducts => {
              const existingProductIndex = prevProducts.findIndex(p => 
                p.id === matchedProduct.idNhanh && 
                p.color === color && 
                p.size === size
              );

              if (existingProductIndex !== -1) {
                // Nếu sản phẩm đã tồn tại, cập nhật số lượng và tổng tiền
                const updatedProducts = [...prevProducts];
                const existingProduct = updatedProducts[existingProductIndex];
                existingProduct.quantity += quantity;
                existingProduct.total = existingProduct.quantity * existingProduct.price;
                return updatedProducts;
              } else {
                // Nếu sản phẩm chưa tồn tại, thêm mới vào danh sách
                return [...prevProducts, newProduct];
              }
            });

            // Cập nhật ghi chú
            const productNote = `${selectedImageProduct.product_code || 'N/A'} - ${matchedProduct.name} - SL:${quantity};`;
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
    const discountNum = Number(discount) || 0;
    const collectAmount = totalProductsAmount + shippingFeeNum - transferAmountNum - discountNum;
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
        trafficSource: sourceName,
        moneyTransfer: Number(transferAmount) || 0,
        moneyDiscount: Number(discount) || 0,
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
      console.log('Order response:', response);

      if (response && response.orderId) {
        setSuccess('Tạo đơn hàng thành công!');
        setTimeout(() => setSuccess(''), 3000);

        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        const errorMessage = response?.message || response?.error || 'Có lỗi xảy ra khi tạo đơn hàng';
        setApiError(errorMessage);
        setTimeout(() => setApiError(''), 3000);
      }
    } catch (error) {
      console.error('Error details:', error);
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
                          {order.source_order && (
                            <div>
                              <FaTicketAlt className="me-1" /> {order.source_order}
                            </div>
                          )}
                          {/* Thêm hiển thị tags */}
                          {order.tags_text && order.tags_text.length > 0 && (
                            <div className="mt-1">
                              {order.tags_text.map((tag, tagIndex) => (
                                <span key={tagIndex} className="badge bg-info me-1">{tag}</span>
                              ))}
                            </div>
                          )}
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
                          <div>
                            Giảm giá: {formatCurrency(order.money_discount)}
                          </div>
                          <div className="fw-bold">
                            Tổng: {formatCurrency(parseInt(order.order_price) + parseInt(order.shipping_fee || 0) - parseInt(order.money_discount || 0))}
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
                  <Row className="g-2">
                    {imageSearchResults.map((item, index) => (
                      <Col key={index}>
                        <Card className="h-100 product-card">
                          <div 
                            className="card-img-container cursor-pointer"
                            onClick={() => handleProductImageHover(item.product_id)}
                          >
                            <Card.Img
                              variant="top"
                              src={item.image_url}
                              alt={item.product_name}
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
                        <td className="fw-bold">Tags</td>
                        <td>
                          {apiResponse[selectedOrderIndex].tags_text && apiResponse[selectedOrderIndex].tags_text.length > 0 ? (
                            apiResponse[selectedOrderIndex].tags_text.map((tag, tagIndex) => (
                              <span key={tagIndex} className="badge bg-info me-1">{tag}</span>
                            ))
                          ) : (
                            'Không có'
                          )}
                        </td>
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
                        <td className="fw-bold">Giảm giá</td>
                        <td>{formatCurrency(apiResponse[selectedOrderIndex].money_discount)}</td>
                      </tr>
                      
                      <tr>
                        <td className="fw-bold">Tổng cộng</td>
                        <td className="fw-bold">
                          {formatCurrency(
                            parseInt(apiResponse[selectedOrderIndex].order_price) + 
                            parseInt(apiResponse[selectedOrderIndex].shipping_fee || 0) - 
                            parseInt(apiResponse[selectedOrderIndex].money_discount || 0)
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tên trang</td>
                        <td>{apiResponse[selectedOrderIndex].name_page}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Nguồn đơn hàng</td>
                        <td>{apiResponse[selectedOrderIndex].source_order || 'Không có'}</td>
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
                      className="d-inline-block me-2 source-select form-select-sm"
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
                  <div className="customer-tables-container">
                    <Row>
                      {/* Cột 1 - Thông tin khách hàng */}
                      <Col lg={6}>
                        <Row className="mb-3 align-items-center">
                          <Col xs={2} className="text-center">
                            <FaPhone className="text-primary" />
                          </Col>
                          <Col>
                            <Form.Control 
                              type="text"
                              placeholder="Số điện thoại" 
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="form-control-sm"
                            />
                          </Col>
                        </Row>

                        <Row className="mb-3 align-items-center">
                          <Col xs={2} className="text-center">
                            <FaUser className="text-success" />
                          </Col>
                          <Col>
                            <Form.Control 
                              type="text"
                              placeholder="Tên khách hàng"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="form-control-sm"
                            />
                          </Col>
                        </Row>

                        <Row className="mb-3 align-items-center">
                          <Col xs={2} className="text-center">
                            <FaHome className="text-info" />
                          </Col>
                          <Col>
                            <Form.Control 
                              type="text"
                              placeholder="Địa chỉ"
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              className="form-control-sm"
                            />
                          </Col>
                        </Row>

                        <Row className="mb-3 align-items-start">
                          <Col xs={2} className="text-center">
                            <FaStickyNote className="text-success" />
                          </Col>
                          <Col>
                            <Form.Control 
                              as="textarea" 
                              rows={4}
                              style={{height: '100px'}}
                              placeholder="Ghi chú khách hàng (Để in)" 
                              value={customerNote}
                              onChange={(e) => setCustomerNote(e.target.value)}
                              className="form-control-sm"
                            />
                          </Col>
                        </Row>
                      </Col>

                      {/* Cột 2 - Thông tin địa chỉ */}
                      <Col lg={6}>
                        <Row className="mb-3 align-items-center">
                          <Col xs={2} className="text-center">
                            <FaMapMarkerAlt className="text-danger" />
                          </Col>
                          <Col>
                            <Form.Select 
                              value={selectedCity}
                              onChange={handleCityChange}
                              disabled={isLoadingLocations}
                              className="form-control-sm"
                            >
                              <option value="">- Chọn thành phố -</option>
                              {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                              ))}
                            </Form.Select>
                          </Col>
                        </Row>

                        <Row className="mb-3 align-items-center">
                          <Col xs={2} className="text-center">
                            <FaMapMarkerAlt className="text-warning" />
                          </Col>
                          <Col>
                            <Form.Select
                              value={selectedDistrict}
                              onChange={handleDistrictChange}
                              disabled={!selectedCity || isLoadingLocations}
                              className="form-control-sm"
                            >
                              <option value="">- Quận huyện -</option>
                              {districts.map(district => (
                                <option key={district.id} value={district.id}>{district.name}</option>
                              ))}
                            </Form.Select>
                          </Col>
                        </Row>

                        <Row className="mb-3 align-items-center">
                          <Col xs={2} className="text-center">
                            <FaMapMarkerAlt className="text-info" />
                          </Col>
                          <Col>
                            <Form.Select
                              value={selectedWard}
                              onChange={(e) => setSelectedWard(e.target.value)}
                              disabled={!selectedDistrict || isLoadingLocations}
                              className="form-control-sm"
                            >
                              <option value="">- Phường xã -</option>
                              {wards.map(ward => (
                                <option key={ward.id} value={ward.id}>{ward.name}</option>
                              ))}
                            </Form.Select>
                          </Col>
                        </Row>

                        <Row className="mb-3 align-items-start">
                          <Col xs={2} className="text-center">
                            <FaStickyNote className="text-secondary" />
                          </Col>
                          <Col>
                            <Form.Control 
                              as="textarea" 
                              rows={4}
                              style={{height: '100px'}}
                              placeholder="Ghi chú nội bộ" 
                              className="form-control-sm"
                            />
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
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
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaTruck className="me-2" /> Vận chuyển
                  </div>
                </Card.Header>
                <Card.Body>
                  {/* Phương thức vận chuyển */}
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaTruck className="text-primary" />
                    </Col>
                    <Col>
                      <div className="d-flex">
                        <Form.Check 
                          type="radio" 
                          id="ghtk-shipping"
                          name="shipping-type"
                          className="me-3"
                          label={
                            <div className="d-flex align-items-center">
                              <img 
                                src="https://carrier.nvncdn.com/carrier/carr_1692349563_929.png"
                                alt="GHTK"
                                style={{ height: '20px', marginRight: '8px' }}
                              />
                              <span>Giao hàng tiết kiệm</span>
                            </div>
                          }
                          checked={isShippingGHTK}
                          onChange={(e) => {
                            setSelfShipping(false);
                            setIsShippingGHTK(true);
                          }}
                        />
                        <Form.Check 
                          type="radio" 
                          id="self-shipping"
                          name="shipping-type"
                          label={
                            <div className="d-flex align-items-center">
                              <FaTruck className="me-2 text-primary" />
                              <span>Tự vận chuyển</span>
                            </div>
                          }
                          checked={selfShipping}
                          onChange={(e) => {
                            setSelfShipping(true);
                            setIsShippingGHTK(false);
                          }}
                        />
                      </div>
                    </Col>
                    <Col xs={1}>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Chọn phương thức vận chuyển</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                  </Row>

                  {/* Phí ship báo khách */}
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaMoneyBillWave className="text-success" />
                    </Col>
                    <Col>
                      <InputGroup>
                        <Form.Control 
                          type="number"
                          placeholder="Phí ship báo khách" 
                          value={shippingFee}
                          onChange={(e) => setShippingFee(e.target.value)}
                        />
                        <InputGroup.Text>VNĐ</InputGroup.Text>
                      </InputGroup>
                    </Col>
                    <Col xs={1}>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Phí ship sẽ báo cho khách hàng</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="text-muted" />
                        </span>
                      </OverlayTrigger>
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
                  {/* Thêm ô nhập chiết khấu */}
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaPercent />
                    </Col>
                    <Col>
                      <Form.Control 
                        type="text" 
                        placeholder="Chiết khấu"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </Col>
                    <Col xs={1}>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Số tiền chiết khấu</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  
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
                {success && <Alert variant="success">{success}</Alert>}
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