#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from playwright.sync_api import sync_playwright
import time
import os
import json

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

def login_to_bangmachapel():
    """Đăng nhập vào trang bangmachapel.com và trả về đối tượng page"""
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
    
    # Tạo trang mới
    page = context.new_page()
    
    try:
        # Truy cập trang bangmachapel.com
        print("\n===== ĐĂNG NHẬP VÀO BANGMACHAPEL =====")
        print("Đang truy cập trang bangmachapel.com...")
        page.goto("https://bangmachapel.com/")
        
        # Đợi trang load xong
        page.wait_for_load_state("networkidle")
        print("Trang đã tải xong, đang tìm form đăng nhập...")
        
        # Nhập thông tin đăng nhập
        print("Đang nhập thông tin đăng nhập bangmachapel...")
        
        # Nhập tên đăng nhập
        try:
            # Đợi để đảm bảo form đã load
            page.wait_for_selector('input[name="login"]', timeout=5000)
            page.fill('input[name="login"]', "mkttuan")
            print("Đã nhập tên đăng nhập")
        except Exception as e:
            print(f"Lỗi khi nhập tên đăng nhập: {str(e)}")
        
        # Nhập mật khẩu
        try:
            page.fill('input[name="password"]', "123@321")
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
                if page.is_visible(selector):
                    print(f"Đã tìm thấy nút đăng nhập với selector: {selector}")
                    page.click(selector)
                    break
            else:
                # Nếu không tìm thấy nút cụ thể, thử submit form trực tiếp
                print("Không tìm thấy nút đăng nhập, thử submit form trực tiếp...")
                page.evaluate('document.querySelector("form").submit()')
            
            # Đợi trang load sau khi đăng nhập
            page.wait_for_load_state("networkidle")
            print("Đã hoàn thành quy trình đăng nhập vào bangmachapel.com")
            
            # ===== CHUYỂN ĐẾN TRANG SẢN PHẨM =====
            # Đợi một chút để đảm bảo giao diện đã load sau khi đăng nhập
            time.sleep(2)
            
            print("Đang chuyển đến trang Sản phẩm...")
            
            # Sử dụng selector chính xác từ HTML
            product_link_selector = 'a[href="/quan-ly-san-pham"]'
            
            # Đợi cho đến khi liên kết tồn tại trên trang
            page.wait_for_selector(product_link_selector, timeout=10000)
            print("Đã tìm thấy liên kết đến trang Sản phẩm")
            
            # Đảm bảo liên kết hiển thị trong viewport
            page.locator(product_link_selector).scroll_into_view_if_needed()
            time.sleep(0.5) # Đợi sau khi scroll
            
            # Nhấp vào liên kết
            page.click(product_link_selector)
            print("Đã nhấp vào liên kết Sản phẩm")
            
            # Đợi trang load sau khi chuyển trang
            page.wait_for_url("**/quan-ly-san-pham", timeout=10000)
            page.wait_for_load_state("networkidle")
            print("Đã chuyển sang trang Sản phẩm thành công")
            
            # Trả về page, context và các đối tượng cần thiết
            return {
                "page": page,
                "context": context,
                "browser": browser,
                "playwright": playwright
            }
            
        except Exception as e:
            print(f"Lỗi khi đăng nhập: {str(e)}")
            return None
    
    except Exception as e:
        print(f"Lỗi: {str(e)}")
        browser.close()
        playwright.stop()
        return None

def navigate_to_page(page, target_page):
    """Di chuyển đến trang cụ thể"""
    print(f"Đang di chuyển đến trang {target_page}...")
    
    try:
        # Tìm nút di chuyển đến trang cụ thể nếu có
        goto_page_input = page.locator('.v-pagination__navigation input')
        if goto_page_input.count() > 0:
            goto_page_input.fill(str(target_page))
            goto_page_input.press('Enter')
            print(f"Đã điền số trang {target_page} vào ô nhập liệu")
        else:
            # Kiểm tra nút First Page
            first_page_button = page.locator('button[aria-label="First page"]')
            if first_page_button.count() > 0 and not first_page_button.is_disabled():
                first_page_button.click()
                print("Đã nhấp vào nút trang đầu tiên")
                
                # Đợi trang tải xong
                page.wait_for_load_state("networkidle")
                time.sleep(1)
                
                # Nhấn nút Next nhiều lần để đến trang cần tìm
                for _ in range(target_page - 1):
                    next_button = page.locator('button[aria-label="Next page"]')
                    if next_button.is_disabled():
                        break
                    next_button.click()
                    page.wait_for_load_state("networkidle")
                    time.sleep(1)
            else:
                # Nếu không có nút First Page, sử dụng nút số trang nếu có
                page_buttons = page.locator('.v-pagination__item')
                for i in range(page_buttons.count()):
                    button_text = page_buttons.nth(i).inner_text()
                    if button_text == str(target_page):
                        page_buttons.nth(i).click()
                        print(f"Đã nhấp vào nút trang {target_page}")
                        break
                else:
                    print(f"Không tìm thấy nút trang {target_page}, đang thử phương pháp khác")
                    # Sử dụng nút Next nhiều lần
                    current_page = 1
                    while current_page < target_page:
                        next_button = page.locator('button[aria-label="Next page"]')
                        if next_button.is_disabled():
                            break
                        next_button.click()
                        current_page += 1
                        page.wait_for_load_state("networkidle")
                        time.sleep(1)
        
        # Đợi trang tải xong
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        print(f"Đã di chuyển đến trang {target_page}")
        return True
    except Exception as e:
        print(f"Lỗi khi di chuyển đến trang {target_page}: {str(e)}")
        return False

def find_products(page, product_codes, start_page=1):
    """Tìm nhiều sản phẩm cùng lúc, kiểm tra mỗi trang một lần để tìm tất cả sản phẩm"""
    print(f"\n===== TÌM KIẾM {len(product_codes)} MÃ SẢN PHẨM =====")
    
    # Thêm code để chọn hiển thị 100 sản phẩm mỗi trang
    try:
        print("Đang thay đổi số lượng sản phẩm hiển thị mỗi trang...")
        # Click vào dropdown chọn số lượng
        page.wait_for_selector('div.v-select__slot', timeout=5000)
        page.click('div.v-select__slot')
        time.sleep(1)
        
        # Đợi menu hiển thị và chọn giá trị 100
        # Sử dụng text thay vì ID
        try:
            page.wait_for_selector('.v-menu__content.menuable__content__active', timeout=5000)
            # Tìm và click phần tử có text là "100"
            page.click('.v-list-item .v-list-item__title:has-text("100")')
            print("Đã chọn hiển thị 100 sản phẩm mỗi trang")
        except Exception as e:
            print(f"Không thể tìm thấy tùy chọn 100: {str(e)}")
            # Thử cách khác - click vào phần tử thứ 5 trong danh sách (thường là 100)
            try:
                page.click('.v-menu__content.menuable__content__active .v-list-item:nth-child(5)')
                print("Đã chọn phần tử thứ 5 trong danh sách (có thể là 100)")
            except:
                print("Không thể chọn phần tử thứ 5")
        
        time.sleep(2)  # Đợi trang tải lại
    except Exception as e:
        print(f"Lỗi khi thay đổi số lượng sản phẩm mỗi trang: {str(e)}")
        print("Tiếp tục với số lượng mặc định")
    
    # Sắp xếp bảng theo mã sản phẩm để dễ tìm kiếm
    try:
        print("Đang sắp xếp bảng theo mã sản phẩm...")
        
        # Tìm và nhấp vào tiêu đề cột "Mã sản phẩm" để sắp xếp
        product_code_header_selector = 'th[role="columnheader"]:has-text("Mã sản phẩm")'
        
        if page.is_visible(product_code_header_selector):
            print("Đã tìm thấy tiêu đề cột Mã sản phẩm")
            page.click(product_code_header_selector)
            print("Đã nhấp vào tiêu đề cột Mã sản phẩm để sắp xếp")
        else:
            # Thử tìm theo thứ tự cột (cột thứ 2 trong bảng)
            print("Không tìm thấy tiêu đề cột bằng text, thử tìm theo vị trí...")
            page.click('table > thead > tr > th:nth-child(2)')
            print("Đã nhấp vào cột thứ 2 để sắp xếp theo mã sản phẩm")
        
        # Đợi để bảng cập nhật sau khi sắp xếp
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        print("Đã sắp xếp bảng theo mã sản phẩm")
        
        # Kiểm tra hướng sắp xếp (tăng dần)
        # Nếu cột đang sắp xếp giảm dần, nhấp lại để sắp xếp tăng dần
        sorted_desc = page.locator('th.desc').count() > 0
        if sorted_desc:
            print("Bảng đang sắp xếp giảm dần, nhấp lại để sắp xếp tăng dần")
            if page.is_visible(product_code_header_selector):
                page.click(product_code_header_selector)
            else:
                page.click('table > thead > tr > th:nth-child(2)')
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            print("Đã chuyển sang sắp xếp tăng dần")
    
    except Exception as e:
        print(f"Lỗi khi sắp xếp bảng: {str(e)}")
        print("Tiếp tục tìm kiếm trên bảng không sắp xếp")
    
    # Khởi tạo từ điển để lưu kết quả cho mỗi mã sản phẩm
    results = {}
    for code in product_codes:
        results[code] = {
            "found": False,
            "page": 0,
            "row": 0,
            "product_info": None
        }
    
    # Biến theo dõi số lượng mã còn cần tìm
    remaining_codes = set(product_codes)
    print(f"Cần tìm {len(remaining_codes)} mã sản phẩm: {', '.join(remaining_codes)}")
    
    # Di chuyển đến trang bắt đầu nếu không phải trang 1
    current_page = start_page
    if current_page > 1:
        print(f"\n===== BẮT ĐẦU TÌM KIẾM TỪ TRANG {current_page} =====")
        if not navigate_to_page(page, current_page):
            print(f"Không thể chuyển đến trang {current_page}, bắt đầu từ trang hiện tại")
    
    max_pages = 1000  # Giới hạn số trang tìm kiếm
    
    while current_page <= max_pages and remaining_codes:
        print(f"\n===== ĐANG TÌM KIẾM TRÊN TRANG {current_page} =====")
        
        # Đợi bảng tải xong
        try:
            page.wait_for_selector('table tbody tr', timeout=10000)
            rows = page.query_selector_all('tr[id^="r-"]')
            
            if not rows:
                print("Không tìm thấy hàng nào trong bảng, thử selector khác...")
                rows = page.query_selector_all('table tbody tr')
                
            print(f"Đang kiểm tra {len(rows)} hàng trên trang {current_page}...")
            
            # Quét qua tất cả các hàng để tìm tất cả các mã trên trang này
            for row_idx, row in enumerate(rows):
                try:
                    # Lấy mã sản phẩm từ hàng
                    code_cell = row.query_selector('td:nth-child(2)')
                    if code_cell:
                        row_product_code = code_cell.inner_text().strip()
                        
                        # Kiểm tra xem mã này có trong danh sách cần tìm không
                        if row_product_code in remaining_codes:
                            print(f"ĐÃ TÌM THẤY: Sản phẩm {row_product_code} ở trang {current_page}, hàng {row_idx + 1}")
                            
                            # Lấy thông tin chi tiết sản phẩm
                            try:
                                brand = row.query_selector('td:nth-child(3)').inner_text().strip()
                            except:
                                brand = "N/A"
                            
                            try:
                                note = row.query_selector('td:nth-child(4)').inner_text().strip()
                            except:
                                note = "N/A"
                            
                            try:
                                color = row.query_selector('td:nth-child(5)').inner_text().strip()
                            except:
                                color = "N/A"
                            
                            try:
                                creator = row.query_selector('td:nth-child(6)').inner_text().strip()
                            except:
                                creator = "N/A"
                            
                            # Lấy thông tin ảnh
                            images = row.query_selector_all('td.images img, img')
                            image_urls = []
                            
                            for img in images:
                                img_url = img.get_attribute('src')
                                if img_url:
                                    image_urls.append(img_url)
                            
                            # Cập nhật kết quả
                            results[row_product_code] = {
                                "found": True,
                                "page": current_page,
                                "row": row_idx + 1,
                                "product_info": {
                                    "code": row_product_code,
                                    "brand": brand,
                                    "note": note,
                                    "color": color,
                                    "creator": creator,
                                    "image_count": len(image_urls),
                                    "image_urls": image_urls
                                }
                            }
                            
                            # Xóa mã này khỏi danh sách cần tìm
                            remaining_codes.remove(row_product_code)
                            print(f"Còn lại {len(remaining_codes)} mã cần tìm")
                            
                            # Nếu đã tìm thấy tất cả, dừng vòng lặp
                            if not remaining_codes:
                                print("Đã tìm thấy tất cả các mã sản phẩm!")
                                break
                except Exception as e:
                    print(f"Lỗi khi kiểm tra hàng {row_idx + 1}: {str(e)}")
            
            # Nếu đã tìm thấy tất cả, dừng vòng lặp
            if not remaining_codes:
                break
            
            # Chuyển đến trang tiếp theo
            next_button = page.locator('button[aria-label="Next page"]')
            is_disabled = next_button.get_attribute('disabled') is not None
            
            if is_disabled:
                print("Đã đến trang cuối cùng, kết thúc tìm kiếm")
                break
            else:
                # Nhấp vào nút Next Page
                print("Đang chuyển đến trang tiếp theo...")
                next_button.click()
                
                # Đợi trang tải xong
                page.wait_for_load_state("networkidle")
                time.sleep(2)
                
                current_page += 1
        
        except Exception as e:
            print(f"Lỗi khi tìm kiếm trên trang {current_page}: {str(e)}")
            break
    
    # Chuyển đổi từ dictionary sang list để phù hợp với format cũ
    result_list = []
    for code in product_codes:
        result_list.append(results.get(code, {
            "found": False,
            "page": 0,
            "row": 0,
            "product_info": None
        }))
    
    # In thông tin về những mã không tìm thấy
    if remaining_codes:
        print(f"\nKhông tìm thấy {len(remaining_codes)} mã sản phẩm: {', '.join(remaining_codes)}")
    
    return result_list

def find_product(page, product_code, start_page=1):
    """Tìm một sản phẩm theo mã (sử dụng hàm find_products để tái sử dụng code)"""
    results = find_products(page, [product_code], start_page)
    return results[0] if results else {
        "found": False,
        "page": 0,
        "row": 0,
        "product_info": None
    }

def main():
    try:
        print("===== CÔNG CỤ TÌM KIẾM SẢN PHẨM TRÊN BANGMACHAPEL =====")
        
        # Đăng nhập vào bangmachapel
        login_result = login_to_bangmachapel()
        
        if not login_result:
            print("Không thể đăng nhập vào bangmachapel.com")
            return
        
        page = login_result["page"]
        context = login_result["context"]
        browser = login_result["browser"]
        playwright = login_result["playwright"]
        
        # Hỏi phương thức nhập mã sản phẩm
        print("\n===== PHƯƠNG THỨC NHẬP MÃ SẢN PHẨM =====")
        print("1. Nhập trực tiếp")
        print("2. Từ file văn bản")
        
        input_method = input("Chọn phương thức (1 hoặc 2): ").strip()
        
        product_codes = []
        
        if input_method == "2":
            # Nhập từ file
            file_path = input("Nhập đường dẫn đến file chứa mã sản phẩm: ").strip()
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        code = line.strip()
                        if code:
                            product_codes.append(code)
                            
                print(f"Đã đọc {len(product_codes)} mã sản phẩm từ file")
            except Exception as e:
                print(f"Lỗi khi đọc file: {str(e)}")
                print("Chuyển sang nhập trực tiếp")
                input_method = "1"
        
        if input_method == "1" or not product_codes:
            # Thu thập danh sách mã sản phẩm cần tìm
            print("\n===== NHẬP MÃ SẢN PHẨM CẦN TÌM =====")
            print("Nhập các mã sản phẩm, mỗi mã trên một dòng. Nhập dòng trống để kết thúc.")
            
            while True:
                code = input("Mã sản phẩm (hoặc Enter để kết thúc): ").strip()
                if not code:
                    break
                product_codes.append(code)
        
        if not product_codes:
            print("Không có mã sản phẩm nào được nhập.")
            return
        
        print(f"\nĐã nhập {len(product_codes)} mã sản phẩm")
        if len(product_codes) <= 10:
            print(f"Danh sách mã: {', '.join(product_codes)}")
        else:
            print(f"Danh sách mã: {', '.join(product_codes[:5])}... và {len(product_codes) - 5} mã khác")
        
        # Hỏi trang bắt đầu
        print("\n===== TRANG BẮT ĐẦU TÌM KIẾM =====")
        print("1. Bắt đầu từ trang đầu tiên (mặc định)")
        print("2. Chỉ định trang bắt đầu")
        
        start_page_option = input("Chọn tùy chọn (1 hoặc 2): ").strip()
        
        start_page = 1
        if start_page_option == "2":
            try:
                start_page = int(input("Nhập số trang bắt đầu tìm kiếm: ").strip())
                if start_page < 1:
                    start_page = 1
                    print("Số trang không hợp lệ, sử dụng trang 1")
            except ValueError:
                print("Số trang không hợp lệ, sử dụng trang 1")
                start_page = 1
        
        # Tìm kiếm tất cả sản phẩm cùng lúc
        search_start_time = time.time()
        results = find_products(page, product_codes, start_page)
        search_end_time = time.time()
        total_search_time = search_end_time - search_start_time
        
        # Lưu kết quả
        with open("search_results.json", "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_products": len(product_codes),
                "results": results
            }, f, ensure_ascii=False, indent=2)
        
        print(f"Đã lưu kết quả tìm kiếm vào file search_results.json")
        
        # Hiển thị thống kê
        found_count = sum(1 for r in results if r["found"])
        not_found_count = len(results) - found_count
        
        # Hiển thị bảng kết quả
        print("\n===== KẾT QUẢ TÌM KIẾM =====")
        print(f"Tổng số mã tìm kiếm: {len(product_codes)}")
        print(f"Tìm thấy: {found_count}, Không tìm thấy: {not_found_count}")
        print(f"Tổng thời gian tìm kiếm: {total_search_time:.2f} giây")
        print("-" * 70)
        
        # In tiêu đề bảng
        header_format = "{:<15} {:<10} {:<10} {:<15} {:<20}"
        print(header_format.format("Mã SP", "Trang", "Hàng", "Thương hiệu", "Trạng thái"))
        print("-" * 70)
        
        # In kết quả
        for i, result in enumerate(results):
            code = product_codes[i]
            if result["found"]:
                brand = result["product_info"]["brand"]
                status = "Đã tìm thấy"
                page_num = result["page"]
                row_num = result["row"]
            else:
                brand = "N/A"
                status = "Không tìm thấy"
                page_num = "N/A"
                row_num = "N/A"
            
            print(header_format.format(
                code, str(page_num), str(row_num), brand, status
            ))
        
        # Xuất kết quả chi tiết
        print("\nBạn có muốn xuất kết quả chi tiết không? (y/n)")
        export_detail = input().strip().lower()
        
        if export_detail == 'y':
            with open("detailed_results.txt", "w", encoding="utf-8") as f:
                f.write("===== KẾT QUẢ TÌM KIẾM CHI TIẾT =====\n")
                f.write(f"Thời gian tìm kiếm: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Tổng số mã tìm kiếm: {len(product_codes)}\n")
                f.write(f"Tìm thấy: {found_count}, Không tìm thấy: {not_found_count}\n")
                f.write(f"Tổng thời gian tìm kiếm: {total_search_time:.2f} giây\n\n")
                
                for i, result in enumerate(results):
                    code = product_codes[i]
                    f.write(f"--- {i+1}. Mã sản phẩm: {code} ---\n")
                    
                    if result["found"]:
                        product_info = result["product_info"]
                        f.write(f"Trạng thái: Đã tìm thấy\n")
                        f.write(f"Trang: {result['page']}\n")
                        f.write(f"Hàng: {result['row']}\n")
                        f.write(f"Thương hiệu: {product_info['brand']}\n")
                        f.write(f"Mô tả: {product_info['note']}\n")
                        f.write(f"Màu sắc: {product_info['color']}\n")
                        f.write(f"Người tạo: {product_info['creator']}\n")
                        f.write(f"Số lượng ảnh: {product_info['image_count']}\n")
                        if product_info['image_count'] > 0:
                            f.write("URL ảnh:\n")
                            for j, url in enumerate(product_info['image_urls']):
                                f.write(f"  {j+1}. {url}\n")
                    else:
                        f.write(f"Trạng thái: Không tìm thấy\n")
                    
                    f.write("\n")
                
            print(f"Đã xuất kết quả chi tiết vào file detailed_results.txt")
        
        # Giữ trình duyệt mở
        print("\nTrình duyệt đang mở, nhấn Enter để thoát...")
        input()
    
    except Exception as e:
        print(f"Lỗi: {str(e)}")
    
    finally:
        print("Kết thúc chương trình.")
        if 'browser' in locals() and browser:
            browser.close()
        if 'playwright' in locals() and playwright:
            playwright.stop()

if __name__ == "__main__":
    main() 
if __name__ == "__main__":
    main() 