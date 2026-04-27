# Deploy ERP to 172.17.3.152 (Docker)

App path trên server: `/home/sghg/erp_nguyenhq/`
DB password prod: `Skg@2026`
Dev DB hiện tại (nguồn dump): `postgresql://postgres:postgres@172.17.3.23:5432/erp_db`

## 1. Máy dev — dump DB hiện tại (PowerShell)

```powershell
$env:PGPASSWORD="postgres"
pg_dump -Fc -h 172.17.3.23 -U postgres -d erp_db -f erp_db.dump
Remove-Item Env:PGPASSWORD
ls erp_db.dump     # kiểm tra có file
```

Nếu máy dev không có `pg_dump`: SSH vào 23 (user `germany`/`Skg@2026`) dump local rồi scp về máy dev.

## 2. Máy dev — đóng gói code (PowerShell, trong thư mục repo)

```powershell
cd C:\Users\nguye\OneDrive\00.Working\02.Projects\05.ERP
Remove-Item erp-code.tar.gz -ErrorAction SilentlyContinue
tar --exclude=node_modules --exclude=dist --exclude=.git --exclude=.env --exclude=.env.local --exclude=supabase --exclude=erp-code.tar.gz -czf erp-code.tar.gz .
ls erp-code.tar.gz
```

## 3. Máy dev — dọn server cũ + upload

```powershell
# Dọn tàn dư các lần thử trước
ssh sghg@172.17.3.152 "sudo chmod -R u+w /opt/erp-nguyenhq ~/erp-nguyenhq ~/erp_nguyenhq 2>/dev/null; sudo rm -rf /opt/erp-nguyenhq ~/erp-nguyenhq ~/erp_nguyenhq; mkdir -p ~/erp_nguyenhq"

# Upload
scp erp-code.tar.gz sghg@172.17.3.152:/home/sghg/erp_nguyenhq/
scp erp_db.dump     sghg@172.17.3.152:/home/sghg/erp_nguyenhq/
```

## 4. Server — extract code

```powershell
ssh sghg@172.17.3.152
```

```bash
cd ~/erp_nguyenhq
tar --no-same-permissions --no-same-owner -xzf erp-code.tar.gz
chmod -R u+rwX .
rm erp-code.tar.gz
ls -la
```

## 5. Server — tạo .env

```bash
cd ~/erp_nguyenhq
cp .env.production.example .env
JWT=$(openssl rand -hex 32)
sed -i "s|change-me-strong-password|Skg@2026|" .env
sed -i "s|replace-with-random-64-char-hex|$JWT|" .env
cat .env
```

## 6. Server — khởi động Postgres + restore data

```bash
cd ~/erp_nguyenhq
docker compose up -d postgres

# Đợi postgres healthy
sleep 10
docker compose ps

# Restore dump
docker cp erp_db.dump erp-postgres:/tmp/r.dump
docker exec erp-postgres pg_restore -U erp -d erp_db --clean --if-exists /tmp/r.dump
# Cảnh báo "role postgres does not exist" có thể bỏ qua — dump từ user postgres nhưng restore vào user erp.
```

## 7. Server — build & chạy api/web

```bash
cd ~/erp_nguyenhq
docker compose up -d --build
docker compose ps       # tất cả phải (healthy)/Up
docker compose logs -f api | head -30
```

## 8. Kiểm tra

```bash
curl -i http://localhost/              # trả về index.html
curl -i http://localhost/api/health    # {"ok":true}
```

Mở trình duyệt: **http://172.17.3.152** → đăng nhập.

## 9. Auto-start sau reboot (systemd)

```bash
sudo cp ~/erp_nguyenhq/scripts/erp.service /etc/systemd/system/erp.service
# Sửa WorkingDirectory trong unit file
sudo sed -i 's|/opt/erp|/home/sghg/erp_nguyenhq|' /etc/systemd/system/erp.service
sudo systemctl daemon-reload
sudo systemctl enable erp.service
```

## 10. Backup DB định kỳ (cron)

```bash
chmod +x ~/erp_nguyenhq/scripts/backup-db.sh
# Sửa đường dẫn trong script
sed -i 's|/opt/erp|/home/sghg/erp_nguyenhq|g' ~/erp_nguyenhq/scripts/backup-db.sh
mkdir -p ~/erp_nguyenhq/backups
( crontab -l 2>/dev/null; echo "0 2 * * * /home/sghg/erp_nguyenhq/scripts/backup-db.sh >> /home/sghg/erp_nguyenhq/backup.log 2>&1" ) | crontab -
crontab -l
```

## Cập nhật code sau này

```powershell
# Máy dev
cd C:\Users\nguye\OneDrive\00.Working\02.Projects\05.ERP
tar --exclude=node_modules --exclude=dist --exclude=.git --exclude=.env --exclude=.env.local --exclude=supabase --exclude=erp-code.tar.gz -czf erp-code.tar.gz .
scp erp-code.tar.gz sghg@172.17.3.152:/home/sghg/erp_nguyenhq/
```

```bash
# Server
ssh sghg@172.17.3.152
cd ~/erp_nguyenhq
tar --no-same-permissions --no-same-owner --overwrite -xzf erp-code.tar.gz
chmod -R u+rwX .
rm erp-code.tar.gz
docker compose up -d --build api web
```

## Ghi chú

- Port 80 public; Postgres chỉ bind `127.0.0.1:5432`.
- Mở firewall 80 inbound nếu có ufw: `sudo ufw allow 80/tcp`.
- Restore từ backup: xem mục 7 trong README cũ hoặc `DEPLOY.md` mục 10.
