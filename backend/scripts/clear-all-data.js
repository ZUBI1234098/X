/**
 * Скрипт для полной очистки всех данных из базы данных
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = './customers.db';

console.log('🗑️ Начинаем очистку всех данных...');

// Функция для очистки базы данных
function clearAllData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.message);
        return reject(err);
      }
      console.log('✅ Подключение к базе данных установлено');
    });

    // Список всех таблиц для очистки
    const tables = [
      'customers',
      'products', 
      'purchases',
      'returns',
      'expenses',
      'suppliers',
      'tasks',
      'product_activities'
    ];

    let completed = 0;
    const total = tables.length;

    console.log(`📊 Найдено ${total} таблиц для очистки`);

    tables.forEach(tableName => {
      db.run(`DELETE FROM ${tableName}`, function(err) {
        if (err) {
          console.error(`❌ Ошибка при очистке таблицы ${tableName}:`, err.message);
          return reject(err);
        }
        
        console.log(`✅ Таблица ${tableName} очищена (удалено ${this.changes} записей)`);
        completed++;
        
        if (completed === total) {
          console.log('🎉 Все таблицы успешно очищены!');
          
          // Сбрасываем автоинкремент для всех таблиц
          console.log('🔄 Сбрасываем автоинкремент...');
          
          const resetPromises = tables.map(tableName => {
            return new Promise((resolveReset, rejectReset) => {
              db.run(`DELETE FROM sqlite_sequence WHERE name='${tableName}'`, (err) => {
                if (err) {
                  console.error(`❌ Ошибка при сбросе автоинкремента для ${tableName}:`, err.message);
                  return rejectReset(err);
                }
                console.log(`✅ Автоинкремент для ${tableName} сброшен`);
                resolveReset();
              });
            });
          });
          
          Promise.all(resetPromises)
            .then(() => {
              console.log('🎉 Автоинкремент для всех таблиц сброшен!');
              db.close((err) => {
                if (err) {
                  console.error('❌ Ошибка при закрытии базы данных:', err.message);
                  return reject(err);
                }
                console.log('✅ Соединение с базой данных закрыто');
                resolve();
              });
            })
            .catch(reject);
        }
      });
    });
  });
}

// Функция для удаления файла базы данных (альтернативный способ)
function deleteDatabaseFile() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
        console.log('✅ Файл базы данных удален');
        resolve();
      } catch (err) {
        console.error('❌ Ошибка при удалении файла базы данных:', err.message);
        reject(err);
      }
    } else {
      console.log('ℹ️ Файл базы данных не найден');
      resolve();
    }
  });
}

// Основная функция
async function main() {
  try {
    console.log('Выберите способ очистки:');
    console.log('1. Очистить все данные (сохранить структуру таблиц)');
    console.log('2. Удалить файл базы данных полностью');
    
    // Для автоматического выполнения выберем первый вариант
    const choice = 1;
    
    if (choice === 1) {
      await clearAllData();
    } else if (choice === 2) {
      await deleteDatabaseFile();
    }
    
    console.log('\n🎉 Очистка данных завершена успешно!');
    console.log('📊 Статистика:');
    console.log('  - Все таблицы очищены');
    console.log('  - Автоинкремент сброшен');
    console.log('  - База данных готова к использованию');
    
  } catch (error) {
    console.error('❌ Ошибка при очистке данных:', error.message);
    process.exit(1);
  }
}

// Запускаем очистку
main();

