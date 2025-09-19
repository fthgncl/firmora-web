let isReportingEnabled = localStorage.getItem('reportingEnabled') === 'true';  // localStorage'dan durumu al

const reportWebVitals = () => {
    if (isReportingEnabled) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {

            // Performans metriklerini tek bir objede topluyoruz
            const performanceMetrics = {};

            getCLS((metric) => {
                performanceMetrics.CLS = metric;
            });

            getFID((metric) => {
                performanceMetrics.FID = metric;
            });

            getFCP((metric) => {
                performanceMetrics.FCP = metric;
            });

            getLCP((metric) => {
                performanceMetrics.LCP = metric;
            });

            getTTFB((metric) => {
                performanceMetrics.TTFB = metric;

                // Tüm metrikler toplandıktan sonra objeyi konsola yazdırıyoruz
                console.log('Performance Metrics:', performanceMetrics);
            });

        });
    }
};

// Komutları konsolda kontrol edebilmek için
const enableReporting = () => {
    isReportingEnabled = true;
    localStorage.setItem('reportingEnabled', 'true');  // Durumu localStorage'a kaydet
    console.log('Performance reporting is enabled.');
};

const disableReporting = () => {
    isReportingEnabled = false;
    localStorage.setItem('reportingEnabled', 'false');  // Durumu localStorage'a kaydet
    console.log('Performance reporting is disabled.');
};

// Örnek: Konsolda kontrol etmek için
window.enablePerformanceReporting = enableReporting;
window.disablePerformanceReporting = disableReporting;

export default reportWebVitals;
