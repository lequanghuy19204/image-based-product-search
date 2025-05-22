from playwright.sync_api import sync_playwright
import time
import os
import json
import re
import urllib.request
import shutil
import threading
import concurrent.futures

def get_config_file():
    return "user_config.json"

def load_user_config():
    config_file = get_config_file()
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"start_page": 1, "end_page": 9999, "max_products": 5000}
    return {"start_page": 1, "end_page": 9999, "max_products": 5000}

def save_user_config(config):
    config_file = get_config_file()
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print(f"Đã lưu cấu hình người dùng vào file {config_file}")

def get_user_input():
    print("\n===== CẤU HÌNH CHẠY SCRIPT =====")
    # Tải cấu hình cũ nếu có
    last_config = load_user_config()
    
    try:
        # Hiển thị giá trị mặc định là giá trị từ lần chạy trước
        last_browser_count = last_config.get("browser_count", 1)
        last_max = last_config.get("max_products", 5000)
        
        print(f"Cấu hình lần trước: Số browser = {last_browser_count}, Số sản phẩm tối đa = {last_max}")
        
        browser_count = int(input(f"Nhập số lượng browser muốn chạy (mặc định: {last_browser_count}): ") or str(last_browser_count))
        browser_count = max(1, browser_count)
        
        # Tạo danh sách cấu hình cho từng browser
        browser_configs = []
        total_max_products = 0
        
        for i in range(browser_count):
            print(f"\n----- Cấu hình cho Browser {i+1} -----")
            
            # Gợi ý trang bắt đầu và kết thúc dựa trên số browser
            suggested_start = i * (9999 // browser_count) + 1
            suggested_end = (i + 1) * (9999 // browser_count)
            if i == browser_count - 1:  # Browser cuối cùng lấy đến hết
                suggested_end = 9999
            
            # Lấy cấu hình từ lần chạy trước nếu có
            last_browser_config = last_config.get(f"browser_{i+1}", {})
            last_start = last_browser_config.get("start_page", suggested_start)
            last_end = last_browser_config.get("end_page", suggested_end)
            
            print(f"Đề xuất: Trang bắt đầu = {suggested_start}, Trang kết thúc = {suggested_end}")
            if last_browser_config:
                print(f"Lần trước: Trang bắt đầu = {last_start}, Trang kết thúc = {last_end}")
            
            start_page = int(input(f"Nhập trang bắt đầu cho Browser {i+1} (mặc định: {last_start}): ") or str(last_start))
            end_page = int(input(f"Nhập trang kết thúc cho Browser {i+1} (mặc định: {last_end}): ") or str(last_end))
            browser_max_products = int(input(f"Nhập số lượng sản phẩm tối đa cho Browser {i+1} (mặc định: {last_max // browser_count}): ") or str(last_max // browser_count))
            
            # Thêm tùy chọn chọn hàng bắt đầu
            start_row = 1
            last_start_row = last_browser_config.get("start_row", 1)
            start_row = int(input(f"Nhập hàng bắt đầu xử lý trên trang {start_page} (mặc định: {last_start_row}): ") or str(last_start_row))
            
            # Thêm tùy chọn chọn hàng kết thúc trên trang cuối
            end_row = 0  # 0 nghĩa là xử lý tất cả các hàng
            last_end_row = last_browser_config.get("end_row", 0)
            end_row = int(input(f"Nhập hàng kết thúc xử lý trên trang {end_page} (0 = tất cả, mặc định: {last_end_row}): ") or str(last_end_row))
            
            browser_config = {
                "start_page": max(1, start_page),
                "end_page": max(start_page, end_page),
                "max_products": browser_max_products,
                "start_row": max(1, start_row),  # Thêm thông tin hàng bắt đầu
                "end_row": max(0, end_row)       # Thêm thông tin hàng kết thúc
            }
            
            browser_configs.append(browser_config)
            total_max_products += browser_max_products
        
        # Tạo cấu hình tổng hợp
        config = {
            "browser_count": browser_count,
            "max_products": total_max_products,
            "last_run": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Thêm cấu hình của từng browser
        for i, browser_config in enumerate(browser_configs):
            config[f"browser_{i+1}"] = browser_config
        
        # Lưu cấu hình vào file
        save_user_config(config)
        
        return config
    except ValueError:
        print("Lỗi: Vui lòng nhập số nguyên. Sử dụng giá trị mặc định.")
        config = {
            "browser_count": last_config.get("browser_count", 1),
            "max_products": last_config.get("max_products", 5000),
            "last_run": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Dùng cấu hình browser từ lần trước nếu có
        for i in range(config["browser_count"]):
            if f"browser_{i+1}" in last_config:
                config[f"browser_{i+1}"] = last_config[f"browser_{i+1}"]
            else:
                # Tạo cấu hình mặc định cho browser
                config[f"browser_{i+1}"] = {
                    "start_page": i * (9999 // config["browser_count"]) + 1,
                    "end_page": (i + 1) * (9999 // config["browser_count"]) if i < config["browser_count"] - 1 else 9999,
                    "max_products": config["max_products"] // config["browser_count"]
                }
        
        # Lưu cấu hình vào file
        save_user_config(config)
        
        return config

def get_progress_file():
    return "progress.json"

def load_progress():
    progress_file = get_progress_file()
    if os.path.exists(progress_file):
        try:
            with open(progress_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"last_product_code": None, "processed_count": 0}
    return {"last_product_code": None, "processed_count": 0}

def save_progress(last_product_code, processed_count):
    progress_file = get_progress_file()
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump({
            "last_product_code": last_product_code,
            "processed_count": processed_count
        }, f, ensure_ascii=False, indent=2)
    print(f"Đã lưu tiến trình: Sản phẩm cuối cùng = {last_product_code}, Số lượng đã xử lý = {processed_count}")

def get_brave_path():
    """Tìm đường dẫn của trình duyệt Brave"""
    # Đường dẫn đến Brave trên hệ thống Linux
    paths = [
        "/usr/bin/brave-browser",
        "/usr/bin/brave",
        "/snap/bin/brave",
        "/opt/brave.com/brave/brave-browser"
    ]
    
    for path in paths:
        if os.path.exists(path):
            return path
    
    return None

def login_to_multiple_sites(browser_id=1, browser_config=None):
    if browser_config is None:
        # Nếu không có cấu hình browser cụ thể, lấy từ cấu hình chung
        user_config = load_user_config()
        browser_config = user_config.get(f"browser_{browser_id}", {
            "start_page": 1,
            "end_page": 9999,
            "max_products": 5000
        })
    
    start_page = browser_config["start_page"]
    end_page = browser_config["end_page"]
    max_products = browser_config["max_products"]
    
    print(f"\n===== BROWSER {browser_id} =====")
    print(f"Cấu hình: Trang bắt đầu = {start_page}, Trang kết thúc = {end_page}, Số sản phẩm tối đa = {max_products}")
    
    # Tạo tên thư mục tạm duy nhất cho mỗi browser
    temp_dir = f"temp_images_browser_{browser_id}"
    progress_file = f"progress_browser_{browser_id}.json"
    products_data_file = f"products_data_browser_{browser_id}.json"
    
    # Khởi tạo Playwright
    playwright = sync_playwright().start()
    
    # Tìm đường dẫn Brave
    brave_path = get_brave_path()
    
    # Tạo browser dựa trên đường dẫn Brave
    if brave_path:
        print(f"Sử dụng trình duyệt Brave tại {brave_path}...")
        browser = playwright.chromium.launch(executable_path=brave_path, headless=False)
    else:
        print("Không tìm thấy trình duyệt Brave, sử dụng Chromium mặc định...")
        browser = playwright.chromium.launch(headless=False)
    
    # Tạo context để quản lý nhiều trang
    context = browser.new_context()
    
    # ----- ĐĂNG NHẬP VÀO TRANG IPA SEARCH IMAGE -----
    ipa_page = context.new_page()
    
    try:
        # Truy cập trang đăng nhập IPA
        print("\n===== ĐĂNG NHẬP VÀO IPA SEARCH IMAGE =====")
        print("Đang truy cập trang đăng nhập...")
        ipa_page.goto("https://frontend.ipasearchimage.id.vn/")
        
        # Nhập thông tin đăng nhập
        print("Đang nhập thông tin đăng nhập IPA...")
        ipa_page.fill('input[name="email"]', "lequanghuy456654@gmail.com")
        ipa_page.fill('input[name="password"]', "111111")
        
        # Tùy chọn ghi nhớ đăng nhập
        remember_checkbox = ipa_page.locator('input[type="checkbox"]')
        if not remember_checkbox.is_checked():
            remember_checkbox.check()
        
        # Nhấn nút đăng nhập
        print("Đang đăng nhập vào IPA...")
        ipa_page.click('button[type="submit"]')
        
        # Đợi chuyển hướng đến trang search (sau khi đăng nhập thành công)
        ipa_page.wait_for_url("**/search", timeout=30000)
        print("Đăng nhập thành công vào IPA Search Image")
        
        # Lấy token từ localStorage
        ipa_token = ipa_page.evaluate("localStorage.getItem('token')")
        print(f"Đã lấy token IPA: {ipa_token[:20]}..." if ipa_token else "Không lấy được token IPA")
        
        # Chuyển đến trang quản lý sản phẩm
        products_button_selector = '.nav-item[title="Quản lý Sản phẩm"] button'
        ipa_page.wait_for_selector(products_button_selector, state="visible", timeout=10000)
        ipa_page.locator(products_button_selector).scroll_into_view_if_needed()
        time.sleep(0.5)
        ipa_page.click(products_button_selector)
        print("Đã nhấp vào nút Quản lý Sản phẩm")
        
        # Đợi chuyển trang
        ipa_page.wait_for_url("**/admin/products", timeout=10000)
        print("Đã chuyển sang trang Quản lý Sản phẩm thành công")
        
        # Đợi bảng sản phẩm tải xong
        ipa_page.wait_for_selector('.table-container table tbody tr, .product-management table tbody tr', timeout=10000)
        
        # Khởi tạo biến đếm sản phẩm đã xử lý
        processed_count = 0
        
        # ----- ĐĂNG NHẬP VÀO TRANG BANGMACHAPEL -----
        print("\n===== ĐĂNG NHẬP VÀO BANGMACHAPEL =====")
        chapel_page = context.new_page()
        
        # Truy cập trang BANGMACHAPEL
        print("Đang truy cập trang bangmachapel.com...")
        chapel_page.goto("https://bangmachapel.com/")
        
        # Đợi trang load xong
        chapel_page.wait_for_load_state("networkidle")
        print("Trang đã tải xong, đang tìm form đăng nhập...")
        
        # Dựa vào HTML bạn cung cấp, sử dụng selector chính xác
        print("Đang nhập thông tin đăng nhập bangmachapel...")
        
        # Nhập tên đăng nhập - sử dụng selector chính xác từ HTML
        try:
            # Đợi để đảm bảo form đã load
            chapel_page.wait_for_selector('input[name="login"]', timeout=5000)
            chapel_page.fill('input[name="login"]', "mkttuan")
            print("Đã nhập tên đăng nhập")
        except Exception as e:
            print(f"Lỗi khi nhập tên đăng nhập: {str(e)}")
        
        # Nhập mật khẩu
        try:
            chapel_page.fill('input[name="password"]', "123@321")
            print("Đã nhập mật khẩu")
        except Exception as e:
            print(f"Lỗi khi nhập mật khẩu: {str(e)}")
        
        # Tìm và nhấn nút đăng nhập
        try:
            # Tìm nút submit trong form
            login_button_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                '.v-btn:has-text("Đăng nhập")',
                '.v-btn', # Nếu chỉ có một nút trong form
                'button.v-btn',
                'button.primary',
                'button.login-btn'
            ]
            
            for selector in login_button_selectors:
                if chapel_page.is_visible(selector):
                    print(f"Đã tìm thấy nút đăng nhập với selector: {selector}")
                    chapel_page.click(selector)
                    break
            else:
                # Nếu không tìm thấy nút cụ thể, thử submit form trực tiếp
                print("Không tìm thấy nút đăng nhập, thử submit form trực tiếp...")
                chapel_page.evaluate('document.querySelector("form").submit()')
            
            # Đợi trang load sau khi đăng nhập
            chapel_page.wait_for_load_state("networkidle")
            print("Đã hoàn thành quy trình đăng nhập vào bangmachapel.com")
            
            # ===== CHUYỂN ĐẾN TRANG SẢN PHẨM BANGMACHAPEL =====
            # Đợi một chút để đảm bảo giao diện đã load sau khi đăng nhập
            time.sleep(2)
            
            print("Đang chuyển đến trang Sản phẩm...")
            
            # Sử dụng selector chính xác từ HTML bạn cung cấp
            product_link_selector = 'a[href="/quan-ly-san-pham"]'
            
            # Đợi cho đến khi liên kết tồn tại trên trang
            chapel_page.wait_for_selector(product_link_selector, timeout=10000)
            print("Đã tìm thấy liên kết đến trang Sản phẩm")
            
            # Đảm bảo liên kết hiển thị trong viewport
            chapel_page.locator(product_link_selector).scroll_into_view_if_needed()
            time.sleep(0.5) # Đợi sau khi scroll
            
            # Nhấp vào liên kết
            chapel_page.click(product_link_selector)
            print("Đã nhấp vào liên kết Sản phẩm")
            
            # Đợi trang load sau khi chuyển trang
            chapel_page.wait_for_url("**/quan-ly-san-pham", timeout=10000)
            chapel_page.wait_for_load_state("networkidle")
            print("Đã chuyển sang trang Sản phẩm thành công")

            # ===== CHỌN HIỂN THỊ 100 SẢN PHẨM MỖI TRANG =====
            try:
                print("Đang thay đổi số lượng sản phẩm hiển thị mỗi trang...")
                # Click vào dropdown chọn số lượng
                chapel_page.wait_for_selector('div.v-select__slot', timeout=5000)
                chapel_page.click('div.v-select__slot')
                time.sleep(1)
                
                # Đợi menu hiển thị và click vào option 100
                try:
                    chapel_page.wait_for_selector('.v-menu__content.menuable__content__active', timeout=5000)
                    # Tìm và click phần tử có text là "100"
                    chapel_page.click('.v-list-item .v-list-item__title:has-text("100")')
                    print("Đã chọn hiển thị 100 sản phẩm mỗi trang")
                except Exception as e:
                    print(f"Không thể tìm thấy tùy chọn 100 bằng text: {str(e)}")
                    # Thử cách khác - click vào phần tử thứ 5 trong danh sách (thường là 100)
                    try:
                        chapel_page.click('.v-menu__content.menuable__content__active .v-list-item:nth-child(5)')
                        print("Đã chọn phần tử thứ 5 trong danh sách (có thể là 100)")
                    except Exception as e2:
                        print(f"Không thể chọn phần tử thứ 5: {str(e2)}")
                
                # Đợi trang tải lại sau khi thay đổi số lượng hiển thị
                chapel_page.wait_for_load_state("networkidle")
                time.sleep(2)
            except Exception as e:
                print(f"Lỗi khi thay đổi số lượng sản phẩm mỗi trang: {str(e)}")
                print("Tiếp tục với số lượng mặc định")
            
            # ===== SẮP XẾP BẢNG THEO MÃ SẢN PHẨM =====
            print("Đang sắp xếp bảng theo mã sản phẩm...")
            
            # Đợi để đảm bảo bảng đã load hoàn toàn
            time.sleep(2)
            
            # Tìm và nhấp vào tiêu đề cột "Mã sản phẩm" để sắp xếp
            try:
                # Cách 1: Tìm theo văn bản của tiêu đề cột
                product_code_header_selector = 'th[role="columnheader"]:has-text("Mã sản phẩm")'
                
                if chapel_page.is_visible(product_code_header_selector):
                    print("Đã tìm thấy tiêu đề cột Mã sản phẩm")
                    chapel_page.click(product_code_header_selector)
                    print("Đã nhấp vào tiêu đề cột Mã sản phẩm để sắp xếp")
                else:
                    # Cách 2: Thử tìm theo thứ tự cột (cột thứ 2 trong bảng)
                    print("Không tìm thấy tiêu đề cột bằng text, thử tìm theo vị trí...")
                    chapel_page.click('table > thead > tr > th:nth-child(2)')
                    print("Đã nhấp vào cột thứ 2 để sắp xếp theo mã sản phẩm")
                
                # Đợi để bảng cập nhật sau khi sắp xếp
                chapel_page.wait_for_load_state("networkidle")
                time.sleep(2)
                
                print("Đã sắp xếp bảng theo mã sản phẩm")
                
                # Tạo thư mục để lưu ảnh tạm thời
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)  # Xóa thư mục cũ nếu tồn tại
                os.makedirs(temp_dir)
                
                # Biến đếm số lượng sản phẩm đã xử lý
                processed_count = 0
                
                # Xử lý phân trang
                current_page = 1
                
                # Điều hướng đến trang bắt đầu nếu cần
                if start_page > 1:
                    print(f"\n===== DI CHUYỂN ĐẾN TRANG BẮT ĐẦU ({start_page}) =====")
                    # Nếu có nút chuyển đến trang cụ thể, sử dụng nó
                    try:
                        # Thử tìm input chuyển trang
                        if chapel_page.is_visible('.v-pagination__navigation input'):
                            chapel_page.fill('.v-pagination__navigation input', str(start_page))
                            chapel_page.press('.v-pagination__navigation input', 'Enter')
                        else:
                            # Nếu không, nhấn nút Next nhiều lần
                            for _ in range(start_page - 1):
                                next_button = chapel_page.locator('button[aria-label="Next page"]')
                                next_button.click()
                                chapel_page.wait_for_load_state("networkidle")
                                time.sleep(1)
                        current_page = start_page
                        print(f"Đã di chuyển đến trang {start_page}")
                        
                        # Đợi thêm 20 giây để trang load nội dung
                        print(f"Đợi 30 giây để trang {start_page} load nội dung đầy đủ...")
                        chapel_page.wait_for_timeout(30000)
                        print(f"Đã hoàn thành thời gian đợi, tiếp tục xử lý trang {start_page}")
                    except Exception as e:
                        print(f"Lỗi khi di chuyển đến trang bắt đầu: {str(e)}")
                        print("Tiếp tục từ trang hiện tại")
                
                # Sử dụng tham số start_row cho trang đầu tiên
                if current_page == start_page and "start_row" in browser_config:
                    start_row = browser_config["start_row"]
                    print(f"Áp dụng hàng bắt đầu: {start_row} (Chỉ áp dụng cho trang bắt đầu)")
                else:
                    start_row = 1
                
                # Xử lý từng trang
                while current_page <= end_page and processed_count < max_products:
                    print(f"\n===== ĐANG XỬ LÝ TRANG {current_page}/{end_page} =====")
                    
                    # ===== ĐỌC VÀ LƯU THÔNG TIN BẢNG =====
                    print("Đang đọc thông tin từ bảng sản phẩm...")
                    
                    # Lấy tất cả các hàng trong bảng
                    try:
                        # Đợi bảng tải xong
                        chapel_page.wait_for_selector('table tbody tr', timeout=10000)
                        rows = chapel_page.query_selector_all('tr[id^="r-"]')
                        
                        if not rows:
                            print("Không tìm thấy hàng nào trong bảng, thử selector khác...")
                            rows = chapel_page.query_selector_all('table tbody tr')
                            
                        print(f"Tìm thấy {len(rows)} hàng trong bảng")
                        
                        # Áp dụng hàng bắt đầu nếu đang ở trang bắt đầu
                        if current_page == start_page and start_row > 1:
                            if start_row <= len(rows):
                                print(f"Bỏ qua {start_row-1} hàng đầu tiên theo cấu hình")
                                rows = rows[start_row-1:]
                                print(f"Còn lại {len(rows)} hàng sau khi bỏ qua")
                            else:
                                print(f"Cảnh báo: Hàng bắt đầu ({start_row}) lớn hơn tổng số hàng ({len(rows)}), xử lý tất cả hàng")
                        
                        # Áp dụng hàng kết thúc nếu đang ở trang kết thúc
                        end_row = browser_config.get("end_row", 0)
                        if current_page == end_page and end_row > 0:
                            if end_row <= len(rows):
                                print(f"Chỉ xử lý {end_row} hàng đầu tiên trên trang kết thúc theo cấu hình")
                                rows = rows[:end_row]
                                print(f"Còn lại {len(rows)} hàng sau khi áp dụng giới hạn")
                            else:
                                print(f"Hàng kết thúc ({end_row}) lớn hơn tổng số hàng ({len(rows)}), xử lý tất cả hàng")
                    except Exception as e:
                        print(f"Lỗi khi tìm hàng trong bảng: {str(e)}")
                        rows = []
                    
                    # Mảng để lưu thông tin sản phẩm
                    products = []
                    
                    for i, row in enumerate(rows):
                        try:
                            # Kiểm tra xem hàng có ảnh không
                            images = row.query_selector_all('td.images img')
                            if not images:
                                print(f"Hàng {i+1} không có ảnh, thử selector khác...")
                                images = row.query_selector_all('img')
                                
                            if not images:
                                print(f"Hàng {i+1} không có ảnh, bỏ qua")
                                continue  # Bỏ qua hàng không có ảnh
                            
                            # Lấy ID của hàng
                            row_id = row.get_attribute('id') or f"row-{i+1}"
                            
                            # Lấy dữ liệu từ các cột
                            try:
                                product_code = row.query_selector('td:nth-child(2)').inner_text().strip()
                            except:
                                product_code = f"CP_x{1000 + processed_count + i}"
                                print(f"Không đọc được mã sản phẩm, sử dụng mã tạm: {product_code}")
                            
                            try:
                                brand = row.query_selector('td:nth-child(3)').inner_text().strip()
                            except:
                                brand = ""
                            
                            try:
                                note = row.query_selector('td:nth-child(4)').inner_text().strip()
                            except:
                                note = ""
                            
                            try:
                                color = row.query_selector('td:nth-child(5)').inner_text().strip()
                            except:
                                color = ""
                            
                            try:
                                creator = row.query_selector('td:nth-child(6)').inner_text().strip()
                            except:
                                creator = ""
                            
                            # Tạo danh sách ảnh
                            image_urls = []
                            saved_images = []
                            
                            for j, img in enumerate(images):
                                img_url = img.get_attribute('src')
                                if img_url:
                                    image_urls.append(img_url)
                                    
                                    # Lưu ảnh tạm thời
                                    img_filename = f"{temp_dir}/{row_id.replace('r-', '')}_{j}.jpg"
                                    try:
                                        urllib.request.urlretrieve(img_url, img_filename)
                                        saved_images.append(img_filename)
                                        print(f"Đã lưu ảnh: {img_filename}")
                                    except Exception as e:
                                        print(f"Lỗi khi lưu ảnh {img_url}: {str(e)}")
                            
                            # Thêm sản phẩm vào danh sách
                            product = {
                                'id': row_id,
                                'product_code': product_code,
                                'brand': brand,
                                'note': note,
                                'color': color,
                                'creator': creator,
                                'image_urls': image_urls,
                                'saved_images': saved_images
                            }
                            
                            products.append(product)
                            print(f"Đã đọc sản phẩm: {product_code or row_id} - {brand}")
                            
                        except Exception as e:
                            print(f"Lỗi khi đọc hàng {i+1}: {str(e)}")
                    
                    # Lưu thông tin sản phẩm vào file
                    with open(products_data_file, 'w', encoding='utf-8') as f:
                        json.dump(products, f, ensure_ascii=False, indent=2)
                    
                    print(f"Đã lưu thông tin {len(products)} sản phẩm vào file {products_data_file}")
                    
                    if len(products) == 0:
                        print("Không có sản phẩm nào có ảnh trên trang này, chuyển sang trang tiếp theo")
                    else:
                        # Chuyển đến trang IPA để tiếp tục xử lý
                        print("\n===== CHUYỂN SANG TAB IPA SEARCH IMAGE =====")
                        ipa_page.bring_to_front()
                        
                        # Đợi để đảm bảo trang IPA đã active
                        time.sleep(1)
                        print("Đã chuyển sang tab IPA Search Image")
                        
                        # ===== THÊM SẢN PHẨM VÀO IPA SEARCH IMAGE =====
                        for product_idx, product in enumerate(products):
                            current_product_code = product['product_code']
                            
                            # Xử lý sản phẩm
                            print(f"\n===== THÊM SẢN PHẨM {product_idx+1}/{len(products)} =====")
                            print(f"Thêm sản phẩm: {current_product_code or product['id']}")
                            
                            # Nhấn nút "Thêm sản phẩm"
                            add_button_selector = 'button.btn-primary:has-text("Thêm sản phẩm")'
                            ipa_page.wait_for_selector(add_button_selector, state="visible", timeout=10000)
                            ipa_page.click(add_button_selector)
                            print("Đã nhấp vào nút Thêm sản phẩm")
                            
                            # Đợi modal hiển thị
                            modal_selector = '.modal-body'
                            ipa_page.wait_for_selector(modal_selector, state="visible", timeout=10000)
                            print("Modal thêm sản phẩm đã hiển thị")
                            
                            # Điền thông tin vào form
                            try:
                                # Điền mã sản phẩm
                                if product['product_code']:
                                    ipa_page.fill('input[name="product_code"]', product['product_code'])
                                    print(f"Đã điền mã sản phẩm: {product['product_code']}")
                                
                                # Điền thương hiệu
                                if product['brand']:
                                    ipa_page.fill('input[name="brand"]', product['brand'])
                                    print(f"Đã điền thương hiệu: {product['brand']}")
                                
                                # Điền mô tả (ghi chú)
                                if product['note']:
                                    ipa_page.fill('textarea[name="description"]', product['note'])
                                    print(f"Đã điền mô tả: {product['note']}")
                                
                                # Điền màu sắc
                                if product['color']:
                                    ipa_page.fill('input[name="colors"]', product['color'])
                                    print(f"Đã điền màu sắc: {product['color']}")
                                
                                # Điền người tạo
                                if product['creator']:
                                    ipa_page.fill('input[name="creator_name"]', product['creator'])
                                    print(f"Đã điền người tạo: {product['creator']}")
                                
                                # Tải ảnh lên
                                if product['saved_images']:
                                    # Nhấp vào nút tải ảnh
                                    upload_button_selector = '.upload__image-wrapper button'
                                    ipa_page.click(upload_button_selector)
                                    
                                    # Tạo đường dẫn tuyệt đối cho file ảnh
                                    image_paths = [os.path.abspath(img_path) for img_path in product['saved_images']]
                                    
                                    # Sử dụng hộp thoại tải lên
                                    file_input = ipa_page.locator('input[type="file"]')
                                    file_input.set_input_files(image_paths)
                                    
                                    print(f"Đã tải lên {len(image_paths)} ảnh")
                                    
                                    # Đợi để ảnh tải lên hoàn tất
                                    ipa_page.wait_for_timeout(2000)
                            except Exception as e:
                                print(f"Lỗi khi điền thông tin: {str(e)}")
                            
                            # Nhấn nút "Lưu" để thêm sản phẩm
                            try:
                                # Đầu tiên đảm bảo nút lưu nằm trong viewport
                                save_button_selector = '.modal-footer button.btn-primary:has-text("Lưu")'
                                ipa_page.locator(save_button_selector).scroll_into_view_if_needed()
                                time.sleep(0.5)
                                
                                # Nhấn nút lưu
                                ipa_page.click(save_button_selector)
                                print("Đã nhấp vào nút Lưu")
                                
                                # Đợi modal đóng và trang cập nhật
                                ipa_page.wait_for_selector(modal_selector, state="hidden", timeout=20000)
                                print("Đã thêm sản phẩm thành công")
                                
                                # Đợi một chút trước khi thêm sản phẩm tiếp theo
                                time.sleep(3)
                                
                                # Tăng số lượng sản phẩm đã xử lý
                                processed_count += 1
                                
                                # Kiểm tra nếu đã đạt giới hạn
                                if processed_count >= max_products:
                                    print(f"Đã đạt giới hạn {max_products} sản phẩm, dừng quá trình")
                                    break
                                
                            except Exception as e:
                                print(f"Lỗi khi lưu sản phẩm: {str(e)}")
                                
                                # Nếu có lỗi, thử đóng modal bằng nút Hủy
                                try:
                                    cancel_button_selector = '.modal-footer button:has-text("Hủy")'
                                    if ipa_page.is_visible(cancel_button_selector):
                                        ipa_page.click(cancel_button_selector)
                                        print("Đã nhấp vào nút Hủy để đóng modal")
                                except:
                                    pass
                    
                    # Xóa thư mục ảnh tạm thời và tạo lại
                    if os.path.exists(temp_dir):
                        shutil.rmtree(temp_dir)
                        os.makedirs(temp_dir)
                    
                    # Chuyển sang tab bangmachapel để xử lý trang tiếp theo
                    chapel_page.bring_to_front()
                    time.sleep(1)
                    
                    # Kiểm tra nếu đã đến trang cuối hoặc trang kết thúc
                    if current_page >= end_page:
                        print(f"Đã đến trang kết thúc đã chỉ định ({end_page}), dừng quá trình")
                        break
                    
                    # Kiểm tra nút Next Page có bị disabled không
                    next_page_button = chapel_page.locator('button[aria-label="Next page"]')
                    is_disabled = next_page_button.get_attribute('disabled') is not None
                    
                    if is_disabled:
                        print("Đã đến trang cuối cùng, không còn trang tiếp theo")
                        break
                    else:
                        # Nhấp vào nút Next Page
                        print("Đang chuyển đến trang tiếp theo...")
                        next_page_button.click()
                        
                        # Đợi trang tải xong
                        chapel_page.wait_for_load_state("networkidle")
                        time.sleep(2)
                        
                        current_page += 1
                        print(f"Đã chuyển sang trang {current_page}")
                
                print("\n===== ĐÃ HOÀN THÀNH THÊM SẢN PHẨM =====")
                print(f"Tổng số sản phẩm đã xử lý: {processed_count}")
                
                # Sau khi xử lý xong, lưu tiến trình
                last_product = current_product_code if 'current_product_code' in locals() else None
                
                # Sử dụng tên file tiến trình riêng cho mỗi browser
                with open(progress_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "last_product_code": last_product,
                        "processed_count": processed_count,
                        "browser_id": browser_id,
                        "last_page": current_page,
                        "start_row": browser_config.get("start_row", 1),  # Lưu thông tin hàng bắt đầu
                        "end_row": browser_config.get("end_row", 0)       # Lưu thông tin hàng kết thúc
                    }, f, ensure_ascii=False, indent=2)
                print(f"Đã lưu tiến trình cho Browser {browser_id}: Sản phẩm cuối = {last_product}, Số lượng = {processed_count}")
                
                # Cập nhật cấu hình với thông tin về lần chạy cuối
                try:
                    config = load_user_config()
                    config["last_run_timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    config["last_processed_count"] = processed_count
                    config["last_product"] = last_product
                    config["last_page_processed"] = current_page
                    save_user_config(config)
                    print(f"Đã cập nhật thông tin lần chạy cuối vào file cấu hình")
                except Exception as e:
                    print(f"Lỗi khi cập nhật thông tin lần chạy: {str(e)}")
                
            except Exception as e:
                print(f"Lỗi khi sắp xếp hoặc đọc bảng: {str(e)}")
            
        except Exception as e:
            print(f"Lỗi: {str(e)}")
            
        return context, browser, playwright, [ipa_page, chapel_page]
            
    except Exception as e:
        print(f"Lỗi: {str(e)}")
        return context, browser, playwright, []

def run_browser_thread(browser_id, browser_config):
    """Hàm chạy trong một thread riêng cho mỗi browser"""
    try:
        # Đợi thêm một chút theo ID để tránh đăng nhập cùng lúc
        time.sleep(browser_id * 2)
        result = login_to_multiple_sites(browser_id, browser_config)
        print(f"Browser {browser_id} đã hoàn thành nhiệm vụ")
        return result
    except Exception as e:
        print(f"Lỗi khi chạy Browser {browser_id}: {str(e)}")
        return None

if __name__ == "__main__":
    try:
        print("===== CHƯƠNG TRÌNH LẤY DỮ LIỆU SẢN PHẨM =====")
        print("Script sẽ tự động đăng nhập vào hai trang web và chuyển dữ liệu sản phẩm")
        
        # Kiểm tra và tạo file README nếu chưa tồn tại
        readme_file = "README.md"
        if not os.path.exists(readme_file):
            with open(readme_file, 'w', encoding='utf-8') as f:
                f.write("""# Ứng dụng Tự động Chuyển dữ liệu Sản phẩm

## Mô tả
Script này tự động đăng nhập vào hai trang web (bangmachapel.com và frontend.ipasearchimage.id.vn), trích xuất thông tin sản phẩm từ bangmachapel và thêm vào frontend.ipasearchimage.id.vn.

## Cách sử dụng
1. Chạy script bằng lệnh: `python tool_communicate/main.py`
2. Nhập các thông số:
   - Số lượng browser muốn chạy cùng lúc
   - Cho mỗi browser:
     - Trang bắt đầu (từ trang nào ở bangmachapel)
     - Trang kết thúc (đến trang nào ở bangmachapel)
     - Số lượng sản phẩm tối đa cần xử lý

## Các file dữ liệu
- **user_config.json**: Lưu cấu hình người dùng nhập vào và thông tin về lần chạy cuối
- **progress.json**: Lưu tiến trình xử lý (mã sản phẩm cuối cùng, số lượng đã xử lý)
- **products_data.json**: Lưu dữ liệu sản phẩm tạm thời đang xử lý
- **temp_images/**: Thư mục chứa ảnh tạm thời

## Lưu ý
- Script không tự động đóng trình duyệt khi hoàn thành để bạn có thể kiểm tra kết quả
- Nhấn Ctrl+C để thoát khỏi script
- Mỗi browser sẽ xử lý một phạm vi trang khác nhau, giúp xử lý song song và nhanh hơn
""")
                print(f"Đã tạo file {readme_file} với hướng dẫn sử dụng")
        
        # Nhận cấu hình từ người dùng
        user_config = get_user_input()
        browser_count = user_config["browser_count"]
        
        if browser_count == 1:
            # Nếu chỉ có 1 browser, chạy trực tiếp
            browser_config = user_config.get("browser_1", {
                "start_page": 1,
                "end_page": 9999,
                "max_products": 5000
            })
            context, browser, playwright, pages = login_to_multiple_sites(1, browser_config)
            
            # Biến để theo dõi trạng thái đóng
            should_close_playwright = False
            
            # Giữ script chạy và trình duyệt mở đến khi người dùng tắt terminal
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nĐã nhận lệnh thoát...")
                should_close_playwright = False
        else:
            # Nếu có nhiều browser, sử dụng ThreadPoolExecutor để chạy các browser đồng thời
            print(f"\n===== KHỞI ĐỘNG {browser_count} BROWSERS =====")
            
            # Danh sách kết quả từ các browser
            browser_results = []
            
            # Sử dụng executor để quản lý các threads
            with concurrent.futures.ThreadPoolExecutor(max_workers=browser_count) as executor:
                # Tạo và submit các nhiệm vụ cho từng browser
                futures = []
                for i in range(browser_count):
                    browser_id = i + 1
                    browser_config = user_config.get(f"browser_{browser_id}", {
                        "start_page": 1,
                        "end_page": 9999,
                        "max_products": 5000
                    })
                    
                    # Submit nhiệm vụ
                    future = executor.submit(run_browser_thread, browser_id, browser_config)
                    futures.append(future)
                    print(f"Đã khởi động Browser {browser_id}")
                
                print("\n===== TẤT CẢ CÁC BROWSER ĐÃ ĐƯỢC KHỞI ĐỘNG =====")
                print("Ấn Ctrl+C để dừng tất cả các browsers...")
                
                try:
                    # Đợi tất cả các browser hoàn thành
                    for future in concurrent.futures.as_completed(futures):
                        result = future.result()
                        if result:
                            browser_results.append(result)
                except KeyboardInterrupt:
                    print("\nĐã nhận lệnh thoát...")
                    # Không đóng các browser để người dùng có thể kiểm tra
            
            print("\n===== KẾT QUẢ CHẠY =====")
            print(f"Số browser đã khởi động: {browser_count}")
            print(f"Số browser hoàn thành: {len(browser_results)}")
            print("Các browser vẫn đang mở để bạn có thể kiểm tra")
    
    except Exception as e:
        print(f"Lỗi không xử lý được: {str(e)}")
    
    finally:
        print("Kết thúc chương trình.")
        if browser_count == 1 and 'should_close_playwright' in locals() and should_close_playwright and 'playwright' in locals():
            print("Đang đóng trình duyệt...")
            playwright.stop()
        else:
            print("Các trình duyệt vẫn đang mở.")

