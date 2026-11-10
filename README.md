# TaskFlow

Node.js ve Express ile geliştirilmiş görev yönetimi REST API'si. Görev oluşturma,
listeleme, detay görüntüleme, güncelleme ve silme işlemlerini destekler.
Her HTTP isteğinin metodu, adresi ve zamanı konsola kaydedilir.

## Kurulum ve çalıştırma

Gereksinim: Node.js 22 veya üzeri ve beraberinde gelen npm.

1. GitHub reposunu indirin veya klonlayın; terminalde proje klasörünü açın.
2. Bağımlılıkları kurun:

   ```powershell
   npm.cmd ci
   ```

3. Sunucuyu başlatın:

   ```powershell
   npm.cmd start
   ```

4. Tarayıcıda `http://localhost:3000` adresini açın. API'nin çalıştığını belirten
   JSON yanıtını görmelisiniz. Görev listesi: `http://localhost:3000/tasks`.

Windows PowerShell'de imza hatası yaşamamak için komutlar `npm.cmd` ile yazılmıştır.
macOS/Linux'ta ve uygun Windows terminallerinde `npm` kullanabilirsiniz.
Sunucuyu kapatmak için terminalde `Ctrl+C` tuşlarına basın.

Kod değiştiğinde sunucunun otomatik yeniden başlaması için:

```powershell
npm.cmd run dev
```

Portu değiştirmek için PowerShell'de:

```powershell
$env:PORT = '3001'
npm.cmd start
```

Bu durumda Postman koleksiyonundaki `baseUrl` değişkenini de güncelleyin.

## Veri saklama

İlk çalıştırmada `data/tasks.json` otomatik oluşturulur. Başlangıçta görev listesi
boştur. Görevler dosyaya kaydedilir; sunucu yeniden başladığında korunur.
Yerel görev verileri Git'e dahil edilmez. Dosya bozulursa sunucu hata verir;
mevcut verinin üzerine boş bir liste yazmaz.

Görev kimlikleri `1, 2, 3` şeklinde artan sayılardır. Son kullanılan kimlik
`data/task-counter.json` dosyasında tutulur. Böylece görevler silinse veya sunucu
yeniden başlasa da eski kimlikler tekrar kullanılmaz.

Bu ödev sürümü yerel kullanım ve tek Node.js süreci içindir. Küçük JSON dosyası
senkron okunup yazılır. Çok kullanıcılı, yüksek trafikli veya birden fazla sunucu
süreciyle çalışan bir sistem için veritabanına geçilmelidir. Sunucu yalnızca
yerel bilgisayardan erişilebilen `127.0.0.1` adresini dinler.

## Endpoint'ler

| Metot | Adres | İşlem | Başarılı durum kodu |
| --- | --- | --- | --- |
| GET | `/` | API çalışıyor yanıtı | 200 |
| POST | `/tasks` | Görev oluştur | 201 |
| GET | `/tasks` | Tüm görevleri listele | 200 |
| GET | `/tasks/:id` | Görev detayını getir | 200 |
| PUT | `/tasks/:id` | Gönderilen alanları güncelle | 200 |
| DELETE | `/tasks/:id` | Görevi sil | 204 |

`:id` yerine oluşturma yanıtında dönen gerçek `id` değerini yazın.
Silme başarılı olduğunda yanıt gövdesi boştur.

### Görev modeli

| Alan | Açıklama |
| --- | --- |
| `id` | Sunucunun ürettiği artan tam sayı (1, 2, 3...); değiştirilemez |
| `title` | Zorunlu, boş olmayan metin |
| `description` | Açıklama; varsayılan boş metin |
| `status` | `pending`, `in_progress`, `completed`; varsayılan `pending` |
| `priority` | `low`, `medium`, `high`; varsayılan `medium` |
| `assignee` | Görevi üstlenen kişinin adı; varsayılan boş metin |
| `createdAt` | Oluşturulma zamanı (UTC ISO 8601); değiştirilemez |
| `updatedAt` | Son güncellenme zamanı (UTC ISO 8601); sunucu yönetir |

Kişiler `assignee` alanında adlarıyla temsil edilir; ayrı bir kullanıcı kaydı gerekmez.
Yönergenin zorunlu kapsamı görev CRUD işlemleridir; ayrı bir proje CRUD modülü yoktur.

### Görev oluşturma

`POST http://localhost:3000/tasks` isteğinde `Content-Type: application/json` kullanın:

```json
{
  "title": "Backend ödevini tamamla",
  "description": "CRUD endpoint'lerini geliştir ve Postman ile test et.",
  "priority": "high",
  "assignee": "Ayşe"
}
```

Yanıt `201 Created` olur. `id`, tarihler ve varsayılan `status` yanıt nesnesine eklenir.

### Görev güncelleme

`PUT http://localhost:3000/tasks/GERCEK_GOREV_ID`:

```json
{
  "status": "completed"
}
```

Bu API'de PUT yalnızca gönderilen alanları değiştirir; diğer alanlar korunur.
En az bir düzenlenebilir alan gönderilmelidir. Metinlerin başındaki ve sonundaki
boşluklar temizlenir. Tanımsız alanlar ve sunucunun yönettiği alanlar kabul edilmez.

### Hata yanıtları

Hatalar `{ "message": "Açıklama" }` biçimindedir.

- `400`: Eksik/geçersiz alan, boş güncelleme veya bozuk JSON.
- `404`: Görev ya da endpoint bulunamadı.
- `413`: JSON istek gövdesi 100 KB sınırını aştı.
- `500`: Beklenmeyen sunucu veya dosya hatası; ayrıntılar terminale yazılır.

## Klasör yapısı ve istek akışı

```text
src/
  server.js                   Sunucuyu başlatır
  app.js                      Express ve middleware sırasını kurar
  routes/taskRoutes.js        URL ve HTTP metodunu controller'a bağlar
  controllers/taskController.js  İsteği işler, HTTP yanıtını gönderir
  models/taskStore.js         JSON dosyasını okur ve yazar
  utils/validateTask.js        Görev alanlarını kontrol eder
  middleware/logger.js        Method, endpoint ve zamanı kaydeder
  middleware/errorHandler.js  Hataları JSON yanıtına dönüştürür
data/                         Yerel görev dosyası
test/tasks.test.js            Otomatik API testleri
postman/                      İçe aktarılabilir Postman koleksiyonu
docs/                         Proje tanıtımı ve test rehberi
```

Örneğin görev eklerken istek önce logger'dan, sonra JSON ayrıştırıcısından geçer.
Router `POST /tasks` isteğini controller'a gönderir. Controller alanları kontrol
eder; store görevi dosyaya kaydeder. Controller da oluşturulan görevi JSON olarak döndürür.

Kodu incelerken önce `server.js`, ardından `app.js`, route, controller ve store
dosyalarını okuyabilirsiniz. `createTaskStore(filePath)` ilgili veri dosyasını
kullanan görev fonksiyonlarını döndürür. Böylece testler kendi geçici dosyalarında
çalışırken normal uygulama `data/tasks.json` dosyasını kullanır.

## Test ve teslim

Otomatik testleri çalıştırın; sunucunun açık olması gerekmez:

```powershell
npm.cmd test
```

Testler geçici dosyalar ve rastgele yerel portlar kullanır; kendi görevlerinizi değiştirmez.

Postman için [teslim koleksiyonunu](postman/TaskFlow-Sunum.postman_collection.json)
içe aktarın ve istekleri 01'den 06'ya doğru çalıştırın. Koleksiyondaki 6 istek,
Postman masaüstü uygulamasında test edilmiştir; 12 kontrolün tamamı başarılıdır.
Sonuçlar ve gerçek ekran görüntüleri [Postman test ekranlarında](docs/screenshots/README.md)
yer alır.

Teslim için [proje tanıtımı](docs/PROJE_TANITIMI.txt), bu README, kaynak kodlar ve
Postman ekran görüntüleri aynı GitHub reposunda yer almalıdır.
Ekran görüntülerinin konumu: `docs/screenshots/`.

İsteğe bağlı filtreleme, arama, sayfalama ve raporlama bu sürümde eklenmemiştir.

Teknik kaynaklar: [Express kurulumu](https://expressjs.com/en/starter/installing/)
ve [Express hata yönetimi](https://expressjs.com/en/guide/error-handling/).
