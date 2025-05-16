
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

## Cấu hình

Các cấu hình được lưu trong file `.env`:

- `PORT`: Cổng server (mặc định: 3000)
- `EPHE_PATH`: Đường dẫn đến file ephemeris (mặc định: './ephe')

## Yêu cầu
- Node.js
- Swiss Ephemeris files (đã được bao gồm trong thư mục ephe/)
