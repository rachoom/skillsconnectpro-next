export const ThemeDetailOverrides = () => (
  <style>{`
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='modalBackdrop'] {
      background: rgba(7, 19, 14, .72) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='modalImage'],
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='imageButton'] {
      background: #173827 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='modalBody'],
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='cardBody'],
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='cardActions'],
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='modalTitleRow'],
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='modalReputation'] {
      background: transparent !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='modalCta'] {
      border-color: #d39f00 !important;
      background: #f5c518 !important;
      color: #171006 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='closeButton'] {
      border-color: rgba(23, 32, 25, .18) !important;
      background: rgba(255, 253, 247, .92) !important;
      color: #172019 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='tradeCard'],
    html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='tradeCard'] * {
      color: #f5f0e3;
    }

    html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='tradeContent'] > span {
      color: #171006 !important;
    }
  `}</style>
);
