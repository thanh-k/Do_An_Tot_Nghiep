import faiss
import numpy as np
import os
import pickle

class VectorStore:
    def __init__(self, index_path="data/product_vectors.index", mapping_path="data/index_to_id.pkl"):
        self.index_path = index_path
        self.mapping_path = mapping_path
        
        # Tạo thư mục 'data' nếu chưa tồn tại
        os.makedirs(os.path.dirname(index_path), exist_ok=True)

        self.dimension = 2048  # Kích thước vector của ResNet50
        self.index = None
        self.index_to_product_id = {} # Mapping từ ID của FAISS -> ID sản phẩm trong DB của bạn

        self.load()

    def add(self, product_id: int, vector: list[float]):
        """Thêm hoặc cập nhật vector cho một sản phẩm"""
        if self.index is None:
            self.index = faiss.IndexFlatL2(self.dimension)
            
        vector_np = np.array([vector], dtype=np.float32)
        
        # Xóa vector cũ nếu sản phẩm đã tồn tại
        self.remove(product_id)
        
        # Thêm vector mới vào FAISS
        self.index.add(vector_np)
        new_index_id = self.index.ntotal - 1
        
        # Lưu mapping
        self.index_to_product_id[new_index_id] = product_id
        self.save()

    def remove(self, product_id: int):
        """Xóa vector của một sản phẩm"""
        if self.index is None or not self.index_to_product_id:
            return

        # Tìm ID của FAISS tương ứng với product_id
        ids_to_remove = [idx for idx, pid in self.index_to_product_id.items() if pid == product_id]
        
        if not ids_to_remove:
            return

        # FAISS yêu cầu xóa bằng ID, và ID phải được sắp xếp
        self.index.remove_ids(np.array(sorted(ids_to_remove), dtype=np.int64))
        
        # Cập nhật lại mapping
        # Đây là cách đơn giản, với hệ thống lớn cần tối ưu hơn
        new_mapping = {}
        new_id_counter = 0
        for i in range(self.index.ntotal + len(ids_to_remove)):
            if i not in ids_to_remove:
                if i in self.index_to_product_id:
                    new_mapping[new_id_counter] = self.index_to_product_id[i]
                    new_id_counter += 1
        self.index_to_product_id = new_mapping
        
        self.save()

    def search(self, vector: list[float], k: int = 10) -> list[int]:
        """Tìm kiếm k sản phẩm gần nhất"""
        if self.index is None or self.index.ntotal == 0:
            return []
            
        # SỬA LỖI: Đảm bảo số lượng (k) tìm kiếm không được lớn hơn tổng số sản phẩm đang có trong kho
        k = min(k, self.index.ntotal)

        vector_np = np.array([vector], dtype=np.float32)
        distances, indices = self.index.search(vector_np, k)
        
        # In khoảng cách ra màn hình đen (Terminal) để bạn dễ dàng căn chỉnh ngưỡng
        print(">>> FAISS Distances:", distances[0])
        
        # ĐỊNH NGHĨA NGƯỠNG KHOẢNG CÁCH TỐI ĐA (THRESHOLD)
        # Bạn có thể tự thay đổi số này sau khi test thử. Số càng nhỏ -> AI chấm càng khắt khe!
        MAX_DISTANCE_THRESHOLD = 300.0 

        # Lấy ra các product_id từ các index tìm được
        found_product_ids = []
        for i, dist in zip(indices[0], distances[0]):
            if i != -1 and i in self.index_to_product_id:
                # CHỈ LẤY NHỮNG SẢN PHẨM CÓ KHOẢNG CÁCH < NGƯỠNG CHO PHÉP
                if dist <= MAX_DISTANCE_THRESHOLD:
                    found_product_ids.append(self.index_to_product_id[i])
        
        return found_product_ids

    def save(self):
        """Lưu index và mapping ra file"""
        if self.index:
            faiss.write_index(self.index, self.index_path)
        with open(self.mapping_path, "wb") as f:
            pickle.dump(self.index_to_product_id, f)
        print("Vector store saved.")

    def load(self):
        """Tải index và mapping từ file"""
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            print(f"FAISS index loaded from {self.index_path}")
        if os.path.exists(self.mapping_path):
            with open(self.mapping_path, "rb") as f:
                self.index_to_product_id = pickle.load(f)
            print(f"ID mapping loaded from {self.mapping_path}")

# Tạo một instance duy nhất
vector_store = VectorStore()
