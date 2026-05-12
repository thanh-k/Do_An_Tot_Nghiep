import torch
from PIL import Image
import timm
import requests
from io import BytesIO

class FeatureExtractor:
    def __init__(self, model_name='resnet50'):
        # Tải mô hình pre-trained từ thư viện timm
        # `pretrained=True` để dùng các trọng số đã được huấn luyện trên ImageNet
        # `num_classes=0` để loại bỏ lớp phân loại cuối cùng, chỉ lấy feature
        self.model = timm.create_model(model_name, pretrained=True, num_classes=0)
        self.model.eval()  # Chuyển mô hình sang chế độ đánh giá (không training)

        # Lấy thông tin cấu hình của mô hình để biết cách xử lý ảnh đầu vào
        data_config = timm.data.resolve_data_config(self.model.pretrained_cfg)
        self.transform = timm.data.create_transform(**data_config, is_training=False)

    def _load_image_from_url(self, url: str) -> Image.Image:
        """Tải ảnh từ URL"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGB")
            return image
        except Exception as e:
            print(f"Error loading image from URL {url}: {e}")
            raise

    def _load_image_from_upload(self, file: BytesIO) -> Image.Image:
        """Tải ảnh từ file upload"""
        try:
            image = Image.open(file).convert("RGB")
            return image
        except Exception as e:
            print(f"Error loading image from upload: {e}")
            raise

    def extract(self, image_source: str | BytesIO) -> list[float]:
        """
        Trích xuất vector đặc trưng từ ảnh.
        Ảnh có thể là URL (string) hoặc file upload (BytesIO).
        """
        if isinstance(image_source, str):
            image = self._load_image_from_url(image_source)
        else:
            image = self._load_image_from_upload(image_source)

        # Áp dụng các phép biến đổi cần thiết (resize, normalize,...)
        input_tensor = self.transform(image).unsqueeze(0)

        # Không cần tính gradient, giúp tăng tốc độ và tiết kiệm bộ nhớ
        with torch.no_grad():
            # Đưa ảnh qua mô hình để lấy vector
            feature_vector = self.model(input_tensor)

        # Chuyển tensor về dạng list số thực và trả về
        return feature_vector.squeeze().numpy().tolist()

# Tạo một instance duy nhất để tái sử dụng trong toàn bộ ứng dụng
feature_extractor = FeatureExtractor()
