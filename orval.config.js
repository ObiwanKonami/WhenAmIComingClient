// orval.config.js (API VE HOOKS İÇİN AYRI JOBS - EN SAĞLAM YÖNTEM)
const { defineConfig } = require('orval');

module.exports = defineConfig({
  // BİRİNCİ GÖREV: SADECE API FONKSİYONLARINI (AXIOS) ÜRETİR
  api: {
    input: {
      target: 'http://localhost:5014/swagger/v1/swagger.json',
    },
    output: {
      mode: 'tags-split', // Controller'lara göre ayrı klasörler oluştur
      target: 'lib/api/generated', // Üretilecek dosyaların ana klasörü
      schemas: 'lib/api/generated/model', // Modelleri 'model' klasörüne topla
      client: 'axios', // Bu görev SADECE axios fonksiyonları üretecek
      override: {
        mutator: {
          path: './lib/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },

  // İKİNCİ GÖREV: SADECE REACT QUERY HOOK'LARINI ÜRETİR
  hooks: {
    input: {
      target: 'http://localhost:5014/swagger/v1/swagger.json', // Aynı swagger'ı kullanır
    },
    output: {
      mode: 'tags-split', // Controller'lara göre ayrı klasörler oluştur
      target: 'hooks/generated', // Üretilecek dosyaların ana klasörü
      schemas: 'lib/api/generated/model', // API ile AYNI model klasörünü kullanır, yeniden üretmez
      client: 'react-query', // Bu görev SADECE React Query hook'ları üretecek
      override: {
        mutator: {
          path: './lib/api/axios-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});