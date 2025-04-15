// src/services/archiveService.js
// This is a mock service that simulates API calls to a backend server
// In a real application, you would replace these functions with actual API calls

// Mock data for testing
const mockDocuments = [
    {
      id: '1',
      documentNumber: '2023/123',
      title: 'طلب تأشيرة للعاملين الأجانب',
      entity: 'وزارة الداخلية',
      documentType: 'وارد',
      project: 'فيزا إلكترونية',
      date: '2023-04-01',
      subject: 'طلب الموافقة على إصدار تأشيرات للفريق الفني الخارجي للعمل على مشروع الفيزا الإلكترونية',
      copiedTo: ['إدارة تقنية المعلومات'],
      notes: 'يجب الرد في أقرب وقت ممكن'
    },
    {
      id: '2',
      documentNumber: '2023/456',
      title: 'تقرير سير العمل في مشروع الجوازات',
      entity: 'وزارة الخارجية',
      documentType: 'صادر',
      project: 'جوازات إلكترونية',
      date: '2023-04-05',
      subject: 'تقرير شهري عن سير العمل في مشروع الجوازات الإلكترونية والإنجازات المتحققة خلال شهر مارس 2023',
      copiedTo: [],
      notes: ''
    },
    {
      id: '3',
      documentNumber: '2023/789',
      title: 'الرد على طلب تأشيرة',
      entity: 'وزارة الداخلية',
      documentType: 'إجابة على وارد',
      project: 'فيزا إلكترونية',
      date: '2023-04-10',
      subject: 'الموافقة على طلب إصدار تأشيرات للفريق الفني الخارجي',
      copiedTo: ['إدارة تقنية المعلومات'],
      notes: '',
      referencedDocumentId: '1'
    },
    {
      id: '4',
      documentNumber: '2023/321',
      title: 'تأكيد استلام تقرير',
      entity: 'وزارة الخارجية',
      documentType: 'تأكيد صادر',
      project: 'جوازات إلكترونية',
      date: '2023-04-12',
      subject: 'تأكيد استلام التقرير الشهري لمشروع الجوازات الإلكترونية',
      copiedTo: [],
      notes: '',
      referencedDocumentId: '2'
    },
    {
      id: '5',
      documentNumber: '2023/654',
      title: 'طلب صيانة البوابات الإلكترونية',
      entity: 'جهة خارجية',
      documentType: 'وارد',
      project: 'البوابات الإلكترونية',
      date: '2023-04-15',
      subject: 'طلب إجراء صيانة دورية للبوابات الإلكترونية في المنفذ الشمالي',
      copiedTo: ['إدارة تقنية المعلومات'],
      notes: 'عاجل - خلال أسبوع'
    }
  ];
  
  // Simulate API delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Fetch all documents
  export const fetchDocuments = async () => {
    await delay(800); // Simulate network delay
    return [...mockDocuments]; // Return a copy to avoid mutations
  };
  
  // Add a new document
  export const addDocument = async (document) => {
    await delay(500);
    
    const newDocument = {
      ...document,
      id: Math.random().toString(36).substr(2, 9) // Generate a random ID
    };
    
    mockDocuments.push(newDocument);
    return newDocument;
  };
  
  // Update an existing document
  export const updateDocument = async (document) => {
    await delay(500);
    
    const index = mockDocuments.findIndex(doc => doc.id === document.id);
    if (index === -1) {
      throw new Error('Document not found');
    }
    
    mockDocuments[index] = document;
    return document;
  };
  
  // Delete a document
  export const deleteDocument = async (id) => {
    await delay(500);
    
    const index = mockDocuments.findIndex(doc => doc.id === id);
    if (index === -1) {
      throw new Error('Document not found');
    }
    
    mockDocuments.splice(index, 1);
    return { success: true };
  };
  
  // Get document history (mock)
  export const getDocumentHistory = async (id) => {
    await delay(300);
    
    // This would normally come from the server
    return [
      { action: 'إنشاء', user: 'أحمد محمد', timestamp: '2023-04-10 09:32', comments: 'تم إنشاء الكتاب' },
      { action: 'عرض', user: 'فاطمة أحمد', timestamp: '2023-04-10 11:45', comments: null },
      { action: 'تعديل', user: 'محمد علي', timestamp: '2023-04-11 14:20', comments: 'تم تعديل عنوان الكتاب' },
    ];
  };