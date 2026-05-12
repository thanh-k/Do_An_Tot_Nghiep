from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO

from feature_extractor import feature_extractor
from vector_store import vector_store

app = FastAPI(
    title="NovaShop Vision Service",
    description="API để tìm kiếm sản phẩm bằng hình ảnh",
    version="1.0.0"
)
# Thêm đoạn cấu hình CORS này vào ngay dưới phần khai báo app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Cấp quyền cho React Frontend gọi API
    allow_credentials=True,
    allow_methods=["*"], # Cho phép tất cả method (GET, POST,...)
    allow_headers=["*"], # Cho phép tất cả headers
)

@app.post("/search")
async def search_by_image(
    file: UploadFile = File(...),
    k: int = Form(default=10, ge=1, le=50)
):
    """
    Endpoint chính cho người dùng: upload ảnh và tìm kiếm sản phẩm.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image.")
    
    try:
        contents = await file.read()
        # Trích xuất vector từ ảnh upload
        query_vector = feature_extractor.extract(BytesIO(contents))
        
        # Tìm kiếm trong vector store
        product_ids = vector_store.search(query_vector, k=k)
        
        return JSONResponse(content={
            "message": f"Found {len(product_ids)} similar products.",
            "product_ids": product_ids
        })
    except Exception as e:
        print(f"Error during search: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@app.post("/index")
async def add_to_index(
    product_id: int = Form(...),
    image_url: str = Form(...)
):
    """
    Endpoint cho Backend Java gọi: Thêm/cập nhật vector cho sản phẩm.
    """
    try:
        # Trích xuất vector từ URL ảnh
        vector = feature_extractor.extract(image_url)
        
        # Thêm vào vector store
        vector_store.add(product_id, vector)
        
        return {"message": f"Product {product_id} indexed successfully."}
    except Exception as e:
        print(f"Error during indexing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to index product {product_id}: {e}")


@app.delete("/index/{product_id}")
async def remove_from_index(product_id: int):
    """
    Endpoint cho Backend Java gọi: Xóa vector của sản phẩm.
    """
    try:
        vector_store.remove(product_id)
        return {"message": f"Product {product_id} removed from index."}
    except Exception as e:
        print(f"Error during removal: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove product {product_id}: {e}")

# Chạy server: uvicorn main:app --reload --port 8001
if __name__ == "__main__":
    import uvicorn
    # Chạy trên port 8001 để tránh xung đột với backend Java (8080) và frontend (5173)
    uvicorn.run(app, host="0.0.0.0", port=8001)
