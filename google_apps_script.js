// 這是 Google Apps Script 的程式碼
// 請將此程式碼複製到 Google 試算表的「擴充功能」>「Apps Script」中

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // 取得鎖定以避免並發寫入衝突
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // 1. 設定試算表資訊
    // 注意：這行會自動抓取當前綁定的試算表，所以不用硬把 ID 寫死，方便你複製使用
    const ss = SpreadsheetApp.getActiveSpreadsheet(); 
    const sheet = ss.getSheetByName('記帳資料'); // 確保你的工作表名稱真的是「記帳資料」

    if (!sheet) {
      throw new Error('找不到名為「記帳資料」的工作表');
    }

    // 2. 處理 POST 請求 (新增資料)
    if (e.postData) {
      const data = JSON.parse(e.postData.contents);
      
      // 準備要寫入的資料列 
      // 欄位順序必須與你的 Google Sheet 一致：
      // 日期 | 分類 | 內容 | 金額 | 專案 | 備註
      const rowData = [
        "'" + data.date, // 加單引號強制視為字串，避免日期格式跑掉
        data.category,
        data.content,
        data.amount,
        data.project,
        data.note
      ];

      sheet.appendRow(rowData);
      
      // 回傳成功訊息
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success', 
        message: '資料已成功儲存',
        data: rowData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. 處理 GET 請求 (讀取資料 - 雖然你目前用 API Key，但這個也可以當備用)
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success', 
      data: data
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 錯誤處理
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error', 
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    lock.releaseLock();
  }
}
