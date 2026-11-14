"""Create a non-payment QR fixture; never contains a payment payload."""

from pathlib import Path
from xml.etree import ElementTree

from reportlab.graphics import renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing


def createPreviewQr():
  qrWidget = QrCodeWidget("RYLVA-GREEN-PREVIEW-NOT-A-PAYMENT")
  bounds = qrWidget.getBounds()
  drawing = Drawing(
    188,
    188,
    transform=[
      188 / (bounds[2] - bounds[0]), 0,
      0, 188 / (bounds[3] - bounds[1]),
      0, 0
    ]
  )
  drawing.add(qrWidget)
  svgRoot = ElementTree.fromstring(renderSVG.drawToString(drawing))
  ElementTree.indent(svgRoot, space="  ")
  outputPath = Path(__file__).resolve().parents[2] / "public/assets/images/payment/preview-qr.svg"
  outputPath.parent.mkdir(parents=True, exist_ok=True)
  ElementTree.ElementTree(svgRoot).write(outputPath, encoding="utf-8", xml_declaration=True)


if __name__ == "__main__":
  createPreviewQr()
