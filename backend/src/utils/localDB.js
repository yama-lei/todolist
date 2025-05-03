const { localDb } = require('../config/database');

// 由于nedb-promises已经提供了Promise API，
// 我们只需要简单包装一下以保持接口一致

// 通用数据库操作封装
class LocalDBUtils {
  constructor(collection) {
    this.db = localDb[collection];
    if (!this.db) {
      throw new Error(`集合 ${collection} 不存在`);
    }
  }

  // 查找单条记录
  findOne(query) {
    return new Promise((resolve, reject) => {
      this.db.findOne(query, (err, doc) => {
        if (err) {
          return reject(err);
        }
        resolve(doc);
      });
    });
  }

  // 查找多条记录
  find(query = {}, sort = {}) {
    return new Promise((resolve, reject) => {
      this.db.find(query).sort(sort).exec((err, docs) => {
        if (err) {
          return reject(err);
        }
        resolve(docs);
      });
    });
  }

  // 插入记录
  insert(doc) {
    return new Promise((resolve, reject) => {
      this.db.insert(doc, (err, newDoc) => {
        if (err) {
          return reject(err);
        }
        resolve(newDoc);
      });
    });
  }

  // 更新记录
  update(query, update, options = {}) {
    return new Promise((resolve, reject) => {
      this.db.update(query, update, options, (err, numAffected) => {
        if (err) {
          return reject(err);
        }
        resolve(numAffected);
      });
    });
  }

  // 删除记录
  remove(query, options = {}) {
    return new Promise((resolve, reject) => {
      this.db.remove(query, options, (err, numRemoved) => {
        if (err) {
          return reject(err);
        }
        resolve(numRemoved);
      });
    });
  }

  // 计数
  count(query = {}) {
    return new Promise((resolve, reject) => {
      this.db.count(query, (err, count) => {
        if (err) {
          return reject(err);
        }
        resolve(count);
      });
    });
  }
}

// 导出具体的集合工具类
module.exports = {
  Users: localDb.users,
  Tasks: localDb.tasks,
  Plants: localDb.plants,
  PlantThoughts: localDb.plantThoughts,
  Conversations: localDb.conversations,
  Posts: localDb.posts,
  SystemTasks: localDb.systemTasks,
  UserSystemTasks: localDb.userSystemTasks
}; 