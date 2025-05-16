
# Vedic Astrology API Server

API server cung cấp các tính toán chiêm tinh Vedic sử dụng Swiss Ephemeris.

## Cài đặt

```bash
# Clone repository
git clone <url>

# Cài đặt dependencies
npm install

# Khởi động server
npm start
```

## Triển khai lên Render

Để triển khai lên Render:

1. Tạo tài khoản trên [Render](https://render.com/)
2. Từ dashboard, chọn "New" và "Web Service"
3. Kết nối repository của bạn
4. Cấu hình dịch vụ với:
   - Name: vedic-astrology-api
   - Region: Chọn region gần với người dùng
   - Branch: main
   - Build Command: npm install
   - Start Command: npm start
5. Cấu hình các biến môi trường:
   - PORT: 10000 
   - EPHE_PATH: ./ephe
   - NODE_ENV: production
6. Nhấn "Create Web Service"

## API Endpoints

### Tạo biểu đồ chiêm tinh đầy đủ
`POST /api/chart`

Yêu cầu:
```json
{
  "date": "1990-01-01",
  "time": "12:00",
  "latitude": 21.0278,
  "longitude": 105.8342,
  "timezone": "Asia/Ho_Chi_Minh"
}
```

### Lấy vị trí các hành tinh
`POST /api/planets`

Yêu cầu:
```json
{
  "date": "1990-01-01",
  "time": "12:00",
  "latitude": 21.0278,
  "longitude": 105.8342,
  "timezone": "Asia/Ho_Chi_Minh"
}
```

### Lấy thông tin Ascendant (Lagna)
`POST /api/ascendant`

Yêu cầu:
```json
{
  "date": "1990-01-01",
  "time": "12:00",
  "latitude": 21.0278,
  "longitude": 105.8342,
  "timezone": "Asia/Ho_Chi_Minh"
}
```

### Lấy thông tin Dasha
`POST /api/dashas`

Yêu cầu:
```json
{
  "date": "1990-01-01",
  "time": "12:00",
  "latitude": 21.0278,
  "longitude": 105.8342,
  "timezone": "Asia/Ho_Chi_Minh"
}
```

## Kiểm tra API sau khi triển khai

Sau khi triển khai, bạn có thể kiểm tra API bằng cách gửi request đến URL của Render:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "date": "1990-01-01",
  "time": "12:00",
  "latitude": 21.0278,
  "longitude": 105.8342,
  "timezone": "Asia/Ho_Chi_Minh"
}' https://vedic-astrology-api.onrender.com/api/chart
```

## Cấu hình

Các cấu hình được lưu trong file `.env`:

- `PORT`: Cổng server (mặc định: 10000)
- `EPHE_PATH`: Đường dẫn đến file ephemeris (mặc định: './ephe')
- `NODE_ENV`: Môi trường triển khai (development/production)

## Yêu cầu
- Node.js
- Swiss Ephemeris files (đã được bao gồm trong thư mục ephe/)

