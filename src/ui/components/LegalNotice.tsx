/** The independence notice required on every page (see /docs/legal.md). */
export function LegalNotice({ className = '' }: { className?: string }) {
  return (
    <p className={className} data-testid="legal-notice">
      <strong>Proyecto independiente y no afiliado, patrocinado ni respaldado por CASIO Computer Co., Ltd.</strong> CASIO y los nombres de sus productos son
      marcas de sus respectivos propietarios. <span lang="en">(Independent project, not affiliated with, sponsored by, or endorsed by CASIO Computer Co., Ltd.)</span>
    </p>
  )
}
