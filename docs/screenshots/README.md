# Postman Test Ekranları

10 Kasım 2026 tarihinde Postman masaüstü uygulamasında çalıştırılan isteklerin
ekran görüntüleri. `TaskFlow - Teslim Testleri` koleksiyonundaki 6 isteğin
12 kontrolü de başarılıdır.

Test akışında `Duvarı onar` başlıklı, `id: 5` olan görev oluşturulmuş,
listelenmiş, detayları görüntülenmiş, durumu `completed` olarak güncellenmiş
ve silinmiştir. Silme işleminden sonra aynı görev için beklenen 404 yanıtı
alınmıştır. Mevcut diğer görevler bu test akışında silinmemiştir.

| İşlem | HTTP metodu ve endpoint | Sonuç | Testler | Görüntü |
| --- | --- | --- | --- | --- |
| Görev oluşturma | `POST /tasks` | 201 Created | 2/2 | [01 - Görev ekle](01-gorev-ekle.jpg) |
| Görev listeleme | `GET /tasks` | 200 OK | 2/2 | [02 - Görevleri listele](02-gorev-listele.jpg) |
| Listede yeni görevin görünmesi | Aynı listeleme yanıtının devamı | 200 OK | 2/2 | [02b - Liste devamı](02b-gorev-listesi-devami.jpg) |
| Görev detayı | `GET /tasks/5` | 200 OK | 2/2 | [03 - Görev detayı](03-gorev-detay.jpg) |
| Görev güncelleme | `PUT /tasks/5` | 200 OK | 2/2 | [04 - Görev güncelle](04-gorev-guncelle.jpg) |
| Görev silme | `DELETE /tasks/5` | 204 No Content | 2/2 | [05 - Görev sil](05-gorev-sil.jpg) |
| Silmeyi doğrulama | `GET /tasks/5` | 404 Not Found | 2/2 | [06 - Silinen görevi doğrula](06-silinen-gorevi-dogrula.jpg) |

Son istekteki 404, silinen görevin artık bulunamadığını doğrulayan beklenen
sonuçtur. Başarılı silme yanıtının (204) gövdesi boştur.

## İstekleri yeniden çalıştırma

1. API'yi `npm.cmd start` ile başlatın.
2. [Teslim koleksiyonunu](../../postman/TaskFlow-Sunum.postman_collection.json)
   Postman'a içe aktarın.
3. `baseUrl` koleksiyon değişkenini `http://localhost:3000` olarak kullanın.
4. İstekleri 01'den 06'ya doğru sırayla çalıştırın.

İlk istek, oluşturulan görevin kimliğini `taskId` koleksiyon değişkenine yazar.
Bu değişken URL'de kullanılır; API yanıtındaki alanın adı `id`'dir. Yeniden
çalıştırmada görev kimliği 5 olmak zorunda değildir; sunucu yeni numara verir.

Ekran görüntülerindeki değişkenli adresler sırasıyla
`{{baseUrl}}/tasks` ve `{{baseUrl}}/tasks/{{taskId}}` biçimindedir.
