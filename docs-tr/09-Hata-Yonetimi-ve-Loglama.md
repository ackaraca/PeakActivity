# Hata Yönetimi ve Loglama

PeakActivity, güvenilir hizmet sunumu için kapsamlı hata yönetimi ve merkezi loglama sistemi kullanır.

## Hata Kategorilendirmesi ve Yönetimi

### Hata Seviyeleri
```typescript
enum ErrorLevel {
  TRACE = 'trace',
  DEBUG = 'debug', 
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

enum ErrorCategory {
  AUTHENTICATION = 'auth',
  AUTHORIZATION = 'authz',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business',
  EXTERNAL_SERVICE = 'external',
  INFRASTRUCTURE = 'infrastructure',
  UNKNOWN = 'unknown'
}
```

### Merkezi Hata İşleme Sistemi
```typescript
class ErrorHandler {
  private logger: Logger
  private alertService: AlertService
  private metricsCollector: MetricsCollector
  
  async handleError(error: Error, context: ErrorContext): Promise<void> {
    const errorInfo = this.analyzeError(error, context)
    
    // Log kaydı
    await this.logger.log(errorInfo.level, {
      message: error.message,
      stack: error.stack,
      context: context,
      category: errorInfo.category,
      userId: context.userId,
      requestId: context.requestId,
      timestamp: new Date().toISOString()
    })
    
    // Metrik toplama
    this.metricsCollector.incrementErrorCounter(errorInfo.category)
    
    // Kritik hatalar için alarm
    if (errorInfo.level === ErrorLevel.FATAL) {
      await this.alertService.sendCriticalAlert(errorInfo)
    }
    
    // Kullanıcı dostu mesaj
    const userMessage = this.generateUserFriendlyMessage(errorInfo)
    context.response?.status(errorInfo.httpStatus).json({
      ...existing code...
    })
  }
}
```
